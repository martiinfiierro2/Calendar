import React, { useEffect, useMemo, useState } from 'react';
import { CATEGORIAS_COMPRA } from '../../config/appConfig';
import {
  createItemsFromCalendar,
  createShoppingItem,
  deleteShoppingItem,
  getShoppingItems,
  updateShoppingItem
} from '../../services/shoppingService';
import { categoriaIngrediente } from '../../utils/ingredientUtils';
import ShoppingItem from './ShoppingItem';
import '../../componentes/compra.css';
import ListView from './views/ListView';
import FridgeView from './views/FridgeView';
import ShoppingHeader from './ShoppingHeader';

export default function ShoppingPage() {
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [view, setView] = useState('lista');
  const [quantity, setQuantity] = useState('1');
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
      const fresh = await getShoppingItems().catch(() => null);
      if (fresh) setItems(fresh);
    }
  };

  const changeDetailView = newView => {
    console.log(newView);
    setView(newView);
  };

  return (
    <div className="contenedor-calendario">
          {error && (
            <div style={{ padding: '8px 14px', fontSize: '13px', textAlign: 'center' }}>{error}</div>
          )}
    
          {view === 'lista' && (
            <ListView
              onChangeView={changeDetailView}
              openNew={openNew}
            />
          )}
          {view === 'nevera' && (
            <FridgeView
              onChangeView={changeDetailView}
              openNew={openNew}
            />
          )}
    </div>
  );
}
