import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useDebouncedValue } from '../useDebouncedValue';

afterEach(() => vi.useRealTimers());

describe('useDebouncedValue', () => {
  it('follows a changed value only after the delay, restarting on each change', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 200), { initialProps: { value: 1 } });
    rerender({ value: 2 });
    act(() => { vi.advanceTimersByTime(150); });
    rerender({ value: 3 });
    act(() => { vi.advanceTimersByTime(150); });
    expect(result.current).toBe(1);
    act(() => { vi.advanceTimersByTime(60); });
    expect(result.current).toBe(3);
  });

  it('follows immediately with a delay of 0', () => {
    const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 0), { initialProps: { value: 1 } });
    rerender({ value: 2 });
    expect(result.current).toBe(2);
  });
});
