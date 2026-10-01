import test from 'node:test';
import assert from 'node:assert/strict';

import {
  categoriaIngrediente,
  normalizarIngrediente
} from '../../src/utils/ingredientUtils.js';

test('categoriaIngrediente clasifica categorías principales', () => {
  assert.equal(categoriaIngrediente('Tomate cherry'), 'Fruta y verdura');
  assert.equal(categoriaIngrediente('Calabacín'), 'Fruta y verdura');
  assert.equal(categoriaIngrediente('Pechuga de pollo'), 'Carne y pescado');
  assert.equal(categoriaIngrediente('Salmón'), 'Carne y pescado');
  assert.equal(categoriaIngrediente('Leche entera'), 'Lácteos');
  assert.equal(categoriaIngrediente('Pan integral'), 'Panadería');
  assert.equal(categoriaIngrediente('Pimentón dulce'), 'Despensa');
});

test('categoriaIngrediente devuelve Otros cuando no reconoce el alimento', () => {
  assert.equal(categoriaIngrediente('Chocolate negro'), 'Otros');
});

test('normalizarIngrediente elimina espacios sobrantes, mayúsculas y tildes', () => {
  assert.equal(normalizarIngrediente('  LIMÓN   Verde  '), 'limon verde');
});
