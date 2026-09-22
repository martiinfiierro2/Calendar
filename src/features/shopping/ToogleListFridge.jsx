import React from 'react';
import Icon from '../../shared/Icon';

// Selector para cambiar entre la vista diaria y la semanal.
export default function ToogleListFridge({ view, onChange }) {
  return (
    <div className="selector-vista" role="group" aria-label="Cambiar vista del calendario">
      <button className={view === 'lista' ? 'activo' : ''} onClick={() => onChange('lista')}>
        <Icon name="calendar" size={16} />
        Lista Compra
      </button>
      <button className={view === 'nevera' ? 'activo' : ''} onClick={() => onChange('nevera')}>
        <Icon name="week" size={16} />
        Nevera
      </button>
    </div>
  );
}
