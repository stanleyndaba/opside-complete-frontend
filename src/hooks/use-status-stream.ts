import { useEffect } from 'react';
import { subscribeRealtime, type RealtimeEvent } from '@/lib/realtime';

export function useStatusStream(onEvent: (event: RealtimeEvent) => void) {
  useEffect(() => {
    const unsub = subscribeRealtime(onEvent);
    return () => unsub();
  }, [onEvent]);
}

