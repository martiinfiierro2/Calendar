import React, { useEffect, useMemo, useState } from 'react';
import { CATEGORIAS_RECETA, PERFIL_INICIAL } from '../../config/appConfig';
import { getRecipes, saveRecipes } from '../../services/recipeService';
import { readStorage } from '../../services/storageService';
import Icon from '../../shared/Icon';
import RecipeCard from './RecipeCard';
import RecipeDetail from './RecipeDetail';
import RecipeForm from './RecipeForm';
import '../../componentes/recetas.css';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=700&q=80';

function createEmptyForm() {
  const profile = readStorage('calendar_perfil', PERFIL_INICIAL) || PERFIL_INICIAL;
  return {
    nombre: '',
    categoria: 'Otros',
    tiempo: 30,
    raciones: profile.raciones || 2,
    dificultad: 'Fácil',
    imagen: '',
    ingredientes: '',
    pasos: ''
  };
}

export default function RecipesPage() {
  const [recipes, setRecipes] = useState(getRecipes);
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [category, setCategory] = useState('Todas');
  const [detail, setDetail] = useState(null);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(null);

  // El servicio se encarga de guardar las recetas del usuario activo.
  useEffect(() => {
    saveRecipes(recipes);
  }, [recipes]);

  const filteredRecipes = useMemo(() => {
    const text = query.trim().toLowerCase();
    return recipes.filter(recipe => {
      const matchesText = !text
        || recipe.nombre.toLowerCase().includes(text)
        || recipe.ingredientes.some(item => item.toLowerCase().includes(text));
      const matchesCategory = category === 'Todas'
        || (category === 'Favoritas' ? recipe.favorito : recipe.categoria === category);
      return matchesText && matchesCategory;
    });
  }, [recipes, query, category]);

  const openNew = () => {
    setDetail(null);
    setEditing(null);
    setForm(createEmptyForm());
  };

  const openEdit = recipe => {
    setDetail(null);
    setEditing(recipe);
    setForm({
      nombre: recipe.nombre,
      categoria: recipe.categoria,
      tiempo: recipe.tiempo,
      raciones: recipe.raciones,
      dificultad: recipe.dificultad,
      imagen: recipe.imagen || '',
      ingredientes: recipe.ingredientes.join('\n'),
      pasos: recipe.pasos.join('\n')
    });
  };

  const closeForm = () => {
    setForm(null);
    setEditing(null);
  };

  const submitForm = event => {
    event.preventDefault();
    if (!form?.nombre.trim()) return;

    const recipe = {
      id: editing?.id || Date.now(),
      nombre: form.nombre.trim(),
      categoria: form.categoria,
      tiempo: Math.max(1, Number(form.tiempo) || 1),
      raciones: Math.max(1, Number(form.raciones) || 1),
      dificultad: form.dificultad,
      favorito: editing?.favorito || false,
      imagen: form.imagen.trim() || FALLBACK_IMAGE,
      ingredientes: form.ingredientes.split('\n').map(value => value.trim()).filter(Boolean),
      pasos: form.pasos.split('\n').map(value => value.trim()).filter(Boolean),
      planificada: editing?.planificada || null
    };

    setRecipes(current => editing
      ? current.map(item => item.id === editing.id ? recipe : item)
      : [recipe, ...current]
    );
    closeForm();
  };

  const deleteRecipe = recipe => {
    if (!window.confirm(`¿Eliminar \"${recipe.nombre}\"?`)) return;
    setRecipes(current => current.filter(item => item.id !== recipe.id));
    setDetail(null);
  };

  const toggleFavorite = id => {
    setRecipes(current => current.map(recipe => (
      recipe.id === id ? { ...recipe, favorito: !recipe.favorito } : recipe
    )));
    setDetail(current => current?.id === id ? { ...current, favorito: !current.favorito } : current);
  };

  return (
    <div className="recetas-pantalla recetas-app">
      <header className="recetas-cabecera recetas-header">
        {searchOpen ? (
          <div
            className="recetas-search-wrap"
            style={{
              margin: 0,
              width: 'min(100%, 250px)',
              maxWidth: '250px',
              minHeight: '40px',
              flexShrink: 1
            }}
          >
            <Icon name="search" size={17} />
            <input
              type="text"
              inputMode="search"
              enterKeyHint="search"
              placeholder="Nombre o ingrediente..."
              value={query}
              onChange={event => setQuery(event.target.value)}
              style={{ fontSize: '16px', lineHeight: 1.25 }}
            />
            {query && (
              <button onClick={() => setQuery('')} aria-label="Limpiar">
                <Icon name="close" size={16} />
              </button>
            )}
          </div>
        ) : (
          <div>
            <span className="recetas-eyebrow">Mi cocina</span>
            <h1 className="recetas-titulo">Recetas</h1>
          </div>
        )}

        <div className="recetas-header-actions">
          <button className={`recetas-icon-btn ${searchOpen ? 'activo' : ''}`} onClick={() => setSearchOpen(value => !value)} aria-label="Buscar">
            <Icon name="search" />
          </button>
          <button className="recetas-icon-btn recetas-add-btn" onClick={openNew} aria-label="Nueva receta">
            <Icon name="plus" />
          </button>
        </div>
      </header>

      <div className="recetas-filtros" role="tablist" aria-label="Categorías">
        {CATEGORIAS_RECETA.map(item => (
          <button key={item} className={category === item ? 'activo' : ''} onClick={() => setCategory(item)}>
            {item}
          </button>
        ))}
      </div>

      <div className="recetas-resumen">
        <strong>{filteredRecipes.length}</strong>
        <span>{filteredRecipes.length === 1 ? 'receta' : 'recetas'}</span>
      </div>

      <div className="recetas-lista recetas-grid-lista">
        {filteredRecipes.length === 0 ? (
          <div className="recetas-vacio">
            <span className="recetas-vacio-icono"><Icon name="chef" size={28} /></span>
            <strong>No hay recetas aquí</strong>
            <p>Prueba con otra búsqueda o crea una receta nueva.</p>
            <button onClick={openNew}><Icon name="plus" size={17} /> Crear receta</button>
          </div>
        ) : (
          filteredRecipes.map(recipe => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              onOpen={setDetail}
              onToggleFavorite={toggleFavorite}
            />
          ))
        )}
      </div>

      <RecipeDetail
        recipe={detail}
        onClose={() => setDetail(null)}
        onEdit={openEdit}
        onDelete={deleteRecipe}
        onToggleFavorite={toggleFavorite}
      />

      <RecipeForm
        form={form}
        editing={editing}
        onChange={setForm}
        onClose={closeForm}
        onSubmit={submitForm}
      />
    </div>
  );
}
