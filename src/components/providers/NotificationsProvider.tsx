import React, { PropsWithChildren, useEffect } from 'react';
import { useStatusStream } from '@/hooks/use-status-stream';
import { toast } from '@/hooks/use-toast';

export function NotificationsProvider({ children }: PropsWithChildren<{}>) {
  // Initialize global live feed toasts via SSE
  const { close } = useStatusStream();

  useEffect(() => {
    // Announce that live feed is active (non-intrusive)
    // toast({ title: 'Live feed connected', description: 'Real-time updates enabled.' });
    return () => {
      close();
    };
  }, [close]);

  return <>{children}</>;
}

export default NotificationsProvider;
