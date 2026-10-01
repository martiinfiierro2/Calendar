import React, { useEffect, useMemo, useState } from 'react';
import { CATEGORIAS_COMPRA } from '../../../config/appConfig';
import {
  createShoppingItem,
  deleteShoppingItem,
  getShoppingItems,
  updateShoppingItem
} from '../../../services/shoppingService';
import { categoriaIngrediente } from '../../../utils/ingredientUtils';
import { normalizeUnit, UNIT_OPTIONS } from '../../../utils/unitUtils';
import Icon from '../../../shared/Icon';
import FridgeItem from '../FridgeItem';
import '../../../componentes/compra.css';
import ToogleListFridge from '../ToogleListFridge';
import ShoppingHeader from '../ShoppingHeader';

export default function FridgeView({ onChangeView }) {
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

  useEffect(() => {
    let active = true;

    getShoppingItems()
      .then(data => {
        if (active) {
          setItems(data);
        }
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
    () => items.filter(item => item.estado === 'comprado'),
    [items]
  );

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

  const saveItem = async event => {
    event.preventDefault();
    if (!name.trim() || saving) return;

    const numericQuantity = Number(String(quantity).replace(',', '.'));

    if (!Number.isFinite(numericQuantity) || numericQuantity <= 0) {
      setError('La cantidad debe ser un número mayor que 0.');
      return;
    }

    const data = {
      nombre: name.trim(),
      cantidad: numericQuantity,
      unidad: normalizeUnit(unit),
      categoria: category,
      estado: editing?.estado || 'comprado',
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

  return (
    <div className="compra-app">
      <ShoppingHeader view="nevera" openNew={openNew} />
      <ToogleListFridge view="nevera" onChange={onChangeView} />

      <div className="compra-lista">
        {error && <div className="compra-empty"><p>{error}</p></div>}

        {loading ? (
          <div className="compra-empty"><p>Cargando lista...</p></div>
        ) : pending.length === 0 ? (
          <div className="compra-empty">
            <span><Icon name="cart" size={28} /></span>
            <h2>Tu nevera está vacía</h2>
            <p>Añade productos manualmente o al comprarlos en la lista de la compra aparecerán.</p>
          </div>
        ) : null}

        {CATEGORIAS_COMPRA.map(groupName => {
          const group = pending.filter(item => item.categoria === groupName);
          if (!group.length) return null;

          return (
            <section className="compra-grupo" key={groupName}>
              <h2>{groupName}</h2>
              {group.map(item => (
                <FridgeItem key={item.id} item={item} onEdit={openEdit} onDelete={deleteItem} />
              ))}
            </section>
          );
        })}
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
                      min="0.01"
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
                  <select value={category} onChange={event => setCategory(event.target.value)}>
                    {CATEGORIAS_COMPRA.map(item => <option key={item}>{item}</option>)}
                  </select>
                </label>
              </div>

              <button className="compra-save" disabled={!name.trim() || saving}>
                {saving ? 'Guardando...' : editing ? 'Guardar cambios' : 'Añadir a la nevera'}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
