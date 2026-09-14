/**
 * Maps an Axios success response to the value returned by apiClient.
 * Keeps behavior testable without importing the full axios instance.
 *
 * @param {import('axios').AxiosResponse} response
 * @returns {unknown}
 */
export function unwrapSuccessfulApiBody(response) {
  if (!response || typeof response !== 'object') {
    return response;
  }

  const outer = response.data;

  if (outer !== undefined && outer !== null && typeof outer === 'object' && 'data' in outer) {
    return outer.data;
  }

  if (outer !== undefined) {
    return outer;
  }

  if (response.status === 204) {
    return undefined;
  }

  return response;
}
