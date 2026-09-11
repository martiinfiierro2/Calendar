import { Profile, User } from '../models/index.js';

export async function getProfile(req, res, next) {
  try {
    const profile = await Profile.findOne({ where: { userId: req.user.id } });
    res.json({ nombre: req.user.nombre, email: req.user.email, ...profile?.toJSON() });
  } catch (error) { next(error); }
}

export async function updateProfile(req, res, next) {
  try {
    const { nombre, email, ...preferences } = req.body;
    const user = await User.findByPk(req.user.id);

    if (nombre !== undefined) user.nombre = nombre.trim() || user.nombre;
    if (email !== undefined) user.email = email.trim().toLowerCase();
    await user.save();

    const [profile] = await Profile.findOrCreate({ where: { userId: req.user.id }, defaults: { userId: req.user.id } });
    await profile.update(preferences);

    res.json({ nombre: user.nombre, email: user.email, ...profile.toJSON() });
  } catch (error) { next(error); }
}
