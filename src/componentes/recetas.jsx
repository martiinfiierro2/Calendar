// Entrada de compatibilidad: la pantalla y los datos ya viven en módulos separados.
export { default } from '../features/recipes/RecipesPage';
export { DEFAULT_RECIPES as recetasData } from '../data/defaultRecipes';
export { getRecipes as obtenerRecetasGuardadas } from '../services/recipeService';
