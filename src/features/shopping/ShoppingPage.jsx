import React, { useEffect, useMemo, useState } from 'react';
import { CATEGORIAS_COMPRA } from '../../config/appConfig';
import { buildShoppingItemsFromCalendar } from '../../services/shoppingService';
import { readStorage, writeStorage } from '../../services/storageService';
import { categoriaIngrediente } from '../../utils/ingredientUtils';
import Icon from '../../shared/Icon';
import ShoppingItem from './ShoppingItem';
import '../../componentes/compra.css';

const SHOPPING_KEY = 'calendar_compra';

export default function ShoppingPage() {
  const [items, setItems] = useState(() => readStorage(SHOPPING_KEY, []));
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [category, setCategory] = useState('Otros');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    writeStorage(SHOPPING_KEY, items);
  }, [items]);

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
    setShowForm(false);
    setEditing(null);
  };

  const saveItem = event => {
    event.preventDefault();
    if (!name.trim()) return;

    const data = {
      id: editing?.id || Date.now(),
      nombre: name.trim(),
      cantidad: quantity.trim() || '1',
      categoria: category,
      comprado: editing?.comprado || false,
      automatico: editing?.automatico || false
    };

    setItems(current => editing
      ? current.map(item => item.id === editing.id ? data : item)
      : [data, ...current]
    );
    closeForm();
  };

  const toggleItem = id => {
    setItems(current => current.map(item => (
      item.id === id ? { ...item, comprado: !item.comprado } : item
    )));
  };

  const deleteItem = id => setItems(current => current.filter(item => item.id !== id));

  const clearBought = () => {
    if (bought.length) setItems(current => current.filter(item => !item.comprado));
  };

  const generateFromCalendar = () => {
    const newItems = buildShoppingItemsFromCalendar(items);
    if (!newItems.length) {
      window.alert('No hay ingredientes nuevos en las recetas planificadas.');
      return;
    }
    setItems(current => [...newItems, ...current]);
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
        {items.length === 0 && (
          <div className="compra-empty">
            <span><Icon name="cart" size={28} /></span>
            <h2>Tu lista está vacía</h2>
            <p>Añade productos manualmente o genera ingredientes desde las recetas planificadas.</p>
          </div>
        )}

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
              <button className="compra-save" disabled={!name.trim()}>
                {editing ? 'Guardar cambios' : 'Añadir a la lista'}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
