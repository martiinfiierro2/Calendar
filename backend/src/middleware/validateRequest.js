import { validationResult } from 'express-validator';

// Devuelve todos los errores de validación con el mismo formato.
export function validateRequest(req, res, next) {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  return res.status(400).json({
    message: 'Datos no válidos.',
    errors: errors.array().map(error => ({ field: error.path, message: error.msg }))
  });
}
