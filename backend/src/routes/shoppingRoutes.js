import { Router } from 'express';
import { body } from 'express-validator';
import { createShoppingItem, deleteShoppingItem, generateFromCalendar, listShopping, updateShoppingItem } from '../controllers/shoppingController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();
router.use(requireAuth);

const rules = [
  body('nombre').trim().notEmpty().withMessage('El producto es obligatorio.'),
  body('comprado').optional().isBoolean(),
  body('automatico').optional().isBoolean(),
  validateRequest
];

router.get('/', listShopping);
router.post('/', rules, createShoppingItem);
router.post('/from-calendar', generateFromCalendar);
router.put('/:id', rules, updateShoppingItem);
router.delete('/:id', deleteShoppingItem);

export default router;
