import { afterEach, beforeAll, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import type { OpenF1Driver, OpenF1Pit, OpenF1Stint } from '../../api/openf1';
import { chartColorForTheme, contrastRatio } from '../../constants/colors';
import { DriverProvider } from '../../contexts/DriverContext';
import { Stat } from '../dashboard/shared';
import { StrategyTab } from '../dashboard/StrategyTab';
import { evenTicks, formatLapAxis, formatPedalAxis } from '../dashboard/chartAxis';

afterEach(cleanup);

// Vitest runs with css: false, so read the stylesheet from disk (the app tsconfig has no Node types).
const NODE_FS = 'node:fs';
let lightTokens: Record<string, string> = {};
beforeAll(async () => {
  const { readFileSync } = await import(/* @vite-ignore */ NODE_FS);
  const css: string = readFileSync('src/index.css', 'utf8');
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
