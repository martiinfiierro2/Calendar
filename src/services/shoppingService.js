import { categoriaIngrediente, normalizarIngrediente } from '../utils/ingredientUtils';
import { getRecipes } from './recipeService';
import { readStorage } from './storageService';

// Construye productos desde las recetas que están planificadas en el calendario.
export function buildShoppingItemsFromCalendar(existingItems = []) {
  const meals = readStorage('calendar_comidas', []);
  const recipes = getRecipes();
  const seen = new Set(existingItems.map(item => normalizarIngrediente(item.nombre)));
  const newItems = [];

  meals
    .filter(meal => meal.modo === 'receta')
    .forEach(meal => {
      const recipe = recipes.find(item => String(item.id) === String(meal.recetaId));

      (recipe?.ingredientes || []).forEach(ingredient => {
        const name = String(ingredient).trim();
        const key = normalizarIngrediente(name);
        if (!name || seen.has(key)) return;

        seen.add(key);
        newItems.push({
          id: `${Date.now()}-${newItems.length}`,
          nombre: name,
          cantidad: '1',
          categoria: categoriaIngrediente(name),
          comprado: false,
          automatico: true
        });
      });
    });

  return newItems;
}
