import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Store, Shield, User, 
  Settings as SettingsIcon, 
  ChevronRight, AlertCircle, RefreshCw,
  Trash2, Activity, Info as InfoIcon,
  CreditCard
} from 'lucide-react';

import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { api, type AutoFileGateStatus } from '@/lib/api';
import { useTenant } from '@/contexts/TenantContext';
import { tenantRoute } from '@/lib/routes';

interface SellerProfile {
  id?: string;
  email?: string;
  name?: string;
  role?: string | null;
  tenant_name?: string | null;
  amazon_seller_id?: string;
  company_name?: string;
  linked_marketplaces?: string[];
  amazon_account_display_name?: string;
  last_sync_completed_at?: string;
  created_at?: string;
  last_login?: string;
  amazon_connected?: boolean;
  paypal_connected?: boolean;
  paypal_email?: string | null;
  paypal_payment_token?: string | null;
  billing_provider?: string | null;
}

const SUPPORT_TIER_COPY: Record<'community' | 'email' | 'priority' | 'dedicated', string> = {
  community: 'Community',
  email: 'Email',
  priority: 'Priority',
  dedicated: 'Dedicated'
};

const marketplaceNames: Record<string, { name: string; flag: string }> = {
  ATVPDKIKX0DER: { name: 'United States', flag: 'US' },
  A1PA6795UKMFR9: { name: 'Germany', flag: 'DE' },
  A1RKKUPIHCS9HS: { name: 'Spain', flag: 'ES' },
  A13V1IB3VIYZZH: { name: 'France', flag: 'FR' },
  A1F83G8C2ARO7P: { name: 'United Kingdom', flag: 'UK' },
  A1VC38T7YXB528: { name: 'Japan', flag: 'JP' },
  A1AM78C64UM0Y8: { name: 'India', flag: 'IN' },
  A2EUQ1WTGCTBG2: { name: 'Canada', flag: 'CA' },
  A39IBJ37TRP1C6: { name: 'Australia', flag: 'AU' },
  A2Q3Y263D00KWC: { name: 'Brazil', flag: 'BR' },
};

const Settings = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams<{ tenantSlug?: string }>();
  const { tenant, planLimits, isReady } = useTenant();

  const activeTenantSlug = tenantSlug || tenant?.slug || null;
  const [sellerProfile, setSellerProfile] = useState<SellerProfile>({});
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [autoFileEnabled, setAutoFileEnabled] = useState(true);
  const [autoFileGateStatus, setAutoFileGateStatus] = useState<AutoFileGateStatus | null>(null);
  const [loadingAutoFile, setLoadingAutoFile] = useState(true);
  const [savingAutoFile, setSavingAutoFile] = useState(false);
  const [autoFileError, setAutoFileError] = useState<string | null>(null);

  useEffect(() => {
    if (!activeTenantSlug) {
      setLoadingProfile(false);
      return;
    }

    const loadSellerProfile = async () => {
      setLoadingProfile(true);
      try {
        const [meRes, statusRes] = await Promise.all([
          api.getMe(activeTenantSlug),
          api.getIntegrationsStatus(activeTenantSlug)
        ]);

        let nextProfile: SellerProfile = {};

        if (meRes.ok && meRes.data) {
          const basicData = meRes.data as any;
          nextProfile = {
            ...nextProfile,
            id: basicData.id,
            email: basicData.email,
            name: basicData.name,
            role: basicData.role ?? null,
            tenant_name: basicData.tenant_name ?? tenant?.name ?? null,
            company_name: basicData.company_name,
            amazon_seller_id: basicData.amazon_seller_id,
            amazon_connected: basicData.amazon_connected || false,
            paypal_connected: basicData.paypal_connected || false,
            paypal_email: basicData.paypal_email || null,
            paypal_payment_token: basicData.paypal_payment_token || null,
            billing_provider: basicData.billing_provider || null,
            created_at: basicData.created_at,
            last_login: basicData.last_login || basicData.last_login_at,
          };
        }

        if (statusRes.ok && statusRes.data) {
          const status = statusRes.data as any;
          nextProfile = {
            ...nextProfile,
            amazon_connected: status.amazon_connected ?? nextProfile.amazon_connected ?? false,
            amazon_seller_id: nextProfile.amazon_seller_id || status.amazon_account?.seller_id,
            amazon_account_display_name: status.amazon_account?.display_name || nextProfile.amazon_account_display_name,
            linked_marketplaces: Array.isArray(status.amazon_account?.marketplaces) ? status.amazon_account.marketplaces : [],
            last_sync_completed_at: status.lastIngest || status.lastSync || nextProfile.last_sync_completed_at,
          };
        }

        setSellerProfile(nextProfile);
      } catch (error) {
        console.error('Failed to load settings profile:', error);
      } finally {
        setLoadingProfile(false);
      }
    };

    void loadSellerProfile();
  }, [activeTenantSlug, tenant?.name]);

  const loadAutoFilePreference = useCallback(async (options?: { silent?: boolean }): Promise<boolean> => {
    if (!activeTenantSlug) {
      setLoadingAutoFile(false);
      setAutoFileGateStatus(null);
      return false;
    }

    if (!options?.silent) {
      setLoadingAutoFile(true);
    }
    setAutoFileError(null);

    try {
      const response = await api.getAutoFilePreference(activeTenantSlug);
      if (response.ok && response.data?.data) {
        setAutoFileEnabled(response.data.data.enabled);
        setAutoFileGateStatus(response.data.data.gateStatus ?? null);
        return true;
      }

      setAutoFileError(response.error || 'Failed to load auto-file setting');
      return false;
    } catch (error) {
      console.error('Failed to load auto-file preference:', error);
      setAutoFileError('Failed to load auto-file setting');
      return false;
    } finally {
      if (!options?.silent) {
        setLoadingAutoFile(false);
      }
    }
  }, [activeTenantSlug]);

  useEffect(() => {
    void loadAutoFilePreference();
  }, [loadAutoFilePreference]);

  const handleAutoFileChange = async (enabled: boolean) => {
    if (!activeTenantSlug) {
      setAutoFileError('Workspace context is required before Auto-File can be changed.');
      return;
    }

    const previousValue = autoFileEnabled;
    const previousGateStatus = autoFileGateStatus;
    setSavingAutoFile(true);
    setAutoFileError(null);

    try {
      const response = await api.saveAutoFilePreference(enabled, activeTenantSlug);
      if (!response.ok || !response.data?.data) {
        setAutoFileEnabled(previousValue);
        setAutoFileGateStatus(previousGateStatus);
        setAutoFileError(response.error || 'Failed to save auto-file setting');
        return;
      }

      setAutoFileEnabled(response.data.data.enabled);
      setAutoFileGateStatus(response.data.data.gateStatus ?? null);

      const refreshed = await loadAutoFilePreference({ silent: true });
      if (!refreshed) {
        setAutoFileError('Auto-File was saved, but Margin could not refresh the latest filing status.');
      }
    } catch (error) {
      console.error('Failed to save auto-file preference:', error);
      setAutoFileEnabled(previousValue);
      setAutoFileGateStatus(previousGateStatus);
      setAutoFileError('Failed to save auto-file setting');
    } finally {
      setSavingAutoFile(false);
    }
  };

  const supportTier = planLimits?.supportTier ? SUPPORT_TIER_COPY[planLimits.supportTier] : 'Not available';
  const isAmazonConnected = sellerProfile.amazon_connected ?? false;
  const linkedMarketplaces = sellerProfile.linked_marketplaces || [];
  const paypalActive = !!sellerProfile.paypal_payment_token || !!sellerProfile.paypal_email;

  const autoFileGateCopy = loadingAutoFile
    ? 'Checking saved seller intent and filing gates.'
    : savingAutoFile
      ? 'Saving seller intent and confirming backend truth.'
      : autoFileEnabled
        ? autoFileGateStatus?.message || 'Auto-File is on. System filing gates will still be checked before any submission.'
        : 'Auto-File is off. Global filing gates, payment checks, and evidence requirements remain unchanged.';

  const autoFileGateMeta = autoFileGateStatus && autoFileEnabled
    ? [
        autoFileGateStatus.globalFilingEnabled === null
          ? 'Global gate unknown'
          : autoFileGateStatus.globalFilingEnabled === false
            ? 'Global paused'
            : 'Global gate active',
        autoFileGateStatus.queueAvailable === null
          ? 'Dispatch gate unknown'
          : autoFileGateStatus.queueAvailable === false
            ? 'Dispatch paused'
            : 'Dispatch available',
        autoFileGateStatus.paymentRequired ? 'Payment required' : 'Payment gate clear',
        autoFileGateStatus.evidenceBlockedCount > 0 ? `${autoFileGateStatus.evidenceBlockedCount} need evidence` : 'Evidence gate clear'
      ].join(' · ')
    : null;

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Not available';
    try {
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) return 'Not available';
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return 'Not available';
    }
  };

  if (isReady && !activeTenantSlug) {
    return (
      <PageLayout title="Settings" noPadding>
        <div className="flex h-screen items-center justify-center bg-[#FAFAF7]">
          <div className="max-w-md border border-[#E5E7EB] bg-white p-10 text-center shadow-sm">
            <Shield className="mx-auto mb-4 h-10 w-10 text-[#9CA3AF]" />
            <h1 className="font-lora text-2xl font-normal tracking-tight text-[#111827]">Workspace Required</h1>
            <p className="mt-3 text-sm text-[#6B7280]">
              Account settings only load inside an active workspace. Please select a marketplace to continue.
            </p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Settings" noPadding>
      <div className="min-h-screen bg-[#FAFAF7] font-sans text-[#111827]">
        {/* Forensic Identity Header */}
        <div className="border-b border-[#E5E7EB] bg-white px-8 py-10">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="h-px w-6 bg-[#0B74DE]" />
                <span className="text-[10px] font-bold uppercase tracking-tight text-[#0B74DE]">Workspace Configuration</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="bg-[#F3F5F4] text-[#6B7280] border-transparent font-bold text-[10px] px-2 py-0.5 rounded-md uppercase tracking-tight">
                  Status: Active
                </Badge>
              </div>
            </div>
            <h1 className="mb-4 font-lora text-[32px] font-normal leading-tight tracking-tight text-[#111827]">
              Settings
            </h1>
            <p className="max-w-2xl text-[15px] font-normal leading-relaxed tracking-tight text-[#6B7280]">
              Manage your workspace identity, filing authority, and account security. 
              Changes here are reflected across your forensic auditing environment.
            </p>
          </div>
        </div>

        {/* Settings Navigation Rail */}
        <div className="border-b border-[#E5E7EB] bg-[#F9FAFB] px-8">
          <div className="mx-auto flex max-w-5xl items-center gap-8">
            <button className="border-b-2 border-[#0B74DE] py-4 text-[11px] font-bold uppercase tracking-tight text-[#111827]">
              Account Identity
            </button>
            <button className="py-4 text-[11px] font-bold uppercase tracking-tight text-[#9CA3AF] hover:text-[#6B7280] transition-colors">
              Workspace
            </button>
            <button className="py-4 text-[11px] font-bold uppercase tracking-tight text-[#9CA3AF] hover:text-[#6B7280] transition-colors">
              Security
            </button>
            <button className="py-4 text-[11px] font-bold uppercase tracking-tight text-[#9CA3AF] hover:text-[#6B7280] transition-colors">
              Billing
            </button>
          </div>
        </div>

        {/* Main Settings Content */}
        <div className="mx-auto max-w-5xl px-8 py-12">
          <div className="space-y-12">
            
            {/* Section: Account Identity */}
            <section>
              <div className="mb-6 flex items-end justify-between">
                <div>
                  <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">Identity & Access</h2>
                  <p className="mt-1 text-[13px] text-[#6B7280]">Authenticated user and workspace role information.</p>
                </div>
              </div>
              
              <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-sm overflow-hidden">
                <div className="divide-y divide-[#F3F5F4]">
                  <div className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F3F5F4] text-[#4B5563]">
                        <User className="h-5 w-5" strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-tight text-[#9CA3AF]">User Name</p>
                        <p className="text-[14px] font-semibold text-[#111827]">{sellerProfile.name || 'Not set'}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="text-[11px] font-bold text-[#0B74DE] hover:bg-[#F3F5F4]">Edit</Button>
                  </div>

                  <div className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F3F5F4] text-[#4B5563]">
                        <SettingsIcon className="h-5 w-5" strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-tight text-[#9CA3AF]">Email Address</p>
                        <p className="text-[14px] font-semibold text-[#111827]">{sellerProfile.email || 'Not available'}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-transparent font-bold text-[10px] px-2 py-0.5 rounded-md uppercase tracking-tight">Verified</Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#F3F5F4]">
                    <div className="p-6">
                      <p className="text-[10px] font-bold uppercase tracking-tight text-[#9CA3AF]">User ID</p>
                      <p className="mt-1 text-[13px] font-semibold text-[#111827] break-all">{sellerProfile.id || 'Not available'}</p>
                    </div>
                    <div className="p-6">
                      <p className="text-[10px] font-bold uppercase tracking-tight text-[#9CA3AF]">Workspace Role</p>
                      <p className="mt-1 text-[14px] font-semibold text-[#111827]">{sellerProfile.role || 'Member'}</p>
                    </div>
                    <div className="p-6">
                      <p className="text-[10px] font-bold uppercase tracking-tight text-[#9CA3AF]">Last Login</p>
                      <p className="mt-1 text-[14px] font-semibold text-[#111827]">{formatDate(sellerProfile.last_login)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section: Platform Connectivity */}
            <section>
              <div className="mb-6 flex items-end justify-between">
                <div>
                  <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">Platform Connectivity</h2>
                  <p className="mt-1 text-[13px] text-[#6B7280]">Status of external data sources and billing connections.</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-8 border-[#E5E7EB] text-[11px] font-bold uppercase tracking-tight text-[#4B5563] hover:bg-[#F3F5F4]"
                  onClick={() => navigate(tenantRoute(activeTenantSlug || '', '/integrations-hub'))}
                >
                  Manage Integrations
                </Button>
              </div>

              <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-sm overflow-hidden">
                <div className="divide-y divide-[#F3F5F4]">
                  <div className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F3F5F4] text-[#4B5563]">
                        <Store className="h-5 w-5" strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-tight text-[#9CA3AF]">Amazon SP-API</p>
                        <p className="text-[14px] font-semibold text-[#111827]">{isAmazonConnected ? 'Linked' : 'Not connected'}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn(
                      "font-bold text-[10px] px-2 py-0.5 rounded-md uppercase tracking-tight border-transparent",
                      isAmazonConnected ? "bg-emerald-500/10 text-emerald-700" : "bg-[#F3F5F4] text-[#6B7280]"
                    )}>
                      {isAmazonConnected ? 'Active' : 'Required'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-6">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F3F5F4] text-[#4B5563]">
                        <CreditCard className="h-5 w-5" strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-tight text-[#9CA3AF]">PayPal Billing</p>
                        <p className="text-[14px] font-semibold text-[#111827]">{paypalActive ? 'Connected' : 'Not available'}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn(
                      "font-bold text-[10px] px-2 py-0.5 rounded-md uppercase tracking-tight border-transparent",
                      paypalActive ? "bg-emerald-500/10 text-emerald-700" : "bg-[#F3F5F4] text-[#6B7280]"
                    )}>
                      {paypalActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#F3F5F4]">
                    <div className="p-6">
                      <p className="text-[10px] font-bold uppercase tracking-tight text-[#9CA3AF]">Last Ingest</p>
                      <p className="mt-1 text-[14px] font-semibold text-[#111827]">
                        {sellerProfile.last_sync_completed_at ? formatDate(sellerProfile.last_sync_completed_at) : 'Not available'}
                      </p>
                    </div>
                    <div className="p-6">
                      <p className="text-[10px] font-bold uppercase tracking-tight text-[#9CA3AF]">Linked Marketplaces</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {linkedMarketplaces.length > 0 ? (
                          linkedMarketplaces.map((mId) => (
                            <Badge key={mId} variant="outline" className="bg-[#F3F5F4] text-[#4B5563] border-[#E5E7EB] font-bold text-[10px] px-2 py-0.5 rounded-md uppercase tracking-tight">
                              {marketplaceNames[mId]?.flag || 'GL'} · {marketplaceNames[mId]?.name || mId}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-[13px] font-medium text-[#9CA3AF]">No marketplaces linked</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section: Filing Authority */}
            <section>
              <div className="mb-6">
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">Filing Authority</h2>
                <p className="mt-1 text-[13px] text-[#6B7280]">Control how cases are submitted to Amazon Support.</p>
              </div>

              <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-sm overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between gap-8">
                    <div className="max-w-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-[15px] font-semibold text-[#111827]">Auto-File Cases</h3>
                        {savingAutoFile && <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#0B74DE]" />}
                      </div>
                      <p className="text-[13px] leading-relaxed text-[#6B7280]">
                        {autoFileEnabled
                          ? 'Eligible cases can be submitted automatically when all filing requirements are met.'
                          : 'Cases will wait for your manual review and approval before filing.'}
                      </p>
                      <div className="mt-4 flex items-center gap-3">
                        <div className={cn(
                          "h-2 w-2 rounded-full",
                          autoFileEnabled ? "bg-emerald-500" : "bg-[#9CA3AF]"
                        )} />
                        <span className="text-[11px] font-bold uppercase tracking-tight text-[#6B7280]">
                          {autoFileEnabled ? 'Authority: Delegated' : 'Authority: Manual Approval'}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Switch
                        checked={autoFileEnabled}
                        onCheckedChange={(checked) => void handleAutoFileChange(checked)}
                        disabled={loadingAutoFile || savingAutoFile}
                        className="data-[state=checked]:bg-[#0B74DE]"
                      />
                      <span className="text-[10px] font-bold uppercase tracking-tight text-[#9CA3AF]">
                        {savingAutoFile ? 'Updating...' : autoFileEnabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submission Gate Status - Restored detailed feedback */}
                <div className="border-t border-[#F3F5F4] bg-[#F9FAFB] p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="h-3.5 w-3.5 text-[#9CA3AF]" />
                    <span className="text-[11px] font-bold uppercase tracking-tight text-[#6B7280]">Submission Gate Status</span>
                  </div>
                  <p className="text-[13px] text-[#4B5563] leading-relaxed">
                    {autoFileGateCopy}
                  </p>
                  {autoFileGateMeta && (
                    <div className="mt-3 flex items-center gap-2">
                      <Activity className="h-3 w-3 text-[#0B74DE]" />
                      <p className="text-[11px] font-bold uppercase tracking-tight text-[#0B74DE]">
                        {autoFileGateMeta}
                      </p>
                    </div>
                  )}
                  {autoFileError && (
                    <div className="mt-4 flex items-center gap-2 rounded-lg bg-rose-50 p-3 text-rose-600">
                      <AlertCircle className="h-3.5 w-3.5" />
                      <p className="text-[12px] font-medium">{autoFileError}</p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Section: Support & Plan */}
            <section>
              <div className="mb-6">
                <h2 className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">Workspace Support</h2>
                <p className="mt-1 text-[13px] text-[#6B7280]">Your current plan limits and direct support channels.</p>
              </div>

              <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-sm divide-y divide-[#F3F5F4]">
                <div className="p-6 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-tight text-[#9CA3AF]">Current Support Tier</p>
                    <p className="mt-1 text-[15px] font-semibold text-[#111827]">{supportTier}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="h-9 border-[#E5E7EB] text-[11px] font-bold uppercase tracking-tight text-[#4B5563] hover:bg-[#F3F5F4]"
                    onClick={() => navigate(tenantRoute(activeTenantSlug || '', '/help'))}
                  >
                    Open Support Channel
                  </Button>
                </div>
                
                <div className="p-6">
                  <div className="flex items-center gap-2 text-amber-600 mb-2">
                    <InfoIcon className="h-3.5 w-3.5" />
                    <span className="text-[11px] font-bold uppercase tracking-tight">Plan Context</span>
                  </div>
                  <p className="text-[13px] text-[#6B7280] leading-relaxed">
                    Support guidance is based on your current tenant plan limits. 
                    For direct forensic help with a specific case, please use the Support channel above.
                  </p>
                </div>
              </div>
            </section>

            {/* Danger Zone */}
            <section className="pt-10">
              <div className="rounded-xl border border-rose-100 bg-rose-50/30 p-8">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-[15px] font-bold text-rose-700">Workspace Management</h3>
                    <p className="mt-1 text-[13px] text-rose-600/80">Manage workspace lifecycle and access persistence.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" className="text-rose-600 hover:bg-rose-100 hover:text-rose-700 text-[11px] font-bold uppercase tracking-tight">
                      Leave Workspace
                    </Button>
                  </div>
                </div>
              </div>
            </section>

          </div>
        </div>

        {/* Registry Footer */}
        <div className="mx-auto max-w-5xl px-8 pb-20 pt-10">
          <div className="border-t border-[#E5E7EB] pt-8 text-center">
            <div className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-tight text-[#9CA3AF]">
              <Shield className="h-3 w-3" />
              Workspace Authority Registry • US-EAST-1
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Settings;
