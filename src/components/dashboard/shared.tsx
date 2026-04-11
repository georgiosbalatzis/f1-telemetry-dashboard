import type { ReactNode } from 'react';
import type { NameType, ValueType } from 'recharts/types/component/DefaultTooltipContent';
import { AlertTriangle, Code2, Loader2 } from 'lucide-react';
import type { OpenF1Driver } from '../../api/openf1';
import { COLORS, teamColor, withAlpha } from '../../constants/colors';
import { cn } from './utils';

export function Spinner({ label }: { label?: string }) {
  return <div className="flex items-center justify-center gap-2 py-10 text-sm text-[color:var(--text-muted)]"><Loader2 size={16} className="animate-spin" />{label || 'Loading…'}</div>;
}

export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-[12px] bg-[color:var(--surface-soft)]', className)} />;
}

export function ChartSkeleton({ label = 'Loading chart…', className }: { label?: string; className?: string }) {
  const bars = [34, 62, 46, 78, 55, 88, 50, 70];
  return (
    <div
      role="status"
      aria-label={label}
      className={cn('rounded-[14px] border border-[color:var(--line)] bg-[color:var(--surface-soft-2)] p-4', className)}
    >
      <div className="flex h-full min-h-[120px] items-end gap-2">
        {bars.map((height, index) => (
          <div
            key={index}
            className="flex-1 animate-pulse rounded-t-[8px] bg-[color:var(--surface-soft)]"
            style={{ height: `${height}%`, animationDelay: `${index * 70}ms` }}
          />
        ))}
      </div>
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function CardGridSkeleton({ count = 4, label = 'Loading cards…' }: { count?: number; label?: string }) {
  return (
    <div role="status" aria-label={label} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="dashboard-card rounded-[14px] p-3">
          <SkeletonBlock className="mb-3 h-3 w-16" />
          <SkeletonBlock className="mb-2 h-7 w-20" />
          <SkeletonBlock className="h-2.5 w-full" />
        </div>
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function TableSkeleton({ rows = 5, label = 'Loading rows…' }: { rows?: number; label?: string }) {
  return (
    <div role="status" aria-label={label} className="space-y-2">
      <SkeletonBlock className="h-4 w-36" />
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="grid grid-cols-[54px_minmax(0,1fr)_72px] items-center gap-3">
          <SkeletonBlock className="h-4 w-full" />
          <SkeletonBlock className="h-6 w-full" />
          <SkeletonBlock className="h-4 w-full" />
        </div>
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}

export function Err({ msg }: { msg: string }) {
  return <div className="rounded-[20px] border border-red-500/10 bg-red-500/[0.04] py-10 text-center text-sm text-red-300/80"><AlertTriangle size={18} className="mx-auto mb-2 opacity-60" />{msg}</div>;
}

export function NoData({ msg }: { msg: string }) {
  return <div className="py-10 text-center text-sm text-[color:var(--text-muted)]">{msg}</div>;
}

export function Stat({ label, value, unit, color }: { label: string; value: string | number; unit?: string; color?: string }) {
  return (
    <div className="dashboard-stat rounded-[14px] p-2.5 sm:p-3">
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
  panelId,
}: {
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  sub?: string;
  className?: string;
  headerRight?: ReactNode;
  panelId?: string;
}) {
  return (
    <div id={panelId} className={cn('dashboard-panel rounded-[16px] p-3 sm:rounded-[18px] sm:p-4', className)}>
      <div className="mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
        <div>
          <h3 className="mb-1 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.22em] text-[color:var(--text-muted)] sm:text-[10px] sm:tracking-[0.24em]">{icon}{title}</h3>
          {sub ? <p className="max-w-3xl text-[11px] leading-[1.45] text-[color:var(--text-dim)]">{sub}</p> : null}
        </div>
        {headerRight}
      </div>
      {children}
    </div>
  );
}

export function DriverChip({
  driver,
  selected,
  onClick,
  compact = false,
  stacked = false,
}: {
  driver: OpenF1Driver;
  selected: boolean;
  onClick: () => void;
  compact?: boolean;
  stacked?: boolean;
}) {
  const color = teamColor(driver.team_colour);
  const initials = driver.name_acronym.slice(0, 3);

  if (stacked) {
    return (
      <button
        onClick={onClick}
        className={cn(
          'group relative flex min-h-[88px] flex-col items-start rounded-[14px] border px-2.5 py-2.5 text-left transition-colors duration-150 sm:min-h-[98px]',
          selected
            ? 'text-[color:var(--text-strong)] shadow-[0_8px_18px_-16px_rgba(0,0,0,0.28)]'
            : 'border-[color:var(--line)] bg-[color:var(--surface-soft-2)] text-[color:var(--text-soft)] hover:border-[color:var(--line-strong)] hover:bg-[color:var(--surface-soft)]',
        )}
        style={selected ? { borderColor: withAlpha(color, 53), background: `linear-gradient(180deg, ${withAlpha(color, 12)}, transparent 78%), var(--surface-card)` } : {}}
      >
        <span className="absolute inset-x-0 top-0 h-px rounded-t-[14px]" style={{ backgroundColor: color, opacity: selected ? 0.9 : 0.55 }} />
        <div className="flex w-full items-start justify-between gap-2">
          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[color:var(--line-strong)] bg-[color:var(--surface-avatar)] font-black text-[10px] text-[color:var(--text-soft)]">
            {driver.headshot_url ? (
              <img src={driver.headshot_url} alt={driver.full_name} loading="lazy" decoding="async" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </span>
          <span
            className={cn(
              'rounded-full border px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.14em]',
              selected
                ? 'bg-white/10'
                : 'border-[color:var(--line)] bg-[color:var(--surface-soft)] text-[color:var(--text-dim)] group-hover:border-[color:var(--line-strong)] group-hover:text-[color:var(--text-muted)]',
            )}
            style={selected ? { borderColor: withAlpha(color, 53), color } : undefined}
          >
            #{driver.driver_number}
          </span>
        </div>
        <div className="mt-3 min-w-0">
          <div className="text-[13px] font-black uppercase tracking-[0.12em] text-[color:var(--text-strong)]">
            {driver.name_acronym}
          </div>
          <div className="mt-1 truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--text-soft)]">
            {driver.last_name}
          </div>
          <div className="mt-1 truncate text-[9px] uppercase tracking-[0.1em] text-[color:var(--text-dim)]">
            {driver.team_name}
          </div>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        compact
          ? 'flex w-full min-w-0 items-center justify-start gap-2 rounded-[10px] border px-2.5 py-1.5 text-[10px] font-semibold transition-colors duration-150'
          : 'flex min-w-[138px] items-center gap-2 rounded-[12px] border px-2.5 py-2 text-[10px] font-semibold transition-colors duration-150 sm:min-w-0 sm:px-3',
        selected
          ? 'border-current bg-[color:var(--surface-soft)] text-[color:var(--text-strong)] shadow-[0_0_0_1px_currentColor_inset]'
          : 'border-[color:var(--line)] text-[color:var(--text-muted)] hover:border-[color:var(--line-strong)] hover:bg-[color:var(--surface-soft)] hover:text-[color:var(--text-soft)]',
      )}
      style={selected ? { color, borderColor: withAlpha(color, 60), background: withAlpha(color, 6) } : {}}
    >
      <span className={cn(
        'relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[color:var(--line-strong)] bg-[color:var(--surface-avatar)] font-black text-[color:var(--text-soft)]',
        compact ? 'h-6 w-6 text-[8px]' : 'h-7 w-7 text-[9px]',
      )}>
        {driver.headshot_url ? (
          <img src={driver.headshot_url} alt={driver.full_name} className="h-full w-full object-cover" />
        ) : (
          initials
        )}
      </span>
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: selected ? color : COLORS.mutedDot }} />
      <span className={cn(compact ? 'tracking-[0.12em]' : 'tracking-[0.14em]')}>{driver.name_acronym}</span>
      <span className={cn('font-normal opacity-50', compact ? 'text-[9px]' : 'text-[10px]')}>#{driver.driver_number}</span>
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
  const activeStyle = active
    ? {
      borderColor: 'var(--accent-border)',
      background: 'var(--accent-muted)',
      color: 'var(--accent)',
    }
    : undefined;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      style={activeStyle}
      className={cn(
        'inline-flex h-8 min-w-8 items-center justify-center gap-1.5 rounded-[9px] border px-2 text-[10px] uppercase tracking-[0.08em] transition-colors duration-150 sm:rounded-[10px] sm:px-2.5',
        active
          ? 'text-[color:var(--accent)] shadow-[var(--tabs-active-shadow)]'
          : 'border-transparent bg-transparent text-[color:var(--text-muted)] hover:border-[color:var(--line)] hover:bg-[color:var(--surface-soft)] hover:text-[color:var(--text-soft)]',
        disabled && 'cursor-not-allowed opacity-45 hover:translate-y-0 hover:border-[color:var(--line)] hover:text-[color:var(--text-muted)]',
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export function EmbedPanelButton({ onClick, label = 'Embed' }: { onClick: () => void; label?: string }) {
  return <ToolbarButton icon={<Code2 size={12} />} label={label} onClick={onClick} />;
}

export function AccentChip({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'blue' | 'purple' | 'amber';
}) {
  const tones = {
    neutral: {
      borderColor: 'var(--line)',
      background: 'var(--surface-soft)',
      color: 'var(--text-muted)',
    },
    blue: {
      borderColor: 'var(--accent-border)',
      background: 'var(--accent-muted)',
      color: 'var(--accent)',
    },
    purple: {
      borderColor: 'var(--accent-strong-border)',
      background: 'var(--accent-strong-muted)',
      color: 'var(--accent-strong)',
    },
    amber: {
      borderColor: 'var(--accent-neutral-border)',
      background: 'var(--accent-neutral-muted)',
      color: 'var(--accent-neutral)',
    },
  };
  return (
    <span
      style={tones[tone]}
      className="inline-flex items-center rounded-[999px] border px-2 py-1 text-[8px] uppercase tracking-[0.12em] sm:px-2.5 sm:text-[9px]"
    >
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
    <div className="dashboard-card rounded-[12px] px-3 py-2 text-xs">
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
