export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export function fmtLap(seconds: number | null) {
  if (!seconds) return '—';
  const mins = Math.floor(seconds / 60);
  const remainder = (seconds % 60).toFixed(3);
  return mins > 0 ? `${mins}:${remainder.padStart(6, '0')}` : `${remainder}s`;
}

const pad2 = (value: number) => String(value).padStart(2, '0');

/** Locale-independent 24-hour HH:mm:ss in the viewer's time zone, shared by Radio and Race Control. */
export function fmtClock(date: string) {
  const d = new Date(date);
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}:${pad2(d.getSeconds())}`;
}

/** Stated once per view so each row can show a bare HH:mm:ss. */
export const CLOCK_ZONE_NOTE = `Times are local (${Intl.DateTimeFormat().resolvedOptions().timeZone}), 24-hour`;
