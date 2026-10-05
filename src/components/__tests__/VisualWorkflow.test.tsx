import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DashboardContainer } from '../DashboardContainer';
import { ChartTip, ChartSkeleton, Err } from '../dashboard/shared';
import { TAB_LABELS } from '../dashboard/tabLabels';
import type { Tab } from '../dashboard/types';
import { copy } from '../../copy';

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
        lapOptions: [1, 2, 3], driverList: drivers, allLaps: {},
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
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(copy.hero.title);
  expect(screen.getByRole('heading', { level: 2, name: /Bahrain · Race/ })).toHaveTextContent(`Bahrain · Race · ${copy.hero.lap(2, 3)}`);
  expect(screen.getByLabelText(copy.scope.lap(3))).toHaveValue('2');
  fireEvent.click(screen.getByRole('button', { name: copy.scope.nextLap }));
  expect(params().get('lap')).toBe('3');
  expect(screen.getByRole('button', { name: copy.scope.nextLap })).toBeDisabled();
  fireEvent.change(screen.getByLabelText(copy.scope.lap(3)), { target: { value: '1' } });
  fireEvent.click(screen.getByRole('button', { name: copy.scope.add }));
  fireEvent.click(screen.getByRole('button', { name: /Lewis Hamilton/ }));
  expect(params().get('drivers')).toBe('1,44');
  expect(screen.getByRole('button', { name: /Lewis Hamilton/ })).toHaveAttribute('aria-pressed', 'true');
  const views = [
    ['tires', 'Tyre Strategy'], ['energy', 'DRS Activation'], ['trackmap', 'Track Map — Lap 1'],
    ['positions', 'Race Positions'], ['intervals', 'Intervals & Battles'],
    ['radio', 'Team Radio Recordings'], ['incidents', 'Race Control'], ['broadcast', 'Lap Classification'],
  ];
  for (const [value, heading] of views) {
    fireEvent.click(screen.getByRole('button', { name: TAB_LABELS[value as Tab] }));
    expect(params().get('tab')).toBe(value);
    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument();
  }
  fireEvent.click(screen.getByRole('button', { name: TAB_LABELS.weather }));
  expect(await screen.findByText('No weather data for this session.')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: TAB_LABELS.telemetry }));
  expect(params().get('tab')).toBe('telemetry');
  expect(screen.getByRole('button', { name: TAB_LABELS.telemetry })).toHaveAttribute('aria-current', 'page');
  fireEvent.change(screen.getByLabelText(copy.scope.session), { target: { value: '9471' } });
  expect(params().get('session')).toBe('9471');
  fireEvent.change(screen.getByLabelText('Grand Prix'), { target: { value: 'Monza' } });
  expect(params().get('circuit')).toBe('Monza');
  fireEvent.change(screen.getByLabelText(copy.scope.season), { target: { value: '2023' } });
  expect(params().get('year')).toBe('2023');
});

it('keeps share, embed, print, split, theme persistence and saved presets wired', async () => {
  const clipboard = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: clipboard } });
  const print = vi.spyOn(window, 'print').mockImplementation(() => {});
  render(<DashboardContainer />);
  fireEvent.click(screen.getByText(copy.masthead.tools));
  expect(window.localStorage.getItem('f1stories-theme')).toBeNull(); // nothing is stored until the reader chooses
  fireEvent.click(screen.getByRole('button', { name: copy.masthead.themeToDark }));
  expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  expect(window.localStorage.getItem('f1stories-theme')).toBe('dark');
  expect(params().get('theme')).toBeNull(); // the address bar must not pin a theme over the stored choice on reload
  fireEvent.click(screen.getByRole('button', { name: copy.masthead.themeToLight }));
  expect(document.documentElement).toHaveAttribute('data-theme', 'light');
  expect(window.localStorage.getItem('f1stories-theme')).toBe('light');
  fireEvent.click(screen.getByRole('button', { name: copy.masthead.split }));
  expect(document.querySelector('.analysis-split')).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText(copy.masthead.presetLabel), { target: { value: 'Race study' } });
  fireEvent.click(screen.getByRole('button', { name: copy.masthead.save }));
  fireEvent.click(screen.getByRole('button', { name: copy.scope.nextLap }));
  fireEvent.change(screen.getByLabelText(copy.masthead.presetLabel), { target: { value: '' } });
  fireEvent.change(screen.getByLabelText(copy.masthead.presetLabel), { target: { value: 'Race study' } });
  expect(params().get('lap')).toBe('2');
  fireEvent.click(screen.getByRole('button', { name: copy.cardBar.share }));
  await waitFor(() => expect(clipboard).toHaveBeenCalledWith(expect.stringContaining('layout=split&theme=light')));
  fireEvent.click(screen.getByRole('button', { name: copy.cardBar.embed }));
  await waitFor(() => expect(clipboard).toHaveBeenCalledWith(expect.stringContaining('embed=1&theme=light')));
  fireEvent.click(screen.getByRole('button', { name: copy.masthead.print }));
  expect(print).toHaveBeenCalledOnce();
});

it('starts from the stored theme and ignores values it does not own', () => {
  window.localStorage.setItem('f1stories-theme', 'dark');
  render(<DashboardContainer />);
  expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  expect(screen.getByRole('button', { name: copy.masthead.themeToLight })).toBeInTheDocument();
  cleanup();
  window.localStorage.setItem('f1stories-theme', 'auto');
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query === '(prefers-color-scheme: dark)', addEventListener: () => {}, removeEventListener: () => {},
  }));
  render(<DashboardContainer />);
  expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
  expect(window.localStorage.getItem('f1stories-theme')).toBe('auto');
  vi.unstubAllGlobals();
});

it('generates a whole-tab embed without treating the tab navigation hash as a panel selector', async () => {
  window.history.replaceState({}, '', '/?year=2024&circuit=Bahrain&session=9472&drivers=1&lap=2&tab=telemetry#telemetry');
  const clipboard = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: clipboard } });
  render(<DashboardContainer />);
  fireEvent.click(screen.getByRole('button', { name: copy.cardBar.embed }));
  await waitFor(() => expect(clipboard).toHaveBeenCalled());
  const snippet = clipboard.mock.calls[0][0] as string;
  const src = new URL(snippet.match(/src="([^"]+)"/)![1]);
  expect(src.searchParams.get('embed')).toBe('1');
  expect(src.searchParams.get('lap')).toBe('2');
  expect(src.hash).toBe('');
  cleanup();
  window.history.replaceState({}, '', src.pathname + src.search);
  render(<DashboardContainer />);
  expect(screen.getByRole('heading', { name: 'Speed Trace' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Sector Comparison' })).toBeInTheDocument();
});

it('restores a read-only article embed with an open-analysis link', async () => {
  window.history.replaceState({}, '', '/?year=2024&circuit=Bahrain&session=9472&drivers=44&lap=3&tab=radio&embed=1&theme=light');
  render(<DashboardContainer />);
  expect(await screen.findByRole('heading', { name: 'Team Radio Recordings' })).toBeInTheDocument();
  expect(screen.queryByRole('navigation', { name: 'Analysis views' })).not.toBeInTheDocument();
  expect(document.querySelector('.embed-mode')).toBeInTheDocument();
  expect(document.documentElement).toHaveAttribute('data-theme', 'light');
  expect(screen.queryByText('Adjust session & lap')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: copy.scope.add })).not.toBeInTheDocument();
  expect(params().get('lap')).toBe('3');
  expect(params().get('embed')).toBe('1');
  expect(params().get('theme')).toBe('light');
  expect(screen.getByRole('link', { name: copy.embed.open }).getAttribute('href')).not.toContain('embed=1');
});

it('formats chart annotations with units, timing precision and unsigned brake percentages', () => {
  const { rerender } = render(<ChartTip active label={2} labelPrefix="Lap " unit="s" payload={[{ name: 'VER', value: 90.123, color: '#3671C6' }]} />);
  expect(screen.getByText('90.123 s')).toBeInTheDocument();
  rerender(<ChartTip active label={50} unit="%" absolute payload={[{ name: 'Brake', value: -100 }]} />);
  expect(screen.getByText('100%')).toBeInTheDocument();
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
  expect(screen.queryByRole('button', { name: copy.panel.download })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: copy.panel.embed })).not.toBeInTheDocument();
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
