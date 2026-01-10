import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { MapPin, ArrowRight } from 'lucide-react';

export default function Careers() {
  const positions = [
    {
      title: 'UI/UX Engineer',
      location: 'Remote',
      type: 'Full-time',
      salary: '$90k – $140k',
      tags: ['React', 'Design Systems', 'Figma'],
      description: 'Own our design system and craft delightful product experiences across the Margin platform.',
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
        <div className="relative w-full bg-white min-h-[calc(100vh+96px)] -mt-24 pt-24">
          <div className="relative container mx-auto px-8 pt-8 pb-16">
            {/* Header */}
            <header className="mb-10">
              <h1 className="text-lg font-medium text-gray-900 tracking-tight">
                Careers
              </h1>
              <p className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-[0.15em]">
                Join Our Team
              </p>
              <p className="mt-4 text-sm text-gray-600 max-w-2xl leading-relaxed">
                We're a small team building the intelligent financial recovery layer for e-commerce.
                We hire for impact, ownership, and solving hard problems.
              </p>
            </header>

            {/* Open Positions */}
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-medium text-gray-900 uppercase tracking-[0.15em]">Open Positions</h2>
                <span className="px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-700 border border-gray-200">
                  {positions.length} roles
                </span>
              </div>
              <div className="grid gap-4">
                {positions.map((position, index) => (
                  <div key={index} className="bg-white border border-gray-200 rounded-sm p-4">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <h3 className="text-sm font-medium text-gray-900">{position.title}</h3>
                          <span className="px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-700 border border-gray-200">
                            {position.salary}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mb-2">{position.description}</p>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <div className="flex items-center gap-1 text-[10px] text-gray-500">
                            <MapPin className="h-2.5 w-2.5" />
                            {position.location}
                          </div>
                          <span className="text-gray-300">•</span>
                          <span className="text-[10px] text-gray-500 uppercase tracking-[0.05em]">{position.type}</span>
                          <span className="text-gray-300">•</span>
                          {position.tags.map((tag) => (
                            <span key={tag} className="px-1.5 py-0.5 text-[10px] bg-gray-50 text-gray-600 border border-gray-100">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <a
                        href={`mailto:careers@margin.app?subject=${encodeURIComponent('Application: ' + position.title)}`}
                        className="px-3 py-1.5 text-xs text-gray-700 border border-gray-300 bg-white hover:bg-gray-50 transition-colors flex items-center gap-1 shrink-0">
                        Apply
                        <ArrowRight className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </section>


            {/* Contact CTA */}
            <section className="pt-6 border-t border-gray-200">
              <h3 className="text-xs font-medium text-gray-900 uppercase tracking-[0.1em] mb-1">
                Not sure which role fits?
              </h3>
              <p className="text-[10px] text-gray-500 mb-4">
                We value a fast, respectful process. Reach out and let's talk.
              </p>
              <a
                href="mailto:careers@margin.app"
                className="inline-block px-4 py-2 text-xs font-medium text-white bg-gray-900 hover:bg-gray-800 transition-colors">
                Contact Us
              </a>
            </section>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
