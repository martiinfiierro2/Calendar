import { DEFAULT_RECIPES } from '../data/defaultRecipes';
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

export function getDefaultRecipes() {
  return DEFAULT_RECIPES.map(recipe => ({
    ...recipe,
    ingredientes: [...recipe.ingredientes],
    pasos: [...recipe.pasos]
  }));
}

// Se mantiene como caché síncrona para el calendario mientras termina su migración a la API.
export function getRecipes() {
  const stored = readStorage(RECIPES_KEY, null);
  if (Array.isArray(stored)) return stored.map(normalizeRecipe);
  return getDefaultRecipes().map(normalizeRecipe);
}

function cacheRecipes(recipes) {
  const normalized = recipes.map(normalizeRecipe);
  writeStorage(RECIPES_KEY, normalized);
  return normalized;
}

export async function fetchRecipes() {
  const recipes = await apiRequest('/recipes');
  return cacheRecipes(Array.isArray(recipes) ? recipes : []);
}

export async function createRecipe(data) {
  const recipe = normalizeRecipe(await apiRequest('/recipes', {
    method: 'POST',
    body: JSON.stringify(data)
  }));

  const current = getRecipes().filter(item => String(item.id) !== String(recipe.id));
  cacheRecipes([recipe, ...current]);
  return recipe;
}

export async function updateRecipe(id, data) {
  const recipe = normalizeRecipe(await apiRequest(`/recipes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }));

  cacheRecipes(getRecipes().map(item => String(item.id) === String(id) ? recipe : item));
  return recipe;
}

export async function deleteRecipe(id) {
  await apiRequest(`/recipes/${id}`, { method: 'DELETE' });
  cacheRecipes(getRecipes().filter(item => String(item.id) !== String(id)));
}

// Compatibilidad temporal con código que todavía guarda la caché local.
export function saveRecipes(recipes) {
  cacheRecipes(recipes);
}
