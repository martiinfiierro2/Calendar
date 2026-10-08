import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { logoutUser, refreshSession } from '../../services/authService';
import { resendEmailVerification } from '../../services/emailVerificationService';
import { updateUser } from '../../services/userService';
import AuthPanel from './AuthPanel';
import { getPendingInvitation } from '../../services/invitationLink';

export default function ActivationPage({ session }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(session?.verificacionCorreo?.message || 'Abre el enlace de verificación de tu correo. Si no lo tienes, puedes solicitar uno nuevo. Revisa también la carpeta de spam.');
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState(session?.email || '');

  if (!session?.token) return <Navigate to="/login" replace />;
  if (session.emailVerificado) return <Navigate to={!session.cuentaId || getPendingInvitation() ? '/invitacion' : '/'} replace />;

  const run = async action => {
    if (busy) return;
    setBusy(true);
    setError('');
    try { await action(); }
    catch (err) { setError(err.message || 'No se pudo completar la acción.'); }
    finally { setBusy(false); }
  };

  const changeEmail = event => {
    event.preventDefault();
    run(async () => {
      const result = await updateUser({ email });
      await refreshSession();
      setEditing(false);
      setMessage(result.verificacionCorreo?.message || 'Revisa tu correo para confirmar la nueva dirección.');
    });
  };

  return (
    <AuthPanel eyebrow="Un último paso" title="Verifica tu correo">
      <p>Confirma tu dirección para activar tu acceso{session.cuentaId ? ' a Calendar.' : ' y aceptar la invitación a tu familia.'}</p>
      <div className="auth-email">{session.email}</div>
      {message && <p className="auth-status" role="status">{message}</p>}
      {error && <div className="login-error" role="alert">{error}</div>}
      <div className="auth-actions">
        <button className="login-submit" disabled={busy} onClick={() => run(async () => setMessage((await resendEmailVerification()).message))}>Reenviar correo de verificación</button>
        <button className="login-back" disabled={busy} onClick={() => run(async () => {
          const current = await refreshSession();
          if (current && !current.emailVerificado) setMessage('Tu correo todavía no está verificado. Abre el enlace y pulsa Confirmar mi correo.');
        })}>Ya he verificado mi correo</button>
        <button className="auth-text-button" disabled={busy} onClick={() => setEditing(value => !value)}>Cambiar email</button>
      </div>
      {editing && <form className="login-form auth-email-form" onSubmit={changeEmail}>
        <label>Nuevo email<input type="email" required value={email} onChange={event => setEmail(event.target.value)} /></label>
        <button className="login-submit" disabled={busy || email.trim().toLowerCase() === session.email}>Guardar y enviar verificación</button>
      </form>}
      <p className="login-nota">El enlace caduca en 24 horas. Tu dirección es privada.</p>
      <button className="auth-text-button" disabled={busy} onClick={logoutUser}>Cerrar sesión</button>
    </AuthPanel>
  );
}
