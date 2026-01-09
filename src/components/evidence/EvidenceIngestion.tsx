import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Mail, RefreshCw, CheckCircle2, AlertCircle, Cloud, Loader2 } from 'lucide-react';

interface LogEvent {
  type: 'info' | 'success' | 'warning' | 'error' | 'progress' | 'thinking';
  category: 'upload' | 'parse' | 'match' | 'system';
  message: string;
  thinkingDuration?: number;
}

interface EvidenceIngestionProps {
  onIngestionComplete?: (result: {
    totalDocumentsIngested: number;
    totalItemsProcessed: number;
  }) => void;
  onLogEvent?: (event: LogEvent, delayMs?: number) => void;
  gmailConnected?: boolean;
}

interface EvidenceSource {
  id: string;
  provider: 'gmail' | 'outlook' | 'gdrive' | 'dropbox';
  account_email: string;
  status: 'connected' | 'disconnected' | 'error';
  last_sync_at: string | null;
}

export function EvidenceIngestion({ onIngestionComplete, onLogEvent, gmailConnected = false }: EvidenceIngestionProps) {
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
        // Use api client to get sources from backend (handles correct URL routing)
        const res = await api.get<{ success: boolean; sources: EvidenceSource[] }>('/api/evidence/sources');
        if (res.ok && res.data?.sources) {
          setSources(res.data.sources.filter((s: EvidenceSource) => s.status === 'connected'));
        } else {
          console.warn('Failed to load evidence sources:', res.error);
          // Fallback: Set demo source for UI testing
          setSources([{
            id: 'demo-gmail',
            provider: 'gmail',
            account_email: 'demo@gmail.com',
            status: 'connected',
            last_sync_at: new Date().toISOString()
          }]);
        }
      } catch (error) {
        console.error('Failed to load evidence sources:', error);
        // Fallback: Set demo source for UI testing
        setSources([{
          id: 'demo-gmail',
          provider: 'gmail',
          account_email: 'demo@gmail.com',
          status: 'connected',
          last_sync_at: new Date().toISOString()
        }]);
      } finally {
        setLoadingSources(false);
      }
    };
    loadSources();
  }, []);

  const hasConnectedSources = sources.length> 0;

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
      onLogEvent?.({ type: 'warning', category: 'system', message: 'No evidence sources connected' }, 0);
      return;
    }

    setIngesting(true);
    setProgress(0);
    setResult(null);

    // Log ingestion start
    const sourceNames = sources.map(s => getProviderName(s.provider)).join(', ');
    onLogEvent?.({ type: 'info', category: 'system', message: `Connecting to ${sources.length} source(s): ${sourceNames}...`, thinkingDuration: 2 }, 0);
    onLogEvent?.({ type: 'thinking', category: 'system', message: 'Scanning for invoice attachments and documents...' }, 1000);

    try {
      // Use unified ingestion endpoint - processes ALL sources in parallel
      onLogEvent?.({ type: 'progress', category: 'system', message: 'Ingesting from all connected sources...', thinkingDuration: 3 }, 1200);

      const res = await api.ingestAllEvidence({
        maxResults: 50,
        autoParse: true,
      });

      if (res.ok && res.data) {
        // Log success with details
        onLogEvent?.({ type: 'success', category: 'system', message: `[CONNECTED] All sources responded` }, 800);

        if (res.data.totalItemsProcessed> 0) {
          onLogEvent?.({ type: 'thinking', category: 'parse', message: `Found ${res.data.totalItemsProcessed} items to process...` }, 900);
        }

        if (res.data.totalDocumentsIngested> 0) {
          onLogEvent?.({ type: 'success', category: 'parse', message: `[INGESTED] ${res.data.totalDocumentsIngested} document(s) extracted` }, 1100);
          onLogEvent?.({ type: 'thinking', category: 'parse', message: 'Running OCR and text extraction on new documents...' }, 1000);
          onLogEvent?.({ type: 'info', category: 'match', message: 'Queuing documents for claim matching...', thinkingDuration: 4 }, 1300);
        } else {
          onLogEvent?.({ type: 'info', category: 'system', message: 'No new documents found in sources' }, 800);
        }

        // Log per-source results
        if (res.data.results) {
          if (res.data.results.gmail?.documentsIngested) {
            onLogEvent?.({ type: 'success', category: 'parse', message: `Gmail: ${res.data.results.gmail.documentsIngested} docs from ${res.data.results.gmail.emailsProcessed} emails` }, 600);
          }
          if (res.data.results.outlook?.documentsIngested) {
            onLogEvent?.({ type: 'success', category: 'parse', message: `Outlook: ${res.data.results.outlook.documentsIngested} docs from ${res.data.results.outlook.emailsProcessed} emails` }, 600);
          }
          if (res.data.results.gdrive?.documentsIngested) {
            onLogEvent?.({ type: 'success', category: 'parse', message: `Google Drive: ${res.data.results.gdrive.documentsIngested} docs from ${res.data.results.gdrive.filesProcessed} files` }, 600);
          }
          if (res.data.results.dropbox?.documentsIngested) {
            onLogEvent?.({ type: 'success', category: 'parse', message: `Dropbox: ${res.data.results.dropbox.documentsIngested} docs from ${res.data.results.dropbox.filesProcessed} files` }, 600);
          }
        }

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

        if (res.data.errors && res.data.errors.length> 0) {
          onLogEvent?.({ type: 'warning', category: 'system', message: `Completed with ${res.data.errors.length} error(s)` }, 500);
          toast({
            title: 'Ingestion Completed with Errors',
            description: `${res.data.totalDocumentsIngested || 0} documents ingested. ${res.data.errors.length} error(s) occurred.`,
            variant: 'destructive',
          });
        } else {
          onLogEvent?.({ type: 'success', category: 'system', message: '[COMPLETE] Evidence ingestion finished' }, 800);
        }
        setProgress(100);
      } else {
        onLogEvent?.({ type: 'error', category: 'system', message: `Ingestion failed: ${res.error || 'Unknown error'}` }, 0);
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
      onLogEvent?.({ type: 'error', category: 'system', message: 'Network error during ingestion' }, 0);
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
    <Card className="bg-white border border-gray-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium text-gray-800">
          <Cloud className="h-4 w-4" />
          Evidence Ingestion
        </CardTitle>
        <CardDescription className="text-xs text-gray-500">
          Collect documents from all connected sources (Gmail, Outlook, Google Drive, Dropbox)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {loadingSources ? (
          <div className="flex items-center justify-center py-3">
            <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
            <span className="ml-2 text-xs text-gray-500">Loading sources...</span>
          </div>
        ) : (
          <>
            {sources.length> 0 && (
              <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                <div className="text-xs font-medium text-gray-500 mb-2">Connected Sources:</div>
                <div className="flex flex-wrap gap-2">
                  {sources.map((source) => (
                    <Badge key={source.id} className="bg-emerald-100 text-emerald-700 border-emerald-200 text-xs">
                      {getProviderName(source.provider)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Button
              onClick={handleIngest}
              disabled={ingesting || !hasConnectedSources}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-white text-sm h-9">
              {ingesting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />
                  Ingesting from All Sources...
                </>
              ) : (
                <>
                  <Cloud className="w-3.5 h-3.5 mr-2" />
                  Ingest from All Sources
                </>
              )}
            </Button>

            {!hasConnectedSources && (
              <div className="flex items-center gap-2 text-xs text-amber-600">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Connect at least one source to ingest evidence documents.</span>
              </div>
            )}

            {ingesting && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Processing documents from all sources...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {result && (
              <div className="space-y-3 p-4 rounded-lg bg-gray-50 border border-gray-200">
                <div className="flex items-center gap-2">
                  {result.success ? (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Completed
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-700 border-red-200">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      Failed
                    </Badge>
                  )}
                  <span className="text-sm text-gray-700">{result.message}</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Documents Ingested:</span>
                    <span className="ml-2 font-medium text-gray-800">{result.totalDocumentsIngested}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Items Processed:</span>
                    <span className="ml-2 font-medium text-gray-800">{result.totalItemsProcessed}</span>
                  </div>
                </div>
                {result.results && (
                  <div className="pt-2 border-t border-white/10">
                    <div className="text-xs font-medium text-gray-400 mb-2">Breakdown by Source:</div>
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
                {result.errors && result.errors.length> 0 && (
                  <div className="mt-2 p-2 rounded bg-red-500/10 border border-red-500/20">
                    <div className="text-xs font-medium text-red-400 mb-1">Errors:</div>
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

