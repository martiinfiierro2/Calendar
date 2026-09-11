import { useState } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Footer from '../componentes/footer';
import LoginPage from '../features/auth/LoginPage';
import CalendarPage from '../features/calendar/CalendarPage';
import ProfilePage from '../features/profile/ProfilePage';
import RecipesPage from '../features/recipes/RecipesPage';
import ShoppingPage from '../features/shopping/ShoppingPage';
import { getSession, hasSession } from '../services/authService';

// Centraliza la protección de rutas para no repetir la misma comprobación.
function ProtectedRoute({ authenticated, children }) {
  return authenticated ? children : <Navigate to="/login" replace />;
}

export default function AppRouter() {
  const location = useLocation();
  const [session, setSession] = useState(getSession);
  const authenticated = Boolean(session?.email) || hasSession();
  const onLoginScreen = location.pathname === '/login';

  const protectedPage = page => (
    <ProtectedRoute authenticated={authenticated}>{page}</ProtectedRoute>
  );

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
