import { Receta } from '../models/index.js';

export async function listRecipes(req, res, next) {
  try {
    const recetas = await Receta.findAll({ where: { usuarioId: req.user.id }, order: [['creadoEn', 'DESC']] });
    res.json(recetas);
  } catch (error) { next(error); }
}

export async function createRecipe(req, res, next) {
  try {
    const receta = await Receta.create({ ...req.body, usuarioId: req.user.id });
    res.status(201).json(receta);
  } catch (error) { next(error); }
}

export async function updateRecipe(req, res, next) {
  try {
    const receta = await Receta.findOne({ where: { id: req.params.id, usuarioId: req.user.id } });
    if (!receta) return res.status(404).json({ message: 'Receta no encontrada.' });
    await receta.update(req.body);
    res.json(receta);
  } catch (error) { next(error); }
}

export async function deleteRecipe(req, res, next) {
  try {
    const eliminadas = await Receta.destroy({ where: { id: req.params.id, usuarioId: req.user.id } });
    if (!eliminadas) return res.status(404).json({ message: 'Receta no encontrada.' });
    res.status(204).end();
  } catch (error) { next(error); }
}
