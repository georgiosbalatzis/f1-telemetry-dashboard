import { Code2, Share2 } from 'lucide-react';
import { copy } from '../../copy';

/** "Καρτέλα …" bar under a tab's lead: share or embed the whole tab (season, GP, session, lap, drivers). */
export function CardBar({ tabLabel, onShare, onEmbed }: { tabLabel: string; onShare: () => void; onEmbed: () => void }) {
  return (
    <div className="card-bar" role="group" aria-label={copy.cardBar.title(tabLabel)}>
      <div><b>{copy.cardBar.title(tabLabel)}</b><small>{copy.cardBar.caption}</small></div>
      <div className="card-bar-actions">
        <button type="button" onClick={onShare}><Share2 size={15} aria-hidden="true" />{copy.cardBar.share}</button>
        <button type="button" onClick={onEmbed}><Code2 size={15} aria-hidden="true" />{copy.cardBar.embed}</button>
      </div>
    </div>
  );
}
