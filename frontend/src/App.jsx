import { useState, useEffect } from 'react';
import Header from './components/Header.jsx';
import AuthCard from './components/AuthCard.jsx';
import StudentDashboard from './components/StudentDashboard.jsx';
import AdminDashboard from './components/AdminDashboard.jsx';
import { auth } from './api.js';
import { connectSocket, disconnectSocket } from './socket.js';

export default function App() {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('campus_user');
      const savedToken = localStorage.getItem('campus_token');
      return (savedUser && savedToken) ? { token: savedToken, ...JSON.parse(savedUser) } : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Push a history entry when user is logged in so browser back-button
  // pops back to the dashboard instead of leaving the app
  useEffect(() => {
    if (user && user.name) {
      // Push a "dashboard" state so back-swipe pops here, not out of the app
      window.history.pushState({ page: 'dashboard' }, '', window.location.href);
    }
  }, [user?.name]);

  // Intercept the browser back button — keep user inside the app
  useEffect(() => {
    const handlePopState = (e) => {
      if (user && user.name) {
        // Re-push the state to prevent leaving
        window.history.pushState({ page: 'dashboard' }, '', window.location.href);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user]);

  // Verify session on page load & reconnect socket
  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem('campus_token');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await auth.me();
        if (res.success && res.user) {
          const fullUser = { token, ...res.user };
          setUser(fullUser);
          localStorage.setItem('campus_user', JSON.stringify(res.user));
          // Re-connect socket with token after reload
          connectSocket(token);
        }
      } catch (err) {
        console.warn('Session verification failed:', err.message);
        localStorage.removeItem('campus_token');
        localStorage.removeItem('campus_user');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    verifySession();

    return () => disconnectSocket();
  }, []);

  const handleLogin = (data) => {
    localStorage.setItem('campus_token', data.token);
    localStorage.setItem('campus_user', JSON.stringify(data.user));
    setUser({ token: data.token, ...data.user });
    // Connect socket immediately after login
    connectSocket(data.token);
  };

  const logout = () => {
    localStorage.removeItem('campus_token');
    localStorage.removeItem('campus_user');
    disconnectSocket();
    setUser(null);
  };

  if (loading && !user) {
    return (
      <>
        <Header user={null} />
        <div style={{ textAlign: 'center', padding: '60px', color: 'white' }}>
          <i className="fas fa-circle-notch fa-spin" style={{ fontSize: '2rem', marginBottom: '16px', display: 'block' }}></i>
          <h2>Loading Smart Campus...</h2>
        </div>
      </>
    );
  }

  if (!user || !user.name) {
    return (
      <>
        <Header user={null} />
        <AuthCard onLogin={handleLogin} />
        <footer> Smart Campus — Complaint Management | Real-time Notifications & Analytics</footer>
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
