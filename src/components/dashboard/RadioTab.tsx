import { useMemo } from 'react';
import { Headphones } from 'lucide-react';
import type { OpenF1TeamRadio } from '../../api/openf1';
import { useDriverContext } from '../../contexts/useDriverContext';
import { Err, NoData, Panel, Spinner } from './shared';

type Props = {
  loading: boolean;
  error: string | null;
  messages: OpenF1TeamRadio[];
  onRetry?: () => void;
};

export function RadioTab({ loading, error, messages, onRetry }: Props) {
  const { driverMap } = useDriverContext();
  const radioMessages = useMemo(
    () => messages.map((message, index) => {
      const driver = driverMap[message.driver_number];
      const teamColor = `#${driver?.team_colour || '888'}`;
      return {
        key: `${message.driver_number}-${message.date}-${index}`,
        driverLabel: driver?.name_acronym || `#${message.driver_number}`,
        teamColor,
        timeLabel: new Date(message.date).toLocaleTimeString(),
        recordingUrl: message.recording_url,
      };
    }),
    [driverMap, messages],
  );

  return (
    <Panel title="Team Radio Recordings" icon={<Headphones size={14} style={{ color: 'var(--accent)' }} />} sub="Click to listen to actual team radio recordings from the session">
      {loading ? <Spinner /> : error ? <Err msg={error} onAction={onRetry} /> : radioMessages.length > 0 ? (
        <div className="max-h-[500px] space-y-3 overflow-y-auto pr-2">
          {radioMessages.map((message) => (
            <div key={message.key} className="dashboard-card flex gap-3 rounded-[14px] p-3">
              <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: message.teamColor }} />
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="text-xs font-bold tracking-[0.2em]" style={{ color: message.teamColor }}>{message.driverLabel}</span>
                  <span className="rounded-full bg-[color:var(--surface-soft)] px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">{message.timeLabel}</span>
                </div>
                <a href={message.recordingUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-[10px] border border-[color:var(--accent-border)] bg-[color:var(--accent-muted)] px-3 py-2 text-xs uppercase tracking-[0.16em] text-[color:var(--accent)] transition-colors duration-200 hover:text-[color:var(--accent-hover)]">
                  <Headphones size={10} /> Play recording ↗
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : <NoData msg="No team radio recordings for this session/driver selection." />}
    </Panel>
  );
}
