import React, { useState, useRef, useEffect } from 'react';

export default function Calendario() {
  const hoy = new Date();
  const [fecha, setFecha] = useState(new Date());
  const [vista, setVista] = useState('dia');
  const [añoVisible, setAñoVisible] = useState(hoy.getFullYear());
  const [mesVisible, setMesVisible] = useState(hoy.getMonth());
  const [mostrarMenuAnadir, setMostrarMenuAnadir] = useState(false);

  const comidasFijas = {
    "08:00": { tipo: "desayuno", icono: "☕", titulo: "Desayuno", detalle: "Tostadas con aguacate y café" },
    "11:00": { tipo: "almuerzo", icono: "🥪", titulo: "Almuerzo", detalle: "Bocadillo de pavo y nueces" },
    "14:00": { tipo: "comida", icono: "🍽️", titulo: "Comida", detalle: "Pechuga de pollo con arroz" },
    "17:00": { tipo: "merienda", icono: "🍌", titulo: "Merienda", detalle: "Plátano y batido de proteínas" },
    "21:00": { tipo: "cena", icono: "🐟", titulo: "Cena", detalle: "Salmón a la plancha con ensalada" }
  };

  const horasDelDia = [];
  for (let i = 0; i <= 23; i++) horasDelDia.push(`${i.toString().padStart(2, '0')}:00`);

  const irAAnyo = (anyo) => { setAñoVisible(anyo); setVista('anyo'); };
  const irAMes = (anyo, mes) => { setAñoVisible(anyo); setMesVisible(mes); setVista('mes'); };
  const irADia = (nuevaFecha) => { setFecha(nuevaFecha); setAñoVisible(nuevaFecha.getFullYear()); setMesVisible(nuevaFecha.getMonth()); setVista('dia'); };
  const cambiarDia = (cantidad) => { const nuevaFecha = new Date(fecha); nuevaFecha.setDate(nuevaFecha.getDate() + cantidad); irADia(nuevaFecha); };
  const abrirMenuAnadir = () => setMostrarMenuAnadir(true);
  const cerrarMenuAnadir = () => setMostrarMenuAnadir(false);

  return (
    <div className="contenedor-calendario">
      {vista === 'anyo' && <VistaAnyo año={añoVisible} alSeleccionarMes={(mes) => irAMes(añoVisible, mes)} alAnadir={abrirMenuAnadir} />}
      {vista === 'mes' && <VistaMes año={añoVisible} mes={mesVisible} comidasFijas={comidasFijas} alSeleccionarDia={irADia} alVolverAlAnyo={() => irAAnyo(añoVisible)} alAnadir={abrirMenuAnadir} />}
      {vista === 'dia' && <TablaDia fecha={fecha} alVolverAlMes={() => irAMes(fecha.getFullYear(), fecha.getMonth())} alCambiarDia={cambiarDia} horasDelDia={horasDelDia} comidasFijas={comidasFijas} alAnadir={abrirMenuAnadir} />}

      {mostrarMenuAnadir && (
        <>
          <div className="menu-anadir-overlay" onClick={cerrarMenuAnadir} />
          <div className="menu-anadir">
            <div className="menu-anadir-indicador" />
            <button className="menu-anadir-opcion" onClick={cerrarMenuAnadir}>🍽️ Añadir comida</button>
            <button className="menu-anadir-cancelar" onClick={cerrarMenuAnadir}>Cancelar</button>
          </div>
        </>
      )}
    </div>
  );
}

function VistaAnyo({ año, alSeleccionarMes, alAnadir }) {
  const hoy = new Date();
  const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  return (
    <div className="vista-anyo">
      <div className="cabecera-calendario"><h2></h2><div className="cabecera-dia"><button className="btnSinEstilo">🍳</button><button className="btnSinEstilo" onClick={alAnadir}>➕</button></div></div>
      <div className="mes-nombre-grande">{año}</div>
      <div className="anyo-grid">
        {MESES.map((nombreMes, i) => {
          const primerDia = new Date(año, i, 1); const totalDias = new Date(año, i + 1, 0).getDate(); const offset = (primerDia.getDay() + 6) % 7;
          const celdas = []; for (let x = 0; x < offset; x++) celdas.push(null); for (let d = 1; d <= totalDias; d++) celdas.push(d);
          return <div key={i} className="anyo-mes-card" onClick={() => alSeleccionarMes(i)}><div className="anyo-mes-nombre">{nombreMes}</div><div className="anyo-mini-grid">{celdas.map((d, j) => { const esHoy = d === hoy.getDate() && i === hoy.getMonth() && año === hoy.getFullYear(); return <span key={j} className={`anyo-mini-celda ${esHoy ? 'hoy-mini' : ''}`}>{d ?? ''}</span>; })}</div></div>;
        })}
      </div>
    </div>
  );
}

function VistaMes({ año, mes, comidasFijas, alSeleccionarDia, alVolverAlAnyo, alAnadir }) {
  const hoy = new Date();
  const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const diasSemana = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const primerDia = new Date(año, mes, 1); const ultimoDia = new Date(año, mes + 1, 0); const offsetInicio = (primerDia.getDay() + 6) % 7; const totalDias = ultimoDia.getDate();
  const celdas = []; for (let i = 0; i < offsetInicio; i++) celdas.push(null); for (let d = 1; d <= totalDias; d++) celdas.push(d);
  const esHoy = (d) => d === hoy.getDate() && mes === hoy.getMonth() && año === hoy.getFullYear();
  return (
    <div className="vista-mes">
      <div className="cabecera-calendario"><button className="botonAnyo" onClick={alVolverAlAnyo}>{año}</button><div className="cabecera-dia"><button className="btnSinEstilo">🍳</button><button className="btnSinEstilo" onClick={alAnadir}>➕</button></div></div>
      <div className="mes-nombre-grande">{MESES[mes]}</div>
      <div className="mes-semana-cabecera">{diasSemana.map(d => <span className="dia-cabecera" key={d}>{d}</span>)}</div>
      <div className="mes-grid">{celdas.map((d, i) => <div key={i} className="mes-celda" onClick={() => d && alSeleccionarDia(new Date(año, mes, d))}>{d && <><span className={`mes-numero ${esHoy(d) ? 'hoy-numero' : ''}`}>{d}</span>{Object.keys(comidasFijas).length > 0 && <span className="mes-punto" />}</>}</div>)}</div>
    </div>
  );
}

function TablaDia({ fecha, alVolverAlMes, alCambiarDia, horasDelDia, comidasFijas, alAnadir }) {
  const ref6h = useRef(null);
  const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  useEffect(() => { if (ref6h.current) ref6h.current.scrollIntoView({ block: 'start' }); }, [fecha]);
  return (
    <div className="pantalla-completa-dia">
      <div className="cabecera-calendario"><button className="botonMes" onClick={alVolverAlMes}>{MESES[fecha.getMonth()]}</button><div className="cabecera-dia"><button className="btnSinEstilo">🔍</button><button className="btnSinEstilo" onClick={alAnadir}>➕</button></div></div>
      <div className="tarjeta-fecha-grande"><div className="navegacion-dia"><button className="flecha-dia" onClick={() => alCambiarDia(-1)} aria-label="Día anterior">‹</button><span className="fecha">{fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</span><button className="flecha-dia" onClick={() => alCambiarDia(1)} aria-label="Día siguiente">›</button></div></div>
      <div className="contenido-dia-completo"><div className="bloque-horas"><div className="timeline-horas">{horasDelDia.map((hora) => { const comida = comidasFijas[hora]; return <div className="hora-fila" key={hora} ref={hora === '06:00' ? ref6h : null}><div className="hora-eje">{hora}</div><div className="hora-contenido">{comida ? <div className={`tarjeta-evento ${comida.tipo}`}><span className="evento-info">{comida.icono} <b>{comida.titulo}:</b> {comida.detalle}</span></div> : <div className="tarjeta-evento">+ Añadir comida</div>}</div></div>; })}</div></div></div>
    </div>
  );
}
