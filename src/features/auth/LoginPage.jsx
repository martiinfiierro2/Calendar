import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { hasSession, loginUser, registerUser } from '../../services/authService';
import Icon from '../../shared/Icon';
import '../../componentes/login.css';

export default function LoginPage({ onAuth, invitationToken }) {
  const [mode, setMode] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registerStep, setRegisterStep] = useState(1);
  const [accountType, setAccountType] = useState(null);

  if (hasSession()) return <Navigate to="/" replace />;

  const changeToAccount = () => {
    setError('');

    if (!name.trim()) {
      setError('Introduce tu nombre.');
      return;
    }

    if (!email.trim()) {
      setError('Introduce tu email.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (invitationToken) {
      submit({ preventDefault() {} });
      return;
    }
    setRegisterStep(2);
  };

  const backToPersonalData = () => {
    setError('');
    setRegisterStep(1);
  };

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

    if (mode === 'registro' && !invitationToken && !accountType) {
      setError('Selecciona el tipo de cuenta que quieres crear.');
      return;
    }

    try {
      setLoading(true);
      const session = mode === 'registro'
        ? await registerUser({ nombre: name, email, password, accountType, invitationToken })
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
    setRegisterStep(1);
    setAccountType(null);
  };

  const isRegister = mode === 'registro';
  const isAccountStep = isRegister && registerStep === 2;

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
          <span className="login-eyebrow">
            {invitationToken ? 'Te han invitado a una familia' : mode === 'login' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}
          </span>
          <h2>
            {mode === 'login'
              ? 'Organiza tus comidas'
              : isAccountStep
                ? '¿Cómo vas a usar Calendar?'
                : 'Empieza a planificar'}
          </h2>
          <p>
            {mode === 'login'
              ? invitationToken ? 'Inicia sesión con el correo invitado para confirmar que quieres unirte.' : 'Accede a tu calendario, recetas y lista de la compra.'
              : isAccountStep
                ? 'Elige cómo quieres organizar y compartir tu calendario, recetas y lista de la compra.'
                : invitationToken ? 'Usa el correo al que te invitaron. Después lo verificarás y confirmarás tu entrada en la familia.' : 'Crea tus datos de acceso y después elige el tipo de cuenta. Verificaremos tu correo antes de empezar.'}
          </p>
        </div>

        <div className="login-tabs" role="tablist" aria-label="Acceso">
          <button className={mode === 'login' ? 'activo' : ''} onClick={() => changeMode('login')} type="button">Entrar</button>
          <button className={mode === 'registro' ? 'activo' : ''} onClick={() => changeMode('registro')} type="button">Crear cuenta</button>
        </div>

        {isRegister && !invitationToken && (
          <div className="register-progress" aria-label={`Paso ${registerStep} de 2`}>
            <div className="register-progress-copy">
              <span>Paso {registerStep} de 2</span>
              <strong>{registerStep === 1 ? 'Tus datos' : 'Tipo de cuenta'}</strong>
            </div>
            <div className="register-progress-track" aria-hidden="true">
              <span style={{ width: registerStep === 1 ? '50%' : '100%' }} />
            </div>
          </div>
        )}

        {mode === 'login' &&
          <form className="login-form login-step" onSubmit={submit}>
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
                  autoComplete="current-password"
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
              {loading ? 'Accediendo...' : 'Entrar'}
            </button>
          </form>
        }

        {mode === 'registro' && registerStep === 1 &&
          <div className="login-form login-step" key="register-step-1">
            <label>
              <span>Nombre</span>
              <div className="login-input-wrap">
                <Icon name="user" size={18} />
                <input autoComplete="name" value={name} onChange={event => setName(event.target.value)} placeholder="Tu nombre" />
              </div>
            </label>

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
                  autoComplete="new-password"
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

            <button className="login-submit" type="button" onClick={changeToAccount} disabled={loading}>
              {invitationToken ? loading ? 'Creando...' : 'Crear usuario y verificar correo' : 'Continuar'}
            </button>
          </div>
        }

        {mode === 'registro' && registerStep === 2 &&
          <div className="login-form login-step" key="register-step-2">
            <div className="account-type-selector" role="group" aria-label="Tipo de cuenta">
              <button
                type="button"
                className={`account-option ${accountType === 'individual' ? 'selected' : ''}`}
                onClick={() => setAccountType('individual')}
                aria-pressed={accountType === 'individual'}
              >
                <span className="account-icon"><Icon name="user" size={30} strokeWidth={1.9} /></span>
                <span className="account-option-text">
                  <strong>Individual</strong>
                  <small>Solo para ti</small>
                </span>
              </button>

              <button
                type="button"
                className={`account-option ${accountType === 'grupal' ? 'selected' : ''}`}
                onClick={() => setAccountType('grupal')}
                aria-pressed={accountType === 'grupal'}
              >
                <span className="account-icon"><Icon name="users" size={30} strokeWidth={1.9} /></span>
                <span className="account-option-text">
                  <strong>Familiar</strong>
                  <small>Una cuenta para tu hogar</small>
                </span>
              </button>
            </div>

            <p className="account-type-help">Podrás cambiar esta opción más adelante desde la configuración de tu cuenta.</p>

            {error && <div className="login-error" role="alert">{error}</div>}

            <div className="register-actions">
              <button className="login-back" type="button" onClick={backToPersonalData} disabled={loading}>
                <Icon name="back" size={17} />
                Atrás
              </button>
              <button className="login-submit register-create" type="button" onClick={submit} disabled={loading || !accountType}>
                {loading ? 'Creando...' : 'Crear cuenta'}
              </button>
            </div>
          </div>
        }

        <p className="login-nota">Un correo, un usuario y una sola cuenta. Tus datos personales son privados.</p>
      </section>
    </div>
  );
}
