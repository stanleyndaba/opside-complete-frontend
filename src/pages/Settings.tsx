import React, { useState } from 'react';
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
import { 
  User, Building2, Users, CreditCard, Zap, Bell, Shield, 
  Upload, MapPin, Clock, Monitor, Smartphone, AlertTriangle,
  CheckCircle, Calendar, Globe, Camera, Key, Plug, Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

type SettingsSection = 'profile' | 'business' | 'team' | 'billing' | 'integrations' | 'notifications' | 'security' | 'api' | 'careers';

const Settings = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');

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
                    <AvatarImage src="" />
                    <AvatarFallback className="text-lg">
                      <User className="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Camera className="h-4 w-4 mr-2" />
                      Upload Photo
                    </Button>
                    <p className="text-sm text-gray-400 mt-1">
                      JPG, PNG or GIF. Max size 5MB.
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input variant="dark" id="firstName" defaultValue="Thandi" />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input variant="dark" id="lastName" defaultValue="Mthembu" />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input variant="dark" id="email" defaultValue="thandi@example.com" disabled />
                    <p className="text-sm text-gray-400 mt-1">
                      Email is linked to your Amazon account and cannot be changed
                    </p>
                  </div>
                </div>
                
                <Button>Save Changes</Button>
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
                  <Input variant="dark" id="businessName" />
                </div>
                
                <div>
                  <Label htmlFor="businessAddress">Business Address</Label>
                  <Textarea variant="dark" id="businessAddress" className="w-full" />
                </div>
                
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <select id="timezone" className="w-full px-3 py-2 border rounded-md bg-white/5 border-white/10 text-gray-100">
                    <option>South Africa Standard Time (GMT+2)</option>
                    <option>Eastern Standard Time (GMT-5)</option>
                    <option>Pacific Standard Time (GMT-8)</option>
                  </select>
                </div>
                
                <Button>Update Business Profile</Button>
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
                  <Button onClick={() => navigate('/billing')}>
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
                  <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => navigate('/api-access')}>
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
              <Button className="bg-blue-600 hover:bg-blue-700 gap-2" onClick={() => navigate('/integrations-hub')}>
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
                    <img src="/lovable-uploads/14f98d63-9a1a-4128-8021-1d840d778ea5.png" alt="Amazon Seller Central logo" className="w-20 h-12 object-contain" />
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
                <CardTitle>Integrations Coming Soon</CardTitle>
                <CardDescription>Coming soon to expand your recovery capabilities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: 'Shopify', logo: '/lovable-uploads/8efb84ba-e777-4413-ae5a-f7f54bfa6cab.png' },
                  { name: 'Walmart Marketplace', logo: '/lovable-uploads/cef56367-b57b-46cc-b0cb-a2ffad47fb03.png' },
                  { name: 'eBay', logo: '/lovable-uploads/f894a44c-fd04-4ec2-8af3-a7235951d82d.png' },
                  { name: 'QuickBooks', logo: '/lovable-uploads/02ff2e6e-9e67-4481-99a8-4b9caead4540.png' },
                  { name: 'Xero', logo: '/lovable-uploads/ac3dc504-c896-4f73-9e7e-aefc77dd6e9f.png' },
                ].map((platform) => (
                  <div key={platform.name} className="flex items-center justify-between p-4 border rounded-lg opacity-90 bg-background">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gray-50 flex items-center justify-center border">
                        <img src={platform.logo} alt={`${platform.name} logo`} className="h-7 w-7 object-contain" />
                      </div>
                      <div>
                        <p className="font-medium">{platform.name}</p>
                        <p className="text-sm text-muted-foreground">Coming Soon</p>
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
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  <Shield className="h-4 w-4 mr-2" />
                  Log Out of All Other Devices
                </Button>
              </CardContent>
            </Card>
            
            <Card className="bg-red-500/5 border-red-200/20 text-gray-300">
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
                <Button variant="destructive" size="sm">
                  Delete Account
                </Button>
              </CardContent>
            </Card>
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