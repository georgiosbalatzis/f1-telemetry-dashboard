import { memo, useState, useEffect, useRef, useCallback } from 'react';
import {
  Loader2, AlertTriangle, Maximize2, X, ChevronDown
} from 'lucide-react';
import type { OpenF1Driver } from '../../api/openf1';

export function cn(...c: (string|false|undefined|null)[]) { return c.filter(Boolean).join(' '); }

export function fmtLap(s: number|null): string {
  if (!s) return '—';
  const m = Math.floor(s/60), r = (s%60).toFixed(3);
  return m > 0 ? `${m}:${r.padStart(6,'0')}` : `${r}s`;
}

export function fmtDelta(d: number|null): string {
  if (d===null||d===undefined) return '';
  return `${d>0?'+':''}${d.toFixed(3)}`;
}

export function downloadCSV(f: string, h: string[], rows: (string|number|null)[][]) {
  const csv = [h.join(','), ...rows.map(r => r.map(v => v ?? '').join(','))].join('\n');
  const b = new Blob([csv], { type: 'text/csv' }), u = URL.createObjectURL(b);
  const a = document.createElement('a'); a.href = u; a.download = f; a.click(); URL.revokeObjectURL(u);
}

export const CC: Record<string, string> = {
  SOFT:'#FF3333', MEDIUM:'#FFC300', HARD:'#EEEEEE', INTERMEDIATE:'#43B02A',
  WET:'#0067AD', UNKNOWN:'#888', HYPERSOFT:'#FF69B4', ULTRASOFT:'#C800FF',
  SUPERSOFT:'#FF3333', TEST_UNKNOWN:'#888'
};

// ─── Toast System ─────────────────────────────────────────────────────────

let toastId = 0;
export interface ToastItem { id: number; msg: string; type: 'success'|'info'; exiting?: boolean; }

export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const show = useCallback((msg: string, type: 'success'|'info' = 'success') => {
    const id = ++toastId;
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.map(t => t.id === id ? { ...t, exiting: true } : t)), 2500);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2800);
  }, []);
  return { toasts, show };
}

// ─── Memoized Components ──────────────────────────────────────────────────

export const Spinner = memo(function Spinner({ label }: { label?: string }) {
  return <div className="flex items-center justify-center gap-2 py-10 text-gray-500 text-sm"><Loader2 size={16} className="animate-spin" />{label || 'Loading…'}</div>;
});

export const Err = memo(function Err({ msg }: { msg: string }) {
  return <div className="text-center py-10 text-red-400/80 text-sm"><AlertTriangle size={18} className="mx-auto mb-2 opacity-60" />{msg}</div>;
});

export const NoData = memo(function NoData({ msg }: { msg: string }) {
  return <div className="text-center py-10 text-gray-600 text-sm">{msg}</div>;
});

export const AnimStat = memo(function AnimStat({ label, value, unit, color }: { label: string; value: string|number; unit?: string; color?: string }) {
  const [anim, setAnim] = useState(false);
  const prevRef = useRef(value);
  useEffect(() => { if (prevRef.current !== value) { setAnim(true); prevRef.current = value; const t = setTimeout(() => setAnim(false), 300); return () => clearTimeout(t); } }, [value]);
  return (
    <div className="bg-[#1a1a2e]/80 border border-white/5 rounded-lg p-3 fade-in">
      <div className="text-[10px] uppercase tracking-[0.15em] text-gray-500 mb-1">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className={cn('text-lg font-mono font-bold', anim && 'num-anim')} style={{ color: color || '#E0E0E0' }}>{value}</span>
        {unit && <span className="text-[10px] text-gray-500">{unit}</span>}
      </div>
    </div>
  );
});

export const Panel = memo(function Panel({ title, icon, children, sub, onExpand, actions }: {
  title: string; icon?: React.ReactNode; children: React.ReactNode; sub?: string; onExpand?: () => void; actions?: React.ReactNode;
}) {
  return (
    <div className="bg-[#12121f]/80 border border-white/[0.04] rounded-xl p-5 fade-in">
      <div className="flex items-start justify-between mb-1">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400 flex items-center gap-2">{icon}{title}</h3>
        <div className="flex items-center gap-1">{actions}{onExpand && <button onClick={onExpand} className="p-1 text-gray-600 hover:text-gray-300 transition-colors" title="Fullscreen"><Maximize2 size={12} /></button>}</div>
      </div>
      {sub && <p className="text-[10px] text-gray-600 mb-4">{sub}</p>}
      {!sub && <div className="mb-4" />}
      {children}
    </div>
  );
});

export const ChartSkeleton = memo(function ChartSkeleton({ height=240 }: { height?: number }) {
  return <div className="w-full rounded-lg overflow-hidden" style={{ height }}><div className="skeleton w-full h-full" /></div>;
});

export const TableSkeleton = memo(function TableSkeleton({ rows=3 }: { rows?: number }) {
  return <div className="space-y-2">{Array.from({length:rows}).map((_,i) => <div key={i} className="flex gap-3"><div className="skeleton h-5 w-16" /><div className="skeleton h-5 flex-1" /><div className="skeleton h-5 w-20" /><div className="skeleton h-5 w-24" /></div>)}</div>;
});

export const LoadProgress = memo(function LoadProgress({ steps }: { steps: { label: string; done: boolean; loading: boolean }[] }) {
  if (steps.every(s => s.done)) return null;
  return (
    <div className="bg-[#12121f]/60 border border-white/[0.04] rounded-xl p-4 mb-6 fade-in">
      <div className="flex items-center gap-2 mb-3"><Loader2 size={12} className="animate-spin text-red-500" /><span className="text-[10px] uppercase tracking-[0.2em] text-gray-500">Loading</span></div>
      <div className="flex gap-1">{steps.map((s,i) => <div key={i} className="flex-1"><div className="h-1.5 rounded-full overflow-hidden bg-white/[0.04]"><div className={cn('h-full rounded-full transition-all duration-700', s.done&&'bg-emerald-500', s.loading&&'bg-red-500 animate-pulse')} style={{width:s.done?'100%':s.loading?'60%':'0%'}} /></div><div className="text-[9px] mt-1 truncate text-gray-600">{s.label}</div></div>)}</div>
    </div>
  );
});

export const FullscreenModal = memo(function FullscreenModal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  useEffect(() => { const h = (e: KeyboardEvent) => { if (e.key==='Escape') onClose(); }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h); }, [onClose]);
  return (
    <div className="modal-backdrop" onClick={e => { if (e.target===e.currentTarget) onClose(); }}>
      <div className="modal-content"><div className="flex items-center justify-between mb-4"><h2 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-300">{title}</h2><button onClick={onClose} className="p-1.5 rounded-md bg-white/5 text-gray-400 hover:text-white"><X size={16} /></button></div>{children}</div>
    </div>
  );
});

export const DriverChip = memo(function DriverChip({ d, on, onClick }: { d: OpenF1Driver; on: boolean; onClick: () => void }) {
  const c = `#${d.team_colour || '888'}`;
  return (
    <button onClick={onClick}
      className={cn('flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold border transition-all',
        on ? 'shadow-lg shadow-current/20' : 'border-white/10 text-gray-500 hover:text-gray-300')}
      style={on ? { color: c, borderColor: c, background: `${c}10` } : {}}>
      {d.headshot_url && <img src={d.headshot_url} alt="" className="driver-avatar" style={{ borderColor: on ? c : '#555' }} onError={e => { (e.target as HTMLImageElement).style.display='none'; }} />}
      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: on ? c : '#555' }} />
      {d.name_acronym} <span className="text-[10px] font-normal opacity-60">#{d.driver_number}</span>
    </button>
  );
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ChartTip = memo(function ChartTip({ active, payload, label }: { active?: boolean; payload?: any[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0d0d1a]/95 border border-white/10 rounded-lg px-3 py-2 shadow-2xl backdrop-blur-xl text-xs">
      <div className="text-gray-500 mb-1">{label}</div>
      {payload.map((p, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-gray-400">{p.name}:</span>
          <span className="font-mono font-bold" style={{ color: p.color }}>{typeof p.value==='number' ? p.value.toFixed(1) : p.value}</span>
        </div>
      ))}
    </div>
  );
});

export const SegmentBars = memo(function SegmentBars({ segments }: { segments: number[] }) {
  if (!segments?.length) return null;
  return <span className="inline-flex gap-px ml-1">{segments.map((s,i) => <span key={i} className={`seg-bar seg-${s||0}`} />)}</span>;
});

export const HeatTrackMap = memo(function HeatTrackMap({ locationData, telemetryData, color, hoverIdx }: {
  locationData: {x:number;y:number}[]; telemetryData: {speed:number}[]; color: string; hoverIdx: number|null;
}) {
  if (!locationData.length) return <div className="text-[10px] text-gray-700 text-center py-4">No location data</div>;
  const xs = locationData.map(p=>p.x), ys = locationData.map(p=>p.y);
  const minX=Math.min(...xs), maxX=Math.max(...xs), minY=Math.min(...ys), maxY=Math.max(...ys);
  const pad=12, w=220, h=220, sX=(maxX-minX)||1, sY=(maxY-minY)||1;
  const pts = locationData.map(p => ({ cx: pad+((p.x-minX)/sX)*(w-2*pad), cy: pad+((p.y-minY)/sY)*(h-2*pad) }));
  const maxSpd = Math.max(...telemetryData.map(t=>t.speed), 1);
  const minSpd = Math.min(...telemetryData.filter(t=>t.speed>0).map(t=>t.speed), 0);
  function speedColor(idx: number): string {
    const ratio = idx / Math.max(1, pts.length-1);
    const tIdx = Math.min(Math.round(ratio * (telemetryData.length-1)), telemetryData.length-1);
    const spd = telemetryData[tIdx]?.speed ?? 0;
    const t = (spd - minSpd) / (maxSpd - minSpd || 1);
    if (t < 0.5) return `rgb(255,${Math.round(t*2*255)},0)`;
    return `rgb(${Math.round((1-t)*2*255)},200,50)`;
  }
  let dotPt: {cx:number;cy:number}|null = null;
  if (hoverIdx!==null && pts.length>0) { const r = hoverIdx/Math.max(1,telemetryData.length-1); dotPt = pts[Math.min(Math.round(r*(pts.length-1)),pts.length-1)]; }
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-[220px] mx-auto">
      {pts.map((p,i) => i > 0 && <line key={i} x1={pts[i-1].cx} y1={pts[i-1].cy} x2={p.cx} y2={p.cy} stroke={speedColor(i)} strokeWidth={2.5} strokeLinecap="round" opacity={0.8} />)}
      {pts.length>0 && <circle cx={pts[0].cx} cy={pts[0].cy} r={3} fill="#22C55E" />}
      {dotPt && <circle cx={dotPt.cx} cy={dotPt.cy} r={4} fill="#fff" stroke={color} strokeWidth={2} />}
      <defs><linearGradient id="spdGrad" x1="0" x2="1"><stop offset="0%" stopColor="#ff0000"/><stop offset="50%" stopColor="#ffff00"/><stop offset="100%" stopColor="#22c850"/></linearGradient></defs>
      <rect x={pad} y={h-14} width={60} height={5} rx={2} fill="url(#spdGrad)" opacity={0.6}/>
      <text x={pad} y={h-2} fontSize={7} fill="#555">Slow</text>
      <text x={pad+45} y={h-2} fontSize={7} fill="#555">Fast</text>
    </svg>
  );
});

/** Simple virtualized list — renders only visible items */
export function VirtualList<T>({ items, itemHeight, maxHeight, renderItem }: {
  items: T[]; itemHeight: number; maxHeight: number; renderItem: (item: T, index: number) => React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const visibleCount = Math.ceil(maxHeight / itemHeight) + 2;
  const startIdx = Math.max(0, Math.floor(scrollTop / itemHeight) - 1);
  const endIdx = Math.min(items.length, startIdx + visibleCount);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIdx * itemHeight;

  return (
    <div ref={containerRef} className="overflow-y-auto pr-2" style={{ maxHeight }}
      onScroll={e => setScrollTop((e.target as HTMLDivElement).scrollTop)}>
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ position: 'absolute', top: offsetY, left: 0, right: 0 }}>
          {items.slice(startIdx, endIdx).map((item, i) => renderItem(item, startIdx + i))}
        </div>
      </div>
    </div>
  );
}

// ─── Debounced hover hook ──────────────────────────────────────────────────

export function useDebouncedHover() {
  const [hoverIdx, setHoverIdx] = useState<number|null>(null);
  const rafRef = useRef<number|null>(null);

  const onMove = useCallback((e: unknown) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const ev = e as Record<string, unknown> | null;
      setHoverIdx(ev?.activeTooltipIndex as number ?? null);
    });
  }, []);

  const onLeave = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    setHoverIdx(null);
  }, []);

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); }, []);

  return { hoverIdx, onMove, onLeave };
}

// ─── Select dropdown (memoized) ──────────────────────────────────────────

export const Select = memo(function Select({ value, onChange, options, disabled, placeholder, loading }: {
  value: string|number; onChange: (v: string) => void; options: {v:string|number;l:string}[];
  disabled?: boolean; placeholder?: string; loading?: boolean;
}) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)}
        className="w-full appearance-none bg-[#12121f] border border-white/[0.06] rounded-md px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-red-500/50 cursor-pointer"
        disabled={disabled || loading}>
        {loading && <option>Loading…</option>}
        {!loading && options.length === 0 && <option>{placeholder || '—'}</option>}
        {options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" />
    </div>
  );
});
