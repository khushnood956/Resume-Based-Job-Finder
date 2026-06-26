# Project Milestones

This document specifies the core engineering milestones and their respective verification check gates.

---

## Milestone 1: Project Setup & Resume Parsing
* **Target Timeline**: Week 1
* **Objective**: Establish codebase architecture, setup local Supabase database schemas, build and verify the FastAPI python resume-parser.
* **Acceptance Gates**:
  - [ ] Database DDL tables created and local credentials configured.
  - [ ] FastAPI parsing container/service running.
  - [ ] Running a PDF upload parser returns correct text extraction and isolates at least 80% of listed skill keys.

## Milestone 2: Job Aggregator & Scraping Engine (Pakistan Focus)
* **Target Timeline**: Week 2
* **Objective**: Connect job feeds, parse and write the job aggregator scripts, write parsing tools for specific sites (Adzuna PK + static sources), and run automated deduplication.
* **Acceptance Gates**:
  - [ ] Adzuna PK integration completes successfully and fetches local jobs.
  - [ ] Aggregator correctly parses title, company, salary, location, and maps text tags to global skill ids.
  - [ ] Deduplication works (duplicate URLs or matching company/title sets are ignored).

## Milestone 3: Database Matching Engine & REST APIs
* **Target Timeline**: Week 3
* **Objective**: Write stored procedures inside database for scoring calculations. Implement API endpoints in Next.js backend routes for profile management, skills collection, and dashboard pagination.
* **Acceptance Gates**:
  - [ ] PLpgSQL matching engine runs queries in under 100ms.
  - [ ] API routes for profile details return expected JSON data.
  - [ ] Endpoint `/api/jobs/recommendations` properly returns matching calculations for a test user.

## Milestone 4: Telegram & Email Notifications Loop
* **Target Timeline**: Week 4
* **Objective**: Construct the Telegram bot responder interface, configure email digests via Resend API, and configure scheduling loops.
* **Acceptance Gates**:
  - [ ] Telegram bot successfully links `user_id` upon `/start <token>` verification.
  - [ ] Daily cron script runs, aggregates alerts, and dispatches messages to verified users.
  - [ ] Emails compile and dispatch via Resend without API rejections.

## Milestone 5: User Portal & Web Dashboard
* **Target Timeline**: Week 5
* **Objective**: Build web user interfaces using Next.js with strictly Vanilla CSS (highly polished style system, mobile responsive).
* **Acceptance Gates**:
  - [ ] Log-in / Sign-up flows execute smoothly.
  - [ ] Uploading a resume provides instant loading animations and directs to a editable skills tagging modal.
  - [ ] Recommendations dashboard is operational, interactive, and supports filter combinations.

## Milestone 6: Deployment & Integration Audits
* **Target Timeline**: Week 6
* **Objective**: Deploy Next.js to Vercel, Python Parser to Koyeb/Render, and link GitHub Actions. Conduct final system tests.
* **Acceptance Gates**:
  - [ ] Deployment completes with zero monthly costs ($0/month).
  - [ ] End-to-end user signup -> upload resume -> find matching job -> toggle bookmarks -> receive daily Telegram alert operates without manually running local terminals.
