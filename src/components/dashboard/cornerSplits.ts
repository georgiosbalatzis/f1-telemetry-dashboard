import type { OpenF1CarData } from '../../api/openf1';

export type CornerSplits = { slow: number; medium: number; fast: number };
export type LapTrace = { samples: Pick<OpenF1CarData, 'date' | 'speed'>[]; lapTime: number };

/** Reference speed (km/h) below which a stretch counts as slow, and above which as fast. */
const SLOW_BELOW = 150;
const FAST_ABOVE = 250;
const BINS = 200;

/** Elapsed time (scaled to the official lap time) at each of BINS+1 equal steps of lap distance. */
function timeAtDistance(trace: LapTrace) {
  const samples = trace.samples.map((sample) => ({ t: Date.parse(sample.date), v: Math.max(sample.speed, 0) / 3.6 })).filter((s) => Number.isFinite(s.t));
  if (samples.length < 2) return null;
  const dist = [0];
  for (let i = 1; i < samples.length; i += 1) dist.push(dist[i - 1] + ((samples[i].v + samples[i - 1].v) / 2) * ((samples[i].t - samples[i - 1].t) / 1000));
  const total = dist[dist.length - 1];
  const span = samples[samples.length - 1].t - samples[0].t;
  if (total <= 0 || span <= 0) return null;
  const times: number[] = [];
  let j = 0;
  for (let k = 0; k <= BINS; k += 1) {
    const target = (k / BINS) * total;
    while (j < dist.length - 2 && dist[j + 1] < target) j += 1;
    const width = dist[j + 1] - dist[j];
    const fraction = width > 0 ? Math.min(1, Math.max(0, (target - dist[j]) / width)) : 0;
    const t = samples[j].t + fraction * (samples[j + 1].t - samples[j].t);
    times.push(((t - samples[0].t) / span) * trace.lapTime);
  }
  return { times, total };
}

/**
 * Where the target lost (+) or gained (-) time against the reference, by the kind of stretch of track:
 * both laps are cut into equal distance steps and each step is classed by the reference car's average speed.
 * Both traces are scaled to their official lap time, so the three parts add up to the lap-time gap.
 */
export function computeCornerSplits(reference: LapTrace, target: LapTrace): CornerSplits | null {
  const ref = timeAtDistance(reference);
  const tgt = timeAtDistance(target);
  if (!ref || !tgt) return null;
  const splits: CornerSplits = { slow: 0, medium: 0, fast: 0 };
  for (let k = 0; k < BINS; k += 1) {
    const refStep = ref.times[k + 1] - ref.times[k];
    const speed = refStep > 0 ? (ref.total / BINS / refStep) * 3.6 : 0;
    const bucket = speed < SLOW_BELOW ? 'slow' : speed > FAST_ABOVE ? 'fast' : 'medium';
    splits[bucket] += tgt.times[k + 1] - tgt.times[k] - refStep;
  }
  return splits;
}
