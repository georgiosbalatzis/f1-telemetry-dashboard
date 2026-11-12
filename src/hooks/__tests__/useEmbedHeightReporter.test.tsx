import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useEmbedHeightReporter } from '../useEmbedHeightReporter';

const postMessage = vi.fn();
const parent = { postMessage };
const disconnect = vi.fn();
const callbacks = new Map<number, FrameRequestCallback>();
let resize: () => void;
let height: number;
let content: HTMLDivElement;

beforeEach(() => {
  height = 960;
  postMessage.mockClear();
  disconnect.mockClear();
  callbacks.clear();
  vi.spyOn(window, 'parent', 'get').mockReturnValue(parent as unknown as Window);
  vi.spyOn(document, 'referrer', 'get').mockReturnValue('https://f1stories.gr/blog-module/blog-entries/example/article.html');
  let id = 0;
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => { callbacks.set(++id, callback); return id; });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(id => { callbacks.delete(id); });
  vi.stubGlobal('ResizeObserver', class {
    constructor(callback: () => void) { resize = callback; }
    observe() {}
    disconnect = disconnect;
  });
  content = document.createElement('div');
  content.className = 'embed-mode';
  document.body.append(content);
  vi.spyOn(content, 'getBoundingClientRect').mockImplementation(() => ({ height }) as DOMRect);
});
afterEach(() => { cleanup(); content.remove(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function flush() {
  act(() => {
    const pending = [...callbacks.values()];
    callbacks.clear();
    pending.forEach(callback => callback(0));
  });
}

it('reports shrinking content and validates measurement requests from the hosting article', () => {
  const { unmount } = renderHook(() => useEmbedHeightReporter(true));
  flush();
  expect(postMessage).toHaveBeenLastCalledWith({ type: 'f1s-telemetry:resize', height: 960 }, 'https://f1stories.gr');
  height = 320;
  act(() => resize());
  flush();
  expect(postMessage).toHaveBeenLastCalledWith({ type: 'f1s-telemetry:resize', height: 320 }, 'https://f1stories.gr');
  act(() => resize());
  flush();
  expect(postMessage).toHaveBeenCalledTimes(2);
  const request = (origin: string, source: MessageEventSource | null) => window.dispatchEvent(new MessageEvent('message', { origin, source, data: { type: 'f1s-telemetry:measure' } }));
  act(() => {
    request('https://evil.example', parent as unknown as Window);
    request('https://f1stories.gr', window);
  });
  flush();
  expect(postMessage).toHaveBeenCalledTimes(2);
  act(() => request('https://f1stories.gr', parent as unknown as Window));
  flush();
  expect(postMessage).toHaveBeenCalledTimes(3);
  unmount();
  expect(disconnect).toHaveBeenCalledOnce();
});

it('does not report heights from the full dashboard', () => {
  renderHook(() => useEmbedHeightReporter(false));
  flush();
  expect(postMessage).not.toHaveBeenCalled();
});

it('finds the host again when a reloaded frame refers to itself', () => {
  vi.spyOn(document, 'referrer', 'get').mockReturnValue(window.location.href);
  renderHook(() => useEmbedHeightReporter(true));
  flush();
  act(() => window.dispatchEvent(new MessageEvent('message', {
    origin: 'https://f1stories.gr', source: parent as unknown as Window, data: { type: 'f1s-telemetry:measure' },
  })));
  flush();
  expect(postMessage).toHaveBeenLastCalledWith({ type: 'f1s-telemetry:resize', height: 960 }, 'https://f1stories.gr');
});

it('applies the hosting article theme only from the parent frame and origin', () => {
  const onTheme = vi.fn();
  renderHook(() => useEmbedHeightReporter(true, onTheme));
  const send = (data: unknown, source: unknown = parent, origin = 'https://f1stories.gr') =>
    act(() => { window.dispatchEvent(new MessageEvent('message', { data, source: source as MessageEventSource, origin })); });
  send({ type: 'f1s-telemetry:theme', theme: 'dark' }, {});
  send({ type: 'f1s-telemetry:theme', theme: 'dark' }, parent, 'https://evil.example');
  send({ type: 'f1s-telemetry:theme', theme: 'purple' });
  expect(onTheme).not.toHaveBeenCalled();
  send({ type: 'f1s-telemetry:theme', theme: 'dark' });
  expect(onTheme).toHaveBeenCalledWith('dark');
});

it.each([
  ['invalid theme', { type: 'f1s-telemetry:theme', theme: 'purple' }, parent],
  ['unknown type', { type: 'f1s-telemetry:unknown' }, parent],
  ['null', null, parent],
  ['array', Object.assign([], { type: 'f1s-telemetry:measure' }), parent],
  ['string', 'f1s-telemetry:measure', parent],
  ['non-parent', { type: 'f1s-telemetry:measure' }, {}],
  ['non-plain object', Object.assign(new Date(), { type: 'f1s-telemetry:measure' }), parent],
])('rejects %s before binding and allows a later valid parent message', (_label, data, source) => {
  vi.spyOn(document, 'referrer', 'get').mockReturnValue('');
  const onTheme = vi.fn();
  renderHook(() => useEmbedHeightReporter(true, onTheme));
  flush();
  postMessage.mockClear();
  const send = (payload: unknown, from: unknown, origin: string) => act(() => {
    window.dispatchEvent(new MessageEvent('message', { data: payload, source: from as MessageEventSource, origin }));
  });
  send(data, source, 'https://invalid.example');
  flush();
  expect(postMessage).not.toHaveBeenCalled();
  expect(onTheme).not.toHaveBeenCalled();
  send({ type: 'f1s-telemetry:measure', extra: 'ignored' }, parent, 'https://valid.example');
  flush();
  expect(postMessage).toHaveBeenCalledExactlyOnceWith({ type: 'f1s-telemetry:resize', height: 960 }, 'https://valid.example');
  send({ type: 'f1s-telemetry:theme', theme: 'dark', extra: 'ignored' }, parent, 'https://valid.example');
  expect(onTheme).toHaveBeenCalledExactlyOnceWith('dark');
});

it('binds a valid theme from the parent before a measurement in a no-referrer frame', () => {
  vi.spyOn(document, 'referrer', 'get').mockReturnValue('');
  const onTheme = vi.fn();
  renderHook(() => useEmbedHeightReporter(true, onTheme));
  flush();
  postMessage.mockClear();
  act(() => window.dispatchEvent(new MessageEvent('message', {
    data: { type: 'f1s-telemetry:theme', theme: 'light', extra: true }, source: parent as unknown as Window, origin: 'https://valid.example',
  })));
  expect(onTheme).toHaveBeenCalledExactlyOnceWith('light');
  expect(postMessage).not.toHaveBeenCalled();
  act(() => window.dispatchEvent(new MessageEvent('message', {
    data: { type: 'f1s-telemetry:measure' }, source: parent as unknown as Window, origin: 'https://valid.example',
  })));
  flush();
  expect(postMessage).toHaveBeenCalledExactlyOnceWith({ type: 'f1s-telemetry:resize', height: 960 }, 'https://valid.example');
});

it('does not install the reporter in a top-level window', () => {
  vi.spyOn(window, 'parent', 'get').mockReturnValue(window);
  const windowPostMessage = vi.spyOn(window, 'postMessage').mockImplementation(() => {});
  const onTheme = vi.fn();
  renderHook(() => useEmbedHeightReporter(true, onTheme));
  flush();
  act(() => window.dispatchEvent(new MessageEvent('message', {
    data: { type: 'f1s-telemetry:theme', theme: 'dark' }, source: window, origin: 'https://f1stories.gr',
  })));
  expect(windowPostMessage).not.toHaveBeenCalled();
  expect(onTheme).not.toHaveBeenCalled();
});
