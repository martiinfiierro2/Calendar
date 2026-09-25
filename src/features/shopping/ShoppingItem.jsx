import React from 'react';
import Icon from '../../shared/Icon';

// Fila reutilizable de un producto de la lista de la compra.
export default function ShoppingItem({ item, onToggle, onEdit, onDelete }) {
  return (
    <div className={`compra-item ${item.estado === 'apuntadoChecked' ? 'hecho' : ''}`}>
      <button
        className="compra-check"
        onClick={() => onToggle(item.id)}
        aria-label={item.estado}
      >
        {item.estado === 'apuntadoChecked' && <Icon name="check" size={15} />}
      </button>

      <div className="compra-item-info">
        <strong>{item.nombre}</strong>
        <span>{item.cantidad}</span>
      </div>

        {!item.estado.endsWith('Checked') && (
          <button className="compra-delete" onClick={() => onEdit(item)} aria-label="Editar">
            <Icon name="edit" size={17} />
          </button>
        )}
        {!item.estado.endsWith('Checked') && (
          <button className="compra-delete" onClick={() => onDelete(item.id)} aria-label="Eliminar">
            <Icon name="trash" size={17} />
          </button>
        )}
      
    </div>
  );
}
