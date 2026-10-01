import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeUnit } from '../../src/utils/unitUtils.js';
import {
  categoriaIngrediente as categoriaIngredienteBackend,
  normalizarNombre,
  normalizarUnidad
} from '../../backend/src/utils/stockUtils.js';
import {
  categoriaIngrediente as categoriaIngredienteFrontend,
  normalizarIngrediente
} from '../../src/utils/ingredientUtils.js';

const aliasesCompartidos = [
  'ud', 'uds', 'unidad', 'unidades',
  'g', 'gr', 'gramos',
  'kg', 'kilos', 'kilogramos',
  'ml', 'mililitros',
  'l', 'lt', 'litros',
  'cucharadas'
];

test('frontend y backend normalizan igual las unidades conocidas y desconocidas', () => {
  for (const unidad of aliasesCompartidos) {
    assert.equal(
      normalizeUnit(unidad),
      normalizarUnidad(unidad),
      `Normalización distinta para: ${unidad}`
    );
  }
});

test('frontend y backend normalizan igual los nombres', () => {
  const casos = [
    '  LIMÓN  ',
    'Pimentón dulce',
    '  Leche   Entera  ',
    'CALABACÍN'
  ];

  for (const nombre of casos) {
    assert.equal(
      normalizarIngrediente(nombre),
      normalizarNombre(nombre),
      `Normalización de nombre distinta para: ${nombre}`
    );
  }
});

test('frontend y backend categorizan igual ingredientes representativos', () => {
  const ingredientes = [
    'Tomate cherry',
    'Calabacín',
    'Salmón',
    'Leche entera',
    'Pan integral',
    'Pimentón dulce',
    'Chocolate negro'
  ];

  for (const ingrediente of ingredientes) {
    assert.equal(
      categoriaIngredienteFrontend(ingrediente),
      categoriaIngredienteBackend(ingrediente),
      `Categoría distinta para: ${ingrediente}`
    );
  }
});
