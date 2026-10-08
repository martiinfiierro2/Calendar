import { apiRequest } from './apiClient';

const SESSION_KEY = 'calendar_session';

function saveSession(data) {
  const usuario = data.usuario || data.user;
  const session = { ...usuario, token: data.token, ...(data.verificacionCorreo ? { verificacionCorreo: data.verificacionCorreo } : {}) };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event('calendar-session-changed'));
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

export async function registerUser({ nombre, email, password, accountType, invitationToken }) {
  const options = {
    method: 'POST',
    body: JSON.stringify({ nombre: nombre.trim(), email: email.trim(), password, ...(invitationToken ? { invitationToken } : { accountType: accountType.trim() }) })
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
    // Una respuesta tardía no debe restaurar una sesión que ya se cerró.
    if (getSession()?.token !== session.token) return getSession();
    return saveSession({ usuario: data.usuario || data.user, token: session.token, verificacionCorreo: session.verificacionCorreo });
  } catch (error) {
    if (error.status !== 401) throw error;
    if (getSession()?.token !== session.token) return getSession();
    logoutUser();
    return null;
  }
}

export function logoutUser() {
  localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event('calendar-session-changed'));
}

export function cancelPendingRegistration() {
  return apiRequest('/autenticacion/registro-pendiente', { method: 'DELETE' });
}
