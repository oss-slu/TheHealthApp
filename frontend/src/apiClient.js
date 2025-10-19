// src/apiClient.js
import axios from 'axios';

// Get base URL from environment or fallback (backend uses /api/v1)
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

const apiClient = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to get token (customize as per your auth storage)
function getAccessToken() {
  return localStorage.getItem('access_token');
}

// Helper to get refresh token
function getRefreshToken() {
  return localStorage.getItem('refresh_token');
}

// Helper to set new tokens
export function setTokens({ access, refresh }) {
  if (access) localStorage.setItem('access_token', access);
  if (refresh) localStorage.setItem('refresh_token', refresh);
}

// Helper to logout
function logout() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  window.location.href = '/auth/login';
}

// Request interceptor: attach Authorization header
apiClient.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 and errors
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;
    if (!originalRequest) {
      showToast(error);
      return Promise.reject(error);
    }

    // Avoid infinite loop
    if (originalRequest._retry) {
      showToast(error);
      return Promise.reject(error);
    }

    if (error.response && error.response.status === 401) {
      if (isRefreshing) {
        return new Promise(function (resolve, reject) {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = 'Bearer ' + token;
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;
      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');

        // Use apiClient so baseURL (/api/v1) is applied
        const res = await apiClient.post('/auth/refresh', { refresh_token: refreshToken });
        // Backend responds with { success: true, data: { access_token, refresh_token, ... } }
        const access = res?.data?.data?.access_token;
        const refresh = res?.data?.data?.refresh_token || refreshToken;
        if (!access) throw new Error('Refresh failed');

        setTokens({ access, refresh });
        apiClient.defaults.headers.Authorization = 'Bearer ' + access;
        processQueue(null, access);
        return apiClient(originalRequest);
      } catch (err) {
        processQueue(err, null);
        logout();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    showToast(error);
    return Promise.reject(error);
  }
);

// Toast handler (replace with your i18n/toast system)
function showToast(error) {
  // Try to use i18n if available
  let messageKey = null;
  if (error.response) {
    // Server-provided structured error
    messageKey = error.response?.data?.error?.message || error.response?.data?.message;
  } else if (error.message) {
    messageKey = error.message;
  }
  // If i18n is present, prefer translated messages
  try {
    // eslint-disable-next-line global-require
    const i18n = require('../i18n').default;
    const t = i18n.t.bind(i18n);
    const text = messageKey || t('networkError');
    showDomToast(text);
  } catch (e) {
    showDomToast(messageKey || 'Network error');
  }
}

function showDomToast(text) {
  // Simple, non-blocking toast fallback using DOM. Small and unobtrusive.
  try {
    const id = 'app-toast';
    let el = document.getElementById(id);
    if (!el) {
      el = document.createElement('div');
      el.id = id;
      el.style.position = 'fixed';
      el.style.right = '20px';
      el.style.top = '20px';
      el.style.zIndex = 9999;
      document.body.appendChild(el);
    }
    const msg = document.createElement('div');
    msg.textContent = text;
    msg.style.background = 'rgba(0,0,0,0.8)';
    msg.style.color = 'white';
    msg.style.padding = '8px 12px';
    msg.style.marginTop = '8px';
    msg.style.borderRadius = '6px';
    msg.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
    el.appendChild(msg);
    setTimeout(() => { msg.style.opacity = '0'; msg.remove(); }, 4000);
  } catch (e) {
    // Fallback to alert if DOM toast fails
    if (window && window.alert) window.alert(text);
  }
}

export default apiClient;
