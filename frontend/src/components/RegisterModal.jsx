import { useState } from 'react';
import { auth } from '../api';

export default function RegisterModal({ show, onClose, switchToLogin }) {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', rollNumber: '', department: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!show) return null;

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const resetAll = () => {
    setError('');
    setSuccess('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleRegister = async () => {
    if (!form.name || !form.email || !form.password) { setError('Please fill all required fields'); return; }
    if (form.password !== form.confirmPassword) { setError('Passwords do not match'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    try {
      await auth.register({ name: form.name, email: form.email, password: form.password, role: 'student', rollNumber: form.rollNumber, department: form.department });
      setSuccess('Account created successfully! Please login.');
      setError('');
      setTimeout(() => {
        onClose();
        switchToLogin();
        resetAll();
        setForm({ name: '', email: '', password: '', confirmPassword: '', rollNumber: '', department: '' });
      }, 2000);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="modal" onClick={(e) => { if (e.target.className === 'modal') { onClose(); resetAll(); } }}>
      <div className="modal-content register-modal">
        <div className="modal-header">
          <h2>Create Student Account</h2>
          <button className="close-btn" onClick={() => { onClose(); resetAll(); }}>&times;</button>
        </div>
        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}
          <div className="form-group"><label>Full Name *</label><input type="text" value={form.name} onChange={set('name')} placeholder="Enter your full name" /></div>
          <div className="form-group"><label>Email *</label><input type="email" value={form.email} onChange={set('email')} placeholder="Enter your email" /></div>
          
          <div className="form-group">
            <label>Password * (min 6 characters)</label>
            <div className="password-input-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={set('password')}
                placeholder="Create a password"
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

          <div className="form-group">
            <label>Confirm Password *</label>
            <div className="password-input-wrap">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={form.confirmPassword}
                onChange={set('confirmPassword')}
                placeholder="Confirm your password"
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                title={showConfirmPassword ? 'Hide password' : 'Show password'}
                tabIndex="-1"
              >
                <i className={showConfirmPassword ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
              </button>
            </div>
          </div>

          <div className="form-group"><label>Roll Number (Optional)</label><input type="text" value={form.rollNumber} onChange={set('rollNumber')} placeholder="Enter roll number" /></div>
          <div className="form-group"><label>Department (Optional)</label><input type="text" value={form.department} onChange={set('department')} placeholder="Enter department" /></div>
          <button className="btn-primary" onClick={handleRegister}>Register</button>
          <div className="modal-footer">
            <button className="link-btn" onClick={() => { onClose(); switchToLogin(); resetAll(); }}>Already have an account? Login here</button>
          </div>
        </div>
      </div>
    </div>
  );
}
