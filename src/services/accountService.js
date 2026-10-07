import { apiRequest } from './apiClient';

export function getAccount() {
  return apiRequest('/cuenta');
}

export function convertAccountToGroup() {
  return apiRequest('/cuenta/tipo/grupal', { method: 'PATCH' });
}

export function inviteAccountMember(email) {
  return apiRequest('/cuenta/invitaciones', {
    method: 'POST',
    body: JSON.stringify({ email: email.trim() })
  });
}

export function getMyAccountInvitations() {
  return apiRequest('/cuenta/invitaciones/mias');
}

export function acceptAccountInvitation(token) {
  return apiRequest(`/cuenta/invitaciones/${token}/aceptar`, { method: 'POST' });
}

export function rejectAccountInvitation(token) {
  return apiRequest(`/cuenta/invitaciones/${token}/rechazar`, { method: 'POST' });
}

export function removeAccountMember(usuarioId) {
  return apiRequest(`/cuenta/miembros/${usuarioId}`, { method: 'DELETE' });
}

export function leaveAccount() {
  return apiRequest('/cuenta/abandonar', { method: 'POST' });
}

export function cancelAccountInvitation(id) {
  return apiRequest(`/cuenta/invitaciones/${id}`, { method: 'DELETE' });
}

export function transferAccountOwnership(usuarioId) {
  return apiRequest(`/cuenta/propiedad/${usuarioId}`, { method: 'POST' });
}
