import { Sequelize } from 'sequelize';

// En producción usamos DATABASE_URL; en local también se puede usar una URL de PostgreSQL.
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('Falta DATABASE_URL en las variables de entorno.');
}

const useSsl = process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production';

const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  dialectOptions: useSsl
    ? {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    : {}
});

export default sequelize;
