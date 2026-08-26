import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@clerk/react';
import { AlertTriangle, ArrowRight, ArrowRightLeft, Calendar, CalendarClock, Check, CircleDollarSign, Copy, Database, Download, FilePlus2, FileText, HeartHandshake, Loader2, Mail, PanelLeft, Search, ShieldCheck, TerminalSquare } from 'lucide-react';
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
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
    ? `${selectedAuditIsLatest ? 'Latest audit' : 'Selected audit'} · ${formatAuditDate(audit.completed_at || audit.started_at || selectedAuditHistoryItem?.created_at)}`
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
    <main className="platform-audit-workspace flex h-screen max-h-screen overflow-hidden bg-[#FAFAF7] font-sans text-zinc-950 selection:bg-[#007AFF]/20 selection:text-[#007AFF] tracking-tight">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-[260px]' : 'w-[54px]'} sticky top-0 hidden h-screen shrink-0 flex-col border-r border-[#D8E3EA] bg-[#F5F5F5] transition-[width] duration-300 ease-in-out md:flex`}>
        {sidebarOpen ? (
          <div className="flex h-full flex-col">
            <div className="flex h-[57px] min-h-[57px] items-center justify-between border-b border-[#D8E3EA] bg-[#F5F5F5] px-4">
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
                Audit activity
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
                    title={selectedAuditSelectorLabel}
                    className="flex h-8 w-full items-center overflow-hidden whitespace-nowrap rounded-md border border-[#D8E3EA] bg-white/50 pl-8 pr-2 text-left text-[14px] text-[#4D5B66] transition-colors hover:border-zinc-300 hover:bg-white focus:outline-none"
                  >
                    <span className="min-w-0 flex-1 truncate">{selectedAuditSelectorLabel}</span>
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
            <div className="flex h-[57px] min-h-[57px] w-full items-center justify-center border-b border-[#D8E3EA] bg-[#F5F5F5]">
              <Link to="/" aria-label="Margin home" className="transition-opacity hover:opacity-80">
                <img src="/logoimagetwo.png" alt="Margin" width="18" height="18" className="h-[18px] w-auto object-contain" />
              </Link>
            </div>
            <nav className="flex flex-col items-center gap-1.5 pt-4">
              <button type="button" onClick={() => setSidebarOpen(true)} aria-label="Expand sidebar" title="Expand sidebar" className="rounded-md p-2 text-zinc-400 transition-colors hover:bg-white hover:text-zinc-900">
                <PanelLeft className="h-4 w-4" />
              </button>
              <button type="button" onClick={openAuditLog} aria-label="Audit activity" title="Audit activity" className="rounded-md p-2 text-[#4D5B66] transition-colors hover:bg-white hover:text-zinc-900">
                <TerminalSquare className="h-4 w-4" />
              </button>
              <button type="button" onClick={openScheduleDialog} aria-label="Schedules" title="Schedules" className="rounded-md p-2 text-[#4D5B66] transition-colors hover:bg-white hover:text-zinc-900">
                <CalendarClock className="h-4 w-4" />
              </button>
              <button type="button" onClick={() => setIsPeriodSelectorOpen(true)} aria-label="Audit history" title="Audit history" className="rounded-md p-2 text-[#4D5B66] transition-colors hover:bg-white hover:text-zinc-900">
                <Calendar className="h-4 w-4" />
              </button>
            </nav>
            <div className="mt-auto border-t border-[#D8E3EA] py-4">
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
        <div className="sticky top-0 z-10 flex min-h-[57px] shrink-0 items-center border-b border-[#D8E3EA] bg-[#FAFAF7] px-4 py-2 sm:px-6 md:h-[57px] md:py-0">
          <div className="flex w-full items-center justify-between gap-3 lg:flex-row lg:justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex items-center gap-2 md:hidden">
                <Link to="/" className="flex items-center">
                  <img src="/logoimagetwo.png" alt="Margin" width="16" height="16" className="h-4 w-auto object-contain" />
                </Link>
              </div>
              <button
                type="button"
                onClick={openScheduleDialog}
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-zinc-700 transition-colors hover:text-[#0B74DE] sm:text-[14px]"
              >
                <CalendarClock className="h-4 w-4 shrink-0 text-zinc-400" />
                <span className="truncate">Schedules</span>
              </button>
              <Link 
                to={tenant ? `/app/${tenant.slug}/data-upload?returnTo=audit${audit?.id ? `&auditId=${encodeURIComponent(audit.id)}` : ''}` : `/data-upload?returnTo=audit${audit?.id ? `&auditId=${encodeURIComponent(audit.id)}` : ''}`}
                className="inline-flex items-center gap-1.5 border-l border-[#D8E3EA] pl-3 text-[13px] font-medium text-zinc-700 transition-colors hover:text-[#0B74DE] sm:text-[14px]"
                title="Use Amazon reports"
              >
                <FilePlus2 className="h-4 w-4 shrink-0 text-zinc-400" />
                <span className="truncate">Use Amazon reports</span>
              </Link>
            </div>
              <div className="flex items-center gap-2 text-[13px] sm:text-[14px]">
              <button type="button" onClick={() => setIsExportDialogOpen(true)} className="rounded-md border border-transparent p-1.5 text-zinc-400 transition-colors hover:border-[#D8E3EA] hover:bg-[#FAFAF7] hover:text-zinc-900" title="Export summary">
                <Download className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Content area */}
        <section className="flex-1 px-4 py-4 sm:px-8 sm:py-5">
          <div className="mx-auto w-full max-w-5xl">
            <header className="mb-5 pt-2 text-center sm:mb-7 sm:pt-4">
              <div className="flex flex-col items-center gap-4">
                <div className="w-full max-w-4xl">
                  <p className="mb-2 text-[13px] font-medium text-[#0B74DE] uppercase tracking-wider">
                    {audit ? (selectedAuditIsLatest ? 'Latest audit' : 'Selected audit from history') : 'Audit workspace'}
                  </p>
                  <h1 className="mx-auto max-w-4xl break-words font-lora text-[34px] leading-[1.03] tracking-tight text-[#182026] sm:text-[52px] sm:leading-[1.03]" style={{ fontWeight: 400 }}>
                    {audit ? (selectedAuditIsLatest ? 'Your latest audit' : 'Your selected audit') : 'Your audit workspace'}
                  </h1>
                  <p className="mx-auto mt-3 max-w-3xl text-[14px] leading-6 text-[#4D5B66] sm:text-[15px] sm:leading-6">
                    {audit
                      ? `${selectedAuditOutcome}. ${selectedAuditCoverage}. Review what Margin examined before deciding what happens next.`
                      : isAuthenticated
                        ? 'Start an audit when this workspace is ready. Margin will explain the connection, coverage, result, and next step here.'
                        : 'Connect Amazon or use supported Amazon reports to begin a recovery audit.'}
                  </p>
                  {isAuthenticated ? (
                    <div className="mx-auto mt-4 grid max-w-3xl gap-px border border-[#D8E3EA] bg-[#D8E3EA] text-left sm:grid-cols-4">
                      <div className="bg-white px-3 py-2.5"><p className="text-[10px] font-medium uppercase tracking-wide text-[#66737F]">Workspace</p><p className="mt-1 truncate text-[12px] font-medium text-[#182026]">{activeWorkspaceLabel}</p></div>
                      <div className="bg-white px-3 py-2.5"><p className="text-[10px] font-medium uppercase tracking-wide text-[#66737F]">Audit</p><p className="mt-1 text-[12px] font-medium text-[#182026]">{audit ? (selectedAuditIsLatest ? 'Latest audit' : 'Selected history') : 'No audit yet'}</p></div>
                      <div className="bg-white px-3 py-2.5"><p className="text-[10px] font-medium uppercase tracking-wide text-[#66737F]">Source</p><p className="mt-1 text-[12px] font-medium text-[#182026]">{audit ? selectedAuditSource : 'Not recorded'}</p></div>
                      <div className="bg-white px-3 py-2.5"><p className="text-[10px] font-medium uppercase tracking-wide text-[#66737F]">Run date</p><p className="mt-1 text-[12px] font-medium text-[#182026]">{audit ? selectedAuditRunDate : 'Not recorded'}</p></div>
                    </div>
                  ) : null}
                  {!isAuthenticated && (
                    <p className="mx-auto mt-4 max-w-2xl text-[13px] font-medium text-[#4D5B66]">
                      Read-only access. Margin examines the Amazon records needed for your Audit.
                    </p>
                  )}

                  {needsAdditionalAmazonData && (
                    <div className="mx-auto mt-4 max-w-2xl rounded-lg border border-[#D8E3EA] bg-[#F5F5F5] p-4">
                      <div className="flex items-start gap-3 text-left">
                        <FilePlus2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0B74DE]" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-medium text-[#182026]">Additional Amazon data required</p>
                          <p className="mt-1 text-[13px] leading-5 text-[#4D5B66]">
                            {teaser.sourcesUnavailable?.length
                              ? `Margin needs ${teaser.sourcesUnavailable.slice(0, 2).join(' or ')} to complete this examination.`
                              : 'Margin needs additional Amazon reports to complete this examination.'}
                          </p>
                          <Link
                            to={`/data-upload?returnTo=audit${audit?.id ? `&auditId=${encodeURIComponent(audit.id)}` : ''}`}
                            className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-[#0B74DE] transition-colors hover:text-[#075EA8]"
                          >
                            Use Amazon reports <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
	                <div className="flex flex-col items-center gap-4">
	                  <div className="flex w-full flex-col items-center gap-2 sm:w-auto sm:flex-row sm:justify-center sm:gap-3">
	                    {primaryAction}
		                    <Link 
		                      to={tenant ? `/app/${tenant.slug}/data-upload?returnTo=audit${audit?.id ? `&auditId=${encodeURIComponent(audit.id)}` : ''}` : `/data-upload?returnTo=audit${audit?.id ? `&auditId=${encodeURIComponent(audit.id)}` : ''}`}
		                      className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-md border border-[#D8E3EA] bg-white px-5 text-[13px] font-medium text-zinc-700 transition-colors hover:border-[#0B74DE] hover:text-[#0B74DE] sm:h-10 sm:w-auto sm:text-[13px]"
		                    >
                      Use Amazon reports

		                    </Link>
	                  </div>
	                  <button
	                    type="button"
	                    onClick={() => {
	                      setIsScopeDialogOpen(true);
	                      trackEvent('audit_scope_opened', { source_page: '/audit', audit_id: audit?.id || null });
	                    }}
	                    className="text-[13px] text-[#4D5B66] underline-offset-4 hover:text-[#0B74DE] hover:underline transition-colors"
	                  >
	                    View Audit scope
	                  </button>
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
              <section className="mb-6 mt-7 sm:mb-10 sm:mt-9">
                <div className="mb-4 text-center sm:mb-6">
                  <h2 className="text-[12px] font-medium text-[#0B74DE] sm:text-[13px]">Understanding your audit</h2>
                  <p className="mt-1 text-[16px] font-medium leading-6 tracking-[-0.02em] text-[#182026] sm:text-[19px]">
                    Margin reviews the Amazon records available to this workspace and explains what happens next.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 sm:gap-6">
                  {/* Available Amazon account data */}
                  <div className="group relative rounded-xl bg-[#FAFAF7] p-3.5 transition-all hover:bg-[#F5F5F5] sm:p-5">
                    <div className="mb-3 flex h-8 items-center sm:mb-5 sm:h-9">
                      <img src="/amazon-logo-transparent-circle.png" alt="Amazon" className="h-7 w-7 object-contain" />
                    </div>
                    <h3 className="text-[13px] font-bold text-[#182026] sm:text-[14px]">Amazon account data</h3>
                    <p className="mt-0.5 text-[11px] font-medium text-[#4D5B66] sm:mt-1 sm:text-[12px]">Read-only Amazon access</p>
                    <p className="mt-2 text-[10px] text-[#66737F] sm:mt-3 sm:text-[11px]">Available seller records used for this audit</p>
                  </div>

                  {/* Recorded evidence documentation */}
                  <div className="group relative rounded-xl bg-[#FAFAF7] p-3.5 transition-all hover:bg-[#F5F5F5] sm:p-5">
                    <div className="mb-3 flex h-8 items-center gap-2 sm:mb-5 sm:h-9">
                      <img src="/gmailicon.png" alt="Gmail" className="h-4 w-4 object-contain" />
                      <img src="/slack-icon-2019.png" alt="Slack" className="h-4 w-4 object-contain" />
                      <img src="/gd.png" alt="Google Drive" className="h-4 w-4 object-contain" />
                    </div>
                    <h3 className="text-[13px] font-bold text-[#182026] sm:text-[14px]">Evidence records</h3>
                    <p className="mt-0.5 text-[11px] font-medium text-[#4D5B66] sm:mt-1 sm:text-[12px]">Recorded documentation</p>
                    <p className="mt-2 text-[10px] text-[#66737F] sm:mt-3 sm:text-[11px]">Documents remain separate from audit results</p>
                  </div>

                  {/* Reconciliation checks */}
                  <div className="group relative rounded-xl bg-[#FAFAF7] p-3.5 transition-all hover:bg-[#F5F5F5] sm:p-5">
                    <div className="mb-3 flex h-8 items-center sm:mb-5 sm:h-9">
                      <div className="flex h-7 w-7 items-center justify-center bg-white rounded-full">
                        <ArrowRightLeft className="h-3.5 w-3.5 text-[#66737F] group-hover:text-[#0B74DE]" />
                      </div>
                    </div>
                    <h3 className="text-[13px] font-bold text-[#182026] sm:text-[14px]">Reconciliation checks</h3>
                    <p className="mt-0.5 text-[11px] font-medium text-[#4D5B66] sm:mt-1 sm:text-[12px]">Recorded activity review</p>
                    <p className="mt-2 text-[10px] text-[#66737F] sm:mt-3 sm:text-[11px]">Potential differences need review before any action</p>
                  </div>
                </div>

                <div className="mt-8 border-t border-[#D8E3EA] pt-4">
                  <p className="text-[11px] leading-5 font-medium text-[#66737F] sm:text-[12px]">
                    Read-only data review · potential opportunities · seller approval before any filing
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
                      <div className="text-[12px] font-medium text-[#66737F]">Potential recovery scope</div>
                      <div className="mt-1 text-[22px] font-semibold tracking-[-0.03em] text-[#182026] tabular-nums">{isZeroRecordLimitedAudit ? '$0' : formatMoney(teaser.scopeValue)}</div>
                    </div>
                    <div className="bg-white p-4">
                      <div className="text-[12px] font-medium text-[#66737F]">Potential opportunities</div>
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

            {step === 'completed' && (canShowRecoverOnce || canShowWorkspace) ? (
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
                          ? formatDuration(audit?.completed_at, audit?.started_at)
                          : '—'}
                      </span>
                    </div>
                    <div className="flex flex-col pl-8">
                      <span className="text-[12px] font-semibold uppercase tracking-tight text-[#66737F] mb-2">Potential recovery scope</span>
                      <span className="text-[18px] font-bold tracking-tight text-zinc-900 tabular-nums">{formatMoney(teaser.scopeValue)}</span>
                    </div>
                  </div>

                  {canShowRecoverOnce ? (
                    <div className={`grid gap-6 ${canShowWorkspace ? 'md:grid-cols-2' : ''}`}>
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

                      {canShowWorkspace ? (
                        <div className="rounded-none border border-zinc-100 bg-white p-8 text-zinc-900 flex flex-col shadow-2xl shadow-zinc-100">
                          <div className="text-[12px] font-semibold uppercase tracking-tight text-[#66737F] mb-4">Engagement 02 / Continuous</div>
                          <h3 className="text-[20px] font-bold tracking-tight text-zinc-900">R1,799 / Month</h3>
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
                      ) : null}
                    </div>
                  ) : canShowWorkspace ? (
                    <div className="rounded-none border border-zinc-100 bg-white p-8 text-zinc-900 flex flex-col shadow-2xl shadow-zinc-100">
                      <div className="text-[12px] font-semibold uppercase tracking-tight text-[#66737F] mb-4">Recovery Surface / Continuous</div>
                      <h3 className="text-[20px] font-bold tracking-tight text-zinc-900">R1,799 / Month</h3>
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
                  ) : null}
                </div>
              </section>
            ) : null}
          </div>

          <div className="mt-12 pb-8 text-center">
            <p className="text-[11px] font-medium text-[#94A3B8]">
              Margin Agents can make mistakes. Check important info
            </p>
          </div>
        </section>
      </div>

      {/* Keep all dialogs and sheets exactly as they are */}
      <Sheet open={isActivationSheetOpen} onOpenChange={setIsActivationSheetOpen}>
        <SheetContent side="right" className="flex h-full w-full flex-col overflow-y-auto border-[#D8E3EA] bg-white p-0 text-[#182026] shadow-[0_24px_90px_rgba(15,23,42,0.18)] sm:max-w-[460px] max-sm:inset-x-0 max-sm:bottom-0 max-sm:top-auto max-sm:h-[90vh] max-sm:w-full max-sm:rounded-t-2xl max-sm:border-l-0 max-sm:border-t">
          <div className="px-6 pb-6 pt-7">
            <SheetHeader className="text-left">
              <div className="mb-4 rounded-lg border border-[#D8E3EA] bg-[#F5F5F5] p-3">
                <div className="font-mono text-[10px] font-medium uppercase text-[#94A3B8]">First audit</div>
                <div className="mt-2 grid grid-cols-1 gap-2 text-[13px] text-[#4D5B66]">
                  <div className="flex items-center justify-between gap-3">
                    <span>{auditSheetSummary.label}</span>
                    <span className="font-medium text-[#182026]">{auditSheetSummary.metric}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Monitoring</span>
                    <span className="font-medium text-[#182026]">Not active</span>
                  </div>
                </div>
              </div>
              <div className="font-mono text-[10px] font-medium uppercase text-[#0B74DE]">Recovery Workspace</div>
              <SheetTitle className="mt-2 text-[24px] font-semibold leading-tight tracking-[-0.03em] text-[#182026]">
                One audit shows what is visible today. Margin keeps watching what happens next.
              </SheetTitle>
              <SheetDescription className="mt-3 text-[14px] leading-relaxed text-[#66737F]">
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
                <div key={title} className="border-t border-[#D8E3EA] pt-4">
                  <h3 className="text-[14px] font-semibold tracking-[-0.01em] text-[#182026]">{title}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#66737F]">{body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-auto border-t border-[#D8E3EA] bg-[#F5F5F5] px-6 py-5">
            <div className="text-[28px] font-semibold tracking-[-0.04em] text-[#182026]">R1,799 / Month</div>
            <p className="mt-1 text-[13px] leading-relaxed text-[#4D5B66]">Flat-fee Recovery OS | 0% recovery commission | Cancel anytime | Nothing filed without approval</p>
            <Button onClick={activateAudit} disabled={isBusy} className="mt-5 h-11 w-full rounded-[6px] bg-[#182026] px-5 text-[13px] font-medium text-white shadow-none transition-colors hover:bg-[#2C2E35]">
              {isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Continue to Secure Checkout
              {!isBusy ? <ArrowRight className="ml-2 h-4 w-4" /> : null}
            </Button>
            <SheetClose asChild>
              <Button variant="ghost" className="mt-2 h-10 w-full rounded-md text-[13px] font-medium text-[#66737F] hover:bg-[#F5F5F5] hover:text-[#4D5B66]">
                Not now
              </Button>
            </SheetClose>
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={isScopeDialogOpen} onOpenChange={setIsScopeDialogOpen}>
        <DialogContent className="max-h-[min(720px,calc(100vh-48px))] overflow-y-auto rounded-xl border-[#D8E3EA] bg-[#FAFAF7] text-[#182026] shadow-[0_20px_70px_rgba(24,32,38,0.12)] sm:max-w-[620px]">
          <DialogHeader>
            <p className="text-[11px] font-medium uppercase tracking-wide text-[#0B74DE]">Selected audit scope</p>
            <DialogTitle className="text-[20px] font-semibold tracking-[-0.03em] text-[#182026]">What Margin examined</DialogTitle>
            <DialogDescription className="text-[13px] leading-relaxed text-[#66737F]">
              This records the known scope and limits of the selected audit. It does not turn a finding, estimate, or available data into proof, filing authority, reimbursement eligibility, payment, or closure.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 text-[13px] leading-5 text-[#4D5B66]">
            <div className="grid gap-px border border-[#D8E3EA] bg-[#D8E3EA] sm:grid-cols-2">
              <div className="bg-white p-3"><p className="text-[10px] font-medium uppercase tracking-wide text-[#66737F]">Workspace</p><p className="mt-1 font-medium text-[#182026]">{activeWorkspaceLabel}</p></div>
              <div className="bg-white p-3"><p className="text-[10px] font-medium uppercase tracking-wide text-[#66737F]">Audit selected</p><p className="mt-1 font-medium text-[#182026]">{audit ? (selectedAuditIsLatest ? 'Latest audit' : 'Selected audit from history') : 'No audit selected'}</p></div>
              <div className="bg-white p-3"><p className="text-[10px] font-medium uppercase tracking-wide text-[#66737F]">Source</p><p className="mt-1 font-medium text-[#182026]">{audit ? selectedAuditSource : 'Not recorded'}</p></div>
              <div className="bg-white p-3"><p className="text-[10px] font-medium uppercase tracking-wide text-[#66737F]">Run date</p><p className="mt-1 font-medium text-[#182026]">{audit ? selectedAuditRunDate : 'Not recorded'}</p></div>
            </div>
            <section className="rounded-lg border border-[#D8E3EA] bg-white p-4">
              <h3 className="font-medium text-[#182026]">Coverage recorded for this audit</h3>
              <p className="mt-1">{teaser.recordsReviewed != null ? `${Number(teaser.recordsReviewed).toLocaleString()} Amazon record${Number(teaser.recordsReviewed) === 1 ? '' : 's'} were available for review.` : 'Record count was not recorded for this audit.'}</p>
              <p className="mt-2"><span className="font-medium text-[#182026]">Data reviewed:</span> {teaser.sourcesReviewed?.length ? teaser.sourcesReviewed.join(', ') : 'Not recorded.'}</p>
              <p className="mt-2"><span className="font-medium text-[#182026]">Coverage limits:</span> {teaser.sourcesUnavailable?.length ? `${teaser.sourcesUnavailable.join(', ')} ${teaser.sourcesUnavailable.length === 1 ? 'was' : 'were'} unavailable.` : 'No unavailable source was recorded.'}</p>
              <p className="mt-2"><span className="font-medium text-[#182026]">Recorded audit month:</span> {selectedAuditPeriodLabel}. A detailed source date range is not recorded for this audit.</p>
            </section>
            <section className="rounded-lg border border-[#D8E3EA] bg-white p-4">
              <h3 className="font-medium text-[#182026]">What Margin can review from available data</h3>
              <p className="mt-1">Margin can examine available Amazon activity for potential reimbursement and reconciliation patterns, including shipments, returns, reimbursements, fees, and settlements when those data sources are present.</p>
              <h3 className="mt-4 font-medium text-[#182026]">What this audit cannot establish on its own</h3>
              <p className="mt-1">It does not prove a claim, authorize filing, establish reimbursement eligibility, confirm payment, or close a recovery matter. Any next step remains seller-controlled and evidence-dependent.</p>
            </section>
            <section className="rounded-lg border border-[#D8E3EA] bg-[#F5F5F5] p-4">
              <h3 className="font-medium text-[#182026]">What happens next</h3>
              <p className="mt-1">{needsAdditionalAmazonData ? 'Add supported Amazon reports or restore Amazon access to improve coverage, then review the resulting audit.' : audit?.status === 'completed' ? 'Review the selected audit result and any potential recovery opportunities before deciding whether to take a seller-controlled next step.' : 'Use the recorded audit state above to connect Amazon, run the audit, or return after Margin finishes the current work.'}</p>
            </section>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPeriodSelectorOpen} onOpenChange={setIsPeriodSelectorOpen}>
        <DialogContent className="rounded-xl border-[#D8E3EA] bg-[#FAFAF7] text-[#182026] shadow-[0_20px_70px_rgba(24,32,38,0.12)] sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold tracking-[-0.03em] text-[#182026]">Audit history</DialogTitle>
            <DialogDescription className="text-[13px] leading-relaxed text-[#66737F]">
              Select an actual audit record from this workspace. Run date, source, and coverage are shown only when recorded; a detailed audit period may not be available for older audits.
            </DialogDescription>
          </DialogHeader>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" />
            <input
              value={auditHistoryQuery}
              onChange={(event) => setAuditHistoryQuery(event.target.value)}
              placeholder="Search audit date, source, or status"
              className="h-10 w-full rounded-[6px] border border-[#D8E3EA] bg-[#F5F5F5] pl-9 pr-3 text-[13px] outline-none transition-colors focus:border-[#0B74DE] focus:bg-white focus:ring-1 focus:ring-[#0B74DE]"
            />
          </div>
          <div className="max-h-[320px] overflow-y-auto">
            {isHistoryLoading ? (
              <div className="flex items-center gap-2 py-6 text-[13px] text-[#66737F]">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading audit history
              </div>
            ) : auditHistoryError ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-[13px] leading-5 text-amber-900" role="alert">
                <p>{auditHistoryError}</p>
                <Button variant="outline" size="sm" onClick={() => void loadAuditHistory()} className="mt-3 h-8 border-amber-200 bg-white px-3 text-[12px] font-medium text-amber-900 hover:bg-amber-100">
                  Retry history
                </Button>
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
                      className="flex items-center justify-between rounded-lg border border-[#D8E3EA] bg-[#F5F5F5] px-3 py-3 text-left transition-colors hover:border-[#B8C8D4] hover:bg-[#F5F9FF] focus:outline-none focus:ring-2 focus:ring-[#0B74DE]/20"
                    >
                      <span className="min-w-0">
                        <span className="block text-[13px] font-medium text-[#182026]">{item.isLatest ? 'Latest audit' : 'Audit record'} · {formatAuditDate(item.completed_at || item.started_at || item.created_at)}</span>
                        <span className="mt-1 block text-[11px] leading-5 text-[#66737F]">{sellerAuditOutcome(item.status, item.finalStatus)} · {auditSourceLabel(item.sourceType)} · {item.recordsReviewed != null ? `${Number(item.recordsReviewed).toLocaleString()} records reviewed` : 'Record count not recorded'}</span>
                        <span className="block text-[11px] leading-5 text-[#66737F]">{item.findingsCount} potential {item.findingsCount === 1 ? 'opportunity' : 'opportunities'} · {formatMoney(item.scopeValue)} potential recovery scope</span>
                      </span>
                      {audit?.id === item.id ? <Check className="h-4 w-4 text-[#0B74DE]" /> : null}
                    </button>
                  ))}
              </div>
            ) : (
              <p className="py-6 text-[13px] text-[#66737F]">No previous audits are available yet.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="rounded-xl border-[#D8E3EA] bg-[#FAFAF7] text-[#182026] shadow-[0_20px_70px_rgba(24,32,38,0.12)] sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold tracking-[-0.03em] text-[#182026]">Export summary</DialogTitle>
            <DialogDescription className="text-[13px] leading-relaxed text-[#66737F]">
              Download a browser-generated record for {selectedAuditSelectorLabel}. It is intended for management or operational review; sensitive identifiers, tokens, raw payloads, and payment references are excluded.
            </DialogDescription>
          </DialogHeader>
          {step !== 'completed' ? (
            <div className="rounded-lg border border-[#D8E3EA] bg-[#F5F5F5] p-3 text-[13px] text-[#66737F]">
              Complete the selected audit before exporting a summary.
            </div>
          ) : null}
          <p className="-mt-2 text-[12px] leading-5 text-[#66737F]">The PDF identifies the workspace, source, run, recorded coverage, and selected result. It downloads in this browser only; Margin does not retain a copy or send it by email. It is not proof of reimbursement, filing authority, payment, or closure.</p>
          {exportError ? <div className="rounded-lg border border-red-100 bg-red-50 p-3 text-[13px] text-red-700">{exportError}</div> : null}
          {summaryExported ? <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-[13px] text-emerald-700">This download completed in this browser.</div> : null}
          <Button onClick={exportExecutiveSummary} disabled={isExporting || step !== 'completed'} className="h-10 rounded-[6px] bg-[#182026] px-4 text-[13px] font-medium text-white shadow-none transition-colors hover:bg-[#2C2E35]">
            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Download PDF
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog open={isScheduleDialogOpen} onOpenChange={setIsScheduleDialogOpen}>
        <DialogContent className="rounded-xl border-[#D8E3EA] bg-[#FAFAF7] text-[#182026] shadow-[0_20px_70px_rgba(24,32,38,0.12)] sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold tracking-[-0.03em] text-[#182026]">Automatic audit schedule</DialogTitle>
            <DialogDescription className="text-[13px] leading-relaxed text-[#66737F]">
              This is a workspace-owned run preference. It does not create proof, filing authority, reimbursement eligibility, payment, or case closure.
            </DialogDescription>
          </DialogHeader>
          {scheduleLoadError ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-[13px] leading-5 text-amber-900" role="alert">
              <p>{scheduleLoadError}</p>
              <Button variant="outline" size="sm" onClick={() => void openScheduleDialog()} className="mt-3 h-8 border-amber-200 bg-white px-3 text-[12px] font-medium text-amber-900 hover:bg-amber-100">
                Retry schedule status
              </Button>
            </div>
          ) : scheduleOperating ? (
            <div className="rounded-lg border border-[#D8E3EA] bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className={`text-[13px] font-semibold ${scheduleState.tone}`}>{scheduleState.label}</p>
                  <p className="mt-1 max-w-md text-[12px] leading-5 text-[#4D5B66]">{scheduleState.detail}</p>
                </div>
                <span className="border border-[#D8E3EA] bg-[#FAFAF7] px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-[#66737F]">{activeWorkspaceLabel}</span>
              </div>
              <div className="mt-4 grid gap-px border border-[#E6EEF2] bg-[#E6EEF2] text-[12px] sm:grid-cols-2">
                <div className="bg-white p-3"><span className="text-[#66737F]">Last attempt</span><p className="mt-1 font-medium text-[#182026]">{formatAuditDate(scheduleOperating.last_attempt_at, 'No automatic attempt recorded')}</p></div>
                <div className="bg-white p-3"><span className="text-[#66737F]">Next planned attempt</span><p className="mt-1 font-medium text-[#182026]">{formatAuditDate(scheduleOperating.next_run_at, 'Not scheduled')}</p></div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-[12px] leading-5 text-[#4D5B66]">
                <span className={`inline-flex items-center rounded-md border px-2 py-1 ${amazonConnected === true ? 'border-emerald-100 bg-emerald-50 text-emerald-800' : amazonConnected === false ? 'border-amber-200 bg-amber-50 text-amber-900' : 'border-[#D8E3EA] bg-[#FAFAF7] text-[#66737F]'}`}>
                  Amazon connection: {amazonConnected === true ? 'Connected' : amazonConnected === false ? 'Action required' : 'Checking'}
                </span>
                {amazonConnected === false ? (
                  <button type="button" onClick={() => { setIsScheduleDialogOpen(false); void connectAmazon(); }} className="font-medium text-[#0B74DE] hover:text-[#075EA8]">
                    Connect Amazon
                  </button>
                ) : null}
                {scheduleOperating.last_audit ? (
                  <button type="button" onClick={() => { setIsScheduleDialogOpen(false); navigate(`/audit?auditId=${encodeURIComponent(scheduleOperating.last_audit!.id)}`); }} className="font-medium text-[#0B74DE] hover:text-[#075EA8]">
                    View resulting audit
                  </button>
                ) : null}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-[#D8E3EA] bg-[#F5F5F5] p-3 text-[13px] text-[#66737F]">Loading schedule status for this workspace.</div>
          )}
          {scheduleStatusAvailable && !scheduleEntitled ? (
            <div className="rounded-lg border border-[#D8E3EA] bg-[#F5F5F5] p-3 text-[13px] text-[#4D5B66]">
              Recovery Workspace is required to create or resume an automatic audit schedule. Existing schedule preferences can still be paused or turned off.
            </div>
          ) : null}
          {scheduleStatusAvailable && scheduleExecution && !scheduleExecution.available ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-[13px] leading-5 text-amber-900">
              Automatic execution is not active in this environment. Margin will not save a new active schedule because it could not run it. Use <span className="font-medium">Run Audit</span> for a manual audit; any existing preference can be paused or turned off.
            </div>
          ) : null}
          {scheduleStatusAvailable && scheduleExecution?.available ? (
            <div className="rounded-lg border border-[#D8E3EA] bg-[#F5F5F5] p-3 text-[13px] leading-5 text-[#4D5B66]">
              Margin checks due schedules approximately every {scheduleExecution.cadence_minutes || 15} minutes. Completed supported audits appear in <Link to={notificationsHref} className="font-medium text-[#0B74DE] hover:text-[#075EA8]">Notifications</Link>; completion email is not enabled from this schedule.
            </div>
          ) : null}
          {scheduleStatusAvailable ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="grid gap-1 text-[12px] font-medium text-[#4D5B66]">
                  Frequency
                  <select value={scheduleForm.cadence} onChange={(event) => setScheduleForm((current) => ({ ...current, cadence: event.target.value as AuditScheduleCadence }))} className="h-10 rounded-md border border-[#D8E3EA] bg-white px-3 text-[13px] text-[#182026]">
                    <option value="off">Off</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Every two weeks</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </label>
                <label className="grid gap-1 text-[12px] font-medium text-[#4D5B66]">
                  Preferred time
                  <input value={scheduleForm.preferred_time} onChange={(event) => setScheduleForm((current) => ({ ...current, preferred_time: event.target.value }))} type="time" className="h-10 rounded-md border border-[#D8E3EA] bg-white px-3 text-[13px] text-[#182026]" />
                </label>
                <label className="grid gap-1 text-[12px] font-medium text-[#4D5B66]">
                  Day of week
                  <select value={scheduleForm.preferred_day_of_week} onChange={(event) => setScheduleForm((current) => ({ ...current, preferred_day_of_week: Number(event.target.value) }))} className="h-10 rounded-md border border-[#D8E3EA] bg-white px-3 text-[13px] text-[#182026]">
                    {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => <option key={day} value={index}>{day}</option>)}
                  </select>
                </label>
                <label className="grid gap-1 text-[12px] font-medium text-[#4D5B66]">
                  Day of month
                  <input value={scheduleForm.preferred_day_of_month} onChange={(event) => setScheduleForm((current) => ({ ...current, preferred_day_of_month: Number(event.target.value) }))} min={1} max={28} type="number" className="h-10 rounded-md border border-[#D8E3EA] bg-white px-3 text-[13px] text-[#182026]" />
                </label>
                <label className="grid gap-1 text-[12px] font-medium text-[#4D5B66] sm:col-span-2">
                  Timezone
                  <input value={scheduleForm.timezone} onChange={(event) => setScheduleForm((current) => ({ ...current, timezone: event.target.value }))} className="h-10 rounded-md border border-[#D8E3EA] bg-white px-3 text-[13px] text-[#182026]" />
                </label>
              </div>
              <div className="rounded-lg border border-[#D8E3EA] bg-[#F5F5F5] p-3 text-[12px] leading-5 text-[#66737F]">
                <span className="font-medium text-[#182026]">Schedule instruction:</span> {scheduleForm.cadence === 'off' ? 'Automatic audits are off.' : `${scheduleForm.cadence === 'biweekly' ? 'Every two weeks' : scheduleForm.cadence.charAt(0).toUpperCase() + scheduleForm.cadence.slice(1)} at ${scheduleForm.preferred_time} (${scheduleForm.timezone}).`} This preference does not guarantee a completed audit; the recorded operating state above is the source of truth.
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button onClick={() => void saveSchedule()} disabled={!canSaveScheduleForm || isScheduleSaving} className="h-10 rounded-[6px] bg-[#182026] px-4 text-[13px] font-medium text-white shadow-none transition-colors hover:bg-[#2C2E35] disabled:bg-[#F5F5F5] disabled:text-[#94A3B8] disabled:opacity-100">
                  {isScheduleSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save schedule
                </Button>
                <Button variant="outline" onClick={() => void saveSchedule({ is_paused: true })} disabled={!canManageSavedSchedule || isScheduleSaving} className="h-10 rounded-md border-[#D8E3EA] bg-[#FAFAF7] px-4 text-[13px] text-[#4D5B66] disabled:border-[#D8E3EA] disabled:bg-[#F5F5F5] disabled:text-[#94A3B8] disabled:opacity-100">Pause</Button>
                <Button variant="outline" onClick={() => void saveSchedule({ cadence: 'off', is_paused: false })} disabled={!canManageSavedSchedule || isScheduleSaving} className="h-10 rounded-md border-[#D8E3EA] bg-[#FAFAF7] px-4 text-[13px] text-[#4D5B66] disabled:border-[#D8E3EA] disabled:bg-[#F5F5F5] disabled:text-[#94A3B8] disabled:opacity-100">Turn off</Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="rounded-xl border-[#D8E3EA] bg-[#FAFAF7] text-[#182026] shadow-[0_20px_70px_rgba(24,32,38,0.12)] sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-[18px] font-semibold tracking-[-0.03em] text-[#182026]">Share Margin with a seller</DialogTitle>
            <DialogDescription className="text-[13px] leading-relaxed text-[#66737F]">
              Share only the public audit entry point. No audit, tenant, Amazon, or recovery data is included.
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border border-[#D8E3EA] bg-[#F5F5F5] p-3 text-[13px] leading-relaxed text-[#4D5B66]">
            Margin helps Amazon sellers audit reimbursement activity, prepare evidence, track recoveries, and verify payouts. Run a free Recovery Audit.
          </div>
          <input readOnly value={getShareLink()} className="h-10 rounded-md border border-[#D8E3EA] bg-white px-3 text-[12px] text-[#4D5B66]" />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={copyShareLink} variant="outline" className="h-10 rounded-md border-[#D8E3EA] bg-[#FAFAF7] px-4 text-[13px] text-[#4D5B66] hover:bg-[#F5F5F5] hover:text-[#182026]">
              {shareCopied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {shareCopied ? 'Copied' : 'Copy link'}
            </Button>
            <Button asChild variant="outline" className="h-10 rounded-md border-[#D8E3EA] bg-[#FAFAF7] px-4 text-[13px] text-[#4D5B66] hover:bg-[#F5F5F5] hover:text-[#182026]" onClick={() => trackEvent('share_email_clicked', { source_page: '/audit' })}>
              <a href={`mailto:?subject=${encodeURIComponent('Run a free Amazon Recovery Audit with Margin')}&body=${encodeURIComponent(`Margin helps Amazon sellers audit reimbursement activity, prepare evidence, track recoveries, and verify payouts. Run a free Recovery Audit:\n\n${getShareLink()}`)}`}>
                <Mail className="mr-2 h-4 w-4" /> Email
              </a>
            </Button>
            <Button onClick={() => void nativeShare()} className="h-10 rounded-[6px] bg-[#182026] px-4 text-[13px] font-medium text-white shadow-none transition-colors hover:bg-[#2C2E35]">Share</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSecurityProtocolOpen} onOpenChange={setIsSecurityProtocolOpen}>
        <DialogContent className="rounded-xl border-[#D8E3EA] bg-[#FAFAF7] text-[#182026] shadow-[0_20px_70px_rgba(24,32,38,0.12)] sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle className="text-[20px] font-semibold tracking-[-0.03em] text-[#182026]">Security Protocol</DialogTitle>
            <DialogDescription className="text-[14px] leading-relaxed text-[#66737F]">
              Margin uses the permissions and controls described below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 text-[13px] text-[#4D5B66]">
            <div className="rounded-lg border border-[#D8E3EA] bg-[#F5F5F5] p-3">
              <div className="font-medium text-[#182026]">Read-only synchronization</div>
              <p className="mt-1 leading-relaxed">Margin reviews shipments, settlements, inventory, refunds, fees, and related records to prepare a recovery scope.</p>
            </div>
            <div className="rounded-lg border border-[#D8E3EA] bg-[#F5F5F5] p-3">
              <div className="font-medium text-[#182026]">Seller-controlled filing</div>
              <p className="mt-1 leading-relaxed">You retain 100% filing authority. Evidence is prepared for review; submission requires explicit seller action.</p>
            </div>
            <div className="rounded-lg border border-[#D8E3EA] bg-[#F5F5F5] p-3">
              <div className="font-medium text-[#182026]">Account ownership</div>
              <p className="mt-1 leading-relaxed">One Amazon seller account is bound to one Margin workspace. Cross-workspace reuse is blocked during authorization.</p>
            </div>
            <div className="rounded-lg border border-[#D8E3EA] bg-[#F5F5F5] p-3">
              <div className="font-medium text-[#182026]">Payment separation</div>
              <p className="mt-1 leading-relaxed">Amazon authorization and Paystack checkout are separate flows. Payment details are verified through Paystack, not through Amazon credentials.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isAuditLogOpen} onOpenChange={setIsAuditLogOpen}>
        <DialogContent className="flex max-h-[min(720px,calc(100vh-48px))] w-[calc(100%-32px)] max-w-[680px] flex-col gap-0 overflow-hidden rounded-xl border border-[#D8E3EA] bg-[#FAFAF7] p-0 text-[#182026] shadow-[0_24px_90px_rgba(24,32,38,0.16)]">
          <DialogHeader className="border-b border-[#D8E3EA] px-6 pb-5 pt-6 pr-14">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="mb-2 text-[11px] font-medium text-[#0B74DE]">Audit record</p>
                <DialogTitle className="text-[21px] font-semibold tracking-[-0.03em] text-[#182026]">Audit lifecycle</DialogTitle>
                <DialogDescription className="mt-2 max-w-lg text-[13px] leading-5 text-[#66737F]">
                  A seller-readable record of preparation, coverage, analysis, and result for the selected audit. It refreshes when you open or refresh this panel; it is not a live event stream.
                </DialogDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => void loadAuditActivity()} disabled={isAuditLogLoading || !audit?.id} className="h-8 border-[#D8E3EA] bg-white px-2.5 text-[12px] text-[#4D5B66] hover:bg-[#F5F5F5] hover:text-[#182026]">Refresh</Button>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-[#E6EEF2] pt-4 text-[12px]">
              <span><span className="text-[#66737F]">Selected audit</span><span className="ml-2 font-medium text-[#182026]">{selectedAuditSelectorLabel}</span></span>
              <span><span className="text-[#66737F]">Phase</span><span className="ml-2 font-medium text-[#182026]">{auditPhaseMarker}</span></span>
            </div>
          </DialogHeader>

          <div className="flex items-center gap-1 overflow-x-auto border-b border-[#D8E3EA] px-6 py-3">
            {['All', 'Audit', 'Coverage', 'Analysis', 'Result'].map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => {
                  setAuditLogFilter(filter);
                  trackEvent('audit_log_filter_changed', { source_page: '/audit', filter });
                }}
                className={`shrink-0 rounded-md px-3 py-1.5 text-[12px] font-medium transition-colors ${auditLogFilter === filter ? 'bg-[#EAF3FF] text-[#0B74DE]' : 'text-[#66737F] hover:bg-[#F5F5F5] hover:text-[#182026]'}`}
              >
                {filter}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {isAuditLogLoading ? (
              <div className="flex items-center gap-2 py-8 text-[13px] text-[#66737F]"><Loader2 className="h-4 w-4 animate-spin text-[#0B74DE]" /> Loading audit activity</div>
            ) : auditLogError ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-[13px] leading-5 text-amber-900" role="alert">
                <p>{auditLogError}</p>
                <Button variant="outline" size="sm" onClick={() => void loadAuditActivity()} className="mt-3 h-8 border-amber-200 bg-white px-3 text-[12px] font-medium text-amber-900 hover:bg-amber-100">
                  Retry lifecycle
                </Button>
              </div>
            ) : auditLogEvents.filter((event) => auditLogFilter === 'All' || event.category === auditLogFilter).length ? (
              <div className="relative ml-1 border-l border-[#D8E3EA] pl-6">
                {auditLogEvents
                  .filter((event) => auditLogFilter === 'All' || event.category === auditLogFilter)
                  .map((event, index) => (
                    <div key={`${event.timestamp}-${index}`} className="relative border-b border-[#E6EEF2] pb-5 pt-1 first:pt-0 last:border-b-0">
                      <span className="absolute -left-[29px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-[#FAFAF7] bg-[#0B74DE]" />
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <span className="text-[12px] font-medium text-[#0B74DE]">{event.category}</span>
                        <span className="font-mono text-[10px] text-[#9AA8B2]">{new Date(event.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="mt-1.5 text-[13px] leading-5 text-[#4D5B66]">{event.message}</p>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="py-8">
                <div className="mb-4 h-px w-10 bg-[#0B74DE]" />
                <p className="text-[15px] font-medium tracking-[-0.01em] text-[#182026]">No audit activity yet</p>
                <p className="mt-2 max-w-md text-[13px] leading-5 text-[#66737F]">
                  {step === 'public' || step === 'ready' || step === 'connect'
                    ? 'This stream begins when read-only synchronization starts. The current workspace is waiting for authorization.'
                    : step === 'syncing' || step === 'detecting'
                      ? 'This stream will update as Margin synchronizes records and reconciles the audit scope.'
                      : 'No activity has been recorded for this audit period.'}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );

}
