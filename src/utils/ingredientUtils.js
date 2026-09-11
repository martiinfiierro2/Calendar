// Intenta colocar cada ingrediente en una categoría útil de la compra.
export function categoriaIngrediente(nombre = '') {
  const texto = nombre.toLowerCase();

  if (/(tomate|cebolla|zanahoria|pepino|pimiento|patata|lim[oó]n|verdura|fruta|ajo|calabac[ií]n|lechuga)/.test(texto)) {
    return 'Fruta y verdura';
  }
  if (/(pollo|carne|ternera|cerdo|jam[oó]n|salm[oó]n|pescado|at[uú]n|conejo)/.test(texto)) {
    return 'Carne y pescado';
  }
  if (/(leche|queso|yogur|mantequilla|nata)/.test(texto)) {
    return 'Lácteos';
  }
  if (/(pan|baguette|barra|tostada)/.test(texto)) {
    return 'Panadería';
  }
  if (/(arroz|pasta|harina|lenteja|garbanzo|aceite|vinagre|sal|pimienta|curry|azafr[aá]n|piment[oó]n)/.test(texto)) {
    return 'Despensa';
  }

  return 'Otros';
}

// Normaliza texto para comparar ingredientes y evitar duplicados sencillos.
export function normalizarIngrediente(nombre = '') {
  return nombre.trim().toLowerCase().replace(/\s+/g, ' ');
}
