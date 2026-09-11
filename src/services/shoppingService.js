import { PERFIL_INICIAL } from '../config/appConfig';
import { categoriaIngrediente, normalizarIngrediente } from '../utils/ingredientUtils';
import { getRecipes } from './recipeService';
import { readStorage, writeStorage } from './storageService';

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

// Si el perfil lo tiene activado, añade automáticamente los ingredientes nuevos.
export function syncAutomaticShopping() {
  const profile = readStorage('calendar_perfil', PERFIL_INICIAL) || PERFIL_INICIAL;
  if (!profile.comprasAutomaticas) return;

  const currentItems = readStorage('calendar_compra', []);
  const newItems = buildShoppingItemsFromCalendar(currentItems);
  if (!newItems.length) return;

  writeStorage('calendar_compra', [...newItems, ...currentItems]);
}
