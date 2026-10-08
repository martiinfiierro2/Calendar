const quantityFormat = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 3 });

export function formatQuantity(value) {
  if (value === null || value === undefined || value === '') return '—';
  const amount = Number(value);
  return Number.isFinite(amount) ? quantityFormat.format(amount) : '—';
}
