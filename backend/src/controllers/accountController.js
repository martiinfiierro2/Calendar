import { sendAccountInvitation } from '../services/emailVerificationService.js';
import crypto from 'node:crypto';
import { Op } from 'sequelize';
import { Cuenta, InvitacionCuenta, Usuario, sequelize } from '../models/index.js';

function fail(status, message) {
  const error = new Error(message);
  error.status = status;
  throw error;
}

function requireOwner(user) {
  if (user.rol !== 'propietario') fail(403, 'Solo el propietario puede realizar esta acción.');
}

// Serializa los cambios de membresía y vuelve a comprobar el usuario y su rol.
// Una petición autenticada antes de una expulsión no puede seguir cambiando la cuenta.
async function changeAccount(req, action) {
  return sequelize.transaction(async transaction => {
    await sequelize.query('SELECT pg_advisory_xact_lock(724116, 2)', { transaction });
    const user = await Usuario.findByPk(req.user.id, { transaction, lock: transaction.LOCK.UPDATE });
    if (!user) fail(401, 'Tu usuario ya no pertenece a esta cuenta.');
    if (user.cuentaId !== req.user.cuentaId) fail(409, 'Tu cuenta ha cambiado. Actualiza la página.');
    return action(user, transaction);
  });
}

async function deletePersonalData(user, transaction) {
  // Las invitaciones contienen emails personales, incluso si proceden de otras cuentas.
  await InvitacionCuenta.destroy({
    where: { [Op.or]: [{ email: user.email.toLowerCase() }, { invitadoPor: user.id }] }, transaction
  });
  // Recetas, comidas, compra y consumos pertenecen a Cuenta y no se eliminan.
  await user.destroy({ transaction });
}

export async function getAccount(req, res, next) {
  try {
    const cuenta = await Cuenta.findByPk(req.user.cuentaId, {
      attributes: ['id', 'tipo'],
      include: [{ model: Usuario, as: 'usuarios', attributes: ['id', 'rol'] }]
    });
    if (!cuenta) fail(404, 'Cuenta no encontrada.');
    // El listado de miembros no expone perfiles, emails ni preferencias personales.
    const respuesta = { cuenta, usuarioActual: { id: req.user.id, rol: req.user.rol } };
    if (req.user.rol === 'propietario') {
      const invitaciones = await InvitacionCuenta.findAll({
        where: { cuentaId: req.user.cuentaId, estado: 'pendiente' },
        attributes: ['id', 'email', 'token', 'estado', 'expiraEn', 'creadoEn'],
        order: [['creadoEn', 'DESC']]
      });
      respuesta.invitaciones = invitaciones.map(invitation => ({
        ...invitation.toJSON(), caducada: invitation.expiraEn <= new Date()
      }));
    }
    res.json(respuesta);
  } catch (error) { next(error); }
}

export async function convertToGroup(req, res, next) {
  try {
    const result = await changeAccount(req, async (user, transaction) => {
      requireOwner(user);
      const cuenta = await Cuenta.findByPk(user.cuentaId, { transaction });
      await cuenta.update({ tipo: 'grupal' }, { transaction });
      return { id: cuenta.id, tipo: cuenta.tipo };
    });
    res.json(result);
  } catch (error) { next(error); }
}

export async function convertToIndividual(req, res, next) {
  try {
    const result = await changeAccount(req, async (user, transaction) => {
      requireOwner(user);
      const members = await Usuario.count({ where: { cuentaId: user.cuentaId }, transaction });
      if (members !== 1) fail(409, 'La cuenta solo puede convertirse en individual cuando quede un miembro.');
      await InvitacionCuenta.destroy({ where: { cuentaId: user.cuentaId, estado: 'pendiente' }, transaction });
      const account = await Cuenta.findByPk(user.cuentaId, { transaction });
      await account.update({ tipo: 'individual' }, { transaction });
      return { id: account.id, tipo: account.tipo };
    });
    res.json(result);
  } catch (error) { next(error); }
}

export async function inviteMember(req, res, next) {
  try {
    const result = await changeAccount(req, async (user, transaction) => {
      requireOwner(user);
      const email = req.body.email.trim().toLowerCase();
      if (email === user.email.toLowerCase()) fail(400, 'No puedes invitarte a ti mismo.');
      if (await Usuario.findOne({ where: { cuentaId: user.cuentaId, email }, transaction })) {
        fail(409, 'Ese usuario ya pertenece a la cuenta.');
      }
      const pendiente = await InvitacionCuenta.findOne({
        where: { cuentaId: user.cuentaId, email, estado: 'pendiente' }, transaction
      });
      if (pendiente && pendiente.expiraEn > new Date()) fail(409, 'Ya existe una invitación pendiente para ese email.');
      const cuenta = await Cuenta.findByPk(user.cuentaId, { transaction });
      if (cuenta.tipo !== 'grupal') await cuenta.update({ tipo: 'grupal' }, { transaction });
      const values = {
        cuentaId: user.cuentaId, email, invitadoPor: user.id,
        token: crypto.randomBytes(32).toString('hex'),
        expiraEn: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      };
      const invitacion = pendiente
        ? await pendiente.update(values, { transaction })
        : await InvitacionCuenta.create(values, { transaction });
      // Solo el propietario y el destinatario autenticados pueden obtener este enlace.
      return { id: invitacion.id, email, token: invitacion.token, estado: invitacion.estado, expiraEn: invitacion.expiraEn };
    });
    const envioCorreo = await sendAccountInvitation(result);
    res.status(201).json({ ...result, envioCorreo });
  } catch (error) { next(error); }
}

export async function cancelInvitation(req, res, next) {
  try {
    await changeAccount(req, async (user, transaction) => {
      requireOwner(user);
      const removed = await InvitacionCuenta.destroy({
        where: { id: req.params.invitacionId, cuentaId: user.cuentaId, estado: 'pendiente' }, transaction
      });
      if (!removed) fail(404, 'Invitación no encontrada o ya utilizada.');
    });
    res.status(204).end();
  } catch (error) { next(error); }
}

export async function acceptInvitation(req, res, next) {
  try {
    const result = await changeAccount(req, async (user, transaction) => {
      if (!user.emailVerificado) fail(403, 'Verifica tu correo antes de aceptar invitaciones.');
      const invitacion = await InvitacionCuenta.findOne({
        where: { token: req.body.token || req.params.token, estado: 'pendiente' }, transaction,
        lock: transaction.LOCK.UPDATE
      });
      if (!invitacion) fail(404, 'Invitación no encontrada o ya utilizada.');
      if (invitacion.expiraEn <= new Date()) fail(410, 'La invitación ha caducado. Pide al propietario que la renueve.');
      if (invitacion.email !== user.email.toLowerCase()) fail(403, 'La invitación pertenece a otro email.');
      const propietario = await Usuario.findOne({
        where: { cuentaId: invitacion.cuentaId, rol: 'propietario' }, transaction
      });
      if (!propietario) fail(410, 'Esta cuenta ya no tiene un propietario que pueda admitir miembros.');
      if (invitacion.cuentaId !== user.cuentaId) {
        if (user.cuentaId) {
          const miembros = await Usuario.count({ where: { cuentaId: user.cuentaId }, transaction });
          if (miembros > 1) fail(409, 'Tu cuenta actual tiene otros miembros. No puedes cambiar de cuenta.');
          // La cuenta anterior quedará sin miembros; no admite nuevas entradas.
          await InvitacionCuenta.destroy({
            where: { cuentaId: user.cuentaId, estado: 'pendiente' }, transaction
          });
        }
        // No se fusionan datos ni perfiles. Los datos de la cuenta anterior se conservan allí.
        await user.update({ cuentaId: invitacion.cuentaId, rol: 'miembro' }, { transaction });
      }
      await invitacion.update({ estado: 'aceptada' }, { transaction });
      return { cuentaId: user.cuentaId, rol: user.rol };
    });
    res.json(result);
  } catch (error) { next(error); }
}

export async function rejectInvitation(req, res, next) {
  try {
    await changeAccount(req, async (user, transaction) => {
      const invitacion = await InvitacionCuenta.findOne({
        where: { token: req.body.token || req.params.token, email: user.email.toLowerCase(), estado: 'pendiente' }, transaction
      });
      if (!invitacion) fail(404, 'Invitación no encontrada o ya utilizada.');
      await invitacion.update({ estado: 'rechazada' }, { transaction });
    });
    res.status(204).end();
  } catch (error) { next(error); }
}

export async function transferOwnership(req, res, next) {
  try {
    await changeAccount(req, async (user, transaction) => {
      requireOwner(user);
      const miembro = await Usuario.findOne({
        where: { id: req.params.usuarioId, cuentaId: user.cuentaId }, transaction,
        lock: transaction.LOCK.UPDATE
      });
      if (!miembro) fail(404, 'Miembro no encontrado.');
      if (miembro.id === user.id || miembro.rol !== 'miembro') fail(400, 'Selecciona otro miembro de la cuenta.');
      await user.update({ rol: 'miembro' }, { transaction });
      await miembro.update({ rol: 'propietario' }, { transaction });
    });
    res.status(204).end();
  } catch (error) { next(error); }
}

export async function removeMember(req, res, next) {
  try {
    await changeAccount(req, async (user, transaction) => {
      requireOwner(user);
      const miembro = await Usuario.findOne({
        where: { id: req.params.usuarioId, cuentaId: user.cuentaId }, transaction,
        lock: transaction.LOCK.UPDATE
      });
      if (!miembro) fail(404, 'Miembro no encontrado.');
      if (miembro.id === user.id || miembro.rol === 'propietario') fail(400, 'No puedes expulsar al propietario de la cuenta.');
      await deletePersonalData(miembro, transaction);
    });
    res.status(204).end();
  } catch (error) { next(error); }
}

export async function leaveAccount(req, res, next) {
  try {
    await changeAccount(req, async (user, transaction) => {
      const miembros = await Usuario.count({ where: { cuentaId: user.cuentaId }, transaction });
      if (user.rol === 'propietario' && miembros > 1) fail(409, 'Transfiere la propiedad a otro miembro antes de abandonar la cuenta.');
      // Si es el último miembro, la cuenta y sus datos se conservan sin usuarios.
      await deletePersonalData(user, transaction);
    });
    res.status(204).end();
  } catch (error) { next(error); }
}

export async function listMyInvitations(req, res, next) {
  try {
    const invitaciones = await InvitacionCuenta.findAll({
      where: { email: req.user.email.toLowerCase(), estado: 'pendiente', expiraEn: { [Op.gt]: new Date() } },
      attributes: ['id', 'token', 'cuentaId', 'expiraEn', 'creadoEn'],
      order: [['creadoEn', 'DESC']]
    });
    res.json(invitaciones);
  } catch (error) { next(error); }
}

export async function resendInvitation(req, res, next) {
  try {
    const invitation = await changeAccount(req, async (user, transaction) => {
      requireOwner(user);
      const pending = await InvitacionCuenta.findOne({
        where: { id: req.params.invitacionId, cuentaId: user.cuentaId, estado: 'pendiente' },
        transaction, lock: transaction.LOCK.UPDATE
      });
      if (!pending) fail(404, 'Invitación no encontrada o ya utilizada.');
      if (pending.expiraEn <= new Date()) fail(410, 'Renueva la invitación caducada antes de enviarla.');
      if (Date.now() - pending.actualizadoEn.getTime() < 60000) fail(429, 'Espera un minuto antes de reenviar la invitación.');
      pending.changed('actualizadoEn', true);
      await pending.save({ transaction });
      return pending.toJSON();
    });
    const envioCorreo = await sendAccountInvitation(invitation);
    res.json({ envioCorreo });
  } catch (error) { next(error); }
}

export async function invitationAccess(req, res, next) {
  res.set('Cache-Control', 'no-store');
  try {
    const invitation = await InvitacionCuenta.findOne({ where: { token: req.body.token, estado: 'pendiente' } });
    if (!invitation) fail(404, 'La invitación no existe o ya se utilizó.');
    if (invitation.expiraEn <= new Date()) fail(410, 'La invitación ha caducado. Pide un enlace nuevo.');
    const owner = await Usuario.findOne({ where: { cuentaId: invitation.cuentaId, rol: 'propietario' }, attributes: ['id'] });
    if (!owner) fail(410, 'La cuenta ya no admite esta invitación.');
    const recipient = await Usuario.findOne({ where: { email: invitation.email }, attributes: ['id'] });
    res.json({ registered: Boolean(recipient), sessionMatches: req.user ? req.user.email.toLowerCase() === invitation.email : null });
  } catch (error) { next(error); }
}
