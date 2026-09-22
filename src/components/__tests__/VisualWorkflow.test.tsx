import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { DashboardContainer } from '../DashboardContainer';
import { ChartTip, ChartSkeleton, Err } from '../dashboard/shared';

// Exercise the real shell, URL filters and handlers without a live OpenF1 service.
vi.mock('../../hooks/useDashboard', async () => {
  const { useDashboardFilters } = await import('../../hooks/useDashboardFilters');
  const drivers = [
    { driver_number: 1, name_acronym: 'VER', full_name: 'Max Verstappen', last_name: 'Verstappen', team_colour: '3671C6', team_name: 'Red Bull' },
    { driver_number: 44, name_acronym: 'HAM', full_name: 'Lewis Hamilton', last_name: 'Hamilton', team_colour: '27F4D2', team_name: 'Mercedes' },
  ];
  const state = { data: [], loading: false, error: null, refetch: vi.fn() };
  return { useDashboard: () => {
    const filters = useDashboardFilters();
    return {
      filters,
      ...Object.fromEntries(['meetings', 'sessions', 'drivers', 'stints', 'pits', 'weather', 'raceControl', 'teamRadio', 'positions', 'intervals', 'primaryTelemetry'].map((name) => [name, state])),
      selectionData: {
        circuitOptions: [{ v: 'Bahrain', l: 'Bahrain' }, { v: 'Monza', l: 'Monza' }],
        sessionOptions: [{ v: 9472, l: 'Race' }, { v: 9471, l: 'Qualifying' }],
        lapOptions: [1, 2, 3], driverList: drivers,
        driverMap: Object.fromEntries(drivers.map((driver) => [driver.driver_number, driver])),
      },
      viewModel: {
        driverColor: () => '#3671C6', lapSummaries: [], sectorRows: [], speedData: [],
        comparisonSpeedData: [], comparisonControlData: [], comparisonEnergyData: [],
        lapTimeData: [], lapDeltaData: [], stintsByDriver: {}, filteredPits: [],
        filteredRadio: [], raceControlMessages: [], latestWeather: null,
        weatherTrend: [],
      },
      comparisonDrivers: [], locationByDriver: {}, anyLoading: false, lapsLoading: false,
      locationLoading: false, telemetryLoading: false, totalLaps: 3,
      canStepBackward: filters.lapNum > 1, canStepForward: filters.lapNum < 3,
      stepLap: (direction: number) => filters.setLapNum(filters.lapNum + direction),
    };
  } };
});

const params = () => new URLSearchParams(window.location.search);
beforeEach(() => {
  const storage = new Map<string, string>();
  Object.defineProperty(window, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  } });
  window.history.replaceState({}, '', '/?year=2024&circuit=Bahrain&session=9472&drivers=1&lap=2&tab=telemetry');
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it('preserves scope, driver selection, both navigation controls, and URL state', async () => {
  render(<DashboardContainer />);
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Bahrain · Race');
  expect(screen.getByLabelText('Lap / 3')).toHaveValue('2');
  fireEvent.click(screen.getByRole('button', { name: 'Next lap' }));
  expect(params().get('lap')).toBe('3');
  expect(screen.getByRole('button', { name: 'Next lap' })).toBeDisabled();
  fireEvent.change(screen.getByLabelText('Lap / 3'), { target: { value: '1' } });
  fireEvent.click(screen.getByText('Edit drivers'));
  fireEvent.click(screen.getByRole('button', { name: /Lewis Hamilton/ }));
  expect(params().get('drivers')).toBe('1,44');
  expect(screen.getByRole('button', { name: /Lewis Hamilton/ })).toHaveAttribute('aria-pressed', 'true');
  const views = [
    ['tires', 'Tyre Strategy'], ['energy', 'DRS Activation'], ['trackmap', 'Track Map — Lap 1'],
    ['positions', 'Race Positions'], ['intervals', 'Intervals & Battles'],
    ['radio', 'Team Radio Recordings'], ['incidents', 'Race Control'], ['broadcast', 'Lap Classification'],
  ];
  for (const [value, heading] of views) {
    fireEvent.change(screen.getByLabelText('Analysis'), { target: { value } });
    expect(params().get('tab')).toBe(value);
    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument();
  }
  fireEvent.change(screen.getByLabelText('Analysis'), { target: { value: 'weather' } });
  expect(await screen.findByText('No weather data for this session.')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Telemetry' }));
  expect(params().get('tab')).toBe('telemetry');
  expect(screen.getByRole('button', { name: 'Telemetry' })).toHaveAttribute('aria-current', 'page');
  fireEvent.change(screen.getByLabelText('Session'), { target: { value: '9471' } });
  expect(params().get('session')).toBe('9471');
  fireEvent.change(screen.getByLabelText('Grand Prix'), { target: { value: 'Monza' } });
  expect(params().get('circuit')).toBe('Monza');
  fireEvent.change(screen.getByLabelText('Season'), { target: { value: '2023' } });
  expect(params().get('year')).toBe('2023');
});

it('keeps share, embed, print, split, theme persistence and saved presets wired', async () => {
  const clipboard = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: clipboard } });
  const print = vi.spyOn(window, 'print').mockImplementation(() => {});
  render(<DashboardContainer />);
  fireEvent.click(screen.getByText('Tools'));
  fireEvent.click(screen.getByRole('button', { name: 'Light theme' }));
  expect(document.documentElement).toHaveClass('theme-light');
  expect(window.localStorage.getItem('f1-telemetry-dashboard:theme')).toBe('light');
  fireEvent.click(screen.getByRole('button', { name: 'Split view' }));
  expect(document.querySelector('.analysis-split')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Save or load a comparison'), { target: { value: 'Race study' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save' }));
  fireEvent.click(screen.getByRole('button', { name: 'Next lap' }));
  fireEvent.change(screen.getByLabelText('Save or load a comparison'), { target: { value: '' } });
  fireEvent.change(screen.getByLabelText('Save or load a comparison'), { target: { value: 'Race study' } });
  expect(params().get('lap')).toBe('2');
  fireEvent.click(screen.getByRole('button', { name: 'Share' }));
  await waitFor(() => expect(clipboard).toHaveBeenCalledWith(expect.stringContaining('layout=split&theme=light')));
  fireEvent.click(within(document.querySelector('.utility-content') as HTMLElement).getByRole('button', { name: 'Embed' }));
  await waitFor(() => expect(clipboard).toHaveBeenCalledWith(expect.stringContaining('embed=1&theme=light')));
  fireEvent.click(screen.getByRole('button', { name: 'Print' }));
  expect(print).toHaveBeenCalledOnce();
});

it('restores a read-only article embed with an open-analysis link', async () => {
  window.history.replaceState({}, '', '/?year=2024&circuit=Bahrain&session=9472&drivers=44&lap=3&tab=radio&embed=1&theme=light');
  render(<DashboardContainer />);
  expect(await screen.findByRole('heading', { name: 'Team Radio Recordings' })).toBeInTheDocument();
  expect(screen.queryByLabelText('Analysis')).not.toBeInTheDocument();
  expect(document.querySelector('.embed-mode.theme-light')).toBeInTheDocument();
  expect(screen.queryByText('Adjust session & lap')).not.toBeInTheDocument();
  expect(screen.queryByText('Edit drivers')).not.toBeInTheDocument();
  expect(params().get('lap')).toBe('3');
  expect(params().get('embed')).toBe('1');
  expect(screen.getByRole('link', { name: 'Open analysis ↗' }).getAttribute('href')).not.toContain('embed=1');
});

it('formats chart annotations with units, timing precision and unsigned brake percentages', () => {
  const { rerender } = render(<ChartTip active label={2} labelPrefix="Lap " unit="s" payload={[{ name: 'VER', value: 90.123, color: '#3671C6' }]} />);
  expect(screen.getByText('90.123 s')).toBeInTheDocument();
  rerender(<ChartTip active label={50} unit="%" absolute payload={[{ name: 'Brake', value: -100 }]} />);
  expect(screen.getByText('100.0 %')).toBeInTheDocument();
});

it('exposes loading status and an accessible error retry', () => {
  const retry = vi.fn();
  const { rerender } = render(<ChartSkeleton label="Fetching car telemetry…" />);
  expect(screen.getByRole('status')).toHaveAccessibleName('Fetching car telemetry…');
  rerender(<Err msg="Telemetry unavailable" onAction={retry} />);
  expect(screen.getByRole('alert')).toHaveTextContent('Telemetry unavailable');
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(retry).toHaveBeenCalledOnce();
});

it('renders only the requested embed panel and its legend without authoring controls', () => {
  window.history.replaceState({}, '', '/?year=2024&circuit=Bahrain&session=9472&drivers=1&lap=2&tab=telemetry&embed=1#telemetry-speed-trace');
  render(<DashboardContainer />);
  expect(screen.getByRole('heading', { name: 'Speed Trace' })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Sector Comparison' })).not.toBeInTheDocument();
  expect(document.querySelectorAll('.dashboard-panel')).toHaveLength(1);
  expect(screen.queryByRole('button', { name: 'Download' })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Embed' })).not.toBeInTheDocument();
});

it.each([
  ['broadcast', 'broadcast-timing-tower', 'Lap Classification'],
  ['tires', 'strategy-tyre-strategy', 'Tyre Strategy'],
])('isolates %s panels in article embeds', async (tab, panel, heading) => {
  window.history.replaceState({}, '', `/?year=2024&circuit=Bahrain&session=9472&drivers=1&lap=2&tab=${tab}&embed=1#${panel}`);
  render(<DashboardContainer />);
  expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument();
  expect(document.querySelectorAll('.dashboard-panel')).toHaveLength(1);
  expect(document.querySelector('.dashboard-panel')).toHaveAttribute('id', panel);
});
