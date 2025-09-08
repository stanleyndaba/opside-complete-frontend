import React, { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  User, Building2, Users, CreditCard, Zap, Bell, Shield, 
  Upload, MapPin, Clock, Monitor, Smartphone, AlertTriangle,
  CheckCircle, Calendar, Globe, Camera
} from 'lucide-react';
import { cn } from '@/lib/utils';

type SettingsSection = 'profile' | 'business' | 'team' | 'billing' | 'integrations' | 'notifications' | 'security';

const Settings = () => {
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile');

  const menuItems = [
    { id: 'profile' as SettingsSection, label: 'Your Profile', icon: User },
    { id: 'business' as SettingsSection, label: 'Business Profile', icon: Building2 },
    { id: 'team' as SettingsSection, label: 'Team Management', icon: Users },
    { id: 'billing' as SettingsSection, label: 'Billing & Value', icon: CreditCard },
    { id: 'integrations' as SettingsSection, label: 'Integrations Hub', icon: Zap },
    { id: 'notifications' as SettingsSection, label: 'Notifications', icon: Bell },
    { id: 'security' as SettingsSection, label: 'Security', icon: Shield }
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
              <h2 className="text-2xl font-bold">Your Profile</h2>
              <p className="text-muted-foreground">Manage your personal account information</p>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your personal details and profile picture</CardDescription>
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
                    <Button variant="outline" size="sm">
                      <Camera className="h-4 w-4 mr-2" />
                      Upload Photo
                    </Button>
                    <p className="text-sm text-muted-foreground mt-1">
                      JPG, PNG or GIF. Max size 5MB.
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" defaultValue="Thandi" />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" defaultValue="Mthembu" />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" defaultValue="thandi@example.com" disabled />
                    <p className="text-sm text-muted-foreground mt-1">
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
              <h2 className="text-2xl font-bold">Business Profile</h2>
              <p className="text-muted-foreground">Manage your company information and preferences</p>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Company Details</CardTitle>
                <CardDescription>Information used for invoicing and records</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="businessName">Business Name</Label>
                  <Input id="businessName" defaultValue="Thandi's Trading Co." />
                </div>
                
                <div>
                  <Label htmlFor="businessAddress">Business Address</Label>
                  <textarea 
                    id="businessAddress"
                    className="w-full px-3 py-2 border rounded-md min-h-[80px]"
                    defaultValue="123 Business Ave&#10;Johannesburg, 2001&#10;South Africa"
                  />
                </div>
                
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <select id="timezone" className="w-full px-3 py-2 border rounded-md">
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

      case 'team':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Team Management</h2>
              <p className="text-muted-foreground">Manage team members and their access permissions</p>
            </div>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Full Team Management</h3>
                  <p className="text-muted-foreground mb-4">
                    Access the complete team management interface with role-based permissions, 
                    member invitations, and access control.
                  </p>
                  <Button onClick={() => window.location.href = '/team-management'}>
                    Go to Team Management
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'billing':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Billing & Value</h2>
              <p className="text-muted-foreground">View your ROI and manage billing preferences</p>
            </div>
            
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Complete Billing Dashboard</h3>
                  <p className="text-muted-foreground mb-4">
                    Access your comprehensive billing & value report with ROI calculations, 
                    invoice history, and plan management.
                  </p>
                  <Button onClick={() => window.location.href = '/billing'}>
                    View Billing & Value Report
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
              <h2 className="text-2xl font-bold">Integrations Hub</h2>
              <p className="text-muted-foreground">Manage your platform connections and data sources</p>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Active Connections</CardTitle>
                <CardDescription>Your currently connected platforms</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Globe className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium">Amazon Seller Central</p>
                      <p className="text-sm text-muted-foreground">Connected • Last sync: 5 mins ago</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Integrations Coming Soon</CardTitle>
                <CardDescription>Aligned with your Connections — more platforms on the way</CardDescription>
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
              <h2 className="text-2xl font-bold">Notifications</h2>
              <p className="text-muted-foreground">Control how and when we communicate with you</p>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
                <CardDescription>Choose which notifications you'd like to receive</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {notificationSettings.map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">{setting.label}</p>
                      <p className="text-sm text-muted-foreground">{setting.description}</p>
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
              <h2 className="text-2xl font-bold">Security</h2>
              <p className="text-muted-foreground">Manage your account security and access</p>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Login History</CardTitle>
                <CardDescription>Recent account access activity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {loginHistory.map((login, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {login.device.includes('iPhone') ? 
                        <Smartphone className="h-5 w-5 text-muted-foreground" /> : 
                        <Monitor className="h-5 w-5 text-muted-foreground" />
                      }
                      <div>
                        <p className="font-medium">{login.device}</p>
                        <p className="text-sm text-muted-foreground">
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
            
            <Card>
              <CardHeader>
                <CardTitle>Security Actions</CardTitle>
                <CardDescription>Manage your account security</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full">
                  <Shield className="h-4 w-4 mr-2" />
                  Log Out of All Other Devices
                </Button>
              </CardContent>
            </Card>
            
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>Permanent actions that cannot be undone</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
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
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
        {/* Navigation Menu */}
        <div className="lg:col-span-1">
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-lg">Settings</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <nav className="space-y-1 p-2">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors text-left",
                      activeSection === item.id
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
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
    </PageLayout>
  );
};

export default Settings;