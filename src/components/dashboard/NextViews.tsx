import { copy } from '../../copy';
import type { Tab } from './types';
import { TAB_LABELS, TAB_ORDER } from './tabLabels';

/** The five views that follow the current one (wrapping round), like the quick links on the site's homepage. */
export function NextViews({ activeTab, onChange }: { activeTab: Tab; onChange: (tab: Tab) => void }) {
  const start = TAB_ORDER.indexOf(activeTab);
  const next = Array.from({ length: 5 }, (_, offset) => TAB_ORDER[(start + 1 + offset) % TAB_ORDER.length]);
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
