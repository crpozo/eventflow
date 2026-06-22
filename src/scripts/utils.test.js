import { formatDateHour, formatHour, formatDate, formatSpanishDate } from './utils';

describe('formatDate', () => {
  it('formats a valid ISO date string', () => {
    const result = formatDate('2026-04-29T15:00:00Z');
    expect(result).toBe('29/04/2026');
  });

  it('returns null for an invalid date string', () => {
    const result = formatDate('not-a-date');
    expect(result).toBeNull();
  });

  it('formats the current date when no argument is provided', () => {
    const result = formatDate();
    expect(result).toMatch(/^\d{2}\/\d{2}\/\d{4}$/);
  });

  it('handles Date objects at the UTC day boundary', () => {
    const result = formatDate('2026-01-01T00:00:00Z');
    expect(result).toBe('01/01/2026');
  });
});

describe('formatDateHour', () => {
  it('returns a formatted string for a valid date', () => {
    const result = formatDateHour('2026-04-29T15:00:00Z');
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    // Should contain day, date parts and am/pm
    expect(result).toMatch(/\d{2}\/\d{2}\/\d{4}/);
    expect(result).toMatch(/(am|pm)$/i);
  });

  it('returns a string even for invalid input (no guard in source)', () => {
    // The current implementation does not guard against bad input;
    // it produces a garbage string. This test documents that behavior.
    const result = formatDateHour(undefined);
    expect(typeof result).toBe('string');
  });
});

describe('formatHour', () => {
  it('returns only the time portion ("hh:mm am/pm"), no date', () => {
    const result = formatHour('2026-04-29T15:00:00Z');
    expect(typeof result).toBe('string');
    // Time only: no weekday or dd/mm/yyyy, just hh:mm am/pm.
    expect(result).toMatch(/^\d{2}:\d{2} (am|pm)$/);
    expect(result).not.toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  it('returns a string even for invalid input (no guard in source)', () => {
    const result = formatHour(undefined);
    expect(typeof result).toBe('string');
  });
});

describe('formatSpanishDate', () => {
  it('returns a formatted Spanish date string', () => {
    const result = formatSpanishDate('2026-04-29T15:00:00Z');
    expect(result).toBeDefined();
    expect(typeof result).toBe('string');
    // Should contain year
    expect(result).toMatch(/2026/);
    expect(result).toMatch(/(AM|PM)$/);
  });

  it('returns a string even for invalid input (no guard in source)', () => {
    const result = formatSpanishDate(undefined);
    expect(typeof result).toBe('string');
  });
});
