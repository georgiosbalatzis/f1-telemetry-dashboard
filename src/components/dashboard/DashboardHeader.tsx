import { Code2, Columns2, ExternalLink, Loader2, MoonStar, Printer, Save, Share2, SunMedium, Undo2 } from 'lucide-react';
import { ToolbarButton } from './shared';

const f1StoriesLogo = `${import.meta.env.BASE_URL}logo192.png`;

type EmbedContextChip = {
  label: string;
  value: string;
};

type Props = {
  loading: boolean;
  presetName: string;
  presetNames: string[];
  feedback: string | null;
  splitMode: boolean;
  embedMode: boolean;
  themeMode: 'dark' | 'light';
  embedTitle: string;
  embedSubtitle: string;
  embedContext: EmbedContextChip[];
  openDashboardUrl: string;
  onPresetNameChange: (value: string) => void;
  onSavePreset: () => void;
  onShare: () => void;
  onEmbed: () => void;
  onPrint: () => void;
  onToggleSplit: () => void;
  onToggleTheme: () => void;
  onBack: () => void;
};

export function DashboardHeader({
  loading,
  presetName,
  presetNames,
  feedback,
  splitMode,
  embedMode,
  themeMode,
  embedTitle,
  embedSubtitle,
  embedContext,
  openDashboardUrl,
  onPresetNameChange,
  onSavePreset,
  onShare,
  onEmbed,
  onPrint,
  onToggleSplit,
  onToggleTheme,
  onBack,
}: Props) {
  if (embedMode) {
    return (
      <header className="pb-4 pt-3">
        <div className="dashboard-embed-shell rounded-[24px] px-4 py-3.5 sm:px-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <img
                src={f1StoriesLogo}
                alt="f1stories.gr"
                className="h-12 w-12 shrink-0 rounded-[14px] object-cover shadow-[0_14px_30px_-22px_rgba(15,23,42,0.4)]"
              />
              <div className="min-w-0">
                <div className="text-[9px] font-semibold uppercase tracking-[0.28em] text-[color:var(--accent)]">
                  f1stories.gr embedded telemetry
                </div>
                <div className="mt-1 truncate text-lg font-black tracking-[-0.03em] text-[color:var(--text-strong)]" style={{ fontFamily: "'Orbitron', system-ui" }}>
                  {embedTitle}
                </div>
                <div className="mt-1 text-[12px] leading-5 text-[color:var(--text-muted)]">
                  {embedSubtitle}
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  {embedContext.map((chip) => (
                    <span key={`${chip.label}-${chip.value}`} className="dashboard-embed-chip rounded-full px-2.5 py-1 text-[9px] uppercase tracking-[0.16em]">
                      <span className="text-[color:var(--text-dim)]">{chip.label}</span>{' '}
                      <span className="text-[color:var(--text-soft)]">{chip.value}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <a
                href={openDashboardUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-9 items-center gap-2 rounded-full border border-[color:var(--line)] bg-[color:var(--surface-soft-2)] px-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-soft)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[color:var(--line-strong)] hover:bg-[color:var(--surface-soft)]"
              >
                Open Full
                <ExternalLink size={12} />
              </a>
              {loading ? (
                <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--accent-border)] bg-[color:var(--accent-muted)] px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-[color:var(--accent)]">
                  <Loader2 size={12} className="animate-spin" />
                  Syncing
                </span>
              ) : feedback ? (
                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-emerald-400">
                  {feedback}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className={embedMode ? 'pb-4 pt-4 sm:pt-5' : 'pb-6 pt-8'}>
      <div className="mb-6 flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="mb-2 ml-[19px] text-[10px] font-semibold uppercase tracking-[0.34em] text-[color:var(--accent)]">
            f1stories.gr telemetry desk
          </div>
          <div className="mb-1 flex items-center gap-3">
            <div className="h-10 w-1.5 rounded-full bg-[linear-gradient(180deg,var(--accent),var(--accent-strong))]" />
            <h1 className="text-2xl font-black tracking-[-0.04em] text-[color:var(--text-strong)] min-[380px]:text-3xl sm:text-5xl" style={{ fontFamily: "'Orbitron', system-ui" }}>
              F1 TELEMETRY
            </h1>
          </div>
          <div className="ml-[19px] mt-2 max-w-2xl text-sm leading-6 text-[color:var(--text-muted)]">
            Lap-by-lap comparisons, strategy context, weather trend lines, and embed-ready session coverage.
          </div>
          <div className="ml-[19px] mt-3 flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-[color:var(--accent-border)] bg-[color:var(--accent-muted)] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.24em] text-[color:var(--accent)]">
              f1stories.gr edition
            </span>
            <p className="text-[10px] uppercase tracking-[0.38em] text-[color:var(--text-dim)]">Powered by OpenF1</p>
            {embedMode && (
              <span className="rounded-full border border-[color:var(--accent-strong-border)] bg-[color:var(--accent-strong-muted)] px-2 py-0.5 text-[9px] uppercase tracking-[0.24em] text-[color:var(--accent-strong)]">
                Embed Mode
              </span>
            )}
          </div>
          {!embedMode && (
            <div className="mt-5 flex max-w-2xl flex-col gap-3 sm:mt-6 sm:flex-row sm:items-center">
              <input
                list="dashboard-preset-names"
                value={presetName}
                onChange={(event) => onPresetNameChange(event.target.value)}
                placeholder="Save as preset..."
                className="dashboard-input w-full flex-1 px-4 py-2.5 text-sm"
              />
              <datalist id="dashboard-preset-names">
                {presetNames.map((name) => <option key={name} value={name} />)}
              </datalist>
              <button
                type="button"
                onClick={onSavePreset}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[999px] border border-[color:var(--line)] bg-[color:var(--surface-soft-2)] px-4 text-[10px] uppercase tracking-[0.18em] text-[color:var(--text-muted)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[color:var(--line-strong)] hover:bg-[color:var(--surface-soft)] hover:text-[color:var(--text-soft)] sm:w-auto"
              >
                <Save size={12} />
                Save
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col items-start gap-3 xl:items-end">
          <a
            href="https://f1stories.gr"
            target="_blank"
            rel="noreferrer"
            className="dashboard-brand-card group inline-flex w-full max-w-full items-center gap-4 rounded-[24px] px-4 py-3.5 transition-transform duration-200 hover:-translate-y-0.5 xl:w-[360px]"
          >
            <img
              src={f1StoriesLogo}
              alt="f1stories.gr"
              className="h-16 w-16 shrink-0 rounded-[18px] object-cover shadow-[0_18px_40px_-24px_rgba(15,23,42,0.48)]"
            />
            <div className="min-w-0">
              <div className="text-[9px] uppercase tracking-[0.3em] text-[color:var(--accent)]">Editorial Partner</div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="truncate text-base font-black uppercase tracking-[0.16em] text-[color:var(--text-strong)]" style={{ fontFamily: "'Orbitron', system-ui" }}>
                  f1stories
                </span>
                <span className="text-sm font-bold uppercase tracking-[0.18em] text-[color:var(--accent)]">.gr</span>
              </div>
              <div className="mt-1 text-[12px] leading-5 text-[color:var(--text-muted)] transition-colors group-hover:text-[color:var(--text-soft)]">
                Editorial race coverage, data analysis, and embeddable motorsport tools.
              </div>
            </div>
          </a>
          {!embedMode && (
            <div className="dashboard-tabs-rail w-full xl:w-auto xl:max-w-[440px] xl:flex-wrap xl:justify-end xl:overflow-visible">
              <ToolbarButton icon={<Undo2 size={12} />} label="Back" onClick={onBack} />
              <ToolbarButton icon={<Share2 size={12} />} label="Share" onClick={onShare} />
              <ToolbarButton icon={<Code2 size={12} />} label="Embed" onClick={onEmbed} />
              <ToolbarButton
                icon={themeMode === 'light' ? <SunMedium size={12} /> : <MoonStar size={12} />}
                label={themeMode === 'light' ? 'Light' : 'Dark'}
                onClick={onToggleTheme}
                active={themeMode === 'light'}
              />
              <ToolbarButton icon={<Printer size={12} />} label="Print" onClick={onPrint} />
              <ToolbarButton icon={<Columns2 size={12} />} label="Split" onClick={onToggleSplit} active={splitMode} />
            </div>
          )}
          {loading ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--accent-border)] bg-[color:var(--accent-muted)] px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-[color:var(--accent)]"><Loader2 size={12} className="animate-spin" /> Syncing live sector data</span>
          ) : feedback ? (
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-emerald-400">{feedback}</span>
          ) : null}
        </div>
      </div>
    </header>
  );
}
