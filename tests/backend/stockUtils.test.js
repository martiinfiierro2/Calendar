import test from 'node:test';
import assert from 'node:assert/strict';

import {
  calcularCantidadDisponible,
  calcularFaltante,
  calcularFaltanteTotal,
  categoriaIngrediente,
  convertirABase,
  convertirDesdeBase,
  normalizarNombre,
  normalizarUnidad,
  obtenerUnidadBase,
  sonCompatibles,
  tipoUnidad
} from '../../backend/src/utils/stockUtils.js';

test('normalizarNombre ignora mayúsculas, tildes y espacios repetidos', () => {
  assert.equal(normalizarNombre('  LIMÓN   VERDE  '), 'limon verde');
});

test('normalizarUnidad normaliza aliases y usa ud para unidades desconocidas', () => {
  assert.equal(normalizarUnidad('gramos'), 'g');
  assert.equal(normalizarUnidad('Litros'), 'L');
  assert.equal(normalizarUnidad('cucharadas'), 'ud');
});

test('tipoUnidad agrupa peso, volumen y unidades', () => {
  assert.equal(tipoUnidad('kg'), 'peso');
  assert.equal(tipoUnidad('ml'), 'volumen');
  assert.equal(tipoUnidad('uds'), 'unidad');
  assert.equal(tipoUnidad('cucharadas'), 'unidad');
});

test('categoriaIngrediente reconoce categorías con y sin tildes', () => {
  assert.equal(categoriaIngrediente('Calabacín'), 'Fruta y verdura');
  assert.equal(categoriaIngrediente('Salmón'), 'Carne y pescado');
  assert.equal(categoriaIngrediente('Pimentón dulce'), 'Despensa');
});

test('convertirABase y convertirDesdeBase convierten kg/g y L/ml', () => {
  assert.equal(convertirABase(1.5, 'kg'), 1500);
  assert.equal(convertirABase(2, 'L'), 2000);
  assert.equal(convertirDesdeBase(1500, 'kg'), 1.5);
  assert.equal(convertirDesdeBase(2000, 'L'), 2);
});

test('convertirABase devuelve 0 para cantidades no numéricas', () => {
  assert.equal(convertirABase('abc', 'kg'), 0);
});

test('sonCompatibles compara nombre normalizado y tipo de unidad', () => {
  assert.equal(
    sonCompatibles(
      { nombre: 'Limón', unidad: 'kg' },
      { nombre: 'limon', unidad: 'g' }
    ),
    true
  );

  assert.equal(
    sonCompatibles(
      { nombre: 'Leche', unidad: 'L' },
      { nombre: 'Leche', unidad: 'ud' }
    ),
    false
  );
});

test('calcularCantidadDisponible suma productos compatibles en unidad base', () => {
  const ingrediente = { nombre: 'Arroz', cantidad: 1, unidad: 'kg' };
  const productos = [
    { nombre: 'arroz', cantidad: 300, unidad: 'g' },
    { nombre: 'Arroz', cantidad: 0.5, unidad: 'kg' },
    { nombre: 'Pasta', cantidad: 500, unidad: 'g' }
  ];

  assert.equal(calcularCantidadDisponible(ingrediente, productos), 800);
});

test('calcularFaltante nunca devuelve valores negativos', () => {
  const ingrediente = { nombre: 'Leche', cantidad: 1, unidad: 'L' };
  const productos = [
    { nombre: 'Leche', cantidad: 1500, unidad: 'ml' }
  ];

  assert.equal(calcularFaltante(ingrediente, productos), 0);
});

test('calcularFaltanteTotal cuenta nevera y elementos ya apuntados en compra', () => {
  const ingrediente = { nombre: 'Pollo', cantidad: 1000, unidad: 'g' };
  const productos = [
    { nombre: 'pollo', cantidad: 250, unidad: 'g', estado: 'comprado' },
    { nombre: 'Pollo', cantidad: 300, unidad: 'g', estado: 'apuntado' },
    { nombre: 'Pollo', cantidad: 100, unidad: 'g', estado: 'apuntadoChecked' },
    { nombre: 'Pollo', cantidad: 500, unidad: 'g', estado: 'usado' }
  ];

  assert.equal(calcularFaltanteTotal(ingrediente, productos), 350);
});

test('obtenerUnidadBase devuelve la unidad base esperada', () => {
  assert.equal(obtenerUnidadBase('kg'), 'g');
  assert.equal(obtenerUnidadBase('L'), 'ml');
  assert.equal(obtenerUnidadBase('ud'), 'ud');
});
