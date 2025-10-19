// Minimal API client wrapper for authenticated requests
const BASE = '/api/v1';

function getAuthHeader() {
  const token = localStorage.getItem('accessToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, opts = {}) {
  const headers = Object.assign({}, opts.headers || {}, getAuthHeader());
  const res = await fetch(`${BASE}${path}`, Object.assign({}, opts, { headers }));
  const contentType = res.headers.get('content-type') || '';
  if (!res.ok) {
    let body = null;
    try { body = contentType.includes('application/json') ? await res.json() : await res.text(); } catch (e) { body = null; }
    const err = new Error('Network response was not ok');
    err.status = res.status;
    err.body = body;
    throw err;
  }
  if (contentType.includes('application/json')) return res.json();
  return res.text();
}

export async function getCurrentUser() {
  return request('/users/me', { method: 'GET' });
}

// Update current user profile (multipart allowed for photo)
export async function updateCurrentUser(formData) {
  // formData is expected to be a FormData instance for multipart
  const headers = Object.assign({}, getAuthHeader());
  // Note: do NOT set Content-Type header when sending FormData; the browser sets boundary
  const res = await fetch(`${BASE}/users/me`, {
    method: 'PATCH',
    headers,
    body: formData,
  });
  const contentType = res.headers.get('content-type') || '';
  if (!res.ok) {
    let body = null;
    try { body = contentType.includes('application/json') ? await res.json() : await res.text(); } catch (e) { body = null; }
    const err = new Error('Update failed');
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return contentType.includes('application/json') ? res.json() : null;
}

export default { getCurrentUser, updateCurrentUser };
