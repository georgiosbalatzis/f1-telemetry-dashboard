import { afterEach, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { DashboardHeader } from '../dashboard/DashboardHeader';
import { ChartPanel } from '../dashboard/ChartPanel';
import { ChartTip } from '../dashboard/shared';
import { formatDrsState } from '../dashboard/chartAxis';
import { SignalBand } from '../dashboard/SignalBand';
import { copy } from '../../copy';

afterEach(cleanup);

it('P3-01: theme changes are announced off-screen without adding a visible status line', () => {
  const onToggleTheme = vi.fn();
  const noop = () => {};
  render(
    <DashboardHeader
      loading={false} presetName="" presetNames={[]} feedback={null} splitMode={false} embedMode={false} themeMode="dark"
      embedTitle="Race" embedSubtitle="Telemetry" embedContext={[]} openDashboardUrl="/" heroSubtitle="Race · Γύρος 1" nextMeeting={null}
      onPresetNameChange={noop} onSavePreset={noop} onPrint={noop}
      onToggleSplit={noop} onToggleTheme={onToggleTheme} onBack={noop}
    />,
  );
  fireEvent.click(screen.getByRole('button', { name: copy.masthead.themeToLight }));
  expect(onToggleTheme).toHaveBeenCalledOnce();
  expect(screen.getByText(copy.masthead.themeOnLight)).toHaveClass('sr-only');
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
  for (const name of [copy.panel.embed, copy.panel.download, copy.panel.fullScreen]) {
    expect(screen.getByRole('button', { name }).querySelector('svg')).toHaveAttribute('width', '16');
  }
});

it('P1-03: the signal band carries loading and partial-data status, with a retry per failed driver', () => {
  const retry = vi.fn();
  const drivers = [
    { driverNumber: 1, name: 'VER', status: 'Loaded', retry: null },
    { driverNumber: 4, name: 'NOR', status: 'Lap request failed', retry },
  ];
  const { container, rerender } = render(<SignalBand loading={false} feedback={null} lapNum={49} totalLaps={51} drivers={[drivers[0]]} />);
  expect(container.querySelector('.session-status')).toBeEmptyDOMElement();
  expect(screen.getByText(copy.band.lap(49, 51))).toBeInTheDocument();
  rerender(<SignalBand loading={false} feedback={null} lapNum={49} totalLaps={51} drivers={drivers} />);
  expect(screen.getByText(copy.band.partial(1, 2), { exact: false })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: copy.band.retry('NOR') }));
  expect(retry).toHaveBeenCalledOnce();
  rerender(<SignalBand loading feedback={null} lapNum={49} totalLaps={51} drivers={[]} />);
  expect(screen.getByText(copy.band.loading)).toBeInTheDocument();
});

it('R2-02: the lap strip selects laps by click and arrow key, and labels safety-car and pit laps', async () => {
  const { LapStrip } = await import('../dashboard/LapStrip');
  const onSelect = vi.fn();
  const laps = [1, 2, 3, 4].map((lap_number) => ({ lap_number, lap_duration: 100 + lap_number, is_pit_out_lap: lap_number === 4 }));
  render(<LapStrip driverName="VER" laps={laps as never} safetyCar={new Set([2])} lapNum={2} onSelect={onSelect} />);
  expect(screen.getByRole('button', { name: /Γύρος 2, 1:42.0, Safety car/ })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByRole('button', { name: /Γύρος 3, 1:43.0, Pit stop/ })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Γύρος 4/ }));
  expect(onSelect).toHaveBeenLastCalledWith(4);
  fireEvent.keyDown(screen.getByRole('button', { name: /Γύρος 2/ }), { key: 'ArrowRight' });
  expect(onSelect).toHaveBeenLastCalledWith(3);
});
