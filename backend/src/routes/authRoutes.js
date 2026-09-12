import { Router } from 'express';
import { body } from 'express-validator';
import { acceder, registrar, yo } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

const reglasRegistro = [
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio.'),
  body('email').isEmail().withMessage('Email no válido.'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres.'),
  validateRequest
];

const reglasAcceso = [
  body('email').isEmail().withMessage('Email no válido.'),
  body('password').notEmpty().withMessage('La contraseña es obligatoria.'),
  validateRequest
];

router.post('/registro', reglasRegistro, registrar);
router.post('/acceso', reglasAcceso, acceder);
router.get('/yo', requireAuth, yo);

// Alias temporales para clientes antiguos durante la migración.
router.post('/register', reglasRegistro, registrar);
router.post('/login', reglasAcceso, acceder);
router.get('/me', requireAuth, yo);

export default router;
