import { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { admin } from '../api';
import { socket } from '../socket';

export default function AdminDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const load = async () => {
    try {
      const data = await admin.complaints();
      setComplaints(data.data || []);
      setAnalytics(data.analytics || null);
    } catch (e) { console.error(e); }
  };

  useEffect(() => {
    load();

    // Real-time: new complaint submitted by any student
    const handleRefresh = () => load();
    socket.on('new_complaint', handleRefresh);
    socket.on('complaint_list_updated', handleRefresh);

    // Polling fallback every 15 seconds for reliability
    const interval = setInterval(load, 15000);

    return () => {
      socket.off('new_complaint', handleRefresh);
      socket.off('complaint_list_updated', handleRefresh);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (chartInstance.current) chartInstance.current.destroy();
    const canvas = chartRef.current;
    if (!canvas) return;

    const map = new Map();
    complaints.forEach(c => { const cat = c.category || 'Other'; map.set(cat, (map.get(cat) || 0) + 1); });
    const labels = Array.from(map.keys());
    const counts = Array.from(map.values());

    if (labels.length === 0) {
      chartInstance.current = new Chart(canvas, {
        type: 'doughnut',
        data: { labels: ['No Data'], datasets: [{ data: [1], backgroundColor: ['#cccccc'], borderWidth: 0 }] },
        options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom' } } }
      });
      return;
    }
    chartInstance.current = new Chart(canvas, {
      type: 'doughnut',
      data: { labels, datasets: [{ label: 'Complaints by Category', data: counts, backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#66BB6A'], borderWidth: 0 }] },
      options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom' }, tooltip: { callbacks: { label: (ctx) => ctx.label + ': ' + ctx.raw + ' complaints' } } } }
    });
    return () => { if (chartInstance.current) chartInstance.current.destroy(); };
  }, [complaints]);

  const updateStatus = async (c) => {
    try {
      await admin.updateStatus(c._id, { status: c.status });
      alert('Complaint updated to "' + c.status + '"');
      load();
    } catch (e) { alert('Error: ' + e.message); }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleString() : 'Just now';
  const total = complaints.length;
  const pending = complaints.filter(c => c.status === 'Pending').length;
  const resolved = complaints.filter(c => c.status === 'Resolved').length;
  const topCat = complaints.reduce((max, c) => { const cat = c.category || 'Other'; return (!max || cat > max) ? cat : max; }, '');

  return (
    <div className="dashboard-grid">
      <div className="card">
        <div className="card-title"><i className="fas fa-tasks"></i> All Complaints</div>
        <div className="card-sub">Manage and update status</div>
        <div className="complaint-list">
          {complaints.map(c => (
            <div key={c._id} className="complaint-item">
              <div className="complaint-header">
                <strong>#{c._id.slice(-6)} - {c.title}</strong>
                <span className={"status-badge status-" + c.status.toLowerCase().replace(/ /g, '-')}>{c.status}</span>
              </div>
              <div className="complaint-meta"><i className="fas fa-user"></i> {c.studentName} | <i className="fas fa-tag"></i> {c.category} | <i className="fas fa-clock"></i> {formatDate(c.createdAt)}</div>
              <div className="complaint-desc">{c.description}</div>
              <div className="admin-actions">
                <select value={c.status} onChange={e => { const updated = [...complaints]; const idx = updated.findIndex(x => x._id === c._id); updated[idx] = { ...c, status: e.target.value }; setComplaints(updated); }}>
                  <option>Pending</option>
                  <option>In Progress</option>
                  <option>Resolved</option>
                </select>
                <button className="btn-primary btn-small" onClick={() => updateStatus(c)}>Update & Notify</button>
              </div>
            </div>
          ))}
          {complaints.length === 0 && <div className="empty-state"><i className="fas fa-inbox fa-2x"></i><p>No complaints reported yet.</p></div>}
        </div>
      </div>

      <div className="card">
        <div className="card-title"><i className="fas fa-chart-line"></i> Analytics Dashboard</div>
        <div className="card-sub">Complaint insights & statistics</div>
        <div className="analytics-row">
          <div className="stat-card"><i className="fas fa-folder-open"></i><h3>{total}</h3><span>Total Complaints</span></div>
          <div className="stat-card"><i className="fas fa-spinner"></i><h3>{pending}</h3><span>Pending</span></div>
          <div className="stat-card"><i className="fas fa-check-circle"></i><h3>{resolved}</h3><span>Resolved</span></div>
        </div>
        <canvas ref={chartRef} id="categoryChart"></canvas>
        <hr />
        <div className="ai-insight">
          <i className="fas fa-robot"></i>
          <strong>AI-based Insight</strong><br />
          Most frequent category: "<strong>{topCat || 'None'}</strong>" — prioritize maintenance teams here.
        </div>
      </div>
    </div>
  );
}
