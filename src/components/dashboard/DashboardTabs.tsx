import { useEffect, useRef } from 'react';
import type { Tab } from './types';
import { TAB_LABELS } from './tabLabels';

const TABS: Tab[] = ['telemetry', 'energy', 'trackmap', 'positions', 'intervals', 'tires', 'radio', 'incidents', 'weather', 'broadcast'];

export function DashboardTabs({ activeTab, onChange }: {
  activeTab: Tab;
  onChange: (tab: Tab) => void;
  embedMode?: boolean;
  onShareTab?: (tab: Tab) => void;
  onEmbedTab?: (tab: Tab) => void;
}) {
  const strip = useRef<HTMLDivElement>(null);
  // On narrow screens the strip scrolls sideways: keep the active tab centred (no page scroll involved).
  // Tab widths depend on the loaded font, so centre again once fonts are ready; otherwise the final position
  // depends on whether the font arrived before this effect ran.
  useEffect(() => {
    const centre = () => {
      const el = strip.current;
      const active = el?.querySelector<HTMLElement>('[aria-current="page"]');
      if (el && active) el.scrollLeft = active.offsetLeft - (el.clientWidth - active.offsetWidth) / 2;
    };
    centre();
    let cancelled = false;
    void document.fonts?.ready.then(() => { if (!cancelled) centre(); });
    return () => { cancelled = true; };
  }, [activeTab]);

  return (
    <nav className="analysis-navigation" aria-label="Analysis views">
      <div className="tab-strip" ref={strip}>
        {TABS.map((tab) => <button key={tab} aria-current={activeTab === tab ? 'page' : undefined} aria-controls="analysis-content" onClick={() => onChange(tab)}>{TAB_LABELS[tab]}</button>)}
      </div>
    </nav>
  );
}
