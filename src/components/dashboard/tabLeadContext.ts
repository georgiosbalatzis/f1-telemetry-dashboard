import { createContext, type ReactNode } from 'react';

/** What the first ("lead") panel of a tab shows around its headline: the kicker line and the share/embed card bar. */
export type TabLead = { kicker: string; cardBar: ReactNode };
export const TabLeadContext = createContext<TabLead | null>(null);
