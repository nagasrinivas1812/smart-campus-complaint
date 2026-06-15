import { useState } from 'react';
import Header from './components/Header.jsx';
import LoginModal from './components/LoginModal.jsx';
import RegisterModal from './components/RegisterModal.jsx';
import StudentDashboard from './components/StudentDashboard.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';

export default function App() {
  const [user, setUser] = useState(() => { const t = localStorage.getItem('campus_token'); return t ? { token: t } : null; });
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [role, setRole] = useState('student');

  const handleLogin = (data) => {
    localStorage.setItem('campus_token', data.token);
    setUser({ token: data.token, ...data.user });
    setShowLogin(false);
  };

  const logout = () => {
    localStorage.removeItem('campus_token');
    setUser(null);
  };

  if (!user || !user.name) {
    return (
      <>
        <Header user={null} />
        <div className="role-selector">
          <button className={"role-btn" + (role === 'student' ? ' active' : '')} onClick={() => setRole('student')}> Student Login</button>
          <button className={"role-btn" + (role === 'admin' ? ' active' : '')} onClick={() => setRole('admin')}> Admin Login</button>
          <button className="login-action-btn" onClick={() => { setShowLogin(true); setShowRegister(false); }}>Login</button>
          <button className="login-action-btn" onClick={() => { setShowRegister(true); setShowLogin(false); }}>Register</button>
        </div>
        <LoginModal show={showLogin} role={role} onClose={() => setShowLogin(false)} onLogin={handleLogin} switchToRegister={() => setShowRegister(true)} />
        <RegisterModal show={showRegister} role={role} onClose={() => setShowRegister(false)} switchToLogin={() => setShowLogin(true)} />
      </>
    );
  }

  return (
    <>
      <Header user={user} onLogout={logout} />
      {user.role === 'student' ? <StudentDashboard user={user} /> : <AdminDashboard />}
      <footer> Smart Campus — Complaint Management | Real-time Notifications & Analytics</footer>
    </>
  );
}
