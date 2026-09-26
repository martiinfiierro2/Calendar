import React from 'react';
import { CATEGORIAS_RECETA } from '../../config/appConfig';
import Icon from '../../shared/Icon';
import { normalizeUnit, UNIT_OPTIONS } from '../../utils/unitUtils';

// Formulario compartido para crear y editar recetas.
export default function RecipeForm({ form, editing, onChange, onClose, onSubmit }) {
  if (!form) return null;

  const update = (field, value) => onChange({ ...form, [field]: value });

  const resetIngredientDraft = nextIngredients => {
    onChange({
      ...form,
      ingredientes: nextIngredients,
      ingredienteNombre: '',
      ingredienteCantidad: '1',
      ingredienteUnidad: 'ud',
      ingredienteEditando: null
    });
  };

  const saveIngredient = () => {
    const nombre = form.ingredienteNombre?.trim();
    const cantidad = Number(String(form.ingredienteCantidad).replace(',', '.'));

    if (!nombre || !Number.isFinite(cantidad) || cantidad <= 0) return;

    const ingrediente = {
      nombre,
      cantidad,
      unidad: normalizeUnit(form.ingredienteUnidad || 'ud')
    };

    const nextIngredients = [...form.ingredientes];

    if (form.ingredienteEditando !== null) {
      nextIngredients[form.ingredienteEditando] = ingrediente;
    } else {
      nextIngredients.push(ingrediente);
    }

    resetIngredientDraft(nextIngredients);
  };

  const editIngredient = index => {
    const ingrediente = form.ingredientes[index];

    onChange({
      ...form,
      ingredienteNombre: ingrediente.nombre || '',
      ingredienteCantidad: String(ingrediente.cantidad ?? '1'),
      ingredienteUnidad: normalizeUnit(ingrediente.unidad || 'ud'),
      ingredienteEditando: index
    });
  };

  const removeIngredient = index => {
    const nextIngredients = form.ingredientes.filter((_, currentIndex) => currentIndex !== index);

    if (form.ingredienteEditando === index) {
      resetIngredientDraft(nextIngredients);
      return;
    }

    onChange({
      ...form,
      ingredientes: nextIngredients,
      ingredienteEditando:
        form.ingredienteEditando !== null && form.ingredienteEditando > index
          ? form.ingredienteEditando - 1
          : form.ingredienteEditando
    });
  };

  const cancelIngredientEdit = () => {
    resetIngredientDraft(form.ingredientes);
  };

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
            <input
              required
              value={form.nombre}
              onChange={event => update('nombre', event.target.value)}
              placeholder="Ej. Pasta al pesto"
            />
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '8px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: '#4f5951' }}>Ingredientes</span>
              <span style={{ fontSize: '9px', fontWeight: 700, color: '#8a948c' }}>
                {form.ingredientes.length} {form.ingredientes.length === 1 ? 'ingrediente' : 'ingredientes'}
              </span>
            </div>

            <div
              style={{
                padding: '10px',
                border: '1px solid #e1e6e1',
                borderRadius: '14px',
                background: '#f8faf8',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <input
                value={form.ingredienteNombre}
                onChange={event => update('ingredienteNombre', event.target.value)}
                placeholder="Ingrediente, ej. Pasta"
                aria-label="Nombre del ingrediente"
              />

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr) 88px',
                  gap: '0'
                }}
              >
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  value={form.ingredienteCantidad}
                  onChange={event => update('ingredienteCantidad', event.target.value)}
                  placeholder="Cantidad"
                  aria-label="Cantidad del ingrediente"
                  style={{ borderRadius: '12px 0 0 12px', borderRight: 0 }}
                />
                <select
                  value={form.ingredienteUnidad}
                  onChange={event => update('ingredienteUnidad', event.target.value)}
                  aria-label="Unidad del ingrediente"
                  style={{ borderRadius: '0 12px 12px 0' }}
                >
                  {UNIT_OPTIONS.map(unit => (
                    <option key={unit.value} value={unit.value}>{unit.label}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '7px' }}>
                <button
                  type="button"
                  onClick={saveIngredient}
                  disabled={
                    !form.ingredienteNombre?.trim()
                    || !Number.isFinite(Number(String(form.ingredienteCantidad).replace(',', '.')))
                    || Number(String(form.ingredienteCantidad).replace(',', '.')) <= 0
                  }
                  style={{
                    flex: 1,
                    minHeight: '40px',
                    border: 0,
                    borderRadius: '11px',
                    background: 'var(--appDecorationStrong)',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    cursor: 'pointer'
                  }}
                >
                  <Icon name={form.ingredienteEditando !== null ? 'edit' : 'plus'} size={15} />
                  {form.ingredienteEditando !== null ? 'Guardar ingrediente' : 'Añadir ingrediente'}
                </button>

                {form.ingredienteEditando !== null && (
                  <button
                    type="button"
                    onClick={cancelIngredientEdit}
                    aria-label="Cancelar edición de ingrediente"
                    style={{
                      width: '40px',
                      minHeight: '40px',
                      border: '1px solid #e1e6e1',
                      borderRadius: '11px',
                      background: '#fff',
                      color: '#78827a',
                      display: 'grid',
                      placeItems: 'center',
                      cursor: 'pointer'
                    }}
                  >
                    <Icon name="close" size={15} />
                  </button>
                )}
              </div>
            </div>

            {form.ingredientes.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {form.ingredientes.map((ingrediente, index) => (
                  <div
                    key={`${ingrediente.nombre}-${index}`}
                    style={{
                      minHeight: '44px',
                      padding: '7px 8px 7px 11px',
                      border: '1px solid #e5e9e5',
                      borderRadius: '12px',
                      background: '#fff',
                      display: 'grid',
                      gridTemplateColumns: 'minmax(0, 1fr) auto auto',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <strong
                        style={{
                          fontSize: '12px',
                          color: 'var(--colorTextBlack)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {ingrediente.nombre}
                      </strong>
                      <span style={{ fontSize: '10px', fontWeight: 800, color: 'var(--appDecorationStrong)' }}>
                        {ingrediente.cantidad} {ingrediente.unidad}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => editIngredient(index)}
                      aria-label={`Editar ${ingrediente.nombre}`}
                      style={{
                        width: '32px',
                        height: '32px',
                        border: 0,
                        borderRadius: '9px',
                        background: 'transparent',
                        color: '#8e9890',
                        display: 'grid',
                        placeItems: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <Icon name="edit" size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      aria-label={`Eliminar ${ingrediente.nombre}`}
                      style={{
                        width: '32px',
                        height: '32px',
                        border: 0,
                        borderRadius: '9px',
                        background: 'transparent',
                        color: '#b76565',
                        display: 'grid',
                        placeItems: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

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
