import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { hasSession, loginUser, registerUser } from '../../services/authService';
import Icon from '../../shared/Icon';
import '../../componentes/login.css';

export default function LoginPage({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (hasSession()) return <Navigate to="/" replace />;

  const submit = async event => {
    event.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Introduce tu email y contraseña.');
      return;
    }
    if (mode === 'registro' && !name.trim()) {
      setError('Introduce tu nombre.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    try {
      setLoading(true);
      const session = mode === 'registro'
        ? await registerUser({ nombre: name, email, password })
        : await loginUser({ email, password });
      onAuth(session);
    } catch (err) {
      setError(err.message || 'No se pudo iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  const changeMode = nextMode => {
    setMode(nextMode);
    setError('');
  };

  return (
    <div className="login-app">
      <div className="login-decoracion login-decoracion-uno" />
      <div className="login-decoracion login-decoracion-dos" />

      <section className="login-panel">
        <div className="login-marca">
          <div className="login-logo">C</div>
          <div><span>Planifica mejor</span><h1>Calendar</h1></div>
        </div>

        <div className="login-copy">
          <span className="login-eyebrow">{mode === 'login' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}</span>
          <h2>{mode === 'login' ? 'Organiza tus comidas' : 'Empieza a planificar'}</h2>
          <p>
            {mode === 'login'
              ? 'Accede a tu calendario, recetas y lista de la compra.'
              : 'Guarda tus recetas, planifica la semana y prepara tu compra desde un solo lugar.'}
          </p>
        </div>

        <div className="login-tabs" role="tablist" aria-label="Acceso">
          <button className={mode === 'login' ? 'activo' : ''} onClick={() => changeMode('login')} type="button">Entrar</button>
          <button className={mode === 'registro' ? 'activo' : ''} onClick={() => changeMode('registro')} type="button">Crear cuenta</button>
        </div>

        <form className="login-form" onSubmit={submit}>
          {mode === 'registro' && (
            <label>
              <span>Nombre</span>
              <div className="login-input-wrap">
                <Icon name="user" size={18} />
                <input autoComplete="name" value={name} onChange={event => setName(event.target.value)} placeholder="Tu nombre" />
              </div>
            </label>
          )}

          <label>
            <span>Email</span>
            <div className="login-input-wrap">
              <Icon name="mail" size={18} />
              <input type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="tu@email.com" />
            </div>
          </label>

          <label>
            <span>Contraseña</span>
            <div className="login-input-wrap">
              <Icon name="lock" size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'registro' ? 'new-password' : 'current-password'}
                value={password}
                onChange={event => setPassword(event.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
              <button type="button" className="login-password-toggle" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                <Icon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
              </button>
            </div>
          </label>

          {error && <div className="login-error" role="alert">{error}</div>}

          <button className="login-submit" disabled={loading}>
            {loading ? 'Accediendo...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>

        <p className="login-nota">Tus datos se guardan localmente en este dispositivo hasta conectar la API.</p>
      </section>
    </div>
  );
}
