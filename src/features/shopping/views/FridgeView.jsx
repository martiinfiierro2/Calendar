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
import Icon from '../../../shared/Icon';
import ShoppingItem from '../ShoppingItem';
import '../../../componentes/compra.css';
import ToogleListFridge from '../ToogleListFridge';

// Vista diaria con las 24 horas y las comidas planificadas.
export default function FridgeView({}){
    return (
        <div className="compra-app">
              <header className="compra-header">
                <div>
                  <span className="compra-eyebrow">Organización</span>
                  <ToogleListFridge view='lista'/>
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
    )
}