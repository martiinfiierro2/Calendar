import React, { useState } from 'react';

const recetasData = [
  {
    id: 1,
    nombre: "Lasaña bolognesa",
    imagen: "https://via.placeholder.com/100x80",
    planificada: { fecha: "5 junio", hora: "14:00" }
  },
  {
    id: 2,
    nombre: "Pollo al curry",
    imagen: "https://via.placeholder.com/100x80",
    planificada: { fecha: "6 junio", hora: "14:00" }
  },
  {
    id: 3,
    nombre: "Gazpacho andaluz",
    imagen: "https://via.placeholder.com/100x80",
    planificada: null
  },
  {
    id: 4,
    nombre: "Paella valenciana",
    imagen: "https://via.placeholder.com/100x80",
    planificada: { fecha: "7 junio", hora: "14:00" }
  },
  {
    id: 5,
    nombre: "Tortilla de patatas",
    imagen: "https://via.placeholder.com/100x80",
    planificada: null
  },
  {
    id: 6,
    nombre: "Salmón a la plancha",
    imagen: "https://via.placeholder.com/100x80",
    planificada: { fecha: "8 junio", hora: "21:00" }
  },
  {
    id: 7,
    nombre: "Croquetas de jamón",
    imagen: "https://via.placeholder.com/100x80",
    planificada: null
  },
  {
    id: 8,
    nombre: "Lentejas estofadas",
    imagen: "https://via.placeholder.com/100x80",
    planificada: { fecha: "9 junio", hora: "14:00" }
  }
];

export default function Recetas() {
  const [busquedaAbierta, setBusquedaAbierta] = useState(false);
  const [query, setQuery] = useState('');

  const recetasFiltradas = recetasData.filter(r =>
    r.nombre.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="recetas-pantalla">

      {/* CABECERA */}
      <div className="recetas-cabecera">
          {busquedaAbierta ? (
            <input className="recetas-buscar"
              autoFocus
              placeholder="Buscar receta..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onBlur={() => { if (!query) setBusquedaAbierta(false); }}
            />
          ) : (
            <h1 className="recetas-titulo">RECETAS</h1>
          )}
        <div className="botones-recetas">
          <button className="btnSinEstilo" onClick={() => setBusquedaAbierta(true)}>🔍</button>
          <button className="btnSinEstilo">➕</button>
        </div>
      </div>

      {/* LISTA */}
      <div className="recetas-lista">
        {recetasFiltradas.map(receta => (
          <div key={receta.id} className="receta-card">
            <img
              src={receta.imagen}
              alt={receta.nombre}
              className="receta-imagen"
            />
            <div className="receta-info">
              <span className="receta-nombre">{receta.nombre}</span>
              {receta.planificada ? (
                <span className="receta-fecha">
                  {receta.planificada.fecha} ({receta.planificada.hora})
                </span>
              ) : (
                <span className="receta-no-añadida">No añadida</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}