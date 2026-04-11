/** SVG canvas dimensions for the track map. Chosen to preserve OpenF1 GPS coordinate aspect ratio. */
export const MAP_W = 600;
export const MAP_H = 380;
export const PADDING = 36;

export type SvgPoint = { nx: number; ny: number };

export function subsample<T>(arr: T[], max: number): T[] {
  if (arr.length <= max) return arr;
  const step = Math.ceil(arr.length / max);
  return arr.filter((_, i) => i % step === 0);
}

/**
 * Builds a GPS-to-SVG projection for the selected lap paths: it bounds all raw
 * OpenF1 x/y samples, scales them into the padded SVG viewport, centers the
 * fitted track, and flips the Y axis so the circuit renders in screen space.
 */
export function buildTransform(rawPoints: { x: number; y: number }[]): ((p: { x: number; y: number }) => SvgPoint) | null {
  if (rawPoints.length === 0) return null;
  const xs = rawPoints.map((p) => p.x);
  const ys = rawPoints.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;
  const scale = Math.min((MAP_W - PADDING * 2) / rangeX, (MAP_H - PADDING * 2) / rangeY);
  const offsetX = PADDING + ((MAP_W - PADDING * 2) - rangeX * scale) / 2;
  const offsetY = PADDING + ((MAP_H - PADDING * 2) - rangeY * scale) / 2;
  return (p: { x: number; y: number }) => ({
    nx: offsetX + (p.x - minX) * scale,
    ny: MAP_H - (offsetY + (p.y - minY) * scale), // flip Y axis
  });
}

export function toPolyline(pts: SvgPoint[]): string {
  return pts.map((p) => `${p.nx.toFixed(1)},${p.ny.toFixed(1)}`).join(' ');
}
