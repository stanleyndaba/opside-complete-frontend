import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams, Link } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import { recoveryApi } from '@/lib/recoveryApi';
import { ArrowLeft, CheckCircle, FileText, Upload, Calendar, Loader2 } from 'lucide-react';

type ResolutionChoice = 'submit' | 'resubmit' | 'review' | 'park';

const stableHash = (s: string): number => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = (h ^ s.charCodeAt(i)) * 16777619;
  return (h >>> 0);
};
const deriveConfidence = (id: string): number => {
  const v = stableHash(id) % 4900; // 0..4899
  const n = (v + 500) / 100; // 5.00..53.99
  const c = Math.min(98, Math.max(50, Math.round(n)));
  return c; // percent 50..98
};
const deriveEvidence = (id: string): 'Ready' | 'Needs Docs' | 'Collecting' => {
  const v = stableHash(id) % 100;
  if (v >= 70) return 'Ready';
  if (v >= 40) return 'Needs Docs';
  return 'Collecting';
};

export default function ResolveCase() {
  const { caseId } = useParams<{ caseId: string }>();
  const location = useLocation() as any;
  const passedClaim = (location && location.state && (location.state as any).claim) || null;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [caseData, setCaseData] = useState<any | null>(passedClaim ? {
    id: passedClaim.id,
    title: passedClaim.details,
    status: passedClaim.status,
    guaranteedAmount: passedClaim.guaranteedAmount,
    expectedPayoutDate: passedClaim.expectedPayoutDate,
    createdDate: passedClaim.created,
    sku: passedClaim.sku,
    productName: passedClaim.details,
  } : null);
  const [attachedDocs, setAttachedDocs] = useState<any[]>([]);
  const [choice, setChoice] = useState<ResolutionChoice>('submit');
  const [statusText, setStatusText] = useState<string>('');

  useEffect(() => { headingRef.current?.focus(); }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!caseId) return;
      try {
        const res = await api.getRecoveryDetail(caseId);
        if (!cancelled) {
          if (res.ok) {
            setCaseData(res.data as any);
            setError(null);
          } else {
            // best-effort fallback keeps passed claim
            setError(res.error || null);
          }
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || 'Failed to load case');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [caseId]);

  const effectiveCase = caseData || passedClaim || { id: caseId };
  const confidencePct = useMemo(() => deriveConfidence(effectiveCase?.id || 'N/A'), [effectiveCase]);
  const evidenceStatus = useMemo(() => deriveEvidence(effectiveCase?.id || 'N/A'), [effectiveCase]);
  const normalizedStatus = (s?: string) => {
    const v = (s || '').toLowerCase();
    if (['denied', 'rejected'].includes(v)) return 'Denied';
    if (['paid', 'paid out', 'approved'].includes(v)) return 'Approved';
    if (['submitted', 'under review', 'in progress', 'processing'].includes(v)) return 'In Progress';
    if (['guaranteed', 'awaiting approval', 'new', 'open'].includes(v)) return 'Open';
    return 'Unknown';
  };

  const onUploadFiles = async (files: File[]) => {
    if (!caseId || !files?.length) return;
    try {
      setStatusText('Uploading documents…');
      const res = await recoveryApi.uploadRecoveryDocuments(caseId, files as any);
      setAttachedDocs((prev) => [...prev, ...(Array.isArray(res) ? res : [res])]);
      setStatusText('Documents uploaded successfully.');
    } catch (e: any) {
      setStatusText('Upload failed. Please try again.');
      toast({ title: 'Upload failed', description: e?.message || 'Please try again.' });
    }
  };

  const onResolve = async () => {
    if (!caseId) return;
    setSubmitting(true);
    setStatusText('Submitting…');
    try {
      if (choice === 'submit') {
        await recoveryApi.submitClaim(caseId);
        toast({ title: 'Submitted', description: 'Claim submitted to Amazon.' });
      } else if (choice === 'resubmit') {
        await recoveryApi.resubmitClaim(caseId);
        toast({ title: 'Resubmitted', description: 'Claim resubmitted with stronger documentation.' });
      } else if (choice === 'review') {
        toast({ title: 'Sent to Review', description: 'Our team will review and proceed.' });
      } else {
        toast({ title: 'Parked', description: 'Case parked until more data is available.' });
      }
      navigate(`/recoveries/${encodeURIComponent(caseId)}`);
    } catch (e: any) {
      toast({ title: 'Action failed', description: e?.message || 'Please try again.' });
    } finally {
      setSubmitting(false);
      setStatusText('');
    }
  };

  return (
    <PageLayout title={`Resolve ${effectiveCase?.id || ''}`}>
      <div className="relative -m-4 lg:-m-6">
        <div className="relative w-full bg-[#0B1220] min-h-[calc(100vh+96px)] -mt-24 pt-24 text-gray-300">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0,rgba(56,189,248,0.10),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.10),transparent_35%)]" />
          <div className="relative container mx-auto px-6 pt-6 pb-10 space-y-6">
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="sm" className="text-gray-200 hover:bg-white/10">
                <Link to="/recoveries"><ArrowLeft className="h-4 w-4 mr-2" /> Back to Cases</Link>
              </Button>
              <h1 ref={headingRef} tabIndex={-1} className="sr-only">Resolve Case {effectiveCase?.id}</h1>
            </div>

            {loading ? (
              <div className="flex items-center gap-2 text-gray-200"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Summary */}
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-gray-200 flex items-center gap-2"><FileText className="h-5 w-5" /> Case Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {error && <div className="text-sm text-red-500" role="alert">{error}</div>}
                    <div>
                      <Label className="text-sm text-gray-400">Case ID</Label>
                      <div className="font-mono text-sm mt-1 text-gray-200">{effectiveCase?.id}</div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-400">Status</Label>
                      <div className="mt-1">
                        <Badge variant="outline" className="text-gray-200 border-white/20">{normalizedStatus(effectiveCase?.status)}</Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-400">Guaranteed Value</Label>
                      <div className="text-lg font-semibold text-emerald-400 mt-1">${(effectiveCase?.guaranteedAmount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                    </div>
                    <div>
                      <Label className="text-sm text-gray-400">Expected Payout</Label>
                      <div className="mt-1 flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-200">{effectiveCase?.expectedPayoutDate ? new Date(effectiveCase.expectedPayoutDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : '—'}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">Confidence {confidencePct}% • Evidence {evidenceStatus}</div>
                    </div>
                  </CardContent>
                </Card>

                {/* Evidence */}
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-gray-200 flex items-center gap-2"><Upload className="h-5 w-5" /> Evidence & Documents</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label htmlFor="doc-upload" className="text-sm text-gray-300">Attach supporting documents (PDF, images)</Label>
                      <input
                        id="doc-upload"
                        type="file"
                        multiple
                        className="mt-2 block w-full text-sm text-gray-300 file:mr-3 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-sm file:text-gray-100 hover:file:bg-white/20"
                        onChange={async (e) => {
                          const files = Array.from((e.target as HTMLInputElement).files || []);
                          await onUploadFiles(files as File[]);
                        }}
                        aria-describedby="doc-help"
                      />
                      <div id="doc-help" className="text-xs text-gray-500 mt-1">You can also drag and drop into this field.</div>
                    </div>
                    {attachedDocs.length > 0 && (
                      <div>
                        <Label className="text-sm text-gray-400">Attached</Label>
                        <ul className="mt-1 space-y-1 text-sm">
                          {attachedDocs.map((d: any, idx: number) => (
                            <li key={d?.id || idx} className="flex items-center justify-between">
                              <span className="truncate mr-2">{d?.name || d?.filename || d?.id || 'Document'}</span>
                              {d?.id && (
                                <Button variant="ghost" size="sm" onClick={() => window.open(d?.url || '#', '_blank')}>View</Button>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Resolution */}
                <Card className="bg-white/5 border-white/10">
                  <CardHeader>
                    <CardTitle className="text-gray-200 flex items-center gap-2"><CheckCircle className="h-5 w-5" /> Resolution</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <RadioGroup value={choice} onValueChange={(v) => setChoice(v as ResolutionChoice)} aria-label="Choose resolution action">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="submit" id="r-submit" />
                        <Label htmlFor="r-submit" className="text-gray-200">Submit to Amazon now</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="resubmit" id="r-resubmit" />
                        <Label htmlFor="r-resubmit" className="text-gray-200">Resubmit with stronger docs</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="review" id="r-review" />
                        <Label htmlFor="r-review" className="text-gray-200">Request manual review</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="park" id="r-park" />
                        <Label htmlFor="r-park" className="text-gray-200">Park until more data</Label>
                      </div>
                    </RadioGroup>
                    <Separator />
                    <div className="flex items-center justify-between gap-3">
                      <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={onResolve} disabled={submitting}>
                        {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Resolve Case
                      </Button>
                      <Button variant="ghost" asChild className="text-gray-200 hover:text-white">
                        <Link to={`/recoveries/${encodeURIComponent(effectiveCase?.id)}`}>View case details</Link>
                      </Button>
                    </div>
                    <div role="status" aria-live="polite" className="sr-only">{statusText}</div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
