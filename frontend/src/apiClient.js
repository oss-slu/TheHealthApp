// src/apiClient.js
import axios from 'axios';

// Get base URL from environment or fallback
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

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
    const originalRequest = error.config;
    if (!originalRequest || originalRequest._retry) {
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
        const res = await axios.post(
          baseURL + '/auth/refresh',
          { refresh: refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );
        setTokens({ access: res.data.access, refresh: res.data.refresh });
        apiClient.defaults.headers.Authorization = 'Bearer ' + res.data.access;
        processQueue(null, res.data.access);
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
  let message = 'Network error';
  if (error.response) {
    // Server error
    message = error.response.data?.message || error.response.statusText;
  } else if (error.message) {
    message = error.message;
  }
  // TODO: Replace with your i18n/toast system
  if (window && window.alert) window.alert(message);
}

export default apiClient;
