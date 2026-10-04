import { useEffect, useState } from 'react';

/**
 * Custom hook to debounce a fast-changing value.
 * @param {*} value - The value to debounce.
 * @param {number} delay - Delay in milliseconds (default: 400ms).
 * @returns {*} The debounced value.
 */
export function useDebounce(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
