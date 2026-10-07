import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { DashboardContainer } from '../DashboardContainer';
import { ChartTip, ChartSkeleton, Err } from '../dashboard/shared';
import { TAB_LABELS } from '../dashboard/tabLabels';
import type { Tab } from '../dashboard/types';
import { copy } from '../../copy';

const failures = vi.hoisted(() => ({ mode: 'none' as 'none' | 'all' | 'partial', retry: vi.fn() }));

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
      primaryTelemetry: { ...state, error: failures.mode === 'none' ? null : 'HTTP 429: Too Many Requests', refetch: failures.retry },
      selectionData: {
        circuitOptions: [{ v: 'Bahrain', l: 'Bahrain' }, { v: 'Monza', l: 'Monza' }],
        sessionOptions: [{ v: 9472, l: 'Race' }, { v: 9471, l: 'Qualifying' }],
        lapOptions: [1, 2, 3], driverList: drivers,
        allLaps: Object.fromEntries(drivers.map((driver) => [driver.driver_number, [1, 2, 3].map((lap_number) => ({ lap_number, date_start: `2024-03-02T00:0${lap_number}:00Z`, lap_duration: 90 }))])),
        driverMap: Object.fromEntries(drivers.map((driver) => [driver.driver_number, driver])),
        telemetryWindows: filters.driverNums.map((driverNumber) => ({ driverNumber, lapStart: `2024-03-02T00:0${filters.lapNum}:00Z`, nextLapStart: null })),
      },
      viewModel: {
        driverColor: () => '#3671C6', lapSummaries: [], sectorRows: [],
        speedData: [{ idx: 0, speed: 205, throttle: 80, brake: -20 }, { idx: 1, speed: 220, throttle: 100, brake: 0 }],
        comparisonSpeedData: [{ progress: 0, speed_1: 205 }, { progress: 100, speed_1: 220 }],
        comparisonControlData: [{ progress: 0, throttle_1: 80, brake_1: -20 }, { progress: 100, throttle_1: 100, brake_1: 0 }], comparisonEnergyData: [],
        lapTimeData: [], lapDeltaData: [], stintsByDriver: {}, filteredPits: [],
        filteredRadio: [], raceControlMessages: [], latestWeather: null,
        weatherTrend: [],
      },
      comparisonDrivers: failures.mode === 'none' ? [] : [
        { driverNumber: 1, name: 'VER', status: 'Telemetry request failed', loading: false, retry: failures.retry },
        { driverNumber: 44, name: 'HAM', status: failures.mode === 'partial' ? 'Loaded' : 'Telemetry request failed', loading: false, retry: failures.mode === 'partial' ? null : failures.retry },
      ], locationByDriver: {}, anyLoading: false, lapsLoading: false,
      locationLoading: false, telemetryLoading: false, totalLaps: 3,
      telemetryByDriver: Object.fromEntries(filters.driverNums.map((number) => [number, [{ speed: 200, throttle: 80, brake: 20 }, { speed: 220, throttle: 100, brake: 0 }]])),
      canStepBackward: filters.lapNum > 1, canStepForward: filters.lapNum < 3,
      stepLap: (direction: number) => filters.setLapNum(filters.lapNum + direction),
    };
  } };
});

const params = () => new URLSearchParams(window.location.search);
const resizePreview = (height = 500, origin?: string, source?: MessageEventSource) => {
  const frame = screen.getByTitle(copy.iframe.previewTitle) as HTMLIFrameElement;
  fireEvent(window, new MessageEvent('message', {
    source: source ?? frame.contentWindow, origin: origin ?? new URL(frame.src).origin,
    data: { type: 'f1s-telemetry:resize', height },
  }));
};
beforeEach(() => {
  failures.mode = 'none';
  failures.retry.mockClear();
  if (!HTMLDialogElement.prototype.showModal) HTMLDialogElement.prototype.showModal = function showModal() { this.setAttribute('open', ''); };
  if (!HTMLDialogElement.prototype.close) HTMLDialogElement.prototype.close = function close() { this.removeAttribute('open'); };
  vi.stubGlobal('ResizeObserver', class {
    callback: ResizeObserverCallback;
    constructor(callback: ResizeObserverCallback) { this.callback = callback; }
    observe(target: Element) { this.callback([{ contentRect: { width: 600, height: 300 }, target } as ResizeObserverEntry], this as unknown as ResizeObserver); }
    unobserve() {}
    disconnect() {}
  });
  const storage = new Map<string, string>();
  Object.defineProperty(window, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  } });
  window.history.replaceState({}, '', '/?year=2024&circuit=Bahrain&session=9472&drivers=1&lap=2&tab=telemetry');
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); });

// Walks every lazily loaded tab in one test: on a cold CI runner that exceeds vitest's default 5 s (it has timed out on
// main and on pull-request runs while passing locally), so it gets an explicit budget.
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
}, 20_000);

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
  expect(screen.getByRole('dialog', { name: copy.iframe.title })).toBeInTheDocument();
  resizePreview();
  fireEvent.click(screen.getByRole('button', { name: copy.iframe.copy }));
  await waitFor(() => expect(clipboard).toHaveBeenCalledWith(expect.stringContaining('embed=1&amp;theme=light')));
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

it('opens a ready-to-copy chooser and preserves a deliberate whole-tab choice without a navigation hash', async () => {
  window.history.replaceState({}, '', '/?year=2024&circuit=Bahrain&session=9472&drivers=1&lap=2&tab=telemetry#telemetry');
  const clipboard = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: clipboard } });
  render(<DashboardContainer />);
  fireEvent.click(screen.getByRole('button', { name: copy.cardBar.embed }));
  expect(screen.getByRole('dialog', { name: copy.iframe.title })).toBeInTheDocument();
  expect(screen.getByRole('radio', { name: copy.embed.speed })).toBeChecked();
  expect(screen.queryByLabelText(copy.embed.titleLabel)).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('radio', { name: copy.iframe.wholeTab }));
  resizePreview(2400);
  fireEvent.click(screen.getByRole('button', { name: copy.iframe.copy }));
  await waitFor(() => expect(clipboard).toHaveBeenCalled());
  const snippet = clipboard.mock.calls[0][0] as string;
  const template = document.createElement('template');
  template.innerHTML = snippet;
  const src = new URL(template.content.querySelector('iframe')!.src);
  expect(src.searchParams.get('embed')).toBe('1');
  expect(src.searchParams.get('lap')).toBe('2');
  expect(src.hash).toBe('');
  expect(template.content.querySelector('iframe')!.getAttribute('height')).toBe('2400');
  cleanup();
  window.history.replaceState({}, '', src.pathname + src.search);
  render(<DashboardContainer />);
  expect(screen.getByRole('heading', { name: 'Speed Trace' })).toBeInTheDocument();
  expect(screen.getByRole('heading', { name: 'Sector Comparison' })).toBeInTheDocument();
});

it('preselects a supported panel and freezes its scope when the dashboard lap changes', async () => {
  render(<DashboardContainer />);
  fireEvent.click((await screen.findAllByRole('button', { name: copy.panel.embed }))[0]);
  const dialog = screen.getByRole('dialog', { name: copy.iframe.title });
  expect(screen.getByRole('radio', { name: copy.embed.speed })).toBeChecked();
  expect(dialog).toHaveTextContent('L2');
  fireEvent.click(screen.getByRole('button', { name: copy.scope.nextLap }));
  expect(params().get('lap')).toBe('3');
  expect(dialog).toHaveTextContent('L2');
  expect((screen.getByLabelText(copy.iframe.code) as HTMLTextAreaElement).value).toContain('lap=2');
});

it('keeps the publication marker selectable when clipboard permission is denied', async () => {
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn().mockRejectedValue(new DOMException('denied', 'NotAllowedError')) } });
  render(<DashboardContainer />);
  fireEvent.click((await screen.findAllByRole('button', { name: copy.panel.embed }))[0]);
  fireEvent.click(screen.getByRole('button', { name: `${copy.iframe.savedFigure} ↗` }));
  fireEvent.change(screen.getByLabelText(copy.embed.titleLabel), { target: { value: 'Bahrain pedal trace' } });
  fireEvent.click(screen.getByRole('button', { name: copy.embed.marker }));
  expect(await screen.findByRole('alert')).toHaveTextContent(copy.embed.copyFailed);
  const marker = screen.getByLabelText(copy.embed.marker);
  expect(marker).toHaveValue('TELEMETRY:bahrain-pedal-trace.f1embed.json');
  expect(marker).toHaveFocus();
  expect((marker as HTMLInputElement).selectionEnd).toBe(marker.getAttribute('value')?.length);
});

it('accepts only preview measurements and copies the selected panel, theme and natural height', async () => {
  const clipboard = vi.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: clipboard } });
  render(<DashboardContainer />);
  fireEvent.click(screen.getByRole('button', { name: copy.cardBar.embed }));
  const copyButton = screen.getByRole('button', { name: copy.iframe.copy });
  expect(copyButton).toBeDisabled();
  resizePreview(500, 'https://evil.example');
  resizePreview(500, undefined, window);
  resizePreview(99);
  expect(copyButton).toBeDisabled();
  resizePreview(533);
  expect(copyButton).toBeEnabled();
  fireEvent.click(screen.getByRole('radio', { name: copy.embed.pedals }));
  fireEvent.click(screen.getByRole('radio', { name: copy.iframe.dark }));
  expect(copyButton).toBeDisabled();
  resizePreview(372);
  fireEvent.click(copyButton);
  await waitFor(() => expect(clipboard).toHaveBeenCalledWith(expect.stringContaining('theme=dark#telemetry-throttle-brake')));
  expect(clipboard.mock.calls[0][0]).toContain('height="372"');
  expect(await screen.findByText(copy.iframe.copied)).toBeInTheDocument();
});

it('selects the iframe code for manual copying when clipboard permission is denied', async () => {
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: vi.fn().mockRejectedValue(new DOMException('denied', 'NotAllowedError')) } });
  render(<DashboardContainer />);
  fireEvent.click(screen.getByRole('button', { name: copy.cardBar.embed }));
  resizePreview();
  fireEvent.click(screen.getByRole('button', { name: copy.iframe.copy }));
  expect(await screen.findByText(copy.iframe.copyBlocked)).toBeInTheDocument();
  const code = screen.getByLabelText(copy.iframe.code) as HTMLTextAreaElement;
  expect(code).toHaveFocus();
  expect(code.selectionEnd - code.selectionStart).toBe(code.value.length);
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
  const { container, rerender } = render(<ChartTip active label={2} labelPrefix="Lap " unit="s" payload={[{ name: 'VER', value: 90.123, color: '#3671C6' }]} />);
  expect(within(container).getByText('90.123 s')).toBeInTheDocument();
  rerender(<ChartTip active label={50} unit="%" absolute payload={[{ name: 'Brake', value: -100 }]} />);
  expect(within(container).getByText('100%')).toBeInTheDocument();
});

it('exposes loading status and an accessible error retry', () => {
  const retry = vi.fn();
  const { rerender } = render(<ChartSkeleton label="Fetching car telemetry…" />);
  expect(screen.getByRole('status')).toHaveAccessibleName('Fetching car telemetry…');
  rerender(<Err msg="Telemetry unavailable" onAction={retry} />);
  expect(screen.getByRole('alert')).toHaveTextContent(copy.errors.unavailable);
  expect(screen.getByRole('alert')).not.toHaveTextContent('Telemetry unavailable');
  fireEvent.click(screen.getByRole('button', { name: copy.errors.retry }));
  expect(retry).toHaveBeenCalledOnce();
});

it('replaces a failed telemetry embed with one localized, retryable card and recovers', async () => {
  failures.mode = 'all';
  window.history.replaceState({}, '', '/?year=2024&circuit=Bahrain&session=9472&drivers=1,44&lap=2&tab=telemetry&embed=1#telemetry-speed-trace');
  const { container, rerender } = render(<DashboardContainer />);
  expect(screen.getAllByRole('alert')).toHaveLength(1);
  expect(screen.getByRole('alert')).toHaveTextContent(copy.errors.rateLimited);
  expect(screen.getByRole('alert')).toHaveTextContent(copy.errors.comparison(0, 2, 'VER, HAM'));
  expect(container).not.toHaveTextContent('HTTP 429');
  expect(container).not.toHaveTextContent('Telemetry request failed');
  expect(container.querySelector('.embed-partial')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: copy.errors.retry }));
  expect(failures.retry).toHaveBeenCalledOnce();
  failures.mode = 'none';
  rerender(<DashboardContainer />);
  await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  expect(await screen.findByRole('heading', { name: 'Speed Trace' })).toBeInTheDocument();
});

it('keeps a partial telemetry comparison visible with one error card and driver context', async () => {
  failures.mode = 'partial';
  window.history.replaceState({}, '', '/?year=2024&circuit=Bahrain&session=9472&drivers=1,44&lap=2&tab=telemetry&embed=1#telemetry-speed-trace');
  render(<DashboardContainer />);
  expect(screen.getByRole('alert')).toHaveTextContent(copy.errors.partialTitle);
  expect(screen.getByRole('alert')).toHaveTextContent(copy.errors.comparison(1, 2, 'VER'));
  expect(await screen.findByRole('heading', { name: 'Speed Trace' })).toBeInTheDocument();
  expect(screen.getAllByRole('alert')).toHaveLength(1);
});

it('renders only the requested embed panel and its legend without authoring controls', () => {
  window.history.replaceState({}, '', '/?year=2024&circuit=Bahrain&session=9472&drivers=1&lap=2&tab=telemetry&embed=1#telemetry-speed-trace');
  render(<DashboardContainer />);
  expect(screen.getByRole('heading', { name: 'Speed Trace' })).toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Sector Comparison' })).not.toBeInTheDocument();
  expect(document.querySelectorAll('.dashboard-panel')).toHaveLength(1);
  expect(screen.queryByRole('button', { name: copy.panel.download })).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: copy.panel.embed })).not.toBeInTheDocument();
  expect(window.location.hash).toBe('#telemetry-speed-trace');
  expect(screen.getByRole('link', { name: copy.embed.open })).toHaveAttribute('href', expect.stringContaining('#telemetry-speed-trace'));
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
