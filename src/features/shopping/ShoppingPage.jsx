import React, { useState } from 'react';
import '../../componentes/compra.css';
import ListView from './views/ListView';
import FridgeView from './views/FridgeView';

export default function ShoppingPage() {
  const [view, setView] = useState('lista');

  const changeDetailView = newView => {
    setView(newView);
  };

  return (
    <div className="contenedor-calendario">
      {view === 'lista' && (
        <ListView onChangeView={changeDetailView} />
      )}

      {view === 'nevera' && (
        <FridgeView onChangeView={changeDetailView} />
      )}
    </div>
  );
}
