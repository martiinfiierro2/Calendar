import { apiRequest } from './apiClient';
import { readStorage, writeStorage } from './storageService';

const RECIPES_KEY = 'calendar_recetas';
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=700&q=80';

export function normalizeRecipe(recipe) {
  return {
    categoria: 'Otros',
    tiempo: 30,
    raciones: 2,
    dificultad: 'Fácil',
    favorito: false,
    ingredientes: [],
    pasos: [],
    planificada: null,
    ...recipe,
    imagen: recipe?.imagen || FALLBACK_IMAGE
  };
}

export function getRecipes() {
  const stored = readStorage(RECIPES_KEY, null);
  return Array.isArray(stored) ? stored.map(normalizeRecipe) : [];
}

function cacheRecipes(recipes) {
  const normalized = recipes.map(normalizeRecipe);
  writeStorage(RECIPES_KEY, normalized);
  return normalized;
}

async function requestRecetas(path = '', options) {
  try {
    return await apiRequest(`/recetas${path}`, options);
  } catch (error) {
    if (error.status !== 404) throw error;
    return apiRequest(`/recipes${path}`, options);
  }
}

export async function fetchRecipes() {
  const recipes = await requestRecetas();
  return cacheRecipes(Array.isArray(recipes) ? recipes : []);
}

export async function createRecipe(data) {
  const recipe = normalizeRecipe(await requestRecetas('', {
    method: 'POST',
    body: JSON.stringify(data)
  }));

  const current = getRecipes().filter(item => String(item.id) !== String(recipe.id));
  cacheRecipes([recipe, ...current]);
  return recipe;
}

export async function updateRecipe(id, data) {
  const recipe = normalizeRecipe(await requestRecetas(`/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }));

  cacheRecipes(getRecipes().map(item => String(item.id) === String(id) ? recipe : item));
  return recipe;
}

export async function deleteRecipe(id) {
  await requestRecetas(`/${id}`, { method: 'DELETE' });
  cacheRecipes(getRecipes().filter(item => String(item.id) !== String(id)));
}

export function saveRecipes(recipes) {
  cacheRecipes(recipes);
}
