import React, { useEffect, useMemo, useState } from 'react';
import { CATEGORIAS_COMPRA } from '../../../config/appConfig';
import {
  clearConsumptions,
  getConsumptions,
  getShoppingItems,
  updateShoppingItem
} from '../../../services/shoppingService';
import Icon from '../../../shared/Icon';
import FridgeItem from '../FridgeItem';
import '../../../componentes/compra.css';
import ToogleListFridge from '../ToogleListFridge';
import ShoppingHeader from '../ShoppingHeader';

function formatearFecha(fecha) {
  if (!fecha) return '';
  const [year, month, day] = String(fecha).split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short'
  }).format(date);
}

export default function FridgeView({ onChangeView }) {
  const [items, setItems] = useState([]);
  const [consumptions, setConsumptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [returningId, setReturningId] = useState(null);
  const [cleaningUsed, setCleaningUsed] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    Promise.all([getShoppingItems(), getConsumptions()])
      .then(([shoppingItems, consumptionItems]) => {
        if (!active) return;
        setItems(shoppingItems);
        setConsumptions(consumptionItems);
      })
      .catch(err => {
        if (active) setError(err.message || 'No se pudo cargar la nevera.');
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

  const returnToShoppingList = async item => {
    if (returningId !== null) return;

    if (!window.confirm('¿Seguro que quieres devolverlo a la lista de la compra?')) {
      return;
    }

    try {
      setReturningId(item.id);
      setError('');

      const updated = await updateShoppingItem(item.id, {
        nombre: item.nombre,
        cantidad: Number(item.cantidad),
        unidad: item.unidad || 'ud',
        categoria: item.categoria || 'Otros',
        estado: 'apuntado',
        automatico: Boolean(item.automatico)
      });

      setItems(current => current.map(product =>
        product.id === item.id ? updated : product
      ));
    } catch (err) {
      setError(err.message || 'No se pudo devolver el producto a la lista de la compra.');
    } finally {
      setReturningId(null);
    }
  };

  const clearUsed = async () => {
    if (!consumptions.length || cleaningUsed) return;

    if (!window.confirm('¿Limpiar el historial de consumos?')) return;

    try {
      setCleaningUsed(true);
      setError('');
      await clearConsumptions();
      setConsumptions([]);
    } catch (err) {
      setError(err.message || 'No se pudo limpiar el historial de consumos.');
    } finally {
      setCleaningUsed(false);
    }
  };

  return (
    <div className="compra-app">
      <ShoppingHeader view="nevera" />
      <ToogleListFridge view="nevera" onChange={onChangeView} />

      <div className="compra-lista">
        {error && <div className="compra-empty"><p>{error}</p></div>}

        {loading ? (
          <div className="compra-empty"><p>Cargando nevera...</p></div>
        ) : pending.length === 0 && consumptions.length === 0 ? (
          <div className="compra-empty">
            <span><Icon name="cart" size={28} /></span>
            <h2>Tu nevera está vacía</h2>
            <p>Los productos aparecerán aquí cuando los marques como comprados en la lista.</p>
          </div>
        ) : pending.length === 0 ? (
          <div className="nevera-sin-activos">
            <strong>No hay productos en la nevera</strong>
            <span>Los últimos consumos aparecen debajo.</span>
          </div>
        ) : null}

        {CATEGORIAS_COMPRA.map(groupName => {
          const group = pending.filter(item => item.categoria === groupName);
          if (!group.length) return null;

          return (
            <section className="compra-grupo" key={groupName}>
              <h2>{groupName}</h2>
              {group.map(item => (
                <FridgeItem
                  key={item.id}
                  item={item}
                  onReturn={returnToShoppingList}
                  returning={returningId === item.id}
                />
              ))}
            </section>
          );
        })}

        {consumptions.length > 0 && (
          <section className="nevera-usados">
            <div className="nevera-usados-header">
              <div>
                <h2>Usados recientemente</h2>
                <span>Historial de cantidades consumidas</span>
              </div>
              <button type="button" onClick={clearUsed} disabled={cleaningUsed}>
                {cleaningUsed ? 'Limpiando...' : 'Limpiar'}
              </button>
            </div>

            <div className="nevera-usados-lista">
              {consumptions.map(item => (
                <div className="nevera-usado-item" key={item.id}>
                  <span className="nevera-usado-icono"><Icon name="check" size={14} /></span>
                  <div>
                    <strong>{item.nombreProducto}</strong>
                    <span>{item.cantidad} {item.unidad} consumidos</span>
                    <span>{formatearFecha(item.fecha)} · {String(item.hora || '').slice(0, 5)} · {item.comidaNombre}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
