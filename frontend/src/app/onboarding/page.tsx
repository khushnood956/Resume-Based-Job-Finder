"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: Upload, 2: Review Skills
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [skills, setSkills] = useState<string[]>(['React', 'JavaScript', 'HTML', 'CSS', 'Python', 'Git']);
  const [newSkill, setNewSkill] = useState('');
  const [location, setLocation] = useState('Lahore');
  const [experience, setExperience] = useState('entry');
  const [remotePref, setRemotePref] = useState(true);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
      } else {
        alert("Only PDF resumes are supported.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async () => {
    if (!file) return;
    setLoading(true);

    // Call Next.js API route if configured, otherwise run simulation
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await fetch('/api/resume/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        if (data.extracted_skills) {
          setSkills(data.extracted_skills.map((s: any) => s.name));
        }
      } else {
        console.warn("Using simulation fallback for parsing...");
        // Setup predefined sandbox skills parsed from simulated pdf
        setSkills(['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Git', 'Docker']);
      }
    } catch (err) {
      console.warn("Using simulation fallback for parsing...");
      setSkills(['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Git', 'Docker']);
    } finally {
      setTimeout(() => {
        setLoading(false);
        setStep(2);
      }, 1500);
    }
  };

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const handleSaveProfile = () => {
    // Cache profile preferences in localStorage for mock dashboard calculations
    localStorage.setItem('profile_skills', JSON.stringify(skills));
    localStorage.setItem('profile_location', location);
    localStorage.setItem('profile_experience', experience);
    localStorage.setItem('profile_remote', String(remotePref));
    
    router.push('/dashboard');
  };

  return (
    <div className="container" style={{ maxWidth: '750px', marginTop: '2rem' }}>
      <div className="premium-card" style={{ padding: '3rem' }}>
        {step === 1 ? (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
              <span style={{ fontSize: '3rem' }}>📄</span>
              <h2 style={{ fontSize: '2.2rem', marginTop: '0.75rem' }}>Upload Your Resume</h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                Our parser will automatically analyze your sections and isolate matching technical skills.
              </p>
            </div>

            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              style={{
                border: '2px dashed var(--border)',
                borderRadius: 'var(--radius-lg)',
                padding: '3rem 2rem',
                textAlign: 'center',
                background: 'var(--background)',
                cursor: 'pointer',
                transition: 'var(--transition)',
                marginBottom: '2rem'
              }}
              onClick={() => document.getElementById('fileInput')?.click()}
            >
              <input
                id="fileInput"
                type="file"
                accept=".pdf"
                style={{ display: 'none' }}
                onChange={handleFileChange}
              />
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: '1rem' }}>📤</span>
              <strong style={{ display: 'block', color: 'var(--text-main)', fontSize: '1.1rem' }}>
                {file ? file.name : 'Drag & Drop your PDF resume here'}
              </strong>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem', display: 'block' }}>
                or click to browse files (PDF limit 5MB)
              </span>
            </div>

            {file && (
              <div style={{ textAlign: 'center' }}>
                <button
                  className="btn btn-primary"
                  onClick={handleUploadSubmit}
                  disabled={loading}
                  style={{ minWidth: '180px' }}
                >
                  {loading ? 'Parsing PDF...' : 'Process Resume ⚡'}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: '2.5rem' }}>
              <h2 style={{ fontSize: '2.2rem' }}>Review Parsed Profile</h2>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                We extracted the following skills. Correct any errors or add missing credentials below.
              </p>
            </div>

            <div className="form-group" style={{ marginBottom: '2rem' }}>
              <label className="form-label">Extracted Technical Skills</label>
              <div className="tag-container" style={{ marginBottom: '1.25rem' }}>
                {skills.map(skill => (
                  <span key={skill} className="tag tag-interactive" onClick={() => handleRemoveSkill(skill)}>
                    {skill} <span style={{ color: 'var(--danger)', marginLeft: '4px', fontWeight: 'bold' }}>×</span>
                  </span>
                ))}
              </div>

              <form onSubmit={handleAddSkill} style={{ display: 'flex', gap: '0.75rem' }}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Add skill (e.g. Docker, TypeScript)"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  style={{ maxWidth: '300px' }}
                />
                <button type="submit" className="btn btn-secondary" style={{ padding: '0 1.25rem' }}>
                  Add Tag +
                </button>
              </form>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
              <div className="form-group">
                <label className="form-label">Preferred Job Location (Pakistan)</label>
                <select
                  className="form-control"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                >
                  <option value="Lahore">Lahore</option>
                  <option value="Karachi">Karachi</option>
                  <option value="Islamabad">Islamabad</option>
                  <option value="Faisalabad">Faisalabad</option>
                  <option value="Rawalpindi">Rawalpindi</option>
                  <option value="Peshawar">Peshawar</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Experience Level</label>
                <select
                  className="form-control"
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                >
                  <option value="internship">Internship</option>
                  <option value="entry">Fresh Graduate / Entry-level</option>
                  <option value="mid">Mid-level Professional</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '2.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={remotePref}
                  onChange={(e) => setRemotePref(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <strong style={{ color: 'var(--text-main)', fontSize: '0.95rem' }}>
                  I prefer Remote job matching opportunities
                </strong>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setStep(1)}>
                Back
              </button>
              <button className="btn btn-primary" onClick={handleSaveProfile}>
                Confirm & See Opportunities 🚀
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
