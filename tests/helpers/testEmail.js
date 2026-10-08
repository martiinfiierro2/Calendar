import assert from 'node:assert/strict';

export async function latestVerificationToken(email) {
  const { testMailbox } = await import('../../backend/src/services/emailVerificationService.js');
  const message = testMailbox.findLast(item => item.email === email && new URL(item.url).pathname === '/verificar-email');
  assert.ok(message, 'La verificación debe enviarse al buzón de pruebas');
  return new URLSearchParams(new URL(message.url).hash.slice(1)).get('token');
}

export async function verifyTestEmail(user, apiBase) {
  const token = await latestVerificationToken(user.email);
  const response = await fetch(`${apiBase}/autenticacion/email/verificar`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token })
  });
  assert.equal(response.status, 200);
  return token;
}
