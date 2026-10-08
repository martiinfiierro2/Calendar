import { formatQuantity } from '../../utils/formatQuantity';
import React from 'react';
import Icon from '../../shared/Icon';

export default function ShoppingItem({
  item,
  onToggle,
  onEdit,
  onDelete
}) {
  const isChecked = item.estado?.endsWith('Checked');

  return (
    <div className={`compra-item ${isChecked ? 'hecho' : ''}`}>
      <button
        className="compra-check"
        onClick={() => onToggle(item.id)}
        aria-label={isChecked ? 'Marcar pendiente' : 'Marcar comprado'}
      >
        {isChecked && <Icon name="check" size={15} />}
      </button>

      <div className="compra-item-info">
        <strong>{item.nombre}</strong>
        <span>
          {formatQuantity(item.cantidad)} {item.unidad || ''}
        </span>
      </div>

      {!isChecked && (
        <button
          className="compra-delete"
          onClick={() => onEdit(item)}
          aria-label="Editar"
        >
          <Icon name="edit" size={17} />
        </button>
      )}

      {!isChecked && (
        <button
          className="compra-delete"
          onClick={() => onDelete(item.id)}
          aria-label="Eliminar"
        >
          <Icon name="trash" size={17} />
        </button>
      )}
    </div>
  );
}