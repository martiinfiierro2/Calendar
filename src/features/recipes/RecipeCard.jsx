import React from 'react';
import Icon from '../../shared/Icon';

// Tarjeta reutilizable de la lista de recetas.
export default function RecipeCard({ recipe, onOpen, onToggleFavorite }) {
  const openWithKeyboard = event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpen(recipe);
    }
  };

  return (
    <article
      className="receta-card receta-card-nueva"
      onClick={() => onOpen(recipe)}
      role="button"
      tabIndex={0}
      onKeyDown={openWithKeyboard}
      aria-label={`Ver receta ${recipe.nombre}`}
    >
      <div className="receta-imagen-wrap">
        <img src={recipe.imagen} alt={recipe.nombre} className="receta-imagen" />
        <button
          className={`receta-favorito ${recipe.favorito ? 'activo' : ''}`}
          onClick={event => {
            event.stopPropagation();
            onToggleFavorite(recipe.id);
          }}
          aria-label="Favorito"
        >
          <Icon name="heart" size={17} />
        </button>
      </div>

      <div className="receta-info">
        <span className="receta-categoria">{recipe.categoria}</span>
        <strong className="receta-nombre">{recipe.nombre}</strong>
        <div className="receta-meta">
          <span><Icon name="clock" size={14} /> {recipe.tiempo} min</span>
          <span><Icon name="users" size={14} /> {recipe.raciones}</span>
        </div>
        <div className="receta-pie">
          <span>{recipe.dificultad}</span>
          {recipe.planificada && <span className="receta-planificada">Planificada</span>}
        </div>
      </div>
    </article>
  );
}
