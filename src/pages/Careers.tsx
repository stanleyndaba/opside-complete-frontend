import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function Careers() {
  const jobs = [
    {
      title: 'UI/UX Engineer',
      location: 'Remote / Global',
      salary: '$90k – $140k + equity',
      tags: ['React', 'Design Systems', 'Figma'],
      summary: 'Own our design system and craft delightful product experiences across the Clario platform.',
      description: [
        'Build and maintain a robust, accessible design system.',
        'Partner with product to translate flows into high-clarity UIs.',
        'Instrument UX telemetry and drive iterative improvements.',
      ],
    },
    {
      title: 'Chief Financial Officer (CFO)',
      location: 'Hybrid / Remote',
      salary: '$180k – $260k + equity',
      tags: ['FinOps', 'Fundraising', 'SaaS Metrics'],
      summary: 'Lead strategic finance, design aligned pricing, and steward capital through growth and scale.',
      description: [
        'Own financial modeling, budget, and cash planning.',
        'Partner with CEO on fundraising and investor relations.',
        'Implement revenue recognition and controls aligned to GAAP.',
      ],
    },
    {
      title: 'Senior Backend Software Engineer',
      location: 'Remote / Global',
      salary: '$130k – $190k + equity',
      tags: ['Python', 'TypeScript', 'Postgres', 'FastAPI'],
      summary: 'Design resilient services for sync, claims, and evidence matching at scale.',
      description: [
        'Build APIs and pipelines with strong observability and SLAs.',
        'Optimize data models for high‑volume ingest and analytics.',
        'Harden security, auth, and privacy across services.',
      ],
    },
    {
      title: 'Systems Engineer',
      location: 'Remote / Global',
      salary: '$120k – $170k + equity',
      tags: ['SRE', 'Observability', 'Kubernetes/Render'],
      summary: 'Ensure reliability, performance, and cost‑efficiency across our platform.',
      description: [
        'Own infra automation, tracing, and alerting.',
        "Design rollouts with canaries and safe migrations.",
        'Continuously improve developer experience and CI/CD.',
      ],
    },
    {
      title: 'Quality Assurance',
      location: 'Remote / Global',
      salary: '$80k – $130k + equity',
      tags: ['Automation', 'Playwright', 'API Testing'],
      summary: 'Own quality gates end‑to‑end with test automation and data‑driven QA.',
      description: [
        'Develop automated smoke/regression suites.',
        'Define acceptance criteria with product/design.',
        'Track quality metrics and ship with confidence.',
      ],
    },
    {
      title: 'Chief Data Scientist',
      location: 'Remote / Global',
      salary: '$190k – $280k + equity',
      tags: ['ML', 'NLP', 'Causality', 'Time Series'],
      summary: 'Lead detection, scoring, and decision engines that maximize recoveries.',
      description: [
        'Own modeling roadmap (detection, ranking, auto‑submit thresholds).',
        'Partner with engineering to productionize models safely.',
        'Establish ML observability, fairness, and continuous learning.',
      ],
    },
  ];

  return (
    <PageLayout title="Careers at Clario">
      <div className="max-w-5xl mx-auto space-y-10">
        {/* Hero */}
        <section className="space-y-3 text-center">
          <h1 className="text-3xl md:text-4xl font-semibold">Build the silent finance team for FBA sellers</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">We ship production systems that recover money automatically. If you love high‑impact, owner‑mindset work, you’ll thrive here.</p>
        </section>

        {/* Benefits */}
        <section className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Why Clario</CardTitle>
              <CardDescription>Impact, ownership, and craftsmanship</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                <li>Meaningful equity and competitive comp</li>
                <li>Remote‑first, async‑friendly culture</li>
                <li>Real customer outcomes over vanity metrics</li>
                <li>Focus time, low‑meeting environment</li>
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>How we work</CardTitle>
              <CardDescription>High standards, few layers</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                <li>Small, senior teams with clear ownership</li>
                <li>Write design docs, measure outcomes</li>
                <li>Secure by default, observable by design</li>
                <li>Ship, learn, iterate</li>
              </ul>
            </CardContent>
          </Card>
        </section>

        {/* Open roles */}
        <section className="space-y-4">
          <h2 className="text-2xl font-semibold">Open Roles</h2>
          <div className="space-y-3">
            {jobs.map((job, idx) => (
              <Card key={idx} className="border-muted/70">
                <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">{job.title}</CardTitle>
                    <CardDescription>{job.location} • {job.salary}</CardDescription>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {job.tags.map((t) => (
                      <Badge key={t} variant="secondary">{t}</Badge>
                    ))}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm text-foreground">{job.summary}</p>
                  <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                    {job.description.map((d, i) => (<li key={i}>{d}</li>))}
                  </ul>
                  <div className="pt-2">
                    <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                      <a href={`mailto:careers@getclario.com?subject=${encodeURIComponent('Application: ' + job.title)}`}>Apply</a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Hiring process */}
        <section className="space-y-3">
          <h2 className="text-2xl font-semibold">Hiring Process</h2>
          <ol className="list-decimal pl-5 text-sm text-muted-foreground space-y-1">
            <li>Intro call (30m): mutual fit</li>
            <li>Technical/portfolio deep‑dive (60–90m)</li>
            <li>Practical exercise or code walkthrough</li>
            <li>Meet the team + offer</li>
          </ol>
          <p className="text-xs text-muted-foreground">We value a fast, respectful process. If you’re unsure which role fits, email <a className="underline" href="mailto:careers@getclario.com">careers@getclario.com</a>.</p>
        </section>
      </div>
    </PageLayout>
  );
}

