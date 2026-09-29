import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeUnit } from '../../src/utils/unitUtils.js';
import { normalizarUnidad } from '../../backend/src/utils/stockUtils.js';

const aliasesCompartidos = [
  'ud', 'uds', 'unidad', 'unidades',
  'g', 'gr', 'gramos',
  'kg', 'kilos', 'kilogramos',
  'ml', 'mililitros',
  'l', 'lt', 'litros'
];

test('frontend y backend normalizan igual todas las unidades soportadas', () => {
  for (const unidad of aliasesCompartidos) {
    assert.equal(
      normalizeUnit(unidad),
      normalizarUnidad(unidad),
      `Normalización distinta para: ${unidad}`
    );
  }
});

test('documenta la diferencia actual con unidades no soportadas', () => {
  assert.equal(normalizeUnit('cucharadas'), 'ud');
  assert.equal(normalizarUnidad('cucharadas'), 'cucharadas');
});
