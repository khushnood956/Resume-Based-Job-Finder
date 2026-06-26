import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fetchAdzunaJobs } from './clients/adzuna';
import { tagJobSkills } from './utils/skill-tagger';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function syncJobs() {
  console.log("Starting job synchronization routine...");

  // 1. Fetch raw jobs
  const rawJobs = await fetchAdzunaJobs(30);
  console.log(`Fetched ${rawJobs.length} job listings.`);

  let insertedCount = 0;
  let skippedCount = 0;

  // 2. Loop through and save jobs
  for (const rawJob of rawJobs) {
    try {
      // Check if job already exists by URL
      const { data: existingJob } = await supabase
        .from('jobs')
        .select('id')
        .eq('url', rawJob.url)
        .maybeSingle();

      if (existingJob) {
        skippedCount++;
        continue;
      }

      // Insert job
      const { data: newJob, error: insertError } = await supabase
        .from('jobs')
        .insert({
          title: rawJob.title,
          company: rawJob.company,
          location: rawJob.location,
          is_remote: rawJob.is_remote,
          description: rawJob.description,
          url: rawJob.url,
          source: 'adzuna_pk',
          salary: rawJob.salary,
          posted_at: rawJob.posted_at
        })
        .select('id')
        .single();

      if (insertError || !newJob) {
        console.error(`Failed to insert job: ${rawJob.title}. Error: ${insertError?.message}`);
        continue;
      }

      // Tag skills
      const skillIds = await tagJobSkills(rawJob.title, rawJob.description, supabase);
      
      if (skillIds.length > 0) {
        // Link skills inside job_skills table
        const linkPromises = skillIds.map(skillId =>
          supabase.from('job_skills').insert({
            job_id: newJob.id,
            skill_id: skillId
          }).select()
        );
        
        await Promise.all(linkPromises);
      }

      insertedCount++;

    } catch (err: any) {
      console.error(`Error processing job sync for: ${rawJob.title}:`, err.message);
    }
  }

  console.log(`Sync complete. Inserted: ${insertedCount}, Skipped: ${skippedCount}`);
}

syncJobs()
  .then(() => process.exit(0))
  .catch(err => {
    console.error("Critical error in sync script:", err);
    process.exit(1);
  });
