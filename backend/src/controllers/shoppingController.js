import { Comida, ProductoCompra, Receta } from '../models/index.js';

function categoriaIngrediente(nombre = '') {
  const texto = nombre.toLowerCase();
  if (/(tomate|cebolla|zanahoria|pepino|pimiento|patata|lim[oó]n|verdura|fruta|ajo|lechuga)/.test(texto)) return 'Fruta y verdura';
  if (/(pollo|carne|ternera|cerdo|jam[oó]n|salm[oó]n|pescado|at[uú]n|conejo)/.test(texto)) return 'Carne y pescado';
  if (/(leche|queso|yogur|mantequilla|nata)/.test(texto)) return 'Lácteos';
  if (/(pan|baguette|barra|tostada)/.test(texto)) return 'Panadería';
  if (/(arroz|pasta|harina|lenteja|garbanzo|aceite|vinagre|sal|pimienta|curry|azafr[aá]n|piment[oó]n)/.test(texto)) return 'Despensa';
  return 'Otros';
}

export async function listShopping(req, res, next) {
  try {
    const productos = await ProductoCompra.findAll({ where: { usuarioId: req.user.id }, order: [['comprado', 'ASC'], ['creadoEn', 'DESC']] });
    res.json(productos);
  } catch (error) { next(error); }
}

export async function createShoppingItem(req, res, next) {
  try {
    const producto = await ProductoCompra.create({ ...req.body, usuarioId: req.user.id });
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
    const [comidas, recetas, existentes] = await Promise.all([
      Comida.findAll({ where: { usuarioId: req.user.id, modo: 'receta' } }),
      Receta.findAll({ where: { usuarioId: req.user.id } }),
      ProductoCompra.findAll({ where: { usuarioId: req.user.id } })
    ]);

    const mapaRecetas = new Map(recetas.map(receta => [String(receta.id), receta]));
    const vistos = new Set(existentes.map(producto => producto.nombre.trim().toLowerCase()));
    const filas = [];

    comidas.forEach(comida => {
      const receta = mapaRecetas.get(String(comida.recetaId));
      (receta?.ingredientes || []).forEach(ingrediente => {
        const nombre = String(ingrediente).trim();
        const clave = nombre.toLowerCase();
        if (!nombre || vistos.has(clave)) return;
        vistos.add(clave);
        filas.push({ nombre, cantidad: '1', categoria: categoriaIngrediente(nombre), comprado: false, automatico: true, usuarioId: req.user.id });
      });
    });

    const creados = filas.length ? await ProductoCompra.bulkCreate(filas) : [];
    res.status(201).json(creados);
  } catch (error) { next(error); }
}
