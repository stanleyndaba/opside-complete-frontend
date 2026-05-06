import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { useTenant } from '@/contexts/TenantContext';
import { useSession } from '@/contexts/SessionContext';

interface EventItem {
  id: string;
  type: string;
  status?: string;
  at: string;
  claimId?: string;
  amount?: number;
  currency?: string;
  docIds?: string[];
  message?: string;
}

const NOT_AVAILABLE = 'Not Available';

function formatAmount(amount?: number, currency?: string) {
  if (!amount) return '';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(amount);
}

function formatTimelineToken(value?: string) {
  const normalized = String(value || '').trim();
  if (!normalized) return NOT_AVAILABLE;
  return normalized.replace(/[_-]+/g, ' ');
}

function formatTimelineTimestamp(value?: string) {
  if (!value) return NOT_AVAILABLE;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return NOT_AVAILABLE;
  return parsed.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

export function Timeline({
  claimId,
  tenantSlug,
  liveUpdatesUnavailable = false
}: {
  claimId: string;
  tenantSlug?: string;
  liveUpdatesUnavailable?: boolean;
}) {
  const [events, setEvents] = useState<EventItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastLoadedAt, setLastLoadedAt] = useState<string | null>(null);
  const { tenant } = useTenant();
  const { isAuthReady, isSessionValid } = useSession();
  const activeSlug = tenantSlug || tenant?.slug || 'default';

  const loadEvents = useCallback(async (cancelledRef?: { current: boolean }) => {
    if (!claimId || !activeSlug || !isAuthReady || !isSessionValid) return;
    try {
      const res = await api.get(`/api/recoveries/${encodeURIComponent(claimId)}/events?tenantSlug=${encodeURIComponent(activeSlug)}`);
      if (!cancelledRef?.current) {
        if (res.ok && Array.isArray(res.data)) {
          setEvents(res.data as any);
          setError(null);
          setLastLoadedAt(new Date().toISOString());
        } else {
          setError(res.error || 'Reconstructed history unavailable');
        }
      }
    } catch (e: any) {
      if (!cancelledRef?.current) setError(e?.message || 'Reconstructed history unavailable');
    }
  }, [activeSlug, claimId, isAuthReady, isSessionValid]);

  useEffect(() => {
    if (!claimId || !activeSlug || !isAuthReady || !isSessionValid) {
      return;
    }

    const cancelledRef = { current: false };
    let intervalId: ReturnType<typeof setInterval> | null = null;

    (async () => {
      try {
        await loadEvents(cancelledRef);
        if (liveUpdatesUnavailable) {
          intervalId = setInterval(() => {
            void loadEvents(cancelledRef);
          }, 15000);
        }
      } catch {
        // loadEvents owns the error state
      }
    })();

    return () => {
      cancelledRef.current = true;
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeSlug, claimId, isAuthReady, isSessionValid, liveUpdatesUnavailable, loadEvents]);

  if (error) return <div className="text-xs font-medium text-red-600">{error}</div>;
  if (!events) return <div className="text-xs font-medium text-[#4B5563]">Loading reconstructed history...</div>;

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="text-[10px] font-bold uppercase tracking-tight text-[#111827]">
          Reconstructed history from notifications and agent events
        </div>
        {liveUpdatesUnavailable ? (
          <div className="text-[10px] font-semibold text-amber-700">
            Live updates unavailable. Refreshing reconstructed history every 15 seconds.
          </div>
        ) : (
          <div className="text-[10px] font-medium text-[#374151]">
            Timeline entries are reconstructed backend history, not a canonical case ledger.
          </div>
        )}
        <div className="text-[10px] font-medium text-[#4B5563]">
          Last refreshed: {formatTimelineTimestamp(lastLoadedAt)}
        </div>
      </div>
      {events.length === 0 && (
        <div className="text-xs font-medium text-[#4B5563]">No reconstructed history available</div>
      )}
      {events.map((evt) => {
        const money = formatAmount(evt.amount, evt.currency);
        return (
          <div key={evt.id} className="flex flex-col gap-1 text-[11px] border-l-2 border-[#BFD7FF] pl-4 py-1.5 transition-colors hover:border-[#0052FF]">
            <div className="flex items-center gap-2">
              <div className="font-bold text-[#111827] uppercase tracking-wider">
                {formatTimelineToken(evt.type)} • {formatTimelineToken(evt.status)}
              </div>
            </div>
            <div className="font-mono text-[#4B5563]">{formatTimelineTimestamp(evt.at)}</div>
            <div className="font-medium leading-relaxed text-[#1F2937]">{evt.message || NOT_AVAILABLE}</div>
            {money && <div className="text-emerald-500 font-bold font-mono">Amount: {money}</div>}
            {Array.isArray(evt.docIds) && evt.docIds.length > 0 && (
              <div className="mt-1 flex items-center gap-2 text-[#4B5563]">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#6B7280]">Docs:</span>
                <div className="flex gap-2">
                  {evt.docIds.slice(0, 3).map((id) => (
                    <Link key={id} to={`/app/${activeSlug}/documents/${encodeURIComponent(id)}`} className="text-[#0052FF] underline transition-colors hover:text-[#003DB8]">
                      {id.slice(0, 8)}...
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default Timeline;
