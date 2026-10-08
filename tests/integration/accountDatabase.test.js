import test, { before, beforeEach, after } from 'node:test';
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
beforeEach(async () => { await models.sequelize.query('TRUNCATE usuarios, cuentas RESTART IDENTITY CASCADE'); });
after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  if (models) await models.sequelize.close();
  if (database) await database.destroy();
});

async function api(path, user, method = 'GET', body) {
  const response = await fetch(base + path, {
    method, headers: { 'Content-Type': 'application/json', ...(user ? { Authorization: `Bearer ${user.token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  return { status: response.status, body: await response.json().catch(() => null) };
}
async function register(label, accountType = 'individual') {
  const email = `${label}@example.test`;
  const response = await api('/autenticacion/registro', null, 'POST', { nombre: label, email, password: 'local-test-password', accountType });
  assert.equal(response.status, 201);
  const user = { ...response.body.usuario, token: response.body.token, email };
  await verifyTestEmail(user, base);
  return user;
}
async function invitation(owner, user) {
  const response = await api('/cuenta/invitaciones', owner, 'POST', { email: user.email });
  assert.equal(response.status, 201);
  const incoming = await api('/cuenta/invitaciones/mias', user);
  assert.equal(incoming.status, 200);
  return incoming.body.find(row => row.id === response.body.id);
}
async function family() {
  const owner = await register('owner', 'grupal');
  const member = await register('member');
  const invite = await invitation(owner, member);
  assert.equal((await api(`/cuenta/invitaciones/${invite.token}/aceptar`, member, 'POST')).status, 200);
  return { owner, member };
}
const mealData = { nombre: 'Comida', fecha: '2099-01-01', hora: '12:00', modo: 'receta' };
const productData = { nombre: 'Arroz', cantidad: 500, unidad: 'g', estado: 'comprado' };

test('registro y login devuelven la cuenta y rol; el perfil es privado', async () => {
  const { owner, member } = await family();
  const login = await api('/autenticacion/acceso', null, 'POST', { email: member.email, password: 'local-test-password' });
  assert.equal(login.status, 200);
  assert.equal(login.body.usuario.rol, 'miembro');
  assert.equal(login.body.usuario.cuentaId, owner.cuentaId);
  for (const user of [owner, member]) {
    const account = await api('/cuenta', user);
    assert.equal(account.status, 200);
    for (const row of account.body.cuenta.usuarios) assert.deepEqual(Object.keys(row).sort(), ['id', 'rol']);
    const profile = await api('/perfil', user);
    assert.equal(profile.body.email, user.email);
    assert.equal(profile.body.nombre, user.nombre);
  }
  assert.equal((await api('/cuenta', member)).body.invitaciones, undefined);
});

test('todos ven los mismos datos familiares; aceptar no fusiona datos anteriores ni publica el perfil', async () => {
  const owner = await register('owner', 'grupal'), member = await register('member');
  const previous = await api('/recetas', member, 'POST', { nombre: 'Cuenta anterior' });
  assert.equal(previous.status, 201);
  const invite = await invitation(owner, member);
  assert.equal((await api(`/cuenta/invitaciones/${invite.token}/aceptar`, member, 'POST')).status, 200);
  assert.equal((await api('/recetas', owner)).body.length, 0);
  assert.equal((await models.Receta.findByPk(previous.body.id)).cuentaId, member.cuentaId);
  const recipe = await api('/recetas', owner, 'POST', { nombre: 'Familiar' });
  assert.equal(recipe.status, 201);
  assert.equal((await api('/comidas', owner, 'POST', { ...mealData, recipeId: recipe.body.id })).status, 201);
  assert.equal((await api('/compra', owner, 'POST', productData)).status, 201);
  await models.Consumo.create({ nombreProducto: 'Arroz', cantidad: 50, unidad: 'g', fecha: '2020-01-01', hora: '12:00', comidaNombre: 'Anterior', cuentaId: owner.cuentaId });
  for (const route of ['/recetas', '/comidas', '/compra', '/compra/consumos']) {
    assert.deepEqual((await api(route, member)).body, (await api(route, owner)).body);
  }
});

test('otra cuenta no puede consultar, editar o borrar recursos familiares ni enlazar su receta', async () => {
  const owner = await register('owner'), outsider = await register('outsider');
  const recipe = await api('/recetas', owner, 'POST', { nombre: 'Privada de esta familia' });
  assert.equal((await api('/recetas', outsider)).body.length, 0);
  assert.equal((await api(`/recetas/${recipe.body.id}`, outsider, 'PUT', { nombre: 'Robo' })).status, 404);
  assert.equal((await api(`/recetas/${recipe.body.id}`, outsider, 'DELETE')).status, 404);
  assert.equal((await api('/comidas', outsider, 'POST', { ...mealData, recipeId: recipe.body.id })).status, 404);
  const own = await api('/recetas', outsider, 'POST', { nombre: 'Propia' });
  const meal = await api('/comidas', outsider, 'POST', { ...mealData, recetaId: own.body.id });
  assert.equal(meal.status, 201);
  assert.equal((await api(`/comidas/${meal.body.id}`, outsider, 'PUT', { ...mealData, recetaId: recipe.body.id })).status, 404);
  assert.equal((await models.Comida.findByPk(meal.body.id)).recetaId, own.body.id);
});

test('ids y propietarios enviados en el body no reasignan recursos', async () => {
  const owner = await register('owner'), outsider = await register('outsider');
  const recipe = await api('/recetas', owner, 'POST', { nombre: 'Original', id: 999, cuentaId: outsider.cuentaId });
  assert.equal(recipe.status, 201);
  assert.notEqual(recipe.body.id, 999);
  const updated = await api(`/recetas/${recipe.body.id}`, owner, 'PUT', { nombre: 'Editada', id: 888, cuentaId: outsider.cuentaId });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.id, recipe.body.id);
  assert.equal(updated.body.cuentaId, owner.cuentaId);
});

test('solo el propietario gestiona miembros, propiedad e invitaciones', async () => {
  const { owner, member } = await family();
  for (const [path, method, body] of [
    ['/cuenta/tipo/grupal', 'PATCH'], ['/cuenta/invitaciones', 'POST', { email: 'other@example.test' }],
    [`/cuenta/propiedad/${owner.id}`, 'POST'], [`/cuenta/miembros/${owner.id}`, 'DELETE']
  ]) assert.equal((await api(path, member, method, body)).status, 403);
  assert.equal((await api('/cuenta/abandonar', owner, 'POST')).status, 409);
  assert.equal((await api(`/cuenta/miembros/${owner.id}`, owner, 'DELETE')).status, 400);
});

test('invitar concurrentemente produce una sola invitación; otra persona no puede aceptarla', async () => {
  const owner = await register('owner'), target = await register('target'), outsider = await register('outsider');
  const results = await Promise.all([1, 2].map(() => api('/cuenta/invitaciones', owner, 'POST', { email: target.email })));
  assert.deepEqual(results.map(result => result.status).sort(), [201, 409]);
  assert.equal(await models.InvitacionCuenta.count(), 1);
  const pending = (await api('/cuenta/invitaciones/mias', target)).body[0];
  assert.equal((await api(`/cuenta/invitaciones/${pending.token}/aceptar`, outsider, 'POST')).status, 403);
  assert.equal((await api(`/cuenta/invitaciones/${pending.token}/aceptar`, target, 'POST')).status, 200);
  assert.equal((await api(`/cuenta/invitaciones/${pending.token}/aceptar`, target, 'POST')).status, 404);
});

test('caducar, renovar, cancelar y rechazar invitaciones mantiene tokens y permisos correctos', async () => {
  const owner = await register('owner'), target = await register('target');
  const old = await invitation(owner, target);
  await models.InvitacionCuenta.update({ expiraEn: new Date(Date.now() - 1000) }, { where: { id: old.id } });
  assert.equal((await api('/cuenta/invitaciones/mias', target)).body.length, 0);
  assert.equal((await api(`/cuenta/invitaciones/${old.token}/aceptar`, target, 'POST')).status, 410);
  const renewed = await invitation(owner, target);
  assert.notEqual(renewed.token, old.token);
  assert.equal((await api(`/cuenta/invitaciones/${old.token}/aceptar`, target, 'POST')).status, 404);
  assert.equal((await api(`/cuenta/invitaciones/${renewed.id}`, target, 'DELETE')).status, 404);
  assert.ok(await models.InvitacionCuenta.findByPk(renewed.id));
  assert.equal((await api(`/cuenta/invitaciones/${renewed.id}`, owner, 'DELETE')).status, 204);
  assert.equal((await api(`/cuenta/invitaciones/${renewed.token}/aceptar`, target, 'POST')).status, 404);
  const another = await invitation(owner, target);
  assert.equal((await api(`/cuenta/invitaciones/${another.token}/rechazar`, target, 'POST')).status, 204);
  assert.equal((await api(`/cuenta/invitaciones/${another.token}/aceptar`, target, 'POST')).status, 404);
});

test('transferir propiedad cambia permisos; salir borra al usuario y revoca su token sin borrar datos familiares', async () => {
  const { owner, member } = await family();
  const recipe = await api('/recetas', owner, 'POST', { nombre: 'Se conserva' });
  assert.equal((await api(`/cuenta/propiedad/${member.id}`, owner, 'POST')).status, 204);
  assert.equal((await api('/cuenta/tipo/grupal', owner, 'PATCH')).status, 403);
  assert.equal((await api('/cuenta/tipo/grupal', member, 'PATCH')).status, 200);
  assert.equal((await api('/cuenta/abandonar', owner, 'POST')).status, 204);
  assert.equal(await models.Usuario.findByPk(owner.id), null);
  assert.equal((await api('/perfil', owner)).status, 401);
  assert.equal((await api('/recetas', member)).body[0].id, recipe.body.id);
  const newUser = await register('owner');
  assert.notEqual(newUser.id, owner.id);
  assert.notEqual(newUser.cuentaId, owner.cuentaId);
  assert.equal((await api('/recetas', newUser)).body.length, 0);
});

test('expulsar elimina datos personales e invitaciones; no crea una cuenta individual', async () => {
  const { owner, member } = await family();
  const recipe = await api('/recetas', member, 'POST', { nombre: 'Familia' });
  const accounts = await models.Cuenta.count();
  const outsider = await register('outsider');
  await invitation(outsider, member);
  assert.equal((await api(`/cuenta/miembros/${member.id}`, owner, 'DELETE')).status, 204);
  assert.equal(await models.Cuenta.count(), accounts + 1);
  assert.equal(await models.Usuario.findByPk(member.id), null);
  assert.equal(await models.InvitacionCuenta.count({ where: { email: member.email } }), 0);
  assert.equal((await api('/recetas', member)).status, 401);
  assert.equal((await models.Receta.findByPk(recipe.body.id)).cuentaId, owner.cuentaId);
});

test('el último miembro puede salir y los datos de la cuenta se conservan sin nuevos usuarios', async () => {
  const owner = await register('owner', 'grupal');
  const recipe = await api('/recetas', owner, 'POST', { nombre: 'Conservar' });
  assert.equal((await api('/cuenta/abandonar', owner, 'POST')).status, 204);
  assert.equal(await models.Usuario.count(), 0);
  assert.equal(await models.Cuenta.count(), 1);
  assert.ok(await models.Receta.findByPk(recipe.body.id));
  assert.equal((await api('/autenticacion/yo', owner)).status, 401);
});

async function registerInvited(owner, email = 'invited@example.test') {
  const invitation = await api('/cuenta/invitaciones', owner, 'POST', { email });
  assert.equal(invitation.status, 201);
  const registered = await api('/autenticacion/registro', null, 'POST', {
    nombre: 'Invitado', email, password: 'local-test-password', invitationToken: invitation.body.token
  });
  assert.equal(registered.status, 201);
  return { user: { ...registered.body.usuario, token: registered.body.token }, invitation: invitation.body };
}

test('sin verificar no hay acceso a datos ni gestión, pero sí a verificación y perfil propio', async () => {
  const registered = await api('/autenticacion/registro', null, 'POST', {
    nombre: 'Pendiente', email: 'pending@example.test', password: 'local-test-password', accountType: 'individual'
  });
  const user = { ...registered.body.usuario, token: registered.body.token };
  for (const path of ['/recetas', '/recipes', '/comidas', '/meals', '/compra', '/shopping', '/cuenta', '/account']) {
    const response = await api(path, user);
    assert.equal(response.status, 403, path);
    assert.equal(response.body.code, 'EMAIL_NOT_VERIFIED');
  }
  assert.equal((await api('/cuenta/invitaciones', user, 'POST', { email: 'other@example.test' })).status, 403);
  assert.equal((await api('/compra', user, 'POST', productData)).status, 403);
  assert.equal((await api('/perfil', user)).status, 200);
  assert.equal((await api('/autenticacion/yo', user)).status, 200);
  await verifyTestEmail(user, base);
  assert.equal((await api('/recetas', user)).status, 200);
  assert.equal((await api('/perfil', user, 'PUT', { email: 'changed@example.test' })).status, 200);
  assert.equal((await api('/recetas', user)).status, 403);
});

test('registrarse por enlace no crea cuenta individual ni admite hasta verificar y aceptar', async () => {
  const owner = await register('owner', 'grupal');
  await api('/recetas', owner, 'POST', { nombre: 'Receta familiar' });
  const { user, invitation } = await registerInvited(owner);
  assert.equal(user.cuentaId, null);
  assert.equal(await models.Cuenta.count(), 1);
  assert.equal((await api('/cuenta/invitaciones/aceptar', user, 'POST', { token: invitation.token })).status, 403);
  assert.equal((await api('/cuenta/invitaciones/rechazar', user, 'POST', { token: invitation.token })).status, 403);
  assert.equal((await models.InvitacionCuenta.findByPk(invitation.id)).estado, 'pendiente');
  await verifyTestEmail(user, base);
  const blocked = await api('/recetas', user);
  assert.equal(blocked.status, 403);
  assert.equal(blocked.body.code, 'ACCOUNT_PENDING');
  assert.equal((await api('/cuenta/invitaciones/aceptar', user, 'POST', { token: invitation.token })).status, 200);
  assert.equal((await models.Usuario.findByPk(user.id)).cuentaId, owner.cuentaId);
  assert.equal(await models.Cuenta.count(), 1);
  assert.equal((await api('/recetas', user)).body[0].nombre, 'Receta familiar');
  assert.equal((await api('/cuenta/invitaciones/aceptar', user, 'POST', { token: invitation.token })).status, 404);
});

test('enlace ajeno, cancelado, caducado o sin propietario no permite registrar un invitado', async () => {
  const owner = await register('owner', 'grupal');
  const invitation = (await api('/cuenta/invitaciones', owner, 'POST', { email: 'target@example.test' })).body;
  const signup = email => api('/autenticacion/registro', null, 'POST', {
    nombre: 'Invitado', email, password: 'local-test-password', invitationToken: invitation.token
  });
  assert.equal((await signup('outsider@example.test')).status, 400);
  await models.InvitacionCuenta.update({ expiraEn: new Date(Date.now() - 1000) }, { where: { id: invitation.id } });
  assert.equal((await signup('target@example.test')).status, 400);
  await models.InvitacionCuenta.update({ expiraEn: new Date(Date.now() + 100000) }, { where: { id: invitation.id } });
  await models.Usuario.update({ rol: 'miembro' }, { where: { id: owner.id } });
  assert.equal((await signup('target@example.test')).status, 400);
  await models.InvitacionCuenta.destroy({ where: { id: invitation.id } });
  assert.equal((await signup('target@example.test')).status, 400);
  assert.equal(await models.Usuario.count(), 1);
  assert.equal(await models.Cuenta.count(), 1);
});

test('un correo solo puede registrar un usuario, incluso con mayúsculas y registros concurrentes', async () => {
  const results = await Promise.all([' SAME@example.test ', 'same@example.test'].map(email => api('/autenticacion/registro', null, 'POST', {
    nombre: 'Uno', email, password: 'local-test-password', accountType: 'individual'
  })));
  assert.deepEqual(results.map(item => item.status).sort(), [201, 409]);
  assert.equal(await models.Cuenta.count(), 1);
  assert.equal(await models.Usuario.count(), 1);
});

test('volver a individual conserva los datos y cancela enlaces; otros miembros impiden convertir', async () => {
  const { owner, member } = await family();
  assert.equal((await api('/cuenta/tipo/individual', member, 'PATCH')).status, 403);
  assert.equal((await api('/cuenta/tipo/individual', owner, 'PATCH')).status, 409);
  await api('/cuenta/abandonar', member, 'POST');
  await api('/recetas', owner, 'POST', { nombre: 'Receta conservada' });
  const invitation = (await api('/cuenta/invitaciones', owner, 'POST', { email: 'new@example.test' })).body;
  assert.equal((await api('/cuenta/tipo/individual', owner, 'PATCH')).status, 200);
  assert.equal((await models.Cuenta.findByPk(owner.cuentaId)).tipo, 'individual');
  assert.equal((await api('/recetas', owner)).body[0].nombre, 'Receta conservada');
  assert.equal(await models.InvitacionCuenta.count({ where: { estado: 'pendiente', cuentaId: owner.cuentaId } }), 0);
  assert.equal((await api('/autenticacion/registro', null, 'POST', {
    nombre: 'Nuevo', email: 'new@example.test', password: 'local-test-password', invitationToken: invitation.token
  })).status, 400);
});

test('cancelar un registro pendiente borra usuario y sesión sin borrar invitación ni familia', async () => {
  const owner = await register('owner', 'grupal');
  const { user, invitation } = await registerInvited(owner);
  assert.equal((await api('/autenticacion/registro-pendiente', owner, 'DELETE')).status, 409);
  assert.equal((await api('/autenticacion/registro-pendiente', user, 'DELETE')).status, 204);
  assert.equal((await api('/autenticacion/yo', user)).status, 401);
  assert.equal(await models.Usuario.findByPk(user.id), null);
  assert.ok(await models.InvitacionCuenta.findByPk(invitation.id));
  assert.equal(await models.Cuenta.count(), 1);
});

test('conversión concurrente con admisión no deja una cuenta individual con dos miembros', async () => {
  const owner = await register('owner', 'grupal');
  const { user, invitation } = await registerInvited(owner);
  await verifyTestEmail(user, base);
  const results = await Promise.all([
    api('/cuenta/tipo/individual', owner, 'PATCH'),
    api('/cuenta/invitaciones/aceptar', user, 'POST', { token: invitation.token })
  ]);
  assert.equal(results.filter(item => item.status === 200).length, 1);
  const account = await models.Cuenta.findByPk(owner.cuentaId);
  const members = await models.Usuario.count({ where: { cuentaId: owner.cuentaId } });
  assert.ok(account.tipo === 'grupal' ? members === 2 : members === 1);
});

test('invitar envía el enlace al destinatario y reenviar conserva el token con límite y permisos', async () => {
  const owner = await register('owner', 'grupal'), other = await register('other');
  const { testMailbox } = await import('../../backend/src/services/emailVerificationService.js');
  const response = await api('/cuenta/invitaciones', owner, 'POST', { email: 'target@example.test' });
  assert.equal(response.status, 201);
  assert.equal(response.body.envioCorreo.enviada, true);
  const message = testMailbox.findLast(item => item.email === 'target@example.test');
  assert.equal(message.subject, 'Invitación a una cuenta familiar de Calendar');
  assert.equal(new URL(message.url).pathname, '/invitacion');
  assert.equal(new URLSearchParams(new URL(message.url).hash.slice(1)).get('token'), response.body.token);
  const path = `/cuenta/invitaciones/${response.body.id}/reenviar`;
  assert.equal((await api(path, owner, 'POST')).status, 429);
  assert.equal((await api(path, other, 'POST')).status, 404);
  await models.sequelize.query(`UPDATE invitaciones_cuenta SET "actualizadoEn" = NOW() - INTERVAL '61 seconds' WHERE id = :id`, { replacements: { id: response.body.id } });
  assert.equal((await api(path, owner, 'POST')).body.envioCorreo.enviada, true);
  assert.equal((await api(path, owner, 'POST')).status, 429);
  assert.equal((await models.InvitacionCuenta.findByPk(response.body.id)).token, response.body.token);
  await api(`/cuenta/invitaciones/${response.body.id}`, owner, 'DELETE');
  assert.equal((await api(path, owner, 'POST')).status, 404);
});

test('un fallo al enviar conserva la invitación y permite reintentar sin crear otro enlace', async () => {
  const owner = await register('owner', 'grupal');
  const transport = process.env.MAIL_TRANSPORT;
  let response;
  try {
    process.env.MAIL_TRANSPORT = 'unavailable-test-transport';
    response = await api('/cuenta/invitaciones', owner, 'POST', { email: 'target@example.test' });
    assert.equal(response.status, 201);
    assert.equal(response.body.envioCorreo.enviada, false);
    assert.match(response.body.envioCorreo.message, /no pudimos enviar/);
  } finally { process.env.MAIL_TRANSPORT = transport; }
  await models.sequelize.query(`UPDATE invitaciones_cuenta SET "actualizadoEn" = NOW() - INTERVAL '61 seconds' WHERE id = :id`, { replacements: { id: response.body.id } });
  const retry = await api(`/cuenta/invitaciones/${response.body.id}/reenviar`, owner, 'POST');
  assert.equal(retry.status, 200);
  assert.equal(retry.body.envioCorreo.enviada, true);
  assert.equal(await models.InvitacionCuenta.count(), 1);
  assert.equal((await models.InvitacionCuenta.findByPk(response.body.id)).token, response.body.token);
});

test('un enlace válido elige acceso sin exponer perfiles ni permitir consultar cualquier correo', async () => {
  const owner = await register('owner', 'grupal');
  const created = await api('/cuenta/invitaciones', owner, 'POST', { email: 'new@example.test' });
  const token = created.body.token;
  let response = await api('/cuenta/invitaciones/acceso', null, 'POST', { token });
  assert.deepEqual(response.body, { registered: false, sessionMatches: null });
  const signup = await api('/autenticacion/registro', null, 'POST', { nombre: 'Nuevo', email: 'new@example.test', password: 'local-test-password', invitationToken: token });
  const member = { ...signup.body.usuario, token: signup.body.token };
  assert.deepEqual((await api('/cuenta/invitaciones/acceso', null, 'POST', { token })).body, { registered: true, sessionMatches: null });
  assert.deepEqual((await api('/cuenta/invitaciones/acceso', member, 'POST', { token })).body, { registered: true, sessionMatches: true });
  assert.deepEqual((await api('/cuenta/invitaciones/acceso', owner, 'POST', { token })).body, { registered: true, sessionMatches: false });
  assert.equal((await api('/cuenta/invitaciones/acceso', null, 'POST', { email: owner.email })).status, 400);
  assert.equal((await api('/cuenta/invitaciones/acceso', null, 'POST', { token: '0'.repeat(64) })).status, 404);
  await models.InvitacionCuenta.update({ expiraEn: new Date(Date.now() - 1000) }, { where: { id: created.body.id } });
  assert.equal((await api('/cuenta/invitaciones/acceso', null, 'POST', { token })).status, 410);
  await api(`/cuenta/invitaciones/${created.body.id}`, owner, 'DELETE');
  assert.equal((await api('/cuenta/invitaciones/acceso', null, 'POST', { token })).status, 404);
});
