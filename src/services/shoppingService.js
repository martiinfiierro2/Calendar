import { PERFIL_INICIAL } from '../config/appConfig';
import { apiRequest } from './apiClient';
import { readStorage } from './storageService';

export async function fetchShoppingItems() {
  const items = await apiRequest('/compra');
  return Array.isArray(items) ? items : [];
}

export async function createShoppingItem(data) {
  return apiRequest('/compra', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateShoppingItem(id, data) {
  return apiRequest(`/compra/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function deleteShoppingItem(id) {
  await apiRequest(`/compra/${id}`, { method: 'DELETE' });
}

export async function createItemsFromCalendar() {
  const items = await apiRequest('/compra/desde-calendario', { method: 'POST' });
  return Array.isArray(items) ? items : [];
}

// Hasta migrar el perfil, esta preferencia sigue leyéndose de la caché local.
export async function syncAutomaticShopping() {
  const profile = readStorage('calendar_perfil', PERFIL_INICIAL) || PERFIL_INICIAL;
  if (!profile.comprasAutomaticas) return [];

  try {
    return await createItemsFromCalendar();
  } catch {
    return [];
  }
}
