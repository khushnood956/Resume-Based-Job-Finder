# Product Backlog

A comprehensive breakdown of all granular development tasks required to build the Resume-to-Opportunities Engine.

---

## 1. Project Initialization & Setup (INFRA)
* [x] **TS-1.1**: Initialize Next.js app in the `frontend` folder using `npx -y create-next-app@latest` (with TypeScript, App Router, ESLint, and Vanilla CSS).
* [x] **TS-1.2**: Initialize Python virtual environment inside `services/resume-parser`.
* [x] **TS-1.3**: Initialize Node project inside `services/job-search`.
* [x] **TS-1.4**: Configure `.env.example` file templates in the root directory.
* [x] **TS-1.5**: Set up local Supabase container or link to a free cloud Supabase instance.
* [x] **TS-1.6**: Run DDL schema inside Supabase SQL editor to create all required database tables, indexes, and triggers.

## 2. Resume Upload & Parser Service (PARSE)
* [x] **TS-2.1**: Set up FastAPI boilerplate inside `services/resume-parser/main.py`.
* [x] **TS-2.2**: Write test suite with mock files for parser validations.
* [x] **TS-2.3**: Write PDF reader script using `PyMuPDF` to convert binary uploads to string text.
* [x] **TS-2.4**: Implement text normalizer (lowercase, space-collapsing, symbol protections).
* [x] **TS-2.5**: Construct local dictionary structure for technical/soft skills matching Pakistani demands.
* [x] **TS-2.6**: Write extraction regex algorithms to isolate skills without false-matching subwords.
* [x] **TS-2.7**: Segment resume sections (Experience, Education, Skills) to optimize parsing weights.
* [x] **TS-2.8**: Secure parser API using headers-based static API token authentication.
* [x] **TS-2.9**: Create Vercel endpoint proxy `/api/resume/upload` to receive frontend uploads and forward them to the parser.

## 3. Job Search & Scraper Engine (CRAWL)
* [x] **TS-3.1**: Set up basic compiler configurations for TypeScript in `services/job-search`.
* [x] **TS-3.2**: Register for Adzuna developer account and cache credentials.
* [x] **TS-3.3**: Write API client wrapper to fetch active Pakistan jobs (`country=pk`).
* [x] **TS-3.4**: Write HTML parser rules for selected static Pakistan job feeds.
* [x] **TS-3.5**: Map scraped/fetched job descriptions to the global skills dictionary to populate `job_skills` records.
* [x] **TS-3.6**: Develop deduplication routine (by hash check of title, company, and url).
* [x] **TS-3.7**: Write database sync script to insert clean jobs to Supabase `jobs` table.
* [x] **TS-3.8**: Write automated job cleanup script to delete/archive listings older than 30 days.

## 4. Matching & Scoring Logic (MATCH)
* [x] **TS-4.1**: Implement the core math scoring equations inside the PostgreSQL stored procedure (`get_job_recommendations`).
* [x] **TS-4.2**: Verify skill scoring logic weights (matching/total required).
* [x] **TS-4.3**: Integrate location preference scoring rules (Onsite matches user location, remote gets full points).
* [x] **TS-4.4**: Integrate experience level heuristics (keyword checks on title vs user profile levels).
* [x] **TS-4.5**: Add recency bonus scoring calculations (fresh posts get higher priority).
* [x] **TS-4.6**: Write test scripts validating score results for diverse profiles.

## 5. Daily Notifications System (ALERT)
* [x] **TS-5.1**: Register for Resend email API account and verify domain.
* [x] **TS-5.2**: Write Node.js Resend wrapper to compile and send clean HTML emails.
* [x] **TS-5.3**: Setup a new Telegram Bot using `@BotFather` and retrieve the API token.
* [x] **TS-5.4**: Write Telegram webhook handlers to process user tokens (`/start <token>`) and update `profiles.telegram_chat_id`.
* [x] **TS-5.5**: Write daily notifier script that loops over all matches, filters scores $\ge$ 70%, and constructs message templates.
* [x] **TS-5.6**: Setup GitHub Actions daily workflows cron to trigger scraping and match alert distributions automatically.

## 6. Frontend Portal & User Dashboards (UI)
* [x] **TS-6.1**: Create CSS variables sheet (`globals.css`) containing color tokens, typography setups, and standard layouts.
* [x] **TS-6.2**: Design login, registration, and password recovery pages using responsive Vanilla CSS forms.
* [x] **TS-6.3**: Write client middleware protecting paths `/dashboard`, `/profile`, and `/settings`.
* [x] **TS-6.4**: Build the user onboarding wizard (interactive resume drag-and-drop, loading skeletons, and interactive skills review tags).
* [x] **TS-6.5**: Create the job list feed dashboard with responsive grid layouts.
* [x] **TS-6.6**: Build filter controls (remote check, city selection, sorting criteria).
* [x] **TS-6.7**: Design the job detail slide-out modal (matching score gauge, missing skills, and external apply button).
* [x] **TS-6.8**: Add bookmarks management page (showing saved jobs and application status trackers).
* [x] **TS-6.9**: Build the Settings dashboard (notification preferences toggle, Telegram bot connect token instructions).

## 7. Quality Assurance & Launch (QA)
* [x] **TS-7.1**: Run integration test suites covering the entire user journey.
* [x] **TS-7.2**: Audit application for memory leaks, network delays, and Vercel execution timeouts.
* [x] **TS-7.3**: Configure production environment vars in Supabase, Vercel, and GitHub Secrets.
* [x] **TS-7.4**: Execute live test in production (zero-cost verification).
