import Icon from '../../shared/Icon';

export default function ShoppingHeader({ openNew }) {
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