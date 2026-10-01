import test, { after, afterEach, before } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgres://calendar:calendar@localhost:5432/calendar_test';
process.env.JWT_SECRET = 'calendar-test-secret';
process.env.JWT_EXPIRES_IN = '1h';

let app;
let server;
let baseUrl;
let Usuario;
let ProductoCompra;
let Comida;
let Receta;
let createToken;
let originals;

before(async () => {
  ({ default: app } = await import('../../backend/src/app.js'));
  ({ Usuario, ProductoCompra, Comida, Receta } = await import('../../backend/src/models/index.js'));
  ({ createToken } = await import('../../backend/src/utils/token.js'));

  originals = {
    usuarioFindByPk: Usuario.findByPk,
    productoCreate: ProductoCompra.create,
    productoFindOne: ProductoCompra.findOne,
    productoDestroy: ProductoCompra.destroy,
    productoFindAll: ProductoCompra.findAll,
    productoBulkCreate: ProductoCompra.bulkCreate,
    comidaFindAll: Comida.findAll,
    recetaFindAll: Receta.findAll
  };

  server = app.listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));

  const address = server.address();
  baseUrl = `http://127.0.0.1:${address.port}`;
});

afterEach(() => {
  Usuario.findByPk = originals.usuarioFindByPk;
  ProductoCompra.create = originals.productoCreate;
  ProductoCompra.findOne = originals.productoFindOne;
  ProductoCompra.destroy = originals.productoDestroy;
  ProductoCompra.findAll = originals.productoFindAll;
  ProductoCompra.bulkCreate = originals.productoBulkCreate;
  Comida.findAll = originals.comidaFindAll;
  Receta.findAll = originals.recetaFindAll;
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close(error => error ? reject(error) : resolve());
    });
  }
});

function autenticarComo(id = 1) {
  Usuario.findByPk = async userId => {
    if (Number(userId) !== Number(id)) return null;
    return { id, nombre: `Usuario ${id}`, email: `u${id}@test.local` };
  };

  return createToken(id);
}

async function api(path, { token, method = 'GET', body } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  const data = await response.json().catch(() => null);
  return { response, data };
}

test('POST /api/compra exige autenticación', async () => {
  const { response, data } = await api('/api/compra', {
    method: 'POST',
    body: {
      nombre: 'Leche',
      cantidad: 1,
      unidad: 'L',
      categoria: 'Lácteos'
    }
  });

  assert.equal(response.status, 401);
  assert.equal(data.message, 'Token requerido.');
});

test('POST /api/compra rechaza cantidad 0 antes de llegar al controller', async () => {
  const token = autenticarComo(1);
  let createCalled = false;
  ProductoCompra.create = async () => {
    createCalled = true;
  };

  const { response, data } = await api('/api/compra', {
    token,
    method: 'POST',
    body: {
      nombre: 'Leche',
      cantidad: 0,
      unidad: 'L',
      categoria: 'Lácteos'
    }
  });

  assert.equal(response.status, 400);
  assert.equal(data.message, 'Datos no válidos.');
  assert.equal(createCalled, false);
  assert.ok(data.errors.some(error => error.field === 'cantidad'));
});

test('POST /api/compra crea el producto para el usuario autenticado', async () => {
  const token = autenticarComo(7);
  let received;

  ProductoCompra.create = async payload => {
    received = payload;
    return { id: 99, ...payload };
  };

  const { response, data } = await api('/api/compra', {
    token,
    method: 'POST',
    body: {
      nombre: 'Arroz',
      cantidad: 500,
      unidad: 'g',
      categoria: 'Despensa'
    }
  });

  assert.equal(response.status, 201);
  assert.equal(received.usuarioId, 7);
  assert.equal(received.estado, 'apuntado');
  assert.equal(data.nombre, 'Arroz');
});

test('PUT /api/compra/:id no permite editar un producto de otro usuario', async () => {
  const token = autenticarComo(3);
  let whereReceived;

  ProductoCompra.findOne = async options => {
    whereReceived = options.where;
    return null;
  };

  const { response, data } = await api('/api/compra/22', {
    token,
    method: 'PUT',
    body: {
      nombre: 'Pasta',
      cantidad: 1,
      unidad: 'kg',
      categoria: 'Despensa',
      estado: 'comprado'
    }
  });

  assert.equal(response.status, 404);
  assert.deepEqual(whereReceived, { id: '22', usuarioId: 3 });
  assert.equal(data.message, 'Producto no encontrado.');
});

test('DELETE /api/compra/:id limita el borrado al usuario autenticado', async () => {
  const token = autenticarComo(4);
  let whereReceived;

  ProductoCompra.destroy = async options => {
    whereReceived = options.where;
    return 0;
  };

  const { response, data } = await api('/api/compra/15', {
    token,
    method: 'DELETE'
  });

  assert.equal(response.status, 404);
  assert.deepEqual(whereReceived, { id: '15', usuarioId: 4 });
  assert.equal(data.message, 'Producto no encontrado.');
});

test('POST /api/compra/desde-calendario resta nevera y lista antes de crear faltantes', async () => {
  const token = autenticarComo(5);

  Comida.findAll = async () => [
    {
      modo: 'receta',
      recetaId: 10
    }
  ];

  Receta.findAll = async () => [
    {
      id: 10,
      ingredientes: [
        { nombre: 'Arroz', cantidad: 1, unidad: 'kg' },
        { nombre: 'Leche', cantidad: 1, unidad: 'L' }
      ]
    }
  ];

  ProductoCompra.findAll = async () => [
    { nombre: 'arroz', cantidad: 250, unidad: 'g', estado: 'comprado' },
    { nombre: 'Arroz', cantidad: 250, unidad: 'g', estado: 'apuntado' },
    { nombre: 'Leche', cantidad: 1000, unidad: 'ml', estado: 'comprado' }
  ];

  let rowsCreated;
  ProductoCompra.bulkCreate = async rows => {
    rowsCreated = rows;
    return rows.map((row, index) => ({ id: index + 1, ...row }));
  };

  const { response, data } = await api('/api/compra/desde-calendario?dias=7', {
    token,
    method: 'POST'
  });

  assert.equal(response.status, 201);
  assert.equal(rowsCreated.length, 1);
  assert.equal(rowsCreated[0].nombre, 'Arroz');
  assert.equal(rowsCreated[0].cantidad, 500);
  assert.equal(rowsCreated[0].unidad, 'g');
  assert.equal(rowsCreated[0].estado, 'apuntado');
  assert.equal(rowsCreated[0].automatico, true);
  assert.equal(rowsCreated[0].usuarioId, 5);
  assert.equal(data.length, 1);
});
