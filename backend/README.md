# Calendar API

Backend de Calendar con Node.js, Express, Sequelize y PostgreSQL.

## Desarrollo local

1. Crea una base PostgreSQL llamada `calendar_app`.
2. Copia `.env.example` como `.env`.
3. Ajusta `DATABASE_URL` y `JWT_SECRET`.
4. Instala dependencias:

```bash
cd backend
npm install
```

5. Crea las tablas:

```bash
npm run db:sync
```

6. Arranca la API:

```bash
npm run dev
```

Por defecto queda disponible en `http://localhost:8080`.

## PostgreSQL en Vercel

La configuración usa `DATABASE_URL`, así que funciona con proveedores PostgreSQL gestionados como Neon, Supabase, Prisma Postgres o Aurora PostgreSQL.

Para un despliegue sencillo se puede usar Neon desde Vercel Marketplace. Al conectar la base al proyecto, añade la URL de conexión como `DATABASE_URL`.

Variables de entorno necesarias en Vercel:

```text
NODE_ENV=production
DATABASE_URL=postgresql://...
DB_SSL=true
JWT_SECRET=una-clave-larga-y-segura
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://tu-frontend.vercel.app
```

Este backend puede desplegarse como un segundo proyecto Vercel usando `backend` como Root Directory. `api/index.js` es la entrada serverless y `vercel.json` redirige las peticiones a Express.

Antes del primer uso ejecuta `npm run db:sync` desde local apuntando a la base de producción. Más adelante conviene sustituir `sequelize.sync()` por migraciones versionadas.

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

Las rutas privadas esperan el JWT en la cabecera:

```text
Authorization: Bearer <token>
```

## Estructura

```text
backend/
├── api/           # Entrada serverless para Vercel
├── scripts/       # Utilidades de mantenimiento
├── src/
│   ├── config/       # PostgreSQL y Sequelize
│   ├── controllers/  # Lógica de negocio
│   ├── data/         # Datos iniciales
│   ├── middleware/   # Auth, errores y validación
│   ├── models/       # Tablas y relaciones
│   ├── routes/       # Endpoints HTTP
│   ├── utils/        # Utilidades
│   ├── app.js        # Express
│   └── server.js     # Servidor local
└── vercel.json
```
