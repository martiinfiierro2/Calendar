import { useEffect, useState } from 'react';
import {
  acceptAccountInvitation, cancelAccountInvitation, convertAccountToGroup,
  getAccount, getMyAccountInvitations, inviteAccountMember, leaveAccount,
  rejectAccountInvitation, removeAccountMember, transferAccountOwnership
} from '../../services/accountService';
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
  const memberLabel = user => user.id === account.usuarioActual.id ? 'Tú' : `Miembro #${user.id}`;

  const sendInvite = event => {
    event.preventDefault();
    if (!email.trim()) return;
    run(async () => { await inviteAccountMember(email); setEmail(''); });
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
      <h2>Cuenta familiar</h2>
      <div className="perfil-cuenta-card">
        <div className="perfil-cuenta-header">
          <span className="perfil-ajuste-icon"><Icon name="users" size={18} /></span>
          <div>
            <strong>{account.cuenta.tipo === 'grupal' ? 'Cuenta familiar' : 'Cuenta individual'}</strong>
            <small>{account.cuenta.usuarios.length} {account.cuenta.usuarios.length === 1 ? 'miembro' : 'miembros'}</small>
          </div>
        </div>
        <p>Todos ven los datos de la cuenta. Tu perfil, email y preferencias son privados.</p>
        {account.cuenta.usuarios.map(user => (
          <div className="perfil-miembro" key={user.id}>
            <span className="perfil-miembro-avatar"><Icon name="user" size={16} /></span>
            <div><strong>{memberLabel(user)}</strong><small>{user.rol}</small></div>
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
        {currentIsOwner && account.cuenta.tipo === 'grupal' && (
          <form className="perfil-invite-form" onSubmit={sendInvite}>
            <input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="email@ejemplo.com" aria-label="Email del nuevo miembro" required />
            <button disabled={busy || !email.trim()}>Invitar</button>
          </form>
        )}
        {currentIsOwner && account.invitaciones?.length > 0 && (
          <div className="perfil-pending">
            <small>Invitaciones enviadas</small>
            {account.invitaciones.map(invitation => (
              <div className="perfil-invitation-row" key={invitation.id}>
                <span>{invitation.email} · {invitation.caducada ? 'Caducada' : 'Pendiente'}</span>
                {invitation.caducada && <button type="button" disabled={busy} onClick={() => run(() => inviteAccountMember(invitation.email))}>Renovar</button>}
                <button type="button" disabled={busy} onClick={() => run(() => cancelAccountInvitation(invitation.id))}>Cancelar</button>
              </div>
            ))}
          </div>
        )}
        {(!currentIsOwner || account.cuenta.usuarios.length === 1) && (
          <button type="button" className="perfil-account-action perfil-account-leave" disabled={busy} onClick={leave}>Abandonar cuenta familiar</button>
        )}
        {currentIsOwner && account.cuenta.usuarios.length > 1 && <p>Para abandonar la cuenta, primero transfiere la propiedad a otro miembro.</p>}
      </div>
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
