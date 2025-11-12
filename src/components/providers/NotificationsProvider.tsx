import React, { PropsWithChildren, useEffect } from 'react';
import { useStatusStream } from '@/hooks/use-status-stream';
import { usePhase3Notifications } from '@/hooks/use-phase3-notifications';

export function NotificationsProvider({ children }: PropsWithChildren<{}>) {
  // Initialize global live feed toasts via SSE (legacy)
  const { close: closeStatusStream } = useStatusStream();
  
  // Initialize Phase 3 notifications SSE
  const { close: closePhase3Notifications } = usePhase3Notifications();

  useEffect(() => {
    // Both SSE connections are now active
    return () => {
      closeStatusStream();
      closePhase3Notifications();
    };
  }, [closeStatusStream, closePhase3Notifications]);

  return <>{children}</>;
}

export default NotificationsProvider;
