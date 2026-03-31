import { Activity, CircleDot, Flag, Radio, Sun, Zap } from 'lucide-react';
import type { ReactNode } from 'react';
import type { Tab } from './types';
import { cn } from './utils';

const TABS: { key: Tab; label: string; icon: ReactNode }[] = [
  { key: 'telemetry', label: 'Telemetry', icon: <Activity size={14} /> },
  { key: 'tires', label: 'Tyres & Strategy', icon: <CircleDot size={14} /> },
  { key: 'energy', label: 'DRS & Gears', icon: <Zap size={14} /> },
  { key: 'radio', label: 'Team Radio', icon: <Radio size={14} /> },
  { key: 'incidents', label: 'Race Control', icon: <Flag size={14} /> },
  { key: 'weather', label: 'Weather', icon: <Sun size={14} /> },
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
    <div className={embedMode ? 'mb-4' : 'mb-6'}>
      <div className={`dashboard-tabs-rail scrollbar-hide ${embedMode ? 'dashboard-tabs-rail-compact' : ''}`}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={cn(
              embedMode
                ? 'flex min-h-[40px] items-center justify-center gap-1.5 rounded-[12px] border px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] transition-all duration-200'
                : 'flex items-center gap-1.5 whitespace-nowrap rounded-[14px] border px-3 py-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] transition-all duration-200 sm:px-3.5 sm:text-[11px]',
              activeTab === tab.key
                ? 'border-[color:var(--accent-border)] bg-[color:var(--tabs-active)] text-white shadow-[var(--tabs-active-shadow)]'
                : 'border-transparent text-[color:var(--text-muted)] hover:border-[color:var(--line)] hover:bg-[color:var(--surface-soft)] hover:text-[color:var(--text-soft)]',
            )}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
