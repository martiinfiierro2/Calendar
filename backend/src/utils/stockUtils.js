export function normalizarNombre(nombre = '') {
  return String(nombre)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}

export function categoriaIngrediente(nombre = '') {
  const texto = normalizarNombre(nombre);

  if (/(tomate|cebolla|zanahoria|pepino|pimiento|patata|limon|verdura|fruta|ajo|calabacin|lechuga)/.test(texto)) return 'Fruta y verdura';
  if (/(pollo|carne|ternera|cerdo|jamon|salmon|pescado|atun|conejo)/.test(texto)) return 'Carne y pescado';
  if (/(leche|queso|yogur|mantequilla|nata)/.test(texto)) return 'Lácteos';
  if (/(pan|baguette|barra|tostada)/.test(texto)) return 'Panadería';
  if (/(arroz|pasta|harina|lenteja|garbanzo|aceite|vinagre|sal|pimienta|curry|azafran|pimenton)/.test(texto)) return 'Despensa';
  return 'Otros';
}

export function normalizarUnidad(unidad = 'ud') {
  const valor = String(unidad).trim().toLowerCase().replace(/\./g, '');
  const equivalencias = {
    ud: 'ud', uds: 'ud', unidad: 'ud', unidades: 'ud',
    g: 'g', gr: 'g', grs: 'g', gramo: 'g', gramos: 'g',
    kg: 'kg', kilo: 'kg', kilos: 'kg', kilogramo: 'kg', kilogramos: 'kg',
    ml: 'ml', mililitro: 'ml', mililitros: 'ml',
    l: 'L', lt: 'L', lts: 'L', litro: 'L', litros: 'L'
  };
  return equivalencias[valor] || 'ud';
}

export function tipoUnidad(unidad) {
  const normalizada = normalizarUnidad(unidad);
  if (['g', 'kg'].includes(normalizada)) return 'peso';
  if (['ml', 'L'].includes(normalizada)) return 'volumen';
  return 'unidad';
}

export function convertirABase(cantidad, unidad) {
  const numero = Number(cantidad);
  const normalizada = normalizarUnidad(unidad);
  if (!Number.isFinite(numero)) return 0;
  if (normalizada === 'kg' || normalizada === 'L') return numero * 1000;
  return numero;
}

export function convertirDesdeBase(cantidad, unidad) {
  const normalizada = normalizarUnidad(unidad);
  if (normalizada === 'kg' || normalizada === 'L') return cantidad / 1000;
  return cantidad;
}

export function sonCompatibles(ingrediente, producto) {
  if (!ingrediente || !producto) return false;
  return normalizarNombre(ingrediente.nombre) === normalizarNombre(producto.nombre) && tipoUnidad(ingrediente.unidad) === tipoUnidad(producto.unidad);
}

export function calcularCantidadDisponible(ingrediente, productos = []) {
  return productos.filter(producto => sonCompatibles(ingrediente, producto)).reduce((total, producto) => total + convertirABase(producto.cantidad, producto.unidad), 0);
}

export function calcularFaltante(ingrediente, productos = []) {
  const necesaria = convertirABase(ingrediente.cantidad, ingrediente.unidad);
  const disponible = calcularCantidadDisponible(ingrediente, productos);
  return Math.max(necesaria - disponible, 0);
}

export function calcularFaltanteTotal(ingrediente, productos = []) {
  const disponibles = productos.filter(producto => ['comprado', 'apuntado', 'apuntadoChecked'].includes(producto.estado));
  return calcularFaltante(ingrediente, disponibles);
}

export function obtenerUnidadBase(unidad) {
  const tipo = tipoUnidad(unidad);
  if (tipo === 'peso') return 'g';
  if (tipo === 'volumen') return 'ml';
  return 'ud';
}
