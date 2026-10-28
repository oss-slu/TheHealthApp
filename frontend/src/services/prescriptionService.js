

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

  async recordDose(id, status) {
    return apiClient.post(`/prescriptions/${id}/doses`, { status });
  },

  async getDoseHistory(id) {
    return apiClient.get(`/prescriptions/${id}/doses`);
  },

  async getReminder(id) {
    return apiClient.get(`/prescriptions/${id}/reminder`);
  },

  async createReminder(id, payload) {
    return apiClient.post(`/prescriptions/${id}/reminder`, payload);
  },

  async updateReminder(id, payload) {
    return apiClient.patch(`/prescriptions/${id}/reminder`, payload);
  },
};
