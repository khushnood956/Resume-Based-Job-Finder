import axios from 'axios';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const telegramToken = process.env.TELEGRAM_BOT_TOKEN;

// 1. Alert Message Dispatcher
export async function sendTelegramAlert(
  chatId: string,
  job: {
    title: string;
    company: string;
    location: string;
    match_score: number;
    missing_skills: string[];
    url: string;
  }
): Promise<boolean> {
  if (!telegramToken) {
    console.warn(`[Telegram Mock Mode] Would send alert to chat ${chatId} for ${job.title} at ${job.company}.`);
    return true;
  }

  const missingStr = job.missing_skills.length > 0 
    ? job.missing_skills.join(', ') 
    : 'None! Perfect match.';

  const message = `💼 *New Match: ${job.title}*
🏢 *Company:* ${job.company}
📍 *Location:* ${job.location}
⭐ *Match Score:* ${job.match_score}%

⚠️ *Missing Skills:* ${missingStr}

🔗 *Apply Here:* ${job.url}`;

  try {
    const url = `https://api.telegram.org/bot${telegramToken}/sendMessage`;
    const response = await axios.post(url, {
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown'
    });

    return response.status === 200;
  } catch (error: any) {
    console.error(`Telegram alert failed for chat ${chatId}:`, error.response?.data || error.message);
    return false;
  }
}

// 2. Self-contained Long Polling Listener to link candidate accounts
async function startTelegramBotListener() {
  if (!telegramToken) {
    console.log("TELEGRAM_BOT_TOKEN not set. Polling listener skipped.");
    return;
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Supabase config missing. Polling listener aborted.");
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  let lastUpdateId = 0;

  console.log("Telegram Account Linker Bot listener started...");

  while (true) {
    try {
      const response = await axios.get(
        `https://api.telegram.org/bot${telegramToken}/getUpdates`,
        {
          params: {
            offset: lastUpdateId + 1,
            timeout: 10
          }
        }
      );

      const updates = response.data.result || [];
      for (const update of updates) {
        lastUpdateId = update.update_id;

        const message = update.message;
        if (!message || !message.text) continue;

        const chatId = message.chat.id.toString();
        const text = message.text.trim();

        // Check for /start command with registration token
        if (text.startsWith('/start')) {
          const parts = text.split(' ');
          if (parts.length < 2) {
            await reply(chatId, "Welcome! To link your account, please use the link provided on the settings page of your job portal.");
            continue;
          }

          const encodedToken = parts[1];
          try {
            // Decode base64 to extract user ID
            const userId = Buffer.from(encodedToken, 'base64').toString('ascii');
            
            // Check if profile exists
            const { data: profile, error: profileErr } = await supabase
              .from('profiles')
              .select('id, full_name')
              .eq('id', userId)
              .maybeSingle();

            if (profileErr || !profile) {
              await reply(chatId, "❌ Link failed. Invalid or expired token link. Please check your settings page.");
              continue;
            }

            // Save chat ID to user's profile
            const { error: updateErr } = await supabase
              .from('profiles')
              .update({
                telegram_chat_id: chatId,
                notification_telegram_active: true
              })
              .eq('id', userId);

            if (updateErr) {
              await reply(chatId, "❌ Failed to link account. Database error occurred.");
            } else {
              await reply(
                chatId,
                `Assalam-o-Alaikum ${profile.full_name || 'Candidate'}! 🎉\n\nYour account has been successfully linked to Telegram!\nYou will now receive daily job matching alerts directly here.`
              );
            }

          } catch (tokenErr) {
            await reply(chatId, "❌ Error parsing token. Please check that you used the correct link.");
          }
        } else if (text === '/status') {
          // Check linking status
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, notification_telegram_active')
            .eq('telegram_chat_id', chatId)
            .maybeSingle();

          if (profile) {
            await reply(chatId, `✅ Linked to: ${profile.full_name}\nNotifications: ${profile.notification_telegram_active ? 'Active' : 'Muted'}`);
          } else {
            await reply(chatId, "❌ Account not linked. Link your account from the portal settings.");
          }
        }
      }

    } catch (err: any) {
      console.error("Error in Telegram Polling loop:", err.message);
      // Wait before retrying to prevent rapid loops
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

async function reply(chatId: string, text: string) {
  try {
    await axios.post(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
      chat_id: chatId,
      text: text
    });
  } catch (err: any) {
    console.error(`Failed to send reply to ${chatId}:`, err.message);
  }
}

// Start polling listener only if run directly as a script
if (require.main === module) {
  startTelegramBotListener();
}
