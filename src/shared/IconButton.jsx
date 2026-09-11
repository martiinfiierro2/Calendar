import React from 'react';
import Icon from './Icon';

// Botón pequeño reutilizado en calendario, formularios y cabeceras.
export default function IconButton({ icon, label, onClick, className = '', size = 20 }) {
  return (
    <button
      type="button"
      className={`boton-icono ${className}`}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      <Icon name={icon} size={size} />
    </button>
  );
}
