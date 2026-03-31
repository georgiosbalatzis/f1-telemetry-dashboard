import { CircleDot, Timer } from 'lucide-react';
import type { OpenF1Driver, OpenF1Pit, OpenF1Stint } from '../../api/openf1';
import { NoData, Panel, Spinner } from './shared';

const COMPOUND_COLORS: Record<string, string> = {
  SOFT: '#FF3333',
  MEDIUM: '#FFC300',
  HARD: '#EEEEEE',
  INTERMEDIATE: '#43B02A',
  WET: '#0067AD',
  UNKNOWN: '#888',
  HYPERSOFT: '#FF69B4',
  ULTRASOFT: '#C800FF',
  SUPERSOFT: '#FF3333',
  TEST_UNKNOWN: '#888',
};

type Props = {
  lapNum: number;
  driverNums: number[];
  driverMap: Record<number, OpenF1Driver>;
  stintsLoading: boolean;
  stintsByDriver: Record<number, OpenF1Stint[]>;
  pitsLoading: boolean;
  filteredPits: OpenF1Pit[];
};

export function StrategyTab({ lapNum, driverNums, driverMap, stintsLoading, stintsByDriver, pitsLoading, filteredPits }: Props) {
  return (
    <>
      <Panel title="Tyre Strategy" icon={<CircleDot size={14} className="text-red-400" />} sub={`Stint map through lap ${lapNum}`}>
        {stintsLoading ? <Spinner label="Loading stint data…" /> : Object.keys(stintsByDriver).length > 0 ? (
          <div className="space-y-3">
            {(driverNums.length > 0 ? driverNums : Object.keys(stintsByDriver).map(Number).slice(0, 6)).map((driverNumber) => {
              const driver = driverMap[driverNumber];
              const driverStints = stintsByDriver[driverNumber];
              if (!driver || !driverStints?.length) return null;
              const maxLap = Math.max(...driverStints.map((stint) => stint.lap_end || 0), 1);
              return (
                <div key={driverNumber} className="grid gap-2 sm:grid-cols-[64px_1fr_56px] sm:items-center sm:gap-4">
                  <div className="flex items-center justify-between sm:block sm:text-right"><span className="text-xs font-bold tracking-[0.2em]" style={{ color: `#${driver.team_colour}` }}>{driver.name_acronym}</span></div>
                  <div className="dashboard-card flex h-9 flex-1 overflow-hidden rounded-[12px]">
                    {driverStints.map((stint, index) => {
                      const width = Math.max(3, ((stint.lap_end - stint.lap_start + 1) / maxLap) * 100);
                      const compound = (stint.compound || 'UNKNOWN').toUpperCase();
                      const color = COMPOUND_COLORS[compound] || COMPOUND_COLORS.UNKNOWN;
                      return (
                        <div
                          key={index}
                          className="flex h-full min-w-[24px] items-center justify-center border-r border-[color:var(--line-strong)] text-[10px] font-bold"
                          style={{ width: `${width}%`, backgroundColor: `${color}18`, color }}
                          title={`${compound}: Lap ${stint.lap_start}–${stint.lap_end}`}
                        >
                          {compound.charAt(0)}
                          <span className="ml-1 hidden opacity-40 sm:inline">{stint.lap_start}-{stint.lap_end}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-right text-[10px] uppercase tracking-[0.16em] text-[color:var(--text-muted)]">{driverStints.length} stint{driverStints.length > 1 ? 's' : ''}</div>
                </div>
              );
            })}
          </div>
        ) : <NoData msg="No stint data for this session. Stint data is typically available for race and sprint sessions." />}
      </Panel>

      <Panel title="Tyre Life Projection" icon={<CircleDot size={14} className="text-cyan-400" />} sub="Current stint context at the focused lap">
        {Object.keys(stintsByDriver).length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {(driverNums.length > 0 ? driverNums : Object.keys(stintsByDriver).map(Number).slice(0, 4)).map((driverNumber) => {
              const driver = driverMap[driverNumber];
              const activeStint = stintsByDriver[driverNumber]?.find((stint) => lapNum >= stint.lap_start && lapNum <= stint.lap_end);
              if (!driver || !activeStint) return null;
              const remaining = Math.max(0, activeStint.lap_end - lapNum);
              const compound = (activeStint.compound || 'UNKNOWN').toUpperCase();
              const color = COMPOUND_COLORS[compound] || COMPOUND_COLORS.UNKNOWN;
              return (
                <div key={driverNumber} className="dashboard-card rounded-[16px] p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-black tracking-[0.2em]" style={{ color: `#${driver.team_colour}` }}>{driver.name_acronym}</span>
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.18em]" style={{ backgroundColor: `${color}1c`, color }}>{compound}</span>
                  </div>
                  <div className="mb-3 text-3xl font-black text-emerald-300">{remaining}</div>
                  <div className="grid grid-cols-3 gap-3 text-[10px] uppercase tracking-[0.16em] text-[color:var(--text-muted)]">
                    <div>
                      <div className="mb-1 text-[color:var(--text-dim)]">Laps Left</div>
                      <div className="font-mono text-[color:var(--text-soft)]">{remaining}</div>
                    </div>
                    <div>
                      <div className="mb-1 text-[color:var(--text-dim)]">Stint Age</div>
                      <div className="font-mono text-[color:var(--text-soft)]">{lapNum - activeStint.lap_start + 1}</div>
                    </div>
                    <div>
                      <div className="mb-1 text-[color:var(--text-dim)]">Stop Est.</div>
                      <div className="font-mono text-[color:var(--text-soft)]">L{activeStint.lap_end}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : <NoData msg="No active stint context available for this lap." />}
      </Panel>

      <Panel title="Pit Stops" icon={<Timer size={14} className="text-amber-500" />} sub="Ordered by stationary time">
        {pitsLoading ? <Spinner /> : filteredPits.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filteredPits.map((pit, index) => {
              const driver = driverMap[pit.driver_number];
              return (
                <div key={index} className="dashboard-card rounded-[16px] p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: `#${driver?.team_colour || '888'}` }} />
                    <span className="text-xs font-bold tracking-[0.2em]" style={{ color: `#${driver?.team_colour || '888'}` }}>{driver?.name_acronym || `#${pit.driver_number}`}</span>
                  </div>
                  <div className="text-xl font-black font-mono text-[color:var(--text-strong)]">{pit.stop_duration?.toFixed(1) || '—'}<span className="text-sm text-[color:var(--text-muted)]">s</span></div>
                  <div className="text-[10px] uppercase tracking-[0.15em] text-[color:var(--text-muted)]">Lap {pit.lap_number} · Pit lane: {pit.pit_duration?.toFixed(1)}s</div>
                </div>
              );
            })}
          </div>
        ) : <NoData msg="No pit stop data for this session." />}
      </Panel>
    </>
  );
}
