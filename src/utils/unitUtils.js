export const UNIT_OPTIONS = [
  { value: 'ud', label: 'ud' },
  { value: 'g', label: 'g' },
  { value: 'kg', label: 'kg' },
  { value: 'ml', label: 'ml' },
  { value: 'L', label: 'L' }
];

const UNIT_ALIASES = {
  ud: 'ud',
  uds: 'ud',
  unidad: 'ud',
  unidades: 'ud',

  g: 'g',
  gr: 'g',
  grs: 'g',
  gramo: 'g',
  gramos: 'g',

  kg: 'kg',
  kilo: 'kg',
  kilos: 'kg',
  kilogramo: 'kg',
  kilogramos: 'kg',

  ml: 'ml',
  mililitro: 'ml',
  mililitros: 'ml',

  l: 'L',
  lt: 'L',
  lts: 'L',
  litro: 'L',
  litros: 'L'
};

export function normalizeUnit(value = 'ud') {
  const normalized = String(value)
    .trim()
    .toLowerCase()
    .replace(/\./g, '');

  return UNIT_ALIASES[normalized] || 'ud';
}

export function parseIngredientLine(text = '') {
  const clean = String(text).trim();

  if (!clean) {
    return null;
  }

  const match = clean.match(
    /^(\d+(?:[.,]\d+)?)\s*(kilogramos|kilogramo|kilos|kilo|kg|mililitros|mililitro|ml|litros|litro|lts|lt|l|gramos|gramo|grs|gr|g|unidades|unidad|uds|ud)?\s*(?:de\s+)?(.+)$/i
  );

  if (!match) {
    return {
      nombre: clean,
      cantidad: 1,
      unidad: 'ud'
    };
  }

  const [, cantidad, unidad, nombre] = match;

  return {
    nombre: nombre.trim(),
    cantidad: Number(cantidad.replace(',', '.')),
    unidad: normalizeUnit(unidad || 'ud')
  };
}

export function ingredientToText(ingredient) {
  if (typeof ingredient === 'string') {
    return ingredient;
  }

  if (!ingredient) {
    return '';
  }

  const amount = ingredient.cantidad ?? 1;
  const unit = normalizeUnit(ingredient.unidad || 'ud');
  const name = ingredient.nombre || '';

  return `${amount} ${unit} de ${name}`.trim();
}
