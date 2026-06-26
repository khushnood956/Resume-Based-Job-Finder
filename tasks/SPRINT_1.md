# Sprint 1: Core Setup & Parsing Infrastructure

## Sprint Overview
* **Goal**: Establish repositories, spin up database schemas, and complete the Python resume parsing service.
* **Duration**: 2 Weeks

---

## Tasks

### TS-1.1: Next.js App Initialization
* **Task ID**: `TS-1.1`
* **Title**: Initialize Next.js frontend project structure
* **Description**: Create Next.js application using Tailwind/Vanilla setup (strictly Vanilla CSS per instructions) inside the root `frontend` folder. Define main routes and configure ESLint/TypeScript.
* **Dependencies**: None
* **Difficulty**: Easy
* **Estimated Time**: 2 hours
* **Acceptance Criteria**:
  - [x] App is initialized inside `frontend` using TypeScript and App Router.
  - [x] Running `npm run dev` builds the page.
  - [x] Strict type checking rules are enabled in `tsconfig.json`.
* **Deliverables**: Next.js boilerplate files.

### TS-1.2: Python Parser Environment
* **Task ID**: `TS-1.2`
* **Title**: Set up FastAPI environment and packages
* **Description**: Initialize python environment in `services/resume-parser`. Write standard dependencies (FastAPI, uvicorn, PyMuPDF, spaCy, pydantic) into `requirements.txt`.
* **Dependencies**: None
* **Difficulty**: Easy
* **Estimated Time**: 1 hour
* **Acceptance Criteria**:
  - [x] Virtual environment can be created and activated.
  - [x] All packages in `requirements.txt` install successfully.
  - [x] Boilerplate FastAPI application runs locally on port 8000.
* **Deliverables**: `services/resume-parser/requirements.txt`, `services/resume-parser/main.py`.

### TS-1.3: PDF Text Extraction
* **Task ID**: `TS-1.3`
* **Title**: Write PyMuPDF text extractor routine
* **Description**: Build a Python module that takes a PDF file stream, reads content page-by-page using PyMuPDF (`fitz`), and returns a sanitized plain-text string.
* **Dependencies**: `TS-1.2`
* **Difficulty**: Medium
* **Estimated Time**: 4 hours
* **Acceptance Criteria**:
  - [x] Can process multi-page resumes.
  - [x] Correctly reads multi-column templates.
  - [x] Cleans weird unicode control characters and handles image-only files gracefully (returns informative error).
* **Deliverables**: `services/resume-parser/extractor.py`, parser unit tests.

### TS-1.4: Skill Dictionary & Matching Logic
* **Task ID**: `TS-1.4`
* **Title**: Create extraction regex rules & dictionary
* **Description**: Build a curated skills JSON file. Write python logic utilizing custom regex boundaries to match text tokens against dictionary words without false positives (e.g. "go" inside "government").
* **Dependencies**: `TS-1.3`
* **Difficulty**: Hard
* **Estimated Time**: 8 hours
* **Acceptance Criteria**:
  - [x] Matches multi-word skills ("react native") before single-word matches.
  - [x] Avoids partial substring matches (e.g., does not match "java" when scanning "javascript").
  - [x] Correctly isolates developer symbol skills like "C++", "C#", and ".NET".
* **Deliverables**: `services/resume-parser/dictionary.json`, `services/resume-parser/parser.py`.

### TS-1.5: Supabase Setup & DDL Scripts
* **Task ID**: `TS-1.5`
* **Title**: Apply schema scripts to PostgreSQL
* **Description**: Setup database credentials. Execute `database/schema.sql` on Supabase database to instantiate tables, indexes, and user triggers.
* **Dependencies**: None
* **Difficulty**: Easy
* **Estimated Time**: 3 hours
* **Acceptance Criteria**:
  - [x] Tables are created with appropriate data types.
  - [x] Indexes are verified as active.
  - [x] Auth trigger is tested (adding user to Auth automatically creates a profile record).
* **Deliverables**: Active database schemas on Supabase.

### TS-1.6: Parser Endpoint Proxy in Next.js
* **Task ID**: `TS-1.6`
* **Title**: API proxy endpoint for resume uploads
* **Description**: Write Next.js API route `/api/resume/upload` which reads the multipart form file upload, saves the file in private Supabase Storage, and calls the FastAPI endpoint for parsing, returning structured skills.
* **Dependencies**: `TS-1.1`, `TS-1.4`, `TS-1.5`
* **Difficulty**: Medium
* **Estimated Time**: 6 hours
* **Acceptance Criteria**:
  - [x] Restricts uploads to PDF.
  - [x] Verifies file size limit (5MB).
  - [x] Files upload to private storage bucket named `resumes`.
  - [x] Returns list of parsed skills and sections.
* **Deliverables**: `frontend/src/app/api/resume/upload/route.ts`.
