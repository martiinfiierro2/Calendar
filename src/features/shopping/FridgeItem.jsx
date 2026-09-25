import React from 'react';
import Icon from '../../shared/Icon';

// Fila reutilizable de un producto guardado en la nevera.
export default function FridgeItem({ item, onEdit, onDelete }) {
  return (
    <div className="compra-item">
      <div
        className="compra-check"
        aria-hidden="true"
        style={{
          cursor: 'default',
          background: '#eef6ef',
          borderColor: '#dce9dd',
          color: 'var(--appDecorationStrong)'
        }}
      >
        <Icon name="fridge" size={15} />
      </div>

      <div className="compra-item-info">
        <strong>{item.nombre}</strong>
        <span>{item.cantidad}</span>
      </div>

      <button
        className="compra-delete"
        onClick={() => onEdit(item)}
        aria-label={`Editar ${item.nombre}`}
      >
        <Icon name="edit" size={17} />
      </button>

      <button
        className="compra-delete"
        onClick={() => onDelete(item.id)}
        aria-label={`Eliminar ${item.nombre}`}
      >
        <Icon name="trash" size={17} />
      </button>
    </div>
  );
}
