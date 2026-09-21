import { apiRequest } from './apiClient';

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

export async function getRecipes() {
  const recipes = await apiRequest('/recetas');
  return Array.isArray(recipes) ? recipes.map(normalizeRecipe) : [];
}

export async function createRecipe(data) {
  return normalizeRecipe(await apiRequest('/recetas', {
    method: 'POST',
    body: JSON.stringify(data)
  }));
}

export async function updateRecipe(id, data) {
  return normalizeRecipe(await apiRequest(`/recetas/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }));
}

export async function deleteRecipe(id) {
  await apiRequest(`/recetas/${id}`, { method: 'DELETE' });
}
