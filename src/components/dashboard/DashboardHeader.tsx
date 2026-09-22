import { Code2, Columns2, Loader2, MoonStar, Printer, Save, Share2, SunMedium, Undo2 } from 'lucide-react';
import { ToolbarButton } from './shared';

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
  loading, presetName, presetNames, feedback, splitMode, embedMode, themeMode,
  embedTitle, embedSubtitle, embedContext, openDashboardUrl, onPresetNameChange,
  onSavePreset, onShare, onEmbed, onPrint, onToggleSplit, onToggleTheme, onBack,
}: Props) {
  return (
    <header className="masthead">
      <div className="masthead-row">
        <a href="https://f1stories.gr/" className="brand" aria-label="F1 Stories home"><img src={`${import.meta.env.BASE_URL}logo192.png`} alt="" /><span className="brand-wordmark">F1 STORIES<span>.</span></span></a>
        <span className="product-name">TELEMETRY</span>
        {embedMode ? <a className="text-action masthead-tools" href={openDashboardUrl} target="_blank" rel="noreferrer">Open analysis ↗</a> : (
          <div className="masthead-tools masthead-actions">
            <button className="theme-toggle" aria-label={themeMode === 'light' ? 'Dark theme' : 'Light theme'} onClick={onToggleTheme}>{themeMode === 'light' ? <MoonStar size={17} /> : <SunMedium size={17} />}</button>
          <details className="utility-menu">
            <summary>Tools <span aria-hidden="true">+</span></summary>
            <div className="utility-content">
              <div className="utility-actions">
                <ToolbarButton icon={<Undo2 size={15} />} label="Back" onClick={onBack} />
                <ToolbarButton icon={<Share2 size={15} />} label="Share" onClick={onShare} />
                <ToolbarButton icon={<Code2 size={15} />} label="Embed" onClick={onEmbed} />
                <ToolbarButton icon={<Printer size={15} />} label="Print" onClick={onPrint} />
                <ToolbarButton icon={<Columns2 size={15} />} label="Split view" onClick={onToggleSplit} active={splitMode} />
              </div>
              <label className="field-label" htmlFor="preset-name">Save or load a comparison</label>
              <div className="preset-controls">
                <input id="preset-name" list="dashboard-preset-names" value={presetName} onChange={(event) => onPresetNameChange(event.target.value)} placeholder="Preset name" className="dashboard-input" />
                <datalist id="dashboard-preset-names">{presetNames.map((name) => <option key={name} value={name} />)}</datalist>
                <ToolbarButton icon={<Save size={15} />} label="Save" onClick={onSavePreset} />
              </div>
            </div>
          </details>
          </div>
        )}
      </div>
      <div className="session-heading">
        <div>
          <p className="section-label">Data hub / Race analysis</p>
          <h1>{embedTitle}</h1>
          <p className="session-edition">{embedSubtitle.replace(' view', '')}{embedMode && ` · ${embedContext.filter((item) => item.label !== 'View').map((item) => `${item.label} ${item.value}`).join(' · ')}`}</p>
        </div>
        <p className="session-status" role="status">{feedback || (loading ? <><Loader2 size={12} className="animate-spin" /> Loading session…</> : null)}</p>
      </div>
    </header>
  );
}
