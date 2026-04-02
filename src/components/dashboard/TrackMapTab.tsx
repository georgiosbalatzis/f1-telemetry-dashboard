import { useMemo } from 'react';
import { Map } from 'lucide-react';
import type { OpenF1Driver, OpenF1Location } from '../../api/openf1';
import { NoData, Panel, Spinner } from './shared';

type Props = {
  lapNum: number;
  driverNums: number[];
  driverMap: Record<number, OpenF1Driver>;
  locationByDriver: Record<number, OpenF1Location[] | null>;
  locationLoading: boolean;
  driverColor: (driverNumber: number) => string;
};

const MAP_W = 600;
const MAP_H = 380;
const PADDING = 36;

function subsample<T>(arr: T[], max: number): T[] {
  if (arr.length <= max) return arr;
  const step = Math.ceil(arr.length / max);
  return arr.filter((_, i) => i % step === 0);
}

function buildTransform(rawPoints: { x: number; y: number }[]) {
  if (rawPoints.length === 0) return null;
  const xs = rawPoints.map((p) => p.x);
  const ys = rawPoints.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const scale = Math.min((MAP_W - PADDING * 2) / rangeX, (MAP_H - PADDING * 2) / rangeY);
  const offsetX = PADDING + ((MAP_W - PADDING * 2) - rangeX * scale) / 2;
  const offsetY = PADDING + ((MAP_H - PADDING * 2) - rangeY * scale) / 2;
  return (p: { x: number; y: number }) => ({
    nx: offsetX + (p.x - minX) * scale,
    ny: MAP_H - (offsetY + (p.y - minY) * scale), // flip Y axis
  });
}

function toPolyline(pts: { nx: number; ny: number }[]) {
  return pts.map((p) => `${p.nx.toFixed(1)},${p.ny.toFixed(1)}`).join(' ');
}

export function TrackMapTab({ lapNum, driverNums, driverMap, locationByDriver, locationLoading, driverColor }: Props) {
  const { trackPolyline, driverPaths, startPt } = useMemo((): {
    trackPolyline: string;
    driverPaths: Partial<Record<number, string>>;
    startPt: { nx: number; ny: number } | null;
  } => {
    // Use all drivers' data combined to get the best track outline
    const allRaw = driverNums
      .flatMap((n) => subsample(locationByDriver[n] ?? [], 300))
      .map((p) => ({ x: p.x, y: p.y }));

    const transform = buildTransform(allRaw);
    if (!transform) return { trackPolyline: '', driverPaths: {} as Partial<Record<number, string>>, startPt: null };

    // Track outline from the driver with the most data
    const refDriver = [...driverNums].sort(
      (a, b) => (locationByDriver[b] ?? []).length - (locationByDriver[a] ?? []).length,
    )[0];
    const refRaw = subsample(locationByDriver[refDriver] ?? [], 500).map((p) => ({ x: p.x, y: p.y }));
    const refNorm = refRaw.map(transform);
    const outline = toPolyline(refNorm);
    const first = refNorm[0] ?? null;

    // Per-driver paths
    const paths: Partial<Record<number, string>> = {};
    for (const n of driverNums) {
      const pts = subsample(locationByDriver[n] ?? [], 400).map((p) => transform({ x: p.x, y: p.y }));
      if (pts.length > 1) paths[n] = toPolyline(pts);
    }

    return { trackPolyline: outline, driverPaths: paths, startPt: first };
  }, [driverNums, locationByDriver]);

  const activeDrivers = driverNums.filter((n) => driverPaths[n] != null);

  if (locationLoading) return <Spinner label="Fetching GPS location data…" />;
  if (!trackPolyline) {
    return (
      <Panel title={`Track Map — Lap ${lapNum}`} icon={<Map size={14} style={{ color: 'var(--accent)' }} />}>
        <NoData msg="No location data for this lap. Location data is available for most sessions from 2023 onwards." />
      </Panel>
    );
  }

  return (
    <>
      <Panel
        title={`Track Map — Lap ${lapNum}`}
        icon={<Map size={14} style={{ color: 'var(--accent)' }} />}
        sub={activeDrivers.length >= 2
          ? `GPS paths for ${activeDrivers.map((n) => driverMap[n]?.name_acronym).filter(Boolean).join(' vs ')} overlaid on circuit layout`
          : `Circuit layout from GPS · ${(locationByDriver[driverNums[0]] ?? []).length} samples`}
      >
        <div className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${MAP_W} ${MAP_H}`}
            width="100%"
            style={{ maxWidth: MAP_W, display: 'block', margin: '0 auto' }}
            aria-label={`Track map lap ${lapNum}`}
          >
            {/* Track base */}
            <polyline points={trackPolyline} fill="none" stroke="var(--surface-track)" strokeWidth={16} strokeLinecap="round" strokeLinejoin="round" />
            {/* Centre dashes */}
            <polyline points={trackPolyline} fill="none" stroke="var(--line-strong)" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="8 5" />

            {/* Driver paths */}
            {activeDrivers.map((n) => (
              <polyline
                key={n}
                points={driverPaths[n]}
                fill="none"
                stroke={driverColor(n)}
                strokeWidth={activeDrivers.length >= 2 ? 2.5 : 3.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.88}
              />
            ))}

            {/* Start/finish dot */}
            {startPt && (
              <circle cx={startPt.nx} cy={startPt.ny} r={7} fill="var(--accent)" stroke="var(--bg)" strokeWidth={2.5} />
            )}

            {/* Driver end-position markers */}
            {activeDrivers.map((n) => {
              const pts = locationByDriver[n] ?? [];
              if (pts.length === 0) return null;
              const last = pts[pts.length - 1];
              // Quick re-transform for last point
              const allRaw = driverNums.flatMap((d) => subsample(locationByDriver[d] ?? [], 300)).map((p) => ({ x: p.x, y: p.y }));
              const t = buildTransform(allRaw);
              if (!t) return null;
              const { nx, ny } = t({ x: last.x, y: last.y });
              return (
                <g key={`marker-${n}`}>
                  <circle cx={nx} cy={ny} r={8} fill={driverColor(n)} stroke="var(--bg)" strokeWidth={2.5} />
                  <text x={nx} y={ny + 4} textAnchor="middle" fontSize={6.5} fontWeight="bold" fill="white">
                    {driverMap[n]?.name_acronym?.slice(0, 3) ?? '?'}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.1em] text-[color:var(--text-dim)]">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[color:var(--accent)]" />
            Start / Finish
          </div>
          {activeDrivers.map((n) => (
            <div key={n} className="flex items-center gap-2 text-[10px] uppercase tracking-[0.1em] text-[color:var(--text-muted)]">
              <span className="inline-block h-1.5 w-8 rounded-full" style={{ backgroundColor: driverColor(n) }} />
              {driverMap[n]?.name_acronym}
            </div>
          ))}
        </div>
      </Panel>

      <div className="dashboard-card rounded-[12px] p-4">
        <div className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--text-dim)]">Data note</div>
        <p className="mt-1 text-[12px] leading-[1.55] text-[color:var(--text-muted)]">
          GPS from OpenF1 <code className="font-mono text-[color:var(--text-soft)]">/location</code> at ~3.7 Hz.
          Coloured lines show each driver's path for lap {lapNum}. Dot markers show the final recorded position.
          Use the Telemetry tab for speed traces along the same lap.
        </p>
      </div>
    </>
  );
}
