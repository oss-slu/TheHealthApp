import apiClient from '../api/client';

export const prescriptionService = {
  async getAll() {
    return apiClient.get('/prescriptions');
  },

  async update(id, payload) {
    return apiClient.put(`/prescriptions/${id}`, payload);
  },

  async archive(id) {
    return apiClient.patch(`/prescriptions/${id}/archive`);
  },
};
