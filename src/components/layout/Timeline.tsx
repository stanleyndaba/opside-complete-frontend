import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { useTenant } from '@/contexts/TenantContext';

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
  const activeSlug = tenantSlug || tenant?.slug || 'default';

  const loadEvents = useCallback(async (cancelledRef?: { current: boolean }) => {
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
  }, [activeSlug, claimId]);

  useEffect(() => {
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
  }, [liveUpdatesUnavailable, loadEvents]);

  if (error) return <div className="text-xs text-red-400">{error}</div>;
  if (!events) return <div className="text-xs text-gray-400">Loading reconstructed history...</div>;

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <div className="text-[10px] font-bold uppercase tracking-tight text-white/35">
          Reconstructed history from notifications and agent events
        </div>
        {liveUpdatesUnavailable ? (
          <div className="text-[10px] font-medium text-amber-400/80">
            Live updates unavailable. Refreshing reconstructed history every 15 seconds.
          </div>
        ) : (
          <div className="text-[10px] font-medium text-white/35">
            Timeline entries are reconstructed backend history, not a canonical case ledger.
          </div>
        )}
        <div className="text-[10px] font-medium text-white/25">
          Last refreshed: {formatTimelineTimestamp(lastLoadedAt)}
        </div>
      </div>
      {events.length === 0 && (
        <div className="text-xs text-gray-400">No reconstructed history available</div>
      )}
      {events.map((evt) => {
        const money = formatAmount(evt.amount, evt.currency);
        return (
          <div key={evt.id} className="flex flex-col gap-1 text-[11px] border-l-2 border-[whitesmoke]/10 pl-4 py-1.5 transition-colors hover:border-[whitesmoke]/30">
            <div className="flex items-center gap-2">
              <div className="font-bold text-[whitesmoke] uppercase tracking-wider">
                {formatTimelineToken(evt.type)} • {formatTimelineToken(evt.status)}
              </div>
            </div>
            <div className="text-[whitesmoke]/40 font-mono">{formatTimelineTimestamp(evt.at)}</div>
            <div className="text-[whitesmoke]/80 font-medium leading-relaxed">{evt.message || NOT_AVAILABLE}</div>
            {money && <div className="text-emerald-500 font-bold font-mono">Amount: {money}</div>}
            {Array.isArray(evt.docIds) && evt.docIds.length > 0 && (
              <div className="text-[whitesmoke]/50 flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">Docs:</span>
                <div className="flex gap-2">
                  {evt.docIds.slice(0, 3).map((id) => (
                    <Link key={id} to={`/app/${activeSlug}/documents/${encodeURIComponent(id)}`} className="text-indigo-400 underline hover:text-indigo-300 transition-colors">
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
