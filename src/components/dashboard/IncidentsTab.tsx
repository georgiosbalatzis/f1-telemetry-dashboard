import { useMemo, useState } from 'react';
import { Flag, Search } from 'lucide-react';
import type { OpenF1RaceControl } from '../../api/openf1';
import { Err, NoData, Panel, Spinner } from './shared';
import { cn } from './utils';

type Props = {
  loading: boolean;
  error: string | null;
  messages: OpenF1RaceControl[];
  onRetry?: () => void;
};

function flagTone(flag: string) {
  if (flag.includes('RED')) return 'flag-danger';
  if (flag.includes('YELLOW')) return 'flag-warning';
  if (flag.includes('GREEN')) return 'flag-success';
  if (flag.includes('BLUE')) return 'flag-blue';
  if (flag === 'CHEQUERED') return 'text-[color:var(--text-strong)]';
  return 'text-[color:var(--text-muted)]';
}

export function IncidentsTab({ loading, error, messages, onRetry }: Props) {
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');

  const filters = useMemo(() => {
    const unique = Array.from(new Set(messages.map((message) => message.flag).filter(Boolean))) as string[];
    return ['ALL', ...unique.slice(0, 6)];
  }, [messages]);

  const filteredMessages = useMemo(() => {
    return messages.filter((message) => {
      const matchesFilter = activeFilter === 'ALL' || message.flag === activeFilter;
      const haystack = `${message.category} ${message.message} ${message.flag || ''}`.toLowerCase();
      const matchesQuery = query.trim().length === 0 || haystack.includes(query.toLowerCase());
      return matchesFilter && matchesQuery;
    });
  }, [activeFilter, messages, query]);

  return (
    <Panel title="Race Control" icon={<Flag size={14} className="text-yellow-500" />} sub="Official flags, penalties, safety car, and session status messages">
      {loading ? <Spinner /> : error ? <Err msg={error} onAction={onRetry} /> : messages.length > 0 ? (
        <>
          <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative min-w-0 flex-1 xl:max-w-sm">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-dim)]" />
              <label htmlFor="incidents-search" className="sr-only">Search incidents</label>
              <input
                id="incidents-search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search race control"
                className="dashboard-input w-full py-2 pl-9 pr-3 text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <button
                  key={filter}
                  aria-pressed={activeFilter === filter}
                  onClick={() => setActiveFilter(filter)}
                  className={cn(
                    'shrink-0 rounded-[2px] border px-2.5 py-1 text-[10px] uppercase tracking-[0.06em] transition-colors',
                    activeFilter === filter
                      ? 'border-[color:var(--line-strong)] bg-[color:var(--surface-soft)] text-[color:var(--text-soft)]'
                      : 'border-[color:var(--line)] bg-[color:var(--surface-soft)] text-[color:var(--text-muted)] hover:text-[color:var(--text-soft)]',
                  )}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          <div className="race-event-list">
            {filteredMessages.map((message, index) => (
              <div key={index} className="race-event">
                <div className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--text-dim)]">
                  {message.lap_number != null && <div className="mb-1 text-[color:var(--text-muted)]">L{message.lap_number}</div>}
                  <div className="font-mono">{new Date(message.date).toLocaleTimeString()}</div>
                </div>
                <div>
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    {message.flag && <span className={cn('flag-label', flagTone(message.flag))}>{message.flag}</span>}
                    <span className="text-[10px] uppercase tracking-[0.06em] text-[color:var(--text-muted)]">{message.category}</span>
                  </div>
                  <p className="text-sm text-[color:var(--text-soft)]">{message.message}</p>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : <NoData msg="No race control messages for this session." />}
    </Panel>
  );
}
