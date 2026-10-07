# Tests de la rama `nevera`

Estos tests usan el runner nativo de Node (`node:test`), por lo que no añaden Jest, Vitest ni otras dependencias.

## Qué cubren

- `tests/frontend/unitUtils.test.js`
  - normalización de unidades
  - parsing de líneas de ingredientes
  - conversión de ingrediente a texto
  - unidades soportadas por los formularios

- `tests/frontend/ingredientUtils.test.js`
  - categorización automática de ingredientes
  - normalización básica de nombres en frontend

- `tests/backend/stockUtils.test.js`
  - normalización de nombres y unidades
  - compatibilidad entre productos e ingredientes
  - conversiones kg/g y L/ml
  - cálculo de cantidad disponible
  - cálculo de faltantes
  - filtrado de estados usados por la generación desde calendario

- `tests/integration/normalizationConsistency.test.js`
  - consistencia de unidades soportadas entre frontend y backend
  - documenta la diferencia actual para unidades desconocidas

## Ejecutar

Desde la raíz del proyecto:

```bash
npm test
```

También se pueden ejecutar de forma individual:

```bash
node --test tests/frontend/unitUtils.test.js
node --test tests/frontend/ingredientUtils.test.js
node --test tests/backend/stockUtils.test.js
node --test tests/integration/normalizationConsistency.test.js
```

## Importante

Estos son tests unitarios de la lógica de `nevera/lista de compra`. No necesitan base de datos ni API desplegada.

Todavía faltan tests de integración reales contra Express/Sequelize y tests de componentes React. Para esos conviene decidir después si incorporar Vitest + React Testing Library y una base de datos de test.

## Multicuenta: PostgreSQL real y navegador

Las pruebas rápidas existentes siguen disponibles con `npm test` y no requieren PostgreSQL.

Los comandos nuevos son:

- `npm run test:database`: API familiar y migraciones con PostgreSQL real.
- `npm run test:browser`: interfaz en Chromium, con API y PostgreSQL reales.
- `npm run test:security`: regresión de identidad del destinatario de invitaciones; exige verificar el correo antes de entrar en una familia.
- `npm run test:all`: ejecuta todas las anteriores, incluida la regresión de seguridad.

Requisitos: Node 24, dependencias instaladas con `npm ci`, PostgreSQL local y sus herramientas `pg_dump`/`pg_restore` en `PATH`. Define `CALENDAR_TEST_ADMIN_URL` mediante las variables de tu entorno con una conexión local que permita `CREATE DATABASE`. Las pruebas no utilizan la `DATABASE_URL` de la aplicación: crean bases `calendar_test_<identificador>` y eliminan exclusivamente esas bases al finalizar. No se permiten conexiones remotas.

Para el navegador puedes instalar Chromium con `npx playwright install chromium`, o indicar un Chromium existente mediante `CALENDAR_TEST_CHROMIUM_PATH`. En este entorno se utilizó `/usr/bin/chromium` y PostgreSQL 17 de `/workspace/calendar-dev/postgres/usr/lib/postgresql/17/bin`.

`tests/fixtures/main-schema.sql` conserva únicamente el esquema de `main` (`ce95b98`); no incluye filas, contraseñas de usuarios ni credenciales. Los casos cubren creación nueva, actualización desde main, esquema histórico en inglés, migraciones ya aplicadas manualmente, repetición/concurrencia, rollback por error y restauración de una copia previa en otra base.

La regresión de seguridad no está omitida ni marcada como éxito esperado: la aceptación de invitaciones exige un correo verificado y la prueba debe pasar antes del merge. Ver `tests/MULTICUENTA_REVIEW.md`.


La suite de base de datos también incluye 11 pruebas de verificación de email: token guardado como hash, caducidad, uso único/concurrente, reenvío limitado, cambio de email, rechazo del token anterior, fallo del proveedor, contrato Resend, transporte de pruebas prohibido en producción y eliminación del usuario. El buzón de pruebas solo existe en memoria dentro de cada proceso y nunca envía correos externos. Los helpers de familias verifican el email mediante el endpoint real antes de aceptar invitaciones.
