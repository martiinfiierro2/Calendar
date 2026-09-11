import { Router } from 'express';
import { body } from 'express-validator';
import { login, me, register } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

router.post('/register', [
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio.'),
  body('email').isEmail().withMessage('Email no válido.'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres.'),
  validateRequest
], register);

router.post('/login', [
  body('email').isEmail().withMessage('Email no válido.'),
  body('password').notEmpty().withMessage('La contraseña es obligatoria.'),
  validateRequest
], login);

router.get('/me', requireAuth, me);

export default router;
