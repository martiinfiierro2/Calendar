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
