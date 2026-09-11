import React from 'react';
import Icon from '../../shared/Icon';

// Selector para cambiar entre la vista diaria y la semanal.
export default function ViewToggle({ view, onChange }) {
  return (
    <div className="selector-vista" role="group" aria-label="Cambiar vista del calendario">
      <button className={view === 'dia' ? 'activo' : ''} onClick={() => onChange('dia')}>
        <Icon name="calendar" size={16} />
        Día
      </button>
      <button className={view === 'semana' ? 'activo' : ''} onClick={() => onChange('semana')}>
        <Icon name="week" size={16} />
        Semana
      </button>
    </div>
  );
}
