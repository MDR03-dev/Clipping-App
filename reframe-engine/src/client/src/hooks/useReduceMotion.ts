import { useEffect, useState } from 'react';

/**
 * Hook to detect reduced motion preference for accessibility
 * Follows Apple HIG: motion should be optional and never the only carrier of meaning
 */
export function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => {
      setReduceMotion(e.matches);
    };

    // Check initial state
    setReduceMotion(mediaQuery.matches);

    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);

    // Cleanup
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return reduceMotion;
}