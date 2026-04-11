import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { createAuthenticatedEventStream } from '@/lib/authenticatedSSE';
import { useToast } from '@/components/ui/use-toast';
import { RefreshCw, AlertCircle, Cloud, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  provider: 'gmail' | 'outlook' | 'gdrive' | 'dropbox' | 'onedrive' | 'adobe_sign' | 'slack';
  account_email: string;
  status: 'connected' | 'disconnected' | 'error';
  connected: boolean;
  ingestable: boolean;
  ingestable_reason: string | null;
  last_ingested_at: string | null;
  documents_count: number;
  parsed_count: number;
  match_ready_count: number;
  metadata: Record<string, any>;
}

export function EvidenceIngestion({ onIngestionComplete, onLogEvent, gmailConnected = false }: EvidenceIngestionProps) {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const [ingesting, setIngesting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [sources, setSources] = useState<EvidenceSource[]>([]);
  const [loadingSources, setLoadingSources] = useState(true);
  const [result, setResult] = useState<{
    success: boolean;
    totalDocumentsIngested: number;
    totalItemsProcessed: number;
    documentsInserted: number;
    sourcesResolved: number;
    providersAttempted: string[];
    errors: string[];
    results?: {
      gmail?: { documentsIngested: number; emailsProcessed: number };
      outlook?: { documentsIngested: number; emailsProcessed: number };
      gdrive?: { documentsIngested: number; filesProcessed: number };
      dropbox?: { documentsIngested: number; filesProcessed: number };
      onedrive?: { documentsIngested: number; filesProcessed: number };
      adobe_sign?: { documentsIngested: number; agreementsProcessed: number };
      slack?: { documentsIngested: number; messagesProcessed: number };
    };
    message: string;
  } | null>(null);
  const { toast } = useToast();

  // Load connected sources
  useEffect(() => {
    const loadSources = async () => {
      try {
        if (!tenantSlug) {
          setSources([]);
          return;
        }

        const sourcesRes = await api.getEvidenceSources(tenantSlug);
        setSources(sourcesRes.ok && sourcesRes.data?.sources ? sourcesRes.data.sources : []);
      } catch (error) {
        console.error('Failed to load evidence sources:', error);
      } finally {
        setLoadingSources(false);
      }
    };
    loadSources();
  }, [tenantSlug]);

  const hasConnectedSources = sources.some((source) => source.connected);
  const hasIngestableSources = sources.some((source) => source.ingestable);

  // Listen for SSE events
  useEffect(() => {
    if (!ingesting) return;

    const activeSlug = tenantSlug || 'beta';
    const eventSource = createAuthenticatedEventStream(
      api.buildApiUrl(`/api/sse/status?tenantSlug=${activeSlug}`),
      { autoReconnect: true, reconnectDelayMs: 3000 }
    );

    eventSource.addEventListener('evidence_ingestion_started', () => {
      setProgress(10);
      onLogEvent?.({ type: 'progress', category: 'system', message: 'Evidence ingestion started.' }, 0);
      toast({
        title: 'Ingestion Started',
        description: 'Collecting documents from all connected sources...',
      });
    });

    eventSource.addEventListener('evidence_ingestion_completed', (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data);
        setProgress(100);
        onLogEvent?.({
          type: 'success',
          category: 'system',
          message: `Evidence ingestion completed. ${data.totalDocumentsIngested || 0} documents from ${data.totalItemsProcessed || 0} items.`
        }, 0);
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
  }, [ingesting, tenantSlug, toast]);

  const handleIngest = async () => {
    if (!tenantSlug) {
      toast({
        title: 'Workspace Required',
        description: 'A tenant workspace is required before evidence ingestion can start.',
        variant: 'destructive',
      });
      return;
    }

    if (!hasIngestableSources) {
      toast({
        title: 'No Ingestable Sources',
        description: 'A source may be connected, but the backend could not confirm usable auth for ingestion.',
        variant: 'destructive',
      });
      onLogEvent?.({ type: 'warning', category: 'system', message: 'No ingestable evidence sources were confirmed by the backend' }, 0);
      return;
    }

    setIngesting(true);
    setProgress(0);
    setResult(null);

    try {
      const res = await api.ingestAllEvidence({
        maxResults: 50,
        autoParse: true,
      }, tenantSlug);

      if (res.ok && res.data) {
        setResult({
          success: res.data.success,
          totalDocumentsIngested: res.data.totalDocumentsIngested || 0,
          totalItemsProcessed: res.data.totalItemsProcessed || 0,
          documentsInserted: res.data.documentsInserted || 0,
          sourcesResolved: res.data.sourcesResolved || 0,
          providersAttempted: res.data.providersAttempted || [],
          errors: res.data.errors || [],
          results: res.data.results,
          message: res.data.message || `Ingested ${res.data.totalDocumentsIngested || 0} documents from ${res.data.totalItemsProcessed || 0} items.`,
        });

        onIngestionComplete?.({
          totalDocumentsIngested: res.data.totalDocumentsIngested || 0,
          totalItemsProcessed: res.data.totalItemsProcessed || 0,
        });

        if (res.data.errors && res.data.errors.length > 0) {
          onLogEvent?.({ type: 'warning', category: 'system', message: `Completed with ${res.data.errors.length} error(s)` }, 500);
          toast({
            title: 'Ingestion Completed with Errors',
            description: `${res.data.totalDocumentsIngested || 0} documents ingested. ${res.data.errors.length} error(s) occurred.`,
            variant: 'destructive',
          });
        } else {
          onLogEvent?.({
            type: 'success',
            category: 'system',
            message: `Evidence ingestion request completed. ${res.data.totalDocumentsIngested || 0} documents were ingested from ${res.data.totalItemsProcessed || 0} items.`
          }, 0);
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
          documentsInserted: 0,
          sourcesResolved: 0,
          providersAttempted: [],
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
        documentsInserted: 0,
        sourcesResolved: 0,
        providersAttempted: [],
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
      case 'onedrive': return 'OneDrive';
      case 'adobe_sign': return 'Adobe Sign';
      case 'slack': return 'Slack';
      default: return provider;
    }
  };

  return (
    <div className="relative group">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-white/[0.03] border border-white/10 rounded-xl group-hover:border-white/15 transition-colors">
            <Cloud className="h-4 w-4 text-white/45" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-sans font-bold text-white/35 uppercase tracking-tight">Collector</span>
            <h3 className="text-sm font-sans font-bold text-white tracking-tight uppercase">Scanner</h3>
          </div>
        </div>

        {loadingSources ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-3 w-3 animate-spin text-white/20" />
            <span className="text-[9px] font-sans font-bold text-white/20 uppercase tracking-tight">Checking sources...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className={cn("h-1.5 w-1.5 rounded-full", hasIngestableSources ? "bg-white/55 shadow-[0_0_8px_rgba(255,255,255,0.18)]" : "bg-rose-500")} />
            <span className="text-[9px] font-sans font-bold text-white/40 uppercase tracking-tight">
              {sources.filter((source) => source.ingestable).length} Ingestable sources
            </span>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {!loadingSources && sources.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {sources.map((source) => (
              <div key={source.id} className="px-2 py-0.5 bg-white/[0.03] border border-white/10 text-[9px] font-sans font-bold text-white/55 uppercase tracking-tight rounded-sm">
                {getProviderName(source.provider)}{source.ingestable ? '' : ' · Not Ready'}
              </div>
            ))}
          </div>
        )}

        <div className="relative">
          <Button
            onClick={handleIngest}
            disabled={ingesting || !hasIngestableSources}
            className={cn(
              "w-full h-10 px-6 text-[11px] font-sans font-bold uppercase tracking-tight rounded-lg transition-all",
              ingesting
                ? "bg-white/[0.03] text-white/40 border border-white/10"
                : "bg-white/[0.05] hover:bg-white/[0.08] text-white border border-white/10 shadow-none"
            )}
          >
            {ingesting ? (
              <div className="flex items-center gap-3">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Collecting documents...
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Cloud className="w-3.5 h-3.5" />
                Sync Evidence
              </div>
            )}
          </Button>

          {ingesting && (
            <div className="absolute -bottom-1 left-0 right-0 h-[1px] bg-white/5 overflow-hidden rounded-full">
              <div
                className="h-full bg-white/55 shadow-[0_0_10px_rgba(255,255,255,0.25)] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        {!hasIngestableSources && !loadingSources && (
          <div className="flex items-start gap-3 p-4 bg-rose-500/[0.02] border border-rose-500/10 rounded-lg">
            <AlertCircle className="w-3.5 h-3.5 text-rose-500/40 mt-0.5" />
            <span className="text-[10px] font-sans font-bold text-rose-500/60 uppercase tracking-tight leading-relaxed">
              Sync Paused: Connected sources are not yet confirmed ingestable by the backend.
            </span>
          </div>
        )}

        {result && (
          <div className="p-5 bg-white/[0.02] border border-white/5 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <span className="text-[9px] font-sans font-bold text-white/20 uppercase tracking-tight">Sync Summary</span>
                <span className={cn("text-xs font-sans font-bold uppercase", result.success ? "text-white/70" : "text-rose-500")}>
                  {result.success ? 'Success' : 'Error'}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-[9px] font-sans font-bold text-white/20 uppercase tracking-tight">Documents Inserted</div>
                  <div className="text-sm font-sans font-bold text-white tracking-tight">{result.documentsInserted}</div>
                </div>
                <div className="h-6 w-[1px] bg-white/5" />
                <div className="text-right">
                  <div className="text-[9px] font-sans font-bold text-white/20 uppercase tracking-tight">Sources Resolved</div>
                  <div className="text-sm font-sans font-bold text-white tracking-tight">{result.sourcesResolved}</div>
                </div>
              </div>
            </div>

            {result.results && (
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5">
                {Object.entries(result.results).map(([source, data]: [string, any]) => (
                  <div key={source} className="flex flex-col gap-0.5">
                    <span className="text-[8px] font-sans font-bold text-white/20 uppercase tracking-tight">{getProviderName(source)}</span>
                    <span className="text-[10px] font-sans font-bold text-white/60 tracking-tight">{data.documentsIngested || 0} docs found</span>
                  </div>
                ))}
              </div>
            )}

            {result.errors.length > 0 && (
              <div className="pt-3 border-t border-white/5 space-y-2">
                <div className="text-[8px] font-sans font-bold text-rose-500/60 uppercase tracking-tight">Error Details</div>
                {result.errors.slice(0, 3).map((error, index) => (
                  <div key={`${error}-${index}`} className="text-[10px] font-sans font-bold text-rose-500/75 leading-relaxed tracking-tight">
                    {error}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
