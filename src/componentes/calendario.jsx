import React, { useState, useRef, useEffect } from 'react';
import { recetasData } from './recetas';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const TIPOS_COMIDA = [
  { valor: 'desayuno', nombre: 'Desayuno', icono: '☕' },
  { valor: 'almuerzo', nombre: 'Almuerzo', icono: '🥪' },
  { valor: 'comida', nombre: 'Comida', icono: '🍽️' },
  { valor: 'merienda', nombre: 'Merienda', icono: '🍌' },
  { valor: 'cena', nombre: 'Cena', icono: '🐟' }
];

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

  const horasDelDia = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);

  useEffect(() => {
    localStorage.setItem('calendar_comidas', JSON.stringify(comidas));
  }, [comidas]);

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
    setFecha(nuevaFecha);
    setAñoVisible(nuevaFecha.getFullYear());
    setMesVisible(nuevaFecha.getMonth());
    setVista('dia');
  };

  const cambiarDia = (cantidad) => {
    const nuevaFecha = new Date(fecha);
    nuevaFecha.setDate(nuevaFecha.getDate() + cantidad);
    irADia(nuevaFecha);
  };

  const cambiarMes = (cantidad) => {
    const nuevaFecha = new Date(añoVisible, mesVisible + cantidad, 1);
    irAMes(nuevaFecha.getFullYear(), nuevaFecha.getMonth());
  };

  const cambiarAnyo = (cantidad) => irAAnyo(añoVisible + cantidad);

  const abrirMenuAnadir = (hora = '14:00') => {
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
        />
      )}

      {mostrarMenuAnadir && (
        <>
          <div className="menu-anadir-overlay" onClick={cerrarMenuAnadir} />
          <div className="menu-anadir">
            <div className="menu-anadir-indicador" />
            <button className="menu-anadir-opcion" onClick={() => abrirFormulario('receta')}>
              📖 Receta
            </button>
            <button className="menu-anadir-opcion" onClick={() => abrirFormulario('rapida')}>
              ⚡ Comida rápida
            </button>
            <button className="menu-anadir-cancelar" onClick={cerrarMenuAnadir}>
              Cancelar
            </button>
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
          <button type="button" className="formulario-volver" onClick={alCerrar}>‹</button>
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

        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', padding: '6px 2px 14px', scrollbarWidth: 'none' }}>
          {recetasFiltradas.map(receta => (
            <button
              key={receta.id}
              type="button"
              onClick={() => setRecetaSeleccionada(receta)}
              style={{
                minWidth: '145px',
                maxWidth: '145px',
                padding: '0',
                border: recetaSeleccionada?.id === receta.id ? '2px solid var(--appDecorationColor)' : '1px solid #ddd',
                borderRadius: '12px',
                background: '#fff',
                overflow: 'hidden',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              <img src={receta.imagen} alt={receta.nombre} style={{ width: '100%', height: '85px', objectFit: 'cover', display: 'block' }} />
              <span style={{ display: 'block', padding: '8px', fontSize: '13px', fontWeight: 600 }}>{receta.nombre}</span>
            </button>
          ))}
        </div>

        {recetaSeleccionada && (
          <div style={{ marginBottom: '12px', fontSize: '14px', fontWeight: 600 }}>
            Receta seleccionada: {recetaSeleccionada.nombre}
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
  const [ingredientes, setIngredientes] = useState(comidaInicial?.ingredientes?.join(', ') || '');
  const [tipoComida, setTipoComida] = useState(comidaInicial?.tipo || 'comida');
  const [fechaFormulario, setFechaFormulario] = useState(comidaInicial?.fecha || fechaClave(fecha));
  const [hora, setHora] = useState(comidaInicial?.hora || horaInicial || '14:00');

  const enviar = (e) => {
    e.preventDefault();
    if (!ingredientes.trim() || !fechaFormulario || !hora) return;

    const tipoInfo = TIPOS_COMIDA.find(item => item.valor === tipoComida) || TIPOS_COMIDA[2];
    alGuardar({
      nombre: ingredientes.trim(),
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
          <button type="button" className="formulario-volver" onClick={alCerrar}>‹</button>
          <h2>{comidaInicial ? 'Editar comida rápida' : 'Comida rápida'}</h2>
          <div />
        </div>

        <form className="formulario-campos" onSubmit={enviar}>
          <div className="campo-formulario">
            <label htmlFor="ingredientes-rapida">Ingredientes</label>
            <input
              id="ingredientes-rapida"
              type="text"
              placeholder="Ej.: pan, tomate, queso..."
              value={ingredientes}
              onChange={(e) => setIngredientes(e.target.value)}
              required
            />
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

function VistaAnyo({ año, comidas, alSeleccionarMes, alCambiarAnyo, alAnadir }) {
  const hoy = new Date();
  return (
    <div className="vista-anyo">
      <div className="cabecera-calendario">
        <h2></h2>
        <div className="cabecera-dia"><button className="btnSinEstilo" onClick={alAnadir}>➕</button></div>
      </div>
      <div className="navegacion-dia">
        <button className="flecha-dia" onClick={() => alCambiarAnyo(-1)} aria-label="Año anterior">‹</button>
        <div className="mes-nombre-grande">{año}</div>
        <button className="flecha-dia" onClick={() => alCambiarAnyo(1)} aria-label="Año siguiente">›</button>
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
            <div key={i} className="anyo-mes-card" onClick={() => alSeleccionarMes(i)}>
              <div className="anyo-mes-nombre">{nombreMes}{tieneComidas && <span className="mes-punto" />}</div>
              <div className="anyo-mini-grid">
                {celdas.map((d, j) => {
                  const esHoy = d === hoy.getDate() && i === hoy.getMonth() && año === hoy.getFullYear();
                  return <span key={j} className={`anyo-mini-celda ${esHoy ? 'hoy-mini' : ''}`}>{d ?? ''}</span>;
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VistaMes({ año, mes, comidas, alSeleccionarDia, alVolverAlAnyo, alCambiarMes, alAnadir }) {
  const hoy = new Date();
  const diasSemana = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
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
      <div className="cabecera-calendario">
        <button className="botonAnyo" onClick={alVolverAlAnyo}>{año}</button>
        <div className="cabecera-dia"><button className="btnSinEstilo" onClick={alAnadir}>➕</button></div>
      </div>
      <div className="navegacion-dia">
        <button className="flecha-dia" onClick={() => alCambiarMes(-1)} aria-label="Mes anterior">‹</button>
        <div className="mes-nombre-grande">{MESES[mes]}</div>
        <button className="flecha-dia" onClick={() => alCambiarMes(1)} aria-label="Mes siguiente">›</button>
      </div>
      <div className="mes-semana-cabecera">{diasSemana.map(d => <span className="dia-cabecera" key={d}>{d}</span>)}</div>
      <div className="mes-grid">
        {celdas.map((d, i) => (
          <div key={i} className="mes-celda" onClick={() => d && alSeleccionarDia(new Date(año, mes, d))}>
            {d && <><span className={`mes-numero ${esHoy(d) ? 'hoy-numero' : ''}`}>{d}</span>{tieneComida(d) && <span className="mes-punto" />}</>}
          </div>
        ))}
      </div>
    </div>
  );
}

function TablaDia({ fecha, alVolverAlMes, alCambiarDia, horasDelDia, comidas, alAnadir, alAnadirComida, alEditar, alEliminar }) {
  const ref6h = useRef(null);
  const [mostrarAcciones, setMostrarAcciones] = useState(null);
  useEffect(() => {
    if (ref6h.current) ref6h.current.scrollIntoView({ block: 'start' });
  }, [fecha]);
  const obtenerComida = (hora) => comidas.find(comida => comida.hora === hora);
  return (
    <div className="pantalla-completa-dia">
      <div className="cabecera-calendario">
        <button className="botonMes" onClick={alVolverAlMes}>{MESES[fecha.getMonth()]}</button>
        <div className="cabecera-dia"><button className="btnSinEstilo" onClick={alAnadir}>➕</button></div>
      </div>
      <div className="tarjeta-fecha-grande">
        <div className="navegacion-dia">
          <button className="flecha-dia" onClick={() => alCambiarDia(-1)} aria-label="Día anterior">‹</button>
          <span className="fecha">{fecha.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}</span>
          <button className="flecha-dia" onClick={() => alCambiarDia(1)} aria-label="Día siguiente">›</button>
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
                      <div className={`tarjeta-evento ${comida.tipo}`} onClick={() => setMostrarAcciones(mostrarAcciones === comida.id ? null : comida.id)}>
                        <span className="evento-info">
                          {comida.icono}{' '}
                          <b>{TIPOS_COMIDA.find(t => t.valor === comida.tipo)?.nombre || 'Comida'}:</b>{' '}
                          {comida.nombre}
                        </span>
                      </div>
                      {mostrarAcciones === comida.id && (
                        <div className="evento-acciones">
                          <button onClick={(e) => { e.stopPropagation(); setMostrarAcciones(null); alEditar(comida); }} aria-label="Editar comida" title="Editar">✏️</button>
                          <button onClick={(e) => { e.stopPropagation(); setMostrarAcciones(null); alEliminar(comida.id); }} aria-label="Eliminar comida" title="Eliminar">🗑️</button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="hora-contenido boton-anadir-comida" onClick={() => alAnadirComida(hora)} role="button" tabIndex="0" onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && alAnadirComida(hora)} aria-label={`Añadir comida a las ${hora}`}>
                      + Añadir comida
                    </div>
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
