import React, { useEffect, useRef, useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { startInventorySync, fetchSyncStatus } from '@/lib/api';

type SyncState = 'idle' | 'starting' | 'in_progress' | 'completed' | 'error';

export default function Sync() {
  const [state, setState] = useState<SyncState>('idle');
  const [progress, setProgress] = useState<number>(0);
  const [message, setMessage] = useState<string>('');
  const pollRef = useRef<number | null>(null);

  const stopPolling = () => {
    if (pollRef.current) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const pollStatus = async () => {
    const res = await fetchSyncStatus<{ status: string; progress?: number; message?: string }>();
    if (!res.ok) return;
    const s = res.data?.status || 'in_progress';
    const p = res.data?.progress ?? progress;
    const m = res.data?.message || '';
    setMessage(m);
    setProgress(p);
    if (s === 'completed') {
      setState('completed');
      stopPolling();
    } else if (s === 'in_progress' || s === 'queued') {
      setState('in_progress');
    }
  };

  const start = async () => {
    setState('starting');
    setProgress(0);
    setMessage('Initializing sync...');
    const res = await startInventorySync();
    if (!res.ok) {
      setState('error');
      setMessage('Failed to start sync');
      return;
    }
    setState('in_progress');
    setMessage('Sync in progress...');
    stopPolling();
    pollRef.current = window.setInterval(pollStatus, 1500);
  };

  useEffect(() => {
    return () => stopPolling();
  }, []);

  return (
    <PageLayout title="Smart Inventory Sync">
      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Inventory Sync</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We will pull inventory, transactions, and fees from your Amazon Seller account, normalize the data, and run detection algorithms.
            </p>

            <div className="flex items-center gap-2">
              <Button onClick={start} disabled={state === 'starting' || state === 'in_progress'}>
                {state === 'in_progress' ? 'Syncing…' : 'Start Sync'}
              </Button>
              {state === 'completed' && (
                <span className="text-sm text-green-600">Sync Complete</span>
              )}
              {state === 'error' && (
                <span className="text-sm text-red-600">{message}</span>
              )}
            </div>

            {(state === 'starting' || state === 'in_progress') && (
              <div className="space-y-2">
                <Progress value={progress} />
                <div className="text-xs text-muted-foreground">{message}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}

