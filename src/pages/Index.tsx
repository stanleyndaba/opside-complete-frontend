
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
          <p className="text-muted-foreground max-w-xl mx-auto">We find, file, and track Amazon reimbursements for you. No win, no fee (20% cap).</p>
          <Button onClick={signInWithAmazon} size="lg">Sign in with Amazon</Button>
          {/* Frontend-only demo: enable demo mode to bypass login for previews */}
          <div>
            <Button variant="outline" size="sm" onClick={() => { localStorage.setItem('demo_mode', '1'); window.location.reload(); }}>
              Enter Demo Mode
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">Secure • Encrypted • No engineering required</div>
        </div>
      </div>
    );
  }
  return <Dashboard />;
};

export default Index;
