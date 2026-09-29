import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ingredientToText,
  normalizeUnit,
  parseIngredientLine,
  UNIT_OPTIONS
} from '../../src/utils/unitUtils.js';

test('normalizeUnit normaliza aliases habituales', () => {
  assert.equal(normalizeUnit('gramos'), 'g');
  assert.equal(normalizeUnit('GR.'), 'g');
  assert.equal(normalizeUnit('kilos'), 'kg');
  assert.equal(normalizeUnit('litros'), 'L');
  assert.equal(normalizeUnit('uds'), 'ud');
});

test('normalizeUnit usa ud para unidades desconocidas', () => {
  assert.equal(normalizeUnit('cucharadas'), 'ud');
  assert.equal(normalizeUnit(''), 'ud');
});

test('parseIngredientLine interpreta cantidad, unidad y nombre', () => {
  assert.deepEqual(parseIngredientLine('500 g de pollo'), {
    nombre: 'pollo',
    cantidad: 500,
    unidad: 'g'
  });

  assert.deepEqual(parseIngredientLine('1,5 litros leche'), {
    nombre: 'leche',
    cantidad: 1.5,
    unidad: 'L'
  });
});

test('parseIngredientLine usa una unidad cuando no hay cantidad explícita', () => {
  assert.deepEqual(parseIngredientLine('Tomate triturado'), {
    nombre: 'Tomate triturado',
    cantidad: 1,
    unidad: 'ud'
  });
});

test('parseIngredientLine devuelve null para texto vacío', () => {
  assert.equal(parseIngredientLine('   '), null);
});

test('ingredientToText serializa ingredientes normalizados', () => {
  assert.equal(
    ingredientToText({ nombre: 'Leche', cantidad: 2, unidad: 'litros' }),
    '2 L de Leche'
  );
  assert.equal(ingredientToText('2 huevos'), '2 huevos');
  assert.equal(ingredientToText(null), '');
});

test('UNIT_OPTIONS contiene las unidades soportadas por los formularios', () => {
  assert.deepEqual(
    UNIT_OPTIONS.map(option => option.value),
    ['ud', 'g', 'kg', 'ml', 'L']
  );
});
