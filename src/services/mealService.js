import { apiRequest } from './apiClient';

function normalizarComida(comida) {
  return {
    ...comida,
    recetaId: comida?.recetaId ?? comida?.recipeId ?? null,
    hora: comida?.hora ? String(comida.hora).slice(0, 5) : '14:00'
  };
}

async function requestComidas(path = '', options) {
  try {
    return await apiRequest(`/comidas${path}`, options);
  } catch (error) {
    if (error.status !== 404) throw error;
    return apiRequest(`/meals${path}`, options);
  }
}

export async function obtenerComidas() {
  const comidas = await requestComidas();
  return Array.isArray(comidas) ? comidas.map(normalizarComida) : [];
}

export async function crearComida(datos) {
  return normalizarComida(await requestComidas('', {
    method: 'POST',
    body: JSON.stringify(datos)
  }));
}

export async function actualizarComida(id, datos) {
  return normalizarComida(await requestComidas(`/${id}`, {
    method: 'PUT',
    body: JSON.stringify(datos)
  }));
}

export async function eliminarComida(id) {
  await requestComidas(`/${id}`, { method: 'DELETE' });
}
