import apiClient from '../api/client';

// Errors are shown inline by the connected-apps section, so toasts are suppressed.
const quiet = { suppressToast: true };

export const integrationService = {
  async listConnections() {
    return apiClient.get('/users/me/connections', quiet);
  },
  async disconnect(connectionId, { deleteImportedData = false } = {}) {
    return apiClient.post(
      `/users/me/connections/${encodeURIComponent(connectionId)}/disconnect`,
      { delete_imported_data: deleteImportedData },
      quiet,
    );
  },
  async deleteImportedData(connectionId) {
    return apiClient.delete(`/users/me/connections/${encodeURIComponent(connectionId)}/measurements`, quiet);
  },
};
