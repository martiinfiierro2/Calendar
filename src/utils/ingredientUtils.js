// Intenta colocar cada ingrediente en una categoría útil de la compra.
export function categoriaIngrediente(nombre = '') {
  const texto = normalizarIngrediente(nombre);

  if (/(tomate|cebolla|zanahoria|pepino|pimiento|patata|limon|verdura|fruta|ajo|calabacin|lechuga)/.test(texto)) {
    return 'Fruta y verdura';
  }
  if (/(pollo|carne|ternera|cerdo|jamon|salmon|pescado|atun|conejo)/.test(texto)) {
    return 'Carne y pescado';
  }
  if (/(leche|queso|yogur|mantequilla|nata)/.test(texto)) {
    return 'Lácteos';
  }
  if (/(pan|baguette|barra|tostada)/.test(texto)) {
    return 'Panadería';
  }
  if (/(arroz|pasta|harina|lenteja|garbanzo|aceite|vinagre|sal|pimienta|curry|azafran|pimenton)/.test(texto)) {
    return 'Despensa';
  }

  return 'Otros';
}

// Normaliza texto para comparar ingredientes y evitar duplicados sencillos.
export function normalizarIngrediente(nombre = '') {
  return String(nombre)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}
