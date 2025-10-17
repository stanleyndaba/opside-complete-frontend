import { useEffect, useRef } from 'react';
import { toast } from '@/hooks/use-toast';

export type StatusEvent = {
  type: 'sync' | 'detection' | 'claim' | 'evidence' | 'refund';
  status: 'started' | 'progress' | 'completed' | 'failed' | 'filed' | 'approved' | 'deposited' | 'denied' | 'linked';
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
        
        // Map important events to user-friendly toasts
        const { type, status, data } = statusEvent as any;
        const amount = data?.amount;
        const currency = data?.currency || 'USD';
        const claimId = data?.claimId || data?.id;
        const asMoney = (v: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(v || 0));

        if (type === 'claim' && (status === 'filed' || status === 'completed')) {
          toast({ title: 'Claim Filed', description: claimId ? `Case ${claimId} submitted` : 'Case submitted' });
        } else if ((type === 'claim' && status === 'approved') || (type === 'refund' && status === 'approved')) {
          toast({ title: 'Refund Approved', description: amount ? `${asMoney(amount)} approved` : 'Approved' });
        } else if (type === 'refund' && status === 'deposited') {
          toast({ title: 'Funds Deposited', description: amount ? `${asMoney(amount)} credited` : 'Funds credited' });
        } else if (type === 'evidence' && status === 'linked') {
          toast({ title: 'Evidence Linked', description: claimId ? `Linked to ${claimId}` : 'Evidence linked' });
        } else if (status === 'failed') {
          toast({ title: 'Task failed', description: `${type} failed`, variant: 'destructive' });
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
