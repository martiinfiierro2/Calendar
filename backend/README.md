# Calendar API

Backend de Calendar con Node.js, Express, Sequelize y PostgreSQL.

## Desarrollos locales

1. Crea una base PostgreSQL llamada `calendar_app`.
2. Copia `.env.example` como `.env`.
3. Ajusta `DATABASE_URL` y `JWT_SECRET`.
4. Instala dependencias:

```bash
cd backend
npm install
```

5. Prepara las tablas y aplica las migraciones pendientes:

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

Antes de desplegar ejecuta `npm run db:sync` apuntando a la base de producción, después de crear una copia de seguridad. El comando registra las migraciones y aplica solo las pendientes. En una base nueva crea las tablas con los modelos actuales. El servidor local usa el mismo procedimiento antes de escuchar peticiones.

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


## Cuentas familiares y privacidad

Las recetas, comidas del calendario, lista de compra, nevera y consumos pertenecen a la cuenta. Todos sus miembros tienen acceso a los mismos datos. El perfil (nombre, email y recordatorios) es privado y solo se consulta o edita mediante la sesión del propio usuario. El listado de miembros expone únicamente su identificador y rol; no publica sus perfiles ni emails.

Aceptar una invitación cambia la membresía sin fusionar datos de cuentas y sin publicar el perfil. Solo puede cambiar de cuenta un usuario cuya cuenta actual no tenga otros miembros. Los datos de la cuenta anterior se conservan allí, pero el usuario deja de tener acceso a ella. No se eliminan cuentas ni datos compartidos automáticamente.

Abandonar la cuenta o ser expulsado elimina el usuario y sus datos personales, incluida su contraseña almacenada y las invitaciones asociadas a su email. La cuenta familiar y sus datos permanecen. Para volver o crear una cuenta individual hay que registrarse de nuevo. El propietario debe transferir la propiedad antes de abandonar cuando haya otros miembros. Si sale el último miembro, los datos de la cuenta se conservan sin usuarios; no son accesibles mediante el usuario eliminado.

Cerrar sesión de forma habitual únicamente elimina la sesión del navegador: no borra el usuario ni transforma la cuenta. Los tokens de un usuario eliminado dejan de funcionar porque cada petición consulta su existencia. El navegador comprueba la sesión al recuperar el foco, cada 30 segundos y al recibir un 401.

### Gestión de cuenta

Todas las rutas requieren autenticación:

- `GET /api/cuenta`: cuenta, roles de miembros y rol del usuario actual. Solo el propietario ve los emails de las invitaciones enviadas.
- `PATCH /api/cuenta/tipo/grupal`: convertir en cuenta familiar (propietario).
- `POST /api/cuenta/invitaciones`: invitar por email; renueva una invitación caducada con un token nuevo (propietario).
- `DELETE /api/cuenta/invitaciones/:invitacionId`: cancelar una invitación pendiente o caducada (propietario).
- `GET /api/cuenta/invitaciones/mias`: invitaciones vigentes del email de la sesión.
- `POST /api/cuenta/invitaciones/:token/aceptar`: aceptar una invitación propia vigente.
- `POST /api/cuenta/invitaciones/:token/rechazar`: rechazar una invitación propia.
- `POST /api/cuenta/propiedad/:usuarioId`: transferir la propiedad a otro miembro de la misma cuenta (propietario).
- `DELETE /api/cuenta/miembros/:usuarioId`: expulsar y eliminar el usuario de un miembro (propietario).
- `POST /api/cuenta/abandonar`: abandonar y eliminar el propio usuario.

El destinatario ve la invitación al entrar en su perfil; no se envía correo automáticamente. La interfaz pide confirmación antes de aceptar, transferir propiedad, abandonar o expulsar.

## Actualización de una base existente

`npm run db:sync` utiliza `calendar_migrations` para registrar las migraciones y un bloqueo PostgreSQL para impedir ejecuciones simultáneas. La preparación completa se ejecuta en una transacción: si falla, los cambios de esa ejecución se revierten y el servidor local no arranca. La migración 005 también puede repetirse cuando ya se ha eliminado `usuarioId`.

Antes de actualizar una base con datos:

1. Detén las escrituras de la versión anterior y crea una copia de seguridad con `pg_dump "$DATABASE_URL" -Fc -f calendar-before-multicuenta.dump`. Protege el archivo, que contiene datos personales.
2. Desde `backend`, ejecuta `npm run db:sync` con las variables de la base que quieres actualizar.
3. Despliega conjuntamente la API y el frontend de `multicuenta`. No vuelvas a arrancar la API de `main` contra el esquema migrado: ya no utiliza `usuarioId` para las recetas, calendario y compra.

Para volver a `main` después de una migración confirmada, restaura la copia en una base vacía separada con `pg_restore --no-owner --no-acl --dbname="$RESTORE_DATABASE_URL" calendar-before-multicuenta.dump`, y apunta la versión anterior a esa base. Conserva también los cambios posteriores antes de restaurar. No hay una migración inversa automática, porque una cuenta familiar puede contener datos creados por varios participantes.

Estas instrucciones de migración y los flujos de cuenta deben validarse en una base de ensayo antes de producción; no sustituyen las pruebas de integración.


## Verificación de email con Resend

El registro y el cambio de email envían un enlace de verificación de un solo uso que caduca en 24 horas. La base guarda únicamente el SHA-256 del token. Al confirmar se elimina el hash; cambiar el email invalida cualquier enlace anterior y vuelve a marcar el correo como no verificado. Los usuarios históricos también deben verificar su correo para aceptar nuevas invitaciones; no se da por probado un email que nunca se confirmó.

Un usuario no verificado puede usar su cuenta, pero la API rechaza con 403 la aceptación de invitaciones, aunque conozca su token. El estado de verificación se consulta con la sesión y no puede alterarse desde el body del perfil. El perfil muestra el estado y permite reenviar el correo, con un intervalo mínimo de un minuto. Si el proveedor falla, el usuario no se pierde y se permite reintentar; un enlace anterior que sí llegó se conserva.

Configura en el backend de Vercel (o en el entorno que ejecute la API):

- `MAIL_TRANSPORT=resend`.
- `RESEND_API_KEY`: clave de Resend guardada como secreto del backend; nunca como variable `VITE_*` ni en el frontend.
- `MAIL_FROM`: remitente de un dominio propio validado en Resend, por ejemplo `Calendar <verificacion@tu-dominio.example>`.
- `FRONTEND_URL`: URL pública HTTPS del frontend en Vercel. Puede ser la URL de producción usada para main, una vez desplegado el nuevo frontend. No uses la URL de la API.

Valida el dominio remitente y los registros DNS que indique Resend. Un subdominio `*.vercel.app` no es un dominio tuyo para enviar correos. La configuración SPA existente en `vercel.json` del frontend ya permite abrir directamente `/verificar-email`; `backend/vercel.json` sigue siendo la configuración independiente de la API.

Rutas:

- `POST /api/autenticacion/email/verificar`, body `{ "token": "..." }`: consume el enlace válido; no requiere iniciar sesión. La página solicita confirmación explícita antes de usarlo, para que abrir un enlace o un escáner de correo no lo consuma.
- `POST /api/autenticacion/email/reenviar`: requiere sesión y envía al email actual del usuario. Nunca devuelve el token ni el enlace en la respuesta.

El enlace utiliza un fragmento (`/verificar-email#token=...`) para que el secreto no llegue al servidor web ni a sus logs; la página lo retira del historial al abrirse. Tras verificar, el usuario puede iniciar sesión y aceptar su invitación.

La migración 007 añade los campos e índice necesarios. `npm run db:sync` la registra y aplica como las demás. El transporte `MAIL_TRANSPORT=test` es exclusivo de `NODE_ENV=test`, utiliza un buzón en memoria y se rechaza en producción. No se utilizan mensajes de consola como sustituto del envío real.

Las pruebas cubren el contrato HTTPS con Resend usando una respuesta simulada y el flujo completo con un buzón de pruebas. Antes de activar el envío en producción hay que configurar estas variables y comprobar la recepción de un correo real; no se ha acreditado entrega real sin una clave y un dominio remitente.
