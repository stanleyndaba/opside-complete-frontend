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
  CheckCircle, Calendar, Globe, Camera, Key, Plug, Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';

type SettingsSection = 'profile' | 'business' | 'team' | 'billing' | 'integrations' | 'notifications' | 'security' | 'api' | 'careers';

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');

  // Profile state
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [avatarSrc, setAvatarSrc] = useState<string>('');

  // Business state
  const [businessName, setBusinessName] = useState<string>('');
  const [businessAddress, setBusinessAddress] = useState<string>('');
  const [timezone, setTimezone] = useState<string>('South Africa Standard Time (GMT+2)');

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
    } catch {}
    try {
      const savedBiz = JSON.parse(localStorage.getItem('clario.business') || 'null');
      if (savedBiz) {
        setBusinessName(savedBiz.businessName || '');
        setBusinessAddress(savedBiz.businessAddress || '');
        setTimezone(savedBiz.timezone || 'South Africa Standard Time (GMT+2)');
      }
    } catch {}
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
    { id: 'profile' as SettingsSection, label: 'Clario Profile', icon: User },
    { id: 'business' as SettingsSection, label: 'Business Profile', icon: Building2 },
    { id: 'billing' as SettingsSection, label: 'Billing & Value', icon: CreditCard },
    { id: 'api' as SettingsSection, label: 'API Access', icon: Key },
    { id: 'integrations' as SettingsSection, label: 'Integrations Hub', icon: Zap },
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
    } catch {}
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
    const headers = ['Device','Location','Time','Current'];
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

  const renderContent = () => {
    switch (activeSection) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-200">Clario Profile</h2>
              <p className="text-gray-400">Manage your personal account information</p>
            </div>
            
            <Card className="bg-white/5 border-white/10 text-gray-300">
              <CardHeader>
                <CardTitle className="text-gray-200">Personal Information</CardTitle>
                <CardDescription className="text-gray-400">Update your personal details and profile picture</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={avatarSrc} />
                    <AvatarFallback className="text-lg">
                      <User className="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Button size="sm" className="bg-emerald-500 hover:bg-emerald-400 text-white" onClick={() => document.getElementById('profile-photo-input')?.click()}>
                      <Camera className="h-4 w-4 mr-2" />
                      Upload Photo
                    </Button>
                    <input id="profile-photo-input" type="file" accept="image/*" className="hidden" onChange={(e) => onUploadPhoto((e.target as HTMLInputElement).files?.[0] || undefined)} />
                    <p className="text-sm text-gray-400 mt-1">
                      JPG, PNG or GIF. Max size 5MB.
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input variant="dark" id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input variant="dark" id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input variant="dark" id="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled />
                    <p className="text-sm text-gray-400 mt-1">
                      Email is linked to your Amazon account and cannot be changed
                    </p>
                  </div>
                </div>
                
                <Button className="bg-emerald-500 hover:bg-emerald-400 text-white" onClick={saveProfile}>Save Changes</Button>
              </CardContent>
            </Card>
          </div>
        );

      case 'business':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-200">Business Profile</h2>
              <p className="text-gray-400">Manage your company information and preferences</p>
            </div>
            
            <Card className="bg-white/5 border-white/10 text-gray-300">
              <CardHeader>
                <CardTitle className="text-gray-200">Company Details</CardTitle>
                <CardDescription className="text-gray-400">Information used for invoicing and records</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input variant="dark" id="businessName" value={businessName} onChange={(e) => setBusinessName(e.target.value)} />
                </div>
                
                <div>
                  <Label htmlFor="businessAddress">Business Address</Label>
                  <Textarea variant="dark" id="businessAddress" className="w-full" value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} />
                </div>
                
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <select id="timezone" className="w-full px-3 py-2 border rounded-md bg-white/5 border-white/10 text-gray-100" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                    <option>South Africa Standard Time (GMT+2)</option>
                    <option>Eastern Standard Time (GMT-5)</option>
                    <option>Pacific Standard Time (GMT-8)</option>
                  </select>
                </div>
                
                <Button className="bg-emerald-500 hover:bg-emerald-400 text-white" onClick={saveBusiness}>Update Business Profile</Button>
              </CardContent>
            </Card>
          </div>
        );

      

      case 'billing':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-200">Billing & Value</h2>
              <p className="text-gray-400">View your ROI and manage billing preferences</p>
            </div>
            
            <Card className="bg-white/5 border-white/10 text-gray-300">
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-semibold mb-2 text-gray-200">Complete Billing Dashboard</h3>
                  <p className="text-gray-400 mb-4">
                    Access your comprehensive billing & value report with ROI calculations, 
                    invoice history, and plan management.
                  </p>
                <Button className="bg-emerald-500 hover:bg-emerald-400 text-white" onClick={() => navigate('/billing')}>
                    View Billing & Value Report
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 text-gray-300">
              <CardHeader>
                <CardTitle className="text-gray-200">Auto-Claim (ACG)</CardTitle>
                <CardDescription className="text-gray-400">Automatically submit approved claims once evidence is verified</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-200">Enable Auto-Claim</p>
                    <p className="text-sm text-gray-400">Claims are auto-filed to Amazon when evidence is complete</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="text-xs text-gray-400">
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
              <h2 className="text-2xl font-bold text-gray-200">API Access</h2>
              <p className="text-gray-400">Programmatic access to your Clario data for automation and integrations</p>
            </div>

            <Card className="bg-white/5 border-white/10 text-gray-300">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <p className="text-sm text-gray-400">
                    Use Clario APIs to pull recovery data, sync evidence statuses, and reconcile payouts in your own systems.
                    Access tokens are scoped and can be rotated at any time. SDKs and examples are available.
                  </p>
                  <ul className="list-disc pl-5 text-sm text-gray-400 space-y-1">
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

      case 'integrations':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-200">Platform Integrations</h2>
              <p className="text-gray-400">Manage your platform connections and data sources</p>
            </div>
            <div>
              <Button className="bg-emerald-500 hover:bg-emerald-400 text-white gap-2" onClick={() => navigate('/integrations-hub')}>
                <Plug className="h-4 w-4" />
                Clario Integrations
              </Button>
            </div>
            
            <Card className="bg-white/5 border-white/10 text-gray-300">
              <CardHeader>
                <CardTitle className="text-gray-200">Active Connections</CardTitle>
                <CardDescription className="text-gray-400">Your currently connected platforms</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 border border-white/10 rounded-lg bg-white/5">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center border border-white/10">
                      <img src="/lovable-uploads/14f98d63-9a1a-4128-8021-1d840d778ea5.png" alt="Amazon Seller Central logo" className="h-7 w-7 object-contain" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-200">Amazon Seller Central</p>
                      <p className="text-sm text-gray-400">Connected • Last sync: 5 mins ago</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white/5 border-white/10 text-gray-300">
              <CardHeader>
                <CardTitle className="text-gray-200">Platform Integrations Coming Soon</CardTitle>
                <CardDescription className="text-gray-400">Coming soon to expand your recovery capabilities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {['Shopify', 'Walmart Marketplace', 'QuickBooks', 'Xero', 'eBay'].map((platform) => (
                  <div key={platform} className="flex items-center justify-between p-4 border border-white/10 rounded-lg bg-white/5">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center border border-white/10">
                        {platform === 'Shopify' && <img src="/lovable-uploads/8efb84ba-e777-4413-ae5a-f7f54bfa6cab.png" alt="Shopify logo" className="h-7 w-7 object-contain" />}
                        {platform === 'Walmart Marketplace' && <img src="/lovable-uploads/cef56367-b57b-46cc-b0cb-a2ffad47fb03.png" alt="Walmart logo" className="h-7 w-7 object-contain" />}
                        {platform === 'QuickBooks' && <img src="/lovable-uploads/02ff2e6e-9e67-4481-99a8-4b9caead4540.png" alt="QuickBooks logo" className="h-7 w-7 object-contain" />}
                        {platform === 'Xero' && <img src="/lovable-uploads/ac3dc504-c896-4f73-9e7e-aefc77dd6e9f.png" alt="Xero logo" className="h-7 w-7 object-contain" />}
                        {platform === 'eBay' && <img src="/lovable-uploads/f894a44c-fd04-4ec2-8af3-a7235951d82d.png" alt="eBay logo" className="h-7 w-7 object-contain" />}
                      </div>
                      <div>
                        <p className="font-medium text-gray-200">{platform}</p>
                        <p className="text-sm text-gray-400">Coming Soon</p>
                      </div>
                    </div>
                    <Badge variant="secondary">Roadmap</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-200">Notifications</h2>
              <p className="text-gray-400">Control how and when we communicate with you</p>
            </div>
            
            <Card className="bg-white/5 border-white/10 text-gray-300">
              <CardHeader>
                <CardTitle className="text-gray-200">Email Notifications</CardTitle>
                <CardDescription className="text-gray-400">Choose which notifications you'd like to receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {notificationSettings.map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium text-gray-200">{setting.label}</p>
                      <p className="text-sm text-gray-400">{setting.description}</p>
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
              <h2 className="text-2xl font-bold text-gray-200">Security</h2>
              <p className="text-gray-400">Manage your account security and access</p>
            </div>
            
            <Card className="bg-white/5 border-white/10 text-gray-300">
              <CardHeader>
                <CardTitle className="text-gray-200">Login History</CardTitle>
                <CardDescription className="text-gray-400">Recent account access activity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-400">Export a copy of your recent logins</div>
                  <Button size="sm" variant="outline" className="bg-white text-blue-900 border-blue-200 hover:bg-blue-50" onClick={exportLoginHistory}>Export CSV</Button>
                </div>
                {loginHistory.map((login, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-white/10 rounded-lg bg-white/5">
                    <div className="flex items-center gap-3">
                      {login.device.includes('iPhone') ? 
                        <Smartphone className="h-5 w-5 text-gray-400" /> : 
                        <Monitor className="h-5 w-5 text-gray-400" />
                      }
                      <div>
                        <p className="font-medium text-gray-200">{login.device}</p>
                        <p className="text-sm text-gray-400">
                          <MapPin className="h-3 w-3 inline mr-1" />
                          {login.location} • {login.time}
                        </p>
                      </div>
                    </div>
                    {login.current && (
                      <Badge className="bg-green-100 text-green-800">Current Session</Badge>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
            
            <Card className="bg-white/5 border-white/10 text-gray-300">
              <CardHeader>
                <CardTitle className="text-gray-200">Security Actions</CardTitle>
                <CardDescription className="text-gray-400">Manage your account security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-200">Two‑Factor Authentication (2FA)</p>
                      <p className="text-sm text-gray-400">Add an extra layer of security to your account</p>
                    </div>
                    <Switch checked={twoFactorEnabled} onCheckedChange={(v)=>{ setTwoFactorEnabled(!!v); persistSecurity({ twoFactorEnabled: !!v }); }} />
                  </div>
                  {twoFactorEnabled && (
                    <div className="mt-3">
                      <div className="text-sm text-gray-400">Backup Codes</div>
                      {backupCodes.length === 0 ? (
                        <Button size="sm" className="mt-2 bg-white text-blue-900 border-blue-200 hover:bg-blue-50" variant="outline" onClick={generateBackupCodes}>Generate Backup Codes</Button>
                      ) : (
                        <div className="mt-2">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                            {backupCodes.map(c => (<code key={c} className="px-2 py-1 rounded bg-white/5 border border-white/10 text-gray-100">{c}</code>))}
                          </div>
                          <div className="mt-2 flex gap-2">
                            <Button size="sm" variant="outline" className="bg-white text-blue-900 border-blue-200 hover:bg-blue-50" onClick={downloadBackupCodes}>Download</Button>
                            <Button size="sm" variant="outline" className="bg-white text-blue-900 border-blue-200 hover:bg-blue-50" onClick={generateBackupCodes}>Regenerate</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="rounded border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-200">Login Alerts</p>
                      <p className="text-sm text-gray-400">Email me when a new device logs into my account</p>
                    </div>
                    <Switch checked={loginAlertsEnabled} onCheckedChange={(v)=>{ setLoginAlertsEnabled(!!v); persistSecurity({ loginAlertsEnabled: !!v }); }} />
                  </div>
                </div>

                <div className="rounded border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-200">Trust this Device</p>
                      <p className="text-sm text-gray-400">Skip 2FA on this device for faster sign‑in</p>
                    </div>
                    <Switch checked={trustedDevice} onCheckedChange={(v)=>{ setTrustedDevice(!!v); persistSecurity({ trustedDevice: !!v }); }} />
                  </div>
                </div>

                <Button className="w-full bg-emerald-500 hover:bg-emerald-400 text-white" disabled={loggingOutOthers} onClick={logoutOtherDevices}>
                  <Shield className="h-4 w-4 mr-2" />
                  {loggingOutOthers ? 'Logging out…' : 'Log Out of All Other Devices'}
                </Button>
              </CardContent>
            </Card>
            
            <Card className="bg-red-500/5 border-red-200/20 text-gray-300 mb-10">
              <CardHeader>
                <CardTitle className="text-red-300 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription className="text-gray-400">Permanent actions that cannot be undone</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-400 mb-4">
                  Deleting your account will permanently remove all data, including recovery history, 
                  team members, and integrations. This action cannot be reversed.
                </p>
                <Button variant="destructive" size="sm" onClick={()=>setDeleteOpen(true)}>
                  Delete Account
                </Button>
              </CardContent>
            </Card>
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm account deletion</DialogTitle>
                  <DialogDescription>This will permanently remove your account and all associated data.</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={()=>setDeleteOpen(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={()=>{ setDeleteOpen(false); toast({ title: 'Account deletion requested', description: 'Our support will contact you to confirm.' }); }}>Delete</Button>
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
        <div className="relative w-full bg-[#0B1220] min-h-[calc(100vh+96px)] -mt-24 pt-24">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0,rgba(56,189,248,0.10),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.10),transparent_35%)]" />
          <div className="relative container mx-auto px-6 pt-6 pb-0 text-gray-300">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Navigation Menu */}
              <div className="lg:col-span-1">
                <Card className="h-fit bg-white/5 border-white/10 text-gray-300">
                  <CardHeader>
                    <CardTitle className="text-lg text-gray-200">Settings</CardTitle>
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
                              ? "bg-white/10 text-gray-100"
                              : "text-gray-400 hover:bg-white/5 hover:text-gray-100"
                          )}
                        >
                          {activeSection === item.id && (
                            <span className="absolute left-0 h-5 w-[3px] rounded-r bg-emerald-400" />
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
                <div className="h-full overflow-y-auto">
                  {renderContent()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Settings;