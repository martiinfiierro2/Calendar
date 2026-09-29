import test from 'node:test';
import assert from 'node:assert/strict';

import {
  categoriaIngrediente,
  normalizarIngrediente
} from '../../src/utils/ingredientUtils.js';

test('categoriaIngrediente clasifica categorías principales', () => {
  assert.equal(categoriaIngrediente('Tomate cherry'), 'Fruta y verdura');
  assert.equal(categoriaIngrediente('Pechuga de pollo'), 'Carne y pescado');
  assert.equal(categoriaIngrediente('Leche entera'), 'Lácteos');
  assert.equal(categoriaIngrediente('Pan integral'), 'Panadería');
  assert.equal(categoriaIngrediente('Arroz basmati'), 'Despensa');
});

test('categoriaIngrediente devuelve Otros cuando no reconoce el alimento', () => {
  assert.equal(categoriaIngrediente('Chocolate negro'), 'Otros');
});

test('normalizarIngrediente elimina espacios sobrantes y normaliza mayúsculas', () => {
  assert.equal(normalizarIngrediente('  Leche   Entera  '), 'leche entera');
});

test('normalizarIngrediente conserva tildes actualmente', () => {
  assert.equal(normalizarIngrediente('Limón'), 'limón');
});
