import { PERFIL_INICIAL } from '../config/appConfig';
import { writeStorageForUser } from './storageService';

const USERS_KEY = 'calendar_users';
const SESSION_KEY = 'calendar_session';

const normalizeEmail = (email) => email.trim().toLowerCase();

// Para esta fase local guardamos un hash y nunca la contraseña en texto plano.
async function hashPassword(password) {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

function getUsers() {
  try {
    const users = JSON.parse(localStorage.getItem(USERS_KEY));
    return Array.isArray(users) ? users : [];
  } catch {
    return [];
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
  return Boolean(getSession()?.email);
}

export async function registerUser({ nombre, email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const users = getUsers();

  if (users.some(user => user.email === normalizedEmail)) {
    throw new Error('Ya existe una cuenta con ese email.');
  }

  const user = {
    id: Date.now(),
    nombre: nombre.trim(),
    email: normalizedEmail,
    passwordHash: await hashPassword(password)
  };

  localStorage.setItem(USERS_KEY, JSON.stringify([...users, user]));

  const session = { id: user.id, nombre: user.nombre, email: user.email };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));

  // El perfil queda creado desde el registro y ya pertenece a esta cuenta.
  writeStorageForUser('calendar_perfil', user.id, {
    ...PERFIL_INICIAL,
    nombre: user.nombre,
    email: user.email
  });

  return session;
}

export async function loginUser({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const passwordHash = await hashPassword(password);
  const user = getUsers().find(item => (
    item.email === normalizedEmail && item.passwordHash === passwordHash
  ));

  if (!user) throw new Error('Email o contraseña incorrectos.');

  const session = { id: user.id, nombre: user.nombre, email: user.email };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function logoutUser() {
  localStorage.removeItem(SESSION_KEY);
}
