BEGIN;

ALTER TABLE users RENAME TO usuarios;
ALTER TABLE recipes RENAME TO recetas;
ALTER TABLE meals RENAME TO comidas;
ALTER TABLE shopping_items RENAME TO lista_compra;
ALTER TABLE profiles RENAME TO perfiles;

ALTER TABLE usuarios RENAME COLUMN "passwordHash" TO "hashContrasena";
ALTER TABLE usuarios RENAME COLUMN "createdAt" TO "creadoEn";
ALTER TABLE usuarios RENAME COLUMN "updatedAt" TO "actualizadoEn";

ALTER TABLE recetas RENAME COLUMN "userId" TO "usuarioId";
ALTER TABLE recetas RENAME COLUMN "createdAt" TO "creadoEn";
ALTER TABLE recetas RENAME COLUMN "updatedAt" TO "actualizadoEn";

ALTER TABLE comidas RENAME COLUMN "userId" TO "usuarioId";
ALTER TABLE comidas RENAME COLUMN "recipeId" TO "recetaId";
ALTER TABLE comidas RENAME COLUMN "createdAt" TO "creadoEn";
ALTER TABLE comidas RENAME COLUMN "updatedAt" TO "actualizadoEn";

ALTER TABLE lista_compra RENAME COLUMN "userId" TO "usuarioId";
ALTER TABLE lista_compra RENAME COLUMN "createdAt" TO "creadoEn";
ALTER TABLE lista_compra RENAME COLUMN "updatedAt" TO "actualizadoEn";

ALTER TABLE perfiles RENAME COLUMN "userId" TO "usuarioId";
ALTER TABLE perfiles RENAME COLUMN "createdAt" TO "creadoEn";
ALTER TABLE perfiles RENAME COLUMN "updatedAt" TO "actualizadoEn";

-- Vistas temporales para que la versión anterior de la API siga funcionando
-- mientras se despliega el código nuevo en castellano.
CREATE VIEW users AS
SELECT
  id,
  nombre,
  email,
  "hashContrasena" AS "passwordHash",
  "creadoEn" AS "createdAt",
  "actualizadoEn" AS "updatedAt"
FROM usuarios;

CREATE VIEW recipes AS
SELECT
  id,
  nombre,
  categoria,
  tiempo,
  raciones,
  dificultad,
  favorito,
  imagen,
  ingredientes,
  pasos,
  "usuarioId" AS "userId",
  "creadoEn" AS "createdAt",
  "actualizadoEn" AS "updatedAt"
FROM recetas;

CREATE VIEW meals AS
SELECT
  id,
  fecha,
  hora,
  nombre,
  tipo,
  icono,
  modo,
  ingredientes,
  "usuarioId" AS "userId",
  "recetaId" AS "recipeId",
  "creadoEn" AS "createdAt",
  "actualizadoEn" AS "updatedAt"
FROM comidas;

CREATE VIEW shopping_items AS
SELECT
  id,
  nombre,
  cantidad,
  categoria,
  comprado,
  automatico,
  "usuarioId" AS "userId",
  "creadoEn" AS "createdAt",
  "actualizadoEn" AS "updatedAt"
FROM lista_compra;

CREATE VIEW profiles AS
SELECT
  id,
  raciones,
  dieta,
  recordatorios,
  "resumenSemanal",
  "comprasAutomaticas",
  "usuarioId" AS "userId",
  "creadoEn" AS "createdAt",
  "actualizadoEn" AS "updatedAt"
FROM perfiles;

COMMIT;

-- Comprobación rápida tras la migración:
-- SELECT table_name, table_type
-- FROM information_schema.tables
-- WHERE table_schema = 'public'
-- ORDER BY table_name;
