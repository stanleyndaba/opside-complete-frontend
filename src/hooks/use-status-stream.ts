import { useEffect, useRef } from 'react';
import { toast } from '@/hooks/use-toast';

export type StatusEvent = {
  type: 'sync' | 'detection' | 'claim' | 'evidence' | 'refund';
  status: 'started' | 'progress' | 'completed' | 'failed' | 'filed' | 'approved' | 'deposited' | 'denied' | 'linked';
  data: any;
  timestamp: string;
};

import { api } from '@/lib/api';

export const useStatusStream = (onEvent?: (event: StatusEvent) => void) => {
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Build SSE URL using API base URL
    const sseUrl = api.buildApiUrl('/api/sse/status');
    const eventSource = new EventSource(sseUrl, { withCredentials: true } as any);
    
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

        // Handle Agent 1-11 events
        if (type === 'sync' && status === 'started') {
          toast({ title: 'Data Sync Started', description: 'Syncing Amazon data...' });
        } else if (type === 'sync' && status === 'completed') {
          toast({ title: 'Data Sync Complete', description: 'Amazon data synced successfully' });
        } else if (type === 'detection' && status === 'started') {
          toast({ title: 'Claim Detection Started', description: 'Analyzing data for claims...' });
        } else if (type === 'detection' && status === 'completed') {
          const count = data?.totalDetected || data?.count || 0;
          toast({ title: 'Claims Detected', description: `${count} claim${count !== 1 ? 's' : ''} found` });
        } else if (type === 'evidence' && status === 'started') {
          toast({ title: 'Evidence Ingestion Started', description: 'Collecting evidence documents...' });
        } else if (type === 'evidence' && status === 'completed') {
          const count = data?.documentsIngested || data?.count || 0;
          toast({ title: 'Evidence Collected', description: `${count} document${count !== 1 ? 's' : ''} ingested` });
        } else if (type === 'claim' && (status === 'filed' || status === 'completed')) {
          toast({ title: 'Claim Filed', description: claimId ? `Case ${claimId} submitted` : 'Case submitted' });
        } else if ((type === 'claim' && status === 'approved') || (type === 'refund' && status === 'approved')) {
          toast({ title: 'Refund Approved', description: amount ? `${asMoney(amount)} approved` : 'Approved' });
        } else if (type === 'refund' && status === 'deposited') {
          toast({ title: 'Funds Deposited', description: amount ? `${asMoney(amount)} credited` : 'Funds credited' });
        } else if (type === 'evidence' && status === 'linked') {
          toast({ title: 'Evidence Linked', description: claimId ? `Linked to ${claimId}` : 'Evidence linked' });
        } else if (status === 'failed') {
          toast({ title: 'Task Failed', description: `${type} failed`, variant: 'destructive' });
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
