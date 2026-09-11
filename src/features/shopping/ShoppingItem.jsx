import React from 'react';
import Icon from '../../shared/Icon';

// Fila reutilizable de un producto de la lista de la compra.
export default function ShoppingItem({ item, onToggle, onEdit, onDelete }) {
  return (
    <div className={`compra-item ${item.comprado ? 'hecho' : ''}`}>
      <button
        className="compra-check"
        onClick={() => onToggle(item.id)}
        aria-label={item.comprado ? 'Marcar pendiente' : 'Marcar comprado'}
      >
        {item.comprado && <Icon name="check" size={15} />}
      </button>

      <div className="compra-item-info">
        <strong>{item.nombre}</strong>
        <span>{item.cantidad}</span>
      </div>

      <button className="compra-delete" onClick={() => onEdit(item)} aria-label="Editar">
        <Icon name="edit" size={17} />
      </button>
      <button className="compra-delete" onClick={() => onDelete(item.id)} aria-label="Eliminar">
        <Icon name="trash" size={17} />
      </button>
    </div>
  );
}
