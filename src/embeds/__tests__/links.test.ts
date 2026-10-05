import { describe, expect, it } from 'vitest';
import { parseFigureBundle } from '../contract';
import { buildDashboardLink, buildFigureAnalysisLink, parseLegacyEmbedLink } from '../links';
import fixture from './fixtures/publication-v1.json';

const { scope } = parseFigureBundle(JSON.stringify(fixture));
const legacy = 'https://georgiosbalatzis.github.io/f1-telemetry-dashboard/';

describe('explicit deployment links', () => {
  it.each([legacy, 'https://f1stories.gr/telemetry/'])('round-trips scope and panel under %s', (base) => {
    const link = buildFigureAnalysisLink(base, scope, 'telemetry-speed-trace');
    expect(parseLegacyEmbedLink(link)).toEqual({ scope, panelId: 'telemetry-speed-trace' });
    expect(new URL(link).searchParams.has('embed')).toBe(false);
  });

  it('preserves legacy layout/theme, clears unrelated base state, and deliberately selects the anchor', () => {
    const link = new URL(buildDashboardLink(legacy + '?unrelated=x#article', scope, { split: true, embed: true, theme: 'dark' }));
    expect(link.hash).toBe('');
    expect(link.searchParams.get('layout')).toBe('split');
    expect(link.searchParams.get('theme')).toBe('dark');
    expect(link.searchParams.get('unrelated')).toBeNull();
    expect(parseLegacyEmbedLink(link.href).panelId).toBeNull();
  });

  it('normalizes legacy whitespace and HTML entity encoding', () => {
    const link = buildFigureAnalysisLink(legacy, scope, 'telemetry-throttle-brake');
    expect(parseLegacyEmbedLink('  ' + link.replace(/&/g, '&amp;') + ' ')).toEqual({ scope, panelId: 'telemetry-throttle-brake' });
  });

  it.each([
    'https://georgiosbalatzis.github.io.evil.test/f1-telemetry-dashboard/',
    'https://georgiosbalatzis.github.io/ghostcar/',
    'https://georgiosbalatzis.github.io/f1-telemetry-dashboard/extra',
    'https://user@georgiosbalatzis.github.io/f1-telemetry-dashboard/',
    'http://georgiosbalatzis.github.io/f1-telemetry-dashboard/',
  ])('rejects an untrusted origin/path: %s', (base) => {
    expect(() => parseLegacyEmbedLink(base + '?year=2025&circuit=Monza&session=9912&drivers=1,4&lap=52&tab=telemetry')).toThrow();
  });

  it('rejects ambiguous, automatic and unsupported publication selections', () => {
    const link = buildFigureAnalysisLink(legacy, scope, 'telemetry-speed-trace');
    expect(() => parseLegacyEmbedLink(link.replace('&lap=52', '&lap=52&lap=53'))).toThrow(/Ambiguous/);
    expect(() => parseLegacyEmbedLink(link.replace('&session=9912', ''))).toThrow();
    expect(() => parseLegacyEmbedLink(link.replace('tab=telemetry', 'tab=radio'))).toThrow(/mismatch/);
    expect(() => parseLegacyEmbedLink(link.replace('#telemetry-speed-trace', '#unknown'))).toThrow(/Unsupported/);
    expect(() => buildDashboardLink('javascript:alert(1)', scope)).toThrow();
  });
});
