import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@clerk/react';
import { api, type AuditRunRecord, type CsvIngestionResponse } from '@/lib/api';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  FileSpreadsheet,
  FileText,
  Files,
  Info,
  Loader2,
  ShieldCheck,
  Upload,
  X,
} from 'lucide-react';

interface UploadFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

const ACCEPTED_TYPES = [
  'Orders', 'Shipments', 'Returns', 'Settlements',
  'Inventory', 'Financial events', 'Fees', 'Transfers',
];

export default function DataUpload() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useAuth();
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isBusy, setIsBusy] = useState(false);
  const [showGate, setShowGate] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const submissionInFlightRef = useRef(false);

  const getActiveTenantSlug = () => localStorage.getItem('active_tenant_slug') || '';
  const getEvidenceRecordsHref = () => {
    const activeTenantSlug = getActiveTenantSlug();
    return activeTenantSlug ? `/app/${encodeURIComponent(activeTenantSlug)}/evidence-locker` : '/audit';
  };

  const continueManualAudit = useCallback((manualAudit: AuditRunRecord, tenantSlug: string) => {
    if (!manualAudit.id || !tenantSlug) return false;

    localStorage.setItem('margin_pending_audit', JSON.stringify({
      auditId: manualAudit.id,
      tenantSlug,
      phase: manualAudit.status === 'completed' ? 'completed' : 'syncing',
      updatedAt: new Date().toISOString(),
    }));
    navigate('/audit', { replace: true });
    return true;
  }, [navigate]);

  const getBackendError = (response?: CsvIngestionResponse | null) => {
    const fileErrors = response?.results
      ?.flatMap((result) => result.errors || [])
      .map((message) => String(message).trim())
      .filter(Boolean) || [];
    return fileErrors[0] || null;
  };

  const getReentryMessage = async () => {
    const activeTenantId = localStorage.getItem('active_tenant_id');
    const latestAudit = await api.getLatestAudit();
    const audit = latestAudit.data?.audit;
    if (!audit || (activeTenantId && audit.tenant_id !== activeTenantId)) return null;

    const nextEligibleAt = audit.next_eligible_at;
    if (!nextEligibleAt || new Date(nextEligibleAt).getTime() <= Date.now()) return null;
    return `Your next complimentary manual report audit is available on ${new Date(nextEligibleAt).toLocaleDateString()}.`;
  };

  const restoreLatestManualAudit = useCallback(async () => {
    const tenantSlug = getActiveTenantSlug();
    if (!tenantSlug) return false;

    const response = await api.getLatestCsvUploadRun(tenantSlug);
    const manualAudit = response.ok ? response.data?.manualAudit : null;
    return manualAudit ? continueManualAudit(manualAudit, tenantSlug) : false;
  }, [continueManualAudit]);

  useEffect(() => {
    if (!isSignedIn) return;
    let cancelled = false;

    void restoreLatestManualAudit().catch(() => undefined).then((continued) => {
      if (!cancelled && continued) return;
    });

    return () => {
      cancelled = true;
    };
  }, [isSignedIn, restoreLatestManualAudit]);

  const startAuth = async () => {
    if (isBusy) return;
    setIsBusy(true);
    try {
      const res = await api.createAuditIntent('csv_upload');
      if (res.ok && res.data?.success && res.data?.intent?.id) {
        localStorage.setItem('pending_audit_intent_id', res.data.intent.id);
        navigate(`/login?auditIntentId=${res.data.intent.id}&mode=signup`);
        return;
      }
    } catch (error) {
      console.error('Failed to create audit intent:', error);
    }
    navigate('/login?mode=signup&intent=upload-csv&next=%2Fdata-upload');
  };

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFiles = useCallback((incomingFiles: FileList | File[]) => {
    if (!isSignedIn) {
      setShowGate(true);
      return;
    }

    const newFiles: UploadFile[] = Array.from(incomingFiles).map((file) => {
      const isSupported = file.name.endsWith('.csv') || file.name.endsWith('.txt');
      return {
        file,
        id: Math.random().toString(36).substring(7),
        status: isSupported ? 'pending' : 'error',
        error: isSupported ? undefined : 'Only CSV and TXT files are supported here.',
      };
    });

    setFiles((previous) => [...previous, ...newFiles].slice(0, 10));

    const unsupportedCount = newFiles.filter((file) => file.status === 'error').length;
    if (unsupportedCount > 0) {
      toast({
        variant: 'destructive',
        title: 'Unsupported files',
        description: `${unsupportedCount} file(s) were rejected. Evidence documents (PDF/Images) are not accepted here.`,
      });
    }
  }, [isSignedIn, toast]);

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  }, [handleFiles]);

  const removeFile = (id: string) => {
    setFiles((previous) => previous.filter((file) => file.id !== id));
  };

  const hasValidFiles = files.some((file) => file.status === 'pending');
  const pendingFileCount = files.filter((file) => file.status === 'pending').length;

  const startManualAudit = async () => {
    if (isBusy || submissionInFlightRef.current) return;

    const selectedFiles = files.filter((item) => item.status === 'pending');
    if (selectedFiles.length === 0) return;

    const tenantSlug = getActiveTenantSlug();
    if (!tenantSlug) {
      setSubmissionError('Margin needs your workspace context before reports can be submitted. Refresh and try again.');
      return;
    }

    submissionInFlightRef.current = true;
    setIsBusy(true);
    setSubmissionError(null);
    setFiles((current) => current.map((item) => selectedFiles.some((selected) => selected.id === item.id)
      ? { ...item, status: 'uploading', error: undefined }
      : item));

    try {
      const response = await api.ingestCsvReports(selectedFiles.map((item) => item.file));
      const ingestion = response.data;
      const byFileName = new Map((ingestion?.results || []).map((result) => [result.fileName, result]));

      setFiles((current) => current.map((item) => {
        const result = byFileName.get(item.file.name);
        if (!result) return item;
        const error = result.errors?.[0];
        return {
          ...item,
          status: result.success ? 'success' : 'error',
          error: error || undefined,
        };
      }));

      if (response.ok && ingestion?.manualAudit && continueManualAudit(ingestion.manualAudit, tenantSlug)) {
        return;
      }

      if (response.ok && ingestion?.syncId) {
        const resumed = await restoreLatestManualAudit();
        if (resumed) return;
      }

      const reentryMessage = await getReentryMessage().catch(() => null);
      const backendError = getBackendError(ingestion);
      const error = reentryMessage
        || backendError
        || response.error
        || 'Margin could not confirm a Manual Report Audit from these reports. Review the file requirements and try again.';
      setSubmissionError(error);
      toast({
        variant: 'destructive',
        title: 'Reports were not accepted for an audit',
        description: error,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Margin could not submit these reports. Please try again.';
      setSubmissionError(message);
      toast({
        variant: 'destructive',
        title: 'Reports were not submitted',
        description: message,
      });
    } finally {
      submissionInFlightRef.current = false;
      setIsBusy(false);
    }
  };

  if (!isLoaded) return null;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FBFAF7] font-sans text-[#191B20]">
      <header className="sticky top-0 z-50 border-b border-[#E8E7E1] bg-[#FBFAF7]/95 backdrop-blur">
        <div className="mx-auto grid min-h-14 max-w-[1280px] grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Link
            to="/audit"
            className="inline-flex min-w-0 justify-self-start items-center gap-2 rounded-md px-1.5 py-2 text-[13px] font-medium text-[#595E68] outline-none transition-colors hover:bg-[#F4F3ED] hover:text-[#191B20] focus-visible:ring-2 focus-visible:ring-[#5165C7] focus-visible:ring-offset-2"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">Back to Audit</span>
            <span className="sm:hidden">Audit</span>
          </Link>

          <div className="min-w-0 text-center" aria-label="Manual report intake">
            <p className="truncate text-[13px] font-semibold text-[#191B20]">Manual report intake</p>
            <p className="hidden text-[11px] text-[#777A82] sm:block">Operational reports</p>
          </div>

          <Link
            to={getEvidenceRecordsHref()}
            className="inline-flex min-w-0 justify-self-end items-center gap-1.5 rounded-md border border-[#D7D7D1] bg-white px-2.5 py-1.5 text-[12px] font-medium text-[#191B20] outline-none transition-colors hover:bg-[#F4F3ED] focus-visible:ring-2 focus-visible:ring-[#5165C7] focus-visible:ring-offset-2 sm:px-3"
          >
            <span className="hidden sm:inline">Evidence Records</span>
            <span className="sm:hidden">Evidence</span>
            <ArrowRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start">
          <section className="min-w-0 rounded-[14px] border border-[#E8E7E1] bg-white p-5 shadow-[0_1px_2px_rgba(25,27,32,0.05)] sm:p-8" aria-labelledby="manual-report-title">
            <div className="max-w-2xl border-b border-[#E8E7E1] pb-6">
              <div className="mb-3 flex items-center gap-2 text-[12px] font-semibold text-[#595E68]">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#F4F3ED] text-[#191B20]">
                  <FileSpreadsheet className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <span>REPORT-BASED AUDIT</span>
              </div>
              <h1 id="manual-report-title" className="text-[28px] font-semibold tracking-[-0.02em] text-[#191B20] sm:text-[32px]">
                Add operational reports
              </h1>
              <p className="mt-3 max-w-xl text-[15px] leading-6 text-[#595E68]">
                {isSignedIn
                  ? 'Add supported Seller Central operational reports. Margin identifies report families from accepted content and creates or resumes the related manual report audit.'
                  : 'Prepare supported Seller Central operational reports for a manual report audit. Margin identifies report families from accepted content.'}
              </p>
            </div>

            {!isSignedIn && showGate ? (
              <section className="mt-6 rounded-[10px] border border-[#D7D7D1] bg-[#F4F3ED] p-5 sm:p-6" aria-labelledby="account-gate-title">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#191B20]" aria-hidden="true" />
                  <div className="min-w-0">
                    <h2 id="account-gate-title" className="text-[16px] font-semibold text-[#191B20]">Account required to submit reports</h2>
                    <p className="mt-1 text-[14px] leading-5 text-[#595E68]">
                      Create or continue to your Margin account to submit operational reports and connect the resulting audit to your workspace.
                    </p>
                  </div>
                </div>
                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Button
                    onClick={startAuth}
                    disabled={isBusy}
                    className="h-10 rounded-[10px] bg-[#3F51A8] px-4 text-[13px] font-semibold text-white shadow-none hover:bg-[#31418D] focus-visible:ring-2 focus-visible:ring-[#5165C7] focus-visible:ring-offset-2"
                  >
                    {isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                    {isBusy ? 'Preparing account access' : 'Continue to account'}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setShowGate(false)}
                    className="min-h-10 rounded-[10px] px-3 text-left text-[13px] font-medium text-[#595E68] outline-none transition-colors hover:bg-white hover:text-[#191B20] focus-visible:ring-2 focus-visible:ring-[#5165C7] focus-visible:ring-offset-2"
                  >
                    Return to report intake
                  </button>
                </div>
              </section>
            ) : (
              <div className="mt-6 space-y-6">
                <section className="rounded-[10px] border border-[#D7D7D1] bg-[#F4F3ED] p-4 sm:p-5" aria-labelledby="intake-scope-title">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D7D7D1] pb-3">
                    <div>
                      <h2 id="intake-scope-title" className="text-[15px] font-semibold text-[#191B20]">Report intake</h2>
                      <p className="mt-0.5 text-[12px] leading-5 text-[#595E68]">Add the reports available for this workspace. Keep reports from the same seller and a consistent range together where possible.</p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D7D7D1] bg-white px-2.5 py-1 text-[12px] font-medium text-[#595E68]">
                      <Files className="h-3.5 w-3.5" aria-hidden="true" />
                      CSV or TXT
                    </span>
                  </div>

                  <div
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    className={`mt-4 rounded-[10px] border border-dashed p-5 text-center transition-colors sm:p-8 ${
                      isDragging ? 'border-[#3F51A8] bg-[#E9ECFF]' : 'border-[#B8B9B4] bg-white'
                    }`}
                  >
                    <input
                      id="manual-report-files"
                      type="file"
                      multiple
                      accept=".csv,.txt"
                      onChange={(event) => event.target.files && handleFiles(event.target.files)}
                      className="sr-only"
                    />
                    <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-[10px] border border-[#D7D7D1] bg-[#FBFAF7] text-[#191B20]">
                      <Upload className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <h3 className="mt-3 text-[16px] font-semibold text-[#191B20]">Drop reports here</h3>
                    <p className="mt-1 text-[13px] leading-5 text-[#595E68]">Drag CSV or TXT operational reports into this area, or choose files from your device.</p>
                    <label
                      htmlFor="manual-report-files"
                      className="mt-4 inline-flex min-h-10 items-center justify-center rounded-[10px] border border-[#D7D7D1] bg-white px-3 text-[13px] font-medium text-[#191B20] outline-none transition-colors hover:bg-[#F4F3ED] focus-within:ring-2 focus-within:ring-[#5165C7] focus-within:ring-offset-2"
                    >
                      Browse files
                    </label>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-[#D7D7D1] pt-3 text-[12px] leading-5 text-[#595E68]">
                    <span>CSV or TXT only</span>
                    <span className="hidden h-1 w-1 self-center rounded-full bg-[#B8B9B4] sm:block" />
                    <span>Up to 10 reports</span>
                    <span className="hidden h-1 w-1 self-center rounded-full bg-[#B8B9B4] sm:block" />
                    <span>Report family recognized automatically</span>
                  </div>
                </section>

                {files.length > 0 ? (
                  <section aria-labelledby="selected-reports-title">
                    <div className="mb-3 flex items-end justify-between gap-4">
                      <div>
                        <h2 id="selected-reports-title" className="text-[16px] font-semibold text-[#191B20]">Selected reports</h2>
                        <p className="mt-0.5 text-[12px] text-[#777A82]">Review each file before starting the manual report audit.</p>
                      </div>
                      <span className="shrink-0 text-[12px] font-medium text-[#595E68]">{files.length} of 10</span>
                    </div>
                    <ul className="overflow-hidden rounded-[10px] border border-[#E8E7E1] bg-white" aria-live="polite">
                      {files.map((file, index) => {
                        const isError = file.status === 'error';
                        const isUploading = file.status === 'uploading';
                        const isSuccess = file.status === 'success';
                        const statusLabel = isError ? 'Needs review' : isUploading ? 'Submitting' : isSuccess ? 'Accepted' : 'Ready';
                        return (
                          <li key={file.id} className={`flex min-h-[56px] items-center gap-3 px-3 py-2.5 sm:px-4 ${index > 0 ? 'border-t border-[#E8E7E1]' : ''}`}>
                            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${isError ? 'bg-[#FFE6EA] text-[#A73549]' : isSuccess ? 'bg-[#DDF7F0] text-[#0E766C]' : 'bg-[#F4F3ED] text-[#595E68]'}`}>
                              {isSuccess ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : isError ? <CircleAlert className="h-4 w-4" aria-hidden="true" /> : <FileSpreadsheet className="h-4 w-4" aria-hidden="true" />}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-[13px] font-medium text-[#191B20]">{file.file.name}</p>
                              <p className={`mt-0.5 text-[12px] ${isError ? 'text-[#A73549]' : 'text-[#777A82]'}`}>{file.error || `${file.file.name.toLowerCase().endsWith('.csv') ? 'CSV' : 'TXT'} report · ${statusLabel}`}</p>
                            </div>
                            <span className={`hidden rounded-full px-2 py-1 text-[11px] font-medium sm:inline-flex ${isError ? 'bg-[#FFE6EA] text-[#A73549]' : isSuccess ? 'bg-[#DDF7F0] text-[#0E766C]' : isUploading ? 'bg-[#E9ECFF] text-[#3F51A8]' : 'bg-[#F4F3ED] text-[#595E68]'}`}>{statusLabel}</span>
                            {!isUploading && !isSuccess ? (
                              <button
                                type="button"
                                onClick={() => removeFile(file.id)}
                                aria-label={`Remove ${file.file.name}`}
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-[#595E68] outline-none transition-colors hover:bg-[#F4F3ED] hover:text-[#191B20] focus-visible:ring-2 focus-visible:ring-[#5165C7] focus-visible:ring-offset-2"
                              >
                                <X className="h-4 w-4" aria-hidden="true" />
                              </button>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                ) : null}

                {isSignedIn ? (
                  <section className="border-t border-[#E8E7E1] pt-5" aria-labelledby="submission-title">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 id="submission-title" className="text-[15px] font-semibold text-[#191B20]">Start the audit</h2>
                        <p className="mt-1 text-[12px] leading-5 text-[#595E68]">
                          {pendingFileCount > 0 ? `${pendingFileCount} report${pendingFileCount === 1 ? '' : 's'} ready for review.` : 'Add at least one supported report to continue.'}
                        </p>
                      </div>
                      <Button
                        onClick={startManualAudit}
                        disabled={!hasValidFiles || isBusy}
                        className="h-10 rounded-[10px] bg-[#3F51A8] px-4 text-[13px] font-semibold text-white shadow-none hover:bg-[#31418D] focus-visible:ring-2 focus-visible:ring-[#5165C7] focus-visible:ring-offset-2 disabled:opacity-45"
                      >
                        {isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                        {isBusy ? 'Submitting reports' : 'Start manual report audit'}
                      </Button>
                    </div>
                    {submissionError ? (
                      <div role="alert" className="mt-4 flex items-start gap-2 rounded-[10px] border border-[#A73549]/30 bg-[#FFE6EA] px-3 py-2.5 text-[12px] leading-5 text-[#A73549]">
                        <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                        <p>{submissionError}</p>
                      </div>
                    ) : null}
                  </section>
                ) : null}
              </div>
            )}
          </section>

          <aside className="space-y-4 xl:sticky xl:top-20" aria-label="Report intake context">
            <section className="rounded-[14px] border border-[#E8E7E1] bg-white p-5">
              <div className="flex items-center gap-2">
                <Info className="h-4 w-4 text-[#595E68]" aria-hidden="true" />
                <h2 className="text-[14px] font-semibold text-[#191B20]">Intake context</h2>
              </div>
              <dl className="mt-4 space-y-3 text-[12px]">
                <div className="border-b border-[#E8E7E1] pb-3">
                  <dt className="font-medium text-[#777A82]">Accepted input</dt>
                  <dd className="mt-1 text-[#191B20]">CSV and TXT operational reports</dd>
                </div>
                <div className="border-b border-[#E8E7E1] pb-3">
                  <dt className="font-medium text-[#777A82]">Audit coverage</dt>
                  <dd className="mt-1 leading-5 text-[#191B20]">Derived from accepted report content. There is no separate date-range selector.</dd>
                </div>
                <div>
                  <dt className="font-medium text-[#777A82]">Report families</dt>
                  <dd className="mt-1 leading-5 text-[#191B20]">Recognized automatically after submission.</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-[14px] border border-[#D7D7D1] bg-[#F4F3ED] p-5">
              <div className="flex items-start gap-2.5">
                <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#191B20]" aria-hidden="true" />
                <div>
                  <h2 className="text-[14px] font-semibold text-[#191B20]">Evidence belongs elsewhere</h2>
                  <p className="mt-1 text-[12px] leading-5 text-[#595E68]">PDFs, screenshots, invoices, and other evidence documents are not operational reports. Keep them in Evidence Records.</p>
                </div>
              </div>
              <Link
                to={getEvidenceRecordsHref()}
                className="mt-4 inline-flex min-h-10 items-center gap-1.5 rounded-[10px] border border-[#D7D7D1] bg-white px-3 text-[12px] font-medium text-[#191B20] outline-none transition-colors hover:bg-[#FBFAF7] focus-visible:ring-2 focus-visible:ring-[#5165C7] focus-visible:ring-offset-2"
              >
                Open Evidence Records
                <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>
            </section>

            <section className="rounded-[14px] border border-[#E8E7E1] bg-white p-5">
              <h2 className="text-[14px] font-semibold text-[#191B20]">Supported reports</h2>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {ACCEPTED_TYPES.map((type) => (
                  <span key={type} className="rounded-full border border-[#E8E7E1] bg-[#FBFAF7] px-2 py-1 text-[11px] font-medium text-[#595E68]">{type}</span>
                ))}
              </div>
              {!isSignedIn ? <p className="mt-4 text-[12px] leading-5 text-[#777A82]">An account is required before reports can be submitted to an audit workspace.</p> : null}
            </section>
          </aside>
        </div>
      </main>

      <footer className="border-t border-[#E8E7E1] bg-white px-4 py-6 text-center sm:px-6">
        <p className="text-[12px] text-[#777A82]">Margin Agents can make mistakes. Check important information before relying on it.</p>
      </footer>
    </div>
  );
}
