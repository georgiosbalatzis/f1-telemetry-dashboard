import { act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import saved from './fixtures/publication-v1.json';
import { mount } from '../interactive-entry';
const payload: Record<string, unknown> = structuredClone(saved);
delete payload.images;

describe('interactive publication renderer', () => {
  it('mounts isolated, accessible figures and fully releases each shadow root', async () => {
    const beforeUrl = window.location.href;
    const beforeTheme = document.documentElement.getAttribute('data-theme');
    const first = document.createElement('div'); const second = document.createElement('div');
    document.body.append(first, second);
    first.getBoundingClientRect = () => ({ width: 560 } as DOMRect);
    second.getBoundingClientRect = () => ({ width: 700 } as DOMRect);
    let a!: ReturnType<typeof mount>; let b!: ReturnType<typeof mount>;
    await act(async () => { a = mount(first, payload, { theme: 'light' }); b = mount(second, payload, { theme: 'dark' }); });
    const aShadow = first.shadowRoot!; const bShadow = second.shadowRoot!;
    expect(aShadow.querySelector('svg.recharts-surface')).toHaveAttribute('width', '560');
    expect(bShadow.querySelector('svg.recharts-surface')).toHaveAttribute('width', '700');
    expect(aShadow.querySelector('section')).toHaveAttribute('data-theme', 'light');
    expect(bShadow.querySelector('section')).toHaveAttribute('data-theme', 'dark');
    expect(aShadow.querySelector('input[type=range]')).toHaveAttribute('aria-valuetext');
    expect(aShadow.querySelector('details table tbody tr')).toBeTruthy();
    await act(async () => { a.setTheme('dark'); });
    expect(aShadow.querySelector('section')).toHaveAttribute('data-theme', 'dark');
    expect(window.location.href).toBe(beforeUrl);
    expect(document.documentElement.getAttribute('data-theme')).toBe(beforeTheme);
    await act(async () => { a.unmount(); b.unmount(); });
    expect(aShadow.childElementCount).toBe(0);
    expect(bShadow.childElementCount).toBe(0);
    first.remove(); second.remove();
  });
});
