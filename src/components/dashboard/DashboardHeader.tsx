import { Code2, Columns2, Loader2, Printer, Save, Share2, Undo2 } from 'lucide-react';
import { ToolbarButton } from './shared';

type Props = {
  loading: boolean;
  presetName: string;
  presetNames: string[];
  feedback: string | null;
  splitMode: boolean;
  embedMode: boolean;
  onPresetNameChange: (value: string) => void;
  onSavePreset: () => void;
  onShare: () => void;
  onEmbed: () => void;
  onPrint: () => void;
  onToggleSplit: () => void;
  onBack: () => void;
};

export function DashboardHeader({
  loading,
  presetName,
  presetNames,
  feedback,
  splitMode,
  embedMode,
  onPresetNameChange,
  onSavePreset,
  onShare,
  onEmbed,
  onPrint,
  onToggleSplit,
  onBack,
}: Props) {
  return (
    <header className={embedMode ? 'pb-4 pt-4 sm:pt-5' : 'pb-6 pt-8'}>
      <div className="mb-6 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-3">
            <div className="h-8 w-1 rounded-full bg-[#ff5336]" />
            <h1 className="text-xl font-black tracking-tight text-white min-[380px]:text-2xl sm:text-4xl" style={{ fontFamily: "'Orbitron', system-ui" }}>F1 TELEMETRY</h1>
          </div>
          <div className="ml-[19px] mt-1 flex flex-wrap items-center gap-3">
            <p className="text-[10px] uppercase tracking-[0.38em] text-slate-700">Powered by OpenF1</p>
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
                className="w-full flex-1 rounded-[10px] border border-white/[0.05] bg-white/[0.02] px-3 py-2 text-xs text-slate-300 outline-none transition-colors placeholder:text-slate-600 focus:border-white/[0.09]"
              />
              <datalist id="dashboard-preset-names">
                {presetNames.map((name) => <option key={name} value={name} />)}
              </datalist>
              <button
                type="button"
                onClick={onSavePreset}
                className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-[10px] border border-white/[0.05] bg-white/[0.01] px-3 text-[10px] uppercase tracking-[0.2em] text-slate-600 transition-colors hover:border-white/[0.09] hover:text-slate-300 sm:w-auto"
              >
                <Save size={12} />
                Save
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col items-start gap-3 xl:items-end">
          {!embedMode && (
            <div className="flex w-full gap-2 overflow-x-auto scrollbar-hide pb-1 xl:w-auto xl:flex-wrap xl:justify-end xl:overflow-visible xl:pb-0">
              <ToolbarButton icon={<Undo2 size={12} />} label="Back" onClick={onBack} />
              <ToolbarButton icon={<Share2 size={12} />} label="Share" onClick={onShare} />
              <ToolbarButton icon={<Code2 size={12} />} label="Embed" onClick={onEmbed} />
              <ToolbarButton icon={<Printer size={12} />} label="Print" onClick={onPrint} />
              <ToolbarButton icon={<Columns2 size={12} />} label="Split" onClick={onToggleSplit} active={splitMode} />
            </div>
          )}
          {loading ? (
            <span className="flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-amber-400"><Loader2 size={12} className="animate-spin" /> Syncing live sector data</span>
          ) : feedback ? (
            <span className="text-[10px] uppercase tracking-[0.22em] text-emerald-300">{feedback}</span>
          ) : null}
        </div>
      </div>
    </header>
  );
}
