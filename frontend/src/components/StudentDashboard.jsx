import { useState, useEffect } from 'react';
import { complaints } from '../api';

export default function StudentDashboard({ user }) {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ title: '', category: '', description: '' });

  const load = async () => {
    try {
      const data = await complaints.my();
      setList(data.data || []);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { load(); }, []);

  const submit = async () => {
    if (!form.title || !form.category) { alert('Please fill Title and Category'); return; }
    try {
      await complaints.create({ ...form, description: form.description || 'No description provided' });
      alert('Complaint submitted successfully!');
      setForm({ title: '', category: '', description: '' });
      load();
    } catch (e) { alert('Error: ' + e.message); }
  };

  const statusColor = (s) => s === 'Pending' ? '#e67e22' : s === 'In Progress' ? '#3498db' : '#2ecc71';
  const formatDate = (d) => d ? new Date(d).toLocaleString() : 'Just now';

  return (
    <div className="dashboard-grid">
      <div className="card">
        <div className="card-title"><i className="fas fa-plus-circle"></i> New Complaint</div>
        <div className="card-sub">Report campus issues</div>
        <form onSubmit={e => { e.preventDefault(); submit(); }}>
          <div className="form-group">
            <label>Title *</label>
            <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required placeholder="e.g., Broken AC in Library" />
          </div>
          <div className="form-group">
            <label>Category *</label>
            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} required>
              <option value="">Select Category</option>
              {['Infrastructure', 'Internet', 'Cleanliness', 'Electrical', 'Furniture', 'Other'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows="4" placeholder="Detailed description..."></textarea>
          </div>
          <button type="submit" className="btn-primary">Submit Complaint</button>
        </form>
      </div>

      <div className="card">
        <div className="card-title"><i className="fas fa-list-check"></i> My Complaints</div>
        <div className="card-sub">Track status updates</div>
        <div className="complaint-list">
          {list.map(c => (
            <div key={c._id} className="complaint-item" style={{ borderLeftColor: statusColor(c.status) }}>
              <div className="complaint-header">
                <strong>{c.title}</strong>
                <span className={"status-badge status-" + c.status.toLowerCase().replace(/ /g, '-')}>{c.status}</span>
              </div>
              <div className="complaint-meta"><i className="fas fa-tag"></i> {c.category} | <i className="fas fa-clock"></i> {formatDate(c.createdAt)}</div>
              <div className="complaint-desc">{c.description}</div>
            </div>
          ))}
          {list.length === 0 && <div className="empty-state"><i className="fas fa-inbox fa-2x"></i><p>No complaints yet. Submit one above!</p></div>}
        </div>
      </div>
    </div>
  );
}
