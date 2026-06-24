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
  it('returns a localized non-empty string with year and time', () => {
    const result = formatDateHour('2026-04-29T15:00:00Z');
    expect(typeof result).toBe('string');
    // Locale-agnostic: it now follows the runtime browser locale/timezone.
    expect(result).toMatch(/2026/);
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });

  it('returns "" for invalid/empty input', () => {
    expect(formatDateHour(undefined)).toBe('');
  });
});

describe('formatHour', () => {
  it('returns only the time portion, no full date', () => {
    const result = formatHour('2026-04-29T15:00:00Z');
    expect(typeof result).toBe('string');
    // Time only: contains hh:mm, never the year.
    expect(result).toMatch(/\d{1,2}:\d{2}/);
    expect(result).not.toMatch(/2026/);
  });

  it('returns "" for invalid/empty input', () => {
    expect(formatHour(undefined)).toBe('');
  });
});

describe('formatSpanishDate', () => {
  it('returns a localized non-empty string with the year', () => {
    const result = formatSpanishDate('2026-04-29T15:00:00Z');
    expect(typeof result).toBe('string');
    expect(result).toMatch(/2026/);
  });

  it('returns "" for invalid/empty input', () => {
    expect(formatSpanishDate(undefined)).toBe('');
  });
});
