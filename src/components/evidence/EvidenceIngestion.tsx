import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Mail, RefreshCw, CheckCircle2, AlertCircle, Cloud, Loader2 } from 'lucide-react';

interface EvidenceIngestionProps {
  onIngestionComplete?: (result: {
    totalDocumentsIngested: number;
    totalItemsProcessed: number;
  }) => void;
  gmailConnected?: boolean;
}

interface EvidenceSource {
  id: string;
  provider: 'gmail' | 'outlook' | 'gdrive' | 'dropbox';
  account_email: string;
  status: 'connected' | 'disconnected' | 'error';
  last_sync_at: string | null;
}

export function EvidenceIngestion({ onIngestionComplete, gmailConnected = false }: EvidenceIngestionProps) {
  const [ingesting, setIngesting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sources, setSources] = useState<EvidenceSource[]>([]);
  const [loadingSources, setLoadingSources] = useState(true);
  const [result, setResult] = useState<{
    success: boolean;
    totalDocumentsIngested: number;
    totalItemsProcessed: number;
    errors: string[];
    results?: {
      gmail?: { documentsIngested: number; emailsProcessed: number };
      outlook?: { documentsIngested: number; emailsProcessed: number };
      gdrive?: { documentsIngested: number; filesProcessed: number };
      dropbox?: { documentsIngested: number; filesProcessed: number };
    };
    message: string;
  } | null>(null);
  const { toast } = useToast();

  // Load connected sources
  useEffect(() => {
    const loadSources = async () => {
      try {
        // Try to get sources from evidence API
        const res = await fetch('/api/evidence/sources', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.sources) {
            setSources(data.sources.filter((s: EvidenceSource) => s.status === 'connected'));
          }
        }
      } catch (error) {
        console.error('Failed to load evidence sources:', error);
      } finally {
        setLoadingSources(false);
      }
    };
    loadSources();
  }, []);

  const hasConnectedSources = sources.length > 0;

  // Listen for SSE events
  useEffect(() => {
    if (!ingesting) return;

    const eventSource = new EventSource('/api/sse/status');
    
    eventSource.addEventListener('evidence_ingestion_started', () => {
      setProgress(10);
      toast({
        title: 'Ingestion Started',
        description: 'Collecting documents from all connected sources...',
      });
    });

    eventSource.addEventListener('evidence_ingestion_completed', (event) => {
      try {
        const data = JSON.parse(event.data);
        setProgress(100);
        toast({
          title: 'Ingestion Completed',
          description: `Ingested ${data.totalDocumentsIngested || 0} documents from ${data.totalItemsProcessed || 0} items.`,
        });
      } catch (error) {
        console.error('Failed to parse SSE event:', error);
      }
    });

    return () => {
      eventSource.close();
    };
  }, [ingesting, toast]);

  const handleIngest = async () => {
    if (!hasConnectedSources) {
      toast({
        title: 'No Sources Connected',
        description: 'Please connect at least one source (Gmail, Outlook, Google Drive, or Dropbox) to ingest evidence documents.',
        variant: 'destructive',
      });
      return;
    }

    setIngesting(true);
    setProgress(0);
    setResult(null);

    try {
      // Use unified ingestion endpoint - processes ALL sources in parallel
      const res = await api.ingestAllEvidence({
        maxResults: 50,
        autoParse: true,
      });

      if (res.ok && res.data) {
        setResult({
          success: res.data.success,
          totalDocumentsIngested: res.data.totalDocumentsIngested || 0,
          totalItemsProcessed: res.data.totalItemsProcessed || 0,
          errors: res.data.errors || [],
          results: res.data.results,
          message: res.data.message || `Ingested ${res.data.totalDocumentsIngested || 0} documents from ${res.data.totalItemsProcessed || 0} items.`,
        });
        
        onIngestionComplete?.({
          totalDocumentsIngested: res.data.totalDocumentsIngested || 0,
          totalItemsProcessed: res.data.totalItemsProcessed || 0,
        });

        if (res.data.errors && res.data.errors.length > 0) {
          toast({
            title: 'Ingestion Completed with Errors',
            description: `${res.data.totalDocumentsIngested || 0} documents ingested. ${res.data.errors.length} error(s) occurred.`,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Ingestion Completed',
            description: `Successfully ingested ${res.data.totalDocumentsIngested || 0} documents from ${res.data.totalItemsProcessed || 0} items.`,
          });
        }
        setProgress(100);
      } else {
        toast({
          title: 'Ingestion Failed',
          description: res.error || 'Failed to trigger evidence ingestion. Please try again.',
          variant: 'destructive',
        });
        setResult({
          success: false,
          totalDocumentsIngested: 0,
          totalItemsProcessed: 0,
          errors: [res.error || 'Unknown error'],
          message: 'Ingestion failed',
        });
      }
    } catch (error) {
      console.error('Failed to ingest evidence:', error);
      toast({
        title: 'Ingestion Failed',
        description: 'An error occurred while ingesting evidence. Please try again.',
        variant: 'destructive',
      });
      setResult({
        success: false,
        totalDocumentsIngested: 0,
        totalItemsProcessed: 0,
        errors: ['Network error'],
        message: 'Ingestion failed',
      });
    } finally {
      setIngesting(false);
      setTimeout(() => setProgress(0), 2000);
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'gmail': return 'Gmail';
      case 'outlook': return 'Outlook';
      case 'gdrive': return 'Google Drive';
      case 'dropbox': return 'Dropbox';
      default: return provider;
    }
  };

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-[#36454F]">
          <Cloud className="h-5 w-5" />
          Evidence Ingestion
        </CardTitle>
        <CardDescription className="text-gray-400">
          Collect documents from all connected sources (Gmail, Outlook, Google Drive, Dropbox)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loadingSources ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            <span className="ml-2 text-sm text-gray-400">Loading sources...</span>
          </div>
        ) : (
          <>
            {sources.length > 0 && (
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="text-xs font-semibold text-gray-400 mb-2">Connected Sources:</div>
                <div className="flex flex-wrap gap-2">
                  {sources.map((source) => (
                    <Badge key={source.id} className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                      {getProviderName(source.provider)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={handleIngest}
              disabled={ingesting || !hasConnectedSources}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-white"
            >
              {ingesting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Ingesting from All Sources...
                </>
              ) : (
                <>
                  <Cloud className="w-4 h-4 mr-2" />
                  Ingest from All Sources
                </>
              )}
            </Button>

            {!hasConnectedSources && (
              <div className="flex items-center gap-2 text-sm text-amber-400">
                <AlertCircle className="w-4 h-4" />
                <span>Connect at least one source to ingest evidence documents.</span>
              </div>
            )}

            {ingesting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-gray-400">
                  <span>Processing documents from all sources...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {result && (
              <div className="space-y-3 p-4 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Completed
                    </Badge>
                  ) : (
                    <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Failed
                    </Badge>
                  )}
                  <span className="text-sm text-gray-300">{result.message}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Documents Ingested:</span>
                    <span className="ml-2 font-semibold text-gray-200">{result.totalDocumentsIngested}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Items Processed:</span>
                    <span className="ml-2 font-semibold text-gray-200">{result.totalItemsProcessed}</span>
                  </div>
                </div>
                {result.results && (
                  <div className="pt-2 border-t border-white/10">
                    <div className="text-xs font-semibold text-gray-400 mb-2">Breakdown by Source:</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {result.results.gmail && (
                        <div className="text-gray-300">
                          Gmail: {result.results.gmail.documentsIngested} docs
                        </div>
                      )}
                      {result.results.outlook && (
                        <div className="text-gray-300">
                          Outlook: {result.results.outlook.documentsIngested} docs
                        </div>
                      )}
                      {result.results.gdrive && (
                        <div className="text-gray-300">
                          Google Drive: {result.results.gdrive.documentsIngested} docs
                        </div>
                      )}
                      {result.results.dropbox && (
                        <div className="text-gray-300">
                          Dropbox: {result.results.dropbox.documentsIngested} docs
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {result.errors && result.errors.length > 0 && (
                  <div className="mt-2 p-2 rounded bg-red-500/10 border border-red-500/20">
                    <div className="text-xs font-semibold text-red-400 mb-1">Errors:</div>
                    <ul className="text-xs text-red-300 list-disc list-inside">
                      {result.errors.map((error, idx) => (
                        <li key={idx}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

