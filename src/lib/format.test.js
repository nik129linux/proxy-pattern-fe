import { describe, expect, it } from 'vitest';
import { formatCount, formatMs, isDegraded, serviceLabel } from './format.js';

describe('isDegraded', () => {
  it('stays off at exactly 15%', () => {
    expect(isDegraded(0.15)).toBe(false);
  });

  it('turns on above 15%', () => {
    expect(isDegraded(0.1501)).toBe(true);
  });

  it('stays off with no traffic', () => {
    expect(isDegraded(0)).toBe(false);
  });
});

describe('labels', () => {
  it('names services in Spanish', () => {
    expect(serviceLabel('orders')).toBe('Pedidos');
  });

  it('formats numbers for es-CO', () => {
    expect(formatCount(1204)).toBe('1.204');
    expect(formatMs(41.6)).toBe('42 ms');
  });
});
