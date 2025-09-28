import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';

export default function About() {
  const team = [
    { name: 'Stanley N.', role: 'Founder & CEO' },
    { name: 'TBD', role: 'Head of Engineering' },
    { name: 'TBD', role: 'Head of Data' },
  ];

  return (
    <PageLayout title="About Clario">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Mission */}
        <section className="space-y-3 text-center">
          <h1 className="text-3xl md:text-4xl font-semibold">Our Mission</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">End the manual work of FBA reimbursements. We recover every dollar sellers are owed — automatically, transparently, and securely.</p>
        </section>

        {/* Team */}
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Team</h2>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
            {team.map((m) => (
              <Card key={m.name} className="border-muted/70">
                <CardHeader>
                  <CardTitle className="text-base">{m.name}</CardTitle>
                  <CardDescription>{m.role}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* Numbers */}
        <section className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Focus</CardTitle>
              <CardDescription>FBA reimbursements</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Security</CardTitle>
              <CardDescription>Encryption at rest & in transit</CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Transparency</CardTitle>
              <CardDescription>Audit trail for every claim</CardDescription>
            </CardHeader>
          </Card>
        </section>

        {/* Funding & Revenue */}
        <section className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Funding</CardTitle>
              <CardDescription>Seed stage (raising)</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">We’re raising to accelerate detection, evidence automation, and global coverage. Interested? Email <a className="underline" href="mailto:investors@getclario.com">investors@getclario.com</a>.</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Revenue</CardTitle>
              <CardDescription>Aligned incentives</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">We earn when sellers get paid. Transparent, outcome‑based billing via Stripe; no hidden fees.</p>
            </CardContent>
          </Card>
        </section>

        {/* Roadmap */}
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Roadmap</h2>
          <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
            <li>Phase 1: Amazon‑only, read‑only scopes → rapid sync and detection</li>
            <li>Phase 2: Enhanced notifications, auto‑submit thresholds, sandbox filings</li>
            <li>Phase 3: RDT approval & expanded markets; advanced reconciliation</li>
          </ul>
        </section>
      </div>
    </PageLayout>
  );
}

