
import apiClient from '../api/client';

export const healthTimelineService = {
  getTimeline({ limit = 20, offset = 0, category, startAt, endBefore } = {}) {
    const params = { limit, offset };

    if (category) params.category = category;
    if (startAt) params.start_at = startAt;
    if (endBefore) params.end_before = endBefore;

    return apiClient.get('/users/me/health-timeline', { params });
  },
};
