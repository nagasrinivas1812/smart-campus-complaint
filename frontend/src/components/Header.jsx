import { useState, useEffect } from 'react';

export default function Header({ user, onLogout }) {
  const [now, setNow] = useState(new Date());

  // Tick every second to keep the clock live
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer); // cleanup on unmount
  }, []);

  const date = now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

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
      {user && (
        <div className="user-info">
          <span><i className="fas fa-user-circle"></i> {user.name}</span>
          <span className="role-badge">{user.role === 'student' ? 'Student' : 'Admin'}</span>
          <button className="logout-btn" onClick={onLogout}><i className="fas fa-sign-out-alt"></i> Logout</button>
        </div>
      )}
    </div>
  );
}
