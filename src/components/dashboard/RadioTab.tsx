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
        <div className="radio-list">
          {radioMessages.map((message) => (
            <article key={message.key} className="radio-entry">
              <div><strong><i className="driver-marker" style={{ background: message.teamColor }} />{message.driverLabel}</strong><time>{message.timeLabel}</time></div>
              <a href={message.recordingUrl} target="_blank" rel="noopener noreferrer" aria-label={`Listen to ${message.driverLabel} at ${message.timeLabel}`}>Listen to recording ↗</a>
            </article>
          ))}
        </div>
      ) : <NoData msg="No team radio recordings for this session/driver selection." />}
    </Panel>
  );
}
