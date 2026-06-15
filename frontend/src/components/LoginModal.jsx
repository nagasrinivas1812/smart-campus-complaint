import { useState } from 'react';
import { auth } from '../api';

export default function LoginModal({ show, role, onClose, onLogin, switchToRegister }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  if (!show) return null;

  const handleSubmit = async () => {
    if (!form.email || !form.password) { setError('Please enter email and password'); return; }
    try {
      const data = await auth.login({ ...form, role });
      onLogin(data);
      setForm({ email: '', password: '' });
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="modal" onClick={(e) => { if (e.target.className === 'modal') { onClose(); setError(''); } }}>
      <div className="modal-content">
        <div className="modal-header">
          <h2>{role === 'student' ? 'Student Login' : 'Admin Login'}</h2>
          <button className="close-btn" onClick={() => { onClose(); setError(''); }}>&times;</button>
        </div>
        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="Enter your email" onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Enter your password" onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>
          <button className="btn-primary" onClick={handleSubmit}>Login</button>
          <div className="modal-footer">
            <button className="link-btn" onClick={() => { onClose(); switchToRegister(); }}>Don't have an account? Register here</button>
          </div>
        </div>
      </div>
    </div>
  );
}
