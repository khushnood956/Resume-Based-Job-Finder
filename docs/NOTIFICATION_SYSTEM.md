# Notification System Specification

To keep users engaged without requiring them to check the web portal daily, the platform includes a daily alert loop via **Email (Resend)** and **Telegram (Bot API)**.

---

## 1. Trigger Mechanics (The Cron Loop)

1. **Scheduling**: A GitHub Actions workflow is scheduled to run daily at 05:00 PKT (00:00 UTC).
2. **Aggregation**: The cron triggers `/api/cron/jobs` which scrapes and parses new job listings.
3. **Evaluation**: The system matches the new jobs against all user profiles.
4. **Queueing**: For users who have matched jobs scoring **$\ge$ 70%** and have notifications enabled, the system generates notification records in the database.
5. **Dispatch**: The API iterates over queued notifications, compiles the templates, and triggers Resend and Telegram APIs.

---

## 2. Telegram Bot Integration

### Bot Mechanics
* **Username**: `@PakJobMatchBot`
* **API Endpoint**: `https://api.telegram.org/bot<TOKEN>/sendMessage`
* **Verification Flow**:
  1. A user enables Telegram notifications on the Settings page.
  2. The database generates a temporary validation token: `tg_token = base64(user_id)`.
  3. The user opens a chat with the bot and clicks `/start <TOKEN>`.
  4. The webhook receives the message, extracts the token, decodes the `user_id`, sets the `telegram_chat_id` in the database, and enables notifications.

### Message Payload Example
```text
💼 New Match: Junior React Developer (Lahore)
🏢 Company: TechLogix
⭐ Match Score: 85%

🔍 Why you match:
Matches your React, Tailwind CSS, and Git skills. Matches location preference Lahore.

⚠️ Missing Skills:
- TypeScript (Learn: https://freecodecamp.org/news/learn-typescript)
- Docker (Learn: https://freecodecamp.org/news/docker-tutorial)

🔗 Apply Now: https://jobfinder.com/jobs/job-uuid-1
```

---

## 3. Email Layout Template (Resend)

We use Resend's Node SDK to send clean, responsive HTML emails.

### Email Structure
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', sans-serif; background-color: #f8fafc; color: #1e293b; padding: 20px; }
    .card { background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; padding: 20px; margin-bottom: 15px; }
    .score-badge { display: inline-block; background: #10b981; color: #fff; padding: 4px 8px; border-radius: 4px; font-weight: bold; }
    .btn { display: inline-block; background: #3b82f6; color: #fff; padding: 10px 16px; border-radius: 4px; text-decoration: none; margin-top: 10px; }
    .footer { font-size: 12px; color: #64748b; text-align: center; margin-top: 30px; }
  </style>
</head>
<body>
  <h2>Assalam-o-Alaikum, here are your job matches for today!</h2>
  <p>We found new opportunities in Pakistan matching your resume and preferences.</p>

  <!-- Job Card -->
  <div class="card">
    <div style="display: flex; justify-content: space-between;">
      <h3>Junior React Developer - TechLogix</h3>
      <span class="score-badge">85% Match</span>
    </div>
    <p><strong>Location:</strong> Lahore (Onsite)</p>
    <p><strong>Missing Skills:</strong> TypeScript, Docker</p>
    <a href="https://jobfinder.com/jobs/job-uuid-1" class="btn">View & Apply</a>
  </div>

  <div class="footer">
    <p>You received this because you enabled alerts on Resume-to-Opportunities Engine.</p>
    <p><a href="https://jobfinder.com/profile">Unsubscribe / Change Settings</a></p>
  </div>
</body>
</html>
```

---

## 4. Failure Handling & Rate Limits

* **Resend Limits**: The free tier of Resend supports 100 emails/day (3,000/month). To remain within this limit, emails are sent as a single aggregated daily digest per user, containing up to 5 of the top-matching jobs, rather than individual emails for each job match.
* **Telegram Rate Limits**: 30 messages/second maximum to prevent IP throttling. We execute message dispatches with a minor delay spacing (e.g., 50ms) to ensure compliance when sending alerts to multiple users.
* **Error Logging**: Failed notifications are marked as `status = 'failed'` in a notification delivery log table rather than crashing the loop, enabling retries on the next execution cycle if needed.
