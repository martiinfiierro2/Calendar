import React, { useState, useRef, useEffect } from 'react';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

const comidasIniciales = {
  '08:00': { tipo: 'desayuno', icono: '☕', titulo: 'Desayuno', detalle: 'Tostadas con aguacate y café' },
  '11:00': { tipo: 'almuerzo', icono: '🥪', titulo: 'Almuerzo', detalle: 'Bocadillo de pavo y nueces' },
  '14:00': { tipo: 'comida', icono: '🍽️', titulo: 'Comida', detalle: 'Pechuga de pollo con arroz' },
  '17:00': { tipo: 'merienda', icono: '🍌', titulo: 'Merienda', detalle: 'Plátano y batido de proteínas' },
  '21:00': { tipo: 'cena', icono: '🐟', titulo: 'Cena', detalle: 'Salmón a la plancha con ensalada' }
};

const horasDelDia = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
const claveFecha = (fecha) => `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
const esMismaFecha = (a, b) => claveFecha(a) === claveFecha(b);

export default function Calendario() {
  const hoy = new Date();
  const [fecha, setFecha] = useState(new Date());
  const [vista, setVista] = useState('dia');
  const [añoVisible, setAñoVisible] = useState(hoy.getFullYear());
  const [mesVisible, setMesVisible] = useState(hoy.getMonth());
  const [eventos, setEventos] = useState({ [claveFecha(hoy)]: comidasIniciales });

  const irAAnyo = (anyo) => { setAñoVisible(anyo); setVista('anyo'); };
  const irAMes = (anyo, mes) => { setAñoVisible(anyo); setMesVisible(mes); setVista('mes'); };
  const irADia = (nuevaFecha) => { setFecha(nuevaFecha); setAñoVisible(nuevaFecha.getFullYear()); setMesVisible(nuevaFecha.getMonth()); setVista('dia'); };
  const cambiarDia = (cantidad) => { const nuevaFecha = new Date(fecha); nuevaFecha.setDate(nuevaFecha.getDate() + cantidad); irADia(nuevaFecha); };
  const cambiarMes = (cantidad) => { const nuevaFecha = new Date(añoVisible, mesVisible + cantidad, 1); irAMes(nuevaFecha.getFullYear(), nuevaFecha.getMonth()); };
  const irAHoy = () => irADia(new Date());
  const obtenerEventosDia = (fechaConsulta) => eventos[claveFecha(fechaConsulta)] || {};

  const guardarEvento = (fechaEvento, hora, evento) => {
    const clave = claveFecha(fechaEvento);
    setEventos((actuales) => ({ ...actuales, [clave]: { ...(actuales[clave] || {}), [hora]: evento } }));
  };

  const eliminarEvento = (fechaEvento, hora) => {
    const clave = claveFecha(fechaEvento);
    setEventos((actuales) => { const dia = { ...(actuales[clave] || {}) }; delete dia[hora]; return { ...actuales, [clave]: dia }; });
  };

  return <div className="contenedor-calendario">
    {vista === 'anyo' && <VistaAnyo año={añoVisible} alSeleccionarMes={(mes) => irAMes(añoVisible, mes)} alIrAHoy={irAHoy} alAñadir={() => irADia(new Date())} />}
    {vista === 'mes' && <VistaMes año={añoVisible} mes={mesVisible} eventos={eventos} alSeleccionarDia={irADia} alVolverAlAnyo={() => irAAnyo(añoVisible)} alCambiarMes={cambiarMes} alIrAHoy={irAHoy} alAñadir={() => irADia(new Date(añoVisible, mesVisible, 1))} />}
    {vista === 'dia' && <TablaDia fecha={fecha} eventos={obtenerEventosDia(fecha)} alVolverAlMes={() => irAMes(fecha.getFullYear(), fecha.getMonth())} alVolverAlAnyo={() => irAAnyo(fecha.getFullYear())} alCambiarDia={cambiarDia} alIrAHoy={irAHoy} esHoy={esMismaFecha(fecha, hoy)} alGuardarEvento={guardarEvento} alEliminarEvento={eliminarEvento} />}
  </div>;
}

function VistaAnyo({ año, alSeleccionarMes, alIrAHoy, alAñadir }) {
  const hoy = new Date();
  return <div className="vista-anyo">
    <div className="cabecera-calendario">
      <button className="boton-año" onClick={alIrAHoy}>Hoy</button>
      <div className="cabecera-dia"><button className="btnSinEstilo" onClick={alIrAHoy} aria-label="Ir a hoy">📅</button><button className="btnSinEstilo" onClick={alAñadir} aria-label="Añadir evento">➕</button></div>
    </div>
    <div className="mes-nombre-grande">{año}</div>
    <div className="anyo-grid">
      {MESES.map((nombreMes, i) => {
        const primerDia = new Date(año, i, 1); const totalDias = new Date(año, i + 1, 0).getDate(); const offset = (primerDia.getDay() + 6) % 7; const celdas = [];
        for (let x = 0; x < offset; x++) celdas.push(null); for (let d = 1; d <= totalDias; d++) celdas.push(d);
        return <button key={i} className="anyo-mes-card" onClick={() => alSeleccionarMes(i)} aria-label={`Abrir ${nombreMes} de ${año}`}>
          <div className="anyo-mes-nombre">{nombreMes}</div><div className="anyo-mini-grid">{celdas.map((d, j) => { const esHoy = d === hoy.getDate() && i === hoy.getMonth() && año === hoy.getFullYear(); return <span key={j} className={`anyo-mini-celda ${esHoy ? 'hoy-mini' : ''}`}>{d ?? ''}</span>; })}</div>
        </button>;
      })}
    </div>
  </div>;
}

function VistaMes({ año, mes, eventos, alSeleccionarDia, alVolverAlAnyo, alCambiarMes, alIrAHoy, alAñadir }) {
  const hoy = new Date(); const diasSemana = ['L', 'M', 'X', 'J', 'V', 'S', 'D']; const primerDia = new Date(año, mes, 1); const totalDias = new Date(año, mes + 1, 0).getDate(); const offsetInicio = (primerDia.getDay() + 6) % 7; const celdas = [];
  for (let i = 0; i < offsetInicio; i++) celdas.push(null); for (let d = 1; d <= totalDias; d++) celdas.push(d);
  const esHoy = (d) => d === hoy.getDate() && mes === hoy.getMonth() && año === hoy.getFullYear();
  return <div className="vista-mes">
    <div className="cabecera-calendario"><button className="botonAnyo" onClick={alVolverAlAnyo}>{año}</button><div className="cabecera-dia"><button className="btnSinEstilo" onClick={alIrAHoy} aria-label="Ir a hoy">📅</button><button className="btnSinEstilo" onClick={alAñadir} aria-label="Añadir evento">➕</button></div></div>
    <div className="navegacion-periodo"><button onClick={() => alCambiarMes(-1)} aria-label="Mes anterior">‹</button><div className="mes-nombre-grande">{MESES[mes]}</div><button onClick={() => alCambiarMes(1)} aria-label="Mes siguiente">›</button></div>
    <button className="boton-hoy" onClick={alIrAHoy}>Hoy</button>
    <div className="mes-semana-cabecera">{diasSemana.map(d => <span className="dia-cabecera" key={d}>{d}</span>)}</div>
    <div className="mes-grid">{celdas.map((d, i) => <button key={i} className="mes-celda" disabled={!d} onClick={() => d && alSeleccionarDia(new Date(año, mes, d))} aria-label={d ? `Abrir ${d} de ${MESES[mes]}` : undefined}>{d && <><span className={`mes-numero ${esHoy(d) ? 'hoy-numero' : ''}`}>{d}</span>{Object.keys(eventos[claveFecha(new Date(año, mes, d))] || {}).length > 0 && <span className="mes-punto" />}</>}</button>)}</div>
  </div>;
}

function TablaDia({ fecha, eventos, alVolverAlMes, alVolverAlAnyo, alCambiarDia, alIrAHoy, esHoy, alGuardarEvento, alEliminarEvento }) {
  const ref6h = useRef(null); const [buscando, setBuscando] = useState(false); const [textoBusqueda, setTextoBusqueda] = useState(''); const [editor, setEditor] = useState(null);
  useEffect(() => { if (ref6h.current) ref6h.current.scrollIntoView({ block: 'start' }); }, [fecha]);
  const nombreMes = MESES[fecha.getMonth()];
  const resultados = horasDelDia.filter((hora) => { const evento = eventos[hora]; if (!evento) return false; return `${evento.titulo} ${evento.detalle}`.toLowerCase().includes(textoBusqueda.toLowerCase()); });
  const abrirEditor = (hora, evento = null) => setEditor({ hora, tipo: evento?.tipo || 'comida', icono: evento?.icono || '🍽️', titulo: evento?.titulo || 'Comida', detalle: evento?.detalle || '' });
  const guardar = () => { if (!editor?.titulo.trim() || !editor?.detalle.trim()) return; alGuardarEvento(fecha, editor.hora, { tipo: editor.tipo, icono: editor.icono, titulo: editor.titulo.trim(), detalle: editor.detalle.trim() }); setEditor(null); };

  return <div className="pantalla-completa-dia">
    <div className="cabecera-calendario"><button className="botonMes" onClick={alVolverAlMes}>{nombreMes}</button><div className="cabecera-dia"><button className="btnSinEstilo" onClick={() => setBuscando(!buscando)} aria-label="Buscar en el día">🔍</button><button className="btnSinEstilo" onClick={() => abrirEditor('08:00')} aria-label="Añadir evento">➕</button></div></div>
    {buscando && <div className="buscador-calendario"><input autoFocus value={textoBusqueda} onChange={(e) => setTextoBusqueda(e.target.value)} placeholder="Buscar en este día..." aria-label="Buscar en este día" />{textoBusqueda && <span>{resultados.length} resultado{resultados.length !== 1 ? 's' : ''}</span>}</div>}
    <div className="tarjeta-fecha-grande"><span className="fecha">{fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</span><div className="navegacion-dia"><button onClick={() => alCambiarDia(-1)} aria-label="Día anterior">‹</button><button className={esHoy ? 'activo' : ''} onClick={alIrAHoy}>Hoy</button><button onClick={() => alCambiarDia(1)} aria-label="Día siguiente">›</button></div></div>
    <div className="contenido-dia-completo"><div className="bloque-horas"><div className="timeline-horas">{horasDelDia.map((hora) => { const comida = eventos[hora]; return <div className="hora-fila" key={hora} ref={hora === '06:00' ? ref6h : null}><div className="hora-eje">{hora}</div><div className="hora-contenido">{comida ? <div className={`tarjeta-evento ${comida.tipo}`} onClick={() => abrirEditor(hora, comida)} role="button" tabIndex={0}><span className="evento-info">{comida.icono} <b>{comida.titulo}:</b> {comida.detalle}</span><button className="evento-eliminar" onClick={(e) => { e.stopPropagation(); alEliminarEvento(fecha, hora); }} aria-label={`Eliminar ${comida.titulo}`}>×</button></div> : <button className="tarjeta-evento evento-vacio" onClick={() => abrirEditor(hora)}>+ Añadir nota o comida</button>}</div></div>; })}</div></div></div>
    {editor && <div className="modal-fondo" onClick={() => setEditor(null)}><div className="modal-evento" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Editar evento"><div className="modal-cabecera"><h3>{eventos[editor.hora] ? 'Editar evento' : 'Añadir evento'}</h3><button onClick={() => setEditor(null)} aria-label="Cerrar">×</button></div><label>Hora<select value={editor.hora} onChange={(e) => setEditor({ ...editor, hora: e.target.value })}>{horasDelDia.map((hora) => <option key={hora}>{hora}</option>)}</select></label><label>Tipo<select value={editor.tipo} onChange={(e) => setEditor({ ...editor, tipo: e.target.value })}><option value="desayuno">Desayuno</option><option value="almuerzo">Almuerzo</option><option value="comida">Comida</option><option value="merienda">Merienda</option><option value="cena">Cena</option><option value="nota">Nota</option></select></label><label>Título<input value={editor.titulo} onChange={(e) => setEditor({ ...editor, titulo: e.target.value })} placeholder="Ej. Comida" /></label><label>Descripción<textarea value={editor.detalle} onChange={(e) => setEditor({ ...editor, detalle: e.target.value })} placeholder="¿Qué quieres añadir?" rows="3" /></label><div className="modal-acciones"><button onClick={() => setEditor(null)}>Cancelar</button><button className="modal-guardar" onClick={guardar}>Guardar</button></div></div></div>}
  </div>;
}
