# Arquitectura del frontend

La aplicación está organizada por responsabilidad para que sea fácil añadir una API más adelante sin rehacer las pantallas.

```text
src/
├── features/      # Pantallas y componentes de cada funcionalidad
├── services/      # Acceso a datos, sesión y reglas compartidas
├── shared/        # Componentes reutilizables en toda la app
├── utils/         # Funciones pequeñas sin estado
├── config/        # Constantes y configuración común
├── data/          # Datos iniciales de la aplicación
├── routes/        # Rutas y protección de pantallas
├── componentes/   # Hojas de estilo específicas de las pantallas
├── App.jsx
└── main.jsx
```

## Features

Cada funcionalidad tiene su propia carpeta.

- `features/calendar`: calendario, vistas de día/semana/mes/año y formularios de comidas.
- `features/recipes`: listado, tarjeta, detalle y formulario de recetas.
- `features/shopping`: lista de compra y productos.
- `features/profile`: perfil y preferencias.
- `features/auth`: login y registro local.

La idea es que una pantalla se ocupe de mostrar y coordinar, no de guardar datos directamente.

## Services

Los servicios concentran la lógica que después se podrá sustituir por llamadas a una API.

- `authService.js`: sesión, registro y login local.
- `storageService.js`: lectura y escritura de datos separados por usuario.
- `recipeService.js`: carga y guardado de recetas.
- `shoppingService.js`: generación de compra desde el calendario.

Cuando exista backend, esta capa será el lugar natural para cambiar `localStorage` por `fetch` o un cliente HTTP.

## Shared y utils

`shared` contiene componentes usados en varias pantallas, como `Icon`, `IconButton` y `Footer`.

`utils` contiene funciones independientes, por ejemplo conversión de fechas y clasificación de ingredientes. Estas funciones no dependen de React y se pueden probar fácilmente.

## Flujo de datos

```text
Pantalla / componente
        ↓
      service
        ↓
 localStorage por usuario
```

Más adelante el último paso pasará a ser:

```text
Pantalla / componente
        ↓
      service
        ↓
       API
        ↓
   Base de datos
```

## Comentarios

Los comentarios del código son intencionadamente cortos. Se usan para explicar el motivo o la responsabilidad de un bloque, no para repetir literalmente lo que ya dice el código.
