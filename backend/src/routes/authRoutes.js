import { Router } from 'express';
import { body } from 'express-validator';
import { acceder, registrar, yo } from '../controllers/authController.js';
import { verificarEmail, reenviarVerificacion } from '../controllers/emailVerificationController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

const reglasRegistro = [
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio.'),
  body('email').trim().isEmail().withMessage('Email no válido.'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres.'),
  body('accountType')
    .isIn(['individual', 'grupal'])
    .withMessage('El tipo de cuenta no es válido.'),
  validateRequest
];

const reglasAcceso = [
  body('email').trim().isEmail().withMessage('Email no válido.'),
  body('password').notEmpty().withMessage('La contraseña es obligatoria.'),
  validateRequest
];

router.post('/registro', reglasRegistro, registrar);
router.post('/acceso', reglasAcceso, acceder);
router.get('/yo', requireAuth, yo);
router.post('/email/verificar', body('token').isHexadecimal().isLength({ min: 64, max: 64 }), validateRequest, verificarEmail);
router.post('/email/reenviar', requireAuth, reenviarVerificacion);

// Alias temporales para clientes antiguos durante la migración.
router.post('/register', reglasRegistro, registrar);
router.post('/login', reglasAcceso, acceder);
router.get('/me', requireAuth, yo);

export default router;
