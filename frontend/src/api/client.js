import axios from 'axios';
import { authStorage } from '../lib/authStorage';
import { authBus } from '../lib/authBus';
import { mapApiError } from '../utils/errorMapper';
import { showErrorToast } from '../lib/toast';

const deriveApiBaseUrl = () => {
  const envUrl = import.meta.env?.VITE_API_BASE_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;

    if (hostname.includes('.github.dev')) {
      const backendHost = hostname.replace(/-\d+\./, '-8000.');
      return `${protocol}//${backendHost}/api/v1`;
    }

    const needsPort = !hostname.includes(':');
    const backendHost = needsPort ? `${hostname}:8000` : hostname;
    return `${protocol}//${backendHost}/api/v1`;
  }

  return 'http://localhost:8000/api/v1';
};

const API_BASE_URL = deriveApiBaseUrl();

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

let isRefreshing = false;
let refreshQueue = [];

const addRequestToQueue = (resolve, reject) => {
  refreshQueue.push({ resolve, reject });
};

const resolveQueue = (token) => {
  refreshQueue.forEach(({ resolve }) => {
    resolve(token);
  });
  refreshQueue = [];
};

const rejectQueue = (error) => {
  refreshQueue.forEach(({ reject }) => {
    reject(error);
  });
  refreshQueue = [];
};

const refreshAccessToken = async () => {
  const refreshToken = authStorage.getRefreshToken();
  if (!refreshToken) throw new Error('Missing refresh token');

  try {
    const response = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      { refresh_token: refreshToken },
      {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      },
    );

    const tokens = response.data?.data;
    if (!tokens?.access_token) {
      throw new Error('Invalid refresh response');
    }

    authStorage.setTokens(tokens);
    resolveQueue(tokens.access_token);
    return tokens.access_token;
  } catch (error) {
    const normalized = mapApiError(error);
    rejectQueue(normalized);
    authStorage.clear();
    authBus.emitLogout();
    showErrorToast('errors.sessionExpired');
    throw normalized;
  } finally {
    isRefreshing = false;
  }
};

apiClient.interceptors.request.use((config) => {
  const token = authStorage.getAccessToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const preferredLanguage = authStorage.getPreferredLanguage();
  if (preferredLanguage) {
    config.headers['Accept-Language'] = preferredLanguage;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    if (response?.data?.data !== undefined) {
      return response.data.data;
    }
    if (response?.data !== undefined) {
      return response.data;
    }
    if (response?.status === 204) {
      return undefined;
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.code === 'ECONNABORTED') {
      showErrorToast('errors.timeout');
    }

    if (!error.response) {
      showErrorToast('errors.network');
      return Promise.reject({ ...mapApiError(error), originalError: error });
    }

    const { status } = error.response;

    if (status === 401 && !originalRequest?._retry && !originalRequest?._skipAuthRefresh) {
      if (!authStorage.getRefreshToken()) {
        authStorage.clear();
        authBus.emitLogout();
        return Promise.reject({ ...mapApiError(error), originalError: error });
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          addRequestToQueue(resolve, reject);
        })
          .then((token) => {
            const retryConfig = {
              ...originalRequest,
              headers: {
                ...originalRequest.headers,
                Authorization: `Bearer ${token}`,
              },
              _retry: true,
            };
            return apiClient(retryConfig);
          })
          .catch((refreshError) => Promise.reject(refreshError));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        const retryConfig = {
          ...originalRequest,
          headers: {
            ...originalRequest.headers,
            Authorization: `Bearer ${newToken}`,
          },
        };
        return apiClient(retryConfig);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    const mapped = mapApiError(error);

    if (!originalRequest?.suppressToast && (!mapped.status || mapped.status >= 500)) {
      showErrorToast(mapped.messageKey, mapped.message);
    }

    return Promise.reject({ ...mapped, originalError: error });
  },
);

export default apiClient;
