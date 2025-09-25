import React, { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { detectionApi } from '@/lib/detectionApi';

export default function Detections() {
  const [loading, setLoading] = useState(false);
  const [detectionId, setDetectionId] = useState<string | null>(null);
  const [status, setStatus] = useState<any>(null);

  const handleRun = async () => {
    setLoading(true);
    try {
      const res = await detectionApi.runDetection();
      setDetectionId(res.detection_id);
      const s = await detectionApi.getStatus(res.detection_id);
      setStatus(s);
    } catch (e) {
      // noop for now
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!detectionId) return;
    try { setStatus(await detectionApi.getStatus(detectionId)); } catch {}
  };

  return (
    <PageLayout title="Detections">
      <div className="max-w-3xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Run Detection</CardTitle>
          </CardHeader>
          <CardContent className="space-x-2">
            <Button onClick={handleRun} disabled={loading} className="mr-2">{loading ? 'Running…' : 'Run Detection'}</Button>
            <Button variant="outline" onClick={handleRefresh} disabled={!detectionId}>Check Status</Button>
            <div className="mt-4 text-xs">
              <div>Detection ID: {detectionId || '—'}</div>
              <pre className="mt-2 bg-gray-900 text-white p-3 rounded overflow-auto">{status ? JSON.stringify(status, null, 2) : 'No status yet'}</pre>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}

