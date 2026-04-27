import apiClient from '../api/client';

const withJson = (payload) => JSON.parse(JSON.stringify(payload));

export const consentService = {
  async submit(payload) {
    return apiClient.post('/consent', withJson(payload));
  },
  async getStatus(options = {}) {
    return apiClient.get('/consent/status', options);
  },
};
