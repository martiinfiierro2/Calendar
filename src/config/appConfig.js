// Textos comunes del calendario.
export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

// Tipos de comida que se usan en día y semana.
export const TIPOS_COMIDA = [
  { valor: 'desayuno', nombre: 'Desayuno', icono: '☕' },
  { valor: 'almuerzo', nombre: 'Almuerzo', icono: '🥪' },
  { valor: 'comida', nombre: 'Comida', icono: '🍽️' },
  { valor: 'merienda', nombre: 'Merienda', icono: '🍌' },
  { valor: 'cena', nombre: 'Cena', icono: '🐟' }
];

export const CATEGORIAS_RECETA = [
  'Todas', 'Favoritas', 'Pasta', 'Carne', 'Vegetal', 'Arroz',
  'Huevos', 'Pescado', 'Entrante', 'Legumbres', 'Otros'
];

export const CATEGORIAS_COMPRA = [
  'Fruta y verdura', 'Carne y pescado', 'Lácteos',
  'Despensa', 'Panadería', 'Otros'
];

// Valores que recibe un perfil recién creado.
export const PERFIL_INICIAL = {
  nombre: 'Mi perfil',
  email: '',
  raciones: 2,
  dieta: 'Sin preferencias',
  recordatorios: true,
  resumenSemanal: true,
  comprasAutomaticas: false
};
