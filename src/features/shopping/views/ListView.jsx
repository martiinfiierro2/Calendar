import React, { useEffect, useMemo, useState } from 'react';
import { CATEGORIAS_COMPRA } from '../../../config/appConfig';
import {
  createItemsFromCalendar,
  createShoppingItem,
  deleteShoppingItem,
  getShoppingItems,
  updateShoppingItem
} from '../../../services/shoppingService';
import { categoriaIngrediente } from '../../../utils/ingredientUtils';
import { normalizeUnit, UNIT_OPTIONS } from '../../../utils/unitUtils';
import Icon from '../../../shared/Icon';
import ShoppingItem from '../ShoppingItem';
import '../../../componentes/compra.css';
import ToogleListFridge from '../ToogleListFridge';
import ShoppingHeader from '../ShoppingHeader';

export default function ListView({ onChangeView }) {
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [unit, setUnit] = useState('ud');
  const [category, setCategory] = useState('Otros');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const [activeOption, setActiveOption] = useState(null);
  const [calendarDays, setCalendarDays] = useState('7');
  const [generating, setGenerating] = useState(false);
  const [sortOrder, setSortOrder] = useState('category');

  useEffect(() => {
    let active = true;

    getShoppingItems()
      .then(data => {
        if (active) setItems(data);
      })
      .catch(err => {
        if (active) setError(err.message || 'No se pudo cargar la lista de la compra.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const pending = useMemo(
    () => items.filter(item => item.estado === 'apuntado'),
    [items]
  );

  const checked = useMemo(
    () => items.filter(item => item.estado === 'apuntadoChecked'),
    [items]
  );

  const sortedPending = useMemo(() => {
    if (sortOrder === 'category') return pending;

    return [...pending].sort((a, b) => {
      const comparison = (a.nombre || '').localeCompare(
        b.nombre || '',
        'es',
        { sensitivity: 'base' }
      );

      return sortOrder === 'name-desc' ? -comparison : comparison;
    });
  }, [pending, sortOrder]);

  const openNew = () => {
    setEditing(null);
    setName('');
    setQuantity('1');
    setUnit('ud');
    setCategory('Otros');
    setShowForm(true);
  };

  const openEdit = item => {
    setEditing(item);
    setName(item.nombre);
    setQuantity(String(item.cantidad ?? '1'));
    setUnit(normalizeUnit(item.unidad || 'ud'));
    setCategory(item.categoria || 'Otros');
    setShowForm(true);
  };

  const closeForm = () => {
    if (saving) return;
    setShowForm(false);
    setEditing(null);
  };

  const openOptions = () => {
    setActiveOption(null);
    setShowOptions(true);
  };

  const closeOptions = () => {
    if (generating) return;
    setShowOptions(false);
    setActiveOption(null);
  };

  const saveItem = async event => {
    event.preventDefault();
    if (!name.trim() || saving) return;

    const numericQuantity = Number(String(quantity).replace(',', '.'));

    const data = {
      nombre: name.trim(),
      cantidad: Number.isFinite(numericQuantity) && numericQuantity >= 0 ? numericQuantity : 1,
      unidad: normalizeUnit(unit),
      categoria: category,
      estado: editing?.estado || 'apuntado',
      automatico: editing?.automatico || false
    };

    try {
      setSaving(true);
      setError('');

      const saved = editing
        ? await updateShoppingItem(editing.id, data)
        : await createShoppingItem(data);

      setItems(current => editing
        ? current.map(item => item.id === editing.id ? saved : item)
        : [saved, ...current]
      );

      setShowForm(false);
      setEditing(null);
    } catch (err) {
      setError(err.message || 'No se pudo guardar el producto.');
    } finally {
      setSaving(false);
    }
  };

  const checkItem = async id => {
    const item = items.find(current => current.id === id);
    if (!item) return;

    const statusChanged = item.estado === 'apuntado'
      ? 'apuntadoChecked'
      : 'apuntado';

    const next = {
      ...item,
      estado: statusChanged
    };

    setItems(current =>
      current.map(value => value.id === id ? next : value)
    );

    try {
      setError('');

      const saved = await updateShoppingItem(id, {
        nombre: next.nombre,
        cantidad: next.cantidad,
        unidad: normalizeUnit(next.unidad || 'ud'),
        categoria: next.categoria,
        estado: next.estado,
        automatico: next.automatico
      });

      setItems(current =>
        current.map(value => value.id === id ? saved : value)
      );
    } catch (err) {
      setItems(current =>
        current.map(value => value.id === id ? item : value)
      );

      setError(err.message || 'No se pudo marcar el producto como comprado.');
    }
  };

  const deleteItem = async id => {
    const previous = items;
    setItems(current => current.filter(item => item.id !== id));

    try {
      setError('');
      await deleteShoppingItem(id);
    } catch (err) {
      setItems(previous);
      setError(err.message || 'No se pudo eliminar el producto.');
    }
  };

  const generateFromCalendar = async () => {
    try {
      setGenerating(true);
      setError('');

      const created = await createItemsFromCalendar(Number(calendarDays));

      if (!created.length) {
        window.alert('No faltan ingredientes para el periodo seleccionado.');
        closeOptions();
        return;
      }

      setItems(current => [...created, ...current]);
      closeOptions();
    } catch (err) {
      setError(err.message || 'No se pudo generar la lista desde el calendario.');
    } finally {
      setGenerating(false);
    }
  };

  const clearBought = async () => {
    if (!checked.length) return;

    try {
      setError('');
      await Promise.all(
        checked.map(item => updateShoppingItem(item.id, {
          ...item,
          unidad: normalizeUnit(item.unidad || 'ud'),
          estado: 'comprado'
        }))
      );

      setItems(current =>
        current.filter(item =>
          !checked.some(checkedItem => checkedItem.id === item.id)
        )
      );
      closeOptions();
    } catch (err) {
      setError(err.message || 'No se pudieron limpiar los productos comprados.');

      const fresh = await getShoppingItems().catch(() => null);
      if (fresh) setItems(fresh);
    }
  };

  return (
    <div className="compra-app">
      <ShoppingHeader
        view="lista"
        openNew={openNew}
        openOptions={openOptions}
      />
      <ToogleListFridge view="lista" onChange={onChangeView} />

      <div className="compra-lista">
        {error && <div className="compra-empty"><p>{error}</p></div>}

        {loading ? (
          <div className="compra-empty"><p>Cargando lista...</p></div>
        ) : (pending.length === 0 && checked.length === 0) ? (
          <div className="compra-empty">
            <span><Icon name="cart" size={28} /></span>
            <h2>Tu lista está vacía</h2>
            <p>Añade productos manualmente.</p>
          </div>
        ) : null}

        {CATEGORIAS_COMPRA.map(groupName => {
          const group = sortedPending.filter(item => item.categoria === groupName);
          if (!group.length) return null;

          return (
            <section className="compra-grupo" key={groupName}>
              <h2>{groupName}</h2>
              {group.map(item => (
                <ShoppingItem
                  key={item.id}
                  item={item}
                  onToggle={checkItem}
                  onEdit={openEdit}
                  onDelete={deleteItem}
                />
              ))}
            </section>
          );
        })}

        {checked.length > 0 && (
          <section className="compra-grupo compra-comprados">
            <div className="compra-grupo-title">
              <h2>Comprados</h2>
              <button onClick={clearBought}>Limpiar</button>
            </div>
            {checked.map(item => (
              <ShoppingItem key={item.id} item={item} onToggle={checkItem} />
            ))}
          </section>
        )}
      </div>

      {showForm && (
        <>
          <div className="compra-overlay" onClick={closeForm} />
          <div className="compra-sheet">
            <div className="compra-handle" />
            <h2>{editing ? 'Editar producto' : 'Añadir producto'}</h2>
            <form onSubmit={saveItem}>
              <label>
                Producto
                <input
                  autoFocus
                  value={name}
                  onChange={event => {
                    const value = event.target.value;
                    setName(value);
                    if (!editing && category === 'Otros') {
                      setCategory(categoriaIngrediente(value));
                    }
                  }}
                  placeholder="Ej. Leche"
                />
              </label>

              <div className="compra-form-row">
                <label>
                  Cantidad
                  <div className="compra-cantidad-unidad">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={quantity}
                      onChange={event => setQuantity(event.target.value)}
                      placeholder="1"
                    />

                    <select
                      value={unit}
                      onChange={event => setUnit(event.target.value)}
                      aria-label="Unidad"
                    >
                      {UNIT_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>

                <label>
                  Categoría
                  <select
                    value={category}
                    onChange={event => setCategory(event.target.value)}
                  >
                    {CATEGORIAS_COMPRA.map(item => (
                      <option key={item}>{item}</option>
                    ))}
                  </select>
                </label>
              </div>

              <button className="compra-save" disabled={!name.trim() || saving}>
                {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Añadir a la lista'}
              </button>
            </form>
          </div>
        </>
      )}

      {showOptions && (
        <>
          <div className="compra-overlay" onClick={closeOptions} />

          <div className="compra-sheet">
            <div className="compra-handle" />

            <div className="compra-options-heading">
              {activeOption && (
                <button
                  className="compra-options-back"
                  onClick={() => setActiveOption(null)}
                  aria-label="Volver a opciones"
                >
                  <Icon name="back" size={18} />
                </button>
              )}
              <h2>
                {!activeOption && 'Opciones de lista'}
                {activeOption === 'calendar' && 'Generar desde calendario'}
                {activeOption === 'sort' && 'Ordenar lista'}
                {activeOption === 'clean' && 'Limpiar comprados'}
              </h2>
            </div>

            {!activeOption && (
              <div className="compra-options-menu">
                <button onClick={() => setActiveOption('calendar')}>
                  <span className="compra-options-icon"><Icon name="wand" size={20} /></span>
                  <span>
                    <strong>Generar desde calendario</strong>
                    <small>Añade los ingredientes que falten para los próximos días.</small>
                  </span>
                  <Icon name="right" size={18} />
                </button>

                <button onClick={() => setActiveOption('sort')}>
                  <span className="compra-options-icon"><Icon name="sliders" size={20} /></span>
                  <span>
                    <strong>Ordenar lista</strong>
                    <small>Cambia cómo se muestran los productos pendientes.</small>
                  </span>
                  <Icon name="right" size={18} />
                </button>

                <button
                  onClick={() => setActiveOption('clean')}
                  disabled={!checked.length}
                >
                  <span className="compra-options-icon"><Icon name="trash" size={20} /></span>
                  <span>
                    <strong>Limpiar comprados</strong>
                    <small>
                      {checked.length
                        ? `${checked.length} producto${checked.length === 1 ? '' : 's'} marcado${checked.length === 1 ? '' : 's'}.`
                        : 'No hay productos marcados como comprados.'}
                    </small>
                  </span>
                  <Icon name="right" size={18} />
                </button>

                <div className="compra-options-future-title">Próximamente</div>

                <button className="compra-options-future" disabled>
                  <span className="compra-options-icon"><Icon name="trash" size={20} /></span>
                  <span>
                    <strong>Vaciar lista pendiente</strong>
                    <small>Eliminar todos los productos que sigan pendientes de compra.</small>
                  </span>
                  <span className="compra-options-badge">Próximamente</span>
                </button>

                <button className="compra-options-future" disabled>
                  <span className="compra-options-icon"><Icon name="calendar" size={20} /></span>
                  <span>
                    <strong>Copiar faltantes de recetas próximas</strong>
                    <small>Revisar las recetas planificadas y añadir solo lo que falte.</small>
                  </span>
                  <span className="compra-options-badge">Próximamente</span>
                </button>

                <button className="compra-options-future" disabled>
                  <span className="compra-options-icon"><Icon name="check" size={20} /></span>
                  <span>
                    <strong>Mostrar u ocultar comprados</strong>
                    <small>Elegir si los productos marcados siguen visibles en la lista.</small>
                  </span>
                  <span className="compra-options-badge">Próximamente</span>
                </button>

                <button className="compra-options-future" disabled>
                  <span className="compra-options-icon"><Icon name="wand" size={20} /></span>
                  <span>
                    <strong>Restablecer lista automática</strong>
                    <small>Regenerar desde cero los productos añadidos automáticamente.</small>
                  </span>
                  <span className="compra-options-badge">Próximamente</span>
                </button>

                <button className="compra-options-future" disabled>
                  <span className="compra-options-icon"><Icon name="bell" size={20} /></span>
                  <span>
                    <strong>Avisos de ingredientes faltantes</strong>
                    <small>Recibir un aviso cuando se acerque una comida y falten ingredientes.</small>
                  </span>
                  <span className="compra-options-badge">Próximamente</span>
                </button>
              </div>
            )}

            {activeOption === 'calendar' && (
              <div className="compra-options-content">
                <label>
                  Número de días
                  <div className="compra-cantidad-unidad">
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={calendarDays}
                      onChange={event => setCalendarDays(event.target.value)}
                      aria-label="Número de días"
                    />
                    <span>días</span>
                  </div>
                </label>

                <button
                  className="compra-save"
                  onClick={generateFromCalendar}
                  disabled={generating}
                >
                  <Icon name="wand" size={17} />
                  {generating ? 'Generando...' : 'Generar lista'}
                </button>
              </div>
            )}

            {activeOption === 'sort' && (
              <div className="compra-options-content">
                <label>
                  Orden de la lista
                  <select
                    value={sortOrder}
                    onChange={event => setSortOrder(event.target.value)}
                  >
                    <option value="category">Por categoría</option>
                    <option value="name-asc">Nombre A-Z</option>
                    <option value="name-desc">Nombre Z-A</option>
                  </select>
                </label>

                <button className="compra-save" onClick={closeOptions}>
                  <Icon name="check" size={17} />
                  Aplicar orden
                </button>
              </div>
            )}

            {activeOption === 'clean' && (
              <div className="compra-options-content">
                <div className="compra-options-confirm">
                  <span className="compra-options-icon"><Icon name="trash" size={21} /></span>
                  <div>
                    <strong>¿Limpiar productos comprados?</strong>
                    <p>
                      Se moverán {checked.length} producto{checked.length === 1 ? '' : 's'} a la nevera y desaparecerán de la lista.
                    </p>
                  </div>
                </div>

                <button
                  className="compra-save compra-options-clean"
                  onClick={clearBought}
                  disabled={!checked.length}
                >
                  <Icon name="trash" size={17} />
                  Limpiar comprados
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
