// Mockup-only data + SVG renderers. Plausible Baku lap shapes; not real telemetry.
const N = 240;
const CORNERS = [
  [0.075, 108], [0.125, 96], [0.18, 98], [0.225, 112], [0.27, 152], [0.305, 168],
  [0.355, 96], [0.385, 78], [0.415, 112], [0.45, 150], [0.5, 138], [0.55, 152], [0.585, 164],
  [0.625, 108], [0.665, 148], [0.75, 285], [0.93, 320],
];
const CORNER_LABELS = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8', 'T9', 'T10', 'T12', 'T13', 'T14', 'T15', 'T16', 'T18', 'T20'];

function lap({ dMin = 0, brake = 1, acc = 1, vmax = 332, jitter = 0 } = {}) {
  const out = [];
  for (let i = 0; i < N; i++) {
    const x = i / (N - 1);
    let v = vmax;
    CORNERS.forEach(([p, m], k) => {
      const mm = m + dMin + (jitter ? Math.sin(k * 7.3 + jitter) * 4 : 0);
      const d = Math.abs(x - p) * 6000; // metres
      const c = x < p ? 1100 * brake : 150 * acc; // (km/h)^2 per metre: ~4.5g braking, traction-limited exit
      v = Math.min(v, Math.sqrt(mm * mm + c * d));
    });
    out.push(v);
  }
  return out;
}
const A = lap({ jitter: 1.2 });
const B = lap({ dMin: -2, brake: .93, acc: 1.05, vmax: 336, jitter: 2.9 });
const DELTA = A.map((v, i) => v - B[i]);
const pedals = (s) => s.map((v, i) => { const d = (s[i + 1] ?? v) - v; return { thr: d < -1.2 ? 0 : d > .2 || v > 300 ? 100 : 55, brk: d < -1.2 ? Math.min(100, -d * 22) : 0 }; });
const PA = pedals(A), PB = pedals(B);
const LAPTIMES = Array.from({ length: 51 }, (_, i) => {
  const l = i + 1; if (l === 1) return 118; if (l >= 30 && l <= 36) return 145 - Math.abs(33 - l) * 7; if (l === 17 || l === 37) return 126;
  return 106.2 - l * 0.03 + Math.sin(l * 1.7) * .35;
});

const PALETTE = {
  light: { grid: '#d4d0c5', axis: '#5b6256', text: '#20251f', bg: 'transparent' },
  dark: { grid: '#343739', axis: '#bcb8b0', text: '#eee7dc', bg: 'transparent' },
};

function chart(el, o) {
  const theme = PALETTE[o.theme || 'light'];
  const W = Math.round(el.getBoundingClientRect().width) || 600, H = o.height || 260;
  const L = o.padL ?? 44, R = 8, T = o.padT ?? 10, Bm = o.xTicks ? 26 : 8;
  const iw = W - L - R, ih = H - T - Bm;
  const sx = (i, n) => L + (i / (n - 1)) * iw;
  const sy = (v) => T + ih - ((v - o.yMin) / (o.yMax - o.yMin)) * ih;
  let s = `<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">`;
  (o.bands || []).forEach((b) => { s += `<rect x="${L + b.from * iw}" y="${T}" width="${(b.to - b.from) * iw}" height="${ih}" fill="${b.fill}"/>`; });
  (o.yTicks || []).forEach((t) => {
    s += `<line x1="${L}" x2="${W - R}" y1="${sy(t)}" y2="${sy(t)}" stroke="${theme.grid}" stroke-width="1"/>`;
    s += `<text x="${L - 8}" y="${sy(t) + 4}" font-size="11" text-anchor="end" fill="${theme.axis}">${o.yFmt ? o.yFmt(t) : t}</text>`;
  });
  (o.xTicks || []).forEach((t) => {
    const x = L + t.x * iw;
    if (t.line) s += `<line x1="${x}" x2="${x}" y1="${T}" y2="${T + ih}" stroke="${theme.grid}" stroke-dasharray="2 4"/>`;
    s += `<text x="${x}" y="${H - 8}" font-size="11" text-anchor="middle" fill="${theme.axis}">${t.label}</text>`;
  });
  if (o.zero != null) s += `<line x1="${L}" x2="${W - R}" y1="${sy(o.zero)}" y2="${sy(o.zero)}" stroke="${theme.axis}" stroke-width="1"/>`;
  o.series.forEach((se) => {
    const pts = se.data.map((v, i) => `${sx(i, se.data.length).toFixed(1)},${sy(v).toFixed(1)}`);
    if (se.area) {
      const base = sy(se.areaBase ?? o.yMin);
      s += `<path d="M${sx(0, se.data.length)},${base} L${pts.join(' L')} L${sx(se.data.length - 1, se.data.length)},${base} Z" fill="${se.area}"/>`;
    }
    s += `<polyline points="${pts.join(' ')}" fill="none" stroke="${se.color}" stroke-width="${se.width || 2}" ${se.dash ? `stroke-dasharray="${se.dash}"` : ''} stroke-linejoin="round"/>`;
  });
  (o.markers || []).forEach((m) => {
    const x = L + m.x * iw;
    s += `<line x1="${x}" x2="${x}" y1="${T}" y2="${T + ih}" stroke="${m.color}" stroke-width="1.5"/>`;
    if (m.label) s += `<text x="${x + 6}" y="${T + 12}" font-size="11" font-weight="600" fill="${m.color}">${m.label}</text>`;
  });
  el.innerHTML = s + '</svg>';
}

const cornerTicks = (every = 1) => CORNERS.map(([p], i) => ({ x: p, label: CORNER_LABELS[i], line: true })).filter((t, i) => t.label && i % every === 0);
const pctTicks = [0, .25, .5, .75, 1].map((x) => ({ x, label: `${x * 100}%` }));

// Stylised street-circuit outline (not to scale). Segments coloured by who was faster.
const TRACK = 'M60,250 L380,250 L400,236 L400,200 L370,190 L370,150 L330,150 L330,118 L300,104 L300,70 L318,52 L300,30 L250,30 L240,56 L205,56 L200,96 L160,110 L130,110 L128,150 L95,160 L90,200 L60,214 Z';
function trackMap(el, { dark = false, dots = true, dominance = true } = {}) {
  const base = dark ? '#47494a' : '#c8c8b9', ink = dark ? '#eee7dc' : '#20251f';
  const a = dark ? 'var(--rus-dark)' : 'var(--rus)', b = dark ? 'var(--ver-dark)' : 'var(--ver)';
  el.innerHTML = `<svg viewBox="30 10 400 260" width="100%" xmlns="http://www.w3.org/2000/svg">
    <path d="${TRACK}" fill="none" stroke="${base}" stroke-width="16" stroke-linejoin="round"/>
    ${dominance ? `<path d="${TRACK}" fill="none" stroke="${a}" stroke-width="5" stroke-linejoin="round" pathLength="100" stroke-dasharray="14 9 8 12 20 37"/>
    <path d="${TRACK}" fill="none" stroke="${b}" stroke-width="5" stroke-linejoin="round" pathLength="100" stroke-dasharray="0 14 9 8 12 20 37 0" />` : `<path d="${TRACK}" fill="none" stroke="${ink}" stroke-width="2"/>`}
    <line x1="120" x2="120" y1="240" y2="260" stroke="${ink}" stroke-width="3"/>
    ${dots ? `<circle cx="372" cy="170" r="7" fill="${a}" stroke="${dark ? '#181a1c' : '#f2eee4'}" stroke-width="2"/><circle cx="352" cy="150" r="7" fill="${b}" stroke="${dark ? '#181a1c' : '#f2eee4'}" stroke-width="2"/>` : ''}
    <text x="126" y="274" font-size="10" fill="${ink}" letter-spacing="1.2">START / FINISH</text>
  </svg>`;
}

const fmtLap = (s) => { const m = Math.floor(s / 60); return `${m}:${(s - m * 60).toFixed(0).padStart(2, '0')}`; };
window.MOCK = { A, B, DELTA, PA, PB, LAPTIMES, chart, cornerTicks, pctTicks, trackMap, fmtLap };
