import { Comida, ProductoCompra, Receta } from '../models/index.js';
import { procesarComidasPendientes } from '../services/consumptionService.js';
import { Op } from 'sequelize';
import {
  calcularFaltanteTotal,
  categoriaIngrediente,
  convertirABase,
  normalizarIngrediente,
  normalizarNombre,
  obtenerUnidadBase
} from '../utils/stockUtils.js';

function obtenerFechaMadrid() {
  const partes = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Madrid', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(new Date());
  const valores = Object.fromEntries(partes.filter(parte => parte.type !== 'literal').map(parte => [parte.type, parte.value]));
  return `${valores.year}-${valores.month}-${valores.day}`;
}

function sumarDias(fecha, dias) {
  const [year, month, day] = fecha.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + dias);
  return date.toISOString().slice(0, 10);
}

export async function listShopping(req, res, next) {
  try {
    await procesarComidasPendientes(req.user.id);
    const productos = await ProductoCompra.findAll({ where: { usuarioId: req.user.id }, order: [['estado', 'ASC'], ['creadoEn', 'DESC']] });
    res.json(productos);
  } catch (error) { next(error); }
}

export async function createShoppingItem(req, res, next) {
  try {
    const producto = await ProductoCompra.create({ ...req.body, estado: req.body.estado || 'apuntado', usuarioId: req.user.id });
    res.status(201).json(producto);
  } catch (error) { next(error); }
}

export async function updateShoppingItem(req, res, next) {
  try {
    const producto = await ProductoCompra.findOne({ where: { id: req.params.id, usuarioId: req.user.id } });
    if (!producto) return res.status(404).json({ message: 'Producto no encontrado.' });
    await producto.update(req.body);
    res.json(producto);
  } catch (error) { next(error); }
}

export async function deleteShoppingItem(req, res, next) {
  try {
    const eliminados = await ProductoCompra.destroy({ where: { id: req.params.id, usuarioId: req.user.id } });
    if (!eliminados) return res.status(404).json({ message: 'Producto no encontrado.' });
    res.status(204).end();
  } catch (error) { next(error); }
}

export async function generateFromCalendar(req, res, next) {
  try {
    const diasSolicitados = Number(req.query.dias ?? 7);
    const dias = Number.isInteger(diasSolicitados) && diasSolicitados >= 1 ? diasSolicitados : 7;
    const fechaInicio = obtenerFechaMadrid();
    const fechaFin = sumarDias(fechaInicio, dias - 1);

    const [comidas, recetas, existentes] = await Promise.all([
      Comida.findAll({ where: { usuarioId: req.user.id, fecha: { [Op.between]: [fechaInicio, fechaFin] } } }),
      Receta.findAll({ where: { usuarioId: req.user.id } }),
      ProductoCompra.findAll({ where: { usuarioId: req.user.id } })
    ]);

    const mapaRecetas = new Map(recetas.map(receta => [String(receta.id), receta]));
    const necesidades = new Map();

    comidas.forEach(comida => {
      let ingredientes = [];
      if (comida.modo === 'receta') {
        const receta = mapaRecetas.get(String(comida.recetaId));
        ingredientes = Array.isArray(receta?.ingredientes) ? receta.ingredientes : [];
      } else if (comida.modo === 'rapida' && Array.isArray(comida.ingredientes)) {
        ingredientes = comida.ingredientes;
      }

      ingredientes.forEach(valor => {
        const ingrediente = normalizarIngrediente(valor);
        if (!ingrediente?.nombre) return;
        const cantidadBase = convertirABase(ingrediente.cantidad, ingrediente.unidad);
        if (!Number.isFinite(cantidadBase) || cantidadBase <= 0) return;
        const unidadBase = obtenerUnidadBase(ingrediente.unidad);
        const clave = `${normalizarNombre(ingrediente.nombre)}-${unidadBase}`;
        const actual = necesidades.get(clave);
        if (actual) actual.cantidad += cantidadBase;
        else necesidades.set(clave, { nombre: ingrediente.nombre.trim(), cantidad: cantidadBase, unidad: unidadBase });
      });
    });

    const filas = [];
    for (const ingrediente of necesidades.values()) {
      const faltante = calcularFaltanteTotal(ingrediente, existentes);
      if (faltante <= 0) continue;
      filas.push({
        nombre: ingrediente.nombre,
        cantidad: faltante,
        unidad: ingrediente.unidad,
        categoria: categoriaIngrediente(ingrediente.nombre),
        estado: 'apuntado',
        automatico: true,
        usuarioId: req.user.id
      });
    }

    const creados = filas.length ? await ProductoCompra.bulkCreate(filas) : [];
    res.status(201).json(creados);
  } catch (error) { next(error); }
}
