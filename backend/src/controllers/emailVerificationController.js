import { confirmEmailVerification, sendEmailVerification } from '../services/emailVerificationService.js';

export async function verificarEmail(req, res, next) {
  try { res.json(await confirmEmailVerification(req.body.token)); }
  catch (error) { next(error); }
}

export async function reenviarVerificacion(req, res, next) {
  try { res.json(await sendEmailVerification(req.user.id)); }
  catch (error) { next(error); }
}
