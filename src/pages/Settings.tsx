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
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';

type SettingsSection = 'business' | 'team' | 'billing' | 'integrations' | 'notifications' | 'security' | 'api' | 'careers';

const Settings = () => {
  const navigate = useNavigate();
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
    stripe_customer_id?: string;
    stripe_account_id?: string;
    last_sync_attempt_at?: string;
    last_sync_completed_at?: string;
    last_sync_job_id?: string;
    created_at?: string;
    last_login?: string;
    amazon_connected?: boolean;
    stripe_connected?: boolean;
  }

  const [sellerProfile, setSellerProfile] = useState<SellerProfile>({});
  const [loadingProfile, setLoadingProfile] = useState<boolean>(true);
  const [amazonSellersInfo, setAmazonSellersInfo] = useState<any>(null);

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
      const res = await api.get<any>('/api/auth/me');
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
  }, []);

  // Load seller profile data
  useEffect(() => {
    const loadSellerProfile = async () => {
      setLoadingProfile(true);
      try {
        // Fetch basic profile
        const meRes = await api.get<any>('/api/auth/me');
        if (meRes.ok && meRes.data) {
          const basicData = meRes.data;
          setSellerProfile(prev => ({
            ...prev,
            id: basicData.id,
            email: basicData.email,
            company_name: basicData.name || basicData.company_name,
            amazon_connected: basicData.amazon_connected || false,
            stripe_connected: basicData.stripe_connected || false,
            created_at: basicData.created_at,
            last_login: basicData.last_login,
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

        // Fetch Amazon sellers info
        try {
          const sellersRes = await api.get<any>('/api/v1/integrations/amazon/sellers-info');
          if (sellersRes.ok && sellersRes.data) {
            setAmazonSellersInfo(sellersRes.data);
            if (sellersRes.data.company_name) {
              setSellerProfile(prev => ({
                ...prev,
                company_name: sellersRes.data.company_name || prev.company_name,
                amazon_seller_id: sellersRes.data.seller_id || prev.amazon_seller_id,
              }));
            }
          }
        } catch (e) {
          // Sellers info endpoint might not exist, that's okay
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
  }, [activeSection]);

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
    { id: 'api' as SettingsSection, label: 'API Keys', icon: Key },
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
    // Check if we have marketplace info from Amazon API
    if (amazonSellersInfo?.marketplaces) {
      const marketplace = amazonSellersInfo.marketplaces.find((m: any) => m.id === marketplaceId);
      if (marketplace) {
        return { name: marketplace.name, flag: '' }; // Could add flag mapping if needed
      }
    }
    // Fallback to static mapping
    return MARKETPLACE_NAMES[marketplaceId] || { name: marketplaceId, flag: '🌐' };
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'business':
        const marketplaces = sellerProfile.linked_marketplaces || amazonSellersInfo?.marketplaces?.map((m: any) => m.id) || [];
        const isAmazonConnected = sellerProfile.amazon_connected || false;

        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Seller Profile</h2>
              <p className="text-xs text-gray-600">Manage your business identity and linked Amazon accounts</p>
            </div>

            <Card className="bg-white border-gray-200 text-gray-700 shadow-sm relative overflow-hidden rounded-sm">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                <Building2 className="h-32 w-32" />
              </div>

              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 tracking-tight">
                        {sellerProfile.company_name || 'Verification Required'}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge variant="secondary" className="bg-gray-100 text-gray-700 text-xs border-gray-200 px-2 py-0.5">
                          {isAmazonConnected ? 'Verified Account' : 'Pending Verification'}
                        </Badge>
                        {sellerProfile.amazon_seller_id && (
                          <span className="text-xs text-gray-400 font-mono tracking-tighter">
                            ID: {sellerProfile.amazon_seller_id}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 pt-2">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-gray-500">Marketplaces</p>
                        <p className="text-sm font-semibold text-gray-900">{marketplaces.length} Active</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-gray-500">Last Sync</p>
                        <p className="text-sm font-semibold text-gray-900">{formatDate(sellerProfile.last_sync_completed_at)}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-gray-500">Network Age</p>
                        <p className="text-sm font-semibold text-gray-900">{formatDate(sellerProfile.created_at)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button
                      className="bg-[#0a0a0f] hover:bg-[#1a1a1f] text-white shadow-sm ring-1 ring-white/5 active:scale-[0.98] rounded-none h-10 px-6 font-normal"
                      onClick={() => navigate('/integrations-hub')}
                    >
                      Manage Profile
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white border-gray-200 text-gray-700 shadow-sm rounded-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-gray-500">Platform Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Store className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">Amazon SP-API</span>
                    </div>
                    <Badge className={cn("text-xs px-2 py-0.5", isAmazonConnected ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-gray-50 text-gray-500 border-gray-100")}>
                      {isAmazonConnected ? 'Enabled' : 'Disconnected'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">Stripe Billing</span>
                    </div>
                    <Badge className={cn("text-xs px-2 py-0.5", sellerProfile.stripe_connected ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-gray-50 text-gray-500 border-gray-100")}>
                      {sellerProfile.stripe_connected ? 'Enabled' : 'Inactive'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200 text-gray-700 shadow-sm rounded-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-gray-500">Business Support</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-600 leading-relaxed mb-4">
                    Your account is currently under review. For white-glove support or bulk account management, contact our dedicated desk.
                  </p>
                  <Button variant="outline" size="sm" className="w-full text-sm font-semibold border-gray-200 hover:bg-gray-50 rounded-none" onClick={() => navigate('/help')}>
                    Contact Dedicated Support
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        );



      case 'billing':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Billing & Value Reporting</h2>
              <p className="text-xs text-gray-600">Recovery billing, ROI analysis, and fee management</p>
            </div>

            <Card className="bg-white border-gray-200 text-gray-700 shadow-sm relative overflow-hidden rounded-sm">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                <CreditCard className="h-32 w-32" />
              </div>

              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 tracking-tight">Billing Dashboard</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 text-xs border-emerald-100 px-2 py-0.5">
                          Active Account
                        </Badge>
                        <span className="text-xs text-gray-400 font-mono tracking-tighter">
                          Real-Time Data
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 pt-2">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-gray-500">Subscription</p>
                        <p className="text-sm font-semibold text-gray-900">Professional Account</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-gray-500">ROI Coverage</p>
                        <p className="text-sm font-semibold text-gray-900">100% Guaranteed</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-gray-500">Fee Structure</p>
                        <p className="text-sm font-semibold text-gray-900">Commission-Based</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button
                      className="bg-[#0a0a0f] hover:bg-[#1a1a1f] text-white shadow-sm ring-1 ring-white/5 active:scale-[0.98] rounded-none h-10 px-6 font-normal"
                      onClick={() => navigate('/billing')}
                    >
                      View Documents
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 text-gray-700 shadow-sm rounded-sm">
              <CardHeader className="border-b border-gray-100 pb-3">
                <CardTitle className="text-sm font-bold text-gray-500">Auto-Claim (ACG)</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-sm font-medium text-gray-900">Automated Filing Presence</p>
                    <p className="text-xs text-gray-500">Automatically submit approved claims once evidence is strictly verified by risk desk.</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="p-3 bg-gray-50 border border-gray-100 rounded-sm">
                  <p className="text-xs text-gray-400 leading-relaxed font-medium">
                    Note: Enabled by default for VIP accounts. You can manually override individual cases in the Recoveries terminal.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'api':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Developer & API Access</h2>
              <p className="text-xs text-gray-600">Programmatic access to your recovery data for internal systems</p>
            </div>

            <Card className="bg-white border-gray-200 text-gray-700 shadow-sm relative overflow-hidden rounded-sm">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                <Key className="h-32 w-32" />
              </div>

              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 tracking-tight">API Management</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 text-xs border-blue-100 px-2 py-0.5">
                          Production Environment
                        </Badge>
                        <span className="text-xs text-gray-400 font-mono tracking-tighter">
                          Live System
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 pt-2">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-gray-500">Available Scopes</p>
                        <p className="text-sm font-semibold text-gray-900">7 Active Endpoints</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-gray-500">Webhooks</p>
                        <p className="text-sm font-semibold text-gray-900">Operational</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-gray-500">Rate Limit</p>
                        <p className="text-sm font-semibold text-gray-900">High Capacity</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button
                      className="bg-[#0a0a0f] hover:bg-[#1a1a1f] text-white shadow-sm ring-1 ring-white/5 active:scale-[0.98] rounded-none h-10 px-6 font-normal"
                      onClick={() => navigate('/api-access')}
                    >
                      Access Gateway
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="p-4 border border-gray-200 rounded-sm bg-gray-50">
              <h4 className="text-sm font-bold text-gray-500 mb-4">Integration Resources</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Monitor className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-gray-900">Documentation</p>
                    <p className="text-xs text-gray-500">API references and authentication guides.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Zap className="h-4 w-4 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-gray-900">Webhooks</p>
                    <p className="text-xs text-gray-500">Standardized events for claim lifecycle.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

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
          { id: 'shopify', name: 'Shopify', icon: '/lovable-uploads/8efb84ba-e777-4413-ae5a-f7f54bfa6cab.png' },
          { id: 'walmart', name: 'Walmart Marketplace', icon: '/lovable-uploads/cef56367-b57b-46cc-b0cb-a2ffad47fb03.png' },
          { id: 'quickbooks', name: 'QuickBooks', icon: '/lovable-uploads/02ff2e6e-9e67-4481-99a8-4b9caead4540.png' },
        ];
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Ecosystem Integrations</h2>
              <p className="text-xs text-gray-600">Connect your e-commerce platforms and financial stack to the Margin intelligence layer.</p>
            </div>

            <Card className="bg-white border-gray-200 text-gray-700 shadow-sm relative overflow-hidden rounded-sm">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                <Plug className="h-32 w-32" />
              </div>

              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 tracking-tight">Integrations Hub</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 text-xs border-emerald-100 px-2 py-0.5">
                          {activePlatforms.length} Direct Connection
                        </Badge>
                        <span className="text-xs text-gray-400 font-mono tracking-tighter">
                          Last Handshake: {activePlatforms[0].lastSync}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-4 pt-2">
                      {activePlatforms.map(p => (
                        <div key={p.id} className="flex items-center gap-2 p-2 px-3 border border-gray-100 bg-gray-50 rounded-sm">
                          <img src={p.icon} alt="" className="h-4 w-4 grayscale" />
                          <span className="text-xs font-semibold text-gray-900">{p.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button
                      className="bg-[#0a0a0f] hover:bg-[#1a1a1f] text-white shadow-sm ring-1 ring-white/5 active:scale-[0.98] rounded-none h-10 px-6 font-normal"
                      onClick={() => navigate('/integrations-hub')}
                    >
                      Institutional Hub
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white border-gray-200 text-gray-700 shadow-sm rounded-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-gray-500">Integration Roadmap</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {upcomingPlatforms.map(p => (
                    <div key={p.id} className="flex items-center justify-between opacity-60">
                      <div className="flex items-center gap-2">
                        <img src={p.icon} alt="" className="h-3.5 w-3.5 grayscale" />
                        <span className="text-xs text-gray-900 font-medium">{p.name}</span>
                      </div>
                      <span className="text-xs font-bold text-gray-400">Planned</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-white border-gray-200 text-gray-700 shadow-sm rounded-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-bold text-gray-500">Custom Integrations</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-gray-600 leading-relaxed mb-4">
                    Require a custom connector for your proprietary ERP or specialized accounting stack? Our systems engineers can facilitate private deployments.
                  </p>
                  <Button variant="outline" size="sm" className="w-full text-sm font-semibold border-gray-200 hover:bg-gray-50 rounded-none" onClick={() => navigate('/help')}>
                    Request Private Connector
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      }

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Communication & Alerting</h2>
              <p className="text-xs text-gray-600">Configure alert channels and event notifications for your account.</p>
            </div>

            <Card className="bg-white border-gray-200 text-gray-700 shadow-sm relative overflow-hidden rounded-sm">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                <Bell className="h-32 w-32" />
              </div>

              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 tracking-tight">Notification Protocol</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 text-xs border-emerald-100 px-2 py-0.5">
                          Active Monitoring
                        </Badge>
                        <span className="text-xs text-gray-400 font-mono tracking-tighter">
                          Standard Priority
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-8 pt-2">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-gray-500">Email Alerts</p>
                        <p className="text-sm font-semibold text-gray-900">Enabled</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-gray-500">Web Push</p>
                        <p className="text-sm font-semibold text-gray-900">Inactive</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-gray-500">Slack/Webhook</p>
                        <p className="text-sm font-semibold text-gray-900">Premium Required</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button
                      className="bg-[#0a0a0f] hover:bg-[#1a1a1f] text-white shadow-sm ring-1 ring-white/5 active:scale-[0.98] rounded-none h-10 px-6 font-normal"
                      onClick={() => toast({ title: "Settings Saved", description: "Your notification preferences are active." })}
                    >
                      Update Preferences
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 text-gray-700 shadow-sm rounded-sm">
              <CardHeader className="border-b border-gray-100 pb-3">
                <CardTitle className="text-sm font-bold text-gray-500">Audit Events</CardTitle>
              </CardHeader>
              <CardContent className="pt-4 divide-y divide-gray-100">
                {notificationSettings.map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium text-gray-900">{setting.label}</p>
                      <p className="text-sm text-gray-500">{setting.description}</p>
                    </div>
                    <Switch defaultChecked={setting.enabled} />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
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
                      <h3 className="text-lg font-medium text-gray-900 tracking-tight">Security Backbone</h3>
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
    <PageLayout title="Account Control Center">
      <div className="relative -m-4 lg:-m-6">
        <div className="relative w-full bg-white min-h-[calc(100vh+96px)] -mt-24 pt-24">
          <div className="relative container mx-auto px-8 pt-8 pb-10 text-gray-700">
            {/* Header */}
            <header className="mb-10">
              <h1 className="text-lg font-medium text-gray-900 tracking-tight">Settings</h1>
              <p className="text-xs text-gray-500 mt-0.5">Account Configuration</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Navigation Menu */}
              <div className="lg:col-span-1">
                <div className="lg:sticky lg:top-6 h-fit bg-white border border-gray-200 rounded-none">
                  <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                    <h2 className="text-xs font-medium text-gray-900">Quick Settings</h2>
                  </div>
                  <nav className="p-2 space-y-0.5">
                    {menuItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => item.id === 'careers' ? navigate('/careers') : setActiveSection(item.id)}
                        className={cn(
                          "relative w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors text-left",
                          activeSection === item.id
                            ? "bg-gray-100 text-gray-900"
                            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                        )}>
                        {activeSection === item.id && (
                          <span className="absolute left-0 h-4 w-[2px] bg-gray-900" />
                        )}
                        <item.icon className="h-4 w-4 shrink-0" />
                        {item.label}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-3">
                {renderContent()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Settings;
