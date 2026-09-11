import React, { useState, useRef, useEffect } from 'react';

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre'
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

const obtenerComidasIniciales = () => {
  try {
    const guardadas = JSON.parse(localStorage.getItem('calendar_comidas'));
    if (Array.isArray(guardadas)) return guardadas;
  } catch {}
  return [];
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

  const comidasFijas = {
    "08:00": {
      tipo: "desayuno",
      icono: "☕",
      titulo: "Desayuno",
      detalle: "Tostadas con aguacate y café"
    },
    "11:00": {
      tipo: "almuerzo",
      icono: "🥪",
      titulo: "Almuerzo",
      detalle: "Bocadillo de pavo y nueces"
    },
    "14:00": {
      tipo: "comida",
      icono: "🍽️",
      titulo: "Comida",
      detalle: "Pechuga de pollo con arroz"
    },
    "17:00": {
      tipo: "merienda",
      icono: "🍌",
      titulo: "Merienda",
      detalle: "Plátano y batido de proteínas"
    },
    "21:00": {
      tipo: "cena",
      icono: "🐟",
      titulo: "Cena",
      detalle: "Salmón a la plancha con ensalada"
    }
  };

  const horasDelDia = [];
  for (let i = 0; i <= 23; i++) {
    horasDelDia.push(`${i.toString().padStart(2, '0')}:00`);
  }

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

  const cambiarAnyo = (cantidad) => {
    irAAnyo(añoVisible + cantidad);
  };

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
      fecha: datos.fecha,
      hora: datos.hora,
      nombre: datos.nombre,
      tipo: datos.tipo,
      icono: datos.icono,
      modo: datos.modo,
      descripcion: datos.descripcion || '',
      ingredientes: datos.ingredientes || '',
      tiempo: datos.tiempo || '',
      raciones: datos.raciones || ''
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
    }
  };

  const cancelarFormulario = () => {
    setFormulario(null);
    setComidaEditando(null);
    setMostrarMenuAnadir(true);
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
          comidasFijas={comidasFijas}
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
          comidasFijas={comidasFijas}
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
            <button
              className="menu-anadir-opcion"
              onClick={() => abrirFormulario('receta')}
            >
              📖 Receta
            </button>
            <button
              className="menu-anadir-opcion"
              onClick={() => abrirFormulario('rapida')}
            >
              ⚡ Comida rápida
            </button>
            <button
              className="menu-anadir-cancelar"
              onClick={cerrarMenuAnadir}
            >
              Cancelar
            </button>
          </div>
        </>
      )}

      {formulario && (
        <FormularioComida
          tipo={formulario.tipo}
          fecha={fecha}
          horaInicial={formulario.hora}
          comidaInicial={formulario.comida}
          alCerrar={cancelarFormulario}
          alGuardar={guardarComida}
        />
      )}
    </div>
  );
}

function FormularioComida({
  tipo,
  fecha,
  horaInicial = '14:00',
  comidaInicial,
  alCerrar,
  alGuardar
}) {
  const esReceta = tipo === 'receta';
  const fechaInicial = comidaInicial?.fecha || fechaClave(fecha);
  const horaInicialFormulario = comidaInicial?.hora || horaInicial;
  const tipoInicial = comidaInicial?.tipo || 'comida';
  const [nombre, setNombre] = useState(comidaInicial?.nombre || '');
  const [descripcion, setDescripcion] = useState(comidaInicial?.descripcion || '');
  const [ingredientes, setIngredientes] = useState(comidaInicial?.ingredientes || '');
  const [tiempo, setTiempo] = useState(comidaInicial?.tiempo || '');
  const [raciones, setRaciones] = useState(comidaInicial?.raciones || '');
  const [tipoComida, setTipoComida] = useState(tipoInicial);
  const [fechaFormulario, setFechaFormulario] = useState(fechaInicial);
  const [hora, setHora] = useState(horaInicialFormulario);

  const enviar = (e) => {
    e.preventDefault();

    if (!nombre.trim() || !fechaFormulario || !hora) return;

    const tipoInfo = TIPOS_COMIDA.find(item => item.valor === tipoComida) || TIPOS_COMIDA[2];

    alGuardar({
      nombre: nombre.trim(),
      descripcion,
      ingredientes,
      tiempo,
      raciones,
      tipo: tipoComida,
      icono: tipoInfo.icono,
      fecha: fechaFormulario,
      hora,
      modo: tipo
    });
  };

  return (
    <>
      <div className="menu-anadir-overlay" onClick={alCerrar} />
      <div className="menu-anadir formulario-comida">
        <div className="menu-anadir-indicador" />

        <div className="formulario-cabecera">
          <button
            type="button"
            className="formulario-volver"
            onClick={alCerrar}
          >
            ‹
          </button>
          <h2>{esReceta ? 'Añadir receta' : 'Comida rápida'}</h2>
          <div />
        </div>

        <form className="formulario-campos" onSubmit={enviar}>
          <div className="campo-formulario">
            <label htmlFor="nombre">Comida</label>
            <input
              id="nombre"
              type="text"
              placeholder="¿Qué vas a comer?"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
            />
          </div>

          {esReceta ? (
            <>
              <div className="campo-formulario">
                <label htmlFor="descripcion">Descripción</label>
                <textarea
                  id="descripcion"
                  placeholder="Describe brevemente la receta"
                  rows="3"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                />
              </div>

              <div className="campo-formulario">
                <label htmlFor="ingredientes">Ingredientes</label>
                <textarea
                  id="ingredientes"
                  placeholder="Ej.: 200 g de pollo, 100 g de arroz..."
                  rows="4"
                  value={ingredientes}
                  onChange={(e) => setIngredientes(e.target.value)}
                />
              </div>

              <div className="campos-formulario-fila">
                <div className="campo-formulario">
                  <label htmlFor="tiempo">Tiempo (min)</label>
                  <input
                    id="tiempo"
                    type="number"
                    min="1"
                    placeholder="30"
                    value={tiempo}
                    onChange={(e) => setTiempo(e.target.value)}
                  />
                </div>

                <div className="campo-formulario">
                  <label htmlFor="raciones">Raciones</label>
                  <input
                    id="raciones"
                    type="number"
                    min="1"
                    placeholder="2"
                    value={raciones}
                    onChange={(e) => setRaciones(e.target.value)}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className="campo-formulario">
              <label htmlFor="tipo-comida">Tipo de comida</label>
              <select
                id="tipo-comida"
                value={tipoComida}
                onChange={(e) => setTipoComida(e.target.value)}
              >
                {TIPOS_COMIDA.map(tipo => (
                  <option key={tipo.valor} value={tipo.valor}>
                    {tipo.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          {esReceta && (
            <div className="campo-formulario">
              <label htmlFor="tipo-comida-receta">Tipo de comida</label>
              <select
                id="tipo-comida-receta"
                value={tipoComida}
                onChange={(e) => setTipoComida(e.target.value)}
              >
                {TIPOS_COMIDA.map(tipo => (
                  <option key={tipo.valor} value={tipo.valor}>
                    {tipo.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="campos-formulario-fila">
            <div className="campo-formulario">
              <label htmlFor="fecha">Fecha</label>
              <input
                id="fecha"
                type="date"
                value={fechaFormulario}
                onChange={(e) => setFechaFormulario(e.target.value)}
                required
              />
            </div>

            <div className="campo-formulario">
              <label htmlFor="hora">Hora</label>
              <input
                id="hora"
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                required
              />
            </div>
          </div>

          <button className="boton-formulario-guardar" type="submit">
            Guardar
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
        <div className="cabecera-dia">
          <button className="btnSinEstilo" onClick={alAnadir}>➕</button>
        </div>
      </div>

      <div className="navegacion-dia">
        <button
          className="flecha-dia"
          onClick={() => alCambiarAnyo(-1)}
          aria-label="Año anterior"
        >
          ‹
        </button>
        <div className="mes-nombre-grande">{año}</div>
        <button
          className="flecha-dia"
          onClick={() => alCambiarAnyo(1)}
          aria-label="Año siguiente"
        >
          ›
        </button>
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
            <div
              key={i}
              className="anyo-mes-card"
              onClick={() => alSeleccionarMes(i)}
            >
              <div className="anyo-mes-nombre">
                {nombreMes}
                {tieneComidas && <span className="mes-punto" />}
              </div>

              <div className="anyo-mini-grid">
                {celdas.map((d, j) => {
                  const esHoy =
                    d === hoy.getDate() &&
                    i === hoy.getMonth() &&
                    año === hoy.getFullYear();

                  return (
                    <span
                      key={j}
                      className={`anyo-mini-celda ${esHoy ? 'hoy-mini' : ''}`}
                    >
                      {d ?? ''}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function VistaMes({
  año,
  mes,
  comidasFijas,
  comidas,
  alSeleccionarDia,
  alVolverAlAnyo,
  alCambiarMes,
  alAnadir
}) {
  const hoy = new Date();
  const diasSemana = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const primerDia = new Date(año, mes, 1);
  const ultimoDia = new Date(año, mes + 1, 0);
  const offsetInicio = (primerDia.getDay() + 6) % 7;
  const totalDias = ultimoDia.getDate();
  const celdas = [];

  for (let i = 0; i < offsetInicio; i++) celdas.push(null);
  for (let d = 1; d <= totalDias; d++) celdas.push(d);

  const esHoy = (d) =>
    d === hoy.getDate() &&
    mes === hoy.getMonth() &&
    año === hoy.getFullYear();

  const tieneComida = (dia) =>
    comidas.some(
      comida =>
        comida.fecha ===
        `${año}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
    ) ||
    (
      año === hoy.getFullYear() &&
      mes === hoy.getMonth() &&
      dia === hoy.getDate() &&
      Object.keys(comidasFijas).length > 0
    );

  return (
    <div className="vista-mes">
      <div className="cabecera-calendario">
        <button className="botonAnyo" onClick={alVolverAlAnyo}>
          {año}
        </button>
        <div className="cabecera-dia">
          <button className="btnSinEstilo" onClick={alAnadir}>➕</button>
        </div>
      </div>

      <div className="navegacion-dia">
        <button
          className="flecha-dia"
          onClick={() => alCambiarMes(-1)}
          aria-label="Mes anterior"
        >
          ‹
        </button>
        <div className="mes-nombre-grande">{MESES[mes]}</div>
        <button
          className="flecha-dia"
          onClick={() => alCambiarMes(1)}
          aria-label="Mes siguiente"
        >
          ›
        </button>
      </div>

      <div className="mes-semana-cabecera">
        {diasSemana.map(d => (
          <span className="dia-cabecera" key={d}>
            {d}
          </span>
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
                {tieneComida(d) && <span className="mes-punto" />}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TablaDia({
  fecha,
  alVolverAlMes,
  alCambiarDia,
  horasDelDia,
  comidasFijas,
  comidas,
  alAnadir,
  alAnadirComida,
  alEditar,
  alEliminar
}) {
  const ref6h = useRef(null);
  const [mostrarAcciones, setMostrarAcciones] = useState(null);

  useEffect(() => {
    if (ref6h.current) {
      ref6h.current.scrollIntoView({ block: 'start' });
    }
  }, [fecha]);

  const obtenerComida = (hora) => comidas.find(comida => comida.hora === hora);
  const obtenerComidaFija = (hora) => comidasFijas[hora];

  return (
    <div className="pantalla-completa-dia">
      <div className="cabecera-calendario">
        <button className="botonMes" onClick={alVolverAlMes}>
          {MESES[fecha.getMonth()]}
        </button>
        <div className="cabecera-dia">
          <button className="btnSinEstilo" onClick={alAnadir}>➕</button>
        </div>
      </div>

      <div className="tarjeta-fecha-grande">
        <div className="navegacion-dia">
          <button
            className="flecha-dia"
            onClick={() => alCambiarDia(-1)}
            aria-label="Día anterior"
          >
            ‹
          </button>
          <span className="fecha">
            {fecha.toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'long'
            })}
          </span>
          <button
            className="flecha-dia"
            onClick={() => alCambiarDia(1)}
            aria-label="Día siguiente"
          >
            ›
          </button>
        </div>
      </div>

      <div className="contenido-dia-completo">
        <div className="bloque-horas">
          <div className="timeline-horas">
            {horasDelDia.map((hora) => {
              const comidaFija = obtenerComidaFija(hora);
              const comida = obtenerComida(hora);
              const contenido = comida || comidaFija;

              return (
                <div
                  className="hora-fila"
                  key={hora}
                  ref={hora === '06:00' ? ref6h : null}
                >
                  <div className="hora-eje">{hora}</div>

                  {contenido ? (
                    <div className="hora-contenido">
                      <div
                        className={`tarjeta-evento ${contenido.tipo}`}
                        onClick={() =>
                          setMostrarAcciones(
                            mostrarAcciones === (comida?.id || `fija-${hora}`)
                              ? null
                              : (comida?.id || `fija-${hora}`)
                          )
                        }
                      >
                        <span className="evento-info">
                          {contenido.icono}{' '}
                          <b>
                            {TIPOS_COMIDA.find(t => t.valor === contenido.tipo)?.nombre ||
                              contenido.titulo ||
                              'Comida'}:
                          </b>{' '}
                          {contenido.nombre || contenido.detalle}
                        </span>
                      </div>

                      {mostrarAcciones === (comida?.id || `fija-${hora}`) && (
                        <div className="evento-acciones">
                          {comida ? (
                            <button
                              onClick={() => alEditar(comida)}
                              aria-label="Editar comida"
                              title="Editar"
                            >
                              ✏️
                            </button>
                          ) : (
                            <button
                              aria-label="Editar comida por defecto"
                              title="Editar"
                            >
                              ✏️
                            </button>
                          )}
                          <button
                            onClick={() => comida && alEliminar(comida.id)}
                            aria-label={
                              comida
                                ? 'Eliminar comida'
                                : 'Eliminar comida por defecto'
                            }
                            title="Eliminar"
                          >
                            🗑️
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className="hora-contenido boton-anadir-comida"
                      onClick={() => alAnadirComida(hora)}
                      role="button"
                      tabIndex="0"
                      onKeyDown={(e) =>
                        (e.key === 'Enter' || e.key === ' ') && alAnadirComida(hora)
                      }
                      aria-label={`Añadir comida a las ${hora}`}
                    >
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
