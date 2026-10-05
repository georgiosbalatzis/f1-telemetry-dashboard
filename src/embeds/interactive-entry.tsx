/* eslint react-refresh/only-export-components: off -- library entry exports mount() alongside its internal React view. */
import { createRoot, type Root } from 'react-dom/client';
import { useMemo, useRef, useState } from 'react';
import { validateInteractiveFigurePayload, type InteractiveFigurePayload, type FigureTheme } from './contract';
import { TelemetryPlot } from './TelemetryPlot';

let nextRoot = 0;
const styles = `
:host{display:block;color-scheme:light dark;font:14px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif}
*{box-sizing:border-box}.surface{--fg:#20251f;--muted:#59625b;--grid:#d6ddd7;--ref:#879089;--panel:#fff;--chart-grid:var(--grid);--chart-reference:var(--ref);color:var(--fg);background:var(--panel);border:1px solid #cfd6d0;border-radius:12px;padding:16px;min-width:0}
.surface[data-theme=dark]{--fg:#edf2ee;--muted:#a8b2aa;--grid:#3a443d;--ref:#7e8a80;--panel:#171b18;--chart-grid:var(--grid);--chart-reference:var(--ref);border-color:#343d36;color-scheme:dark}
h4{font-size:1rem;margin:0 0 4px;color:var(--fg)}.meta,.readout{color:var(--muted);margin:0 0 12px}.plot{min-width:0;touch-action:pan-y}.plot svg{overflow:visible}.chart-tooltip{background:var(--panel);border:1px solid var(--grid);border-radius:7px;padding:8px 10px;color:var(--fg);box-shadow:0 2px 12px #0002}.tooltip-label{font-weight:650;margin-bottom:3px}.tooltip-row{display:flex;align-items:center;gap:7px;font-size:12px}.tooltip-row strong{margin-left:auto}.driver-marker{width:8px;height:8px;border-radius:50%;flex:none}
.control{display:grid;grid-template-columns:1fr;gap:5px;margin:4px 0 10px;min-height:44px}.control label{font-weight:650}.control input{width:100%;height:44px;min-height:44px;accent-color:#357a4a;touch-action:pan-y}.control input:focus-visible{outline:3px solid #357a4a;outline-offset:2px}.readout{margin:0;min-height:1.5em}.readout strong{color:var(--fg)}details{border-top:1px solid var(--grid);padding-top:10px}summary{cursor:pointer;min-height:44px;display:flex;align-items:center;font-weight:650}.table-wrap{overflow:auto;max-height:360px}table{border-collapse:collapse;font-size:12px;white-space:nowrap;width:100%}caption{text-align:left;color:var(--muted);padding:6px}th,td{text-align:right;border-bottom:1px solid var(--grid);padding:5px 8px}th:first-child,td:first-child{text-align:left;position:sticky;left:0;background:var(--panel)}.description,.source{font-size:12px;color:var(--muted);margin:10px 0 0}.source{margin-top:3px}@media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
`;

function InteractiveFigure({ bundle, theme, width }: { bundle: InteractiveFigurePayload; theme: FigureTheme; width: number }) {
  const { data, editorial, provenance, scope } = bundle;
  const [selected, setSelected] = useState(0);
  const active = data.points[selected] ?? data.points[0];
  const axisKey = data.axis === 'progress' ? 'progress' : 'idx';
  const selectedX = active?.[axisKey] ?? 0;
  const selectedValue = useMemo(() => {
    const values = data.kind === 'speed'
      ? data.drivers.map(driver => [`${driver.acronym} speed`, active?.[data.axis === 'sample' ? 'speed' : `speed_${driver.number}`] as number | null | undefined])
      : data.drivers.flatMap(driver => ['throttle', 'brake'].map(channel => [`${driver.acronym} ${channel === 'brake' ? 'brake' : 'throttle'}`, active?.[data.axis === 'sample' ? channel : `${channel}_${driver.number}`] as number | null | undefined]));
    return values.filter(([, value]) => typeof value === 'number').map(([name, value]) => `${name}: ${data.kind === 'pedals' && String(name).endsWith('brake') ? Math.abs(value as number).toFixed(1) : (value as number).toFixed(1)}${data.kind === 'speed' ? ' km/h' : '%'}`).join(' · ');
  }, [active, data]);
  const pointer = useRef<{ x: number; y: number; touch: boolean } | null>(null);
  const pointFromPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const start = pointer.current;
    pointer.current = null;
    if (!start || (start.touch && Math.hypot(event.clientX - start.x, event.clientY - start.y) > 8)) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const share = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    setSelected(Math.round(share * (data.points.length - 1)));
  };
  const label = data.axis === 'progress' ? `Lap progress ${Number(selectedX).toFixed(1)}%` : `Sample ${selectedX}`;
  const source = `OpenF1 · ${provenance.method} · ${scope.year} ${scope.circuit} · lap ${scope.lapNum}`;
  return <section className="surface" data-theme={theme} aria-label={`Interactive telemetry: ${editorial.title}`}>
    <h4>{editorial.title}</h4><p className="meta">{scope.year} · {scope.circuit} · lap {scope.lapNum} · {data.drivers.map(driver => driver.acronym).join(', ')}</p>
    <div className="plot" onPointerDown={event => { pointer.current = { x: event.clientX, y: event.clientY, touch: event.pointerType === 'touch' }; }} onPointerUp={pointFromPointer}>
      <TelemetryPlot data={data} width={width} height={width < 540 ? 280 : 370} theme={theme} />
    </div>
    <div className="control"><label htmlFor={`sample-${scope.sessionKey}-${scope.lapNum}`}>Inspect a saved value</label><input id={`sample-${scope.sessionKey}-${scope.lapNum}`} type="range" min="0" max={data.points.length - 1} step="1" value={selected} aria-label={`Inspect telemetry point: ${label}`} aria-valuetext={`${label}. ${selectedValue}`} onChange={event => setSelected(Number(event.currentTarget.value))} /></div>
    <p className="readout" role="status" aria-live="polite"><strong>{label}:</strong> {selectedValue || 'No measurement at this point'}</p>
    <details><summary>View all saved values</summary><div className="table-wrap"><table><caption>{editorial.description}</caption><thead><tr><th scope="col">{data.axis === 'progress' ? 'Progress (%)' : 'Sample'}</th>{data.kind === 'speed' ? data.drivers.map(driver => <th scope="col" key={driver.number}>{driver.acronym} (km/h)</th>) : data.drivers.flatMap(driver => [<th scope="col" key={`${driver.number}-t`}>{driver.acronym} throttle (%)</th>, <th scope="col" key={`${driver.number}-b`}>{driver.acronym} brake (%)</th>])}</tr></thead><tbody>{data.points.map((point, index) => <tr key={index}><th scope="row">{point[axisKey]}</th>{data.kind === 'speed' ? data.drivers.map(driver => <td key={driver.number}>{format(point[data.axis === 'sample' ? 'speed' : `speed_${driver.number}`], ' km/h')}</td>) : data.drivers.flatMap(driver => ['throttle', 'brake'].map(channel => <td key={`${driver.number}-${channel}`}>{format(point[data.axis === 'sample' ? channel : `${channel}_${driver.number}`], '%', channel === 'brake')}</td>))}</tr>)}</tbody></table></div></details>
    <p className="description">{editorial.description}</p><p className="source">{source}</p>
  </section>;
}
function format(value: number | null | undefined, unit: string, absolute = false) { return typeof value === 'number' ? `${(absolute ? Math.abs(value) : value).toFixed(1)}${unit}` : '—'; }

export type MountOptions = { theme?: FigureTheme };
export function mount(container: HTMLElement, saved: unknown, options: MountOptions = {}) {
  validateInteractiveFigurePayload(saved);
  const bundle = saved;
  const shadow = container.shadowRoot ?? container.attachShadow({ mode: 'open' });
  const rootNode = document.createElement('div');
  rootNode.className = 'telemetry-runtime-root';
  shadow.replaceChildren(rootNode);
  const style = document.createElement('style'); style.textContent = styles; shadow.prepend(style);
  const root: Root = createRoot(rootNode, { identifierPrefix: `telemetry-${++nextRoot}-` });
  let theme: FigureTheme = options.theme === 'dark' ? 'dark' : 'light';
  let width = container.getBoundingClientRect().width;
  const render = () => root.render(<InteractiveFigure bundle={bundle} theme={theme} width={width} />);
  render();
  const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(entries => {
    width = entries[0]?.contentRect.width ?? container.getBoundingClientRect().width; render();
  });
  resize?.observe(container);
  return {
    setTheme(value: string) { theme = value === 'dark' ? 'dark' : 'light'; render(); },
    unmount() { resize?.disconnect(); root.unmount(); shadow.replaceChildren(); },
  };
}
