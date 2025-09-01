import React, { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  AlertTriangle, Plus, Copy, MoreHorizontal, Key, ExternalLink,
  Activity, Webhook, BookOpen, Globe, FileText, Trash2,
  CheckCircle, AlertCircle, Clock
} from 'lucide-react';
import { toast } from 'sonner';

interface ApiKey {
  id: string;
  name: string;
  publishableKey: string;
  permissions: string[];
  lastUsed: string;
  created: string;
}

interface WebhookEndpoint {
  id: string;
  url: string;
  events: string[];
  status: 'active' | 'inactive' | 'failed';
}

const ApiAccess = () => {
  const [isCreateKeyModalOpen, setIsCreateKeyModalOpen] = useState(false);
  const [isSecretKeyModalOpen, setIsSecretKeyModalOpen] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyPermissions, setNewKeyPermissions] = useState<string[]>([]);
  const [generatedSecretKey] = useState('sk_live_51HyqOKJ9sOzEF6TfY8KqGzEf9sUzEF6TfY8KqGzEf9sUzEF6TfY8KqGzEf9sUzEF6TfY8KqGz');

  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    {
      id: '1',
      name: 'Internal Dashboard',
      publishableKey: 'pk_live_aBcD...',
      permissions: ['Read-only Access'],
      lastUsed: '2 hours ago',
      created: 'Aug 15, 2024'
    }
  ]);

  const [webhooks] = useState<WebhookEndpoint[]>([
    {
      id: '1',
      url: 'https://hooks.mycompany.com/opside',
      events: ['claim.paid', 'claim.created'],
      status: 'active'
    }
  ]);

  const handlePermissionChange = (permission: string, checked: boolean) => {
    if (checked) {
      setNewKeyPermissions([...newKeyPermissions, permission]);
    } else {
      setNewKeyPermissions(newKeyPermissions.filter(p => p !== permission));
    }
  };

  const handleGenerateKey = () => {
    if (!newKeyName || newKeyPermissions.length === 0) return;
    
    const newKey: ApiKey = {
      id: Date.now().toString(),
      name: newKeyName,
      publishableKey: `pk_live_${Math.random().toString(36).substring(7)}...`,
      permissions: newKeyPermissions,
      lastUsed: 'Never',
      created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    };
    
    setApiKeys([...apiKeys, newKey]);
    setIsCreateKeyModalOpen(false);
    setIsSecretKeyModalOpen(true);
    setNewKeyName('');
    setNewKeyPermissions([]);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const revokeKey = (keyId: string) => {
    setApiKeys(apiKeys.filter(key => key.id !== keyId));
    toast.success('API key revoked successfully');
  };

  const getStatusBadge = (status: WebhookEndpoint['status']) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Inactive</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-800"><AlertCircle className="h-3 w-3 mr-1" />Failed</Badge>;
    }
  };

  return (
    <PageLayout title="API Access & Webhooks">
      <div className="space-y-6">
        {/* Critical Security Warning */}
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Security Notice</h3>
                <p className="text-yellow-700 text-sm leading-relaxed">
                  Your API keys grant full programmatic access to your Opside data. Treat them exactly like a password. 
                  Never share them publicly or commit them to version control systems like GitHub.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Keys Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Key className="h-5 w-5" />
                  Your API Keys
                </CardTitle>
                <CardDescription>
                  Generate and manage API keys for programmatic access to your account
                </CardDescription>
              </div>
              <Dialog open={isCreateKeyModalOpen} onOpenChange={setIsCreateKeyModalOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Generate New API Key
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Generate New API Key</DialogTitle>
                    <DialogDescription>
                      Create a new API key with specific permissions for your application.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="keyName">Key Name (Required)</Label>
                      <Input
                        id="keyName"
                        placeholder="e.g., Internal Dashboard, QuickBooks Integration"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Permissions (Required)</Label>
                      <div className="space-y-3 mt-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="readonly"
                            checked={newKeyPermissions.includes('Read-only Access')}
                            onCheckedChange={(checked) => 
                              handlePermissionChange('Read-only Access', checked as boolean)
                            }
                          />
                          <Label htmlFor="readonly" className="text-sm">
                            Read-only Access (Can view claims and reports)
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="readwrite"
                            checked={newKeyPermissions.includes('Read/Write Access')}
                            onCheckedChange={(checked) => 
                              handlePermissionChange('Read/Write Access', checked as boolean)
                            }
                          />
                          <Label htmlFor="readwrite" className="text-sm">
                            Read/Write Access (Can also initiate actions - future-proof)
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button 
                      onClick={handleGenerateKey}
                      disabled={!newKeyName || newKeyPermissions.length === 0}
                    >
                      Generate Key
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Publishable Key</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {apiKeys.map((key) => (
                  <TableRow key={key.id}>
                    <TableCell className="font-medium">{key.name}</TableCell>
                    <TableCell className="font-mono text-sm">{key.publishableKey}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {key.permissions.map((permission) => (
                          <Badge key={permission} variant="secondary" className="text-xs">
                            {permission}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{key.lastUsed}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{key.created}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            onClick={() => revokeKey(key.id)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Revoke Key
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Secret Key Display Modal */}
        <Dialog open={isSecretKeyModalOpen} onOpenChange={setIsSecretKeyModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Your Secret Key</DialogTitle>
              <DialogDescription>
                This is the only time your secret key will be displayed. Copy it now and store it securely.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center justify-between">
                  <code className="text-sm font-mono break-all">{generatedSecretKey}</code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(generatedSecretKey)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                </div>
              </div>
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                <p className="text-sm text-red-700">
                  Store this key safely. You won't be able to see it again after closing this dialog.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => setIsSecretKeyModalOpen(false)}>
                I've Saved My Key
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* API Usage & Analytics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              API Usage (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">1,250</p>
                <p className="text-sm text-muted-foreground">Calls (Last 24h)</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">35,600</p>
                <p className="text-sm text-muted-foreground">Calls (Month to Date)</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-muted-foreground">100,000</p>
                <p className="text-sm text-muted-foreground">Plan Limit / Month</p>
              </div>
            </div>
            
            {/* Simple chart placeholder */}
            <div className="h-48 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border flex items-center justify-center">
              <div className="text-center">
                <Activity className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">API Usage Chart</p>
                <p className="text-xs text-muted-foreground">Visual representation of daily API calls</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Webhooks Management */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Webhook className="h-5 w-5" />
                  Webhook Endpoints
                </CardTitle>
                <CardDescription>
                  Configure endpoints to receive real-time event notifications
                </CardDescription>
              </div>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Endpoint
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Endpoint URL</TableHead>
                  <TableHead>Events</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-20">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.map((webhook) => (
                  <TableRow key={webhook.id}>
                    <TableCell className="font-mono text-sm">{webhook.url}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {webhook.events.map((event) => (
                          <Badge key={event} variant="outline" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(webhook.status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600 focus:text-red-600">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Developer Resources */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Developer Resources
            </CardTitle>
            <CardDescription>
              Essential tools and documentation for API integration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="h-auto p-4 justify-start" asChild>
                <a href="#" target="_blank" rel="noopener noreferrer">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-primary" />
                    <div className="text-left">
                      <p className="font-medium">API Documentation</p>
                      <p className="text-sm text-muted-foreground">Comprehensive developer guides</p>
                    </div>
                    <ExternalLink className="h-4 w-4 ml-auto" />
                  </div>
                </a>
              </Button>
              
              <Button variant="outline" className="h-auto p-4 justify-start" asChild>
                <a href="#" target="_blank" rel="noopener noreferrer">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-green-600" />
                    <div className="text-left">
                      <p className="font-medium">API Status Page</p>
                      <p className="text-sm text-muted-foreground">Real-time service status</p>
                    </div>
                    <ExternalLink className="h-4 w-4 ml-auto" />
                  </div>
                </a>
              </Button>
              
              <Button variant="outline" className="h-auto p-4 justify-start" asChild>
                <a href="#" target="_blank" rel="noopener noreferrer">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div className="text-left">
                      <p className="font-medium">Audit Logs</p>
                      <p className="text-sm text-muted-foreground">Detailed API call history</p>
                    </div>
                    <ExternalLink className="h-4 w-4 ml-auto" />
                  </div>
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
};

export default ApiAccess;