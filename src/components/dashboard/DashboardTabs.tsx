import type { Tab } from './types';
import { TAB_LABELS } from './tabLabels';

const GROUPS: { label: string; tabs: Tab[] }[] = [
  { label: 'Performance', tabs: ['telemetry', 'energy', 'trackmap'] },
  { label: 'Race', tabs: ['positions', 'intervals', 'tires'] },
  { label: 'Context', tabs: ['radio', 'incidents', 'weather', 'broadcast'] },
];

export function DashboardTabs({ activeTab, onChange, onShareTab, onEmbedTab }: {
  activeTab: Tab;
  onChange: (tab: Tab) => void;
  embedMode?: boolean;
  onShareTab?: (tab: Tab) => void;
  onEmbedTab?: (tab: Tab) => void;
}) {
  return (
    <nav className="analysis-navigation" aria-label="Analysis views">
      <label className="mobile-analysis-selector"><span className="section-label">Analysis</span>
        <select className="dashboard-select" value={activeTab} onChange={(event) => onChange(event.target.value as Tab)}>
          {GROUPS.map((group) => <optgroup key={group.label} label={group.label}>{group.tabs.map((tab) => <option key={tab} value={tab}>{TAB_LABELS[tab]}</option>)}</optgroup>)}
        </select>
      </label>
      <div className="analysis-groups">
        {GROUPS.map((group) => <div className="analysis-group" key={group.label}>
          <span className="section-label">{group.label}</span>
          <div>{group.tabs.map((tab) => <button key={tab} aria-current={activeTab === tab ? 'page' : undefined} aria-controls="analysis-content" onClick={() => onChange(tab)}>{TAB_LABELS[tab]}</button>)}</div>
        </div>)}
      </div>
      <div className="view-actions">
        {onShareTab && <button className="text-action" onClick={() => onShareTab(activeTab)}>Share view</button>}
        {onEmbedTab && <button className="text-action" onClick={() => onEmbedTab(activeTab)}>Embed view</button>}
      </div>
    </nav>
  );
}
