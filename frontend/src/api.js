const API_BASE = 'http://localhost:8000/api/v1';

const apiCall = async (url, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const accessToken = localStorage.getItem('accessToken');
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${API_BASE}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          const newAccessToken = data.data.access_token;
          localStorage.setItem('accessToken', newAccessToken);

          // Retry the original request once with new token
          const retryHeaders = { ...headers, Authorization: `Bearer ${newAccessToken}` };
          const retryResponse = await fetch(`${API_BASE}${url}`, {
            ...options,
            headers: retryHeaders,
          });
          return retryResponse;
        }
      } catch (error) {
        console.error('Refresh failed:', error);
      }
    }

    // Refresh failed or no refresh token, logout
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/auth/login';
    throw new Error('Unauthorized');
  }

  return response;
};

const api = {
  get: (url) => apiCall(url, { method: 'GET' }),
  post: (url, data) => apiCall(url, { method: 'POST', body: JSON.stringify(data) }),
  patch: (url, data) => apiCall(url, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (url) => apiCall(url, { method: 'DELETE' }),
};

export default api;