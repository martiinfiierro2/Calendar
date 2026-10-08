import { Router } from 'express';
import { body } from 'express-validator';
import {
  acceptInvitation,
  cancelInvitation,
  transferOwnership,
  convertToGroup,
  convertToIndividual,
  getAccount,
  inviteMember,
  resendInvitation,
  leaveAccount,
  listMyInvitations,
  rejectInvitation,
  removeMember
} from '../controllers/accountController.js';
import { requireAuth, requireActiveAccount, requireVerifiedEmail } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

router.use(requireAuth);

// Estos endpoints también sirven a registros invitados sin cuenta activa.
router.get('/invitaciones/mias', listMyInvitations);
const tokenRules = [body('token').isHexadecimal().isLength({ min: 64, max: 64 }), validateRequest];
router.post('/invitaciones/aceptar', tokenRules, acceptInvitation);
router.post('/invitaciones/rechazar', requireVerifiedEmail, tokenRules, rejectInvitation);
router.post('/invitaciones/:token/aceptar', acceptInvitation);
router.post('/invitaciones/:token/rechazar', requireVerifiedEmail, rejectInvitation);
router.use(requireActiveAccount);
router.get('/', getAccount);
router.patch('/tipo/grupal', convertToGroup);
router.patch('/tipo/individual', convertToIndividual);
router.post(
  '/invitaciones',
  body('email').trim().isEmail().withMessage('Email no válido.'),
  validateRequest,
  inviteMember
);
router.delete('/invitaciones/:invitacionId', cancelInvitation);
router.post('/invitaciones/:invitacionId/reenviar', resendInvitation);
router.post('/propiedad/:usuarioId', transferOwnership);
router.delete('/miembros/:usuarioId', removeMember);
router.post('/abandonar', leaveAccount);

export default router;
