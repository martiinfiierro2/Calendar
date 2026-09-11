import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { haySesion, iniciarSesion, registrarUsuario } from '../auth';
import './login.css';

function Icono({ nombre, size = 20 }) {
  const comunes = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  const iconos = {
    mail: <><path d="M4 6h16v12H4z" /><path d="m4 7 8 6 8-6" /></>,
    lock: <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></>,
    eyeOff: <><path d="m3 3 18 18" /><path d="M10.6 6.2A9.5 9.5 0 0 1 12 6c6.5 0 10 6 10 6a17 17 0 0 1-2.2 3" /><path d="M6.4 6.4C3.5 8.2 2 12 2 12s3.5 6 10 6a9 9 0 0 0 4.2-1" /></>
  };
  return <svg {...comunes}>{iconos[nombre]}</svg>;
}

export default function Login({ onAuth }) {
  const [modo, setModo] = useState('login');
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  if (haySesion()) return <Navigate to="/" replace />;

  const enviar = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Introduce tu email y contraseña.');
      return;
    }
    if (modo === 'registro' && !nombre.trim()) {
      setError('Introduce tu nombre.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      setCargando(true);
      const sesion = modo === 'registro'
        ? await registrarUsuario({ nombre, email, password })
        : await iniciarSesion({ email, password });
      onAuth(sesion);
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión.');
    } finally {
      setCargando(false);
    }
  };

  const cambiarModo = (nuevoModo) => {
    setModo(nuevoModo);
    setError('');
  };

  return (
    <div className="login-app">
      <div className="login-decoracion login-decoracion-uno" />
      <div className="login-decoracion login-decoracion-dos" />

      <section className="login-panel">
        <div className="login-marca">
          <div className="login-logo">C</div>
          <div>
            <span>Planifica mejor</span>
            <h1>Calendar</h1>
          </div>
        </div>

        <div className="login-copy">
          <span className="login-eyebrow">{modo === 'login' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}</span>
          <h2>{modo === 'login' ? 'Organiza tus comidas' : 'Empieza a planificar'}</h2>
          <p>{modo === 'login' ? 'Accede a tu calendario, recetas y lista de la compra.' : 'Guarda tus recetas, planifica la semana y prepara tu compra desde un solo lugar.'}</p>
        </div>

        <div className="login-tabs" role="tablist" aria-label="Acceso">
          <button className={modo === 'login' ? 'activo' : ''} onClick={() => cambiarModo('login')} type="button">Entrar</button>
          <button className={modo === 'registro' ? 'activo' : ''} onClick={() => cambiarModo('registro')} type="button">Crear cuenta</button>
        </div>

        <form className="login-form" onSubmit={enviar}>
          {modo === 'registro' && (
            <label>
              <span>Nombre</span>
              <div className="login-input-wrap"><Icono nombre="user" size={18} /><input autoComplete="name" value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Tu nombre" /></div>
            </label>
          )}

          <label>
            <span>Email</span>
            <div className="login-input-wrap"><Icono nombre="mail" size={18} /><input type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" /></div>
          </label>

          <label>
            <span>Contraseña</span>
            <div className="login-input-wrap">
              <Icono nombre="lock" size={18} />
              <input type={mostrarPassword ? 'text' : 'password'} autoComplete={modo === 'registro' ? 'new-password' : 'current-password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" />
              <button type="button" className="login-password-toggle" onClick={() => setMostrarPassword(v => !v)} aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}><Icono nombre={mostrarPassword ? 'eyeOff' : 'eye'} size={18} /></button>
            </div>
          </label>

          {error && <div className="login-error" role="alert">{error}</div>}

          <button className="login-submit" disabled={cargando}>{cargando ? 'Accediendo...' : modo === 'login' ? 'Entrar' : 'Crear cuenta'}</button>
        </form>

        <p className="login-nota">Tus datos se guardan localmente en este dispositivo hasta conectar la API.</p>
      </section>
    </div>
  );
}
