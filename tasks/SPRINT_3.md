# Sprint 3: Matching Engine & Notifications

## Sprint Overview
* **Goal**: Code the PostgreSQL matching function, create REST endpoints for recommendations, and launch the Telegram and Email notifier loops.
* **Duration**: 2 Weeks

---

## Tasks

### TS-3.1: Stored Procedure Scoring Engine
* **Task ID**: `TS-3.1`
* **Title**: Deploy matching stored procedure
* **Description**: Write and verify `get_job_recommendations` PostgreSQL function in Supabase. The function must calculate percentage match, explain the score, and list missing skills.
* **Dependencies**: `TS-1.5`
* **Difficulty**: Medium
* **Estimated Time**: 6 hours
* **Acceptance Criteria**:
  - [x] Running RPC function with user UUID returns correctly formatted columns.
  - [x] Matching calculation is checked and outputs exact scores based on weights.
  - [x] Compiles missing skills list.
* **Deliverables**: Database RPC script.

### TS-3.2: Recommendations API Route
* **Task ID**: `TS-3.2`
* **Title**: Next.js route for recommendations dashboard
* **Description**: Create Next.js API route `/api/jobs/recommendations` which reads user session, calls the RPC matching function, and returns paginated, sorted job results.
* **Dependencies**: `TS-1.6`, `TS-3.1`
* **Difficulty**: Easy
* **Estimated Time**: 3 hours
* **Acceptance Criteria**:
  - [x] Access is blocked if not authenticated.
  - [x] Returns paginated recommendation objects.
* **Deliverables**: `frontend/src/app/api/jobs/recommendations/route.ts`.

### TS-3.3: Resend Email Client
* **Task ID**: `TS-3.3`
* **Title**: Integrated email digest dispatcher
* **Description**: Create client utility in `services/notifications/resend.ts` wrapper utilizing Resend SDK. Design clean responsive email layout showing top matches and missing skills.
* **Dependencies**: None
* **Difficulty**: Easy
* **Estimated Time**: 4 hours
* **Acceptance Criteria**:
  - [x] Emails compile HTML format successfully.
  - [x] Dispatching emails works and respects daily free-tier limits.
* **Deliverables**: `services/notifications/resend.ts`.

### TS-3.4: Telegram Bot Integration
* **Task ID**: `TS-3.4`
* **Title**: Telegram bot webhook responder
* **Description**: Build bot responder using Telegram API. It listens for `/start <token>`, decodes user metadata, saves `telegram_chat_id` in profiles, and responds with a greeting.
* **Dependencies**: `TS-1.5`
* **Difficulty**: Hard
* **Estimated Time**: 10 hours
* **Acceptance Criteria**:
  - [x] Correctly links user IDs upon receipt of valid verify tokens.
  - [x] Rejects invalid tokens and replies with error prompt.
* **Deliverables**: `services/notifications/telegram-bot.ts`.

### TS-3.5: Daily Notification Loop
* **Task ID**: `TS-3.5`
* **Title**: Alerts compiler & dispatcher script
* **Description**: Orchestrate the alert pipeline. It selects users with notifications enabled, queries their top matches, and shoots emails/Telegram updates for scores $\ge$ 70%.
* **Dependencies**: `TS-3.1`, `TS-3.3`, `TS-3.4`
* **Difficulty**: Medium
* **Estimated Time**: 6 hours
* **Acceptance Criteria**:
  - [x] Pulls matches daily and aggregates into a single message/email.
  - [x] Logs delivery results in database notifications table.
* **Deliverables**: `services/notifications/dispatcher.ts`.

### TS-3.6: GitHub Actions Workflow Cron
* **Task ID**: `TS-3.6`
* **Title**: Deploy automated daily workflow schedule
* **Description**: Write GitHub actions file that runs daily at 00:00 UTC. It executes job search scripts, updates listings, and triggers alert loops.
* **Dependencies**: `TS-2.5`, `TS-3.5`
* **Difficulty**: Easy
* **Estimated Time**: 3 hours
* **Acceptance Criteria**:
  - [x] Action runs on schedule.
  - [x] Execution completes within GitHub time constraints.
* **Deliverables**: `.github/workflows/daily-scraper.yml`.
