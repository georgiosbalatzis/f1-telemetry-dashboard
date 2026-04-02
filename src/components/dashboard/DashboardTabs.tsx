import { Activity, CircleDot, Flag, Map, Radio, Sun, TrendingDown, TrendingUp, Zap } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Tab } from './types';
import { cn } from './utils';

const TABS: { key: Tab; label: string; mobileLabel: string; icon: ReactNode }[] = [
  { key: 'telemetry', label: 'Telemetry', mobileLabel: 'Trace', icon: <Activity size={14} /> },
  { key: 'tires', label: 'Tyres & Strategy', mobileLabel: 'Tyres', icon: <CircleDot size={14} /> },
  { key: 'energy', label: 'DRS, Gears & RPM', mobileLabel: 'Energy', icon: <Zap size={14} /> },
  { key: 'trackmap', label: 'Track Map', mobileLabel: 'Map', icon: <Map size={14} /> },
  { key: 'positions', label: 'Race Positions', mobileLabel: 'Pos', icon: <TrendingDown size={14} /> },
  { key: 'intervals', label: 'Intervals', mobileLabel: 'Gap', icon: <TrendingUp size={14} /> },
  { key: 'radio', label: 'Team Radio', mobileLabel: 'Radio', icon: <Radio size={14} /> },
  { key: 'incidents', label: 'Race Control', mobileLabel: 'Race', icon: <Flag size={14} /> },
  { key: 'weather', label: 'Weather', mobileLabel: 'WX', icon: <Sun size={14} /> },
];

export function DashboardTabs({
  activeTab,
  onChange,
  embedMode = false,
}: {
  activeTab: Tab;
  onChange: (tab: Tab) => void;
  embedMode?: boolean;
}) {
  return (
    <div className="mb-5">
      {embedMode && (
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="text-[9px] uppercase tracking-[0.18em] text-[color:var(--text-dim)]">
            Views
          </div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-[color:var(--text-faint)]">
            Swipe to switch
          </div>
        </div>
      )}
      <div className={`dashboard-tabs-rail scrollbar-hide ${embedMode ? 'dashboard-tabs-rail-compact' : ''}`}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={cn(
              embedMode
                ? 'flex min-h-[38px] items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] transition-all duration-200'
                : 'flex min-h-[42px] items-center gap-2 whitespace-nowrap rounded-[7px] border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] transition-all duration-200 sm:min-h-[40px] sm:rounded-[8px] sm:px-3.5 sm:py-2',
              activeTab === tab.key
                ? 'border-[color:var(--accent-border)] bg-[color:var(--tabs-active)] text-[color:var(--accent)] shadow-[var(--tabs-active-shadow)]'
                : embedMode
                  ? 'border-[color:var(--line)] bg-[color:var(--surface-soft-2)] text-[color:var(--text-muted)] hover:border-[color:var(--line-strong)] hover:bg-[color:var(--surface-soft)] hover:text-[color:var(--text-soft)]'
                  : 'border-transparent text-[color:var(--text-muted)] hover:border-[color:var(--line)] hover:bg-[color:var(--surface-soft)] hover:text-[color:var(--text-soft)]',
            )}
          >
            {tab.icon}
            <span className="sm:hidden">{tab.mobileLabel}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
