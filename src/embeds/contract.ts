/** The publication boundary: JSON-only, bounded and independent of the dashboard runtime. */
import type { DashboardFilterSnapshot } from '../hooks/useDashboardFilters';

export const EMBED_PANEL_IDS = ['telemetry-speed-trace', 'telemetry-throttle-brake'] as const;
export type EmbedPanelId = typeof EMBED_PANEL_IDS[number];
export type FigureTheme = 'light' | 'dark';
export type FigureGuide = { progress: number; label: string };
export type FigureDriver = {
  number: number;
  fullName: string;
  acronym: string;
  teamColour: string;
  lineDash?: string;
  brakeDash: string;
};
export type FigurePoint = Record<string, number | null>;
type PlotData = { axis: 'progress' | 'sample'; drivers: FigureDriver[]; points: FigurePoint[]; guides: FigureGuide[] };
export type FigureData = (PlotData & { kind: 'speed' }) | (PlotData & { kind: 'pedals' });
export type PublicationScope = DashboardFilterSnapshot & { circuit: string; sessionKey: number; tab: 'telemetry' };
export type FigureImage = { svg: string; width: number; height: number };
export type FigureBundle = {
  schemaVersion: 1;
  panelId: EmbedPanelId;
  capturedAt: string;
  scope: PublicationScope;
  context: { grandPrix: string; session: string };
  editorial: { title: string; caption: string; description: string };
  provenance: {
    source: 'OpenF1';
    method: string;
    guideExplanation: string;
    partialAcknowledged: boolean;
    drivers: { driverNumber: number; status: 'complete' | 'missing'; sampleCount: number }[];
  };
  data: FigureData;
  images: Record<'narrowLight' | 'wideLight' | 'narrowDark' | 'wideDark', FigureImage>;
};
export type InteractiveFigurePayload = Omit<FigureBundle, 'images'>;

export const MAX_BUNDLE_BYTES = 5 * 1024 * 1024;
const MAX_POINTS = 4096;
const MAX_SVG_BYTES = 1024 * 1024;
const bytes = (text: string) => new TextEncoder().encode(text).length;

function fail(path: string): never { throw new Error(`Invalid telemetry publication: ${path}`); }
function object(value: unknown, keys: string[], path: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) fail(path);
  const result = value as Record<string, unknown>;
  if (Object.keys(result).some((key) => !keys.includes(key))) fail(`${path}: unexpected field`);
  return result;
}
function text(value: unknown, limit: number, path: string, allowEmpty = false): asserts value is string {
  // eslint-disable-next-line no-control-regex -- Publication text excludes controls except tab/newline/CR.
  if (typeof value !== 'string' || value.length > limit || (!allowEmpty && !value.trim()) || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) fail(path);
}
function integer(value: unknown, min: number, max: number, path: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < min || value > max) fail(path);
}
function array(value: unknown, min: number, max: number, path: string): asserts value is unknown[] {
  if (!Array.isArray(value) || value.length < min || value.length > max) fail(path);
}
function finite(value: unknown, min: number, max: number, path: string): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) fail(path);
}

export function isEmbedPanelId(value: unknown): value is EmbedPanelId {
  return EMBED_PANEL_IDS.includes(value as EmbedPanelId);
}

/** No time-dependent upper year bound: historical bundles must remain valid in future readers. */
export function validatePublicationScope(value: unknown): asserts value is PublicationScope {
  const scope = object(value, ['year', 'circuit', 'sessionKey', 'driverNums', 'lapNum', 'tab'], 'scope');
  integer(scope.year, 2023, 2100, 'scope.year');
  text(scope.circuit, 80, 'scope.circuit');
  if (!/^[A-Za-z0-9 ._'-]+$/.test(scope.circuit)) fail('scope.circuit');
  integer(scope.sessionKey, 1, Number.MAX_SAFE_INTEGER, 'scope.sessionKey');
  integer(scope.lapNum, 1, 200, 'scope.lapNum');
  if (scope.tab !== 'telemetry') fail('scope.tab: panel/tab mismatch');
  array(scope.driverNums, 1, 4, 'scope.driverNums');
  scope.driverNums.forEach((number) => integer(number, 1, 99, 'scope.driverNums'));
  if (new Set(scope.driverNums).size !== scope.driverNums.length) fail('scope.driverNums: duplicates');
}

/** Validates semantics and sizes. SVG XML allowlisting is additionally required by the article publisher (E06). */
export function validateFigureBundle(value: unknown): asserts value is FigureBundle {
  const root = object(value, ['schemaVersion', 'panelId', 'capturedAt', 'scope', 'context', 'editorial', 'provenance', 'data', 'images'], 'bundle');
  if (root.schemaVersion !== 1) fail('schemaVersion');
  if (!isEmbedPanelId(root.panelId)) fail('panelId');
  text(root.capturedAt, 40, 'capturedAt');
  if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(root.capturedAt)
      || !Number.isFinite(Date.parse(root.capturedAt)) || new Date(root.capturedAt).toISOString() !== root.capturedAt) fail('capturedAt');
  validatePublicationScope(root.scope);
  const scope = root.scope;
  const context = object(root.context, ['grandPrix', 'session'], 'context');
  text(context.grandPrix, 160, 'context.grandPrix');
  text(context.session, 100, 'context.session');
  const editorial = object(root.editorial, ['title', 'caption', 'description'], 'editorial');
  text(editorial.title, 160, 'editorial.title');
  text(editorial.caption, 2000, 'editorial.caption', true);
  text(editorial.description, 2000, 'editorial.description');

  const data = object(root.data, ['kind', 'axis', 'drivers', 'points', 'guides'], 'data');
  if (data.kind !== (root.panelId === 'telemetry-speed-trace' ? 'speed' : 'pedals')) fail('data.kind: panel mismatch');
  if (data.axis !== 'progress' && data.axis !== 'sample') fail('data.axis');
  array(data.drivers, 1, 4, 'data.drivers');
  const numbers = data.drivers.map((value, index) => {
    const driver = object(value, ['number', 'fullName', 'acronym', 'teamColour', 'lineDash', 'brakeDash'], 'data.drivers');
    if (driver.number !== scope.driverNums[index]) fail('data.drivers: scope order mismatch');
    text(driver.fullName, 100, 'driver.fullName');
    text(driver.acronym, 12, 'driver.acronym');
    text(driver.teamColour, 7, 'driver.teamColour');
    if (!/^#[a-f0-9]{6}$/i.test(driver.teamColour)) fail('driver.teamColour');
    for (const key of ['lineDash', 'brakeDash']) {
      if (key === 'lineDash' && driver[key] === undefined) continue;
      text(driver[key], 40, `driver.${key}`);
      if (!/^\d+(?: \d+)*$/.test(driver[key])) fail(`driver.${key}`);
    }
    return driver.number as number;
  });
  if (numbers.length !== root.scope.driverNums.length) fail('data.drivers: scope length mismatch');

  const provenance = object(root.provenance, ['source', 'method', 'guideExplanation', 'partialAcknowledged', 'drivers'], 'provenance');
  if (provenance.source !== 'OpenF1' || typeof provenance.partialAcknowledged !== 'boolean') fail('provenance');
  text(provenance.method, 500, 'provenance.method');
  text(provenance.guideExplanation, 500, 'provenance.guideExplanation', true);
  array(provenance.drivers, numbers.length, numbers.length, 'provenance.drivers');
  const statuses = provenance.drivers.map((value, index) => {
    const driver = object(value, ['driverNumber', 'status', 'sampleCount'], 'provenance.drivers');
    if (driver.driverNumber !== numbers[index]) fail('provenance.drivers: scope order mismatch');
    if (driver.status !== 'complete' && driver.status !== 'missing') fail('provenance.driver.status');
    integer(driver.sampleCount, 0, 100000, 'provenance.sampleCount');
    if ((driver.status === 'missing') !== (driver.sampleCount === 0)) fail('provenance.sampleCount: status mismatch');
    return driver.status;
  });
  if (statuses.includes('missing') && !provenance.partialAcknowledged) fail('provenance.partialAcknowledged');
  if (data.axis === 'sample' && statuses[0] !== 'complete') fail('data: sample axis requires primary driver');
  if (data.axis === 'sample' && statuses.slice(1).includes('complete')) fail('data: sample axis cannot represent multiple complete drivers');

  array(data.points, 2, MAX_POINTS, 'data.points');
  const x = data.axis === 'progress' ? 'progress' : 'idx';
  const channels = data.kind === 'speed' ? ['speed'] : ['throttle', 'brake'];
  const keys = data.axis === 'progress' ? channels.flatMap((channel) => numbers.map((number) => `${channel}_${number}`)) : channels;
  const seen = new Set<string>();
  let previous = -1;
  data.points.forEach((value) => {
    const point = object(value, [x, ...keys], 'data.points');
    finite(point[x], 0, data.axis === 'progress' ? 100 : 100000, `point.${x}`);
    if (point[x] < previous) fail('data.points: unordered axis');
    previous = point[x];
    if (data.axis === 'sample') integer(point[x], 0, 100000, 'point.idx');
    keys.forEach((key) => {
      if (point[key] === null || point[key] === undefined) return;
      finite(point[key], key.startsWith('brake') ? -105 : 0, key.startsWith('brake') ? 0 : data.kind === 'speed' ? 600 : 105, `point.${key}`);
      seen.add(key);
    });
  });
  if (!seen.size) fail('data.points: empty plot');
  numbers.forEach((number, index) => {
    if (data.axis === 'sample' && index > 0) return;
    const hasData = channels.some((channel) => seen.has(data.axis === 'sample' ? channel : `${channel}_${number}`));
    if (hasData !== (statuses[index] === 'complete')) fail('data.points: completeness mismatch');
  });
  array(data.guides, 0, 100, 'data.guides');
  if (data.axis === 'sample' && data.guides.length) fail('data.guides: sample axis');
  if (data.guides.length && !provenance.guideExplanation.trim()) fail('provenance.guideExplanation');
  data.guides.forEach((value) => {
    const guide = object(value, ['progress', 'label'], 'data.guides');
    finite(guide.progress, 0, 100, 'guide.progress');
    text(guide.label, 40, 'guide.label');
  });
  const images = object(root.images, ['narrowLight', 'wideLight', 'narrowDark', 'wideDark'], 'images');
  for (const key of ['narrowLight', 'wideLight', 'narrowDark', 'wideDark']) {
    const image = object(images[key], ['svg', 'width', 'height'], `images.${key}`);
    integer(image.width, 1, 4096, 'image.width');
    integer(image.height, 1, 4096, 'image.height');
    text(image.svg, MAX_SVG_BYTES, 'image.svg');
    if (bytes(image.svg) > MAX_SVG_BYTES || !/^<svg(?:\s|>)/.test(image.svg)) fail('image.svg');
  }
  if (bytes(JSON.stringify(value)) > MAX_BUNDLE_BYTES) fail('bundle: size limit');
}

/** Runtime payload uses the same strict schema checks while leaving four separately served SVGs out of the data request. */
export function validateInteractiveFigurePayload(value: unknown): asserts value is InteractiveFigurePayload {
  const root = object(value, ['schemaVersion', 'panelId', 'capturedAt', 'scope', 'context', 'editorial', 'provenance', 'data'], 'bundle');
  const placeholder = { svg: '<svg></svg>', width: 1, height: 1 };
  validateFigureBundle({ ...root, images: { narrowLight: placeholder, wideLight: placeholder, narrowDark: placeholder, wideDark: placeholder } });
}

export function parseFigureBundle(json: string): FigureBundle {
  if (bytes(json) > MAX_BUNDLE_BYTES) fail('bundle: size limit');
  const value: unknown = JSON.parse(json);
  validateFigureBundle(value);
  return value;
}

/** Validation precedes stringify so NaN/Infinity cannot silently become null. */
export function serializeFigureBundle(bundle: FigureBundle): string {
  validateFigureBundle(bundle);
  return JSON.stringify(bundle);
}
