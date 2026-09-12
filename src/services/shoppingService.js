import { PERFIL_INICIAL } from '../config/appConfig';
import { categoriaIngrediente, normalizarIngrediente } from '../utils/ingredientUtils';
import { fetchRecipes } from './recipeService';
import { apiRequest } from './apiClient';
import { readStorage } from './storageService';

export async function fetchShoppingItems() {
  const items = await apiRequest('/compra');
  return Array.isArray(items) ? items : [];
}

export async function createShoppingItem(data) {
  return apiRequest('/compra', {
    method: 'POST',
    body: JSON.stringify(data)
  });
}

export async function updateShoppingItem(id, data) {
  return apiRequest(`/compra/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  });
}

export async function deleteShoppingItem(id) {
  await apiRequest(`/compra/${id}`, { method: 'DELETE' });
}

// Mientras el calendario siga en localStorage, genera aquí sus ingredientes y los guarda en la API.
export async function buildShoppingItemsFromCalendar(existingItems = []) {
  const meals = readStorage('calendar_comidas', []);
  const recipes = await fetchRecipes();
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

export async function createItemsFromCalendar(existingItems = []) {
  const pending = await buildShoppingItemsFromCalendar(existingItems);
  if (!pending.length) return [];
  return Promise.all(pending.map(item => createShoppingItem(item)));
}

// Si el perfil lo tiene activado, sincroniza los ingredientes sin bloquear el calendario.
export async function syncAutomaticShopping() {
  const profile = readStorage('calendar_perfil', PERFIL_INICIAL) || PERFIL_INICIAL;
  if (!profile.comprasAutomaticas) return [];

  try {
    const currentItems = await fetchShoppingItems();
    return await createItemsFromCalendar(currentItems);
  } catch {
    return [];
  }
}
