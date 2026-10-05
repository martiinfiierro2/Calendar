import { Receta } from '../models/index.js';

export async function listRecipes(req, res, next) {
  try {
    const recetas = await Receta.findAll({ where: { cuentaId: req.user.cuentaId }, order: [['creadoEn', 'DESC']] });
    res.json(recetas);
  } catch (error) { next(error); }
}

export async function createRecipe(req, res, next) {
  try {
    const receta = await Receta.create({ ...req.body, cuentaId: req.user.cuentaId });
    res.status(201).json(receta);
  } catch (error) { next(error); }
}

export async function updateRecipe(req, res, next) {
  try {
    const receta = await Receta.findOne({ where: { id: req.params.id, cuentaId: req.user.cuentaId } });
    if (!receta) return res.status(404).json({ message: 'Receta no encontrada.' });

    const datos = { ...req.body };
    delete datos.cuentaId;
    await receta.update(datos);
    res.json(receta);
  } catch (error) { next(error); }
}

export async function deleteRecipe(req, res, next) {
  try {
    const eliminadas = await Receta.destroy({ where: { id: req.params.id, cuentaId: req.user.cuentaId } });
    if (!eliminadas) return res.status(404).json({ message: 'Receta no encontrada.' });
    res.status(204).end();
  } catch (error) { next(error); }
}
