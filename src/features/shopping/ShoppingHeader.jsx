import IconButton from '../../shared/IconButton';

export default function ShoppingHeader({ label, onBack, onAdd }) {
    return (
        <header className="compra-header">
            <div>
              <span className="compra-eyebrow">Organización</span>
            </div>
            <button className="compra-icon-btn compra-add" onClick={openNew} aria-label="Añadir producto">
                <Icon name="plus" />
            </button>
        </header>
    )
}