import React from 'react';
import Icon from '../../shared/Icon';

// Hoja inferior con toda la información de una receta.
export default function RecipeDetail({ recipe, onClose, onEdit, onDelete, onToggleFavorite }) {
  if (!recipe) return null;

  return (
    <div className="recetas-modal-layer">
      <button className="recetas-modal-backdrop" onClick={onClose} aria-label="Cerrar" />

      <section className="receta-detalle-sheet">
        <div className="receta-detalle-imagen">
          <img src={recipe.imagen} alt={recipe.nombre} />
          <button className="recetas-floating-btn izquierda" onClick={onClose} aria-label="Volver">
            <Icon name="back" />
          </button>
          <button
            className={`recetas-floating-btn derecha ${recipe.favorito ? 'favorito' : ''}`}
            onClick={() => onToggleFavorite(recipe.id)}
            aria-label="Favorito"
          >
            <Icon name="heart" />
          </button>
        </div>

        <div className="receta-detalle-contenido">
          <span className="receta-categoria">{recipe.categoria}</span>
          <h2>{recipe.nombre}</h2>

          <div className="receta-detalle-meta">
            <span><Icon name="clock" size={16} /><b>{recipe.tiempo}</b><small>minutos</small></span>
            <span><Icon name="users" size={16} /><b>{recipe.raciones}</b><small>raciones</small></span>
            <span><Icon name="chef" size={16} /><b>{recipe.dificultad}</b><small>dificultad</small></span>
          </div>

          <div className="receta-detalle-scroll">
            <h3>Ingredientes</h3>
            {recipe.ingredientes.length ? (
              <ul>{recipe.ingredientes.map((item, index) => <li key={index}>{item}</li>)}</ul>
            ) : (
              <p className="receta-muted">Sin ingredientes añadidos.</p>
            )}

            <h3>Preparación</h3>
            {recipe.pasos.length ? (
              <ol>
                {recipe.pasos.map((item, index) => (
                  <li key={index}><span>{index + 1}</span><p>{item}</p></li>
                ))}
              </ol>
            ) : (
              <p className="receta-muted">Sin pasos añadidos.</p>
            )}
          </div>

          <div className="receta-detalle-actions">
            <button onClick={() => onEdit(recipe)}><Icon name="edit" size={17} /> Editar</button>
            <button className="danger" onClick={() => onDelete(recipe)}><Icon name="trash" size={17} /> Eliminar</button>
          </div>
        </div>
      </section>
    </div>
  );
}
