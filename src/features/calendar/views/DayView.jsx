import React, { useEffect, useRef, useState } from 'react';
import { MESES, TIPOS_COMIDA } from '../../../config/appConfig';
import Icon from '../../../shared/Icon';
import IconButton from '../../../shared/IconButton';
import CalendarHeader from '../CalendarHeader';
import ViewToggle from '../ViewToggle';

// Vista diaria con las 24 horas y las comidas planificadas.
export default function DayView({ date, hours, meals, onBackMonth, onChangeDay, onAdd, onEdit, onDelete, onChangeView }) {
  const sixAmRef = useRef(null);
  const [openActions, setOpenActions] = useState(null);

  useEffect(() => {
    sixAmRef.current?.scrollIntoView({ block: 'start' });
  }, [date]);

  const mealAt = hour => meals.find(meal => meal.hora === hour);

  return (
    <div className="pantalla-completa-dia">
      <CalendarHeader
        label={MESES[date.getMonth()]}
        onBack={onBackMonth}
        onAdd={() => onAdd('14:00', date)}
      />
      <ViewToggle view="dia" onChange={onChangeView} />

      <div className="tarjeta-fecha-grande">
        <div className="navegacion-dia">
          <IconButton icon="left" label="Día anterior" onClick={() => onChangeDay(-1)} />
          <span className="fecha">
            {date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'long' })}
          </span>
          <IconButton icon="right" label="Día siguiente" onClick={() => onChangeDay(1)} />
        </div>
      </div>

      <div className="contenido-dia-completo">
        <div className="bloque-horas">
          <div className="timeline-horas">
            {hours.map(hour => {
              const meal = mealAt(hour);

              return (
                <div className="hora-fila" key={hour} ref={hour === '06:00' ? sixAmRef : null}>
                  <div className="hora-eje">{hour}</div>

                  {meal ? (
                    <div className="hora-contenido">
                      <button
                        className={`tarjeta-evento ${meal.tipo}`}
                        onClick={() => setOpenActions(openActions === meal.id ? null : meal.id)}
                      >
                        <span className="evento-info">
                          <span>{meal.icono}</span>
                          <span>
                            <b>{TIPOS_COMIDA.find(type => type.valor === meal.tipo)?.nombre || 'Comida'}</b>
                            <small>{meal.nombre}</small>
                          </span>
                        </span>
                      </button>

                      {openActions === meal.id && (
                        <div className="evento-acciones">
                          <IconButton icon="edit" label="Editar comida" size={16} onClick={() => { setOpenActions(null); onEdit(meal); }} />
                          <IconButton icon="trash" label="Eliminar comida" size={16} onClick={() => { setOpenActions(null); onDelete(meal.id); }} />
                        </div>
                      )}
                    </div>
                  ) : (
                    <button className="hora-contenido boton-anadir-comida" onClick={() => onAdd(hour, date)}>
                      <Icon name="plus" size={15} />
                      <span>Añadir</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
