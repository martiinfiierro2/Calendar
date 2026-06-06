import React, { useState, useRef, useEffect } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

export default function Calendario() {
  const [fecha, setFecha] = useState(new Date());
  const [vistaCompletaAbierta, setVistaCompletaAbierta] = useState(true); // ← false para ver el mes primero

  const alCambiarFecha = (nuevaFecha) => {
    setFecha(nuevaFecha);
    setVistaCompletaAbierta(true);
  };

  const comidasFijas = {
    "08:00": { tipo: "desayuno", icono: "☕", titulo: "Desayuno", detalle: "Tostadas con aguacate y café" },
    "11:00": { tipo: "almuerzo", icono: "🥪", titulo: "Almuerzo", detalle: "Bocadillo de pavo y nueces" },
    "14:00": { tipo: "comida", icono: "🍽️", titulo: "Comida", detalle: "Pechuga de pollo con arroz" },
    "17:00": { tipo: "merienda", icono: "🍌", titulo: "Merienda", detalle: "Plátano y batido de proteínas" },
    "21:00": { tipo: "cena", icono: "🐟", titulo: "Cena", detalle: "Salmón a la plancha con ensalada" }
  };

  const horasDelDia = [];
  for (let i = 0; i <= 23; i++) {
    horasDelDia.push(`${i.toString().padStart(2, '0')}:00`);
  }

  return (
    <div className="contenedor-calendario">
      {vistaCompletaAbierta ? (
        <TablaDia
          fecha={fecha}
          alCerrar={() => setVistaCompletaAbierta(false)}
          horasDelDia={horasDelDia}
          comidasFijas={comidasFijas}
        />
      ) : (
        <VistaMes
          fecha={fecha}
          comidasFijas={comidasFijas}
          alSeleccionarDia={alCambiarFecha}
        />
      )}
    </div>
  );
}

function VistaMes({ fecha, comidasFijas, alSeleccionarDia }) {
  const [mesVisible, setMesVisible] = useState(new Date(fecha.getFullYear(), fecha.getMonth(), 1));

  const hoy = new Date();
  const diasSemana = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  const año = mesVisible.getFullYear();
  const mes = mesVisible.getMonth();

  const primerDia = new Date(año, mes, 1);
  const ultimoDia = new Date(año, mes + 1, 0);
  const offsetInicio = (primerDia.getDay() + 6) % 7;
  const totalDias = ultimoDia.getDate();

  const celdas = [];
  for (let i = 0; i < offsetInicio; i++) celdas.push(null);
  for (let d = 1; d <= totalDias; d++) celdas.push(d);

  const nombreMes = mesVisible.toLocaleDateString('es-ES', { month: 'long' });
  const esHoy = (d) => d === hoy.getDate() && mes === hoy.getMonth() && año === hoy.getFullYear();

  return (
    <div className="vista-mes">

      <div className="cabecera-calendario">
        <button className="botonAnyo">
          {fecha.toLocaleDateString('es-ES', { month: 'long' }).replace(/^./, str => str.toUpperCase())}
        </button>
        <div className="cabecera-dia">
          <button className='btnSinEstilo'>🍳</button>
          <button className='btnSinEstilo'>➕</button>
        </div>
      </div>

      <div className="mes-nombre-grande">
        {nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)} {año}
      </div>

      <div className="mes-semana-cabecera">
        {diasSemana.map(d => (
          <span className="dia-cabecera" key={d}>{d}</span>
        ))}
      </div>

      <div className="mes-grid">
        {celdas.map((d, i) => (
          <div
            key={i}
            className="mes-celda"
            onClick={() => d && alSeleccionarDia(new Date(año, mes, d))}
          >
            {d && (
              <>
                <span className={`mes-numero ${esHoy(d) ? 'hoy-numero' : ''}`}>
                  {d}
                </span>
                {Object.keys(comidasFijas).length > 0 && (
                  <span className="mes-punto" />
                )}
              </>
            )}
          </div>
        ))}
      </div>

    </div>
  );
}

function TablaDia({ fecha, alCerrar, horasDelDia, comidasFijas }) {
  const ref6h = useRef(null);

  useEffect(() => {
    if (ref6h.current) {
      ref6h.current.scrollIntoView({ block: 'start' });
    }
  }, [fecha]);

  return (
    <div className="pantalla-completa-dia">
      <div className="cabecera-calendario">
        <button className="botonMes" onClick={alCerrar}>
          {fecha.toLocaleDateString('es-ES', { month: 'long' }).replace(/^./, str => str.toUpperCase())}
        </button>
        <div className="cabecera-dia">
          <button className='btnSinEstilo'>🍳</button>
          <button className='btnSinEstilo'>➕</button>
        </div>
      </div>

      <div className="tarjeta-fecha-grande">
        <span className="fecha">
          {fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
        </span>
      </div>

      <div className="contenido-dia-completo">
        <div className="bloque-horas">
          <div className="timeline-horas">
            {horasDelDia.map((hora) => {
              const comida = comidasFijas[hora];
              return (
                <div
                  className="hora-fila"
                  key={hora}
                  ref={hora === '06:00' ? ref6h : null}
                >
                  <div className="hora-eje">{hora}</div>
                  <div className="hora-contenido">
                    {comida ? (
                      <div className={`tarjeta-evento ${comida.tipo}`}>
                        <span className="evento-info">
                          {comida.icono} <b>{comida.titulo}:</b> {comida.detalle}
                        </span>
                      </div>
                    ) : (
                      <div className="tarjeta-evento">
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