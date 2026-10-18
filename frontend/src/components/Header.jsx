import { useState, useEffect } from 'react';

export default function Header({ user, onLogout, theme, onToggleTheme, onOpenSettings }) {
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const date = currentTime.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

  return (
    <div className="header">
      <div className="logo-area">
        <div className="school-logo"><i className="fas fa-school"></i></div>
        <div className="logo-text">
          <h1>CampusCare | Complaint Hub</h1>
          <p>Report. Track. Resolve.</p>
        </div>
      </div>
      <div className="date-time">
        <div className="date">{date}</div>
        <div className="time">{time}</div>
      </div>
      <div className="header-right">
        <button
          className="theme-toggle-btn"
          onClick={() => onToggleTheme(theme === 'dark' ? 'light' : 'dark')}
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? <i className="fas fa-sun"></i> : <i className="fas fa-moon"></i>}
        </button>
        {user && (
          <div className="user-info">
            <span className="user-name-clickable" onClick={onOpenSettings} title="Click to view Profile Settings">
              <i className="fas fa-user-circle"></i> {user.name}
            </span>
            <span className={`role-badge ${user.role === 'admin' ? 'badge-admin' : 'badge-student'}`}>
              {user.role === 'student' ? 'Student' : 'Admin'}
            </span>
            <button className="settings-btn" onClick={onOpenSettings} title="Profile & Settings">
              <i className="fas fa-cog"></i> Settings
            </button>
            <button className="logout-btn" onClick={onLogout} title="Logout">
              <i className="fas fa-sign-out-alt"></i>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
