import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import ActivationPage from '../features/auth/ActivationPage';
import InvitationPage from '../features/auth/InvitationPage';
import { getPendingInvitation } from '../services/invitationLink';
import EmailVerificationPage from '../features/auth/EmailVerificationPage';
import LoginPage from '../features/auth/LoginPage';
import CalendarPage from '../features/calendar/CalendarPage';
import ProfilePage from '../features/profile/ProfilePage';
import RecipesPage from '../features/recipes/RecipesPage';
import ShoppingPage from '../features/shopping/ShoppingPage';
import { getSession, refreshSession } from '../services/authService';
import Footer from '../shared/Footer';

// Centraliza la protección de rutas para no repetir la misma comprobación.
function ProtectedRoute({ session, children }) {
  if (!session?.token) return <Navigate to="/login" replace />;
  if (!session.emailVerificado) return <Navigate to="/activar-cuenta" replace />;
  if (!session.cuentaId) return <Navigate to="/invitacion" replace />;
  return children;
}

export default function AppRouter() {
  const location = useLocation();
  const [session, setSession] = useState(getSession);
  const [checkingSession, setCheckingSession] = useState(Boolean(getSession()?.token));
  const authenticated = Boolean(session?.token);
  const onLoginScreen = ['/login', '/verificar-email', '/activar-cuenta', '/invitacion'].includes(location.pathname);

  useEffect(() => {
    const syncSession = () => {
      const current = getSession();
      setSession(current);
      if (!current?.token) setCheckingSession(false);
    };
    window.addEventListener('calendar-session-changed', syncSession);
    window.addEventListener('storage', syncSession);
    return () => {
      window.removeEventListener('calendar-session-changed', syncSession);
      window.removeEventListener('storage', syncSession);
    };
  }, []);

  useEffect(() => {
    if (!session?.token) return;

    let active = true;

    const revalidate = () => refreshSession()
      .then(nextSession => { if (active) setSession(nextSession); })
      .catch(() => { /* Un fallo de red no elimina una sesión válida. */ })
      .finally(() => { if (active) setCheckingSession(false); });
    revalidate();
    const interval = window.setInterval(revalidate, 30000);
    window.addEventListener('focus', revalidate);

    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', revalidate);
    };
  }, [session?.token]);

  const protectedPage = page => (
    <ProtectedRoute
      key={`${session?.id}:${session?.cuentaId}:${session?.rol}:${session?.emailVerificado}`}
      session={session}
    >{page}</ProtectedRoute>
  );

  if (checkingSession) {
    return <div className="app-container" />;
  }

  return (
    <div className="app-container">
      <main className="main-container">
        <Routes>
          <Route
            path="/login"
            element={authenticated ? <Navigate to={getPendingInvitation() ? '/invitacion' : '/'} replace /> : <LoginPage onAuth={setSession} />}
          />
          <Route path="/activar-cuenta" element={<ActivationPage session={session} />} />
          <Route path="/invitacion" element={<InvitationPage key={session?.id || 'guest'} session={session} onAuth={setSession} />} />
          <Route path="/verificar-email" element={<EmailVerificationPage />} />
          <Route path="/" element={protectedPage(<CalendarPage />)} />
          <Route path="/recetas" element={protectedPage(<RecipesPage />)} />
          <Route path="/compra" element={protectedPage(<ShoppingPage />)} />
          <Route path="/perfil" element={protectedPage(<ProfilePage onLogout={() => setSession(null)} />)} />
          <Route path="*" element={<Navigate to={authenticated ? '/' : '/login'} replace />} />
        </Routes>
      </main>

      {authenticated && session.emailVerificado && session.cuentaId && !onLoginScreen && <Footer />}
    </div>
  );
}
