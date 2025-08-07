import React, { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { 
  Shield, 
  Zap, 
  Network, 
  CheckCircle, 
  AlertCircle, 
  Plus, 
  ShoppingCart,
  DollarSign,
  Mail,
  Cloud,
  Settings,
  RefreshCw,
  ArrowRight
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  category: 'marketplace' | 'storefront' | 'accounting' | 'storage' | 'email';
  status: 'active' | 'inactive' | 'syncing' | 'error';
  lastSync: string;
  icon: React.ElementType;
  description: string;
  isConnected: boolean;
}

const integrations: Integration[] = [
  {
    id: 'amazon',
    name: 'Amazon Seller Central',
    category: 'marketplace',
    status: 'active',
    lastSync: '2 minutes ago',
    icon: ShoppingCart,
    description: 'Global regions: NA, EU, JP, AU',
    isConnected: true
  },
  {
    id: 'shopify',
    name: 'Shopify',
    category: 'storefront',
    status: 'active',
    lastSync: '5 minutes ago',
    icon: ShoppingCart,
    description: 'E-commerce storefront platform',
    isConnected: true
  },
  {
    id: 'xero',
    name: 'Xero',
    category: 'accounting',
    status: 'syncing',
    lastSync: '10 minutes ago',
    icon: DollarSign,
    description: 'Accounting & finance management',
    isConnected: true
  },
  {
    id: 'quickbooks',
    name: 'QuickBooks',
    category: 'accounting',
    status: 'inactive',
    lastSync: 'Never',
    icon: DollarSign,
    description: 'Financial management software',
    isConnected: false
  },
  {
    id: 'gmail',
    name: 'Gmail IMAP',
    category: 'email',
    status: 'active',
    lastSync: '1 minute ago',
    icon: Mail,
    description: 'Email inbox for document ingestion',
    isConnected: true
  },
  {
    id: 'gdrive',
    name: 'Google Drive',
    category: 'storage',
    status: 'active',
    lastSync: '15 minutes ago',
    icon: Cloud,
    description: 'Cloud storage for invoices & documents',
    isConnected: true
  }
];

const statusConfig = {
  active: { color: 'bg-green-500', text: 'Active', icon: CheckCircle },
  inactive: { color: 'bg-gray-400', text: 'Inactive', icon: AlertCircle },
  syncing: { color: 'bg-blue-500', text: 'Syncing', icon: RefreshCw },
  error: { color: 'bg-red-500', text: 'Error', icon: AlertCircle }
};

const categoryConfig = {
  marketplace: { name: 'Marketplaces', color: 'bg-purple-100 text-purple-700' },
  storefront: { name: 'E-commerce', color: 'bg-blue-100 text-blue-700' },
  accounting: { name: 'Accounting', color: 'bg-green-100 text-green-700' },
  storage: { name: 'Storage', color: 'bg-orange-100 text-orange-700' },
  email: { name: 'Email', color: 'bg-red-100 text-red-700' }
};

export default function IntegrationsHub() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredIntegrations = integrations.filter(integration =>
    integration.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    integration.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const connectedCount = integrations.filter(i => i.isConnected).length;
  const activeCount = integrations.filter(i => i.status === 'active').length;

  return (
    <PageLayout title="Integrations Hub">
      <div className="space-y-8">
        {/* Mission Header */}
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Network className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="text-2xl">Universal Translator & Central Conduit</CardTitle>
                <CardDescription className="text-base mt-2">
                  Breaking down digital walls to create a unified language for your business ecosystem
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-primary" />
                <div>
                  <div className="font-semibold">Secure Gateway</div>
                  <div className="text-sm text-muted-foreground">Industry-best encryption</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Zap className="h-6 w-6 text-primary" />
                <div>
                  <div className="font-semibold">Intelligent Orchestration</div>
                  <div className="text-sm text-muted-foreground">Live data streams</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Network className="h-6 w-6 text-primary" />
                <div>
                  <div className="font-semibold">Unified Translation</div>
                  <div className="text-sm text-muted-foreground">Single source of truth</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Network className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-2xl font-bold">{connectedCount}</div>
                  <div className="text-sm text-muted-foreground">Connected</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">{activeCount}</div>
                  <div className="text-sm text-muted-foreground">Active</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">Live</div>
                  <div className="text-sm text-muted-foreground">Data Sync</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <div>
                  <div className="text-2xl font-bold">OAuth 2.0</div>
                  <div className="text-sm text-muted-foreground">Security</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Add New */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Search integrations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Integration
          </Button>
        </div>

        {/* Integrations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIntegrations.map((integration) => {
            const StatusIcon = statusConfig[integration.status].icon;
            const categoryInfo = categoryConfig[integration.category];
            
            return (
              <Card key={integration.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <integration.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                        <Badge variant="secondary" className={categoryInfo.color}>
                          {categoryInfo.name}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={cn("w-2 h-2 rounded-full", statusConfig[integration.status].color)} />
                      <StatusIcon className="h-4 w-4" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{integration.description}</p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Status:</span>
                      <span className={cn(
                        "font-medium",
                        integration.status === 'active' && "text-green-600",
                        integration.status === 'syncing' && "text-blue-600",
                        integration.status === 'error' && "text-red-600",
                        integration.status === 'inactive' && "text-gray-600"
                      )}>
                        {statusConfig[integration.status].text}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Last Sync:</span>
                      <span>{integration.lastSync}</span>
                    </div>
                  </div>

                  <Separator className="my-4" />

                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant={integration.isConnected ? "outline" : "default"}
                      className="flex-1"
                    >
                      {integration.isConnected ? (
                        <>
                          <Settings className="h-3 w-3 mr-2" />
                          Configure
                        </>
                      ) : (
                        <>
                          <Plus className="h-3 w-3 mr-2" />
                          Connect
                        </>
                      )}
                    </Button>
                    {integration.isConnected && (
                      <Button size="sm" variant="ghost">
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Core Capabilities */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Core Differentiator: Intelligent Orchestration</CardTitle>
            <CardDescription>
              Beyond basic connections - we create coherent conversations between your platforms
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mt-1">
                    <Shield className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Secure & Extensible Gateway</h4>
                    <p className="text-sm text-muted-foreground">
                      Robust API connectors with OAuth 2.0 and end-to-end encryption
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mt-1">
                    <Zap className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Intelligent Data Translation</h4>
                    <p className="text-sm text-muted-foreground">
                      Universal translator resolving SKUs, ASINs, and invoices into unified objects
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mt-1">
                    <Network className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Bi-Directional Orchestration</h4>
                    <p className="text-sm text-muted-foreground">
                      Central nervous system enabling command center functionality
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center mt-1">
                    <CheckCircle className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Effortless Experience</h4>
                    <p className="text-sm text-muted-foreground">
                      Simple, guided integration process with immediate visual feedback
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">Ready to expand your ecosystem?</h4>
                <p className="text-sm text-muted-foreground">Connect a new platform in just a few clicks</p>
              </div>
              <Button className="gap-2">
                Explore Integrations
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}