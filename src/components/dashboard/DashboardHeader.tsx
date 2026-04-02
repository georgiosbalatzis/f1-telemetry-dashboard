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
      <header className="pb-3 pt-2.5">
        <div className="dashboard-embed-shell rounded-[18px] px-3.5 py-3 sm:px-4">
          <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <img
                src={f1StoriesLogo}
                alt="f1stories.gr"
                className="h-10 w-10 shrink-0 rounded-[10px] object-cover shadow-[0_8px_18px_-16px_rgba(15,23,42,0.3)]"
              />
              <div className="min-w-0">
                <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)]">
                  f1stories.gr embedded telemetry
                </div>
                <div className="mt-1 truncate text-base font-black tracking-[-0.02em] text-[color:var(--text-strong)]" style={{ fontFamily: "'Orbitron', system-ui" }}>
                  {embedTitle}
                </div>
                <div className="mt-1 text-[11px] leading-[1.45] text-[color:var(--text-muted)]">
                  {embedSubtitle}
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {embedContext.map((chip) => (
                    <span key={`${chip.label}-${chip.value}`} className="dashboard-embed-chip rounded-full px-2.5 py-1 text-[9px] uppercase tracking-[0.12em]">
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
                className="inline-flex h-8 items-center gap-2 rounded-full border border-[color:var(--line)] bg-[color:var(--surface-soft-2)] px-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[color:var(--text-soft)] transition-all duration-200 hover:border-[color:var(--line-strong)] hover:bg-[color:var(--surface-soft)]"
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
    <header className={embedMode ? 'pb-5 pt-5 sm:pt-6' : 'pb-5 pt-5 sm:pb-6 sm:pt-7'}>
      <div className="mb-4 flex flex-col gap-3 sm:gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0">
          <div className="mb-2 hidden text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--accent)] sm:block">
            f1stories.gr telemetry desk
          </div>
          <div className="flex items-start gap-3">
            <img
              src={f1StoriesLogo}
              alt="f1stories.gr"
              className="h-10 w-10 shrink-0 rounded-[12px] object-cover shadow-[0_8px_18px_-16px_rgba(15,23,42,0.24)] sm:hidden"
            />
            <div className="min-w-0">
              <div className="mb-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-[color:var(--accent)] sm:hidden">
                f1stories.gr telemetry
              </div>
              <div className="mb-1 flex items-center gap-2 sm:gap-2.5">
                <div className="hidden h-2 w-2 rounded-full bg-[color:var(--accent)] sm:block" />
                <h1 className="text-xl font-black tracking-[-0.03em] text-[color:var(--text-strong)] min-[380px]:text-2xl sm:text-4xl" style={{ fontFamily: "'Orbitron', system-ui" }}>
                  F1 TELEMETRY
                </h1>
              </div>
              <div className="text-[11px] leading-[1.45] text-[color:var(--text-muted)] sm:hidden">
                Minimal lap comparisons, strategy context, and clean session switching.
              </div>
            </div>
          </div>
          <div className="mt-2 hidden max-w-xl text-sm leading-[1.5] text-[color:var(--text-muted)] sm:block">
            Lap-by-lap comparisons, strategy context, weather trend lines, and embed-ready session coverage.
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:mt-3 sm:gap-2">
            <span className="rounded-full border border-[color:var(--accent-border)] bg-[color:var(--accent-muted)] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-[color:var(--accent)]">
              f1stories.gr edition
            </span>
            <p className="hidden text-[10px] uppercase tracking-[0.18em] text-[color:var(--text-dim)] sm:block">Powered by OpenF1</p>
            {embedMode && (
              <span className="rounded-full border border-[color:var(--accent-strong-border)] bg-[color:var(--accent-strong-muted)] px-2 py-0.5 text-[9px] uppercase tracking-[0.12em] text-[color:var(--accent-strong)]">
                Embed Mode
              </span>
            )}
          </div>
          {!embedMode && (
            <div className="mt-3 flex max-w-xl flex-col gap-2 sm:mt-4 sm:flex-row sm:items-center sm:gap-2.5">
              <input
                list="dashboard-preset-names"
                value={presetName}
                onChange={(event) => onPresetNameChange(event.target.value)}
                placeholder="Save as preset..."
                className="dashboard-input w-full flex-1 px-3 py-2 text-sm"
              />
              <datalist id="dashboard-preset-names">
                {presetNames.map((name) => <option key={name} value={name} />)}
              </datalist>
              <button
                type="button"
                onClick={onSavePreset}
                className="inline-flex h-8 w-full items-center justify-center gap-2 rounded-[999px] border border-[color:var(--line)] bg-[color:var(--surface-soft-2)] px-3 text-[10px] uppercase tracking-[0.12em] text-[color:var(--text-muted)] transition-all duration-200 hover:border-[color:var(--line-strong)] hover:bg-[color:var(--surface-soft)] hover:text-[color:var(--text-soft)] sm:h-9 sm:w-auto sm:px-3.5"
              >
                <Save size={12} />
                <span className="hidden sm:inline">Save</span>
                <span className="sm:hidden">Preset</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col items-start gap-2.5 xl:items-end">
          {!embedMode && (
            <div className="dashboard-toolbar">
              <div className="dashboard-toolbar-group">
                <ToolbarButton icon={<Undo2 size={12} />} label="Back" onClick={onBack} />
                <ToolbarButton icon={<Share2 size={12} />} label="Share" onClick={onShare} />
                <ToolbarButton icon={<Code2 size={12} />} label="Embed" onClick={onEmbed} />
              </div>
              <div className="dashboard-toolbar-group">
                <ToolbarButton
                  icon={themeMode === 'light' ? <SunMedium size={12} /> : <MoonStar size={12} />}
                  label={themeMode === 'light' ? 'Light' : 'Dark'}
                  onClick={onToggleTheme}
                  active={themeMode === 'light'}
                />
                <ToolbarButton icon={<Printer size={12} />} label="Print" onClick={onPrint} />
                <ToolbarButton icon={<Columns2 size={12} />} label="Split" onClick={onToggleSplit} active={splitMode} />
              </div>
            </div>
          )}

          <a
            href="https://f1stories.gr"
            target="_blank"
            rel="noreferrer"
            className="dashboard-brand-card group hidden w-full max-w-full items-center gap-3 rounded-[18px] px-3.5 py-3 transition-colors duration-200 md:inline-flex xl:w-[300px]"
          >
            <img
              src={f1StoriesLogo}
              alt="f1stories.gr"
              className="h-12 w-12 shrink-0 rounded-[12px] object-cover shadow-[0_8px_18px_-16px_rgba(15,23,42,0.24)]"
            />
            <div className="min-w-0">
              <div className="text-[9px] uppercase tracking-[0.14em] text-[color:var(--accent)]">Editorial Partner</div>
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
          {loading ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--accent-border)] bg-[color:var(--accent-muted)] px-3 py-1 text-[10px] uppercase tracking-[0.12em] text-[color:var(--accent)]"><Loader2 size={12} className="animate-spin" /> Syncing live sector data</span>
          ) : feedback ? (
            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] uppercase tracking-[0.12em] text-emerald-400">{feedback}</span>
          ) : null}
        </div>
      </div>
    </header>
  );
}
