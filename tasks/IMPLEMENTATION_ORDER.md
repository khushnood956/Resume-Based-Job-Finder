# Implementation Order

This document dictates the sequential execution path of the project.

---

## Phase 0: Project Initialization
* **Objectives**: Prepare repository layouts, configure compilers, configure base environments, and initialize packages.
* **Files Affected**:
  * `frontend/*`
  * `services/resume-parser/*`
  * `services/job-search/*`
  * `README.md`
* **Tasks**:
  * Create folder structures.
  * Initialize Next.js project.
  * Initialize Python virtual environment.
  * Setup Node project in job search module.
* **Dependencies**: None.
* **Definition of Done (DoD)**: All environments build successfully locally and directories are initialized.

---

## Phase 1: Database and Authentication
* **Objectives**: Establish PostgreSQL schemas on Supabase, configure indexes, deploy auth tables, and apply row-level security (RLS).
* **Files Affected**:
  * `database/schema.sql`
  * `frontend/src/app/api/auth/*`
* **Tasks**:
  * Execute database schema on Supabase.
  * Apply RLS and user sync profile triggers.
  * Verify user sign-up automatically populates public profiles.
* **Dependencies**: Phase 0.
* **Definition of Done (DoD)**: Table relations are fully verified, indexes are functional, and credentials connect from external interfaces.

---

## Phase 2: Resume Upload and Parsing
* **Objectives**: Build Python PDF parser, parse text strings, and enable serverless upload endpoint.
* **Files Affected**:
  * `services/resume-parser/main.py`
  * `services/resume-parser/extractor.py`
  * `frontend/src/app/api/resume/upload/route.ts`
* **Tasks**:
  * Write PyMuPDF text reader module.
  * Write Next.js API upload handler route.
  * Save PDFs to private Supabase Storage buckets.
* **Dependencies**: Phase 1.
* **Definition of Done (DoD)**: Uploading a resume PDF successfully extracts string text and registers the file in storage.

---

## Phase 3: Skill Extraction
* **Objectives**: Build the localized skill-matching logic, design custom word boundary regex patterns, and return list of extracted profiles.
* **Files Affected**:
  * `services/resume-parser/dictionary.json`
  * `services/resume-parser/parser.py`
* **Tasks**:
  * Construct skill lookup dictionary files.
  * Write boundary-safe regex lookups.
  * Implement tag matching routines.
* **Dependencies**: Phase 2.
* **Definition of Done (DoD)**: Parser API returns correct skills lists without sub-word matching faults.

---

## Phase 4: Job Search Integration
* **Objectives**: Construct job aggregation scripts, query Adzuna PK, scrape static lists, map details to global skills, and sync records.
* **Files Affected**:
  * `services/job-search/clients/adzuna.ts`
  * `services/job-search/scrapers/local-scraper.ts`
  * `services/job-search/sync.ts`
* **Tasks**:
  * Query Adzuna API PK feeds.
  * Build scrapers for local job postings.
  * Apply global skill tags and write to Supabase.
* **Dependencies**: Phase 1, Phase 3.
* **Definition of Done (DoD)**: Scraper runs and populates `jobs` and `job_skills` tables without duplicate listings.

---

## Phase 5: Matching Engine
* **Objectives**: Deploy PostgreSQL scoring procedure and configure dashboard fetch routes.
* **Files Affected**:
  * SQL Editor (Supabase RPC functions)
  * `frontend/src/app/api/jobs/recommendations/route.ts`
* **Tasks**:
  * Implement math formulas in PLpgSQL function.
  * Wire Next.js endpoint to retrieve matching results.
* **Dependencies**: Phase 4.
* **Definition of Done (DoD)**: Calling `/api/jobs/recommendations` returns job objects with correct compatibility scores and missing skills lists.

---

## Phase 6: Notifications
* **Objectives**: Integrate Resend email client, write Telegram Bot verification flows, and set up cron execution triggers.
* **Files Affected**:
  * `services/notifications/resend.ts`
  * `services/notifications/telegram-bot.ts`
  * `services/notifications/dispatcher.ts`
  * `.github/workflows/daily-scraper.yml`
* **Tasks**:
  * Hook up Resend SDK and design email templates.
  * Build Telegram Bot token hook handler.
  * Configure GitHub Actions cron runner.
* **Dependencies**: Phase 5.
* **Definition of Done (DoD)**: Cron execution schedules verify job updates and send email/Telegram updates to matched users.

---

## Phase 7: Dashboard
* **Objectives**: Create responsive web layouts, onboarding wizard tagging reviews, jobs list feeds, detail modals, and settings toggles.
* **Files Affected**:
  * `frontend/src/app/*`
  * `frontend/src/components/*`
* **Tasks**:
  * Define global CSS variable styles.
  * Create login, onboarding, and dashboard cards templates.
  * Build details slider panels showing learning link URLs.
* **Dependencies**: Phase 6.
* **Definition of Done (DoD)**: Portal is fully interactive, responsive, and manages profile preferences.

---

## Phase 8: Deployment
* **Objectives**: Launch web app on Vercel, host Python service, and set production variables.
* **Files Affected**:
  * Vercel settings, Koyeb configs.
* **Tasks**:
  * Deploy frontend to Vercel Hobby tier.
  * Deploy parser to Koyeb.
  * Set up all environment variables.
* **Dependencies**: Phase 7.
* **Definition of Done (DoD)**: Live system operates in production at $0/month.

---

## Phase 9: Testing
* **Objectives**: Execute integration tests and perform manual audits.
* **Files Affected**:
  * `tests/*`
* **Tasks**:
  * Execute parser and scraper tests.
  * Audit performance of matching queries.
* **Dependencies**: Phase 8.
* **Definition of Done (DoD)**: All test cases pass and core operations take under 5 seconds.

---

## Phase 10: Documentation
* **Objectives**: Finalize developer setup manuals and update project status reports.
* **Files Affected**:
  * Root `README.md`, docs files.
* **Tasks**:
  * Verify all links and commands are up to date.
* **Dependencies**: Phase 9.
* **Definition of Done (DoD)**: Repository contains clean files and setup guidelines.
