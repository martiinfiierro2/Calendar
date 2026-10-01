import test, { afterEach, before } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgres://calendar:calendar@localhost:5432/calendar_test';

let sequelize;
let Comida;
let Receta;
let ProductoCompra;
let procesarComidasPendientes;
let originals;

before(async () => {
  ({ sequelize, Comida, Receta, ProductoCompra } = await import('../../backend/src/models/index.js'));
  ({ procesarComidasPendientes } = await import('../../backend/src/services/consumptionService.js'));

  originals = {
    transaction: sequelize.transaction,
    comidaFindAll: Comida.findAll,
    comidaFindOne: Comida.findOne,
    recetaFindByPk: Receta.findByPk,
    productoFindAll: ProductoCompra.findAll
  };
});

afterEach(() => {
  sequelize.transaction = originals.transaction;
  Comida.findAll = originals.comidaFindAll;
  Comida.findOne = originals.comidaFindOne;
  Receta.findByPk = originals.recetaFindByPk;
  ProductoCompra.findAll = originals.productoFindAll;
});

function fakeTransaction() {
  const transaction = { LOCK: { UPDATE: 'UPDATE' } };
  sequelize.transaction = async callback => callback(transaction);
  return transaction;
}

function comidaPendiente({ id = 1, usuarioId = 1, recetaId = 10 } = {}) {
  return {
    id,
    usuarioId,
    recetaId,
    modo: 'receta',
    fecha: '2000-01-01',
    hora: '08:00:00',
    procesada: false
  };
}

test('una comida pasada descuenta parcialmente el stock y conserva el producto en nevera', async () => {
  fakeTransaction();

  const pendiente = comidaPendiente();
  const comidaActualizaciones = [];
  const productoActualizaciones = [];

  Comida.findAll = async () => [pendiente];
  Comida.findOne = async () => ({
    ...pendiente,
    update: async values => comidaActualizaciones.push(values)
  });

  Receta.findByPk = async () => ({
    ingredientes: [
      { nombre: 'Arroz', cantidad: 300, unidad: 'g' }
    ]
  });

  ProductoCompra.findAll = async () => [
    {
      nombre: 'arroz',
      cantidad: 1,
      unidad: 'kg',
      estado: 'comprado',
      update: async values => productoActualizaciones.push(values)
    }
  ];

  const procesadas = await procesarComidasPendientes(1);

  assert.equal(procesadas, 1);
  assert.deepEqual(productoActualizaciones, [{ cantidad: 0.7 }]);
  assert.deepEqual(comidaActualizaciones, [{ procesada: true }]);
});

test('si una comida agota un producto, su cantidad pasa a 0 y su estado a usado', async () => {
  fakeTransaction();

  const pendiente = comidaPendiente({ id: 2 });
  const comidaActualizaciones = [];
  const productoActualizaciones = [];

  Comida.findAll = async () => [pendiente];
  Comida.findOne = async () => ({
    ...pendiente,
    update: async values => comidaActualizaciones.push(values)
  });

  Receta.findByPk = async () => ({
    ingredientes: [
      { nombre: 'Leche', cantidad: 500, unidad: 'ml' }
    ]
  });

  ProductoCompra.findAll = async () => [
    {
      nombre: 'Leche',
      cantidad: 0.5,
      unidad: 'L',
      estado: 'comprado',
      update: async values => productoActualizaciones.push(values)
    }
  ];

  const procesadas = await procesarComidasPendientes(1);

  assert.equal(procesadas, 1);
  assert.deepEqual(productoActualizaciones, [{ cantidad: 0, estado: 'usado' }]);
  assert.deepEqual(comidaActualizaciones, [{ procesada: true }]);
});

test('una comida futura no consume stock ni se marca como procesada', async () => {
  fakeTransaction();

  let findOneCalled = false;
  let productQueryCalled = false;

  Comida.findAll = async () => [
    {
      ...comidaPendiente({ id: 3 }),
      fecha: '2999-01-01'
    }
  ];

  Comida.findOne = async () => {
    findOneCalled = true;
    return null;
  };

  ProductoCompra.findAll = async () => {
    productQueryCalled = true;
    return [];
  };

  const procesadas = await procesarComidasPendientes(1);

  assert.equal(procesadas, 0);
  assert.equal(findOneCalled, false);
  assert.equal(productQueryCalled, false);
});
