import { Cuenta, Usuario } from '../models/index.js';

function respuestaUsuario(usuario) {
  return {
    nombre: usuario.nombre,
    email: usuario.email,
    recordatorios: usuario.recordatorios,
    cuentaId: usuario.cuentaId,
    tipoCuenta: usuario.cuenta?.tipo || null
  };
}

export async function getUser(req, res, next) {
  try {
    const usuario = await Usuario.findByPk(req.user.id, {
      include: [{ model: Cuenta, as: 'cuenta', attributes: ['tipo'] }]
    });

    res.json(respuestaUsuario(usuario));
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req, res, next) {
  try {
    const { nombre, email, recordatorios } = req.body;
    const usuario = await Usuario.findByPk(req.user.id, {
      include: [{ model: Cuenta, as: 'cuenta', attributes: ['tipo'] }]
    });

    if (nombre !== undefined) {
      usuario.nombre = nombre.trim() || usuario.nombre;
    }

    if (email !== undefined) {
      usuario.email = email.trim().toLowerCase();
    }

    if (recordatorios !== undefined) {
      usuario.recordatorios = recordatorios;
    }

    await usuario.save();

    res.json(respuestaUsuario(usuario));
  } catch (error) {
    next(error);
  }
}
