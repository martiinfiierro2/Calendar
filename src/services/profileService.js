import { apiRequest } from './apiClient';

function normalizeProfile(profile) {
  return {
    ...profile,
    nombre: profile?.nombre ?? '',
    email: profile?.email ?? '',
    raciones: profile?.raciones ?? 1,
    dieta: profile?.dieta ?? '',
    recordatorios: Boolean(profile?.recordatorios),
    resumenSemanal: Boolean(profile?.resumenSemanal),
    comprasAutomaticas: Boolean(profile?.comprasAutomaticas)
  };
}

export async function getProfile() {
  const profile = await apiRequest('/perfil');
  return normalizeProfile(profile);
}

export async function updateProfile(data) {
  const profile = await apiRequest(`/perfil`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });

  return normalizeProfile(profile);
}