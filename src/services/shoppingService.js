import { apiRequest } from './apiClient';

export async function getShoppingItems() {
  const items = await apiRequest('/compra');
  return Array.isArray(items) ? items : [];
}

export async function createShoppingItem(data) {
  return apiRequest('/compra', {
    method: 'POST',
    body: JSON.stringify({
      ...data,
      estado: data.estado || 'apuntado'
    })
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
