BEGIN;
-- Un invitado pendiente no tiene una cuenta individual provisional.
ALTER TABLE usuarios ALTER COLUMN "cuentaId" DROP NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS usuarios_email_normalizado_unico ON usuarios (LOWER(email));
COMMIT;
