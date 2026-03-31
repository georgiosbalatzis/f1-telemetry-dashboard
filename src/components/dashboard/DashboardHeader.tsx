import { Code2, Columns2, Loader2, MoonStar, Printer, Save, Share2, SunMedium, Undo2 } from 'lucide-react';
import f1StoriesLogo from '../../assets/f1stories-logo.png';
import { ToolbarButton } from './shared';

type Props = {
  loading: boolean;
  presetName: string;
  presetNames: string[];
  feedback: string | null;
  splitMode: boolean;
  embedMode: boolean;
  themeMode: 'dark' | 'light';
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
  onPresetNameChange,
  onSavePreset,
  onShare,
  onEmbed,
  onPrint,
  onToggleSplit,
  onToggleTheme,
  onBack,
}: Props) {
  return (
    <header className={embedMode ? 'pb-4 pt-4 sm:pt-5' : 'pb-6 pt-8'}>
      <div className="mb-6 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-3">
            <div className="h-8 w-1 rounded-full bg-[#ff5336]" />
            <h1 className="text-xl font-black tracking-tight text-[color:var(--text-strong)] min-[380px]:text-2xl sm:text-4xl" style={{ fontFamily: "'Orbitron', system-ui" }}>F1 TELEMETRY</h1>
          </div>
          <div className="ml-[19px] mt-1 flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-[#ffb347]/18 bg-[#ffb347]/[0.08] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.24em] text-[#ffd792]">
              f1stories.gr edition
            </span>
            <p className="text-[10px] uppercase tracking-[0.38em] text-[color:var(--text-dim)]">Powered by OpenF1</p>
            {embedMode && (
              <span className="rounded-full border border-cyan-500/20 bg-cyan-500/[0.08] px-2 py-0.5 text-[9px] uppercase tracking-[0.24em] text-cyan-300">
                Embed Mode
              </span>
            )}
          </div>
          {!embedMode && (
            <div className="mt-5 flex max-w-xl flex-col gap-3 sm:mt-6 sm:flex-row sm:items-center">
              <input
                list="dashboard-preset-names"
                value={presetName}
                onChange={(event) => onPresetNameChange(event.target.value)}
                placeholder="Save as preset..."
                className="dashboard-input w-full flex-1 px-3 py-2 text-xs"
              />
              <datalist id="dashboard-preset-names">
                {presetNames.map((name) => <option key={name} value={name} />)}
              </datalist>
              <button
                type="button"
                onClick={onSavePreset}
                className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-[10px] border border-[color:var(--line)] bg-[color:var(--surface-soft-2)] px-3 text-[10px] uppercase tracking-[0.2em] text-[color:var(--text-muted)] transition-colors hover:border-[color:var(--line-strong)] hover:text-[color:var(--text-soft)] sm:w-auto"
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
            className="dashboard-brand-card group inline-flex w-full max-w-full items-center gap-3 rounded-[18px] px-3 py-3 transition-transform duration-200 hover:-translate-y-0.5 xl:w-[340px]"
          >
            <img
              src={f1StoriesLogo}
              alt="f1stories.gr"
              className="h-14 w-14 shrink-0 rounded-[16px] object-cover shadow-[0_18px_40px_-24px_rgba(15,23,42,0.48)]"
            />
            <div className="min-w-0">
              <div className="text-[9px] uppercase tracking-[0.34em] text-[#ffd792]">Editorial Partner</div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="truncate text-sm font-black uppercase tracking-[0.18em] text-[color:var(--text-strong)]" style={{ fontFamily: "'Orbitron', system-ui" }}>
                  f1stories
                </span>
                <span className="text-xs font-bold uppercase tracking-[0.24em] text-[#ff8a56]">.gr</span>
              </div>
              <div className="mt-1 text-[11px] text-[color:var(--text-muted)] transition-colors group-hover:text-[color:var(--text-soft)]">
                Race stories, data analysis, and embeddable motorsport tools.
              </div>
            </div>
          </a>
          {!embedMode && (
            <div className="flex w-full gap-2 overflow-x-auto scrollbar-hide pb-1 xl:w-auto xl:flex-wrap xl:justify-end xl:overflow-visible xl:pb-0">
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
            <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-amber-400"><Loader2 size={12} className="animate-spin" /> Syncing live sector data</span>
          ) : feedback ? (
            <span className="text-[10px] uppercase tracking-[0.22em] text-emerald-400">{feedback}</span>
          ) : null}
        </div>
      </div>
    </header>
  );
}
