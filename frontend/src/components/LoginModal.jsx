import { useState } from 'react';
import { auth } from '../api';

export default function LoginModal({ show, role, onClose, onLogin, switchToRegister }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  if (!show) return null;

  const handleSubmit = async () => {
    if (!form.email || !form.password) { setError('Please enter email and password'); return; }
    try {
      const data = await auth.login({ ...form, role });
      if (data.user && data.user.role !== role) {
        throw new Error(
          role === 'admin'
            ? 'Access denied: Student accounts cannot log in to the Admin portal.'
            : 'Access denied: Admin accounts must log in through Admin Login.'
        );
      }
      onLogin(data);
      setForm({ email: '', password: '' });
      setShowPassword(false);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="modal" onClick={(e) => { if (e.target.className === 'modal') { onClose(); setError(''); setShowPassword(false); } }}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>{role === 'student' ? 'Student Login' : 'Admin Login'}</h2>
          <button className="close-btn" onClick={() => { onClose(); setError(''); setShowPassword(false); }}>&times;</button>
        </div>
        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}
          <div style={{ background: '#eef2f9', padding: '10px 14px', borderRadius: '12px', marginBottom: '16px', fontSize: '0.8rem', color: '#2a5298' }}>
            <div style={{ fontWeight: 600, marginBottom: '2px' }}>💡 Quick Demo Login:</div>
            {role === 'student' ? (
              <div>Email: <strong>priya@campus.edu</strong> &bull; Password: <strong>password123</strong></div>
            ) : (
              <div>Email: <strong>admin@campus.edu</strong> &bull; Password: <strong>admin123</strong></div>
            )}
            <button
              type="button"
              style={{ marginTop: '6px', fontSize: '0.75rem', color: '#1e3f72', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', padding: 0 }}
              onClick={() => setForm(role === 'student' ? { email: 'priya@campus.edu', password: 'password123' } : { email: 'admin@campus.edu', password: 'admin123' })}
            >
              Click here to auto-fill
            </button>
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Enter your email" onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <div className="password-input-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder="Enter your password"
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
                tabIndex="-1"
              >
                <i className={showPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
              </button>
            </div>
          </div>
          <button className="btn-primary" onClick={handleSubmit}>Login</button>
          {role === 'student' ? (
            <div className="modal-footer">
              <button className="link-btn" onClick={() => { onClose(); switchToRegister(); }}>Don't have an account? Register here</button>
            </div>
          ) : (
            <div className="modal-footer" style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '12px' }}>
              <span>Administrative access only. Registration is restricted.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
