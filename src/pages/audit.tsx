import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@clerk/react';
import { AlertTriangle, ArrowRight, ArrowRightLeft, Calendar, CalendarClock, Check, CircleDollarSign, Copy, Database, Download, FileText, HeartHandshake, Loader2, Mail, PanelLeft, Search, ShieldCheck, TerminalSquare } from 'lucide-react';
import { useLocation, useNavigate, Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { useSession } from '@/contexts/SessionContext';
import { api, AuditActivityEvent, AuditExportSummary, AuditHistoryItem, AuditRunRecord, AuditScheduleRecord, AuditTeaserSummary, RecoverOnceQuote } from '@/lib/api';
import { ANALYTICS_EVENTS } from '@/lib/analyticsEvents';
import { trackEvent } from '@/lib/analytics';

type AuditStep = 'public' | 'ready' | 'connect' | 'syncing' | 'detecting' | 'completed' | 'failed';
type PendingAuditContext = {
  auditId: string;
  tenantSlug: string;
  phase: 'account_ready' | 'amazon_connection_required' | 'amazon_oauth_started' | 'syncing' | 'completed';
  updatedAt: string;
};

type AuditScheduleCadence = AuditScheduleRecord['cadence'];

const PENDING_AUDIT_KEY = 'margin_pending_audit';

const CURRENCY_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

  const statusCopy = {
    public: 'Secure your data residency, then authorize read-only synchronization.',
    ready: 'Run the audit to check whether Amazon is connected and ready for analysis.',
    connect: 'Margin needs seller authorization before it can scan shipments.',
    syncing: 'Margin is pulling the account data needed to build the recovery scope.',
    detecting: 'The recovery detectors are reviewing synced FBA data for reimbursable patterns.',
    completed: 'Review the recovery scope from this audit before deciding what should happen next.',
    failed: 'Retry when Amazon access is available.',
  };

const defaultTeaser: AuditTeaserSummary = {
  scopeValue: 0,
  findingsCount: 0,
  categories: [],
  evidenceReadyCount: 0,
  locked: true,
  activationRequired: true,
  message: 'Margin will show a locked recovery summary after the Amazon audit finishes.',
};

function getStep(audit: AuditRunRecord | null, isAuthenticated: boolean): AuditStep {
  if (!isAuthenticated) return 'public';
  if (!audit) return 'ready';
  if (audit.status === 'amazon_connection_required') return 'connect';
  if (audit.status === 'syncing') return 'syncing';
  if (audit.status === 'detecting') return 'detecting';
  if (audit.status === 'completed' || audit.status === 'activated') return 'completed';
  if (audit.status === 'failed') return 'failed';
  return 'ready';
}

function formatMoney(value: number) {
  if (!Number.isFinite(value) || value <= 0) return '$0';
  return CURRENCY_FORMATTER.format(value);
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function getSafeAuditStatusMessage(message: string | undefined, fallback: string) {
  if (!message) return fallback;
  const normalized = message.toLowerCase();
  const leaksImplementationDetail =
    normalized.includes('supabase') ||
    normalized.includes('duplicate key') ||
    normalized.includes('constraint') ||
    normalized.includes('is not a function') ||
    normalized.includes('typeerror') ||
    normalized.includes('syntaxerror') ||
    normalized.includes('pipeline failed');

  if (leaksImplementationDetail) {
    return fallback;
  }

  return message;
}

function savePendingAudit(context: Omit<PendingAuditContext, 'updatedAt'>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PENDING_AUDIT_KEY, JSON.stringify({
    ...context,
    updatedAt: new Date().toISOString(),
  }));
}

function readPendingAudit(): PendingAuditContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PENDING_AUDIT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingAuditContext>;
    if (!parsed.auditId || !parsed.tenantSlug) return null;
    return {
      auditId: parsed.auditId,
      tenantSlug: parsed.tenantSlug,
      phase: parsed.phase || 'account_ready',
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function clearPendingAudit() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(PENDING_AUDIT_KEY);
}

function getAuditState(step: AuditStep) {
  if (step === 'public') {
    return {
      label: 'Initialize workspace',
      title: 'Prepare your recovery-ready environment.',
      description: 'Secure your data residency, then authorize read-only synchronization when you are ready to run the audit.',
    };
  }

  if (step === 'ready') {
    return {
      label: 'Workspace ready',
      title: 'Your audit workspace is ready.',
      description: 'Run the audit to check whether Amazon is connected and ready for analysis.',
    };
  }

  if (step === 'connect') {
    return {
      label: 'Amazon required',
      title: 'Connect Amazon to continue.',
      description: 'Margin needs seller authorization before it can scan shipments, settlements, inventory, fees, and reimbursements.',
    };
  }

  if (step === 'syncing') {
    return {
      label: 'Syncing',
      title: 'Amazon data is syncing.',
      description: 'Margin is pulling the account data needed to build the recovery scope.',
    };
  }

  if (step === 'detecting') {
    return {
      label: 'Analyzing',
      title: 'Margin is checking for recovery opportunities.',
      description: 'The recovery detectors are reviewing synced FBA data for reimbursable patterns.',
    };
  }

  if (step === 'completed') {
    return {
      label: 'Result ready',
      title: 'Your audit summary is ready.',
      description: 'Review the recovery scope from this audit before deciding what should happen next.',
    };
  }

  return {
    label: 'Retry needed',
    title: 'The audit could not finish.',
    description: 'Retry when Amazon access is available, or refresh after the connection settles.',
  };
}

function getCompletedAuditState(teaser: AuditTeaserSummary) {
  if (teaser.finalStatus === 'partial_no_findings' && Number(teaser.recordsReviewed || 0) === 0) {
    return {
      label: 'Limited audit result',
      title: 'Your audit completed with limited Amazon data.',
      description: 'Margin connected successfully, but no usable Amazon records were available for review. Recovery opportunities could not be fully evaluated.',
    };
  }

  switch (teaser.finalStatus) {
    case 'complete_with_findings':
      return {
        title: 'Your Recovery Audit is ready.',
        description: 'Margin identified recovery opportunities in the Amazon activity reviewed.',
      };
    case 'complete_no_findings':
      return {
        title: 'Your audit is complete.',
        description: 'Margin did not identify recovery opportunities in the Amazon activity reviewed.',
      };
    case 'partial_with_findings':
      return {
        title: 'Margin found opportunities from the data available.',
        description: 'Some Amazon datasets were unavailable, but Margin identified findings from the activity it could review.',
      };
    case 'partial_no_findings':
      return {
        title: 'Your audit completed with limited Amazon data.',
        description: 'Margin did not identify opportunities in the available activity, but some Amazon datasets could not be reviewed.',
      };
    default:
      return {
        title: 'Your audit summary is ready.',
        description: 'Review the recovery scope from this audit before deciding what should happen next.',
      };
  }
}

export default function Audit() {
  const navigate = useNavigate();
  const location = useLocation();
  const { authToken, isAuthReady, isSessionValid } = useSession();
  const {
    isLoaded: isClerkLoaded,
    isSignedIn: isClerkSignedIn,
    userId: clerkUserId,
    getToken: getClerkToken,
  } = useAuth();
  const hasDemoSession = isAuthReady && isSessionValid && authToken === 'demo-session-local';
  const isAuthenticated = Boolean((isClerkLoaded && isClerkSignedIn) || hasDemoSession);
  const [audit, setAudit] = useState<AuditRunRecord | null>(null);
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);
  const [teaser, setTeaser] = useState<AuditTeaserSummary>(defaultTeaser);
  const [isBusy, setIsBusy] = useState(false);
  const [isActivationSheetOpen, setIsActivationSheetOpen] = useState(false);
  const [isSecurityProtocolOpen, setIsSecurityProtocolOpen] = useState(false);
  const [isAuditLogOpen, setIsAuditLogOpen] = useState(false);
  const [isPeriodSelectorOpen, setIsPeriodSelectorOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [weeklyAuditEnabled, setWeeklyAuditEnabled] = useState(false);
  const [summaryExported, setSummaryExported] = useState(false);
  const [auditHistory, setAuditHistory] = useState<AuditHistoryItem[]>([]);
  const [auditHistoryQuery, setAuditHistoryQuery] = useState('');
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [auditLogEvents, setAuditLogEvents] = useState<AuditActivityEvent[]>([]);
  const [auditLogFilter, setAuditLogFilter] = useState('All');
  const [isAuditLogLoading, setIsAuditLogLoading] = useState(false);
  const [auditSchedule, setAuditSchedule] = useState<AuditScheduleRecord | null>(null);
  const [scheduleEntitled, setScheduleEntitled] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    cadence: 'off' as 'off' | 'weekly' | 'biweekly' | 'monthly',
    preferred_day_of_week: 1,
    preferred_day_of_month: 1,
    preferred_time: '09:00',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Africa/Johannesburg',
    is_paused: false,
  });
  const [isScheduleSaving, setIsScheduleSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [recoverOnceQuote, setRecoverOnceQuote] = useState<RecoverOnceQuote | null>(null);
  const [isRecoverOnceQuoteLoading, setIsRecoverOnceQuoteLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const { toast } = useToast();
  const setError = (message: string | null) => {
    if (message) {
      toast({
        variant: 'destructive',
        description: message,
      });
    }
  };

  const trackedViewRef = useRef(false);
  const trackedCompletionRef = useRef(false);
  const trackedOfferViewRef = useRef(false);
  const requestedRecoverOnceQuoteRef = useRef<string | null>(null);
  const restoredAuditRef = useRef(false);
  const autoRunAfterOAuthRef = useRef(false);

  const step = useMemo(() => getStep(audit, isAuthenticated), [audit, isAuthenticated]);
  const isZeroRecordLimitedAudit = step === 'completed' &&
    teaser.finalStatus === 'partial_no_findings' &&
    Number(teaser.recordsReviewed || 0) === 0;
  const auditState = useMemo(() => {
    const baseState = getAuditState(step);
    if (step !== 'completed') return baseState;
    const completedState = getCompletedAuditState(teaser);
    return {
      ...baseState,
      ...completedState
    };
  }, [step, teaser.finalStatus, teaser.recordsReviewed]);
  const hasFindings = step === 'completed' && teaser.findingsCount > 0;
  const hasScopeValue = step === 'completed' && teaser.scopeValue > 0;
  const hasRecoveryOpportunity = hasFindings || hasScopeValue;
  const canShowRecoverOnce = hasFindings && hasScopeValue && !isZeroRecordLimitedAudit;
  const selectedAuditPeriodLabel = auditHistory.find((item) => item.id === audit?.id)?.label || 'Current audit';
  const expiringSoonValue = hasScopeValue ? formatMoney(Math.round(teaser.scopeValue * 0.28)) : '$0';
  const newShipmentSyncCopy = isAuthenticated
    ? audit?.status === 'completed'
      ? 'Shipment sync: reviewed with latest audit'
      : 'Shipment sync: waiting for Amazon authorization'
    : 'Shipment sync: starts after authorization';

  const catalogSkuCount = (teaser?.recordsReviewed ? Math.max(233468, Math.floor(teaser.recordsReviewed * 0.3)) : 233468).toLocaleString();

  const exportExecutiveSummary = async () => {
    if (!audit?.id || step !== 'completed') {
      setExportError('Complete an audit before exporting the summary.');
      return;
    }

    setIsExporting(true);
    setExportError(null);
    trackEvent('audit_summary_export_started', {
      source_page: '/audit',
      audit_id: audit.id,
    });

    const { jsPDF } = await import('jspdf');
    try {
      const freshToken = await ensureFreshAuditAuth();
      const response = await api.getAuditExportSummary(audit.id, freshToken);
      if (!response.ok || !response.data?.success) {
        throw new Error('Margin could not prepare the audit summary.');
      }

      const exportData = response.data;
      const doc = new jsPDF();
      const period = exportData.audit?.selected_period || selectedAuditPeriodLabel;
      const filenamePeriod = String(period).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const filename = `margin-recovery-audit-${filenamePeriod || 'summary'}.pdf`;
      const summary = exportData.summary || {};
      const findings: AuditExportSummary['findings'] = Array.isArray(exportData.findings) ? exportData.findings : [];

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('Margin Recovery Audit', 18, 22);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Audit period: ${period}`, 18, 32);
      doc.text(`Generated: ${new Date(exportData.generated_at || Date.now()).toLocaleString()}`, 18, 39);

      const rows = [
        ['Completion state', String(summary.completion_state || 'Not available')],
        ['Records reviewed', Number(summary.records_reviewed || 0).toLocaleString()],
        ['Estimated recoverable value', formatMoney(Number(summary.estimated_recoverable_value || 0))],
        ['Actionable findings', String(summary.actionable_findings || 0)],
        ['Evidence ready', String(summary.evidence_ready || 0)],
        ['Evidence required', String(summary.evidence_required || 0)],
        ['Sources reviewed', (summary.sources_reviewed || []).join(', ') || 'Not available'],
        ['Unavailable sources', (summary.sources_unavailable || []).join(', ') || 'None recorded'],
      ];

      let y = 54;
      rows.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(`${label}:`, 18, y);
        doc.setFont('helvetica', 'normal');
        doc.text(String(value), 70, y, { maxWidth: 120 });
        y += 8;
      });

      if (findings.length) {
        y += 5;
        doc.setFont('helvetica', 'bold');
        doc.text('Finding summaries', 18, y);
        y += 8;
        findings.slice(0, 10).forEach((finding, index) => {
          doc.setFont('helvetica', 'normal');
          doc.text(`${index + 1}. ${finding.category || 'Recovery finding'} - ${formatMoney(Number(finding.estimated_value || 0))}`, 18, y, { maxWidth: 170 });
          y += 7;
        });
      }

      y += 7;
      doc.setFont('helvetica', 'bold');
      doc.text('Recommended next actions', 18, y);
      y += 8;
      (summary.recommended_next_actions || []).forEach((action: string) => {
        doc.setFont('helvetica', 'normal');
        doc.text(`- ${action}`, 18, y, { maxWidth: 170 });
        y += 7;
      });

      y += 7;
      doc.setFontSize(9);
      doc.text(exportData.disclaimer || 'Estimated values are not guaranteed recoveries.', 18, y, { maxWidth: 170 });
      doc.save(filename);
      setSummaryExported(true);
      trackEvent('audit_summary_export_completed', {
        source_page: '/audit',
        audit_id: audit.id,
      });
      toast({ description: 'Audit summary exported.' });
    } catch {
      setExportError('The audit summary could not be exported. Please retry in a moment.');
      trackEvent('audit_summary_export_failed', {
        source_page: '/audit',
        audit_id: audit.id,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const loadAuditHistory = async () => {
    if (!isAuthenticated) return;
    setIsHistoryLoading(true);
    try {
      const freshToken = await ensureFreshAuditAuth();
      const response = await api.getAuditHistory(freshToken);
      if (response.ok && response.data?.audits) setAuditHistory(response.data.audits);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const selectAuditPeriod = async (item: AuditHistoryItem) => {
    const freshToken = await ensureFreshAuditAuth();
    const response = await api.getAudit(item.id, freshToken);
    if (!response.ok || !response.data?.audit) {
      setError('This audit period is not available.');
      return;
    }
    setAudit(response.data.audit);
    if (response.data.audit.status === 'completed') {
      const results = await api.getAuditResults(response.data.audit.id, freshToken);
      if (results.ok && results.data?.teaser) setTeaser(results.data.teaser);
    }
    setRecoverOnceQuote(null);
    requestedRecoverOnceQuoteRef.current = null;
    setIsPeriodSelectorOpen(false);
    trackEvent('audit_period_selected', {
      source_page: '/audit',
      audit_id: item.id,
      status: item.status,
    });
  };

  const openAuditLog = async () => {
    setIsAuditLogOpen(true);
    trackEvent('audit_log_opened', { source_page: '/audit', audit_id: audit?.id || null });
    if (!audit?.id) return;
    setIsAuditLogLoading(true);
    try {
      const freshToken = await ensureFreshAuditAuth();
      const response = await api.getAuditActivity(audit.id, freshToken);
      if (response.ok && response.data?.events) setAuditLogEvents(response.data.events);
    } finally {
      setIsAuditLogLoading(false);
    }
  };

  const openScheduleDialog = async () => {
    setIsScheduleDialogOpen(true);
    trackEvent('audit_schedule_opened', { source_page: '/audit' });
    try {
      const freshToken = await ensureFreshAuditAuth();
      const response = await api.getAuditSchedule(freshToken);
      if (response.ok && response.data) {
        setScheduleEntitled(Boolean(response.data.entitlement?.entitled));
        setAuditSchedule(response.data.schedule);
        if (response.data.schedule) {
          setScheduleForm({
            cadence: response.data.schedule.cadence,
            preferred_day_of_week: response.data.schedule.preferred_day_of_week ?? 1,
            preferred_day_of_month: response.data.schedule.preferred_day_of_month ?? 1,
            preferred_time: response.data.schedule.preferred_time || '09:00',
            timezone: response.data.schedule.timezone || scheduleForm.timezone,
            is_paused: Boolean(response.data.schedule.is_paused),
          });
          setWeeklyAuditEnabled(response.data.schedule.cadence !== 'off' && !response.data.schedule.is_paused);
        }
      }
    } catch {
      setScheduleEntitled(false);
    }
  };

  const saveSchedule = async (override?: Partial<typeof scheduleForm>) => {
    setIsScheduleSaving(true);
    const nextForm = { ...scheduleForm, ...override };
    try {
      const freshToken = await ensureFreshAuditAuth();
      const response = await api.saveAuditSchedule(nextForm, freshToken);
      if (!response.ok || !response.data?.success) throw new Error('Schedule unavailable');
      setAuditSchedule(response.data.schedule);
      setScheduleEntitled(Boolean(response.data.entitlement?.entitled));
      setWeeklyAuditEnabled(response.data.schedule.cadence !== 'off' && !response.data.schedule.is_paused);
      trackEvent(nextForm.cadence === 'off' ? 'audit_schedule_disabled' : nextForm.is_paused ? 'audit_schedule_paused' : 'audit_schedule_saved', {
        source_page: '/audit',
        cadence: nextForm.cadence,
      });
      toast({ description: 'Audit schedule updated.' });
    } catch {
      setError('Automatic audits are available after Recovery Workspace is active.');
    } finally {
      setIsScheduleSaving(false);
    }
  };

  const openShareDialog = () => {
    setIsShareDialogOpen(true);
    setShareCopied(false);
    trackEvent('share_dialog_opened', { source_page: '/audit' });
  };

  const getShareLink = () => {
    const origin = typeof window === 'undefined' ? 'https://margin-finance.com' : window.location.origin;
    return `${origin}/audit?utm_source=customer_referral&utm_medium=share&utm_campaign=audit`;
  };

  const copyShareLink = async () => {
    const link = getShareLink();
    try {
      await navigator.clipboard.writeText(link);
      setShareCopied(true);
      trackEvent('share_link_copied', { source_page: '/audit' });
    } catch {
      setError('Copy was unavailable. You can select and copy the link manually.');
    }
  };

  const nativeShare = async () => {
    if (!navigator.share) {
      await copyShareLink();
      return;
    }
    try {
      await navigator.share({
        title: 'Run a free Amazon Recovery Audit with Margin',
        text: 'Margin helps Amazon sellers audit reimbursement activity, prepare evidence, track recoveries, and verify payouts.',
        url: getShareLink(),
      });
      trackEvent('share_native_clicked', { source_page: '/audit' });
    } catch {
      // The seller can cancel the native share sheet without it being an error.
    }
  };

  const ensureFreshAuditAuth = async (): Promise<string | null> => {
    if (!isClerkLoaded || !isClerkSignedIn) {
      return hasDemoSession ? authToken : null;
    }

    const token = await getClerkToken({ skipCache: true });
    if (!token) {
      throw new Error('Margin could not prepare your secure session yet. Please refresh and try again.');
    }

    localStorage.setItem('session_token', token);
    if (clerkUserId) {
      localStorage.setItem('user_id', clerkUserId);
    }
    return token;
  };

  useEffect(() => {
    if (trackedViewRef.current) return;
    trackedViewRef.current = true;
    trackEvent(ANALYTICS_EVENTS.auditPageViewed, {
      source_page: '/audit',
      funnel: 'audit_first',
    });
  }, []);

  useEffect(() => {
    if (!audit?.id || audit.status !== 'completed' || trackedCompletionRef.current) return;
    trackedCompletionRef.current = true;
    trackEvent(ANALYTICS_EVENTS.auditCompleted, {
      audit_id: audit.id,
      source_page: '/audit',
    });
  }, [audit?.id, audit?.status]);

  useEffect(() => {
    if (!isAuthenticated) return;
    void loadAuditHistory();
  }, [isAuthenticated, audit?.id]);

  useEffect(() => {
    if (step !== 'completed' || trackedOfferViewRef.current) return;
    trackedOfferViewRef.current = true;
    trackEvent('recovery_workspace_offer_viewed', {
      source_page: '/audit',
      audit_id: audit?.id || null,
      audit_outcome: teaser.finalStatus || 'unknown',
      findings_count: teaser.findingsCount,
    });

    if (canShowRecoverOnce) {
      trackEvent('recover_once_offer_viewed', {
        source_page: '/audit',
        audit_id: audit?.id || null,
        audit_outcome: teaser.finalStatus || 'unknown',
        findings_count: teaser.findingsCount,
        quote_eligibility: 'frontend_pending_server_quote',
      });
    }
  }, [audit?.id, canShowRecoverOnce, step, teaser.finalStatus, teaser.findingsCount]);

  useEffect(() => {
    if (!audit?.id || !canShowRecoverOnce || requestedRecoverOnceQuoteRef.current === audit.id) return;
    requestedRecoverOnceQuoteRef.current = audit.id;
    setRecoverOnceQuote(null);
    setIsRecoverOnceQuoteLoading(true);
    trackEvent('recover_once_quote_requested', {
      source_page: '/audit',
      audit_id: audit.id,
      audit_outcome: teaser.finalStatus || 'unknown',
      findings_count: teaser.findingsCount,
    });

    api.generateRecoverOnceQuote(audit.id, tenantSlug || undefined)
      .then((response) => {
        if (response.ok && response.data?.quote) {
          setRecoverOnceQuote(response.data.quote);
          trackEvent(
            response.data.quote.status === 'available' || response.data.quote.status === 'accepted'
              ? 'recover_once_quote_generated'
              : response.data.quote.status === 'manual_review_required'
                ? 'recover_once_quote_manual_review'
                : 'recover_once_quote_unavailable',
            {
              source_page: '/audit',
              audit_id: audit.id,
              quote_id: response.data.quote.id,
              quote_status: response.data.quote.status,
              amount_subunits: response.data.quote.amount_subunits,
              currency: response.data.quote.currency,
            }
          );
        } else {
          trackEvent('recover_once_quote_unavailable', {
            source_page: '/audit',
            audit_id: audit.id,
            reason: response.error || 'quote_request_failed',
          });
        }
      })
      .catch(() => {
        trackEvent('recover_once_quote_unavailable', {
          source_page: '/audit',
          audit_id: audit.id,
          reason: 'quote_request_error',
        });
      })
      .finally(() => setIsRecoverOnceQuoteLoading(false));
  }, [audit?.id, canShowRecoverOnce, teaser.finalStatus, teaser.findingsCount, tenantSlug]);

  useEffect(() => {
    if (!isAuthenticated || restoredAuditRef.current) return;
    restoredAuditRef.current = true;

    const restoreAudit = async () => {
      const pending = readPendingAudit();
      setIsBusy(true);
      setError(null);

      try {
        const freshToken = await ensureFreshAuditAuth();
        if (!freshToken) {
          throw new Error('Margin could not prepare your secure session yet. Please refresh and try again.');
        }

        if (pending?.auditId) {
          const response = await api.getAudit(pending.auditId, freshToken);
          if (response.ok && response.data?.audit) {
            setAudit(response.data.audit);
            setTenantSlug(pending.tenantSlug);
            if (response.data.audit.status === 'completed') {
              const results = await api.getAuditResults(response.data.audit.id, freshToken);
              if (results.ok && results.data?.teaser) {
                setTeaser(results.data.teaser);
              }
            }
            setIsBusy(false);
            return;
          }
        }

        const latest = await api.getLatestAudit(freshToken);
        if (latest.ok && latest.data?.audit) {
          setAudit(latest.data.audit);
          const storedTenantSlug = localStorage.getItem('active_tenant_slug');
          if (storedTenantSlug) setTenantSlug(storedTenantSlug);
          if (latest.data.audit.status === 'completed') {
            const results = await api.getAuditResults(latest.data.audit.id, freshToken);
            if (results.ok && results.data?.teaser) {
              setTeaser(results.data.teaser);
            }
          }
        }
      } catch (authError: unknown) {
        setError(getErrorMessage(authError, 'Margin could not prepare your secure session yet.'));
        setIsBusy(false);
        return;
      }

      setIsBusy(false);
    };

    void restoreAudit();
  }, [isAuthenticated, isClerkLoaded, isClerkSignedIn, clerkUserId]);

  useEffect(() => {
    if (!isAuthenticated || autoRunAfterOAuthRef.current) return;
    const query = new URLSearchParams(location.search);
    if (query.get('amazon_connected') !== '1') return;
    if (!audit?.id || !tenantSlug) return;
    if (audit.status === 'syncing' || audit.status === 'detecting' || audit.status === 'completed' || audit.status === 'activated') return;

    autoRunAfterOAuthRef.current = true;
    void runAuditForAudit(audit);
  }, [audit, isAuthenticated, location.search, tenantSlug]);

  const startAccountStep = () => {
    trackEvent(ANALYTICS_EVENTS.auditStarted, {
      cta_location: 'audit_public_hero',
      cta_text: 'Start Free Audit',
    });
    trackEvent(ANALYTICS_EVENTS.auditAccountStepStarted, {
      cta_location: 'audit_public_hero',
      destination: '/login',
    });
    navigate('/login?mode=signup&intent=audit&next=%2Faudit');
  };

  const startAudit = async () => {
    if (!isAuthenticated) {
      startAccountStep();
      return;
    }

    setIsBusy(true);
    setError(null);
    trackEvent(ANALYTICS_EVENTS.auditStarted, {
      cta_location: 'audit_app_step',
      cta_text: 'Connect Amazon',
    });

    let freshToken: string | null;
    try {
      freshToken = await ensureFreshAuditAuth();
      if (!freshToken) {
        throw new Error('Margin could not prepare your secure session yet. Please refresh and try again.');
      }
    } catch (authError: unknown) {
      setIsBusy(false);
      setError(getErrorMessage(authError, 'Margin could not prepare your secure session yet.'));
      return;
    }

    const response = await api.startAudit(freshToken);
    setIsBusy(false);

    if (!response.ok || !response.data?.success) {
      setError(response.error || 'Margin could not start the audit yet.');
      return;
    }

    setAudit(response.data.audit);
    setTenantSlug(response.data.tenant.slug);
    savePendingAudit({
      auditId: response.data.audit.id,
      tenantSlug: response.data.tenant.slug,
      phase: response.data.audit.status === 'amazon_connection_required' ? 'amazon_connection_required' : 'account_ready',
    });

    if (!response.data.amazonConnected || response.data.audit.status === 'amazon_connection_required') {
      return;
    }

    if (response.data.amazonConnected) {
      await runAuditForAudit(response.data.audit);
    }
  };

  const connectAmazonForAudit = async (targetAudit = audit, targetTenantSlug = tenantSlug) => {
    if (!targetAudit?.id || !targetTenantSlug) {
      setError('Margin needs an audit workspace before Amazon can be connected.');
      return;
    }

    setIsBusy(true);
    setError(null);
    trackEvent(ANALYTICS_EVENTS.auditAmazonConnectStarted, {
      audit_id: targetAudit.id,
      tenant_slug: targetTenantSlug,
    });
    savePendingAudit({
      auditId: targetAudit.id,
      tenantSlug: targetTenantSlug,
      phase: 'amazon_oauth_started',
    });

    const response = await api.connectAmazon(undefined, false, targetTenantSlug);
    setIsBusy(false);

    const authUrl = response.data?.auth_url || response.data?.authUrl;
    if (!response.ok || !authUrl) {
      setError(response.error || 'Amazon connection could not be opened yet.');
      return;
    }

    window.location.assign(authUrl);
  };

  const connectAmazon = () => connectAmazonForAudit();

  const runAuditForAudit = async (targetAudit = audit) => {
    if (!targetAudit?.id) {
      await startAudit();
      return;
    }

    setIsBusy(true);
    setError(null);
    trackEvent(ANALYTICS_EVENTS.auditSyncStarted, {
      audit_id: targetAudit.id,
      current_status: targetAudit.status,
    });

    let freshToken: string | null;
    try {
      freshToken = await ensureFreshAuditAuth();
      if (!freshToken) {
        throw new Error('Margin could not prepare your secure session yet. Please refresh and try again.');
      }
    } catch (authError: unknown) {
      setIsBusy(false);
      setError(getErrorMessage(authError, 'Margin could not prepare your secure session yet.'));
      return;
    }

    const response = await api.runAudit(targetAudit.id, freshToken);
    setIsBusy(false);

    if (!response.ok || !response.data?.success) {
      setError(response.error || 'Margin could not run the audit yet.');
      return;
    }

    setAudit(response.data.audit);
    if (tenantSlug) {
      savePendingAudit({
        auditId: response.data.audit.id,
        tenantSlug,
        phase: response.data.audit.status === 'completed' ? 'completed' : response.data.audit.status === 'syncing' ? 'syncing' : 'account_ready',
      });
    }

    if (response.data.audit.status === 'completed') {
      const results = await api.getAuditResults(response.data.audit.id, freshToken);
      if (results.ok && results.data?.teaser) {
        setTeaser(results.data.teaser);
      }
    }
  };

  const loadResults = async () => {
    if (!audit?.id) return;
    setIsBusy(true);
    setError(null);
    let freshToken: string | null;
    try {
      freshToken = await ensureFreshAuditAuth();
      if (!freshToken) {
        throw new Error('Margin could not prepare your secure session yet. Please refresh and try again.');
      }
    } catch (authError: unknown) {
      setIsBusy(false);
      setError(getErrorMessage(authError, 'Margin could not prepare your secure session yet.'));
      return;
    }
    const response = await api.getAuditResults(audit.id, freshToken);
    setIsBusy(false);
    if (!response.ok || !response.data?.success) {
      setError(response.error || 'Margin could not load the audit result yet.');
      return;
    }
    setTeaser(response.data.teaser);
    setAudit((current) => current ? { ...current, ...response.data.audit } : current);
  };

  const activateAudit = () => {
    void activateRecoveryWorkspace();
  };

  const activateRecoveryWorkspace = async () => {
    if (!audit?.id) {
      setError('Finish the audit before activating Recovery Workspace.');
      return;
    }

    setIsBusy(true);
    setError(null);
    trackEvent(ANALYTICS_EVENTS.auditActivationClicked, {
      audit_id: audit?.id || null,
      scope_value: teaser.scopeValue,
      findings_count: teaser.findingsCount,
      destination: 'wise_subscription_checkout',
      value: 99,
      currency: 'USD',
    });
    trackEvent(ANALYTICS_EVENTS.checkoutStarted, {
      offer: 'recovery_workspace',
      value: 99,
      currency: 'USD',
      payment_provider: 'wise_subscription',
    });
    trackEvent(ANALYTICS_EVENTS.subscriptionCheckoutStarted, {
      offer: 'recovery_workspace',
      value: 99,
      currency: 'USD',
    });
    trackEvent('recovery_workspace_checkout_started', {
      source_page: '/audit',
      audit_id: audit?.id || null,
      audit_outcome: teaser.finalStatus || 'unknown',
      findings_count: teaser.findingsCount,
      value: 99,
      currency: 'USD',
    });

    const response = await api.initializeRecoveryWorkspaceSubscription(audit.id, tenantSlug || undefined);
    setIsBusy(false);

    if (!response.ok || !response.data?.success) {
      setError(response.error || 'Margin could not open subscription checkout yet.');
      return;
    }

    if (response.data.entitlement?.active && tenantSlug) {
      clearPendingAudit();
      navigate(`/app/${tenantSlug}/dashboard`);
      return;
    }

    if (!response.data.authorization_url) {
      setError('Subscription checkout is pending. Refresh billing status in a moment.');
      return;
    }

    window.location.assign(response.data.authorization_url);
  };

  const runAudit = () => runAuditForAudit();

  const openActivationSheet = () => setIsActivationSheetOpen(true);
  const startRecoverOnceCheckout = async () => {
    if (!recoverOnceQuote?.id) {
      toast({ description: 'Margin is still preparing your fixed quote.' });
      return;
    }

    setIsBusy(true);
    setError(null);
    trackEvent('recover_once_quote_accepted', {
      source_page: '/audit',
      audit_id: audit?.id || null,
      quote_id: recoverOnceQuote.id,
      amount_subunits: recoverOnceQuote.amount_subunits,
      currency: recoverOnceQuote.currency,
    });

    const response = await api.initializeRecoverOnceCheckout(recoverOnceQuote.id, tenantSlug || undefined);
    setIsBusy(false);

    if (!response.ok || !response.data?.success || !response.data.authorization_url) {
      setError(response.error || 'Margin could not open Recover Once checkout yet.');
      return;
    }

    trackEvent('recover_once_checkout_started', {
      source_page: '/audit',
      audit_id: audit?.id || null,
      quote_id: recoverOnceQuote.id,
      reference: response.data.reference || null,
      amount_subunits: recoverOnceQuote.amount_subunits,
      currency: recoverOnceQuote.currency,
      payment_provider: 'paystack_one_time',
    });

    window.location.assign(response.data.authorization_url);
  };

  const workspaceOffer = (() => {
    if (isZeroRecordLimitedAudit) {
      return {
        heading: 'Your first audit had limited Amazon coverage.',
        bridge: 'Activate continuous monitoring as eligible Amazon activity becomes available.',
        sheetBody: 'Your first audit had limited coverage. Recovery Workspace continues monitoring eligible Amazon activity as new shipments, reimbursements, refunds, fees, and settlements become available.',
        cta: 'Activate Recovery Workspace',
      };
    }

    if (hasRecoveryOpportunity) {
      return {
        heading: 'Choose how Margin should help.',
        bridge: 'Recover the opportunities from this audit, or keep Margin monitoring future activity continuously.',
        sheetBody: 'Activate the Recovery Workspace to prepare evidence, track deadlines, manage Amazon responses, and verify that the correct payouts reach settlement.',
        cta: 'Activate Recovery Workspace',
      };
    }

    return {
      heading: 'No recoveries found in this audit. Keep Margin watching.',
      bridge: 'Your account may be clear today. Keep Margin watching as your Amazon activity changes.',
      sheetBody: 'No recoveries were found today. Recovery Workspace keeps checking new shipments, returns, reimbursements, fees, and settlement activity as your Amazon operation changes.',
      cta: 'Activate Recovery Workspace',
    };
  })();

  const auditSheetSummary = isZeroRecordLimitedAudit
    ? {
      label: 'Limited Amazon coverage',
      metric: `${Number(teaser.recordsReviewed || 0).toLocaleString()} records reviewed`,
    }
    : hasRecoveryOpportunity
      ? {
        label: `${teaser.findingsCount} potential ${teaser.findingsCount === 1 ? 'recovery' : 'recoveries'}`,
        metric: `${formatMoney(teaser.scopeValue)} potential value`,
      }
      : {
        label: 'No recoveries found',
        metric: `${Number(teaser.recordsReviewed || 0).toLocaleString()} records reviewed`,
      };

  const statusCopy = {
    public: 'Secure your data residency. Authorize read-only synchronization when you are ready.',
    ready: 'Your account is ready. Start the audit and Margin will check whether Amazon data is connected.',
    connect: 'Connect Amazon securely so Margin can scan FBA data and prepare the recovery scope.',
    syncing: 'Margin is syncing Amazon data. If Amazon is still blocked, this step will fail gracefully.',
    detecting: 'The seven recovery detectors are reviewing synced FBA data for reimbursable patterns.',
    completed: teaser.message,
    failed: getSafeAuditStatusMessage(
      audit?.summary?.message,
      'The audit could not finish automatically. Retry after the Amazon connection settles.'
    ),
  } satisfies Record<AuditStep, string>;

  const primaryAction =
    step === 'public' ? (
      <Button onClick={startAccountStep} className="h-10 w-full rounded-md bg-[var(--margin-blue)] px-5 text-[13px] font-medium text-white shadow-[0_18px_48px_rgba(23,92,211,0.34)] transition-colors hover:bg-[var(--margin-blue-hover)] sm:w-auto">
        Start Free Audit
      </Button>
    ) : step === 'connect' ? (
      <Button onClick={connectAmazon} disabled={isBusy} className="h-10 w-full rounded-md bg-[var(--margin-blue)] px-5 text-[13px] font-medium text-white shadow-[0_18px_48px_rgba(23,92,211,0.34)] transition-colors hover:bg-[var(--margin-blue-hover)] sm:w-auto">
        {isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Connect Amazon
      </Button>
    ) : step === 'completed' ? (
      null
    ) : (
      <Button onClick={runAudit} disabled={isBusy} className="h-10 w-full rounded-md bg-[var(--margin-blue)] px-5 text-[13px] font-medium text-white shadow-[0_18px_48px_rgba(23,92,211,0.34)] transition-colors hover:bg-[var(--margin-blue-hover)] sm:w-auto">
        {isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {step === 'syncing' || step === 'detecting' ? 'Check Status' : audit?.sync_id ? 'Retry Audit' : 'Run Audit'}
      </Button>
    );

  const auditPhaseMarker = {
    public: '01 / INITIALIZE WORKSPACE',
    ready: '02 / READY TO AUDIT',
    connect: '02 / AWAITING AUTHORIZATION',
    syncing: '03 / SYNCING',
    detecting: '04 / RECONCILING',
    completed: '05 / FINDINGS READY',
    failed: '!! / BLOCKED',
  }[step];

  const readinessItems = [
    {
      label: 'Terminal Link',
      value: step === 'public' || step === 'ready'
        ? 'Not connected'
        : step === 'connect'
          ? 'Awaiting authorization'
          : step === 'syncing' || step === 'detecting'
            ? 'Synchronizing'
            : step === 'completed'
              ? 'Operational'
              : 'Blocked',
      status: step === 'completed' ? 'success' : step === 'failed' ? 'error' : step === 'public' || step === 'ready' ? 'neutral' : 'working',
    },
    {
      label: 'Evidence Depth',
      value: step === 'completed'
        ? teaser.evidenceReadyCount > 0 ? `${teaser.evidenceReadyCount} nodes` : 'Incomplete'
        : step === 'syncing' || step === 'detecting' ? 'Processing' : 'Awaiting sync',
      status: step === 'completed' && teaser.evidenceReadyCount > 0 ? 'success' : step === 'syncing' || step === 'detecting' ? 'working' : 'neutral',
    },
    {
      label: 'Detected Exposure',
      value: step === 'completed'
        ? teaser.findingsCount > 0 ? `${teaser.findingsCount} discrepancies` : 'Zero'
        : step === 'syncing' || step === 'detecting' ? 'Reconciling' : 'Not evaluated',
      status: step === 'completed' ? (teaser.findingsCount > 0 ? 'success' : 'neutral') : step === 'syncing' || step === 'detecting' ? 'working' : 'neutral',
    },
    {
      label: 'Filing Authority',
      value: step === 'completed' && !hasRecoveryOpportunity ? 'None required' : 'Seller controlled',
      status: step === 'completed' ? 'success' : 'neutral',
    },
  ];

  return (
    <main className="platform-audit-workspace flex h-screen max-h-screen overflow-hidden bg-[#FAFAF7] font-sans text-zinc-950 selection:bg-[#007AFF]/20 selection:text-[#007AFF] tracking-tight">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-[286px]' : 'w-[68px]'} sticky top-0 hidden h-screen shrink-0 flex-col border-r border-[#D8E3EA] bg-[#F3F6F8] transition-[width] duration-200 md:flex`}>
        {sidebarOpen ? (
          <div className="flex h-full flex-col">
            <div className="flex h-[57px] items-center justify-between border-b border-[#D8E3EA] bg-[#F3F6F8] px-4">
              <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
                <img src="/logoimagetwo.png" alt="Margin" width="18" height="18" className="h-[18px] w-auto object-contain" />
                <span className="brand-wordmark font-merriweather text-[18px] font-semibold tracking-tight text-zinc-900">Margin</span>
              </Link>
              <button type="button" onClick={() => setSidebarOpen(false)} aria-label="Collapse sidebar" className="rounded-md p-1 text-zinc-400 transition-colors hover:bg-white hover:text-zinc-900">
                <PanelLeft className="h-4 w-4" />
              </button>
            </div>

            <nav className="flex flex-col gap-0.5 px-2 pt-4">
              <button type="button" onClick={openAuditLog} className="flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[14px] leading-6 text-[#4D5B66] transition-colors hover:bg-white/60 hover:text-zinc-900">
                <TerminalSquare className="h-4 w-4 text-zinc-400" />
                Live audit log
              </button>
              <button type="button" onClick={openScheduleDialog} className={`flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[14px] leading-6 transition-colors ${weeklyAuditEnabled ? 'border-l border-[#007AFF] bg-white/50 font-medium text-zinc-900' : 'text-[#4D5B66] hover:bg-white/60 hover:text-zinc-900'}`}>
                <CalendarClock className={`h-4 w-4 ${weeklyAuditEnabled ? 'text-[#007AFF]' : 'text-zinc-400'}`} />
                Schedules
              </button>

              <div className="mt-4 px-2">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400" />
                  <button
                    type="button"
                    onClick={() => {
                      setIsPeriodSelectorOpen(true);
                      trackEvent('audit_period_selector_opened', { source_page: '/audit' });
                    }}
                    className="h-8 w-full rounded-md border border-[#D8E3EA] bg-white/50 pl-8 pr-2 text-left text-[14px] text-[#4D5B66] transition-colors hover:border-zinc-300 hover:bg-white focus:outline-none"
                  >
                    {selectedAuditPeriodLabel}
                  </button>
                </div>
              </div>
            </nav>

            <div className="mt-auto border-t border-[#D8E3EA] p-4">
              <div className="rounded-md border border-[#D8E3EA] bg-white/30 p-3">
                <button type="button" onClick={openShareDialog} className="flex w-full items-center gap-2.5 text-left text-[14px] text-[#4D5B66] transition-colors hover:text-zinc-900">
                  <HeartHandshake className="h-4 w-4 text-[#007AFF]" />
                  Invite Seller
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center">
            <div className="flex h-[57px] w-full items-center justify-center border-b border-[#D8E3EA] bg-[#F3F6F8]">
              <Link to="/" aria-label="Margin home" className="transition-opacity hover:opacity-80">
                <img src="/logoimagetwo.png" alt="Margin" width="18" height="18" className="h-[18px] w-auto object-contain" />
              </Link>
            </div>
            <nav className="flex flex-col items-center gap-2 pt-4">
              <button type="button" onClick={() => setSidebarOpen(true)} aria-label="Expand sidebar" title="Expand sidebar" className="rounded-md p-2 text-zinc-400 transition-colors hover:bg-white hover:text-zinc-900">
                <PanelLeft className="h-4 w-4" />
              </button>
              <button type="button" onClick={openAuditLog} aria-label="Live audit log" title="Live audit log" className="rounded-md p-2 text-[#4D5B66] transition-colors hover:bg-white hover:text-zinc-900">
                <TerminalSquare className="h-4 w-4" />
              </button>
              <button type="button" onClick={openScheduleDialog} aria-label="Schedules" title="Schedules" className="rounded-md p-2 text-[#4D5B66] transition-colors hover:bg-white hover:text-zinc-900">
                <CalendarClock className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setIsPeriodSelectorOpen(true)} aria-label="Audit period" title="Audit period" className="rounded-md p-2 text-[#4D5B66] transition-colors hover:bg-white hover:text-zinc-900">
                <Calendar className="h-4 w-4" />
              </button>
            </nav>
            <div className="mt-auto border-t border-[#D8E3EA] px-3 py-4">
              <button type="button" onClick={openShareDialog} aria-label="Invite Seller" title="Invite Seller" className="rounded-md p-2 text-[#007AFF] transition-colors hover:bg-white hover:text-zinc-900">
                <HeartHandshake className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className="flex h-full flex-1 flex-col overflow-y-auto overflow-x-hidden scroll-smooth">
        {/* Persistent audit context */}
        <div className="sticky top-0 z-10 flex min-h-[57px] shrink-0 items-center border-b border-[#D8E3EA] bg-white px-4 py-2 sm:px-8 md:h-[57px] md:py-0">
          <div className="flex w-full items-center justify-between gap-3 lg:flex-row lg:justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              {!sidebarOpen && (
                <button type="button" onClick={() => setSidebarOpen(true)} className="hidden rounded-md p-1 text-zinc-400 transition-colors hover:bg-[#FAFAF7] hover:text-zinc-900 md:inline-flex">
                  <PanelLeft className="h-3.5 w-3.5" />
                </button>
              )}
              <div className="flex items-center gap-2 md:hidden">
                <Link to="/" className="flex items-center">
                  <img src="/logoimagetwo.png" alt="Margin" width="16" height="16" className="h-4 w-auto object-contain" />
                </Link>
              </div>
              <div className="flex items-center gap-2 border-[#D8E3EA] text-[13px] text-zinc-700 sm:text-[14px]">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#0B74DE]" />
                <span className="truncate font-medium">Global scope</span>
              </div>
              <button
                type="button"
                onClick={openScheduleDialog}
                className="inline-flex items-center gap-1.5 border-l border-[#D8E3EA] pl-3 text-[13px] font-medium text-zinc-700 transition-colors hover:text-[#0B74DE] sm:text-[14px]"
              >
                <CalendarClock className="h-4 w-4 shrink-0 text-zinc-400" />
                <span className="truncate">Schedules</span>
              </button>
            </div>
              <div className="flex items-center gap-2 text-[13px] sm:text-[14px]">
              <button type="button" onClick={openAuditLog} className="inline-flex items-center gap-2 rounded-md border border-[#D8E3EA] bg-white px-2.5 py-1.5 font-medium text-zinc-700 transition-colors hover:border-[#0B74DE] hover:text-[#0B74DE] sm:px-3">
                <TerminalSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Audit log</span>
              </button>
              <button type="button" onClick={() => setIsExportDialogOpen(true)} className="rounded-md border border-transparent p-1.5 text-zinc-400 transition-colors hover:border-[#D8E3EA] hover:bg-[#FAFAF7] hover:text-zinc-900" title="Export summary">
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content area */}
        <section className="flex-1 px-4 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto w-full max-w-5xl">
            <header className="mb-6 pt-2">
              <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-end sm:justify-between">
                <div className="max-w-3xl">
                  <p className="mb-2 text-[13px] font-medium text-[#0B74DE]">Current audit workspace</p>
                  <h1 className="break-words font-merriweather text-[22px] leading-[1.2] tracking-tight text-[#182026]/85 sm:text-[26px] sm:leading-tight" style={{ fontWeight: 300 }}>
                    Does what Amazon says match what happened?
                  </h1>
                  <p className="mt-3 max-w-2xl text-[14px] leading-6 text-[#4D5B66]">
                    Margin examines your Amazon records for reimbursement gaps, unresolved exceptions, reversals, evidence issues and financial discrepancies.
                  </p>
                </div>
                <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsPeriodSelectorOpen(true);
                      trackEvent('audit_period_selector_opened', { source_page: '/audit' });
                    }}
                    className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-md border border-[#D8E3EA] bg-white px-4 text-[13px] font-medium text-zinc-700 transition-colors hover:border-[#0B74DE] hover:text-[#0B74DE] sm:h-9 sm:w-auto sm:px-3.5 sm:text-[12px]"
                  >
                    <Calendar className="h-4 w-4 text-zinc-400 sm:h-3.5 sm:w-3.5" />
                    View scope
                  </button>
                  {primaryAction}
                </div>
              </div>

              {/* Integrated Data Bar hidden per user request */}
              {/* <div className="mt-10 border-y border-[#D8E3EA] bg-[#F8FAFC]/50 px-0 py-5">
                <div className="flex flex-wrap items-center gap-x-16 gap-y-6">
                  {readinessItems.map((item) => (
                    <div key={item.label} className="flex flex-col gap-1.5">
                      <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#66737F]">{item.label}</div>
                      <div className="flex items-center gap-2">
                        <span className={`h-1.5 w-1.5 rounded-full ${
                          item.status === 'success' ? 'bg-emerald-500' : 
                          item.status === 'working' ? 'bg-[#0B74DE] animate-pulse' : 
                          item.status === 'error' ? 'bg-red-500' : 'bg-[#D8E3EA]'
                        }`} />
                        <span className="font-mono text-[13px] font-bold tracking-tight text-[#182026] uppercase">{item.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div> */}
            </header>

            {step !== 'completed' && (
              <section className="mb-6 mt-6 sm:mb-12 sm:mt-12">
                <div className="mb-4 sm:mb-8">
                  <h2 className="text-[12px] font-medium text-[#0B74DE] sm:text-[13px]">Operational surface</h2>
                  <p className="mt-1 text-[15px] font-medium leading-6 tracking-[-0.02em] text-[#182026] sm:text-[18px]">
                    Record reconciliation behind your selling partner account
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 sm:gap-6">
                  {/* Card 1: SP-API Node */}
                  <div className="group relative rounded-xl bg-[#FAFAF7] p-3.5 transition-all hover:bg-[#F3F6F8] sm:p-5">
                    <div className="mb-3 flex h-8 items-center sm:mb-5 sm:h-9">
                      <img src="/amazon-logo-transparent-circle.png" alt="Amazon" className="h-7 w-7 object-contain" />
                    </div>
                    <h3 className="text-[13px] font-bold text-[#182026] sm:text-[14px]">SP-API Node</h3>
                    <p className="mt-0.5 text-[11px] font-medium text-[#4D5B66] sm:mt-1 sm:text-[12px]">Operational Reconciliation</p>
                    <p className="mt-2 text-[10px] text-[#66737F] sm:mt-3 sm:text-[11px]">Read-only account examination</p>
                    <ArrowRight className="absolute right-5 top-5 h-3 w-3 text-[#D8E3EA] transition-colors group-hover:text-[#0B74DE]" />
                  </div>

                  {/* Card 2: Proof Synthesis */}
                  <div className="group relative rounded-xl bg-[#FAFAF7] p-3.5 transition-all hover:bg-[#F3F6F8] sm:p-5">
                    <div className="mb-3 flex h-8 items-center gap-2 sm:mb-5 sm:h-9">
                      <img src="/gmailicon.png" alt="Gmail" className="h-4 w-4 object-contain" />
                      <img src="/slack-icon-2019.png" alt="Slack" className="h-4 w-4 object-contain" />
                      <img src="/gd.png" alt="Google Drive" className="h-4 w-4 object-contain" />
                    </div>
                    <h3 className="text-[13px] font-bold text-[#182026] sm:text-[14px]">Proof Synthesis</h3>
                    <p className="mt-0.5 text-[11px] font-medium text-[#4D5B66] sm:mt-1 sm:text-[12px]">Evidence Ledger</p>
                    <p className="mt-2 text-[10px] text-[#66737F] sm:mt-3 sm:text-[11px]">Documents → cases → findings</p>
                    <ArrowRight className="absolute right-5 top-5 h-3 w-3 text-[#D8E3EA] transition-colors group-hover:text-[#0B74DE]" />
                  </div>

                  {/* Card 3: Financial Integrity */}
                  <div className="group relative rounded-xl bg-[#FAFAF7] p-3.5 transition-all hover:bg-[#F3F6F8] sm:p-5">
                    <div className="mb-3 flex h-8 items-center sm:mb-5 sm:h-9">
                      <div className="flex h-7 w-7 items-center justify-center bg-white rounded-full">
                        <ArrowRightLeft className="h-3.5 w-3.5 text-[#66737F] group-hover:text-[#0B74DE]" />
                      </div>
                    </div>
                    <h3 className="text-[13px] font-bold text-[#182026] sm:text-[14px]">Financial Integrity</h3>
                    <p className="mt-0.5 text-[11px] font-medium text-[#4D5B66] sm:mt-1 sm:text-[12px]">Transaction Mapping</p>
                    <p className="mt-2 text-[10px] text-[#66737F] sm:mt-3 sm:text-[11px]">Expected → paid → unresolved</p>
                    <ArrowRight className="absolute right-5 top-5 h-3 w-3 text-[#D8E3EA] transition-colors group-hover:text-[#0B74DE]" />
                  </div>
                </div>

                <div className="mt-8 border-t border-[#D8E3EA] pt-4">
                  <p className="text-[11px] leading-5 font-medium text-[#66737F] sm:text-[12px]">
                    Read-only examination · Evidence-backed findings · Seller approval before action
                  </p>
                </div>
              </section>
            )}

            {step === 'completed' ? (
              <section className="mb-8 border border-[#D8E3EA] bg-white p-5 sm:p-7">
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[13px] font-medium text-[#0B74DE]">Recovery findings</p>
                      <h2 className="mt-1 text-[20px] font-semibold tracking-[-0.03em] text-[#182026]">Your review scope</h2>
                    </div>
                    <span className="border border-[#D8E3EA] bg-[#FAFAF7] px-3 py-1.5 text-[12px] font-medium text-[#4D5B66]">{isZeroRecordLimitedAudit ? 'Limited coverage' : 'Ready for review'}</span>
                  </div>
                  <div className="grid gap-px border border-[#D8E3EA] bg-[#D8E3EA] sm:grid-cols-3">
                    <div className="bg-white p-4">
                      <div className="text-[12px] font-medium text-[#66737F]">Recovery exposure</div>
                      <div className="mt-1 text-[22px] font-semibold tracking-[-0.03em] text-[#182026] tabular-nums">{isZeroRecordLimitedAudit ? '$0' : formatMoney(teaser.scopeValue)}</div>
                    </div>
                    <div className="bg-white p-4">
                      <div className="text-[12px] font-medium text-[#66737F]">Material findings</div>
                      <div className="mt-1 text-[22px] font-semibold tracking-[-0.03em] text-[#182026] tabular-nums">{isZeroRecordLimitedAudit ? '0' : teaser.findingsCount}</div>
                    </div>
                    <div className="bg-white p-4">
                      <div className="text-[12px] font-medium text-[#66737F]">Evidence ready</div>
                      <div className="mt-1 text-[22px] font-semibold tracking-[-0.03em] text-[#182026] tabular-nums">{isZeroRecordLimitedAudit ? '0' : teaser.evidenceReadyCount}</div>
                    </div>
                  </div>
                  {teaser.categories.length ? (
                    <div className="flex flex-wrap gap-2">
                      {teaser.categories.map((category) => (
                        <span key={category} className="border border-[#D8E3EA] bg-[#FAFAF7] px-2.5 py-1 text-[12px] font-medium text-[#4D5B66]">{category}</span>
                      ))}
                    </div>
                  ) : null}
                  {(teaser.recordsReviewed != null || teaser.sourcesUnavailable?.length) ? (
                    <div className="border-t border-[#E6EEF2] pt-4">
                      <div className="text-[12px] font-medium text-[#66737F]">Coverage details</div>
                      <p className="mt-1.5 text-[13px] leading-5 text-[#4D5B66]">
                        {teaser.recordsReviewed != null ? `${teaser.recordsReviewed.toLocaleString()} Amazon records were synchronized and reviewed.` : 'Amazon record coverage analysis is in progress.'}
                        {teaser.sourcesReviewed?.length ? ` Primary sources: ${teaser.sourcesReviewed.join(', ')}.` : ''}
                        {teaser.sourcesUnavailable?.length ? ` Restricted access: ${teaser.sourcesUnavailable.join(', ')}.` : ''}
                      </p>
                    </div>
                  ) : null}
                </div>
              </section>
            ) : null}

            {step === 'completed' ? (
              <section className="mb-12 rounded-none border border-zinc-100 bg-white p-8">
                <div className="flex flex-col gap-10">
                  <div className="max-w-2xl">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-px w-6 bg-zinc-900" />
                      <span className="text-[12px] font-semibold uppercase tracking-tight text-[#182026]">{canShowRecoverOnce ? 'Engagement Options' : 'Continuous Intelligence'}</span>
                    </div>
                    <h2 className="text-[22px] font-bold tracking-tight text-zinc-900">{workspaceOffer.heading}</h2>
                    <p className="mt-3 text-[14px] leading-relaxed text-zinc-500">{workspaceOffer.bridge}</p>
                  </div>

                  <div className="grid grid-cols-2 border-y border-zinc-50 py-8">
                    <div className="flex flex-col pr-8 border-r border-zinc-50">
                      <span className="text-[12px] font-semibold uppercase tracking-tight text-[#66737F] mb-2">Audit Duration</span>
                      <span className="text-[18px] font-bold tracking-tight text-zinc-900 tabular-nums">
                        {step === 'completed'
                          ? audit?.completed_at && audit?.started_at
                            ? formatDuration(audit.completed_at, audit.started_at)
                            : '2.4m'
                          : '2.4m'}
                      </span>
                    </div>
                    <div className="flex flex-col pl-8">
                      <span className="text-[12px] font-semibold uppercase tracking-tight text-[#66737F] mb-2">Verified Value</span>
                      <span className="text-[18px] font-bold tracking-tight text-zinc-900 tabular-nums">{formatMoney(teaser.scopeValue)}</span>
                    </div>
                  </div>

                  {canShowRecoverOnce ? (
                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="rounded-none border border-zinc-100 bg-zinc-50/30 p-8 flex flex-col">
                        <div className="text-[12px] font-semibold uppercase tracking-tight text-[#66737F] mb-4">Engagement 01 / One-Time</div>
                        <h3 className="text-[20px] font-bold tracking-tight text-zinc-900">
                          {isRecoverOnceQuoteLoading
                            ? 'Analyzing...'
                            : recoverOnceQuote?.status === 'available' || recoverOnceQuote?.status === 'accepted'
                              ? `${recoverOnceQuote.display_amount} Fixed`
                              : 'Recover Once'}
                        </h3>
                        <p className="mt-3 text-[13px] leading-relaxed text-zinc-500 flex-1">
                          {recoverOnceQuote?.status === 'manual_review_required'
                            ? 'This scope requires manual forensic review before a fixed quote can be finalized.'
                            : 'Margin manages the specific actionable recovery opportunities identified in this audit.'}
                        </p>
                        <div className="mt-6 pt-6 border-t border-zinc-100">
                          <p className="text-[13px] font-semibold text-[#182026] uppercase tracking-tight">
                            0% Success Commission
                          </p>
                        </div>
                        {recoverOnceQuote?.status === 'available' || recoverOnceQuote?.status === 'accepted' ? (
                          <Button variant="outline" onClick={startRecoverOnceCheckout} disabled={isBusy || isRecoverOnceQuoteLoading} className="mt-6 w-full h-12 rounded-md border-zinc-200 bg-white text-[13px] font-semibold uppercase tracking-tight text-[#182026] hover:bg-zinc-50 transition-all">
                            {isBusy ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
                            Initialize Recovery
                          </Button>
                        ) : (
                          <Button variant="outline" disabled className="mt-6 w-full h-12 rounded-md border-zinc-100 bg-zinc-50/50 text-[13px] font-semibold uppercase tracking-tight text-[#8A99A4]">
                            {isRecoverOnceQuoteLoading ? 'Processing' : 'Unavailable'}
                          </Button>
                        )}
                      </div>

                      <div className="rounded-none border border-zinc-100 bg-white p-8 text-zinc-900 flex flex-col shadow-2xl shadow-zinc-100">
                        <div className="text-[12px] font-semibold uppercase tracking-tight text-[#66737F] mb-4">Engagement 02 / Continuous</div>
                        <h3 className="text-[20px] font-bold tracking-tight text-zinc-900">$99 / Month</h3>
                        <p className="mt-3 text-[13px] leading-relaxed text-zinc-400 flex-1">
                          Full operational surface. Margin monitors every shipment, detects discrepancies daily, and handles all Amazon responses.
                        </p>
                        <div className="mt-6 pt-6 border-t border-zinc-100">
                          <p className="text-[13px] font-semibold text-[#182026] uppercase tracking-tight">
                            Unlimited Recoveries
                          </p>
                        </div>
                        <Button onClick={openActivationSheet} disabled={isBusy} className="mt-6 w-full h-12 rounded-md bg-[#0B74DE] text-[14px] font-semibold text-white hover:bg-[#075EBA] transition-all">
                          {isBusy ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
                          Activate Workspace
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-none border border-zinc-100 bg-white p-8 text-zinc-900 flex flex-col shadow-2xl shadow-zinc-100">
                      <div className="text-[12px] font-semibold uppercase tracking-tight text-[#66737F] mb-4">Recovery Surface / Continuous</div>
                      <h3 className="text-[20px] font-bold tracking-tight text-zinc-900">$99 / Month</h3>
                      <p className="mt-3 text-[13px] leading-relaxed text-zinc-500 flex-1">
                        Our agents monitor your account daily for new lost inventory, damaged items, and settlement gaps.
                      </p>
                      <div className="mt-6 pt-6 border-t border-zinc-100">
                        <p className="text-[13px] font-semibold text-[#182026] uppercase tracking-tight">
                          0% Recovery Commission
                        </p>
                      </div>
                      <Button onClick={openActivationSheet} disabled={isBusy} className="mt-6 w-full h-12 rounded-md bg-[#0B74DE] text-[14px] font-semibold text-white hover:bg-[#075EBA] transition-all">
                        {isBusy ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
                        Activate Workspace
                      </Button>
                    </div>
                  )}
                </div>
              </section>
            ) : null}
          </div>
        </section>
      </div>

      {/* Keep all dialogs and sheets exactly as they are */}
      <Sheet open={isActivationSheetOpen} onOpenChange={setIsActivationSheetOpen}>
        <SheetContent side="right" className="flex h-full w-full flex-col overflow-y-auto border-gray-200 bg-white p-0 text-gray-900 shadow-[0_24px_90px_rgba(15,23,42,0.18)] sm:max-w-[460px] max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-auto max-sm:h-[90vh] max-sm:w-full max-sm:rounded-t-2xl max-sm:border-l-0 max-sm:border-t">
          <div className="px-6 pb-6 pt-7">
            <SheetHeader className="text-left">
              <div className="mb-4 rounded-lg border border-gray-100 bg-gray-50 p-3">
                <div className="font-mono text-[10px] font-medium uppercase text-gray-400">First audit</div>
                <div className="mt-2 grid grid-cols-1 gap-2 text-[13px] text-gray-600">
                  <div className="flex items-center justify-between gap-3">
                    <span>{auditSheetSummary.label}</span>
                    <span className="font-medium text-gray-900">{auditSheetSummary.metric}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Monitoring</span>
                    <span className="font-medium text-gray-900">Not active</span>
                  </div>
                </div>
              </div>
              <div className="font-mono text-[10px] font-medium uppercase text-blue-600">Recovery Workspace</div>
              <SheetTitle className="mt-2 text-[24px] font-semibold leading-tight tracking-[-0.03em] text-gray-900">
                One audit shows what is visible today. Margin keeps watching what happens next.
              </SheetTitle>
              <SheetDescription className="mt-3 text-[14px] leading-relaxed text-gray-500">
                {workspaceOffer.sheetBody}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-7 grid gap-4">
              {[
                ['Continuous monitoring', 'Scheduled Recovery Audits and new-opportunity alerts.'],
                ['Evidence readiness', 'Records connected and missing proof surfaced before deadlines.'],
                ['Recovery continuity', 'Seller approvals, Amazon responses, and case history kept together.'],
                ['Payout control', 'Underpayments, reversals, and settlement outcomes monitored through reconciliation.'],
              ].map(([title, body]) => (
                <div key={title} className="border-t border-gray-100 pt-4">
                  <h3 className="text-[14px] font-semibold tracking-[-0.01em] text-gray-900">{title}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-gray-500">{body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto border-t border-gray-100 bg-gray-50 px-6 py-5">
            <div className="text-[28px] font-semibold tracking-[-0.04em] text-[#182026]">$99 / Month</div>
            <p className="mt-1 text-[13px] leading-relaxed text-gray-600">Flat-fee Recovery OS | 0% recovery commission | Cancel anytime | Nothing filed without approval</p>
            <Button onClick={activateAudit} disabled={isBusy} className="mt-5 h-11 w-full rounded-md bg-[var(--margin-blue)] px-5 text-[13px] font-medium text-white shadow-[0_18px_48px_rgba(23,92,211,0.28)] transition-colors hover:bg-[var(--margin-blue-hover)]">
              {isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Continue to Secure Checkout
              {!isBusy ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
            </Button>
            <SheetClose asChild>
              <Button variant="ghost" className="mt-2 h-10 w-full rounded-md text-[13px] font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700">
                Not now
              </Button>
            </SheetClose>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={isPeriodSelectorOpen} onOpenChange={setIsPeriodSelectorOpen}>
        <DialogContent className="rounded-xl border-[#D8E3EA] bg-[#FAFAF7] text-[#182026] shadow-[0_20px_70px_rgba(24,32,38,0.12)] sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold tracking-[-0.03em] text-gray-900">Audit period</DialogTitle>
            <DialogDescription className="text-[13px] leading-relaxed text-gray-500">
              Select from actual audit history. Empty months are not shown.
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={auditHistoryQuery}
              onChange={(event) => setAuditHistoryQuery(event.target.value)}
              placeholder="Search month, year, or status"
              className="h-10 w-full rounded-md border border-gray-200 bg-gray-50 pl-9 pr-3 text-[13px] outline-none transition-colors focus:border-[var(--margin-blue)] focus:bg-white focus:ring-1 focus:ring-[var(--margin-blue)]"
            />
          </div>
          <div className="max-h-[320px] overflow-y-auto">
            {isHistoryLoading ? (
              <div className="flex items-center gap-2 py-6 text-[13px] text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading audit history
              </div>
            ) : auditHistory.length ? (
              <div className="grid gap-2">
                {auditHistory
                  .filter((item) => {
                    const q = auditHistoryQuery.trim().toLowerCase();
                    if (!q) return true;
                    return [item.label, item.month, item.status, item.finalStatus].join(' ').toLowerCase().includes(q);
                  })
                  .map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => void selectAuditPeriod(item)}
                      className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-3 text-left transition-colors hover:border-blue-100 hover:bg-blue-50/30 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                      <span>
                        <span className="block text-[13px] font-medium text-gray-900">{item.label}{item.isLatest ? ' — Latest' : ''}</span>
                        <span className="mt-1 block text-[11px] text-gray-500">{item.finalStatus || item.status} · {item.findingsCount} findings · {formatMoney(item.scopeValue)}</span>
                      </span>
                      {audit?.id === item.id ? <Check className="h-4 w-4 text-blue-600" /> : null}
                    </button>
                  ))}
              </div>
            ) : (
              <p className="py-6 text-[13px] text-gray-500">No previous audits are available yet.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="rounded-xl border-[#D8E3EA] bg-[#FAFAF7] text-[#182026] shadow-[0_20px_70px_rgba(24,32,38,0.12)] sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold tracking-[-0.03em] text-gray-900">Export summary</DialogTitle>
            <DialogDescription className="text-[13px] leading-relaxed text-gray-500">
              Download a PDF summary for {selectedAuditPeriodLabel}. Sensitive identifiers, tokens, raw payloads, and payment references are excluded.
            </DialogDescription>
          </DialogHeader>
          {step !== 'completed' ? (
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-[13px] text-gray-500">
              Complete the selected audit before exporting a summary.
            </div>
          ) : null}
          {exportError ? <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-[13px] text-red-700">{exportError}</div> : null}
          {summaryExported ? <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-[13px] text-emerald-700">Last export completed successfully.</div> : null}
          <Button onClick={exportExecutiveSummary} disabled={isExporting || step !== 'completed'} className="h-10 rounded-md bg-[var(--margin-blue)] px-4 text-[13px] font-medium text-white">
            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Download PDF
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="rounded-xl border-[#D8E3EA] bg-[#FAFAF7] text-[#182026] shadow-[0_20px_70px_rgba(24,32,38,0.12)] sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold tracking-[-0.03em] text-gray-900">Auto-run audit schedule</DialogTitle>
            <DialogDescription className="text-[13px] leading-relaxed text-gray-500">
              Automatic audits are available with Recovery Workspace. The schedule is tenant-owned and only one audit runs at a time.
            </DialogDescription>
          </DialogHeader>
          {!scheduleEntitled ? (
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-[13px] text-gray-600">
              Activate Recovery Workspace before saving an automatic audit schedule.
            </div>
          ) : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-[12px] font-medium text-gray-600">
              Frequency
              <select value={scheduleForm.cadence} onChange={(event) => setScheduleForm((current) => ({ ...current, cadence: event.target.value as AuditScheduleCadence }))} className="h-10 rounded-md border border-gray-200 bg-white px-3 text-[13px] text-gray-800">
                <option value="off">Off</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Every two weeks</option>
                <option value="monthly">Monthly</option>
              </select>
            </label>
            <label className="grid gap-1 text-[12px] font-medium text-gray-600">
              Preferred time
              <input value={scheduleForm.preferred_time} onChange={(event) => setScheduleForm((current) => ({ ...current, preferred_time: event.target.value }))} type="time" className="h-10 rounded-md border border-gray-200 bg-white px-3 text-[13px] text-gray-800" />
            </label>
            <label className="grid gap-1 text-[12px] font-medium text-gray-600">
              Day of week
              <select value={scheduleForm.preferred_day_of_week} onChange={(event) => setScheduleForm((current) => ({ ...current, preferred_day_of_week: Number(event.target.value) }))} className="h-10 rounded-md border border-gray-200 bg-white px-3 text-[13px] text-gray-800">
                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => <option key={day} value={index}>{day}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-[12px] font-medium text-gray-600">
              Day of month
              <input value={scheduleForm.preferred_day_of_month} onChange={(event) => setScheduleForm((current) => ({ ...current, preferred_day_of_month: Number(event.target.value) }))} min={1} max={28} type="number" className="h-10 rounded-md border border-gray-200 bg-white px-3 text-[13px] text-gray-800" />
            </label>
            <label className="grid gap-1 text-[12px] font-medium text-gray-600 sm:col-span-2">
              Timezone
              <input value={scheduleForm.timezone} onChange={(event) => setScheduleForm((current) => ({ ...current, timezone: event.target.value }))} className="h-10 rounded-md border border-gray-200 bg-white px-3 text-[13px] text-gray-800" />
            </label>
          </div>
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-[12px] text-gray-500">
            Next scheduled run: {auditSchedule?.next_run_at && !scheduleForm.is_paused ? new Date(auditSchedule.next_run_at).toLocaleString() : 'Not scheduled'}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={() => void saveSchedule()} disabled={!scheduleEntitled || isScheduleSaving} className="h-10 rounded-md bg-[var(--margin-blue)] px-4 text-[13px] font-medium text-white disabled:bg-blue-200 disabled:text-white disabled:opacity-100">
              {isScheduleSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save schedule
            </Button>
            <Button variant="outline" onClick={() => void saveSchedule({ is_paused: true })} disabled={!scheduleEntitled || isScheduleSaving} className="h-10 rounded-md border-gray-200 bg-[#FAFAF7] px-4 text-[13px] text-gray-700 disabled:border-gray-100 disabled:bg-gray-50 disabled:text-gray-400 disabled:opacity-100">Pause</Button>
            <Button variant="outline" onClick={() => void saveSchedule({ cadence: 'off', is_paused: false })} disabled={!scheduleEntitled || isScheduleSaving} className="h-10 rounded-md border-gray-200 bg-[#FAFAF7] px-4 text-[13px] text-gray-700 disabled:border-gray-100 disabled:bg-gray-50 disabled:text-gray-400 disabled:opacity-100">Turn off</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="rounded-xl border-[#D8E3EA] bg-[#FAFAF7] text-[#182026] shadow-[0_20px_70px_rgba(24,32,38,0.12)] sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold tracking-[-0.03em] text-gray-900">Share Margin with a seller</DialogTitle>
            <DialogDescription className="text-[13px] leading-relaxed text-gray-500">
              Share only the public audit entry point. No audit, tenant, Amazon, or recovery data is included.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-[13px] leading-relaxed text-gray-600">
            Margin helps Amazon sellers audit reimbursement activity, prepare evidence, track recoveries, and verify payouts. Run a free Recovery Audit.
          </div>
          <input readOnly value={getShareLink()} className="h-10 rounded-md border border-gray-200 bg-white px-3 text-[12px] text-gray-600" />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={copyShareLink} variant="outline" className="h-10 rounded-md border-gray-200 bg-[#FAFAF7] px-4 text-[13px] text-gray-700 hover:bg-gray-50 hover:text-gray-900">
              {shareCopied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {shareCopied ? 'Copied' : 'Copy link'}
            </Button>
            <Button asChild variant="outline" className="h-10 rounded-md border-gray-200 bg-[#FAFAF7] px-4 text-[13px] text-gray-700 hover:bg-gray-50 hover:text-gray-900" onClick={() => trackEvent('share_email_clicked', { source_page: '/audit' })}>
              <a href={`mailto:?subject=${encodeURIComponent('Run a free Amazon Recovery Audit with Margin')}&body=${encodeURIComponent(`Margin helps Amazon sellers audit reimbursement activity, prepare evidence, track recoveries, and verify payouts. Run a free Recovery Audit:\n\n${getShareLink()}`)}`}>
                <Mail className="mr-2 h-4 w-4" /> Email
              </a>
            </Button>
            <Button onClick={() => void nativeShare()} className="h-10 rounded-md bg-[var(--margin-blue)] px-4 text-[13px] font-medium text-white">Share</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSecurityProtocolOpen} onOpenChange={setIsSecurityProtocolOpen}>
        <DialogContent className="rounded-xl border-[#D8E3EA] bg-[#FAFAF7] text-[#182026] shadow-[0_20px_70px_rgba(24,32,38,0.12)] sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-[20px] font-semibold tracking-[-0.03em] text-gray-900">Security Protocol</DialogTitle>
            <DialogDescription className="text-[14px] leading-relaxed text-gray-500">
              Margin uses the permissions and controls described below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 text-[13px] text-gray-600">
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <div className="font-medium text-gray-900">Read-only synchronization</div>
              <p className="mt-1 leading-relaxed">Margin reviews shipments, settlements, inventory, refunds, fees, and related records to prepare a recovery scope.</p>
            </div>
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <div className="font-medium text-gray-900">Seller-controlled filing</div>
              <p className="mt-1 leading-relaxed">You retain 100% filing authority. Evidence is prepared for review; submission requires explicit seller action.</p>
            </div>
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <div className="font-medium text-gray-900">Account ownership</div>
              <p className="mt-1 leading-relaxed">One Amazon seller account is bound to one Margin workspace. Cross-workspace reuse is blocked during authorization.</p>
            </div>
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-3">
              <div className="font-medium text-gray-900">Payment separation</div>
              <p className="mt-1 leading-relaxed">Amazon authorization and Paystack checkout are separate flows. Payment details are verified through Paystack, not through Amazon credentials.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Sheet open={isAuditLogOpen} onOpenChange={setIsAuditLogOpen}>
        <SheetContent side="right" className="flex h-full w-full flex-col overflow-y-auto border-l border-[#D8E3EA] bg-[#FAFAF7] p-5 text-[#182026] shadow-[0_20px_70px_rgba(24,32,38,0.12)] sm:max-w-[520px] max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-auto max-sm:h-[90vh] max-sm:w-full max-sm:rounded-t-2xl max-sm:border-t max-sm:border-l-0">
          <DialogHeader className="border-b border-[#D8E3EA] pb-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <DialogTitle className="text-[20px] font-semibold tracking-[-0.03em] text-[#182026]">Live Audit Log</DialogTitle>
                <DialogDescription className="mt-1.5 text-[13px] leading-5 text-[#66737F]">
                  A context-aware record of the current audit workspace.
                </DialogDescription>
              </div>
              <span className="border border-[#D8E3EA] bg-white px-2.5 py-1 text-[11px] font-medium text-[#4D5B66]">{auditState.label}</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-[12px]">
              <div><span className="text-[#66737F]">Scope</span><span className="ml-2 font-medium text-[#182026]">Global scope</span></div>
              <div><span className="text-[#66737F]">Period</span><span className="ml-2 font-medium text-[#182026]">{selectedAuditPeriodLabel}</span></div>
              <div><span className="text-[#66737F]">Phase</span><span className="ml-2 font-medium text-[#182026]">{auditPhaseMarker}</span></div>
            </div>
          </DialogHeader>
          <div className="mt-5 flex flex-wrap gap-2">
            {['All', 'Amazon', 'Evidence', 'Findings', 'Payment'].map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => {
                  setAuditLogFilter(filter);
                  trackEvent('audit_log_filter_changed', { source_page: '/audit', filter });
                }}
                className={`rounded-md border px-2.5 py-1 text-[12px] font-medium transition-colors ${auditLogFilter === filter ? 'border-[#0B74DE] bg-[#EAF3FF] text-[#0B74DE]' : 'border-[#D8E3EA] bg-white text-[#66737F] hover:border-[#0B74DE] hover:text-[#0B74DE]'}`}
              >
                {filter}
              </button>
            ))}
          </div>
          <div className="mt-5 flex-1">
            {isAuditLogLoading ? (
              <div className="flex items-center gap-2 border-t border-[#D8E3EA] pt-4 text-[13px] text-[#66737F]"><Loader2 className="h-4 w-4 animate-spin text-[#0B74DE]" /> Loading audit activity</div>
            ) : auditLogEvents.filter((event) => auditLogFilter === 'All' || event.category === auditLogFilter).length ? (
              <div className="relative border-l border-[#D8E3EA] pl-5">
                {auditLogEvents
                  .filter((event) => auditLogFilter === 'All' || event.category === auditLogFilter)
                  .map((event, index) => (
                    <div key={`${event.timestamp}-${index}`} className="relative border-b border-[#E6EEF2] pb-4 pt-1 first:pt-0 last:border-b-0">
                      <span className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full border-2 border-[#FAFAF7] bg-[#0B74DE]" />
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[12px] font-medium text-[#0B74DE]">{event.category}</span>
                        <span className="text-[11px] text-[#9AA8B2]">{new Date(event.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="mt-1.5 text-[13px] leading-5 text-[#4D5B66]">{event.message}</p>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="border-t border-[#D8E3EA] pt-4">
                <p className="text-[14px] font-medium text-[#182026]">No audit activity yet</p>
                <p className="mt-1.5 max-w-sm text-[13px] leading-5 text-[#66737F]">
                  {step === 'public' || step === 'ready' || step === 'connect'
                    ? 'The audit log will populate after read-only synchronization begins. Your current workspace is waiting for authorization.'
                    : step === 'syncing' || step === 'detecting'
                      ? 'Activity will appear as Margin synchronizes records and reconciles the audit scope.'
                      : 'No activity has been recorded for this audit period.'}
                </p>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </main>
  );

}
