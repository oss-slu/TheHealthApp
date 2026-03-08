const deriveFromEnv = () => {
  const envUrl = import.meta.env?.VITE_API_BASE_URL;
  if (envUrl && typeof envUrl === 'string') {
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
  throw new Error(
    'VITE_API_BASE_URL is not set. Copy frontend/.env.example to .env and set the API base URL. See README.'
  );
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
