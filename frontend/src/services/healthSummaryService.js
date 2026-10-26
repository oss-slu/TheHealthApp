import apiClient from '../api/client';

export const healthSummaryService = {
  getSummary(startDate, endDate) {
    const startAt = new Date(`${startDate}T00:00:00`);
    const endBefore = new Date(`${endDate}T00:00:00`);
    endBefore.setDate(endBefore.getDate() + 1);

    return apiClient.get('/users/me/health-summary', {
      params: {
        start_date: startDate,
        end_date: endDate,
        start_at: startAt.toISOString(),
        end_before: endBefore.toISOString(),
      },
    });
  },
};