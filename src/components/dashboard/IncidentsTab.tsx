import { Flag } from 'lucide-react';
import type { OpenF1RaceControl } from '../../api/openf1';
import { Err, NoData, Panel, Spinner } from './shared';
import { cn } from './utils';

type Props = {
  loading: boolean;
  error: string | null;
  messages: OpenF1RaceControl[];
};

export function IncidentsTab({ loading, error, messages }: Props) {
  return (
    <Panel title="Race Control Messages" icon={<Flag size={14} className="text-yellow-500" />} sub="Official flags, penalties, safety car, and session status messages">
      {loading ? <Spinner /> : error ? <Err msg={error} /> : messages.length > 0 ? (
        <div className="max-h-[600px] space-y-2 overflow-y-auto pr-2">
          {messages.map((message, index) => (
            <div key={index} className="flex gap-4 border-b border-white/[0.03] py-2 last:border-0">
              <div className="w-16 shrink-0 text-right">
                {message.lap_number != null && <div className="text-[10px] text-gray-500">Lap {message.lap_number}</div>}
                <div className="text-[10px] font-mono text-gray-700">{new Date(message.date).toLocaleTimeString()}</div>
              </div>
              <div className="flex-1">
                <div className="mb-1 flex items-center gap-2">
                  {message.flag && (
                    <span className={cn(
                      'rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase',
                      message.flag.includes('RED') && 'bg-red-500/15 text-red-400',
                      message.flag.includes('YELLOW') && 'bg-yellow-500/15 text-yellow-400',
                      message.flag.includes('GREEN') && 'bg-emerald-500/15 text-emerald-400',
                      message.flag.includes('BLUE') && 'bg-blue-500/15 text-blue-400',
                      message.flag === 'CHEQUERED' && 'bg-white/15 text-white',
                      !message.flag.match(/RED|YELLOW|GREEN|BLUE|CHEQUERED/) && 'bg-gray-500/15 text-gray-400',
                    )}>
                      {message.flag}
                    </span>
                  )}
                  <span className="text-[10px] uppercase text-gray-500">{message.category}</span>
                </div>
                <p className="text-xs text-gray-300">{message.message}</p>
              </div>
            </div>
          ))}
        </div>
      ) : <NoData msg="No race control messages for this session." />}
    </Panel>
  );
}
