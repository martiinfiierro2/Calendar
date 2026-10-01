import React from 'react';
import Icon from '../../shared/Icon';

// Fila reutilizable de un producto guardado en la nevera.
export default function FridgeItem({ item, onReturn }) {
  return (
    <div className="compra-item fridge-stock-item">
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
        <span>{item.cantidad} {item.unidad || 'ud'}</span>
      </div>

      <button
        className="compra-delete fridge-return"
        onClick={() => onReturn(item)}
        aria-label={`Devolver ${item.nombre} a la lista de la compra`}
        title="Devolver a la lista de la compra"
      >
        <Icon name="undo" size={17} />
      </button>
    </div>
  );
}
