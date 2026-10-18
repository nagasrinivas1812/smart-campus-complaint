import { useState, useEffect } from 'react';
import { auth } from '../api';

export default function ProfileSettingsModal({ show, onClose, user, onUpdateUser, theme, onToggleTheme, accentColor, onSelectAccent }) {
  const [activeTab, setActiveTab] = useState('profile');

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    department: user?.department || '',
    rollNumber: user?.rollNumber || '',
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showPw, setShowPw] = useState({ current: false, next: false, confirm: false });

  // Preferences state
  const [prefs, setPrefs] = useState(() => {
    const saved = localStorage.getItem('campus_prefs');
    return saved ? JSON.parse(saved) : {
      emailAlerts: true,
      soundAlerts: false,
      compactView: false,
      autoRefresh: user?.role === 'admin' ? 30 : 0,
    };
  });

  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        department: user.department || '',
        rollNumber: user.rollNumber || '',
      });
    }
    setStatusMsg({ type: '', text: '' });
  }, [user, show]);

  if (!show) return null;

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) {
      setStatusMsg({ type: 'error', text: 'Name is required' });
      return;
    }
    setLoading(true);
    setStatusMsg({ type: '', text: '' });
    try {
      const res = await auth.updateProfile(profileForm);
      onUpdateUser({ ...user, ...res.user });
      setStatusMsg({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setStatusMsg({ type: 'error', text: 'Please fill all password fields' });
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setStatusMsg({ type: 'error', text: 'New password must be at least 6 characters' });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setStatusMsg({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    setLoading(true);
    setStatusMsg({ type: '', text: '' });
    try {
      await auth.updatePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setStatusMsg({ type: 'success', text: 'Password changed successfully!' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to change password' });
    } finally {
      setLoading(false);
    }
  };

  const updatePref = (key, val) => {
    const updated = { ...prefs, [key]: val };
    setPrefs(updated);
    localStorage.setItem('campus_prefs', JSON.stringify(updated));
    if (key === 'compactView') {
      document.body.classList.toggle('compact-view', val);
    }
    setStatusMsg({ type: 'success', text: 'Preferences saved!' });
    setTimeout(() => setStatusMsg({ type: '', text: '' }), 2500);
  };

  const accentOptions = [
    { name: 'Campus Blue', value: '#2a5298', gradient: 'linear-gradient(135deg, #1e3c72, #2a5298)' },
    { name: 'Royal Indigo', value: '#6366f1', gradient: 'linear-gradient(135deg, #4f46e5, #6366f1)' },
    { name: 'Emerald Forest', value: '#10b981', gradient: 'linear-gradient(135deg, #059669, #10b981)' },
    { name: 'Sunset Amber', value: '#f59e0b', gradient: 'linear-gradient(135deg, #d97706, #f59e0b)' },
    { name: 'Ruby Crimson', value: '#e11d48', gradient: 'linear-gradient(135deg, #be123c, #e11d48)' },
  ];

  return (
    <div className="modal" onClick={(e) => { if (e.target.className === 'modal') onClose(); }}>
      <div className="modal-content settings-modal">
        <div className="modal-header">
          <div className="settings-header-title">
            <h2><i className="fas fa-sliders-h"></i> Profile & Settings</h2>
            <span className="settings-user-tag">
              {user?.role === 'admin' ? '🛡️ Administrator Portal' : '🎓 Student Portal'}
            </span>
          </div>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        {/* Settings Navigation Tabs */}
        <div className="settings-tabs-bar">
          <button
            className={`settings-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => { setActiveTab('profile'); setStatusMsg({ type: '', text: '' }); }}
          >
            <i className="fas fa-user"></i> Profile
          </button>
          <button
            className={`settings-tab-btn ${activeTab === 'appearance' ? 'active' : ''}`}
            onClick={() => { setActiveTab('appearance'); setStatusMsg({ type: '', text: '' }); }}
          >
            <i className="fas fa-palette"></i> Appearance
          </button>
          <button
            className={`settings-tab-btn ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => { setActiveTab('preferences'); setStatusMsg({ type: '', text: '' }); }}
          >
            <i className="fas fa-bell"></i> Preferences
          </button>
          <button
            className={`settings-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => { setActiveTab('security'); setStatusMsg({ type: '', text: '' }); }}
          >
            <i className="fas fa-key"></i> Security
          </button>
        </div>

        <div className="modal-body settings-body">
          {statusMsg.text && (
            <div className={statusMsg.type === 'error' ? 'error-message' : 'success-message'}>
              {statusMsg.type === 'error' ? <i className="fas fa-exclamation-circle"></i> : <i className="fas fa-check-circle"></i>} {statusMsg.text}
            </div>
          )}

          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileSave}>
              <div className="settings-user-card">
                <div className="settings-avatar">
                  {user?.name ? user.name.charAt(0).toUpperCase() : (user?.role === 'admin' ? 'A' : 'S')}
                </div>
                <div className="settings-user-meta">
                  <h3>{user?.name || 'User'}</h3>
                  <p>{user?.email}</p>
                  <span className={`role-badge ${user?.role === 'admin' ? 'badge-admin' : 'badge-student'}`}>
                    {user?.role === 'admin' ? 'Primary Administrator' : 'Verified Student'}
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label><i className="fas fa-id-card"></i> Full Name *</label>
                <input
                  type="text"
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                  placeholder="Enter full name"
                  required
                />
              </div>

              <div className="form-group">
                <label><i className="fas fa-envelope"></i> Campus Email (Immutable)</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  style={{ opacity: 0.7, cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-group">
                <label><i className="fas fa-phone"></i> Contact Phone Number</label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                  placeholder="e.g. 9876543210"
                />
              </div>

              <div className="form-group">
                <label><i className="fas fa-building"></i> Department / Office</label>
                <input
                  type="text"
                  value={profileForm.department}
                  onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
                  placeholder={user?.role === 'admin' ? 'e.g. Campus Administration' : 'e.g. Computer Science'}
                />
              </div>

              {user?.role === 'student' && (
                <div className="form-group">
                  <label><i className="fas fa-hashtag"></i> Student Roll Number</label>
                  <input
                    type="text"
                    value={profileForm.rollNumber}
                    onChange={(e) => setProfileForm({ ...profileForm, rollNumber: e.target.value })}
                    placeholder="e.g. CS-2026-101"
                  />
                </div>
              )}

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Saving Changes...' : 'Save Profile Changes'}
              </button>
            </form>
          )}

          {/* TAB 2: APPEARANCE */}
          {activeTab === 'appearance' && (
            <div className="settings-section">
              <label className="section-label"><i className="fas fa-moon"></i> Interface Theme</label>
              <div className="theme-switcher-grid">
                <div
                  className={`theme-card ${theme === 'light' ? 'selected' : ''}`}
                  onClick={() => onToggleTheme('light')}
                >
                  <div className="theme-preview light-preview">
                    <div className="preview-nav"></div>
                    <div className="preview-content"></div>
                  </div>
                  <div className="theme-label">
                    <i className="fas fa-sun"></i> Light Mode
                  </div>
                </div>

                <div
                  className={`theme-card ${theme === 'dark' ? 'selected' : ''}`}
                  onClick={() => onToggleTheme('dark')}
                >
                  <div className="theme-preview dark-preview">
                    <div className="preview-nav"></div>
                    <div className="preview-content"></div>
                  </div>
                  <div className="theme-label">
                    <i className="fas fa-moon"></i> Dark Mode
                  </div>
                </div>
              </div>

              <label className="section-label" style={{ marginTop: '20px' }}>
                <i className="fas fa-brush"></i> Accent Theme Color
              </label>
              <div className="accent-grid">
                {accentOptions.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`accent-btn ${accentColor === opt.value ? 'selected' : ''}`}
                    style={{ background: opt.gradient }}
                    onClick={() => onSelectAccent(opt.value)}
                    title={opt.name}
                  >
                    {accentColor === opt.value && <i className="fas fa-check"></i>}
                  </button>
                ))}
              </div>

              <div className="toggle-row" style={{ marginTop: '20px' }}>
                <div>
                  <strong>Compact Card Density</strong>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-sub)' }}>Display more tickets on screen by reducing card padding</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={prefs.compactView}
                    onChange={(e) => updatePref('compactView', e.target.checked)}
                  />
                  <span className="slider round"></span>
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: PREFERENCES */}
          {activeTab === 'preferences' && (
            <div className="settings-section">
              <label className="section-label"><i className="fas fa-bell"></i> Notification Settings</label>
              
              <div className="toggle-row">
                <div>
                  <strong>Email Notifications</strong>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-sub)' }}>
                    Receive email receipts when status changes or actions are taken
                  </p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={prefs.emailAlerts}
                    onChange={(e) => updatePref('emailAlerts', e.target.checked)}
                  />
                  <span className="slider round"></span>
                </label>
              </div>

              <div className="toggle-row">
                <div>
                  <strong>In-App Sound Alerts</strong>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-sub)' }}>
                    Play an alert chime when tickets are created or updated
                  </p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={prefs.soundAlerts}
                    onChange={(e) => updatePref('soundAlerts', e.target.checked)}
                  />
                  <span className="slider round"></span>
                </label>
              </div>

              {user?.role === 'admin' && (
                <div className="form-group" style={{ marginTop: '20px' }}>
                  <label><i className="fas fa-sync-alt"></i> Auto-Refresh Interval</label>
                  <select
                    value={prefs.autoRefresh}
                    onChange={(e) => updatePref('autoRefresh', Number(e.target.value))}
                  >
                    <option value={0}>Manual refresh only</option>
                    <option value={15}>Every 15 seconds (Live Monitoring)</option>
                    <option value={30}>Every 30 seconds (Standard)</option>
                    <option value={60}>Every 1 minute</option>
                  </select>
                </div>
              )}

              {user?.role === 'student' && (
                <div className="info-box" style={{ marginTop: '16px' }}>
                  <i className="fas fa-info-circle"></i> As a student, you will receive real-time updates when an administrator assigns or resolves your complaints.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SECURITY */}
          {activeTab === 'security' && (
            <form onSubmit={handlePasswordChange}>
              <div className="form-group">
                <label><i className="fas fa-lock"></i> Current Password *</label>
                <div className="password-input-wrap">
                  <input
                    type={showPw.current ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    placeholder="Enter your current password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPw({ ...showPw, current: !showPw.current })}
                    title={showPw.current ? 'Hide password' : 'Show password'}
                    tabIndex="-1"
                  >
                    <i className={showPw.current ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label><i className="fas fa-key"></i> New Password * (min 6 characters)</label>
                <div className="password-input-wrap">
                  <input
                    type={showPw.next ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="Enter new password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPw({ ...showPw, next: !showPw.next })}
                    title={showPw.next ? 'Hide password' : 'Show password'}
                    tabIndex="-1"
                  >
                    <i className={showPw.next ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label><i className="fas fa-check-double"></i> Confirm New Password *</label>
                <div className="password-input-wrap">
                  <input
                    type={showPw.confirm ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="Re-enter new password"
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowPw({ ...showPw, confirm: !showPw.confirm })}
                    title={showPw.confirm ? 'Hide password' : 'Show password'}
                    tabIndex="-1"
                  >
                    <i className={showPw.confirm ? 'fas fa-eye-slash' : 'fas fa-eye'}></i>
                  </button>
                </div>
              </div>

              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

