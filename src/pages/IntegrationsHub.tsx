import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { Shield, CheckCircle, Settings, RefreshCw, ArrowRight, ExternalLink, Package, ShoppingBag, Calculator, Truck } from 'lucide-react';
interface ActiveConnection {
  id: string;
  name: string;
  storeName: string;
  status: 'connected';
  lastSync: string;
  logo: string;
}
interface AvailableIntegration {
  id: string;
  name: string;
  category: 'marketplaces' | '3pl' | 'accounting';
  logo: string;
  description: string;
}
const activeConnections: ActiveConnection[] = [{
  id: 'amazon',
  name: 'Amazon Seller Central',
  storeName: "Thandi's FBA Store",
  status: 'connected',
  lastSync: 'Just now',
  logo: '/lovable-uploads/14f98d63-9a1a-4128-8021-1d840d778ea5.png'
}];
const availableIntegrations: AvailableIntegration[] = [
// Marketplaces
{
  id: 'shopify',
  name: 'Shopify',
  category: 'marketplaces',
  logo: '/lovable-uploads/8efb84ba-e777-4413-ae5a-f7f54bfa6cab.png',
  description: 'Connect your Shopify store for unified inventory and sales management'
}, {
  id: 'walmart',
  name: 'Walmart Marketplace',
  category: 'marketplaces',
  logo: '/lovable-uploads/cef56367-b57b-46cc-b0cb-a2ffad47fb03.png',
  description: 'Integrate your Walmart Marketplace for seamless order processing'
}, {
  id: 'ebay',
  name: 'eBay',
  category: 'marketplaces',
  logo: '/lovable-uploads/f894a44c-fd04-4ec2-8af3-a7235951d82d.png',
  description: 'Sync your eBay listings and manage orders from one dashboard'
},
// 3PLs
{
  id: 'shipbob',
  name: 'ShipBob',
  category: '3pl',
  logo: '/lovable-uploads/3a7436b5-1e89-477e-b2bd-128ec05c5c49.png',
  description: 'Connect your ShipBob fulfillment for inventory and shipping sync'
}, {
  id: 'deliverr',
  name: 'Deliverr',
  category: '3pl',
  logo: '/lovable-uploads/e2b07527-f2ad-4997-b9b1-963377193c0e.png',
  description: 'Integrate Deliverr for fast fulfillment across channels'
},
// Accounting
{
  id: 'quickbooks',
  name: 'QuickBooks',
  category: 'accounting',
  logo: '/lovable-uploads/02ff2e6e-9e67-4481-99a8-4b9caead4540.png',
  description: 'Sync financial data with QuickBooks for automated bookkeeping'
}, {
  id: 'xero',
  name: 'Xero',
  category: 'accounting',
  logo: '/lovable-uploads/ac3dc504-c896-4f73-9e7e-aefc77dd6e9f.png',
  description: 'Connect Xero for seamless financial reporting and tax preparation'
}];
const categoryConfig = {
  marketplaces: {
    name: 'Marketplaces',
    icon: ShoppingBag,
    description: 'Sell across multiple channels'
  },
  '3pl': {
    name: '3rd Party Logistics (3PLs)',
    icon: Truck,
    description: 'Streamline your fulfillment operations'
  },
  accounting: {
    name: 'Accounting',
    icon: Calculator,
    description: 'Automate your financial management'
  }
};
export default function IntegrationsHub() {
  const [lastSyncTime, setLastSyncTime] = useState('Just now');
  const [requestFormData, setRequestFormData] = useState({
    platform: '',
    description: ''
  });
  const [showRequestForm, setShowRequestForm] = useState(false);

  // Real-time sync simulation
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const seconds = now.getSeconds();
      setLastSyncTime(seconds % 10 === 0 ? 'Just now' : `${seconds % 10} seconds ago`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  const handleRequestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle request submission
    console.log('Integration request:', requestFormData);
    setRequestFormData({
      platform: '',
      description: ''
    });
    setShowRequestForm(false);
  };
  return <PageLayout title="Platform Integrations">
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">Platform Integrations</h1>
          <p className="text-muted-foreground">
            Your central command center for all platform connections
          </p>
        </div>

        {/* Section 1: Your Active Connections */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold">Active Integrations</h2>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeConnections.map(connection => <Card key={connection.id} className="border-green-200 bg-green-50/50">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={connection.logo} alt={`${connection.name} logo`} className="w-20 h-12 object-contain" />
                      <div>
                        <CardTitle className="text-lg">{connection.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          Store Name: <span className="font-medium">{connection.storeName}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-sm text-green-600 font-medium">Connected</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Last Sync:</span>
                      <span className="font-medium text-green-600">{lastSyncTime}</span>
                    </div>
                    
                    <Separator />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <Button size="sm" variant="outline" className="w-full gap-2 px-4 whitespace-nowrap justify-center">
                        <Settings className="h-3 w-3" />
                        Manage
                      </Button>
                      <Button size="sm" className="w-full gap-2 px-4 whitespace-nowrap justify-center">
                        <RefreshCw className="h-3 w-3" />
                        Start Inventory Sync
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>)}
          </div>
        </div>

        {/* Section 2: Available Integrations */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Platform Integrations Coming Soon</h2>
          
          {Object.entries(categoryConfig).map(([categoryKey, categoryInfo]) => {
          const CategoryIcon = categoryInfo.icon;
          const categoryIntegrations = availableIntegrations.filter(integration => integration.category === categoryKey);
          return <div key={categoryKey} className="space-y-4">
                <div className="flex items-center gap-3">
                  <CategoryIcon className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-semibold">{categoryInfo.name}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {categoryIntegrations.length} platforms
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {categoryInfo.description}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryIntegrations.map(integration => <Card key={integration.id} className="border-muted/50 hover:border-primary/50 transition-colors">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                          <img src={integration.logo} alt={`${integration.name} logo`} className="w-20 h-12 object-contain" />
                          <div>
                            <CardTitle className="text-lg">{integration.name}</CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                          {integration.description}
                        </p>
                        
                        <Button size="sm" variant="outline" className="w-full" disabled>
                          Connect
                        </Button>
                      </CardContent>
                    </Card>)}
                </div>
              </div>;
        })}
        </div>

        {/* Section 3: Request an Integration */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Don't see your platform?
            </CardTitle>
            <CardDescription>
              Request an integration and help guide our development roadmap
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!showRequestForm ? <Button onClick={() => setShowRequestForm(true)} className="gap-2">
                <ExternalLink className="h-4 w-4" />
                Request an Integration
              </Button> : <form onSubmit={handleRequestSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Platform Name
                  </label>
                  <Input placeholder="e.g., Etsy, BigCommerce, NetSuite..." value={requestFormData.platform} onChange={e => setRequestFormData(prev => ({
                ...prev,
                platform: e.target.value
              }))} required />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    How would this integration help your business? (Optional)
                  </label>
                  <Input placeholder="Brief description of your use case..." value={requestFormData.description} onChange={e => setRequestFormData(prev => ({
                ...prev,
                description: e.target.value
              }))} />
                </div>
                <div className="flex gap-2">
                  <Button type="submit" size="sm">
                    Submit Request
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowRequestForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>}
          </CardContent>
        </Card>
      </div>
    </PageLayout>;
}