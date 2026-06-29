import { useEffect, useState } from 'react';

export function useDebouncedValue<T>(value: T, delayMs = 16): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

export function useDebouncedCallback<T extends (...args: never[]) => void>(
  callback: T,
  delayMs = 16
): T {
  const timerRef = { current: null as ReturnType<typeof setTimeout> | null };

  return ((...args: Parameters<T>) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => callback(...args), delayMs);
  }) as T;
}
