import React from 'react';
import { MESES } from '../../../config/appConfig';
import { fechaDesdeClave } from '../../../utils/dateUtils';
import IconButton from '../../../shared/IconButton';
import CalendarHeader from '../CalendarHeader';

// Vista anual: muestra los 12 meses y marca los que tienen comidas.
export default function YearView({ year, meals, onSelectMonth, onChangeYear, onAdd }) {
  const today = new Date();

  return (
    <div className="vista-anyo">
      <CalendarHeader onAdd={onAdd} />

      <div className="navegacion-dia">
        <IconButton icon="left" label="Año anterior" onClick={() => onChangeYear(-1)} />
        <div className="mes-nombre-grande">{year}</div>
        <IconButton icon="right" label="Año siguiente" onClick={() => onChangeYear(1)} />
      </div>

      <div className="anyo-grid">
        {MESES.map((monthName, monthIndex) => {
          const firstDay = new Date(year, monthIndex, 1);
          const totalDays = new Date(year, monthIndex + 1, 0).getDate();
          const offset = (firstDay.getDay() + 6) % 7;
          const cells = [...Array(offset).fill(null), ...Array.from({ length: totalDays }, (_, i) => i + 1)];
          const hasMeals = meals.some(meal => {
            const date = fechaDesdeClave(meal.fecha);
            return date.getFullYear() === year && date.getMonth() === monthIndex;
          });

          return (
            <button key={monthName} className="anyo-mes-card" onClick={() => onSelectMonth(monthIndex)}>
              <span className="anyo-mes-nombre">
                {monthName}
                {hasMeals && <span className="mes-punto" />}
              </span>
              <span className="anyo-mini-grid">
                {cells.map((day, index) => {
                  const isToday = day === today.getDate()
                    && monthIndex === today.getMonth()
                    && year === today.getFullYear();
                  return (
                    <span key={`${monthName}-${index}`} className={`anyo-mini-celda ${isToday ? 'hoy-mini' : ''}`}>
                      {day ?? ''}
                    </span>
                  );
                })}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
