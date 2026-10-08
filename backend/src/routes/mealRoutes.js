import { Router } from 'express';
import { body } from 'express-validator';
import { createMeal, deleteMeal, listMeals, updateMeal } from '../controllers/mealController.js';
import { requireAuth, requireActiveAccount } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();
router.use(requireAuth, requireActiveAccount);

const UNIDADES = ['ud', 'g', 'kg', 'ml', 'L'];

const rules = [
  body('fecha').isISO8601().withMessage('Fecha no válida.'),
  body('hora').matches(/^\d{2}:\d{2}(:\d{2})?$/).withMessage('Hora no válida.'),
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio.'),
  body('modo').isIn(['receta', 'rapida']).withMessage('Modo no válido.'),

  body('ingredientes')
    .if(body('modo').equals('rapida'))
    .isArray({ min: 1 })
    .withMessage('Una comida rápida debe incluir al menos un ingrediente.'),

  body('ingredientes.*.nombre')
    .if(body('modo').equals('rapida'))
    .trim()
    .notEmpty()
    .withMessage('El nombre del ingrediente es obligatorio.'),

  body('ingredientes.*.cantidad')
    .if(body('modo').equals('rapida'))
    .isFloat({ gt: 0 })
    .withMessage('La cantidad del ingrediente debe ser mayor que 0.'),

  body('ingredientes.*.unidad')
    .if(body('modo').equals('rapida'))
    .isIn(UNIDADES)
    .withMessage('Unidad de ingrediente no válida.'),

  validateRequest
];

router.get('/', listMeals);
router.post('/', rules, createMeal);
router.put('/:id', rules, updateMeal);
router.delete('/:id', deleteMeal);

export default router;
