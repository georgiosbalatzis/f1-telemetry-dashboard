import { Headphones } from 'lucide-react';
import type { OpenF1Driver, OpenF1TeamRadio } from '../../api/openf1';
import { Err, NoData, Panel, Spinner } from './shared';

type Props = {
  loading: boolean;
  error: string | null;
  messages: OpenF1TeamRadio[];
  driverMap: Record<number, OpenF1Driver>;
};

export function RadioTab({ loading, error, messages, driverMap }: Props) {
  return (
    <Panel title="Team Radio Recordings" icon={<Headphones size={14} className="text-cyan-400" />} sub="Click to listen to actual team radio recordings from the session">
      {loading ? <Spinner /> : error ? <Err msg={error} /> : messages.length > 0 ? (
        <div className="max-h-[500px] space-y-2 overflow-y-auto pr-2">
          {messages.map((message, index) => {
            const driver = driverMap[message.driver_number];
            return (
              <div key={index} className="flex gap-3 border-b border-white/[0.03] py-2 last:border-0">
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: `#${driver?.team_colour || '888'}` }} />
                <div className="flex-1">
                  <div className="mb-0.5 flex items-center gap-2">
                    <span className="text-xs font-bold" style={{ color: `#${driver?.team_colour || '888'}` }}>{driver?.name_acronym || `#${message.driver_number}`}</span>
                    <span className="text-[10px] font-mono text-gray-700">{new Date(message.date).toLocaleTimeString()}</span>
                  </div>
                  <a href={message.recording_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-cyan-400 underline underline-offset-2 hover:text-cyan-300">
                    <Headphones size={10} /> Play recording ↗
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      ) : <NoData msg="No team radio recordings for this session/driver selection." />}
    </Panel>
  );
}
