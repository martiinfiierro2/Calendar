import React, { useEffect, useMemo, useState } from 'react';
import './compra.css';
import { obtenerRecetasGuardadas } from './recetas';
import { categoriaIngrediente } from '../storageScope';

const STORAGE_KEY = 'calendar_compra';
const CATEGORIAS = ['Fruta y verdura', 'Carne y pescado', 'Lácteos', 'Despensa', 'Panadería', 'Otros'];

function Icono({ nombre, size = 20 }) {
  const comunes = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  const iconos = {
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    trash: <><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="m19 6-1 14H6L5 6" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    cart: <><circle cx="9" cy="20" r="1" /><circle cx="19" cy="20" r="1" /><path d="M3 4h2l2.4 10.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L21 8H7" /></>,
    wand: <><path d="m15 4 5 5L8 21l-5-5Z" /><path d="m14 5 5 5" /><path d="M6 3v3" /><path d="M4.5 4.5h3" /></>,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>
  };
  return <svg {...comunes}>{iconos[nombre]}</svg>;
}

const cargar = () => {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(data)) return data;
  } catch {}
  return [];
};

export default function Compra() {
  const [items, setItems] = useState(cargar);
  const [nombre, setNombre] = useState('');
  const [cantidad, setCantidad] = useState('1');
  const [categoria, setCategoria] = useState('Otros');
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const pendientes = useMemo(() => items.filter(i => !i.comprado), [items]);
  const comprados = useMemo(() => items.filter(i => i.comprado), [items]);

  const abrirNuevo = () => {
    setEditando(null);
    setNombre('');
    setCantidad('1');
    setCategoria('Otros');
    setMostrarForm(true);
  };

  const abrirEditar = (item) => {
    setEditando(item);
    setNombre(item.nombre);
    setCantidad(item.cantidad || '1');
    setCategoria(item.categoria || 'Otros');
    setMostrarForm(true);
  };

  const guardar = (e) => {
    e.preventDefault();
    if (!nombre.trim()) return;
    const datos = {
      id: editando?.id || Date.now(),
      nombre: nombre.trim(),
      cantidad: cantidad.trim() || '1',
      categoria,
      comprado: editando?.comprado || false,
      automatico: editando?.automatico || false
    };
    setItems(actuales => editando ? actuales.map(item => item.id === editando.id ? datos : item) : [datos, ...actuales]);
    setMostrarForm(false);
    setEditando(null);
  };

  const alternar = (id) => setItems(actuales => actuales.map(i => i.id === id ? { ...i, comprado: !i.comprado } : i));
  const eliminar = (id) => setItems(actuales => actuales.filter(i => i.id !== id));

  const limpiarComprados = () => {
    if (!comprados.length) return;
    setItems(actuales => actuales.filter(i => !i.comprado));
  };

  const generarDesdeCalendario = () => {
    let comidas = [];
    try { comidas = JSON.parse(localStorage.getItem('calendar_comidas')) || []; } catch {}
    const recetas = obtenerRecetasGuardadas();
    const nuevos = [];
    const vistos = new Set(items.map(i => String(i.nombre || '').trim().toLowerCase()));

    comidas.filter(c => c.modo === 'receta').forEach(comida => {
      const receta = recetas.find(r => String(r.id) === String(comida.recetaId));
      (receta?.ingredientes || []).forEach(ingrediente => {
        const nombreIngrediente = String(ingrediente).trim();
        const clave = nombreIngrediente.toLowerCase();
        if (!nombreIngrediente || vistos.has(clave)) return;
        vistos.add(clave);
        nuevos.push({
          id: `${Date.now()}-${nuevos.length}`,
          nombre: nombreIngrediente,
          cantidad: '1',
          categoria: categoriaIngrediente(nombreIngrediente),
          comprado: false,
          automatico: true
        });
      });
    });

    if (!nuevos.length) {
      window.alert('No hay ingredientes nuevos en las recetas planificadas.');
      return;
    }
    setItems(actuales => [...nuevos, ...actuales]);
  };

  return (
    <div className="compra-app">
      <header className="compra-header">
        <div>
          <span className="compra-eyebrow">Organización</span>
          <h1>Lista de la compra</h1>
        </div>
        <button className="compra-icon-btn compra-add" onClick={abrirNuevo} aria-label="Añadir producto"><Icono nombre="plus" /></button>
      </header>

      <section className="compra-summary">
        <div><strong>{pendientes.length}</strong><span>Pendientes</span></div>
        <div><strong>{comprados.length}</strong><span>Comprados</span></div>
        <button onClick={generarDesdeCalendario}><Icono nombre="wand" size={17} />Desde calendario</button>
      </section>

      <div className="compra-lista">
        {pendientes.length === 0 && comprados.length === 0 && (
          <div className="compra-empty"><span><Icono nombre="cart" size={28} /></span><h2>Tu lista está vacía</h2><p>Añade productos manualmente o genera ingredientes desde las recetas planificadas.</p></div>
        )}

        {CATEGORIAS.map(cat => {
          const grupo = pendientes.filter(i => i.categoria === cat);
          if (!grupo.length) return null;
          return <section className="compra-grupo" key={cat}><h2>{cat}</h2>{grupo.map(item => <Item key={item.id} item={item} alternar={alternar} eliminar={eliminar} editar={abrirEditar} />)}</section>;
        })}

        {comprados.length > 0 && (
          <section className="compra-grupo compra-comprados">
            <div className="compra-grupo-title"><h2>Comprados</h2><button onClick={limpiarComprados}>Limpiar</button></div>
            {comprados.map(item => <Item key={item.id} item={item} alternar={alternar} eliminar={eliminar} editar={abrirEditar} />)}
          </section>
        )}
      </div>

      {mostrarForm && <><div className="compra-overlay" onClick={() => setMostrarForm(false)} /><div className="compra-sheet"><div className="compra-handle"/><h2>{editando ? 'Editar producto' : 'Añadir producto'}</h2><form onSubmit={guardar}><label>Producto<input autoFocus value={nombre} onChange={e => { setNombre(e.target.value); if (!editando && categoria === 'Otros') setCategoria(categoriaIngrediente(e.target.value)); }} placeholder="Ej. Leche" /></label><div className="compra-form-row"><label>Cantidad<input value={cantidad} onChange={e => setCantidad(e.target.value)} /></label><label>Categoría<select value={categoria} onChange={e => setCategoria(e.target.value)}>{CATEGORIAS.map(c => <option key={c}>{c}</option>)}</select></label></div><button className="compra-save" disabled={!nombre.trim()}>{editando ? 'Guardar cambios' : 'Añadir a la lista'}</button></form></div></>}
    </div>
  );
}

function Item({ item, alternar, eliminar, editar }) {
  return <div className={`compra-item ${item.comprado ? 'hecho' : ''}`}><button className="compra-check" onClick={() => alternar(item.id)} aria-label={item.comprado ? 'Marcar pendiente' : 'Marcar comprado'}>{item.comprado && <Icono nombre="check" size={15} />}</button><div className="compra-item-info"><strong>{item.nombre}</strong><span>{item.cantidad}</span></div><button className="compra-delete" onClick={() => editar(item)} aria-label="Editar"><Icono nombre="edit" size={17} /></button><button className="compra-delete" onClick={() => eliminar(item.id)} aria-label="Eliminar"><Icono nombre="trash" size={17} /></button></div>;
}
