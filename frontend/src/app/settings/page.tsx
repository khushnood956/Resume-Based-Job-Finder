"use client";

import { useState, useEffect } from 'react';

export default function SettingsPage() {
  const [fullName, setFullName] = useState('Candidate');
  const [location, setLocation] = useState('Lahore');
  const [experience, setExperience] = useState('entry');
  const [remotePref, setRemotePref] = useState(true);
  const [emailActive, setEmailActive] = useState(true);
  const [telegramActive, setTelegramActive] = useState(false);
  const [telegramLinked, setTelegramLinked] = useState(false);
  const [tgToken, setTgToken] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Read preferences
    const cachedName = localStorage.getItem('user_name');
    if (cachedName) setFullName(cachedName);
    
    const cachedLoc = localStorage.getItem('profile_location');
    if (cachedLoc) setLocation(cachedLoc);

    const cachedExp = localStorage.getItem('profile_experience');
    if (cachedExp) setExperience(cachedExp);

    setRemotePref(localStorage.getItem('profile_remote') !== 'false');

    // Generate base64 verify token for Telegram linking
    const mockUserId = '00000000-0000-0000-0000-000000000001'; // Simulated user UUID
    const encoded = Buffer.from(mockUserId).toString('base64');
    setTgToken(encoded);

    // Read notification mocks
    setTelegramLinked(localStorage.getItem('telegram_chat_id_linked') === 'true');
    setEmailActive(localStorage.getItem('email_active') !== 'false');
    setTelegramActive(localStorage.getItem('telegram_active') === 'true');
  }, []);

  const handleSave = () => {
    localStorage.setItem('user_name', fullName);
    localStorage.setItem('profile_location', location);
    localStorage.setItem('profile_experience', experience);
    localStorage.setItem('profile_remote', String(remotePref));
    
    localStorage.setItem('email_active', String(emailActive));
    localStorage.setItem('telegram_active', String(telegramActive));

    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const getTelegramBotUrl = () => {
    return `https://t.me/PakJobMatchBot?start=${tgToken}`;
  };

  const simulateTelegramLinking = () => {
    // Sandbox helper to simulate linking directly
    localStorage.setItem('telegram_chat_id_linked', 'true');
    setTelegramLinked(true);
    setTelegramActive(true);
    localStorage.setItem('telegram_active', 'true');
    alert("Sandbox Mode: Telegram account successfully linked!");
  };

  return (
    <div className="container" style={{ maxWidth: '700px' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2.4rem' }}>User Settings</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', marginTop: '0.25rem' }}>
          Configure matching profiles and alerts distribution channels.
        </p>
      </div>

      {saved && (
        <div style={{
          background: 'var(--success-bg)',
          color: 'var(--success-text)',
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          fontWeight: '600',
          marginBottom: '1.5rem',
          textAlign: 'center'
        }}>
          ✅ Settings saved and matches recalculated!
        </div>
      )}

      {/* Profile Preferences */}
      <div className="premium-card" style={{ padding: '2.25rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.6rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>
          Candidate Preferences
        </h2>

        <div className="form-group">
          <label className="form-label">Full Name</label>
          <input
            type="text"
            className="form-control"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
          <div className="form-group">
            <label className="form-label">Preferred City (Pakistan)</label>
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

        <div className="form-group" style={{ margin: 0 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={remotePref}
              onChange={(e) => setRemotePref(e.target.checked)}
              style={{ width: '16px', height: '16px' }}
            />
            <span style={{ fontSize: '0.95rem', fontWeight: '500' }}>Prefer Remote Matching Roles</span>
          </label>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="premium-card" style={{ padding: '2.25rem', marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.6rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--card-border)', paddingBottom: '0.5rem' }}>
          Alerts Setup
        </h2>

        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={emailActive}
              onChange={(e) => setEmailActive(e.target.checked)}
              style={{ width: '16px', height: '16px' }}
            />
            <div>
              <strong style={{ display: 'block', fontSize: '0.95rem' }}>Enable Email Digests</strong>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Receive daily summaries of job matches on your email</span>
            </div>
          </label>
        </div>

        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={telegramActive}
              onChange={(e) => setTelegramActive(e.target.checked)}
              disabled={!telegramLinked}
              style={{ width: '16px', height: '16px' }}
            />
            <div>
              <strong style={{ display: 'block', fontSize: '0.95rem' }}>Enable Telegram matching alerts</strong>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Push matching notifications immediately on Telegram chat (requires linking below)</span>
            </div>
          </label>
        </div>

        <div style={{
          background: 'var(--background)',
          borderRadius: 'var(--radius-md)',
          padding: '1.5rem',
          border: '1px solid var(--card-border)',
          marginTop: '1.5rem'
        }}>
          <strong style={{ display: 'block', fontSize: '1rem', color: 'var(--text-main)', marginBottom: '0.5rem' }}>
            Telegram Connection Status: {telegramLinked ? '🟢 Linked' : '🔴 Unlinked'}
          </strong>
          
          {!telegramLinked ? (
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                To receive alerts via Telegram, click the button below to link with `@PakJobMatchBot` and verify your account.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <a
                  href={getTelegramBotUrl()}
                  target="_blank"
                  className="btn btn-primary"
                  style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
                >
                  Link Bot Account 🤖
                </a>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '0.5rem 1.25rem', fontSize: '0.85rem' }}
                  onClick={simulateTelegramLinking}
                >
                  Simulate Linking (Mock)
                </button>
              </div>
            </div>
          ) : (
            <div>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
                Your account is successfully linked. You will receive notifications when matches $\ge$ 70% are published.
              </p>
              <button
                className="btn btn-secondary"
                style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', color: 'var(--danger)' }}
                onClick={() => {
                  setTelegramLinked(false);
                  setTelegramActive(false);
                  localStorage.removeItem('telegram_chat_id_linked');
                }}
              >
                Disconnect Telegram Account
              </button>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
        <button className="btn btn-primary" onClick={handleSave} style={{ minWidth: '150px' }}>
          Save Changes
        </button>
      </div>
    </div>
  );
}
