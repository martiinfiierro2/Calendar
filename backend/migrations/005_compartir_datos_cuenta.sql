ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS rol VARCHAR(20) NOT NULL DEFAULT 'propietario'
  CHECK (rol IN ('propietario', 'miembro'));

CREATE TABLE IF NOT EXISTS invitaciones_cuenta (
  id SERIAL PRIMARY KEY,
  "cuentaId" INTEGER NOT NULL REFERENCES cuentas(id) ON DELETE CASCADE ON UPDATE CASCADE,
  email VARCHAR(160) NOT NULL,
  "invitadoPor" INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE ON UPDATE CASCADE,
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aceptada', 'rechazada')),
  token VARCHAR(120) NOT NULL UNIQUE,
  "expiraEn" TIMESTAMPTZ NOT NULL,
  "creadoEn" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "actualizadoEn" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_invitacion_pendiente_cuenta_email
  ON invitaciones_cuenta ("cuentaId", LOWER(email))
  WHERE estado = 'pendiente';

DO $$
DECLARE
  tabla TEXT;
BEGIN
  FOREACH tabla IN ARRAY ARRAY['recetas', 'comidas', 'lista_compra', 'consumos']
  LOOP
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS "cuentaId" INTEGER', tabla);
    EXECUTE format(
      'UPDATE %I t SET "cuentaId" = u."cuentaId" FROM usuarios u WHERE t."usuarioId" = u.id AND t."cuentaId" IS NULL',
      tabla
    );
    EXECUTE format('ALTER TABLE %I ALTER COLUMN "cuentaId" SET NOT NULL', tabla);
  END LOOP;
END $$;

DO $$
DECLARE
  tabla TEXT;
  constraint_name TEXT;
BEGIN
  FOREACH tabla IN ARRAY ARRAY['recetas', 'comidas', 'lista_compra', 'consumos']
  LOOP
    constraint_name := tabla || '_cuentaId_fkey';
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = constraint_name) THEN
      EXECUTE format(
        'ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY ("cuentaId") REFERENCES cuentas(id) ON DELETE CASCADE ON UPDATE CASCADE',
        tabla,
        constraint_name
      );
    END IF;
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I ("cuentaId")', 'idx_' || tabla || '_cuenta_id', tabla);
  END LOOP;
END $$;

-- Desde este punto el ownership funcional pertenece a la cuenta.
ALTER TABLE recetas DROP COLUMN IF EXISTS "usuarioId";
ALTER TABLE comidas DROP COLUMN IF EXISTS "usuarioId";
ALTER TABLE lista_compra DROP COLUMN IF EXISTS "usuarioId";
ALTER TABLE consumos DROP COLUMN IF EXISTS "usuarioId";
