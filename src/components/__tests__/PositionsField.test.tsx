import { cloneElement, type ReactElement } from 'react';
import { expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { PositionsTab } from '../dashboard/PositionsTab';
import { DriverProvider } from '../../contexts/DriverContext';

vi.mock('recharts', async (original) => ({
  ...await original<typeof import('recharts')>(),
  ResponsiveContainer: ({ children }: { children: ReactElement<{ width: number; height: number }> }) => cloneElement(children, { width: 700, height: 280 }),
}));

it('renders all 22 standings and a 22-position chart without a horizontal lap threshold', () => {
  const positions = Array.from({ length: 22 }, (_, i) => ({
    date: '2026-09-20T15:00:00Z', driver_number: i + 1, position: i + 1,
    session_key: 11369, meeting_key: 1,
  }));
  const { container } = render(
    <DriverProvider driverNums={[21, 22]} driverMap={{}} driverColor={() => '#888888'}>
      <PositionsTab positions={positions} positionsLoading={false} />
    </DriverProvider>,
  );
  expect(container.querySelectorAll('.standing-row')).toHaveLength(22);
  expect(container.querySelector('.standing-row:last-child')).toHaveTextContent('22');
  expect(container.querySelector('.recharts-yAxis')).toHaveTextContent('22');
  expect(container.querySelector('.recharts-reference-line')).toBeNull();
});
