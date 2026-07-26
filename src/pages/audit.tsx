import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Download, Loader2, PlugZap, Radar, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/button';
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

const auditChecklist = [
  {
    label: 'Create your workspace',
    idle: 'Required',
    description: 'Secure your audit workspace in under a minute.',
  },
  {
    label: 'Connect your Amazon account',
    idle: 'Pending',
    description: 'Read-only access. No changes are made to your seller account.',
  },
  {
    label: 'Scan your FBA account',
    idle: 'Waiting',
    description: 'Margin reviews shipments, inventory, reimbursements, fees, and settlements.',
  },
  {
    label: 'Find recovery opportunities',
    idle: 'Waiting',
    description: 'Hidden losses, shortages, fee issues, refunds, and reimbursement gaps.',
  },
  {
    label: 'Unlock your recovery plan',
    idle: 'Locked',
    description: 'View every recovery, supporting evidence, and filing workflow.',
  },
] as const;

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

export default function Audit() {
  const navigate = useNavigate();
  const { authToken, isAuthReady, isSessionValid } = useSession();
  const isAuthenticated = isAuthReady && isSessionValid && Boolean(authToken);
  const [audit, setAudit] = useState<AuditRunRecord | null>(null);
  const [tenantSlug, setTenantSlug] = useState<string | null>(null);
  const [teaser, setTeaser] = useState<AuditTeaserSummary>(defaultTeaser);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const trackedViewRef = useRef(false);
  const trackedCompletionRef = useRef(false);
  const restoredAuditRef = useRef(false);

  const step = useMemo(() => getStep(audit, isAuthenticated), [audit, isAuthenticated]);

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

      if (pending?.auditId) {
        const response = await api.getAudit(pending.auditId);
        if (response.ok && response.data?.audit) {
          setAudit(response.data.audit);
          setTenantSlug(pending.tenantSlug);
          if (response.data.audit.status === 'completed') {
            const results = await api.getAuditResults(response.data.audit.id);
            if (results.ok && results.data?.teaser) {
              setTeaser(results.data.teaser);
            }
          }
          setIsBusy(false);
          return;
        }
      }

      const latest = await api.getLatestAudit();
      if (latest.ok && latest.data?.audit) {
        setAudit(latest.data.audit);
        const storedTenantSlug = localStorage.getItem('active_tenant_slug');
        if (storedTenantSlug) setTenantSlug(storedTenantSlug);
        if (latest.data.audit.status === 'completed') {
          const results = await api.getAuditResults(latest.data.audit.id);
          if (results.ok && results.data?.teaser) {
            setTeaser(results.data.teaser);
          }
        }
      }

      setIsBusy(false);
    };

    void restoreAudit();
  }, [isAuthenticated]);

  const startAccountStep = () => {
    trackEvent(ANALYTICS_EVENTS.auditStarted, {
      cta_location: 'audit_public_hero',
      cta_text: 'Connect Amazon',
    });
    trackEvent(ANALYTICS_EVENTS.auditAccountStepStarted, {
      cta_location: 'audit_public_hero',
      destination: '/login',
    });
    navigate('/login?mode=signup&intent=onboarding&next=%2Faudit');
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

    const response = await api.startAudit();
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
  };

  const connectAmazon = async () => {
    if (!audit?.id || !tenantSlug) {
      setError('Margin needs an audit workspace before Amazon can be connected.');
      return;
    }

    setIsBusy(true);
    setError(null);
    trackEvent(ANALYTICS_EVENTS.auditAmazonConnectStarted, {
      audit_id: audit.id,
      tenant_slug: tenantSlug,
    });
    savePendingAudit({
      auditId: audit.id,
      tenantSlug,
      phase: 'amazon_oauth_started',
    });

    const response = await api.connectAmazon(undefined, false, tenantSlug);
    setIsBusy(false);

    const authUrl = response.data?.auth_url || response.data?.authUrl;
    if (!response.ok || !authUrl) {
      setError(response.error || 'Amazon connection could not be opened yet.');
      return;
    }

    window.location.assign(authUrl);
  };

  const runAudit = async () => {
    if (!audit?.id) {
      await startAudit();
      return;
    }

    setIsBusy(true);
    setError(null);
    trackEvent(ANALYTICS_EVENTS.auditSyncStarted, {
      audit_id: audit.id,
      current_status: audit.status,
    });

    const response = await api.runAudit(audit.id);
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
      const results = await api.getAuditResults(response.data.audit.id);
      if (results.ok && results.data?.teaser) {
        setTeaser(results.data.teaser);
      }
    }
  };

  const loadResults = async () => {
    if (!audit?.id) return;
    setIsBusy(true);
    setError(null);
    const response = await api.getAuditResults(audit.id);
    setIsBusy(false);
    if (!response.ok || !response.data?.success) {
      setError(response.error || 'Margin could not load the audit result yet.');
      return;
    }
    setTeaser(response.data.teaser);
    setAudit((current) => current ? { ...current, ...response.data.audit } : current);
  };

  const activateAudit = () => {
    trackEvent(ANALYTICS_EVENTS.auditActivationClicked, {
      audit_id: audit?.id || null,
      scope_value: teaser.scopeValue,
      findings_count: teaser.findingsCount,
      destination: '/currency-margin',
    });
    clearPendingAudit();
    navigate(`/currency-margin?source=audit${audit?.id ? `&audit_id=${encodeURIComponent(audit.id)}` : ''}`);
  };

  const statusCopy = {
    public: 'Create an account first. The audit is free, and activation only happens after you see the locked summary.',
    ready: 'Your account is ready. Start the audit and Margin will check whether Amazon data is connected.',
    connect: 'Connect Amazon securely so Margin can scan FBA data and prepare the recovery scope.',
    syncing: 'Margin is syncing Amazon data. If Amazon is still blocked, this step will fail gracefully.',
    detecting: 'The seven recovery detectors are reviewing synced FBA data for reimbursable patterns.',
    completed: teaser.message,
    failed: audit?.summary?.message || 'The audit could not finish. You can retry when Amazon access is available.',
  } satisfies Record<AuditStep, string>;

  const primaryAction =
    step === 'public' ? (
      <Button onClick={startAccountStep} className="h-8 rounded-none bg-[#182026] px-4 font-mono text-[10px] font-medium tracking-tight text-white hover:bg-[#25313A]">
        <PlugZap className="mr-2 h-3.5 w-3.5" />
        Connect Amazon
      </Button>
    ) : step === 'connect' ? (
      <Button onClick={connectAmazon} disabled={isBusy} className="h-8 rounded-none bg-[#182026] px-4 font-mono text-[10px] font-medium tracking-tight text-white hover:bg-[#25313A]">
        {isBusy ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <PlugZap className="mr-2 h-3.5 w-3.5" />}
        Connect Amazon
      </Button>
    ) : step === 'completed' ? (
      <Button onClick={activateAudit} className="h-8 rounded-none bg-[#182026] px-4 font-mono text-[10px] font-medium tracking-tight text-white hover:bg-[#25313A]">
        Activate Recovery Workflow
        <ArrowRight className="ml-2 h-3.5 w-3.5" />
      </Button>
    ) : (
      <Button onClick={runAudit} disabled={isBusy} className="h-8 rounded-none bg-[#182026] px-4 font-mono text-[10px] font-medium tracking-tight text-white hover:bg-[#25313A]">
        {isBusy ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <PlugZap className="mr-2 h-3.5 w-3.5" />}
        {audit?.sync_id ? 'Continue Audit' : 'Connect Amazon'}
      </Button>
    );

  return (
    <main className="min-h-screen bg-[#FAFAF7] text-[#182026] selection:bg-[#0B74DE]/16">
      <section className="flex min-h-screen items-center justify-center px-3 py-5 sm:px-5">
        <div className="w-full max-w-7xl">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img src="/logoimagetwo.png" alt="Margin" width="20" height="20" className="h-5 w-auto object-contain" />
              <span className="brand-wordmark font-merriweather text-base leading-none tracking-tight text-[#182026] md:text-lg">
                Margin
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Download audit"
                className="inline-flex h-8 w-8 items-center justify-center border border-[#DCE8EE] bg-white text-[#25313A] transition-colors hover:bg-[#F8FAFC]"
              >
                <Download className="h-3.5 w-3.5" strokeWidth={1.8} />
              </button>
              <button
                type="button"
                aria-label="Share audit"
                className="inline-flex h-8 w-8 items-center justify-center border border-[#DCE8EE] bg-white text-[#25313A] transition-colors hover:bg-[#F8FAFC]"
              >
                <Share2 className="h-3.5 w-3.5" strokeWidth={1.8} />
              </button>
            </div>
          </div>

        <div className="mx-auto grid max-h-none min-h-0 w-full grid-rows-[auto_minmax(0,1fr)] overflow-hidden border border-[#CFE0EA] bg-white md:max-h-[505px]">
          <header className="border-b border-[#DCE8EE] px-4 py-2.5 sm:px-6 lg:px-7">
            <div className="mb-2 flex items-center justify-end border-b border-[#E8EFF3] pb-2">
              <div className="flex items-center gap-2">
                {primaryAction}
                {step === 'completed' ? (
                  <Button variant="outline" onClick={loadResults} disabled={isBusy} className="hidden h-9 rounded-none border-[#DCE8EE] bg-white px-3 font-mono text-[10px] font-medium tracking-tight text-[#25313A] hover:bg-[#F8FAFC] sm:inline-flex">
                    Refresh
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
              <div>
                <h1
                  className="max-w-4xl text-[24px] font-semibold leading-[0.96] tracking-[-0.045em] text-[#182026] sm:text-[30px] lg:text-[34px]"
                  style={{ fontFamily: 'Georgia, Merriweather, serif' }}
                >
                  Audit workspace
                </h1>
                <p className="mt-2 max-w-2xl text-[12px] leading-5 text-[#4D5B66] sm:text-[13px]">
                  Shipments, inventory events, settlement lines, support replies, and proof documents are being matched into recovery-ready findings.
                </p>
              </div>

              <div className="grid grid-cols-2 border border-[#DCE8EE] bg-[#F8FAFC]">
                <div className="flex min-h-[44px] flex-col justify-center border-r border-[#DCE8EE] px-3 py-1.5">
                  <span className="font-mono text-[9px] font-medium uppercase tracking-tight text-[#66737F]">
                    Scope value
                  </span>
                  <strong className="mt-1 block font-mono text-[14px] font-medium tracking-[-0.03em] text-[#182026]">
                    {formatMoney(teaser.scopeValue)}
                  </strong>
                </div>
                <div className="flex min-h-[44px] flex-col justify-center px-3 py-1.5">
                  <span className="font-mono text-[9px] font-medium uppercase tracking-tight text-[#66737F]">
                    Findings
                  </span>
                  <strong className="mt-1 block font-mono text-[14px] font-medium tracking-[-0.03em] text-[#182026]">
                    {teaser.findingsCount}
                  </strong>
                </div>
              </div>
            </div>

            {error ? (
              <div className="mt-3 border border-[#F3B9B9] bg-[#FFF5F5] px-3 py-2 font-mono text-[11px] font-medium text-[#B42318]">
                {error}
              </div>
            ) : null}
          </header>

          <div className="grid min-h-0 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-h-0 border-r border-[#DCE8EE]">
              <ul className="divide-y divide-[#DCE8EE]">
                {auditChecklist.map((item, index) => {
                  const value =
                    item.label === 'Create your workspace'
                      ? (isAuthenticated ? 'Ready' : item.idle)
                      : item.label === 'Connect your Amazon account'
                        ? (step === 'connect' || step === 'public' || step === 'ready' ? item.idle : 'In place')
                        : item.label === 'Scan your FBA account'
                          ? (step === 'syncing' ? 'Running' : audit?.sync_id ? 'Started' : item.idle)
                          : item.label === 'Find recovery opportunities'
                            ? (step === 'detecting' ? 'Running' : step === 'completed' ? 'Complete' : item.idle)
                            : (step === 'completed' ? 'Required to unlock workflow' : item.idle);
                  return (
                    <li key={item.label} className="grid px-4 py-2.5 sm:grid-cols-[58px_minmax(0,1fr)_128px] sm:px-5">
                      <div className="font-mono text-[10px] font-medium text-[#8A99A4] sm:pt-1">
                        00:{String(index * 4 + 3).padStart(2, '0')}
                      </div>
                      <div className="relative min-w-0 sm:border-l sm:border-[#DCE8EE] sm:pl-5">
                        <span className="absolute -left-[3.5px] top-1.5 hidden h-1.5 w-1.5 rounded-full bg-[#8A99A4] sm:block" />
                        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-tight">
                          <span className="text-[#66737F]">AUDIT-0{index + 1}</span>
                          <span className="text-[#66737F]">{value}</span>
                        </div>
                        <h2
                          className="mt-0.5 text-[13px] font-semibold leading-tight tracking-[-0.02em] text-[#182026] sm:text-[14px]"
                          style={{ fontFamily: 'Georgia, Merriweather, serif' }}
                        >
                          {item.label}
                        </h2>
                        <p className="mt-0.5 max-w-3xl text-[12px] leading-[1.45] text-[#4D5B66]">
                          {item.description}
                        </p>
                      </div>
                      <div className="mt-2 border-t border-[#DCE8EE] pt-2 sm:mt-0 sm:border-t-0 sm:pt-0.5 sm:text-right">
                        <span className="font-mono text-[10px] uppercase tracking-tight text-[#8A99A4]">
                          State
                        </span>
                        <strong className="mt-1 block font-mono text-[13px] font-medium tracking-tight text-[#182026]">
                          {value}
                        </strong>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <aside className="bg-[#F8FAFC] px-4 py-3 sm:px-5">
              <div className="border-b border-[#DCE8EE] pb-2.5">
                <h2
                  className="text-[19px] font-semibold leading-tight tracking-[-0.035em] text-[#182026]"
                  style={{ fontFamily: 'Georgia, Merriweather, serif' }}
                >
                  Workspace report
                </h2>
              </div>

              {step === 'completed' && teaser.categories.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {teaser.categories.map((category) => (
                    <span key={category} className="border border-[#CFE0EA] bg-white px-2 py-1 font-mono text-[10px] font-medium tracking-tight text-[#66737F]">
                      {category}
                    </span>
                  ))}
                </div>
              ) : null}
            </aside>
          </div>

        </div>
        <p className="mt-2 max-w-5xl font-mono text-[10px] leading-4 tracking-tight text-[#66737F]">
          {statusCopy[step]} Seller approval stays required. Margin prepares the path; the seller decides what moves.
        </p>
        </div>
      </section>
    </main>
  );
}
