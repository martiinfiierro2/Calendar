import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cerrarSesion } from '../auth';
import './perfil.css';

const STORAGE_KEY = 'calendar_perfil';
const PERFIL_INICIAL = {
  nombre: 'Mi perfil',
  email: '',
  raciones: 2,
  dieta: 'Sin preferencias',
  recordatorios: true,
  resumenSemanal: true,
  comprasAutomaticas: false
};

function Icono({ nombre, size = 20 }) {
  const comunes = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  const iconos = {
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    trash: <><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="m19 6-1 14H6L5 6" /></>,
    sliders: <><path d="M4 6h10" /><path d="M18 6h2" /><circle cx="16" cy="6" r="2" /><path d="M4 12h2" /><path d="M10 12h10" /><circle cx="8" cy="12" r="2" /><path d="M4 18h7" /><path d="M15 18h5" /><circle cx="13" cy="18" r="2" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></>,
    logout: <><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /><path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" /></>
  };
  return <svg {...comunes}>{iconos[nombre]}</svg>;
}

const cargarPerfil = () => {
  try {
    return { ...PERFIL_INICIAL, ...(JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}) };
  } catch {
    return PERFIL_INICIAL;
  }
};

export default function Perfil({ onLogout }) {
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState(cargarPerfil);
  const [editando, setEditando] = useState(false);
  const [borrador, setBorrador] = useState(perfil);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(perfil));
  }, [perfil]);

  const guardar = (e) => {
    e.preventDefault();
    setPerfil({ ...borrador, nombre: borrador.nombre.trim() || 'Mi perfil', raciones: Math.max(1, Number(borrador.raciones) || 1) });
    setEditando(false);
  };

  const toggle = (campo) => setPerfil(actual => ({ ...actual, [campo]: !actual[campo] }));

  const limpiarDatos = () => {
    if (!window.confirm('Se eliminarán recetas, comidas del calendario, lista de la compra y preferencias guardadas en este dispositivo. ¿Continuar?')) return;
    ['calendar_recetas', 'calendar_comidas', 'calendar_compra', STORAGE_KEY].forEach(clave => localStorage.removeItem(clave));
    setPerfil(PERFIL_INICIAL);
    setBorrador(PERFIL_INICIAL);
    window.alert('Los datos locales de la aplicación se han eliminado.');
  };

  const salir = () => {
    cerrarSesion();
    onLogout?.();
    navigate('/login', { replace: true });
  };

  return (
    <div className="perfil-app">
      <header className="perfil-header">
        <div><span className="perfil-eyebrow">Cuenta</span><h1>Perfil</h1></div>
        <button className="perfil-icon-btn" onClick={() => { setBorrador(perfil); setEditando(true); }} aria-label="Editar perfil"><Icono nombre="edit" /></button>
      </header>

      <div className="perfil-scroll">
        <section className="perfil-card perfil-identidad">
          <div className="perfil-avatar"><Icono nombre="user" size={30} /></div>
          <div><h2>{perfil.nombre}</h2><p>{perfil.email || 'Perfil local en este dispositivo'}</p></div>
        </section>

        <section className="perfil-stats">
          <div><span><Icono nombre="users" size={18} /></span><strong>{perfil.raciones}</strong><small>Raciones por defecto</small></div>
          <div><span><Icono nombre="sliders" size={18} /></span><strong>{perfil.dieta}</strong><small>Preferencia alimentaria</small></div>
        </section>

        <section className="perfil-seccion">
          <h2>Preferencias</h2>
          <div className="perfil-ajustes">
            <Ajuste icono="bell" titulo="Recordatorios de comidas" texto="Avisos para comidas planificadas" activo={perfil.recordatorios} onChange={() => toggle('recordatorios')} />
            <Ajuste icono="sliders" titulo="Resumen semanal" texto="Mantener activa la planificación semanal" activo={perfil.resumenSemanal} onChange={() => toggle('resumenSemanal')} />
            <Ajuste icono="users" titulo="Compra automática" texto="Preparar la lista desde recetas planificadas" activo={perfil.comprasAutomaticas} onChange={() => toggle('comprasAutomaticas')} />
          </div>
        </section>

        <section className="perfil-seccion">
          <h2>Sesión</h2>
          <button className="perfil-logout" onClick={salir}><Icono nombre="logout" size={18} /><span><strong>Cerrar sesión</strong><small>Vuelve a la pantalla de acceso</small></span></button>
        </section>

        <section className="perfil-seccion">
          <h2>Datos de la aplicación</h2>
          <button className="perfil-danger" onClick={limpiarDatos}><Icono nombre="trash" size={18} /><span><strong>Borrar datos locales</strong><small>Restablece calendario, recetas, compra y perfil</small></span></button>
        </section>
      </div>

      {editando && <><div className="perfil-overlay" onClick={() => setEditando(false)} /><div className="perfil-sheet"><div className="perfil-handle"/><h2>Editar perfil</h2><form onSubmit={guardar}><label>Nombre<input value={borrador.nombre} onChange={e => setBorrador({ ...borrador, nombre: e.target.value })} /></label><label>Email<input type="email" value={borrador.email} onChange={e => setBorrador({ ...borrador, email: e.target.value })} placeholder="opcional" /></label><div className="perfil-form-row"><label>Raciones<input type="number" min="1" max="12" value={borrador.raciones} onChange={e => setBorrador({ ...borrador, raciones: e.target.value })} /></label><label>Dieta<select value={borrador.dieta} onChange={e => setBorrador({ ...borrador, dieta: e.target.value })}><option>Sin preferencias</option><option>Vegetariana</option><option>Vegana</option><option>Sin gluten</option><option>Alta en proteína</option></select></label></div><button className="perfil-save"><Icono nombre="check" size={17}/>Guardar cambios</button></form></div></>}
    </div>
  );
}

function Ajuste({ icono, titulo, texto, activo, onChange }) {
  return <div className="perfil-ajuste"><span className="perfil-ajuste-icon"><Icono nombre={icono} size={18} /></span><div><strong>{titulo}</strong><small>{texto}</small></div><button className={`perfil-switch ${activo ? 'activo' : ''}`} onClick={onChange} aria-pressed={activo}><span /></button></div>;
}
