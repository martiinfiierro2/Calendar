import { Comida, ProductoCompra, Receta } from '../models/index.js';
import { procesarComidasPendientes } from '../services/consumptionService.js';

function categoriaIngrediente(nombre = '') {
  const texto = nombre.toLowerCase();

  if (
    /(tomate|cebolla|zanahoria|pepino|pimiento|patata|lim[oó]n|verdura|fruta|ajo|lechuga)/.test(texto)
  ) {
    return 'Fruta y verdura';
  }

  if (
    /(pollo|carne|ternera|cerdo|jam[oó]n|salm[oó]n|pescado|at[uú]n|conejo)/.test(texto)
  ) {
    return 'Carne y pescado';
  }

  if (
    /(leche|queso|yogur|mantequilla|nata)/.test(texto)
  ) {
    return 'Lácteos';
  }

  if (
    /(pan|baguette|barra|tostada)/.test(texto)
  ) {
    return 'Panadería';
  }

  if (
    /(arroz|pasta|harina|lenteja|garbanzo|aceite|vinagre|sal|pimienta|curry|azafr[aá]n|piment[oó]n)/.test(texto)
  ) {
    return 'Despensa';
  }

  return 'Otros';
}

export async function listShopping(req, res, next) {
  try {
    // Antes de devolver la nevera/lista,
    // actualizamos el stock según las comidas ya pasadas.
    await procesarComidasPendientes(req.user.id);

    const productos = await ProductoCompra.findAll({
      where: {
        usuarioId: req.user.id
      },
      order: [
        ['estado', 'ASC'],
        ['creadoEn', 'DESC']
      ]
    });

    res.json(productos);
  } catch (error) {
    next(error);
  }
}


// POST /compra
export async function createShoppingItem(req, res, next) {
  try {
    const producto = await ProductoCompra.create({
      ...req.body,

      // Si el frontend no manda estado,
      // cualquier producto nuevo entra en la lista de compra.
      estado: req.body.estado || 'apuntado',

      usuarioId: req.user.id
    });

    res.status(201).json(producto);
  } catch (error) {
    next(error);
  }
}


// PUT /compra/:id
export async function updateShoppingItem(req, res, next) {
  try {
    const producto = await ProductoCompra.findOne({
      where: {
        id: req.params.id,
        usuarioId: req.user.id
      }
    });

    if (!producto) {
      return res.status(404).json({
        message: 'Producto no encontrado.'
      });
    }

    await producto.update(req.body);

    res.json(producto);
  } catch (error) {
    next(error);
  }
}


// DELETE /compra/:id
export async function deleteShoppingItem(req, res, next) {
  try {
    const eliminados = await ProductoCompra.destroy({
      where: {
        id: req.params.id,
        usuarioId: req.user.id
      }
    });

    if (!eliminados) {
      return res.status(404).json({
        message: 'Producto no encontrado.'
      });
    }

    res.status(204).end();
  } catch (error) {
    next(error);
  }
}


// POST /compra/desde-calendario
export async function generateFromCalendar(req, res, next) {
  try {
    const [comidas, recetas, existentes] = await Promise.all([
      Comida.findAll({
        where: {
          usuarioId: req.user.id
        }
      }),

      Receta.findAll({
        where: {
          usuarioId: req.user.id
        }
      }),

      ProductoCompra.findAll({
        where: {
          usuarioId: req.user.id
        }
      })
    ]);

    const mapaRecetas = new Map(
      recetas.map(receta => [
        String(receta.id),
        receta
      ])
    );

    const vistos = new Set(
      existentes
        .filter(producto => producto.estado !== 'usado')
        .map(producto =>
          producto.nombre.trim().toLowerCase()
        )
    );

    const filas = [];

    comidas.forEach(comida => {
      const receta =
        comida.modo === 'receta'
          ? mapaRecetas.get(String(comida.recetaId))
          : null;

      const ingredientes =
        comida.modo === 'receta'
          ? (receta?.ingredientes || [])
          : (
              Array.isArray(comida.ingredientes)
                ? comida.ingredientes
                : []
            );

      ingredientes.forEach(ingrediente => {
        const nombre = String(ingrediente).trim();

        if (!nombre) {
          return;
        }

        const clave = nombre.toLowerCase();

        if (vistos.has(clave)) {
          return;
        }

        vistos.add(clave);

        filas.push({
          nombre,
          cantidad: '1',
          categoria: categoriaIngrediente(nombre),

          // Los ingredientes generados desde calendario
          // aparecen primero en la lista de compra.
          estado: 'apuntado',

          automatico: true,
          usuarioId: req.user.id
        });
      });
    });

    const creados = filas.length
      ? await ProductoCompra.bulkCreate(filas)
      : [];

    res.status(201).json(creados);
  } catch (error) {
    next(error);
  }
}