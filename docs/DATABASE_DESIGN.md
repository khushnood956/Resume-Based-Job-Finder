# Database Design

The database utilizes PostgreSQL hosted on Supabase. It takes advantage of PostgreSQL's relational capabilities, indexes for high-speed searches, and Row-Level Security (RLS) for data isolation.

## Database Schema Diagram

```
+------------------+         +------------------+         +------------------+
|    profiles      |         |     resumes      |         |   user_skills    |
+------------------+         +------------------+         +------------------+
| id (PK, UUID)    | <-----+ | id (PK, UUID)    |         | id (PK, UUID)    |
| email            |         | user_id (FK)     | <-----+ | user_id (FK)     |
| full_name        |         | file_path        |         | skill_id (FK)    |---+
| location         |         | extracted_text   |         | created_at       |   |
| is_remote_pref   |         | created_at       |         +------------------+   |
| experience_level |         +------------------+                                |
| created_at       |                                                             |
+------------------+                                                             |
         ^                                                                       |
         |                                                                       v
         |                   +------------------+         +------------------+   |
         +------------------ |    bookmarks     |         |      skills      |   |
         |                   +------------------+         +------------------+   |
         |                   | id (PK, UUID)    |         | id (PK, UUID)    | <-+
         |                   | user_id (FK)     |         | name (UNIQUE)    |   |
         |                   | job_id (FK)      |         | category         |   |
         |                   | status (text)    |         +------------------+   |
         |                   | created_at       |                                |
         |                   +------------------+                                |
         |                                                                       |
         |                   +------------------+         +------------------+   |
         +------------------ |  notifications   |         |    job_skills    |   |
                             +------------------+         +------------------+   |
                             | id (PK, UUID)    |         | id (PK, UUID)    |   |
                             | user_id (FK)     |         | job_id (FK)      |   |
                             | job_id (FK)      |         | skill_id (FK)    | <-+
                             | match_score      |         +------------------+
                             | is_read          |
                             | created_at       |
                             +------------------+
```

## Table Specifications

### 1. `profiles`
Stores additional user profile details linked to the Supabase auth table.
* **Columns**:
  * `id`: `UUID` (Primary Key, references `auth.users.id` on delete cascade)
  * `email`: `VARCHAR(255)` (Not Null)
  * `full_name`: `VARCHAR(255)`
  * `location`: `VARCHAR(100)` (e.g., "Lahore", "Karachi")
  * `is_remote_pref`: `BOOLEAN` (Default: `true`)
  * `experience_level`: `VARCHAR(50)` (e.g., "internship", "entry", "mid", "senior")
  * `telegram_chat_id`: `VARCHAR(100)` (Null if Telegram not configured)
  * `notification_email_active`: `BOOLEAN` (Default: `true`)
  * `notification_telegram_active`: `BOOLEAN` (Default: `false`)
  * `created_at`: `TIMESTAMP WITH TIME ZONE` (Default: `now()`)

### 2. `resumes`
Stores references to files in Supabase Storage and raw extracted text.
* **Columns**:
  * `id`: `UUID` (Primary Key, Default: `uuid_generate_v4()`)
  * `user_id`: `UUID` (Foreign Key, references `profiles.id` on delete cascade)
  * `file_path`: `VARCHAR(512)` (Path inside Supabase Storage bucket)
  * `extracted_text`: `TEXT`
  * `created_at`: `TIMESTAMP WITH TIME ZONE` (Default: `now()`)

### 3. `skills`
Global table containing all normalized tech and soft skills.
* **Columns**:
  * `id`: `UUID` (Primary Key, Default: `uuid_generate_v4()`)
  * `name`: `VARCHAR(100)` (Unique, Case-insensitive unique via index)
  * `category`: `VARCHAR(50)` (e.g., "programming_languages", "frameworks", "databases", "tools", "soft_skills")
  * `created_at`: `TIMESTAMP WITH TIME ZONE` (Default: `now()`)

### 4. `user_skills`
Associates skills with users.
* **Columns**:
  * `id`: `UUID` (Primary Key, Default: `uuid_generate_v4()`)
  * `user_id`: `UUID` (Foreign Key, references `profiles.id` on delete cascade)
  * `skill_id`: `UUID` (Foreign Key, references `skills.id` on delete cascade)
  * `created_at`: `TIMESTAMP WITH TIME ZONE` (Default: `now()`)
* **Constraints**:
  * Unique constraint on `(user_id, skill_id)`

### 5. `jobs`
Stores normalized job listings.
* **Columns**:
  * `id`: `UUID` (Primary Key, Default: `uuid_generate_v4()`)
  * `title`: `VARCHAR(255)` (Not Null)
  * `company`: `VARCHAR(255)` (Not Null)
  * `location`: `VARCHAR(100)` (Not Null)
  * `is_remote`: `BOOLEAN` (Default: `false`)
  * `description`: `TEXT`
  * `url`: `VARCHAR(1024)` (Unique source URL to prevent duplicate scraping)
  * `source`: `VARCHAR(100)` (e.g., "adzuna_pk", "rozee_scraper")
  * `salary`: `VARCHAR(100)`
  * `posted_at`: `TIMESTAMP WITH TIME ZONE`
  * `created_at`: `TIMESTAMP WITH TIME ZONE` (Default: `now()`)

### 6. `job_skills`
Associates skills required by jobs.
* **Columns**:
  * `id`: `UUID` (Primary Key, Default: `uuid_generate_v4()`)
  * `job_id`: `UUID` (Foreign Key, references `jobs.id` on delete cascade)
  * `skill_id`: `UUID` (Foreign Key, references `skills.id` on delete cascade)
* **Constraints**:
  * Unique constraint on `(job_id, skill_id)`

### 7. `bookmarks`
Allows users to save jobs.
* **Columns**:
  * `id`: `UUID` (Primary Key, Default: `uuid_generate_v4()`)
  * `user_id`: `UUID` (Foreign Key, references `profiles.id` on delete cascade)
  * `job_id`: `UUID` (Foreign Key, references `jobs.id` on delete cascade)
  * `status`: `VARCHAR(50)` (Default: "bookmarked"; can be "applied", "interviewing", "rejected")
  * `created_at`: `TIMESTAMP WITH TIME ZONE` (Default: `now()`)
* **Constraints**:
  * Unique constraint on `(user_id, job_id)`

### 8. `notifications`
Stores generated job recommendation alerts.
* **Columns**:
  * `id`: `UUID` (Primary Key, Default: `uuid_generate_v4()`)
  * `user_id`: `UUID` (Foreign Key, references `profiles.id` on delete cascade)
  * `job_id`: `UUID` (Foreign Key, references `jobs.id` on delete cascade)
  * `match_score`: `INTEGER` (0 - 100)
  * `is_read`: `BOOLEAN` (Default: `false`)
  * `created_at`: `TIMESTAMP WITH TIME ZONE` (Default: `now()`)

---

## Indexes & Performance Tuning

To optimize query speeds, particularly when matching users to thousands of jobs, the following indexes are defined:

1. **`jobs_location_idx`**: Index on `jobs(location)` to support quick region searches.
2. **`jobs_is_remote_idx`**: Index on `jobs(is_remote)` to support remote-only filtering.
3. **`skills_name_idx`**: Unique case-insensitive index on lower(`skills.name`) to avoid duplicate skill entries.
4. **`job_skills_job_id_idx` & `job_skills_skill_id_idx`**: Indexes to make job-to-skill join resolutions rapid.
5. **`user_skills_user_id_idx` & `user_skills_skill_id_idx`**: Indexes to accelerate profile skill resolution.

---

## Row-Level Security (RLS) Policies

All tables containing user-specific data have RLS enabled:

* **`profiles`**:
  * Users can SELECT, UPDATE, or DELETE only their own row (`auth.uid() = id`).
* **`resumes`**:
  * Users can SELECT, INSERT, UPDATE, or DELETE only their own resumes (`auth.uid() = user_id`).
* **`user_skills`**:
  * Users can edit/delete only their own skill mappings (`auth.uid() = user_id`).
* **`bookmarks`**:
  * Users can SELECT, INSERT, UPDATE, or DELETE only their own bookmarks (`auth.uid() = user_id`).
* **`notifications`**:
  * Users can SELECT and UPDATE only their own notifications (`auth.uid() = user_id`).
* **`jobs` & `skills` & `job_skills`**:
  * RLS enabled, but standard users have read-only access (SELECT all rows). INSERT/UPDATE/DELETE is restricted to system service roles (cron job api keys / admin roles).
