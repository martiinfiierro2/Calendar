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

  body('cantidad')
    .isFloat({ gt: 0 })
    .withMessage('La cantidad debe ser un número mayor que 0.'),

  body('unidad')
    .isIn(['ud', 'g', 'kg', 'ml', 'L'])
    .withMessage('La unidad debe ser ud, g, kg, ml o L.'),

  body('estado')
    .optional()
    .isIn(['apuntado', 'apuntadoChecked', 'comprado', 'compradoChecked', 'usado'])
    .withMessage(
      'El estado debe ser apuntado, apuntadoChecked, comprado, compradoChecked o usado.'
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
router.post('/from-calendar', generateFromCalendar);
router.put('/:id', rules, updateShoppingItem);
router.delete('/:id', deleteShoppingItem);

export default router;
