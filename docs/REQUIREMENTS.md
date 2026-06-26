# Requirements Specification

## Functional Requirements

### 1. User Account & Authentication
* **FR-1.1**: Users must be able to sign up, log in, and log out using email and password via Supabase Auth.
* **FR-1.2**: Password reset flow must be supported via email confirmation.
* **FR-1.3**: Optional: Social login (Google) must be supported.
* **FR-1.4**: Users must have a secure session that persists across page refreshes.

### 2. Resume Ingestion & Parsing
* **FR-2.1**: Users must be able to upload a single PDF resume (up to 5MB).
* **FR-2.2**: The system must extract raw text from the PDF using PyMuPDF.
* **FR-2.3**: The NLP pipeline must identify and segment sections (Education, Experience, Projects, Skills).
* **FR-2.4**: The system must automatically extract skills using a curated skill dictionary.
* **FR-2.5**: Users must be able to view, edit, add, or delete the extracted skills on their profile page.

### 3. Profile Management
* **FR-3.1**: Users must be able to specify their preferred job locations (e.g., Karachi, Lahore, Islamabad, Remote).
* **FR-3.2**: Users must be able to select their employment preference (Onsite, Remote, Hybrid).
* **FR-3.3**: Users must be able to set their experience level (Internship, Fresh Graduate, Junior, Mid-Level).
* **FR-3.4**: Users must be able to configure notification preferences (Email, Telegram, or None).

### 4. Job Aggregation Engine (Pakistan Focus)
* **FR-4.1**: The system must query the Adzuna API daily for jobs with the country code `pk` (Pakistan).
* **FR-4.2**: The system must run targeted scrapers for local boards (e.g., scraping job titles/descriptions from static sites or feeds) while respecting `robots.txt`.
* **FR-4.3**: Jobs must be deduplicated based on title, company, and location.
* **FR-4.4**: Jobs must be normalized to standard fields (Title, Company, Location, Description, Skills Required, Source URL, Posted Date).
* **FR-4.5**: Expired jobs (older than 30 days) must be archived or soft-deleted automatically.

### 5. Matching & Recommendation Engine
* **FR-5.1**: The system must calculate a match score (0% to 100%) for each user against all active jobs.
* **FR-5.2**: The matching algorithm must weigh:
  * **Exact skill match**: 50%
  * **Location alignment** (e.g., user wants Lahore, job is in Lahore): 20%
  * **Role/title alignment**: 15%
  * **Job recency** (jobs posted in the last 3 days get a boost): 15%
* **FR-5.3**: The system must generate a human-readable explanation of the match (e.g., "Matches 4/5 of your skills; matches your preference for Remote work").

### 6. Skill-Gap Analysis & Learning Recommendations
* **FR-6.1**: The system must identify skills specified in the job post that the user lacks.
* **FR-6.2**: The system must display these missing skills clearly on the job detail modal.
* **FR-6.3**: The system must provide links to free learning resources (e.g., freeCodeCamp, YouTube, Coursera free courses) for each missing skill.

### 7. Notification System
* **FR-7.1**: The system must trigger daily notifications to users with new matches scoring above 70%.
* **FR-7.2**: Email notifications must be delivered via Resend.
* **FR-7.3**: Telegram notifications must be delivered via a Telegram Bot API.
* **FR-7.4**: Users must be able to opt-in/opt-out or change notification frequency.

### 8. User Dashboard & Bookmarking
* **FR-8.1**: The dashboard must display recommended jobs sorted by match score.
* **FR-8.2**: Users must be able to filter jobs by location, role type (remote/onsite), and score.
* **FR-8.3**: Users must be able to bookmark/save jobs for later application.
* **FR-8.4**: Users must be able to mark a bookmarked job as "Applied".

---

## Non-Functional Requirements

### 1. Performance & Usability
* **NFR-1.1**: Page loads on the Next.js frontend must take under 2 seconds.
* **NFR-1.2**: Resume parsing and profile generation must complete within 5 seconds.
* **NFR-1.3**: The layout must be fully responsive, supporting mobile devices, tablets, and desktops.
* **NFR-1.4**: UI styling must be clean, modern, and built using Vanilla CSS (CSS Modules) to avoid external styling bloat.

### 2. Cost Constraints
* **NFR-2.1**: The operational cost of the system must be $0/month.
* **NFR-2.2**: Supabase database (free tier, 500MB) must be optimized (index design, text compression where possible).
* **NFR-2.3**: Vercel free hosting (hobby tier) must be used.
* **NFR-2.4**: Free APIs (Adzuna developer key, Resend free tier of 3,000 emails/month) must be utilized.

### 3. Reliability & Fault Tolerance
* **NFR-3.1**: The job search scraper must handle API failures gracefully without failing the entire cron execution.
* **NFR-3.2**: Resume parsing must handle corrupted or image-only PDFs without crashing, returning an informative error message.
* **NFR-3.3**: Database transactions must be used to ensure data consistency during user sign-up and resume upload.

### 4. Security & Privacy
* **NFR-4.1**: User passwords must be managed securely by Supabase (cryptographic hashing).
* **NFR-4.2**: Supabase Row-Level Security (RLS) policies must be enabled on all user-specific tables (resumes, notifications, bookmarks).
* **NFR-4.3**: All user-uploaded resumes must be stored in secure private storage buckets.
* **NFR-4.4**: Scrapers must restrict themselves to publicly available job listings and respect rate limits.

---

## Risks & Mitigation Strategies

| Risk Category | Specific Risk | Impact | Mitigation Strategy |
| ------------- | ------------- | ------ | ------------------- |
| **Technical** | Image-only (scanned) PDFs cannot be parsed by PyMuPDF text extraction. | High | Detect text-less PDFs and notify the user to upload a text-based PDF or enter details manually. |
| **Scraping** | Target job sites block scrapers or change their HTML layout. | Medium | Rely heavily on robust public APIs (Adzuna PK) first. Use simple CSS-selector scrapers for local sites and log errors without crashing. |
| **Cost** | Supabase free tier limits database size to 500MB. | High | Automatically archive or delete jobs older than 30 days. Store raw resume text efficiently or discard it after skill extraction. |
| **Legal** | Scraping job listings without permission. | Low | Scrape only public feeds and open listings. Include a clear source attribution link to the original job board. |
| **Scalability**| Heavy NLP processes (spaCy) exceed serverless memory/time limits. | Medium | Use a lightweight Python service (FastAPI) or run parsing locally / lightweight regex-based tokenization in JS if serverless limits are hit. |
