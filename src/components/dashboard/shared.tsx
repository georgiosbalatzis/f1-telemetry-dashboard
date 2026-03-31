import type { ReactNode } from 'react';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { AlertTriangle, Loader2 } from 'lucide-react';
import type { OpenF1Driver } from '../../api/openf1';
import { cn } from './utils';

export function Spinner({ label }: { label?: string }) {
  return <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500"><Loader2 size={16} className="animate-spin" />{label || 'Loading…'}</div>;
}

export function Err({ msg }: { msg: string }) {
  return <div className="rounded-[20px] border border-red-500/10 bg-red-500/[0.04] py-10 text-center text-sm text-red-300/80"><AlertTriangle size={18} className="mx-auto mb-2 opacity-60" />{msg}</div>;
}

export function NoData({ msg }: { msg: string }) {
  return <div className="py-10 text-center text-sm text-slate-600">{msg}</div>;
}

export function Stat({ label, value, unit, color }: { label: string; value: string | number; unit?: string; color?: string }) {
  return (
    <div className="rounded-[16px] border border-white/[0.04] bg-[#12121d]/95 p-3 shadow-[0_18px_40px_-28px_rgba(0,0,0,0.8)] sm:p-4">
      <div className="mb-1 text-[10px] uppercase tracking-[0.24em] text-slate-500">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-base font-bold font-mono sm:text-lg" style={{ color: color || '#E7E8EE' }}>{value}</span>
        {unit && <span className="text-[10px] text-slate-500">{unit}</span>}
      </div>
    </div>
  );
}

export function Panel({
  title,
  icon,
  children,
  sub,
  className,
  headerRight,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  sub?: string;
  className?: string;
  headerRight?: ReactNode;
}) {
  return (
    <div className={cn('rounded-[18px] border border-white/[0.035] bg-[linear-gradient(180deg,rgba(20,20,31,0.98),rgba(16,16,26,0.98))] p-4 shadow-[0_32px_60px_-42px_rgba(0,0,0,0.95)] sm:p-5', className)}>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div>
          <h3 className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.32em] text-slate-400">{icon}{title}</h3>
          {sub ? <p className="text-[10px] text-slate-600">{sub}</p> : null}
        </div>
        {headerRight}
      </div>
      {children}
    </div>
  );
}

export function DriverChip({ driver, selected, onClick }: { driver: OpenF1Driver; selected: boolean; onClick: () => void }) {
  const color = `#${driver.team_colour || '888'}`;
  const initials = driver.name_acronym.slice(0, 3);
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex min-w-[140px] items-center gap-2 rounded-[10px] border px-2.5 py-2 text-[11px] font-semibold transition-all duration-200 sm:min-w-0 sm:px-3 sm:text-xs',
        selected ? 'border-current bg-white/[0.03] text-slate-100 shadow-[0_0_0_1px_currentColor_inset]' : 'border-white/[0.05] text-slate-500 hover:border-white/[0.08] hover:text-slate-300',
      )}
      style={selected ? { color, borderColor: `${color}99`, background: `${color}10` } : {}}
    >
      <span className="relative flex h-6 w-6 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[#1c1c2a] text-[9px] font-black text-slate-300">
        {driver.headshot_url ? (
          <img src={driver.headshot_url} alt={driver.full_name} className="h-full w-full object-cover" />
        ) : (
          initials
        )}
      </span>
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: selected ? color : '#4b5563' }} />
      <span className="tracking-[0.18em]">{driver.name_acronym}</span>
      <span className="text-[10px] font-normal opacity-50">#{driver.driver_number}</span>
    </button>
  );
}

export function ToolbarButton({
  icon,
  label,
  onClick,
  active = false,
  disabled = false,
}: {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex h-7 items-center gap-1.5 rounded-[8px] border px-2.5 text-[10px] uppercase tracking-[0.18em] transition-colors',
        active
          ? 'border-cyan-500/25 bg-cyan-500/[0.08] text-cyan-300'
          : 'border-white/[0.05] bg-white/[0.01] text-slate-600 hover:border-white/[0.09] hover:text-slate-300',
        disabled && 'cursor-not-allowed opacity-45 hover:border-white/[0.05] hover:text-slate-600',
      )}
    >
      {icon}
      <span className="hidden min-[380px]:inline">{label}</span>
    </button>
  );
}

export function AccentChip({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'blue' | 'purple' | 'amber';
}) {
  const tones = {
    neutral: 'border-white/[0.05] bg-white/[0.02] text-slate-600',
    blue: 'border-cyan-500/20 bg-cyan-500/[0.06] text-cyan-300',
    purple: 'border-violet-500/20 bg-violet-500/[0.08] text-violet-300',
    amber: 'border-amber-500/20 bg-amber-500/[0.08] text-amber-300',
  };
  return (
    <span className={cn('inline-flex items-center rounded-[8px] border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em]', tones[tone])}>
      {label}
    </span>
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
    <div className="rounded-[14px] border border-white/[0.06] bg-[#0e0f17]/95 px-3 py-2 text-xs shadow-2xl backdrop-blur-xl">
      <div className="mb-1 text-slate-500">{label}</div>
      {payload.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
          <span className="text-slate-400">{item.name}:</span>
          <span className="font-bold font-mono" style={{ color: item.color }}>
            {typeof item.value === 'number' ? item.value.toFixed(1) : item.value}
          </span>
        </div>
      ))}
    </div>
  );
}
