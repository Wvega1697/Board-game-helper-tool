import { useState, useEffect, useCallback } from 'react';

/**
 * Hook that syncs state with sessionStorage for mid-game persistence.
 * @param {string} key - Storage key
 * @param {*} initialValue - Default value if nothing stored
 */
export function useSessionStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = sessionStorage.getItem(key);
      return stored ? JSON.parse(stored) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage full or unavailable
    }
  }, [key, value]);

  const clearValue = useCallback(() => {
    setValue(initialValue);
    try {
      sessionStorage.removeItem(key);
    } catch {
      // Ignore
    }
  }, [key, initialValue]);

  return [value, setValue, clearValue];
}
