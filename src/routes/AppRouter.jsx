import { useEffect, useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import LoginPage from '../features/auth/LoginPage';
import CalendarPage from '../features/calendar/CalendarPage';
import ProfilePage from '../features/profile/ProfilePage';
import RecipesPage from '../features/recipes/RecipesPage';
import ShoppingPage from '../features/shopping/ShoppingPage';
import { getSession, refreshSession } from '../services/authService';
import Footer from '../shared/Footer';

// Centraliza la protección de rutas para no repetir la misma comprobación.
function ProtectedRoute({ authenticated, children }) {
  return authenticated ? children : <Navigate to="/login" replace />;
}

export default function AppRouter() {
  const location = useLocation();
  const [session, setSession] = useState(getSession);
  const [checkingSession, setCheckingSession] = useState(Boolean(getSession()?.token));
  const authenticated = Boolean(session?.token);
  const onLoginScreen = location.pathname === '/login';

  useEffect(() => {
    if (!session?.token) return;

    let active = true;

    refreshSession().then(nextSession => {
      if (!active) return;
      setSession(nextSession);
      setCheckingSession(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const protectedPage = page => (
    <ProtectedRoute authenticated={authenticated}>{page}</ProtectedRoute>
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
            element={authenticated ? <Navigate to="/" replace /> : <LoginPage onAuth={setSession} />}
          />
          <Route path="/" element={protectedPage(<CalendarPage />)} />
          <Route path="/recetas" element={protectedPage(<RecipesPage />)} />
          <Route path="/compra" element={protectedPage(<ShoppingPage />)} />
          <Route path="/perfil" element={protectedPage(<ProfilePage onLogout={() => setSession(null)} />)} />
          <Route path="*" element={<Navigate to={authenticated ? '/' : '/login'} replace />} />
        </Routes>
      </main>

      {authenticated && !onLoginScreen && <Footer />}
    </div>
  );
}
