import React from 'react';
import { PageLayout } from '@/components/layout/PageLayout';

export default function Careers() {
  const positions = [
    {
      title: 'UI/UX Engineer',
      type: 'Remote',
      about: 'Own the design system and craft product experiences across the platform.',
    },
    {
      title: 'Chief Financial Officer',
      type: 'Hybrid',
      about: 'Lead strategic finance, pricing, and capital through growth and scale.',
    },
    {
      title: 'Senior Backend Engineer',
      type: 'Remote',
      about: 'Design resilient services for sync, claims, and evidence matching at scale.',
    },
    {
      title: 'Systems Engineer',
      type: 'Remote',
      about: 'Ensure reliability, performance, and cost-efficiency across infrastructure.',
    },
    {
      title: 'Quality Assurance',
      type: 'Remote',
      about: 'Own quality gates end-to-end with test automation and data-driven QA.',
    },
    {
      title: 'Chief Data Scientist',
      type: 'Remote',
      about: 'Lead detection, scoring, and decision engines that maximize recoveries.',
    },
  ];

  return (
    <PageLayout title="Careers">
      <div className="relative -m-4 lg:-m-6">
        <div className="relative w-full bg-white min-h-[calc(100vh+96px)] -mt-24 pt-24">
          <div className="relative mx-auto max-w-2xl px-6 pt-16 md:pt-24 pb-16">

            {/* Header */}
            <header className="mb-16">
              <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 leading-tight tracking-tight">
                Join Us
              </h1>
              <p className="mt-4 text-base text-gray-600 leading-relaxed max-w-lg">
                We are a small team building the financial layer for e-commerce.
                We hire for impact, ownership, and solving hard problems.
              </p>
            </header>

            {/* Open Positions */}
            <section className="mb-16">
              <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-6">
                Open Positions
              </h2>
              <div className="divide-y divide-gray-100">
                {positions.map((position, index) => (
                  <a
                    key={index}
                    href={`mailto:careers@getclario.com?subject=${encodeURIComponent('Application: ' + position.title)}`}
                    className="block py-5 group"
                  >
                    <div className="flex items-baseline justify-between mb-1">
                      <h3 className="text-base font-medium text-gray-900 group-hover:text-gray-600 transition-colors">
                        {position.title}
                      </h3>
                      <span className="text-sm text-gray-400">{position.type}</span>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {position.about}
                    </p>
                  </a>
                ))}
              </div>
            </section>

            {/* Process */}
            <section className="mb-16">
              <h2 className="text-sm font-medium text-gray-400 uppercase tracking-wider mb-6">
                Process
              </h2>
              <div className="space-y-3 text-sm text-gray-600">
                <p>1. Intro call — mutual fit, 30 minutes</p>
                <p>2. Technical deep-dive — portfolio or code review</p>
                <p>3. Practical exercise — async or live</p>
                <p>4. Team meet — offer within one week</p>
              </div>
            </section>

            {/* Contact */}
            <footer className="pt-8 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Questions? Reach us at{' '}
                <a
                  href="mailto:careers@getclario.com"
                  className="text-gray-900 hover:text-gray-600 transition-colors"
                >
                  careers@getclario.com
                </a>
              </p>
            </footer>

          </div>
        </div>
      </div>
    </PageLayout>
  );
}
