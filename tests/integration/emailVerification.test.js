import test, { before, beforeEach, afterEach, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { createTestDatabase } from '../helpers/postgresDatabase.js';
import { latestVerificationToken } from '../helpers/testEmail.js';

let database, models, server, base, testMailbox;
const originalFetch = globalThis.fetch;
let savedEnvironment;
before(async () => {
  database = await createTestDatabase();
  models = await import('../../backend/src/models/index.js');
  ({ testMailbox } = await import('../../backend/src/services/emailVerificationService.js'));
  const { prepareDatabase } = await import('../../backend/src/config/migrateDatabase.js');
  await prepareDatabase();
  const { default: app } = await import('../../backend/src/app.js');
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}/api`;
});
beforeEach(async () => {
  savedEnvironment = Object.fromEntries(['MAIL_TRANSPORT', 'RESEND_API_KEY', 'MAIL_FROM', 'NODE_ENV', 'FRONTEND_URL'].map(key => [key, process.env[key]]));
  testMailbox.length = 0;
  await models.sequelize.query('TRUNCATE cuentas RESTART IDENTITY CASCADE');
});
afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const [key, value] of Object.entries(savedEnvironment)) {
    if (value === undefined) delete process.env[key]; else process.env[key] = value;
  }
});
after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  if (models) await models.sequelize.close();
  if (database) await database.destroy();
});
async function api(path, token, body, method = body ? 'POST' : 'GET') {
  const response = await fetch(base + path, {
    method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  return { status: response.status, body: await response.json().catch(() => null) };
}
async function register(email = 'owner@example.test') {
  const response = await api('/autenticacion/registro', null, {
    nombre: 'Owner', email, password: 'local-test-password', accountType: 'individual'
  });
  assert.equal(response.status, 201);
  return { ...response.body.usuario, token: response.body.token, verification: response.body.verificacionCorreo };
}
const verify = token => api('/autenticacion/email/verificar', null, { token });

test('registro envía un enlace sin filtrar el token; solo su hash se guarda y caduca en 24 horas', async () => {
  const user = await register();
  assert.equal(user.emailVerificado, false);
  assert.equal(user.verification.enviada, true);
  const token = await latestVerificationToken(user.email);
  assert.match(token, /^[a-f0-9]{64}$/);
  const row = await models.Usuario.findByPk(user.id);
  assert.equal(row.emailVerificacionHash, crypto.createHash('sha256').update(token).digest('hex'));
  assert.ok(row.emailVerificacionExpiraEn > new Date(Date.now() + 23 * 60 * 60 * 1000));
  assert.equal(JSON.stringify(user).includes(token), false);
  const profile = await api('/perfil', user.token);
  assert.equal(profile.body.emailVerificacionHash, undefined);
  assert.equal(profile.body.emailVerificacionExpiraEn, undefined);
});

test('confirmar verifica y consume el enlace; repetirlo o inventarlo no permite verificar', async () => {
  const user = await register();
  const token = await latestVerificationToken(user.email);
  assert.equal((await verify('0'.repeat(64))).status, 400);
  assert.equal((await verify(token)).status, 200);
  const row = await models.Usuario.findByPk(user.id);
  assert.equal(row.emailVerificado, true);
  assert.equal(row.emailVerificacionHash, null);
  assert.equal((await verify(token)).status, 400);
  assert.equal((await api('/autenticacion/yo', user.token)).body.usuario.emailVerificado, true);
});

test('dos confirmaciones concurrentes solo consumen una vez el enlace', async () => {
  const user = await register();
  const token = await latestVerificationToken(user.email);
  const results = await Promise.all([verify(token), verify(token)]);
  assert.deepEqual(results.map(row => row.status).sort(), [200, 400]);
});

test('un enlace caducado se rechaza y reenviar lo sustituye sin reutilizar el anterior', async () => {
  const user = await register();
  const previous = await latestVerificationToken(user.email);
  await models.Usuario.update({ emailVerificacionExpiraEn: new Date(Date.now() - 1000), emailVerificacionEnviadaEn: new Date(Date.now() - 61000) }, { where: { id: user.id } });
  assert.equal((await verify(previous)).status, 410);
  assert.equal((await api('/autenticacion/email/reenviar', user.token, {})).status, 200);
  const current = await latestVerificationToken(user.email);
  assert.notEqual(current, previous);
  assert.equal((await verify(previous)).status, 400);
  assert.equal((await verify(current)).status, 200);
});

test('reenviar requiere sesión, limita repeticiones y no revela el enlace por API', async () => {
  const user = await register();
  assert.equal((await api('/autenticacion/email/reenviar', null, {})).status, 401);
  assert.equal((await api('/autenticacion/email/reenviar', user.token, {})).status, 429);
  await models.Usuario.update({ emailVerificacionEnviadaEn: new Date(Date.now() - 61000) }, { where: { id: user.id } });
  const response = await api('/autenticacion/email/reenviar', user.token, {});
  assert.equal(response.status, 200);
  assert.equal(response.body.token, undefined);
  assert.equal(response.body.url, undefined);
});

test('cambiar email revoca la verificación y los enlaces antiguos aunque el body solicite emailVerificado=true', async () => {
  const user = await register();
  const old = await latestVerificationToken(user.email);
  assert.equal((await verify(old)).status, 200);
  const changed = await api('/perfil', user.token, { email: 'new@example.test', emailVerificado: true }, 'PUT');
  assert.equal(changed.status, 200);
  assert.equal(changed.body.emailVerificado, false);
  assert.equal((await api('/autenticacion/yo', user.token)).body.usuario.emailVerificado, false);
  assert.equal((await verify(old)).status, 400);
  const current = await latestVerificationToken('new@example.test');
  assert.equal((await verify(current)).status, 200);
  const same = await api('/perfil', user.token, { email: ' NEW@example.test ' }, 'PUT');
  assert.equal(same.status, 200);
  assert.equal(same.body.emailVerificado, true);
});

test('cambiar email mientras un enlace está pendiente lo invalida y verifica solo el nuevo buzón', async () => {
  const user = await register();
  const old = await latestVerificationToken(user.email);
  assert.equal((await api('/perfil', user.token, { email: 'new@example.test' }, 'PUT')).status, 200);
  assert.equal((await verify(old)).status, 400);
  assert.equal((await verify(await latestVerificationToken('new@example.test'))).status, 200);
});

test('el fallo del proveedor conserva el enlace anterior y permite reintentar sin perder el usuario', async () => {
  const user = await register();
  const old = await latestVerificationToken(user.email);
  await models.Usuario.update({ emailVerificacionEnviadaEn: new Date(Date.now() - 61000) }, { where: { id: user.id } });
  process.env.MAIL_TRANSPORT = 'resend';
  delete process.env.RESEND_API_KEY;
  delete process.env.MAIL_FROM;
  assert.equal((await api('/autenticacion/email/reenviar', user.token, {})).status, 503);
  assert.equal((await verify(old)).status, 200);
  const another = await register('another@example.test');
  assert.equal(another.verification.enviada, false);
  assert.ok(await models.Usuario.findByPk(another.id));
  assert.equal((await models.Usuario.findByPk(another.id)).emailVerificacionEnviadaEn, null);
});

test('la entrega Resend usa HTTPS, remitente configurado y el buzón correcto; un rechazo se notifica sin filtrar claves', async () => {
  process.env.MAIL_TRANSPORT = 'resend';
  process.env.RESEND_API_KEY = 'test-only-key';
  process.env.MAIL_FROM = 'Calendar <mail@example.test>';
  let captured, rejected = false;
  globalThis.fetch = async (url, options) => {
    if (url === 'https://api.resend.com/emails') {
      captured = { headers: options.headers, body: JSON.parse(options.body) };
      return new Response('{}', { status: rejected ? 403 : 200 });
    }
    return originalFetch(url, options);
  };
  const user = await register();
  assert.equal(user.verification.enviada, true);
  assert.equal(captured.headers.Authorization, 'Bearer test-only-key');
  assert.equal(captured.body.from, process.env.MAIL_FROM);
  assert.deepEqual(captured.body.to, [user.email]);
  assert.match(captured.body.text, /verificar-email#token=/);
  rejected = true;
  await models.Usuario.update({ emailVerificacionEnviadaEn: new Date(Date.now() - 61000) }, { where: { id: user.id } });
  const failed = await api('/autenticacion/email/reenviar', user.token, {});
  assert.equal(failed.status, 503);
  assert.equal(JSON.stringify(failed.body).includes('test-only-key'), false);
});

test('el transporte de pruebas no entrega ni verifica nada en producción', async () => {
  process.env.NODE_ENV = 'production';
  process.env.FRONTEND_URL = 'https://calendar.example.test';
  const user = await register();
  assert.equal(user.verification.enviada, false);
  assert.equal(testMailbox.length, 0);
  assert.equal((await models.Usuario.findByPk(user.id)).emailVerificado, false);
});

test('eliminar un usuario invalida también el enlace de verificación pendiente', async () => {
  const user = await register();
  const token = await latestVerificationToken(user.email);
  assert.equal((await api('/cuenta/abandonar', user.token, {})).status, 204);
  assert.equal((await verify(token)).status, 400);
});
