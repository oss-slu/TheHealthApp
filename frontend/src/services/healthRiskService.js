import apiClient from '../api/client';

/**
 * Authenticated Framingham-style risk assessment. Always hits the backend;
 * there is no client-side mock or static fallback.
 */
export const healthRiskService = {
  calculateRisk(payload) {
    return apiClient.post('/health/risk-assessment', payload, {
      suppressToast: true,
    });
  },
};
