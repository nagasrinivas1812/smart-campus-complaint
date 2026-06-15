const API_URL = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('campus_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

export const auth = {
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/auth/me'),
};

export const complaints = {
  my: () => request('/complaints/my'),
  create: (body) => request('/complaints', { method: 'POST', body: JSON.stringify(body) }),
};

export const admin = {
  complaints: () => request('/admin/complaints'),
  updateStatus: (id, body) => request(`/admin/complaints/${id}/status`, { method: 'PUT', body: JSON.stringify(body) }),
};
