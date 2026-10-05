import { useEffect, useState } from 'react';
import {
  acceptAccountInvitation,
  convertAccountToGroup,
  getAccount,
  getMyAccountInvitations,
  inviteAccountMember,
  leaveAccount,
  rejectAccountInvitation,
  removeAccountMember
} from '../../services/accountService';
import Icon from '../../shared/Icon';

export default function AccountManagement() {
  const [account, setAccount] = useState(null);
  const [incoming, setIncoming] = useState([]);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [accountData, invitations] = await Promise.all([
      getAccount(),
      getMyAccountInvitations()
    ]);
    setAccount(accountData);
    setIncoming(invitations);
  };

  useEffect(() => {
    load().catch(err => setError(err.message || 'No se pudo cargar la cuenta.'));
  }, []);

  if (!account) return null;

  const me = account.cuenta?.usuarios?.find(usuario => usuario.rol === 'propietario') || null;
  const currentIsOwner = Boolean(account.invitaciones);

  const run = async action => {
    try {
      setBusy(true);
      setError('');
      await action();
      await load();
    } catch (err) {
      setError(err.message || 'No se pudo completar la acción.');
    } finally {
      setBusy(false);
    }
  };

  const sendInvite = event => {
    event.preventDefault();
    if (!email.trim()) return;
    run(async () => {
      await inviteAccountMember(email);
      setEmail('');
    });
  };

  return (
    <section className="perfil-seccion">
      <h2>Cuenta compartida</h2>

      <div className="perfil-cuenta-card">
        <div className="perfil-cuenta-header">
          <span className="perfil-ajuste-icon"><Icon name="users" size={18} /></span>
          <div>
            <strong>{account.cuenta.tipo === 'grupal' ? 'Cuenta compartida' : 'Cuenta individual'}</strong>
            <small>{account.cuenta.usuarios.length} {account.cuenta.usuarios.length === 1 ? 'miembro' : 'miembros'}</small>
          </div>
        </div>

        {account.cuenta.usuarios.map(usuario => (
          <div className="perfil-miembro" key={usuario.id}>
            <span className="perfil-miembro-avatar"><Icon name="user" size={16} /></span>
            <div>
              <strong>{usuario.nombre}</strong>
              <small>{usuario.email} · {usuario.rol}</small>
            </div>
            {currentIsOwner && usuario.rol !== 'propietario' && (
              <button
                type="button"
                className="perfil-miembro-remove"
                disabled={busy}
                onClick={() => run(() => removeAccountMember(usuario.id))}
                aria-label={`Expulsar a ${usuario.nombre}`}
              >
                <Icon name="trash" size={15} />
              </button>
            )}
          </div>
        ))}

        {currentIsOwner && account.cuenta.tipo === 'individual' && (
          <button
            type="button"
            className="perfil-account-action"
            disabled={busy}
            onClick={() => run(convertAccountToGroup)}
          >
            Convertir en cuenta compartida
          </button>
        )}

        {currentIsOwner && account.cuenta.tipo === 'grupal' && (
          <form className="perfil-invite-form" onSubmit={sendInvite}>
            <input
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder="email@ejemplo.com"
              aria-label="Email del nuevo miembro"
            />
            <button disabled={busy || !email.trim()}>Invitar</button>
          </form>
        )}

        {currentIsOwner && account.invitaciones?.length > 0 && (
          <div className="perfil-pending">
            <small>Invitaciones pendientes</small>
            {account.invitaciones.map(invitacion => (
              <span key={invitacion.id}>{invitacion.email}</span>
            ))}
          </div>
        )}

        {!currentIsOwner && account.cuenta.tipo === 'grupal' && (
          <button
            type="button"
            className="perfil-account-action perfil-account-leave"
            disabled={busy}
            onClick={() => run(leaveAccount)}
          >
            Abandonar cuenta compartida
          </button>
        )}
      </div>

      {incoming.length > 0 && (
        <div className="perfil-incoming">
          <strong>Invitaciones recibidas</strong>
          {incoming.map(invitation => (
            <div key={invitation.id}>
              <span>Invitación a cuenta #{invitation.cuentaId}</span>
              <div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run(() => acceptAccountInvitation(invitation.token))}
                >Aceptar</button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run(() => rejectAccountInvitation(invitation.token))}
                >Rechazar</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {error && <div className="perfil-account-error">{error}</div>}
    </section>
  );
}
