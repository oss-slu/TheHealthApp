// Use absolute backend URL when running locally (dev server), otherwise use relative path
const isLocalhost = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const BASE = isLocalhost ? 'http://127.0.0.1:8000/api/v1' : '/api/v1';

let unauthorizedHandler = null;
export function setUnauthorizedHandler(fn) {
  unauthorizedHandler = fn;
}

function getStoredTokens() {
  try {
    const raw = localStorage.getItem('tokens');
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // ignore
  }
  // fallback to individual keys
  const access_token = localStorage.getItem('access_token');
  const refresh_token = localStorage.getItem('refresh_token');
  if (access_token || refresh_token) return { access_token, refresh_token };
  return null;
}

export function setTokens(tokens) {
  if (!tokens) {
    localStorage.removeItem('tokens');
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    return;
  }
  localStorage.setItem('tokens', JSON.stringify(tokens));
  if (tokens.access_token) localStorage.setItem('access_token', tokens.access_token);
  if (tokens.refresh_token) localStorage.setItem('refresh_token', tokens.refresh_token);
}

export async function request(path, opts = {}) {
  const tokens = getStoredTokens();
  const headers = new Headers(opts.headers || {});
  headers.set('Accept', 'application/json');
  headers.set('Content-Type', 'application/json');
  if (tokens && tokens.access_token) {
    headers.set('Authorization', `Bearer ${tokens.access_token}`);
  }

  const res = await fetch(`${BASE}${path}`, { ...opts, headers });

  if (res.status === 401) {
    // notify handler (AuthProvider will clear tokens + redirect)
    if (typeof unauthorizedHandler === 'function') unauthorizedHandler();
    const err = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const err = new Error(data?.detail || 'API error');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export default { request, setTokens, setUnauthorizedHandler };
