import React, { useState } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import Footer from './componentes/footer';
import Calendario from './componentes/calendario';
import Recetas, { recetasData } from './componentes/recetas';
import Compra from './componentes/compra';
import Perfil from './componentes/perfil';
import Login from './componentes/login';
import { haySesion, obtenerSesion } from './auth';
import { activarStoragePorUsuario } from './storageScope';
import './index.css';
import './layout-fixes.css';

activarStoragePorUsuario();

const RECETAS_INICIALES = recetasData.map(receta => ({ ...receta, ingredientes: [...receta.ingredientes], pasos: [...receta.pasos] }));

function sincronizarRecetasSesion() {
  try {
    const guardadasRaw = localStorage.getItem('calendar_recetas');
    const guardadas = guardadasRaw === null ? RECETAS_INICIALES : JSON.parse(guardadasRaw);
    if (!Array.isArray(guardadas)) return;
    recetasData.splice(0, recetasData.length, ...guardadas.map(receta => ({ ...receta })));
  } catch {
    recetasData.splice(0, recetasData.length, ...RECETAS_INICIALES.map(receta => ({ ...receta })));
  }
}

function AppShell() {
  const location = useLocation();
  const [sesion, setSesion] = useState(obtenerSesion);
  const autenticado = Boolean(sesion?.email) || haySesion();
  const enLogin = location.pathname === '/login';

  if (autenticado) sincronizarRecetasSesion();

  const proteger = (elemento) => autenticado ? elemento : <Navigate to="/login" replace />;

  const actualizarSesion = (nuevaSesion) => {
    setSesion(nuevaSesion);
    if (nuevaSesion) sincronizarRecetasSesion();
  };

  return (
    <div className="app-container">
      <main className="main-container">
        <Routes>
          <Route path="/login" element={autenticado ? <Navigate to="/" replace /> : <Login onAuth={actualizarSesion} />} />
          <Route path="/" element={proteger(<Calendario />)} />
          <Route path="/recetas" element={proteger(<Recetas />)} />
          <Route path="/compra" element={proteger(<Compra />)} />
          <Route path="/perfil" element={proteger(<Perfil onLogout={() => actualizarSesion(null)} />)} />
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
