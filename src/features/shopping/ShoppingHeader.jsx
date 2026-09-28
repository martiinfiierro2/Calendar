import Icon from '../../shared/Icon';

export default function ShoppingHeader({ view, openNew, openOptions }) {
  return (
    <header className="compra-header">
      <div>
        <span className="compra-eyebrow">Organización</span>
        <h1>Despensa</h1>
      </div>

      <div className="compra-header-actions">
        <button
          className="compra-icon-btn compra-add"
          onClick={openNew}
          aria-label="Añadir producto"
        >
          <Icon name="plus" />
        </button>

        {view === 'lista' && (
          <button
            className="compra-icon-btn"
            onClick={openOptions}
            aria-label="Opciones de lista"
          >
            <Icon name="settings" />
          </button>
        )}
      </div>
    </header>
  );
}