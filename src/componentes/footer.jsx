import React from 'react';
import { NavLink } from 'react-router-dom';

function Footer() {
  return (
    <footer className='footer'>
      <NavLink to="/">
        <span>📅</span>
      </NavLink>

      <NavLink to="/recetas">
        <span>🍳</span>
      </NavLink>

      <NavLink to="/compra">
        <span>🛒</span>
      </NavLink>

      <NavLink to="/perfil">
        <span>👤</span>
      </NavLink>
    </footer>
  );
}
export default Footer;