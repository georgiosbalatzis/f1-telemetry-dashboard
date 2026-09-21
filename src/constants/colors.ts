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
