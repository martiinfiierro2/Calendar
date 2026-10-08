import { readFile } from 'node:fs/promises';
import { sequelize, Receta, Comida, ProductoCompra, Consumo } from '../models/index.js';

const migrationDirectory = new URL('../../migrations/', import.meta.url);

// Un bloqueo transaccional impide que dos arranques migren a la vez.
export async function prepareDatabase() {
  await sequelize.authenticate();
  await sequelize.transaction(async transaction => {
    await sequelize.query("SELECT pg_advisory_xact_lock(724116, 1)", { transaction });
    await sequelize.query(`CREATE TABLE IF NOT EXISTS calendar_migrations (
      nombre TEXT PRIMARY KEY, aplicada_en TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`, { transaction });
    const [rows] = await sequelize.query("SELECT t.table_name AS nombre_tabla FROM information_schema.tables AS t WHERE t.table_schema = 'public'", { transaction });
    const tables = new Set(rows.map(row => row.nombre_tabla));
    const [applied] = await sequelize.query('SELECT nombre FROM calendar_migrations', { transaction });
    const registered = new Set(applied.map(row => row.nombre));
    const run = async (filename, execute = true) => {
      if (registered.has(filename)) return;
      if (execute) {
        const sql = (await readFile(new URL(filename, migrationDirectory), 'utf8'))
          .replace(/^BEGIN;\s*/m, '').replace(/^COMMIT;\s*/m, '');
        await sequelize.query(sql, { transaction });
      }
      await sequelize.query('INSERT INTO calendar_migrations (nombre) VALUES (:filename)', {
        replacements: { filename }, transaction
      });
    };
    if (tables.has('users') && tables.has('usuarios')) {
      throw new Error('Esquema ambiguo: existen users y usuarios. Revisar antes de migrar.');
    }
    if (tables.has('users')) await run('001_castellanizar_base_datos.sql');
    if (!tables.has('usuarios') && !tables.has('users')) {
      // Una base nueva se crea con los modelos actuales; no se altera ninguna tabla existente.
      await sequelize.sync({ transaction });
      await run('004_multicuenta.sql', false);
      await run('005_compartir_datos_cuenta.sql', false);
    } else {
      await run('004_multicuenta.sql');
      // Algunas instalaciones anteriores aún no tenían la tabla de consumos.
      const [current] = await sequelize.query("SELECT t.table_name AS nombre_tabla FROM information_schema.tables AS t WHERE t.table_schema = 'public'", { transaction });
      const existing = new Set(current.map(row => row.nombre_tabla));
      for (const model of [Receta, Comida, ProductoCompra, Consumo]) {
        if (!existing.has(model.tableName)) await model.sync({ transaction });
      }
      await run('005_compartir_datos_cuenta.sql');
    }
    if (tables.has('perfiles') || tables.has('profiles')) await run('003_eliminar_tabla_perfiles.sql');
    await run('006_integridad_cuentas.sql');
    await run('007_verificacion_email.sql');
    await run('008_registro_invitado.sql');
  });
}
