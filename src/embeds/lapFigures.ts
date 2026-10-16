import type { AlignedLap, CornerMarker, DistancePoint, TrackReference } from '../telemetry/lapComparison';
import { DEFAULT_ALIGNMENT, seriesKey, timingValidation, validateCorners } from '../telemetry/lapComparison';
import type { FigureBundle, FigureData, PublicationScope } from './contract';

/** All individual/combined views retain the same physical origin and fixed speed scale. */
export function lapFigureData(kind: FigureData['kind'], laps: AlignedLap[], points: DistancePoint[], reference: TrackReference, corners: CornerMarker[] = [], domain: [number, number] = [0, reference.length]): FigureData {
  validateCorners(corners, reference.length);
  const channels = kind === 'speed' ? ['speed'] : ['throttle', 'brake'];
  return {
    kind, axis: 'distance',
    drivers: laps.map(({ lap }, i) => ({ number: lap.driverNumber, fullName: `Driver #${lap.driverNumber}`, acronym: `Lap ${i ? 'B' : 'A'} · L${lap.lapNumber}`, teamColour: i ? '#d97706' : '#2563eb', lineDash: i ? '8 4' : undefined, brakeDash: i ? '8 4' : '1 0', lap })),
    points: points.filter(p => p.distance >= domain[0] && p.distance <= domain[1]).map(point => Object.fromEntries([
      ['distance', point.distance], ...laps.flatMap(({ lap }) => channels.map(channel => [seriesKey(lap.id, channel), point[seriesKey(lap.id, channel)] == null ? null : channel === 'brake' ? -100 * point[seriesKey(lap.id, channel)]! : point[seriesKey(lap.id, channel)]])),
    ])),
    guides: corners.filter(c => c.distance >= domain[0] && c.distance <= domain[1]).map(c => ({ progress: c.distance, label: c.label })),
    distanceAxis: { domain, speedDomain: [0, 350], speedTicks: [0, 50, 100, 150, 200, 250, 300, 350], referenceSource: reference.source, origin: reference.origin, method: 'location-projection', corners, maxTelemetryGapMs: DEFAULT_ALIGNMENT.maxTelemetryGapMs, maxLocationGapMs: DEFAULT_ALIGNMENT.maxLocationGapMs, metresPerUnit: reference.metresPerUnit },
  };
}
export function lapFigureBundle(data: FigureData, scope: PublicationScope, title: string, images: FigureBundle['images'], laps: AlignedLap[], context: FigureBundle['context'] = { grandPrix: scope.circuit, session: 'Lap comparison' }): FigureBundle {
  const plottedLaps = data.drivers.map(driver => laps.find(lap => lap.lap.id === driver.lap!.id)!);
  return {
    schemaVersion: 2, panelId: data.kind === 'speed' ? 'telemetry-speed-trace' : 'telemetry-throttle-brake', capturedAt: new Date().toISOString(),
    scope: { ...scope, driverNums: [data.drivers[0].number], lapNum: data.drivers[0].lap!.lapNumber }, context,
    editorial: { title, caption: 'Reconstructed physical distance; gaps preserved. Brake is application state. OpenF1 timestamps and position are approximate.', description: `${title}. ${data.drivers.map(d => `${d.acronym}: ${d.lap!.duration.toFixed(3)} s`).join('; ')}. ${data.distanceAxis!.origin}` },
    provenance: { source: 'OpenF1', validation: { lapStreams: data.drivers.map(d => ({ lapId: d.lap!.id, quality: laps.find(l => l.lap.id === d.lap!.id)!.quality })), timing: timingValidation(plottedLaps, []) }, method: 'Timestamp synchronization and projection onto a common closed trajectory calibrated to a sourced circuit length. Linear speed/throttle; held brake state. No extrapolation.', guideExplanation: data.distanceAxis!.corners.length ? 'Sourced corner positions projected onto the same reference trajectory; analysis windows and uncertainty documented in distanceAxis.corners.' : '', partialAcknowledged: true,
      drivers: data.drivers.map(d => ({ driverNumber: d.number, status: 'complete', sampleCount: laps.find(l => l.lap.id === d.lap!.id)!.samples.length })) }, data, images,
  };
}

export function alignedCsv(points: DistancePoint[]) {
  const keys = Object.keys(points[0] ?? { distance: 0 });
  return [keys.join(','), ...points.map(point => keys.map(key => point[key] == null ? '' : String(point[key])).join(','))].join('\n') + '\n';
}

export function selectLapFigure(data: FigureData, lapId: string): FigureData {
  const drivers = data.drivers.filter(driver => driver.lap?.id === lapId);
  if (!drivers.length) throw new Error('Lap is not in this figure.');
  const channels = data.kind === 'speed' ? ['speed'] : ['throttle', 'brake'];
  const keys = ['distance', ...channels.map(channel => seriesKey(lapId, channel))];
  return { ...data, drivers, points: data.points.map(point => Object.fromEntries(keys.map(key => [key, point[key]]))) };
}
