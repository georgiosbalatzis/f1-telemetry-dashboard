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
  if (flag.includes('RED')) return 'bg-red-500/15 text-red-400';
  if (flag.includes('YELLOW')) return 'bg-yellow-500/15 text-yellow-400';
  if (flag.includes('GREEN')) return 'bg-emerald-500/15 text-emerald-400';
  if (flag.includes('BLUE')) return 'bg-blue-500/15 text-blue-400';
  if (flag === 'CHEQUERED') return 'bg-[color:var(--surface-soft)] text-[color:var(--text-strong)]';
  return 'bg-slate-500/15 text-slate-400';
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
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 filter-scroll-fade xl:mx-0 xl:flex-wrap xl:overflow-visible xl:px-0 xl:pb-0">
              {filters.map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={cn(
                    'shrink-0 rounded-[8px] border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] transition-colors',
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

          <div className="max-h-[620px] space-y-1 overflow-y-auto pr-2">
            {filteredMessages.map((message, index) => (
              <div key={index} className="grid gap-4 rounded-[12px] border-b border-[color:var(--line)] px-2 py-3 md:grid-cols-[90px_1fr]">
                <div className="text-[10px] uppercase tracking-[0.16em] text-[color:var(--text-dim)]">
                  {message.lap_number != null && <div className="mb-1 text-[color:var(--text-muted)]">L{message.lap_number}</div>}
                  <div className="font-mono">{new Date(message.date).toLocaleTimeString()}</div>
                </div>
                <div>
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    {message.flag && <span className={cn('rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.18em]', flagTone(message.flag))}>{message.flag}</span>}
                    <span className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--text-muted)]">{message.category}</span>
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
