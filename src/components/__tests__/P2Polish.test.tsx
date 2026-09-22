import { afterEach, beforeAll, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { OpenF1Driver, OpenF1Pit, OpenF1RaceControl, OpenF1Stint, OpenF1TeamRadio } from '../../api/openf1';
import { chartColorForTheme, contrastRatio } from '../../constants/colors';
import { DriverProvider } from '../../contexts/DriverContext';
import { Stat } from '../dashboard/shared';
import { StrategyTab } from '../dashboard/StrategyTab';
import { evenTicks, formatLapAxis, formatPedalAxis } from '../dashboard/chartAxis';
import { IncidentsTab } from '../dashboard/IncidentsTab';
import { RadioTab } from '../dashboard/RadioTab';
import { fmtClock } from '../dashboard/utils';
import { stackChartSvgs } from '../../utils/exportChart';

afterEach(cleanup);

// Vitest runs with css: false, so read the stylesheet from disk (the app tsconfig has no Node types).
const NODE_FS = 'node:fs';
let lightTokens: Record<string, string> = {};
let css = '';
beforeAll(async () => {
  const { readFileSync } = await import(/* @vite-ignore */ NODE_FS);
  css = readFileSync('src/index.css', 'utf8');
  lightTokens = Object.fromEntries(
    [...(css.match(/\.theme-light \{([^}]*)\}/)?.[1] ?? '').matchAll(/(--[\w-]+):\s*(#[0-9a-f]{6})/gi)].map(([, k, v]) => [k, v]),
  );
});
const TEAM_COLOURS = ['#27F4D2', '#FF8000', '#3671C6', '#E8002D', '#229971', '#0093CC', '#64C4FF', '#B6BABD', '#6692FF', '#52E252', '#00D2BE'];

it('P2-01: light-mode driver label text meets 4.5:1 on the cream surfaces', () => {
  for (const text of ['--text', '--text-muted']) {
    for (const surface of ['--bg', '--surface']) {
      expect(contrastRatio(lightTokens[text], lightTokens[surface])).toBeGreaterThanOrEqual(4.5);
    }
  }
});

it('P2-01: light-mode traces are darkened to 3:1 while staying distinct; dark mode is unchanged', () => {
  const adjusted = TEAM_COLOURS.map((colour) => chartColorForTheme(colour, 'light'));
  adjusted.forEach((colour) => expect(contrastRatio(colour, lightTokens['--bg'])).toBeGreaterThanOrEqual(3));
  expect(new Set(adjusted).size).toBe(TEAM_COLOURS.length);
  expect(chartColorForTheme('#27F4D2', 'dark')).toBe('#27F4D2');
  expect(chartColorForTheme('var(--color-driver-fallback)', 'light')).toBe('var(--color-driver-fallback)');
});

it('P2-01: driver names and values use foreground text, keeping team colour in markers', () => {
  const { container } = render(<Stat label="ANT" value="42%" markerColor="#27F4D2" />);
  expect(screen.getByText('42%')).not.toHaveAttribute('style');
  expect(container.querySelector('.driver-marker')).toHaveStyle({ background: '#27F4D2' });

  cleanup();
  const driverMap = { 12: { driver_number: 12, name_acronym: 'ANT', team_colour: '27F4D2' } as OpenF1Driver };
  const stints = { 12: [{ driver_number: 12, lap_start: 1, lap_end: 20, compound: 'MEDIUM' } as OpenF1Stint] };
  const strategy = render(
    <DriverProvider driverNums={[12]} driverMap={driverMap} driverColor={() => '#27F4D2'}>
      <StrategyTab lapNum={10} stintsLoading={false} stintsByDriver={stints} pitsLoading={false} filteredPits={[]} />
    </DriverProvider>,
  );
  const labels = screen.getAllByText('ANT');
  labels.forEach((label) => expect(label.getAttribute('style') ?? '').not.toMatch(/color/i));
  expect(strategy.container.querySelectorAll('.driver-marker').length).toBeGreaterThan(0);
});

it('P2-03: mobile ticks are sparse, keep both endpoints, and use per-measurement precision', () => {
  const laps = Array.from({ length: 57 }, (_, i) => `L${i + 1}`);
  expect(evenTicks(laps, 5)).toEqual(['L1', 'L15', 'L29', 'L43', 'L57']);
  expect(evenTicks(['a', 'b'], 5)).toEqual(['a', 'b']);
  expect([101.53, 106.569, 95].map(formatLapAxis)).toEqual(['1:42', '1:47', '1:35']);
  expect([-100, -50, 0, 50, 100].map(formatPedalAxis)).toEqual(['100%', '50%', '0%', '50%', '100%']);
});

it('P2-04/P2-05: stint ranges and record labels render without hover, labels above values', () => {
  const driverMap = { 12: { driver_number: 12, name_acronym: 'ANT', team_colour: '27F4D2' } as OpenF1Driver };
  const stints = { 12: [
    { driver_number: 12, lap_start: 1, lap_end: 14, compound: 'MEDIUM' },
    { driver_number: 12, lap_start: 15, lap_end: 57, compound: 'HARD' },
  ] as OpenF1Stint[] };
  const pits = [{ driver_number: 12, lap_number: 14, stop_duration: 2.4, pit_duration: 31.8, date: '2026-09-20T15:00:00Z' }] as OpenF1Pit[];
  const { container } = render(
    <DriverProvider driverNums={[12]} driverMap={driverMap} driverColor={() => '#27F4D2'}>
      <StrategyTab lapNum={30} stintsLoading={false} stintsByDriver={stints} pitsLoading={false} filteredPits={pits} />
    </DriverProvider>,
  );
  expect([...container.querySelectorAll('.stint-range')].map((node) => node.textContent)).toEqual(['L1–14', 'L15–57']);
  expect(container.querySelector('.stint-count')).toHaveTextContent('2 stints');
  const rows = container.querySelectorAll('.strategy-row');
  expect(rows).toHaveLength(2);
  rows.forEach((row) => [...row.children].slice(1).forEach((cell) => expect(cell.firstElementChild?.tagName).toBe('SMALL')));
  expect(rows[1]).toHaveTextContent('Pit lane31.8s');
});

it('P2-06: shared lap summaries size to 2 or 3 drivers and keep 4 columns otherwise', () => {
  expect(css).toMatch(/\.lap-comparison:has\(> :last-child:nth-child\(-n\+2\)\) \{ grid-template-columns: repeat\(2/);
  expect(css).toMatch(/\.lap-comparison:has\(> :last-child:nth-child\(3\)\) \{ grid-template-columns: repeat\(3/);
});

it('P2-08: the Flag select and desktop buttons drive the same filter', () => {
  const messages = [
    { date: '2026-03-01T15:03:12Z', category: 'Flag', flag: 'YELLOW', message: 'Yellow in sector 2' },
    { date: '2026-03-01T15:04:00Z', category: 'Flag', flag: 'GREEN', message: 'Track clear' },
  ] as OpenF1RaceControl[];
  render(<IncidentsTab loading={false} error={null} messages={messages} />);
  fireEvent.change(screen.getByRole('combobox', { name: 'Flag' }), { target: { value: 'GREEN' } });
  expect(screen.queryByText('Yellow in sector 2')).toBeNull();
  expect(screen.getByRole('button', { name: 'GREEN' })).toHaveAttribute('aria-pressed', 'true');
  fireEvent.click(screen.getByRole('button', { name: 'ALL' }));
  expect(screen.getByText('Yellow in sector 2')).toBeInTheDocument();
  expect(screen.getByRole('combobox', { name: 'Flag' })).toHaveValue('ALL');
});

it('P2-10: Radio and Race Control share a locale-free 24-hour HH:mm:ss', () => {
  const date = '2026-03-01T15:03:12';
  expect(fmtClock(date)).toBe('15:03:12');
  expect(fmtClock('2026-03-01T03:04:05')).toBe('03:04:05');
  render(<IncidentsTab loading={false} error={null} messages={[{ date, category: 'Other', flag: null, message: 'Session started' } as unknown as OpenF1RaceControl]} />);
  const raceTime = screen.getByText('15:03:12');
  cleanup();
  render(
    <DriverProvider driverNums={[12]} driverMap={{}} driverColor={() => '#888'}>
      <RadioTab loading={false} error={null} messages={[{ date, driver_number: 12, recording_url: 'https://example.com/a.mp3' } as OpenF1TeamRadio]} />
    </DriverProvider>,
  );
  expect(screen.getByText('15:03:12').className).toBe(raceTime.className);
  expect(css).toMatch(/\.clock-time \{[^}]*tabular-nums[^}]*letter-spacing: normal[^}]*text-transform: none[^}]*white-space: nowrap/);
});

it('P2-09: the stacked weather traces export together, each keeping its own vertical offset', () => {
  const svgs = [0, 160, 260].map((top) => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.getBoundingClientRect = () => ({ top, bottom: top + 80, width: 600 }) as DOMRect;
    return svg;
  });
  const stacked = stackChartSvgs(svgs);
  expect([...stacked.children].map((child) => child.getAttribute('y'))).toEqual(['0', '160', '260']);
  expect(stacked.getAttribute('width')).toBe('600');
  expect(stacked.getAttribute('height')).toBe('340');
});
