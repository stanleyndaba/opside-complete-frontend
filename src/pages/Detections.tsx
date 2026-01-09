import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { detectionApi } from '@/lib/detectionApi';
import { RefreshCw, Play, AlertTriangle, CheckCircle2, DollarSign, Clock } from 'lucide-react';

interface DetectionResult {
  id: string;
  anomaly_type: string;
  severity: string;
  estimated_value: number;
  currency: string;
  confidence_score: number;
  status: string;
  discovery_date: string;
  deadline_date: string;
  days_remaining: number;
}

interface DetectionStats {
  total_anomalies?: number;
  total_value?: number;
  by_confidence?: { high: number; medium: number; low: number };
}

export default function Detections() {
  const [loading, setLoading] = useState(false);
  const [loadingResults, setLoadingResults] = useState(false);
  const [detectionId, setDetectionId] = useState<string | null>(null);
  const [status, setStatus] = useState<any>(null);
  const [results, setResults] = useState<DetectionResult[]>([]);
  const [stats, setStats] = useState<DetectionStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadDetectionData();
  }, []);

  const loadDetectionData = async () => {
    setLoadingResults(true);
    setError(null);
    try {
      const [resultsRes, statsRes] = await Promise.all([
        detectionApi.getDetectionResults({ limit: 20 }),
        detectionApi.getDetectionStatistics(),
      ]);
      setResults(resultsRes?.results || []);
      setStats(statsRes?.statistics || null);
    } catch (e: any) {
      console.error('Failed to load detection data:', e);
      setError(e.message || 'Failed to load detection data');
    } finally {
      setLoadingResults(false);
    }
  };

  const handleRun = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await detectionApi.runDetection();
      const id = res.detection_id || res.detectionId;
      setDetectionId(id || null);
      if (id) {
        const s = await detectionApi.getStatus(id);
        setStatus(s);
      }
      // Reload results after running detection
      setTimeout(loadDetectionData, 2000);
    } catch (e: any) {
      console.error('Detection failed:', e);
      setError(e.message || 'Detection failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!detectionId) return;
    try { 
      setStatus(await detectionApi.getStatus(detectionId)); 
    } catch (e: any) {
      console.error('Status check failed:', e);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity?.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getConfidenceColor = (score: number) => {
    if (score>= 0.85) return 'text-emerald-600';
    if (score>= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatCurrency = (value: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
  };

  return (
    <PageLayout title="Agent 3: Claim Detection">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Anomalies</p>
                  <p className="text-2xl font-bold">{stats?.total_anomalies?.toLocaleString() || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats?.total_value || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-sm text-muted-foreground">High Confidence</p>
                  <p className="text-2xl font-bold">{stats?.by_confidence?.high || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Medium Confidence</p>
                  <p className="text-2xl font-bold">{stats?.by_confidence?.medium || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Run Detection Card */}
        <Card>
          <CardHeader>
            <CardTitle>Run Detection</CardTitle>
            <CardDescription>Trigger Agent 3 to analyze synced data and detect claim opportunities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={handleRun} disabled={loading}>
                {loading ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Run Detection
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={handleRefresh} disabled={!detectionId}>
                Check Status
              </Button>
              <Button variant="outline" onClick={loadDetectionData} disabled={loadingResults}>
                {loadingResults ? (
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="mr-2 h-4 w-4" />
                )}
                Refresh Results
              </Button>
            </div>
            
            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
                {error}
              </div>
            )}
            
            {detectionId && (
              <div className="text-sm bg-gray-50 p-3 rounded-lg">
                <div><strong>Detection ID:</strong> {detectionId}</div>
                {status && (
                  <pre className="mt-2 bg-gray-900 text-white p-3 rounded overflow-auto text-xs">
                    {JSON.stringify(status, null, 2)}
                  </pre>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Detection Results */}
        <Card>
          <CardHeader>
            <CardTitle>Detection Results</CardTitle>
            <CardDescription>
              {results.length> 0 
                ? `Showing ${results.length} detected anomalies` 
                : 'No detection results yet. Run a detection to find claim opportunities.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingResults ? (
              <div className="text-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
                <p className="text-sm text-muted-foreground mt-2">Loading detection results...</p>
              </div>
            ) : results.length> 0 ? (
              <div className="space-y-3">
                {results.map((result) => (
                  <div 
                    key={result.id} 
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <Badge className={getSeverityColor(result.severity)}>
                        {result.severity}
                      </Badge>
                      <div>
                        <p className="font-medium">{result.anomaly_type.replace(/_/g, ' ')}</p>
                        <p className="text-sm text-muted-foreground">
                          {result.days_remaining> 0 
                            ? `${result.days_remaining} days remaining` 
                            : 'Deadline passed'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-emerald-600">
                        {formatCurrency(result.estimated_value, result.currency)}
                      </p>
                      <p className={`text-sm ${getConfidenceColor(result.confidence_score)}`}>
                        {Math.round(result.confidence_score * 100)}% confidence
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No detection results available.</p>
                <p className="text-sm">Run a detection to analyze your data.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}

