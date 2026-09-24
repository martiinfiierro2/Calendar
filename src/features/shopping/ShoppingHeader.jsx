import Icon from '../../shared/Icon';

export default function ShoppingHeader({ view, openNew }) {
    return (
        <header className="compra-header">
            <div>
              <span className="compra-eyebrow">Organización</span>
              {view === 'lista' && (
                <h1>Lista de la compra</h1>
              )}
              {view === 'nevera' && (
                <h1>Nevera</h1>
              )}
            </div>
            <button className="compra-icon-btn compra-add" onClick={openNew} aria-label="Añadir producto">
                <Icon name="plus" />
            </button>
        </header>
    )
}