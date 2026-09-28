import React, { useEffect, useMemo, useState } from 'react';
import { TIPOS_COMIDA } from '../../config/appConfig';
import { getRecipes } from '../../services/recipeService';
import { fechaClave } from '../../utils/dateUtils';
import { normalizeUnit, UNIT_OPTIONS } from '../../utils/unitUtils';
import IconButton from '../../shared/IconButton';

// Formulario para añadir una receta guardada al calendario.
export function RecipeMealForm({ date, initialHour, initialMeal, onClose, onSave }) {
  const [recipes, setRecipes] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [loadingRecipes, setLoadingRecipes] = useState(true);
  const [recipeError, setRecipeError] = useState('');
  const [formDate, setFormDate] = useState(initialMeal?.fecha || fechaClave(date));
  const [hour, setHour] = useState(initialMeal?.hora || initialHour || '14:00');

  useEffect(() => {
    let active = true;

    getRecipes()
      .then(data => {
        if (!active) return;
        setRecipes(data);
        if (initialMeal?.recetaId) {
          setSelectedRecipe(data.find(recipe => String(recipe.id) === String(initialMeal.recetaId)) || null);
        }
      })
      .catch(error => {
        if (active) setRecipeError(error.message || 'No se pudieron cargar las recetas.');
      })
      .finally(() => {
        if (active) setLoadingRecipes(false);
      });

    return () => {
      active = false;
    };
  }, [initialMeal?.recetaId]);

  const filteredRecipes = useMemo(() => recipes.filter(recipe => (
    recipe.nombre.toLowerCase().includes(search.toLowerCase())
  )), [recipes, search]);

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
            type="text"
            inputMode="search"
            enterKeyHint="search"
            placeholder="Escribe el nombre de una receta..."
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
        </div>

        <div className="selector-recetas">
          {loadingRecipes ? (
            <p>Cargando recetas...</p>
          ) : recipeError ? (
            <p>{recipeError}</p>
          ) : filteredRecipes.length === 0 ? (
            <p>No hay recetas disponibles.</p>
          ) : filteredRecipes.map(recipe => (
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
  const [ingredients, setIngredients] = useState(
    Array.isArray(initialMeal?.ingredientes)
      ? initialMeal.ingredientes.filter(item => item && typeof item === 'object')
      : []
  );
  const [ingredientName, setIngredientName] = useState('');
  const [ingredientQuantity, setIngredientQuantity] = useState('1');
  const [ingredientUnit, setIngredientUnit] = useState('ud');
  const [mealType, setMealType] = useState(initialMeal?.tipo || 'comida');
  const [formDate, setFormDate] = useState(initialMeal?.fecha || fechaClave(date));
  const [hour, setHour] = useState(initialMeal?.hora || initialHour || '14:00');

  const addIngredient = () => {
    const nombre = ingredientName.trim();
    const cantidad = Number(String(ingredientQuantity).replace(',', '.'));

    if (!nombre || !Number.isFinite(cantidad) || cantidad <= 0) return;

    setIngredients(current => [
      ...current,
      {
        nombre,
        cantidad,
        unidad: normalizeUnit(ingredientUnit)
      }
    ]);

    setIngredientName('');
    setIngredientQuantity('1');
    setIngredientUnit('ud');
  };

  const removeIngredient = index => {
    setIngredients(current => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const submit = event => {
    event.preventDefault();
    if (!name.trim() || ingredients.length === 0 || !formDate || !hour) return;

    const typeInfo = TIPOS_COMIDA.find(item => item.valor === mealType) || TIPOS_COMIDA[2];
    onSave({
      nombre: name.trim(),
      tipo: mealType,
      icono: typeInfo.icono,
      ingredientes: ingredients,
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
            <label>Ingredientes</label>

            <input
              value={ingredientName}
              onChange={event => setIngredientName(event.target.value)}
              placeholder="Ej.: Pan"
              aria-label="Nombre del ingrediente"
            />

            <div className="compra-cantidad-unidad">
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={ingredientQuantity}
                onChange={event => setIngredientQuantity(event.target.value)}
                aria-label="Cantidad del ingrediente"
              />

              <select
                value={ingredientUnit}
                onChange={event => setIngredientUnit(event.target.value)}
                aria-label="Unidad del ingrediente"
              >
                {UNIT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="boton-formulario-secundario"
              type="button"
              onClick={addIngredient}
              disabled={
                !ingredientName.trim()
                || !Number.isFinite(Number(String(ingredientQuantity).replace(',', '.')))
                || Number(String(ingredientQuantity).replace(',', '.')) <= 0
              }
            >
              Añadir ingrediente
            </button>

            {ingredients.length > 0 && (
              <div className="ingredientes-rapidos-lista">
                {ingredients.map((ingredient, index) => (
                  <div className="ingrediente-rapido-item" key={`${ingredient.nombre}-${index}`}>
                    <span>
                      <strong>{ingredient.nombre}</strong> — {ingredient.cantidad} {ingredient.unidad}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      aria-label={`Eliminar ${ingredient.nombre}`}
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
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

          <button className="boton-formulario-guardar" type="submit" disabled={ingredients.length === 0}>
            {initialMeal ? 'Guardar cambios' : 'Guardar'}
          </button>
        </form>
      </div>
    </>
  );
}
