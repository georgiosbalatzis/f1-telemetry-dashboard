import { copy } from '../../copy';
import type { Tab } from './types';
import { TAB_LABELS } from './tabLabels';

const ORDER: Tab[] = ['telemetry', 'energy', 'trackmap', 'positions', 'intervals', 'tires', 'radio', 'incidents', 'weather', 'broadcast'];

/** The five views that follow the current one (wrapping round), like the quick links on the site's homepage. */
export function NextViews({ activeTab, onChange }: { activeTab: Tab; onChange: (tab: Tab) => void }) {
  const start = ORDER.indexOf(activeTab);
  const next = Array.from({ length: 5 }, (_, offset) => ORDER[(start + 1 + offset) % ORDER.length]);
  const open = (tab: Tab) => {
    onChange(tab);
    document.querySelector('.analysis-navigation')?.scrollIntoView?.({ block: 'start' });
  };
  return (
    <nav className="next-views" aria-label={copy.next.label}>
      {next.map((tab, index) => (
        <button key={tab} type="button" onClick={() => open(tab)}>
          <span className="next-num">{String(index + 1).padStart(2, '0')}</span>
          <b>{TAB_LABELS[tab]}</b>
          <small>{copy.next.hints[tab]}</small>
        </button>
      ))}
    </nav>
  );
}
