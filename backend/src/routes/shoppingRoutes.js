import { Router } from 'express';
import { body } from 'express-validator';

import {
  createShoppingItem,
  deleteShoppingItem,
  generateFromCalendar,
  listShopping,
  updateShoppingItem
} from '../controllers/shoppingController.js';

import { requireAuth } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

router.use(requireAuth);

const rules = [
  body('nombre')
    .trim()
    .notEmpty()
    .withMessage('El producto es obligatorio.'),

  body('estado')
    .optional()
    .isIn(['apuntado', 'apuntadoChecked', 'comprado', 'compradoChecked', 'usado'])
    .withMessage(
      'El estado debe ser apuntado, comprado o usado.'
    ),

  body('automatico')
    .optional()
    .isBoolean()
    .withMessage(
      'El campo automatico debe ser booleano.'
    ),

  validateRequest
];


router.get('/', listShopping);
router.post('/', rules, createShoppingItem);
router.post('/desde-calendario', generateFromCalendar);

// Puedes mantenerla por compatibilidad.
// Personalmente acabaría eliminándola porque ya tienes
// el endpoint español.
router.post('/from-calendar', generateFromCalendar);
router.put('/:id', rules, updateShoppingItem);
router.delete('/:id', deleteShoppingItem);

export default router;