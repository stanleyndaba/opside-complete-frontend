import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
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
  provider: 'gmail' | 'outlook' | 'gdrive' | 'dropbox';
  account_email: string;
  status: 'connected' | 'disconnected' | 'error';
  last_sync_at: string | null;
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
        const [sourcesRes, statusRes] = await Promise.all([
          api.get<{ success: boolean; sources: EvidenceSource[] }>('/api/evidence/sources'),
          api.getIntegrationsStatus(tenantSlug || 'beta')
        ]);

        const connectedProviders: EvidenceSource[] = [];
        const platforms = ['gmail', 'outlook', 'gdrive', 'dropbox', 'slack', 'adobe_sign', 'onedrive'];
        const apiSources = sourcesRes.ok && sourcesRes.data?.sources ? sourcesRes.data.sources : [];
        const statusData = statusRes.ok && statusRes.data ? statusRes.data : null;

        platforms.forEach((p) => {
          let isConnected = false;
          let lastSync: string | null = null;
          
          try {
            const statusObj = statusData as any;
            
            // Check direct exact match in providerIngest
            if (statusObj?.providerIngest?.[p]?.connected === true) {
              isConnected = true;
              lastSync = statusObj.providerIngest[p].lastIngest || null;
            }
            
            // Check capitalized
            const capitalized = p.charAt(0).toUpperCase() + p.slice(1);
            if (!isConnected && statusObj?.providerIngest?.[capitalized]?.connected === true) {
              isConnected = true;
              lastSync = statusObj.providerIngest[capitalized].lastIngest || null;
            }
            
            // Check legacy `providers`
            if (!isConnected && statusObj?.providers?.[p] === true) isConnected = true;
            if (!isConnected && statusObj?.providers?.[capitalized] === true) isConnected = true;
            
            // Handle google_drive vs gdrive mapping
            if (!isConnected && p === 'gdrive' && statusObj?.providerIngest?.['google_drive']?.connected === true) {
              isConnected = true;
              lastSync = statusObj.providerIngest['google_drive'].lastIngest || null;
            }
            if (!isConnected && p === 'gdrive' && statusObj?.providers?.['google_drive'] === true) isConnected = true;
            
            // Check root field e.g. `gmail_connected`
            if (!isConnected && statusObj && statusObj[`${p}_connected`] === true) isConnected = true;

            // Lastly check evidence sources array
            if (!isConnected && apiSources.length > 0) {
              const matchingSource = apiSources.find((s: any) => {
                const sLower = s.provider?.toLowerCase() || '';
                const pLower = p.toLowerCase();
                return s.status === 'connected' && 
                       (sLower === pLower || (pLower === 'gdrive' && sLower === 'google_drive'));
              });
              if (matchingSource) {
                isConnected = true;
                lastSync = matchingSource.last_sync_at || null;
              }
            }
          } catch (e) {
            console.error("Error checking connection status for", p, e);
          }

          if (isConnected) {
            connectedProviders.push({
              id: `integration-${p}`,
              provider: p as 'gmail' | 'outlook' | 'gdrive' | 'dropbox',
              account_email: '',
              status: 'connected',
              last_sync_at: lastSync,
            });
          }
        });

        setSources(connectedProviders);
      } catch (error) {
        console.error('Failed to load evidence sources:', error);
      } finally {
        setLoadingSources(false);
      }
    };
    loadSources();
  }, [tenantSlug]);

  const hasConnectedSources = sources.length > 0;

  // Listen for SSE events
  useEffect(() => {
    if (!ingesting) return;

    const eventSource = new EventSource('/api/sse/status');

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
        const data = JSON.parse(event.data);
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

    try {
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
            <div className={cn("h-1.5 w-1.5 rounded-full", hasConnectedSources ? "bg-white/55 shadow-[0_0_8px_rgba(255,255,255,0.18)]" : "bg-rose-500")} />
            <span className="text-[9px] font-sans font-bold text-white/40 uppercase tracking-tight">
              {sources.length} Active sources
            </span>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {!loadingSources && sources.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {sources.map((source) => (
              <div key={source.id} className="px-2 py-0.5 bg-white/[0.03] border border-white/10 text-[9px] font-sans font-bold text-white/55 uppercase tracking-tight rounded-sm">
                {getProviderName(source.provider)}
              </div>
            ))}
          </div>
        )}

        <div className="relative">
          <Button
            onClick={handleIngest}
            disabled={ingesting || !hasConnectedSources}
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

        {!hasConnectedSources && !loadingSources && (
          <div className="flex items-start gap-3 p-4 bg-rose-500/[0.02] border border-rose-500/10 rounded-lg">
            <AlertCircle className="w-3.5 h-3.5 text-rose-500/40 mt-0.5" />
            <span className="text-[10px] font-sans font-bold text-rose-500/60 uppercase tracking-tight leading-relaxed">
              Sync Paused: No active data sources identified. Please connect a source to start.
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
                  <div className="text-[9px] font-sans font-bold text-white/20 uppercase tracking-tight">Documents Found</div>
                  <div className="text-sm font-sans font-bold text-white tracking-tight">{result.totalDocumentsIngested}</div>
                </div>
                <div className="h-6 w-[1px] bg-white/5" />
                <div className="text-right">
                  <div className="text-[9px] font-sans font-bold text-white/20 uppercase tracking-tight">Items Scanned</div>
                  <div className="text-sm font-sans font-bold text-white tracking-tight">{result.totalItemsProcessed}</div>
                </div>
              </div>
            </div>

            {result.results && (
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-white/5">
                {Object.entries(result.results).map(([source, data]: [string, any]) => (
                  <div key={source} className="flex flex-col gap-0.5">
                    <span className="text-[8px] font-sans font-bold text-white/20 uppercase tracking-tight">{source}</span>
                    <span className="text-[10px] font-sans font-bold text-white/60 tracking-tight">{data.documentsIngested || 0} docs found</span>
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
