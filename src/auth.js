const USERS_KEY = 'calendar_users';
const SESSION_KEY = 'calendar_session';

const normalizarEmail = (email) => email.trim().toLowerCase();

async function hashPassword(password) {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

function cargarUsuarios() {
  try {
    const usuarios = JSON.parse(localStorage.getItem(USERS_KEY));
    return Array.isArray(usuarios) ? usuarios : [];
  } catch {
    return [];
  }
}

export function obtenerSesion() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

export function haySesion() {
  return Boolean(obtenerSesion()?.email);
}

export async function registrarUsuario({ nombre, email, password }) {
  const emailNormalizado = normalizarEmail(email);
  const usuarios = cargarUsuarios();

  if (usuarios.some(usuario => usuario.email === emailNormalizado)) {
    throw new Error('Ya existe una cuenta con ese email.');
  }

  const usuario = {
    id: Date.now(),
    nombre: nombre.trim(),
    email: emailNormalizado,
    passwordHash: await hashPassword(password)
  };

  localStorage.setItem(USERS_KEY, JSON.stringify([...usuarios, usuario]));

  const sesion = { id: usuario.id, nombre: usuario.nombre, email: usuario.email };
  localStorage.setItem(SESSION_KEY, JSON.stringify(sesion));

  try {
    const perfilActual = JSON.parse(localStorage.getItem('calendar_perfil')) || {};
    localStorage.setItem('calendar_perfil', JSON.stringify({ ...perfilActual, nombre: usuario.nombre, email: usuario.email }));
  } catch {}

  return sesion;
}

export async function iniciarSesion({ email, password }) {
  const emailNormalizado = normalizarEmail(email);
  const passwordHash = await hashPassword(password);
  const usuario = cargarUsuarios().find(item => item.email === emailNormalizado && item.passwordHash === passwordHash);

  if (!usuario) {
    throw new Error('Email o contraseña incorrectos.');
  }

  const sesion = { id: usuario.id, nombre: usuario.nombre, email: usuario.email };
  localStorage.setItem(SESSION_KEY, JSON.stringify(sesion));
  return sesion;
}

export function cerrarSesion() {
  localStorage.removeItem(SESSION_KEY);
}
