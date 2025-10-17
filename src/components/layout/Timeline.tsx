import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, CheckCircle, DollarSign, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';

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

export function Timeline({ claimId }: { claimId: string }) {
  const [events, setEvents] = useState<EventItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.get(`/api/recoveries/${encodeURIComponent(claimId)}/events`);
        if (!cancelled) {
          if (res.ok && Array.isArray(res.data)) setEvents(res.data as any);
          else setError(res.error || 'Events unavailable');
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Events unavailable');
      }
    })();
    return () => { cancelled = true; };
  }, [claimId]);

  if (error) return <div className="text-xs text-red-400">{error}</div>;
  if (!events) return <div className="text-xs text-gray-400">Loading...</div>;
  if (events.length === 0) return <div className="text-xs text-gray-400">No events yet</div>;

  return (
    <div className="space-y-2">
      {events.map((evt) => {
        const Icon = iconFor(evt.type, evt.status);
        const money = formatAmount(evt.amount, evt.currency);
        return (
          <div key={evt.id} className="flex items-start gap-3 text-sm">
            <div className="mt-0.5 w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              <Icon className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="font-medium text-gray-200">
                  {evt.type}{evt.status ? ` • ${evt.status}` : ''}
                </div>
                <div className="text-xs text-gray-400">{new Date(evt.at).toLocaleString()}</div>
              </div>
              {evt.message && <div className="text-xs text-gray-300">{evt.message}</div>}
              {money && <div className="text-xs text-gray-300">Amount: {money}</div>}
              {Array.isArray(evt.docIds) && evt.docIds.length > 0 && (
                <div className="text-xs text-gray-300">
                  Documents: {evt.docIds.slice(0,3).map((id, i) => (
                    <React.Fragment key={id}>
                      <Link to={`/documents/${encodeURIComponent(id)}`} className="underline hover:text-gray-100">{id}</Link>
                      {i < Math.min(evt.docIds!.length, 3) - 1 ? ', ' : ''}
                    </React.Fragment>
                  ))}
                  {evt.docIds.length > 3 ? '…' : ''}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Timeline;
