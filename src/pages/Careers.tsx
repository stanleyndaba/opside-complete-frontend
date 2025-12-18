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


  return (
    <PageLayout title="Careers">
      <div className="relative -m-4 lg:-m-6">
        <div className="relative w-full bg-gray-50 min-h-[calc(100vh+96px)] -mt-24 pt-24">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white via-transparent to-gray-100" />

          <div className="relative container mx-auto px-6 pt-12 md:pt-16 pb-16">
            {/* Header */}
            <header className="mb-12">
              <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 tracking-tight">
                Build the Future of E-Commerce Finance
              </h1>
              <p className="mt-4 text-lg text-gray-600 max-w-2xl leading-relaxed">
                We're a small team building the intelligent financial recovery layer for e-commerce.
                We hire for impact, ownership, and solving hard problems.
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


            {/* Contact CTA - Simple */}
            <section className="pt-8 border-t border-gray-100">
              <h3 className="text-base font-medium text-gray-900 mb-1">
                Not sure which role fits?
              </h3>
              <p className="text-sm text-gray-500 mb-4">
                We value a fast, respectful process. Reach out and let's talk.
              </p>
              <Button
                asChild
                className="bg-gray-900 hover:bg-gray-800 text-white font-medium"
              >
                <a href="mailto:careers@getclario.com">
                  Contact Us
                </a>
              </Button>
            </section>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
