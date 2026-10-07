import { trySendingVerification } from '../services/emailVerificationService.js';
import { Cuenta, Usuario, sequelize } from '../models/index.js';

function respuestaUsuario(usuario) {
  return {
    nombre: usuario.nombre,
    email: usuario.email,
    emailVerificado: usuario.emailVerificado,
    recordatorios: usuario.recordatorios,
    cuentaId: usuario.cuentaId,
    tipoCuenta: usuario.cuenta?.tipo || null,
    rol: usuario.rol
  };
}

export async function getUser(req, res, next) {
  try {
    const usuario = await Usuario.findByPk(req.user.id, {
      include: [{ model: Cuenta, as: 'cuenta', attributes: ['tipo'] }]
    });

    res.json(respuestaUsuario(usuario));
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'Ese email ya está registrado.' });
    }
    next(error);
  }
}

export async function updateUser(req, res, next) {
  try {
    const { nombre, email, recordatorios } = req.body;
    const result = await sequelize.transaction(async transaction => {
      await sequelize.query('SELECT pg_advisory_xact_lock(724116, 2)', { transaction });
      const usuario = await Usuario.findByPk(req.user.id, {
        transaction, lock: transaction.LOCK.UPDATE
      });
      if (!usuario) {
        const error = new Error('Sesión no válida.');
        error.status = 401;
        throw error;
      }
      if (nombre !== undefined) usuario.nombre = nombre.trim() || usuario.nombre;
      const emailChanged = email !== undefined && email.trim().toLowerCase() !== usuario.email;
      if (emailChanged) {
        usuario.email = email.trim().toLowerCase();
        usuario.emailVerificado = false;
        usuario.emailVerificacionHash = null;
        usuario.emailVerificacionExpiraEn = null;
        usuario.emailVerificacionEnviadaEn = null;
      }
      if (recordatorios !== undefined) usuario.recordatorios = recordatorios;
      await usuario.save({ transaction });
      usuario.cuenta = await Cuenta.findByPk(usuario.cuentaId, { transaction, attributes: ['tipo'] });
      return { usuario, emailChanged };
    });
    const verificacionCorreo = result.emailChanged ? await trySendingVerification(result.usuario.id) : undefined;
    res.json({ ...respuestaUsuario(result.usuario), ...(verificacionCorreo ? { verificacionCorreo } : {}) });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'Ese email ya está registrado.' });
    }
    next(error);
  }
}
