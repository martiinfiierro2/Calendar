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

COMMIT;

-- Comprobación rápida tras la migración:
-- SELECT table_name
-- FROM information_schema.tables
-- WHERE table_schema = 'public'
-- ORDER BY table_name;
