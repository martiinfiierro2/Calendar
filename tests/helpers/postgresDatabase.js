import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';

const require = createRequire(new URL('../../backend/package.json', import.meta.url));
const { Client } = require('pg');

export async function createTestDatabase() {
  const connectionString = process.env.CALENDAR_TEST_ADMIN_URL;
  if (!connectionString) throw new Error('Define CALENDAR_TEST_ADMIN_URL para PostgreSQL local con permiso CREATE DATABASE. No se utiliza DATABASE_URL de la aplicación.');
  const url = new URL(connectionString);
  if (!['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)) {
    throw new Error('Estas pruebas requieren PostgreSQL local; no se permite usar una base remota.');
  }
  const name = `calendar_test_${Date.now()}_${randomBytes(6).toString('hex')}`;
  const admin = new Client({ connectionString });
  await admin.connect();
  try {
    await admin.query(`CREATE DATABASE "${name}"`);
  } catch (error) {
    await admin.end();
    throw error;
  }
  url.pathname = `/${name}`;
  process.env.DATABASE_URL = url.toString();
  process.env.NODE_ENV = 'test';
  process.env.MAIL_TRANSPORT = 'test';
  process.env.FRONTEND_URL = 'http://localhost:5173';
  process.env.DB_SSL = 'false';
  process.env.JWT_SECRET = randomBytes(48).toString('hex');
  return {
    connectionString: url.toString(),
    async query(sql) {
      const client = new Client({ connectionString: url.toString() });
      await client.connect();
      try { return await client.query(sql); }
      finally { await client.end(); }
    },
    async destroy() {
      try { await admin.query(`DROP DATABASE "${name}" WITH (FORCE)`); }
      finally { await admin.end(); }
    }
  };
}
