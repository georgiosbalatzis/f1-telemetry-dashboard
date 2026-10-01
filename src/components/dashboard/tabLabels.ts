import { copy } from '../../copy';
import type { Tab } from './types';

/** The tabs in display order: the tab strip, the "next views" row and URL validation all use this one list. */
export const TAB_ORDER: Tab[] = ['telemetry', 'energy', 'trackmap', 'positions', 'intervals', 'tires', 'radio', 'incidents', 'weather', 'broadcast'];

export const TAB_LABELS: Record<Tab, string> = copy.tabs;
