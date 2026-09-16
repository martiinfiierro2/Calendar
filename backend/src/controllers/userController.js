import { Usuario } from '../models/index.js';

export async function getUser(req, res, next) {
  try {
    const usuario = await Usuario.findByPk(req.user.id);

    res.json({
      nombre: usuario.nombre,
      email: usuario.email,
      recordatorios: usuario.recordatorios
    });
  } catch (error) {
    next(error);
  }
}

export async function updateUser(req, res, next) {
  try {
    const { nombre, email, recordatorios } = req.body;
    const usuario = await Usuario.findByPk(req.user.id);

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

    res.json({
      nombre: usuario.nombre,
      email: usuario.email,
      recordatorios: usuario.recordatorios
    });
  } catch (error) {
    next(error);
  }
}