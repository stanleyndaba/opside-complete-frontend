import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { useSession } from '@/contexts/SessionContext';
import { parseDefaultSSEMessage, registerNamedSSEListeners } from '@/lib/sse';
import { createAuthenticatedEventStream, type EventStreamLike } from '@/lib/authenticatedSSE';
import {
  getLiveEventDedupeKey,
  normalizeIncomingLiveEvent,
  toStatusStreamEvent,
  type StatusStreamEvent
} from '@/lib/liveEvents';

export type StatusEvent = {
  type: string;
  status: string;
  data: Record<string, any>;
  timestamp: string;
  eventType: string;
  entityType?: string;
  entityId?: string;
};

import { api } from '@/lib/api';

export const useStatusStream = (onEvent?: (event: StatusEvent) => void, tenantSlug?: string) => {
  const eventSourceRef = useRef<EventStreamLike | null>(null);
  const handledPayloadsRef = useRef<Set<string>>(new Set());
  const onEventRef = useRef<typeof onEvent>();
  const queryClient = useQueryClient();
  const { isAuthReady, authToken } = useSession();

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    const slug = tenantSlug;
    if (!slug) return;
    if (!isAuthReady || !authToken) return;
    const activeTenantId = typeof window !== 'undefined'
      ? String(localStorage.getItem('active_tenant_id') || '').trim()
      : '';

    // Build SSE URL using API base URL
    const sseUrl = api.buildApiUrl(`/api/sse/status?tenantSlug=${slug}`);
    const eventSource = createAuthenticatedEventStream(sseUrl, {
      autoReconnect: true,
      reconnectDelayMs: 3000
    });

    const invalidateForEvent = (event: StatusStreamEvent) => {
      const eventType = event.eventType.toLowerCase();
      const keyMatcher = (needle: string) => (query: any) =>
        JSON.stringify(query.queryKey || []).toLowerCase().includes(needle);

      if (event.type === 'detection' || eventType.startsWith('sync.')) {
        void queryClient.invalidateQueries({ predicate: keyMatcher('sync') });
        void queryClient.invalidateQueries({ predicate: keyMatcher('detection') });
      }

      if (event.type === 'evidence' || eventType.startsWith('evidence') || eventType.startsWith('parsing') || eventType.startsWith('matching')) {
        void queryClient.invalidateQueries({ predicate: keyMatcher('evidence') });
        void queryClient.invalidateQueries({ predicate: keyMatcher('document') });
      }

      if (event.type === 'case' || event.type === 'filing') {
        void queryClient.invalidateQueries({ predicate: keyMatcher('dispute') });
        void queryClient.invalidateQueries({ predicate: keyMatcher('case') });
      }

      if (event.type === 'payout' || event.type === 'recovery' || event.type === 'billing' || eventType.startsWith('payout') || eventType.startsWith('billing')) {
        void queryClient.invalidateQueries({ predicate: keyMatcher('recover') });
      }

      if (eventType.startsWith('notification')) {
        void queryClient.invalidateQueries({ predicate: keyMatcher('notification') });
      }
    };

    const processStatusEvent = (rawType: string, payload: any) => {
      try {
        const liveEvent = normalizeIncomingLiveEvent(rawType, payload);
        if (liveEvent.tenant_slug && liveEvent.tenant_slug !== slug) {
          return;
        }
        if (activeTenantId && liveEvent.tenant_id && liveEvent.tenant_id !== activeTenantId) {
          return;
        }

        const dedupeKey = getLiveEventDedupeKey(liveEvent);
        if (handledPayloadsRef.current.has(dedupeKey)) {
          return;
        }
        handledPayloadsRef.current.add(dedupeKey);
        if (handledPayloadsRef.current.size > 300) {
          handledPayloadsRef.current = new Set(Array.from(handledPayloadsRef.current).slice(-150));
        }

        const statusEvent: StatusEvent = toStatusStreamEvent(liveEvent);
        invalidateForEvent(statusEvent);
        onEventRef.current?.(statusEvent);

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
        'impact',
        'metrics',
        'job.queued',
        'job.started',
        'job.completed',
        'job.failed',
        'job.retrying',
        'agent.invoked',
        'agent.completed',
        'agent.failed',
        'sync.started',
        'sync.completed',
        'sync.failed',
        'sync_progress',
        'detection.completed',
        'detection.created',
        'case.created',
        'case.status_updated',
        'evidence.linked',
        'filing.submitted',
        'payout.detected',
        'recovery.work_created',
        'recovery.quarantined',
        'recovery.failed',
        'billing.work_created',
        'billing.processed',
        'billing.failed',
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
        'payment_reconciled',
        'detection.claim_filed',
        'detection.payout_received'
      ],
      (eventName, payload) => processStatusEvent(eventName, payload)
    );

    eventSource.onmessage = (event) => {
      processStatusEvent('message', parseDefaultSSEMessage(event));
    };

    eventSource.onopen = () => {
      void api.get<{ success: boolean; events: any[] }>(
        `/api/sse/recent?tenantSlug=${encodeURIComponent(slug)}&limit=50`
      ).then((response) => {
        if (!response.ok || !response.data?.events) return;
        for (const recentEvent of response.data.events) {
          processStatusEvent('message', recentEvent);
        }
      }).catch(() => {
        // Ignore replay failures and continue with live stream
      });
    };

    eventSource.onerror = (error) => {
      console.error('Status stream error:', error);
    };

    eventSourceRef.current = eventSource;

    return () => {
      removeNamedListeners();
      eventSource.close();
    };
  }, [authToken, isAuthReady, queryClient, tenantSlug]);

  return {
    close: () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    }
  };
};
