import { apiRequest } from './apiClient';

const SESSION_KEY = 'calendar_session';

function saveSession(data) {
  const usuario = data.usuario || data.user;
  const session = { ...usuario, token: data.token };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

async function authRequest(rutaNueva, rutaAntigua, options) {
  try {
    return await apiRequest(rutaNueva, options);
  } catch (error) {
    if (error.status !== 404) throw error;
    return apiRequest(rutaAntigua, options);
  }
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
  const options = {
    method: 'POST',
    body: JSON.stringify({ nombre: nombre.trim(), email: email.trim(), password })
  };

  const data = await authRequest('/autenticacion/registro', '/auth/register', options);
  return saveSession(data);
}

export async function loginUser({ email, password }) {
  const options = {
    method: 'POST',
    body: JSON.stringify({ email: email.trim(), password })
  };

  const data = await authRequest('/autenticacion/acceso', '/auth/login', options);
  return saveSession(data);
}

export async function refreshSession() {
  const session = getSession();
  if (!session?.token) return null;

  try {
    const data = await authRequest('/autenticacion/yo', '/auth/me');
    return saveSession({ usuario: data.usuario || data.user, token: session.token });
  } catch {
    logoutUser();
    return null;
  }
}

export function logoutUser() {
  localStorage.removeItem(SESSION_KEY);
}
