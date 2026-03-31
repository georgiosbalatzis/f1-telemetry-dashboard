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
  driverNums: number[];
  driverMap: Record<number, OpenF1Driver>;
  stintsLoading: boolean;
  stintsByDriver: Record<number, OpenF1Stint[]>;
  pitsLoading: boolean;
  filteredPits: OpenF1Pit[];
};

export function StrategyTab({ driverNums, driverMap, stintsLoading, stintsByDriver, pitsLoading, filteredPits }: Props) {
  return (
    <>
      <Panel title="Tyre Strategy" icon={<CircleDot size={14} className="text-red-400" />}>
        {stintsLoading ? <Spinner label="Loading stint data…" /> : Object.keys(stintsByDriver).length > 0 ? (
          <div className="space-y-3">
            {(driverNums.length > 0 ? driverNums : Object.keys(stintsByDriver).map(Number).slice(0, 6)).map((driverNumber) => {
              const driver = driverMap[driverNumber];
              const driverStints = stintsByDriver[driverNumber];
              if (!driver || !driverStints?.length) return null;
              const maxLap = Math.max(...driverStints.map((stint) => stint.lap_end || 0), 1);
              return (
                <div key={driverNumber} className="flex items-center gap-4">
                  <div className="w-16 text-right"><span className="text-xs font-bold" style={{ color: `#${driver.team_colour}` }}>{driver.name_acronym}</span></div>
                  <div className="flex h-8 flex-1 overflow-hidden rounded-md bg-[#0d0d1a]">
                    {driverStints.map((stint, index) => {
                      const width = Math.max(3, ((stint.lap_end - stint.lap_start + 1) / maxLap) * 100);
                      const compound = (stint.compound || 'UNKNOWN').toUpperCase();
                      const color = COMPOUND_COLORS[compound] || COMPOUND_COLORS.UNKNOWN;
                      return (
                        <div
                          key={index}
                          className="flex h-full min-w-[24px] items-center justify-center border-r border-white/10 text-[10px] font-bold"
                          style={{ width: `${width}%`, backgroundColor: `${color}18`, color }}
                          title={`${compound}: Lap ${stint.lap_start}–${stint.lap_end}`}
                        >
                          {compound.charAt(0)}
                          <span className="ml-1 hidden opacity-40 sm:inline">{stint.lap_start}-{stint.lap_end}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="w-14 text-right text-[10px] text-gray-600">{driverStints.length} stint{driverStints.length > 1 ? 's' : ''}</div>
                </div>
              );
            })}
          </div>
        ) : <NoData msg="No stint data for this session. Stint data is typically available for race and sprint sessions." />}
      </Panel>

      <Panel title="Pit Stops" icon={<Timer size={14} className="text-amber-500" />}>
        {pitsLoading ? <Spinner /> : filteredPits.length > 0 ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filteredPits.map((pit, index) => {
              const driver = driverMap[pit.driver_number];
              return (
                <div key={index} className="rounded-lg bg-[#0d0d1a] p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: `#${driver?.team_colour || '888'}` }} />
                    <span className="text-xs font-bold" style={{ color: `#${driver?.team_colour || '888'}` }}>{driver?.name_acronym || `#${pit.driver_number}`}</span>
                  </div>
                  <div className="text-xl font-black font-mono text-white">{pit.stop_duration?.toFixed(1) || '—'}<span className="text-sm text-gray-500">s</span></div>
                  <div className="text-[10px] text-gray-600">Lap {pit.lap_number} · Pit lane: {pit.pit_duration?.toFixed(1)}s</div>
                </div>
              );
            })}
          </div>
        ) : <NoData msg="No pit stop data for this session." />}
      </Panel>
    </>
  );
}
