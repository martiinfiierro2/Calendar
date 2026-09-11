const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8080/api').replace(/\/$/, '');
const SESSION_KEY = 'calendar_session';

function getToken() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY))?.token || null;
  } catch {
    return null;
  }
}

export async function apiRequest(path, options = {}) {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const error = new Error(data?.message || 'No se pudo completar la petición.');
    error.status = response.status;
    error.errors = data?.errors || [];
    throw error;
  }

  return data;
}
