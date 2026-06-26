"use client";

import { useState, useEffect } from 'react';

interface BookmarkedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  is_remote: boolean;
  salary: string;
  url: string;
  match_score: number;
  status: string; // bookmarked, applied, interviewing, offered, rejected
}

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<BookmarkedJob[]>([]);
  const [filterStatus, setFilterStatus] = useState('All');

  useEffect(() => {
    // Load bookmark definitions from localStorage
    const savedIds = JSON.parse(localStorage.getItem('bookmarked_ids') || '[]');
    const mockJobs = getMockData();
    const userSkills = JSON.parse(localStorage.getItem('profile_skills') || '["React", "JavaScript", "HTML", "CSS", "Python", "Git"]');
    const userSkillsSet = new Set(userSkills.map((s: string) => s.toLowerCase()));

    const statusCache = JSON.parse(localStorage.getItem('bookmark_statuses') || '{}');

    // Filter down to bookmarked elements and map statuses
    const list = mockJobs
      .filter(job => savedIds.includes(job.id))
      .map((job): BookmarkedJob => {
        const jobSkills = getRequiredSkillsForMockJob(job.title, job.description);
        const matched = jobSkills.filter((s: string) => userSkillsSet.has(s.toLowerCase()));
        const skillScore = jobSkills.length === 0 ? 35 : Math.round((matched.length / jobSkills.length) * 50);
        return {
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          is_remote: job.is_remote,
          salary: job.salary,
          url: job.url,
          match_score: Math.min(skillScore + 35, 100), // simple score estimation for bookmarks page
          status: statusCache[job.id] || 'bookmarked'
        };
      });

    setBookmarks(list);
  }, []);

  const handleStatusChange = (jobId: string, newStatus: string) => {
    const updated = bookmarks.map(b => b.id === jobId ? { ...b, status: newStatus } : b);
    setBookmarks(updated);

    // Save to localStorage statuses cache
    const statusCache = JSON.parse(localStorage.getItem('bookmark_statuses') || '{}');
    statusCache[jobId] = newStatus;
    localStorage.setItem('bookmark_statuses', JSON.stringify(statusCache));
  };

  const removeBookmark = (jobId: string) => {
    const updated = bookmarks.filter(b => b.id !== jobId);
    setBookmarks(updated);

    const savedIds = JSON.parse(localStorage.getItem('bookmarked_ids') || '[]');
    const updatedIds = savedIds.filter((id: string) => id !== jobId);
    localStorage.setItem('bookmarked_ids', JSON.stringify(updatedIds));
  };

  const filtered = filterStatus === 'All' 
    ? bookmarks 
    : bookmarks.filter(b => b.status.toLowerCase() === filterStatus.toLowerCase());

  return (
    <div className="container">
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.4rem' }}>Saved Opportunities</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '0.25rem' }}>
          Track application status pipelines for your matched roles.
        </p>
      </div>

      {/* Filter Status */}
      <div className="premium-card" style={{ padding: '1.25rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {['All', 'Bookmarked', 'Applied', 'Interviewing', 'Rejected'].map(status => (
            <button
              key={status}
              className={`btn ${filterStatus === status ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '0.5rem 1.25rem', fontSize: '0.9rem' }}
              onClick={() => setFilterStatus(status)}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Bookmarks Grid */}
      {filtered.length > 0 ? (
        <div className="card-grid">
          {filtered.map(job => (
            <div key={job.id} className="premium-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <span className="score-badge">{job.match_score}% Match</span>
                <button
                  onClick={() => removeBookmark(job.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)' }}
                >
                  Remove ❌
                </button>
              </div>

              <h3 style={{ fontSize: '1.25rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>{job.title}</h3>
              <span style={{ color: 'var(--text-secondary)', fontWeight: '600', fontSize: '0.9rem' }}>{job.company}</span>

              <p style={{ margin: '1rem 0 1.25rem 0', color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                📍 {job.location} &nbsp;|&nbsp; 💵 {job.salary}
              </p>

              <div className="form-group" style={{ marginTop: 'auto', marginBottom: '1rem' }}>
                <label className="form-label">Pipeline Status</label>
                <select
                  className="form-control"
                  value={job.status}
                  onChange={(e) => handleStatusChange(job.id, e.target.value)}
                >
                  <option value="bookmarked">Bookmarked</option>
                  <option value="applied">Applied</option>
                  <option value="interviewing">Interviewing</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <a
                href={job.url}
                target="_blank"
                className="btn btn-primary"
                style={{ width: '100%', textAlign: 'center' }}
              >
                Go to external Apply link
              </a>
            </div>
          ))}
        </div>
      ) : (
        <div className="premium-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <span style={{ fontSize: '3rem' }}>📂</span>
          <h3 style={{ marginTop: '1rem' }}>No saved listings found</h3>
          <p style={{ marginTop: '0.25rem' }}>Go to the dashboard and bookmark opportunities to track them here.</p>
        </div>
      )}
    </div>
  );
}

// Helpers replicate data models
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
      url: "https://techlogix.com/careers/jr-react-dev"
    },
    {
      id: "mock-2",
      title: "Laravel Backend Engineer",
      company: "Systems Limited",
      location: "Karachi",
      is_remote: false,
      description: "Laravel Backend Engineer. Must know PHP, Laravel, MySQL, and REST APIs. Docker or AWS experience is bonus.",
      salary: "Rs. 100,000 - 150,000",
      url: "https://systemsltd.com/careers/laravel-eng"
    },
    {
      id: "mock-3",
      title: "Remote Flutter Developer",
      company: "Devsinc",
      location: "Remote",
      is_remote: true,
      description: "Hiring Flutter developers. Must have experience building Android and iOS apps, Flutter, Dart, Firebase, and State Management (Bloc/Provider).",
      salary: "Rs. 120,000 - 180,000",
      url: "https://devsinc.com/careers/flutter-remote"
    },
    {
      id: "mock-4",
      title: "Django & Python Developer",
      company: "NetSol Technologies",
      location: "Lahore",
      is_remote: false,
      description: "Django Developer. Must know Python, Django, PostgreSQL, Git, and Linux. Experience in FAST API is a plus.",
      salary: "Rs. 110,000 - 160,000",
      url: "https://netsoltech.com/careers/django-python"
    },
    {
      id: "mock-5",
      title: "SEO & Content Writing Executive",
      company: "Creative Chaos",
      location: "Karachi",
      is_remote: false,
      description: "SEO expert who excels in digital marketing, copywriting, content writing, WordPress, and Excel data tracking.",
      salary: "Rs. 60,000 - 90,000",
      url: "https://creativechaos.co/careers/seo-content"
    },
    {
      id: "mock-6",
      title: "UI/UX Graphic Designer",
      company: "Arbisoft",
      location: "Islamabad",
      is_remote: false,
      description: "Hiring a UI/UX Designer who can work with Figma, Adobe XD, Photoshop, and Graphic Design layouts.",
      salary: "Rs. 90,000 - 140,000",
      url: "https://arbisoft.com/careers/uiux-designer"
    }
  ];
}

function getRequiredSkillsForMockJob(title: string, description: string): string[] {
  const text = `${title} ${description}`.toLowerCase();
  const list = ['React', 'JavaScript', 'HTML', 'CSS', 'Python', 'Git', 'Docker', 'Laravel', 'PHP', 'MySQL', 'Flutter', 'Dart', 'Firebase', 'Django', 'PostgreSQL', 'SEO', 'WordPress', 'Excel', 'Figma', 'Adobe XD', 'Photoshop'];
  return list.filter(skill => text.includes(skill.toLowerCase()));
}
