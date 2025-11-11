import { useEffect, useRef } from 'react';

/**
 * Hook to add passive scroll event listeners for better performance
 * Passive listeners allow the browser to optimize scrolling performance
 */
export function usePassiveScroll(
  callback: (event: Event) => void,
  enabled: boolean = true
) {
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const handleScroll = (e: Event) => {
      callbackRef.current(e);
    };

    // Use passive listener for better scroll performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('wheel', handleScroll, { passive: true });
    window.addEventListener('touchmove', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('wheel', handleScroll);
      window.removeEventListener('touchmove', handleScroll);
    };
  }, [enabled]);
}

