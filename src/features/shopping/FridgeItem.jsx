import React from 'react';
import Icon from '../../shared/Icon';

export default function FridgeItem({ item, onEdit, onDelete }) {
  return (
    <div className="fridge-row">
      <div className="fridge-row-content">
        <strong>{item.nombre}</strong>
        <span>{item.cantidad}</span>
      </div>

      <div className="fridge-row-actions">
        <button
          onClick={() => onEdit(item)}
          aria-label={`Editar ${item.nombre}`}
        >
          <Icon name="edit" size={16} />
        </button>

        <button
          onClick={() => onDelete(item.id)}
          aria-label={`Eliminar ${item.nombre}`}
        >
          <Icon name="trash" size={16} />
        </button>
      </div>
    </div>
  );
}