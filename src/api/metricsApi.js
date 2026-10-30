const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080';

async function request(path, options) {
  const response = await fetch(`${BASE_URL}${path}`, options);
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message ?? `El backend respondió ${response.status}.`);
  }
  return response.json();
}

export function getSummary(signal) {
  return request('/api/metrics/summary', { signal });
}

/** filters: { service, status, from, to, page, size }; empty values are skipped. */
export function getLogs(filters, signal) {
  const query = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) query.set(key, value);
  });
  return request(`/api/metrics/logs?${query}`, { signal });
}

export function simulateLoad() {
  return request('/api/metrics/simulate-load', { method: 'POST' });
}
