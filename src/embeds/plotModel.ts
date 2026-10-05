import { chartColorForTheme, COLORS } from '../constants/colors';
import type { ExportChartLegendItem } from '../utils/exportChart';
import type { FigureData, FigureTheme } from './contract';
import type { ComparisonPoint, SpeedPoint } from '../components/dashboard/types';
import type { FigureDriver, FigureGuide } from './contract';

export function figurePlotData(kind: FigureData['kind'], drivers: FigureDriver[], samples: SpeedPoint[], comparison: ComparisonPoint[], guides: FigureGuide[]): FigureData {
  const axis = comparison.length ? 'progress' : 'sample';
  const channels = kind === 'speed' ? ['speed'] : ['throttle', 'brake'];
  const keys = axis === 'progress' ? ['progress', ...channels.flatMap((channel) => drivers.map((driver) => `${channel}_${driver.number}`))] : ['idx', ...channels];
  const points = (axis === 'progress' ? comparison : samples).map((point) => Object.fromEntries(
    keys.map((key) => [key, (point as unknown as Record<string, number | undefined>)[key] ?? null]),
  ));
  return { kind, axis, drivers, points, guides: axis === 'progress' ? guides : [] };
}

/** Omits telemetry from a selected lap that OpenF1 marks incomplete (for example, a DNF lap). */
export function omitUnavailableFigureDrivers(data: FigureData, availableNumbers: ReadonlySet<number>): FigureData {
  const channels = data.kind === 'speed' ? ['speed'] : ['throttle', 'brake'];
  const unavailable = data.drivers.filter((driver) => !availableNumbers.has(driver.number));
  if (!unavailable.length) return data;
  return {
    ...data,
    points: data.points.map((point) => {
      const next = { ...point };
      for (const driver of unavailable) for (const channel of channels) {
        const key = data.axis === 'sample' ? channel : `${channel}_${driver.number}`;
        if (key in next) next[key] = null;
      }
      return next;
    }),
  };
}

export function plotDriverColour(data: FigureData, number: number, theme: FigureTheme, colours?: Record<number, string>) {
  return colours?.[number] ?? chartColorForTheme(data.drivers.find((driver) => driver.number === number)?.teamColour ?? COLORS.driverFallback, theme);
}

/** Same legend used by the dashboard and the saved renderer; only plotted channels are advertised. */
export function figureLegend(data: FigureData, theme: FigureTheme = 'light', colours?: Record<number, string>): ExportChartLegendItem[] {
  if (data.axis === 'sample' && data.kind === 'pedals') return [
    { label: 'Throttle', color: COLORS.success, variant: 'area' },
    { label: 'Brake', color: COLORS.danger, variant: 'area' },
  ];
  return data.drivers.flatMap((driver, index) => {
    if (data.axis === 'sample' && index > 0) return [];
    const color = plotDriverColour(data, driver.number, theme, colours);
    const channels = data.kind === 'speed' ? ['speed'] : ['throttle', 'brake'];
    return channels.filter((channel) => data.points.some((point) => typeof point[data.axis === 'sample' ? channel : `${channel}_${driver.number}`] === 'number')).map((channel) => ({
      label: data.kind === 'speed' ? driver.acronym : `${driver.acronym} ${channel === 'throttle' ? 'Throttle' : 'Brake'}`,
      color, strokeDasharray: channel === 'brake' ? driver.brakeDash : driver.lineDash,
    }));
  });
}
