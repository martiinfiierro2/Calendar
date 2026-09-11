import React from 'react';
import { DIAS_SEMANA, MESES } from '../../../config/appConfig';
import IconButton from '../../../shared/IconButton';
import CalendarHeader from '../CalendarHeader';

// Vista mensual con los días y un punto cuando hay alguna comida planificada.
export default function MonthView({ year, month, meals, onSelectDay, onBackYear, onChangeMonth, onAdd }) {
  const today = new Date();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const offset = (firstDay.getDay() + 6) % 7;
  const cells = [...Array(offset).fill(null), ...Array.from({ length: lastDay.getDate() }, (_, i) => i + 1)];

  const isToday = day => day === today.getDate()
    && month === today.getMonth()
    && year === today.getFullYear();

  const hasMeal = day => meals.some(meal => (
    meal.fecha === `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  ));

  return (
    <div className="vista-mes">
      <CalendarHeader label={year} onBack={onBackYear} onAdd={onAdd} />

      <div className="navegacion-dia">
        <IconButton icon="left" label="Mes anterior" onClick={() => onChangeMonth(-1)} />
        <div className="mes-nombre-grande">{MESES[month]}</div>
        <IconButton icon="right" label="Mes siguiente" onClick={() => onChangeMonth(1)} />
      </div>

      <div className="mes-semana-cabecera">
        {DIAS_SEMANA.map(day => <span className="dia-cabecera" key={day}>{day[0]}</span>)}
      </div>

      <div className="mes-grid">
        {cells.map((day, index) => (
          <button
            key={index}
            className="mes-celda"
            disabled={!day}
            onClick={() => day && onSelectDay(new Date(year, month, day))}
          >
            {day && (
              <>
                <span className={`mes-numero ${isToday(day) ? 'hoy-numero' : ''}`}>{day}</span>
                {hasMeal(day) && <span className="mes-punto" />}
              </>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
