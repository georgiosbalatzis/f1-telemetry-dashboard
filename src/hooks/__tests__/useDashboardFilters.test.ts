import { describe, it, expect } from 'vitest';
import { parseBoundedInt } from '../useDashboardFilters';

const CURRENT_YEAR = new Date().getFullYear();

describe('parseBoundedInt', () => {
  it('returns the parsed number when within range', () => {
    expect(parseBoundedInt('2023', 2023, CURRENT_YEAR)).toBe(2023);
    expect(parseBoundedInt('44', 1, 99)).toBe(44);
    expect(parseBoundedInt('1', 1, 99)).toBe(1);
    expect(parseBoundedInt('99', 1, 99)).toBe(99);
  });

  it('returns null for null input', () => {
    expect(parseBoundedInt(null, 1, 99)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(parseBoundedInt('', 1, 99)).toBeNull();
  });

  it('returns null for non-numeric strings', () => {
    expect(parseBoundedInt('abc', 1, 99)).toBeNull();
    expect(parseBoundedInt('1e3', 1, 9999)).toBeNull();
    expect(parseBoundedInt('1.5', 1, 99)).toBeNull();
    expect(parseBoundedInt('-1', 1, 99)).toBeNull();
  });

  it('returns null when value is below minimum', () => {
    expect(parseBoundedInt('0', 1, 99)).toBeNull();
    expect(parseBoundedInt('2022', 2023, CURRENT_YEAR)).toBeNull();
  });

  it('returns null when value exceeds maximum', () => {
    expect(parseBoundedInt('100', 1, 99)).toBeNull();
    expect(parseBoundedInt(String(CURRENT_YEAR + 1), 2023, CURRENT_YEAR)).toBeNull();
  });

  it('trims whitespace before parsing', () => {
    // The implementation trims before the digit-only check, so '  44  ' → trim → '44' → 44
    expect(parseBoundedInt('  44  ', 1, 99)).toBe(44);
  });
});

describe('year validation (via parseBoundedInt with year bounds)', () => {
  it('accepts valid years 2023 to current year', () => {
    expect(parseBoundedInt('2023', 2023, CURRENT_YEAR)).toBe(2023);
    expect(parseBoundedInt(String(CURRENT_YEAR), 2023, CURRENT_YEAR)).toBe(CURRENT_YEAR);
  });

  it('rejects years outside the valid range', () => {
    expect(parseBoundedInt('2022', 2023, CURRENT_YEAR)).toBeNull();
    expect(parseBoundedInt(String(CURRENT_YEAR + 1), 2023, CURRENT_YEAR)).toBeNull();
  });
});

describe('driver number validation (via parseBoundedInt with 1-99)', () => {
  it('accepts driver numbers 1-99', () => {
    expect(parseBoundedInt('1', 1, 99)).toBe(1);
    expect(parseBoundedInt('99', 1, 99)).toBe(99);
  });

  it('rejects 0 and 100+', () => {
    expect(parseBoundedInt('0', 1, 99)).toBeNull();
    expect(parseBoundedInt('100', 1, 99)).toBeNull();
  });
});
