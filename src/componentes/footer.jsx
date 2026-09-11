import React from 'react';
import { NavLink } from 'react-router-dom';

function IconoFooter({ nombre }) {
  const props = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true
  };

  const iconos = {
    calendario: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4" /><path d="M8 3v4" /><path d="M3 10h18" /><path d="M8 14h.01" /><path d="M12 14h.01" /><path d="M16 14h.01" /></>,
    recetas: <><path d="M6 3v7" /><path d="M9 3v7" /><path d="M3 3v5a2 2 0 0 0 2 2h5a2 2 0 0 0 2-2V3" /><path d="M7.5 10v11" /><path d="M17 3v18" /><path d="M17 3c2.2 1.2 3.5 3.4 3.5 6H17" /></>,
    compra: <><circle cx="9" cy="20" r="1" /><circle cx="19" cy="20" r="1" /><path d="M3 4h2l2.6 10.4a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.6L21 8H7" /></>,
    perfil: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>
  };

  return <svg {...props}>{iconos[nombre]}</svg>;
}

function Footer() {
  return (
    <footer className="footer">
      <NavLink to="/" end aria-label="Calendario">
        <IconoFooter nombre="calendario" />
        <span>Calendario</span>
      </NavLink>

      <NavLink to="/recetas" aria-label="Recetas">
        <IconoFooter nombre="recetas" />
        <span>Recetas</span>
      </NavLink>

      <NavLink to="/compra" aria-label="Compra">
        <IconoFooter nombre="compra" />
        <span>Compra</span>
      </NavLink>

      <NavLink to="/perfil" aria-label="Perfil">
        <IconoFooter nombre="perfil" />
        <span>Perfil</span>
      </NavLink>
    </footer>
  );
}

export default Footer;
