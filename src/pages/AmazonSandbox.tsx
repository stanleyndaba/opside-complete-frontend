import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

export default function AmazonSandboxPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const state = searchParams.get('state');

  useEffect(() => {
    // Simulate Amazon OAuth completion after a brief delay
    const timer = setTimeout(async () => {
      try {
        // Call the backend to complete the sandbox OAuth
        await api.completeAmazonSandboxAuth(state || '');
        
        // Redirect to analyzing screen
        navigate('/auth/analyzing?source=amazon');
      } catch (error) {
        console.error('Sandbox auth failed:', error);
        navigate('/integrations-hub?error=auth_failed');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [state, navigate]);

  return (
    <PageLayout title="Connecting to Amazon">
      <div className="max-w-md mx-auto mt-20">
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              Connecting to Amazon...
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
            </div>
            <p className="text-muted-foreground">
              Simulating Amazon Seller Central authentication...
            </p>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Requesting permissions...</span>
                <span className="text-green-600">✓</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Verifying account...</span>
                <span className="text-green-600">✓</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Connecting to SP-API...</span>
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  );
}
