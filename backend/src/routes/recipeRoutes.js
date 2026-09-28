import { Router } from 'express';
import { body } from 'express-validator';
import { createRecipe, deleteRecipe, listRecipes, updateRecipe } from '../controllers/recipeController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();
router.use(requireAuth);

const rules = [
  body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio.'),
  body('tiempo').optional().isInt({ min: 1 }),
  body('raciones').optional().isInt({ min: 1 }),

  body('ingredientes')
    .optional()
    .isArray()
    .withMessage('Los ingredientes deben ser un array.'),

  body('ingredientes.*.nombre')
    .if(body('ingredientes').isArray())
    .trim()
    .notEmpty()
    .withMessage('Cada ingrediente debe tener nombre.'),

  body('ingredientes.*.cantidad')
    .if(body('ingredientes').isArray())
    .isFloat({ gt: 0 })
    .withMessage('La cantidad de cada ingrediente debe ser mayor que 0.'),

  body('ingredientes.*.unidad')
    .if(body('ingredientes').isArray())
    .isIn(['ud', 'g', 'kg', 'ml', 'L'])
    .withMessage('La unidad de cada ingrediente debe ser ud, g, kg, ml o L.'),

  body('pasos').optional().isArray(),
  validateRequest
];

router.get('/', listRecipes);
router.post('/', rules, createRecipe);
router.put('/:id', rules, updateRecipe);
router.delete('/:id', deleteRecipe);

export default router;
