import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Loader2, RefreshCw, ExternalLink, User, Key, Database } from 'lucide-react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/use-toast';
import { AmazonConnect } from '@/components/AmazonConnect';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  message?: string;
  data?: any;
}

export default function Agent1Test() {
  const [tests, setTests] = useState<TestResult[]>([]);
  const [running, setRunning] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<any>(null);
  const { toast } = useToast();

  const testCases: Array<{
    name: string;
    fn: () => Promise<{ ok: boolean; data?: any; error?: string }>;
  }> = [
    {
      name: '1. API Base URL Configuration',
      fn: async () => {
        const url = api.buildApiUrl('/api/health');
        const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const expectedPort = isDev ? '3001' : '';
        const hasCorrectPort = !isDev || url.includes(':3001');
        
        return {
          ok: hasCorrectPort,
          data: { url, isDev, expectedPort },
          error: hasCorrectPort ? undefined : `Expected localhost:3001 in dev, got: ${url}`
        };
      }
    },
    {
      name: '2. OAuth Start Endpoint',
      fn: async () => {
        const response = await api.connectAmazon();
        return {
          ok: response.ok,
          data: response.data,
          error: response.error
        };
      }
    },
    {
      name: '3. Get User Profile',
      fn: async () => {
        const response = await api.getUserProfile();
        if (response.ok && response.data) {
          setUserProfile(response.data);
        }
        return {
          ok: response.ok,
          data: response.data,
          error: response.error
        };
      }
    },
    {
      name: '4. Get Connection Status',
      fn: async () => {
        const response = await api.getAmazonConnectionStatus();
        if (response.ok && response.data) {
          setConnectionStatus(response.data);
        }
        return {
          ok: response.ok,
          data: response.data,
          error: response.error
        };
      }
    },
    {
      name: '5. Get Integrations Status',
      fn: async () => {
        const response = await api.getIntegrationsStatus();
        return {
          ok: response.ok,
          data: response.data,
          error: response.error
        };
      }
    },
    {
      name: '6. Verify Token Storage (Backend Check)',
      fn: async () => {
        // This checks if backend has tokens stored (indirect check via connection status)
        const statusRes = await api.getAmazonConnectionStatus();
        if (statusRes.ok && statusRes.data?.connected) {
          // If connected, tokens are likely stored
          return {
            ok: true,
            data: { hasTokens: true, connected: true },
            error: undefined
          };
        }
        return {
          ok: false,
          data: { hasTokens: false, connected: false },
          error: 'No tokens found (Amazon not connected)'
        };
      }
    },
    {
      name: '7. OAuth Callback Simulation',
      fn: async () => {
        // Simulate callback by checking if we can access callback endpoint
        // Note: Real callback is handled by Amazon redirect, but we can test the endpoint exists
        const testUrl = api.buildApiUrl('/api/v1/integrations/amazon/auth/callback');
        try {
          // Just check if endpoint exists (will likely return error without code, but that's OK)
          const response = await fetch(testUrl + '?code=test&state=test', {
            method: 'GET',
            credentials: 'include'
          });
          // Endpoint exists if we get any response (even 400/401 is OK - means endpoint exists)
          return {
            ok: response.status !== 404,
            data: { status: response.status, endpointExists: response.status !== 404 },
            error: response.status === 404 ? 'Callback endpoint not found' : undefined
          };
        } catch (error: any) {
          return {
            ok: false,
            data: { error: error.message },
            error: `Failed to reach callback endpoint: ${error.message}`
          };
        }
      }
    }
  ];

  const runTest = async (testCase: typeof testCases[0], index: number) => {
    setTests(prev => {
      const updated = [...prev];
      updated[index] = { name: testCase.name, status: 'running' };
      return updated;
    });

    try {
      const result = await testCase.fn();
      setTests(prev => {
        const updated = [...prev];
        updated[index] = {
          name: testCase.name,
          status: result.ok ? 'passed' : 'failed',
          message: result.error || 'Success',
          data: result.data
        };
        return updated;
      });

      if (result.ok) {
        toast({
          title: 'Test Passed',
          description: testCase.name,
          duration: 2000
        });
      } else {
        toast({
          title: 'Test Failed',
          description: result.error || 'Unknown error',
          variant: 'destructive',
          duration: 3000
        });
      }
    } catch (error: any) {
      setTests(prev => {
        const updated = [...prev];
        updated[index] = {
          name: testCase.name,
          status: 'failed',
          message: error.message || 'Test error',
          data: { error: error.toString() }
        };
        return updated;
      });
      toast({
        title: 'Test Error',
        description: error.message || 'Unknown error',
        variant: 'destructive',
        duration: 3000
      });
    }
  };

  const runAllTests = async () => {
    setRunning(true);
    setTests(testCases.map(tc => ({ name: tc.name, status: 'pending' })));

    for (let i = 0; i < testCases.length; i++) {
      await runTest(testCases[i], i);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    setRunning(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'running':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <div className="h-5 w-5 w-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <Badge className="bg-green-500">Passed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'running':
        return <Badge className="bg-blue-500">Running</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  const passedCount = tests.filter(t => t.status === 'passed').length;
  const failedCount = tests.filter(t => t.status === 'failed').length;
  const totalTests = testCases.length;

  return (
    <PageLayout title="Agent 1 Test: Zero Agent Layer (OAuth)">
      <div className="space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-6 w-6" />
              Agent 1: Zero Agent Layer (OAuth & Authentication)
            </CardTitle>
            <CardDescription>
              Test OAuth flow, user profile retrieval, token storage, and connection status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Button onClick={runAllTests} disabled={running} size="lg">
                  {running ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Running Tests...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Run All Tests
                    </>
                  )}
                </Button>
                {totalTests > 0 && (
                  <div className="text-sm text-muted-foreground">
                    {passedCount} passed, {failedCount} failed, {totalTests - passedCount - failedCount} pending
                  </div>
                )}
              </div>
            </div>

            {/* OAuth Connect Component */}
            <div className="mb-6 p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Quick OAuth Test</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Use this button to test the full OAuth flow (will redirect to Amazon)
              </p>
              <AmazonConnect 
                onConnectionStart={() => toast({ title: 'OAuth Started', description: 'Redirecting to Amazon...' })}
                onConnectionComplete={(data) => {
                  toast({ title: 'OAuth Complete', description: 'Connection successful!' });
                  // Refresh status after connection
                  setTimeout(() => {
                    api.getAmazonConnectionStatus().then(res => {
                      if (res.ok) setConnectionStatus(res.data);
                    });
                  }, 2000);
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              Individual test results for Agent 1 functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tests.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Click "Run All Tests" to start testing
                </div>
              ) : (
                tests.map((test, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(test.status)}
                        <span className="font-medium">{test.name}</span>
                        {getStatusBadge(test.status)}
                      </div>
                      {test.status === 'pending' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => runTest(testCases[index], index)}
                        >
                          Run
                        </Button>
                      )}
                    </div>
                    {test.message && (
                      <div className={`text-sm mt-2 ${test.status === 'failed' ? 'text-red-500' : 'text-muted-foreground'}`}>
                        {test.message}
                      </div>
                    )}
                    {test.data && (
                      <details className="mt-2">
                        <summary className="text-sm text-muted-foreground cursor-pointer">
                          View Details
                        </summary>
                        <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-40">
                          {JSON.stringify(test.data, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* User Profile Display */}
        {userProfile && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                User Profile
              </CardTitle>
              <CardDescription>
                Current user profile from Agent 1
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="text-xs bg-muted p-4 rounded overflow-auto">
                {JSON.stringify(userProfile, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Connection Status Display */}
        {connectionStatus && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Connection Status
              </CardTitle>
              <CardDescription>
                Amazon connection status and token information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Connected:</span>
                  <Badge variant={connectionStatus.connected ? "default" : "secondary"}>
                    {connectionStatus.connected ? 'Yes' : 'No'}
                  </Badge>
                </div>
                {connectionStatus.sandboxMode !== undefined && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Sandbox Mode:</span>
                    <Badge variant={connectionStatus.sandboxMode ? "secondary" : "default"}>
                      {connectionStatus.sandboxMode ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                )}
                {connectionStatus.lastSync && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Last Sync:</span>
                    <span className="text-sm text-muted-foreground">
                      {new Date(connectionStatus.lastSync).toLocaleString()}
                    </span>
                  </div>
                )}
                <details className="mt-4">
                  <summary className="text-sm text-muted-foreground cursor-pointer">
                    View Full Status
                  </summary>
                  <pre className="mt-2 text-xs bg-muted p-4 rounded overflow-auto">
                    {JSON.stringify(connectionStatus, null, 2)}
                  </pre>
                </details>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>Testing Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p><strong>1. API Configuration Test:</strong> Verifies backend URL is correctly set (localhost:3001 for dev)</p>
              <p><strong>2. OAuth Start Test:</strong> Tests the OAuth initiation endpoint</p>
              <p><strong>3. User Profile Test:</strong> Retrieves user profile after OAuth</p>
              <p><strong>4. Connection Status Test:</strong> Checks Amazon connection status</p>
              <p><strong>5. Integrations Status Test:</strong> Gets overall integrations status</p>
              <p><strong>6. Token Storage Test:</strong> Verifies tokens are stored (indirect check)</p>
              <p><strong>7. OAuth Callback Test:</strong> Verifies callback endpoint exists</p>
              <p className="mt-4 text-muted-foreground">
                <strong>Note:</strong> For full OAuth flow testing, use the "Connect Amazon Account" button above. 
                This will redirect you to Amazon for authentication, then back to the callback page.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}

