import { apiRequest } from './apiClient';

const SESSION_KEY = 'calendar_session';

function saveSession(data) {
  const session = { ...data.user, token: data.token };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

export function hasSession() {
  return Boolean(getSession()?.token);
}

export async function registerUser({ nombre, email, password }) {
  const data = await apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ nombre: nombre.trim(), email: email.trim(), password })
  });

  return saveSession(data);
}

export async function loginUser({ email, password }) {
  const data = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim(), password })
  });

  return saveSession(data);
}

export async function refreshSession() {
  const session = getSession();
  if (!session?.token) return null;

  try {
    const data = await apiRequest('/auth/me');
    return saveSession({ user: data.user, token: session.token });
  } catch {
    logoutUser();
    return null;
  }
}

export function logoutUser() {
  localStorage.removeItem(SESSION_KEY);
}
