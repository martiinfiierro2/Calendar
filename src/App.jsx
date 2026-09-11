import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Footer from './componentes/footer';
import Calendario from './componentes/calendario';
import Recetas from './componentes/recetas';
import Compra from './componentes/compra';
import Perfil from './componentes/perfil';
import './index.css';
import './layout-fixes.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <main className="main-container">
          <Routes>
            <Route path="/" element={<Calendario />} />
            <Route path="/recetas" element={<Recetas />} />
            <Route path="/compra" element={<Compra />} />
            <Route path="/perfil" element={<Perfil />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

export default App;