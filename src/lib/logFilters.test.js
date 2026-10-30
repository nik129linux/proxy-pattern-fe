import { describe, expect, it } from 'vitest';
import { isRangeInvalid, toQuery } from './logFilters.js';

describe('toQuery', () => {
  it('converts local datetimes to ISO instants and omits blank values', () => {
    const filters = {
      service: 'inventory',
      status: '',
      from: '2026-10-30T08:15',
      to: '2026-10-30T17:45',
      page: 0,
    };

    expect(toQuery(filters)).toEqual({
      service: 'inventory',
      from: new Date(filters.from).toISOString(),
      to: new Date(filters.to).toISOString(),
      page: 0,
    });
  });

  it('leaves blank dates out and does not mutate the filters', () => {
    const filters = { service: '', status: 'ERROR', from: '', to: '', page: 2 };
    const snapshot = { ...filters };

    expect(toQuery(filters)).toEqual({ status: 'ERROR', page: 2 });
    expect(filters).toEqual(snapshot);
  });
});

describe('isRangeInvalid', () => {
  it('accepts a range whose start is before its end', () => {
    expect(isRangeInvalid('2026-10-30T08:00', '2026-10-30T09:00')).toBe(false);
  });

  it('rejects equal or reversed boundaries', () => {
    expect(isRangeInvalid('2026-10-30T09:00', '2026-10-30T09:00')).toBe(true);
    expect(isRangeInvalid('2026-10-30T10:00', '2026-10-30T09:00')).toBe(true);
  });

  it('accepts an incomplete range', () => {
    expect(isRangeInvalid('', '2026-10-30T09:00')).toBe(false);
    expect(isRangeInvalid('2026-10-30T09:00', '')).toBe(false);
  });
});
