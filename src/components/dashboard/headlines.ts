import type { OpenF1Position, OpenF1Stint } from '../../api/openf1';
import type { GapCardData } from './gapCardData';
import type { DriverLapSummary, Tab } from './types';
import { fmtLap } from './utils';

export type Headline = { title: string; lede: string };

export type HeadlineContext = {
  lapNum: number;
  driverNums: number[];
  /** Surname shown in headlines, e.g. "Russell". */
  nameOf: (driverNumber: number) => string;
  summaries: DriverLapSummary[];
  gapCards: GapCardData[];
  stintsByDriver: Record<number, OpenF1Stint[]>;
  positions: OpenF1Position[] | null;
};

const PLACE = { slow: 'στις αργές στροφές', medium: 'στις μεσαίες στροφές', fast: 'στις ευθείες' } as const;
const TIE_S = 0.001;  // gaps under a millisecond read as a tie
const MIN_PART_S = 0.02; // a part of the lap only makes a headline above this
const MIN_SECTOR_S = 0.01;
const signed = (value: number) => `${value < 0 ? '−' : '+'}${Math.abs(value).toFixed(3)}`;

function lapHeadline(ctx: HeadlineContext): Headline | null {
  const card = ctx.gapCards[0];
  if (!card) return null;
  const ref = ctx.nameOf(card.referenceNumber);
  const target = ctx.nameOf(card.driverNumber);
  if (card.gap < TIE_S) {
    return { title: `Ισοπαλία στον γύρο ${ctx.lapNum}: ο ${ref} και ο ${target} στο ίδιο χιλιοστό`, lede: `Και οι δύο έκαναν ${fmtLap(card.lapTime)}.` };
  }
  const parts = card.splits ? (Object.entries(card.splits) as [keyof typeof PLACE, number][]) : [];
  const lost = parts.filter(([, value]) => value >= MIN_PART_S).sort((a, b) => b[1] - a[1])[0];
  const won = parts.filter(([, value]) => value <= -MIN_PART_S).sort((a, b) => a[1] - b[1])[0];
  const title = lost && won
    ? `Ο ${ref} κερδίζει ${PLACE[lost[0]]}, ο ${target} ${PLACE[won[0]]}`
    : `Ο ${ref} ήταν ταχύτερος κατά ${card.gap.toFixed(3)}s`;

  const lede = [`${ref} ${fmtLap(card.lapTime - card.gap)} έναντι ${target} ${fmtLap(card.lapTime)}.`];
  const decisive = card.sectors
    .map((value, index) => ({ sector: index + 1, value }))
    .filter((item): item is { sector: number; value: number } => item.value != null && Math.abs(item.value) >= MIN_SECTOR_S)
    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))[0];
  if (decisive) lede.push(`Το sector ${decisive.sector} έκρινε τον γύρο (${signed(decisive.value)}s).`);
  const refTop = ctx.summaries.find((summary) => summary.driverNumber === card.referenceNumber)?.topSpeed;
  if (refTop != null && card.topSpeed != null && Math.abs(refTop - card.topSpeed) >= 1) {
    const targetFaster = card.topSpeed > refTop;
    lede.push(`Ο ${targetFaster ? target : ref} έφτασε τα ${Math.round(Math.max(refTop, card.topSpeed))} km/h, ${Math.round(Math.abs(refTop - card.topSpeed))} περισσότερα.`);
  }
  return { title, lede: lede.join(' ') };
}

function strategyHeadline(ctx: HeadlineContext): Headline | null {
  const rows = ctx.driverNums.flatMap((driverNumber) => {
    const stints = [...(ctx.stintsByDriver[driverNumber] ?? [])].sort((a, b) => a.stint_number - b.stint_number);
    return stints.length ? [{ name: ctx.nameOf(driverNumber), stops: stints.length - 1, compounds: stints.map((stint) => stint.compound) }] : [];
  });
  if (rows.length === 0) return null;
  const times = (stops: number) => (stops === 1 ? '1 φορά' : `${stops} φορές`);
  const [first, ...others] = rows;
  const title = first.stops === 0 && others.length === 0
    ? `Ο ${first.name} έτρεξε χωρίς στάση`
    : `Ο ${first.name} σταμάτησε ${times(first.stops)}${others.map((row) => `, ο ${row.name} ${row.stops}`).join('')}`;
  return { title, lede: rows.map((row) => `${row.name}: ${row.compounds.join(' → ')}`).join(' · ') };
}

function positionsHeadline(ctx: HeadlineContext): Headline | null {
  const moves = ctx.driverNums.flatMap((driverNumber) => {
    const entries = (ctx.positions ?? []).filter((entry) => entry.driver_number === driverNumber).sort((a, b) => a.date.localeCompare(b.date));
    return entries.length > 1 ? [{ driverNumber, first: entries[0].position, last: entries[entries.length - 1].position }] : [];
  });
  const biggest = moves.sort((a, b) => Math.abs(b.first - b.last) - Math.abs(a.first - a.last))[0];
  if (!biggest || biggest.first === biggest.last) return null;
  const gained = biggest.first - biggest.last;
  const places = Math.abs(gained);
  return {
    title: `Ο ${ctx.nameOf(biggest.driverNumber)} ${gained > 0 ? 'κέρδισε' : 'έχασε'} ${places} ${places === 1 ? 'θέση' : 'θέσεις'} από την εκκίνηση`,
    lede: `Από τη θέση ${biggest.first} στη θέση ${biggest.last}.`,
  };
}

/** Rule-based headline for a tab's lead panel, or null when the data is too thin (the caller keeps its static title). */
export function buildHeadline(tab: Tab, ctx: HeadlineContext): Headline | null {
  if (tab === 'telemetry' || tab === 'broadcast') return lapHeadline(ctx);
  if (tab === 'tires') return strategyHeadline(ctx);
  if (tab === 'positions') return positionsHeadline(ctx);
  return null;
}
