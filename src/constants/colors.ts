export const COLORS = {
  fallback: {
    exportText: '#f2eee4',
    exportBackground: '#181a1c',
    iframeLight: '#f2eee4',
    iframeDark: '#181a1c',
  },
  driverFallback: 'var(--color-driver-fallback)',
  mutedDot: 'var(--color-muted-dot)',
  danger: 'var(--color-danger)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  weather: {
    air: 'var(--color-weather-air)',
    track: 'var(--color-weather-track)',
    humidity: 'var(--color-weather-humidity)',
    wind: 'var(--color-weather-wind)',
  },
  sector: {
    fastest: 'var(--color-sector-fastest)',
    fastestBg: 'var(--color-sector-fastest-bg)',
    fastestBgSoft: 'var(--color-sector-fastest-bg-soft)',
    second: 'var(--color-sector-second)',
    secondBg: 'var(--color-sector-second-bg)',
    slower: 'var(--color-sector-slower)',
    slowerBg: 'var(--color-sector-slower-bg)',
    three: 'var(--color-sector-three)',
  },
  compound: {
    SOFT: 'var(--color-compound-soft)',
    MEDIUM: 'var(--color-compound-medium)',
    HARD: 'var(--color-compound-hard)',
    INTERMEDIATE: 'var(--color-compound-intermediate)',
    WET: 'var(--color-compound-wet)',
    UNKNOWN: 'var(--color-compound-unknown)',
    HYPERSOFT: 'var(--color-compound-hypersoft)',
    ULTRASOFT: 'var(--color-compound-ultrasoft)',
    SUPERSOFT: 'var(--color-compound-supersoft)',
    TEST_UNKNOWN: 'var(--color-compound-unknown)',
  },
} as const;

export function withAlpha(color: string, percent: number) {
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
}

export function teamColor(teamColour?: string | null) {
  const normalized = teamColour?.trim().replace(/^#/, '');
  return normalized ? `#${normalized}` : COLORS.driverFallback;
}

const LIGHT_CHART_BACKGROUND: [number, number, number] = [0xf2, 0xee, 0xe4];
// WCAG 1.4.11 non-text contrast for graphical objects such as chart traces.
const MIN_TRACE_CONTRAST = 3;

function parseHex(color: string): [number, number, number] | null {
  const hex = color.trim().replace(/^#/, '');
  const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
  if (!/^[0-9a-f]{6}$/i.test(full)) return null;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16)) as [number, number, number];
}

function relativeLuminance([r, g, b]: [number, number, number]) {
  const [lr, lg, lb] = [r, g, b].map((channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
}

export function contrastRatio(foreground: string, background: string) {
  const fg = parseHex(foreground);
  const bg = parseHex(background);
  if (!fg || !bg) return null;
  const [light, dark] = [relativeLuminance(fg), relativeLuminance(bg)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

/**
 * Darkens a raw team colour just enough to keep a chart trace visible on the light
 * theme's cream surface. Dark-theme and non-hex colours are returned unchanged.
 */
export function chartColorForTheme(color: string, themeMode: 'dark' | 'light') {
  const rgb = parseHex(color);
  if (themeMode !== 'light' || !rgb) return color;
  const background = relativeLuminance(LIGHT_CHART_BACKGROUND);
  for (let keep = 1; keep > 0; keep -= 0.05) {
    const mixed = rgb.map((channel) => Math.round(channel * keep)) as [number, number, number];
    if ((background + 0.05) / (relativeLuminance(mixed) + 0.05) >= MIN_TRACE_CONTRAST) {
      return `#${mixed.map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
    }
  }
  return '#000000';
}
