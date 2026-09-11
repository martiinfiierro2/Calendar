import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PERFIL_INICIAL } from '../../config/appConfig';
import { logoutUser } from '../../services/authService';
import { syncAutomaticShopping } from '../../services/shoppingService';
import { clearUserData, readStorage, writeStorage } from '../../services/storageService';
import Icon from '../../shared/Icon';
import '../../componentes/perfil.css';

function loadProfile() {
  return {
    ...PERFIL_INICIAL,
    ...(readStorage('calendar_perfil', {}) || {})
  };
}

export default function ProfilePage({ onLogout }) {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(loadProfile);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(profile);

  // Guarda preferencias y aplica la compra automática al activarla.
  useEffect(() => {
    writeStorage('calendar_perfil', profile);
    if (profile.comprasAutomaticas) syncAutomaticShopping();
  }, [profile]);

  const saveProfile = event => {
    event.preventDefault();
    setProfile({
      ...draft,
      nombre: draft.nombre.trim() || 'Mi perfil',
      raciones: Math.max(1, Number(draft.raciones) || 1)
    });
    setEditing(false);
  };

  const toggle = field => {
    setProfile(current => ({ ...current, [field]: !current[field] }));
  };

  const clearData = () => {
    const confirmed = window.confirm(
      'Se eliminarán recetas, comidas del calendario, lista de la compra y preferencias de esta cuenta. ¿Continuar?'
    );
    if (!confirmed) return;

    clearUserData();
    setProfile(PERFIL_INICIAL);
    setDraft(PERFIL_INICIAL);
    window.alert('Los datos locales de esta cuenta se han eliminado.');
  };

  const logout = () => {
    logoutUser();
    onLogout?.();
    navigate('/login', { replace: true });
  };

  return (
    <div className="perfil-app">
      <header className="perfil-header">
        <div>
          <span className="perfil-eyebrow">Cuenta</span>
          <h1>Perfil</h1>
        </div>
        <button
          className="perfil-icon-btn"
          onClick={() => {
            setDraft(profile);
            setEditing(true);
          }}
          aria-label="Editar perfil"
        >
          <Icon name="edit" />
        </button>
      </header>

      <div className="perfil-scroll">
        <section className="perfil-card perfil-identidad">
          <div className="perfil-avatar"><Icon name="user" size={30} /></div>
          <div>
            <h2>{profile.nombre}</h2>
            <p>{profile.email || 'Perfil local en este dispositivo'}</p>
          </div>
        </section>

        <section className="perfil-stats">
          <div>
            <span><Icon name="users" size={18} /></span>
            <strong>{profile.raciones}</strong>
            <small>Raciones por defecto</small>
          </div>
          <div>
            <span><Icon name="sliders" size={18} /></span>
            <strong>{profile.dieta}</strong>
            <small>Preferencia alimentaria</small>
          </div>
        </section>

        <section className="perfil-seccion">
          <h2>Preferencias</h2>
          <div className="perfil-ajustes">
            <Setting icon="bell" title="Recordatorios de comidas" text="Avisos para comidas planificadas" active={profile.recordatorios} onChange={() => toggle('recordatorios')} />
            <Setting icon="sliders" title="Resumen semanal" text="Mantener activa la planificación semanal" active={profile.resumenSemanal} onChange={() => toggle('resumenSemanal')} />
            <Setting icon="users" title="Compra automática" text="Preparar la lista desde recetas planificadas" active={profile.comprasAutomaticas} onChange={() => toggle('comprasAutomaticas')} />
          </div>
        </section>

        <section className="perfil-seccion">
          <h2>Sesión</h2>
          <button className="perfil-logout" onClick={logout}>
            <Icon name="logout" size={18} />
            <span><strong>Cerrar sesión</strong><small>Vuelve a la pantalla de acceso</small></span>
          </button>
        </section>

        <section className="perfil-seccion">
          <h2>Datos de la aplicación</h2>
          <button className="perfil-danger" onClick={clearData}>
            <Icon name="trash" size={18} />
            <span><strong>Borrar datos locales</strong><small>Restablece calendario, recetas, compra y perfil</small></span>
          </button>
        </section>
      </div>

      {editing && (
        <>
          <div className="perfil-overlay" onClick={() => setEditing(false)} />
          <div className="perfil-sheet">
            <div className="perfil-handle" />
            <h2>Editar perfil</h2>
            <form onSubmit={saveProfile}>
              <label>
                Nombre
                <input value={draft.nombre} onChange={event => setDraft({ ...draft, nombre: event.target.value })} />
              </label>
              <label>
                Email
                <input type="email" value={draft.email} onChange={event => setDraft({ ...draft, email: event.target.value })} placeholder="opcional" />
              </label>
              <div className="perfil-form-row">
                <label>
                  Raciones
                  <input type="number" min="1" max="12" value={draft.raciones} onChange={event => setDraft({ ...draft, raciones: event.target.value })} />
                </label>
                <label>
                  Dieta
                  <select value={draft.dieta} onChange={event => setDraft({ ...draft, dieta: event.target.value })}>
                    <option>Sin preferencias</option>
                    <option>Vegetariana</option>
                    <option>Vegana</option>
                    <option>Sin gluten</option>
                    <option>Alta en proteína</option>
                  </select>
                </label>
              </div>
              <button className="perfil-save">
                <Icon name="check" size={17} />
                Guardar cambios
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

// Fila de preferencia con su interruptor.
function Setting({ icon, title, text, active, onChange }) {
  return (
    <div className="perfil-ajuste">
      <span className="perfil-ajuste-icon"><Icon name={icon} size={18} /></span>
      <div><strong>{title}</strong><small>{text}</small></div>
      <button className={`perfil-switch ${active ? 'activo' : ''}`} onClick={onChange} aria-pressed={active}>
        <span />
      </button>
    </div>
  );
}
