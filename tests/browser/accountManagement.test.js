import test, { before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { chromium, expect } from '@playwright/test';
import { createServer as createViteServer } from 'vite';
import { verifyTestEmail, latestVerificationToken } from '../helpers/testEmail.js';
import { createTestDatabase } from '../helpers/postgresDatabase.js';

let database, models, apiServer, vite, browser, apiBase, frontend, contexts = [];
before(async () => {
  database = await createTestDatabase();
  models = await import('../../backend/src/models/index.js');
  const { prepareDatabase } = await import('../../backend/src/config/migrateDatabase.js');
  await prepareDatabase();
  apiServer = createServer();
  apiServer.listen(0, '127.0.0.1');
  await new Promise(resolve => apiServer.once('listening', resolve));
  apiBase = `http://127.0.0.1:${apiServer.address().port}/api`;
  process.env.VITE_API_URL = apiBase;
  vite = await createViteServer({ server: { host: '127.0.0.1', port: 0 }, logLevel: 'error' });
  await vite.listen();
  frontend = `http://127.0.0.1:${vite.httpServer.address().port}`;
  process.env.FRONTEND_URL = frontend;
  const { default: app } = await import('../../backend/src/app.js');
  apiServer.on('request', app);
  browser = await chromium.launch({
    ...(process.env.CALENDAR_TEST_CHROMIUM_PATH ? { executablePath: process.env.CALENDAR_TEST_CHROMIUM_PATH } : {}),
    headless: true
  });
});
beforeEach(async () => {
  for (const context of contexts) await context.close();
  contexts = [];
  await models.sequelize.query('TRUNCATE usuarios, cuentas RESTART IDENTITY CASCADE');
});
after(async () => {
  if (browser) await browser.close();
  if (vite) await vite.close();
  if (apiServer) await new Promise(resolve => apiServer.close(resolve));
  if (models) await models.sequelize.close();
  if (database) await database.destroy();
});
async function api(path, user, method = 'GET', body) {
  const response = await fetch(apiBase + path, {
    method, headers: { 'Content-Type': 'application/json', ...(user ? { Authorization: `Bearer ${user.token}` } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  assert.ok(response.ok);
  return response.json().catch(() => null);
}
async function register(label, accountType = 'individual', verify = true) {
  const data = await api('/autenticacion/registro', null, 'POST', {
    nombre: `Persona ${label}`, email: `${label}@example.test`, password: 'local-test-password', accountType
  });
  const user = { ...data.usuario, token: data.token };
  if (verify) await verifyTestEmail(user, apiBase);
  return user;
}
async function invite(owner, member) {
  await api('/cuenta/invitaciones', owner, 'POST', { email: member.email });
  return (await api('/cuenta/invitaciones/mias', member))[0];
}
async function family() {
  const owner = await register('propietario', 'grupal'), member = await register('participante');
  const invitation = await invite(owner, member);
  await api(`/cuenta/invitaciones/${invitation.token}/aceptar`, member, 'POST');
  return { owner, member };
}
async function pageFor(user) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  contexts.push(context);
  await context.addInitScript(session => {
    // Se inicializa solo una vez, para no restaurar la sesión al navegar tras salir.
    if (!sessionStorage.getItem('test-initialized')) {
      localStorage.setItem('calendar_session', JSON.stringify(session));
      sessionStorage.setItem('test-initialized', 'true');
    }
  }, user);
  const page = await context.newPage();
  await page.goto(frontend + '/perfil');
  return page;
}

test('un fallo de carga se muestra y Reintentar recupera la sección de cuenta', async () => {
  const owner = await register('propietario');
  const context = await browser.newContext();
  contexts.push(context);
  await context.addInitScript(session => localStorage.setItem('calendar_session', JSON.stringify(session)), owner);
  await context.route('**/api/cuenta', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ message: 'Cuenta no disponible' }) }));
  const page = await context.newPage();
  await page.goto(frontend + '/perfil');
  await expect(page.getByRole('alert')).toHaveText('Cuenta no disponible');
  await context.unroute('**/api/cuenta');
  await page.getByRole('button', { name: 'Reintentar', exact: true }).click();
  await expect(page.getByText('Cuenta individual', { exact: true })).toBeVisible();
});

test('aceptar desde la interfaz mantiene el perfil privado y actualiza la cuenta', async () => {
  const owner = await register('propietario', 'grupal'), member = await register('participante');
  await invite(owner, member);
  const page = await pageFor(member);
  page.once('dialog', dialog => {
    assert.match(dialog.message(), /No se fusionarán/);
    return dialog.accept();
  });
  await page.getByRole('button', { name: 'Aceptar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Abandonar cuenta familiar', exact: true })).toBeVisible();
  await expect(page.getByText(member.email, { exact: true })).toBeVisible();
  await expect(page.getByText(owner.email, { exact: true })).toHaveCount(0);
  await expect(page.getByText(owner.nombre, { exact: true })).toHaveCount(0);
  assert.equal((await models.Usuario.findByPk(member.id)).cuentaId, owner.cuentaId);
});

test('transferencia y abandono funcionan con confirmación, cancelación y cierre de sesión', async () => {
  const { owner, member } = await family();
  const page = await pageFor(owner);
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Transferir propiedad', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Transferir propiedad', exact: true })).toHaveCount(0);
  const leave = page.getByRole('button', { name: 'Abandonar cuenta familiar', exact: true });
  await expect(leave).toBeVisible();
  page.once('dialog', dialog => dialog.dismiss());
  await leave.click();
  assert.ok(await models.Usuario.findByPk(owner.id));
  page.once('dialog', dialog => {
    assert.match(dialog.message(), /Se borrarán tu usuario/);
    return dialog.accept();
  });
  await leave.click();
  await expect(page.locator('form').getByRole('button', { name: 'Entrar', exact: true })).toBeVisible();
  assert.equal(await models.Usuario.findByPk(owner.id), null);
  assert.equal((await models.Usuario.findByPk(member.id)).rol, 'propietario');
  assert.equal(await page.evaluate(() => localStorage.getItem('calendar_session')), null);
});

test('expulsar avisa, conserva la familia y cierra la sesión del expulsado al recuperar el foco', async () => {
  const { owner, member } = await family();
  const ownerPage = await pageFor(owner), memberPage = await pageFor(member);
  await expect(memberPage.getByRole('button', { name: 'Abandonar cuenta familiar', exact: true })).toBeVisible();
  ownerPage.once('dialog', dialog => {
    assert.match(dialog.message(), /Los datos de la familia se conservarán/);
    return dialog.accept();
  });
  await ownerPage.getByRole('button', { name: `Expulsar a Miembro #${member.id}`, exact: true }).click();
  await expect(ownerPage.getByText('1 miembro', { exact: true })).toBeVisible();
  await memberPage.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(memberPage.locator('form').getByRole('button', { name: 'Entrar', exact: true })).toBeVisible();
  assert.equal(await models.Usuario.findByPk(member.id), null);
  assert.equal(await models.Cuenta.count(), 2); // familia + cuenta anterior, sin cuentas nuevas
});


test('cerrar sesión normalmente no elimina el usuario ni convierte su cuenta', async () => {
  const { owner, member } = await family();
  const page = await pageFor(member);
  await expect(page.getByRole('button', { name: 'Cerrar sesión', exact: false })).toBeVisible();
  await page.getByRole('button', { name: 'Cerrar sesión', exact: false }).click();
  await expect(page.locator('form').getByRole('button', { name: 'Entrar', exact: true })).toBeVisible();
  const user = await models.Usuario.findByPk(member.id);
  assert.equal(user.cuentaId, owner.cuentaId);
  assert.equal(user.rol, 'miembro');
});

test('el propietario renueva y cancela una invitación caducada desde la interfaz', async () => {
  const owner = await register('propietario', 'grupal'), target = await register('destinatario');
  const invitation = await invite(owner, target);
  await models.InvitacionCuenta.update({ expiraEn: new Date(Date.now() - 1000) }, { where: { id: invitation.id } });
  const page = await pageFor(owner);
  await expect(page.getByText(`${target.email} · Caducada`, { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Renovar', exact: true }).click();
  await expect(page.getByText(`${target.email} · Pendiente`, { exact: true })).toBeVisible();
  assert.notEqual((await models.InvitacionCuenta.findByPk(invitation.id)).token, invitation.token);
  await page.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Cancelar', exact: true })).toHaveCount(0);
  assert.equal(await models.InvitacionCuenta.findByPk(invitation.id), null);
});


test('el enlace verifica el correo y desbloquea Aceptar; el secreto desaparece de la URL', async () => {
  const owner = await register('propietario', 'grupal'), member = await register('participante', 'individual', false);
  await invite(owner, member);
  const token = await latestVerificationToken(member.email);
  const page = await pageFor(member);
  await expect(page.getByRole('heading', { name: 'Verifica tu correo', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Aceptar', exact: true })).toHaveCount(0);
  await expect(page.locator('footer')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Reenviar correo de verificación', exact: true })).toBeVisible();
  await page.goto(`${frontend}/verificar-email#token=${token}`);
  await expect(page.getByRole('button', { name: 'Confirmar mi correo', exact: true })).toBeVisible();
  await expect(page).toHaveURL(`${frontend}/verificar-email`);
  await page.getByRole('button', { name: 'Confirmar mi correo', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Tu correo está verificado');
  await page.getByRole('link', { name: 'Ir a mi perfil', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Aceptar', exact: true })).toBeEnabled();
  await expect(page.getByText('Correo verificado.', { exact: true })).toBeVisible();
});

test('registro desde enlace: verifica, confirma y entra en la familia sin crear cuenta individual', async () => {
  const owner = await register('propietario', 'grupal');
  const invitation = await api('/cuenta/invitaciones', owner, 'POST', { email: 'nuevo@example.test' });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  contexts.push(context);
  const page = await context.newPage();
  await page.goto(`${frontend}/invitacion#token=${invitation.token}`);
  await expect(page).toHaveURL(`${frontend}/invitacion`);
  await expect(page.getByRole('heading', { name: 'Crea tu acceso para unirte a tu familia', exact: true })).toBeVisible();
  await page.getByPlaceholder('Tu nombre', { exact: true }).fill('Nuevo familiar');
  await page.getByPlaceholder('tu@email.com', { exact: true }).fill('nuevo@example.test');
  await page.getByPlaceholder('Mínimo 6 caracteres', { exact: true }).fill('local-test-password');
  await page.getByRole('button', { name: 'Crear usuario y verificar correo', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Verifica tu correo', exact: true })).toBeVisible();
  await expect(page.getByRole('group', { name: 'Tipo de cuenta' })).toHaveCount(0);
  assert.equal(await models.Cuenta.count(), 1);
  const user = await models.Usuario.findOne({ where: { email: 'nuevo@example.test' } });
  assert.equal(user.cuentaId, null);
  if (process.env.CALENDAR_REVIEW_SCREENSHOTS) await page.screenshot({ path: '/tmp/calendar-activation-mobile.png' });
  const verification = await latestVerificationToken(user.email);
  // El correo se abre en otra pestaña: la invitación se recupera por la sesión.
  const verificationPage = await context.newPage();
  await verificationPage.goto(`${frontend}/verificar-email#token=${verification}`);
  await verificationPage.getByRole('button', { name: 'Confirmar mi correo', exact: true }).click();
  await expect(verificationPage.getByRole('status')).toContainText('Tu correo está verificado');
  await verificationPage.getByRole('link', { name: 'Continuar con la invitación', exact: true }).click();
  await expect(verificationPage.getByRole('button', { name: 'Aceptar invitación', exact: true })).toBeVisible();
  assert.equal((await models.Usuario.findByPk(user.id)).cuentaId, null);
  if (process.env.CALENDAR_REVIEW_SCREENSHOTS) await verificationPage.screenshot({ path: '/tmp/calendar-invitation-mobile.png' });
  await verificationPage.getByRole('button', { name: 'Aceptar invitación', exact: true }).click();
  await expect(verificationPage).toHaveURL(frontend + '/');
  assert.equal((await models.Usuario.findByPk(user.id)).cuentaId, owner.cuentaId);
  assert.equal(await models.Cuenta.count(), 1);
  await verificationPage.goto(frontend + '/perfil');
  await expect(verificationPage.getByRole('button', { name: 'Abandonar cuenta familiar', exact: true })).toBeVisible();
  await expect(verificationPage.getByText(owner.email, { exact: true })).toHaveCount(0);
  await expect(verificationPage.getByRole('button', { name: 'Reenviar correo de verificación', exact: true })).toHaveCount(0);
});

test('individual y familiar muestran gestión distinta; conversión y enlace se pueden usar desde móvil', async () => {
  const owner = await register('propietario');
  const page = await pageFor(owner);
  await expect(page.getByRole('heading', { name: 'Tu cuenta', exact: true })).toBeVisible();
  await expect(page.getByPlaceholder('email@ejemplo.com', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Abandonar cuenta familiar', exact: true })).toHaveCount(0);
  if (process.env.CALENDAR_REVIEW_SCREENSHOTS) await page.screenshot({ path: '/tmp/calendar-individual-mobile.png' });
  await page.getByRole('button', { name: 'Convertir en cuenta familiar', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Tu familia', exact: true })).toBeVisible();
  await page.getByPlaceholder('email@ejemplo.com', { exact: true }).fill('nuevo@example.test');
  await page.getByRole('button', { name: 'Enviar invitación', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Copiar enlace', exact: true })).toBeVisible();
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.getByRole('button', { name: 'Copiar enlace', exact: true }).click();
  await expect(page.getByLabel('Enlace de invitación', { exact: true })).toHaveCount(0);
  const link = await page.evaluate(() => navigator.clipboard.readText());
  assert.ok(link.startsWith(frontend + '/invitacion#token='));
  const token = new URLSearchParams(new URL(link).hash.slice(1)).get('token');
  assert.equal((await models.InvitacionCuenta.findOne({ where: { email: 'nuevo@example.test' } })).token, token);
  if (process.env.CALENDAR_REVIEW_SCREENSHOTS) await page.screenshot({ path: '/tmp/calendar-family-mobile.png' });
  page.once('dialog', dialog => {
    assert.match(dialog.message(), /cancelarán todas las invitaciones/);
    return dialog.accept();
  });
  await page.getByRole('button', { name: 'Convertir en cuenta individual', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Tu cuenta', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Copiar enlace', exact: true })).toHaveCount(0);
  assert.equal(await models.InvitacionCuenta.count(), 0);
  assert.equal(await models.Cuenta.count(), 1);
});

test('un usuario verificado abre el enlace, ve el cambio de cuenta y acepta sin verificar otra vez', async () => {
  const owner = await register('propietario', 'grupal'), member = await register('participante');
  const invitation = await api('/cuenta/invitaciones', owner, 'POST', { email: member.email });
  const page = await pageFor(member);
  await page.goto(`${frontend}/invitacion#token=${invitation.token}`);
  await expect(page).toHaveURL(`${frontend}/invitacion`);
  await expect(page.getByText(/Al aceptar, dejarás de acceder a tu cuenta actual/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Reenviar correo de verificación', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Aceptar invitación', exact: true }).click();
  await expect(page).toHaveURL(frontend + '/');
  assert.equal((await models.Usuario.findByPk(member.id)).cuentaId, owner.cuentaId);
  assert.equal(await models.Cuenta.count(), 2);
});

test('registro normal elige tipo y bloquea calendario hasta confirmar el correo', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  contexts.push(context);
  const page = await context.newPage();
  await page.goto(frontend + '/login');
  await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click();
  await page.getByPlaceholder('Tu nombre', { exact: true }).fill('Nueva usuaria');
  await page.getByPlaceholder('tu@email.com', { exact: true }).fill('individual@example.test');
  await page.getByPlaceholder('Mínimo 6 caracteres', { exact: true }).fill('local-test-password');
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.getByRole('button', { name: 'Individual Solo para ti', exact: true }).click();
  await page.getByRole('button', { name: 'Crear cuenta', exact: true }).last().click();
  await expect(page.getByRole('heading', { name: 'Verifica tu correo', exact: true })).toBeVisible();
  await page.goto(frontend + '/recetas');
  await expect(page).toHaveURL(frontend + '/activar-cuenta');
  await expect(page.getByRole('button', { name: 'Reenviar correo de verificación', exact: true })).toBeVisible();
  const user = await models.Usuario.findOne({ where: { email: 'individual@example.test' } });
  assert.equal((await models.Cuenta.findByPk(user.cuentaId)).tipo, 'individual');
  await page.goto(`${frontend}/verificar-email#token=${await latestVerificationToken(user.email)}`);
  await page.getByRole('button', { name: 'Confirmar mi correo', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Tu correo está verificado');
  await page.getByRole('link', { name: 'Ir a mi perfil', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Tu cuenta', exact: true })).toBeVisible();
});

test('el enlace de un usuario existente abre directamente iniciar sesión y permite aceptar', async () => {
  const owner = await register('propietario', 'grupal'), target = await register('destinatario');
  const invitation = await api('/cuenta/invitaciones', owner, 'POST', { email: target.email });
  const context = await browser.newContext();
  contexts.push(context);
  const page = await context.newPage();
  await page.goto(`${frontend}/invitacion#token=${invitation.token}`);
  await expect(page.getByRole('heading', { name: 'Inicia sesión para unirte a tu familia', exact: true })).toBeVisible();
  await expect(page.getByPlaceholder('Tu nombre', { exact: true })).toHaveCount(0);
  await page.getByPlaceholder('tu@email.com', { exact: true }).fill(target.email);
  await page.getByPlaceholder('Mínimo 6 caracteres', { exact: true }).fill('local-test-password');
  await page.locator('form').getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Aceptar invitación', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Aceptar invitación', exact: true }).click();
  await expect(page).toHaveURL(frontend + '/');
  assert.equal((await models.Usuario.findByPk(target.id)).cuentaId, owner.cuentaId);
});

test('una sesión de otro correo avisa y Cambiar de sesión conserva la invitación', async () => {
  const owner = await register('propietario', 'grupal'), target = await register('destinatario');
  const invitation = await api('/cuenta/invitaciones', owner, 'POST', { email: target.email });
  const page = await pageFor(owner);
  await page.goto(`${frontend}/invitacion#token=${invitation.token}`);
  await expect(page.getByRole('heading', { name: 'Esta invitación es para otro correo', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Aceptar invitación', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Cambiar de sesión', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Inicia sesión para unirte a tu familia', exact: true })).toBeVisible();
  await page.getByPlaceholder('tu@email.com', { exact: true }).fill(target.email);
  await page.getByPlaceholder('Mínimo 6 caracteres', { exact: true }).fill('local-test-password');
  await page.locator('form').getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Aceptar invitación', exact: true })).toBeVisible();
  assert.equal((await models.InvitacionCuenta.findByPk(invitation.id)).estado, 'pendiente');
});

test('los siete días caben y los formularios siguen accesibles en móvil estrecho y bajo', async () => {
  const owner = await register('propietario');
  const page = await pageFor(owner);
  for (const width of [320, 390, 768]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(frontend + '/');
    await page.getByRole('button', { name: 'Semana', exact: true }).click();
    const days = page.locator('.semana-dia-cabecera');
    await expect(days).toHaveCount(7);
    for (const day of await days.all()) await expect(day).toBeInViewport({ ratio: 1 });
  }
  await page.setViewportSize({ width: 320, height: 480 });
  await page.goto(frontend + '/recetas');
  await page.getByRole('button', { name: 'Nueva receta', exact: true }).click();
  await page.locator('.receta-form-submit').scrollIntoViewIfNeeded();
  await expect(page.locator('.receta-form-submit')).toBeInViewport({ ratio: 1 });
  assert.equal(await page.locator('.footer').evaluate(el => {
    const rect = el.getBoundingClientRect();
    return Boolean(document.elementFromPoint(rect.x + rect.width / 2, rect.y + rect.height / 2)?.closest('.recetas-modal-layer'));
  }), true, 'La hoja de receta debe cubrir la navegación inferior');
  await page.goto(frontend + '/perfil');
  await page.getByRole('button', { name: 'Editar perfil', exact: true }).click();
  await page.locator('.perfil-save').scrollIntoViewIfNeeded();
  await expect(page.locator('.perfil-save')).toBeInViewport({ ratio: 1 });
});

test('una foto de receta que falla muestra una imagen de reserva también en el detalle', async () => {
  const owner = await register('propietario');
  const recipe = await api('/recetas', owner, 'POST', {
    nombre: 'Receta sin foto disponible', imagen: 'https://images.example.test/unavailable.jpg'
  });
  const page = await pageFor(owner);
  await page.context().route('**/unavailable.jpg', route => route.abort());
  await page.goto(frontend + '/recetas');
  const cardImage = page.locator('.receta-imagen-wrap img');
  await expect(cardImage).toHaveAttribute('src', '/recipe-placeholder.svg');
  await expect.poll(() => cardImage.evaluate(el => el.complete && el.naturalWidth > 0)).toBe(true);
  await page.getByRole('button', { name: `Ver receta ${recipe.nombre}`, exact: true }).click();
  const detailImage = page.locator('.receta-detalle-imagen img');
  await expect(detailImage).toHaveAttribute('src', '/recipe-placeholder.svg');
  await expect.poll(() => detailImage.evaluate(el => el.complete && el.naturalWidth > 0)).toBe(true);
});
