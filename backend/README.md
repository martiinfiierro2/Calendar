# Calendar API

Backend de la aplicación Calendar con Node.js, Express, Sequelize y MySQL.

## Puesta en marcha

1. Crea una base de datos MySQL llamada `calendar_app`.
2. Copia `.env.example` como `.env` y ajusta usuario, contraseña y `JWT_SECRET`.
3. Instala dependencias:

```bash
cd backend
npm install
```

4. Arranca en desarrollo:

```bash
npm run dev
```

La API queda disponible por defecto en `http://localhost:8080`.

## Endpoints

### Autenticación

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Recetas

- `GET /api/recipes`
- `POST /api/recipes`
- `PUT /api/recipes/:id`
- `DELETE /api/recipes/:id`

### Calendario

- `GET /api/meals`
- `POST /api/meals`
- `PUT /api/meals/:id`
- `DELETE /api/meals/:id`

### Lista de compra

- `GET /api/shopping`
- `POST /api/shopping`
- `POST /api/shopping/from-calendar`
- `PUT /api/shopping/:id`
- `DELETE /api/shopping/:id`

### Perfil

- `GET /api/profile`
- `PUT /api/profile`

## Autenticación

Las rutas privadas esperan el token JWT en la cabecera:

```text
Authorization: Bearer <token>
```

## Estructura

```text
src/
├── config/       # Base de datos
├── controllers/  # Lógica de cada recurso
├── data/         # Datos iniciales
├── middleware/   # Auth, errores y validación
├── models/       # Tablas y relaciones Sequelize
├── routes/       # Endpoints HTTP
├── utils/        # Utilidades pequeñas
├── app.js        # Configuración de Express
└── server.js     # Arranque de la API
```

En desarrollo se usa `sequelize.sync()` para crear las tablas que falten. Para producción conviene sustituirlo por migraciones versionadas.
