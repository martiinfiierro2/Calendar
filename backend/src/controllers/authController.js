import bcrypt from 'bcryptjs';
import { Perfil, Receta, Usuario } from '../models/index.js';
import { defaultRecipes } from '../data/defaultRecipes.js';
import { createToken } from '../utils/token.js';

function usuarioPublico(usuario) {
  return { id: usuario.id, nombre: usuario.nombre, email: usuario.email };
}

export async function registrar(req, res, next) {
  try {
    const nombre = req.body.nombre.trim();
    const email = req.body.email.trim().toLowerCase();
    const existe = await Usuario.findOne({ where: { email } });
    if (existe) return res.status(409).json({ message: 'Ya existe una cuenta con ese email.' });

    const hashContrasena = await bcrypt.hash(req.body.password, 12);
    const usuario = await Usuario.create({ nombre, email, hashContrasena });

    await Perfil.create({ usuarioId: usuario.id });
    await Receta.bulkCreate(defaultRecipes.map(receta => ({ ...receta, usuarioId: usuario.id })));

    res.status(201).json({ usuario: usuarioPublico(usuario), token: createToken(usuario.id) });
  } catch (error) {
    next(error);
  }
}

export async function acceder(req, res, next) {
  try {
    const email = req.body.email.trim().toLowerCase();
    const usuario = await Usuario.findOne({ where: { email } });
    const valida = usuario && await bcrypt.compare(req.body.password, usuario.hashContrasena);
    if (!valida) return res.status(401).json({ message: 'Email o contraseña incorrectos.' });

    res.json({ usuario: usuarioPublico(usuario), token: createToken(usuario.id) });
  } catch (error) {
    next(error);
  }
}

export function yo(req, res) {
  res.json({ usuario: req.user });
}
