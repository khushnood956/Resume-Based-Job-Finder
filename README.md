# Resume-to-Opportunities Engine (Pakistan)

This platform matches candidate resumes (PDF format) against onsite and remote job listings across Pakistan, identifies skill gaps, offers free learning resources, and pushes daily digests to candidates via Email and Telegram.

## Folder Structure

```text
JobFinderProject/
├── frontend/                 # Next.js web application (TypeScript, Vanilla CSS modules)
├── services/
│   ├── resume-parser/        # Python FastAPI microservice (PyMuPDF & spaCy parsing)
│   ├── job-search/           # Node.js daily scraping scripts & Adzuna integrations
│   └── notifications/        # Message dispatch routines (Telegram & Resend client integrations)
├── database/                 # SQL DDL schemas, migration scripts, and RLS rules
├── docs/                     # Comprehensive architecture and spec documentation (Markdown)
├── tasks/                    # Task backlogs, sprint files, and implementation details
├── tests/                    # Global/Integration testing modules
└── README.md                 # Project root instructions
```

## Module Directory Responsibilities

### 1. `frontend/`
* **Purpose**: User-facing web application.
* **Responsibilities**: Authentication forms, resume upload screens, user profile controls, job listings dashboard, settings configuration, and matching indicators.
* **Key Files**: Next.js App router structure (`src/app`), CSS Module files (`*.module.css`), and Supabase client config.

### 2. `services/resume-parser/`
* **Purpose**: Parse raw PDF files to extract text sections and skills.
* **Responsibilities**: Extract PDF strings with PyMuPDF, normalize raw text, execute regex lookup dictionaries, and return structured JSON models.
* **Key Files**: FastAPI application handler (`main.py`), parsing pipeline scripts (`parser.py`), and test definitions.

### 3. `services/job-search/`
* **Purpose**: Retrieve and index fresh jobs in Pakistan daily.
* **Responsibilities**: Pull active developer listings from Adzuna PK, scrape static lists, format listings, and push records to Supabase.
* **Key Files**: Scraper script (`scraper.ts`), API clients, and execution entry-point.

### 4. `services/notifications/`
* **Purpose**: Daily communication dispatch loop.
* **Responsibilities**: Fetch matching alerts from Supabase, template notification layouts, send emails via Resend, and push text alerts via Telegram Bot.
* **Key Files**: Client wrapper modules (`resend.ts`, `telegram.ts`), and dispatcher scripts.

### 5. `database/`
* **Purpose**: Schema migrations and raw queries.
* **Responsibilities**: Define database tables, indexes, stored PLpgSQL matching functions, and RLS rules.
* **Key Files**: Schema configuration (`schema.sql`), test/seed data (`seeds.sql`), and policy scripts.

### 6. `docs/`
* **Purpose**: Specification and configuration records.
* **Responsibilities**: Project overviews, API definitions, matching designs, and roadmap references.

### 7. `tasks/`
* **Purpose**: Action items and sprints.
* **Responsibilities**: Backlog, sprint descriptions, and implementation ordering schedules.

---

## Local Setup & Development

Detailed setup instructions for each subdirectory can be found in their respective README.md files.

1. **Database Setup**: Apply `database/schema.sql` to your Supabase PostgreSQL database.
2. **Resume Parser**: Initialize Python environment in `services/resume-parser`, install dependencies, and run `uvicorn main:app --reload`.
3. **Frontend**: Initialize Node modules in `frontend`, copy environmental secrets, and execute `npm run dev`.
4. **Scraper & Alerts**: Execute job search scripts locally to seed test listings.
