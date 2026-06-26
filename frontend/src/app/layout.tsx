import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Resume-to-Opportunities Engine',
  description: 'Automated resume parsing and job matching for candidates in Pakistan',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <nav className="navbar">
          <a href="/dashboard" className="brand">
            🚀 <span>JobFinder PK</span>
          </a>
          <div className="nav-links">
            <a href="/dashboard" className="nav-link">Dashboard</a>
            <a href="/onboarding" className="nav-link">Upload Resume</a>
            <a href="/bookmarks" className="nav-link">Bookmarks</a>
            <a href="/settings" className="nav-link">Settings</a>
            <a href="/" className="nav-link" style={{ color: '#ef4444' }}>Logout</a>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
