import { apiRequest } from './apiClient';

function normalizarComida(comida) {
  return {
    ...comida,
    recetaId: comida?.recetaId ?? comida?.recipeId ?? null,
    hora: comida?.hora ? String(comida.hora).slice(0, 5) : '14:00'
  };
}

export async function obtenerComidas() {
  const comidas = await apiRequest('/comidas');
  return Array.isArray(comidas) ? comidas.map(normalizarComida) : [];
}

export async function crearComida(datos) {
  return normalizarComida(await apiRequest('/comidas', {
    method: 'POST',
    body: JSON.stringify(datos)
  }));
}

export async function actualizarComida(id, datos) {
  return normalizarComida(await apiRequest(`/comidas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(datos)
  }));
}

export async function eliminarComida(id) {
  await apiRequest(`/comidas/${id}`, { method: 'DELETE' });
}
