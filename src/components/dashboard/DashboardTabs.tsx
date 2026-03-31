import { Activity, CircleDot, Flag, Radio, Sun, Zap } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Tab } from './types';
import { cn } from './utils';

const TABS: { key: Tab; label: string; mobileLabel: string; icon: ReactNode }[] = [
  { key: 'telemetry', label: 'Telemetry', mobileLabel: 'Trace', icon: <Activity size={14} /> },
  { key: 'tires', label: 'Tyres & Strategy', mobileLabel: 'Tyres', icon: <CircleDot size={14} /> },
  { key: 'energy', label: 'DRS & Gears', mobileLabel: 'DRS', icon: <Zap size={14} /> },
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
    <div className={embedMode ? 'mb-3' : 'mb-4 sm:mb-5'}>
      <div className={`dashboard-tabs-rail scrollbar-hide ${embedMode ? 'dashboard-tabs-rail-compact' : ''}`}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={cn(
              embedMode
                ? 'flex min-h-[36px] items-center justify-center gap-1.5 rounded-[10px] border px-2.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.1em] transition-all duration-200'
                : 'flex min-h-[34px] items-center gap-1.5 whitespace-nowrap rounded-[9px] border px-2 py-1.5 text-[9px] font-semibold uppercase tracking-[0.14em] transition-all duration-200 sm:min-h-[38px] sm:rounded-[10px] sm:px-3 sm:py-2 sm:text-[10px] sm:tracking-[0.12em]',
              activeTab === tab.key
                ? 'border-[color:var(--accent-border)] bg-[color:var(--tabs-active)] text-[color:var(--accent)] shadow-[var(--tabs-active-shadow)]'
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
