import { useEffect } from 'react';

/** Report the natural content height, including loading, error and recovered states. */
export function useEmbedHeightReporter(embedMode: boolean, onTheme?: (theme: 'light' | 'dark') => void) {
  useEffect(() => {
    if (!embedMode || window.parent === window) return;
    const content = document.querySelector('.embed-mode');
    if (!content) return;
    let parentOrigin = window.location.origin;
    try { if (document.referrer) parentOrigin = new URL(document.referrer).origin; } catch { /* use same-origin fallback */ }
    let lastHeight = 0;
    let pending = 0;
    let force = false;
    let active = true;
    const report = () => {
      pending = 0;
      const height = Math.max(100, Math.ceil(content.getBoundingClientRect().height));
      if (height !== lastHeight || force) {
        lastHeight = height;
        window.parent.postMessage({ type: 'f1s-telemetry:resize', height }, parentOrigin);
      }
      force = false;
    };
    const schedule = (measure = false) => {
      if (!active) return;
      force ||= measure;
      if (!pending) pending = window.requestAnimationFrame(report);
    };
    const onResize = () => schedule();
    const onMessage = (event: MessageEvent) => {
      const type = event.data?.type;
      if (event.source !== window.parent || (type !== 'f1s-telemetry:measure' && type !== 'f1s-telemetry:theme')) return;
      // A reload can make document.referrer point to this frame itself. In that
      // case the hosting window's measurement request supplies its exact origin.
      if (event.origin !== parentOrigin && parentOrigin !== window.location.origin) return;
      parentOrigin = event.origin;
      if (type === 'f1s-telemetry:theme') {
        // The article owns the theme: its choice lives in f1stories.gr storage, unreadable from this origin.
        const theme = event.data.theme;
        if (theme === 'light' || theme === 'dark') onTheme?.(theme);
        return;
      }
      schedule(true);
    };
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(onResize);
    observer?.observe(content);
    window.addEventListener('message', onMessage);
    window.addEventListener('resize', onResize);
    document.fonts?.ready.then(onResize);
    schedule();
    return () => {
      active = false;
      observer?.disconnect();
      window.cancelAnimationFrame(pending);
      window.removeEventListener('message', onMessage);
      window.removeEventListener('resize', onResize);
    };
  }, [embedMode, onTheme]);
}
