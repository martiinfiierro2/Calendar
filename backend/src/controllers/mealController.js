import { allowedData } from '../utils/allowedData.js';


import { Comida, Receta } from '../models/index.js';

const fields = ['fecha', 'hora', 'nombre', 'tipo', 'icono', 'modo', 'ingredientes', 'recetaId', 'recipeId'];

export async function listMeals(req, res, next) {
  try {
    const comidas = await Comida.findAll({
      where: { cuentaId: req.user.cuentaId },
      order: [['fecha', 'ASC'], ['hora', 'ASC']]
    });
    res.json(comidas);
  } catch (error) { next(error); }
}

export async function createMeal(req, res, next) {
  try {
    const datos = { ...allowedData(req.body, fields), cuentaId: req.user.cuentaId };
    if (datos.recipeId !== undefined) {
      datos.recetaId = datos.recipeId;
      delete datos.recipeId;
    }
    await validarReceta(datos, req.user.cuentaId);
    const comida = await Comida.create(datos);
    res.status(201).json(comida);
  } catch (error) { next(error); }
}

export async function updateMeal(req, res, next) {
  try {
    const comida = await Comida.findOne({ where: { id: req.params.id, cuentaId: req.user.cuentaId } });
    if (!comida) return res.status(404).json({ message: 'Comida no encontrada.' });

    const datos = allowedData(req.body, fields);
    if (datos.recipeId !== undefined) {
      datos.recetaId = datos.recipeId;
      delete datos.recipeId;
    }
    await validarReceta(datos, req.user.cuentaId);
    await comida.update(datos);
    res.json(comida);
  } catch (error) { next(error); }
}

export async function deleteMeal(req, res, next) {
  try {
    const eliminadas = await Comida.destroy({ where: { id: req.params.id, cuentaId: req.user.cuentaId } });
    if (!eliminadas) return res.status(404).json({ message: 'Comida no encontrada.' });
    res.status(204).end();
  } catch (error) { next(error); }
}

async function validarReceta(datos, cuentaId) {
  if (datos.modo === 'rapida') {
    datos.recetaId = null;
    return;
  }
  if (!Number.isInteger(Number(datos.recetaId)) || Number(datos.recetaId) <= 0) {
    const error = new Error('Selecciona una receta de esta cuenta.');
    error.status = 400;
    throw error;
  }
  const receta = await Receta.findOne({ where: { id: datos.recetaId, cuentaId } });
  if (!receta) {
    const error = new Error('Receta no encontrada en esta cuenta.');
    error.status = 404;
    throw error;
  }
}
