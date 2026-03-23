import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, CreditCard, Store } from 'lucide-react';

import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useTenant } from '@/contexts/TenantContext';
import { tenantRoute } from '@/lib/routes';

interface SellerProfile {
  id?: string;
  email?: string;
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

const Settings = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams<{ tenantSlug?: string }>();
  const { tenant, planLimits, isReady } = useTenant();

  const activeTenantSlug = tenantSlug || tenant?.slug || null;
  const [sellerProfile, setSellerProfile] = useState<SellerProfile>({});
  const [loadingProfile, setLoadingProfile] = useState(true);

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
            company_name: basicData.name || basicData.company_name,
            amazon_seller_id: basicData.amazon_seller_id || basicData.seller_id,
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
            company_name: nextProfile.company_name || status.amazon_account?.display_name,
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
  }, [activeTenantSlug]);

  const supportTier = planLimits?.supportTier ? SUPPORT_TIER_COPY[planLimits.supportTier] : 'Not available';
  const isAmazonConnected = sellerProfile.amazon_connected ?? false;
  const linkedMarketplaces = sellerProfile.linked_marketplaces || [];
  const paypalActive = !!sellerProfile.paypal_payment_token || !!sellerProfile.paypal_email;

  const connectionScope = useMemo(() => {
    if (linkedMarketplaces.length > 0) {
      return `${linkedMarketplaces.length} Marketplace${linkedMarketplaces.length === 1 ? '' : 's'} Linked`;
    }
    if (isAmazonConnected) return 'Seller Account Linked';
    return 'Not linked';
  }, [isAmazonConnected, linkedMarketplaces.length]);

  const lastActivity = sellerProfile.last_sync_completed_at || sellerProfile.last_login;

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Not available';
    try {
      const date = new Date(dateString);
      if (Number.isNaN(date.getTime())) return 'Not available';

      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
      if (diffHours < 24) return `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
      if (diffDays < 30) return `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;

      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return 'Not available';
    }
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

  if (isReady && !activeTenantSlug) {
    return (
      <PageLayout title="Account Control Center" midnight>
        <div className="min-h-screen bg-[#050505]">
          <div className="container mx-auto px-8 pt-10 pb-20">
            <Card className="bg-[#0c0c0c] border-white/5 text-white rounded-2xl">
              <CardContent className="p-8 space-y-3">
                <h1 className="text-xl font-sans font-bold text-white tracking-tight">Settings unavailable</h1>
                <p className="text-sm text-white/50 font-sans">
                  A tenant workspace is required before account settings can be loaded.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout title="Account Control Center" midnight>
      <div className="min-h-screen bg-[#070707] text-white relative overflow-hidden">
        <div
          className="fixed inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")'
          }}
        />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#070707] to-[#050505]" />

        <div className="relative z-10 container mx-auto px-8 pt-10 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-24 space-y-8">
                <div>
                  <h1 className="text-2xl font-sans font-light text-white tracking-tight mb-1">Settings</h1>
                  <p className="text-[10px] text-white/20 font-sans font-bold uppercase tracking-tight">
                    SYSTEM_CONFIG // READ_ONLY
                  </p>
                </div>

                <nav className="space-y-1">
                  <div className="group relative w-full flex items-center gap-4 px-4 py-3 rounded-xl bg-[#111111] border border-white/10 text-white/80">
                    <Building2 className="h-4.5 w-4.5 text-white/50" />
                    <span className="text-[11px] font-sans font-bold uppercase tracking-tight">
                      Seller Profile
                    </span>
                  </div>
                </nav>
              </div>
            </div>

            <div className="lg:col-span-3">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <h2 className="text-xl font-sans font-bold text-white tracking-tight">Seller Profile</h2>
                  <p className="text-sm text-white/50 font-sans mt-3 max-w-2xl">
                    This page currently shows live account and workspace information. Editable settings that are not yet backed by real persistence have been removed.
                  </p>
                </div>

                <Card className="bg-[#0c0c0c] border-white/5 text-white shadow-2xl relative overflow-hidden rounded-2xl backdrop-blur-3xl group transition-all duration-500">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.05] pointer-events-none group-hover:opacity-[0.08] transition-opacity duration-700">
                    <Building2 className="h-48 w-48 text-white rotate-12" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] via-transparent to-transparent pointer-events-none" />

                  <CardContent className="p-8 relative z-10">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-2xl font-sans font-bold text-white tracking-tight">
                            {sellerProfile.company_name || sellerProfile.amazon_account_display_name || (loadingProfile ? 'Loading profile...' : 'Not available')}
                          </h3>
                          <div className="flex items-center gap-3 mt-2">
                            <Badge
                              variant="outline"
                              className={cn(
                                'text-[10px] font-sans font-bold uppercase tracking-tight px-3 py-1',
                                isAmazonConnected
                                  ? 'bg-white/5 text-white border-white/10'
                                  : 'bg-white/5 text-white/40 border-white/10'
                              )}
                            >
                              {isAmazonConnected ? 'VERIFIED_CONNECTION' : 'UNVERIFIED_CONNECTION'}
                            </Badge>
                            {sellerProfile.amazon_seller_id && (
                              <span className="text-[10px] text-white/20 font-sans font-bold uppercase tracking-tight">
                                ID: {sellerProfile.amazon_seller_id}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-10 pt-4">
                          <div className="space-y-2">
                            <p className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-tight">Connection Scope</p>
                            <p className="text-sm font-sans font-bold text-white/80 tracking-tight">{connectionScope}</p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-tight">Last Activity</p>
                            <p className="text-sm font-sans font-bold text-white/80 tracking-tight">{formatDate(lastActivity)}</p>
                          </div>
                          <div className="space-y-2">
                            <p className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-tight">System Age</p>
                            <p className="text-sm font-sans font-bold text-white/80 tracking-tight">{formatDate(sellerProfile.created_at)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        <Button
                          className="bg-white text-black hover:bg-white/90 transition-all active:scale-[0.98] rounded-xl h-12 px-8 font-sans font-bold uppercase tracking-tight text-xs shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                          onClick={() => navigate(tenantRoute(activeTenantSlug || '', '/integrations-hub'))}
                          disabled={!activeTenantSlug}
                        >
                          Manage Integrations
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="bg-[#0c0c0c] border-white/5 text-white shadow-xl rounded-2xl backdrop-blur-3xl overflow-hidden group">
                    <CardHeader className="border-b border-white/5 bg-white/[0.01] px-6 py-4">
                      <CardTitle className="text-[10px] font-sans font-bold text-white/30 uppercase tracking-tight">Platform Connectivity</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                      <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl transition-all">
                        <div className="flex items-center gap-3">
                          <Store className="h-4 w-4 text-white/40" />
                          <span className="text-xs font-sans font-bold text-white/80 tracking-tight">Amazon SP-API</span>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[9px] font-sans font-bold uppercase tracking-tight px-2 py-0.5',
                            isAmazonConnected
                              ? 'bg-white/5 text-white border-white/10'
                              : 'bg-white/5 text-white/40 border-white/10'
                          )}
                        >
                          {isAmazonConnected ? 'Linked' : 'Unverified'}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl transition-all">
                        <div className="flex items-center gap-3">
                          <CreditCard className="h-4 w-4 text-white/40" />
                          <span className="text-xs font-sans font-bold text-white/80 tracking-tight">PayPal Billing</span>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[9px] font-sans font-bold uppercase tracking-tight px-2 py-0.5',
                            paypalActive
                              ? 'bg-white/5 text-white border-white/10'
                              : 'bg-white/5 text-white/40 border-white/10'
                          )}
                        >
                          {paypalActive ? 'Active' : 'Not available'}
                        </Badge>
                      </div>

                      <div className="space-y-2 pt-2">
                        <p className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-tight">Last Ingest</p>
                        <p className="text-sm font-sans font-bold text-white/80 tracking-tight">
                          {sellerProfile.last_sync_completed_at ? formatDate(sellerProfile.last_sync_completed_at) : 'Not available'}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-tight">Marketplaces</p>
                        <div className="flex flex-wrap gap-2">
                          {linkedMarketplaces.length > 0 ? (
                            linkedMarketplaces.map((marketplaceId) => {
                              const marketplace = marketplaceNames[marketplaceId] || { name: marketplaceId, flag: 'GL' };
                              return (
                                <Badge key={marketplaceId} variant="outline" className="text-[9px] font-sans font-bold uppercase tracking-tight border-white/10 text-white/70">
                                  {marketplace.flag} {marketplace.name}
                                </Badge>
                              );
                            })
                          ) : (
                            <span className="text-sm font-sans font-bold text-white/50 tracking-tight">Not available</span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-[#0c0c0c] border-white/5 text-white shadow-xl rounded-2xl backdrop-blur-3xl overflow-hidden group">
                    <CardHeader className="border-b border-white/5 bg-white/[0.01] px-6 py-4">
                      <CardTitle className="text-[10px] font-sans font-bold text-white/30 uppercase tracking-tight">Support Tier</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                      <div className="space-y-2">
                        <p className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-tight">Current Tier</p>
                        <p className="text-lg font-sans font-bold text-white tracking-tight">{supportTier}</p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-tight">Workspace</p>
                        <p className="text-sm font-sans font-bold text-white/80 tracking-tight">
                          {tenant?.name || 'Not available'}
                        </p>
                      </div>

                      <p className="text-xs text-white/40 font-sans leading-relaxed">
                        Support guidance is based on your current tenant plan limits. For direct help, use the support page.
                      </p>

                      <Button
                        variant="outline"
                        className="w-full h-10 border-white/10 hover:border-white/20 text-white bg-white/[0.03] font-sans font-bold text-[10px] uppercase tracking-tight"
                        onClick={() => navigate(tenantRoute(activeTenantSlug || '', '/help'))}
                        disabled={!activeTenantSlug}
                      >
                        Open Support Channel
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

// Hidden notification/security/billing stubs remain intentionally excluded until
// they have real backend persistence and truthful operator semantics.
export default Settings;
