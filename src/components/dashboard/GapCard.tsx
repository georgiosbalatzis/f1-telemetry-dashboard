import { copy } from '../../copy';
import type { GapCardData } from './gapCardData';
import { fmtLap } from './utils';

const signed = (value: number) => `${value < 0 ? '−' : '+'}${Math.abs(value).toFixed(3)}`;

/** Tech Desk card from f1stories.gr: always dark, in both themes. */
export function GapCard({ card, context }: { card: GapCardData; context: string }) {
  const parts = card.splits ? ([['slow', copy.gapCard.slow], ['medium', copy.gapCard.medium], ['fast', copy.gapCard.fast]] as const) : [];
  const widest = card.splits ? Math.max(...parts.map(([key]) => Math.abs((card.splits as NonNullable<typeof card.splits>)[key])), 0.001) : 1;
  return (
    <article className="gap-card" aria-label={`${copy.gapCard.label}: ${card.target}`}>
      <div className="gap-card-top"><span>{context}</span></div>
      <p className="gap-card-who">{copy.gapCard.who(card.target, card.reference)}</p>
      <p className="gap-card-gap"><span className="gap-card-sign" aria-hidden="true">+</span>{card.gap.toFixed(3)}<small>s</small></p>
      <p className="gap-card-sub">{copy.gapCard.sub(fmtLap(card.lapTime), card.topSpeed)}</p>
      <div className="gap-card-sectors">
        {card.sectors.map((value, index) => <div key={index}><span>S{index + 1}</span><b>{value == null ? '—' : signed(value)}</b></div>)}
      </div>
      {card.splits && (
        <div className="gap-card-bars">
          {parts.map(([key, label]) => {
            const value = (card.splits as NonNullable<typeof card.splits>)[key];
            return <div key={key}><span>{label}</span><i style={{ ['--w' as string]: `${(Math.abs(value) / widest) * 100}%` }} /><b>{signed(value)}</b></div>;
          })}
        </div>
      )}
      <p className="gap-card-source">{copy.gapCard.source}</p>
    </article>
  );
}
