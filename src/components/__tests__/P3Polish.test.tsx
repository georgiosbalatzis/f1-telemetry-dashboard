import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { DashboardHeader } from '../dashboard/DashboardHeader';
import { ChartPanel } from '../dashboard/ChartPanel';
import { ChartTip } from '../dashboard/shared';
import { formatDrsState } from '../dashboard/chartAxis';

afterEach(cleanup);

it('P3-01: theme changes are announced off-screen without adding a visible status line', () => {
  const onToggleTheme = vi.fn();
  const noop = () => {};
  const { container } = render(
    <DashboardHeader
      loading={false} presetName="" presetNames={[]} feedback={null} splitMode={false} embedMode={false} themeMode="dark"
      embedTitle="Race" embedSubtitle="Telemetry" embedContext={[]} openDashboardUrl="/"
      onPresetNameChange={noop} onSavePreset={noop} onShare={noop} onEmbed={noop} onPrint={noop}
      onToggleSplit={noop} onToggleTheme={onToggleTheme} onBack={noop}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: 'Light theme' }));
  expect(onToggleTheme).toHaveBeenCalledOnce();
  expect(container.querySelector('.session-status')).toBeEmptyDOMElement();
  expect(screen.getByText('Light theme on')).toHaveClass('sr-only');
});

it('P3-02: tooltips show lap progress as %, DRS as a state and whole km/h like their axes', () => {
  const { rerender } = render(<ChartTip active label={39} labelPrefix="Lap progress · " labelSuffix="%" unit="km/h" payload={[{ name: 'VER', value: 287 }]} />);
  expect(screen.getByText('Lap progress · 39%')).toBeInTheDocument();
  expect(screen.getByText('287 km/h')).toBeInTheDocument();
  rerender(<ChartTip active label={40} unit="km/h" payload={[{ name: 'Δ', value: -0.3 }]} />);
  expect(screen.getByText('0 km/h')).toBeInTheDocument();
  rerender(<ChartTip active label={12} format={formatDrsState} payload={[{ name: 'VER', value: 0 }, { name: 'ANT', value: 1 }]} />);
  expect(screen.getByText('Closed')).toBeInTheDocument();
  expect(screen.getByText('Open')).toBeInTheDocument();
});

it('P3-04: chart action glyphs are 16px inside their 44px controls', () => {
  render(<ChartPanel title="Speed" exportName="speed" panelId="speed" onEmbedPanel={() => {}}><div /></ChartPanel>);
  for (const name of ['Embed', 'Download', 'Full Screen']) {
    expect(screen.getByRole('button', { name }).querySelector('svg')).toHaveAttribute('width', '16');
  }
});
