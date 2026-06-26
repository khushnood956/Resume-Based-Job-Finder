import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { sendEmailDigest, EmailJobDetails } from './resend';
import { sendTelegramAlert } from './telegram-bot';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runDispatcher() {
  console.log("Starting matching notification dispatcher loop...");

  // 1. Fetch all active candidate profiles
  const { data: users, error: userError } = await supabase
    .from('profiles')
    .select('id, email, full_name, telegram_chat_id, notification_email_active, notification_telegram_active');

  if (userError || !users) {
    console.error("Failed to query profiles:", userError?.message);
    process.exit(1);
  }

  console.log(`Analyzing matches for ${users.length} registered candidate profiles.`);

  for (const user of users) {
    try {
      // 2. Fetch matches for this user (minimum score 70)
      const { data: matches, error: matchError } = await supabase.rpc('get_job_recommendations', {
        usr_id: user.id,
        min_score: 70,
        limit_num: 10,
        offset_num: 0
      });

      if (matchError || !matches || matches.length === 0) {
        continue;
      }

      // 3. Filter out jobs that have already been sent to this user
      const { data: sentNotifications } = await supabase
        .from('notifications')
        .select('job_id')
        .eq('user_id', user.id);

      const sentJobIds = new Set(sentNotifications?.map(n => n.job_id) || []);
      const newMatches = matches.filter((job: any) => !sentJobIds.has(job.job_id));

      if (newMatches.length === 0) {
        continue;
      }

      console.log(`Found ${newMatches.length} new matches for ${user.full_name || user.email}`);

      // Map to email interface structure
      const emailJobs: EmailJobDetails[] = newMatches.map((job: any) => ({
        title: job.title,
        company: job.company,
        location: job.location,
        is_remote: job.is_remote,
        match_score: job.match_score,
        missing_skills: job.missing_skills || [],
        url: job.url
      }));

      let emailSuccess = false;
      let telegramSuccess = false;

      // 4. Send email digest if enabled
      if (user.notification_email_active && user.email) {
        emailSuccess = await sendEmailDigest(user.email, user.full_name || 'Candidate', emailJobs);
      }

      // 5. Send Telegram alert if enabled and chat is linked
      if (user.notification_telegram_active && user.telegram_chat_id) {
        // Send alert for the top matching job
        const topJob = newMatches[0];
        telegramSuccess = await sendTelegramAlert(user.telegram_chat_id, {
          title: topJob.title,
          company: topJob.company,
          location: topJob.location,
          match_score: topJob.match_score,
          missing_skills: topJob.missing_skills || [],
          url: topJob.url
        });
      }

      // 6. Record sent status in database notifications table to prevent duplicate spamming
      if (emailSuccess || telegramSuccess || (!user.notification_email_active && !user.notification_telegram_active)) {
        const recordPromises = newMatches.map((job: any) =>
          supabase.from('notifications').insert({
            user_id: user.id,
            job_id: job.job_id,
            match_score: job.match_score
          }).select()
        );
        
        await Promise.all(recordPromises);
      }

    } catch (err: any) {
      console.error(`Error dispatching notifications for user ${user.id}:`, err.message);
    }
  }

  console.log("Notification dispatcher loop finished successfully.");
}

runDispatcher()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("Critical error in dispatcher script:", err);
    process.exit(1);
  });
