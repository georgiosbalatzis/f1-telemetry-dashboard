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
