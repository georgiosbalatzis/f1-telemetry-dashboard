import { useMemo } from 'react';
import { Map } from 'lucide-react';
import type { OpenF1Location } from '../../api/openf1';
import { useDriverContext } from '../../contexts/useDriverContext';
import { PanelSelection, ChartSkeleton, EmbedPanelButton, NoData, Panel } from './shared';
import { MAP_W, buildTransform, fitBox, subsample, toPolyline, type MapBox } from './trackMapUtils';

type Props = {
  lapNum: number;
  locationByDriver: Record<number, OpenF1Location[] | null>;
  locationLoading: boolean;
  embedMode?: boolean;
  onEmbedPanel?: (panelId: string) => void;
};

/** Map units within which two end markers' labels would collide at mobile scale (~0.55px per unit). */
const LABEL_CLEARANCE_X = 60;
const LABEL_CLEARANCE_Y = 26;

/** Map units kept around the track so the 10-unit track stroke and edge markers are not clipped. */
const BOX_MARGIN = 12;
/** Tallest the drawing may grow; width follows from the track's own aspect ratio. */
const MAX_MAP_HEIGHT = 400;

function mapPosition(point: { nx: number; ny: number }, box: MapBox) {
  return { left: `${((point.nx - box.x) / box.w) * 100}%`, top: `${((point.ny - box.y) / box.h) * 100}%` };
}

type DriverMarker = {
  nx: number;
  ny: number;
  label: string;
};

export function TrackMapTab({ lapNum, locationByDriver, locationLoading, embedMode = false, onEmbedPanel }: Props) {
  const { driverNums, driverMap, driverColor, driverDash } = useDriverContext();
  const { trackPolyline, driverPaths, driverMarkers, startPt, activeDrivers, box } = useMemo((): {
    trackPolyline: string;
    driverPaths: Partial<Record<number, string>>;
    driverMarkers: Partial<Record<number, DriverMarker>>;
    startPt: { nx: number; ny: number } | null;
    box: MapBox;
    activeDrivers: number[];
  } => {
    // Use all drivers' data combined to get the best track outline
    const allRaw = driverNums
      .flatMap((n) => subsample(locationByDriver[n] ?? [], 300))
      .map((p) => ({ x: p.x, y: p.y }));

    const transform = buildTransform(allRaw);
    if (!transform) {
      return {
        trackPolyline: '',
        driverPaths: {} as Partial<Record<number, string>>,
        driverMarkers: {} as Partial<Record<number, DriverMarker>>,
        startPt: null,
        box: fitBox([], 0),
        activeDrivers: [],
      };
    }

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
    const markers: Partial<Record<number, DriverMarker>> = {};
    const active: number[] = [];
    for (const n of driverNums) {
      const pts = subsample(locationByDriver[n] ?? [], 400).map((p) => transform({ x: p.x, y: p.y }));
      if (pts.length > 1) {
        paths[n] = toPolyline(pts);
        active.push(n);
      }

      const rawPoints = locationByDriver[n] ?? [];
      const last = rawPoints[rawPoints.length - 1];
      if (last) {
        const marker = transform({ x: last.x, y: last.y });
        markers[n] = {
          ...marker,
          label: driverMap[n]?.name_acronym?.slice(0, 3) ?? '?',
        };
      }
    }

    return { trackPolyline: outline, driverPaths: paths, driverMarkers: markers, startPt: first, activeDrivers: active, box: fitBox(allRaw.map(transform), BOX_MARGIN) };
  }, [driverMap, driverNums, locationByDriver]);
  const svgLabel = useMemo(() => {
    const describedDrivers = (activeDrivers.length > 0 ? activeDrivers : driverNums)
      .map((driverNumber) => driverMap[driverNumber]?.full_name ?? `#${driverNumber}`)
      .join(', ');
    return `Track map for lap ${lapNum}. Drivers: ${describedDrivers}. Lines show each driver's GPS path around the circuit.`;
  }, [activeDrivers, driverMap, driverNums, lapNum]);

  const labelledMarkers = useMemo(() => {
    const placed: { n: number; marker: DriverMarker; stack: number; flip: boolean }[] = [];
    for (const n of [...activeDrivers].sort((a, b) => (driverMarkers[a]?.ny ?? 0) - (driverMarkers[b]?.ny ?? 0))) {
      const marker = driverMarkers[n];
      if (!marker) continue;
      const stack = placed.filter((p) => Math.abs(p.marker.nx - marker.nx) < LABEL_CLEARANCE_X && Math.abs(p.marker.ny - marker.ny) < LABEL_CLEARANCE_Y).length;
      placed.push({ n, marker, stack, flip: marker.nx > box.x + box.w * 0.85 });
    }
    return placed;
  }, [activeDrivers, box, driverMarkers]);

  if (locationLoading) {
    return (
      <Panel title={`Track Map — Lap ${lapNum}`} icon={<Map size={14} style={{ color: 'var(--accent)' }} />} sub="Fetching GPS location data">
        <ChartSkeleton label="Fetching GPS location data..." className="h-[260px] sm:h-[360px]" />
      </Panel>
    );
  }
  if (!trackPolyline) {
    return (
      <Panel title={`Track Map — Lap ${lapNum}`} icon={<Map size={14} style={{ color: 'var(--accent)' }} />}>
        <NoData msg="No location data for this lap. Location data is available for most sessions from 2023 onwards." />
      </Panel>
    );
  }

  return (
    <PanelSelection embedMode={embedMode}>
      <Panel
        title={`Track Map — Lap ${lapNum}`}
        icon={<Map size={14} style={{ color: 'var(--accent)' }} />}
        sub={activeDrivers.length >= 2
          ? `GPS paths for ${activeDrivers.map((n) => driverMap[n]?.name_acronym).filter(Boolean).join(' vs ')} overlaid on circuit layout`
          : `Circuit layout from GPS · ${(locationByDriver[driverNums[0]] ?? []).length} samples`}
        panelId="trackmap-lap-map"
        headerRight={!embedMode && onEmbedPanel ? <EmbedPanelButton onClick={() => onEmbedPanel('trackmap-lap-map')} /> : undefined}
      >
        <div className="relative mx-auto" style={{ aspectRatio: `${box.w} / ${box.h}`, width: `min(100%, ${(MAX_MAP_HEIGHT * box.w) / box.h}px, ${MAP_W}px)` }}>
          <svg
            viewBox={`${box.x} ${box.y} ${box.w} ${box.h}`}
            width="100%"
            height="100%"
            style={{ display: 'block' }}
            aria-label={svgLabel}
            role="img"
          >
            <title>{svgLabel}</title>
            {/* Track base */}
            <polyline points={trackPolyline} fill="none" stroke="var(--surface-track)" strokeWidth={10} strokeLinecap="round" strokeLinejoin="round" />
            {/* Centre dashes */}
            <polyline points={trackPolyline} fill="none" stroke="var(--line-strong)" strokeWidth={1} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="8 5" />

            {/* Driver paths */}
            {activeDrivers.map((n) => (
              <polyline
                key={n}
                points={driverPaths[n]}
                fill="none"
                stroke={driverColor(n)} strokeDasharray={driverDash(n)}
                strokeWidth={activeDrivers.length >= 2 ? 2.5 : 3.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.88}
              />
            ))}
          </svg>

          {/* Annotations sit outside the scaled SVG so they keep their pixel size at any map width. */}
          <div aria-hidden="true">
            {startPt && (
              <span className="absolute h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[color:var(--bg)] bg-[color:var(--accent)]" style={mapPosition(startPt, box)} />
            )}
            {labelledMarkers.map(({ n, marker, stack, flip }) => (
              <span key={n} className="absolute" style={mapPosition(marker, box)}>
                <span className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[color:var(--bg)]" style={{ background: driverColor(n) }} />
                <span
                  className="absolute whitespace-nowrap text-[12px] font-medium leading-none text-[color:var(--text-strong)] [text-shadow:0_0_3px_var(--bg),0_0_3px_var(--bg)]"
                  style={{ [flip ? 'right' : 'left']: 9, top: -6 + stack * 14 }}
                >
                  {marker.label}
                </span>
              </span>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.1em] text-[color:var(--text-dim)]">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-[color:var(--accent)]" />
            Start / Finish
          </div>
          {activeDrivers.map((n) => (
            <div key={n} className="flex items-center gap-2 text-[10px] uppercase tracking-[0.1em] text-[color:var(--text-muted)]">
              <svg width="32" height="8" aria-hidden="true"><line x1="0" y1="4" x2="32" y2="4" stroke={driverColor(n)} strokeWidth="3" strokeDasharray={driverDash(n)} /></svg>
              {driverMap[n]?.name_acronym}
            </div>
          ))}
        </div>
      </Panel>

      <div className="data-note">
        <div className="text-[10px] uppercase tracking-[0.06em] text-[color:var(--text-dim)]">Data note</div>
        <p className="mt-1 text-[12px] leading-[1.55] text-[color:var(--text-muted)]">
          GPS from OpenF1 <code className="font-mono text-[color:var(--text-soft)]">/location</code> at ~3.7 Hz.
          Coloured lines show each driver's path for lap {lapNum}. Dot markers show the final recorded position.
          Use the Telemetry tab for speed traces along the same lap.
        </p>
      </div>
    </PanelSelection>
  );
}
