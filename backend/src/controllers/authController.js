import { trySendingVerification } from '../services/emailVerificationService.js';
import bcrypt from 'bcryptjs';
import { Cuenta, InvitacionCuenta, Usuario, sequelize } from '../models/index.js';
import { createToken } from '../utils/token.js';

function usuarioPublico(usuario) {
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    email: usuario.email,
    emailVerificado: usuario.emailVerificado,
    cuentaId: usuario.cuentaId,
    rol: usuario.rol,
    tipoCuenta: usuario.cuenta?.tipo || null
  };
}

function respuestaSesion(usuario, token) {
  const publico = usuarioPublico(usuario);

  return {
    usuario: publico,
    user: publico,
    token
  };
}

export async function registrar(req, res, next) {
  const transaction = await sequelize.transaction();

  try {
    await sequelize.query('SELECT pg_advisory_xact_lock(724116, 2)', { transaction });
    const nombre = req.body.nombre.trim();
    const email = req.body.email.trim().toLowerCase();
    const accountType = req.body.accountType;

    const existe = await Usuario.findOne({
      where: { email },
      transaction
    });

    if (existe) {
      await transaction.rollback();
      return res.status(409).json({
        message: 'Ya existe una cuenta con ese email.'
      });
    }

    let cuenta = null;
    if (req.body.invitationToken) {
      const invitation = await InvitacionCuenta.findOne({
        where: { token: req.body.invitationToken, estado: 'pendiente', email },
        transaction, lock: transaction.LOCK.UPDATE
      });
      const owner = invitation && await Usuario.findOne({
        where: { cuentaId: invitation.cuentaId, rol: 'propietario' }, transaction
      });
      if (!invitation || invitation.expiraEn <= new Date() || !owner) {
        const error = new Error('La invitación no está disponible para este correo. Comprueba el email o pide un enlace nuevo.');
        error.status = 400;
        throw error;
      }
    } else {
      cuenta = await Cuenta.create({ tipo: accountType }, { transaction });
    }

    const hashContrasena = await bcrypt.hash(req.body.password, 12);

    const usuario = await Usuario.create({
      nombre,
      email,
      hashContrasena,
      cuentaId: cuenta?.id || null,
      rol: cuenta ? 'propietario' : 'miembro'
    }, { transaction });

    await transaction.commit();

    usuario.cuenta = cuenta;

    const verificacionCorreo = await trySendingVerification(usuario.id);
    res.status(201).json({ ...respuestaSesion(usuario, createToken(usuario.id)), verificacionCorreo });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    if (error.name === 'SequelizeUniqueConstraintError') return res.status(409).json({ message: 'Ya existe un usuario con ese email. Inicia sesión.' });
    next(error);
  }
}

export async function acceder(req, res, next) {
  try {
    const email = req.body.email.trim().toLowerCase();

    const usuario = await Usuario.findOne({
      where: { email },
      include: [{ model: Cuenta, as: 'cuenta', attributes: ['tipo'] }]
    });

    const valida =
      usuario &&
      await bcrypt.compare(
        req.body.password,
        usuario.hashContrasena
      );

    if (!valida) {
      return res.status(401).json({
        message: 'Email o contraseña incorrectos.'
      });
    }

    res.json(
      respuestaSesion(usuario, createToken(usuario.id))
    );
  } catch (error) {
    next(error);
  }
}

export function yo(req, res) {
  const usuario = usuarioPublico(req.user);

  res.json({
    usuario,
    user: usuario
  });
}

export async function cancelPendingRegistration(req, res, next) {
  try {
    await sequelize.transaction(async transaction => {
      await sequelize.query('SELECT pg_advisory_xact_lock(724116, 2)', { transaction });
      const user = await Usuario.findByPk(req.user.id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!user) { const error = new Error('Sesión no válida.'); error.status = 401; throw error; }
      if (user.cuentaId) { const error = new Error('Tu registro ya tiene una cuenta activa.'); error.status = 409; throw error; }
      await user.destroy({ transaction });
    });
    res.status(204).end();
  } catch (error) { next(error); }
}
