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
    <PageLayout title="Careers">
      <div className="relative -m-4 lg:-m-6">
        <div className="relative w-full bg-white min-h-[calc(100vh+96px)] -mt-24 pt-24">

              <div className="relative mx-auto max-w-3xl px-6 pt-16 md:pt-24 pb-12 md:pb-16 text-gray-700">
            {/* Headline */}
            <header>
              <h1 className="font-brand text-4xl md:text-5xl leading-tight text-gray-900">
                Build the Unseen Engine of Commerce.
              </h1>
              <p className="mt-5 text-lg md:text-xl text-gray-600 font-body">
                We are a small, elite team of engineers and strategists building the intelligent financial layer for e-commerce. We hire for impact, ownership, and an obsession with solving hard problems.
              </p>
            </header>

            {/* Open roles */}
            <section id="open-roles" className="mt-12 space-y-6">
              <h2 className="font-body text-xl md:text-2xl font-semibold text-gray-900">Open Roles</h2>
              <div className="space-y-4">
                {jobs.map((job, idx) => (
                  <div key={idx} className="rounded-lg border border-gray-200 bg-white shadow-sm">
                    <div className="p-5 md:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <div className="text-lg text-gray-900 font-semibold">{job.title}</div>
                        <div className="text-sm text-gray-600">{job.location} • {job.salary}</div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {job.tags.map((t) => (
                          <span key={t} className="px-2 py-1 rounded-md text-xs bg-gray-100 text-gray-700 border border-gray-200">{t}</span>
                        ))}
                      </div>
                    </div>
                    <div className="px-5 md:px-6 pb-6 space-y-2 text-gray-700">
                      <p className="text-sm">{job.summary}</p>
                      <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
                        {job.description.map((d, i) => (<li key={i}>{d}</li>))}
                      </ul>
                      <div className="pt-2">
                        <Button asChild size="sm" className="bg-emerald-500 hover:bg-emerald-400 text-white font-semibold">
                          <a href={`mailto:careers@getclario.com?subject=${encodeURIComponent('Application: ' + job.title)}`}>Apply</a>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Hiring process */}
            <section className="mt-10 space-y-3">
              <h2 className="font-body text-xl md:text-2xl font-semibold text-gray-900">Hiring Process</h2>
              <ol className="list-decimal pl-5 text-sm text-gray-600 space-y-1">
                <li>Intro call (30m): mutual fit</li>
                <li>Technical/portfolio deep‑dive (60–90m)</li>
                <li>Practical exercise or code walkthrough</li>
                <li>Meet the team + offer</li>
              </ol>
              <p className="text-xs text-gray-600">We value a fast, respectful process. If you're unsure which role fits, email <a className="underline" href="mailto:careers@getclario.com">careers@getclario.com</a>.</p>
            </section>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

