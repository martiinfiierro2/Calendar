import { obtenerSesion } from './auth';

const BASE_KEYS = new Set(['calendar_recetas', 'calendar_comidas', 'calendar_compra', 'calendar_perfil']);
let activado = false;
let escribiendoAutomatico = false;

function sufijoUsuario() {
  const sesion = obtenerSesion();
  return sesion?.id || sesion?.email || 'anon';
}

function claveReal(key) {
  if (!BASE_KEYS.has(key)) return key;
  return `${key}_${sufijoUsuario()}`;
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

function generarCompraAutomatica(storage, comidas) {
  if (escribiendoAutomatico) return;
  try {
    const perfil = JSON.parse(storage.getItem('calendar_perfil') || 'null');
    if (!perfil?.comprasAutomaticas) return;

    const recetas = JSON.parse(storage.getItem('calendar_recetas') || '[]');
    if (!Array.isArray(recetas) || !recetas.length) return;

    const compra = JSON.parse(storage.getItem('calendar_compra') || '[]');
    const existentes = Array.isArray(compra) ? compra : [];
    const vistos = new Set(existentes.map(item => String(item.nombre || '').trim().toLowerCase()));
    const nuevos = [];

    comidas.filter(comida => comida?.modo === 'receta').forEach(comida => {
      const receta = recetas.find(item => String(item.id) === String(comida.recetaId));
      (receta?.ingredientes || []).forEach(ingrediente => {
        const nombre = String(ingrediente).trim();
        const clave = nombre.toLowerCase();
        if (!nombre || vistos.has(clave)) return;
        vistos.add(clave);
        nuevos.push({
          id: `auto-${Date.now()}-${nuevos.length}`,
          nombre,
          cantidad: '1',
          categoria: categoriaIngrediente(nombre),
          comprado: false,
          automatico: true
        });
      });
    });

    if (nuevos.length) {
      escribiendoAutomatico = true;
      storage.setItem('calendar_compra', JSON.stringify([...nuevos, ...existentes]));
      escribiendoAutomatico = false;
    }
  } catch {
    escribiendoAutomatico = false;
  }
}

export function activarStoragePorUsuario() {
  if (activado || typeof window === 'undefined') return;
  activado = true;

  const storage = window.localStorage;
  const getOriginal = Storage.prototype.getItem;
  const setOriginal = Storage.prototype.setItem;
  const removeOriginal = Storage.prototype.removeItem;

  Storage.prototype.getItem = function getItemScoped(key) {
    if (this !== storage || !BASE_KEYS.has(key)) return getOriginal.call(this, key);
    const scopedKey = claveReal(key);
    const scoped = getOriginal.call(this, scopedKey);
    if (scoped !== null) return scoped;

    const legacy = getOriginal.call(this, key);
    if (legacy !== null && obtenerSesion()?.email) {
      setOriginal.call(this, scopedKey, legacy);
      removeOriginal.call(this, key);
      return legacy;
    }
    return legacy;
  };

  Storage.prototype.setItem = function setItemScoped(key, value) {
    if (this !== storage || !BASE_KEYS.has(key)) return setOriginal.call(this, key, value);
    const result = setOriginal.call(this, claveReal(key), value);
    if (key === 'calendar_comidas' && !escribiendoAutomatico) {
      try {
        const comidas = JSON.parse(value);
        if (Array.isArray(comidas)) generarCompraAutomatica(this, comidas);
      } catch {}
    }
    return result;
  };

  Storage.prototype.removeItem = function removeItemScoped(key) {
    if (this !== storage || !BASE_KEYS.has(key)) return removeOriginal.call(this, key);
    return removeOriginal.call(this, claveReal(key));
  };
}
