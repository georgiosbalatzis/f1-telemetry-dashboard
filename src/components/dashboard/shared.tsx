import type { ReactNode } from 'react';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { AlertTriangle, Loader2 } from 'lucide-react';
import type { OpenF1Driver } from '../../api/openf1';
import { cn } from './utils';

export function Spinner({ label }: { label?: string }) {
  return <div className="flex items-center justify-center gap-2 py-10 text-sm text-[color:var(--text-muted)]"><Loader2 size={16} className="animate-spin" />{label || 'Loading…'}</div>;
}

export function Err({ msg }: { msg: string }) {
  return <div className="rounded-[20px] border border-red-500/10 bg-red-500/[0.04] py-10 text-center text-sm text-red-300/80"><AlertTriangle size={18} className="mx-auto mb-2 opacity-60" />{msg}</div>;
}

export function NoData({ msg }: { msg: string }) {
  return <div className="py-10 text-center text-sm text-[color:var(--text-muted)]">{msg}</div>;
}

export function Stat({ label, value, unit, color }: { label: string; value: string | number; unit?: string; color?: string }) {
  return (
    <div className="dashboard-stat rounded-[18px] p-3 sm:p-4">
      <div className="mb-1 text-[10px] uppercase tracking-[0.22em] text-[color:var(--text-muted)]">{label}</div>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-bold font-mono sm:text-xl" style={{ color: color || 'var(--text-strong)' }}>{value}</span>
        {unit && <span className="text-[10px] text-[color:var(--text-muted)]">{unit}</span>}
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
    <div className={cn('dashboard-panel rounded-[22px] p-4 sm:p-5', className)}>
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div>
          <h3 className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.28em] text-[color:var(--text-muted)]">{icon}{title}</h3>
          {sub ? <p className="max-w-3xl text-[11px] leading-5 text-[color:var(--text-dim)]">{sub}</p> : null}
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
        'flex min-w-[150px] items-center gap-2 rounded-[14px] border px-3 py-2.5 text-[11px] font-semibold transition-all duration-200 sm:min-w-0 sm:px-3.5 sm:text-xs',
        selected
          ? 'border-current bg-[color:var(--surface-soft)] text-[color:var(--text-strong)] shadow-[0_0_0_1px_currentColor_inset]'
          : 'border-[color:var(--line)] text-[color:var(--text-muted)] hover:border-[color:var(--line-strong)] hover:bg-[color:var(--surface-soft)] hover:text-[color:var(--text-soft)]',
      )}
      style={selected ? { color, borderColor: `${color}99`, background: `${color}10` } : {}}
    >
      <span className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[color:var(--line-strong)] bg-[color:var(--surface-avatar)] text-[9px] font-black text-[color:var(--text-soft)]">
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
        'inline-flex h-8 items-center gap-1.5 rounded-[999px] border px-3 text-[10px] uppercase tracking-[0.16em] transition-all duration-200',
        active
          ? 'border-cyan-500/25 bg-cyan-500/[0.1] text-cyan-300 shadow-[0_12px_24px_-20px_rgba(34,211,238,0.6)]'
          : 'border-[color:var(--line)] bg-[color:var(--surface-soft-2)] text-[color:var(--text-muted)] hover:-translate-y-0.5 hover:border-[color:var(--line-strong)] hover:bg-[color:var(--surface-soft)] hover:text-[color:var(--text-soft)]',
        disabled && 'cursor-not-allowed opacity-45 hover:translate-y-0 hover:border-[color:var(--line)] hover:text-[color:var(--text-muted)]',
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
    neutral: 'border-[color:var(--line)] bg-[color:var(--surface-soft)] text-[color:var(--text-muted)]',
    blue: 'border-cyan-500/20 bg-cyan-500/[0.08] text-cyan-300',
    purple: 'border-violet-500/20 bg-violet-500/[0.1] text-violet-300',
    amber: 'border-amber-500/20 bg-amber-500/[0.1] text-amber-300',
  };
  return (
    <span className={cn('inline-flex items-center rounded-[999px] border px-3 py-1.5 text-[10px] uppercase tracking-[0.16em]', tones[tone])}>
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
    <div className="dashboard-card rounded-[16px] px-3 py-2.5 text-xs backdrop-blur-xl">
      <div className="mb-1 text-[color:var(--text-muted)]">{label}</div>
      {payload.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
          <span className="text-[color:var(--text-muted)]">{item.name}:</span>
          <span className="font-bold font-mono" style={{ color: item.color }}>
            {typeof item.value === 'number' ? item.value.toFixed(1) : item.value}
          </span>
        </div>
      ))}
    </div>
  );
}
