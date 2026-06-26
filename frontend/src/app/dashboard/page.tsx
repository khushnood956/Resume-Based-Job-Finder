"use client";

import { useState, useEffect } from 'react';

interface JobOpportunity {
  id: string;
  title: string;
  company: string;
  location: string;
  is_remote: boolean;
  salary: string;
  url: string;
  match_score: number;
  match_explanation: string;
  missing_skills: string[];
  posted_at: string;
}

export default function DashboardPage() {
  const [jobs, setJobs] = useState<JobOpportunity[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<JobOpportunity[]>([]);
  const [search, setSearch] = useState('');
  const [cityFilter, setCityFilter] = useState('All');
  const [minScore, setMinScore] = useState(50);
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [selectedJob, setSelectedJob] = useState<JobOpportunity | null>(null);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [userName, setUserName] = useState('Candidate');

  // Load profile and jobs
  useEffect(() => {
    const cachedName = localStorage.getItem('user_name');
    if (cachedName) setUserName(cachedName);

    // Fetch jobs from server API if active, otherwise run sandbox calculations
    fetch('/api/jobs/recommendations', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}` }
    })
      .then(res => res.json())
      .then(data => {
        if (data.jobs) {
          setJobs(data.jobs);
        } else {
          runSandboxMatching();
        }
      })
      .catch(() => {
        runSandboxMatching();
      });

    // Load bookmarks
    const cachedBookmarks = localStorage.getItem('bookmarked_ids');
    if (cachedBookmarks) setBookmarks(JSON.parse(cachedBookmarks));
  }, []);

  const runSandboxMatching = () => {
    // 1. Load mock jobs (schema matches adzuna fetchers)
    const mockJobs = getMockData();

    // 2. Fetch user preferences from local storage
    const userSkills = JSON.parse(localStorage.getItem('profile_skills') || '["React", "JavaScript", "HTML", "CSS", "Python", "Git"]');
    const userLocation = localStorage.getItem('profile_location') || 'Lahore';
    const userExperience = localStorage.getItem('profile_experience') || 'entry';
    const userRemotePref = localStorage.getItem('profile_remote') !== 'false';

    const userSkillsSet = new Set(userSkills.map((s: string) => s.toLowerCase()));

    // 3. Replicate matching scoring math (Max 100 points)
    const calculated = mockJobs.map((job): JobOpportunity => {
      // Analyze skills (Max 50)
      const jobSkills = getRequiredSkillsForMockJob(job.title, job.description);
      const matched = jobSkills.filter((s: string) => userSkillsSet.has(s.toLowerCase()));
      const skillScore = jobSkills.length === 0 ? 35 : Math.round((matched.length / jobSkills.length) * 50);
      const missingSkills = jobSkills.filter((s: string) => !userSkillsSet.has(s.toLowerCase()));

      // Analyze Work Type (Max 20)
      let workTypeScore = 5;
      if (job.is_remote && userRemotePref) {
        workTypeScore = 20;
      } else if (!job.is_remote && job.location.toLowerCase() === userLocation.toLowerCase()) {
        workTypeScore = 20;
      } else if (job.is_remote) {
        workTypeScore = 20; // Remote matches all
      }

      // Analyze Location proximity (Max 15)
      const locationScore = (job.is_remote || job.location.toLowerCase() === userLocation.toLowerCase()) ? 15 : 0;

      // Analyze Experience Alignment & Recency (Max 15)
      let expScore = 7;
      const titleLower = job.title.toLowerCase();
      if (userExperience === 'internship' && (titleLower.includes('intern') || titleLower.includes('co-op'))) {
        expScore = 10;
      } else if (userExperience === 'entry' && (titleLower.includes('junior') || titleLower.includes('fresh') || titleLower.includes('entry') || titleLower.includes('associate'))) {
        expScore = 10;
      } else if (userExperience === 'entry' && (titleLower.includes('senior') || titleLower.includes('lead') || titleLower.includes('manager'))) {
        expScore = 2;
      }
      const recencyScore = 5; // Simulating freshly posted job

      const totalScore = skillScore + workTypeScore + locationScore + expScore + recencyScore;

      return {
        id: job.id,
        title: job.title,
        company: job.company,
        location: job.location,
        is_remote: job.is_remote,
        salary: job.salary,
        url: job.url,
        match_score: Math.min(totalScore, 100),
        match_explanation: `Matched ${Math.round((matched.length / Math.max(jobSkills.length, 1)) * 100)}% of required skills. Located in ${job.location}.`,
        missing_skills: missingSkills,
        posted_at: job.posted_at
      };
    });

    // Sort by score desc
    calculated.sort((a, b) => b.match_score - a.match_score);
    setJobs(calculated);
  };

  // Run filters whenever dependencies change
  useEffect(() => {
    let result = [...jobs];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(j => j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q));
    }

    if (cityFilter !== 'All') {
      result = result.filter(j => j.location.toLowerCase() === cityFilter.toLowerCase());
    }

    if (remoteOnly) {
      result = result.filter(j => j.is_remote);
    }

    result = result.filter(j => j.match_score >= minScore);

    setFilteredJobs(result);
  }, [jobs, search, cityFilter, minScore, remoteOnly]);

  const toggleBookmark = (jobId: string) => {
    let newBookmarks = [...bookmarks];
    if (bookmarks.includes(jobId)) {
      newBookmarks = newBookmarks.filter(id => id !== jobId);
    } else {
      newBookmarks.push(jobId);
    }
    setBookmarks(newBookmarks);
    localStorage.setItem('bookmarked_ids', JSON.stringify(newBookmarks));
  };

  // Get learning links for missing skills
  const getLearningLink = (skill: string) => {
    const query = encodeURIComponent(`learn ${skill} tutorial freecodecamp`);
    return `https://www.google.com/search?q=${query}`;
  };

  return (
    <div className="container">
      {/* Header Info */}
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.4rem', color: 'var(--text-main)' }}>Assalam-o-Alaikum, {userName}!</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '0.25rem' }}>
          Here are your personalized onsite and remote job matches in Pakistan based on your resume.
        </p>
      </div>

      {/* Filters Layout */}
      <div className="premium-card" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '1.25rem',
          alignItems: 'end'
        }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Search Keyword</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. React, Engineer"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">City Preference</label>
            <select
              className="form-control"
              value={cityFilter}
              onChange={(e) => setCityFilter(e.target.value)}
            >
              <option value="All">All Cities</option>
              <option value="Lahore">Lahore</option>
              <option value="Karachi">Karachi</option>
              <option value="Islamabad">Islamabad</option>
              <option value="Remote">Remote Only</option>
            </select>
          </div>

          <div className="form-group" style={{ margin: 0 }}>
            <label className="form-label">Minimum Match Score: {minScore}%</label>
            <input
              type="range"
              min="30"
              max="100"
              className="form-control"
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value))}
              style={{ padding: 0 }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', height: '42px', paddingBottom: '0.25rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={remoteOnly}
                onChange={(e) => setRemoteOnly(e.target.checked)}
                style={{ width: '16px', height: '16px' }}
              />
              <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>Remote Matches Only</span>
            </label>
          </div>
        </div>
      </div>

      {/* Grid Feed */}
      <h3 style={{ fontSize: '1.4rem', color: 'var(--text-main)', marginBottom: '1rem' }}>
        Found {filteredJobs.length} matching opportunities
      </h3>

      <div className="card-grid">
        {filteredJobs.map(job => (
          <div key={job.id} className="premium-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
              <span className={`score-badge ${job.match_score >= 80 ? 'high' : ''}`}>
                {job.match_score}% Match
              </span>
              <button
                onClick={() => toggleBookmark(job.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                {bookmarks.includes(job.id) ? '⭐' : '☆'}
              </button>
            </div>

            <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>{job.title}</h3>
            <span style={{ color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.9rem' }}>{job.company}</span>
            
            <p style={{ margin: '1rem 0 0.5rem 0', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              📍 <strong>Location:</strong> {job.location} {job.is_remote ? '(Remote)' : ''}
            </p>
            <p style={{ margin: '0 0 1.25rem 0', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              💵 <strong>Salary:</strong> {job.salary}
            </p>

            <button
              className="btn btn-secondary"
              style={{ marginTop: 'auto', width: '100%' }}
              onClick={() => setSelectedJob(job)}
            >
              Analyze Match Details
            </button>
          </div>
        ))}
      </div>

      {/* Detail Slide-out Modal */}
      {selectedJob && (
        <div className="overlay" onClick={() => setSelectedJob(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.75rem' }}>{selectedJob.title}</h2>
              <button
                onClick={() => setSelectedJob(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.5rem',
                  cursor: 'pointer',
                  color: 'var(--text-secondary)'
                }}
              >
                ×
              </button>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', fontWeight: '600', marginBottom: '1.5rem' }}>
              🏢 {selectedJob.company} &nbsp;|&nbsp; 📍 {selectedJob.location}
            </p>

            <div style={{
              background: 'var(--background)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              marginBottom: '1.5rem',
              borderLeft: '4px solid var(--primary)'
            }}>
              <strong style={{ display: 'block', marginBottom: '0.5rem', fontSize: '1.05rem' }}>Compatibility Rating</strong>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                This role matches <strong>{selectedJob.match_score}%</strong> of your profile preferences. {selectedJob.match_explanation}
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <strong style={{ display: 'block', marginBottom: '0.75rem', fontSize: '1.05rem', color: 'var(--text-main)' }}>
                Missing Skills & Free Learning Roadmaps:
              </strong>
              {selectedJob.missing_skills.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {selectedJob.missing_skills.map(skill => (
                    <div key={skill} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'var(--danger-bg)',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)'
                    }}>
                      <span style={{ color: 'var(--danger-text)', fontWeight: '600', fontSize: '0.9rem' }}>
                        ⚠️ Missing: {skill}
                      </span>
                      <a
                        href={getLearningLink(skill)}
                        target="_blank"
                        className="btn btn-secondary"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem', borderRadius: 'var(--radius-sm)' }}
                      >
                        Free Tutorial Link 🔗
                      </a>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ color: 'var(--success)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  🎉 None! You possess all the skills required for this job post.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  toggleBookmark(selectedJob.id);
                  setSelectedJob(null);
                }}
              >
                {bookmarks.includes(selectedJob.id) ? '⭐ Bookmarked' : '☆ Bookmark Job'}
              </button>
              <a
                href={selectedJob.url}
                target="_blank"
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={() => setSelectedJob(null)}
              >
                Apply On External Platform 🚀
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function getMockData() {
  return [
    {
      id: "mock-1",
      title: "Junior React Developer",
      company: "TechLogix",
      location: "Lahore",
      is_remote: false,
      description: "Looking for Junior React developers. Familiarity with HTML, CSS, JavaScript, React, Git, and Docker is highly preferred.",
      salary: "Rs. 80,000 - 110,000",
      url: "https://techlogix.com/careers/jr-react-dev",
      posted_at: new Date().toISOString()
    },
    {
      id: "mock-2",
      title: "Laravel Backend Engineer",
      company: "Systems Limited",
      location: "Karachi",
      is_remote: false,
      description: "Laravel Backend Engineer. Must know PHP, Laravel, MySQL, and REST APIs. Docker or AWS experience is bonus.",
      salary: "Rs. 100,000 - 150,000",
      url: "https://systemsltd.com/careers/laravel-eng",
      posted_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "mock-3",
      title: "Remote Flutter Developer",
      company: "Devsinc",
      location: "Remote",
      is_remote: true,
      description: "Hiring Flutter developers. Must have experience building Android and iOS apps, Flutter, Dart, Firebase, and State Management (Bloc/Provider).",
      salary: "Rs. 120,000 - 180,000",
      url: "https://devsinc.com/careers/flutter-remote",
      posted_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "mock-4",
      title: "Django & Python Developer",
      company: "NetSol Technologies",
      location: "Lahore",
      is_remote: false,
      description: "Django Developer. Must know Python, Django, PostgreSQL, Git, and Linux. Experience in FAST API is a plus.",
      salary: "Rs. 110,000 - 160,000",
      url: "https://netsoltech.com/careers/django-python",
      posted_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "mock-5",
      title: "SEO & Content Writing Executive",
      company: "Creative Chaos",
      location: "Karachi",
      is_remote: false,
      description: "SEO expert who excels in digital marketing, copywriting, content writing, WordPress, and Excel data tracking.",
      salary: "Rs. 60,000 - 90,000",
      url: "https://creativechaos.co/careers/seo-content",
      posted_at: new Date().toISOString()
    },
    {
      id: "mock-6",
      title: "UI/UX Graphic Designer",
      company: "Arbisoft",
      location: "Islamabad",
      is_remote: false,
      description: "Hiring a UI/UX Designer who can work with Figma, Adobe XD, Photoshop, and Graphic Design layouts.",
      salary: "Rs. 90,000 - 140,000",
      url: "https://arbisoft.com/careers/uiux-designer",
      posted_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "mock-7",
      title: "Next.js Full Stack Engineer",
      company: "Contour Software",
      location: "Islamabad",
      is_remote: false,
      description: "Hiring a Full Stack Developer. Stacks: React, Next.js, Node.js, TypeScript, and MongoDB. Must have Git and CI/CD workflow experience.",
      salary: "Rs. 130,000 - 200,000",
      url: "https://contour.com.pk/careers/nextjs-dev",
      posted_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "mock-8",
      title: "Node.js API Specialist",
      company: "VentureDive",
      location: "Karachi",
      is_remote: false,
      description: "Backend Specialist focused on Node.js, Express, MongoDB, and Redis. Docker containers knowledge is preferred.",
      salary: "Rs. 110,000 - 170,000",
      url: "https://venturedive.com/careers/nodejs-backend",
      posted_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "mock-9",
      title: "PHP CodeIgniter Web Developer",
      company: "Strategic Systems",
      location: "Faisalabad",
      is_remote: false,
      description: "PHP Web Developer. Experience in CodeIgniter or Yii framework, MySQL databases, jQuery, HTML, and CSS layouts is mandatory.",
      salary: "Rs. 70,000 - 100,000",
      url: "https://stratsystems.com/careers/php-ci",
      posted_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "mock-10",
      title: "React Native Mobile Engineer",
      company: "Rolustech",
      location: "Remote",
      is_remote: true,
      description: "Looking for a Mobile Developer with experience in React Native, Redux, iOS/Android compilation, and TypeScript.",
      salary: "Rs. 120,000 - 170,000",
      url: "https://rolustech.com/careers/react-native-remote",
      posted_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "mock-11",
      title: "Associate DevOps Cloud Developer",
      company: "Symmetry Group",
      location: "Karachi",
      is_remote: false,
      description: "Join as a DevOps Associate. Key technologies: AWS Cloud services, Docker containers, Linux shells scripting, Git, and Jenkins pipelines.",
      salary: "Rs. 95,000 - 140,000",
      url: "https://symmetry.group/careers/devops-assoc",
      posted_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "mock-12",
      title: "WordPress Designer & Developer",
      company: "Gaditek",
      location: "Karachi",
      is_remote: false,
      description: "WordPress Webmaster required. Must be proficient in WordPress custom layouts design, Elementor, HTML, CSS, JavaScript, and SEO optimization.",
      salary: "Rs. 75,000 - 105,000",
      url: "https://gaditek.com/careers/wordpress-dev",
      posted_at: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "mock-13",
      title: "Python Data Science Intern",
      company: "10Pearls",
      location: "Lahore",
      is_remote: false,
      description: "We are offering a Python Data Analyst Internship. Candidates must have basic skills in Python programming, Excel data cleanups, SQL queries, and stats.",
      salary: "Rs. 30,000 - 45,000",
      url: "https://10pearls.com/careers/python-ds-intern",
      posted_at: new Date().toISOString()
    },
    {
      id: "mock-14",
      title: "Angular Frontend Specialist",
      company: "TRG Pakistan",
      location: "Karachi",
      is_remote: false,
      description: "Hiring an Angular developer. Must possess strong JavaScript, TypeScript, Angular, CSS grid, and RxJS state management knowledge.",
      salary: "Rs. 100,000 - 160,000",
      url: "https://trg.com/careers/angular-frontend",
      posted_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "mock-15",
      title: "Vue.js Web Developer",
      company: "Tintash",
      location: "Lahore",
      is_remote: false,
      description: "Hiring a Vue developer. Key skills: JavaScript, HTML5, Vue.js, Vuex, Tailwind CSS, Git, and REST integration workflows.",
      salary: "Rs. 85,000 - 120,000",
      url: "https://tintash.com/careers/vue-web",
      posted_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "mock-16",
      title: "Remote PHP WordPress Dev",
      company: "Remotebase",
      location: "Remote",
      is_remote: true,
      description: "Remotebase is hiring a Remote WordPress Developer. Required: PHP, WordPress, HTML/CSS, MySQL, and basic SEO marketing tools.",
      salary: "Rs. 110,000 - 160,000",
      url: "https://remotebase.com/careers/wp-php",
      posted_at: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "mock-17",
      title: "Python FastAPI Developer",
      company: "Arbisoft",
      location: "Remote",
      is_remote: true,
      description: "Looking for Python backend developer. Key stack: Python, FastAPI, PostgreSQL database modeling, Docker containers, and Git workflows.",
      salary: "Rs. 130,000 - 190,000",
      url: "https://arbisoft.com/careers/fastapi-py",
      posted_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "mock-18",
      title: "Quality Assurance Engineer",
      company: "Devsinc",
      location: "Lahore",
      is_remote: false,
      description: "SQA automation engineer. Stacks: Selenium, Java, SQL testing queries, QA reporting, and basic Python test scripting.",
      salary: "Rs. 80,000 - 120,000",
      url: "https://devsinc.com/careers/sqa-engineer",
      posted_at: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "mock-19",
      title: "Digital Marketing Specialist",
      company: "Creative Chaos",
      location: "Karachi",
      is_remote: false,
      description: "We are hiring for Digital Marketing. Must know SEO rules, Social Media Marketing campaigns, Copywriting, and Google Excel tracking.",
      salary: "Rs. 65,000 - 95,000",
      url: "https://creativechaos.co/careers/digital-marketing",
      posted_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "mock-20",
      title: "Java Spring Boot Engineer",
      company: "NetSol Technologies",
      location: "Lahore",
      is_remote: false,
      description: "Senior Java Developer. Stacks: Java, Spring Boot microservices, MySQL databases, Docker orchestration, and Kubernetes clusters.",
      salary: "Rs. 140,000 - 220,000",
      url: "https://netsoltech.com/careers/java-spring",
      posted_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString()
    }
  ];
}

function getRequiredSkillsForMockJob(title: string, description: string): string[] {
  const text = `${title} ${description}`.toLowerCase();
  const list = ['React', 'JavaScript', 'HTML', 'CSS', 'Python', 'Git', 'Docker', 'Laravel', 'PHP', 'MySQL', 'Flutter', 'Dart', 'Firebase', 'Django', 'PostgreSQL', 'SEO', 'WordPress', 'Excel', 'Figma', 'Adobe XD', 'Photoshop'];
  return list.filter(skill => text.includes(skill.toLowerCase()));
}
