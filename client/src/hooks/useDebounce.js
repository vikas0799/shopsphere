import { useEffect, useState } from 'react';

/**
 * Custom hook to debounce a value by a specified delay.
 *
 * @param {*} value - The value to debounce.
 * @param {number} [delay=400] - The debounce delay in milliseconds.
 * @returns {*} The debounced value.
 */
export default function useDebounce(value, delay = 400) {
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

export { useDebounce };
