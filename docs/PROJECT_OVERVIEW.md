# Project Overview: Resume-to-Opportunities Engine (Pakistan)

## Purpose
The **Resume-to-Opportunities Engine** is an intelligent, low-cost (target $0/month) platform that automates the job search and matching process for students, fresh graduates, and junior professionals in Pakistan. By uploading their resume once, users receive personalized job recommendations, detailed skill-gap analyses, and automated daily alerts for relevant onsite and remote opportunities across Pakistan.

## Problem Statement
Finding entry-level jobs and internships in Pakistan is a fragmented and time-consuming process. Job seekers must navigate multiple portals (Rozee.pk, Mustakbil, Indeed PK, LinkedIn, and local WhatsApp/Facebook groups), manually filter through irrelevant or expired posts, and tailor their resumes without clear insights into what skills they are missing. Existing platforms do not provide personalized skill-gap analysis or automated cross-platform matching tailored to the Pakistani tech and business landscape.

## Target Users
* **Pakistani Students & Fresh Graduates** looking for internships or first jobs in Karachi, Lahore, Islamabad, Faisalabad, Peshawar, Rawalpindi, and other major cities.
* **Junior Software Engineers & Tech Professionals** seeking entry-level roles or remote global opportunities that match their tech stacks.
* **Career Switchers** looking for guidance on what skills they need to transition into new roles.

## Core Features
1. **Automated Resume Upload & Parsing**: Extract text from PDF resumes using PyMuPDF and analyze sections using NLP.
2. **Pakistani-Targeted Skill Extraction**: Detect technical and soft skills using a curated Pakistani-market-relevant dictionary (e.g., MERN stack, Laravel, Flutter, Django, WordPress, basic accounting, digital marketing).
3. **Automated Job Search Engine**: Aggregates onsite jobs in Pakistan and remote opportunities from public APIs (like Adzuna PK) and selected local scrapers.
4. **Intelligent Matching & Scoring Engine**: Compares candidate skills, location preferences, role types (remote/onsite), and experience level against job posts, generating a compatibility score (0-100%) and an explanation of the match.
5. **Skill-Gap Analysis**: Identifies missing skills for recommended jobs and provides curated free learning resource links (e.g., Coursera, YouTube, freeCodeCamp).
6. **Notification System**: Sends daily email alerts (via Resend) or Telegram updates detailing matching jobs and missing skills.
7. **Interactive Dashboard**: View recommendations, track skill-gap progress, bookmark jobs, and view job search history.

## Future Features
* **AI-Assisted Resume Tailoring**: Automatically generate custom resume suggestions for a specific job post.
* **Semantic Search**: Use pgvector embeddings for similarity matching instead of keyword matching.
* **Interview Prep & Coding Roadmaps**: Generate customized mock interview questions based on the skill gaps identified.

## Constraints
* **Budget**: $0/month (utilizing Vercel free tier, Supabase free tier, Resend free tier, GitHub Actions, and free developer APIs).
* **Performance**: Under 3 seconds for resume parsing and matching.
* **Scraping Policies**: Respect robots.txt and site terms of service when scraping local Pakistani job boards.

## Success Criteria
* Successful parsing of standard PDF resumes with at least 85% skill extraction accuracy.
* Aggregation of at least 100+ fresh Pakistani/remote job opportunities daily.
* Relevant matching scores that correlate with candidate profiles.
* Zero-cost deployment on Vercel and Supabase.
