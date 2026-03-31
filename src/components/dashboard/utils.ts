export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export function fmtLap(seconds: number | null) {
  if (!seconds) return '—';
  const mins = Math.floor(seconds / 60);
  const remainder = (seconds % 60).toFixed(3);
  return mins > 0 ? `${mins}:${remainder.padStart(6, '0')}` : `${remainder}s`;
}
