import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Copy, X } from 'lucide-react';
import type { DashboardFilterSnapshot } from '../hooks/useDashboardFilters';
import { COLORS } from '../constants/colors';
import { copy } from '../copy';
import { buildDashboardLink } from './links';
import { isEmbedPanelId, type EmbedPanelId, type FigureTheme } from './contract';

type Props = {
  snapshot: DashboardFilterSnapshot;
  initialPanel: string | null;
  theme: FigureTheme;
  context: string;
  baseUrl: string;
  onClose: () => void;
  onExport: (panel: EmbedPanelId) => void;
};

const PANELS = [
  ['telemetry-speed-trace', copy.embed.speed],
  ['telemetry-throttle-brake', copy.embed.pedals],
  ['telemetry-speed-delta', 'Speed delta'],
  ['telemetry-sector-comparison', 'Sector comparison'],
  ['telemetry-lap-times', 'Lap times'],
  ['telemetry-gap-best', 'Gap to best lap'],
] as const;

const escapeAttribute = (value: string) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function EmbedDialog({ snapshot, initialPanel, theme: initialTheme, context, baseUrl, onClose, onExport }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const frame = useRef<HTMLIFrameElement>(null);
  const code = useRef<HTMLTextAreaElement>(null);
  const [panel, setPanel] = useState(initialPanel ?? (snapshot.tab === 'telemetry' ? 'telemetry-speed-trace' : ''));
  const [theme, setTheme] = useState(initialTheme);
  const [measurement, setMeasurement] = useState<{ src: string; height: number } | null>(null);
  const [status, setStatus] = useState('');
  const src = useMemo(() => buildDashboardLink(baseUrl, snapshot, { embed: true, theme, anchor: panel }), [baseUrl, snapshot, theme, panel]);
  const measured = measurement?.src === src;
  const height = measured ? measurement.height : panel ? 720 : 920;
  const snippet = `<iframe src="${escapeAttribute(src)}" title="${escapeAttribute(`${context} · ${PANELS.find(([id]) => id === panel)?.[1] ?? copy.iframe.wholeTab} (F1 Stories TELEMETRY)`)}" width="100%" height="${height}" loading="lazy" style="border:0;width:100%;max-width:100%;display:block;background:${theme === 'light' ? COLORS.fallback.iframeLight : COLORS.fallback.iframeDark};"></iframe>`;

  useEffect(() => {
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const node = dialog.current;
    node?.showModal();
    return () => { if (node?.open) node.close(); opener?.focus(); };
  }, []);

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      const data = event.data;
      if (event.source !== frame.current?.contentWindow || event.origin !== new URL(src).origin
        || !data || data.type !== 'f1s-telemetry:resize' || Object.keys(data).sort().join(',') !== 'height,type'
        || !Number.isInteger(data.height) || data.height < 100 || data.height > 12000) return;
      setMeasurement({ src, height: data.height });
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [src]);

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(snippet);
      setStatus(copy.iframe.copied);
    } catch {
      code.current?.focus();
      code.current?.select();
      setStatus(copy.iframe.copyBlocked);
    }
  };

  return createPortal(<dialog ref={dialog} className="embed-dialog" aria-labelledby="embed-dialog-title" onClose={() => {
    // StrictMode reopens the dialog before its effect cleanup's queued close event fires.
    if (!dialog.current?.open) onClose();
  }}>
    <header className="embed-dialog-head">
      <h2 id="embed-dialog-title">{copy.iframe.title}</h2>
      <button type="button" aria-label={copy.embed.close} onClick={() => dialog.current?.close()}><X size={20} aria-hidden="true" /></button>
    </header>
    <div className="embed-dialog-body">
      <p className="embed-dialog-context">{context}</p>
      <fieldset className="embed-dialog-choice">
        <legend>{copy.embed.panel}</legend>
        {[["", copy.iframe.wholeTab], ...(snapshot.tab === 'telemetry' ? PANELS : [])].map(([value, label]) => <label key={value}>
          <input type="radio" name="embed-panel" value={value} checked={panel === value} onChange={() => { setPanel(value); setStatus(''); }} />{label}
        </label>)}
      </fieldset>
      <fieldset className="embed-dialog-choice">
        <legend>{copy.iframe.theme}</legend>
        {(['light', 'dark'] as const).map(value => <label key={value}><input type="radio" name="embed-theme" value={value} checked={theme === value} onChange={() => { setTheme(value); setStatus(''); }} />{copy.iframe[value]}</label>)}
      </fieldset>
      <label className="embed-dialog-label" htmlFor="embed-code">{copy.iframe.code}</label>
      <textarea ref={code} id="embed-code" className="embed-dialog-code" readOnly spellCheck={false} rows={4} value={snippet} onFocus={event => event.currentTarget.select()} />
      <div className="embed-dialog-actions">
        <button type="button" className="embed-dialog-copy" disabled={!measured} onClick={() => void copyCode()}><Copy size={16} aria-hidden="true" />{copy.iframe.copy}</button>
        <span role="status">{status || (!measured ? copy.iframe.loading : '')}</span>
      </div>
      <p className="embed-dialog-label">{copy.iframe.preview}</p>
      <div className="embed-dialog-preview"><iframe key={src} ref={frame} src={src} title={copy.iframe.previewTitle} height={measured ? height : 320} onLoad={() => frame.current?.contentWindow?.postMessage({ type: 'f1s-telemetry:measure' }, new URL(src).origin)} /></div>
      {isEmbedPanelId(panel) && <button type="button" className="embed-dialog-export" onClick={() => onExport(panel)}>{copy.iframe.savedFigure} ↗</button>}
    </div>
  </dialog>, document.body);
}
