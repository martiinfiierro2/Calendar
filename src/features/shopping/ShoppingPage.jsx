import React, { useEffect, useMemo, useState } from 'react';
import { CATEGORIAS_COMPRA } from '../../config/appConfig';
import {
  createItemsFromCalendar,
  createShoppingItem,
  deleteShoppingItem,
  fetchShoppingItems,
  updateShoppingItem
} from '../../services/shoppingService';
import { categoriaIngrediente } from '../../utils/ingredientUtils';
import Icon from '../../shared/Icon';
import ShoppingItem from './ShoppingItem';
import '../../componentes/compra.css';

export default function ShoppingPage() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [category, setCategory] = useState('Otros');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    fetchShoppingItems()
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

  const pending = useMemo(() => items.filter(item => !item.comprado), [items]);
  const bought = useMemo(() => items.filter(item => item.comprado), [items]);

  const openNew = () => {
    setEditing(null);
    setName('');
    setQuantity('1');
    setCategory('Otros');
    setShowForm(true);
  };

  const openEdit = item => {
    setEditing(item);
    setName(item.nombre);
    setQuantity(item.cantidad || '1');
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

    const data = {
      nombre: name.trim(),
      cantidad: quantity.trim() || '1',
      categoria: category,
      comprado: editing?.comprado || false,
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

  const toggleItem = async id => {
    const item = items.find(current => current.id === id);
    if (!item) return;

    const next = { ...item, comprado: !item.comprado };
    setItems(current => current.map(value => value.id === id ? next : value));

    try {
      setError('');
      const saved = await updateShoppingItem(id, {
        nombre: next.nombre,
        cantidad: next.cantidad,
        categoria: next.categoria,
        comprado: next.comprado,
        automatico: next.automatico
      });
      setItems(current => current.map(value => value.id === id ? saved : value));
    } catch (err) {
      setItems(current => current.map(value => value.id === id ? item : value));
      setError(err.message || 'No se pudo actualizar el producto.');
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

  const clearBought = async () => {
    if (!bought.length) return;

    try {
      setError('');
      await Promise.all(bought.map(item => deleteShoppingItem(item.id)));
      setItems(current => current.filter(item => !item.comprado));
    } catch (err) {
      setError(err.message || 'No se pudieron limpiar los productos comprados.');
      const fresh = await fetchShoppingItems().catch(() => null);
      if (fresh) setItems(fresh);
    }
  };

  const generateFromCalendar = async () => {
    try {
      setError('');
      const created = await createItemsFromCalendar(items);
      if (!created.length) {
        window.alert('No hay ingredientes nuevos en las recetas planificadas.');
        return;
      }
      setItems(current => [...created, ...current]);
    } catch (err) {
      setError(err.message || 'No se pudo generar la lista desde el calendario.');
    }
  };

  return (
    <div className="compra-app">
      <header className="compra-header">
        <div>
          <span className="compra-eyebrow">Organización</span>
          <h1>Lista de la compra</h1>
        </div>
        <button className="compra-icon-btn compra-add" onClick={openNew} aria-label="Añadir producto">
          <Icon name="plus" />
        </button>
      </header>

      <section className="compra-summary">
        <div><strong>{pending.length}</strong><span>Pendientes</span></div>
        <div><strong>{bought.length}</strong><span>Comprados</span></div>
        <button onClick={generateFromCalendar}><Icon name="wand" size={17} />Desde calendario</button>
      </section>

      <div className="compra-lista">
        {error && <div className="compra-empty"><p>{error}</p></div>}

        {loading ? (
          <div className="compra-empty"><p>Cargando lista...</p></div>
        ) : items.length === 0 ? (
          <div className="compra-empty">
            <span><Icon name="cart" size={28} /></span>
            <h2>Tu lista está vacía</h2>
            <p>Añade productos manualmente o genera ingredientes desde las recetas planificadas.</p>
          </div>
        ) : null}

        {CATEGORIAS_COMPRA.map(groupName => {
          const group = pending.filter(item => item.categoria === groupName);
          if (!group.length) return null;

          return (
            <section className="compra-grupo" key={groupName}>
              <h2>{groupName}</h2>
              {group.map(item => (
                <ShoppingItem key={item.id} item={item} onToggle={toggleItem} onEdit={openEdit} onDelete={deleteItem} />
              ))}
            </section>
          );
        })}

        {bought.length > 0 && (
          <section className="compra-grupo compra-comprados">
            <div className="compra-grupo-title">
              <h2>Comprados</h2>
              <button onClick={clearBought}>Limpiar</button>
            </div>
            {bought.map(item => (
              <ShoppingItem key={item.id} item={item} onToggle={toggleItem} onEdit={openEdit} onDelete={deleteItem} />
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
                    if (!editing && category === 'Otros') setCategory(categoriaIngrediente(value));
                  }}
                  placeholder="Ej. Leche"
                />
              </label>
              <div className="compra-form-row">
                <label>
                  Cantidad
                  <input value={quantity} onChange={event => setQuantity(event.target.value)} />
                </label>
                <label>
                  Categoría
                  <select value={category} onChange={event => setCategory(event.target.value)}>
                    {CATEGORIAS_COMPRA.map(item => <option key={item}>{item}</option>)}
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
    </div>
  );
}
