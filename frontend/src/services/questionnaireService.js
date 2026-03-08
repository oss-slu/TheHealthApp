import apiClient from '../api/client';

const withJson = (payload) => ({ ...payload });

export const questionnaireService = {
  async submit(payload) {
    return apiClient.post('/questionnaire/submit', withJson(payload));
  },

  async getQuestionnaire(id) {
    return apiClient.get(`/questionnaire/${id}`);
  },

  async getHistory() {
    return apiClient.get('/questionnaire/history');
  },
};
