import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import authRoutes from './routes/authRoutes.js';
import recipeRoutes from './routes/recipeRoutes.js';
import mealRoutes from './routes/mealRoutes.js';
import shoppingRoutes from './routes/shoppingRoutes.js';
import userRoutes from './routes/userRoutes.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';

const app = express();

const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL
].filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // Peticiones sin Origin (Postman, servidor a servidor, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Frontends explícitamente permitidos
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Preview Deployments de nuestro proyecto en Vercel
    const isVercelPreview =
      /^https:\/\/calendar-[a-z0-9-]+-martin-a90e\.vercel\.app$/.test(origin);

    if (isVercelPreview) {
      return callback(null, true);
    }

    return callback(new Error('Origen no permitido por CORS.'));
  },
  credentials: true
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/api/estado', (req, res) => {
  res.json({
    ok: true,
    servicio: 'calendar-api'
  });
});

app.use('/api/autenticacion', authRoutes);
app.use('/api/recetas', recipeRoutes);
app.use('/api/comidas', mealRoutes);
app.use('/api/compra', shoppingRoutes);
app.use('/api/perfil', userRoutes);

// Alias temporales para clientes antiguos durante la migración.
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    service: 'calendar-api'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/shopping', shoppingRoutes);
app.use('/api/profile', userRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;