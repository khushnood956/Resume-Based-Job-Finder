# Final Project Implementation Report: Resume-to-Opportunities Engine

This report details the design decisions, component implementations, and operational instructions for the platform.

---

## 1. System Architecture

The project is structured as a decoupled, multi-module stack designed to run entirely on free developer tiers ($0/month):

```
                       +---------------------------------------+
                       |          Next.js Web Portal           |
                       |              (frontend/)              |
                       +---------------------------------------+
                           /              |                 \
                          /               |                  \
                         v                v                   v
              +------------------+  +-------------+  +----------------------+
              |  FastAPI Parser  |  |  Supabase   |  |   Github Actions     |
              | (resume-parser/) |  | (Postgres)  |  |  Daily Scrapers Cron |
              +------------------+  +-------------+  +----------------------+
                                                            |
                                                            v
                                                     +--------------+
                                                     | adzuna_pk &  |
                                                     | indeed_apify |
                                                     +--------------+
```

* **Frontend Portal (`frontend/`)**: Built with **Next.js (App Router, TypeScript)**. Styled using strict **Vanilla CSS variables and modules** to ensure premium glassmorphic aesthetics, zero-bloat file sizes, and high speed.
* **Resume Parser (`services/resume-parser/`)**: A **Python FastAPI** microservice. It is responsible for CPU-heavy NLP tasks: PDF layout text extraction via **PyMuPDF**, section isolation, and boundary-safe keyword tag matching.
* **Job Search Engine (`services/job-search/`)**: A **Node.js/TypeScript** crawler scheduled via **GitHub Actions**. It queries the Adzuna API for remote developer roles and runs the Indeed Scraper via **Apify Client** for Pakistan onsite jobs.
* **Alert System (`services/notifications/`)**: A dispatch engine triggering **Resend API** for compiling HTML email digests and a long-polling **Telegram Bot** responding to user account verification links (`/start <token>`).

---

## 2. Core Module Integrations

### A. Resume Parser NLP Pipeline
1. **Extraction**: Reads binary PDF streams in Python via `PyMuPDF` (`fitz`), supporting multi-column layouts.
2. **Sanitization**: Standardizes newlines, strips non-printable control characters, and checks character length (fails on scanned textless images).
3. **Sectioning**: Breaks resumes into Education, Experience, Projects, Skills, and other sections.
4. **Greedy Skill Matching**: Flattens a [dictionary.json](file:///D:/JobFinderProject/services/resume-parser/dictionary.json) database. It matches longer multi-word skills first (`React Native` before `React`) and replaces matched words with blank space buffers to prevent substring duplications. 
5. **Special Cases**: Matches common English ambiguous words (like `"go"`) case-sensitively (`Go` or `GO`).

### B. Database Matching Engine
Calculates matching compatibility scores (0-100%) inside Supabase PostgreSQL using a custom PLpgSQL Stored Procedure (`get_job_recommendations`):
* **Skills Alignment (50%)**: Proportion of required job skills possessed by the candidate.
* **Work Type Preference (20%)**: Compatibility of candidate's Remote/Onsite preferences against the job type.
* **Location Match (15%)**: Asserts candidate's city matching the job location for onsite roles.
* **Recency & Level (15%)**: Gives extra weight to jobs matching the candidate's level (keywords like `Junior`, `Fresh`) and jobs posted within 3-7 days.
* **Gap Analysis**: Automatically extracts skills required by the job that the candidate lacks, displaying them with free learning links.

### C. Account Linker Bot Handshake
* Users are given a unique Base64 verification token in Settings: `verify_token = btoa(userId)`.
* Clicking "Link Bot" redirects to `https://t.me/your_bot_username?start=verify_token`.
* The long-polling bot captures `/start <verify_token>`, decodes it, asserts the profile exists in Supabase, and updates their profile's `telegram_chat_id` and notification states.

---

## 3. Directory Layout Blueprint

```text
JobFinderProject/
├── .github/workflows/        # GitHub Actions Cron daily workflow scheduler
├── database/                 # PostgreSQL schema DDLs and TESTING guides
├── docs/                     # Comprehensive architectural documentation
├── frontend/                 # Next.js web application and styles
├── services/
│   ├── resume-parser/        # Python FastAPI PDF parsing microservice
│   ├── job-search/           # Node.js scraper (Adzuna + Indeed Apify integration)
│   └── notifications/        # Resend email compiler & Telegram bot account linker
├── tasks/                    # Backlog tracking sheets
├── tutorial.txt              # Setup and API configuration guide
└── README.md                 # Project root instructions
```
