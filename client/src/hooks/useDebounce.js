import { useEffect, useState } from 'react';

/**
 * Custom hook to debounce any fast-changing value.
 * @param {*} value - The value to debounce.
 * @param {number} delay - Delay in milliseconds (default: 400ms).
 * @returns {*} The debounced value.
 */
export default function useDebounce(value, delay = 400) {
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
