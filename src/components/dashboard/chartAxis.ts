import { useSyncExternalStore } from 'react';

// Shared axis decisions so tick density, precision, and endpoint clearance follow the
// measurement and available width instead of Recharts' automatic defaults.
export const AXIS_FONT_SIZE = 11;
export const AXIS_TICK = { fill: 'var(--chart-axis)', fontSize: AXIS_FONT_SIZE };
export const AXIS_TICK_SOFT = { fill: 'var(--chart-axis-soft)', fontSize: AXIS_FONT_SIZE };
/** Right clearance keeps a centred final label (e.g. "L57") inside the SVG. */
export const CHART_MARGIN = { top: 8, right: 18, bottom: 4, left: 4 };
export const PROGRESS_TICKS = [0, 25, 50, 75, 100];
export const PEDAL_TICKS = [-100, -50, 0, 50, 100];

const MOBILE_X_TICKS = 5;
const DESKTOP_X_TICKS = 10;
const NARROW_QUERY = '(max-width: 639px)';

/** Picks roughly `count` evenly spaced values, always keeping both endpoints. */
export function evenTicks<T>(values: T[], count: number): T[] {
  if (values.length <= count) return values;
  const step = (values.length - 1) / (count - 1);
  const indexes = new Set(Array.from({ length: count }, (_, index) => Math.round(index * step)));
  return [...indexes].map((index) => values[index]);
}

function subscribe(onChange: () => void) {
  if (typeof window === 'undefined' || !window.matchMedia) return () => {};
  const query = window.matchMedia(NARROW_QUERY);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function isNarrow() {
  return typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(NARROW_QUERY).matches;
}

/** Number of X ticks that fit the current viewport: about five on mobile. */
export function useXTickCount() {
  return useSyncExternalStore(subscribe, isNarrow, () => false) ? MOBILE_X_TICKS : DESKTOP_X_TICKS;
}

/** Lap-time axis in m:ss with whole seconds, e.g. 1:41. */
export function formatLapAxis(seconds: number) {
  const whole = Math.round(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

/** Throttle is plotted above zero and brake below; both halves read as pedal %. */
export function formatPedalAxis(value: number) {
  return `${Math.abs(value)}%`;
}

/** DRS is plotted as 0/1; axis and tooltip both read it as a state. */
export function formatDrsState(value: number) {
  return value >= 1 ? 'Open' : 'Closed';
}
