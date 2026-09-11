import 'dotenv/config';
import { sequelize } from '../src/models/index.js';

// Crea las tablas que falten antes del primer despliegue.
try {
  await sequelize.authenticate();
  await sequelize.sync();
  console.log('Base de datos sincronizada correctamente.');
  await sequelize.close();
} catch (error) {
  console.error('No se pudo sincronizar la base de datos:', error);
  process.exit(1);
}
