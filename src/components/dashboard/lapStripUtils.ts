import type { OpenF1Lap, OpenF1RaceControl } from '../../api/openf1';

export type LapBarState = 'normal' | 'sc' | 'pit' | 'missing';
export type LapBar = { lap: number; height: number; state: LapBarState; duration: number | null };

/** Laps run under a (virtual) safety car, from the deployed message to its ending message. */
export function safetyCarLaps(messages: OpenF1RaceControl[] | null | undefined, lastLap: number) {
  const laps = new Set<number>();
  let start: number | null = null;
  const sorted = [...(messages ?? [])].filter((m) => m.category === 'SafetyCar' && m.lap_number != null).sort((a, b) => a.date.localeCompare(b.date));
  const close = (end: number) => { for (let lap = start as number; lap <= end; lap += 1) laps.add(lap); start = null; };
  for (const message of sorted) {
    if (/DEPLOYED/i.test(message.message)) start ??= message.lap_number as number;
    else if (start != null && /(IN THIS LAP|ENDING|ENDED)/i.test(message.message)) close(message.lap_number as number);
  }
  if (start != null) close(lastLap); // still deployed when the data ends
  return laps;
}

/** One bar per lap: taller = quicker. Pit laps are the laps before a pit-out lap. */
export function lapBars(laps: OpenF1Lap[], sc: Set<number>): LapBar[] {
  const sorted = [...laps].sort((a, b) => a.lap_number - b.lap_number);
  const pitLaps = new Set(sorted.filter((lap) => lap.is_pit_out_lap).map((lap) => lap.lap_number - 1));
  const times = sorted.map((lap) => lap.lap_duration).filter((t): t is number => t != null && t > 0).sort((a, b) => a - b);
  if (times.length === 0) return [];
  const fastest = times[0];
  const cap = Math.max(times[Math.floor(times.length / 2)] * 1.2, fastest * 1.02); // slower than this is drawn at the minimum
  return sorted.map((lap) => {
    const duration = lap.lap_duration != null && lap.lap_duration > 0 ? lap.lap_duration : null;
    const state: LapBarState = sc.has(lap.lap_number) ? 'sc' : pitLaps.has(lap.lap_number) ? 'pit' : duration == null ? 'missing' : 'normal';
    const height = duration == null ? 12 : 18 + (1 - Math.min(1, (duration - fastest) / (cap - fastest))) * 82;
    return { lap: lap.lap_number, height, state, duration };
  });
}
