const API_URL = '/api';

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('campus_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  let res;
  try {
    res = await fetch(`${API_URL}${endpoint}`, { ...options, headers });
  } catch {
    throw new Error('Unable to connect to server. Please ensure the backend is running on port 5000.');
  }

  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('campus_token');
    }
    const message =
      data?.message ||
      (data?.errors && data.errors[0]?.msg) ||
      (res.status === 502 || res.status === 504
        ? 'Backend server is not reachable. Please ensure the backend is running on port 5000.'
        : `Request failed with status ${res.status}`);
    throw new Error(message);
  }

  return data ?? {};
}

export const auth = {
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  me: () => request('/auth/me'),
  updateProfile: (body) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(body) }),
  updatePassword: (body) => request('/auth/password', { method: 'PUT', body: JSON.stringify(body) }),
};

export const complaints = {
  my: () => request('/complaints/my'),
  create: (body) => request('/complaints', { method: 'POST', body: JSON.stringify(body) }),
  delete: (id) => request(`/complaints/${id}`, { method: 'DELETE' }),
};

export const admin = {
  complaints: () => request('/admin/complaints'),
  updateStatus: (id, body) => request(`/admin/complaints/${id}/status`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteComplaint: (id) => request(`/admin/complaints/${id}`, { method: 'DELETE' }),
};
