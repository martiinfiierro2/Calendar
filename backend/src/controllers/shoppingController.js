import { Meal, Recipe, ShoppingItem } from '../models/index.js';

function ingredientCategory(name = '') {
  const text = name.toLowerCase();
  if (/(tomate|cebolla|zanahoria|pepino|pimiento|patata|lim[oó]n|verdura|fruta|ajo|lechuga)/.test(text)) return 'Fruta y verdura';
  if (/(pollo|carne|ternera|cerdo|jam[oó]n|salm[oó]n|pescado|at[uú]n|conejo)/.test(text)) return 'Carne y pescado';
  if (/(leche|queso|yogur|mantequilla|nata)/.test(text)) return 'Lácteos';
  if (/(pan|baguette|barra|tostada)/.test(text)) return 'Panadería';
  if (/(arroz|pasta|harina|lenteja|garbanzo|aceite|vinagre|sal|pimienta|curry|azafr[aá]n|piment[oó]n)/.test(text)) return 'Despensa';
  return 'Otros';
}

export async function listShopping(req, res, next) {
  try {
    const items = await ShoppingItem.findAll({ where: { userId: req.user.id }, order: [['comprado', 'ASC'], ['createdAt', 'DESC']] });
    res.json(items);
  } catch (error) { next(error); }
}

export async function createShoppingItem(req, res, next) {
  try {
    const item = await ShoppingItem.create({ ...req.body, userId: req.user.id });
    res.status(201).json(item);
  } catch (error) { next(error); }
}

export async function updateShoppingItem(req, res, next) {
  try {
    const item = await ShoppingItem.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!item) return res.status(404).json({ message: 'Producto no encontrado.' });
    await item.update(req.body);
    res.json(item);
  } catch (error) { next(error); }
}

export async function deleteShoppingItem(req, res, next) {
  try {
    const deleted = await ShoppingItem.destroy({ where: { id: req.params.id, userId: req.user.id } });
    if (!deleted) return res.status(404).json({ message: 'Producto no encontrado.' });
    res.status(204).end();
  } catch (error) { next(error); }
}

export async function generateFromCalendar(req, res, next) {
  try {
    const [meals, recipes, existing] = await Promise.all([
      Meal.findAll({ where: { userId: req.user.id, modo: 'receta' } }),
      Recipe.findAll({ where: { userId: req.user.id } }),
      ShoppingItem.findAll({ where: { userId: req.user.id } })
    ]);

    const recipeMap = new Map(recipes.map(recipe => [String(recipe.id), recipe]));
    const seen = new Set(existing.map(item => item.nombre.trim().toLowerCase()));
    const rows = [];

    meals.forEach(meal => {
      const recipe = recipeMap.get(String(meal.recipeId));
      (recipe?.ingredientes || []).forEach(ingredient => {
        const nombre = String(ingredient).trim();
        const key = nombre.toLowerCase();
        if (!nombre || seen.has(key)) return;
        seen.add(key);
        rows.push({ nombre, cantidad: '1', categoria: ingredientCategory(nombre), comprado: false, automatico: true, userId: req.user.id });
      });
    });

    const created = rows.length ? await ShoppingItem.bulkCreate(rows) : [];
    res.status(201).json(created);
  } catch (error) { next(error); }
}
