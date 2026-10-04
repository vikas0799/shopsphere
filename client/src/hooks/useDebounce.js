import { useEffect, useState } from 'react';

/**
 * Custom hook to debounce any rapidly changing value.
 * @param {any} value - The value to debounce.
 * @param {number} delay - The debounce delay in milliseconds (defaults to 400ms).
 * @returns {any} The debounced value.
 */
export function useDebounce(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
