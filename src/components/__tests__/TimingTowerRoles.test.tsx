import { afterEach, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { DriverProvider } from '../../contexts/DriverContext';
import { TimingTower } from '../dashboard/broadcast/TimingTower';
import type { DriverLapSummary } from '../dashboard/types';

afterEach(cleanup);

const summary = (driverNumber: number, name: string, lapTime: number, gapToLeader = 0): DriverLapSummary => ({
  driverNumber, name, color: '#888', lapTime, gapToLeader, topSpeed: 330, avgThrottle: null, avgBrake: null, peakRpm: null, peakGear: null, drsOpenPct: null,
});

it('P5-04: the timing tower keeps table semantics although its rows are display:grid', () => {
  render(
    <DriverProvider driverNums={[1, 4]} driverMap={{}} driverColor={() => '#888'}>
      <TimingTower lapNum={5} lapsLoading={false} sorted={[summary(1, 'VER', 81.1), summary(4, 'NOR', 81.3, 0.2)]} />
    </DriverProvider>,
  );
  const table = screen.getByRole('table', { name: 'Timing tower' });
  expect(within(table).getAllByRole('columnheader')).toHaveLength(6);
  expect(within(table).getAllByRole('row')).toHaveLength(3);
  expect(within(table).getAllByRole('rowheader')).toHaveLength(2);
  expect(within(table).getAllByRole('cell')).toHaveLength(2 * 5);
});
