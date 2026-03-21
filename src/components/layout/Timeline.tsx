import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, CheckCircle, DollarSign, AlertTriangle } from 'lucide-react';
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

function formatAmount(amount?: number, currency?: string) {
  if (!amount) return '';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency || 'USD' }).format(amount);
}

function iconFor(type: string, status?: string) {
  if (type === 'refund' && status === 'deposited') return DollarSign;
  if (type === 'claim' && (status === 'filed' || status === 'approved')) return CheckCircle;
  if (type === 'evidence') return FileText;
  return AlertTriangle;
}

export function Timeline({ claimId, tenantSlug }: { claimId: string; tenantSlug?: string }) {
  const [events, setEvents] = useState<EventItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { tenant } = useTenant();
  const activeSlug = tenantSlug || tenant?.slug || 'default';

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(`/api/recoveries/${encodeURIComponent(claimId)}/events?tenantSlug=${encodeURIComponent(activeSlug)}`);
        if (!cancelled) {
          if (res.ok && Array.isArray(res.data)) setEvents(res.data as any);
          else setError(res.error || 'Events unavailable');
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Events unavailable');
      }
    })();
    return () => { cancelled = true; };
  }, [claimId, activeSlug]);

  if (error) return <div className="text-xs text-red-400">{error}</div>;
  if (!events) return <div className="text-xs text-gray-400">Loading...</div>;
  if (events.length === 0) return <div className="text-xs text-gray-400">No events yet</div>;

  return (
    <div className="space-y-4">
      {events.map((evt) => {
        const money = formatAmount(evt.amount, evt.currency);
        return (
          <div key={evt.id} className="flex flex-col gap-1 text-[11px] border-l-2 border-[whitesmoke]/10 pl-4 py-1.5 transition-colors hover:border-[whitesmoke]/30">
            <div className="flex items-center gap-2">
              <div className="font-bold text-[whitesmoke] uppercase tracking-wider">
                {evt.type}{evt.status ? ` • ${evt.status}` : ''}
              </div>
            </div>
            <div className="text-[whitesmoke]/40 font-mono">{new Date(evt.at).toLocaleString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</div>
            {evt.message && <div className="text-[whitesmoke]/80 font-medium leading-relaxed">{evt.message}</div>}
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
