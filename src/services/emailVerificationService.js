import { apiRequest } from './apiClient';

export function verifyEmail(token) {
  return apiRequest('/autenticacion/email/verificar', { method: 'POST', body: JSON.stringify({ token }) });
}

export function resendEmailVerification() {
  return apiRequest('/autenticacion/email/reenviar', { method: 'POST' });
}
