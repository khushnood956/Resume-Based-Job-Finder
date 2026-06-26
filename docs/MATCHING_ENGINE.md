# Matching Engine Specification

The Matching Engine calculates the relevance score (0-100%) between a candidate profile and a job listing.

## Scoring Formula & Weights

The overall compatibility score is composed of four primary dimensions:

$$\text{Total Score} = \text{Skills Score (50)} + \text{Location Score (15)} + \text{Work Type Score (20)} + \text{Recency \& Level Score (15)}$$

---

### 1. Skills Matching (Maximum: 50 points)
This section evaluates how many of the required job skills the user possesses.

* Let $S_{user}$ be the set of user's skills.
* Let $S_{job}$ be the set of required skills for a job.
* The matching ratio is calculated as:
  
  $$\text{Match Ratio} = \frac{|S_{user} \cap S_{job}|}{|S_{job}|}$$

* **Scoring Rules**:
  * If the job requires no skills ($|S_{job}| = 0$): Default to a neutral score of **35 points**.
  * Otherwise: $\text{Skills Score} = \text{Match Ratio} \times 50$.
  * We also support **Related Tech Aliases** (e.g., if a job asks for `Postgres` and the user has `PostgreSQL`, or `Next.js` and `React`, we count it as a partial/full match using a tech-family database mapping).

---

### 2. Work Type Alignment (Maximum: 20 points)
Compares the user's workspace preference (Remote / Onsite / Hybrid) against the job type.

| User Preference | Job Type | Match Points | Description |
| --------------- | -------- | ------------ | ----------- |
| Remote Preferred| Remote   | **20**       | Perfect match. |
| Remote Preferred| Onsite   | **5**        | Soft mismatch (user prefers remote but may relocate). |
| Onsite Preferred| Onsite (Same City) | **20** | Perfect match. |
| Onsite Preferred| Onsite (Diff City) | **0** | Location mismatch. |
| Hybrid Preferred| Hybrid/Onsite (Same City) | **20** | Good match. |
| Any / Hybrid    | Remote   | **20**       | Remote matches all preferences. |

---

### 3. Location Alignment (Maximum: 15 points)
Evaluates geographic proximity for onsite or hybrid jobs in Pakistan.

* **Match Rules**:
  * If the job is **Remote**: Automatic **15 points** (geographic location does not matter).
  * If the job is **Onsite/Hybrid** and matches the user's preferred city (e.g., Job in Lahore, User prefers Lahore): **15 points**.
  * If the job is in a different city: **0 points**.

---

### 4. Recency & Experience Level Match (Maximum: 15 points)

#### A. Experience Alignment (10 points)
Matches user's experience level (`internship`, `fresh`, `junior`, `mid`) against the job requirements:
* If job title contains keywords aligned with user level:
  * User `internship` $\rightarrow$ Job contains `"intern"`, `"co-op"`: **10 points**
  * User `fresh` / `entry` $\rightarrow$ Job contains `"fresh"`, `"junior"`, `"entry"`, `"associate"`, `"trainee"`: **10 points**
* If there is an experience mismatch (e.g., user is fresh, job title contains `"senior"`, `"lead"`, `"manager"`): **2 points**
* Default (neutral / no keywords): **7 points**

#### B. Recency Bonus (5 points)
Promotes fresh opportunities:
* Job posted within **3 days**: **5 points**
* Job posted within **7 days**: **3 points**
* Job posted older than **7 days**: **0 points**

---

## SQL Implementation (Supabase View / RPC)

To achieve maximum performance and avoid pulling thousands of job descriptions into a JavaScript runtime to calculate scores, we implement the matching engine inside PostgreSQL using a Stored Procedure (RPC) or SQL query.

```sql
CREATE OR REPLACE FUNCTION get_job_recommendations(usr_id UUID, min_score INT, limit_num INT, offset_num INT)
RETURNS TABLE (
    job_id UUID,
    title VARCHAR,
    company VARCHAR,
    location VARCHAR,
    is_remote BOOLEAN,
    salary VARCHAR,
    url VARCHAR,
    posted_at TIMESTAMP WITH TIME ZONE,
    match_score INT,
    match_explanation TEXT,
    missing_skills VARCHAR[]
) AS $$
DECLARE
    usr_skills UUID[];
    usr_loc VARCHAR;
    usr_remote BOOLEAN;
    usr_exp VARCHAR;
BEGIN
    -- 1. Cache user preferences
    SELECT ARRAY(SELECT skill_id FROM user_skills WHERE user_id = usr_id) INTO usr_skills;
    SELECT location, is_remote_pref, experience_level 
      INTO usr_loc, usr_remote, usr_exp 
      FROM profiles WHERE id = usr_id;

    RETURN QUERY
    WITH job_stats AS (
        -- Calculate matching skill ratios and capture missing skills
        SELECT 
            j.id AS j_id,
            ARRAY_AGG(s.name) FILTER (WHERE s.id IS NOT NULL AND NOT (s.id = ANY(usr_skills))) AS missing_names,
            COUNT(js.skill_id) AS total_job_skills,
            COUNT(js.skill_id) FILTER (WHERE js.skill_id = ANY(usr_skills)) AS matched_job_skills
        FROM jobs j
        LEFT JOIN job_skills js ON j.id = js.job_id
        LEFT JOIN skills s ON js.skill_id = s.id
        GROUP BY j.id
    ),
    scored_jobs AS (
        SELECT 
            j.id AS j_id,
            -- Calculate Skill Points (Max 50)
            CASE 
                WHEN js.total_job_skills = 0 THEN 35
                ELSE (js.matched_job_skills::float / js.total_job_skills::float * 50)::int
            END AS skill_pts,

            -- Calculate Location Points (Max 15)
            CASE 
                WHEN j.is_remote = true THEN 15
                WHEN LOWER(j.location) = LOWER(usr_loc) THEN 15
                ELSE 0
            END AS loc_pts,

            -- Calculate Work Type Points (Max 20)
            CASE 
                WHEN j.is_remote = true AND usr_remote = true THEN 20
                WHEN j.is_remote = false AND LOWER(j.location) = LOWER(usr_loc) THEN 20
                ELSE 5
            END AS work_pts,

            -- Calculate Experience Level & Recency (Max 15)
            (
                CASE 
                    -- Experience Match (10 pts)
                    WHEN usr_exp = 'internship' AND (LOWER(j.title) LIKE '%intern%' OR LOWER(j.title) LIKE '%co-op%') THEN 10
                    WHEN usr_exp IN ('fresh', 'entry') AND (LOWER(j.title) LIKE '%junior%' OR LOWER(j.title) LIKE '%fresh%' OR LOWER(j.title) LIKE '%entry%' OR LOWER(j.title) LIKE '%associate%') THEN 10
                    WHEN usr_exp IN ('fresh', 'entry') AND (LOWER(j.title) LIKE '%senior%' OR LOWER(j.title) LIKE '%lead%' OR LOWER(j.title) LIKE '%manager%') THEN 2
                    ELSE 7
                END +
                CASE
                    -- Recency Match (5 pts)
                    WHEN j.posted_at >= NOW() - INTERVAL '3 days' THEN 5
                    WHEN j.posted_at >= NOW() - INTERVAL '7 days' THEN 3
                    ELSE 0
                END
            ) AS recency_exp_pts,
            js.missing_names
        FROM jobs j
        JOIN job_stats js ON j.id = js.j_id
    )
    SELECT 
        j.id AS job_id,
        j.title,
        j.company,
        j.location,
        j.is_remote,
        j.salary,
        j.url,
        j.posted_at,
        (sj.skill_pts + sj.loc_pts + sj.work_pts + sj.recency_exp_pts) AS match_score,
        CONCAT(
            'Matched ', (sj.skill_pts::float / 50 * 100)::int, '% of skills. ',
            CASE WHEN j.is_remote = true THEN 'Remote job matching preferences. '
                 WHEN LOWER(j.location) = LOWER(usr_loc) THEN 'Located in your preferred city (' || j.location || '). '
                 ELSE 'Located outside your preferred city. '
            END
        ) AS match_explanation,
        sj.missing_names AS missing_skills
    FROM jobs j
    JOIN scored_jobs sj ON j.id = sj.j_id
    WHERE (sj.skill_pts + sj.loc_pts + sj.work_pts + sj.recency_exp_pts) >= min_score
    ORDER BY match_score DESC, j.posted_at DESC
    LIMIT limit_num OFFSET offset_num;
END;
$$ LANGUAGE plpgsql;
```
