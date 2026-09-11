import React, { useState } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Footer from './componentes/footer';
import Calendario from './componentes/calendario';
import Recetas from './componentes/recetas';
import Compra from './componentes/compra';
import Perfil from './componentes/perfil';
import Login from './componentes/login';
import { haySesion, obtenerSesion } from './auth';
import './index.css';
import './layout-fixes.css';

function AppShell() {
  const location = useLocation();
  const [sesion, setSesion] = useState(obtenerSesion);
  const autenticado = Boolean(sesion?.email) || haySesion();
  const enLogin = location.pathname === '/login';

  const proteger = (elemento) => autenticado ? elemento : <Navigate to="/login" replace />;

  return (
    <div className="app-container">
      <main className="main-container">
        <Routes>
          <Route path="/login" element={<Login onAuth={setSesion} />} />
          <Route path="/" element={proteger(<Calendario />)} />
          <Route path="/recetas" element={proteger(<Recetas />)} />
          <Route path="/compra" element={proteger(<Compra />)} />
          <Route path="/perfil" element={proteger(<Perfil onLogout={() => setSesion(null)} />)} />
          <Route path="*" element={<Navigate to={autenticado ? '/' : '/login'} replace />} />
        </Routes>
      </main>

      {autenticado && !enLogin && <Footer />}
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}

export default App;
