import 'dotenv/config';
import app from './app.js';
import { prepareDatabase } from './config/migrateDatabase.js';

const port = Number(process.env.PORT || 8080);

async function start() {
  try {
    await prepareDatabase();

    app.listen(port, () => {
      console.log(`Calendar API escuchando en http://localhost:${port}`);
    });
  } catch (error) {
    console.error('No se pudo iniciar la API:', error);
    process.exit(1);
  }
}

start();
