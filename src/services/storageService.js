const SESSION_KEY = 'calendar_session';

// Estas claves pertenecen a cada usuario y no deben mezclarse entre cuentas.
const USER_KEYS = new Set([
  'calendar_recetas',
  'calendar_comidas',
  'calendar_compra',
  'calendar_perfil'
]);

function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY));
  } catch {
    return null;
  }
}

function getUserId() {
  const session = getSession();
  return session?.id || session?.email || 'anon';
}

// Genera la clave real que usamos en localStorage para el usuario conectado.
export function getStorageKey(baseKey, userId = getUserId()) {
  return USER_KEYS.has(baseKey) ? `${baseKey}_${userId}` : baseKey;
}

// Lee un valor del usuario y migra una clave antigua si todavía existe.
export function readStorage(baseKey, fallback = null) {
  try {
    const scopedKey = getStorageKey(baseKey);
    const scopedValue = localStorage.getItem(scopedKey);

    if (scopedValue !== null) return JSON.parse(scopedValue);

    const legacyValue = USER_KEYS.has(baseKey) ? localStorage.getItem(baseKey) : null;
    if (legacyValue !== null && getSession()?.email) {
      localStorage.setItem(scopedKey, legacyValue);
      localStorage.removeItem(baseKey);
      return JSON.parse(legacyValue);
    }
  } catch {
    return fallback;
  }

  return fallback;
}

// Guarda siempre en el espacio del usuario conectado.
export function writeStorage(baseKey, value) {
  localStorage.setItem(getStorageKey(baseKey), JSON.stringify(value));
}

export function removeStorage(baseKey) {
  localStorage.removeItem(getStorageKey(baseKey));
}

// Se usa al borrar los datos de la cuenta local actual.
export function clearUserData() {
  USER_KEYS.forEach(removeStorage);
}

// Permite preparar datos para un usuario recién registrado antes de cambiar de pantalla.
export function writeStorageForUser(baseKey, userId, value) {
  localStorage.setItem(getStorageKey(baseKey, userId), JSON.stringify(value));
}
