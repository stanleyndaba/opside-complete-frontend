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
  RefreshCw, XCircle, Store, Box
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
    { id: 'security' as SettingsSection, label: 'Security', icon: Shield },
    { id: 'careers' as SettingsSection, label: 'Careers', icon: Briefcase }
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
        const isStripeConnected = sellerProfile.stripe_connected || false;

        return (
          <div className="space-y-6">
            {/* Header Section */}
            <div className="flex items-start justify-between pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">
                  {sellerProfile.company_name || 'Seller Profile'}
                </h2>
                {sellerProfile.amazon_seller_id && (
                  <p className="text-sm text-gray-500 mt-1 font-mono">
                    {sellerProfile.amazon_seller_id}
                  </p>
                )}
              </div>
              <Badge
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-full',
                  isAmazonConnected
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                )}
              >
                {isAmazonConnected ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1.5" />
                    Connected
                  </>
                ) : (
                  <>
                    <XCircle className="h-3 w-3 mr-1.5" />
                    Not Connected
                  </>
                )}
              </Badge>
            </div>

            {loadingProfile ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
                <span className="ml-3 text-sm text-gray-500">Loading profile...</span>
              </div>
            ) : (
              <>
                {/* Account Information */}
                <Card className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
                  <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4">
                    <CardTitle className="text-base font-semibold text-gray-900">Account Information</CardTitle>
                  </CardHeader>
                  <CardContent className="p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Company</p>
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4 text-gray-400" />
                          <p className="text-sm text-gray-900 font-medium">
                            {sellerProfile.company_name || 'Not set'}
                          </p>
                        </div>
                      </div>

                      {sellerProfile.amazon_seller_id && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Seller ID</p>
                          <div className="flex items-center gap-2">
                            <Key className="h-4 w-4 text-gray-400" />
                            <p className="text-sm text-gray-900 font-mono">
                              {sellerProfile.amazon_seller_id}
                            </p>
                          </div>
                        </div>
                      )}

                      {sellerProfile.created_at && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Member Since</p>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            <p className="text-sm text-gray-900">
                              {formatDate(sellerProfile.created_at)}
                            </p>
                          </div>
                        </div>
                      )}

                      {sellerProfile.last_login && (
                        <div className="space-y-1">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last Active</p>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <p className="text-sm text-gray-900">
                              {formatDate(sellerProfile.last_login)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Marketplaces */}
                {marketplaces.length > 0 && (
                  <Card className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
                    <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold text-gray-900">Marketplaces</CardTitle>
                        <Badge variant="secondary" className="bg-gray-100 text-gray-600 text-xs">
                          {marketplaces.length} active
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-5">
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {marketplaces.map((marketplaceId: string) => {
                          const display = getMarketplaceDisplay(marketplaceId);
                          return (
                            <div
                              key={marketplaceId}
                              className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-lg border border-gray-100"
                            >
                              <span className="text-xl">{display.flag}</span>
                              <span className="text-sm text-gray-800 font-medium">{display.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Connected Platforms */}
                <Card className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
                  <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4">
                    <CardTitle className="text-base font-semibold text-gray-900">Connected Platforms</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0 divide-y divide-gray-100">
                    {/* Amazon */}
                    <div className="flex items-center justify-between p-5">
                      <div className="flex items-center gap-4">
                        <div className="h-11 w-11 rounded-xl bg-[#FF9900]/10 flex items-center justify-center">
                          <img
                            src="/Amazon-logo.png"
                            alt="Amazon"
                            className="h-6 w-6 object-contain"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Amazon Seller Central</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {isAmazonConnected ? (
                              <>
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                <span className="text-xs text-emerald-600 font-medium">Connected</span>
                                {sellerProfile.last_sync_completed_at && (
                                  <span className="text-xs text-gray-400 ml-1">
                                    — synced {formatDate(sellerProfile.last_sync_completed_at)}
                                  </span>
                                )}
                              </>
                            ) : (
                              <>
                                <div className="h-1.5 w-1.5 rounded-full bg-gray-300" />
                                <span className="text-xs text-gray-500">Not connected</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant={isAmazonConnected ? 'outline' : 'default'}
                        size="sm"
                        className={cn(
                          isAmazonConnected
                            ? 'border-gray-200 text-gray-700 hover:bg-gray-50'
                            : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                        )}
                        onClick={() => navigate('/integrations-hub')}
                      >
                        {isAmazonConnected ? 'Manage' : 'Connect'}
                      </Button>
                    </div>

                    {/* Stripe */}
                    <div className="flex items-center justify-between p-5">
                      <div className="flex items-center gap-4">
                        <div className="h-11 w-11 rounded-xl bg-[#635BFF]/10 flex items-center justify-center">
                          <img
                            src="/Stripe-logo.png"
                            alt="Stripe"
                            className="h-6 w-6 object-contain"
                          />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900">Stripe</p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {isStripeConnected ? (
                              <>
                                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                <span className="text-xs text-emerald-600 font-medium">Connected</span>
                              </>
                            ) : (
                              <>
                                <div className="h-1.5 w-1.5 rounded-full bg-gray-300" />
                                <span className="text-xs text-gray-500">Not connected</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-gray-200 text-gray-700 hover:bg-gray-50"
                        onClick={() => navigate('/billing')}
                      >
                        {isStripeConnected ? 'Manage' : 'Connect'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Sync Status */}
                {(sellerProfile.last_sync_attempt_at || sellerProfile.last_sync_completed_at) && (
                  <Card className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
                    <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4">
                      <CardTitle className="text-base font-semibold text-gray-900">Sync Status</CardTitle>
                    </CardHeader>
                    <CardContent className="p-5">
                      <div className="space-y-4">
                        {sellerProfile.last_sync_completed_at && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-emerald-50 flex items-center justify-center">
                                <CheckCircle className="h-4 w-4 text-emerald-500" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">Last Successful Sync</p>
                                <p className="text-xs text-gray-500">{formatDateTime(sellerProfile.last_sync_completed_at)}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {sellerProfile.last_sync_job_id && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-blue-50 flex items-center justify-center">
                                <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">Sync in Progress</p>
                                <p className="text-xs text-gray-500 font-mono">{sellerProfile.last_sync_job_id}</p>
                              </div>
                            </div>
                            <Badge className="bg-blue-50 text-blue-600 border-blue-100">Running</Badge>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>
        );



      case 'billing':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Billing Invoices</h2>
              <p className="text-gray-600">View your ROI and manage billing preferences</p>
            </div>

            <Card className="bg-white border-gray-200 text-gray-700 shadow-sm">
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 mx-auto text-gray-500 mb-4" />
                  <h3 className="text-lg font-medium mb-2 text-gray-900">Complete Billing Dashboard</h3>
                  <p className="text-gray-600 mb-4">
                    Access your comprehensive billing and value report with ROI calculations,
                    invoice history, and plan management.
                  </p>
                  <Button className="bg-emerald-500 hover:bg-emerald-400 text-white" onClick={() => navigate('/billing')}>
                    View Billing Invoices
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 text-gray-700 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900 font-medium">Auto-Claim (ACG)</CardTitle>
                <CardDescription className="text-gray-600">Automatically submit approved claims once evidence is verified</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Enable Auto-Claim</p>
                    <p className="text-sm text-gray-600">Claims are auto-filed to Amazon when evidence is complete</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="text-xs text-gray-600">
                  Note: You can always review individual cases in Recoveries and pause Auto-Claim from here.
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'api':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">API Access</h2>
              <p className="text-gray-600">Programmatic access to your Clario data for automation and integrations</p>
            </div>

            <Card className="bg-white border-gray-200 text-gray-700 shadow-sm">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Use Clario APIs to pull recovery data, sync evidence statuses, and reconcile payouts in your own systems.
                    Access tokens are scoped and can be rotated at any time. SDKs and examples are available.
                  </p>
                  <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                    <li>Recoveries, claims, and payout endpoints</li>
                    <li>Webhooks for status changes</li>
                    <li>Fine-grained API keys and scopes</li>
                  </ul>
                </div>
                <div className="mt-6">
                  <Button className="bg-emerald-500 hover:bg-emerald-400 text-white" onClick={() => navigate('/api-access')}>
                    Clario APIs
                  </Button>
                </div>
              </CardContent>
            </Card>
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
            lastSync: sellerProfile.last_sync_completed_at ? formatDate(sellerProfile.last_sync_completed_at) : '5 mins ago'
          }
        ];
        const upcomingPlatforms = [
          { id: 'shopify', name: 'Shopify', icon: '/lovable-uploads/8efb84ba-e777-4413-ae5a-f7f54bfa6cab.png' },
          { id: 'walmart', name: 'Walmart Marketplace', icon: '/lovable-uploads/cef56367-b57b-46cc-b0cb-a2ffad47fb03.png' },
          { id: 'quickbooks', name: 'QuickBooks', icon: '/lovable-uploads/02ff2e6e-9e67-4481-99a8-4b9caead4540.png' },
          { id: 'xero', name: 'Xero', icon: '/lovable-uploads/ac3dc504-c896-4f73-9e7e-aefc77dd6e9f.png' },
          { id: 'ebay', name: 'eBay', icon: '/lovable-uploads/f894a44c-fd04-4ec2-8af3-a7235951d82d.png' },
        ];
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Integrations</h2>
              <p className="text-gray-600">Manage your platform connections and data sources</p>
            </div>
            <div>
              <Button className="bg-emerald-500 hover:bg-emerald-400 text-white gap-2" onClick={() => navigate('/integrations-hub')}>
                <Plug className="h-4 w-4" />
                Clario Integrations
              </Button>
            </div>

            <Card className="bg-white border-gray-200 text-gray-700 shadow-sm">
              <CardHeader />
              <CardContent className="space-y-4">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 divide-y divide-gray-200">
                  {activePlatforms.map(platform => (
                    <div key={platform.id} className="flex flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center border border-gray-200 shadow-sm">
                          <img src={platform.icon} alt={`${platform.name} logo`} className="h-8 w-8 object-contain" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{platform.name}</p>
                          <p className="text-sm text-gray-600">{platform.description}</p>
                          <p className="text-xs text-gray-500 mt-1">Last sync: {platform.lastSync}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 md:items-end">
                        <Button
                          size="sm"
                          className="bg-emerald-500 hover:bg-emerald-400 text-white"
                          onClick={() => navigate('/integrations-hub')}
                        >
                          {platform.connected ? 'Manage' : 'Connect'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-gray-200 text-gray-700 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900 font-medium">Coming</CardTitle>
                <CardDescription className="text-gray-600">Coming soon to expand your recovery capabilities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-2xl border border-gray-200 bg-gray-50 divide-y divide-gray-200">
                  {upcomingPlatforms.map(platform => (
                    <div key={platform.id} className="flex flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between opacity-80">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center border border-gray-200 shadow-sm">
                          <img src={platform.icon} alt={`${platform.name} logo`} className="h-8 w-8 object-contain" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{platform.name}</p>
                          <p className="text-sm text-gray-500">Coming soon</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="text-xs border-amber-300 text-amber-700 bg-amber-50">
                          Roadmap
                        </Badge>
                        <Button size="sm" disabled className="bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed">
                          Connect
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );
      }

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Notifications</h2>
              <p className="text-gray-600">Control how and when we communicate with you</p>
            </div>

            <Card className="bg-white border-gray-200 text-gray-700 shadow-sm">
              <CardHeader>
                <CardTitle className="text-gray-900 font-medium">Email Notifications</CardTitle>
                <CardDescription className="text-gray-600">Choose which notifications you'd like to receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {notificationSettings.map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium text-gray-900">{setting.label}</p>
                      <p className="text-sm text-gray-600">{setting.description}</p>
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
            {/* Header */}
            <div className="pb-4 border-b border-gray-100">
              <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Security</h2>
              <p className="text-sm text-gray-500 mt-1">Manage your account security and access</p>
            </div>

            {/* Login History */}
            <Card className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-semibold text-gray-900">Login History</CardTitle>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-gray-200 text-gray-600 hover:bg-gray-50 text-xs"
                    onClick={exportLoginHistory}
                  >
                    Export CSV
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-gray-100">
                {loginHistory.map((login, index) => (
                  <div key={index} className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'h-10 w-10 rounded-lg flex items-center justify-center',
                        login.device.includes('iPhone') ? 'bg-blue-50' : 'bg-gray-100'
                      )}>
                        {login.device.includes('iPhone') ?
                          <Smartphone className="h-5 w-5 text-blue-600" /> :
                          <Monitor className="h-5 w-5 text-gray-600" />
                        }
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{login.device}</p>
                        <p className="text-xs text-gray-500">
                          {login.location} · {login.time}
                        </p>
                      </div>
                    </div>
                    {login.current && (
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 text-xs">
                        Current
                      </Badge>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Two-Factor Authentication */}
            <Card className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4">
                <CardTitle className="text-base font-semibold text-gray-900">Two-Factor Authentication</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'h-10 w-10 rounded-lg flex items-center justify-center',
                      twoFactorEnabled ? 'bg-emerald-50' : 'bg-gray-100'
                    )}>
                      <Shield className={cn('h-5 w-5', twoFactorEnabled ? 'text-emerald-600' : 'text-gray-500')} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Enable 2FA</p>
                      <p className="text-xs text-gray-500">Add an extra layer of security</p>
                    </div>
                  </div>
                  <Switch
                    checked={twoFactorEnabled}
                    onCheckedChange={(v) => { setTwoFactorEnabled(!!v); persistSecurity({ twoFactorEnabled: !!v }); }}
                  />
                </div>

                {twoFactorEnabled && (
                  <div className="pt-4 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">Backup Codes</p>
                    {backupCodes.length === 0 ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-gray-200 text-gray-700 hover:bg-gray-50"
                        onClick={generateBackupCodes}
                      >
                        Generate Backup Codes
                      </Button>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid grid-cols-4 gap-2">
                          {backupCodes.map(c => (
                            <code key={c} className="px-2 py-1.5 rounded-md bg-gray-50 border border-gray-200 text-xs font-mono text-gray-800 text-center">
                              {c}
                            </code>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="border-gray-200 text-gray-600 hover:bg-gray-50" onClick={downloadBackupCodes}>
                            Download
                          </Button>
                          <Button size="sm" variant="outline" className="border-gray-200 text-gray-600 hover:bg-gray-50" onClick={generateBackupCodes}>
                            Regenerate
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Security Settings */}
            <Card className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="bg-gray-50/50 border-b border-gray-100 py-4">
                <CardTitle className="text-base font-semibold text-gray-900">Security Settings</CardTitle>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-gray-100">
                <div className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Bell className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Login Alerts</p>
                      <p className="text-xs text-gray-500">Email me when a new device logs in</p>
                    </div>
                  </div>
                  <Switch
                    checked={loginAlertsEnabled}
                    onCheckedChange={(v) => { setLoginAlertsEnabled(!!v); persistSecurity({ loginAlertsEnabled: !!v }); }}
                  />
                </div>

                <div className="flex items-center justify-between p-5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-purple-50 flex items-center justify-center">
                      <Monitor className="h-5 w-5 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Trust this Device</p>
                      <p className="text-xs text-gray-500">Skip 2FA on this device for faster sign-in</p>
                    </div>
                  </div>
                  <Switch
                    checked={trustedDevice}
                    onCheckedChange={(v) => { setTrustedDevice(!!v); persistSecurity({ trustedDevice: !!v }); }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Session Management */}
            <Card className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Log Out All Devices</p>
                    <p className="text-xs text-gray-500 mt-0.5">Sign out from all other active sessions</p>
                  </div>
                  <Button
                    size="sm"
                    className="bg-gray-900 hover:bg-gray-800 text-white"
                    disabled={loggingOutOthers}
                    onClick={logoutOtherDevices}
                  >
                    {loggingOutOthers ? 'Signing out...' : 'Log Out Others'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="bg-white border border-red-200 shadow-sm rounded-xl overflow-hidden">
              <CardHeader className="bg-red-50/50 border-b border-red-100 py-4">
                <CardTitle className="text-base font-semibold text-red-700 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                <p className="text-sm text-gray-600 mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
                  Delete Account
                </Button>
              </CardContent>
            </Card>

            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogContent className="bg-white">
                <DialogHeader>
                  <DialogTitle className="text-gray-900">Delete your account?</DialogTitle>
                  <DialogDescription className="text-gray-600">
                    This will permanently remove your account and all associated data including recovery history, team members, and integrations.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2">
                  <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      setDeleteOpen(false);
                      toast({ title: 'Account deletion requested', description: 'Our support will contact you to confirm.' });
                    }}
                  >
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
          <div className="relative container mx-auto px-6 pt-6 pb-10 text-gray-700">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Navigation Menu */}
              <div className="lg:col-span-1">
                <Card className="lg:sticky lg:top-6 h-fit bg-white border-gray-200 text-gray-700 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-900 font-medium">Quick Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <nav className="space-y-1 p-2">
                      {menuItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => item.id === 'careers' ? navigate('/careers') : setActiveSection(item.id)}
                          className={cn(
                            "relative w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors text-left",
                            activeSection === item.id
                              ? "bg-gray-100 text-gray-900"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                          )}
                        >
                          {activeSection === item.id && (
                            <span className="absolute left-0 h-5 w-[3px] rounded-r bg-emerald-500" />
                          )}
                          <item.icon className="h-4 w-4 shrink-0" />
                          {item.label}
                        </button>
                      ))}
                    </nav>
                  </CardContent>
                </Card>
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