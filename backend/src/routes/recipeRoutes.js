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
  body('ingredientes').optional().isArray(),
  body('pasos').optional().isArray(),
  validateRequest
];

router.get('/', listRecipes);
router.post('/', rules, createRecipe);
router.put('/:id', rules, updateRecipe);
router.delete('/:id', deleteRecipe);

export default router;
