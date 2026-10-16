import { SINGAPORE_2026 } from '../../telemetry/singapore2026';
import { useMemo, useState } from 'react';
import { useDriverContext } from '../../contexts/useDriverContext';
import { useComparisonLap, useLaps, useRaceControl } from '../../hooks/useOpenF1';
import { alignLap, buildTrackReference, isFlyingLap, lapIdentity, resampleLaps, timingValidation, projectPosition } from '../../telemetry/lapComparison';
import { alignedCsv, lapFigureBundle, lapFigureData, selectLapFigure } from '../../embeds/lapFigures';
import { figureLegend } from '../../embeds/plotModel';
import { ResponsiveTelemetryPlot } from '../../embeds/TelemetryPlot';
import { serializeFigureBundle, type FigureBundle } from '../../embeds/contract';
import { ChartPanel } from './ChartPanel';
import { ChartSkeleton, Err, NoData, Panel } from './shared';
import { fmtLap } from './utils';

type Props = { sessionKey: number; year: number; circuit: string; sessionTitle: string };

export function SameDriverComparison({ sessionKey, year, circuit, sessionTitle }: Props) {
  const { driverNums, driverMap } = useDriverContext();
  const [selectedDriver, setDriver] = useState(driverNums[0] ?? 0);
  const driver = selectedDriver || driverNums[0] || Object.values(driverMap)[0]?.driver_number || 0;
  const [trace, setTrace] = useState('both');
  const [focus, setFocus] = useState('full');
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [length, setLength] = useState(year === 2026 && circuit === 'Singapore' ? '4927' : '');
  const [source, setSource] = useState(year === 2026 && circuit === 'Singapore' ? SINGAPORE_2026.lengthSource : '');
  const [format, setFormat] = useState('json');
  const [variant, setVariant] = useState<keyof FigureBundle['images']>('wideLight');
  const [exportError, setExportError] = useState('');
  const [exporting, setExporting] = useState(false);
  const laps = useLaps(sessionKey, driver);
  const events = useRaceControl(sessionKey);
  const eligible = (laps.data ?? []).filter(lap => lap.session_key === sessionKey && lap.driver_number === driver && isFlyingLap(lap, events.data ?? []));
  const lapA = eligible.find(lap => lapIdentity(lap).id === a) ?? null;
  const lapB = eligible.find(lap => lapIdentity(lap).id === b) ?? null;
  const rawA = useComparisonLap(lapA);
  const rawB = useComparisonLap(lapB);
  const comparison = useMemo(() => {
    if (!lapA || !lapB || rawA.data?.id !== a || rawB.data?.id !== b) return null;
    try {
      if (a === b) throw new Error('Select two different flying laps.');
      const reference = buildTrackReference(rawA.data.location, lapIdentity(lapA), Number(length), source);
      const aligned = [alignLap(rawA.data.car, rawA.data.location, lapIdentity(lapA), reference), alignLap(rawB.data.car, rawB.data.location, lapIdentity(lapB), reference)];
      if (aligned.some(lap => lap.samples.length < 20)) throw new Error('Position and telemetry coverage cannot support this comparison.');
      const points = resampleLaps(aligned, reference.length);
      const corners = year === 2026 && circuit === 'Singapore' ? SINGAPORE_2026.corners.map(corner => {
        const { distance, error } = projectPosition(corner.x, corner.y, reference);
        return { label: corner.label, distance, start: corner.label === 'T1' ? 200 : corner.label === 'T3' ? 450 : distance, end: corner.label === 'T1' ? 450 : corner.label === 'T3' ? 800 : distance, source: SINGAPORE_2026.cornerSource, uncertaintyMetres: 20, error };
      }).filter(corner => corner.error < 10).map(({ label, distance, start, end, source, uncertaintyMetres }) => ({ label, distance, start, end, source, uncertaintyMetres })) : [];
      const speed = lapFigureData('speed', aligned, points, reference, corners);
      const pedals = lapFigureData('pedals', aligned, points, reference, corners);
      for (const data of [speed, pedals]) data.drivers.forEach(d => { d.fullName = driverMap[driver]?.full_name ?? `Driver #${driver}`; });
      return { reference, aligned, points, speed, pedals, timing: timingValidation(aligned, points), error: null };
    } catch (error) { return { error: error instanceof Error ? error.message : String(error) }; }
  }, [lapA, lapB, rawA.data, rawB.data, a, b, length, source, driverMap, driver, year, circuit]);

  const plots = comparison?.speed ? Object.fromEntries((['speed', 'pedals'] as const).map(kind => {
    let data = comparison[kind];
    const corner = data.distanceAxis!.corners.find(c => c.label === focus);
    if (corner) data = { ...data, distanceAxis: { ...data.distanceAxis!, domain: [corner.start, corner.end] }, points: data.points.filter(p => p.distance! >= corner.start && p.distance! <= corner.end), guides: data.guides.filter(g => g.progress >= corner.start && g.progress <= corner.end) };
    if (trace !== 'both') data = selectLapFigure(data, comparison.aligned[trace === 'a' ? 0 : 1].lap.id);
    return [kind, data];
  })) as Record<'speed' | 'pedals', FigureBundle['data']> : null;

  const download = async (kind: 'speed' | 'pedals') => {
    if (!comparison || comparison.error || !comparison.aligned || !plots) return;
    setExporting(true); setExportError('');
    try {
      const { exportFigureImages, figurePng } = await import('../../embeds/exportFigure');
      const data = plots[kind];
      const title = `${sessionTitle} · ${driverMap[driver]?.full_name ?? driver} · ${data.drivers.map(d => `${d.acronym} (${fmtLap(d.lap!.duration)})`).join(' vs ')}${focus === 'full' ? '' : ` · ${focus}`} · ${kind === 'speed' ? 'Speed' : 'Throttle / brake state'}`;
      let blob: Blob;
      if (format === 'csv') blob = new Blob([alignedCsv(comparison.points!)], { type: 'text/csv' });
      else if (format === 'raw') blob = new Blob([JSON.stringify({ laps: [lapIdentity(lapA!), lapIdentity(lapB!)], streams: [rawA.data, rawB.data], quality: comparison.aligned.map(lap => lap.quality) }, null, 2)], { type: 'application/json' });
      else {
        const images = await exportFigureImages(data, undefined, { title, source: 'OpenF1 · reconstructed distance (m)', caption: 'Approximate position / timing. Gaps preserved; brake is on/off.' });
        const scope = { year, circuit, sessionKey, driverNums: [driver], lapNum: lapA!.lap_number, tab: 'telemetry' as const };
        const bundle = lapFigureBundle(data, scope, title, images, comparison.aligned, { grandPrix: circuit, session: sessionTitle });
        blob = format === 'svg' ? new Blob([images[variant].svg], { type: 'image/svg+xml' })
          : format === 'png' ? await figurePng(images[variant]) : new Blob([serializeFigureBundle(bundle)], { type: 'application/json' });
      }
      const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `lap-comparison-${kind}.${format === 'json' ? 'f1embed.json' : format === 'raw' ? 'raw.json' : format}`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) { setExportError(error instanceof Error ? error.message : String(error)); }
    finally { setExporting(false); }
  };
  const loading = rawA.loading || rawB.loading;
  return <>
    <Panel title="Same driver · different laps" sub="Choose one driver and two completed flying laps. Lap validity and qualifying phase require official timing verification.">
      <div className="scope-fields">
        <label className="scope-field"><span className="field-label">Driver</span><select className="dashboard-select" value={driver} onChange={e => { setDriver(Number(e.target.value)); setA(''); setB(''); }}>{Object.values(driverMap).map(d => <option key={d.driver_number} value={d.driver_number}>{d.full_name}</option>)}</select></label>
        {(['A', 'B'] as const).map(slot => <label className="scope-field" key={slot}><span className="field-label">Lap {slot}</span><select className="dashboard-select" value={slot === 'A' ? a : b} onChange={e => (slot === 'A' ? setA : setB)(e.target.value)} disabled={laps.loading}><option value="">Select flying lap</option>{eligible.map(lap => <option key={lapIdentity(lap).id} value={lapIdentity(lap).id}>L{lap.lap_number} · {fmtLap(lap.lap_duration)}</option>)}</select></label>)}
      </div>
      <details><summary>Distance calibration</summary><div className="scope-fields">
        <label className="scope-field"><span className="field-label">Circuit length (m)</span><input className="dashboard-select" type="number" min="500" max="10000" value={length} onChange={e => setLength(e.target.value)} /></label>
        <label className="scope-field"><span className="field-label">Length source</span><input className="dashboard-select" value={source} onChange={e => setSource(e.target.value)} /></label>
      </div><p>Positions are projected onto Lap A’s closed trajectory, calibrated to this sourced length. Origin and distance are approximate. Corner markers require source geometry; available T1/T3 windows are analysis boundaries.</p></details>
      {laps.error && <Err msg={laps.error} onAction={laps.refetch} />}
      {events.error && <Err msg="Lap-deletion messages could not be loaded; verify official validity before publishing." onAction={events.refetch} />}
    </Panel>
    {loading ? <ChartSkeleton label="Loading independent lap telemetry and position streams…" /> : rawA.error || rawB.error ? <Err msg={rawA.error || rawB.error!} onAction={() => { rawA.refetch(); rawB.refetch(); }} />
      : comparison?.error ? <Err msg={comparison.error} /> : comparison?.speed ? <>
        <p>{comparison.aligned.map(lap => `L${lap.lap.lapNumber}: ${lap.samples.length} synchronized samples`).join(' · ')}. {comparison.timing.reason}</p>
        <div className="scope-fields"><label className="scope-field"><span className="field-label">Traces</span><select className="dashboard-select" value={trace} onChange={e => setTrace(e.target.value)}><option value="both">Lap A + Lap B</option><option value="a">Lap A only</option><option value="b">Lap B only</option></select></label>
          {comparison.speed.distanceAxis!.corners.some(c => c.label === 'T1' || c.label === 'T3') && <label className="scope-field"><span className="field-label">Distance window</span><select className="dashboard-select" value={focus} onChange={e => setFocus(e.target.value)}><option value="full">Full circuit</option>{comparison.speed.distanceAxis!.corners.filter(c => c.label === 'T1' || c.label === 'T3').map(c => <option key={c.label} value={c.label}>{c.label} · {c.start}–{c.end} m</option>)}</select></label>}</div>
        <label className="scope-field"><span className="field-label">Publication format</span><select className="dashboard-select" value={format} onChange={e => setFormat(e.target.value)}><option value="json">Publication JSON · all themes and sizes</option><option value="svg">SVG</option><option value="png">PNG · 3× resolution</option><option value="csv">Aligned CSV · all channels</option><option value="raw">Raw JSON · both lap streams</option></select></label>
        {['svg', 'png'].includes(format) && <label className="scope-field"><span className="field-label">Figure variant</span><select className="dashboard-select" value={variant} onChange={e => setVariant(e.target.value as keyof FigureBundle['images'])}><option value="wideLight">Desktop · light</option><option value="wideDark">Desktop · dark</option><option value="narrowLight">Mobile · light</option><option value="narrowDark">Mobile · dark</option></select></label>}
        {(['speed', 'pedals'] as const).map(kind => <ChartPanel key={kind} title={kind === 'speed' ? 'Lap Speed Comparison' : 'Lap Throttle & Brake'} sub="Physical distance (m), reconstructed from position · gaps preserved" exportName={`lap-comparison-${kind}`} legend={figureLegend(plots![kind])} headerRight={<button type="button" disabled={exporting || !figureLegend(plots![kind]).length} onClick={() => void download(kind)}>{exporting ? 'Exporting…' : 'Export publication'}</button>}>{figureLegend(plots![kind]).length ? <ResponsiveTelemetryPlot data={plots![kind]} /> : <NoData msg="No reliable channel samples in this distance window." />}</ChartPanel>)}
        <details><summary>Lap and stream validation</summary><pre className="overflow-x-auto">{JSON.stringify({ laps: comparison.aligned.map(lap => ({ lap: lap.lap, quality: lap.quality })), timing: comparison.timing }, null, 2)}</pre></details>
      </> : <NoData msg="Select Lap A and Lap B to load their independent telemetry and position streams." />}
    {exportError && <Err msg={exportError} />}
  </>;
}
