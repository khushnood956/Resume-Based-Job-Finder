import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

export interface EmailJobDetails {
  title: string;
  company: string;
  location: string;
  is_remote: boolean;
  match_score: number;
  missing_skills: string[];
  url: string;
}

export async function sendEmailDigest(
  recipientEmail: string,
  userName: string,
  jobs: EmailJobDetails[]
): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY;

  const htmlContent = compileEmailHtml(userName, jobs);

  if (!apiKey || apiKey.startsWith('re_your_')) {
    console.warn(`[Resend Mock Mode] Would send daily matching email to ${recipientEmail} with ${jobs.length} jobs.`);
    // Log preview in console for local testing
    console.log(`--- EMAIL PREVIEW FOR ${recipientEmail} ---`);
    console.log(`Subject: Your Daily Job Matches in Pakistan`);
    console.log(`Content snippet:\n${htmlContent.slice(0, 400)}...\n-----------------------------`);
    return true;
  }

  try {
    const response = await axios.post(
      'https://api.resend.com/emails',
      {
        from: 'JobFinder Engine <onboarding@resend.dev>', // Resend free tier allows sending from onboarding@resend.dev to owner email
        to: [recipientEmail],
        subject: 'Your Daily Job Matches in Pakistan',
        html: htmlContent
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.status === 200 || response.status === 201) {
      console.log(`Email digest successfully sent to ${recipientEmail}.`);
      return true;
    }
    return false;
  } catch (error: any) {
    console.error(`Resend API call failed for ${recipientEmail}:`, error.response?.data || error.message);
    return false;
  }
}

function compileEmailHtml(userName: string, jobs: EmailJobDetails[]): string {
  const jobRows = jobs.map(job => {
    const missingStr = job.missing_skills.length > 0 
      ? job.missing_skills.map(s => `<span style="background: #fee2e2; color: #ef4444; padding: 2px 6px; border-radius: 4px; font-size: 11px; margin-right: 5px; display: inline-block;">${s}</span>`).join('')
      : '<span style="color: #10b981; font-size: 12px;">None! Perfect match.</span>';

    return `
      <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin-bottom: 15px; font-family: 'Inter', sans-serif;">
        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
          <div>
            <h3 style="margin: 0 0 5px 0; color: #1e293b; font-size: 16px;">${job.title}</h3>
            <span style="color: #64748b; font-size: 13px;">${job.company}</span>
          </div>
          <span style="background: #d1fae5; color: #065f46; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 13px;">
            ${job.match_score}% Match
          </span>
        </div>
        <p style="margin: 0 0 12px 0; color: #475569; font-size: 14px;">
          <strong>Location:</strong> ${job.location} ${job.is_remote ? '(Remote)' : ''}
        </p>
        <div style="margin-bottom: 15px;">
          <strong style="display: block; color: #334155; font-size: 12px; margin-bottom: 5px;">MISSING SKILLS & GAP INFO:</strong>
          ${missingStr}
        </div>
        <a href="${job.url}" target="_blank" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 8px 16px; border-radius: 4px; text-decoration: none; font-size: 13px; font-weight: 500;">
          View & Apply opportunity
        </a>
      </div>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Your Job Matches</title>
    </head>
    <body style="background-color: #f8fafc; margin: 0; padding: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
      <div style="max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0f172a; margin-bottom: 5px;">Assalam-o-Alaikum, ${userName || 'Candidate'}!</h2>
        <p style="color: #475569; font-size: 15px; margin-top: 0; margin-bottom: 25px;">
          Here are your top daily job matches matching your uploaded resume profile and locations preferences.
        </p>
        
        ${jobRows}

        <div style="text-align: center; margin-top: 30px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
          <p style="font-size: 12px; color: #94a3b8; margin: 0 0 5px 0;">
            You received this because you enabled Email Digests on Resume-to-Opportunities Engine.
          </p>
          <a href="https://yourportal.com/settings" style="font-size: 12px; color: #2563eb; text-decoration: none;">
            Manage Notification preferences
          </a>
        </div>
      </div>
    </body>
    </html>
  `;
}
