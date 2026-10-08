import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getInvitationAccess, acceptAccountInvitation, getMyAccountInvitations, rejectAccountInvitation } from '../../services/accountService';
import { logoutUser, refreshSession, cancelPendingRegistration } from '../../services/authService';
import { clearPendingInvitation, getPendingInvitation, rememberInvitation } from '../../services/invitationLink';
import LoginPage from './LoginPage';
import AuthPanel from './AuthPanel';
import ActivationPage from './ActivationPage';

export default function InvitationPage({ session, onAuth }) {
  const navigate = useNavigate();
  const [token, setToken] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('token') || getPendingInvitation());
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(Boolean(session?.token));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [access, setAccess] = useState(null);
  const [accessError, setAccessError] = useState('');

  useEffect(() => {
    rememberInvitation(token);
    window.history.replaceState(null, '', window.location.pathname);
  }, [token]);

  useEffect(() => {
    if (!session?.token) return;
    let active = true;
    getMyAccountInvitations()
      .then(data => { if (active) setInvitations(data); })
      .catch(err => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [session?.token]);

  useEffect(() => {
    if (!token) return;
    let active = true;
    getInvitationAccess(token)
      .then(data => { if (active) setAccess(data); })
      .catch(err => { if (active) setAccessError(err.message); });
    return () => { active = false; };
  }, [token, session?.token]);

  if (token && !access) return <AuthPanel icon="users" eyebrow="Invitación familiar" title="Únete a tu familia">
    {accessError ? <><p className="login-error" role="alert">{accessError}</p>
      <button className="login-back" onClick={() => window.location.reload()}>Reintentar</button>
      <Link className="auth-text-button" to="/login" onClick={clearPendingInvitation}>Volver al acceso</Link></> : <p role="status">Comprobando invitación...</p>}
  </AuthPanel>;
  if (session?.token && access?.sessionMatches === false) return <AuthPanel icon="users" eyebrow="Invitación familiar" title="Esta invitación es para otro correo">
    <p>Tu sesión actual usa {session.email}. Para aceptar, accede con el correo al que llegó la invitación.</p>
    <button className="login-submit" onClick={logoutUser}>Cambiar de sesión</button>
    {session.cuentaId && <Link className="auth-text-button" to="/perfil">Volver a mi cuenta</Link>}
  </AuthPanel>;
  if (!session?.token) return <LoginPage key={token || 'normal'} onAuth={onAuth} invitationToken={token} initialMode={access?.registered ? 'login' : token ? 'registro' : 'login'} />;
  if (!session.emailVerificado) return <ActivationPage session={session} />;

  const run = async action => {
    if (busy) return;
    setBusy(true);
    setError('');
    try { await action(); }
    catch (err) { setError(err.message || 'No se pudo completar la acción.'); }
    finally { setBusy(false); }
  };
  const accept = invitation => run(async () => {
    await acceptAccountInvitation(invitation.token);
    clearPendingInvitation();
    await refreshSession();
    navigate('/', { replace: true });
  });
  const reject = invitation => run(async () => {
    await rejectAccountInvitation(invitation.token);
    clearPendingInvitation();
    setInvitations(previous => previous.filter(item => item.id !== invitation.id));
  });
  const visible = token ? invitations.filter(item => item.token === token) : invitations;

  return (
    <AuthPanel icon="users" eyebrow="Un hogar, una cuenta" title="Únete a tu familia">
      <p>Compartiréis calendario, recetas, compra, nevera y consumos. Tu perfil y tu correo seguirán siendo privados.</p>
      <div className="auth-email">{session.email}</div>
      {loading ? <p role="status">Comprobando invitación...</p> : visible.length > 0 ? visible.map(invitation => (
        <div className="auth-invitation" key={invitation.id}>
          <strong>Cuenta familiar #{invitation.cuentaId}</strong>
          <small>Disponible hasta {new Date(invitation.expiraEn).toLocaleDateString('es-ES')}</small>
          {session.cuentaId && session.cuentaId !== invitation.cuentaId && <p className="auth-warning">Al aceptar, dejarás de acceder a tu cuenta actual. Sus datos permanecerán allí; no se fusionarán con los de la familia.</p>}
          <p>Al pulsar Aceptar invitación confirmas que quieres pertenecer a esta familia.</p>
          <div className="auth-actions">
            <button className="login-submit" disabled={busy} onClick={() => accept(invitation)}>Aceptar invitación</button>
            <button className="login-back" disabled={busy} onClick={() => reject(invitation)}>Rechazar invitación</button>
          </div>
        </div>
      )) : <div className="auth-status"><p>No hay una invitación disponible para este correo. Puede haber caducado, haberse cancelado o pertenecer a otra dirección.</p>
        <p>Pide un enlace nuevo al propietario de la familia.</p>
        {token && invitations.length > 0 && <button className="login-back" onClick={() => { clearPendingInvitation(); setToken(''); }}>Ver mis otras invitaciones</button>}
      </div>}
      {error && <div className="login-error" role="alert">{error}</div>}
      {error && <button className="login-back" disabled={busy} onClick={() => run(async () => setInvitations(await getMyAccountInvitations()))}>Reintentar</button>}
      {session.cuentaId && <Link className="auth-text-button" to="/perfil">Volver a mi cuenta</Link>}
      {!session.cuentaId && <button className="auth-text-button" disabled={busy} onClick={() => {
        if (window.confirm('¿Cancelar tu registro pendiente? Se borrará tu usuario sin afectar a la familia. Podrás registrarte de nuevo.')) {
          run(async () => { await cancelPendingRegistration(); clearPendingInvitation(); logoutUser(); navigate('/login', { replace: true }); });
        }
      }}>Cancelar registro pendiente</button>}
      <button className="auth-text-button" disabled={busy} onClick={logoutUser}>Cerrar sesión</button>
    </AuthPanel>
  );
}
