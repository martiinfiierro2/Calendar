-- No damos por verificados correos históricos que nunca se confirmaron.
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS "emailVerificado" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS "emailVerificacionHash" VARCHAR(64);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS "emailVerificacionExpiraEn" TIMESTAMPTZ;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS "emailVerificacionEnviadaEn" TIMESTAMPTZ;
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_verificacion_hash
  ON usuarios ("emailVerificacionHash") WHERE "emailVerificacionHash" IS NOT NULL;
