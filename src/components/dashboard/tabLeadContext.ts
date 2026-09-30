import { createContext, type ReactNode } from 'react';
import type { Headline } from './headlines';

/** What the first ("lead") panel of a tab shows around its headline: the kicker line, the share/embed card bar and a data-driven headline that replaces the static title. */
export type TabLead = { kicker: string; cardBar: ReactNode; headline: Headline | null };
export const TabLeadContext = createContext<TabLead | null>(null);
