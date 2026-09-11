import React, { useMemo, useState } from 'react';
import { TIPOS_COMIDA } from '../../config/appConfig';
import { getRecipes } from '../../services/recipeService';
import { fechaClave } from '../../utils/dateUtils';
import IconButton from '../../shared/IconButton';

// Formulario para añadir una receta guardada al calendario.
export function RecipeMealForm({ date, initialHour, initialMeal, onClose, onSave }) {
  const recipes = useMemo(() => getRecipes(), []);
  const [search, setSearch] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState(
    recipes.find(recipe => String(recipe.id) === String(initialMeal?.recetaId)) || null
  );
  const [formDate, setFormDate] = useState(initialMeal?.fecha || fechaClave(date));
  const [hour, setHour] = useState(initialMeal?.hora || initialHour || '14:00');

  const filteredRecipes = recipes.filter(recipe => (
    recipe.nombre.toLowerCase().includes(search.toLowerCase())
  ));

  const submit = event => {
    event.preventDefault();
    if (!selectedRecipe || !formDate || !hour) return;

    const defaultType = TIPOS_COMIDA[2];
    onSave({
      recetaId: selectedRecipe.id,
      nombre: selectedRecipe.nombre,
      tipo: initialMeal?.tipo || defaultType.valor,
      icono: initialMeal?.icono || defaultType.icono,
      fecha: formDate,
      hora: hour,
      modo: 'receta'
    });
  };

  return (
    <>
      <div className="menu-anadir-overlay" onClick={onClose} />
      <div className="menu-anadir formulario-comida">
        <div className="menu-anadir-indicador" />
        <div className="formulario-cabecera">
          <IconButton icon="back" label="Volver" onClick={onClose} />
          <h2>{initialMeal ? 'Editar receta' : 'Añadir receta'}</h2>
          <div />
        </div>

        <div className="campo-formulario">
          <label htmlFor="buscar-receta-calendario">Buscar receta</label>
          <input
            id="buscar-receta-calendario"
            type="search"
            placeholder="Escribe el nombre de una receta..."
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
        </div>

        <div className="selector-recetas">
          {filteredRecipes.map(recipe => (
            <button
              key={recipe.id}
              type="button"
              className={`selector-receta-card ${selectedRecipe?.id === recipe.id ? 'seleccionada' : ''}`}
              onClick={() => setSelectedRecipe(recipe)}
            >
              <img src={recipe.imagen} alt={recipe.nombre} />
              <span>{recipe.nombre}</span>
            </button>
          ))}
        </div>

        {selectedRecipe && (
          <div className="receta-seleccionada">
            Seleccionada: <strong>{selectedRecipe.nombre}</strong>
          </div>
        )}

        <form className="formulario-campos" onSubmit={submit}>
          <div className="campos-formulario-fila">
            <div className="campo-formulario">
              <label htmlFor="fecha-receta">Fecha</label>
              <input id="fecha-receta" type="date" value={formDate} onChange={event => setFormDate(event.target.value)} required />
            </div>
            <div className="campo-formulario">
              <label htmlFor="hora-receta">Hora</label>
              <input id="hora-receta" type="time" value={hour} onChange={event => setHour(event.target.value)} required />
            </div>
          </div>

          <button className="boton-formulario-guardar" type="submit" disabled={!selectedRecipe}>
            {initialMeal ? 'Guardar cambios' : 'Añadir al calendario'}
          </button>
        </form>
      </div>
    </>
  );
}

// Formulario rápido para comidas que no vienen de una receta.
export function QuickMealForm({ date, initialHour, initialMeal, onClose, onSave }) {
  const [name, setName] = useState(initialMeal?.nombre || '');
  const [ingredients, setIngredients] = useState(initialMeal?.ingredientes?.join(', ') || '');
  const [mealType, setMealType] = useState(initialMeal?.tipo || 'comida');
  const [formDate, setFormDate] = useState(initialMeal?.fecha || fechaClave(date));
  const [hour, setHour] = useState(initialMeal?.hora || initialHour || '14:00');

  const submit = event => {
    event.preventDefault();
    if (!name.trim() || !ingredients.trim() || !formDate || !hour) return;

    const typeInfo = TIPOS_COMIDA.find(item => item.valor === mealType) || TIPOS_COMIDA[2];
    onSave({
      nombre: name.trim(),
      tipo: mealType,
      icono: typeInfo.icono,
      ingredientes: ingredients.split(',').map(item => item.trim()).filter(Boolean),
      fecha: formDate,
      hora: hour,
      modo: 'rapida'
    });
  };

  return (
    <>
      <div className="menu-anadir-overlay" onClick={onClose} />
      <div className="menu-anadir formulario-comida">
        <div className="menu-anadir-indicador" />
        <div className="formulario-cabecera">
          <IconButton icon="back" label="Volver" onClick={onClose} />
          <h2>{initialMeal ? 'Editar comida rápida' : 'Comida rápida'}</h2>
          <div />
        </div>

        <form className="formulario-campos" onSubmit={submit}>
          <div className="campo-formulario">
            <label htmlFor="nombre-rapida">Nombre</label>
            <input id="nombre-rapida" value={name} onChange={event => setName(event.target.value)} placeholder="Ej.: Tostada de tomate y queso" required />
          </div>

          <div className="campo-formulario">
            <label htmlFor="ingredientes-rapida">Ingredientes</label>
            <input id="ingredientes-rapida" value={ingredients} onChange={event => setIngredients(event.target.value)} placeholder="Ej.: pan, tomate, queso..." required />
          </div>

          <div className="campo-formulario">
            <label htmlFor="tipo-rapida">Tipo de comida</label>
            <select id="tipo-rapida" value={mealType} onChange={event => setMealType(event.target.value)}>
              {TIPOS_COMIDA.map(type => <option key={type.valor} value={type.valor}>{type.nombre}</option>)}
            </select>
          </div>

          <div className="campos-formulario-fila">
            <div className="campo-formulario">
              <label htmlFor="fecha-rapida">Fecha</label>
              <input id="fecha-rapida" type="date" value={formDate} onChange={event => setFormDate(event.target.value)} required />
            </div>
            <div className="campo-formulario">
              <label htmlFor="hora-rapida">Hora</label>
              <input id="hora-rapida" type="time" value={hour} onChange={event => setHour(event.target.value)} required />
            </div>
          </div>

          <button className="boton-formulario-guardar" type="submit">
            {initialMeal ? 'Guardar cambios' : 'Guardar'}
          </button>
        </form>
      </div>
    </>
  );
}
