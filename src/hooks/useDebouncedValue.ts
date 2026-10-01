import { useEffect, useState } from 'react';

/** Follows `value` after it has been still for `delayMs`; with a delay of 0 it follows immediately. */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    if (delayMs <= 0) {
      setDebounced(value);
      return;
    }
    const id = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(id);
  }, [value, delayMs]);
  return delayMs <= 0 ? value : debounced;
}
