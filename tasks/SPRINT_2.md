# Sprint 2: Job Aggregation & Parsing Engine

## Sprint Overview
* **Goal**: Build the daily crawler to gather, normalize, tag, and persist Pakistan onsite and remote jobs in Supabase.
* **Duration**: 2 Weeks

---

## Tasks

### TS-2.1: Scraper Environment Setup
* **Task ID**: `TS-2.1`
* **Title**: Configure Node.js environment in `services/job-search`
* **Description**: Setup TypeScript compiler configuration (`tsconfig.json`) and configure `package.json` with scripts to compile and run scripts. Setup dotenv configurations.
* **Dependencies**: None
* **Difficulty**: Easy
* **Estimated Time**: 2 hours
* **Acceptance Criteria**:
  - [ ] Running compiler produces javascript in `dist/`.
  - [ ] Node packages resolve correctly.
* **Deliverables**: `services/job-search/package.json`, `services/job-search/tsconfig.json`.

### TS-2.2: Adzuna PK Integration
* **Task ID**: `TS-2.2`
* **Title**: Fetch listings from Adzuna API
* **Description**: Create API wrapper that calls Adzuna developer API for location Pakistan (`country=pk`), matching categories for software, engineering, and tech roles, returning raw listings.
* **Dependencies**: `TS-2.1`
* **Difficulty**: Medium
* **Estimated Time**: 5 hours
* **Acceptance Criteria**:
  - [ ] Correctly fetches paginated results.
  - [ ] Formats response data.
  - [ ] Handles rate limit status codes (retry-after or logging/skipping).
* **Deliverables**: `services/job-search/clients/adzuna.ts`.

### TS-2.3: Static Local Scrapers
* **Task ID**: `TS-2.3`
* **Title**: Scrape static Pakistan job listings
* **Description**: Write simple Cheerio/Axios scrapers targeting public job feeds or simple static lists representing job details in Pakistan. Respect `robots.txt`.
* **Dependencies**: `TS-2.1`
* **Difficulty**: Medium
* **Estimated Time**: 8 hours
* **Acceptance Criteria**:
  - [ ] Parses HTML elements to extract title, company, location, salary, description, and source URL.
  - [ ] Gracefully logs errors if structure changes without crashing the scraper script.
* **Deliverables**: `services/job-search/scrapers/local-scraper.ts`.

### TS-2.4: Skill Tagging Engine
* **Task ID**: `TS-2.4`
* **Title**: Map job descriptions to global skills
* **Description**: Write TypeScript script that runs through a job description and applies the skills dictionary. If skills are found, map them to the database `job_skills` records.
* **Dependencies**: `TS-1.5`, `TS-2.1`
* **Difficulty**: Medium
* **Estimated Time**: 6 hours
* **Acceptance Criteria**:
  - [ ] Successfully matches text keywords against skills in the database `skills` table.
  - [ ] Creates relational links in `job_skills`.
* **Deliverables**: `services/job-search/utils/skill-tagger.ts`.

### TS-2.5: Deduplication & Database Sync
* **Task ID**: `TS-2.5`
* **Title**: Sync and deduplicate job data
* **Description**: Compare incoming scraped jobs with database records. If URL or title/company combo exists, skip. Write new records to Supabase `jobs` and `job_skills` tables.
* **Dependencies**: `TS-2.2`, `TS-2.3`, `TS-2.4`
* **Difficulty**: Medium
* **Estimated Time**: 5 hours
* **Acceptance Criteria**:
  - [ ] Prevents duplicate job insert operations.
  - [ ] Correctly links jobs and skills inside PostgreSQL transaction blocks.
* **Deliverables**: `services/job-search/sync.ts`.

### TS-2.6: Job Archive Cron
* **Task ID**: `TS-2.6`
* **Title**: Expire and clean old job listings
* **Description**: Write a database cleanup query or service script that deletes job records older than 30 days, cascades delete rows in `job_skills` and `bookmarks`.
* **Dependencies**: `TS-1.5`
* **Difficulty**: Easy
* **Estimated Time**: 2 hours
* **Acceptance Criteria**:
  - [ ] Running query removes records where `posted_at < NOW() - INTERVAL '30 days'`.
  - [ ] Cascades delete rows without foreign key blockages.
* **Deliverables**: Database clean-up query function.
