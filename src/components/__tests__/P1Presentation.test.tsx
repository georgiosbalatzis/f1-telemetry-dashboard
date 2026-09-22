import { type ReactNode } from 'react';
import { afterEach, expect, it } from 'vitest';
import { cleanup, render, renderHook, screen } from '@testing-library/react';
import { DriverProvider } from '../../contexts/DriverContext';
import { useDriverContext } from '../../contexts/useDriverContext';
import type { OpenF1Driver, OpenF1Weather } from '../../api/openf1';
import { WeatherTab } from '../dashboard/WeatherTab';

afterEach(cleanup);

it('keeps teammate patterns stable across selection order and distinct from brake channels', () => {
  const driverMap = Object.fromEntries([12, 63].map(n => [n, { driver_number: n, team_colour: '00D2BE' } as OpenF1Driver]));
  let selected = [12, 63];
  const { result, rerender } = renderHook(() => useDriverContext(), {
    wrapper: ({ children }: { children: ReactNode }) => <DriverProvider driverNums={selected} driverMap={driverMap} driverColor={() => '#00D2BE'}>{children}</DriverProvider>,
  });
  const { driverDash } = result.current;
  expect(driverDash(12)).toBeUndefined();
  expect(driverDash(63)).toBe('10 4');
  expect(new Set([driverDash(12), driverDash(63), driverDash(12, 'brake'), driverDash(63, 'brake')]).size).toBe(4);
  selected = [63, 12];
  rerender();
  expect(result.current.driverDash(63)).toBe(driverDash(63));
});

it('puts weather trend immediately after the primary readings and sample count in metadata', () => {
  window.history.replaceState({}, '', '/');
  const weather: OpenF1Weather = {
    date: '2026-09-20T15:00:00Z', air_temperature: 24, track_temperature: 36,
    humidity: 50, pressure: 1010, rainfall: false, wind_direction: 90, wind_speed: 3,
    session_key: 11369, meeting_key: 1,
  };
  const { container } = render(<WeatherTab loading={false} error={null} latestWeather={weather} sampleCount={120} weatherTrend={[]} />);
  expect(container.querySelector('.weather-primary')?.nextElementSibling).toHaveTextContent('Conditions Trend');
  expect(container.querySelector('.weather-metadata')).toHaveTextContent('120 samples');
  expect(screen.queryByText('Conditions Radar')).not.toBeInTheDocument();
  expect(container.querySelectorAll('.dashboard-stat')).toHaveLength(3);
});
