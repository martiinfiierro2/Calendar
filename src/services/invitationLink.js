const INVITATION_KEY = 'calendar_pending_invitation';

export function rememberInvitation(token) {
  if (/^[a-f0-9]{64}$/.test(token || '')) sessionStorage.setItem(INVITATION_KEY, token);
}

export function getPendingInvitation() {
  return sessionStorage.getItem(INVITATION_KEY) || '';
}

export function clearPendingInvitation() {
  sessionStorage.removeItem(INVITATION_KEY);
}

export function invitationLink(token) {
  const url = new URL('/invitacion', window.location.origin);
  url.hash = new URLSearchParams({ token }).toString();
  return url.toString();
}
