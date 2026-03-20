import { useEffect, useRef } from 'react';
import { toast } from '@/hooks/use-toast';
import { parseDefaultSSEMessage, registerNamedSSEListeners } from '@/lib/sse';

export type StatusEvent = {
  type: 'sync' | 'detection' | 'claim' | 'evidence' | 'refund' | 'filing' | 'status_updated' | 'recovery';
  status: 'started' | 'progress' | 'completed' | 'failed' | 'filed' | 'approved' | 'deposited' | 'denied' | 'linked' | 'payout_detected' | 'matched' | 'reconciled' | 'discrepancy';
  data: any;
  timestamp: string;
};

import { api } from '@/lib/api';

export const useStatusStream = (onEvent?: (event: StatusEvent) => void, tenantSlug?: string) => {
  const eventSourceRef = useRef<EventSource | null>(null);
  const handledPayloadsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const slug = tenantSlug;
    if (!slug) return;

    // Build SSE URL using API base URL
    const sseUrl = api.buildApiUrl(`/api/sse/status?tenantSlug=${slug}`);
    const eventSource = new EventSource(sseUrl, { withCredentials: true } as any);

    const processStatusEvent = (rawType: string, payload: any) => {
      try {
        const eventName = rawType === 'message' ? (payload?.event_type || payload?.type || 'message') : rawType;
        const parts = String(eventName).split(/[.:]/);
        const normalizedType = (parts[0] || payload?.type || 'status_updated') as StatusEvent['type'];
        const normalizedStatus = (parts[1] || payload?.status || 'progress') as StatusEvent['status'];
        const dedupeKey = `${eventName}:${payload?.id || payload?.entity_id || payload?.timestamp || ''}`;
        if (handledPayloadsRef.current.has(dedupeKey)) {
          return;
        }
        handledPayloadsRef.current.add(dedupeKey);
        if (handledPayloadsRef.current.size > 300) {
          handledPayloadsRef.current = new Set(Array.from(handledPayloadsRef.current).slice(-150));
        }

        const statusEvent: StatusEvent = {
          type: normalizedType,
          status: normalizedStatus,
          data: payload,
          timestamp: payload?.timestamp || new Date().toISOString()
        };
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
          // Toast removed per user request
        } else if (type === 'detection' && status === 'started') {
          toast({ title: 'Claim Detection Started', description: 'Analyzing data for claims...' });
        } else if (type === 'detection' && status === 'completed') {
          // Toast removed per user request - no toast for claims detected
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

    const removeNamedListeners = registerNamedSSEListeners(
      eventSource,
      [
        'connected',
        'notification',
        'message',
        'sync.started',
        'sync.completed',
        'sync.failed',
        'sync_progress',
        'detection.completed',
        'claim_expiring',
        'detection_resolved',
        'detection_status_changed',
        'evidence_ingestion_started',
        'evidence_ingestion_completed',
        'evidence_ingestion_failed',
        'evidence_upload_completed',
        'evidence_upload_failed',
        'parsing_started',
        'parsing_completed',
        'matching_completed',
        'evidence_matching_completed',
        'recovery_detected',
        'payment_approved',
        'payment_reconciled'
      ],
      (eventName, payload) => processStatusEvent(eventName, payload)
    );

    eventSource.onmessage = (event) => {
      processStatusEvent('message', parseDefaultSSEMessage(event));
    };

    eventSource.onerror = (error) => {
      console.error('Status stream error:', error);
    };

    eventSourceRef.current = eventSource;

    return () => {
      removeNamedListeners();
      eventSource.close();
    };
  }, [onEvent, tenantSlug]);

  return {
    close: () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    }
  };
};
