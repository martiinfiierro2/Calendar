// Regresión de seguridad: no basta con escribir el email invitado en el registro.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { verifyTestEmail } from '../helpers/testEmail.js';
import { createTestDatabase } from '../helpers/postgresDatabase.js';

let database, models, server, base;
before(async () => {
  database = await createTestDatabase();
  models = await import('../../backend/src/models/index.js');
  const { prepareDatabase } = await import('../../backend/src/config/migrateDatabase.js');
  await prepareDatabase();
  const { default: app } = await import('../../backend/src/app.js');
  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}/api`;
});
after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  if (models) await models.sequelize.close();
  if (database) await database.destroy();
});
async function api(path, token, body) {
  const response = await fetch(base + path, {
    method: body ? 'POST' : 'GET', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  return { status: response.status, body: await response.json().catch(() => null) };
}

test('registrar un email ajeno sin demostrar su propiedad no debe permitir entrar en la familia invitada', async () => {
  const owner = await api('/autenticacion/registro', null, {
    nombre: 'Propietario', email: 'owner@example.test', password: 'test-password', accountType: 'grupal'
  });
  assert.equal(owner.status, 201);
  await verifyTestEmail(owner.body.usuario, base);
  await models.Receta.create({ nombre: 'Datos de la familia', cuentaId: owner.body.usuario.cuentaId });
  assert.equal((await api('/cuenta/invitaciones', owner.body.token, { email: 'familiar@example.test' })).status, 201);
  // Un tercero reclama el email antes de que el destinatario se registre.
  const impostor = await api('/autenticacion/registro', null, {
    nombre: 'Tercero', email: 'familiar@example.test', password: 'other-password', accountType: 'individual'
  });
  assert.equal(impostor.status, 201);
  const incoming = await api('/cuenta/invitaciones/mias', impostor.body.token);
  const accepted = await api(`/cuenta/invitaciones/${incoming.body[0].token}/aceptar`, impostor.body.token, {});
  // Sin prueba del buzón, conocer el token de invitación no autoriza a entrar.
  assert.equal(accepted.status, 403, 'Se admitió a un usuario que no ha demostrado controlar el email invitado');
});
