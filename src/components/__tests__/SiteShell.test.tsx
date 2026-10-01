import { afterEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, within } from '@testing-library/react';
import { DashboardHeader } from '../dashboard/DashboardHeader';
import { SiteFooter } from '../dashboard/SiteFooter';
import { copy } from '../../copy';

afterEach(() => { cleanup(); vi.useRealTimers(); });

it('keeps canonical destinations and Data as the sole current item in both menus', () => {
  const noop = () => {};
  const { container } = render(<DashboardHeader
    presetName="" presetNames={[]} splitMode={false} embedMode={false} themeMode="light"
    openDashboardUrl="/" heroSubtitle="Monza · Γύρος 52" nextMeeting={null}
    onPresetNameChange={noop} onSavePreset={noop} onPrint={noop}
    onToggleSplit={noop} onToggleTheme={noop} onBack={noop}
  />);
  const destinations = [
    ['Αρχική', 'https://f1stories.gr/'],
    ['Άρθρα', 'https://f1stories.gr/blog-module/blog/index.html'],
    ['YouTube', 'https://www.youtube.com/@f1_stories_original'],
    ['Βαθμολογία', 'https://f1stories.gr/standings/'],
    ['Δεδομένα', 'https://f1stories.gr/standings/?tab=tyre-pace'],
    ['Συντάκτες', 'https://f1stories.gr/authors/'],
    ['BetCast', 'https://georgiosbalatzis.github.io/BetCastVisualisation/'],
  ];
  for (const selector of ['.site-nav-links', '.nav-mobile-panel']) {
    const menu = container.querySelector(selector)!;
    expect([...menu.querySelectorAll('a')].map(a => [a.textContent, a.getAttribute('href')])).toEqual(destinations);
    expect([...menu.querySelectorAll('[aria-current]')].map(a => [a.textContent, a.getAttribute('aria-current')])).toEqual([['Δεδομένα', 'page']]);
    for (const link of menu.querySelectorAll('[target="_blank"]')) expect(link).toHaveAttribute('rel', 'noopener');
  }
  expect(container.querySelector('h1')).toHaveTextContent('Telemetry.');
  expect(container.querySelector('.kicker-row')).toHaveTextContent('F1 Stories / Race Desk');
  const mobile = container.querySelector<HTMLDetailsElement>('.nav-mobile')!;
  mobile.open = true;
  const summary = mobile.querySelector('summary')!;
  expect(summary).toHaveAttribute('aria-controls', 'site-mobile-links');
  fireEvent.keyDown(within(mobile).getByText('Δεδομένα'), { key: 'Escape' });
  expect(mobile.open).toBe(false);
  expect(summary).toHaveFocus();
  mobile.open = true;
  fireEvent.click(within(mobile).getByText('YouTube'));
  expect(mobile.open).toBe(false);
});

it('retains the live countdown update and hides an elapsed meeting', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-10-01T00:00:00Z'));
  const noop = () => {};
  const { container } = render(<DashboardHeader
    presetName="" presetNames={[]} splitMode={false} embedMode={false} themeMode="dark"
    openDashboardUrl="/" heroSubtitle="Race" nextMeeting={{ name: 'Grand Prix', start: Date.now() + 120_000 }}
    onPresetNameChange={noop} onSavePreset={noop} onPrint={noop}
    onToggleSplit={noop} onToggleTheme={noop} onBack={noop}
  />);
  expect(container.querySelector('.nav-countdown-time')).toHaveTextContent('2m');
  act(() => vi.advanceTimersByTime(60_000));
  expect(container.querySelector('.nav-countdown-time')).toHaveTextContent('1m');
  act(() => vi.advanceTimersByTime(60_000));
  expect(container.querySelector('.nav-countdown')).toBeNull();
});

it('keeps F1 Stories footer hierarchy, legal destinations and product attribution', () => {
  const { container } = render(<SiteFooter />);
  const footer = container.querySelector('footer')!;
  expect(within(footer).getByRole('link', { name: copy.masthead.homeAria })).toHaveAttribute('href', 'https://f1stories.gr/');
  expect(within(footer).getByRole('navigation', { name: 'Ενότητες' })).toHaveTextContent('ΆρθραΒαθμολογίαΣυντάκτεςYouTube ↗BetCast ↗');
  expect(within(footer).getByRole('link', { name: 'Πολιτική Απορρήτου' })).toHaveAttribute('href', 'https://f1stories.gr/privacy/privacy.html');
  expect(within(footer).getByRole('link', { name: 'Όροι Χρήσης' })).toHaveAttribute('href', 'https://f1stories.gr/privacy/terms.html');
  expect(within(footer).getByRole('link', { name: /Δεδομένα από OpenF1/ })).toHaveAttribute('href', 'https://openf1.org/');
  expect(container.querySelectorAll('.colophon-social a')).toHaveLength(5);
  expect(within(footer).getByRole('link', { name: 'Email στο F1 Stories' })).toHaveAttribute('href', 'mailto:myf1stories@gmail.com');
  for (const link of footer.querySelectorAll('[target="_blank"]')) expect(link.getAttribute('rel')).toMatch(/noopener|noreferrer/);
  expect(footer).toHaveTextContent(`© ${new Date().getFullYear()} F1 Stories.`);
  expect(footer).not.toHaveTextContent('TELEMETRY');
});
