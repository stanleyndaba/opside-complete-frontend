import { useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@clerk/react';
import { ArrowRight, Loader2 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useSession } from '@/contexts/SessionContext';
import { api, AuditRunRecord, AuditTeaserSummary } from '@/lib/api';
import { ANALYTICS_EVENTS } from '@/lib/analyticsEvents';
import { trackEvent } from '@/lib/analytics';

type AuditStep = 'public' | 'ready' | 'connect' | 'syncing' | 'detecting' | 'completed' | 'failed';
type PendingAuditContext = {
  auditId: string;
  tenantSlug: string;
  phase: 'account_ready' | 'amazon_connection_required' | 'amazon_oauth_started' | 'syncing' | 'completed';
  updatedAt: string;
};

const PENDING_AUDIT_KEY = 'margin_pending_audit';

const CURRENCY_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

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
      label: 'Account required',
      title: 'Start with a secure audit workspace.',
      description: 'Create your account first. Then Margin can connect Amazon and begin the free audit.',
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

    if (!hasFindings && !hasScopeValue) {
      setError('No recovery candidates are ready from this audit yet. Margin will keep this workspace available for future checks.');
      return;
    }

    setIsBusy(true);
    setError(null);
    trackEvent(ANALYTICS_EVENTS.auditActivationClicked, {
      audit_id: audit?.id || null,
      scope_value: teaser.scopeValue,
      findings_count: teaser.findingsCount,
      destination: 'paystack_subscription_checkout',
      value: 1799,
      currency: 'ZAR',
    });
    trackEvent(ANALYTICS_EVENTS.checkoutStarted, {
      offer: 'recovery_workspace',
      value: 1799,
      currency: 'ZAR',
      payment_provider: 'paystack_subscription',
    });
    trackEvent(ANALYTICS_EVENTS.subscriptionCheckoutStarted, {
      offer: 'recovery_workspace',
      value: 1799,
      currency: 'ZAR',
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

  const statusCopy = {
    public: 'Create an account first. The audit is free, and activation only happens after you see the locked summary.',
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
      <Button onClick={startAccountStep} className="h-10 rounded-md bg-[var(--margin-blue)] px-5 text-[13px] font-medium text-white shadow-[0_18px_48px_rgba(23,92,211,0.34)] transition-colors hover:bg-[var(--margin-blue-hover)]">
        Start Free Audit
      </Button>
    ) : step === 'connect' ? (
      <Button onClick={connectAmazon} disabled={isBusy} className="h-10 rounded-md bg-[var(--margin-blue)] px-5 text-[13px] font-medium text-white shadow-[0_18px_48px_rgba(23,92,211,0.34)] transition-colors hover:bg-[var(--margin-blue-hover)]">
        {isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Connect Amazon
      </Button>
    ) : step === 'completed' ? (
      isZeroRecordLimitedAudit ? (
        <Button onClick={teaser.retryable ? runAudit : loadResults} disabled={isBusy} className="h-10 rounded-md bg-[var(--margin-blue)] px-5 text-[13px] font-medium text-white shadow-[0_18px_48px_rgba(23,92,211,0.34)] transition-colors hover:bg-[var(--margin-blue-hover)]">
          {isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          {teaser.retryable ? 'Retry Audit' : 'Return Later'}
        </Button>
      ) : hasFindings || hasScopeValue ? (
        <Button onClick={activateAudit} className="h-10 rounded-md bg-[var(--margin-blue)] px-5 text-[13px] font-medium text-white shadow-[0_18px_48px_rgba(23,92,211,0.34)] transition-colors hover:bg-[var(--margin-blue-hover)]">
          Activate Your Recovery Workspace
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      ) : (
        <Button onClick={loadResults} disabled={isBusy} className="h-10 rounded-md bg-[var(--margin-blue)] px-5 text-[13px] font-medium text-white shadow-[0_18px_48px_rgba(23,92,211,0.34)] transition-colors hover:bg-[var(--margin-blue-hover)]">
          {isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Check Again Later
        </Button>
      )
    ) : (
      <Button onClick={runAudit} disabled={isBusy} className="h-10 rounded-md bg-[var(--margin-blue)] px-5 text-[13px] font-medium text-white shadow-[0_18px_48px_rgba(23,92,211,0.34)] transition-colors hover:bg-[var(--margin-blue-hover)]">
        {isBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {step === 'syncing' || step === 'detecting' ? 'Check Status' : audit?.sync_id ? 'Retry Audit' : 'Run Audit'}
      </Button>
    );

  return (
    <main className="min-h-screen bg-[#FAFAFA] font-inter text-gray-900 selection:bg-blue-100">
      <section className="flex min-h-screen items-start justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-3xl">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img src="/logoimagetwo.png" alt="Margin" width="20" height="20" className="h-5 w-auto object-contain" />
              <span className="brand-wordmark font-merriweather text-base tracking-tight text-[#182026] md:text-lg">Margin</span>
            </div>
          </div>

          <header className="mb-6">
            <h1 className="text-[32px] font-semibold tracking-[-0.02em] text-gray-900 sm:text-4xl">Audit workspace</h1>
            <p className="mt-2 text-[15px] leading-relaxed text-gray-500">
              Shipments, inventory events, settlement lines, support replies, and proof documents are being matched into recovery-ready findings.
            </p>

            <div className="mt-4 flex items-center gap-8 border-b border-gray-200 pb-4">
              <div>
                <div className="font-mono text-[11px] font-medium uppercase text-gray-400">Scope value</div>
                <div className="mt-1 text-[22px] font-semibold tracking-[-0.02em] text-gray-900 sm:text-[26px]">
                  {isZeroRecordLimitedAudit ? 'Not calculated' : formatMoney(teaser.scopeValue)}
                </div>
              </div>
              <div>
                <div className="font-mono text-[11px] font-medium uppercase text-gray-400">Findings</div>
                <div className="mt-1 text-[22px] font-semibold tracking-[-0.02em] text-gray-900 sm:text-[26px]">
                  {isZeroRecordLimitedAudit ? 'Not evaluated' : teaser.findingsCount}
                </div>
              </div>
            </div>
          </header>

          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-[0_18px_70px_rgba(15,23,42,0.04)] sm:p-5">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <span className={`inline-flex rounded-md px-2 py-1 text-[11px] font-medium uppercase ${isZeroRecordLimitedAudit ? 'bg-amber-50 text-amber-700' : 'bg-blue-50 text-blue-700'}`}>
                  {auditState.label}
                </span>
                <h2 className="mt-3 text-[22px] font-semibold tracking-[-0.025em] text-gray-900 sm:text-[26px]">
                  {auditState.title}
                </h2>
                <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-gray-500">
                  {auditState.description}
                </p>
              </div>
              <div className={`flex items-center gap-2 rounded-full px-3 py-2 text-[12px] font-medium ${isZeroRecordLimitedAudit ? 'bg-amber-50 text-amber-700' : 'bg-gray-50 text-gray-500'}`}>
                <span className={`h-2 w-2 rounded-full ${step === 'failed' ? 'bg-red-500' : isZeroRecordLimitedAudit ? 'bg-amber-500' : step === 'completed' ? 'bg-emerald-500' : 'bg-blue-600'}`} />
                {isBusy ? 'Working' : isZeroRecordLimitedAudit ? 'Limited coverage' : step === 'completed' ? 'Ready' : step === 'failed' ? 'Needs retry' : 'Waiting'}
              </div>
            </div>
          </div>

          {/* Workspace Report (Locked / Unlocked state) */}
          <div className="mt-6">
            <div className={`relative overflow-hidden rounded-xl border ${step === 'completed' ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50/50 backdrop-blur-[2px]'} p-5 sm:p-6`}>
              <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3">
                <h2 className="text-[18px] font-semibold tracking-[-0.02em] text-gray-900">Workspace report</h2>
                {step !== 'completed' && <span className="rounded-md bg-gray-100 px-2 py-1 font-mono text-[11px] font-medium uppercase text-gray-500">Locked</span>}
              </div>

              {step === 'completed' ? (
                <div className="mb-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-left">
                    <div className="font-mono text-[10px] font-medium uppercase text-gray-400">Scope value</div>
                    <div className="mt-1 text-[20px] font-semibold tracking-[-0.02em] text-gray-900">{isZeroRecordLimitedAudit ? 'Not calculated' : formatMoney(teaser.scopeValue)}</div>
                  </div>
                  <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-left">
                    <div className="font-mono text-[10px] font-medium uppercase text-gray-400">Findings</div>
                    <div className="mt-1 text-[20px] font-semibold tracking-[-0.02em] text-gray-900">{isZeroRecordLimitedAudit ? 'Not evaluated' : teaser.findingsCount}</div>
                  </div>
                  <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-left">
                    <div className="font-mono text-[10px] font-medium uppercase text-gray-400">Evidence ready</div>
                    <div className="mt-1 text-[20px] font-semibold tracking-[-0.02em] text-gray-900">{isZeroRecordLimitedAudit ? 'Not evaluated' : teaser.evidenceReadyCount}</div>
                  </div>
                </div>
              ) : null}

              {step === 'completed' && teaser.categories.length ? (
                <div className="mb-6 flex flex-wrap gap-2">
                  {teaser.categories.map((category) => (
                    <span key={category} className="rounded-md border border-gray-200 bg-gray-50 px-2.5 py-1 font-mono text-[12px] text-gray-600">
                      {category}
                    </span>
                  ))}
                </div>
              ) : null}

              {step === 'completed' && (teaser.recordsReviewed != null || teaser.sourcesUnavailable?.length) ? (
                <div className="mb-6 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-left">
                  <div className="font-mono text-[10px] font-medium uppercase text-gray-400">Audit coverage</div>
                  <p className="mt-1 text-[13px] leading-relaxed text-gray-500">
                    {teaser.recordsReviewed != null
                      ? `${teaser.recordsReviewed.toLocaleString()} Amazon record${teaser.recordsReviewed === 1 ? '' : 's'} reviewed.`
                      : 'Amazon record coverage is being prepared.'}
                    {teaser.sourcesReviewed?.length ? ` Sources reviewed: ${teaser.sourcesReviewed.join(', ')}.` : ''}
                    {teaser.sourcesUnavailable?.length ? ` Unavailable: ${teaser.sourcesUnavailable.join(', ')}.` : ''}
                  </p>
                </div>
              ) : null}

              <div className="flex flex-col items-center justify-center text-center">
                 {!isZeroRecordLimitedAudit && (
                   <p className="mb-4 max-w-sm text-[14px] leading-relaxed text-gray-500">
                    {statusCopy[step]} Seller approval stays required. Margin prepares the path; the seller decides what moves.
                   </p>
                 )}
                 <div className="flex items-center justify-center gap-3">
                   {step === 'completed' && !isZeroRecordLimitedAudit && (
                     <Button variant="outline" onClick={loadResults} disabled={isBusy} className="h-10 rounded-md border-gray-200 bg-white px-4 text-[13px] font-medium text-gray-700 hover:bg-gray-50">
                       Refresh
                     </Button>
                   )}
                   {primaryAction}
                 </div>
              </div>
            </div>
          </div>

        </div>
      </section>
    </main>
  );
}
