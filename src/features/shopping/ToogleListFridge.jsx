import React from 'react';
import Icon from '../../shared/Icon';

// Selector para cambiar entre la vista diaria y la semanal.
export default function ToogleListFridge({ view, onChange }) {
  return (
    <div className="selector-vista" role="group" aria-label="Cambiar vista de despensa">
      <button className={view === 'lista' ? 'activo' : ''} aria-pressed={view === 'lista'} onClick={() => onChange('lista')}>
        <Icon name="cart" size={16} />
        Lista de compra
      </button>
      <button className={view === 'nevera' ? 'activo' : ''} aria-pressed={view === 'nevera'} onClick={() => onChange('nevera')}>
        <Icon name="fridge" size={16} />
        Nevera
      </button>
    </div>
  );
}
