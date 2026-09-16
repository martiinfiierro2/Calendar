import { apiRequest } from './apiClient';

function normalizeUser(user) {
  return {
    ...user,
    nombre: user?.nombre ?? '',
    email: user?.email ?? '',
    recordatorios: Boolean(user?.recordatorios)
  };
}

export async function getUser() {
  const user = await apiRequest('/perfil');
  return normalizeUser(user);
}

export async function updateUser(data) {
  const user = await apiRequest('/perfil', {
    method: 'PUT',
    body: JSON.stringify(data)
  });

  return normalizeUser(user);
}