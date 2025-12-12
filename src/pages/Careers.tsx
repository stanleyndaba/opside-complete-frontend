import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, ArrowRight, Briefcase } from 'lucide-react';

export default function Careers() {
  const positions = [
    {
      title: 'UI/UX Engineer',
      location: 'Remote',
      type: 'Full-time',
      salary: '$90k – $140k',
      tags: ['React', 'Design Systems', 'Figma'],
      description: 'Own our design system and craft delightful product experiences across the Clario platform.',
    },
    {
      title: 'Chief Financial Officer',
      location: 'Hybrid',
      type: 'Full-time',
      salary: '$180k – $260k',
      tags: ['FinOps', 'Fundraising', 'SaaS'],
      description: 'Lead strategic finance, design aligned pricing, and steward capital through growth and scale.',
    },
    {
      title: 'Senior Backend Engineer',
      location: 'Remote',
      type: 'Full-time',
      salary: '$130k – $190k',
      tags: ['Python', 'TypeScript', 'PostgreSQL'],
      description: 'Design resilient services for sync, claims, and evidence matching at scale.',
    },
    {
      title: 'Systems Engineer',
      location: 'Remote',
      type: 'Full-time',
      salary: '$120k – $170k',
      tags: ['SRE', 'Observability', 'Kubernetes'],
      description: 'Ensure reliability, performance, and cost-efficiency across our platform.',
    },
    {
      title: 'Quality Assurance',
      location: 'Remote',
      type: 'Full-time',
      salary: '$80k – $130k',
      tags: ['Automation', 'Playwright', 'API Testing'],
      description: 'Own quality gates end-to-end with test automation and data-driven QA.',
    },
    {
      title: 'Chief Data Scientist',
      location: 'Remote',
      type: 'Full-time',
      salary: '$190k – $280k',
      tags: ['ML', 'NLP', 'Time Series'],
      description: 'Lead detection, scoring, and decision engines that maximize recoveries.',
    },
  ];

  const process = [
    { step: 1, title: 'Intro Call', description: '30 minute call to discuss mutual fit' },
    { step: 2, title: 'Technical Review', description: 'Portfolio or code deep-dive' },
    { step: 3, title: 'Practical Exercise', description: 'Async or live problem-solving' },
    { step: 4, title: 'Team Meet', description: 'Meet the team, offer within one week' },
  ];

  return (
    <PageLayout title="Careers">
      <div className="relative -m-4 lg:-m-6">
        <div className="relative w-full bg-gray-50 min-h-[calc(100vh+96px)] -mt-24 pt-24">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white via-transparent to-gray-100" />

          <div className="relative mx-auto max-w-4xl px-6 pt-12 md:pt-16 pb-16">
            {/* Header */}
            <header className="text-center mb-12">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-emerald-50 mb-4">
                <Briefcase className="h-6 w-6 text-emerald-600" />
              </div>
              <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 tracking-tight">
                Join Clario
              </h1>
              <p className="mt-4 text-base text-gray-600 max-w-lg mx-auto leading-relaxed">
                We're building the intelligent financial layer for e-commerce.
                Join a small, elite team solving hard problems with real impact.
              </p>
            </header>

            {/* Open Positions */}
            <section className="mb-12">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Open Positions</h2>
                <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                  {positions.length} roles
                </Badge>
              </div>
              <div className="grid gap-4">
                {positions.map((position, index) => (
                  <Card key={index} className="bg-white border-gray-200 shadow-sm rounded-xl hover:shadow-md transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-gray-900">{position.title}</h3>
                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 text-xs">
                              {position.salary}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{position.description}</p>
                          <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <MapPin className="h-3 w-3" />
                              {position.location}
                            </div>
                            <span className="text-gray-300">•</span>
                            {position.tags.map((tag) => (
                              <span key={tag} className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                        <Button
                          asChild
                          size="sm"
                          variant="outline"
                          className="border-gray-200 text-gray-700 hover:bg-gray-50 shrink-0"
                        >
                          <a href={`mailto:careers@getclario.com?subject=${encodeURIComponent('Application: ' + position.title)}`}>
                            Apply
                            <ArrowRight className="h-3 w-3 ml-1" />
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Hiring Process */}
            <section className="mb-12">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Hiring Process</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {process.map((item) => (
                  <Card key={item.step} className="bg-white border-gray-200 shadow-sm rounded-xl">
                    <CardContent className="p-4 text-center">
                      <div className="h-8 w-8 rounded-full bg-gray-900 text-white text-sm font-medium flex items-center justify-center mx-auto mb-3">
                        {item.step}
                      </div>
                      <h3 className="font-medium text-gray-900 text-sm mb-1">{item.title}</h3>
                      <p className="text-xs text-gray-500">{item.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Contact CTA */}
            <Card className="bg-gradient-to-br from-gray-900 to-gray-800 border-0 shadow-lg rounded-xl">
              <CardContent className="p-8 text-center">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Not sure which role fits?
                </h3>
                <p className="text-sm text-gray-400 mb-5">
                  We value a fast, respectful process. Reach out and let's talk.
                </p>
                <Button
                  asChild
                  className="bg-emerald-500 hover:bg-emerald-400 text-white font-medium"
                >
                  <a href="mailto:careers@getclario.com">
                    Contact Us
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
