import crypto from 'crypto';
import { Op } from 'sequelize';
import {
  Cuenta,
  InvitacionCuenta,
  Usuario,
  Receta,
  Comida,
  ProductoCompra,
  Consumo,
  sequelize
} from '../models/index.js';

function esPropietario(req) {
  return req.user.rol === 'propietario';
}

async function moverDatosCuenta(origenId, destinoId, transaction) {
  await Promise.all([
    Receta.update({ cuentaId: destinoId }, { where: { cuentaId: origenId }, transaction }),
    Comida.update({ cuentaId: destinoId }, { where: { cuentaId: origenId }, transaction }),
    ProductoCompra.update({ cuentaId: destinoId }, { where: { cuentaId: origenId }, transaction }),
    Consumo.update({ cuentaId: destinoId }, { where: { cuentaId: origenId }, transaction })
  ]);
}

export async function getAccount(req, res, next) {
  try {
    const cuenta = await Cuenta.findByPk(req.user.cuentaId, {
      attributes: ['id', 'tipo'],
      include: [{
        model: Usuario,
        as: 'usuarios',
        attributes: ['id', 'nombre', 'email', 'rol']
      }]
    });

    const respuesta = { cuenta };
    if (esPropietario(req)) {
      respuesta.invitaciones = await InvitacionCuenta.findAll({
        where: { cuentaId: req.user.cuentaId, estado: 'pendiente' },
        attributes: ['id', 'email', 'estado', 'expiraEn', 'creadoEn'],
        order: [['creadoEn', 'DESC']]
      });
    }

    res.json(respuesta);
  } catch (error) { next(error); }
}

export async function convertToGroup(req, res, next) {
  try {
    if (!esPropietario(req)) return res.status(403).json({ message: 'Solo el propietario puede cambiar el tipo de cuenta.' });
    const cuenta = await Cuenta.findByPk(req.user.cuentaId);
    await cuenta.update({ tipo: 'grupal' });
    res.json({ id: cuenta.id, tipo: cuenta.tipo });
  } catch (error) { next(error); }
}

export async function inviteMember(req, res, next) {
  try {
    if (!esPropietario(req)) return res.status(403).json({ message: 'Solo el propietario puede invitar miembros.' });

    const email = req.body.email.trim().toLowerCase();
    if (email === req.user.email.toLowerCase()) return res.status(400).json({ message: 'No puedes invitarte a ti mismo.' });

    const yaMiembro = await Usuario.findOne({ where: { cuentaId: req.user.cuentaId, email } });
    if (yaMiembro) return res.status(409).json({ message: 'Ese usuario ya pertenece a la cuenta.' });

    const pendiente = await InvitacionCuenta.findOne({
      where: { cuentaId: req.user.cuentaId, email, estado: 'pendiente' }
    });
    if (pendiente) return res.status(409).json({ message: 'Ya existe una invitación pendiente para ese email.' });

    const cuenta = await Cuenta.findByPk(req.user.cuentaId);
    if (cuenta.tipo !== 'grupal') await cuenta.update({ tipo: 'grupal' });

    const invitacion = await InvitacionCuenta.create({
      cuentaId: req.user.cuentaId,
      email,
      invitadoPor: req.user.id,
      token: crypto.randomBytes(32).toString('hex'),
      expiraEn: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    res.status(201).json({
      id: invitacion.id,
      email: invitacion.email,
      estado: invitacion.estado,
      token: invitacion.token,
      expiraEn: invitacion.expiraEn
    });
  } catch (error) { next(error); }
}

export async function acceptInvitation(req, res, next) {
  const transaction = await sequelize.transaction();
  try {
    const invitacion = await InvitacionCuenta.findOne({
      where: { token: req.params.token, estado: 'pendiente' },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!invitacion) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Invitación no encontrada o ya utilizada.' });
    }
    if (invitacion.expiraEn < new Date()) {
      await transaction.rollback();
      return res.status(410).json({ message: 'La invitación ha caducado.' });
    }
    if (invitacion.email !== req.user.email.toLowerCase()) {
      await transaction.rollback();
      return res.status(403).json({ message: 'La invitación pertenece a otro email.' });
    }
    if (invitacion.cuentaId === req.user.cuentaId) {
      await invitacion.update({ estado: 'aceptada' }, { transaction });
      await transaction.commit();
      return res.json({ cuentaId: req.user.cuentaId, rol: req.user.rol });
    }

    const miembrosCuentaActual = await Usuario.count({ where: { cuentaId: req.user.cuentaId }, transaction });
    if (miembrosCuentaActual > 1) {
      await transaction.rollback();
      return res.status(409).json({ message: 'No puedes unirte a otra cuenta mientras tu cuenta actual tenga otros miembros.' });
    }

    const cuentaAnteriorId = req.user.cuentaId;
    await moverDatosCuenta(cuentaAnteriorId, invitacion.cuentaId, transaction);
    await Usuario.update(
      { cuentaId: invitacion.cuentaId, rol: 'miembro' },
      { where: { id: req.user.id }, transaction }
    );
    await invitacion.update({ estado: 'aceptada' }, { transaction });

    const quedanUsuarios = await Usuario.count({ where: { cuentaId: cuentaAnteriorId }, transaction });
    if (!quedanUsuarios) await Cuenta.destroy({ where: { id: cuentaAnteriorId }, transaction });

    await transaction.commit();
    res.json({ cuentaId: invitacion.cuentaId, rol: 'miembro' });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    next(error);
  }
}

export async function rejectInvitation(req, res, next) {
  try {
    const invitacion = await InvitacionCuenta.findOne({
      where: { token: req.params.token, email: req.user.email.toLowerCase(), estado: 'pendiente' }
    });
    if (!invitacion) return res.status(404).json({ message: 'Invitación no encontrada o ya utilizada.' });
    await invitacion.update({ estado: 'rechazada' });
    res.status(204).end();
  } catch (error) { next(error); }
}

export async function removeMember(req, res, next) {
  const transaction = await sequelize.transaction();
  try {
    if (!esPropietario(req)) {
      await transaction.rollback();
      return res.status(403).json({ message: 'Solo el propietario puede expulsar miembros.' });
    }

    const miembro = await Usuario.findOne({
      where: { id: req.params.usuarioId, cuentaId: req.user.cuentaId },
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!miembro) {
      await transaction.rollback();
      return res.status(404).json({ message: 'Miembro no encontrado.' });
    }
    if (miembro.id === req.user.id || miembro.rol === 'propietario') {
      await transaction.rollback();
      return res.status(400).json({ message: 'No puedes expulsar al propietario de la cuenta.' });
    }

    const nuevaCuenta = await Cuenta.create({ tipo: 'individual' }, { transaction });
    await miembro.update({ cuentaId: nuevaCuenta.id, rol: 'propietario' }, { transaction });
    await transaction.commit();
    res.status(204).end();
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    next(error);
  }
}

export async function leaveAccount(req, res, next) {
  const transaction = await sequelize.transaction();
  try {
    if (req.user.rol === 'propietario') {
      await transaction.rollback();
      return res.status(409).json({ message: 'El propietario no puede abandonar la cuenta sin transferir antes la propiedad.' });
    }

    const usuario = await Usuario.findByPk(req.user.id, { transaction, lock: transaction.LOCK.UPDATE });
    const nuevaCuenta = await Cuenta.create({ tipo: 'individual' }, { transaction });
    await usuario.update({ cuentaId: nuevaCuenta.id, rol: 'propietario' }, { transaction });
    await transaction.commit();
    res.json({ cuentaId: nuevaCuenta.id, tipoCuenta: 'individual', rol: 'propietario' });
  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    next(error);
  }
}

export async function listMyInvitations(req, res, next) {
  try {
    const invitaciones = await InvitacionCuenta.findAll({
      where: {
        email: req.user.email.toLowerCase(),
        estado: 'pendiente',
        expiraEn: { [Op.gt]: new Date() }
      },
      attributes: ['id', 'token', 'cuentaId', 'expiraEn', 'creadoEn'],
      order: [['creadoEn', 'DESC']]
    });
    res.json(invitaciones);
  } catch (error) { next(error); }
}
