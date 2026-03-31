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
    <Panel title="Team Radio Recordings" icon={<Headphones size={14} style={{ color: 'var(--accent)' }} />} sub="Click to listen to actual team radio recordings from the session">
      {loading ? <Spinner /> : error ? <Err msg={error} /> : messages.length > 0 ? (
        <div className="max-h-[500px] space-y-3 overflow-y-auto pr-2">
          {messages.map((message, index) => {
            const driver = driverMap[message.driver_number];
            return (
              <div key={index} className="dashboard-card flex gap-3 rounded-[14px] p-3">
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: `#${driver?.team_colour || '888'}` }} />
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="text-xs font-bold tracking-[0.2em]" style={{ color: `#${driver?.team_colour || '888'}` }}>{driver?.name_acronym || `#${message.driver_number}`}</span>
                    <span className="rounded-full bg-[color:var(--surface-soft)] px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">{new Date(message.date).toLocaleTimeString()}</span>
                  </div>
                  <a href={message.recording_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-[10px] border border-[color:var(--accent-border)] bg-[color:var(--accent-muted)] px-3 py-2 text-xs uppercase tracking-[0.16em] text-[color:var(--accent)] transition-colors duration-200 hover:text-[color:var(--accent-hover)]">
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
