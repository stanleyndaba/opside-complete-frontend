import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';

export default function About() {
  return (
    <PageLayout title="About Clario">
      <div className="max-w-3xl mx-auto space-y-6">
        <p className="text-muted-foreground">
          Clario automates FBA reimbursements end-to-end: detecting opportunities, gathering evidence, and filing claims — transparently and securely.
        </p>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Our Mission</h2>
          <p className="text-sm text-muted-foreground">Make recovering money from Amazon effortless, accurate, and fast for every seller.</p>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">What We Do</h2>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
            <li>Continuously sync FBA operational and financial data</li>
            <li>Detect overcharges, lost inventory, damaged units, and misapplied fees</li>
            <li>Ingest and match evidence from Gmail/Outlook/Drive/Dropbox</li>
            <li>Auto-file and track claims; reconcile approved payouts</li>
          </ul>
        </div>
      </div>
    </PageLayout>
  );
}

