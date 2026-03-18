import React, { useEffect, useMemo, useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  User, Building2, Users, CreditCard, Zap, Bell, Shield,
  Upload, MapPin, Clock, Monitor, Smartphone, AlertTriangle,
  CheckCircle, Calendar, Globe, Camera, Key, Plug, Briefcase,
  RefreshCw, XCircle, Store, Box, BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate, useParams } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { useTenant } from '@/contexts/TenantContext';
import { tenantRoute } from '@/lib/routes';

type SettingsSection = 'business' | 'team' | 'billing' | 'integrations' | 'notifications' | 'security' | 'api' | 'careers';

const Settings = () => {
  const navigate = useNavigate();
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { tenant } = useTenant();
  const activeTenantSlug = tenantSlug || tenant?.slug || localStorage.getItem('active_tenant_slug') || 'default';
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<SettingsSection>('business');

  // Profile state
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [avatarSrc, setAvatarSrc] = useState<string>('');

  // Business state (legacy - keeping for compatibility)
  const [businessName, setBusinessName] = useState<string>('');
  const [businessAddress, setBusinessAddress] = useState<string>('');
  const [timezone, setTimezone] = useState<string>('Pacific Standard Time (PST) - San Francisco, Bay Area');

  // Seller Profile state
  interface SellerProfile {
    id?: string;
    amazon_seller_id?: string;
    company_name?: string;
    linked_marketplaces?: string[];
    amazon_account_display_name?: string;
    stripe_customer_id?: string;
    stripe_account_id?: string;
    last_sync_attempt_at?: string;
    last_sync_completed_at?: string;
    last_sync_job_id?: string;
    created_at?: string;
    last_login?: string;
    amazon_connected?: boolean;
    stripe_connected?: boolean;
    paypal_connected?: boolean;
    paypal_email?: string | null;
    paypal_payment_token?: string | null;
    billing_provider?: string | null;
  }

  const [sellerProfile, setSellerProfile] = useState<SellerProfile>({});
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);

  // Load from backend/localStorage
  useEffect(() => {
    try {
      const savedProfile = JSON.parse(localStorage.getItem('clario.profile') || 'null');
      if (savedProfile) {
        setFirstName(savedProfile.firstName || '');
        setLastName(savedProfile.lastName || '');
        setEmail(savedProfile.email || '');
        setAvatarSrc(savedProfile.avatarSrc || '');
      }
    } catch { }
    try {
      const savedBiz = JSON.parse(localStorage.getItem('clario.business') || 'null');
      if (savedBiz) {
        setBusinessName(savedBiz.businessName || '');
        setBusinessAddress(savedBiz.businessAddress || '');
        setTimezone(savedBiz.timezone || 'Pacific Standard Time (PST) - San Francisco, Bay Area');
      }
    } catch { }
    (async () => {
      // Best-effort: hydrate from backend if available
      const res = await api.getMe(activeTenantSlug);
      if (res.ok && res.data) {
        const d: any = res.data;
        const fn = d.first_name || d.firstName || d.given_name || '';
        const ln = d.last_name || d.lastName || d.family_name || '';
        const em = d.email || d.user?.email || email;
        const av = d.avatar_url || d.picture || '';
        setFirstName(fn || firstName);
        setLastName(ln || lastName);
        setEmail(em || email);
        setAvatarSrc(av || avatarSrc);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTenantSlug]);

  // Load seller profile data
  useEffect(() => {
    const loadSellerProfile = async () => {
      setLoadingProfile(true);
      try {
        const [meRes, statusRes] = await Promise.all([
          api.getMe(activeTenantSlug),
          api.getIntegrationsStatus(activeTenantSlug)
        ]);

        if (meRes.ok && meRes.data) {
          const basicData = meRes.data;
          setSellerProfile(prev => ({
            ...prev,
            id: basicData.id,
            email: basicData.email,
            company_name: basicData.name || basicData.company_name,
            amazon_seller_id: basicData.amazon_seller_id || basicData.seller_id,
            amazon_connected: basicData.amazon_connected || false,
            stripe_connected: false,
            paypal_connected: basicData.paypal_connected || false,
            paypal_email: basicData.paypal_email || null,
            paypal_payment_token: basicData.paypal_payment_token || null,
            billing_provider: basicData.billing_provider || 'paypal',
            created_at: basicData.created_at,
            last_login: basicData.last_login,
          }));
        }

        if (statusRes.ok && statusRes.data) {
          const status = statusRes.data as any;
          setSellerProfile(prev => ({
            ...prev,
            amazon_connected: status.amazon_connected ?? prev.amazon_connected ?? false,
            amazon_seller_id: prev.amazon_seller_id || status.amazon_account?.seller_id,
            amazon_account_display_name: status.amazon_account?.display_name || prev.amazon_account_display_name,
            company_name: prev.company_name || status.amazon_account?.display_name,
            linked_marketplaces: Array.isArray(status.amazon_account?.marketplaces) ? status.amazon_account.marketplaces : [],
            last_sync_completed_at: status.lastSync || status.lastIngest || prev.last_sync_completed_at,
          }));
        }

        // Fetch extended profile
        try {
          const profileRes = await api.get<any>('/api/v1/users/profile');
          if (profileRes.ok && profileRes.data) {
            setSellerProfile(prev => ({
              ...prev,
              ...profileRes.data,
            }));
          }
        } catch (e) {
          // Extended profile endpoint might not exist, that's okay
        }

      } catch (e) {
        console.error('Failed to load seller profile:', e);
      } finally {
        setLoadingProfile(false);
      }
    };

    if (activeSection === 'business') {
      loadSellerProfile();
    }
  }, [activeSection, activeTenantSlug]);

  const onUploadPhoto = async (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      setAvatarSrc(dataUrl);
      toast({ title: 'Photo ready', description: 'Preview updated. Remember to Save Changes.' });
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    const payload = { firstName, lastName, email, avatarSrc };
    try {
      localStorage.setItem('clario.profile', JSON.stringify(payload));
      // Optional telemetry
      await api.post('/api/metrics/track', { name: 'profile_update', payload });
      toast({ title: 'Profile saved', description: 'Your profile changes have been saved.' });
    } catch (e: any) {
      toast({ title: 'Save failed', description: e?.message || 'Try again.' });
    }
  };

  const saveBusiness = async () => {
    const payload = { businessName, businessAddress, timezone };
    try {
      localStorage.setItem('clario.business', JSON.stringify(payload));
      await api.post('/api/metrics/track', { name: 'business_update', payload });
      toast({ title: 'Business profile updated', description: 'Your company details have been saved.' });
    } catch (e: any) {
      toast({ title: 'Save failed', description: e?.message || 'Try again.' });
    }
  };

  const menuItems = [
    { id: 'business' as SettingsSection, label: 'Seller Profile', icon: Building2 },
    { id: 'billing' as SettingsSection, label: 'Billing', icon: CreditCard },
    // { id: 'api' as SettingsSection, label: 'API Keys', icon: Key },
    { id: 'integrations' as SettingsSection, label: 'Integrations', icon: Box },
    { id: 'notifications' as SettingsSection, label: 'Notifications', icon: Bell },
    // { id: 'security' as SettingsSection, label: 'Security', icon: Shield },
    // { id: 'careers' as SettingsSection, label: 'Careers', icon: Briefcase }
  ];

  const notificationSettings = [
    { id: 'recovery', label: 'New Recovery Guaranteed', description: 'Get notified when a new recovery is confirmed', enabled: true },
    { id: 'summary', label: 'Monthly Performance Summary', description: 'Receive monthly reports on your account performance', enabled: true },
    { id: 'invoice', label: 'New Invoice Issued', description: 'Get alerts when new invoices are generated', enabled: true },
    { id: 'updates', label: 'Product News & Updates', description: 'Stay informed about new features and improvements', enabled: false }
  ];

  const loginHistory = [
    { device: 'Chrome on Windows', location: 'New York, NY', time: '2 hours ago', current: true },
    { device: 'Safari on iPhone', location: 'New York, NY', time: '1 day ago', current: false },
    { device: 'Chrome on MacOS', location: 'Los Angeles, CA', time: '3 days ago', current: false }
  ];

  // Security state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean>(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loginAlertsEnabled, setLoginAlertsEnabled] = useState<boolean>(true);
  const [trustedDevice, setTrustedDevice] = useState<boolean>(true);
  const [deleteOpen, setDeleteOpen] = useState<boolean>(false);
  const [loggingOutOthers, setLoggingOutOthers] = useState<boolean>(false);

  useEffect(() => {
    try {
      const sec = JSON.parse(localStorage.getItem('clario.security') || 'null');
      if (sec) {
        setTwoFactorEnabled(!!sec.twoFactorEnabled);
        setBackupCodes(Array.isArray(sec.backupCodes) ? sec.backupCodes : []);
        setLoginAlertsEnabled(sec.loginAlertsEnabled !== false);
        setTrustedDevice(sec.trustedDevice !== false);
      }
    } catch { }
  }, []);

  const persistSecurity = (next?: Partial<{ twoFactorEnabled: boolean; backupCodes: string[]; loginAlertsEnabled: boolean; trustedDevice: boolean }>) => {
    const payload = {
      twoFactorEnabled,
      backupCodes,
      loginAlertsEnabled,
      trustedDevice,
      ...(next || {}),
    };
    localStorage.setItem('clario.security', JSON.stringify(payload));
  };

  const generateBackupCodes = () => {
    const codes = Array.from({ length: 8 }, () => Math.random().toString(36).slice(2, 10).toUpperCase());
    setBackupCodes(codes);
    persistSecurity({ backupCodes: codes });
    toast({ title: 'Backup codes generated', description: 'Store these in a safe place.' });
  };

  const downloadBackupCodes = () => {
    const blob = new Blob([backupCodes.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'clario-backup-codes.txt'; a.click();
    URL.revokeObjectURL(url);
  };

  const exportLoginHistory = () => {
    const headers = ['Device', 'Location', 'Time', 'Current'];
    const rows = loginHistory.map(l => [l.device, l.location, l.time, l.current ? 'Yes' : 'No'].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = 'login-history.csv'; a.click(); URL.revokeObjectURL(url);
  };

  const logoutOtherDevices = async () => {
    try {
      setLoggingOutOthers(true);
      // Best-effort telemetry; backend should invalidate other sessions server-side
      await api.post('/api/metrics/track', { name: 'logout_all_devices' });
      toast({ title: 'Other sessions logged out', description: 'All other devices have been signed out.' });
    } catch (e: any) {
      toast({ title: 'Action failed', description: e?.message || 'Please try again.' });
    } finally {
      setLoggingOutOthers(false);
    }
  };

  // Marketplace mapping
  const MARKETPLACE_NAMES: Record<string, { name: string; flag: string }> = {
    'ATVPDKIKX0DER': { name: 'United States', flag: '🇺🇸' },
    'A1PA6795UKMFR9': { name: 'Germany', flag: '🇩🇪' },
    'A1RKKUPIHCS9HS': { name: 'Spain', flag: '🇪🇸' },
    'A13V1IB3VIYZZH': { name: 'France', flag: '🇫🇷' },
    'A1F83G8C2ARO7P': { name: 'United Kingdom', flag: '🇬🇧' },
    'A1VC38T7YXB528': { name: 'Japan', flag: '🇯🇵' },
    'A1AM78C64UM0Y8': { name: 'India', flag: '🇮🇳' },
    'A2EUQ1WTGCTBG2': { name: 'Canada', flag: '🇨🇦' },
    'A39IBJ37TRP1C6': { name: 'Australia', flag: '🇦🇺' },
    'A2Q3Y263D00KWC': { name: 'Brazil', flag: '🇧🇷' },
    'A1M83G8C2ARO7P': { name: 'Mexico', flag: '🇲🇽' },
  };

  // Format date helper
  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'Never';
    try {
      const date = new Date(dateString);
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
      return dateString;
    }
  };

  // Format date with time
  const formatDateTime = (dateString?: string): string => {
    if (!dateString) return 'Never';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return dateString;
    }
  };

  // Get marketplace display info
  const getMarketplaceDisplay = (marketplaceId: string) => {
    return MARKETPLACE_NAMES[marketplaceId] || { name: marketplaceId, flag: '🌐' };
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'business':
        const marketplaces = sellerProfile.linked_marketplaces || [];
        const isAmazonConnected = sellerProfile.amazon_connected || false;
        const hasMarketplaceList = marketplaces.length > 0;
        const connectionScope = hasMarketplaceList
          ? `${marketplaces.length} Marketplace${marketplaces.length === 1 ? '' : 's'} Linked`
          : isAmazonConnected
            ? 'Seller Account Linked'
            : 'No Amazon Link';
        const lastActivity = sellerProfile.last_sync_completed_at || sellerProfile.last_login;
        const paypalActive = !!sellerProfile.paypal_payment_token || !!sellerProfile.paypal_email;

        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-xl font-sans font-bold text-white tracking-tight">Seller Profile</h2>
              <p className="text-[10px] text-white/40 font-sans font-bold uppercase tracking-tight mt-1">
                IDENTITY_MANAGEMENT // CORE_SYSTEM
              </p>
            </div>

            <Card className="bg-[#0c0c0c] border-white/5 text-white shadow-2xl relative overflow-hidden rounded-2xl backdrop-blur-3xl group hover:border-emerald-500/20 transition-all duration-500">
              <div className="absolute top-0 right-0 p-8 opacity-[0.05] pointer-events-none group-hover:opacity-[0.08] transition-opacity duration-700">
                <Building2 className="h-48 w-48 text-emerald-500 rotate-12" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent pointer-events-none" />

              <CardContent className="p-8 relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-sans font-bold text-white tracking-tight">
                        {sellerProfile.company_name || sellerProfile.amazon_account_display_name || (loadingProfile ? 'Loading profile...' : 'Identity Logged')}
                      </h3>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant="outline" className={cn("text-[10px] font-sans font-bold uppercase tracking-tight px-3 py-1", isAmazonConnected ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-red-500/10 text-red-500 border-red-500/20")}>
                          {isAmazonConnected ? 'VERIFIED_CONNECTION' : 'PENDING_HANDSHAKE'}
                        </Badge>
                        {sellerProfile.amazon_seller_id && (
                          <span className="text-[10px] text-white/20 font-sans font-bold uppercase tracking-tight flex items-center gap-2">
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
                      className="bg-white text-black hover:bg-emerald-500 transition-all active:scale-[0.98] rounded-xl h-12 px-8 font-sans font-bold uppercase tracking-tight text-xs shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                      onClick={() => navigate(tenantRoute(activeTenantSlug, '/integrations-hub'))}
                    >
                      Manage Profile
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
                  <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:border-emerald-500/20 transition-all">
                    <div className="flex items-center gap-3">
                      <Store className="h-4 w-4 text-white/40" />
                      <span className="text-xs font-sans font-bold text-white/80 tracking-tight">Amazon SP-API</span>
                    </div>
                    <Badge variant="outline" className={cn("text-[9px] font-sans font-bold uppercase tracking-tight px-2 py-0.5", isAmazonConnected ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-white/5 text-white/30 border-white/10")}>
                      {isAmazonConnected ? 'Linked' : 'Offline'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:border-emerald-500/20 transition-all">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-4 w-4 text-white/40" />
                      <span className="text-xs font-sans font-bold text-white/80 tracking-tight">PayPal Billing</span>
                    </div>
                    <Badge variant="outline" className={cn("text-[9px] font-sans font-bold uppercase tracking-tight px-2 py-0.5", paypalActive ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-white/5 text-white/30 border-white/10")}>
                      {paypalActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#0c0c0c] border-white/5 text-white shadow-xl rounded-2xl backdrop-blur-3xl overflow-hidden group">
                <CardHeader className="border-b border-white/5 bg-white/[0.01] px-6 py-4">
                  <CardTitle className="text-[10px] font-sans font-bold text-white/30 uppercase tracking-tight">Support Tier</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-xs text-white/40 font-serif leading-relaxed italic mb-6">
                    "Your account is managed under our institutional tier. For custom engineering or bulk logistics support, contact your dedicated desk."
                  </p>
                  <Button
                    variant="outline"
                    className="w-full h-10 border-white/10 hover:border-emerald-500/50 text-emerald-500 bg-emerald-500/5 font-sans font-bold text-[10px] uppercase tracking-tight"
                    onClick={() => navigate(tenantRoute(activeTenantSlug, '/help'))}
                  >
                    Open Support Channel
                  </Button>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        );



      case 'billing':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-xl font-sans font-bold text-white tracking-tight">Billing and Recovery Summary</h2>
              <p className="text-[11px] text-white/40 font-sans font-bold uppercase tracking-tight mt-1">
                FINANCIAL_RECORDS // RECOVERY_LOGS
              </p>
            </div>

            <Card className="bg-[#0c0c0c] border-white/5 text-white shadow-2xl relative overflow-hidden rounded-2xl backdrop-blur-3xl group hover:border-emerald-500/20 transition-all duration-500">
              <div className="absolute top-0 right-0 p-8 opacity-[0.05] pointer-events-none group-hover:opacity-[0.08] transition-opacity duration-700">
                <CreditCard className="h-48 w-48 text-emerald-500 rotate-12" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent pointer-events-none" />

              <CardContent className="p-8 relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-sans font-bold text-white tracking-tight">Account Status</h3>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] font-sans font-bold uppercase tracking-tight px-3 py-1">
                          ACTIVE_DELEGATION
                        </Badge>
                        <span className="text-[10px] text-white/20 font-sans font-bold uppercase tracking-tight flex items-center gap-2">
                          <span className="h-1 w-1 bg-emerald-500 rounded-full animate-pulse" />
                          Live Sync Active
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-10 pt-4">
                      <div className="space-y-2">
                        <p className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-tight">Subscription</p>
                        <p className="text-sm font-sans font-bold text-white/80 tracking-tight">Professional Suite</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-tight">Protection Status</p>
                        <p className="text-sm font-sans font-bold text-emerald-500 tracking-tight">100% Comprehensive</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-tight">Fee Structure</p>
                        <p className="text-sm font-sans font-bold text-white/80 tracking-tight">Commission Managed</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button
                      className="bg-white text-black hover:bg-emerald-500 transition-all active:scale-[0.98] rounded-xl h-12 px-8 font-sans font-bold uppercase tracking-tight text-xs shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                      onClick={() => navigate(tenantRoute(activeTenantSlug, '/upcoming-payments'))}
                    >
                      View Documents
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0c0c0c] border-white/5 text-white shadow-xl rounded-2xl backdrop-blur-3xl overflow-hidden group">
              <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-emerald-500/20 group-hover:bg-emerald-500 transition-colors duration-500" />
              <CardHeader className="border-b border-white/5 bg-white/[0.01] px-8 py-6">
                <CardTitle className="text-xs font-sans font-bold text-white/30 uppercase tracking-tight">
                  Automated Filing System
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-1.5 max-w-md">
                    <p className="text-base font-sans font-bold text-white tracking-tight">Auto-Pilot Mode</p>
                    <p className="text-xs text-white/40 font-sans font-bold leading-relaxed italic tracking-tight">
                      "Opside will automatically transmit verified claims to Amazon's systems twice per day without requiring manual intervention."
                    </p>
                  </div>
                  <Switch
                    defaultChecked
                    className="data-[state=checked]:bg-emerald-500"
                  />
                </div>
                <div className="p-4 bg-emerald-500/[0.03] border border-emerald-500/10 rounded-xl">
                  <p className="text-[10px] text-emerald-500/60 leading-relaxed font-sans font-bold uppercase tracking-tight">
                    SYSTEM_NOTE: Enabled by default for all institutional accounts. Manual overrides available in the Claims Terminal.
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );

      /*
      case 'api':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-xl font-sans font-bold text-white tracking-tight">Advanced Developer Access</h2>
              <p className="text-[11px] text-white/40 font-mono uppercase tracking-[0.2em] mt-1">
                SYSTEM_INTEGRATION // API_TERMINAL
              </p>
            </div>

            <Card className="bg-[#0c0c0c] border-white/5 text-white shadow-2xl relative overflow-hidden rounded-2xl backdrop-blur-3xl group hover:border-emerald-500/20 transition-all duration-500">
              <div className="absolute top-0 right-0 p-8 opacity-[0.05] pointer-events-none group-hover:opacity-[0.08] transition-opacity duration-700">
                <Key className="h-48 w-48 text-emerald-500 rotate-12" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent pointer-events-none" />

              <CardContent className="p-8 relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-sans font-bold text-white tracking-tight">Gateway Management</h3>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] font-sans font-bold uppercase tracking-tight px-3 py-1">
                          PRODUCTION_ENVIRONMENT
                        </Badge>
                        <span className="text-[10px] text-white/20 font-mono uppercase tracking-widest flex items-center gap-2">
                          <span className="h-1 w-1 bg-emerald-500 rounded-full" />
                          API Service Operational
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-10 pt-4">
                      <div className="space-y-2">
                        <p className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-tight">Available Nodes</p>
                        <p className="text-sm font-sans font-bold text-white/80 tracking-tight">14 Secure Endpoints</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-tight">Latency</p>
                        <p className="text-sm font-sans font-bold text-emerald-500 tracking-tight">84ms Premium</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-tight">Rate Policy</p>
                        <p className="text-sm font-sans font-bold text-white/80 tracking-tight">Institutional Scale</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button
                      className="bg-white text-black hover:bg-emerald-500 transition-all active:scale-[0.98] rounded-xl h-12 px-8 font-serif font-bold uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                      onClick={() => navigate(tenantRoute(activeTenantSlug, '/api-access'))}
                    >
                      Enter Vault
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1 p-6 bg-white/[0.02] border border-white/5 rounded-2xl group hover:border-emerald-500/20 transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <Monitor className="h-5 w-5 text-white/30" />
                  <h4 className="text-[11px] font-sans font-bold text-white/60 uppercase tracking-tight">Documentation</h4>
                </div>
                <p className="text-xs text-white/40 font-serif leading-relaxed italic">
                  "Full schema specifications for triangulating recovery data into external data warehouses."
                </p>
              </div>
              <div className="col-span-1 p-6 bg-white/[0.02] border border-white/5 rounded-2xl group hover:border-emerald-500/20 transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <Zap className="h-5 w-5 text-white/30" />
                  <h4 className="text-[11px] font-sans font-bold text-white/60 uppercase tracking-tight">Webhooks</h4>
                </div>
                <p className="text-xs text-white/40 font-serif leading-relaxed italic">
                  "Real-time event streams for confirmed recoveries and manual claim overrides."
                </p>
              </div>
            </div>
          </motion.div>
        );
      */

      case 'integrations': {
        const activePlatforms = [
          {
            id: 'amazon',
            name: 'Amazon Seller Central',
            icon: '/lovable-uploads/14f98d63-9a1a-4128-8021-1d840d778ea5.png',
            description: 'SP‑API sync for reimbursements, shipments, and claims.',
            connected: sellerProfile.amazon_connected ?? true,
            lastSync: sellerProfile.last_sync_completed_at ? formatDate(sellerProfile.last_sync_completed_at) : 'Active'
          }
        ];
        const upcomingPlatforms = [
          { id: 'shopify', name: 'Shopify' },
          { id: 'walmart', name: 'Walmart Marketplace' },
          { id: 'quickbooks', name: 'QuickBooks' },
        ];
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-xl font-sans font-bold text-white tracking-tight">Institutional Hub</h2>
              <p className="text-[11px] text-white/40 font-mono uppercase tracking-[0.2em] mt-1">
                ECOLOGY_MAP // DATA_STREAMS
              </p>
            </div>

            <Card className="bg-[#0c0c0c] border-white/5 text-white shadow-2xl relative overflow-hidden rounded-2xl backdrop-blur-3xl group hover:border-emerald-500/20 transition-all duration-500">
              <div className="absolute top-0 right-0 p-8 opacity-[0.05] pointer-events-none group-hover:opacity-[0.08] transition-opacity duration-700">
                <Plug className="h-48 w-48 text-emerald-500 rotate-12" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent pointer-events-none" />

              <CardContent className="p-8 relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-sans font-bold text-white tracking-tight">Connectivity Matrix</h3>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] font-mono uppercase tracking-widest px-3 py-1">
                          {activePlatforms.length} ACTIVE_FEED
                        </Badge>
                        <span className="text-[10px] text-white/20 font-mono uppercase tracking-widest flex items-center gap-2">
                          Last Handshake: {activePlatforms[0].lastSync}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 pt-4">
                      {activePlatforms.map(p => (
                        <div key={p.id} className="flex items-center gap-3 p-3 px-5 border border-white/5 bg-white/[0.02] rounded-xl hover:border-emerald-500/20 transition-all group/chip">
                          <span className="text-xs font-sans font-bold text-white/80 tracking-tight">{p.name}</span>
                          <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button
                      className="bg-white text-black hover:bg-emerald-500 transition-all active:scale-[0.98] rounded-xl h-12 px-8 font-serif font-bold uppercase tracking-widest text-xs shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                      onClick={() => navigate(tenantRoute(activeTenantSlug, '/integrations-hub'))}
                    >
                      Configure Feeds
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-[#0c0c0c] border-white/5 text-white shadow-xl rounded-2xl backdrop-blur-3xl overflow-hidden group">
                <CardHeader className="border-b border-white/5 bg-white/[0.01] px-6 py-4">
                  <CardTitle className="text-[10px] font-sans font-bold text-white/30 uppercase tracking-tight">Integration Roadmap</CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {upcomingPlatforms.map(p => (
                    <div key={p.id} className="flex items-center justify-between p-3 bg-white/[0.01] border border-white/5 rounded-xl opacity-40">
                      <span className="text-xs font-sans font-bold text-white/60 tracking-tight">{p.name}</span>
                      <span className="text-[9px] font-sans font-bold uppercase tracking-tight text-white/20">Awaiting_Launch</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-[#0c0c0c] border-white/5 text-white shadow-xl rounded-2xl backdrop-blur-3xl overflow-hidden group">
                <CardHeader className="border-b border-white/5 bg-white/[0.01] px-6 py-4">
                  <CardTitle className="text-[10px] font-sans font-bold text-white/30 uppercase tracking-tight">Custom Connectors</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <p className="text-xs text-white/40 font-serif leading-relaxed italic mb-6">
                    "Require a high-throughput tunnel for proprietary ERP or legacy accounting silos? Our system engineers can bridge the gap."
                  </p>
                  <Button
                    variant="outline"
                    className="w-full h-10 border-white/10 hover:border-emerald-500/50 text-emerald-500 bg-emerald-500/5 font-mono text-[10px] uppercase tracking-widest"
                    onClick={() => navigate(tenantRoute(activeTenantSlug, '/help'))}
                  >
                    Request Custom Bridge
                  </Button>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        );
      }

      case 'notifications':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div>
              <h2 className="text-xl font-sans font-bold text-white tracking-tight">Alert Protocol</h2>
              <p className="text-[11px] text-white/40 font-mono uppercase tracking-[0.2em] mt-1">
                COMM_LINK // SIGNAL_CHANNELS
              </p>
            </div>

            <Card className="bg-[#0c0c0c] border-white/5 text-white shadow-2xl relative overflow-hidden rounded-2xl backdrop-blur-3xl group hover:border-emerald-500/20 transition-all duration-500">
              <div className="absolute top-0 right-0 p-8 opacity-[0.05] pointer-events-none group-hover:opacity-[0.08] transition-opacity duration-700">
                <Bell className="h-48 w-48 text-emerald-500 rotate-12" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-transparent pointer-events-none" />

              <CardContent className="p-8 relative z-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-sans font-bold text-white tracking-tight">Transmission Registry</h3>
                      <div className="flex items-center gap-3 mt-2">
                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px] font-sans font-bold uppercase tracking-tight px-3 py-1">
                          ACTIVE_MONITORING
                        </Badge>
                        <span className="text-[10px] text-white/20 font-sans font-bold uppercase tracking-tight flex items-center gap-2">
                          Standard Priority Grid
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-10 pt-4">
                      <div className="space-y-2">
                        <p className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-tight">Email Alerts</p>
                        <p className="text-sm font-sans font-bold text-emerald-500 tracking-tight">Online</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-tight">Web Push</p>
                        <p className="text-sm font-sans font-bold text-white/40 tracking-tight">Dormant</p>
                      </div>
                      <div className="space-y-2">
                        <p className="text-[10px] font-sans font-bold text-white/20 uppercase tracking-tight">Slack Stream</p>
                        <p className="text-sm font-sans font-bold text-white/40 tracking-tight">Institutional Required</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button
                      className="bg-white text-black hover:bg-emerald-500 transition-all active:scale-[0.98] rounded-xl h-12 px-8 font-sans font-bold uppercase tracking-tight text-xs shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                      onClick={() => toast({ title: "Configuration Locked", description: "Signal parameters modified." })}
                    >
                      Update Registry
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0c0c0c] border-white/5 text-white shadow-xl rounded-2xl backdrop-blur-3xl overflow-hidden group">
              <CardHeader className="border-b border-white/5 bg-white/[0.01] px-8 py-6">
                <CardTitle className="text-xs font-sans font-bold text-white/30 uppercase tracking-tight">Event Subscriptions</CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-4">
                {notificationSettings.map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between py-4 border-b border-white/5 last:border-0">
                    <div className="space-y-1">
                      <p className="text-sm font-sans font-bold text-white tracking-tight">{setting.label}</p>
                      <p className="text-xs text-white/40 font-sans font-bold italic leading-relaxed tracking-tight">{setting.description}</p>
                    </div>
                    <Switch
                      defaultChecked={setting.enabled}
                      className="data-[state=checked]:bg-emerald-500"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Infrastructure & Account Security</h2>
              <p className="text-xs text-gray-600">Protect your institutional assets with advanced authentication protocols and audit logs.</p>
            </div>

            <Card className="bg-white border-gray-200 text-gray-700 shadow-sm relative overflow-hidden rounded-sm">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                <Shield className="h-32 w-32" />
              </div>

              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-sans font-bold text-gray-900 tracking-tight">Security Backbone</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-xs border-blue-100 px-2 py-0.5">
                          Enterprise Protection
                        </Badge>
                        <span className="text-xs text-gray-400 font-mono tracking-tighter">
                          Level: High
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 pt-2">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-gray-500">2FA Status</p>
                        <p className="text-sm font-semibold text-gray-900">{twoFactorEnabled ? 'Active' : 'Disabled'}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-gray-500">Active Sessions</p>
                        <p className="text-sm font-semibold text-gray-900">{loginHistory.length} Authorized</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-gray-500">Login Alerts</p>
                        <p className="text-sm font-semibold text-gray-900">{loginAlertsEnabled ? 'Monitored' : 'Off'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button
                      className="bg-[#0a0a0f] hover:bg-[#1a1a1f] text-white shadow-sm ring-1 ring-white/5 active:scale-[0.98] rounded-none h-10 px-6 font-normal"
                      onClick={() => toast({ title: "Account Fortified", description: "Security protocols updated." })}
                    >
                      Fortify Account
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white border-gray-200 text-gray-700 shadow-sm rounded-sm">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-bold text-gray-500">Login History</CardTitle>
                  <Button variant="ghost" size="sm" className="h-6 text-xs font-bold text-blue-600 hover:bg-blue-50" onClick={exportLoginHistory}>
                    Export Logs
                  </Button>
                </CardHeader>
                <CardContent className="pt-2 divide-y divide-gray-100">
                  {loginHistory.map((login, idx) => (
                    <div key={idx} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-sm bg-gray-50 flex items-center justify-center border border-gray-100">
                          {login.device.includes('iPhone') ? <Smartphone className="h-4 w-4 text-gray-400" /> : <Monitor className="h-4 w-4 text-gray-400" />}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-900">{login.device}</p>
                          <p className="text-xs text-gray-500">{login.location} · {login.time}</p>
                        </div>
                      </div>
                      {login.current && <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 text-xs px-1.5 py-0">Current</Badge>}
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200 text-gray-700 shadow-sm rounded-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-gray-500">Security Protocols</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-900">Two-Factor Auth</span>
                    <Switch checked={twoFactorEnabled} onCheckedChange={(val) => { setTwoFactorEnabled(val); persistSecurity({ twoFactorEnabled: val }); }} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-900">Trusted Device</span>
                    <Switch checked={trustedDevice} onCheckedChange={(val) => { setTrustedDevice(val); persistSecurity({ trustedDevice: val }); }} />
                  </div>
                  <Separator className="bg-gray-100" />
                  <Button variant="outline" size="sm" className="w-full text-sm font-semibold border-red-100 text-red-600 hover:bg-red-50 hover:border-red-200 rounded-none" onClick={logoutOtherDevices} disabled={loggingOutOthers}>
                    {loggingOutOthers ? 'Processing...' : 'Terminate Other Sessions'}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-white border-red-100 text-gray-700 shadow-sm rounded-sm overflow-hidden border">
              <div className="bg-red-50/50 px-6 py-3 border-b border-red-100 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <h4 className="text-sm font-bold text-red-700">Danger Zone</h4>
              </div>
              <CardContent className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-900">Decommission Account</p>
                  <p className="text-xs text-gray-500">Permanently remove all institutional data, audit logs, and access keys. This process is irreversible.</p>
                </div>
                <Button variant="destructive" size="sm" className="h-9 px-6 font-semibold rounded-none" onClick={() => setDeleteOpen(true)}>
                  Delete Account
                </Button>
              </CardContent>
            </Card>

            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogContent className="bg-white max-w-md rounded-sm border-gray-200">
                <DialogHeader>
                  <DialogTitle className="text-gray-900 text-lg font-medium tracking-tight">Confirm Decommissioning</DialogTitle>
                  <DialogDescription className="text-gray-500 text-sm">
                    This will permanently remove your account and all associated data including recovery history, team members, and integrations.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 pt-4">
                  <Button variant="outline" className="rounded-none text-xs font-semibold" onClick={() => setDeleteOpen(false)}>Cancel</Button>
                  <Button
                    variant="destructive"
                    className="rounded-none text-xs font-semibold"
                    onClick={() => {
                      setDeleteOpen(false);
                      toast({ title: 'Account deletion requested', description: 'Our support will contact you to confirm.' });
                    }}>
                    Delete Account
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <PageLayout title="Account Control Center" midnight>
      <div className="min-h-screen bg-[#050505] relative overflow-hidden">
        {/* Aesthetic Background Elements */}
        <div className="absolute top-0 left-0 w-full h-[800px] bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.08),transparent_70%)] pointer-events-none" />
        <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

        <div className="relative container mx-auto px-8 pt-10 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            {/* Navigation Menu */}
            <div className="lg:col-span-1">
              <div className="lg:sticky lg:top-24 space-y-8">
                <div>
                  <h1 className="text-2xl font-sans font-bold text-white tracking-tight mb-1">Settings</h1>
                  <p className="text-[10px] text-white/20 font-sans font-bold uppercase tracking-tight">
                    SYSTEM_CONFIG // V1.0.0
                  </p>
                </div>

                <nav className="space-y-1">
                  {menuItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => item.id === 'careers' ? navigate('/careers') : setActiveSection(item.id)}
                      className={cn(
                        "group relative w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 overflow-hidden",
                        activeSection === item.id
                          ? "bg-emerald-500/10 text-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                          : "text-white/40 hover:bg-white/[0.03] hover:text-white"
                      )}>
                      {activeSection === item.id && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute left-0 w-1 h-4 bg-emerald-500 rounded-full"
                        />
                      )}
                      <item.icon className={cn("h-4.5 w-4.5 transition-colors", activeSection === item.id ? "text-emerald-500" : "text-white/20 group-hover:text-emerald-500/50")} />
                      <span className="text-[11px] font-sans font-bold uppercase tracking-tight">
                        {item.label}
                      </span>
                    </button>
                  ))}
                </nav>


              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSection}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {renderContent()}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Settings;
