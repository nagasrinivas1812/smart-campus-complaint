import { useState, useEffect } from 'react';
import { complaints } from '../api';

export default function StudentDashboard({ user }) {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ title: '', category: '', description: '' });
  const [media, setMedia] = useState(null); // { url, type: 'image' | 'video', name, size }
  const [viewingMedia, setViewingMedia] = useState(null); // Lightbox preview
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'Pending' | 'In Progress' | 'Resolved'
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [submitting, setSubmitting] = useState(false);
  const [submitFeedback, setSubmitFeedback] = useState({ type: '', msg: '' });

  const load = async () => {
    try {
      const data = await complaints.my();
      setList(data.data || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (c) => {
    const confirm = window.confirm(`Are you sure you want to delete "${c.title}"? This cannot be undone.`);
    if (!confirm) return;
    try {
      await complaints.delete(c._id);
      setList(prev => prev.filter(item => item._id !== c._id));
      setSubmitFeedback({ type: 'success', msg: `Complaint #${c._id.slice(-6)} deleted successfully!` });
      setTimeout(() => setSubmitFeedback({ type: '', msg: '' }), 4000);
      load();
    } catch (err) {
      alert('Error deleting complaint: ' + err.message);
    }
  };

  useEffect(() => { load(); }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size limit: 25MB
    if (file.size > 25 * 1024 * 1024) {
      alert('The selected file is too large (maximum allowed size is 25MB). Please select a smaller photo or video.');
      e.target.value = '';
      return;
    }

    const isVideo = file.type.startsWith('video');
    const isImage = file.type.startsWith('image');
    if (!isImage && !isVideo) {
      alert('Please upload an image (PNG, JPG, WEBP, GIF) or video (MP4, WEBM) file.');
      e.target.value = '';
      return;
    }

    const sizeStr = file.size > 1024 * 1024
      ? (file.size / (1024 * 1024)).toFixed(1) + ' MB'
      : (file.size / 1024).toFixed(0) + ' KB';

    const reader = new FileReader();
    reader.onload = (event) => {
      setMedia({
        url: event.target.result,
        type: isVideo ? 'video' : 'image',
        name: file.name,
        size: sizeStr,
      });
    };
    reader.readAsDataURL(file);
  };

  const removeMedia = () => {
    setMedia(null);
    const input = document.getElementById('student-media-input');
    if (input) input.value = '';
  };

  const submit = async () => {
    if (!form.title || !form.category) {
      setSubmitFeedback({ type: 'error', msg: 'Please provide both Title and Category.' });
      return;
    }
    setSubmitting(true);
    setSubmitFeedback({ type: '', msg: '' });
    try {
      await complaints.create({
        ...form,
        description: form.description || 'No description provided',
        mediaUrl: media?.url || '',
        mediaType: media?.type || 'none',
        mediaName: media?.name || '',
      });
      setSubmitFeedback({ type: 'success', msg: 'Complaint filed successfully! Tracking initiated.' });
      setForm({ title: '', category: '', description: '' });
      removeMedia();
      load();
      setTimeout(() => setSubmitFeedback({ type: '', msg: '' }), 4000);
    } catch (e) {
      setSubmitFeedback({ type: 'error', msg: e.message || 'Failed to submit complaint.' });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleString() : 'Just now';

  // Counts
  const totalCount = list.length;
  const newCount = list.filter(c => c.status === 'Pending').length;
  const inProgressCount = list.filter(c => c.status === 'In Progress').length;
  const completedCount = list.filter(c => c.status === 'Resolved').length;

  // Filtered list
  const filteredList = list.filter(c => {
    if (activeTab !== 'all' && c.status !== activeTab) return false;
    if (categoryFilter !== 'All' && c.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (c.title || '').toLowerCase().includes(q);
      const matchDesc = (c.description || '').toLowerCase().includes(q);
      const matchId = (c._id || '').toLowerCase().includes(q);
      if (!matchTitle && !matchDesc && !matchId) return false;
    }
    return true;
  });

  return (
    <div className="dashboard-grid">
      {/* LEFT CARD: NEW COMPLAINT FORM WITH PHOTO/VIDEO ATTACHMENT */}
      <div className="card">
        <div className="card-title"><i className="fas fa-plus-circle"></i> File a Complaint</div>
        <div className="card-sub">Welcome, {user?.name || 'Student'} &bull; Report campus issues</div>

        {submitFeedback.msg && (
          <div className={submitFeedback.type === 'error' ? 'error-message' : 'success-message'}>
            {submitFeedback.type === 'error' ? <i className="fas fa-exclamation-circle"></i> : <i className="fas fa-check-circle"></i>}{' '}
            {submitFeedback.msg}
          </div>
        )}

        <form onSubmit={e => { e.preventDefault(); submit(); }}>
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              required
              placeholder="e.g., Broken AC in 2nd Floor Library"
            />
          </div>

          <div className="form-group">
            <label>Category *</label>
            <select
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value })}
              required
            >
              <option value="">Select Category</option>
              {['Infrastructure', 'Internet', 'Cleanliness', 'Electrical', 'Furniture', 'Other'].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Detailed Description</label>
            <textarea
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              rows="3"
              placeholder="Describe the issue, specific room / location, and impact..."
            ></textarea>
          </div>

          {/* Photo / Video Attachment Upload Box */}
          <div className="form-group">
            <label>
              <i className="fas fa-paperclip"></i> Attach Evidence Photo or Video (Optional)
            </label>
            <div className="file-upload-box">
              <input
                type="file"
                id="student-media-input"
                accept="image/*,video/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />

              {!media ? (
                <label htmlFor="student-media-input" className="file-upload-label">
                  <div className="upload-icons-row">
                    <i className="fas fa-camera"></i>
                    <i className="fas fa-video"></i>
                  </div>
                  <strong>Click or Drag to Upload Photo / Video</strong>
                  <span className="upload-hint">Supports PNG, JPG, MP4, WebM (Max 25MB)</span>
                </label>
              ) : (
                <div className="media-preview-container">
                  <div className="media-preview-badge">
                    <i className={media.type === 'video' ? 'fas fa-video' : 'fas fa-image'}></i>
                    <span>{media.type === 'video' ? 'Video Attached' : 'Photo Attached'}</span>
                  </div>

                  {media.type === 'image' ? (
                    <img src={media.url} alt="Attached Preview" className="media-preview-img" />
                  ) : (
                    <video src={media.url} controls className="media-preview-video" preload="metadata" />
                  )}

                  <div className="media-preview-info">
                    <span className="media-filename-txt" title={media.name}>
                      <i className="fas fa-file"></i> {media.name} ({media.size})
                    </span>
                    <button type="button" className="remove-media-btn" onClick={removeMedia}>
                      <i className="fas fa-trash-alt"></i> Remove
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? (
              <><i className="fas fa-spinner fa-spin"></i> Submitting Ticket...</>
            ) : (
              <><i className="fas fa-paper-plane"></i> Submit Complaint</>
            )}
          </button>
        </form>
      </div>

      {/* RIGHT CARD: MY COMPLAINTS WITH TASK TABS & MEDIA PREVIEW */}
      <div className="card">
        <div className="card-header-row">
          <div>
            <div className="card-title"><i className="fas fa-list-check"></i> My Complaints</div>
            <div className="card-sub">Track real-time progress and administrator feedback</div>
          </div>
          <button className="refresh-mini-btn" onClick={load} title="Refresh My Tickets">
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
            All <span className="tab-pill-badge">{totalCount}</span>
          </button>
          <button
            type="button"
            className={`tab-pill tab-new ${activeTab === 'Pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('Pending')}
          >
            <i className="fas fa-clock"></i> New <span className="tab-pill-badge badge-pending">{newCount}</span>
          </button>
          <button
            type="button"
            className={`tab-pill tab-progress ${activeTab === 'In Progress' ? 'active' : ''}`}
            onClick={() => setActiveTab('In Progress')}
          >
            <i className="fas fa-tools"></i> In Progress <span className="tab-pill-badge badge-progress">{inProgressCount}</span>
          </button>
          <button
            type="button"
            className={`tab-pill tab-resolved ${activeTab === 'Resolved' ? 'active' : ''}`}
            onClick={() => setActiveTab('Resolved')}
          >
            <i className="fas fa-check-circle"></i> Completed <span className="tab-pill-badge badge-resolved">{completedCount}</span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="task-filter-controls">
          <div className="search-input-wrap">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search your tickets..."
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

        {/* Complaint list */}
        <div className="complaint-list">
          {filteredList.map(c => (
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
                    title="Delete this complaint"
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </div>
              </div>

              <div className="complaint-meta">
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
                      title="Click to view full image"
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
                  <i className="fas fa-reply"></i> <strong>Admin Response:</strong> {c.adminRemarks}
                </div>
              )}
            </div>
          ))}

          {filteredList.length === 0 && (
            <div className="empty-state">
              <i className="fas fa-inbox fa-3x"></i>
              <h4>No complaints in this view</h4>
              <p>
                {activeTab !== 'all'
                  ? `You have no tickets currently under "${activeTab}".`
                  : 'You have not submitted any complaints yet.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* FULLSCREEN LIGHTBOX MODAL FOR IMAGES / VIDEOS */}
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
  );
}
