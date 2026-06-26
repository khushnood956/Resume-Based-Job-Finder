-- Enable UUID extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255),
    location VARCHAR(100),
    is_remote_pref BOOLEAN DEFAULT TRUE,
    experience_level VARCHAR(50) DEFAULT 'entry',
    telegram_chat_id VARCHAR(100),
    notification_email_active BOOLEAN DEFAULT TRUE,
    notification_telegram_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. RESUMES Table
CREATE TABLE IF NOT EXISTS public.resumes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    file_path VARCHAR(512) NOT NULL,
    extracted_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. SKILLS Table
CREATE TABLE IF NOT EXISTS public.skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Unique constraint on lowercase skill name to avoid duplicate variations
CREATE UNIQUE INDEX IF NOT EXISTS skills_name_lower_idx ON public.skills (LOWER(name));

-- 4. USER_SKILLS Table
CREATE TABLE IF NOT EXISTS public.user_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT user_skills_user_skill_unique UNIQUE(user_id, skill_id)
);

-- 5. JOBS Table
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    location VARCHAR(100) NOT NULL,
    is_remote BOOLEAN DEFAULT FALSE NOT NULL,
    description TEXT,
    url VARCHAR(1024) NOT NULL UNIQUE,
    source VARCHAR(100) NOT NULL,
    salary VARCHAR(100),
    posted_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. JOB_SKILLS Table
CREATE TABLE IF NOT EXISTS public.job_skills (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    CONSTRAINT job_skills_job_skill_unique UNIQUE(job_id, skill_id)
);

-- 7. BOOKMARKS Table
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'bookmarked' NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT bookmarks_user_job_unique UNIQUE(user_id, job_id)
);

-- 8. NOTIFICATIONS Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    match_score INTEGER NOT NULL,
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS jobs_location_idx ON public.jobs (location);
CREATE INDEX IF NOT EXISTS jobs_is_remote_idx ON public.jobs (is_remote);
CREATE INDEX IF NOT EXISTS job_skills_job_id_idx ON public.job_skills (job_id);
CREATE INDEX IF NOT EXISTS job_skills_skill_id_idx ON public.job_skills (skill_id);
CREATE INDEX IF NOT EXISTS user_skills_user_id_idx ON public.user_skills (user_id);
CREATE INDEX IF NOT EXISTS user_skills_skill_id_idx ON public.user_skills (skill_id);

-- Profile Sync Trigger (Automatically create a public profile when a user signs up via Supabase Auth)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, location, is_remote_pref, experience_level)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', ''),
        'Remote',
        TRUE,
        'entry'
    );
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger definition
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Matching Engine PLpgSQL function
CREATE OR REPLACE FUNCTION public.get_job_recommendations(usr_id UUID, min_score INT, limit_num INT, offset_num INT)
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
    -- Cache user preferences
    SELECT ARRAY(SELECT skill_id FROM public.user_skills WHERE user_id = usr_id) INTO usr_skills;
    SELECT location, is_remote_pref, experience_level 
      INTO usr_loc, usr_remote, usr_exp 
      FROM public.profiles WHERE id = usr_id;

    RETURN QUERY
    WITH job_stats AS (
        SELECT 
            j.id AS j_id,
            ARRAY_AGG(s.name) FILTER (WHERE s.id IS NOT NULL AND NOT (s.id = ANY(usr_skills))) AS missing_names,
            COUNT(js.skill_id) AS total_job_skills,
            COUNT(js.skill_id) FILTER (WHERE js.skill_id = ANY(usr_skills)) AS matched_job_skills
        FROM public.jobs j
        LEFT JOIN public.job_skills js ON j.id = js.job_id
        LEFT JOIN public.skills s ON js.skill_id = s.id
        GROUP BY j.id
    ),
    scored_jobs AS (
        SELECT 
            j.id AS j_id,
            -- Skill Match (Max 50)
            CASE 
                WHEN js.total_job_skills = 0 THEN 35
                ELSE (js.matched_job_skills::float / js.total_job_skills::float * 50)::int
            END AS skill_pts,

            -- Location Alignment (Max 15)
            CASE 
                WHEN j.is_remote = TRUE THEN 15
                WHEN LOWER(j.location) = LOWER(usr_loc) THEN 15
                ELSE 0
            END AS loc_pts,

            -- Work Type Preference Match (Max 20)
            CASE 
                WHEN j.is_remote = TRUE AND usr_remote = TRUE THEN 20
                WHEN j.is_remote = FALSE AND LOWER(j.location) = LOWER(usr_loc) THEN 20
                ELSE 5
            END AS work_pts,

            -- Experience & Recency (Max 15)
            (
                CASE 
                    WHEN usr_exp = 'internship' AND (LOWER(j.title) LIKE '%intern%' OR LOWER(j.title) LIKE '%co-op%') THEN 10
                    WHEN usr_exp IN ('fresh', 'entry') AND (LOWER(j.title) LIKE '%junior%' OR LOWER(j.title) LIKE '%fresh%' OR LOWER(j.title) LIKE '%entry%' OR LOWER(j.title) LIKE '%associate%') THEN 10
                    WHEN usr_exp IN ('fresh', 'entry') AND (LOWER(j.title) LIKE '%senior%' OR LOWER(j.title) LIKE '%lead%' OR LOWER(j.title) LIKE '%manager%') THEN 2
                    ELSE 7
                END +
                CASE
                    WHEN j.posted_at >= NOW() - INTERVAL '3 days' THEN 5
                    WHEN j.posted_at >= NOW() - INTERVAL '7 days' THEN 3
                    ELSE 0
                END
            ) AS recency_exp_pts,
            js.missing_names
        FROM public.jobs j
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
            CASE WHEN j.is_remote = TRUE THEN 'Remote job matching preferences. '
                 WHEN LOWER(j.location) = LOWER(usr_loc) THEN 'Located in your preferred city (' || j.location || '). '
                 ELSE 'Located outside your preferred city. '
            END
        ) AS match_explanation,
        sj.missing_names AS missing_skills
    FROM public.jobs j
    JOIN scored_jobs sj ON j.id = sj.j_id
    WHERE (sj.skill_pts + sj.loc_pts + sj.work_pts + sj.recency_exp_pts) >= min_score
    ORDER BY match_score DESC, j.posted_at DESC
    LIMIT limit_num OFFSET offset_num;
END;
$$ LANGUAGE plpgsql;
