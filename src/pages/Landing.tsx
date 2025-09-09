import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';

export default function Landing() {
  const { loginWithAmazon, enterDemo } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="container max-w-5xl p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <div className="mb-4">
              <img src="/lovable-uploads/15af441d-81d1-4a51-932f-382e12379bca.png" alt="Opside" className="h-10" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight">Amazon FBA Automated Reimbursements</h1>
            <p className="mt-4 text-muted-foreground text-lg">Recover money Amazon owes you. We detect missed reimbursements and file claims automatically—no recovery, no fee.</p>
            <Card className="mt-6 border-primary/30">
              <CardContent className="p-4">
                <div className="text-2xl font-semibold">20% Performance Fee Cap</div>
                <p className="text-sm text-muted-foreground">Only on amounts actually recovered. Transparent, aligned incentives.</p>
              </CardContent>
            </Card>
            <div className="mt-6 flex gap-3">
              <Button size="lg" onClick={loginWithAmazon}>
                Sign in with Amazon
              </Button>
              <Button size="lg" variant="outline" onClick={loginWithAmazon}>
                Connect & Start Sync
              </Button>
              <Button size="lg" variant="secondary" onClick={enterDemo}>
                Access Demo (no login)
              </Button>
            </div>
            <div className="mt-4 text-xs text-muted-foreground">By signing in, you grant permissions to read necessary Seller Central data to detect reimbursement opportunities. You can revoke access anytime.</div>
          </div>
          <div>
            <Card>
              <CardContent className="p-6">
                <ol className="space-y-4 list-decimal list-inside">
                  <li>
                    <span className="font-medium">Connect Amazon</span> – secure OAuth, no passwords.
                  </li>
                  <li>
                    <span className="font-medium">Smart Inventory Sync</span> – 1–2 min initial reconciliation.
                  </li>
                  <li>
                    <span className="font-medium">Detection</span> – we flag lost inventory, overcharges, damaged stock.
                  </li>
                  <li>
                    <span className="font-medium">Auto‑Claim</span> – generate and submit claims on your behalf.
                  </li>
                  <li>
                    <span className="font-medium">Proof & Payout</span> – download claim docs; see expected and recovered amounts.
                  </li>
                </ol>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

