
import React from 'react';
import { Dashboard } from '@/components/layout/Dashboard';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

const Index = () => {
  const { user, loading, signInWithAmazon } = useAuth();
  if (loading) return null;
  if (!user) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-6">
          <h1 className="text-3xl font-bold">Recover lost FBA revenue automatically</h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Connect your Amazon Seller account. We detect and file reimbursement claims. Pay only from recovered funds.
          </p>
          <Button onClick={signInWithAmazon} size="lg">Sign in with Amazon</Button>
        </div>
      </div>
    );
  }
  return <Dashboard />;
};

export default Index;
