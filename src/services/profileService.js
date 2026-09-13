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

export async function getProfiles() {
  const profiles = await apiRequest('/perfil');
  return Array.isArray(profiles) ? profiles.map(normalizeProfile): [];
}

export async function getProfile(id) {
  const profile = await apiRequest(`/perfil/:${id}`);
  return Array.isArray(profile) ? profile.map(normalizeProfile): [];
}

export async function createProfile(data) {
  return normalizeProfile(await apiRequest('/perfil', {
    method: 'POST',
    body: JSON.stringify(data)
  }));
}

export async function updateProfile(id, data) {
  return normalizeProfile(await apiRequest(`/perfil/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }));
}

export async function deleteProfile(id) {
  await apiRequest(`/perfil/${id}`, { method: 'DELETE' });
}