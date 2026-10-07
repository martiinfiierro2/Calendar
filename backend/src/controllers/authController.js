import { trySendingVerification } from '../services/emailVerificationService.js';
import bcrypt from 'bcryptjs';
import { Cuenta, Usuario, sequelize } from '../models/index.js';
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

    const cuenta = await Cuenta.create({
      tipo: accountType
    }, { transaction });

    const hashContrasena = await bcrypt.hash(req.body.password, 12);

    const usuario = await Usuario.create({
      nombre,
      email,
      hashContrasena,
      cuentaId: cuenta.id
    }, { transaction });

    await transaction.commit();

    usuario.cuenta = cuenta;

    const verificacionCorreo = await trySendingVerification(usuario.id);
    res.status(201).json({ ...respuestaSesion(usuario, createToken(usuario.id)), verificacionCorreo });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
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
