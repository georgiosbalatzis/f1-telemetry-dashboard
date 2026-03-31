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

export function DashboardTabs({ activeTab, onChange }: { activeTab: Tab; onChange: (tab: Tab) => void }) {
  return (
    <div className="mb-6 border-b border-white/[0.06]">
      <div className="-mb-px flex gap-1 overflow-x-auto scrollbar-hide">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={cn(
              'flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide transition-all',
              activeTab === tab.key ? 'border-red-600 text-white' : 'border-transparent text-gray-600 hover:text-gray-400',
            )}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
