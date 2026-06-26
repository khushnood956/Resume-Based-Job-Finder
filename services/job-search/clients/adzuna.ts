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
  return [
    {
      title: "Junior React Developer",
      company: "TechLogix",
      location: "Lahore",
      is_remote: false,
      description: "We are looking for a Junior React Developer. Familiarity with HTML, CSS, JavaScript, React, Git, and Docker is highly preferred.",
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
      description: "Hiring Flutter developers for remote roles. Must have experience building Android and iOS apps, Flutter, Dart, Firebase, and State Management.",
      url: "https://devsinc.com/careers/flutter-remote",
      salary: "Rs. 120,000 - 180,000",
      posted_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      title: "Django & Python Developer",
      company: "NetSol Technologies",
      location: "Lahore",
      is_remote: false,
      description: "NetSol is seeking a Python Developer with Django experience. Must know Python, Django, PostgreSQL, Git, and Linux. FastAPI is a plus.",
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
      description: "Hiring a UI/UX Designer who can work with Figma, Adobe XD, Photoshop, and Graphic Design layouts. HTML/CSS is a plus.",
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
    },
    {
      title: "Node.js API Specialist",
      company: "VentureDive",
      location: "Karachi",
      is_remote: false,
      description: "We are seeking a Backend Specialist focused on Node.js, Express, MongoDB, and Redis. Docker containers knowledge is preferred.",
      url: "https://venturedive.com/careers/nodejs-backend",
      salary: "Rs. 110,000 - 170,000",
      posted_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      title: "PHP CodeIgniter Web Developer",
      company: "Strategic Systems",
      location: "Faisalabad",
      is_remote: false,
      description: "Hiring a PHP Web Developer. Experience in CodeIgniter or Yii framework, MySQL databases, jQuery, HTML, and CSS layouts is mandatory.",
      url: "https://stratsystems.com/careers/php-ci",
      salary: "Rs. 70,000 - 100,000",
      posted_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      title: "React Native Mobile Engineer",
      company: "Rolustech",
      location: "Remote",
      is_remote: true,
      description: "Looking for a Mobile Developer with experience in React Native, Redux, iOS/Android compilation, and TypeScript.",
      url: "https://rolustech.com/careers/react-native-remote",
      salary: "Rs. 120,000 - 170,000",
      posted_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      title: "Associate DevOps Cloud Developer",
      company: "Symmetry Group",
      location: "Karachi",
      is_remote: false,
      description: "Join as a DevOps Associate. Key technologies: AWS Cloud services, Docker containers, Linux shells scripting, Git, and Jenkins pipelines.",
      url: "https://symmetry.group/careers/devops-assoc",
      salary: "Rs. 95,000 - 140,000",
      posted_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      title: "WordPress Designer & Developer",
      company: "Gaditek",
      location: "Karachi",
      is_remote: false,
      description: "WordPress Webmaster required. Must be proficient in WordPress custom layouts design, Elementor, HTML, CSS, JavaScript, and SEO optimization.",
      url: "https://gaditek.com/careers/wordpress-dev",
      salary: "Rs. 75,000 - 105,000",
      posted_at: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      title: "Python Data Science Intern",
      company: "10Pearls",
      location: "Lahore",
      is_remote: false,
      description: "We are offering a Python Data Analyst Internship. Candidates must have basic skills in Python programming, Excel data cleanups, SQL queries, and math/stats.",
      url: "https://10pearls.com/careers/python-ds-intern",
      salary: "Rs. 30,000 - 45,000",
      posted_at: new Date().toISOString()
    },
    {
      title: "Angular Frontend Specialist",
      company: "TRG Pakistan",
      location: "Karachi",
      is_remote: false,
      description: "Hiring an Angular developer. Must possess strong JavaScript, TypeScript, Angular, CSS grid, and RxJS state management knowledge.",
      url: "https://trg.com/careers/angular-frontend",
      salary: "Rs. 100,000 - 160,000",
      posted_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      title: "Vue.js Web Developer",
      company: "Tintash",
      location: "Lahore",
      is_remote: false,
      description: "Hiring a Vue developer. Key skills: JavaScript, HTML5, Vue.js, Vuex, Tailwind CSS, Git, and REST integration workflows.",
      url: "https://tintash.com/careers/vue-web",
      salary: "Rs. 85,000 - 120,000",
      posted_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      title: "Remote PHP WordPress Dev",
      company: "Remotebase",
      location: "Remote",
      is_remote: true,
      description: "Remotebase is hiring a Remote WordPress Developer. Required: PHP, WordPress, HTML/CSS, MySQL, and basic SEO marketing tools.",
      url: "https://remotebase.com/careers/wp-php",
      salary: "Rs. 110,000 - 160,000",
      posted_at: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      title: "Python FastAPI Developer",
      company: "Arbisoft",
      location: "Remote",
      is_remote: true,
      description: "Looking for Python backend developer. Key stack: Python, FastAPI, PostgreSQL database modeling, Docker containers, and Git workflows.",
      url: "https://arbisoft.com/careers/fastapi-py",
      salary: "Rs. 130,000 - 190,000",
      posted_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      title: "Quality Assurance Engineer",
      company: "Devsinc",
      location: "Lahore",
      is_remote: false,
      description: "SQA automation engineer. Stacks: Selenium, Java, SQL testing queries, QA reporting, and basic Python test scripting.",
      url: "https://devsinc.com/careers/sqa-engineer",
      salary: "Rs. 80,000 - 120,000",
      posted_at: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      title: "Digital Marketing Specialist",
      company: "Creative Chaos",
      location: "Karachi",
      is_remote: false,
      description: "We are hiring for Digital Marketing. Must know SEO rules, Social Media Marketing campaigns, Copywriting, and Google Excel tracking.",
      url: "https://creativechaos.co/careers/digital-marketing",
      salary: "Rs. 65,000 - 95,000",
      posted_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      title: "Java Spring Boot Engineer",
      company: "NetSol Technologies",
      location: "Lahore",
      is_remote: false,
      description: "Senior Java Developer. Stacks: Java, Spring Boot microservices, MySQL databases, Docker orchestration, and Kubernetes clusters.",
      url: "https://netsoltech.com/careers/java-spring",
      salary: "Rs. 140,000 - 220,000",
      posted_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
}
