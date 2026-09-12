import { useState } from 'react';
import { auth } from '../api';

export default function AuthCard({ onLogin }) {
  const [role, setRole] = useState('student');
  const [mode, setMode] = useState('login'); // 'login' or 'register'
  const [direction, setDirection] = useState('right');

  // Form states
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [regForm, setRegForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    rollNumber: '',
    department: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRoleChange = (newRole) => {
    if (newRole === role) return;
    setDirection(newRole === 'admin' ? 'right' : 'left');
    setRole(newRole);
    setError('');
    setSuccess('');
  };

  const handleLoginSubmit = async (e) => {
    e?.preventDefault();
    if (!loginForm.email || !loginForm.password) {
      setError('Please enter both email and password');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await auth.login({ ...loginForm, role });
      onLogin(data);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e?.preventDefault();
    if (!regForm.name || !regForm.email || !regForm.password) {
      setError('Please fill all required fields');
      return;
    }
    if (regForm.password !== regForm.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (regForm.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await auth.register({
        name: regForm.name,
        email: regForm.email,
        password: regForm.password,
        role,
        rollNumber: regForm.rollNumber,
        department: regForm.department,
      });
      setSuccess('Account created successfully! Switching to login...');
      setTimeout(() => {
        setMode('login');
        setLoginForm({ email: regForm.email, password: '' });
        setSuccess('');
        setError('');
      }, 1500);
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-auth-container">
      <div className="glass-auth-card">
        {/* Role Segmented Slider (Student / Admin) */}
        <div className="role-switch-container">
          <div className={`role-switch-slider ${role === 'admin' ? 'slide-admin' : 'slide-student'}`} />
          <button
            type="button"
            className={`role-switch-btn ${role === 'student' ? 'active' : ''}`}
            onClick={() => handleRoleChange('student')}
          >
            <i className="fas fa-user-graduate"></i> Student Login
          </button>
          <button
            type="button"
            className={`role-switch-btn ${role === 'admin' ? 'active' : ''}`}
            onClick={() => handleRoleChange('admin')}
          >
            <i className="fas fa-shield-alt"></i> Admin Login
          </button>
        </div>

        {/* Animated Form Content */}
        <div key={`${role}-${mode}`} className={`auth-swipe-content ${direction === 'right' ? 'swipe-from-right' : 'swipe-from-left'}`}>
          <div className="auth-card-header">
            <div className="role-indicator-badge">
              <i className={role === 'student' ? 'fas fa-graduation-cap' : 'fas fa-user-tie'}></i>
              <span>{role === 'student' ? 'Student Portal' : 'Admin Portal'}</span>
            </div>
            <h2>{mode === 'login' ? (role === 'student' ? 'Welcome Student' : 'Welcome Administrator') : (role === 'student' ? 'Create Student Account' : 'Create Admin Account')}</h2>
            <p className="auth-subtitle">
              {mode === 'login'
                ? (role === 'student' ? 'Sign in to file and track campus complaints' : 'Sign in to manage and resolve complaints')
                : 'Enter your credentials to register on CampusCare'}
            </p>
          </div>

          {error && <div className="error-message"><i className="fas fa-exclamation-circle"></i> {error}</div>}
          {success && <div className="success-message"><i className="fas fa-check-circle"></i> {success}</div>}

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="auth-form">
              <div className="form-group">
                <label><i className="fas fa-envelope"></i> Email Address</label>
                <input
                  type="email"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  placeholder={role === 'student' ? 'e.g., student@campus.edu' : 'e.g., admin@campus.edu'}
                  required
                />
              </div>

              <div className="form-group">
                <label><i className="fas fa-lock"></i> Password</label>
                <input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="Enter your password"
                  required
                />
              </div>

              <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
                {loading ? (
                  <span><i className="fas fa-spinner fa-spin"></i> Authenticating...</span>
                ) : (
                  <span><i className="fas fa-sign-in-alt"></i> Login as {role === 'student' ? 'Student' : 'Admin'}</span>
                )}
              </button>

              <div className="auth-card-footer">
                <span>Don't have an account? </span>
                <button
                  type="button"
                  className="link-btn-highlight"
                  onClick={() => {
                    setMode('register');
                    setError('');
                    setSuccess('');
                  }}
                >
                  Register here
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="auth-form">
              <div className="form-group">
                <label><i className="fas fa-user"></i> Full Name *</label>
                <input
                  type="text"
                  value={regForm.name}
                  onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="form-group">
                <label><i className="fas fa-envelope"></i> Email Address *</label>
                <input
                  type="email"
                  value={regForm.email}
                  onChange={(e) => setRegForm({ ...regForm, email: e.target.value })}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group flex-1">
                  <label><i className="fas fa-lock"></i> Password *</label>
                  <input
                    type="password"
                    value={regForm.password}
                    onChange={(e) => setRegForm({ ...regForm, password: e.target.value })}
                    placeholder="Min 6 chars"
                    required
                  />
                </div>
                <div className="form-group flex-1">
                  <label><i className="fas fa-check-double"></i> Confirm Password *</label>
                  <input
                    type="password"
                    value={regForm.confirmPassword}
                    onChange={(e) => setRegForm({ ...regForm, confirmPassword: e.target.value })}
                    placeholder="Repeat password"
                    required
                  />
                </div>
              </div>

              {role === 'student' && (
                <div className="form-row">
                  <div className="form-group flex-1">
                    <label><i className="fas fa-id-card"></i> Roll Number (Optional)</label>
                    <input
                      type="text"
                      value={regForm.rollNumber}
                      onChange={(e) => setRegForm({ ...regForm, rollNumber: e.target.value })}
                      placeholder="e.g., CS2026-042"
                    />
                  </div>
                  <div className="form-group flex-1">
                    <label><i className="fas fa-building"></i> Department (Optional)</label>
                    <input
                      type="text"
                      value={regForm.department}
                      onChange={(e) => setRegForm({ ...regForm, department: e.target.value })}
                      placeholder="e.g., Computer Science"
                    />
                  </div>
                </div>
              )}

              <button type="submit" className="btn-primary auth-submit-btn" disabled={loading}>
                {loading ? (
                  <span><i className="fas fa-spinner fa-spin"></i> Registering...</span>
                ) : (
                  <span><i className="fas fa-user-plus"></i> Create {role === 'student' ? 'Student' : 'Admin'} Account</span>
                )}
              </button>

              <div className="auth-card-footer">
                <span>Already have an account? </span>
                <button
                  type="button"
                  className="link-btn-highlight"
                  onClick={() => {
                    setMode('login');
                    setError('');
                    setSuccess('');
                  }}
                >
                  Login here
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
