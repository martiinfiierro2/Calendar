import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

export default function Calendario() {
  const [fecha, setFecha] = useState(new Date());
  const [vistaCompletaAbierta, setVistaCompletaAbierta] = useState(true);

  const alCambiarFecha = (nuevaFecha) => {
    setFecha(nuevaFecha);
    setVistaCompletaAbierta(true);
  };

  // Base de datos provisional de comidas
  const comidasFijas = {
    "08:00": { tipo: "desayuno", icono: "☕", titulo: "Desayuno", detalle: "Tostadas con aguacate y café" },
    "11:00": { tipo: "almuerzo", icono: "🥪", titulo: "Almuerzo", detalle: "Bocadillo de pavo y nueces" },
    "14:00": { tipo: "comida", icono: "🍽️", titulo: "Comida", detalle: "Pechuga de pollo con arroz" },
    "17:00": { tipo: "merienda", icono: "🍌", titulo: "Merienda", detalle: "Plátano y batido de proteínas" },
    "21:00": { tipo: "cena", icono: "🐟", titulo: "Cena", detalle: "Salmón a la plancha con ensalada" }
  };

  // Generamos el rango compacto de horas desde las 06:00 hasta las 22:00
  const horasDelDia = [];
  for (let i = 0; i <= 23; i++) {
    horasDelDia.push(`${i.toString().padStart(2, '0')}:00`);
  }

  return (
    <div className="contenedor-calendario">
        <TablaDia 
          fecha={fecha} 
          alCerrar={() => setVistaCompletaAbierta(false)} 
          horasDelDia={horasDelDia}
          comidasFijas={comidasFijas}
        />
    </div>
  );
}

function TablaDia({ fecha, alCerrar, horasDelDia, comidasFijas }) {
  return (
    <div className="pantalla-completa-dia">
      <div className="cabecera-dia">
        <button className="boton-volver" onClick={alCerrar}>
          ⬅️ Ver Mes Completo
        </button>
      </div>

      <div className="contenido-dia-completo">
        <div className="tarjeta-fecha-grande">
          <span className="numero-dia">{fecha.getDate()}</span>
          <span className="texto-mes">
            {fecha.toLocaleDateString('es-ES', { weekday: 'long', month: 'long' })}
          </span>
        </div>

        <div className="bloque-horas">
          
            <div className="timeline-horas">
              {horasDelDia.map((hora) => {
                const comida = comidasFijas[hora];

                return (
                  <div className="hora-fila" key={hora}>
                    <div className="hora-eje">{hora}</div>
                    <div className="hora-contenido">
                      {comida ? (
                        <div className={`tarjeta-evento ${comida.tipo}`}>
                          <span className="evento-info">
                            {comida.icono} <b>{comida.titulo}:</b> {comida.detalle}
                          </span>
                        </div>
                      ) : (
                        <div className="evento-vacio">
                          + Añadir nota o comida
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
        </div>
      </div>
    </div>
  );
}