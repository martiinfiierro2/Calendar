import { Router } from 'express';
import { body } from 'express-validator';
import { getProfile, updateProfile } from '../controllers/profileController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();
router.use(requireAuth);

router.get('/', getProfile);
router.put('/', [
  body('email').optional().isEmail().withMessage('Email no válido.'),
  body('raciones').optional().isInt({ min: 1, max: 20 }),
  body('recordatorios').optional().isBoolean(),
  body('resumenSemanal').optional().isBoolean(),
  body('comprasAutomaticas').optional().isBoolean(),
  validateRequest
], updateProfile);

export default router;
