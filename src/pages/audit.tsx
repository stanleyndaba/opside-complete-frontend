import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@clerk/react';
import { AlertTriangle, ArrowRight, ArrowRightLeft, Calendar, CalendarClock, Check, CircleDollarSign, Copy, Database, Download, FilePlus2, FileText, HeartHandshake, Loader2, Mail, Search, ShieldCheck, TerminalSquare } from 'lucide-react';
import { useLocation, useNavigate, Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { useSession } from '@/contexts/SessionContext';
import { useTenant } from '@/contexts/TenantContext';
import { api, AuditActivityEvent, AuditExportSummary, AuditHistoryItem, AuditRunRecord, AuditScheduleExecutionStatus, AuditScheduleOperatingState, AuditScheduleRecord, AuditTeaserSummary, RecoverOnceQuote } from '@/lib/api';
import { ANALYTICS_EVENTS } from '@/lib/analyticsEvents';
import { trackEvent } from '@/lib/analytics';
import { tenantRoute } from '@/lib/routes';

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

function formatDuration(completedAt?: string | null, startedAt?: string | null) {
  const completedMs = Date.parse(completedAt || '');
  const startedMs = Date.parse(startedAt || '');
  if (!Number.isFinite(completedMs) || !Number.isFinite(startedMs)) return '—';

  const durationMs = completedMs - startedMs;
  if (durationMs <= 0) return '—';

  const totalSeconds = Math.max(1, Math.floor(durationMs / 1000));
  if (totalSeconds < 60) return `${totalSeconds}s`;

  const totalMinutes = Math.floor(totalSeconds / 60);
  if (totalMinutes < 60) return `${totalMinutes}m`;

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes ? `${hours}h ${minutes}m` : `${hours}h`;
}

function formatAuditDate(value?: string | null, fallback = 'Not recorded') {
  const parsed = Date.parse(value || '');
  if (!Number.isFinite(parsed)) return fallback;
  return new Date(parsed).toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function auditSourceLabel(source?: string | null) {
  return source === 'csv_upload' ? 'Uploaded Amazon reports' : 'Connected Amazon';
}

function sellerAuditOutcome(status?: string | null, finalStatus?: string | null) {
  if (finalStatus === 'complete_with_findings') return 'Complete — opportunities found';
  if (finalStatus === 'complete_no_findings') return 'Complete — no opportunities found';
  if (finalStatus === 'partial_with_findings') return 'Limited coverage — opportunities found';
  if (finalStatus === 'partial_no_findings') return 'Limited coverage — no opportunities found';
  if (status === 'amazon_connection_required') return 'Action required — Amazon connection';
  if (status === 'syncing') return 'Running — syncing Amazon data';
  if (status === 'detecting') return 'Running — reviewing available activity';
  if (status === 'failed') return 'Needs attention';
  if (status === 'created') return 'Prepared';
  return 'Status not recorded';
}

function scheduleOperatingCopy(operating: AuditScheduleOperatingState | null) {
  switch (operating?.state) {
    case 'completed': return { label: 'Last automatic audit completed', tone: 'text-emerald-700', detail: 'The latest scheduled audit is available to review.' };
    case 'running': return { label: 'Automatic audit in progress', tone: 'text-[#0B74DE]', detail: 'Margin is working through the current scheduled audit.' };
    case 'skipped': return { label: 'Automatic audit skipped', tone: 'text-amber-800', detail: 'Another audit was already in progress for this workspace.' };
    case 'blocked': return { label: 'Automatic audit needs Amazon access', tone: 'text-amber-800', detail: 'Reconnect Amazon before the next scheduled attempt.' };
    case 'paused': return { label: 'Automatic audits paused', tone: 'text-[#4D5B66]', detail: operating.reason_code === 'recovery_workspace_entitlement_inactive' ? 'Recovery Workspace is not active for this schedule.' : 'This schedule is paused and will not run automatically.' };
    case 'failed': return { label: 'Automatic audit could not complete', tone: 'text-red-700', detail: 'Review the linked audit for the safe next step.' };
    case 'awaiting_first_run': return { label: 'Automatic audit is scheduled', tone: 'text-[#0B74DE]', detail: 'No automatic audit has been recorded yet.' };
    default: return { label: 'Automatic audits are off', tone: 'text-[#4D5B66]', detail: 'Turn on a schedule when this workspace is ready for recurring audits.' };
  }
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
      description: 'Margin is reviewing the synced Amazon activity for potential recovery opportunities.',
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
  const { tenant } = useTenant();
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
  const activeTenantSlug = tenant?.slug || tenantSlug || localStorage.getItem('active_tenant_slug');
  const [teaser, setTeaser] = useState<AuditTeaserSummary>(defaultTeaser);
  const [isBusy, setIsBusy] = useState(false);
  const [isActivationSheetOpen, setIsActivationSheetOpen] = useState(false);
  const [isSecurityProtocolOpen, setIsSecurityProtocolOpen] = useState(false);
  const [isAuditLogOpen, setIsAuditLogOpen] = useState(false);
  const [isPeriodSelectorOpen, setIsPeriodSelectorOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [isScopeDialogOpen, setIsScopeDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [weeklyAuditEnabled, setWeeklyAuditEnabled] = useState(false);
  const [summaryExported, setSummaryExported] = useState(false);
  const [auditHistory, setAuditHistory] = useState<AuditHistoryItem[]>([]);
  const [auditHistoryQuery, setAuditHistoryQuery] = useState('');
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [auditHistoryError, setAuditHistoryError] = useState<string | null>(null);
  const [auditLogEvents, setAuditLogEvents] = useState<AuditActivityEvent[]>([]);
  const [auditLogFilter, setAuditLogFilter] = useState('All');
  const [isAuditLogLoading, setIsAuditLogLoading] = useState(false);
  const [auditLogError, setAuditLogError] = useState<string | null>(null);
  const [auditSchedule, setAuditSchedule] = useState<AuditScheduleRecord | null>(null);
  const [scheduleEntitled, setScheduleEntitled] = useState(false);
  const [scheduleExecution, setScheduleExecution] = useState<AuditScheduleExecutionStatus | null>(null);
  const [scheduleOperating, setScheduleOperating] = useState<AuditScheduleOperatingState | null>(null);
  const [amazonConnected, setAmazonConnected] = useState<boolean | null>(null);
  const [scheduleLoadError, setScheduleLoadError] = useState<string | null>(null);
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
  const canShowRecoverOnce = teaser.commercialEligibility === 'eligible' && teaser.commercialRoute === 'RECOVER_ONCE' &&
    hasFindings && hasScopeValue && !isZeroRecordLimitedAudit;
  const canShowWorkspace = teaser.commercialEligibility === 'eligible' && (
    teaser.commercialRoute === 'WORKSPACE' || teaser.commercialRoute === 'RECOVERY_CONTROL'
  );
  const needsAdditionalAmazonData = step === 'completed' && (isZeroRecordLimitedAudit || Boolean(teaser.sourcesUnavailable?.length));
  const selectedAuditHistoryItem = auditHistory.find((item) => item.id === audit?.id) || null;
  const selectedAuditIsLatest = Boolean(selectedAuditHistoryItem?.isLatest);
  const selectedAuditSelectorLabel = audit
    ? `${selectedAuditIsLatest ? 'Latest audit' : 'Selected audit from history'} · ${formatAuditDate(audit.completed_at || audit.started_at || selectedAuditHistoryItem?.created_at)}`
    : 'No audit selected';
  const selectedAuditPeriodLabel = selectedAuditHistoryItem?.monthLabel || 'Audit period not recorded';
  const selectedAuditSource = auditSourceLabel(audit?.source_type || selectedAuditHistoryItem?.sourceType);
  const selectedAuditRunDate = formatAuditDate(audit?.completed_at || audit?.started_at || selectedAuditHistoryItem?.created_at);
  const selectedAuditOutcome = sellerAuditOutcome(audit?.status, teaser.finalStatus || selectedAuditHistoryItem?.finalStatus);
  const selectedAuditCoverage = teaser.finalStatus?.startsWith('partial') || Boolean(teaser.sourcesUnavailable?.length)
    ? 'Limited coverage'
    : step === 'completed'
      ? 'Coverage recorded'
      : 'Coverage pending';
  const scheduleState = scheduleOperatingCopy(scheduleOperating);
  const activeWorkspaceLabel = activeTenantSlug || 'Current workspace';
  const notificationsHref = activeTenantSlug ? tenantRoute(activeTenantSlug, '/notifications') : '/notifications';
  const canManageSavedSchedule = Boolean(auditSchedule);
  const scheduleStatusAvailable = !scheduleLoadError && Boolean(scheduleOperating);
  const canSaveScheduleForm = scheduleStatusAvailable && (scheduleForm.cadence === 'off'
    ? canManageSavedSchedule
    : Boolean(scheduleEntitled && scheduleExecution?.available));
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
      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const binaryToBase64 = (buffer: ArrayBuffer) => {
        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let offset = 0; offset < bytes.length; offset += 0x8000) {
          binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
        }
        return btoa(binary);
      };
      const loadPdfAsset = async (path: string) => {
        try {
          const asset = await fetch(path);
          if (!asset.ok) return null;
          return binaryToBase64(await asset.arrayBuffer());
        } catch {
          return null;
        }
      };
      const [merriweatherFont, marginLogo] = await Promise.all([
        loadPdfAsset('/fonts/Merriweather-Regular.ttf'),
        loadPdfAsset('/logoimagetwo.png'),
      ]);
      let usesMerriweather = false;
      if (merriweatherFont) {
        doc.addFileToVFS('Merriweather-Regular.ttf', merriweatherFont);
        doc.addFont('Merriweather-Regular.ttf', 'Merriweather', 'normal');
        usesMerriweather = true;
      }
      const recordedMonth = exportData.audit?.selected_period || selectedAuditPeriodLabel;
      const filenameDate = String(audit.completed_at || audit.started_at || audit.created_at || new Date().toISOString()).slice(0, 10);
      const filename = `margin-audit-${audit.id.slice(0, 8)}-${filenameDate}.pdf`;
      const summary = exportData.summary || {};
      const findings: AuditExportSummary['findings'] = Array.isArray(exportData.findings) ? exportData.findings : [];
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 18;
      const contentWidth = pageWidth - margin * 2;
      const footerY = pageHeight - 12;
      const generatedAt = new Date().toLocaleString();
      const recordedList = (value: unknown, fallback: string) => Array.isArray(value) && value.length
        ? value.map((item) => String(item)).join(', ')
        : fallback;
      const readableCategory = (value: unknown) => String(value || 'Potential opportunity')
        .replace(/[._-]+/g, ' ')
        .replace(/\b\w/g, (character) => character.toUpperCase());
      const recordsReviewed = summary.records_reviewed != null
        ? Number(summary.records_reviewed).toLocaleString()
        : 'Not recorded';
      const potentialScope = formatMoney(Number(summary.estimated_recoverable_value || 0));
      const potentialOpportunities = String(summary.actionable_findings || 0);
      const evidenceReady = String(summary.evidence_ready || 0);
      const evidenceRequired = String(summary.evidence_required || 0);

      const setMarginWordmarkFont = () => {
        doc.setFont(usesMerriweather ? 'Merriweather' : 'times', 'normal');
      };

      const drawDocumentHeader = () => {
        doc.setFillColor(255, 255, 255);
        doc.rect(0, 0, pageWidth, 18, 'F');
        doc.setDrawColor(24, 24, 24);
        doc.setLineWidth(0.35);
        doc.line(margin, 15, pageWidth - margin, 15);
        if (marginLogo) {
          doc.addImage(`data:image/png;base64,${marginLogo}`, 'PNG', margin, 6.2, 8.5, 4.7);
        }
        setMarginWordmarkFont();
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('Margin', margin + 11, 10.8);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.2);
        doc.text('AUDIT RESULTS', pageWidth - margin, 10.3, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.7);
        doc.setTextColor(102, 102, 102);
        doc.text('SELLER OPERATING REVIEW', pageWidth - margin, 13.1, { align: 'right' });
        doc.setTextColor(24, 24, 24);
      };

      const drawSectionTitle = (title: string, kicker?: string) => {
        if (kicker) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.2);
          doc.setTextColor(102, 102, 102);
          doc.text(kicker.toUpperCase(), margin, y);
          y += 5;
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text(title, margin, y);
        y += 6;
      };

      const startNewPage = () => {
        doc.addPage();
        drawDocumentHeader();
        y = 28;
      };

      let y = 29;
      const ensurePageSpace = (needed = 10) => {
        if (y + needed <= footerY - 6) return;
        startNewPage();
      };

      drawDocumentHeader();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      doc.setTextColor(102, 102, 102);
      doc.text('RECORDED AUDIT SUMMARY', margin, y);
      y += 6;
      setMarginWordmarkFont();
      doc.setFontSize(20);
      doc.setTextColor(0, 0, 0);
      doc.text('Audit results', margin, y);
      y += 6;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.3);
      doc.setTextColor(77, 77, 77);
      doc.text('Browser-generated record for seller operating review.', margin, y);
      y += 9;
      doc.setFontSize(8);
      doc.text(`Workspace  •  ${activeWorkspaceLabel}`, margin, y);
      doc.text(`Generated ${generatedAt}`, pageWidth - margin, y, { align: 'right' });
      y += 8;

      doc.setFillColor(245, 245, 245);
      doc.roundedRect(margin, y, contentWidth, 25, 2.5, 2.5, 'F');
      const identityColumns = [
        ['AUDIT RECORD', audit.id.slice(0, 8)],
        ['SOURCE', selectedAuditSource],
        ['RECORDED MONTH', recordedMonth],
        ['RESULT', selectedAuditOutcome],
      ];
      const identityWidth = contentWidth / identityColumns.length;
      identityColumns.forEach(([label, value], index) => {
        const x = margin + index * identityWidth;
        if (index > 0) {
          doc.setDrawColor(215, 215, 215);
          doc.line(x, y + 4, x, y + 21);
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.8);
        doc.setTextColor(128, 128, 128);
        doc.text(label, x + 4, y + 8);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.4);
        doc.setTextColor(24, 24, 24);
        const valueLines = doc.splitTextToSize(String(value), identityWidth - 8).slice(0, 2);
        doc.text(valueLines, x + 4, y + 14);
      });
      y += 34;

      drawSectionTitle('Recorded audit facts', 'Audit record');
      const auditDetails = [
        ['Run started', formatAuditDate(audit.started_at || audit.created_at)],
        ['Run completed', formatAuditDate(audit.completed_at, 'Not completed')],
        ['Coverage', selectedAuditCoverage],
        ['Records reviewed', recordsReviewed],
        ['Sources reviewed', recordedList(summary.sources_reviewed, 'Not recorded')],
        ['Unavailable sources', recordedList(summary.sources_unavailable, 'None recorded')],
      ];
      const detailRowHeight = 10;
      auditDetails.forEach(([label, value], index) => {
        ensurePageSpace(detailRowHeight);
        if (index % 2 === 0) {
          doc.setFillColor(249, 249, 249);
          doc.roundedRect(margin, y - 4.3, contentWidth, detailRowHeight, 1.5, 1.5, 'F');
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(77, 77, 77);
        doc.text(label, margin + 4, y + 1.8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(24, 24, 24);
        doc.text(doc.splitTextToSize(String(value), 82).slice(0, 2), margin + 62, y + 1.8);
        y += detailRowHeight;
      });
      y += 7;

      ensurePageSpace(42);
      drawSectionTitle('Potential opportunity scope', 'Recorded analysis');
      const metrics = [
        ['Potential recovery scope', potentialScope],
        ['Potential opportunities', potentialOpportunities],
        ['Evidence ready', evidenceReady],
        ['Evidence required', evidenceRequired],
      ];
      const metricWidth = (contentWidth - 4) / 2;
      metrics.forEach(([label, value], index) => {
        const column = index % 2;
        const row = Math.floor(index / 2);
        const x = margin + column * (metricWidth + 4);
        const metricY = y + row * 22;
        doc.setFillColor(250, 250, 250);
        doc.setDrawColor(215, 215, 215);
        doc.roundedRect(x, metricY, metricWidth, 18, 2.5, 2.5, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.3);
        doc.setTextColor(77, 77, 77);
        doc.text(label.toUpperCase(), x + 4, metricY + 6);
        doc.setFontSize(13);
        doc.setTextColor(24, 24, 24);
        doc.text(value, x + 4, metricY + 13.2);
      });
      y += 51;

      if (findings.length) {
        ensurePageSpace(22);
        drawSectionTitle('Potential opportunity summaries', 'Recorded findings');
        findings.slice(0, 10).forEach((finding, index) => {
          const findingTitle = readableCategory(finding.category);
          const findingValue = formatMoney(Number(finding.estimated_value || 0));
          const descriptionLines = doc.splitTextToSize('Potential scope identified for review. Evidence and seller approval may still be required before any filing action.', contentWidth - 48);
          const cardHeight = Math.max(19, 11 + descriptionLines.length * 3.8);
          ensurePageSpace(cardHeight + 3);
          doc.setFillColor(250, 250, 250);
          doc.setDrawColor(215, 215, 215);
          doc.roundedRect(margin, y, contentWidth, cardHeight, 2.5, 2.5, 'FD');
          doc.setFillColor(24, 24, 24);
          doc.roundedRect(margin + 4, y + 4, 7, 7, 1.5, 1.5, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(7.5);
          doc.setTextColor(255, 255, 255);
          doc.text(String(index + 1), margin + 7.5, y + 8.7, { align: 'center' });
          doc.setTextColor(24, 24, 24);
          doc.setFontSize(9.4);
          doc.text(findingTitle, margin + 15, y + 8);
          doc.setFontSize(10.5);
          doc.text(findingValue, pageWidth - margin - 4, y + 8, { align: 'right' });
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.8);
          doc.setTextColor(77, 77, 77);
          doc.text(descriptionLines, margin + 15, y + 14);
          y += cardHeight + 4;
        });
        y += 3;
      }

      const recordedActions = Array.isArray(summary.recommended_next_actions) && summary.recommended_next_actions.length
        ? summary.recommended_next_actions
        : ['Review the recorded audit scope before deciding what happens next.'];
      ensurePageSpace(26);
      drawSectionTitle('Recorded next actions', 'Seller review');
      recordedActions.forEach((action: string, index: number) => {
        const actionLines = doc.splitTextToSize(String(action), contentWidth - 18);
        const actionHeight = Math.max(11, 6 + actionLines.length * 3.8);
        ensurePageSpace(actionHeight + 2);
        doc.setFillColor(245, 245, 245);
        doc.roundedRect(margin, y, contentWidth, actionHeight, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(24, 24, 24);
        doc.text(String(index + 1).padStart(2, '0'), margin + 4, y + 7.2);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(24, 24, 24);
        doc.text(actionLines, margin + 14, y + 7.2);
        y += actionHeight + 3;
      });

      const boundaryCopy = `${exportData.disclaimer || 'Estimated values are not guaranteed recoveries.'} This browser-generated record is for management and operational review only. It is not proof, filing authorization, reimbursement eligibility, payment confirmation, or closure.`;
      const boundaryLines = doc.splitTextToSize(boundaryCopy, contentWidth - 12);
      const boundaryHeight = Math.max(24, 10 + boundaryLines.length * 3.8);
      ensurePageSpace(boundaryHeight + 4);
      y += 3;
      doc.setFillColor(246, 246, 246);
      doc.setDrawColor(168, 168, 168);
      doc.roundedRect(margin, y, contentWidth, boundaryHeight, 2.5, 2.5, 'FD');
      doc.setFillColor(24, 24, 24);
      doc.roundedRect(margin, y, 2.5, boundaryHeight, 1, 1, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(24, 24, 24);
      doc.text('REVIEW BOUNDARY', margin + 7, y + 7);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.8);
      doc.text(boundaryLines, margin + 7, y + 13);

      const pageCount = doc.getNumberOfPages();
      for (let page = 1; page <= pageCount; page += 1) {
        doc.setPage(page);
        doc.setDrawColor(215, 215, 215);
        doc.line(margin, footerY - 4, pageWidth - margin, footerY - 4);
        setMarginWordmarkFont();
        doc.setFontSize(7.5);
        doc.setTextColor(24, 24, 24);
        doc.text('Margin', margin, footerY);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(102, 102, 102);
        doc.text('•  AUDIT RESULTS', margin + 15, footerY);
        doc.text(`AUDIT ${audit.id.slice(0, 8).toUpperCase()}  •  ${page} OF ${pageCount}`, pageWidth - margin, footerY, { align: 'right' });
      }

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
    setAuditHistoryError(null);
    try {
      const freshToken = await ensureFreshAuditAuth();
      const response = await api.getAuditHistory(freshToken);
      if (response.ok && response.data?.audits) {
        setAuditHistory(response.data.audits);
        return;
      }
      setAuditHistoryError('Audit history could not be loaded. The audit shown on this page has not changed. Retry in a moment.');
    } catch {
      setAuditHistoryError('Audit history could not be loaded. The audit shown on this page has not changed. Retry in a moment.');
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

  const loadAuditActivity = async () => {
    if (!audit?.id) return;
    setIsAuditLogLoading(true);
    setAuditLogError(null);
    try {
      const freshToken = await ensureFreshAuditAuth();
      const response = await api.getAuditActivity(audit.id, freshToken);
      if (response.ok && response.data?.events) {
        setAuditLogEvents(response.data.events);
        return;
      }
      setAuditLogError('Audit lifecycle could not be loaded for this workspace. Retry in a moment.');
    } catch {
      setAuditLogError('Audit lifecycle could not be loaded for this workspace. Retry in a moment.');
    } finally {
      setIsAuditLogLoading(false);
    }
  };

  const openAuditLog = async () => {
    setIsAuditLogOpen(true);
    trackEvent('audit_log_opened', { source_page: '/audit', audit_id: audit?.id || null });
    await loadAuditActivity();
  };

  const openScheduleDialog = async () => {
    setIsScheduleDialogOpen(true);
    setScheduleLoadError(null);
    setScheduleOperating(null);
    setAmazonConnected(null);
    trackEvent('audit_schedule_opened', { source_page: '/audit' });
    try {
      const freshToken = await ensureFreshAuditAuth();
      const response = await api.getAuditSchedule(freshToken);
      if (!response.ok || !response.data) {
        throw new Error('schedule_load_failed');
      }

      const execution = response.data.execution || null;
      setScheduleEntitled(Boolean(response.data.entitlement?.entitled));
      setScheduleExecution(execution);
      setScheduleOperating(response.data.operating || null);
      setAmazonConnected(Boolean(response.data.amazon?.connected));
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
        setWeeklyAuditEnabled(response.data.schedule.cadence !== 'off' && !response.data.schedule.is_paused && Boolean(execution?.available));
      }
    } catch {
      setScheduleEntitled(false);
      setScheduleExecution(null);
      setScheduleOperating(null);
      setAmazonConnected(null);
      setAuditSchedule(null);
      setWeeklyAuditEnabled(false);
      setScheduleLoadError('Schedule status could not be loaded for this workspace. No schedule change can be made until it is available.');
    }
  };

  const saveSchedule = async (override?: Partial<typeof scheduleForm>) => {
    setIsScheduleSaving(true);
    const nextForm = { ...scheduleForm, ...override };
    try {
      const freshToken = await ensureFreshAuditAuth();
      const response = await api.saveAuditSchedule(nextForm, freshToken);
      if (!response.ok || !response.data?.success) throw new Error(response.error || 'Schedule unavailable');
      setAuditSchedule(response.data.schedule);
      setScheduleEntitled(Boolean(response.data.entitlement?.entitled));
      setScheduleExecution(response.data.execution || null);
      setScheduleOperating(response.data.operating || null);
      setAmazonConnected(Boolean(response.data.amazon?.connected));
      setWeeklyAuditEnabled(response.data.schedule.cadence !== 'off' && !response.data.schedule.is_paused && Boolean(response.data.execution?.available));
      trackEvent(nextForm.cadence === 'off' ? 'audit_schedule_disabled' : nextForm.is_paused ? 'audit_schedule_paused' : 'audit_schedule_saved', {
        source_page: '/audit',
        cadence: nextForm.cadence,
      });
      toast({ description: 'Audit schedule updated.' });
    } catch (scheduleError: unknown) {
      setError(getErrorMessage(scheduleError, 'Margin could not update this audit schedule.'));
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

        const requestedAuditId = new URLSearchParams(location.search).get('auditId');
        if (requestedAuditId) {
          const response = await api.getAudit(requestedAuditId, freshToken);
          if (response.ok && response.data?.audit) {
            setAudit(response.data.audit);
            const storedTenantSlug = localStorage.getItem('active_tenant_slug');
            if (storedTenantSlug) setTenantSlug(storedTenantSlug);
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
  }, [isAuthenticated, isClerkLoaded, isClerkSignedIn, clerkUserId, location.search]);

  useEffect(() => {
    if (!isAuthenticated || autoRunAfterOAuthRef.current) return;
    const query = new URLSearchParams(location.search);
    if (query.get('amazon_connected') !== '1') return;
    if (!audit?.id || !tenantSlug) return;
    if (audit.status === 'syncing' || audit.status === 'detecting' || audit.status === 'completed' || audit.status === 'activated') return;

    autoRunAfterOAuthRef.current = true;
    void runAuditForAudit(audit);
  }, [audit, isAuthenticated, location.search, tenantSlug]);

  const startAccountStep = async (sourceType: 'sp_api' | 'csv_upload' = 'sp_api') => {
    if (isBusy) return;
    setIsBusy(true);
    trackEvent(ANALYTICS_EVENTS.auditStarted, {
      cta_location: 'audit_public_hero',
      cta_text: 'Start Free Audit',
    });
    trackEvent(ANALYTICS_EVENTS.auditAccountStepStarted, {
      cta_location: 'audit_public_hero',
      destination: '/login',
    });
    try {
      const res = await api.createAuditIntent(sourceType);
      if (res.ok && res.data?.success && res.data?.intent?.id) {
        navigate(`/login?auditIntentId=${res.data.intent.id}&mode=signup`);
        return;
      }
    } catch (e) {
      console.error('Failed to create audit intent:', e);
    }
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
      value: 1799,
      currency: 'ZAR',
    });
    trackEvent(ANALYTICS_EVENTS.checkoutStarted, {
      offer: 'recovery_workspace',
      value: 1799,
      currency: 'ZAR',
      payment_provider: 'wise_subscription',
    });
    trackEvent(ANALYTICS_EVENTS.subscriptionCheckoutStarted, {
      offer: 'recovery_workspace',
      value: 1799,
      currency: 'ZAR',
    });
    trackEvent('recovery_workspace_checkout_started', {
      source_page: '/audit',
      audit_id: audit?.id || null,
      audit_outcome: teaser.finalStatus || 'unknown',
      findings_count: teaser.findingsCount,
      value: 1799,
      currency: 'ZAR',
    });

    const workspaceSlug = tenant?.slug || tenantSlug;
    const response = await api.initializeRecoveryWorkspaceSubscription(audit.id, workspaceSlug || undefined);
    setIsBusy(false);

    if (!response.ok || !response.data?.success) {
      if (response.data?.code === 'workspace_not_eligible') {
        setIsActivationSheetOpen(false);
        setError(response.data.message || 'This audit does not qualify for Recovery Workspace checkout.');
        return;
      }

      setError(response.error || response.data?.message || 'Margin could not open subscription checkout yet.');
      return;
    }

    if (response.data.already_entitled && response.data.entitlement?.entitled && workspaceSlug) {
      clearPendingAudit();
      navigate(`/app/${workspaceSlug}/dashboard`);
      return;
    }

    if (response.data.entitlement?.entitled && workspaceSlug) {
      clearPendingAudit();
      navigate(`/app/${workspaceSlug}/dashboard`);
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
        heading: 'Review the Recovery Workspace.',
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
    detecting: 'Margin is reviewing the synced Amazon activity for potential recovery opportunities.',
    completed: teaser.message,
    failed: getSafeAuditStatusMessage(
      audit?.summary?.message,
      'The audit could not finish automatically. Retry after the Amazon connection settles.'
    ),
  } satisfies Record<AuditStep, string>;

  const primaryAction =
    step === 'public' ? (
		      <Button onClick={startAccountStep} className="h-10 w-full rounded-[6px] bg-[#0B74DE] px-6 text-[13px] font-medium text-white shadow-none transition-colors hover:bg-[#075EA8] sm:w-auto">
		        {isAuthenticated ? 'Continue to Amazon' : 'Connect Amazon'}
		      </Button>
	    ) : step === 'connect' ? (
	      <Button onClick={connectAmazon} disabled={isBusy} className="h-10 w-full rounded-[6px] bg-[#0B74DE] px-6 text-[13px] font-medium text-white shadow-none transition-colors hover:bg-[#075EA8] sm:w-auto">
		        {isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
		        {isAuthenticated ? 'Continue to Amazon' : 'Connect Amazon'}
		      </Button>
	    ) : step === 'completed' ? (
	      null
	    ) : (
	      <Button onClick={runAudit} disabled={isBusy} className="h-10 w-full rounded-[6px] bg-[#0B74DE] px-6 text-[13px] font-medium text-white shadow-none transition-colors hover:bg-[#075EA8] sm:w-auto">
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
    <div className="min-h-screen overflow-x-hidden bg-[#FBFAF7] font-sans text-[#191B20] selection:bg-[#E9ECFF] selection:text-[#191B20]">
      <header className="sticky top-0 z-50 border-b border-[#E8E7E1] bg-[#FBFAF7]/95 backdrop-blur">
        <div className="mx-auto flex min-h-14 max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link to="/" title="Margin home" className="inline-flex shrink-0 items-center gap-2.5 rounded-md px-1.5 py-2 outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[#5165C7] focus-visible:ring-offset-2">
              <img src="/logoimagetwo.png" alt="Margin" width="18" height="18" className="h-[18px] w-auto shrink-0 object-contain" />
              <span className="font-merriweather text-[18px] font-semibold tracking-tight text-[#191B20]">Margin</span>
            </Link>
            <div className="hidden min-w-0 border-l border-[#E8E7E1] pl-3 sm:block">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#777A82]">Audit workspace</p>
              <p className="max-w-[250px] truncate text-[12px] font-medium text-[#595E68]">{selectedAuditSelectorLabel}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <Link
              to={tenant ? '/app/' + tenant.slug + '/data-upload?returnTo=audit' + (audit?.id ? '&auditId=' + encodeURIComponent(audit.id) : '') : '/data-upload?returnTo=audit' + (audit?.id ? '&auditId=' + encodeURIComponent(audit.id) : '')}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-md px-2.5 text-[12px] font-medium text-[#595E68] outline-none transition-colors hover:bg-[#F4F3ED] hover:text-[#191B20] focus-visible:ring-2 focus-visible:ring-[#5165C7] focus-visible:ring-offset-2 sm:px-3 sm:text-[13px]"
              title="Use Amazon reports"
            >
              <FilePlus2 className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Use Amazon reports</span>
              <span className="sm:hidden">Reports</span>
            </Link>
            <button type="button" onClick={() => setIsExportDialogOpen(true)} className="inline-flex h-10 items-center gap-1.5 rounded-md border border-[#D7D7D1] bg-white px-2.5 text-[12px] font-medium text-[#191B20] outline-none transition-colors hover:bg-[#F4F3ED] focus-visible:ring-2 focus-visible:ring-[#5165C7] focus-visible:ring-offset-2 sm:px-3 sm:text-[13px]" title="Export summary">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export summary</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start">
          <section className="min-w-0 rounded-[14px] border border-[#E8E7E1] bg-white p-5 shadow-[0_1px_2px_rgba(25,27,32,0.05)] sm:p-8" aria-labelledby="audit-workspace-title">
            <div className="border-b border-[#E8E7E1] pb-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="max-w-2xl">
                  <div className="mb-3 flex items-center gap-2 text-[12px] font-semibold text-[#595E68]">
                    <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#F4F3ED] text-[#191B20]"><ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /></span>
                    <span>{audit ? (selectedAuditIsLatest ? 'LATEST AUDIT RECORD' : 'SELECTED AUDIT RECORD') : 'RECOVERY AUDIT'}</span>
                  </div>
                  <h1 id="audit-workspace-title" className="font-lora text-[30px] font-normal leading-[1.08] tracking-[-0.02em] text-[#191B20] sm:text-[36px]">
                    {audit ? (selectedAuditIsLatest ? 'Your latest audit' : 'Your selected audit') : 'Your audit workspace'}
                  </h1>
                  <p className="mt-3 max-w-xl text-[15px] leading-6 text-[#595E68]">
                    {audit ? selectedAuditOutcome + '. ' + selectedAuditCoverage + '. Review what Margin examined before deciding what happens next.' : isAuthenticated ? 'Start an audit when this workspace is ready. Margin will keep the connection, coverage, result, and safe next step together here.' : 'Connect Amazon or use supported Amazon reports to begin a recovery audit.'}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">{primaryAction}<button type="button" onClick={() => { setIsScopeDialogOpen(true); trackEvent('audit_scope_opened', { source_page: '/audit', audit_id: audit?.id || null }); }} className="inline-flex h-10 items-center rounded-[10px] border border-[#D7D7D1] bg-white px-3 text-[13px] font-medium text-[#191B20] outline-none transition-colors hover:bg-[#F4F3ED] focus-visible:ring-2 focus-visible:ring-[#5165C7] focus-visible:ring-offset-2">View audit scope</button></div>
              </div>
            </div>

            {isAuthenticated ? (
              <dl className="grid border-b border-[#E8E7E1] text-left sm:grid-cols-2 lg:grid-cols-4">
                <div className="border-b border-[#E8E7E1] py-3.5 sm:border-r sm:pr-4 lg:border-b-0"><dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#777A82]">Workspace</dt><dd className="mt-1 truncate text-[13px] font-medium text-[#191B20]">{activeWorkspaceLabel}</dd></div>
                <div className="border-b border-[#E8E7E1] py-3.5 sm:pl-4 lg:border-b-0 lg:border-r lg:pr-4"><dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#777A82]">Audit record</dt><dd className="mt-1 text-[13px] font-medium text-[#191B20]">{audit ? (selectedAuditIsLatest ? 'Latest audit' : 'From audit history') : 'No audit yet'}</dd></div>
                <div className="border-b border-[#E8E7E1] py-3.5 sm:border-b-0 sm:border-r sm:pr-4 lg:pl-4"><dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#777A82]">Source</dt><dd className="mt-1 text-[13px] font-medium text-[#191B20]">{audit ? selectedAuditSource : 'Not recorded'}</dd></div>
                <div className="py-3.5 sm:pl-4"><dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#777A82]">Recorded run</dt><dd className="mt-1 text-[13px] font-medium text-[#191B20]">{audit ? selectedAuditRunDate : 'Not recorded'}</dd></div>
              </dl>
            ) : <p className="mt-5 text-[13px] font-medium text-[#595E68]">Read-only access. Margin examines the Amazon records needed for your audit.</p>}

            {needsAdditionalAmazonData ? <section className="mt-6 rounded-[10px] border border-[#D7D7D1] bg-[#F4F3ED] p-4 sm:p-5"><div className="flex items-start gap-3"><FilePlus2 className="mt-0.5 h-5 w-5 shrink-0 text-[#191B20]" aria-hidden="true" /><div><h2 className="text-[15px] font-semibold text-[#191B20]">Additional Amazon data required</h2><p className="mt-1 text-[13px] leading-5 text-[#595E68]">{teaser.sourcesUnavailable?.length ? 'Margin needs ' + teaser.sourcesUnavailable.slice(0, 2).join(' or ') + ' to complete this examination.' : 'Margin needs additional Amazon reports to complete this examination.'}</p><Link to={tenant ? '/app/' + tenant.slug + '/data-upload?returnTo=audit' + (audit?.id ? '&auditId=' + encodeURIComponent(audit.id) : '') : '/data-upload?returnTo=audit' + (audit?.id ? '&auditId=' + encodeURIComponent(audit.id) : '')} className="mt-3 inline-flex min-h-10 items-center gap-1.5 text-[13px] font-medium text-[#3F51A8] outline-none hover:text-[#31418D] focus-visible:ring-2 focus-visible:ring-[#5165C7] focus-visible:ring-offset-2">Use Amazon reports <ArrowRight className="h-3.5 w-3.5" /></Link></div></div></section> : null}

            {step !== 'completed' ? (
              <section className="mt-6" aria-labelledby="audit-understanding-title">
                <div className="rounded-[10px] border border-[#D7D7D1] bg-[#F4F3ED] p-4 sm:p-5">
                  <div className="border-b border-[#D7D7D1] pb-4"><p className="text-[12px] font-semibold text-[#595E68]">Understanding your audit</p><h2 id="audit-understanding-title" className="mt-2 text-[20px] font-semibold leading-7 tracking-[-0.02em] text-[#191B20]">Margin reviews available Amazon records and makes the recorded scope legible before any recovery decision.</h2></div>
                  <div className="grid gap-4 pt-4 sm:grid-cols-3 sm:gap-0">
                    <div className="border-b border-[#D7D7D1] pb-4 sm:border-b-0 sm:border-r sm:pr-4"><div className="mb-3 flex h-8 items-center"><img src="/amazon-logo-transparent-circle.png" alt="Amazon" className="h-7 w-7 object-contain" /></div><h3 className="text-[14px] font-semibold text-[#191B20]">Amazon account data</h3><p className="mt-1 text-[13px] leading-5 text-[#595E68]">Read-only Amazon records available to this audit.</p></div>
                    <div className="border-b border-[#D7D7D1] py-4 sm:border-b-0 sm:border-r sm:px-4 sm:py-0"><div className="mb-3 flex h-8 items-center gap-2"><img src="/gmailicon.png" alt="Gmail" className="h-4 w-4 object-contain" /><img src="/slack-icon-2019.png" alt="Slack" className="h-4 w-4 object-contain" /><img src="/gd.png" alt="Google Drive" className="h-4 w-4 object-contain" /></div><h3 className="text-[14px] font-semibold text-[#191B20]">Evidence records</h3><p className="mt-1 text-[13px] leading-5 text-[#595E68]">Documentation remains separate from audit results and is reviewed in its own record.</p></div>
                    <div className="pt-4 sm:pl-4 sm:pt-0"><div className="mb-3 flex h-8 items-center"><ArrowRightLeft className="h-5 w-5 text-[#595E68]" /></div><h3 className="text-[14px] font-semibold text-[#191B20]">Reconciliation checks</h3><p className="mt-1 text-[13px] leading-5 text-[#595E68]">Potential differences need review before any seller-controlled next action.</p></div>
                  </div>
                  <p className="mt-4 border-t border-[#D7D7D1] pt-3 text-[12px] font-medium text-[#777A82]">Read-only data review · potential opportunities · seller approval before any filing</p>
                </div>
              </section>
            ) : null}

            {step === 'completed' ? (
              <section className="mt-6 rounded-[10px] border border-[#D7D7D1] bg-[#F4F3ED] p-4 sm:p-5" aria-labelledby="recorded-review-title">
                <div className="flex flex-col gap-4 border-b border-[#D7D7D1] pb-4 sm:flex-row sm:items-start sm:justify-between"><div><div className="flex items-center gap-2 text-[12px] font-semibold text-[#595E68]"><span className="flex h-6 w-6 items-center justify-center rounded-md bg-white text-[#191B20]"><Database className="h-3.5 w-3.5" aria-hidden="true" /></span><span>RECORDED AUDIT REVIEW</span></div><h2 id="recorded-review-title" className="mt-3 font-lora text-[26px] font-normal leading-tight tracking-[-0.02em] text-[#191B20]">Your review scope</h2><p className="mt-2 max-w-xl text-[13px] leading-5 text-[#595E68]">These are recorded potential findings from the selected audit. Review coverage and evidence before deciding on a seller-controlled next step.</p></div><span className="self-start rounded-full border border-[#D7D7D1] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#595E68]">{isZeroRecordLimitedAudit ? 'Limited coverage' : 'Ready for review'}</span></div>
                <dl className="mt-4 grid overflow-hidden rounded-[10px] border border-[#E8E7E1] bg-white sm:grid-cols-3"><div className="border-b border-[#E8E7E1] p-4 sm:border-b-0 sm:border-r"><dt className="text-[11px] font-semibold text-[#777A82]">Potential recovery scope</dt><dd className="mt-1 text-[24px] font-semibold tracking-[-0.03em] text-[#191B20] tabular-nums">{isZeroRecordLimitedAudit ? '$0' : formatMoney(teaser.scopeValue)}</dd><p className="mt-1 text-[12px] text-[#595E68]">Potential—not a confirmed recovery.</p></div><div className="border-b border-[#E8E7E1] p-4 sm:border-b-0 sm:border-r"><dt className="text-[11px] font-semibold text-[#777A82]">Potential opportunities</dt><dd className="mt-1 text-[24px] font-semibold tracking-[-0.03em] text-[#191B20] tabular-nums">{isZeroRecordLimitedAudit ? '0' : teaser.findingsCount}</dd><p className="mt-1 text-[12px] text-[#595E68]">Items that may require review.</p></div><div className="p-4"><dt className="text-[11px] font-semibold text-[#777A82]">Evidence ready</dt><dd className="mt-1 text-[24px] font-semibold tracking-[-0.03em] text-[#191B20] tabular-nums">{isZeroRecordLimitedAudit ? '0' : teaser.evidenceReadyCount}</dd><p className="mt-1 text-[12px] text-[#595E68]">Recorded evidence readiness only.</p></div></dl>
                <div className="mt-4 grid gap-5 rounded-[10px] border border-[#E8E7E1] bg-white p-4 sm:p-5 lg:grid-cols-[minmax(0,1fr)_220px]"><div>{teaser.categories.length ? <div className="flex flex-wrap gap-1.5">{teaser.categories.map((category) => <span key={category} className="rounded-full border border-[#E8E7E1] bg-[#FBFAF7] px-2 py-1 text-[11px] font-medium text-[#595E68]">{category}</span>)}</div> : <p className="text-[13px] text-[#595E68]">No category summary was recorded for this audit.</p>}<div className="mt-5 border-t border-[#E8E7E1] pt-4"><p className="text-[12px] font-semibold text-[#191B20]">Coverage details</p><p className="mt-1 text-[13px] leading-5 text-[#595E68]">{teaser.recordsReviewed != null ? Number(teaser.recordsReviewed).toLocaleString() + ' Amazon records were synchronized and reviewed.' : 'Amazon record coverage analysis is in progress.'}{teaser.sourcesReviewed?.length ? ' Primary sources: ' + teaser.sourcesReviewed.join(', ') + '.' : ''}{teaser.sourcesUnavailable?.length ? ' Restricted access: ' + teaser.sourcesUnavailable.join(', ') + '.' : ''}</p></div></div><aside className="border-l-2 border-[#3F51A8] pl-4"><p className="text-[12px] font-semibold text-[#191B20]">Review boundary</p><p className="mt-1 text-[12px] leading-5 text-[#595E68]">The selected audit does not prove a claim, authorize filing, establish reimbursement eligibility, confirm payment, or close a recovery matter.</p><button type="button" onClick={() => { setIsScopeDialogOpen(true); trackEvent('audit_scope_opened', { source_page: '/audit', audit_id: audit?.id || null }); }} className="mt-3 text-[12px] font-semibold text-[#3F51A8] outline-none hover:text-[#31418D] focus-visible:ring-2 focus-visible:ring-[#5165C7]">Inspect recorded scope</button></aside></div>
              </section>
            ) : null}

            {step === 'completed' && (canShowRecoverOnce || canShowWorkspace) ? (
              <section className="mt-6 border-t border-[#E8E7E1] pt-6" aria-labelledby="recovery-choices-title">
                <div className="rounded-[10px] border border-[#D7D7D1] bg-[#F4F3ED] p-4 sm:p-5"><div className="border-b border-[#D7D7D1] pb-4"><p className="text-[12px] font-semibold text-[#595E68]">Recovery choices</p><h2 id="recovery-choices-title" className="mt-2 font-lora text-[26px] font-normal leading-tight tracking-[-0.02em] text-[#191B20]">Decide what should happen after this audit.</h2><p className="mt-2 max-w-2xl text-[13px] leading-5 text-[#595E68]">Margin can present a fixed recovery route when eligible or help you review the continuous Recovery Workspace. Each option begins with the recorded audit—not with an assumption of reimbursement.</p></div><dl className="mt-4 grid gap-4 border-b border-[#D7D7D1] pb-4 sm:grid-cols-2"><div><dt className="text-[11px] font-semibold text-[#777A82]">Audit duration</dt><dd className="mt-1 text-[15px] font-semibold text-[#191B20] tabular-nums">{formatDuration(audit?.completed_at, audit?.started_at)}</dd></div><div><dt className="text-[11px] font-semibold text-[#777A82]">Potential recovery scope</dt><dd className="mt-1 text-[15px] font-semibold text-[#191B20] tabular-nums">{formatMoney(teaser.scopeValue)}</dd></div></dl><div className="mt-4 grid gap-3">{canShowRecoverOnce ? <div className="rounded-[10px] border border-[#E8E7E1] bg-white p-4"><p className="text-[11px] font-semibold text-[#777A82]">Fixed recovery route</p><h3 className="mt-1 text-[17px] font-semibold tracking-[-0.02em] text-[#191B20]">{isRecoverOnceQuoteLoading ? 'Preparing a fixed quote' : recoverOnceQuote?.status === 'available' || recoverOnceQuote?.status === 'accepted' ? recoverOnceQuote.display_amount + ' fixed' : 'Recover once'}</h3><p className="mt-2 text-[13px] leading-5 text-[#595E68]">{recoverOnceQuote?.status === 'manual_review_required' ? 'This recorded scope requires manual review before a fixed quote can be finalized.' : 'Review the eligible one-time recovery route for the potential opportunities identified here.'}</p>{recoverOnceQuote?.status === 'available' || recoverOnceQuote?.status === 'accepted' ? <Button variant="outline" onClick={startRecoverOnceCheckout} disabled={isBusy || isRecoverOnceQuoteLoading} className="mt-4 h-10 rounded-[10px] border-[#D7D7D1] bg-white text-[13px] font-medium text-[#191B20] hover:bg-[#F4F3ED]">{isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Review fixed recovery</Button> : <Button variant="outline" disabled className="mt-4 h-10 rounded-[10px] border-[#E8E7E1] bg-[#F4F3ED] text-[13px] font-medium text-[#777A82]">{isRecoverOnceQuoteLoading ? 'Preparing quote' : 'Quote unavailable'}</Button>}</div> : null}{canShowWorkspace ? <div className="rounded-[10px] border border-[#E8E7E1] bg-white p-4"><p className="text-[11px] font-semibold text-[#777A82]">Recovery Workspace</p><h3 className="mt-1 text-[17px] font-semibold tracking-[-0.02em] text-[#191B20]">Keep future activity in view.</h3><p className="mt-2 text-[13px] leading-5 text-[#595E68]">Review how the ongoing workspace coordinates scheduled review, evidence readiness, and recorded recovery work before checkout.</p><Button onClick={openActivationSheet} disabled={isBusy} className="mt-4 h-10 rounded-[10px] bg-[#3F51A8] px-4 text-[13px] font-semibold text-white shadow-none hover:bg-[#31418D]">Review Recovery Workspace <ArrowRight className="ml-2 h-4 w-4" /></Button></div> : null}</div></div>
              </section>
            ) : null}
          </section>

          <aside className="space-y-4 xl:sticky xl:top-20" aria-label="Audit context">
            <section className="rounded-[14px] border border-[#E8E7E1] bg-white p-5"><div className="flex items-center gap-2"><Database className="h-4 w-4 text-[#595E68]" aria-hidden="true" /><h2 className="text-[14px] font-semibold text-[#191B20]">Audit context</h2></div><dl className="mt-4 space-y-3 text-[12px]"><div className="border-b border-[#E8E7E1] pb-3"><dt className="font-medium text-[#777A82]">Workspace</dt><dd className="mt-1 text-[#191B20]">{activeWorkspaceLabel}</dd></div><div className="border-b border-[#E8E7E1] pb-3"><dt className="font-medium text-[#777A82]">Selected audit</dt><dd className="mt-1 leading-5 text-[#191B20]">{selectedAuditSelectorLabel}</dd></div><div className="border-b border-[#E8E7E1] pb-3"><dt className="font-medium text-[#777A82]">Source</dt><dd className="mt-1 text-[#191B20]">{audit ? selectedAuditSource : 'Not recorded'}</dd></div><div><dt className="font-medium text-[#777A82]">Coverage</dt><dd className="mt-1 text-[#191B20]">{selectedAuditCoverage}</dd></div></dl></section>
            <section className="rounded-[14px] border border-[#E8E7E1] bg-white p-5"><div className="flex items-center gap-2"><FileText className="h-4 w-4 text-[#595E68]" aria-hidden="true" /><h2 className="text-[14px] font-semibold text-[#191B20]">Audit controls</h2></div><div className="mt-4 divide-y divide-[#E8E7E1] border-y border-[#E8E7E1]"><button type="button" onClick={() => { setIsPeriodSelectorOpen(true); trackEvent('audit_period_selector_opened', { source_page: '/audit' }); }} className="flex min-h-11 w-full items-center gap-3 py-3 text-left outline-none transition-colors hover:text-[#3F51A8] focus-visible:ring-2 focus-visible:ring-[#5165C7]"><Calendar className="h-4 w-4 shrink-0 text-[#595E68]" /><span className="min-w-0 flex-1"><span className="block text-[13px] font-medium text-[#191B20]">Audit history</span><span className="mt-0.5 block text-[11px] text-[#777A82]">Select a recorded audit</span></span><ArrowRight className="h-3.5 w-3.5 text-[#777A82]" /></button><button type="button" onClick={openAuditLog} className="flex min-h-11 w-full items-center gap-3 py-3 text-left outline-none transition-colors hover:text-[#3F51A8] focus-visible:ring-2 focus-visible:ring-[#5165C7]"><TerminalSquare className="h-4 w-4 shrink-0 text-[#595E68]" /><span className="min-w-0 flex-1"><span className="block text-[13px] font-medium text-[#191B20]">Audit activity</span><span className="mt-0.5 block text-[11px] text-[#777A82]">Review the lifecycle record</span></span><ArrowRight className="h-3.5 w-3.5 text-[#777A82]" /></button><button type="button" onClick={openScheduleDialog} className="flex min-h-11 w-full items-center gap-3 py-3 text-left outline-none transition-colors hover:text-[#3F51A8] focus-visible:ring-2 focus-visible:ring-[#5165C7]"><CalendarClock className="h-4 w-4 shrink-0 text-[#595E68]" /><span className="min-w-0 flex-1"><span className="block text-[13px] font-medium text-[#191B20]">Schedules</span><span className="mt-0.5 block text-[11px] text-[#777A82]">{weeklyAuditEnabled ? 'Review active preference' : 'Set a workspace preference'}</span></span><ArrowRight className="h-3.5 w-3.5 text-[#777A82]" /></button></div><button type="button" onClick={openShareDialog} className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-[10px] px-2 text-[13px] font-medium text-[#595E68] outline-none transition-colors hover:bg-[#F4F3ED] hover:text-[#191B20] focus-visible:ring-2 focus-visible:ring-[#5165C7] focus-visible:ring-offset-2"><HeartHandshake className="h-4 w-4" />Invite a seller</button></section>
            <section className="rounded-[14px] border border-[#E8E7E1] bg-white p-5"><h2 className="text-[14px] font-semibold text-[#191B20]">Audit boundary</h2><p className="mt-2 text-[12px] leading-5 text-[#595E68]">Audit records identify potential scope from available data. Filing, evidence use, and recovery action remain seller-controlled and evidence-dependent.</p></section>
          </aside>
        </div>
      </main>

      <footer className="border-t border-[#E8E7E1] bg-white px-4 py-6 text-center sm:px-6"><p className="text-[12px] text-[#777A82]">Margin Agents can make mistakes. Check important information before relying on it.</p></footer>

      <Sheet open={isActivationSheetOpen} onOpenChange={setIsActivationSheetOpen}>
        <SheetContent side="right" className="flex h-full w-full flex-col overflow-y-auto border-l border-[#D7D7D1] bg-white p-0 text-[#191B20] shadow-[0_16px_48px_rgba(25,27,32,0.18)] sm:max-w-[500px] max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-auto max-sm:h-[90vh] max-sm:w-full max-sm:rounded-t-[18px] max-sm:border-l-0 max-sm:border-t">
          <SheetHeader className="border-b border-[#E8E7E1] px-5 pb-5 pt-6 pr-14 text-left sm:px-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#777A82]">Recovery Workspace</p>
            <SheetTitle className="mt-2 max-w-sm font-lora text-[29px] leading-[1.08] tracking-[-0.025em] text-[#191B20]" style={{ fontWeight: 400 }}>Continue from the audit record—not from an assumption.</SheetTitle>
            <SheetDescription className="mt-3 max-w-sm text-[13px] leading-5 text-[#595E68]">Review what the ongoing workspace can coordinate after this audit, what requires seller approval, and what the audit still cannot establish.</SheetDescription>
          </SheetHeader>

          <div className="flex-1 px-5 py-5 sm:px-7 sm:py-6">
            <section aria-label="Selected audit context" className="border border-[#D7D7D1] bg-[#FBFAF7] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#777A82]">Selected audit</p>
              <div className="mt-3 grid gap-3 text-[12px] sm:grid-cols-2">
                <div><p className="text-[#777A82]">Recorded result</p><p className="mt-1 font-semibold text-[#191B20]">{auditSheetSummary.label}</p></div>
                <div><p className="text-[#777A82]">Potential scope</p><p className="mt-1 font-semibold text-[#191B20] tabular-nums">{auditSheetSummary.metric}</p></div>
                <div><p className="text-[#777A82]">Audit record</p><p className="mt-1 font-semibold text-[#191B20]">{selectedAuditIsLatest ? 'Latest audit' : 'Selected history'}</p></div>
                <div><p className="text-[#777A82]">Monitoring</p><p className="mt-1 font-semibold text-[#191B20]">Not active</p></div>
              </div>
            </section>

            <section className="mt-7">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#777A82]">If you activate</p>
              <div className="mt-3 divide-y divide-[#E8E7E1] border-y border-[#E8E7E1]">
                {[
                  ['Scheduled audit review', 'A workspace-owned schedule can be configured when the recorded operating state and entitlement allow it. A schedule remains a preference, not a guarantee of execution.'],
                  ['Evidence readiness', 'Margin can keep evidence records and missing documentation visible for review before deadlines. Evidence readiness does not prove a claim or authorize filing.'],
                  ['Recovery record continuity', 'Seller decisions, Amazon responses, and recovery records can remain organized in the workspace as separate operational objects.'],
                  ['Settlement review', 'Recorded payout-related states can be monitored for reconciliation. Monitoring does not confirm payment or closure.'],
                ].map(([title, body]) => <div key={title} className="py-4"><h3 className="text-[14px] font-semibold text-[#191B20]">{title}</h3><p className="mt-1 text-[13px] leading-5 text-[#595E68]">{body}</p></div>)}
              </div>
            </section>

            <section className="mt-7 border-l-2 border-[#191B20] pl-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#777A82]">Seller authority</p>
              <p className="mt-2 text-[13px] leading-5 text-[#595E68]">Nothing is filed with Amazon without seller approval. Recovery Workspace coordination does not establish reimbursement eligibility, confirm payment, or close a recovery matter.</p>
            </section>
          </div>

          <div className="border-t border-[#E8E7E1] bg-[#FBFAF7] px-5 py-5 sm:px-7">
            <div className="flex items-baseline justify-between gap-4"><p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#777A82]">Monthly workspace</p><p className="text-[20px] font-semibold tracking-[-0.03em] text-[#191B20]">R1,799 <span className="text-[12px] font-medium tracking-normal text-[#595E68]">/ month</span></p></div>
            <p className="mt-2 text-[12px] leading-5 text-[#595E68]">Flat fee · 0% recovery commission · cancel anytime · checkout is separate from Amazon authorization.</p>
            <Button onClick={activateAudit} disabled={isBusy} className="mt-5 h-11 w-full rounded-md bg-[#191B20] px-5 text-[13px] font-medium text-white hover:bg-[#33363D]">{isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Continue to secure checkout {!isBusy ? <ArrowRight className="ml-2 h-4 w-4" /> : null}</Button>
            <SheetClose asChild><Button variant="ghost" className="mt-2 h-10 w-full rounded-md text-[13px] font-medium text-[#595E68] hover:bg-white hover:text-[#191B20]">Not now</Button></SheetClose>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={isScopeDialogOpen} onOpenChange={setIsScopeDialogOpen}>
        <DialogContent className="max-h-[min(760px,calc(100vh-32px))] overflow-y-auto rounded-[14px] border-[#D7D7D1] bg-white p-0 text-[#191B20] shadow-[0_16px_48px_rgba(25,27,32,0.18)] sm:max-w-[660px]">
          <DialogHeader className="border-b border-[#E8E7E1] px-5 pb-5 pt-6 sm:px-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#777A82]">Selected audit record</p>
            <DialogTitle className="mt-2 text-[22px] font-semibold tracking-[-0.025em] text-[#191B20]">What Margin examined</DialogTitle>
            <DialogDescription className="mt-2 max-w-xl text-[13px] leading-5 text-[#595E68]">This records the known scope and limits of the selected audit. It does not turn a finding, estimate, or available data into proof, filing authority, reimbursement eligibility, payment, or closure.</DialogDescription>
          </DialogHeader>
          <div className="px-5 py-5 sm:px-7 sm:py-6">
            <dl className="grid border-y border-[#E8E7E1] sm:grid-cols-2">
              <div className="border-b border-[#E8E7E1] py-3 sm:border-r sm:pr-4"><dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#777A82]">Workspace</dt><dd className="mt-1 text-[13px] font-medium text-[#191B20]">{activeWorkspaceLabel}</dd></div>
              <div className="border-b border-[#E8E7E1] py-3 sm:pl-4"><dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#777A82]">Audit selected</dt><dd className="mt-1 text-[13px] font-medium text-[#191B20]">{audit ? (selectedAuditIsLatest ? 'Latest audit' : 'Selected audit from history') : 'No audit selected'}</dd></div>
              <div className="border-b border-[#E8E7E1] py-3 sm:border-b-0 sm:border-r sm:pr-4"><dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#777A82]">Source</dt><dd className="mt-1 text-[13px] font-medium text-[#191B20]">{audit ? selectedAuditSource : 'Not recorded'}</dd></div>
              <div className="py-3 sm:pl-4"><dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#777A82]">Recorded run</dt><dd className="mt-1 text-[13px] font-medium text-[#191B20]">{audit ? selectedAuditRunDate : 'Not recorded'}</dd></div>
            </dl>
            <div className="mt-6 grid gap-6 text-[13px] leading-5 text-[#595E68]">
              <section><p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#777A82]">Coverage recorded for this audit</p><p className="mt-2">{teaser.recordsReviewed != null ? Number(teaser.recordsReviewed).toLocaleString() + ' Amazon record' + (Number(teaser.recordsReviewed) === 1 ? '' : 's') + ' were available for review.' : 'Record count was not recorded for this audit.'}</p><dl className="mt-4 grid gap-3 border-l-2 border-[#D7D7D1] pl-4"><div><dt className="text-[11px] font-semibold text-[#191B20]">Data reviewed</dt><dd className="mt-0.5">{teaser.sourcesReviewed?.length ? teaser.sourcesReviewed.join(', ') : 'Not recorded.'}</dd></div><div><dt className="text-[11px] font-semibold text-[#191B20]">Coverage limits</dt><dd className="mt-0.5">{teaser.sourcesUnavailable?.length ? teaser.sourcesUnavailable.join(', ') + (teaser.sourcesUnavailable.length === 1 ? ' was' : ' were') + ' unavailable.' : 'No unavailable source was recorded.'}</dd></div><div><dt className="text-[11px] font-semibold text-[#191B20]">Recorded audit month</dt><dd className="mt-0.5">{selectedAuditPeriodLabel}. A detailed source date range is not recorded for this audit.</dd></div></dl></section>
              <section className="border-t border-[#E8E7E1] pt-5"><p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#777A82]">Interpretation boundary</p><h3 className="mt-2 text-[14px] font-semibold text-[#191B20]">What Margin can review from available data</h3><p className="mt-1">Margin can examine available Amazon activity for potential reimbursement and reconciliation patterns, including shipments, returns, reimbursements, fees, and settlements when those data sources are present.</p><h3 className="mt-4 text-[14px] font-semibold text-[#191B20]">What this audit cannot establish on its own</h3><p className="mt-1">It does not prove a claim, authorize filing, establish reimbursement eligibility, confirm payment, or close a recovery matter. Any next step remains seller-controlled and evidence-dependent.</p></section>
              <section className="border-l-2 border-[#3F51A8] bg-[#FBFAF7] px-4 py-3"><h3 className="text-[13px] font-semibold text-[#191B20]">What happens next</h3><p className="mt-1">{needsAdditionalAmazonData ? 'Add supported Amazon reports or restore Amazon access to improve coverage, then review the resulting audit.' : audit?.status === 'completed' ? 'Review the selected audit result and any potential recovery opportunities before deciding whether to take a seller-controlled next step.' : 'Use the recorded audit state above to connect Amazon, run the audit, or return after Margin finishes the current work.'}</p></section>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPeriodSelectorOpen} onOpenChange={setIsPeriodSelectorOpen}>
        <DialogContent className="max-h-[min(760px,calc(100vh-32px))] overflow-y-auto rounded-[14px] border-[#D7D7D1] bg-white p-0 text-[#191B20] shadow-[0_16px_48px_rgba(25,27,32,0.18)] sm:max-w-[650px]">
          <DialogHeader className="border-b border-[#E8E7E1] px-5 pb-5 pt-6 sm:px-7">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#777A82]">Audit records</p>
            <DialogTitle className="mt-2 text-[22px] font-semibold tracking-[-0.025em] text-[#191B20]">Audit history</DialogTitle>
            <DialogDescription className="mt-2 max-w-xl text-[13px] leading-5 text-[#595E68]">Select an actual audit record from this workspace. Run date, source, and coverage are shown only when recorded; a detailed audit period may not be available for older audits.</DialogDescription>
          </DialogHeader>
          <div className="px-5 py-5 sm:px-7 sm:py-6">
            <label className="relative block"><span className="sr-only">Search audit history</span><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#777A82]" /><input value={auditHistoryQuery} onChange={(event) => setAuditHistoryQuery(event.target.value)} placeholder="Search audit date, source, or status" className="h-10 w-full rounded-md border border-[#D7D7D1] bg-white pl-9 pr-3 text-[13px] text-[#191B20] outline-none transition-colors placeholder:text-[#777A82] focus:border-[#5165C7] focus:ring-2 focus:ring-[#5165C7]/20" /></label>
            <div className="mt-5 max-h-[360px] overflow-y-auto border-y border-[#E8E7E1]">
              {isHistoryLoading ? <div className="flex items-center gap-2 py-7 text-[13px] text-[#595E68]"><Loader2 className="h-4 w-4 animate-spin" /> Loading audit history</div> : auditHistoryError ? <div className="border-l-2 border-[#9A5A03] bg-[#FBFAF7] px-4 py-4 text-[13px] leading-5 text-[#595E68]" role="alert"><p>{auditHistoryError}</p><Button variant="outline" size="sm" onClick={() => void loadAuditHistory()} className="mt-3 h-8 border-[#D7D7D1] bg-white px-3 text-[12px] font-medium text-[#191B20] hover:bg-[#F4F3ED]">Retry history</Button></div> : auditHistory.length ? <div>{auditHistory.filter((item) => { const q = auditHistoryQuery.trim().toLowerCase(); return !q || [item.label, item.month, item.status, item.finalStatus].join(' ').toLowerCase().includes(q); }).map((item) => <button key={item.id} type="button" onClick={() => void selectAuditPeriod(item)} aria-current={audit?.id === item.id ? 'true' : undefined} className={'flex w-full items-start justify-between gap-4 border-b border-[#E8E7E1] px-1 py-4 text-left last:border-b-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5165C7] focus-visible:ring-inset ' + (audit?.id === item.id ? 'bg-[#FBFAF7]' : 'hover:bg-[#FBFAF7]')}><span className="min-w-0"><span className="block text-[13px] font-semibold text-[#191B20]">{item.isLatest ? 'Latest audit' : 'Audit record'} · {formatAuditDate(item.completed_at || item.started_at || item.created_at)}</span><span className="mt-1 block text-[12px] leading-5 text-[#595E68]">{sellerAuditOutcome(item.status, item.finalStatus)} · {auditSourceLabel(item.sourceType)} · {item.recordsReviewed != null ? Number(item.recordsReviewed).toLocaleString() + ' records reviewed' : 'Record count not recorded'}</span><span className="mt-1 block text-[12px] leading-5 text-[#595E68]">{item.findingsCount} potential {item.findingsCount === 1 ? 'opportunity' : 'opportunities'} · {formatMoney(item.scopeValue)} potential recovery scope</span></span>{audit?.id === item.id ? <span className="mt-1 inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-[#3F51A8]"><Check className="h-4 w-4" />Selected</span> : null}</button>)}</div> : <p className="py-7 text-[13px] text-[#595E68]">No previous audits are available yet.</p>}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="rounded-[14px] border-[#D7D7D1] bg-white p-0 text-[#191B20] shadow-[0_16px_48px_rgba(25,27,32,0.18)] sm:max-w-[540px]">
          <DialogHeader className="border-b border-[#E8E7E1] px-5 pb-5 pt-6 sm:px-7"><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#777A82]">Selected audit record</p><DialogTitle className="mt-2 text-[22px] font-semibold tracking-[-0.025em] text-[#191B20]">Export summary</DialogTitle><DialogDescription className="mt-2 text-[13px] leading-5 text-[#595E68]">Download a browser-generated record for {selectedAuditSelectorLabel}. It is intended for management or operational review; sensitive identifiers, tokens, raw payloads, and payment references are excluded.</DialogDescription></DialogHeader>
          <div className="px-5 py-5 sm:px-7 sm:py-6">
            {step !== 'completed' ? <div className="border-l-2 border-[#9A5A03] bg-[#FBFAF7] px-4 py-3 text-[13px] text-[#595E68]">Complete the selected audit before exporting a summary.</div> : null}
            <dl className="mt-5 grid gap-3 border-y border-[#E8E7E1] py-4 text-[12px] leading-5 text-[#595E68]"><div><dt className="font-semibold text-[#191B20]">Document contents</dt><dd className="mt-1">Workspace, source, run, recorded coverage, and selected result.</dd></div><div><dt className="font-semibold text-[#191B20]">Delivery</dt><dd className="mt-1">The PDF identifies the workspace, source, run, recorded coverage, and selected result. It downloads in this browser only; Margin does not retain a copy or send it by email. It is not proof of reimbursement, filing authority, payment, or closure.</dd></div></dl>
            {exportError ? <div className="mt-4 border-l-2 border-[#A73549] bg-[#FBFAF7] px-4 py-3 text-[13px] text-[#595E68]" role="alert">{exportError}</div> : null}
            {summaryExported ? <div className="mt-4 border-l-2 border-[#0E766C] bg-[#FBFAF7] px-4 py-3 text-[13px] text-[#595E68]">This download completed in this browser.</div> : null}
            <Button onClick={exportExecutiveSummary} disabled={isExporting || step !== 'completed'} className="mt-5 h-10 rounded-md bg-[#191B20] px-4 text-[13px] font-medium text-white hover:bg-[#33363D]">{isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}Download PDF</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="max-h-[min(780px,calc(100vh-32px))] overflow-y-auto rounded-[14px] border-[#D7D7D1] bg-white p-0 text-[#191B20] shadow-[0_16px_48px_rgba(25,27,32,0.18)] sm:max-w-[680px]">
          <DialogHeader className="border-b border-[#E8E7E1] px-5 pb-5 pt-6 sm:px-7"><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#777A82]">Workspace run preference</p><DialogTitle className="mt-2 text-[22px] font-semibold tracking-[-0.025em] text-[#191B20]">Automatic audit schedule</DialogTitle><DialogDescription className="mt-2 max-w-xl text-[13px] leading-5 text-[#595E68]">This is a workspace-owned run preference. It does not create proof, filing authority, reimbursement eligibility, payment, or case closure.</DialogDescription></DialogHeader>
          <div className="px-5 py-5 sm:px-7 sm:py-6">
            {scheduleLoadError ? <div className="border-l-2 border-[#9A5A03] bg-[#FBFAF7] px-4 py-4 text-[13px] leading-5 text-[#595E68]" role="alert"><p>{scheduleLoadError}</p><Button variant="outline" size="sm" onClick={() => void openScheduleDialog()} className="mt-3 h-8 border-[#D7D7D1] bg-white px-3 text-[12px] font-medium text-[#191B20] hover:bg-[#F4F3ED]">Retry schedule status</Button></div> : scheduleOperating ? <section className="border-b border-[#E8E7E1] pb-5"><div className="flex flex-wrap items-start justify-between gap-3"><div className="border-l-2 border-[#3F51A8] pl-4"><p className={'text-[13px] font-semibold ' + scheduleState.tone}>{scheduleState.label}</p><p className="mt-1 max-w-md text-[13px] leading-5 text-[#595E68]">{scheduleState.detail}</p></div><span className="border border-[#D7D7D1] bg-[#FBFAF7] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#777A82]">{activeWorkspaceLabel}</span></div><dl className="mt-5 grid border-y border-[#E8E7E1] text-[12px] sm:grid-cols-2"><div className="border-b border-[#E8E7E1] py-3 sm:border-b-0 sm:border-r sm:pr-4"><dt className="font-semibold text-[#595E68]">Last attempt</dt><dd className="mt-1 font-medium text-[#191B20]">{formatAuditDate(scheduleOperating.last_attempt_at, 'No automatic attempt recorded')}</dd></div><div className="py-3 sm:pl-4"><dt className="font-semibold text-[#595E68]">Next planned attempt</dt><dd className="mt-1 font-medium text-[#191B20]">{formatAuditDate(scheduleOperating.next_run_at, 'Not scheduled')}</dd></div></dl><div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] leading-5 text-[#595E68]"><span className="font-medium text-[#191B20]">Amazon connection: {amazonConnected === true ? 'Connected' : amazonConnected === false ? 'Action required' : 'Checking'}</span>{amazonConnected === false ? <button type="button" onClick={() => { setIsScheduleDialogOpen(false); void connectAmazon(); }} className="font-semibold text-[#3F51A8] hover:text-[#31418D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5165C7]">Connect Amazon</button> : null}{scheduleOperating.last_audit ? <button type="button" onClick={() => { setIsScheduleDialogOpen(false); navigate('/audit?auditId=' + encodeURIComponent(scheduleOperating.last_audit!.id)); }} className="font-semibold text-[#3F51A8] hover:text-[#31418D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5165C7]">View resulting audit</button> : null}</div></section> : <div className="border-l-2 border-[#D7D7D1] bg-[#FBFAF7] px-4 py-3 text-[13px] text-[#595E68]">Loading schedule status for this workspace.</div>}
            {scheduleStatusAvailable && !scheduleEntitled ? <div className="mt-5 border-l-2 border-[#D7D7D1] bg-[#FBFAF7] px-4 py-3 text-[13px] leading-5 text-[#595E68]">Recovery Workspace is required to create or resume an automatic audit schedule. Existing schedule preferences can still be paused or turned off.</div> : null}
            {scheduleStatusAvailable && scheduleExecution && !scheduleExecution.available ? <div className="mt-5 border-l-2 border-[#9A5A03] bg-[#FBFAF7] px-4 py-3 text-[13px] leading-5 text-[#595E68]">Automatic execution is not active in this environment. Margin will not save a new active schedule because it could not run it. Use <span className="font-medium text-[#191B20]">Run Audit</span> for a manual audit; any existing preference can be paused or turned off.</div> : null}
            {scheduleStatusAvailable && scheduleExecution?.available ? <div className="mt-5 border-l-2 border-[#3F51A8] bg-[#FBFAF7] px-4 py-3 text-[13px] leading-5 text-[#595E68]">Margin checks due schedules approximately every {scheduleExecution.cadence_minutes || 15} minutes. Completed supported audits appear in <Link to={notificationsHref} className="font-semibold text-[#3F51A8] hover:text-[#31418D]">Notifications</Link>; completion email is not enabled from this schedule.</div> : null}
            {scheduleStatusAvailable ? <section className="mt-6"><div className="flex items-baseline justify-between gap-4"><div><p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#777A82]">Run preference</p><p className="mt-1 text-[13px] text-[#595E68]">Edit only after reviewing the recorded operating state above.</p></div></div><div className="mt-5 grid gap-x-4 gap-y-4 sm:grid-cols-2"><label className="grid gap-1.5 text-[12px] font-semibold text-[#595E68]">Frequency<select value={scheduleForm.cadence} onChange={(event) => setScheduleForm((current) => ({ ...current, cadence: event.target.value as AuditScheduleCadence }))} className="h-10 rounded-md border border-[#D7D7D1] bg-white px-3 text-[13px] font-normal text-[#191B20] outline-none focus:border-[#5165C7] focus:ring-2 focus:ring-[#5165C7]/20"><option value="off">Off</option><option value="weekly">Weekly</option><option value="biweekly">Every two weeks</option><option value="monthly">Monthly</option></select></label><label className="grid gap-1.5 text-[12px] font-semibold text-[#595E68]">Preferred time<input value={scheduleForm.preferred_time} onChange={(event) => setScheduleForm((current) => ({ ...current, preferred_time: event.target.value }))} type="time" className="h-10 rounded-md border border-[#D7D7D1] bg-white px-3 text-[13px] font-normal text-[#191B20] outline-none focus:border-[#5165C7] focus:ring-2 focus:ring-[#5165C7]/20" /></label><label className="grid gap-1.5 text-[12px] font-semibold text-[#595E68]">Day of week<select value={scheduleForm.preferred_day_of_week} onChange={(event) => setScheduleForm((current) => ({ ...current, preferred_day_of_week: Number(event.target.value) }))} className="h-10 rounded-md border border-[#D7D7D1] bg-white px-3 text-[13px] font-normal text-[#191B20] outline-none focus:border-[#5165C7] focus:ring-2 focus:ring-[#5165C7]/20">{['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => <option key={day} value={index}>{day}</option>)}</select></label><label className="grid gap-1.5 text-[12px] font-semibold text-[#595E68]">Day of month<input value={scheduleForm.preferred_day_of_month} onChange={(event) => setScheduleForm((current) => ({ ...current, preferred_day_of_month: Number(event.target.value) }))} min={1} max={28} type="number" className="h-10 rounded-md border border-[#D7D7D1] bg-white px-3 text-[13px] font-normal text-[#191B20] outline-none focus:border-[#5165C7] focus:ring-2 focus:ring-[#5165C7]/20" /></label><label className="grid gap-1.5 text-[12px] font-semibold text-[#595E68] sm:col-span-2">Timezone<input value={scheduleForm.timezone} onChange={(event) => setScheduleForm((current) => ({ ...current, timezone: event.target.value }))} className="h-10 rounded-md border border-[#D7D7D1] bg-white px-3 text-[13px] font-normal text-[#191B20] outline-none focus:border-[#5165C7] focus:ring-2 focus:ring-[#5165C7]/20" /></label></div><div className="mt-5 border-y border-[#E8E7E1] py-3 text-[12px] leading-5 text-[#595E68]"><span className="font-semibold text-[#191B20]">Schedule instruction:</span> {scheduleForm.cadence === 'off' ? 'Automatic audits are off.' : (scheduleForm.cadence === 'biweekly' ? 'Every two weeks' : scheduleForm.cadence.charAt(0).toUpperCase() + scheduleForm.cadence.slice(1)) + ' at ' + scheduleForm.preferred_time + ' (' + scheduleForm.timezone + ').'} This preference does not guarantee a completed audit; the recorded operating state above is the source of truth.</div><div className="mt-5 flex flex-col gap-2 sm:flex-row"><Button onClick={() => void saveSchedule()} disabled={!canSaveScheduleForm || isScheduleSaving} className="h-10 rounded-md bg-[#191B20] px-4 text-[13px] font-medium text-white hover:bg-[#33363D] disabled:bg-[#F4F3ED] disabled:text-[#777A82]">{isScheduleSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Save schedule</Button><Button variant="outline" onClick={() => void saveSchedule({ is_paused: true })} disabled={!canManageSavedSchedule || isScheduleSaving} className="h-10 rounded-md border-[#D7D7D1] bg-white px-4 text-[13px] text-[#595E68] hover:bg-[#F4F3ED] disabled:bg-[#F4F3ED] disabled:text-[#777A82]">Pause</Button><Button variant="outline" onClick={() => void saveSchedule({ cadence: 'off', is_paused: false })} disabled={!canManageSavedSchedule || isScheduleSaving} className="h-10 rounded-md border-[#D7D7D1] bg-white px-4 text-[13px] text-[#595E68] hover:bg-[#F4F3ED] disabled:bg-[#F4F3ED] disabled:text-[#777A82]">Turn off</Button></div></section> : null}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="rounded-[14px] border-[#D7D7D1] bg-white p-0 text-[#191B20] shadow-[0_16px_48px_rgba(25,27,32,0.18)] sm:max-w-[560px]">
          <DialogHeader className="border-b border-[#E8E7E1] px-5 pb-5 pt-6 sm:px-7"><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#777A82]">Public entry point</p><DialogTitle className="mt-2 text-[22px] font-semibold tracking-[-0.025em] text-[#191B20]">Share Margin with a seller</DialogTitle><DialogDescription className="mt-2 text-[13px] leading-5 text-[#595E68]">Share only the public audit entry point. No audit, tenant, Amazon, or recovery data is included.</DialogDescription></DialogHeader>
          <div className="px-5 py-5 sm:px-7 sm:py-6"><p className="border-l-2 border-[#D7D7D1] bg-[#FBFAF7] px-4 py-3 text-[13px] leading-5 text-[#595E68]">Margin helps Amazon sellers audit reimbursement activity, prepare evidence, track recoveries, and verify payouts. Run a free Recovery Audit.</p><label className="mt-5 grid gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#777A82]">Shareable link<input readOnly value={getShareLink()} className="h-10 rounded-md border border-[#D7D7D1] bg-white px-3 text-[12px] font-normal normal-case tracking-normal text-[#595E68] outline-none focus:border-[#5165C7] focus:ring-2 focus:ring-[#5165C7]/20" /></label><div className="mt-5 flex flex-col gap-2 sm:flex-row"><Button onClick={copyShareLink} variant="outline" className="h-10 rounded-md border-[#D7D7D1] bg-white px-4 text-[13px] text-[#191B20] hover:bg-[#F4F3ED]">{shareCopied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}{shareCopied ? 'Copied' : 'Copy link'}</Button><Button asChild variant="outline" className="h-10 rounded-md border-[#D7D7D1] bg-white px-4 text-[13px] text-[#191B20] hover:bg-[#F4F3ED]" onClick={() => trackEvent('share_email_clicked', { source_page: '/audit' })}><a href={'mailto:?subject=' + encodeURIComponent('Run a free Amazon Recovery Audit with Margin') + '&body=' + encodeURIComponent('Margin helps Amazon sellers audit reimbursement activity, prepare evidence, track recoveries, and verify payouts. Run a free Recovery Audit:\n\n' + getShareLink())}><Mail className="mr-2 h-4 w-4" />Email</a></Button><Button onClick={() => void nativeShare()} className="h-10 rounded-md bg-[#191B20] px-4 text-[13px] font-medium text-white hover:bg-[#33363D]">Share</Button></div></div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSecurityProtocolOpen} onOpenChange={setIsSecurityProtocolOpen}>
        <DialogContent className="rounded-[14px] border-[#D7D7D1] bg-white p-0 text-[#191B20] shadow-[0_16px_48px_rgba(25,27,32,0.18)] sm:max-w-[560px]">
          <DialogHeader className="border-b border-[#E8E7E1] px-5 pb-5 pt-6 sm:px-7"><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#777A82]">Workspace controls</p><DialogTitle className="mt-2 text-[22px] font-semibold tracking-[-0.025em] text-[#191B20]">Account safeguards</DialogTitle><DialogDescription className="mt-2 text-[13px] leading-5 text-[#595E68]">Margin uses the permissions and controls described below.</DialogDescription></DialogHeader>
          <div className="divide-y divide-[#E8E7E1] px-5 py-2 sm:px-7">{[['Read-only synchronization', 'Margin reviews shipments, settlements, inventory, refunds, fees, and related records to prepare a recovery scope.'], ['Seller-controlled filing', 'You retain 100% filing authority. Evidence is prepared for review; submission requires explicit seller action.'], ['Account ownership', 'One Amazon seller account is bound to one Margin workspace. Cross-workspace reuse is blocked during authorization.'], ['Payment separation', 'Amazon authorization and Paystack checkout are separate flows. Payment details are verified through Paystack, not through Amazon credentials.']].map(([title, body]) => <section key={title} className="py-4"><h3 className="text-[14px] font-semibold text-[#191B20]">{title}</h3><p className="mt-1 text-[13px] leading-5 text-[#595E68]">{body}</p></section>)}</div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAuditLogOpen} onOpenChange={setIsAuditLogOpen}>
        <DialogContent className="flex max-h-[min(760px,calc(100vh-32px))] w-[calc(100%-32px)] max-w-[720px] flex-col gap-0 overflow-hidden rounded-[14px] border border-[#D7D7D1] bg-white p-0 text-[#191B20] shadow-[0_16px_48px_rgba(25,27,32,0.18)]">
          <DialogHeader className="border-b border-[#E8E7E1] px-5 pb-5 pt-6 pr-14 sm:px-7">
            <div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#777A82]">Selected audit record</p><DialogTitle className="mt-2 text-[22px] font-semibold tracking-[-0.025em] text-[#191B20]">Audit activity</DialogTitle><DialogDescription className="mt-2 max-w-lg text-[13px] leading-5 text-[#595E68]">A seller-readable record of preparation, coverage, analysis, and result for the selected audit. It refreshes when you open or refresh this panel; it is not a live event stream.</DialogDescription></div><Button variant="outline" size="sm" onClick={() => void loadAuditActivity()} disabled={isAuditLogLoading || !audit?.id} className="h-8 shrink-0 border-[#D7D7D1] bg-white px-2.5 text-[12px] text-[#191B20] hover:bg-[#F4F3ED]">Refresh</Button></div>
            <dl className="mt-5 grid gap-3 border-t border-[#E8E7E1] pt-4 text-[12px] sm:grid-cols-2"><div><dt className="text-[#777A82]">Selected audit</dt><dd className="mt-1 font-medium text-[#191B20]">{selectedAuditSelectorLabel}</dd></div><div><dt className="text-[#777A82]">Recorded stage</dt><dd className="mt-1 font-medium text-[#191B20]">{auditPhaseMarker}</dd></div></dl>
          </DialogHeader>
          <div className="flex items-center gap-1 overflow-x-auto border-b border-[#E8E7E1] px-5 py-3 sm:px-7">{['All', 'Audit', 'Coverage', 'Analysis', 'Result'].map((filter) => <button key={filter} type="button" onClick={() => { setAuditLogFilter(filter); trackEvent('audit_log_filter_changed', { source_page: '/audit', filter }); }} className={'shrink-0 rounded-md px-3 py-1.5 text-[12px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5165C7] ' + (auditLogFilter === filter ? 'bg-[#E9ECFF] text-[#191B20]' : 'text-[#595E68] hover:bg-[#F4F3ED] hover:text-[#191B20]')}>{filter}</button>)}</div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7">{isAuditLogLoading ? <div className="flex items-center gap-2 py-8 text-[13px] text-[#595E68]"><Loader2 className="h-4 w-4 animate-spin" />Loading audit activity</div> : auditLogError ? <div className="border-l-2 border-[#9A5A03] bg-[#FBFAF7] px-4 py-4 text-[13px] leading-5 text-[#595E68]" role="alert"><p>{auditLogError}</p><Button variant="outline" size="sm" onClick={() => void loadAuditActivity()} className="mt-3 h-8 border-[#D7D7D1] bg-white px-3 text-[12px] font-medium text-[#191B20] hover:bg-[#F4F3ED]">Retry lifecycle</Button></div> : auditLogEvents.filter((event) => auditLogFilter === 'All' || event.category === auditLogFilter).length ? <ol className="border-l border-[#D7D7D1] pl-5">{auditLogEvents.filter((event) => auditLogFilter === 'All' || event.category === auditLogFilter).map((event, index) => <li key={event.timestamp + '-' + index} className="relative border-b border-[#E8E7E1] pb-5 pt-1 first:pt-0 last:border-b-0"><span className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full bg-[#3F51A8]" /><div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"><span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#777A82]">{event.category}</span><time className="text-[11px] text-[#777A82]">{new Date(event.timestamp).toLocaleString()}</time></div><p className="mt-2 text-[13px] leading-5 text-[#595E68]">{event.message}</p></li>)}</ol> : <div className="py-8"><p className="text-[15px] font-semibold text-[#191B20]">No audit activity yet</p><p className="mt-2 max-w-md text-[13px] leading-5 text-[#595E68]">{step === 'public' || step === 'ready' || step === 'connect' ? 'This record begins when read-only synchronization starts. The current workspace is waiting for authorization.' : step === 'syncing' || step === 'detecting' ? 'This record will update when you refresh after Margin synchronizes records and reconciles the audit scope.' : 'No activity has been recorded for this audit period.'}</p></div>}</div>
        </DialogContent>
      </Dialog>
    </div>
  );

}
