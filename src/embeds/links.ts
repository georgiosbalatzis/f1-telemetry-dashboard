import type { DashboardFilterSnapshot } from '../hooks/useDashboardFilters';
import { isEmbedPanelId, validatePublicationScope, type EmbedPanelId, type FigureTheme, type PublicationScope } from './contract';

type LinkOptions = { split?: boolean; embed?: boolean; theme?: FigureTheme; anchor?: string };

/** Pure builder; callers explicitly choose deployment base and anchor, never inherit the article hash. */
export function buildDashboardLink(baseUrl: string, snapshot: DashboardFilterSnapshot, options: LinkOptions = {}): string {
  const url = new URL(baseUrl);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('Invalid dashboard base URL');
  url.search = '';
  url.hash = '';
  url.searchParams.set('year', String(snapshot.year));
  if (snapshot.circuit) url.searchParams.set('circuit', snapshot.circuit);
  if (snapshot.sessionKey != null) url.searchParams.set('session', String(snapshot.sessionKey));
  if (snapshot.driverNums.length) url.searchParams.set('drivers', snapshot.driverNums.join(','));
  url.searchParams.set('lap', String(snapshot.lapNum));
  url.searchParams.set('tab', snapshot.tab);
  if (options.split) url.searchParams.set('layout', 'split');
  if (options.embed) url.searchParams.set('embed', '1');
  if (options.theme) url.searchParams.set('theme', options.theme);
  if (options.anchor) url.hash = options.anchor;
  return url.href;
}

export function buildFigureAnalysisLink(baseUrl: string, scope: PublicationScope, panelId: EmbedPanelId): string {
  validatePublicationScope(scope);
  if (!isEmbedPanelId(panelId)) throw new Error('Unsupported publication panel');
  return buildDashboardLink(baseUrl, scope, { anchor: panelId });
}

const LEGACY_BASES = [
  'https://georgiosbalatzis.github.io/f1-telemetry-dashboard/',
  'https://f1stories.gr/telemetry/',
  'https://www.f1stories.gr/telemetry/',
];

/** Exact origin/path allowlist. Whole-tab links preserve the need for an editorial panel choice. */
export function parseLegacyEmbedLink(input: string, allowedBases: readonly string[] = LEGACY_BASES): { scope: PublicationScope; panelId: EmbedPanelId | null } {
  const url = new URL(input.trim().replace(/&(?:amp|#0*38|#x0*26);/gi, '&'));
  if (url.username || url.password || !allowedBases.some((base) => {
    const allowed = new URL(base);
    return allowed.origin === url.origin && allowed.pathname === url.pathname;
  })) throw new Error('Untrusted telemetry link');
  const integer = (key: string) => {
    const value = url.searchParams.get(key);
    if (!value || !/^\d+$/.test(value)) throw new Error(`Invalid telemetry link ${key}`);
    return Number(value);
  };
  const drivers = url.searchParams.get('drivers');
  if (!drivers || !/^\d+(?:,\d+)*$/.test(drivers)) throw new Error('Invalid telemetry link drivers');
  for (const key of ['year', 'circuit', 'session', 'drivers', 'lap', 'tab']) {
    if (url.searchParams.getAll(key).length !== 1) throw new Error(`Ambiguous telemetry link ${key}`);
  }
  const scope = {
    year: integer('year'), circuit: url.searchParams.get('circuit'), sessionKey: integer('session'),
    driverNums: drivers.split(',').map(Number), lapNum: integer('lap'), tab: url.searchParams.get('tab'),
  };
  validatePublicationScope(scope);
  const panel = url.hash.slice(1);
  if (panel && !isEmbedPanelId(panel)) throw new Error('Unsupported telemetry panel');
  return { scope, panelId: isEmbedPanelId(panel) ? panel : null };
}
