import { useMemo } from 'react';
import { CircleDot, Timer } from 'lucide-react';
import type { OpenF1Pit, OpenF1Stint } from '../../api/openf1';
import { COLORS, teamColor, withAlpha } from '../../constants/colors';
import { useDriverContext } from '../../contexts/useDriverContext';
import { CardGridSkeleton, EmbedPanelButton, NoData, Panel, TableSkeleton } from './shared';

const COMPOUND_COLORS: Record<string, string> = {
  ...COLORS.compound,
};

type Props = {
  lapNum: number;
  stintsLoading: boolean;
  stintsByDriver: Record<number, OpenF1Stint[]>;
  pitsLoading: boolean;
  filteredPits: OpenF1Pit[];
  embedMode?: boolean;
  onEmbedPanel?: (panelId: string) => void;
};

type StrategyRow = {
  driverNumber: number;
  acronym: string;
  teamColor: string;
  stintCount: number;
  segments: Array<{
    key: string;
    width: number;
    color: string;
    compound: string;
    title: string;
    rangeLabel: string;
  }>;
};

type TyreLifeCard = {
  driverNumber: number;
  acronym: string;
  teamColor: string;
  compound: string;
  compoundColor: string;
  remaining: number;
  stintAge: number;
  stopEstimate: number;
};

type PitStopCard = {
  key: string;
  acronym: string;
  teamColor: string;
  stopDuration: string;
  pitLaneDuration: string;
  lapNumber: number;
};

export function StrategyTab({ lapNum, stintsLoading, stintsByDriver, pitsLoading, filteredPits, embedMode = false, onEmbedPanel }: Props) {
  const { driverNums, driverMap } = useDriverContext();
  const fallbackDriverNums = useMemo(() => Object.keys(stintsByDriver).map(Number), [stintsByDriver]);
  const strategyDriverNums = useMemo(
    () => (driverNums.length > 0 ? driverNums : fallbackDriverNums.slice(0, 6)),
    [driverNums, fallbackDriverNums],
  );
  const tyreLifeDriverNums = useMemo(
    () => (driverNums.length > 0 ? driverNums : fallbackDriverNums.slice(0, 4)),
    [driverNums, fallbackDriverNums],
  );
  const strategyRows = useMemo<StrategyRow[]>(
    () => strategyDriverNums
      .map((driverNumber) => {
        const driver = driverMap[driverNumber];
        const driverStints = stintsByDriver[driverNumber];
        if (!driver || !driverStints?.length) return null;

        const maxLap = Math.max(...driverStints.map((stint) => stint.lap_end || 0), 1);
        return {
          driverNumber,
          acronym: driver.name_acronym,
          teamColor: teamColor(driver.team_colour),
          stintCount: driverStints.length,
          segments: driverStints.map((stint, index) => {
            const compound = (stint.compound || 'UNKNOWN').toUpperCase();
            const color = COMPOUND_COLORS[compound] || COMPOUND_COLORS.UNKNOWN;
            return {
              key: `${driverNumber}-${index}`,
              width: Math.max(3, ((stint.lap_end - stint.lap_start + 1) / maxLap) * 100),
              color,
              compound,
              title: `${compound}: Lap ${stint.lap_start}-${stint.lap_end}`,
              rangeLabel: `${stint.lap_start}-${stint.lap_end}`,
            };
          }),
        };
      })
      .filter((row): row is StrategyRow => row != null),
    [driverMap, strategyDriverNums, stintsByDriver],
  );
  const tyreLifeCards = useMemo<TyreLifeCard[]>(
    () => tyreLifeDriverNums
      .map((driverNumber) => {
        const driver = driverMap[driverNumber];
        const activeStint = stintsByDriver[driverNumber]?.find((stint) => lapNum >= stint.lap_start && lapNum <= stint.lap_end);
        if (!driver || !activeStint) return null;

        const compound = (activeStint.compound || 'UNKNOWN').toUpperCase();
        return {
          driverNumber,
          acronym: driver.name_acronym,
          teamColor: teamColor(driver.team_colour),
          compound,
          compoundColor: COMPOUND_COLORS[compound] || COMPOUND_COLORS.UNKNOWN,
          remaining: Math.max(0, activeStint.lap_end - lapNum),
          stintAge: lapNum - activeStint.lap_start + 1,
          stopEstimate: activeStint.lap_end,
        };
      })
      .filter((card): card is TyreLifeCard => card != null),
    [driverMap, lapNum, stintsByDriver, tyreLifeDriverNums],
  );
  const pitStopCards = useMemo<PitStopCard[]>(
    () => filteredPits.map((pit, index) => {
      const driver = driverMap[pit.driver_number];
      const pitTeamColor = teamColor(driver?.team_colour);
      return {
        key: `${pit.driver_number}-${pit.lap_number}-${pit.date}-${index}`,
        acronym: driver?.name_acronym || `#${pit.driver_number}`,
        teamColor: pitTeamColor,
        stopDuration: pit.stop_duration?.toFixed(1) || '—',
        pitLaneDuration: pit.pit_duration?.toFixed(1) || '—',
        lapNumber: pit.lap_number,
      };
    }),
    [driverMap, filteredPits],
  );

  return (
    <>
      <Panel
        title="Tyre Strategy"
        icon={<CircleDot size={14} style={{ color: 'var(--accent)' }} />}
        sub={`Stint map through lap ${lapNum}`}
        panelId="strategy-tyre-strategy"
        headerRight={embedMode && onEmbedPanel ? <EmbedPanelButton onClick={() => onEmbedPanel('strategy-tyre-strategy')} /> : undefined}
      >
        {stintsLoading ? <TableSkeleton rows={6} label="Loading stint data…" /> : strategyRows.length > 0 ? (
          <div className="space-y-3">
            {strategyRows.map((row) => (
              <div key={row.driverNumber} className="grid gap-2 sm:grid-cols-[64px_1fr_56px] sm:items-center sm:gap-4">
                <div className="flex items-center justify-between sm:block sm:text-right"><span className="text-xs font-bold tracking-[0.2em]" style={{ color: row.teamColor }}>{row.acronym}</span></div>
                <div className="dashboard-card flex h-9 flex-1 overflow-hidden rounded-[12px]">
                  {row.segments.map((segment) => (
                    <div
                      key={segment.key}
                      className="flex h-full min-w-[24px] items-center justify-center border-r border-[color:var(--line-strong)] text-[10px] font-bold"
                      style={{ width: `${segment.width}%`, backgroundColor: withAlpha(segment.color, 9), color: segment.color }}
                      title={segment.title}
                    >
                      {segment.compound.charAt(0)}
                      <span className="ml-1 hidden opacity-40 sm:inline">{segment.rangeLabel}</span>
                    </div>
                  ))}
                </div>
                <div className="text-right text-[10px] uppercase tracking-[0.16em] text-[color:var(--text-muted)]">{row.stintCount} stint{row.stintCount > 1 ? 's' : ''}</div>
              </div>
            ))}
          </div>
        ) : <NoData msg="No stint data for this session. Stint data is typically available for race and sprint sessions." />}
      </Panel>

      <Panel title="Tyre Life Projection" icon={<CircleDot size={14} style={{ color: 'var(--accent-strong)' }} />} sub="Current stint context at the focused lap">
        {stintsLoading ? <CardGridSkeleton count={4} label="Loading tyre life projections..." /> : tyreLifeCards.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {tyreLifeCards.map((card) => (
              <div key={card.driverNumber} className="dashboard-card rounded-[16px] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-black tracking-[0.2em]" style={{ color: card.teamColor }}>{card.acronym}</span>
                  <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ backgroundColor: withAlpha(card.compoundColor, 11), color: card.compoundColor }}>{card.compound}</span>
                </div>
                <div className="mb-3 text-3xl font-black text-emerald-300">{card.remaining}</div>
                <div className="grid grid-cols-3 gap-3 text-[10px] uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
                  <div>
                    <div className="mb-1 text-[color:var(--text-dim)]">Laps Left</div>
                    <div className="font-mono text-[color:var(--text-soft)]">{card.remaining}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-[color:var(--text-dim)]">Stint Age</div>
                    <div className="font-mono text-[color:var(--text-soft)]">{card.stintAge}</div>
                  </div>
                  <div>
                    <div className="mb-1 text-[color:var(--text-dim)]">Stop Est.</div>
                    <div className="font-mono text-[color:var(--text-soft)]">L{card.stopEstimate}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : <NoData msg="No active stint context available for this lap." />}
      </Panel>

      <Panel title="Pit Stops" icon={<Timer size={14} style={{ color: 'var(--accent)' }} />} sub="Ordered by stationary time">
        {pitsLoading ? <CardGridSkeleton count={4} label="Loading pit stops..." /> : pitStopCards.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {pitStopCards.map((card) => (
              <div key={card.key} className="dashboard-card rounded-[16px] p-3">
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: card.teamColor }} />
                  <span className="text-xs font-bold tracking-[0.2em]" style={{ color: card.teamColor }}>{card.acronym}</span>
                </div>
                <div className="text-xl font-black font-mono text-[color:var(--text-strong)]">{card.stopDuration}<span className="text-sm text-[color:var(--text-muted)]">s</span></div>
                <div className="text-[10px] uppercase tracking-[0.15em] text-[color:var(--text-muted)]">Lap {card.lapNumber} · Pit lane: {card.pitLaneDuration}s</div>
              </div>
            ))}
          </div>
        ) : <NoData msg="No pit stop data for this session." />}
      </Panel>
    </>
  );
}
