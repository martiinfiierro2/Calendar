import crypto from 'node:crypto';
import { Usuario, sequelize } from '../models/index.js';

const TOKEN_LIFETIME_MS = 24 * 60 * 60 * 1000;
const RESEND_DELAY_MS = 60 * 1000;
// Transporte exclusivo de pruebas; nunca escribe enlaces en logs ni en respuestas API.
export const testMailbox = [];

function failure(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function verificationLink(token) {
  if (!process.env.FRONTEND_URL) throw failure(503, 'El envío de verificación no está disponible.');
  let base;
  try { base = new URL(process.env.FRONTEND_URL); }
  catch { throw failure(503, 'El envío de verificación no está disponible.'); }
  if (!['http:', 'https:'].includes(base.protocol) || (process.env.NODE_ENV === 'production' && base.protocol !== 'https:')) {
    throw failure(503, 'El envío de verificación no está disponible.');
  }
  const url = new URL('/verificar-email', base);
  // El fragmento no se envía al servidor web ni aparece en sus logs.
  url.hash = new URLSearchParams({ token }).toString();
  return url.toString();
}

async function deliver(message) {
  const transport = process.env.MAIL_TRANSPORT || 'resend';
  if (transport === 'test') {
    if (process.env.NODE_ENV !== 'test') throw failure(503, 'El envío de verificación no está disponible.');
    testMailbox.push(message);
    return;
  }
  if (transport !== 'resend' || !process.env.RESEND_API_KEY || !process.env.MAIL_FROM) {
    throw failure(503, 'No se pudo enviar la verificación. Inténtalo más tarde.');
  }
  let response;
  try {
    response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: process.env.MAIL_FROM, to: [message.email], subject: 'Verifica tu correo en Calendar', text: message.text }),
      signal: AbortSignal.timeout(10000)
    });
  } catch { throw failure(503, 'No se pudo enviar la verificación. Inténtalo más tarde.'); }
  if (!response.ok) throw failure(503, 'No se pudo enviar la verificación. Inténtalo más tarde.');
}

export async function sendEmailVerification(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  const issued = await sequelize.transaction(async transaction => {
    const user = await Usuario.findByPk(userId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!user) throw failure(401, 'Sesión no válida.');
    if (user.emailVerificado) return null;
    const now = new Date();
    if (user.emailVerificacionEnviadaEn && now - user.emailVerificacionEnviadaEn < RESEND_DELAY_MS) {
      throw failure(429, 'Espera un minuto antes de reenviar el correo.');
    }
    const previous = {
      emailVerificacionHash: user.emailVerificacionHash,
      emailVerificacionExpiraEn: user.emailVerificacionExpiraEn,
      emailVerificacionEnviadaEn: user.emailVerificacionEnviadaEn
    };
    await user.update({
      emailVerificacionHash: hash,
      emailVerificacionExpiraEn: new Date(now.getTime() + TOKEN_LIFETIME_MS),
      emailVerificacionEnviadaEn: now
    }, { transaction });
    return { email: user.email, previous };
  });
  if (!issued) return { message: 'Tu correo ya está verificado.' };
  try {
    const url = verificationLink(token);
    await deliver({
      email: issued.email, url,
      text: `Confirma tu correo para activar tu acceso a Calendar:\n\n${url}\n\nEste enlace caduca en 24 horas y solo se puede usar una vez. Si no solicitaste este registro o cambio de correo, no confirmes el enlace y descarta este mensaje.`
    });
  } catch (error) {
    // Un fallo de entrega no bloquea un reintento ni invalida un enlace anterior que sí llegó.
    await Usuario.update(issued.previous, { where: { id: userId, email: issued.email, emailVerificacionHash: hash } });
    throw error;
  }
  return { message: 'Te hemos enviado un enlace. Revisa tu correo; caduca en 24 horas.' };
}

export async function confirmEmailVerification(token) {
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  return sequelize.transaction(async transaction => {
    await sequelize.query('SELECT pg_advisory_xact_lock(724116, 2)', { transaction });
    const user = await Usuario.findOne({ where: { emailVerificacionHash: hash }, transaction, lock: transaction.LOCK.UPDATE });
    if (!user) throw failure(400, 'El enlace no es válido o ya se utilizó.');
    if (!user.emailVerificacionExpiraEn || user.emailVerificacionExpiraEn <= new Date()) {
      throw failure(410, 'El enlace ha caducado. Solicita uno nuevo desde la pantalla de verificación.');
    }
    await user.update({
      emailVerificado: true, emailVerificacionHash: null,
      emailVerificacionExpiraEn: null, emailVerificacionEnviadaEn: null
    }, { transaction });
    return { message: 'Tu correo está verificado. Ya puedes continuar en Calendar.' };
  });
}

export async function trySendingVerification(userId) {
  try {
    const result = await sendEmailVerification(userId);
    return { enviada: true, message: result.message };
  } catch {
    return { enviada: false, message: 'Tu usuario se ha guardado, pero no pudimos enviar el enlace. Puedes reenviarlo desde la pantalla de verificación.' };
  }
}
