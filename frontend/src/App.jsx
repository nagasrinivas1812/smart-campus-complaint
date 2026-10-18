import { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import LoginModal from './components/LoginModal.jsx';
import RegisterModal from './components/RegisterModal.jsx';
import StudentDashboard from './components/StudentDashboard.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import ProfileSettingsModal from './components/ProfileSettingsModal.jsx';
import { auth } from './api';

export default function App() {
  const [user, setUser] = useState(() => {
    const t = localStorage.getItem('campus_token');
    return t ? { token: t } : null;
  });
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [role, setRole] = useState('student');
  const [theme, setTheme] = useState(() => localStorage.getItem('campus_theme') || 'light');
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem('campus_accent') || '#2a5298');

  // Apply theme class to body
  useEffect(() => {
    document.body.classList.toggle('dark-theme', theme === 'dark');
    localStorage.setItem('campus_theme', theme);
  }, [theme]);

  // Apply accent color variable
  useEffect(() => {
    document.documentElement.style.setProperty('--primary-color', accentColor);
    localStorage.setItem('campus_accent', accentColor);
  }, [accentColor]);

  // Fetch logged in user profile on boot
  useEffect(() => {
    const token = localStorage.getItem('campus_token');
    if (token) {
      auth.me()
        .then(res => {
          if (res?.user) setUser({ token, ...res.user });
        })
        .catch(() => {
          localStorage.removeItem('campus_token');
          setUser(null);
        });
    }
  }, []);

  const handleLogin = (data) => {
    localStorage.setItem('campus_token', data.token);
    setUser({ token: data.token, ...data.user });
    setShowLogin(false);
  };

  const logout = () => {
    localStorage.removeItem('campus_token');
    setUser(null);
    setShowSettings(false);
  };

  if (!user || !user.name) {
    return (
      <>
        <Header
          user={null}
          theme={theme}
          onToggleTheme={setTheme}
          onOpenSettings={() => {}}
        />
        <div className="role-selector">
          <button
            className={"role-btn" + (role === 'student' ? ' active' : '')}
            onClick={() => { setRole('student'); setShowRegister(false); }}
          >
            <i className="fas fa-user-graduate"></i> Student Login
          </button>
          <button
            className={"role-btn" + (role === 'admin' ? ' active' : '')}
            onClick={() => { setRole('admin'); setShowRegister(false); }}
          >
            <i className="fas fa-shield-alt"></i> Admin Login
          </button>
          <button
            className="login-action-btn"
            onClick={() => { setShowLogin(true); setShowRegister(false); }}
          >
            Login
          </button>
          {role === 'student' && (
            <button
              className="login-action-btn"
              onClick={() => { setShowRegister(true); setShowLogin(false); }}
            >
              Register
            </button>
          )}
        </div>

        <LoginModal
          show={showLogin}
          role={role}
          onClose={() => setShowLogin(false)}
          onLogin={handleLogin}
          switchToRegister={() => { if (role === 'student') setShowRegister(true); }}
        />

        {role === 'student' && (
          <RegisterModal
            show={showRegister}
            role="student"
            onClose={() => setShowRegister(false)}
            switchToLogin={() => setShowLogin(true)}
          />
        )}
      </>
    );
  }

  return (
    <>
      <Header
        user={user}
        onLogout={logout}
        theme={theme}
        onToggleTheme={setTheme}
        onOpenSettings={() => setShowSettings(true)}
      />

      {user.role === 'student' ? <StudentDashboard user={user} /> : <AdminDashboard />}

      <ProfileSettingsModal
        show={showSettings}
        onClose={() => setShowSettings(false)}
        user={user}
        onUpdateUser={setUser}
        theme={theme}
        onToggleTheme={setTheme}
        accentColor={accentColor}
        onSelectAccent={setAccentColor}
      />

      <footer>Smart Campus — Complaint Management | Real-time Notifications & Analytics</footer>
    </>
  );
}
