import React, { useEffect, useMemo, useRef, useState } from 'react';
import { recetasData } from './recetas';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const TIPOS_COMIDA = [
  { valor: 'desayuno', nombre: 'Desayuno', icono: '☕' },
  { valor: 'almuerzo', nombre: 'Almuerzo', icono: '🥪' },
  { valor: 'comida', nombre: 'Comida', icono: '🍽️' },
  { valor: 'merienda', nombre: 'Merienda', icono: '🍌' },
  { valor: 'cena', nombre: 'Cena', icono: '🐟' }
];

function Icono({ nombre, size = 20, strokeWidth = 1.8 }) {
  const comunes = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true
  };

  const iconos = {
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    left: <path d="m15 18-6-6 6-6" />,
    right: <path d="m9 18 6-6-6-6" />,
    back: <path d="m15 18-6-6 6-6" />,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
    trash: <><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="m19 6-1 14H6L5 6" /><path d="M10 11v5" /><path d="M14 11v5" /></>,
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5Z" /><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5Z" /></>,
    bolt: <path d="m13 2-8 12h7l-1 8 8-12h-7Z" />,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4" /><path d="M8 3v4" /><path d="M3 10h18" /></>,
    week: <><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18" /><path d="M8 9v12" /><path d="M13 9v12" /><path d="M18 9v12" /></>,
  };

  return <svg {...comunes}>{iconos[nombre]}</svg>;
}

const fechaClave = (fecha) => {
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${año}-${mes}-${dia}`;
};

const fechaDesdeClave = (clave) => {
  const [año, mes, dia] = clave.split('-').map(Number);
  return new Date(año, mes - 1, dia);
};

const inicioSemana = (fecha) => {
  const inicio = new Date(fecha);
  const dia = (inicio.getDay() + 6) % 7;
  inicio.setDate(inicio.getDate() - dia);
  inicio.setHours(0, 0, 0, 0);
  return inicio;
};

const diasDeSemana = (fecha) => {
  const inicio = inicioSemana(fecha);
  return Array.from({ length: 7 }, (_, i) => {
    const dia = new Date(inicio);
    dia.setDate(inicio.getDate() + i);
    return dia;
  });
};

const obtenerComidasDemo = () => {
  const fecha = fechaClave(new Date());
  const horarios = ['08:00', '11:00', '14:00', '17:00', '21:00'];

  return recetasData.slice(0, 5).map((receta, indice) => ({
    id: `demo-${receta.id}`,
    recetaId: receta.id,
    fecha,
    hora: horarios[indice],
    nombre: receta.nombre,
    tipo: TIPOS_COMIDA[Math.min(indice, TIPOS_COMIDA.length - 1)].valor,
    icono: TIPOS_COMIDA[Math.min(indice, TIPOS_COMIDA.length - 1)].icono,
    modo: 'receta'
  }));
};

const obtenerComidasIniciales = () => {
  try {
    const guardadas = JSON.parse(localStorage.getItem('calendar_comidas'));
    if (Array.isArray(guardadas)) return guardadas;
  } catch {}
  return obtenerComidasDemo();
};

function BotonIcono({ icono, etiqueta, onClick, className = '', size = 20 }) {
  return (
    <button type="button" className={`boton-icono ${className}`} onClick={onClick} aria-label={etiqueta} title={etiqueta}>
      <Icono nombre={icono} size={size} />
    </button>
  );
}

function SelectorVistaDetalle({ vista, alCambiarVista }) {
  return (
    <div className="selector-vista" role="group" aria-label="Cambiar vista del calendario">
      <button className={vista === 'dia' ? 'activo' : ''} onClick={() => alCambiarVista('dia')}>
        <Icono nombre="calendar" size={16} />
        Día
      </button>
      <button className={vista === 'semana' ? 'activo' : ''} onClick={() => alCambiarVista('semana')}>
        <Icono nombre="week" size={16} />
        Semana
      </button>
    </div>
  );
}

export default function Calendario() {
  const hoy = new Date();
  const [fecha, setFecha] = useState(new Date());
  const [vista, setVista] = useState('dia');
  const [añoVisible, setAñoVisible] = useState(hoy.getFullYear());
  const [mesVisible, setMesVisible] = useState(hoy.getMonth());
  const [mostrarMenuAnadir, setMostrarMenuAnadir] = useState(false);
  const [horaSeleccionada, setHoraSeleccionada] = useState('14:00');
  const [formulario, setFormulario] = useState(null);
  const [comidas, setComidas] = useState(obtenerComidasIniciales);
  const [comidaEditando, setComidaEditando] = useState(null);

  const horasDelDia = useMemo(
    () => Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`),
    []
  );

  useEffect(() => {
    localStorage.setItem('calendar_comidas', JSON.stringify(comidas));
  }, [comidas]);

  const sincronizarFecha = (nuevaFecha) => {
    setFecha(nuevaFecha);
    setAñoVisible(nuevaFecha.getFullYear());
    setMesVisible(nuevaFecha.getMonth());
  };

  const irAAnyo = (anyo) => {
    setAñoVisible(anyo);
    setVista('anyo');
  };

  const irAMes = (anyo, mes) => {
    setAñoVisible(anyo);
    setMesVisible(mes);
    setVista('mes');
  };

  const irADia = (nuevaFecha) => {
    sincronizarFecha(nuevaFecha);
    setVista('dia');
  };

  const irASemana = (nuevaFecha = fecha) => {
    sincronizarFecha(nuevaFecha);
    setVista('semana');
  };

  const cambiarDia = (cantidad) => {
    const nuevaFecha = new Date(fecha);
    nuevaFecha.setDate(nuevaFecha.getDate() + cantidad);
    irADia(nuevaFecha);
  };

  const cambiarSemana = (cantidad) => {
    const nuevaFecha = new Date(fecha);
    nuevaFecha.setDate(nuevaFecha.getDate() + (cantidad * 7));
    irASemana(nuevaFecha);
  };

  const cambiarMes = (cantidad) => {
    const nuevaFecha = new Date(añoVisible, mesVisible + cantidad, 1);
    irAMes(nuevaFecha.getFullYear(), nuevaFecha.getMonth());
  };

  const cambiarAnyo = (cantidad) => irAAnyo(añoVisible + cantidad);

  const cambiarVistaDetalle = (nuevaVista) => {
    if (nuevaVista === 'semana') irASemana(fecha);
    else irADia(fecha);
  };

  const abrirMenuAnadir = (hora = '14:00', fechaObjetivo = fecha) => {
    sincronizarFecha(fechaObjetivo);
    setHoraSeleccionada(hora);
    setMostrarMenuAnadir(true);
  };

  const cerrarMenuAnadir = () => setMostrarMenuAnadir(false);

  const abrirFormulario = (tipo) => {
    setMostrarMenuAnadir(false);
    setFormulario({ tipo, hora: horaSeleccionada });
  };

  const guardarComida = (datos) => {
    const nuevaComida = {
      id: comidaEditando?.id || `${Date.now()}`,
      recetaId: datos.recetaId,
      fecha: datos.fecha,
      hora: datos.hora,
      nombre: datos.nombre,
      tipo: datos.tipo,
      icono: datos.icono,
      ingredientes: datos.ingredientes,
      modo: datos.modo
    };

    setComidas(actuales => comidaEditando
      ? actuales.map(comida => comida.id === comidaEditando.id ? nuevaComida : comida)
      : [...actuales, nuevaComida]
    );
    setFormulario(null);
    setComidaEditando(null);
  };

  const editarComida = (comida) => {
    setFecha(fechaDesdeClave(comida.fecha));
    setComidaEditando(comida);
    setFormulario({ tipo: comida.modo, hora: comida.hora, comida });
  };

  const eliminarComida = (id) => {
    if (window.confirm('¿Quieres eliminar esta comida?')) {
      setComidas(actuales => actuales.filter(comida => comida.id !== id));
      setComidaEditando(null);
      setFormulario(null);
    }
  };

  const cancelarFormulario = () => {
    const estabaEditando = Boolean(comidaEditando);
    setFormulario(null);
    setComidaEditando(null);
    setMostrarMenuAnadir(!estabaEditando);
  };

  const comidasDelDia = comidas.filter(comida => comida.fecha === fechaClave(fecha));

  return (
    <div className="contenedor-calendario">
      {vista === 'anyo' && (
        <VistaAnyo
          año={añoVisible}
          comidas={comidas}
          alSeleccionarMes={(mes) => irAMes(añoVisible, mes)}
          alCambiarAnyo={cambiarAnyo}
          alAnadir={() => abrirMenuAnadir()}
        />
      )}

      {vista === 'mes' && (
        <VistaMes
          año={añoVisible}
          mes={mesVisible}
          comidas={comidas}
          alSeleccionarDia={irADia}
          alVolverAlAnyo={() => irAAnyo(añoVisible)}
          alCambiarMes={cambiarMes}
          alAnadir={() => abrirMenuAnadir()}
        />
      )}

      {vista === 'dia' && (
        <TablaDia
          fecha={fecha}
          alVolverAlMes={() => irAMes(fecha.getFullYear(), fecha.getMonth())}
          alCambiarDia={cambiarDia}
          horasDelDia={horasDelDia}
          comidas={comidasDelDia}
          alAnadir={abrirMenuAnadir}
          alAnadirComida={abrirMenuAnadir}
          alEditar={editarComida}
          alEliminar={eliminarComida}
          alCambiarVista={cambiarVistaDetalle}
        />
      )}

      {vista === 'semana' && (
        <VistaSemana
          fecha={fecha}
          comidas={comidas}
          alVolverAlMes={() => irAMes(fecha.getFullYear(), fecha.getMonth())}
          alCambiarSemana={cambiarSemana}
          alCambiarVista={cambiarVistaDetalle}
          alSeleccionarDia={irADia}
          alAnadir={abrirMenuAnadir}
          alEditar={editarComida}
          alEliminar={eliminarComida}
        />
      )}

      {mostrarMenuAnadir && (
        <>
          <div className="menu-anadir-overlay" onClick={cerrarMenuAnadir} />
          <div className="menu-anadir">
            <div className="menu-anadir-indicador" />
            <button className="menu-anadir-opcion" onClick={() => abrirFormulario('receta')}>
              <span className="menu-anadir-icono"><Icono nombre="book" size={19} /></span>
              <span><strong>Receta</strong><small>Elegir una receta guardada</small></span>
            </button>
            <button className="menu-anadir-opcion" onClick={() => abrirFormulario('rapida')}>
              <span className="menu-anadir-icono"><Icono nombre="bolt" size={19} /></span>
              <span><strong>Comida rápida</strong><small>Crear una entrada manual</small></span>
            </button>
            <button className="menu-anadir-cancelar" onClick={cerrarMenuAnadir}>Cancelar</button>
          </div>
        </>
      )}

      {formulario && (
        formulario.tipo === 'receta' ? (
          <SelectorReceta
            fecha={fecha}
            horaInicial={formulario.hora}
            comidaInicial={formulario.comida}
            alCerrar={cancelarFormulario}
            alGuardar={guardarComida}
          />
        ) : (
          <FormularioComidaRapida
            fecha={fecha}
            horaInicial={formulario.hora}
            comidaInicial={formulario.comida}
            alCerrar={cancelarFormulario}
            alGuardar={guardarComida}
          />
        )
      )}
    </div>
  );
}

function SelectorReceta({ fecha, horaInicial, comidaInicial, alCerrar, alGuardar }) {
  const [busqueda, setBusqueda] = useState('');
  const [recetaSeleccionada, setRecetaSeleccionada] = useState(
    recetasData.find(receta => receta.id === comidaInicial?.recetaId) || null
  );
  const [fechaFormulario, setFechaFormulario] = useState(comidaInicial?.fecha || fechaClave(fecha));
  const [hora, setHora] = useState(comidaInicial?.hora || horaInicial || '14:00');

  const recetasFiltradas = recetasData.filter(receta =>
    receta.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const enviar = (e) => {
    e.preventDefault();
    if (!recetaSeleccionada || !fechaFormulario || !hora) return;

    const tipo = TIPOS_COMIDA[2];
    alGuardar({
      recetaId: recetaSeleccionada.id,
      nombre: recetaSeleccionada.nombre,
      tipo: comidaInicial?.tipo || tipo.valor,
      icono: comidaInicial?.icono || tipo.icono,
      fecha: fechaFormulario,
      hora,
      modo: 'receta'
    });
  };

  return (
    <>
      <div className="menu-anadir-overlay" onClick={alCerrar} />
      <div className="menu-anadir formulario-comida">
        <div className="menu-anadir-indicador" />
        <div className="formulario-cabecera">
          <BotonIcono icono="back" etiqueta="Volver" onClick={alCerrar} />
          <h2>{comidaInicial ? 'Editar receta' : 'Añadir receta'}</h2>
          <div />
        </div>

        <div className="campo-formulario">
          <label htmlFor="buscar-receta-calendario">Buscar receta</label>
          <input
            id="buscar-receta-calendario"
            type="search"
            placeholder="Escribe el nombre de una receta..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="selector-recetas">
          {recetasFiltradas.map(receta => (
            <button
              key={receta.id}
              type="button"
              className={`selector-receta-card ${recetaSeleccionada?.id === receta.id ? 'seleccionada' : ''}`}
              onClick={() => setRecetaSeleccionada(receta)}
            >
              <img src={receta.imagen} alt={receta.nombre} />
              <span>{receta.nombre}</span>
            </button>
          ))}
        </div>

        {recetaSeleccionada && (
          <div className="receta-seleccionada">
            Seleccionada: <strong>{recetaSeleccionada.nombre}</strong>
          </div>
        )}

        <form className="formulario-campos" onSubmit={enviar}>
          <div className="campos-formulario-fila">
            <div className="campo-formulario">
              <label htmlFor="fecha-receta">Fecha</label>
              <input id="fecha-receta" type="date" value={fechaFormulario} onChange={(e) => setFechaFormulario(e.target.value)} required />
            </div>
            <div className="campo-formulario">
              <label htmlFor="hora-receta">Hora</label>
              <input id="hora-receta" type="time" value={hora} onChange={(e) => setHora(e.target.value)} required />
            </div>
          </div>

          <button className="boton-formulario-guardar" type="submit" disabled={!recetaSeleccionada}>
            {comidaInicial ? 'Guardar cambios' : 'Añadir al calendario'}
          </button>
        </form>
      </div>
    </>
  );
}

function FormularioComidaRapida({ fecha, horaInicial, comidaInicial, alCerrar, alGuardar }) {
  const [nombre, setNombre] = useState(comidaInicial?.nombre || '');
  const [ingredientes, setIngredientes] = useState(comidaInicial?.ingredientes?.join(', ') || '');
  const [tipoComida, setTipoComida] = useState(comidaInicial?.tipo || 'comida');
  const [fechaFormulario, setFechaFormulario] = useState(comidaInicial?.fecha || fechaClave(fecha));
  const [hora, setHora] = useState(comidaInicial?.hora || horaInicial || '14:00');

  const enviar = (e) => {
    e.preventDefault();
    if (!nombre.trim() || !ingredientes.trim() || !fechaFormulario || !hora) return;

    const tipoInfo = TIPOS_COMIDA.find(item => item.valor === tipoComida) || TIPOS_COMIDA[2];
    alGuardar({
      nombre: nombre.trim(),
      tipo: tipoComida,
      icono: tipoInfo.icono,
      ingredientes: ingredientes.split(',').map(ingrediente => ingrediente.trim()).filter(Boolean),
      fecha: fechaFormulario,
      hora,
      modo: 'rapida'
    });
  };

  return (
    <>
      <div className="menu-anadir-overlay" onClick={alCerrar} />
      <div className="menu-anadir formulario-comida">
        <div className="menu-anadir-indicador" />
        <div className="formulario-cabecera">
          <BotonIcono icono="back" etiqueta="Volver" onClick={alCerrar} />
          <h2>{comidaInicial ? 'Editar comida rápida' : 'Comida rápida'}</h2>
          <div />
        </div>

        <form className="formulario-campos" onSubmit={enviar}>
          <div className="campo-formulario">
            <label htmlFor="nombre-rapida">Nombre</label>
            <input id="nombre-rapida" type="text" placeholder="Ej.: Tostada de tomate y queso" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </div>

          <div className="campo-formulario">
            <label htmlFor="ingredientes-rapida">Ingredientes</label>
            <input id="ingredientes-rapida" type="text" placeholder="Ej.: pan, tomate, queso..." value={ingredientes} onChange={(e) => setIngredientes(e.target.value)} required />
          </div>

          <div className="campo-formulario">
            <label htmlFor="tipo-rapida">Tipo de comida</label>
            <select id="tipo-rapida" value={tipoComida} onChange={(e) => setTipoComida(e.target.value)}>
              {TIPOS_COMIDA.map(tipo => <option key={tipo.valor} value={tipo.valor}>{tipo.nombre}</option>)}
            </select>
          </div>

          <div className="campos-formulario-fila">
            <div className="campo-formulario">
              <label htmlFor="fecha-rapida">Fecha</label>
              <input id="fecha-rapida" type="date" value={fechaFormulario} onChange={(e) => setFechaFormulario(e.target.value)} required />
            </div>
            <div className="campo-formulario">
              <label htmlFor="hora-rapida">Hora</label>
              <input id="hora-rapida" type="time" value={hora} onChange={(e) => setHora(e.target.value)} required />
            </div>
          </div>

          <button className="boton-formulario-guardar" type="submit">
            {comidaInicial ? 'Guardar cambios' : 'Guardar'}
          </button>
        </form>
      </div>
    </>
  );
}

function CabeceraCalendario({ etiqueta, alVolver, alAnadir }) {
  return (
    <div className="cabecera-calendario">
      {alVolver ? <button className="boton-contexto" onClick={alVolver}>{etiqueta}</button> : <span />}
      <BotonIcono icono="plus" etiqueta="Añadir comida" onClick={alAnadir} className="boton-anadir-principal" />
    </div>
  );
}

function VistaAnyo({ año, comidas, alSeleccionarMes, alCambiarAnyo, alAnadir }) {
  const hoy = new Date();
  return (
    <div className="vista-anyo">
      <CabeceraCalendario alAnadir={alAnadir} />
      <div className="navegacion-dia">
        <BotonIcono icono="left" etiqueta="Año anterior" onClick={() => alCambiarAnyo(-1)} />
        <div className="mes-nombre-grande">{año}</div>
        <BotonIcono icono="right" etiqueta="Año siguiente" onClick={() => alCambiarAnyo(1)} />
      </div>

      <div className="anyo-grid">
        {MESES.map((nombreMes, i) => {
          const primerDia = new Date(año, i, 1);
          const totalDias = new Date(año, i + 1, 0).getDate();
          const offset = (primerDia.getDay() + 6) % 7;
          const celdas = [];
          for (let x = 0; x < offset; x++) celdas.push(null);
          for (let d = 1; d <= totalDias; d++) celdas.push(d);
          const tieneComidas = comidas.some(comida => {
            const f = fechaDesdeClave(comida.fecha);
            return f.getFullYear() === año && f.getMonth() === i;
          });

          return (
            <button key={i} className="anyo-mes-card" onClick={() => alSeleccionarMes(i)}>
              <span className="anyo-mes-nombre">{nombreMes}{tieneComidas && <span className="mes-punto" />}</span>
              <span className="anyo-mini-grid">
                {celdas.map((d, j) => {
                  const esHoy = d === hoy.getDate() && i === hoy.getMonth() && año === hoy.getFullYear();
                  return <span key={j} className={`anyo-mini-celda ${esHoy ? 'hoy-mini' : ''}`}>{d ?? ''}</span>;
                })}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function VistaMes({ año, mes, comidas, alSeleccionarDia, alVolverAlAnyo, alCambiarMes, alAnadir }) {
  const hoy = new Date();
  const primerDia = new Date(año, mes, 1);
  const ultimoDia = new Date(año, mes + 1, 0);
  const offsetInicio = (primerDia.getDay() + 6) % 7;
  const celdas = [];

  for (let i = 0; i < offsetInicio; i++) celdas.push(null);
  for (let d = 1; d <= ultimoDia.getDate(); d++) celdas.push(d);

  const esHoy = (d) => d === hoy.getDate() && mes === hoy.getMonth() && año === hoy.getFullYear();
  const tieneComida = (dia) => comidas.some(comida => comida.fecha === `${año}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`);

  return (
    <div className="vista-mes">
      <CabeceraCalendario etiqueta={año} alVolver={alVolverAlAnyo} alAnadir={alAnadir} />

      <div className="navegacion-dia">
        <BotonIcono icono="left" etiqueta="Mes anterior" onClick={() => alCambiarMes(-1)} />
        <div className="mes-nombre-grande">{MESES[mes]}</div>
        <BotonIcono icono="right" etiqueta="Mes siguiente" onClick={() => alCambiarMes(1)} />
      </div>

      <div className="mes-semana-cabecera">{DIAS_SEMANA.map(d => <span className="dia-cabecera" key={d}>{d.slice(0, 1)}</span>)}</div>
      <div className="mes-grid">
        {celdas.map((d, i) => (
          <button key={i} className="mes-celda" disabled={!d} onClick={() => d && alSeleccionarDia(new Date(año, mes, d))}>
            {d && (
              <>
                <span className={`mes-numero ${esHoy(d) ? 'hoy-numero' : ''}`}>{d}</span>
                {tieneComida(d) && <span className="mes-punto" />}
              </>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

function TablaDia({ fecha, alVolverAlMes, alCambiarDia, horasDelDia, comidas, alAnadir, alAnadirComida, alEditar, alEliminar, alCambiarVista }) {
  const ref6h = useRef(null);
  const [mostrarAcciones, setMostrarAcciones] = useState(null);

  useEffect(() => {
    if (ref6h.current) ref6h.current.scrollIntoView({ block: 'start' });
  }, [fecha]);

  const obtenerComida = (hora) => comidas.find(comida => comida.hora === hora);

  return (
    <div className="pantalla-completa-dia">
      <CabeceraCalendario etiqueta={MESES[fecha.getMonth()]} alVolver={alVolverAlMes} alAnadir={() => alAnadir('14:00', fecha)} />
      <SelectorVistaDetalle vista="dia" alCambiarVista={alCambiarVista} />

      <div className="tarjeta-fecha-grande">
        <div className="navegacion-dia">
          <BotonIcono icono="left" etiqueta="Día anterior" onClick={() => alCambiarDia(-1)} />
          <span className="fecha">{fecha.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'long' })}</span>
          <BotonIcono icono="right" etiqueta="Día siguiente" onClick={() => alCambiarDia(1)} />
        </div>
      </div>

      <div className="contenido-dia-completo">
        <div className="bloque-horas">
          <div className="timeline-horas">
            {horasDelDia.map(hora => {
              const comida = obtenerComida(hora);
              return (
                <div className="hora-fila" key={hora} ref={hora === '06:00' ? ref6h : null}>
                  <div className="hora-eje">{hora}</div>
                  {comida ? (
                    <div className="hora-contenido">
                      <button className={`tarjeta-evento ${comida.tipo}`} onClick={() => setMostrarAcciones(mostrarAcciones === comida.id ? null : comida.id)}>
                        <span className="evento-info">
                          <span>{comida.icono}</span>
                          <span><b>{TIPOS_COMIDA.find(t => t.valor === comida.tipo)?.nombre || 'Comida'}</b><small>{comida.nombre}</small></span>
                        </span>
                      </button>
                      {mostrarAcciones === comida.id && (
                        <div className="evento-acciones">
                          <BotonIcono icono="edit" etiqueta="Editar comida" size={16} onClick={() => { setMostrarAcciones(null); alEditar(comida); }} />
                          <BotonIcono icono="trash" etiqueta="Eliminar comida" size={16} onClick={() => { setMostrarAcciones(null); alEliminar(comida.id); }} />
                        </div>
                      )}
                    </div>
                  ) : (
                    <button className="hora-contenido boton-anadir-comida" onClick={() => alAnadirComida(hora, fecha)}>
                      <Icono nombre="plus" size={15} />
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

function VistaSemana({ fecha, comidas, alVolverAlMes, alCambiarSemana, alCambiarVista, alSeleccionarDia, alAnadir, alEditar, alEliminar }) {
  const dias = diasDeSemana(fecha);
  const hoy = fechaClave(new Date());
  const inicio = dias[0];
  const fin = dias[6];

  const tituloSemana = inicio.getMonth() === fin.getMonth()
    ? `${inicio.getDate()} – ${fin.getDate()} ${MESES[inicio.getMonth()].toLowerCase()}`
    : `${inicio.getDate()} ${MESES[inicio.getMonth()].slice(0, 3).toLowerCase()} – ${fin.getDate()} ${MESES[fin.getMonth()].slice(0, 3).toLowerCase()}`;

  return (
    <div className="vista-semana">
      <CabeceraCalendario etiqueta={MESES[fecha.getMonth()]} alVolver={alVolverAlMes} alAnadir={() => alAnadir('14:00', fecha)} />
      <SelectorVistaDetalle vista="semana" alCambiarVista={alCambiarVista} />

      <div className="navegacion-semana">
        <BotonIcono icono="left" etiqueta="Semana anterior" onClick={() => alCambiarSemana(-1)} />
        <div>
          <strong>{tituloSemana}</strong>
          <small>{inicio.getFullYear()}</small>
        </div>
        <BotonIcono icono="right" etiqueta="Semana siguiente" onClick={() => alCambiarSemana(1)} />
      </div>

      <div className="semana-scroll">
        <div className="semana-grid">
          {dias.map((dia, indice) => {
            const clave = fechaClave(dia);
            const comidasDia = comidas
              .filter(comida => comida.fecha === clave)
              .sort((a, b) => a.hora.localeCompare(b.hora));

            return (
              <section className={`semana-dia ${clave === hoy ? 'semana-dia-hoy' : ''}`} key={clave}>
                <button className="semana-dia-cabecera" onClick={() => alSeleccionarDia(dia)}>
                  <span>{DIAS_SEMANA[indice]}</span>
                  <strong>{dia.getDate()}</strong>
                </button>

                <div className="semana-dia-eventos">
                  {comidasDia.length === 0 && <span className="semana-vacio">Sin comidas</span>}
                  {comidasDia.map(comida => (
                    <div className={`semana-evento ${comida.tipo}`} key={comida.id}>
                      <div className="semana-evento-hora">{comida.hora}</div>
                      <div className="semana-evento-contenido">
                        <span className="semana-evento-icono">{comida.icono}</span>
                        <span className="semana-evento-nombre">{comida.nombre}</span>
                      </div>
                      <div className="semana-evento-acciones">
                        <BotonIcono icono="edit" etiqueta="Editar comida" size={14} onClick={() => alEditar(comida)} />
                        <BotonIcono icono="trash" etiqueta="Eliminar comida" size={14} onClick={() => alEliminar(comida.id)} />
                      </div>
                    </div>
                  ))}
                </div>

                <button className="semana-anadir" onClick={() => alAnadir('14:00', dia)}>
                  <Icono nombre="plus" size={15} />
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
