import { Comida } from '../models/index.js';

export async function listMeals(req, res, next) {
  try {
    const comidas = await Comida.findAll({ where: { usuarioId: req.user.id }, order: [['fecha', 'ASC'], ['hora', 'ASC']] });
    res.json(comidas);
  } catch (error) { next(error); }
}

export async function createMeal(req, res, next) {
  try {
    const datos = { ...req.body, usuarioId: req.user.id };
    if (datos.recipeId !== undefined) {
      datos.recetaId = datos.recipeId;
      delete datos.recipeId;
    }
    const comida = await Comida.create(datos);
    res.status(201).json(comida);
  } catch (error) { next(error); }
}

export async function updateMeal(req, res, next) {
  try {
    const comida = await Comida.findOne({ where: { id: req.params.id, usuarioId: req.user.id } });
    if (!comida) return res.status(404).json({ message: 'Comida no encontrada.' });

    const datos = { ...req.body };
    if (datos.recipeId !== undefined) {
      datos.recetaId = datos.recipeId;
      delete datos.recipeId;
    }
    await comida.update(datos);
    res.json(comida);
  } catch (error) { next(error); }
}

export async function deleteMeal(req, res, next) {
  try {
    const eliminadas = await Comida.destroy({ where: { id: req.params.id, usuarioId: req.user.id } });
    if (!eliminadas) return res.status(404).json({ message: 'Comida no encontrada.' });
    res.status(204).end();
  } catch (error) { next(error); }
}
