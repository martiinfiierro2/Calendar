# Diagnóstico actualizado — rama `nevera`

Fecha de revisión: 2026-10-01

## Estado actual

La primera ronda de testing detectó varias inconsistencias reales. Ya se han corregido en la rama `nevera`:

- `parseIngredientLine` ya reconoce correctamente unidades largas como `litro` y `litros`.
- Frontend y backend normalizan igual unidades desconocidas: se convierten a `ud`.
- Frontend y backend normalizan igual nombres: minúsculas, sin tildes y sin espacios repetidos.
- La categorización de ingredientes se ha alineado y ahora contempla los mismos casos representativos.
- `consumptionService` reutiliza las utilidades comunes de stock en lugar de mantener una segunda implementación de normalización y conversión.
- Los formularios de lista y nevera ya no permiten cantidades `0`; ahora siguen la misma regla que la API (`cantidad > 0`).
- La nevera muestra correctamente su estado vacío aunque existan registros ocultos con estado `usado`.
- Se ha eliminado código muerto de generación desde calendario en `FridgeView`.

## Validaciones realizadas

Se han comprobado de forma automática los casos críticos de lógica pura:

- parsing de `1,5 litros leche`;
- aliases de unidades;
- unidad desconocida -> `ud` en frontend y backend;
- normalización de nombres con tildes y espacios;
- paridad de categorización frontend/backend;
- compatibilidad `kg/g` y `L/ml`;
- cálculo de faltantes;
- exclusión de productos `usado` del stock disponible para futuras compras.

Las comprobaciones críticas realizadas tras los cambios pasan.

## Riesgos que quedan antes del merge

La lógica pura está en buen estado, pero aún falta validar contra infraestructura real:

1. Endpoints Express con autenticación.
2. Sequelize/PostgreSQL real.
3. Aislamiento por usuario.
4. Flujo completo `apuntado -> apuntadoChecked -> comprado -> usado`.
5. Generación desde calendario con comidas y recetas persistidas.
6. Consumo automático al pasar la fecha/hora de una comida.
7. Build y lint completos del repositorio.
8. Prueba visual final de Lista/Nevera.

## Checklist de cierre

Antes de fusionar `nevera` en `main`:

```bash
npm test
npm run lint
npm run build
```

Después, con backend y PostgreSQL accesibles, comprobar manualmente:

- crear producto en lista;
- editarlo;
- marcarlo como comprado;
- limpiar comprados y verificar que aparece en nevera;
- crear/editar producto directamente en nevera;
- programar una comida con receta;
- generar lista desde calendario y comprobar que descuenta stock existente;
- verificar que una comida pasada consume stock;
- verificar consumo parcial;
- verificar que un producto agotado pasa a `usado` y desaparece de nevera.

## Diagnóstico provisional

La rama ya no presenta los fallos de normalización detectados en la primera batería y la lógica de stock pura queda coherente entre frontend y backend.

No debe considerarse todavía lista para merge únicamente con estos tests: falta la prueba de integración real con Express + PostgreSQL y el cierre de build/lint/UI.b
 