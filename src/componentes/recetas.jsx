import React, { useEffect, useMemo, useState } from 'react';
import './recetas.css';

export const recetasData = [
  {
    id: 1,
    nombre: 'Lasaña bolognesa',
    categoria: 'Pasta',
    tiempo: 55,
    raciones: 4,
    dificultad: 'Media',
    favorito: true,
    imagen: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?auto=format&fit=crop&w=700&q=80',
    ingredientes: ['12 placas de lasaña', '500 g de carne picada', 'Tomate triturado', 'Bechamel', 'Queso rallado'],
    pasos: ['Preparar la salsa de carne y tomate.', 'Montar capas de pasta, salsa y bechamel.', 'Cubrir con queso y hornear hasta gratinar.'],
    planificada: { fecha: '5 junio', hora: '14:00' }
  },
  {
    id: 2,
    nombre: 'Pollo al curry',
    categoria: 'Carne',
    tiempo: 35,
    raciones: 3,
    dificultad: 'Fácil',
    favorito: false,
    imagen: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=700&q=80',
    ingredientes: ['500 g de pollo', 'Leche de coco', 'Curry', 'Cebolla', 'Arroz basmati'],
    pasos: ['Dorar el pollo.', 'Pochar la cebolla y añadir el curry.', 'Añadir leche de coco y cocinar 15 minutos.', 'Servir con arroz.'],
    planificada: { fecha: '6 junio', hora: '14:00' }
  },
  {
    id: 3,
    nombre: 'Gazpacho andaluz',
    categoria: 'Vegetal',
    tiempo: 15,
    raciones: 4,
    dificultad: 'Fácil',
    favorito: true,
    imagen: 'https://images.unsplash.com/photo-1603105037880-880cd4edfb0d?auto=format&fit=crop&w=700&q=80',
    ingredientes: ['Tomate maduro', 'Pepino', 'Pimiento verde', 'Aceite de oliva', 'Vinagre'],
    pasos: ['Trocear las verduras.', 'Triturar con aceite, vinagre y sal.', 'Enfriar antes de servir.'],
    planificada: null
  },
  {
    id: 4,
    nombre: 'Paella valenciana',
    categoria: 'Arroz',
    tiempo: 60,
    raciones: 4,
    dificultad: 'Media',
    favorito: false,
    imagen: 'https://images.unsplash.com/photo-1534080564583-6be75777b70a?auto=format&fit=crop&w=700&q=80',
    ingredientes: ['Arroz', 'Pollo', 'Conejo', 'Judía verde', 'Garrofón', 'Azafrán'],
    pasos: ['Sofreír la carne y las verduras.', 'Añadir agua y cocinar el caldo.', 'Incorporar el arroz y cocinar sin remover.'],
    planificada: { fecha: '7 junio', hora: '14:00' }
  },
  {
    id: 5,
    nombre: 'Tortilla de patatas',
    categoria: 'Huevos',
    tiempo: 35,
    raciones: 4,
    dificultad: 'Fácil',
    favorito: true,
    imagen: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=700&q=80',
    ingredientes: ['5 huevos', '600 g de patatas', 'Cebolla', 'Aceite de oliva', 'Sal'],
    pasos: ['Pochar las patatas y la cebolla.', 'Mezclar con los huevos batidos.', 'Cuajar por ambos lados.'],
    planificada: null
  },
  {
    id: 6,
    nombre: 'Salmón a la plancha',
    categoria: 'Pescado',
    tiempo: 20,
    raciones: 2,
    dificultad: 'Fácil',
    favorito: false,
    imagen: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=700&q=80',
    ingredientes: ['2 lomos de salmón', 'Limón', 'Aceite de oliva', 'Pimienta', 'Sal'],
    pasos: ['Secar y salpimentar el salmón.', 'Cocinar a la plancha por ambos lados.', 'Terminar con limón.'],
    planificada: { fecha: '8 junio', hora: '21:00' }
  },
  {
    id: 7,
    nombre: 'Croquetas de jamón',
    categoria: 'Entrante',
    tiempo: 50,
    raciones: 4,
    dificultad: 'Media',
    favorito: false,
    imagen: 'https://images.unsplash.com/photo-1625944525533-473f1a3d54e7?auto=format&fit=crop&w=700&q=80',
    ingredientes: ['Jamón serrano', 'Leche', 'Harina', 'Mantequilla', 'Huevo', 'Pan rallado'],
    pasos: ['Preparar una bechamel espesa con el jamón.', 'Enfriar la masa.', 'Formar, empanar y freír.'],
    planificada: null
  },
  {
    id: 8,
    nombre: 'Lentejas estofadas',
    categoria: 'Legumbres',
    tiempo: 50,
    raciones: 4,
    dificultad: 'Fácil',
    favorito: false,
    imagen: 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=700&q=80',
    ingredientes: ['Lentejas', 'Zanahoria', 'Cebolla', 'Pimiento', 'Pimentón'],
    pasos: ['Sofreír las verduras.', 'Añadir lentejas y agua.', 'Cocinar a fuego suave hasta que estén tiernas.'],
    planificada: { fecha: '9 junio', hora: '14:00' }
  }
];

const STORAGE_KEY = 'calendar_recetas';
const CATEGORIAS = ['Todas', 'Favoritas', 'Pasta', 'Carne', 'Vegetal', 'Arroz', 'Huevos', 'Pescado', 'Entrante', 'Legumbres', 'Otros'];

function Icono({ nombre, size = 20 }) {
  const comunes = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  const iconos = {
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.6-3.6" /></>,
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    close: <><path d="m6 6 12 12" /><path d="m18 6-12 12" /></>,
    back: <path d="m15 18-6-6 6-6" />,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
    trash: <><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="m19 6-1 14H6L5 6" /></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z" />,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /></>,
    chef: <><path d="M6 13h12v8H6z" /><path d="M7 13a4 4 0 1 1 2-7.46A5 5 0 0 1 18 9a3 3 0 0 1 0 6" /></>
  };
  return <svg {...comunes}>{iconos[nombre]}</svg>;
}

const normalizarReceta = (receta) => ({
  categoria: 'Otros',
  tiempo: 30,
  raciones: 2,
  dificultad: 'Fácil',
  favorito: false,
  ingredientes: [],
  pasos: [],
  planificada: null,
  ...receta
});

const cargarRecetas = () => {
  try {
    const guardadas = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(guardadas) && guardadas.length) return guardadas.map(normalizarReceta);
  } catch {}
  return recetasData.map(normalizarReceta);
};

export function obtenerRecetasGuardadas() {
  return cargarRecetas();
}

const formularioVacio = {
  nombre: '', categoria: 'Otros', tiempo: 30, raciones: 2, dificultad: 'Fácil', imagen: '', ingredientes: '', pasos: ''
};

export default function Recetas() {
  const [recetas, setRecetas] = useState(cargarRecetas);
  const [query, setQuery] = useState('');
  const [busquedaAbierta, setBusquedaAbierta] = useState(false);
  const [categoria, setCategoria] = useState('Todas');
  const [detalle, setDetalle] = useState(null);
  const [editando, setEditando] = useState(null);
  const [formulario, setFormulario] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recetas));
  }, [recetas]);

  const recetasFiltradas = useMemo(() => {
    const texto = query.trim().toLowerCase();
    return recetas.filter(receta => {
      const coincideTexto = !texto || receta.nombre.toLowerCase().includes(texto) || receta.ingredientes.some(i => i.toLowerCase().includes(texto));
      const coincideCategoria = categoria === 'Todas' || (categoria === 'Favoritas' ? receta.favorito : receta.categoria === categoria);
      return coincideTexto && coincideCategoria;
    });
  }, [recetas, query, categoria]);

  const abrirNueva = () => {
    setDetalle(null);
    setEditando(null);
    setFormulario({ ...formularioVacio });
  };

  const abrirEditar = (receta) => {
    setDetalle(null);
    setEditando(receta);
    setFormulario({
      nombre: receta.nombre,
      categoria: receta.categoria,
      tiempo: receta.tiempo,
      raciones: receta.raciones,
      dificultad: receta.dificultad,
      imagen: receta.imagen || '',
      ingredientes: receta.ingredientes.join('\n'),
      pasos: receta.pasos.join('\n')
    });
  };

  const guardar = (e) => {
    e.preventDefault();
    if (!formulario?.nombre.trim()) return;
    const datos = {
      id: editando?.id || Date.now(),
      nombre: formulario.nombre.trim(),
      categoria: formulario.categoria,
      tiempo: Math.max(1, Number(formulario.tiempo) || 1),
      raciones: Math.max(1, Number(formulario.raciones) || 1),
      dificultad: formulario.dificultad,
      favorito: editando?.favorito || false,
      imagen: formulario.imagen.trim() || `https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=700&q=80`,
      ingredientes: formulario.ingredientes.split('\n').map(v => v.trim()).filter(Boolean),
      pasos: formulario.pasos.split('\n').map(v => v.trim()).filter(Boolean),
      planificada: editando?.planificada || null
    };
    setRecetas(actuales => editando ? actuales.map(r => r.id === editando.id ? datos : r) : [datos, ...actuales]);
    setEditando(null);
    setFormulario(null);
  };

  const eliminar = (receta) => {
    if (!window.confirm(`¿Eliminar "${receta.nombre}"?`)) return;
    setRecetas(actuales => actuales.filter(r => r.id !== receta.id));
    setDetalle(null);
  };

  const alternarFavorito = (id) => {
    setRecetas(actuales => actuales.map(r => r.id === id ? { ...r, favorito: !r.favorito } : r));
    setDetalle(actual => actual?.id === id ? { ...actual, favorito: !actual.favorito } : actual);
  };

  const abrirDetalle = (receta) => {
    setFormulario(null);
    setEditando(null);
    setDetalle(receta);
  };

  return (
    <div className="recetas-pantalla recetas-app">
      <header className="recetas-cabecera recetas-header">
        <div>
          <span className="recetas-eyebrow">Mi cocina</span>
          <h1 className="recetas-titulo">Recetas</h1>
        </div>
        <div className="recetas-header-actions">
          <button className={`recetas-icon-btn ${busquedaAbierta ? 'activo' : ''}`} onClick={() => setBusquedaAbierta(v => !v)} aria-label="Buscar"><Icono nombre="search" /></button>
          <button className="recetas-icon-btn recetas-add-btn" onClick={abrirNueva} aria-label="Nueva receta"><Icono nombre="plus" /></button>
        </div>
      </header>

      {busquedaAbierta && (
        <div className="recetas-search-wrap">
          <Icono nombre="search" size={17} />
          <input autoFocus type="search" placeholder="Nombre o ingrediente..." value={query} onChange={e => setQuery(e.target.value)} />
          {query && <button onClick={() => setQuery('')} aria-label="Limpiar"><Icono nombre="close" size={16} /></button>}
        </div>
      )}

      <div className="recetas-filtros" role="tablist" aria-label="Categorías">
        {CATEGORIAS.map(item => (
          <button key={item} className={categoria === item ? 'activo' : ''} onClick={() => setCategoria(item)}>{item}</button>
        ))}
      </div>

      <div className="recetas-resumen">
        <strong>{recetasFiltradas.length}</strong>
        <span>{recetasFiltradas.length === 1 ? 'receta' : 'recetas'}</span>
      </div>

      <div className="recetas-lista recetas-grid-lista">
        {recetasFiltradas.length === 0 ? (
          <div className="recetas-vacio">
            <span className="recetas-vacio-icono"><Icono nombre="chef" size={28} /></span>
            <strong>No hay recetas aquí</strong>
            <p>Prueba con otra búsqueda o crea una receta nueva.</p>
            <button onClick={abrirNueva}><Icono nombre="plus" size={17} /> Crear receta</button>
          </div>
        ) : recetasFiltradas.map(receta => (
          <article
            key={receta.id}
            className="receta-card receta-card-nueva"
            onClick={() => abrirDetalle(receta)}
            role="button"
            tabIndex={0}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                abrirDetalle(receta);
              }
            }}
            aria-label={`Ver receta ${receta.nombre}`}
          >
            <div className="receta-imagen-wrap">
              <img src={receta.imagen} alt={receta.nombre} className="receta-imagen" />
              <button className={`receta-favorito ${receta.favorito ? 'activo' : ''}`} onClick={e => { e.stopPropagation(); alternarFavorito(receta.id); }} aria-label="Favorito">
                <Icono nombre="heart" size={17} />
              </button>
            </div>
            <div className="receta-info">
              <span className="receta-categoria">{receta.categoria}</span>
              <strong className="receta-nombre">{receta.nombre}</strong>
              <div className="receta-meta">
                <span><Icono nombre="clock" size={14} /> {receta.tiempo} min</span>
                <span><Icono nombre="users" size={14} /> {receta.raciones}</span>
              </div>
              <div className="receta-pie">
                <span>{receta.dificultad}</span>
                {receta.planificada && <span className="receta-planificada">Planificada</span>}
              </div>
            </div>
          </article>
        ))}
      </div>

      {detalle && (
        <div className="recetas-modal-layer">
          <button className="recetas-modal-backdrop" onClick={() => setDetalle(null)} aria-label="Cerrar" />
          <section className="receta-detalle-sheet">
            <div className="receta-detalle-imagen">
              <img src={detalle.imagen} alt={detalle.nombre} />
              <button className="recetas-floating-btn izquierda" onClick={() => setDetalle(null)} aria-label="Volver"><Icono nombre="back" /></button>
              <button className={`recetas-floating-btn derecha ${detalle.favorito ? 'favorito' : ''}`} onClick={() => alternarFavorito(detalle.id)} aria-label="Favorito"><Icono nombre="heart" /></button>
            </div>
            <div className="receta-detalle-contenido">
              <span className="receta-categoria">{detalle.categoria}</span>
              <h2>{detalle.nombre}</h2>
              <div className="receta-detalle-meta">
                <span><Icono nombre="clock" size={16} /><b>{detalle.tiempo}</b><small>minutos</small></span>
                <span><Icono nombre="users" size={16} /><b>{detalle.raciones}</b><small>raciones</small></span>
                <span><Icono nombre="chef" size={16} /><b>{detalle.dificultad}</b><small>dificultad</small></span>
              </div>
              <div className="receta-detalle-scroll">
                <h3>Ingredientes</h3>
                {detalle.ingredientes.length ? <ul>{detalle.ingredientes.map((item, i) => <li key={i}>{item}</li>)}</ul> : <p className="receta-muted">Sin ingredientes añadidos.</p>}
                <h3>Preparación</h3>
                {detalle.pasos.length ? <ol>{detalle.pasos.map((item, i) => <li key={i}><span>{i + 1}</span><p>{item}</p></li>)}</ol> : <p className="receta-muted">Sin pasos añadidos.</p>}
              </div>
              <div className="receta-detalle-actions">
                <button onClick={() => abrirEditar(detalle)}><Icono nombre="edit" size={17} /> Editar</button>
                <button className="danger" onClick={() => eliminar(detalle)}><Icono nombre="trash" size={17} /> Eliminar</button>
              </div>
            </div>
          </section>
        </div>
      )}

      {formulario !== null && (
        <div className="recetas-modal-layer">
          <button className="recetas-modal-backdrop" onClick={() => { setFormulario(null); setEditando(null); }} aria-label="Cerrar" />
          <section className="receta-form-sheet">
            <div className="receta-form-header">
              <button className="recetas-icon-btn" onClick={() => { setFormulario(null); setEditando(null); }}><Icono nombre="back" /></button>
              <div><span>{editando ? 'Actualizar' : 'Nueva'}</span><h2>{editando ? 'Editar receta' : 'Crear receta'}</h2></div>
              <div />
            </div>
            <form onSubmit={guardar} className="receta-form">
              <label>Nombre<input required value={formulario.nombre} onChange={e => setFormulario({ ...formulario, nombre: e.target.value })} placeholder="Ej. Pasta al pesto" /></label>
              <div className="receta-form-row">
                <label>Categoría<select value={formulario.categoria} onChange={e => setFormulario({ ...formulario, categoria: e.target.value })}>{CATEGORIAS.filter(c => !['Todas', 'Favoritas'].includes(c)).map(c => <option key={c}>{c}</option>)}</select></label>
                <label>Dificultad<select value={formulario.dificultad} onChange={e => setFormulario({ ...formulario, dificultad: e.target.value })}><option>Fácil</option><option>Media</option><option>Difícil</option></select></label>
              </div>
              <div className="receta-form-row">
                <label>Tiempo (min)<input type="number" min="1" value={formulario.tiempo} onChange={e => setFormulario({ ...formulario, tiempo: e.target.value })} /></label>
                <label>Raciones<input type="number" min="1" value={formulario.raciones} onChange={e => setFormulario({ ...formulario, raciones: e.target.value })} /></label>
              </div>
              <label>Imagen <span className="label-opcional">opcional</span><input value={formulario.imagen} onChange={e => setFormulario({ ...formulario, imagen: e.target.value })} placeholder="URL de la imagen" /></label>
              <label>Ingredientes <span className="label-ayuda">uno por línea</span><textarea rows="5" value={formulario.ingredientes} onChange={e => setFormulario({ ...formulario, ingredientes: e.target.value })} placeholder={'200 g de pasta\n2 tomates\nAceite de oliva'} /></label>
              <label>Preparación <span className="label-ayuda">un paso por línea</span><textarea rows="6" value={formulario.pasos} onChange={e => setFormulario({ ...formulario, pasos: e.target.value })} placeholder={'Cocer la pasta.\nPreparar la salsa.\nMezclar y servir.'} /></label>
              <button className="receta-form-submit" type="submit">{editando ? 'Guardar cambios' : 'Crear receta'}</button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
