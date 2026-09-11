import { Meal } from '../models/index.js';

export async function listMeals(req, res, next) {
  try {
    const meals = await Meal.findAll({ where: { userId: req.user.id }, order: [['fecha', 'ASC'], ['hora', 'ASC']] });
    res.json(meals);
  } catch (error) { next(error); }
}

export async function createMeal(req, res, next) {
  try {
    const meal = await Meal.create({ ...req.body, userId: req.user.id });
    res.status(201).json(meal);
  } catch (error) { next(error); }
}

export async function updateMeal(req, res, next) {
  try {
    const meal = await Meal.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!meal) return res.status(404).json({ message: 'Comida no encontrada.' });
    await meal.update(req.body);
    res.json(meal);
  } catch (error) { next(error); }
}

export async function deleteMeal(req, res, next) {
  try {
    const deleted = await Meal.destroy({ where: { id: req.params.id, userId: req.user.id } });
    if (!deleted) return res.status(404).json({ message: 'Comida no encontrada.' });
    res.status(204).end();
  } catch (error) { next(error); }
}
