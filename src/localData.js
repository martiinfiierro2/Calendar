import { obtenerSesion } from './auth';

const LEGACY_KEYS = ['calendar_recetas', 'calendar_comidas', 'calendar_compra', 'calendar_perfil'];

function userId() {
  const sesion = obtenerSesion();
  return sesion?.id || sesion?.email || 'anon';
}

export function claveUsuario(base) {
  return `${base}_${userId()}`;
}

export function leerLocal(base, fallback) {
  try {
    const key = claveUsuario(base);
    const scoped = localStorage.getItem(key);
    if (scoped !== null) return JSON.parse(scoped);

    const legacy = localStorage.getItem(base);
    if (legacy !== null && LEGACY_KEYS.includes(base)) {
      localStorage.setItem(key, legacy);
      localStorage.removeItem(base);
      return JSON.parse(legacy);
    }
  } catch {}
  return fallback;
}

export function guardarLocal(base, value) {
  localStorage.setItem(claveUsuario(base), JSON.stringify(value));
}

export function borrarLocal(base) {
  localStorage.removeItem(claveUsuario(base));
}

export function borrarDatosUsuario() {
  LEGACY_KEYS.forEach(borrarLocal);
}

export function obtenerPerfilLocal() {
  return leerLocal('calendar_perfil', {
    nombre: 'Mi perfil',
    email: '',
    raciones: 2,
    dieta: 'Sin preferencias',
    recordatorios: true,
    resumenSemanal: true,
    comprasAutomaticas: false
  });
}

export function categoriaIngrediente(nombre = '') {
  const texto = nombre.toLowerCase();
  if (/(tomate|cebolla|zanahoria|pepino|pimiento|patata|lim[oó]n|verdura|fruta|ajo|calabac[ií]n|lechuga)/.test(texto)) return 'Fruta y verdura';
  if (/(pollo|carne|ternera|cerdo|jam[oó]n|salm[oó]n|pescado|at[uú]n|conejo)/.test(texto)) return 'Carne y pescado';
  if (/(leche|queso|yogur|mantequilla|nata)/.test(texto)) return 'Lácteos';
  if (/(pan|baguette|barra|tostada)/.test(texto)) return 'Panadería';
  if (/(arroz|pasta|harina|lenteja|garbanzo|aceite|vinagre|sal|pimienta|curry|azafr[aá]n|piment[oó]n)/.test(texto)) return 'Despensa';
  return 'Otros';
}
