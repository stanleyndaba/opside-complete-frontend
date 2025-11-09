import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { Mail, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

interface EvidenceIngestionProps {
  onIngestionComplete?: (result: {
    documentsIngested: number;
    emailsProcessed: number;
  }) => void;
  gmailConnected?: boolean;
}

export function EvidenceIngestion({ onIngestionComplete, gmailConnected = false }: EvidenceIngestionProps) {
  const [ingesting, setIngesting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    success: boolean;
    documentsIngested: number;
    emailsProcessed: number;
    errors: string[];
    message: string;
  } | null>(null);
  const { toast } = useToast();

  const handleIngest = async () => {
    if (!gmailConnected) {
      toast({
        title: 'Gmail Not Connected',
        description: 'Please connect Gmail first to ingest evidence documents.',
        variant: 'destructive',
      });
      return;
    }

    setIngesting(true);
    setProgress(0);
    setResult(null);

    try {
      // Simulate progress (actual progress would come from SSE)
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const res = await api.ingestGmailEvidence({
        query: 'from:amazon.com OR from:amazon.co.uk OR subject:(invoice OR receipt OR "FBA" OR "reimbursement" OR "refund") has:attachment',
        maxResults: 50,
        autoParse: true,
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (res.ok && res.data) {
        setResult(res.data);
        onIngestionComplete?.({
          documentsIngested: res.data.documentsIngested,
          emailsProcessed: res.data.emailsProcessed,
        });

        if (res.data.errors && res.data.errors.length > 0) {
          toast({
            title: 'Ingestion Completed with Errors',
            description: `${res.data.message}. ${res.data.errors.length} error(s) occurred.`,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Ingestion Completed',
            description: res.data.message || `Ingested ${res.data.documentsIngested} documents from ${res.data.emailsProcessed} emails.`,
          });
        }
      } else {
        toast({
          title: 'Ingestion Failed',
          description: res.error || 'Failed to trigger Gmail evidence ingestion. Please try again.',
          variant: 'destructive',
        });
        setResult({
          success: false,
          documentsIngested: 0,
          emailsProcessed: 0,
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
        documentsIngested: 0,
        emailsProcessed: 0,
        errors: ['Network error'],
        message: 'Ingestion failed',
      });
    } finally {
      setIngesting(false);
      setTimeout(() => setProgress(0), 2000);
    }
  };

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-gray-200">
          <Mail className="h-5 w-5" />
          Evidence Ingestion
        </CardTitle>
        <CardDescription className="text-gray-400">
          Trigger Gmail evidence ingestion to collect documents from your emails
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={handleIngest}
          disabled={ingesting || !gmailConnected}
          className="w-full bg-emerald-500 hover:bg-emerald-400 text-white"
        >
          {ingesting ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Ingesting Evidence...
            </>
          ) : (
            <>
              <Mail className="w-4 h-4 mr-2" />
              Ingest Evidence from Gmail
            </>
          )}
        </Button>

        {!gmailConnected && (
          <div className="flex items-center gap-2 text-sm text-amber-400">
            <AlertCircle className="w-4 h-4" />
            <span>Gmail must be connected to ingest evidence documents.</span>
          </div>
        )}

        {ingesting && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-gray-400">
              <span>Processing emails and extracting documents...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {result && (
          <div className="space-y-2 p-4 rounded-lg bg-white/5 border border-white/10">
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
                <span className="ml-2 font-semibold text-gray-200">{result.documentsIngested}</span>
              </div>
              <div>
                <span className="text-gray-400">Emails Processed:</span>
                <span className="ml-2 font-semibold text-gray-200">{result.emailsProcessed}</span>
              </div>
            </div>
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
      </CardContent>
    </Card>
  );
}

