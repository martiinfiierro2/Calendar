import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { verifyEmail } from '../../services/emailVerificationService';
import { getSession, refreshSession } from '../../services/authService';

export default function EmailVerificationPage() {
  const [token] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('token') || '');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    // No conservamos el secreto en el historial ni lo enviamos al servidor web.
    window.history.replaceState(null, '', window.location.pathname);
  }, []);

  const confirm = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const result = await verifyEmail(token);
      setVerified(true);
      setStatus(result.message);
      if (getSession()?.token) {
        try { await refreshSession(); }
        catch { /* La confirmación ya se completó; una caída de red no la revierte. */ }
      }
    } catch (err) { setError(err.message || 'No se pudo verificar el correo.'); }
    finally { setBusy(false); }
  };

  return (
    <section className="perfil-seccion email-verification-page">
      <h1>Verifica tu correo</h1>
      {!token ? <p role="alert">Abre el enlace que te enviamos por correo. Puedes solicitar uno nuevo desde tu perfil.</p> : (
        <>
          {!verified && <p>Confirma tu correo para aceptar invitaciones a cuentas familiares. Hazlo solo si solicitaste este registro o cambio de email.</p>}
          {!verified && <button type="button" disabled={busy} onClick={confirm}>{busy ? 'Verificando...' : 'Confirmar mi correo'}</button>}
        </>
      )}
      {status && <p role="status">{status}</p>}
      {error && <p role="alert">{error}</p>}
      <Link to={getSession()?.token ? '/perfil' : '/login'}>{getSession()?.token ? 'Ir a mi perfil' : 'Iniciar sesión'}</Link>
    </section>
  );
}
