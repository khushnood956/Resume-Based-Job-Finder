import { ApifyClient } from 'apify-client';
import * as dotenv from 'dotenv';
import { RawJob } from './adzuna';

dotenv.config();

export async function fetchIndeedApifyJobs(limit: number = 30): Promise<RawJob[]> {
  const token = process.env.APIFY_TOKEN;

  if (!token || token.startsWith('your_')) {
    console.warn('[Apify Client] APIFY_TOKEN is not configured. Skipping Indeed scraper run.');
    return [];
  }

  const client = new ApifyClient({ token });

  // Input configuration targeted for Pakistan (PK) job market
  const input = {
    position: "software developer web engineer react flutter django laravel php python node",
    maxItemsPerSearch: limit,
    country: "PK",
    location: "Pakistan",
    parseCompanyDetails: false,
    saveOnlyUniqueItems: true,
    followApplyRedirects: false
  };

  try {
    console.log("Triggering Apify Indeed Scraper Actor...");
    // Run the Actor and wait for it to finish (Actor ID: hMvNSpz3JnHgl5jkh)
    const run = await client.actor("hMvNSpz3JnHgl5jkh").call(input);

    console.log(`Apify Actor finished. Fetching items from dataset: ${run.defaultDatasetId}`);
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    
    console.log(`Apify fetched ${items.length} raw items.`);

    // Map Indeed items to standardized RawJob structure
    return items.map((item: any): RawJob => {
      const title = item.positionName || item.title || 'Software Developer';
      const company = item.company || item.companyName || 'Confidential Company';
      const rawLocation = item.location || 'Pakistan';
      
      const isRemote = title.toLowerCase().includes('remote') || 
                       rawLocation.toLowerCase().includes('remote') ||
                       item.jobDescription?.toLowerCase().includes('remote');

      const cleanLocation = isRemote ? 'Remote' : rawLocation.split(',')[0].trim();

      return {
        title,
        company,
        location: cleanLocation,
        is_remote: isRemote,
        description: item.jobDescription || item.description || '',
        url: item.url || item.jobUrl || `https://pk.indeed.com/jobs?q=${encodeURIComponent(title)}`,
        salary: item.salaryText || item.salary || 'Market Competitive',
        posted_at: item.postedAt || item.date || new Date().toISOString()
      };
    });

  } catch (error: any) {
    console.error('Failed to run Apify Indeed scraper actor:', error.message);
    return [];
  }
}
