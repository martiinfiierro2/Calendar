# Diagnóstico inicial — rama `nevera`

Fecha de revisión: 2026-09-29

## Resultado de la batería inicial

- 23 tests ejecutados sobre la lógica pura relevante.
- 22 tests pasan.
- 1 test falla y reproduce un bug real en el parser de ingredientes.

> La ejecución se validó sobre una copia exacta de los módulos puros porque el entorno de revisión no pudo resolver `github.com` para clonar el repositorio. Los archivos de test sí están guardados en la rama `nevera` y pueden ejecutarse en el repositorio con `npm test`.

## Bug reproducido: unidades de litro en `parseIngredientLine`

Entrada:

```text
1,5 litros leche
```

Esperado:

```js
{
  nombre: 'leche',
  cantidad: 1.5,
  unidad: 'L'
}
```

Resultado actual:

```js
{
  nombre: 'itros leche',
  cantidad: 1.5,
  unidad: 'L'
}
```

### Causa probable

En la expresión regular de `parseIngredientLine`, la alternativa `l` aparece antes que `litro` y `litros`. La expresión regular acepta la coincidencia corta (`l`) y deja el resto (`itros`) como parte del nombre del ingrediente.

Conviene ordenar las alternativas desde las más largas a las más cortas o separar el reconocimiento de unidad del resto del parsing.

## Inconsistencias detectadas

### 1. Unidades desconocidas: frontend y backend no se comportan igual

Frontend (`normalizeUnit`):

```text
cucharadas -> ud
```

Backend (`normalizarUnidad`):

```text
cucharadas -> cucharadas
```

No rompe los formularios actuales porque el selector limita las unidades disponibles, pero puede producir comportamientos diferentes si llegan datos antiguos, importados o escritos libremente.

### 2. Normalización de nombres diferente

Frontend `normalizarIngrediente` normaliza mayúsculas y espacios, pero conserva tildes.

Backend `normalizarNombre` elimina también las tildes.

Ejemplo:

```text
Frontend: Limón -> limón
Backend:  Limón -> limon
```

Si la comparación de duplicados se reparte entre frontend y backend, dos cadenas podrían considerarse distintas en un lado e iguales en el otro.

### 3. Categorización duplicada

La categorización de ingredientes existe tanto en `src/utils/ingredientUtils.js` como dentro de `backend/src/controllers/shoppingController.js`.

Las reglas ya no son idénticas: el frontend contempla, por ejemplo, `calabacín`, mientras la copia del backend no lo incluye. Esto puede hacer que un producto creado manualmente y otro generado desde calendario terminen en categorías diferentes.

Recomendación futura: tener una única fuente de verdad o, como mínimo, tests compartidos que obliguen a mantener ambas reglas alineadas.

## Comportamientos que sí quedan validados

- Conversión `kg <-> g`.
- Conversión `L <-> ml`.
- Compatibilidad por nombre ignorando mayúsculas/tildes en backend.
- Suma de varias cantidades compatibles de nevera.
- Un producto con unidad incompatible no cubre un ingrediente.
- El faltante nunca queda por debajo de cero.
- Al calcular faltantes desde calendario se tienen en cuenta estados `comprado`, `apuntado` y `apuntadoChecked`, pero no `usado`.
- Los aliases soportados de unidades coinciden entre frontend y backend.
- Categorización básica de ingredientes en frontend.

## Cobertura pendiente

Esta primera batería no comprueba todavía:

- endpoints reales de Express;
- Sequelize/PostgreSQL;
- autenticación y permisos por usuario;
- `generateFromCalendar` completo con comidas y recetas reales;
- consumo automático al pasar la hora de una comida;
- componentes React y eventos de UI;
- funcionamiento de Lista -> Comprado -> Nevera contra la API;
- errores de red y timeouts.

Para esa segunda fase conviene añadir tests de integración del backend y, después, Vitest + React Testing Library para los componentes del frontend.
