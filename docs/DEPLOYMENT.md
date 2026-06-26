# Deployment Blueprint

The deployment setup utilizes free-tier developer services to operate at $0/month.

---

## 1. Hosting Platforms & Resource Limits

| Service | Hosting Target | Target Layer | Free Tier Limits |
| ------- | -------------- | ------------ | ---------------- |
| **Vercel** | Frontend Portal | Next.js Web App | 100 GB Bandwidth, 100 Projects, Serverless Execution max 10s. |
| **Supabase** | DB, Auth, Bucket | PostgreSQL, Storage | 500 MB Database, 1 GB Storage, 50,000 Monthly Users. |
| **Koyeb / Render** | Parser Service | FastAPI Backend | 512 MB RAM, 1 vCPU, Automatic spin-down after 15 mins of inactivity. |
| **GitHub Actions** | Job Engine Cron | Script Executor | 2,000 Actions Minutes/month (more than enough for daily 10-minute executions). |

---

## 2. Environment Variables configuration

Create matching configuration properties in the production settings:

### A. Next.js Frontend (`frontend/.env.local` / Vercel Settings)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
PARSER_SERVICE_URL=https://your-parser.koyeb.app
PARSER_API_TOKEN=your-random-shared-secret-token
CRON_SECRET_KEY=your-github-to-nextjs-secret-token
RESEND_API_KEY=re_your_resend_api_key
```

### B. FastAPI Parser (`services/resume-parser/.env` / Koyeb Settings)
```bash
API_TOKEN=your-random-shared-secret-token
```

### C. Job Search / Github Action secrets
```bash
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
ADZUNA_APP_ID=adzuna_id
ADZUNA_APP_KEY=adzuna_key
CRON_SECRET_KEY=your-github-to-nextjs-secret-token
```

---

## 3. Step-by-Step Deployment Guide

### Phase 1: Database Setup (Supabase)
1. Go to [supabase.com](https://supabase.com) and create a new project.
2. Open the SQL Editor and execute the schema initialization scripts (DDL) to create profiles, jobs, user_skills, bookmarks, etc.
3. Enable RLS on all tables and apply security policies.
4. Create a private storage bucket named `resumes`.

### Phase 2: Resume Parser Deploy (Koyeb / Render)
1. Create an account on Koyeb (free tier).
2. Connect your Git repository.
3. Configure the build command: `pip install -r requirements.txt` and start command: `uvicorn main:app --host 0.0.0.0 --port 8000`.
4. Set the environment variable `API_TOKEN`.

### Phase 3: Frontend Web Portal (Vercel)
1. Link your repository to Vercel.
2. Select Next.js project preset.
3. Input the required environment variables.
4. Deploy the application.

### Phase 4: Job Search Scheduler (GitHub Actions)
Add `.github/workflows/daily-scraper.yml` to your repository:

```yaml
name: Daily Job Aggregator & Matching

on:
  schedule:
    - cron: '0 0 * * *' # 5:00 AM PKT Daily
  workflow_dispatch: # Allows manual trigger

jobs:
  run-scraper:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install Dependencies
        run: |
          cd services/job-search
          npm install

      - name: Execute Aggregation
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
          ADZUNA_APP_ID: ${{ secrets.ADZUNA_APP_ID }}
          ADZUNA_APP_KEY: ${{ secrets.ADZUNA_APP_KEY }}
        run: |
          cd services/job-search
          npm run start
```
