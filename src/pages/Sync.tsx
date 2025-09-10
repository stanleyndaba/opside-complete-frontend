import React, { useEffect, useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function Sync() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const initialSyncId = params.get('id') || undefined;
  const [syncId, setSyncId] = useState<string | undefined>(initialSyncId);
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<'idle' | 'in_progress' | 'complete' | 'failed'>('idle');
  const [message, setMessage] = useState<string>('Initializing sync...');

  useEffect(() => {
    let cancelled = false;

    async function ensureSync() {
      if (!syncId) {
        const start = await api.startAmazonSync();
        if (!start.ok) {
          setStatus('failed');
          setMessage(start.error || 'Failed to start sync');
          return;
        }
        setSyncId(start.data!.syncId);
      }
      setStatus('in_progress');
      setMessage('Inventory Sync in progress...');
    }

    ensureSync();

    const interval = setInterval(async () => {
      if (!syncId) return;
      const res = await api.getSyncStatus(syncId);
      if (!res.ok) return;
      if (cancelled) return;
      const s = res.data!;
      if (typeof s.progress === 'number') setProgress(s.progress);
      if (s.message) setMessage(s.message);
      if (s.status === 'complete') {
        setStatus('complete');
        clearInterval(interval);
        setTimeout(() => navigate('/app'), 1000);
      } else if (s.status === 'failed') {
        setStatus('failed');
        clearInterval(interval);
      } else {
        setStatus('in_progress');
      }
    }, 1500);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [syncId, navigate]);

  return (
    <PageLayout title="Smart Inventory Sync">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Inventory Sync</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">{message}</p>
              <div className="w-full bg-gray-100 rounded h-3 overflow-hidden">
                <div className={`h-3 ${status === 'failed' ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${progress}%`, transition: 'width 0.6s ease' }} />
              </div>
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{progress}%</span>
                <span>{status === 'complete' ? 'Completed' : status === 'failed' ? 'Failed' : 'In Progress'}</span>
              </div>
              {status === 'failed' && (
                <Button onClick={() => window.location.reload()}>Retry</Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}

