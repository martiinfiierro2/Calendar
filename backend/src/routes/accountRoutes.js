import { Router } from 'express';
import { body } from 'express-validator';
import {
  acceptInvitation,
  cancelInvitation,
  transferOwnership,
  convertToGroup,
  getAccount,
  inviteMember,
  leaveAccount,
  listMyInvitations,
  rejectInvitation,
  removeMember
} from '../controllers/accountController.js';
import { requireAuth } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

router.use(requireAuth);

router.get('/', getAccount);
router.patch('/tipo/grupal', convertToGroup);
router.get('/invitaciones/mias', listMyInvitations);
router.post(
  '/invitaciones',
  body('email').trim().isEmail().withMessage('Email no válido.'),
  validateRequest,
  inviteMember
);
router.delete('/invitaciones/:invitacionId', cancelInvitation);
router.post('/propiedad/:usuarioId', transferOwnership);
router.post('/invitaciones/:token/aceptar', acceptInvitation);
router.post('/invitaciones/:token/rechazar', rejectInvitation);
router.delete('/miembros/:usuarioId', removeMember);
router.post('/abandonar', leaveAccount);

export default router;
