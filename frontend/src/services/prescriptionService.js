
import apiClient from '../api/client';

export const prescriptionService = {
  async getAll() {
    return apiClient.get('/prescriptions');
  },

  async create(payload) {
    return apiClient.post('/prescriptions', payload);
  },

  async update(id, payload) {
    return apiClient.put(`/prescriptions/${id}`, payload);
  },

  async archive(id) {
    return apiClient.patch(`/prescriptions/${id}/archive`);
  },

  async recordDose(id, status, scheduledDate) {
  return apiClient.post(`/prescriptions/${id}/doses`, {
    status,
    scheduled_date: scheduledDate,
  });
},

  async getDoseHistory(id) {
    return apiClient.get(`/prescriptions/${id}/doses`);
  },
};
