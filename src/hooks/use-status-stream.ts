import { useEffect, useRef } from 'react';
import { toast } from '@/hooks/use-toast';

export type StatusEvent = {
  type: 'sync' | 'detection' | 'claim' | 'evidence';
  status: 'started' | 'progress' | 'completed' | 'failed';
  data: any;
  timestamp: string;
};

export const useStatusStream = (onEvent?: (event: StatusEvent) => void) => {
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Use relative URL for EventSource
    const eventSource = new EventSource('/api/sse/status');
    
    eventSource.onmessage = (event) => {
      try {
        const statusEvent: StatusEvent = JSON.parse(event.data);
        onEvent?.(statusEvent);
        
        // Show toast for important events
        if (statusEvent.status === 'completed') {
          toast({
            title: 'Task completed',
            description: `${statusEvent.type} completed successfully`,
          });
        } else if (statusEvent.status === 'failed') {
          toast({
            title: 'Task failed',
            description: `${statusEvent.type} failed`,
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Failed to parse status event:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('Status stream error:', error);
    };

    eventSourceRef.current = eventSource;

    return () => {
      eventSource.close();
    };
  }, [onEvent]);

  return {
    close: () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    }
  };
};
