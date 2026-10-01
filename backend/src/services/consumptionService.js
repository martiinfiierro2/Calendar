import {
  sequelize,
  Comida,
  Receta,
  ProductoCompra
} from '../models/index.js';
import {
  convertirABase,
  convertirDesdeBase,
  normalizarIngrediente,
  normalizarNombre,
  tipoUnidad
} from '../utils/stockUtils.js';

function obtenerFechaHoraMadrid() {
  const ahora = new Date();
  const partes = new Intl.DateTimeFormat('es-ES', {
    timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  }).formatToParts(ahora);
  const valores = Object.fromEntries(partes.filter(parte => parte.type !== 'literal').map(parte => [parte.type, parte.value]));
  return {
    fecha: `${valores.year}-${valores.month}-${valores.day}`,
    hora: `${valores.hour}:${valores.minute}:${valores.second}`
  };
}

export async function obtenerComidasPendientes(usuarioId) {
  const { fecha, hora } = obtenerFechaHoraMadrid();
  const comidas = await Comida.findAll({
    where: { usuarioId, procesada: false },
    include: [{ model: Receta, required: false }],
    order: [['fecha', 'ASC'], ['hora', 'ASC']]
  });

  return comidas.filter(comida => comida.fecha < fecha || (comida.fecha === fecha && comida.hora <= hora));
}

async function consumirIngrediente(valorIngrediente, usuarioId, transaction) {
  const ingrediente = normalizarIngrediente(valorIngrediente);
  if (!ingrediente?.nombre) return;

  let cantidadPendiente = convertirABase(ingrediente.cantidad, ingrediente.unidad);
  if (!Number.isFinite(cantidadPendiente) || cantidadPendiente <= 0) return;

  const productos = await ProductoCompra.findAll({
    where: { usuarioId, estado: 'comprado' },
    order: [['creadoEn', 'ASC']],
    transaction,
    lock: transaction.LOCK.UPDATE
  });

  const nombreIngrediente = normalizarNombre(ingrediente.nombre);
  const tipoIngrediente = tipoUnidad(ingrediente.unidad);
  const compatibles = productos.filter(producto =>
    normalizarNombre(producto.nombre) === nombreIngrediente && tipoUnidad(producto.unidad) === tipoIngrediente
  );

  for (const producto of compatibles) {
    if (cantidadPendiente <= 0) break;

    const disponible = convertirABase(producto.cantidad, producto.unidad);
    if (!Number.isFinite(disponible) || disponible <= 0) continue;

    const consumido = Math.min(disponible, cantidadPendiente);
    const restanteBase = disponible - consumido;
    cantidadPendiente -= consumido;

    if (restanteBase <= 0) {
      await producto.update({ cantidad: 0, estado: 'usado' }, { transaction });
    } else {
      const restante = convertirDesdeBase(restanteBase, producto.unidad);
      await producto.update({ cantidad: restante }, { transaction });
    }
  }
}

async function procesarComida(comidaPendiente) {
  return sequelize.transaction(async transaction => {
    const comida = await Comida.findOne({
      where: { id: comidaPendiente.id, usuarioId: comidaPendiente.usuarioId },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!comida || comida.procesada) return;

    let ingredientes = [];
    if (comida.modo === 'receta' && comida.recetaId) {
      const receta = await Receta.findByPk(comida.recetaId, { transaction });
      ingredientes = Array.isArray(receta?.ingredientes) ? receta.ingredientes : [];
    } else if (comida.modo === 'rapida' && Array.isArray(comida.ingredientes)) {
      ingredientes = comida.ingredientes;
    }

    for (const ingrediente of ingredientes) {
      await consumirIngrediente(ingrediente, comida.usuarioId, transaction);
    }

    await comida.update({ procesada: true }, { transaction });
  });
}

export async function procesarComidasPendientes(usuarioId) {
  const pendientes = await obtenerComidasPendientes(usuarioId);
  for (const comida of pendientes) await procesarComida(comida);
  return pendientes.length;
}
