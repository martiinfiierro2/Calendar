import test, { before, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createTestDatabase } from '../helpers/postgresDatabase.js';

let database, sequelize, models, prepareDatabase;
before(async () => {
  database = await createTestDatabase();
  models = await import('../../backend/src/models/index.js');
  sequelize = models.sequelize;
  ({ prepareDatabase } = await import('../../backend/src/config/migrateDatabase.js'));
});
beforeEach(async () => { await sequelize.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public'); });
after(async () => {
  if (sequelize) await sequelize.close();
  if (database) await database.destroy();
});
async function mainSchema() {
  await sequelize.query(await readFile(new URL('../fixtures/main-schema.sql', import.meta.url), 'utf8'));
}
async function seedMain() {
  await sequelize.query(`
    INSERT INTO usuarios (nombre,email,"hashContrasena","creadoEn","actualizadoEn") VALUES
      ('Anterior','old@example.test','test-only-hash',NOW(),NOW()),
      ('Otro','other@example.test','test-only-hash',NOW(),NOW());
    INSERT INTO recetas (nombre,"usuarioId","creadoEn","actualizadoEn") VALUES ('Receta anterior',1,NOW(),NOW());
    INSERT INTO comidas (nombre,fecha,hora,modo,"usuarioId","recetaId","creadoEn","actualizadoEn") VALUES
      ('Comida anterior','2099-01-01','12:00','receta',1,1,NOW(),NOW());
    INSERT INTO lista_compra (nombre,cantidad,unidad,"usuarioId","creadoEn","actualizadoEn") VALUES
      ('Arroz',500,'g',1,NOW(),NOW());
    INSERT INTO consumos ("nombreProducto",cantidad,unidad,fecha,hora,"comidaNombre","usuarioId","comidaId","recetaId","creadoEn","actualizadoEn") VALUES
      ('Arroz',50,'g','2020-01-01','12:00','Comida anterior',1,1,1,NOW(),NOW());
  `);
}

test('una base nueva arranca y repetir/concurrir la preparación no duplica migraciones', async () => {
  await prepareDatabase();
  await Promise.all([prepareDatabase(), prepareDatabase()]);
  const [migrations] = await sequelize.query('SELECT nombre FROM calendar_migrations ORDER BY nombre');
  assert.deepEqual(migrations.map(row => row.nombre), ['004_multicuenta.sql', '005_compartir_datos_cuenta.sql', '006_integridad_cuentas.sql', '007_verificacion_email.sql', '008_registro_invitado.sql']);
  const account = await models.Cuenta.create({ tipo: 'grupal' });
  const owner = await models.Usuario.create({ nombre: 'Owner', email: 'owner@example.test', hashContrasena: 'test-hash', cuentaId: account.id });
  await models.InvitacionCuenta.create({ cuentaId: account.id, email: 'target@example.test', invitadoPor: owner.id, token: 'first', expiraEn: new Date(Date.now() + 100000) });
  await assert.rejects(models.InvitacionCuenta.create({ cuentaId: account.id, email: 'TARGET@example.test', invitadoPor: owner.id, token: 'second', expiraEn: new Date(Date.now() + 100000) }), error => error.name === 'SequelizeUniqueConstraintError');
});

test('actualizar desde main conserva usuarios, datos, relaciones y ownership', async () => {
  await mainSchema();
  await seedMain();
  await prepareDatabase();
  const users = await models.Usuario.findAll({ order: [['id', 'ASC']] });
  assert.equal(users.length, 2);
  assert.notEqual(users[0].cuentaId, users[1].cuentaId);
  assert.equal(users[0].email, 'old@example.test');
  assert.equal(users[0].rol, 'propietario');
  for (const model of [models.Receta, models.Comida, models.ProductoCompra, models.Consumo]) {
    const records = await model.findAll();
    assert.equal(records.length, 1);
    assert.equal(records[0].cuentaId, users[0].cuentaId);
  }
  assert.equal((await models.Comida.findByPk(1)).recetaId, 1);
  assert.equal((await models.Consumo.findByPk(1)).comidaId, 1);
  await prepareDatabase();
  assert.equal(await models.Cuenta.count(), 2);
  // También se puede repetir el SQL 005 después de eliminar usuarioId.
  await sequelize.query(await readFile(new URL('../../backend/migrations/005_compartir_datos_cuenta.sql', import.meta.url), 'utf8'));
  assert.equal(await models.Receta.count(), 1);
});

test('una instalación anterior sin consumos recibe la tabla faltante', async () => {
  await mainSchema();
  await sequelize.query('DROP TABLE consumos');
  await prepareDatabase();
  assert.equal(await models.Consumo.count(), 0);
});

test('un esquema multicuenta aplicado a mano se adopta sin duplicar cuentas ni perder datos', async () => {
  await mainSchema();
  await seedMain();
  for (const name of ['004_multicuenta.sql', '005_compartir_datos_cuenta.sql']) {
    await sequelize.query(await readFile(new URL(`../../backend/migrations/${name}`, import.meta.url), 'utf8'));
  }
  await prepareDatabase();
  assert.equal(await models.Cuenta.count(), 2);
  assert.equal(await models.Receta.count(), 1);
});

test('una migración fallida revierte schema y registro; corregir el dato permite reintentar', async () => {
  await mainSchema();
  await seedMain();
  // Fixture corrupta: una receta sin usuario válido impide establecer cuentaId.
  await sequelize.query('ALTER TABLE recetas DROP CONSTRAINT "recetas_usuarioId_fkey"; UPDATE recetas SET "usuarioId" = 999');
  await assert.rejects(prepareDatabase());
  const [[status]] = await sequelize.query("SELECT to_regclass('public.cuentas') AS cuentas, to_regclass('public.calendar_migrations') AS registro");
  assert.equal(status.cuentas, null);
  assert.equal(status.registro, null);
  const [[recipe]] = await sequelize.query('SELECT nombre,"usuarioId" FROM recetas');
  assert.equal(recipe.nombre, 'Receta anterior');
  assert.equal(recipe.usuarioId, 999);
  await sequelize.query('UPDATE recetas SET "usuarioId" = 1');
  await prepareDatabase();
  assert.equal(await models.Receta.count(), 1);
});


test('el esquema histórico en inglés se migra y registra sus pasos sin perder usuarios', async () => {
  await mainSchema();
  await sequelize.query(`
    DROP TABLE consumos;
    ALTER TABLE usuarios RENAME TO users;
    ALTER TABLE recetas RENAME TO recipes;
    ALTER TABLE comidas RENAME TO meals;
    ALTER TABLE lista_compra RENAME TO shopping_items;
    ALTER TABLE users RENAME COLUMN "hashContrasena" TO "passwordHash";
    ALTER TABLE users RENAME COLUMN "creadoEn" TO "createdAt";
    ALTER TABLE users RENAME COLUMN "actualizadoEn" TO "updatedAt";
    ALTER TABLE recipes RENAME COLUMN "usuarioId" TO "userId";
    ALTER TABLE recipes RENAME COLUMN "creadoEn" TO "createdAt";
    ALTER TABLE recipes RENAME COLUMN "actualizadoEn" TO "updatedAt";
    ALTER TABLE meals RENAME COLUMN "usuarioId" TO "userId";
    ALTER TABLE meals RENAME COLUMN "recetaId" TO "recipeId";
    ALTER TABLE meals RENAME COLUMN "creadoEn" TO "createdAt";
    ALTER TABLE meals RENAME COLUMN "actualizadoEn" TO "updatedAt";
    ALTER TABLE shopping_items RENAME COLUMN "usuarioId" TO "userId";
    ALTER TABLE shopping_items RENAME COLUMN "creadoEn" TO "createdAt";
    ALTER TABLE shopping_items RENAME COLUMN "actualizadoEn" TO "updatedAt";
    CREATE TABLE profiles (id SERIAL PRIMARY KEY, "userId" INTEGER REFERENCES users(id), "createdAt" TIMESTAMPTZ, "updatedAt" TIMESTAMPTZ);
    INSERT INTO users (nombre,email,"passwordHash","createdAt","updatedAt") VALUES ('Anterior','legacy@example.test','test-hash',NOW(),NOW());
  `);
  await prepareDatabase();
  assert.equal((await models.Usuario.findByPk(1)).email, 'legacy@example.test');
  const [migrations] = await sequelize.query('SELECT nombre FROM calendar_migrations');
  assert.ok(migrations.some(row => row.nombre === '001_castellanizar_base_datos.sql'));
  assert.ok(migrations.some(row => row.nombre === '003_eliminar_tabla_perfiles.sql'));
  await prepareDatabase();
  assert.equal(await models.Usuario.count(), 1);
});

test('una copia previa a migrar se puede restaurar en otra base con sus datos y esquema de main', async () => {
  await mainSchema();
  await seedMain();
  const directory = await mkdtemp(join(tmpdir(), 'calendar-migration-backup-'));
  const backup = join(directory, 'main.dump');
  let restored;
  const run = promisify(execFile);
  const environment = connectionString => {
    const url = new URL(connectionString);
    return { ...process.env, PGHOST: url.hostname, PGPORT: url.port || '5432', PGUSER: decodeURIComponent(url.username), PGPASSWORD: decodeURIComponent(url.password), PGDATABASE: url.pathname.slice(1) };
  };
  try {
    await run('pg_dump', ['-Fc', '--no-owner', '--no-acl', '-f', backup], { env: environment(database.connectionString) });
    await prepareDatabase();
    restored = await createTestDatabase();
    await run('pg_restore', ['--no-owner', '--no-acl', '--dbname', new URL(restored.connectionString).pathname.slice(1), backup], { env: environment(restored.connectionString) });
    const result = await restored.query('SELECT nombre,"usuarioId" FROM recetas');
    assert.deepEqual(result.rows, [{ nombre: 'Receta anterior', usuarioId: 1 }]);
    assert.equal((await restored.query('SELECT COUNT(*)::int AS total FROM usuarios')).rows[0].total, 2);
    assert.equal((await restored.query("SELECT to_regclass('public.cuentas') AS cuentas")).rows[0].cuentas, null);
  } finally {
    if (restored) await restored.destroy();
    await rm(directory, { recursive: true, force: true });
    process.env.DATABASE_URL = database.connectionString;
  }
});

test('actualizar una base con 007 aplicada permite invitados pendientes y conserva familias existentes', async () => {
  await prepareDatabase();
  const account = await models.Cuenta.create({ tipo: 'grupal' });
  const user = await models.Usuario.create({ nombre: 'Anterior', email: 'old@example.test', hashContrasena: 'test-only-hash', cuentaId: account.id, emailVerificado: true });
  await models.Receta.create({ nombre: 'Receta existente', cuentaId: account.id });
  // Reproduce el esquema de la versión ya fusionada en main.
  await sequelize.query(`ALTER TABLE usuarios ALTER COLUMN "cuentaId" SET NOT NULL;
    DROP INDEX usuarios_email_normalizado_unico;
    DELETE FROM calendar_migrations WHERE nombre = '008_registro_invitado.sql'`);
  await prepareDatabase();
  await prepareDatabase();
  const pending = await models.Usuario.create({ nombre: 'Pendiente', email: 'pending@example.test', hashContrasena: 'test-only-hash', cuentaId: null, rol: 'miembro' });
  assert.equal(pending.cuentaId, null);
  assert.equal((await models.Usuario.findByPk(user.id)).emailVerificado, true);
  assert.equal((await models.Usuario.findByPk(user.id)).cuentaId, account.id);
  assert.equal((await models.Receta.findOne()).nombre, 'Receta existente');
  assert.equal(await models.Cuenta.count(), 1);
  await assert.rejects(models.Usuario.create({ nombre: 'Duplicado', email: 'OLD@example.test', hashContrasena: 'test-only-hash', cuentaId: account.id }), error => error.name === 'SequelizeUniqueConstraintError');
});
