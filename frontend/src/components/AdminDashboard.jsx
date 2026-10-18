import { useState, useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { admin } from '../api';

export default function AdminDashboard() {
  const [complaints, setComplaints] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'Pending' | 'In Progress' | 'Resolved'
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [updatingId, setUpdatingId] = useState(null);
  const [justSavedId, setJustSavedId] = useState(null);
  const [remarkText, setRemarkText] = useState({});
  const [viewingMedia, setViewingMedia] = useState(null);
  const [toast, setToast] = useState(null);

  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const showToast = (message, type = 'success', action = null) => {
    setToast({ message, type, action });
    setTimeout(() => {
      setToast(prev => (prev?.message === message ? null : prev));
    }, 4500);
  };

  const load = async () => {
    try {
      const data = await admin.complaints();
      setComplaints(data.data || []);
    } catch (e) {
      console.error('Failed to load complaints:', e);
    }
  };

  useEffect(() => {
    load();
    // Auto-refresh if configured in preferences
    const savedPrefs = localStorage.getItem('campus_prefs');
    if (savedPrefs) {
      try {
        const { autoRefresh } = JSON.parse(savedPrefs);
        if (autoRefresh > 0) {
          const interval = setInterval(load, autoRefresh * 1000);
          return () => clearInterval(interval);
        }
      } catch (err) {
        console.error(err);
      }
    }
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
        data: { labels: ['No Data'], datasets: [{ data: [1], backgroundColor: ['#94a3b8'], borderWidth: 0 }] },
        options: { responsive: true, maintainAspectRatio: true, plugins: { legend: { position: 'bottom' } } }
      });
      return;
    }
    chartInstance.current = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          label: 'Complaints by Category',
          data: counts,
          backgroundColor: ['#f43f5e', '#3b82f6', '#eab308', '#10b981', '#8b5cf6', '#f97316', '#06b6d4'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { family: 'Inter', size: 11 } } },
          tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.raw} complaints` } }
        }
      }
    });
    return () => { if (chartInstance.current) chartInstance.current.destroy(); };
  }, [complaints]);

  // Direct persistence handler: saves directly to MongoDB on selection
  const handleStatusChange = async (c, newStatus) => {
    if (c.status === newStatus) return;
    setUpdatingId(c._id);
    try {
      const note = remarkText[c._id];
      const remark = note && note.trim()
        ? note.trim()
        : `Status marked as "${newStatus}" by administrator`;

      await admin.updateStatus(c._id, { status: newStatus, remark });

      setJustSavedId(c._id);
      setTimeout(() => setJustSavedId(null), 3000);

      const tabMap = { 'Pending': 'New Tasks', 'In Progress': 'In Progress', 'Resolved': 'Completed' };
      const targetTab = tabMap[newStatus];

      showToast(
        `Complaint #${c._id.slice(-6)} marked as "${newStatus}" and saved to database!`,
        'success',
        activeTab !== 'all' && activeTab !== newStatus
          ? { label: `Switch to ${targetTab}`, action: () => setActiveTab(newStatus) }
          : null
      );

      await load();
    } catch (e) {
      showToast('Error updating status: ' + e.message, 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  // Dedicated remark/note sender
  const handleSendRemark = async (c) => {
    const note = remarkText[c._id];
    if (!note || !note.trim()) {
      showToast('Please type a note first before sending.', 'warning');
      return;
    }
    setUpdatingId(c._id);
    try {
      await admin.updateStatus(c._id, {
        status: c.status,
        remark: note.trim()
      });
      showToast(`Update note saved and sent to student for #${c._id.slice(-6)}!`, 'success');
      setRemarkText(prev => ({ ...prev, [c._id]: '' }));
      await load();
    } catch (e) {
      showToast('Error sending note: ' + e.message, 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (c) => {
    const confirm = window.confirm(`Are you sure you want to delete task #${c._id.slice(-6)}: "${c.title}"? This action cannot be undone.`);
    if (!confirm) return;
    try {
      await admin.deleteComplaint(c._id);
      showToast(`Task #${c._id.slice(-6)} deleted successfully!`, 'success');
      await load();
    } catch (err) {
      showToast('Error deleting task: ' + err.message, 'error');
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleString() : 'Just now';

  // Counts for tabs
  const totalCount = complaints.length;
  const newCount = complaints.filter(c => c.status === 'Pending').length;
  const inProgressCount = complaints.filter(c => c.status === 'In Progress').length;
  const completedCount = complaints.filter(c => c.status === 'Resolved').length;

  // Filter complaints based on Tab, Search, and Category
  const filteredComplaints = complaints.filter(c => {
    // Tab filter
    if (activeTab !== 'all' && c.status !== activeTab) return false;
    // Category filter
    if (categoryFilter !== 'All' && c.category !== categoryFilter) return false;
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (c.title || '').toLowerCase().includes(q);
      const matchStudent = (c.studentName || '').toLowerCase().includes(q);
      const matchDesc = (c.description || '').toLowerCase().includes(q);
      const matchId = (c._id || '').toLowerCase().includes(q);
      if (!matchTitle && !matchStudent && !matchDesc && !matchId) return false;
    }
    return true;
  });

  const topCat = complaints.reduce((max, c) => {
    const cat = c.category || 'Other';
    return (!max || cat > max) ? cat : max;
  }, '');

  return (
    <>
      {/* Floating Toast Notification */}
      {toast && (
        <div className={`admin-floating-toast toast-${toast.type}`}>
          <div className="toast-text-wrap">
            <i className={toast.type === 'error' ? 'fas fa-exclamation-circle' : 'fas fa-check-circle'}></i>
            <span>{toast.message}</span>
          </div>
          {toast.action && (
            <button
              type="button"
              className="toast-action-btn"
              onClick={() => {
                toast.action.action();
                setToast(null);
              }}
            >
              {toast.action.label} →
            </button>
          )}
          <button type="button" className="toast-close-btn" onClick={() => setToast(null)}>
            &times;
          </button>
        </div>
      )}

      <div className="dashboard-grid">
        {/* LEFT CARD: TASK SEPARATION & COMPLAINT MANAGEMENT */}
      <div className="card">
        <div className="card-header-row">
          <div>
            <div className="card-title"><i className="fas fa-tasks"></i> Complaint Tasks</div>
            <div className="card-sub">Review, prioritize, and resolve campus reports</div>
          </div>
          <button className="refresh-mini-btn" onClick={load} title="Refresh Complaints">
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
        </div>

        {/* Task Separation Tabs */}
        <div className="task-filter-tabs">
          <button
            type="button"
            className={`tab-pill ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <i className="fas fa-layer-group"></i> All Tasks
            <span className="tab-pill-badge">{totalCount}</span>
          </button>
          <button
            type="button"
            className={`tab-pill tab-new ${activeTab === 'Pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('Pending')}
          >
            <i className="fas fa-clock"></i> New Tasks
            <span className="tab-pill-badge badge-pending">{newCount}</span>
          </button>
          <button
            type="button"
            className={`tab-pill tab-progress ${activeTab === 'In Progress' ? 'active' : ''}`}
            onClick={() => setActiveTab('In Progress')}
          >
            <i className="fas fa-spinner"></i> In Progress
            <span className="tab-pill-badge badge-progress">{inProgressCount}</span>
          </button>
          <button
            type="button"
            className={`tab-pill tab-resolved ${activeTab === 'Resolved' ? 'active' : ''}`}
            onClick={() => setActiveTab('Resolved')}
          >
            <i className="fas fa-check-circle"></i> Completed
            <span className="tab-pill-badge badge-resolved">{completedCount}</span>
          </button>
        </div>

        {/* Search and Category Filter Row */}
        <div className="task-filter-controls">
          <div className="search-input-wrap">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search by title, student, or ticket ID..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="clear-search-btn" onClick={() => setSearchQuery('')}>&times;</button>
            )}
          </div>
          <select
            className="category-filter-select"
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
          >
            <option value="All">All Categories</option>
            {['Infrastructure', 'Internet', 'Cleanliness', 'Electrical', 'Furniture', 'Other'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Complaints List */}
        <div className="complaint-list">
          {filteredComplaints.map(c => (
            <div
              key={c._id}
              className={`complaint-item status-border-${c.status.toLowerCase().replace(/ /g, '-')}`}
            >
              <div className="complaint-header">
                <div className="complaint-title-group">
                  <span className="ticket-tag">#{c._id.slice(-6)}</span>
                  <strong>{c.title}</strong>
                </div>
                <div className="complaint-header-actions">
                  <span className={`status-badge status-${c.status.toLowerCase().replace(/ /g, '-')}`}>
                    {c.status === 'Pending' && <i className="fas fa-clock"></i>}
                    {c.status === 'In Progress' && <i className="fas fa-tools"></i>}
                    {c.status === 'Resolved' && <i className="fas fa-check-circle"></i>}
                    {' '}{c.status}
                  </span>
                  <button
                    type="button"
                    className="card-delete-btn"
                    onClick={() => handleDelete(c)}
                    title="Delete this task"
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </div>
              </div>

              <div className="complaint-meta">
                <span><i className="fas fa-user-graduate"></i> {c.studentName} ({c.studentEmail})</span>
                <span><i className="fas fa-tag"></i> {c.category}</span>
                <span><i className="fas fa-calendar-alt"></i> {formatDate(c.createdAt)}</span>
              </div>

              <div className="complaint-desc">{c.description}</div>

              {/* ATTACHED PHOTO OR VIDEO PREVIEW */}
              {c.mediaUrl && (
                <div className="complaint-media-card">
                  <div className="media-header">
                    <i className={c.mediaType === 'video' ? 'fas fa-video' : 'fas fa-image'}></i>
                    <span>Attached {c.mediaType === 'video' ? 'Video Evidence' : 'Photo Evidence'}</span>
                    {c.mediaName && <span className="media-filename">({c.mediaName})</span>}
                  </div>
                  {c.mediaType === 'video' ? (
                    <video
                      src={c.mediaUrl}
                      controls
                      className="complaint-video-player"
                      preload="metadata"
                    />
                  ) : (
                    <div
                      className="complaint-image-wrap"
                      onClick={() => setViewingMedia({ url: c.mediaUrl, title: c.title, name: c.mediaName, type: 'image' })}
                      title="Click to view full photo"
                    >
                      <img src={c.mediaUrl} alt={c.title} className="complaint-thumb-img" />
                      <div className="image-hover-overlay">
                        <i className="fas fa-search-plus"></i> View Full Photo
                      </div>
                    </div>
                  )}
                </div>
              )}

              {c.adminRemarks && (
                <div className="admin-remarks-preview">
                  <i className="fas fa-comment-dots"></i> <strong>Admin Remark:</strong> {c.adminRemarks}
                </div>
              )}

              <div className="admin-actions">
                <div className="action-control-group">
                  <label className="action-label"><i className="fas fa-traffic-light"></i> Status:</label>
                  <div className="status-select-wrap">
                    <select
                      value={c.status}
                      disabled={updatingId === c._id}
                      onChange={e => handleStatusChange(c, e.target.value)}
                      className={`status-dropdown status-dropdown-${c.status.toLowerCase().replace(/\s+/g, '-')}`}
                      title="Select new status (auto-saves to database immediately)"
                    >
                      <option value="Pending">🟡 New / Pending</option>
                      <option value="In Progress">🔵 In Progress</option>
                      <option value="Resolved">🟢 Resolved / Completed</option>
                    </select>

                    {updatingId === c._id && (
                      <span className="status-saving-spinner" title="Saving to database...">
                        <i className="fas fa-spinner fa-spin"></i> Saving...
                      </span>
                    )}

                    {justSavedId === c._id && (
                      <span className="status-saved-badge" title="Saved to database">
                        <i className="fas fa-check-circle"></i> Saved
                      </span>
                    )}
                  </div>
                </div>

                {/* Quick 1-click status actions */}
                <div className="quick-status-actions">
                  {c.status !== 'In Progress' && (
                    <button
                      type="button"
                      className="quick-status-btn quick-btn-progress"
                      onClick={() => handleStatusChange(c, 'In Progress')}
                      disabled={updatingId === c._id}
                      title="Move task to In Progress (saves immediately)"
                    >
                      <i className="fas fa-play"></i> In Progress
                    </button>
                  )}
                  {c.status !== 'Resolved' && (
                    <button
                      type="button"
                      className="quick-status-btn quick-btn-resolve"
                      onClick={() => handleStatusChange(c, 'Resolved')}
                      disabled={updatingId === c._id}
                      title="Mark task as Resolved (saves immediately)"
                    >
                      <i className="fas fa-check"></i> Complete
                    </button>
                  )}
                  {c.status !== 'Pending' && (
                    <button
                      type="button"
                      className="quick-status-btn quick-btn-pending"
                      onClick={() => handleStatusChange(c, 'Pending')}
                      disabled={updatingId === c._id}
                      title="Move task back to New / Pending (saves immediately)"
                    >
                      <i className="fas fa-undo"></i> Reopen
                    </button>
                  )}
                </div>

                {/* Remark / Update note row */}
                <div className="remark-input-row">
                  <div className="remark-input-group">
                    <input
                      type="text"
                      placeholder="Add an update note for student (Press Enter to send)..."
                      value={remarkText[c._id] || ''}
                      onChange={e => setRemarkText({ ...remarkText, [c._id]: e.target.value })}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSendRemark(c);
                        }
                      }}
                      disabled={updatingId === c._id}
                    />
                  </div>

                  <button
                    type="button"
                    className="btn-primary btn-small note-send-btn"
                    onClick={() => handleSendRemark(c)}
                    disabled={updatingId === c._id || !(remarkText[c._id] && remarkText[c._id].trim())}
                    title="Send update note to student"
                  >
                    {updatingId === c._id ? (
                      <><i className="fas fa-spinner fa-spin"></i> Sending...</>
                    ) : (
                      <><i className="fas fa-paper-plane"></i> Send Note</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredComplaints.length === 0 && (
            <div className="empty-state">
              <i className="fas fa-inbox fa-3x"></i>
              <h4>No complaints found</h4>
              <p>
                {activeTab !== 'all'
                  ? `There are currently no tasks marked as "${activeTab}".`
                  : 'No complaints match your current search or category filter.'}
              </p>
              {(activeTab !== 'all' || searchQuery || categoryFilter !== 'All') && (
                <button
                  className="btn-secondary btn-small"
                  style={{ marginTop: '10px' }}
                  onClick={() => { setActiveTab('all'); setSearchQuery(''); setCategoryFilter('All'); }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT CARD: ANALYTICS DASHBOARD */}
      <div className="card">
        <div className="card-title"><i className="fas fa-chart-line"></i> Analytics Dashboard</div>
        <div className="card-sub">Real-time complaint insights & distribution</div>

        <div className="analytics-row">
          <div className="stat-card stat-total" onClick={() => setActiveTab('all')} style={{ cursor: 'pointer' }} title="Show All Tasks">
            <i className="fas fa-folder-open"></i>
            <h3>{totalCount}</h3>
            <span>Total Tasks</span>
          </div>
          <div className="stat-card stat-pending" onClick={() => setActiveTab('Pending')} style={{ cursor: 'pointer' }} title="Show New / Pending Tasks">
            <i className="fas fa-clock"></i>
            <h3>{newCount}</h3>
            <span>New Tasks</span>
          </div>
          <div className="stat-card stat-progress" onClick={() => setActiveTab('In Progress')} style={{ cursor: 'pointer' }} title="Show In Progress Tasks">
            <i className="fas fa-spinner"></i>
            <h3>{inProgressCount}</h3>
            <span>In Progress</span>
          </div>
          <div className="stat-card stat-resolved" onClick={() => setActiveTab('Resolved')} style={{ cursor: 'pointer' }} title="Show Completed Tasks">
            <i className="fas fa-check-circle"></i>
            <h3>{completedCount}</h3>
            <span>Completed</span>
          </div>
        </div>

        <div className="chart-container">
          <div className="chart-header">
            <strong>Distribution by Category</strong>
          </div>
          <canvas ref={chartRef} id="categoryChart"></canvas>
        </div>

        <hr />

        <div className="ai-insight">
          <i className="fas fa-robot"></i>
          <div>
            <strong>Smart Campus System Insight</strong>
            <p>
              Most reported category is <strong>"{topCat || 'None'}"</strong>.
              {newCount > 0
                ? ` You have ${newCount} new pending task(s) awaiting review.`
                : ' All new tasks have been addressed!'}
            </p>
          </div>
        </div>
      </div>

      {/* FULLSCREEN LIGHTBOX MODAL FOR ADMIN */}
      {viewingMedia && (
        <div className="modal media-lightbox-modal" onClick={() => setViewingMedia(null)}>
          <div className="lightbox-content" onClick={e => e.stopPropagation()}>
            <div className="lightbox-header">
              <span><i className="fas fa-paperclip"></i> {viewingMedia.title || viewingMedia.name || 'Attachment'}</span>
              <button className="close-btn" onClick={() => setViewingMedia(null)}>&times;</button>
            </div>
            <div className="lightbox-body">
              {viewingMedia.type === 'video' ? (
                <video src={viewingMedia.url} controls autoPlay className="lightbox-video" />
              ) : (
                <img src={viewingMedia.url} alt="Full Attachment" className="lightbox-img" />
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
