import { DEFAULT_RECIPES } from '../data/defaultRecipes';
import { readStorage, writeStorage } from './storageService';

const RECIPES_KEY = 'calendar_recetas';

// Completa campos antiguos por si una receta se guardó con una versión anterior.
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
    ...recipe
  };
}

export function getDefaultRecipes() {
  return DEFAULT_RECIPES.map(recipe => ({
    ...recipe,
    ingredientes: [...recipe.ingredientes],
    pasos: [...recipe.pasos]
  }));
}

// Devuelve las recetas del usuario. Si todavía no tiene, crea las iniciales una vez.
export function getRecipes() {
  const stored = readStorage(RECIPES_KEY, null);
  if (Array.isArray(stored)) return stored.map(normalizeRecipe);

  const defaults = getDefaultRecipes();
  writeStorage(RECIPES_KEY, defaults);
  return defaults;
}

export function saveRecipes(recipes) {
  writeStorage(RECIPES_KEY, recipes.map(normalizeRecipe));
}
