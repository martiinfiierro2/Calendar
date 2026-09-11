import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

// Comprueba el token y añade el usuario a la petición.
export async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Token requerido.' });

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(payload.id, { attributes: ['id', 'nombre', 'email'] });
    if (!user) return res.status(401).json({ message: 'Sesión no válida.' });

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Token inválido o caducado.' });
  }
}
