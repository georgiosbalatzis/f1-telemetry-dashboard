import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { copy } from '../copy';
import { buildFigureAnalysisLink } from './links';
import { serializeFigureBundle, validateFigureBundle, type EmbedPanelId, type FigureBundle, type FigureData, type FigureImage, type FigureTheme, type PublicationScope } from './contract';

export type FigureDraft = {
  scope: PublicationScope;
  context: { grandPrix: string; session: string };
  data: FigureData;
  provenance: FigureBundle['provenance'];
};

type Props = {
  initialPanel: string | null;
  drafts: Partial<Record<EmbedPanelId, FigureDraft>>;
  emptyMessage: string;
  theme: FigureTheme;
  analysisBase: string;
  legacySnippet: (panelId: EmbedPanelId | null) => string;
  onClose: () => void;
  onLegacy: (snippet: string) => void;
};

type FigureImages = Awaited<ReturnType<typeof import('./exportFigure').exportFigureImages>>;

const PANEL_ORDER: EmbedPanelId[] = ['telemetry-speed-trace', 'telemetry-throttle-brake'];
const PANEL_LABEL: Record<EmbedPanelId, string> = { 'telemetry-speed-trace': copy.embed.speed, 'telemetry-throttle-brake': copy.embed.pedals };

function slugify(text: string) {
  const value = text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60).replace(/-+$/g, '');
  return value || 'telemetry-figure';
}

function previewUrl(image: FigureImage | undefined) {
  return image ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(image.svg)}` : undefined;
}

export function EmbedComposer({ initialPanel, drafts, emptyMessage, theme, analysisBase, legacySnippet, onClose, onLegacy }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const controller = useRef<AbortController | null>(null);
  const opener = useRef<HTMLElement | null>(null);
  const [panel, setPanel] = useState<EmbedPanelId | ''>(() => PANEL_ORDER.includes(initialPanel as EmbedPanelId) ? initialPanel as EmbedPanelId : '');
  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<FigureImages | null>(null);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [copied, setCopied] = useState(false);
  const draft = panel ? drafts[panel] : undefined;
  const marker = useMemo(() => `${slugify(title)}.f1embed.json`, [title]);
  const analysisUrl = useMemo(() => draft ? buildFigureAnalysisLink(analysisBase, draft.scope, panel as EmbedPanelId) : '', [analysisBase, draft, panel]);
  const missingDrivers = draft?.provenance.drivers.filter((driver) => driver.status === 'missing').map((driver) => draft.data.drivers.find((d) => d.number === driver.driverNumber)?.fullName ?? `#${driver.driverNumber}`) ?? [];
  const activeImage = theme === 'light' ? images?.narrowLight : images?.narrowDark;
  const wideImage = theme === 'light' ? images?.wideLight : images?.wideDark;

  useEffect(() => {
    const node = dialog.current;
    if (!node) return;
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    node.showModal();
    return () => { controller.current?.abort(); if (node.open) node.close(); window.requestAnimationFrame(() => opener.current?.focus()); };
  }, []);

  useEffect(() => {
    const selected = panel ? drafts[panel] : undefined;
    setImages(null);
    setError('');
    setAcknowledged(false);
    if (!selected) return;
    const abort = new AbortController();
    controller.current?.abort();
    controller.current = abort;
    void import('./exportFigure').then(({ exportFigureImages }) => exportFigureImages(selected.data, abort.signal)).then(setImages).catch((reason: unknown) => {
      if (!abort.signal.aborted) setError(copy.embed.exportError(reason instanceof Error ? reason.message : String(reason)));
    });
    return () => abort.abort();
  }, [drafts, panel]);

  const close = () => { controller.current?.abort(); dialog.current?.close(); };

  const download = async () => {
    if (!draft || !panel || !images) return;
    setExporting(true);
    setError('');
    try {
      if (missingDrivers.length && !acknowledged) throw new Error(copy.embed.partial(missingDrivers.join(', ')));
      if (!caption.trim()) throw new Error(copy.embed.captionRequired);
      const bundle: FigureBundle = {
        schemaVersion: 1, panelId: panel, capturedAt: new Date().toISOString(), scope: draft.scope,
        context: draft.context,
        editorial: { title: title.trim(), caption: caption.trim(), description: description.trim() },
        provenance: { ...draft.provenance, partialAcknowledged: missingDrivers.length ? acknowledged : false },
        data: draft.data, images,
      };
      validateFigureBundle(bundle);
      const blob = new Blob([serializeFigureBundle(bundle)], { type: 'application/json;charset=utf-8' });
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = marker;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch (reason) {
      setError(copy.embed.exportError(reason instanceof Error ? reason.message : String(reason)));
    } finally { setExporting(false); }
  };

  const copyMarker = async () => {
    const text = `TELEMETRY:${marker}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      input.current?.focus(); input.current?.select();
      setError(copy.embed.copyFailed);
    }
  };

  return createPortal(<dialog ref={dialog} className="embed-composer" aria-labelledby="embed-composer-title" onClose={() => {
    if (!dialog.current?.open) onClose();
  }}>
    <header className="embed-composer-header">
      <div><span className="embed-composer-kicker">F1 STORIES / AUTHORING</span><h2 id="embed-composer-title">{copy.embed.title}</h2></div>
      <button type="button" aria-label={copy.embed.close} onClick={close}>×</button>
    </header>
    <div className="embed-composer-body">
      <label>{copy.embed.panel}<select value={panel} onChange={(event) => setPanel(event.target.value as EmbedPanelId | '')}>
        <option value="">{copy.embed.selectPanel}</option>{PANEL_ORDER.map((id) => <option key={id} value={id}>{PANEL_LABEL[id]}</option>)}
      </select></label>
      {draft ? <>
        <p className="embed-composer-context"><b>{copy.embed.context}</b><br />{draft.scope.year} · {draft.context.grandPrix} · {draft.context.session} · {draft.data.drivers.map((driver) => `${driver.fullName} (${driver.acronym})`).join(' / ')} · L{draft.scope.lapNum}</p>
        <p className="embed-composer-scope"><b>{copy.embed.scope}:</b> {draft.scope.circuit} · {draft.scope.sessionKey} · L{draft.scope.lapNum} · {draft.scope.driverNums.join(', ')}</p>
        <label>{copy.embed.titleLabel}<input value={title} maxLength={160} onChange={(event) => setTitle(event.target.value)} /></label>
        <label>{copy.embed.description}<textarea value={description} maxLength={2000} rows={3} onChange={(event) => setDescription(event.target.value)} /></label>
        <label>{copy.embed.caption}<textarea value={caption} maxLength={2000} rows={2} onChange={(event) => setCaption(event.target.value)} /></label>
        {missingDrivers.length ? <label className="embed-composer-ack"><input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} />{copy.embed.partial(missingDrivers.join(', '))}<br />{copy.embed.acknowledge}</label> : <p>{copy.embed.complete}</p>}
        <a href={analysisUrl} target="_blank" rel="noreferrer">{copy.embed.open}</a>
        <section className="embed-composer-preview"><b>{copy.embed.preview}</b>{activeImage ? <img src={previewUrl(activeImage)} alt={description || (panel ? PANEL_LABEL[panel] : '')} /> : <p role="status">{copy.embed.exporting}</p>}<b>{copy.embed.widePreview}</b>{wideImage && <img src={previewUrl(wideImage)} alt="" />}</section>
      </> : <div className="embed-composer-unsupported"><p>{!initialPanel && PANEL_ORDER.some((id) => drafts[id]) ? copy.embed.chooseFigure : emptyMessage}</p><p>{copy.embed.markerHelp}</p></div>}
      <details className="embed-composer-legacy"><summary>{copy.embed.legacy}</summary><p>{copy.embed.legacyHelp}</p><button type="button" onClick={() => onLegacy(legacySnippet(panel || null))}>{copy.embed.legacyCopy}</button></details>
      <label className="embed-composer-marker">{copy.embed.marker}<input ref={input} readOnly value={panel ? `TELEMETRY:${marker}` : ''} onFocus={(event) => event.currentTarget.select()} /></label>
      <p className="embed-composer-help">{copy.embed.markerHelp}</p>
      {copied && <p role="status">{copy.embed.copied}</p>}
      {error && <p role="alert" className="embed-composer-error">{error}</p>}
    </div>
    <footer className="embed-composer-footer">
      {panel && <button type="button" className="embed-composer-primary" onClick={() => void download()} disabled={exporting || !draft || !images || !title.trim() || !description.trim() || !caption.trim() || (missingDrivers.length > 0 && !acknowledged)}>{exporting ? copy.embed.exporting : copy.embed.download}</button>}
      {panel && <button type="button" onClick={() => void copyMarker()} disabled={!title.trim()}>{copy.embed.marker}</button>}
    </footer>
  </dialog>, document.body);
}
