import { describe, it, expect } from 'vitest';
import { buildUrl } from '../openf1';

describe('buildUrl', () => {
  it('builds a plain URL with no params', () => {
    const url = buildUrl('sessions', {});
    expect(url).toBe('https://api.openf1.org/v1/sessions');
  });

  it('appends a single param', () => {
    const url = buildUrl('sessions', { session_key: 9158 });
    expect(url).toBe('https://api.openf1.org/v1/sessions?session_key=9158');
  });

  it('sorts params alphabetically', () => {
    const url = buildUrl('laps', { session_key: 9158, driver_number: 44 });
    expect(url).toContain('driver_number=44');
    expect(url).toContain('session_key=9158');
    const qIdx = url.indexOf('driver_number');
    const sIdx = url.indexOf('session_key');
    expect(qIdx).toBeLessThan(sIdx);
  });

  it('preserves operator syntax in keys without encoding', () => {
    // buildUrl does NOT encode the key — so ">=" stays as-is
    const url = buildUrl('car_data', { 'speed>=': 300 });
    expect(url).toContain('speed>==300');
  });

  it('filters out null and undefined values', () => {
    const url = buildUrl('drivers', { session_key: 9158, driver_number: null, team: undefined });
    expect(url).toBe('https://api.openf1.org/v1/drivers?session_key=9158');
  });

  it('filters out empty string values', () => {
    const url = buildUrl('drivers', { session_key: 9158, name: '' });
    expect(url).toBe('https://api.openf1.org/v1/drivers?session_key=9158');
  });

  it('URL-encodes special characters in values', () => {
    const url = buildUrl('meetings', { circuit_short_name: 'Abu Dhabi' });
    expect(url).toContain('circuit_short_name=Abu%20Dhabi');
  });
});
