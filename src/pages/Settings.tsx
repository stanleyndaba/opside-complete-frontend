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
          <div className="max-w-md border border-[#DCE8EE] bg-white p-10 text-center shadow-sm">
            <Shield className="mx-auto mb-4 h-10 w-10 text-[#9CA3AF]" />
            <h1 className="font-lora text-2xl font-normal tracking-tight text-[#182026]">Workspace Required</h1>
            <p className="mt-3 text-sm text-[#66737F]">
              Account settings only load inside an active workspace. Please select a marketplace to continue.
            </p>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Settings" noPadding>
      <div className="min-h-screen bg-[#FAFAF7] text-[#182026]">
        <div className="border-b border-[#DCE8EE] bg-[#FAFAF7] px-4 py-7 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto flex max-w-[1180px] flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <p className="text-[13px] font-medium tracking-tight text-[#66737F]">Account control</p>
              <h1 className="mt-1.5 font-lora text-[34px] font-normal leading-tight tracking-tight text-[#182026] sm:text-[38px]">Settings</h1>
              <p className="mt-2.5 text-[14px] leading-6 text-[#66737F]">Manage workspace identity, connected services, filing authority, support, and account access from one controlled record.</p>
            </div>
            <Badge variant="outline" className="w-fit rounded-md border-[#DCE8EE] bg-white px-2.5 py-1 text-[12px] font-medium tracking-tight text-[#4D5B66]">Workspace active</Badge>
          </div>
        </div>

        <main className="mx-auto max-w-[1180px] px-4 py-7 sm:px-6 lg:px-8">
          <div className="space-y-8">
            
            {/* Section: Account Identity */}
            <section>
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-[13px] font-medium tracking-tight text-[#66737F]">Identity & Access</h2>
                  <p className="mt-1 text-[13px] text-[#66737F]">Your account identity and access role in this workspace.</p>
                </div>
              </div>
              
              <div className="overflow-hidden rounded-[10px] border border-[#DCE8EE] bg-white shadow-[0_1px_2px_rgba(24,32,38,0.03)]">
                <div className="divide-y divide-[#E7EEF2]">
                  <div className="flex items-center justify-between p-4 sm:p-5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#F7FAFC] text-[#4D5B66]">
                        <User className="h-5 w-5" strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-[12px] font-medium tracking-tight text-[#66737F]">User Name</p>
                        <p className="text-[14px] font-semibold text-[#182026]">{sellerProfile.name || 'Not set'}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="h-9 text-[13px] font-medium tracking-tight text-[#0B74DE] hover:bg-[#F7FAFC]">Edit</Button>
                  </div>

                  <div className="flex items-center justify-between p-4 sm:p-5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#F7FAFC] text-[#4D5B66]">
                        <SettingsIcon className="h-5 w-5" strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-[12px] font-medium tracking-tight text-[#66737F]">Email Address</p>
                        <p className="text-[14px] font-semibold text-[#182026]">{sellerProfile.email || 'Not available'}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="rounded-md border-[#DCE8EE] bg-[#F6FAFE] px-2 py-0.5 text-[12px] font-medium tracking-tight text-[#0B74DE]">Verified</Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 divide-y divide-[#E7EEF2] md:divide-x md:divide-y-0">
                    <div className="p-4 sm:p-5">
                      <p className="text-[12px] font-medium tracking-tight text-[#66737F]">User ID</p>
                      <p className="mt-1 text-[13px] font-semibold text-[#182026] break-all">{sellerProfile.id || 'Not available'}</p>
                    </div>
                    <div className="p-4 sm:p-5">
                      <p className="text-[12px] font-medium tracking-tight text-[#66737F]">Workspace Role</p>
                      <p className="mt-1 text-[14px] font-semibold text-[#182026]">{sellerProfile.role || 'Member'}</p>
                    </div>
                    <div className="p-4 sm:p-5">
                      <p className="text-[12px] font-medium tracking-tight text-[#66737F]">Last Login</p>
                      <p className="mt-1 text-[14px] font-semibold text-[#182026]">{formatDate(sellerProfile.last_login)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Section: Platform Connectivity */}
            <section>
              <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <h2 className="text-[13px] font-medium tracking-tight text-[#66737F]">Platform Connectivity</h2>
                  <p className="mt-1 text-[13px] text-[#66737F]">The account connections that keep this workspace operating.</p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-8 border-[#DCE8EE] text-[11px] font-bold tracking-tight text-[#4D5B66] hover:bg-[#F7FAFC]"
                  onClick={() => navigate(tenantRoute(activeTenantSlug || '', '/integrations-hub'))}
                >
                  Manage Integrations
                </Button>
              </div>

              <div className="overflow-hidden rounded-[10px] border border-[#DCE8EE] bg-white shadow-[0_1px_2px_rgba(24,32,38,0.03)]">
                <div className="divide-y divide-[#E7EEF2]">
                  <div className="flex items-center justify-between p-4 sm:p-5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#F7FAFC] text-[#4D5B66]">
                        <Store className="h-5 w-5" strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-[12px] font-medium tracking-tight text-[#66737F]">Amazon Seller Central</p>
                        <p className="text-[14px] font-semibold text-[#182026]">{isAmazonConnected ? 'Linked' : 'Not connected'}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn(
                      "rounded-md border px-2 py-0.5 text-[12px] font-medium tracking-tight",
                      isAmazonConnected ? "border-[#DCE8EE] bg-[#F6FAFE] text-[#0B74DE]" : "border-[#DCE8EE] bg-[#F7FAFC] text-[#66737F]"
                    )}>
                      {isAmazonConnected ? 'Active' : 'Required'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 sm:p-5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[#F7FAFC] text-[#4D5B66]">
                        <CreditCard className="h-5 w-5" strokeWidth={1.5} />
                      </div>
                      <div>
                        <p className="text-[12px] font-medium tracking-tight text-[#66737F]">PayPal Billing</p>
                        <p className="text-[14px] font-semibold text-[#182026]">{paypalActive ? 'Connected' : 'Not available'}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn(
                      "rounded-md border px-2 py-0.5 text-[12px] font-medium tracking-tight",
                      paypalActive ? "border-[#DCE8EE] bg-[#F6FAFE] text-[#0B74DE]" : "border-[#DCE8EE] bg-[#F7FAFC] text-[#66737F]"
                    )}>
                      {paypalActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 divide-y divide-[#E7EEF2] md:divide-x md:divide-y-0">
                    <div className="p-4 sm:p-5">
                      <p className="text-[12px] font-medium tracking-tight text-[#66737F]">Last Ingest</p>
                      <p className="mt-1 text-[14px] font-semibold text-[#182026]">
                        {sellerProfile.last_sync_completed_at ? formatDate(sellerProfile.last_sync_completed_at) : 'Not available'}
                      </p>
                    </div>
                    <div className="p-4 sm:p-5">
                      <p className="text-[12px] font-medium tracking-tight text-[#66737F]">Linked Marketplaces</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {linkedMarketplaces.length > 0 ? (
                          linkedMarketplaces.map((mId) => (
                            <Badge key={mId} variant="outline" className="bg-[#F7FAFC] text-[#4D5B66] border-[#DCE8EE] font-bold text-[10px] px-2 py-0.5 rounded-md tracking-tight">
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
                <h2 className="text-[13px] font-medium tracking-tight text-[#66737F]">Filing Authority</h2>
                <p className="mt-1 text-[13px] text-[#66737F]">Choose whether eligible cases wait for your approval or can be submitted once every filing gate is satisfied.</p>
              </div>

              <div className="overflow-hidden rounded-[10px] border border-[#DCE8EE] bg-white shadow-[0_1px_2px_rgba(24,32,38,0.03)]">
                <div className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-8">
                    <div className="max-w-xl">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-[16px] font-semibold tracking-tight text-[#182026]">Auto-file eligible cases</h3>
                        {savingAutoFile && <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#0B74DE]" />}
                      </div>
                      <p className="text-[13px] leading-relaxed text-[#66737F]">
                        {autoFileEnabled
                          ? 'Eligible cases can be submitted automatically when all filing requirements are met.'
                          : 'Cases will wait for your manual review and approval before filing.'}
                      </p>
                      <div className="mt-4 flex items-center gap-3">
                        <div className={cn(
                          "h-2 w-2 rounded-full",
                          autoFileEnabled ? "bg-[#0B74DE]" : "bg-[#9CA3AF]"
                        )} />
                        <span className="text-[12px] font-medium tracking-tight text-[#4D5B66]">
                          {autoFileEnabled ? 'Seller authority: delegated when gates are clear' : 'Seller authority: manual approval required'}
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
                      <span className="text-[12px] font-medium tracking-tight text-[#4D5B66]">
                        {savingAutoFile ? 'Updating' : autoFileEnabled ? 'On' : 'Off'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Submission Gate Status - Restored detailed feedback */}
                <div className="border-t border-[#E7EEF2] bg-[#F7FAFC] p-4 sm:p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="h-3.5 w-3.5 text-[#66737F]" />
                    <span className="text-[13px] font-medium tracking-tight text-[#4D5B66]">Submission gate status</span>
                  </div>
                  <p className="text-[13px] text-[#4D5B66] leading-relaxed">
                    {autoFileGateCopy}
                  </p>
                  {autoFileGateMeta && (
                    <div className="mt-3 flex items-center gap-2">
                      <Activity className="h-3 w-3 text-[#0B74DE]" />
                      <p className="text-[12px] font-medium tracking-tight text-[#0B74DE]">
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
                <h2 className="text-[13px] font-medium tracking-tight text-[#66737F]">Workspace Support</h2>
                <p className="mt-1 text-[13px] text-[#66737F]">Your current support level and the direct route for help.</p>
              </div>

              <div className="overflow-hidden rounded-[10px] border border-[#DCE8EE] bg-white shadow-[0_1px_2px_rgba(24,32,38,0.03)] divide-y divide-[#E7EEF2]">
                <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                  <div>
                    <p className="text-[12px] font-medium tracking-tight text-[#66737F]">Current Support Tier</p>
                    <p className="mt-1 text-[15px] font-semibold text-[#182026]">{supportTier}</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="h-9 rounded-md border-[#DCE8EE] bg-white px-3 text-[13px] font-medium tracking-tight text-[#4D5B66] hover:bg-[#F7FAFC]"
                    onClick={() => navigate(tenantRoute(activeTenantSlug || '', '/help'))}
                  >
                    Open Support Channel
                  </Button>
                </div>
                
                <div className="p-4 sm:p-5">
                  <div className="flex items-center gap-2 text-[#0B74DE] mb-2">
                    <InfoIcon className="h-3.5 w-3.5" />
                    <span className="text-[11px] font-bold tracking-tight">Plan Context</span>
                  </div>
                  <p className="text-[13px] text-[#66737F] leading-relaxed">
                    Support guidance reflects the plan available to this workspace. Use the support route above when you need help with a specific case or account task.
                  </p>
                </div>
              </div>
            </section>

            {/* Danger Zone */}
            <section className="pt-10">
              <div className="rounded-[10px] border border-rose-200 bg-white p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-[16px] font-semibold tracking-tight text-rose-800">Workspace management</h3>
                    <p className="mt-1 text-[13px] text-rose-600/80">Manage workspace membership and access persistence.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" className="h-9 rounded-md border border-rose-200 text-[13px] font-medium tracking-tight text-rose-700 hover:bg-rose-50 hover:text-rose-800">
                      Leave Workspace
                    </Button>
                  </div>
                </div>
              </div>
            </section>

          </div>
        </main>

        <div className="mx-auto max-w-[1180px] px-4 pb-10 sm:px-6 lg:px-8">
          <p className="border-t border-[#DCE8EE] pt-5 text-[12px] leading-5 text-[#66737F]">Changes to filing authority are stored as seller intent. Margin still checks payment, evidence, and global filing gates before a case can be submitted.</p>
        </div>
      </div>
    </PageLayout>
  );
};

export default Settings;
