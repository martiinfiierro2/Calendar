import { Perfil, Usuario } from '../models/index.js';

export async function getProfile(req, res, next) {
  try {
    const perfil = await Perfil.findOne({ where: { usuarioId: req.user.id } });
    res.json({ nombre: req.user.nombre, email: req.user.email, ...perfil?.toJSON() });
  } catch (error) { next(error); }
}

export async function updateProfile(req, res, next) {
  try {
    const { nombre, email, ...preferencias } = req.body;
    const usuario = await Usuario.findByPk(req.user.id);

    if (nombre !== undefined) usuario.nombre = nombre.trim() || usuario.nombre;
    if (email !== undefined) usuario.email = email.trim().toLowerCase();
    await usuario.save();

    const [perfil] = await Perfil.findOrCreate({
      where: { usuarioId: req.user.id },
      defaults: { usuarioId: req.user.id }
    });
    await perfil.update(preferencias);

    res.json({ nombre: usuario.nombre, email: usuario.email, ...perfil.toJSON() });
  } catch (error) { next(error); }
}
