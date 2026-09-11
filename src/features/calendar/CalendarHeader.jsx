import React from 'react';
import IconButton from '../../shared/IconButton';

// Cabecera común de las vistas de año, mes, semana y día.
export default function CalendarHeader({ label, onBack, onAdd }) {
  return (
    <div className="cabecera-calendario">
      {onBack ? (
        <button className="boton-contexto" onClick={onBack}>{label}</button>
      ) : (
        <span />
      )}

      <IconButton
        icon="plus"
        label="Añadir comida"
        onClick={onAdd}
        className="boton-anadir-principal"
      />
    </div>
  );
}
