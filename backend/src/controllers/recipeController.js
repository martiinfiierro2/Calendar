import { Recipe } from '../models/index.js';

export async function listRecipes(req, res, next) {
  try {
    const recipes = await Recipe.findAll({ where: { userId: req.user.id }, order: [['createdAt', 'DESC']] });
    res.json(recipes);
  } catch (error) { next(error); }
}

export async function createRecipe(req, res, next) {
  try {
    const recipe = await Recipe.create({ ...req.body, userId: req.user.id });
    res.status(201).json(recipe);
  } catch (error) { next(error); }
}

export async function updateRecipe(req, res, next) {
  try {
    const recipe = await Recipe.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!recipe) return res.status(404).json({ message: 'Receta no encontrada.' });
    await recipe.update(req.body);
    res.json(recipe);
  } catch (error) { next(error); }
}

export async function deleteRecipe(req, res, next) {
  try {
    const deleted = await Recipe.destroy({ where: { id: req.params.id, userId: req.user.id } });
    if (!deleted) return res.status(404).json({ message: 'Receta no encontrada.' });
    res.status(204).end();
  } catch (error) { next(error); }
}
