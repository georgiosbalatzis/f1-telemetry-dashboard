import recorded from './fixtures/openf1-monza.json';
import { buildNormalizedComparisonData } from '../../hooks/useDashboardViewModel';
import { cornerMarks } from '../../components/dashboard/cornerMarks';
import { figurePlotData } from '../plotModel';
import type { FigureData, FigureDriver } from '../contract';

export const fixtureCases = ['single', 'two', 'four', 'teammates', 'missing', 'sample'] as const;
export type FixtureCase = typeof fixtureCases[number];

/** Edge-case identities duplicate recorded traces and are explicitly synthetic, not additional race evidence. */
export function plotFixture(kind: FigureData['kind'], scenario: FixtureCase = 'two'): FigureData {
  const numbers = scenario === 'four' ? [1, 4, 44, 63] : scenario === 'teammates' ? [1, 2] : scenario === 'single' || scenario === 'sample' ? [1] : [1, 4];
  const drivers: FigureDriver[] = numbers.map((number, index) => {
    const driver = recorded.drivers.find((driver) => driver.driver_number === number);
    return {
      number, fullName: driver?.full_name || 'Synthetic teammate', acronym: driver?.name_acronym || 'TST',
      teamColour: '#' + (scenario === 'teammates' ? '3671C6' : driver?.team_colour || '3671C6'),
      lineDash: scenario === 'teammates' && index ? '10 4' : undefined,
      brakeDash: scenario === 'teammates' && index ? '10 3 2 3' : '6 4',
    };
  });
  const telemetry = Object.fromEntries(numbers.map((number, index) => [number,
    scenario === 'missing' && index ? [] : recorded.car_data.filter((sample) => sample.driver_number === (index % 2 ? 4 : 1)),
  ]));
  const speed = buildNormalizedComparisonData(numbers, telemetry, (point, number, sample) => { point[`speed_${number}`] = sample?.speed; });
  const comparison = kind === 'speed' ? speed : buildNormalizedComparisonData(numbers, telemetry, (point, number, sample) => {
    point[`throttle_${number}`] = sample?.throttle;
    point[`brake_${number}`] = sample ? -sample.brake : undefined;
  });
  const samples = telemetry[numbers[0]].map((sample, idx) => ({ idx, speed: sample.speed, throttle: sample.throttle, brake: -sample.brake, gear: sample.n_gear, drs: sample.drs >= 10 ? 1 : 0, rpm: sample.rpm }));
  return figurePlotData(kind, drivers, samples, comparison, cornerMarks(speed, numbers[0], (n) => `C${n}`));
}
