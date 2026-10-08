import jwt from 'jsonwebtoken';
import { Cuenta, Usuario } from '../models/index.js';

// Comprueba el token y añade el usuario a la petición.
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Token requerido.' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const usuario = await Usuario.findByPk(payload.id, {
      attributes: ['id', 'nombre', 'email', 'emailVerificado', 'cuentaId', 'rol'],
      include: [{ model: Cuenta, as: 'cuenta', attributes: ['tipo'] }]
    });

    if (!usuario) return res.status(401).json({ message: 'Sesión no válida.' });

    req.user = usuario;
    next();
  } catch {
    return res.status(401).json({ message: 'Token inválido o caducado.' });
  }
}

export function requireVerifiedEmail(req, res, next) {
  if (!req.user.emailVerificado) {
    return res.status(403).json({ code: 'EMAIL_NOT_VERIFIED', message: 'Verifica tu correo antes de usar Calendar.' });
  }
  next();
}

export function requireActiveAccount(req, res, next) {
  requireVerifiedEmail(req, res, () => {
    if (!req.user.cuentaId) {
      return res.status(403).json({ code: 'ACCOUNT_PENDING', message: 'Acepta tu invitación para entrar en la familia.' });
    }
    next();
  });
}
