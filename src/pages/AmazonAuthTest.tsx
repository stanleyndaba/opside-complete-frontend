import React, { useState } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';

export default function AmazonAuthTest() {
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    setLoading(prev => ({ ...prev, [testName]: true }));
    try {
      const result = await testFn();
      setTestResults(prev => ({ ...prev, [testName]: { success: true, data: result } }));
      toast({ title: `${testName} passed`, description: 'Test completed successfully' });
    } catch (error: any) {
      setTestResults(prev => ({ ...prev, [testName]: { success: false, error: error.message } }));
      toast({ title: `${testName} failed`, description: error.message });
    } finally {
      setLoading(prev => ({ ...prev, [testName]: false }));
    }
  };

  const tests = [
    {
      name: 'Connect Amazon',
      description: 'Test GET /api/v1/integrations/amazon/auth/start',
      fn: () => api.connectAmazon()
    },
    {
      name: 'Amazon Sandbox Callback',
      description: 'Test POST /api/v1/integrations/amazon/sandbox/callback',
      fn: () => api.completeAmazonSandboxAuth('test-state-123')
    },
    {
      name: 'Amazon Recoveries',
      description: 'Test GET /api/v1/integrations/amazon/recoveries',
      fn: () => api.getAmazonRecoveries()
    },
    {
      name: 'Integration Status',
      description: 'Test GET /api/v1/integrations/status',
      fn: () => api.getIntegrationsStatus()
    },
    {
      name: 'Sync Start',
      description: 'Test POST /api/sync/start',
      fn: () => api.startAmazonSync()
    },
    {
      name: 'Auth Me',
      description: 'Test GET /api/auth/me',
      fn: () => api.getMe()
    },
    {
      name: 'Logout',
      description: 'Test POST /api/auth/logout',
      fn: () => api.logout()
    }
  ];

  return (
    <PageLayout title="Amazon Auth Integration Test">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Amazon Authentication & Connection</CardTitle>
            <p className="text-sm text-muted-foreground">
              Test all the Amazon auth endpoints to verify Step 1 integration is working correctly.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tests.map((test) => (
                <div key={test.name} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{test.name}</h3>
                    <div className="flex items-center gap-2">
                      {loading[test.name] && <Loader2 className="h-4 w-4 animate-spin" />}
                      {testResults[test.name] && (
                        testResults[test.name].success ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{test.description}</p>
                  <Button 
                    onClick={() => runTest(test.name, test.fn)}
                    disabled={loading[test.name]}
                    size="sm"
                    variant="outline"
                  >
                    {loading[test.name] ? 'Testing...' : 'Run Test'}
                  </Button>
                  {testResults[test.name] && (
                    <div className="mt-2">
                      <Badge variant={testResults[test.name].success ? 'default' : 'destructive'}>
                        {testResults[test.name].success ? 'PASS' : 'FAIL'}
                      </Badge>
                      <pre className="text-xs mt-2 bg-muted p-2 rounded overflow-auto max-h-32">
                        {JSON.stringify(testResults[test.name], null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Expected Backend Environment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>AMAZON_SPAPI_BASE_URL:</strong> https://sandbox.sellingpartnerapi-na.amazon.com</p>
              <p><strong>AMAZON_SPAPI_CLIENT_ID:</strong> [Your Amazon SP-API Client ID]</p>
              <p><strong>AMAZON_SPAPI_CLIENT_SECRET:</strong> [Your Amazon SP-API Client Secret]</p>
              <p><strong>AMAZON_SPAPI_REDIRECT_URI:</strong> http://localhost:3000/api/v1/integrations/amazon/callback</p>
              <p><strong>AMAZON_SPAPI_REFRESH_TOKEN:</strong> [Sandbox bootstrap token]</p>
              <p><strong>COOKIE_DOMAIN:</strong> your-backend-domain</p>
              <p><strong>REDIS_URL:</strong> redis://...</p>
              <p><strong>SUPABASE_URL/ANON_KEY:</strong> [Optional; mock if missing]</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
