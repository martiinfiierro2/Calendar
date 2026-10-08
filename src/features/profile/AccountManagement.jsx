import { useEffect, useState } from 'react';
import {
  acceptAccountInvitation, cancelAccountInvitation, convertAccountToGroup,
  convertAccountToIndividual, resendAccountInvitation, getAccount, getMyAccountInvitations, inviteAccountMember, leaveAccount,
  rejectAccountInvitation, removeAccountMember, transferAccountOwnership
} from '../../services/accountService';
import { invitationLink } from '../../services/invitationLink';
import Icon from '../../shared/Icon';

async function fetchAccountState() {
  const [account, incoming] = await Promise.all([getAccount(), getMyAccountInvitations()]);
  return { account, incoming };
}

export default function AccountManagement({ onAccountChanged, onLeave, emailVerified }) {
  const [account, setAccount] = useState(null);
  const [incoming, setIncoming] = useState([]);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchAccountState()
      .then(data => {
        if (!active) return;
        setAccount(data.account);
        setIncoming(data.incoming);
      })
      .catch(err => { if (active) setError(err.message || 'No se pudo cargar la cuenta.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const load = async () => {
    const data = await fetchAccountState();
    setAccount(data.account);
    setIncoming(data.incoming);
  };

  const run = async (action, { leaving = false } = {}) => {
    if (busy) return;
    try {
      setBusy(true);
      setError('');
      setMessage('');
      await action();
      if (leaving) {
        onLeave?.();
        return;
      }
      await load();
      await onAccountChanged?.();
    } catch (err) {
      setError(err.message || 'No se pudo completar la acción.');
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <section className="perfil-seccion" aria-busy="true"><p>Cargando cuenta...</p></section>;
  if (!account) return (
    <section className="perfil-seccion">
      <p className="perfil-account-error" role="alert">{error || 'No se pudo cargar la cuenta.'}</p>
      <button type="button" disabled={busy} onClick={() => run(load)}>Reintentar</button>
    </section>
  );

  const currentIsOwner = account.usuarioActual.rol === 'propietario';
  const isFamily = account.cuenta.tipo === 'grupal';
  const memberLabel = user => user.id === account.usuarioActual.id ? 'Tú' : `Miembro #${user.id}`;

  const sendInvite = event => {
    event.preventDefault();
    if (!email.trim()) return;
    run(async () => { const invitation = await inviteAccountMember(email); setMessage(invitation.envioCorreo.message); setEmail(''); });
  };

  const copyInvitation = async token => {
    const link = invitationLink(token);
    setError('');
    try {
      await navigator.clipboard.writeText(link);
      setMessage('Enlace copiado. Ya puedes enviarlo a la persona invitada.');
    } catch {
      const previousFocus = document.activeElement;
      const field = document.createElement('textarea');
      field.value = link;
      field.style.position = 'fixed';
      field.style.left = '-9999px';
      document.body.append(field);
      field.select();
      let copied = false;
      try { copied = document.execCommand('copy'); }
      catch { /* El envío por correo sigue disponible si el portapapeles no se permite. */ }
      finally { field.remove(); previousFocus?.focus({ preventScroll: true }); }
      if (copied) setMessage('Enlace copiado. Ya puedes enviarlo a la persona invitada.');
      else setError('No se pudo copiar el enlace. Puedes usar Reenviar correo.');
    }
  };

  const remove = user => {
    if (!window.confirm(`¿Expulsar a ${memberLabel(user)}? Se borrarán su usuario y sus datos personales y perderá el acceso. Los datos de la familia se conservarán.`)) return;
    run(() => removeAccountMember(user.id));
  };

  const transfer = user => {
    if (!window.confirm(`¿Transferir la propiedad a ${memberLabel(user)}? Pasará a gestionar miembros e invitaciones y tú dejarás de ser propietario.`)) return;
    run(() => transferAccountOwnership(user.id));
  };

  const leave = () => {
    if (!window.confirm('¿Abandonar la cuenta? Se borrarán tu usuario y tus datos personales y se cerrará tu sesión. Los datos de la familia se conservarán. Para volver o crear una cuenta individual tendrás que registrarte de nuevo.')) return;
    run(leaveAccount, { leaving: true });
  };

  const accept = invitation => {
    if (!window.confirm('¿Unirte a esta cuenta familiar? Verás sus recetas, calendario, compra, nevera y consumos. Tu perfil seguirá siendo privado. No se fusionarán los datos de tu cuenta anterior; permanecerán allí y dejarás de tener acceso a ella.')) return;
    run(() => acceptAccountInvitation(invitation.token));
  };

  return (
    <section className="perfil-seccion">
      <h2>{isFamily ? 'Tu familia' : 'Tu cuenta'}</h2>
      <div className="perfil-cuenta-card">
        <div className="perfil-cuenta-header">
          <span className="perfil-ajuste-icon"><Icon name={isFamily ? 'users' : 'user'} size={18} /></span>
          <div>
            <strong>{account.cuenta.tipo === 'grupal' ? 'Cuenta familiar' : 'Cuenta individual'}</strong>
            <small>{account.cuenta.usuarios.length} {account.cuenta.usuarios.length === 1 ? 'miembro' : 'miembros'}</small>
          </div>
        </div>
        <p>{isFamily ? 'Un mismo calendario, recetas y compra para toda la familia. Tu perfil, email y preferencias son privados.' : 'Tu calendario, recetas y compra son solo para ti. Puedes convertir esta cuenta en familiar conservando tus datos.'}</p>
        {isFamily && account.cuenta.usuarios.map(user => (
          <div className="perfil-miembro" key={user.id}>
            <span className="perfil-miembro-avatar"><Icon name="user" size={16} /></span>
            <div><strong>{memberLabel(user)}</strong><small>{user.rol === 'propietario' ? 'Propietario' : 'Miembro'}</small></div>
            {currentIsOwner && user.rol !== 'propietario' && (
              <div className="perfil-member-actions">
                <button type="button" disabled={busy} onClick={() => transfer(user)}>Transferir propiedad</button>
                <button type="button" className="perfil-miembro-remove" disabled={busy} onClick={() => remove(user)} aria-label={`Expulsar a ${memberLabel(user)}`}>
                  <Icon name="trash" size={15} />
                </button>
              </div>
            )}
          </div>
        ))}
        {currentIsOwner && account.cuenta.tipo === 'individual' && (
          <button type="button" className="perfil-account-action" disabled={busy} onClick={() => run(convertAccountToGroup)}>Convertir en cuenta familiar</button>
        )}
        {isFamily && currentIsOwner && account.cuenta.usuarios.length === 1 && <button type="button" className="perfil-account-action perfil-account-secondary" disabled={busy} onClick={() => {
          if (window.confirm('¿Convertir en cuenta individual? Conservarás tus datos y se cancelarán todas las invitaciones pendientes.')) run(convertAccountToIndividual);
        }}>Convertir en cuenta individual</button>}
        {isFamily && currentIsOwner && (
          <form className="perfil-invite-form" onSubmit={sendInvite}>
            <input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="email@ejemplo.com" aria-label="Email del nuevo miembro" required />
            <button disabled={busy || !email.trim()}>Enviar invitación</button>
          </form>
        )}
        {isFamily && currentIsOwner && account.invitaciones?.length > 0 && (
          <div className="perfil-pending">
            <small>Invitaciones enviadas</small>
            {account.invitaciones.map(invitation => (
              <div className="perfil-invitation-row" key={invitation.id}>
                <span>{invitation.email} · {invitation.caducada ? 'Caducada' : 'Pendiente'}</span>
                {invitation.caducada ? <button type="button" disabled={busy} onClick={() => run(async () => { const renewed = await inviteAccountMember(invitation.email); setMessage(renewed.envioCorreo.message); })}>Renovar</button> : <button type="button" disabled={busy} onClick={() => copyInvitation(invitation.token)}>Copiar enlace</button>}
                {!invitation.caducada && <button type="button" disabled={busy} onClick={() => run(async () => setMessage((await resendAccountInvitation(invitation.id)).envioCorreo.message))}>Reenviar correo</button>}
                <button type="button" disabled={busy} onClick={() => run(() => cancelAccountInvitation(invitation.id))}>Cancelar</button>
              </div>
            ))}
          </div>
        )}
        {isFamily && (!currentIsOwner || account.cuenta.usuarios.length === 1) && (
          <button type="button" className="perfil-account-action perfil-account-leave" disabled={busy} onClick={leave}>Abandonar cuenta familiar</button>
        )}
        {isFamily && currentIsOwner && account.cuenta.usuarios.length > 1 && <p>Para abandonar la cuenta, primero transfiere la propiedad a otro miembro.</p>}
      </div>
      {message && <p className="perfil-account-status" role="status">{message}</p>}
      {incoming.length > 0 && (
        <div className="perfil-incoming">
          <strong>Invitaciones recibidas</strong>
          {!emailVerified && <p>Verifica tu correo desde el perfil antes de aceptar una invitación.</p>}
          {incoming.map(invitation => (
            <div key={invitation.id}>
              <span>Invitación a cuenta #{invitation.cuentaId}</span>
              <div>
                <button type="button" disabled={busy || !emailVerified} onClick={() => accept(invitation)}>Aceptar</button>
                <button type="button" disabled={busy} onClick={() => run(() => rejectAccountInvitation(invitation.token))}>Rechazar</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {error && <div className="perfil-account-error" role="alert">{error}</div>}
    </section>
  );
}
