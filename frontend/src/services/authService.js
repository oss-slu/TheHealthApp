import apiClient from '../api/client';

const withJson = (payload) => JSON.parse(JSON.stringify(payload));

export const authService = {
  async login(credentials) {
    return apiClient.post('/auth/login', withJson(credentials));
  },
  async signup(payload) {
    return apiClient.post('/auth/signup', withJson(payload));
  },
  async forgotPassword(payload) {
    return apiClient.post('/auth/forgot-password', withJson(payload));
  },
  async logout() {
    return apiClient.post('/auth/logout', {}, { suppressToast: true, _skipAuthRefresh: true });
  },
  async getCurrentUser(options = {}) {
    return apiClient.get('/users/me', options);
  },
  async updateProfile(payload) {
    return apiClient.patch('/users/me', withJson(payload));
  },
  async uploadProfilePhoto(file) {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post('/users/me/photo', formData);
  },
};
