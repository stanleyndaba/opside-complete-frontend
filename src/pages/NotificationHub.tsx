import React, { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  CheckCircle, 
  FileText, 
  Users, 
  FileCheck, 
  Shield, 
  TrendingUp, 
  Sparkles
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface Notification {
  id: string;
  type: string;
  icon: React.ElementType;
  message: string;
  timestamp: string;
  channels: string[];
  read: boolean;
}

interface NotificationPreference {
  id: string;
  title: string;
  description: string;
  category: string;
  icon: React.ElementType;
  email: boolean;
  inApp: boolean;
}

export default function NotificationHub() {
  const [notifications] = useState<Notification[]>([
    {
      id: '1',
      type: 'payout',
      icon: DollarSign,
      message: 'Payout of $75.50 for Case #OPS-12345 has been confirmed by Amazon',
      timestamp: '2 hours ago',
      channels: ['Email', 'In-App'],
      read: false
    },
    {
      id: '2',
      type: 'recovery',
      icon: CheckCircle,
      message: 'New recovery guaranteed: $125.00 for damaged inventory claim',
      timestamp: '1 day ago',
      channels: ['Email', 'In-App'],
      read: true
    },
    {
      id: '3',
      type: 'document',
      icon: FileCheck,
      message: 'Invoice "Q3-Amazon-Fees.pdf" has been successfully processed',
      timestamp: '2 days ago',
      channels: ['In-App'],
      read: true
    },
    {
      id: '4',
      type: 'team',
      icon: Users,
      message: 'Sarah Johnson has joined your team',
      timestamp: '3 days ago',
      channels: ['Email', 'In-App'],
      read: true
    },
    {
      id: '5',
      type: 'invoice',
      icon: FileText,
      message: 'New invoice issued: $37.50 performance fee for October recoveries',
      timestamp: '1 week ago',
      channels: ['Email', 'In-App'],
      read: true
    }
  ]);

  const [preferences, setPreferences] = useState<NotificationPreference[]>([
    {
      id: 'recovery-guaranteed',
      title: 'New Recovery is Guaranteed',
      description: 'When our system files a claim and guarantees its value',
      category: 'Financial Milestones',
      icon: CheckCircle,
      email: true,
      inApp: true
    },
    {
      id: 'payout-confirmed',
      title: 'Payout is Confirmed',
      description: 'When Amazon confirms funds have been disbursed',
      category: 'Financial Milestones',
      icon: DollarSign,
      email: true,
      inApp: true
    },
    {
      id: 'invoice-issued',
      title: 'New Invoice is Issued',
      description: 'When we bill for our performance fee',
      category: 'Financial Milestones',
      icon: FileText,
      email: true,
      inApp: true
    },
    {
      id: 'team-member-joins',
      title: 'New Team Member Joins',
      description: 'When an invited user accepts their invitation',
      category: 'Account & Security',
      icon: Users,
      email: true,
      inApp: true
    },
    {
      id: 'document-processed',
      title: 'Document Successfully Processed',
      description: 'Confirmation that uploaded invoice has been verified',
      category: 'Account & Security',
      icon: FileCheck,
      email: false,
      inApp: true
    },
    {
      id: 'device-login',
      title: 'New Device Logs In',
      description: 'Critical security alert for account access',
      category: 'Account & Security',
      icon: Shield,
      email: true,
      inApp: true
    },
    {
      id: 'monthly-summary',
      title: 'Monthly Performance Summary',
      description: 'Curated digest of total value delivered',
      category: 'Platform & Performance',
      icon: TrendingUp,
      email: true,
      inApp: false
    },
    {
      id: 'product-updates',
      title: 'Product News & Updates',
      description: 'Alerts about new features and improvements',
      category: 'Platform & Performance',
      icon: Sparkles,
      email: false,
      inApp: true
    }
  ]);

  const updatePreference = (id: string, channel: 'email' | 'inApp', value: boolean) => {
    setPreferences(prev => prev.map(pref => 
      pref.id === id ? { ...pref, [channel]: value } : pref
    ));
  };

  const categories = [
    'Financial Milestones',
    'Account & Security', 
    'Platform & Performance'
  ];

  const getChannelBadges = (channels: string[]) => {
    return channels.map(channel => (
      <Badge key={channel} variant="secondary" className="text-xs">
        {channel}
      </Badge>
    ));
  };

  return (
    <PageLayout title="Notification Hub & Preferences">
      <div className="space-y-8">
        {/* Notification Log */}
        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Notification Log
            </h2>
            <p className="text-sm text-muted-foreground">
              Complete history of all notifications sent to you. Nothing hidden.
            </p>
          </div>

          <div className="space-y-4">
            {notifications.map((notification) => {
              const IconComponent = notification.icon;
              return (
                <div
                  key={notification.id}
                  className={`flex items-start gap-4 p-4 rounded-lg border transition-colors ${
                    !notification.read 
                      ? 'bg-muted/50 border-primary/20' 
                      : 'bg-background hover:bg-muted/30'
                  }`}
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <IconComponent className="w-4 h-4 text-primary" />
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground mb-1">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{notification.timestamp}</span>
                      <div className="flex gap-1">
                        {getChannelBadges(notification.channels)}
                      </div>
                    </div>
                  </div>
                  
                  {!notification.read && (
                    <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2"></div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>

        {/* Notification Preferences */}
        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Notification Preferences
            </h2>
            <p className="text-sm text-muted-foreground">
              Complete control over how and when you hear from us. Respect for your attention.
            </p>
          </div>

          <div className="space-y-8">
            {categories.map((category) => {
              const categoryPrefs = preferences.filter(pref => pref.category === category);
              
              return (
                <div key={category}>
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-foreground mb-1">
                      {category}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {category === 'Financial Milestones' && 'High-signal, essential updates about your money'}
                      {category === 'Account & Security' && 'Important account and security notifications'}
                      {category === 'Platform & Performance' && 'Updates about platform features and performance'}
                    </p>
                  </div>

                  <div className="space-y-4">
                    {categoryPrefs.map((pref) => {
                      const IconComponent = pref.icon;
                      return (
                        <div key={pref.id} className="flex items-start gap-4 p-4 border rounded-lg">
                          <div className="flex-shrink-0 mt-1">
                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                              <IconComponent className="w-4 h-4 text-secondary-foreground" />
                            </div>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-foreground mb-1">
                              {pref.title}
                            </h4>
                            <p className="text-xs text-muted-foreground mb-3">
                              {pref.description}
                            </p>
                            
                            <div className="flex items-center gap-6">
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={pref.email}
                                  onCheckedChange={(checked) => 
                                    updatePreference(pref.id, 'email', checked)
                                  }
                                />
                                <span className="text-xs text-muted-foreground">Email</span>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={pref.inApp}
                                  onCheckedChange={(checked) => 
                                    updatePreference(pref.id, 'inApp', checked)
                                  }
                                />
                                <span className="text-xs text-muted-foreground">In-App</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {category !== 'Platform & Performance' && (
                    <Separator className="mt-6" />
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}