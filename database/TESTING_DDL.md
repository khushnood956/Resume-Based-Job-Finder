# Supabase Database Verification & Testing Guide

Follow these steps to deploy and test your database schemas on Supabase.

---

## Step 1: Deploy the Database Schema
1. Open your project on the [Supabase Dashboard](https://supabase.com).
2. Go to the **SQL Editor** tab on the left sidebar.
3. Click **New Query** (or use the default blank editor).
4. Copy the entire contents of the schema definition file located at `database/schema.sql` in your project folder, paste it into the editor, and click **Run**.

---

## Step 2: Verification Queries

Run the following queries in a new SQL Editor tab to verify that the database is set up correctly.

### 1. Verify All Tables Exist
Run this query to check if the schema tables have been instantiated:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```
* **Expected Output**: You should see:
  - `bookmarks`
  - `job_skills`
  - `jobs`
  - `notifications`
  - `profiles`
  - `resumes`
  - `skills`
  - `user_skills`

### 2. Verify Indexes Are Active
Run this query to ensure database search indexes are created:
```sql
SELECT indexname, tablename, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename;
```
* **Expected Output**: Ensure indexes like `jobs_location_idx`, `jobs_is_remote_idx`, and case-insensitive unique indexes on skills exist.

---

## Step 3: Trigger & Function Integration Tests

Run these test queries to verify trigger actions and matching engine calculations.

### Test A: Verify User Auth Sync Trigger
This test checks if creating a user in Supabase Auth automatically creates a profile row in the public profile table.

1. **Insert a mock user into Auth**:
   ```sql
   INSERT INTO auth.users (id, email, raw_user_meta_data)
   VALUES (
     '00000000-0000-0000-0000-000000000001'::uuid, 
     'test_user@jobfinder.pk', 
     '{"full_name": "Test Candidate"}'::jsonb
   );
   ```
2. **Check if the trigger fired**:
   ```sql
      SELECT * FROM public.profiles 
      WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
   ```
* **Expected Output**: A row with email `test_user@jobfinder.pk` and full_name `"Test Candidate"` should have been automatically created in `public.profiles`.

---

### Test B: Seed Mock Skills & Candidate Profile
1. **Insert skills**:
   ```sql
   INSERT INTO public.skills (id, name, category) VALUES
   ('11111111-1111-1111-1111-111111111111'::uuid, 'React', 'frameworks'),
   ('22222222-2222-2222-2222-222222222222'::uuid, 'Python', 'programming_languages'),
   ('33333333-3333-3333-3333-333333333333'::uuid, 'Docker', 'devops_cloud')
   ON CONFLICT (id) DO NOTHING;
   ```
2. **Link candidate profile to React and Python (candidate is missing Docker)**:
   ```sql
   -- Set user's city preference to Lahore, Entry level
   UPDATE public.profiles 
   SET location = 'Lahore', experience_level = 'entry', is_remote_pref = true
   WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;

   -- Map skills
   INSERT INTO public.user_skills (user_id, skill_id) VALUES
   ('00000000-0000-0000-0000-000000000001'::uuid, '11111111-1111-1111-1111-111111111111'::uuid), -- React
   ('00000000-0000-0000-0000-000000000001'::uuid, '22222222-2222-2222-2222-222222222222'::uuid) -- Python
   ON CONFLICT (user_id, skill_id) DO NOTHING;
   ```

---

### Test C: Seed Mock Job Postings & Verify Matching Engine
This tests if the stored PLpgSQL function correctly scores opportunities based on skills, location, work type, and recency.

1. **Insert a matching job in Lahore (requires React, Python, Docker)**:
   ```sql
   INSERT INTO public.jobs (id, title, company, location, is_remote, url, source, posted_at)
   VALUES (
     '99999999-9999-9999-9999-999999999999'::uuid,
     'Junior Full Stack Developer',
     'TechLogix',
     'Lahore',
     false,
     'https://example.com/job-1',
     'test_script',
     NOW() -- posted today (recency bonus)
   )
   ON CONFLICT (id) DO NOTHING;

   -- Link required skills
   INSERT INTO public.job_skills (job_id, skill_id) VALUES
   ('99999999-9999-9999-9999-999999999999'::uuid, '11111111-1111-1111-1111-111111111111'::uuid), -- React
   ('99999999-9999-9999-9999-999999999999'::uuid, '22222222-2222-2222-2222-222222222222'::uuid), -- Python
   ('99999999-9999-9999-9999-999999999999'::uuid, '33333333-3333-3333-3333-333333333333'::uuid) -- Docker (Missing)
   ON CONFLICT (job_id, skill_id) DO NOTHING;
   ```

2. **Execute Matching RPC function**:
   Run this function query for the user ID to check recommendations:
   ```sql
   SELECT * FROM public.get_job_recommendations(
     '00000000-0000-0000-0000-000000000001'::uuid, -- user_id
     50, -- minimum match score (50%)
     10, -- limit results count
     0   -- offset
   );
   ```

* **Expected Output**:
  - The job `Junior Full Stack Developer` at `TechLogix` should appear.
  - **Match Score**: Should be around **83%** (33/50 for skills [2 out of 3 matched], 15/15 for location [Lahore matches], 20/20 for work type [same city onsite], 15/15 for recency and experience level [posted today, title contains "Junior"]).
  - **Missing Skills**: Should list `{"Docker"}`.
  - **Match Explanation**: Should read: `Matched 66% of skills. Located in your preferred city (Lahore).`

---

## Clean Up Test Data
Run this query to clean up all test entries from your database when verified:
```sql
DELETE FROM auth.users WHERE id = '00000000-0000-0000-0000-000000000001'::uuid;
DELETE FROM public.skills WHERE id IN ('11111111-1111-1111-1111-111111111111'::uuid, '22222222-2222-2222-2222-222222222222'::uuid, '33333333-3333-3333-3333-333333333333'::uuid);
DELETE FROM public.jobs WHERE id = '99999999-9999-9999-9999-999999999999'::uuid;
```
