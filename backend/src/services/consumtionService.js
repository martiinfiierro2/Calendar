import { Comida, Receta } from '../models/index.js';
import {
  sequelize,
  Comida,
  Receta,
  ProductoCompra
} from '../models/index.js';

function obtenerFechaHoraMadrid() {
  const ahora = new Date();

  const partes = new Intl.DateTimeFormat('es-ES', {
    timeZone: 'Europe/Madrid',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).formatToParts(ahora);

  const valores = Object.fromEntries(
    partes
      .filter(parte => parte.type !== 'literal')
      .map(parte => [parte.type, parte.value])
  );

  return {
    fecha: `${valores.year}-${valores.month}-${valores.day}`,
    hora: `${valores.hour}:${valores.minute}:${valores.second}`
  };
}

export async function obtenerComidasPendientes(usuarioId) {
  const { fecha, hora } = obtenerFechaHoraMadrid();

  const comidas = await Comida.findAll({
    where: {
      usuarioId,
      procesada: false
    },
    include: [
      {
        model: Receta,
        required: false
      }
    ],
    order: [
      ['fecha', 'ASC'],
      ['hora', 'ASC']
    ]
  });

  return comidas.filter(comida => {
    if (comida.fecha < fecha) {
      return true;
    }

    if (comida.fecha === fecha && comida.hora <= hora) {
      return true;
    }

    return false;
  });
}

function normalizarNombre(nombre = '') {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function normalizarUnidad(unidad = 'ud') {
  const valor = unidad.toLowerCase().trim();

  const equivalencias = {
    uds: 'ud',
    unidad: 'ud',
    unidades: 'ud',
    gramos: 'g',
    gramo: 'g',
    kilogramos: 'kg',
    kilogramo: 'kg',
    litros: 'l',
    litro: 'l',
    mililitros: 'ml',
    mililitro: 'ml'
  };

  return equivalencias[valor] || valor;
}

function tipoUnidad(unidad) {
  const normalizada = normalizarUnidad(unidad);

  if (['g', 'kg'].includes(normalizada)) {
    return 'peso';
  }

  if (['ml', 'l'].includes(normalizada)) {
    return 'volumen';
  }

  if (normalizada === 'ud') {
    return 'unidad';
  }

  return normalizada;
}

function convertirABase(cantidad, unidad) {
  const numero = Number(cantidad);
  const normalizada = normalizarUnidad(unidad);

  switch (normalizada) {
    case 'kg':
      return numero * 1000;

    case 'l':
      return numero * 1000;

    default:
      return numero;
  }
}

function convertirDesdeBase(cantidad, unidad) {
  const normalizada = normalizarUnidad(unidad);

  switch (normalizada) {
    case 'kg':
      return cantidad / 1000;

    case 'l':
      return cantidad / 1000;

    default:
      return cantidad;
  }
}

async function consumirIngrediente(
  ingrediente,
  usuarioId,
  transaction
) {
  if (!ingrediente?.nombre) {
    return;
  }

  let cantidadPendiente = convertirABase(
    ingrediente.cantidad,
    ingrediente.unidad
  );

  if (!Number.isFinite(cantidadPendiente) || cantidadPendiente <= 0) {
    return;
  }

  const productos = await ProductoCompra.findAll({
    where: {
      usuarioId,
      estado: 'comprado'
    },
    order: [['creadoEn', 'ASC']],
    transaction,
    lock: transaction.LOCK.UPDATE
  });

  const nombreIngrediente = normalizarNombre(ingrediente.nombre);
  const tipoIngrediente = tipoUnidad(ingrediente.unidad);

  const compatibles = productos.filter(producto => {
    return (
      normalizarNombre(producto.nombre) === nombreIngrediente &&
      tipoUnidad(producto.unidad) === tipoIngrediente
    );
  });

  for (const producto of compatibles) {
    if (cantidadPendiente <= 0) {
      break;
    }

    const disponible = convertirABase(
      producto.cantidad,
      producto.unidad
    );

    if (!Number.isFinite(disponible) || disponible <= 0) {
      continue;
    }

    const consumido = Math.min(
      disponible,
      cantidadPendiente
    );

    const restanteBase = disponible - consumido;

    cantidadPendiente -= consumido;

    if (restanteBase <= 0) {
      await producto.update(
        {
          cantidad: 0,
          estado: 'usado'
        },
        { transaction }
      );
    } else {
      const restante = convertirDesdeBase(
        restanteBase,
        producto.unidad
      );

      await producto.update(
        {
          cantidad: restante
        },
        { transaction }
      );
    }
  }
}

async function procesarComida(comidaPendiente) {
  return sequelize.transaction(async transaction => {
    const comida = await Comida.findOne({
      where: {
        id: comidaPendiente.id,
        usuarioId: comidaPendiente.usuarioId
      },
      include: [
        {
          model: Receta,
          required: false
        }
      ],
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!comida || comida.procesada) {
      return;
    }

    if (
      comida.modo === 'receta' &&
      comida.Receta &&
      Array.isArray(comida.Receta.ingredientes)
    ) {
      for (const ingrediente of comida.Receta.ingredientes) {
        await consumirIngrediente(
          ingrediente,
          comida.usuarioId,
          transaction
        );
      }
    }

    await comida.update(
      {
        procesada: true
      },
      { transaction }
    );
  });
}

export async function procesarComidasPendientes(usuarioId) {
  const pendientes = await obtenerComidasPendientes(usuarioId);

  for (const comida of pendientes) {
    await procesarComida(comida);
  }

  return pendientes.length;
}