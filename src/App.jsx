import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Footer from './componentes/footer';
import Calendario from './componentes/calendario';
import Recetas from './componentes/recetas';
import './index.css';
import './layout-fixes.css';

// Pantallas provisionales
const RecetasScreen = () => <div className="screen-content"><h2>🍳 Mis Recetas</h2></div>;
const CompraScreen = () => <div className="screen-content"><h2>🛒 Lista de la Compra</h2></div>;
const PerfilScreen = () => <div className="screen-content"><h2>👤 Mi Perfil</h2></div>;

function App() {
  return (
    <Router>
      <div className="app-container">
        
        <main className="main-container">
          <Routes>
            <Route path="/" element={<Calendario />} />
            <Route path="/recetas" element={<Recetas />} />
            <Route path="/compra" element={<CompraScreen />} />
            <Route path="/perfil" element={<PerfilScreen />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

export default App;