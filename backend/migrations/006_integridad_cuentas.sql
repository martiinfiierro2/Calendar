-- También se aplica a bases nuevas creadas por Sequelize.
CREATE UNIQUE INDEX IF NOT EXISTS idx_invitacion_pendiente_cuenta_email
  ON invitaciones_cuenta ("cuentaId", LOWER(email)) WHERE estado = 'pendiente';
CREATE INDEX IF NOT EXISTS idx_usuarios_cuenta_id ON usuarios ("cuentaId");
