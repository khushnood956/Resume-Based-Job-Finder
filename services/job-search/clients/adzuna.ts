import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

export interface RawJob {
  title: string;
  company: string;
  location: string;
  is_remote: boolean;
  description: string;
  url: string;
  salary: string;
  posted_at: string;
}

export async function fetchAdzunaJobs(limit: number = 20): Promise<RawJob[]> {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    console.warn('Adzuna API credentials not configured. Generating mock Pakistan job listings...');
    return getMockPakistanJobs();
  }

  try {
    // Search endpoint for Pakistan (pk)
    const url = `https://api.adzuna.com/v1/api/jobs/pk/search/1`;
    const response = await axios.get(url, {
      params: {
        app_id: appId,
        app_key: appKey,
        results_per_page: limit,
        what: 'developer software engineer programmer IT', // search terms
        'content-type': 'application/json'
      }
    });

    const results = response.data.results || [];
    return results.map((job: any) => {
      const isRemote = job.title.toLowerCase().includes('remote') || 
                       job.description?.toLowerCase().includes('remote');
      const location = job.location?.display_name || 'Pakistan';
      
      return {
        title: job.title,
        company: job.company?.display_name || 'Confidential Company',
        location: isRemote ? 'Remote' : location.split(',')[0].trim(),
        is_remote: isRemote,
        description: job.description || '',
        url: job.redirect_url,
        salary: job.salary_min ? `Rs. ${Math.round(job.salary_min).toLocaleString()}` : 'Market Competitive',
        posted_at: job.created || new Date().toISOString()
      };
    });

  } catch (error: any) {
    console.error('Failed to fetch from Adzuna API, falling back to mock listings:', error.message);
    return getMockPakistanJobs();
  }
}

function getMockPakistanJobs(): RawJob[] {
  const currentYear = new Date().getFullYear();
  return [
    {
      title: "Junior React Developer",
      company: "TechLogix",
      location: "Lahore",
      is_remote: false,
      description: "We are looking for a Junior React Developer. Familiarity with HTML, CSS, JavaScript, React, Git, and Docker is highly preferred. Laravel knowledge is a plus.",
      url: "https://techlogix.com/careers/jr-react-dev",
      salary: "Rs. 80,000 - 110,000",
      posted_at: new Date().toISOString()
    },
    {
      title: "Laravel Backend Engineer",
      company: "Systems Limited",
      location: "Karachi",
      is_remote: false,
      description: "Systems Limited is hiring a Laravel Backend Engineer. Must know PHP, Laravel, MySQL, and REST APIs. Docker or AWS experience is bonus.",
      url: "https://systemsltd.com/careers/laravel-eng",
      salary: "Rs. 100,000 - 150,000",
      posted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      title: "Remote Flutter Developer",
      company: "Devsinc",
      location: "Remote",
      is_remote: true,
      description: "Hiring Flutter developers for remote roles. Must have experience building Android and iOS apps, Flutter, Dart, Firebase, and State Management (Bloc/Provider).",
      url: "https://devsinc.com/careers/flutter-remote",
      salary: "Rs. 120,000 - 180,000",
      posted_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      title: "Django & Python Developer",
      company: "NetSol Technologies",
      location: "Lahore",
      is_remote: false,
      description: "NetSol is seeking a Python Developer with Django experience. Must know Python, Django, PostgreSQL, Git, and Linux. Experience in FAST API is a plus.",
      url: "https://netsoltech.com/careers/django-python",
      salary: "Rs. 110,000 - 160,000",
      posted_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      title: "SEO & Content Writing Executive",
      company: "Creative Chaos",
      location: "Karachi",
      is_remote: false,
      description: "Hiring for an SEO expert who excels in digital marketing, copywriting, content writing, WordPress, and Excel data tracking.",
      url: "https://creativechaos.co/careers/seo-content",
      salary: "Rs. 60,000 - 90,000",
      posted_at: new Date().toISOString()
    },
    {
      title: "UI/UX Graphic Designer",
      company: "Arbisoft",
      location: "Islamabad",
      is_remote: false,
      description: "Hiring a UI/UX Designer who can work with Figma, Adobe XD, Photoshop, and Graphic Design layouts. HTML/CSS understanding is a strong plus.",
      url: "https://arbisoft.com/careers/uiux-designer",
      salary: "Rs. 90,000 - 140,000",
      posted_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      title: "Next.js Full Stack Engineer",
      company: "Contour Software",
      location: "Islamabad",
      is_remote: false,
      description: "Hiring a Full Stack Developer. Stacks: React, Next.js, Node.js, TypeScript, and MongoDB. Must have Git and CI/CD workflow experience.",
      url: "https://contour.com.pk/careers/nextjs-dev",
      salary: "Rs. 130,000 - 200,000",
      posted_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
}
