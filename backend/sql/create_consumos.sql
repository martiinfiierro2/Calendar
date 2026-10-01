CREATE TABLE IF NOT EXISTS consumos (
  id SERIAL PRIMARY KEY,
  "nombreProducto" VARCHAR(160) NOT NULL,
  cantidad DECIMAL(10,2) NOT NULL,
  unidad VARCHAR(20) NOT NULL,
  fecha DATE NOT NULL,
  hora TIME NOT NULL,
  "comidaNombre" VARCHAR(120) NOT NULL,
  "usuarioId" INTEGER NOT NULL,
  "comidaId" INTEGER NULL,
  "recetaId" INTEGER NULL,
  "creadoEn" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "actualizadoEn" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT consumos_usuario_fk
    FOREIGN KEY ("usuarioId") REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT consumos_comida_fk
    FOREIGN KEY ("comidaId") REFERENCES comidas(id) ON DELETE SET NULL,
  CONSTRAINT consumos_receta_fk
    FOREIGN KEY ("recetaId") REFERENCES recetas(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS consumos_usuario_fecha_idx
  ON consumos ("usuarioId", fecha DESC, hora DESC);
