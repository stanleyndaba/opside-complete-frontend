import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';

export default function Careers() {
  return (
    <PageLayout title="Careers at Clario">
      <div className="max-w-3xl mx-auto space-y-6">
        <p className="text-muted-foreground">
          We’re building the operating system for FBA reimbursements. Join us to ship impactful, production-grade systems that deliver money back to sellers.
        </p>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Open Roles</h2>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
            <li>Senior Full-Stack Engineer (TypeScript, FastAPI)</li>
            <li>Backend Engineer (Python, data pipelines)</li>
            <li>Product Designer (B2B dashboards)</li>
          </ul>
          <p className="text-sm text-muted-foreground">Don’t see a fit? Send your CV to careers@getclario.com</p>
        </div>
      </div>
    </PageLayout>
  );
}

