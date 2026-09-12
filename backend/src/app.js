import cors from 'cors';
import express from 'express';
import morgan from 'morgan';
import authRoutes from './routes/authRoutes.js';
import recipeRoutes from './routes/recipeRoutes.js';
import mealRoutes from './routes/mealRoutes.js';
import shoppingRoutes from './routes/shoppingRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.get('/api/estado', (req, res) => {
  res.json({ ok: true, servicio: 'calendar-api' });
});

app.use('/api/autenticacion', authRoutes);
app.use('/api/recetas', recipeRoutes);
app.use('/api/comidas', mealRoutes);
app.use('/api/compra', shoppingRoutes);
app.use('/api/perfil', profileRoutes);

// Alias temporales para clientes antiguos durante la migración.
app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'calendar-api' });
});
app.use('/api/auth', authRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/shopping', shoppingRoutes);
app.use('/api/profile', profileRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
