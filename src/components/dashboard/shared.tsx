import type { ReactNode } from 'react';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { AlertTriangle, Loader2 } from 'lucide-react';
import type { OpenF1Driver } from '../../api/openf1';
import { cn } from './utils';

export function Spinner({ label }: { label?: string }) {
  return <div className="flex items-center justify-center gap-2 py-10 text-sm text-gray-500"><Loader2 size={16} className="animate-spin" />{label || 'Loading…'}</div>;
}

export function Err({ msg }: { msg: string }) {
  return <div className="py-10 text-center text-sm text-red-400/80"><AlertTriangle size={18} className="mx-auto mb-2 opacity-60" />{msg}</div>;
}

export function NoData({ msg }: { msg: string }) {
  return <div className="py-10 text-center text-sm text-gray-600">{msg}</div>;
}

export function Stat({ label, value, unit, color }: { label: string; value: string | number; unit?: string; color?: string }) {
  return (
    <div className="rounded-lg border border-white/5 bg-[#1a1a2e]/80 p-3">
      <div className="mb-1 text-[10px] uppercase tracking-[0.15em] text-gray-500">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-bold font-mono" style={{ color: color || '#E0E0E0' }}>{value}</span>
        {unit && <span className="text-[10px] text-gray-500">{unit}</span>}
      </div>
    </div>
  );
}

export function Panel({ title, icon, children, sub }: { title: string; icon?: ReactNode; children: ReactNode; sub?: string }) {
  return (
    <div className="rounded-xl border border-white/[0.04] bg-[#12121f]/80 p-5">
      <h3 className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-gray-400">{icon}{title}</h3>
      {sub ? <p className="mb-4 text-[10px] text-gray-600">{sub}</p> : <div className="mb-4" />}
      {children}
    </div>
  );
}

export function DriverChip({ driver, selected, onClick }: { driver: OpenF1Driver; selected: boolean; onClick: () => void }) {
  const color = `#${driver.team_colour || '888'}`;
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-semibold transition-all',
        selected ? 'shadow-lg shadow-current/20' : 'border-white/10 text-gray-500 hover:text-gray-300',
      )}
      style={selected ? { color, borderColor: color, background: `${color}10` } : {}}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: selected ? color : '#555' }} />
      {driver.name_acronym} <span className="text-[10px] font-normal opacity-60">#{driver.driver_number}</span>
    </button>
  );
}

type ChartTipPayload = {
  color?: string;
  name?: NameType;
  value?: ValueType;
};

export function ChartTip({ active, payload, label }: { active?: boolean; payload?: ChartTipPayload[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-[#0d0d1a]/95 px-3 py-2 text-xs shadow-2xl backdrop-blur-xl">
      <div className="mb-1 text-gray-500">{label}</div>
      {payload.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
          <span className="text-gray-400">{item.name}:</span>
          <span className="font-bold font-mono" style={{ color: item.color }}>
            {typeof item.value === 'number' ? item.value.toFixed(1) : item.value}
          </span>
        </div>
      ))}
    </div>
  );
}
