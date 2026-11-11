import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('provider pacer', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.setSystemTime(0);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('skips an aborted queued request and preserves FIFO and the gap under a burst', async () => {
    const calls: Array<[number, string]> = [];
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      calls.push([Date.now(), url]);
      return Promise.resolve(new Response('[]'));
    }));
    const { getLaps } = await import('../openf1');
    const controller = new AbortController();
    const first = getLaps(1, 1);
    const cancelled = getLaps(1, 2, { signal: controller.signal });
    const rejection = expect(cancelled).rejects.toMatchObject({ name: 'AbortError' });
    const third = getLaps(1, 3);
    const fourth = getLaps(1, 4);
    controller.abort();
    await vi.advanceTimersByTimeAsync(700);
    await Promise.all([first, third, fourth, rejection]);
    expect(calls.map(([time]) => time)).toEqual([0, 350, 700]);
    expect(calls.map(([, url]) => new URL(url).searchParams.get('driver_number'))).toEqual(['1', '3', '4']);
  });

  it('still aborts an already dispatched request', async () => {
    vi.stubGlobal('fetch', vi.fn((_url: string, { signal }: { signal: AbortSignal }) => new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => reject(signal.reason), { once: true });
    })));
    const { getLaps } = await import('../openf1');
    const controller = new AbortController();
    const request = getLaps(1, 1, { signal: controller.signal });
    const rejection = expect(request).rejects.toMatchObject({ name: 'AbortError' });
    await vi.advanceTimersByTimeAsync(0);
    controller.abort();
    await rejection;
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('removes an armed head and dispatches its follower on time', async () => {
    const calls: Array<[number, string]> = [];
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      calls.push([performance.now(), new URL(url).searchParams.get('driver_number')!]);
      return Promise.resolve(new Response('[]'));
    }));
    const { getLaps } = await import('../openf1');
    const controller = new AbortController();
    const first = getLaps(1, 1);
    const head = getLaps(1, 2, { signal: controller.signal });
    const rejected = expect(head).rejects.toMatchObject({ name: 'AbortError' });
    const follower = getLaps(1, 3);
    await vi.advanceTimersByTimeAsync(0);
    controller.abort();
    await rejected;
    await vi.advanceTimersByTimeAsync(350);
    await Promise.all([first, follower]);
    expect(calls).toEqual([[0, '1'], [350, '3']]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('clears an empty queue timer but retains the last dispatch deadline', async () => {
    const calls: number[] = [];
    vi.stubGlobal('fetch', vi.fn(() => {
      calls.push(performance.now());
      return Promise.resolve(new Response('[]'));
    }));
    const { getLaps } = await import('../openf1');
    const first = getLaps(1, 1);
    const controller = new AbortController();
    const waiting = getLaps(1, 2, { signal: controller.signal });
    const rejected = expect(waiting).rejects.toMatchObject({ name: 'AbortError' });
    await vi.advanceTimersByTimeAsync(0);
    controller.abort();
    await Promise.all([first, rejected]);
    expect(vi.getTimerCount()).toBe(0);
    await vi.advanceTimersByTimeAsync(100);
    const next = getLaps(1, 3);
    await vi.advanceTimersByTimeAsync(249);
    expect(calls).toEqual([0]);
    await vi.advanceTimersByTimeAsync(1);
    await next;
    expect(calls).toEqual([0, 350]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('spaces subsequent dispatches from a late timer execution', async () => {
    let now = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => now);
    const calls: Array<[number, string]> = [];
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      calls.push([performance.now(), new URL(url).searchParams.get('driver_number')!]);
      return Promise.resolve(new Response('[]'));
    }));
    const { getLaps } = await import('../openf1');
    const requests = [getLaps(1, 1), getLaps(1, 2), getLaps(1, 3)];
    await vi.advanceTimersByTimeAsync(0);
    now = 600;
    await vi.advanceTimersByTimeAsync(350);
    expect(calls).toEqual([[0, '1'], [600, '2']]);
    now = 949;
    await vi.advanceTimersByTimeAsync(350);
    expect(calls).toHaveLength(2);
    now = 950;
    await vi.advanceTimersByTimeAsync(1);
    await Promise.all(requests);
    expect(calls).toEqual([[0, '1'], [600, '2'], [950, '3']]);
    expect(vi.getTimerCount()).toBe(0);
    vi.restoreAllMocks();
  });

  it('settles a pre-aborted request without dispatching or leaving timers', async () => {
    vi.stubGlobal('fetch', vi.fn());
    const { getLaps } = await import('../openf1');
    const controller = new AbortController();
    controller.abort();
    await expect(getLaps(1, 1, { signal: controller.signal })).rejects.toMatchObject({ name: 'AbortError' });
    expect(fetch).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('ignores a forward wall-clock jump when pacing', async () => {
    const calls: number[] = [];
    vi.stubGlobal('fetch', vi.fn(() => {
      calls.push(performance.now());
      return Promise.resolve(new Response('[]'));
    }));
    const { getLaps } = await import('../openf1');
    await vi.advanceTimersByTimeAsync(0);
    const first = getLaps(1, 1);
    await vi.advanceTimersByTimeAsync(0);
    await first;
    vi.setSystemTime(10_000);
    const second = getLaps(1, 2);
    await vi.advanceTimersByTimeAsync(349);
    expect(calls).toEqual([0]);
    await vi.advanceTimersByTimeAsync(1);
    await second;
    expect(calls).toEqual([0, 350]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('times out a queued request and settles without dispatch', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(new Response('[]'))));
    const { getLaps } = await import('../openf1');
    const first = getLaps(1, 1);
    const waiting = getLaps(1, 2, { timeoutMs: 100 });
    const rejected = expect(waiting).rejects.toThrow('timed out after 100ms');
    await vi.advanceTimersByTimeAsync(100);
    await Promise.all([first, rejected]);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('queues a rejected fetch retry behind pending requests', async () => {
    const calls: Array<[number, string]> = [];
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      calls.push([performance.now(), new URL(url).searchParams.get('driver_number')!]);
      return calls.length === 1 ? Promise.reject(new Error('network')) : Promise.resolve(new Response('[]'));
    }));
    const { getLaps } = await import('../openf1');
    const requests = [1, 2, 3, 4, 5].map(driver => getLaps(1, driver));
    await vi.advanceTimersByTimeAsync(1750);
    await Promise.all(requests);
    expect(calls).toEqual([[0, '1'], [350, '2'], [700, '3'], [1050, '4'], [1400, '5'], [1750, '1']]);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('honors Retry-After and queues a 429 retry behind pending requests', async () => {
    const calls: Array<[number, string]> = [];
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      calls.push([performance.now(), new URL(url).searchParams.get('driver_number')!]);
      return Promise.resolve(calls.length === 1
        ? new Response(null, { status: 429, headers: { 'Retry-After': '1' } })
        : new Response('[]'));
    }));
    const { getLaps } = await import('../openf1');
    const requests = [1, 2, 3, 4, 5].map(driver => getLaps(1, driver));
    await vi.advanceTimersByTimeAsync(999);
    expect(calls).toEqual([[0, '1'], [350, '2'], [700, '3']]);
    await vi.advanceTimersByTimeAsync(1);
    expect(calls).toHaveLength(3);
    await vi.advanceTimersByTimeAsync(750);
    await expect(Promise.all(requests)).resolves.toEqual([[], [], [], [], []]);
    expect(calls).toEqual([[0, '1'], [350, '2'], [700, '3'], [1050, '4'], [1400, '5'], [1750, '1']]);
    expect(calls.slice(1).every(([time], index) => time - calls[index][0] >= 350)).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('dispatches a 429 retry at its Retry-After deadline after later queued requests', async () => {
    const calls: Array<[number, string]> = [];
    vi.stubGlobal('fetch', vi.fn((url: string) => {
      calls.push([performance.now(), new URL(url).searchParams.get('driver_number')!]);
      return Promise.resolve(calls.length === 1
        ? new Response(null, { status: 429, headers: { 'Retry-After': '4' } })
        : new Response('[]'));
    }));
    const { getLaps } = await import('../openf1');
    const retrying = getLaps(1, 1);
    await vi.advanceTimersByTimeAsync(2500);
    const followers = [getLaps(1, 2), getLaps(1, 3)];
    await vi.advanceTimersByTimeAsync(1499);
    expect(calls).toEqual([[0, '1'], [2500, '2'], [2850, '3']]);
    await vi.advanceTimersByTimeAsync(1);
    await expect(Promise.all([retrying, ...followers])).resolves.toEqual([[], [], []]);
    expect(calls).toEqual([[0, '1'], [2500, '2'], [2850, '3'], [4000, '1']]);
    expect(calls.slice(1).every(([time], index) => time - calls[index][0] >= 350)).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

});
