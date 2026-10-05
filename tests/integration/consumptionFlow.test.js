import test, { afterEach, before } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgres://calendar:calendar@localhost:5432/calendar_test';

let sequelize;
let Comida;
let Consumo;
let Receta;
let ProductoCompra;
let procesarComidasPendientes;
let originals;

before(async () => {
  ({ sequelize, Comida, Consumo, Receta, ProductoCompra } = await import('../../backend/src/models/index.js'));
  ({ procesarComidasPendientes } = await import('../../backend/src/services/consumptionService.js'));

  originals = {
    transaction: sequelize.transaction,
    comidaFindAll: Comida.findAll,
    comidaFindOne: Comida.findOne,
    consumoCreate: Consumo.create,
    recetaFindOne: Receta.findOne,
    productoFindAll: ProductoCompra.findAll
  };
});

afterEach(() => {
  sequelize.transaction = originals.transaction;
  Comida.findAll = originals.comidaFindAll;
  Comida.findOne = originals.comidaFindOne;
  Consumo.create = originals.consumoCreate;
  Receta.findOne = originals.recetaFindOne;
  ProductoCompra.findAll = originals.productoFindAll;
});

function fakeTransaction() {
  const transaction = { LOCK: { UPDATE: 'UPDATE' } };
  sequelize.transaction = async callback => callback(transaction);
  return transaction;
}

function comidaPendiente({ id = 1, cuentaId = 1, recetaId = 10 } = {}) {
  return {
    id,
    cuentaId,
    recetaId,
    nombre: 'Comida de prueba',
    modo: 'receta',
    fecha: '2000-01-01',
    hora: '08:00:00',
    procesada: false
  };
}

test('una comida pasada descuenta parcialmente el stock compartido y registra solo lo consumido', async () => {
  fakeTransaction();
  const pendiente = comidaPendiente();
  const comidaActualizaciones = [];
  const productoActualizaciones = [];
  const consumos = [];

  Comida.findAll = async () => [pendiente];
  Comida.findOne = async () => ({ ...pendiente, update: async values => comidaActualizaciones.push(values) });
  Receta.findOne = async () => ({ ingredientes: [{ nombre: 'Arroz', cantidad: 300, unidad: 'g' }] });
  ProductoCompra.findAll = async () => [{
    nombre: 'arroz', cantidad: 1, unidad: 'kg', estado: 'comprado',
    update: async values => productoActualizaciones.push(values)
  }];
  Consumo.create = async values => { consumos.push(values); return values; };

  const procesadas = await procesarComidasPendientes(1);

  assert.equal(procesadas, 1);
  assert.deepEqual(productoActualizaciones, [{ cantidad: 0.7 }]);
  assert.equal(consumos.length, 1);
  assert.equal(consumos[0].cantidad, 0.3);
  assert.equal(consumos[0].unidad, 'kg');
  assert.equal(consumos[0].cuentaId, 1);
  assert.deepEqual(comidaActualizaciones, [{ procesada: true }]);
});

test('si una comida agota un producto, registra la cantidad consumida y lo marca como usado', async () => {
  fakeTransaction();
  const pendiente = comidaPendiente({ id: 2 });
  const comidaActualizaciones = [];
  const productoActualizaciones = [];
  const consumos = [];

  Comida.findAll = async () => [pendiente];
  Comida.findOne = async () => ({ ...pendiente, update: async values => comidaActualizaciones.push(values) });
  Receta.findOne = async () => ({ ingredientes: [{ nombre: 'Leche', cantidad: 500, unidad: 'ml' }] });
  ProductoCompra.findAll = async () => [{
    nombre: 'Leche', cantidad: 0.5, unidad: 'L', estado: 'comprado',
    update: async values => productoActualizaciones.push(values)
  }];
  Consumo.create = async values => { consumos.push(values); return values; };

  const procesadas = await procesarComidasPendientes(1);

  assert.equal(procesadas, 1);
  assert.deepEqual(productoActualizaciones, [{ cantidad: 0, estado: 'usado' }]);
  assert.equal(consumos.length, 1);
  assert.equal(consumos[0].cantidad, 0.5);
  assert.equal(consumos[0].unidad, 'L');
  assert.deepEqual(comidaActualizaciones, [{ procesada: true }]);
});

test('una comida futura no consume stock ni se marca como procesada', async () => {
  fakeTransaction();
  let findOneCalled = false;
  let productQueryCalled = false;

  Comida.findAll = async () => [{ ...comidaPendiente({ id: 3 }), fecha: '2999-01-01' }];
  Comida.findOne = async () => { findOneCalled = true; return null; };
  ProductoCompra.findAll = async () => { productQueryCalled = true; return []; };

  const procesadas = await procesarComidasPendientes(1);

  assert.equal(procesadas, 0);
  assert.equal(findOneCalled, false);
  assert.equal(productQueryCalled, false);
});
