const SERVICE_LABELS = { inventory: 'Inventario', orders: 'Pedidos', payments: 'Pagos' };

export const SERVICE_IDS = Object.keys(SERVICE_LABELS);

export const ALARM_ERROR_RATE = 0.15;

export function isDegraded(errorRate) {
  return errorRate > ALARM_ERROR_RATE;
}

export function serviceLabel(serviceId) {
  return SERVICE_LABELS[serviceId] ?? serviceId;
}

const integer = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });
const decimal = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function formatCount(value) {
  return integer.format(value);
}

export function formatPercent(rate) {
  return `${decimal.format(rate * 100)} %`;
}

export function formatMs(value) {
  return `${integer.format(value)} ms`;
}
