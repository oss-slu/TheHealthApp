export const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

async function parseJsonSafe(res) {
  try {
    return await res.json();
  } catch (_) {
    return null;
  }
}

export async function apiPost(path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const json = await parseJsonSafe(res);
  if (!res.ok) {
    const msg = json?.error?.message || json?.message || `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json?.data ?? json;
}

export default { apiPost };
