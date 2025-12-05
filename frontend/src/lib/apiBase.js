const deriveFromEnv = () => {
  const envUrl = import.meta.env?.VITE_API_BASE_URL ?? import.meta.env?.VITE_API_URL;
  if (envUrl) {
    return envUrl.replace(/\/$/, '');
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;

    if (hostname.includes('.github.dev')) {
      const backendHost = hostname.replace(/-\d+\./, '-8000.');
      return `${protocol}//${backendHost}/api/v1`;
    }

    const needsPort = !hostname.includes(':');
    const backendHost = needsPort ? `${hostname}:8000` : hostname;
    return `${protocol}//${backendHost}/api/v1`;
  }

  return 'http://localhost:8000/api/v1';
};

export const deriveApiBaseUrl = () => deriveFromEnv();

export const API_BASE_URL = deriveApiBaseUrl();

export const deriveApiOrigin = (baseUrl = API_BASE_URL) => {
  const normalized = baseUrl.replace(/\/$/, '');
  const match = normalized.match(/^(.*)\/api\/v\d+$/i);
  if (match) {
    return match[1];
  }
  return normalized;
};

export const API_ORIGIN = deriveApiOrigin();
