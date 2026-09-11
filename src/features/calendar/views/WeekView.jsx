import React from 'react';
import { DIAS_SEMANA, MESES } from '../../../config/appConfig';
import { diasDeSemana, fechaClave } from '../../../utils/dateUtils';
import Icon from '../../../shared/Icon';
import IconButton from '../../../shared/IconButton';
import CalendarHeader from '../CalendarHeader';
import ViewToggle from '../ViewToggle';

// Vista semanal compacta con los siete días siempre visibles.
export default function WeekView({ date, meals, onBackMonth, onChangeWeek, onChangeView, onSelectDay, onAdd, onEdit, onDelete }) {
  const days = diasDeSemana(date);
  const todayKey = fechaClave(new Date());
  const start = days[0];
  const end = days[6];

  const title = start.getMonth() === end.getMonth()
    ? `${start.getDate()} – ${end.getDate()} ${MESES[start.getMonth()].toLowerCase()}`
    : `${start.getDate()} ${MESES[start.getMonth()].slice(0, 3).toLowerCase()} – ${end.getDate()} ${MESES[end.getMonth()].slice(0, 3).toLowerCase()}`;

  return (
    <div className="vista-semana">
      <CalendarHeader
        label={MESES[date.getMonth()]}
        onBack={onBackMonth}
        onAdd={() => onAdd('14:00', date)}
      />
      <ViewToggle view="semana" onChange={onChangeView} />

      <div className="navegacion-semana">
        <IconButton icon="left" label="Semana anterior" onClick={() => onChangeWeek(-1)} />
        <div>
          <strong>{title}</strong>
          <small>{start.getFullYear()}</small>
        </div>
        <IconButton icon="right" label="Semana siguiente" onClick={() => onChangeWeek(1)} />
      </div>

      <div className="semana-scroll">
        <div className="semana-grid">
          {days.map((day, index) => {
            const key = fechaClave(day);
            const dayMeals = meals
              .filter(meal => meal.fecha === key)
              .sort((a, b) => a.hora.localeCompare(b.hora));

            return (
              <section className={`semana-dia ${key === todayKey ? 'semana-dia-hoy' : ''}`} key={key}>
                <button className="semana-dia-cabecera" onClick={() => onSelectDay(day)}>
                  <span>{DIAS_SEMANA[index]}</span>
                  <strong>{day.getDate()}</strong>
                </button>

                <div className="semana-dia-eventos">
                  {dayMeals.length === 0 && <span className="semana-vacio">Sin comidas</span>}
                  {dayMeals.map(meal => (
                    <div className={`semana-evento ${meal.tipo}`} key={meal.id}>
                      <div className="semana-evento-hora">{meal.hora}</div>
                      <div className="semana-evento-contenido">
                        <span className="semana-evento-icono">{meal.icono}</span>
                        <span className="semana-evento-nombre">{meal.nombre}</span>
                      </div>
                      <div className="semana-evento-acciones">
                        <IconButton icon="edit" label="Editar comida" size={14} onClick={() => onEdit(meal)} />
                        <IconButton icon="trash" label="Eliminar comida" size={14} onClick={() => onDelete(meal.id)} />
                      </div>
                    </div>
                  ))}
                </div>

                <button className="semana-anadir" onClick={() => onAdd('14:00', day)}>
                  <Icon name="plus" size={15} />
                  Añadir
                </button>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
