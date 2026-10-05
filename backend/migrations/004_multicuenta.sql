CREATE TABLE IF NOT EXISTS cuentas (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(20) NOT NULL DEFAULT 'individual' CHECK (tipo IN ('individual', 'grupal')),
  "creadoEn" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "actualizadoEn" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS "cuentaId" INTEGER;

DO $$
DECLARE
  usuario RECORD;
  nueva_cuenta_id INTEGER;
BEGIN
  FOR usuario IN
    SELECT id
    FROM usuarios
    WHERE "cuentaId" IS NULL
  LOOP
    INSERT INTO cuentas (tipo, "creadoEn", "actualizadoEn")
    VALUES ('individual', NOW(), NOW())
    RETURNING id INTO nueva_cuenta_id;

    UPDATE usuarios
    SET "cuentaId" = nueva_cuenta_id
    WHERE id = usuario.id;
  END LOOP;
END $$;

ALTER TABLE usuarios
  ALTER COLUMN "cuentaId" SET NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'usuarios_cuentaId_fkey'
  ) THEN
    ALTER TABLE usuarios
      ADD CONSTRAINT "usuarios_cuentaId_fkey"
      FOREIGN KEY ("cuentaId")
      REFERENCES cuentas(id)
      ON DELETE RESTRICT
      ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_usuarios_cuenta_id
  ON usuarios ("cuentaId");
