// Dev-only fixture host: intentionally has no dashboard shell or global dashboard stylesheet.
import { createRoot } from 'react-dom/client';
import { ResponsiveTelemetryPlot, TelemetryPlot } from '../../src/embeds/TelemetryPlot';
import { figureLegend } from '../../src/embeds/plotModel';
import { fixtureCases, plotFixture } from '../../src/embeds/__tests__/fixtures';
import './telemetry-plots.css';

createRoot(document.getElementById('fixtures')!).render(<>
  <h1>Offline speed and pedal plots</h1>
  <p>Synthetic four-driver/teammate cases duplicate historical traces for layout checks only.</p>
  {fixtureCases.flatMap((scenario) => (['speed', 'pedals'] as const).map((kind) => {
    const data = plotFixture(kind, scenario);
    return <section key={`${scenario}-${kind}`} data-case={`${scenario}-${kind}`} data-theme={kind === 'speed' ? 'light' : 'dark'} className="plot-host">
      <h2>{scenario} — {kind}</h2>
      <div className="legend">{figureLegend(data, kind === 'speed' ? 'light' : 'dark').map((item) => <span key={item.label} style={{ color: item.color }}>{item.label} · {item.strokeDasharray || 'solid'}</span>)}</div>
      <TelemetryPlot data={data} width={340} theme={kind === 'speed' ? 'light' : 'dark'} />
    </section>;
  }))}
  <section className="plot-host" data-theme="light" data-case="resize" style={{ width: 340 }}>
    <h2>Measured container in a wide browser</h2>
    <ResponsiveTelemetryPlot data={plotFixture('speed', 'sample')} />
  </section>
</>);
