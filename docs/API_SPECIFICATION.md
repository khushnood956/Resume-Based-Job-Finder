# API Specification

The platform consists of two API boundaries:
1. **Next.js Serverless APIs**: Exposed to the client for frontend interactions, authentication proxies, profile updates, and dashboard retrieval.
2. **FastAPI Parser Service**: A private or internal API service responsible for heavy CPU tasks (PDF text extraction and NLP-based parsing).

---

## FastAPI Resume Parser API

### 1. Parse Resume PDF
Extracts text and skills from an uploaded PDF file.
* **Endpoint**: `POST /api/v1/parse`
* **Content-Type**: `multipart/form-data`
* **Auth**: None (Internal microservice, protected by API token in headers)
* **Request Body**:
  * `file`: Binary PDF file (Max 5MB)
* **Response (200 OK)**:
  ```json
  {
    "status": "success",
    "filename": "resume.pdf",
    "extracted_text": "Full text of resume here...",
    "sections": {
      "education": "BS in Computer Science...",
      "experience": "Software Engineer at TechCorp...",
      "skills": "Python, React, PostgreSQL..."
    },
    "extracted_skills": [
      { "name": "Python", "category": "programming_languages" },
      { "name": "React", "category": "frameworks" },
      { "name": "PostgreSQL", "category": "databases" }
    ]
  }
  ```
* **Error Response (400 Bad Request)**:
  ```json
  {
    "status": "error",
    "message": "Invalid file format. Only PDF files are supported."
  }
  ```

---

## Next.js API Routes

### 1. Resume Upload & Processing
Uploads a resume to Supabase Storage and parses it.
* **Endpoint**: `POST /api/resume/upload`
* **Auth**: Required (Bearer JWT token)
* **Request Body**:
  * `file`: PDF file
* **Response (200 OK)**:
  ```json
  {
    "status": "success",
    "message": "Resume parsed and profile updated",
    "skills": [
      { "id": "uuid-1", "name": "Python" },
      { "id": "uuid-2", "name": "React" }
    ]
  }
  ```

### 2. Get User Profile & Skills
* **Endpoint**: `GET /api/profile`
* **Auth**: Required (Bearer JWT token)
* **Response (200 OK)**:
  ```json
  {
    "id": "user-uuid",
    "email": "user@example.com",
    "full_name": "Khushnood Ahmad",
    "location": "Lahore",
    "is_remote_pref": true,
    "experience_level": "entry",
    "skills": [
      { "id": "skill-uuid-1", "name": "Python", "category": "programming_languages" },
      { "id": "skill-uuid-2", "name": "React", "category": "frameworks" }
    ],
    "notification_email_active": true,
    "notification_telegram_active": false,
    "telegram_chat_id": null
  }
  ```

### 3. Update Profile Preferences
* **Endpoint**: `PUT /api/profile`
* **Auth**: Required (Bearer JWT token)
* **Request Body**:
  ```json
  {
    "full_name": "Khushnood Ahmad",
    "location": "Lahore",
    "is_remote_pref": true,
    "experience_level": "entry",
    "notification_email_active": true,
    "notification_telegram_active": false,
    "telegram_chat_id": "123456789"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "status": "success",
    "message": "Profile updated successfully"
  }
  ```

### 4. Add Skill to Profile
* **Endpoint**: `POST /api/profile/skills`
* **Auth**: Required (Bearer JWT token)
* **Request Body**:
  ```json
  {
    "skill_name": "FastAPI"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "status": "success",
    "skill": {
      "id": "new-skill-uuid",
      "name": "FastAPI",
      "category": "frameworks"
    }
  }
  ```

### 5. Remove Skill from Profile
* **Endpoint**: `DELETE /api/profile/skills`
* **Auth**: Required (Bearer JWT token)
* **Request Body**:
  ```json
  {
    "skill_id": "skill-uuid-1"
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "status": "success",
    "message": "Skill removed from profile"
  }
  ```

### 6. Get Recommended Jobs
Fetches matched opportunities for the logged-in user.
* **Endpoint**: `GET /api/jobs/recommendations`
* **Auth**: Required (Bearer JWT token)
* **Query Parameters**:
  * `page` (optional): Default `1`
  * `limit` (optional): Default `10`
  * `min_score` (optional): Default `50`
  * `location` (optional): e.g., `Lahore`, `Remote`
* **Response (200 OK)**:
  ```json
  {
    "jobs": [
      {
        "id": "job-uuid-1",
        "title": "Junior Full Stack Developer",
        "company": "Tech Logix",
        "location": "Lahore",
        "is_remote": false,
        "salary": "Rs. 80,000 - 120,000",
        "url": "https://example.com/job-1",
        "match_score": 85,
        "match_explanation": "Matches 4/5 skills, and matches location Lahore.",
        "missing_skills": ["Docker"],
        "posted_at": "2026-06-25T12:00:00Z"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 4,
      "total_items": 37
    }
  }
  ```

### 7. Toggle Job Bookmark / Status
* **Endpoint**: `POST /api/jobs/bookmark`
* **Auth**: Required (Bearer JWT token)
* **Request Body**:
  ```json
  {
    "job_id": "job-uuid-1",
    "status": "bookmarked" 
  }
  ```
* **Response (200 OK)**:
  ```json
  {
    "status": "success",
    "message": "Job bookmarked"
  }
  ```

### 8. Trigger Job Scraping, Matching & Alerts (Cron)
This endpoint runs daily, typically scheduled via GitHub Actions.
* **Endpoint**: `POST /api/cron/jobs`
* **Auth**: Required (API Key inside header: `Authorization: Bearer <CRON_SECRET_KEY>`)
* **Response (200 OK)**:
  ```json
  {
    "status": "success",
    "jobs_fetched": 142,
    "matches_generated": 84,
    "emails_sent": 12,
    "telegram_messages_sent": 8
  }
  ```
