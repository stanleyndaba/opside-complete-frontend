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
        <div className="relative w-full bg-[#0B1220] min-h-[calc(100vh+32px)] -mt-20 pt-20">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_0,rgba(56,189,248,0.10),transparent_40%),radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.10),transparent_35%)]" />

          <div className="relative mx-auto max-w-3xl px-6 pt-16 md:pt-24 pb-0 text-gray-300">
            {/* Headline */}
            <header>
              <h1 className="font-brand text-4xl md:text-5xl leading-tight text-gray-100">
                Build the Unseen Engine of Commerce.
              </h1>
              <p className="mt-5 text-lg md:text-xl text-gray-400 font-body">
                We are a small, elite team of engineers and strategists building the intelligent financial layer for e-commerce. We hire for impact, ownership, and an obsession with solving hard problems.
              </p>
            </header>

            {/* Values Anchor */}
            <section className="mt-10">
              <div className="rounded-xl border border-white/10 bg-[#0F172A] shadow-2xl p-6 md:p-8 space-y-6">
                <div>
                  <h3 className="font-brand text-emerald-400 text-xl">Relentless Execution</h3>
                  <p className="mt-2 text-gray-300 font-body">We value speed and precision. We have a bias for action and a culture of shipping, learning, and iterating.</p>
                </div>
                <div>
                  <h3 className="font-brand text-emerald-400 text-xl">Beautiful Abstractions</h3>
                  <p className="mt-2 text-gray-300 font-body">We take complex, messy systems and build elegant, simple solutions. Our work is powerful on the inside and effortless on the outside.</p>
                </div>
                <div>
                  <h3 className="font-brand text-emerald-400 text-xl">Win for the Seller</h3>
                  <p className="mt-2 text-gray-300 font-body">Our success is a byproduct of our users' success. Every decision we make must answer the question: "Does this create more value for our sellers?"</p>
                </div>
                <div className="pt-2">
                  <Button asChild className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold">
                    <a href="#open-roles">View Open Roles</a>
                  </Button>
                </div>
              </div>
            </section>

            {/* Open roles */}
            <section id="open-roles" className="mt-12 space-y-6">
              <h2 className="font-body text-xl md:text-2xl font-semibold text-gray-200">Open Roles</h2>
              <div className="space-y-4">
                {jobs.map((job, idx) => (
                  <div key={idx} className="rounded-lg border border-white/10 bg-white/5">
                    <div className="p-5 md:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <div className="text-lg text-gray-100 font-semibold">{job.title}</div>
                        <div className="text-sm text-gray-400">{job.location} • {job.salary}</div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {job.tags.map((t) => (
                          <span key={t} className="px-2 py-1 rounded-md text-xs bg-white/10 text-gray-300 border border-white/10">{t}</span>
                        ))}
                      </div>
                    </div>
                    <div className="px-5 md:px-6 pb-6 space-y-2 text-gray-300">
                      <p className="text-sm">{job.summary}</p>
                      <ul className="list-disc pl-5 text-sm text-gray-400 space-y-1">
                        {job.description.map((d, i) => (<li key={i}>{d}</li>))}
                      </ul>
                      <div className="pt-2">
                        <Button asChild size="sm" className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold">
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
              <h2 className="font-body text-xl md:text-2xl font-semibold text-gray-200">Hiring Process</h2>
              <ol className="list-decimal pl-5 text-sm text-gray-400 space-y-1">
                <li>Intro call (30m): mutual fit</li>
                <li>Technical/portfolio deep‑dive (60–90m)</li>
                <li>Practical exercise or code walkthrough</li>
                <li>Meet the team + offer</li>
              </ol>
              <p className="text-xs text-gray-400">We value a fast, respectful process. If you’re unsure which role fits, email <a className="underline" href="mailto:careers@getclario.com">careers@getclario.com</a>.</p>
            </section>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}

