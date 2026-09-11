import { Router } from 'express';
import { body } from 'express-validator';
import { createMeal, deleteMeal, listMeals, updateMeal } from '../controllers/mealController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();
router.use(requireAuth);

const rules = [
  body('fecha').isISO8601().withMessage('Fecha no válida.'),
  body('hora').matches(/^\d{2}:\d{2}(:\d{2})?$/).withMessage('Hora no válida.'),
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio.'),
  body('modo').isIn(['receta', 'rapida']).withMessage('Modo no válido.'),
  validateRequest
];

router.get('/', listMeals);
router.post('/', rules, createMeal);
router.put('/:id', rules, updateMeal);
router.delete('/:id', deleteMeal);

export default router;
