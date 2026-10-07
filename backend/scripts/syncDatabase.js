import 'dotenv/config';
import { sequelize } from '../src/models/index.js';
import { prepareDatabase } from '../src/config/migrateDatabase.js';

try {
  await prepareDatabase();
  console.log('Base de datos preparada; migraciones registradas correctamente.');
} catch (error) {
  console.error('No se pudo preparar la base de datos:', error);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
