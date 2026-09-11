// Convierte una fecha a YYYY-MM-DD para compararla y guardarla sin depender de la zona horaria.
export function fechaClave(fecha) {
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${año}-${mes}-${dia}`;
}

// Recupera un Date desde la clave que guardamos en localStorage.
export function fechaDesdeClave(clave) {
  const [año, mes, dia] = clave.split('-').map(Number);
  return new Date(año, mes - 1, dia);
}

// Devuelve el lunes de la semana de una fecha.
export function inicioSemana(fecha) {
  const inicio = new Date(fecha);
  const dia = (inicio.getDay() + 6) % 7;
  inicio.setDate(inicio.getDate() - dia);
  inicio.setHours(0, 0, 0, 0);
  return inicio;
}

// Genera los siete días de la semana para la vista semanal.
export function diasDeSemana(fecha) {
  const inicio = inicioSemana(fecha);
  return Array.from({ length: 7 }, (_, i) => {
    const dia = new Date(inicio);
    dia.setDate(inicio.getDate() + i);
    return dia;
  });
}
