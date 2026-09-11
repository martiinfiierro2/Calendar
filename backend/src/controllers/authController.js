import bcrypt from 'bcryptjs';
import { Profile, Recipe, User } from '../models/index.js';
import { defaultRecipes } from '../data/defaultRecipes.js';
import { createToken } from '../utils/token.js';

function publicUser(user) {
  return { id: user.id, nombre: user.nombre, email: user.email };
}

export async function register(req, res, next) {
  try {
    const nombre = req.body.nombre.trim();
    const email = req.body.email.trim().toLowerCase();
    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(409).json({ message: 'Ya existe una cuenta con ese email.' });

    const passwordHash = await bcrypt.hash(req.body.password, 12);
    const user = await User.create({ nombre, email, passwordHash });

    await Profile.create({ userId: user.id });
    await Recipe.bulkCreate(defaultRecipes.map(recipe => ({ ...recipe, userId: user.id })));

    res.status(201).json({ user: publicUser(user), token: createToken(user.id) });
  } catch (error) {
    next(error);
  }
}

export async function login(req, res, next) {
  try {
    const email = req.body.email.trim().toLowerCase();
    const user = await User.findOne({ where: { email } });
    const valid = user && await bcrypt.compare(req.body.password, user.passwordHash);
    if (!valid) return res.status(401).json({ message: 'Email o contraseña incorrectos.' });

    res.json({ user: publicUser(user), token: createToken(user.id) });
  } catch (error) {
    next(error);
  }
}

export function me(req, res) {
  res.json({ user: req.user });
}
