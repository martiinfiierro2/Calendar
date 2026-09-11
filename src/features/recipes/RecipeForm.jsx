import React from 'react';
import { CATEGORIAS_RECETA } from '../../config/appConfig';
import Icon from '../../shared/Icon';

// Formulario compartido para crear y editar recetas.
export default function RecipeForm({ form, editing, onChange, onClose, onSubmit }) {
  if (!form) return null;

  const update = (field, value) => onChange({ ...form, [field]: value });

  return (
    <div className="recetas-modal-layer">
      <button className="recetas-modal-backdrop" onClick={onClose} aria-label="Cerrar" />

      <section className="receta-form-sheet">
        <div className="receta-form-header">
          <button className="recetas-icon-btn" onClick={onClose} aria-label="Volver">
            <Icon name="back" />
          </button>
          <div>
            <span>{editing ? 'Actualizar' : 'Nueva'}</span>
            <h2>{editing ? 'Editar receta' : 'Crear receta'}</h2>
          </div>
          <div />
        </div>

        <form onSubmit={onSubmit} className="receta-form">
          <label>
            Nombre
            <input required value={form.nombre} onChange={event => update('nombre', event.target.value)} placeholder="Ej. Pasta al pesto" />
          </label>

          <div className="receta-form-row">
            <label>
              Categoría
              <select value={form.categoria} onChange={event => update('categoria', event.target.value)}>
                {CATEGORIAS_RECETA.filter(category => !['Todas', 'Favoritas'].includes(category)).map(category => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>
            <label>
              Dificultad
              <select value={form.dificultad} onChange={event => update('dificultad', event.target.value)}>
                <option>Fácil</option>
                <option>Media</option>
                <option>Difícil</option>
              </select>
            </label>
          </div>

          <div className="receta-form-row">
            <label>
              Tiempo (min)
              <input type="number" min="1" value={form.tiempo} onChange={event => update('tiempo', event.target.value)} />
            </label>
            <label>
              Raciones
              <input type="number" min="1" value={form.raciones} onChange={event => update('raciones', event.target.value)} />
            </label>
          </div>

          <label>
            Imagen <span className="label-opcional">opcional</span>
            <input value={form.imagen} onChange={event => update('imagen', event.target.value)} placeholder="URL de la imagen" />
          </label>

          <label>
            Ingredientes <span className="label-ayuda">uno por línea</span>
            <textarea rows="5" value={form.ingredientes} onChange={event => update('ingredientes', event.target.value)} placeholder={'200 g de pasta\n2 tomates\nAceite de oliva'} />
          </label>

          <label>
            Preparación <span className="label-ayuda">un paso por línea</span>
            <textarea rows="6" value={form.pasos} onChange={event => update('pasos', event.target.value)} placeholder={'Cocer la pasta.\nPreparar la salsa.\nMezclar y servir.'} />
          </label>

          <button className="receta-form-submit" type="submit">
            {editing ? 'Guardar cambios' : 'Crear receta'}
          </button>
        </form>
      </section>
    </div>
  );
}
