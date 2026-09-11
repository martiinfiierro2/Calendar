import React from 'react';
import { NavLink } from 'react-router-dom';
import Icon from '../shared/Icon';

// Navegación principal que permanece visible dentro de la sesión.
export default function Footer() {
  return (
    <footer className="footer">
      <NavLink to="/" end aria-label="Calendario">
        <Icon name="calendar" />
        <span>Calendario</span>
      </NavLink>

      <NavLink to="/recetas" aria-label="Recetas">
        <Icon name="book" />
        <span>Recetas</span>
      </NavLink>

      <NavLink to="/compra" aria-label="Compra">
        <Icon name="cart" />
        <span>Compra</span>
      </NavLink>

      <NavLink to="/perfil" aria-label="Perfil">
        <Icon name="user" />
        <span>Perfil</span>
      </NavLink>
    </footer>
  );
}
