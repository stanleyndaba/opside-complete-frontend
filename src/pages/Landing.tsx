import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

export default function Landing() {
  const { loginWithAmazon } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container max-w-4xl mx-auto px-4 py-16">
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-2">
            <img src="/lovable-uploads/15af441d-81d1-4a51-932f-382e12379bca.png" className="h-8 w-auto" alt="Opside" />
            <span className="font-semibold">Opside</span>
          </div>
          <Button variant="outline" onClick={loginWithAmazon}>Sign in with Amazon</Button>
        </header>

        <main className="space-y-10">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
              Automated Amazon FBA Reimbursements
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Recover money you’re owed for lost, damaged, and overcharged FBA inventory. Only pay when we recover for you.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6 space-y-2">
                <h3 className="font-semibold">Guaranteed Detection</h3>
                <p className="text-sm text-muted-foreground">We continuously scan shipments, fees, and returns to find missed reimbursements.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 space-y-2">
                <h3 className="font-semibold">Hands‑Off Disputes</h3>
                <p className="text-sm text-muted-foreground">We assemble evidence and file claims automatically with full transparency.</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 space-y-2">
                <h3 className="font-semibold">20% Performance Cap</h3>
                <p className="text-sm text-muted-foreground">You keep 80%. We cap at 20% of recovered value, no surprises.</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center justify-center">
            <Button size="lg" onClick={loginWithAmazon}>
              Sign in with Amazon
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
}

