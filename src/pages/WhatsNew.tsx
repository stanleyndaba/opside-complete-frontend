import React from 'react';
import { Calendar, ArrowRight } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';

// Updates (reverse-chronological)
const updates = [{
  id: 1,
  title: "Filter Your Reports to Find Insights Faster",
  date: "September 4, 2025",
  tag: "NEW FEATURE",
  description: "We heard from many of you that you wanted an easier way to analyze quarterly performance, so we've added a powerful new Date Range Picker to the Reports page.",
  highlights: ["Filter reports by custom date ranges", "Compare performance across different time periods", "Export filtered data for deeper analysis"],
  cta: { text: "Try it on Reports", href: "/reports" }
}, {
  id: 2,
  title: "Faster Recovery Detection System",
  date: "August 28, 2025",
  tag: "IMPROVEMENT",
  description: "Our AI-powered recovery detection system is now 3x faster at identifying potential claims, getting your money back sooner.",
  highlights: ["50% reduction in detection time", "More accurate claim categorization", "Improved false positive filtering"],
  cta: { text: "View Recoveries", href: "/recoveries" }
}, {
  id: 3,
  title: "Dashboard Loading Issues on Mobile — Fixed",
  date: "August 22, 2025",
  tag: "BUG FIX",
  description: "We've resolved the slow loading times some users experienced on mobile devices when accessing the Command Center.",
  highlights: ["75% faster mobile load times", "Improved responsive design", "Better touch interactions"],
  cta: null
}, {
  id: 4,
  title: "Enhanced Evidence Locker with Document Preview",
  date: "August 15, 2025",
  tag: "NEW FEATURE",
  description: "You can now preview documents directly in the Evidence Locker without downloading them, making case review faster and more efficient.",
  highlights: ["In-browser PDF preview", "Image thumbnail gallery", "Quick document search and filtering"],
  cta: { text: "Open Evidence Locker", href: "/evidence-locker" }
}];

export default function WhatsNew() {
  // Group by month
  const groups = updates.reduce<Record<string, typeof updates>>((acc, u) => {
    const month = new Date(u.date + ' UTC').toLocaleString('en-US', { month: 'long', year: 'numeric' });
    acc[month] = acc[month] || [];
    acc[month].push(u);
    return acc;
  }, {});
  const orderedMonths = Object.keys(groups);

  return (
    <PageLayout title="What's New">
      <div className="relative -m-4 lg:-m-6">
        <div className="relative w-full bg-white min-h-[calc(100vh+96px)] -mt-24 pt-24">
          <div className="relative container mx-auto px-8 pt-8 pb-12">

            {/* Header */}
            <header className="mb-10">
              <h1 className="text-lg font-medium text-gray-900 tracking-tight">
                What's New
              </h1>
              <p className="text-[10px] text-gray-500 mt-0.5 uppercase tracking-[0.15em]">
                Product Updates & Releases
              </p>
              <p className="mt-4 text-sm text-gray-600 max-w-2xl leading-relaxed">
                We're constantly improving Opside to find and recover more for you.
              </p>
            </header>

            {/* Updates Timeline */}
            <div className="space-y-8">
              {orderedMonths.map((month) => (
                <section key={month}>
                  <h2 className="text-xs font-medium text-gray-900 uppercase tracking-[0.15em] mb-4">
                    {month}
                  </h2>
                  <div className="space-y-4">
                    {groups[month].map((update) => (
                      <div
                        key={update.id}
                        className="bg-white border border-gray-200 rounded-sm p-4"
                      >
                        {/* Top row: Tag + Date */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-700 border border-gray-200 uppercase tracking-[0.05em]">
                            {update.tag}
                          </span>
                          <div className="flex items-center gap-1 text-[10px] text-gray-500">
                            <Calendar className="h-3 w-3" />
                            {update.date}
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-sm font-medium text-gray-900 mb-1.5">
                          {update.title}
                        </h3>

                        {/* Description */}
                        <p className="text-xs text-gray-600 leading-relaxed mb-3">
                          {update.description}
                        </p>

                        {/* Highlights */}
                        <div className="space-y-1.5 mb-3">
                          {update.highlights.map((item, index) => (
                            <div key={index} className="flex items-center gap-1.5 text-xs text-gray-700">
                              <div className="h-1 w-1 bg-gray-400 flex-shrink-0" />
                              {item}
                            </div>
                          ))}
                        </div>

                        {/* CTA */}
                        {update.cta && (
                          <a
                            href={update.cta.href}
                            className="inline-flex items-center gap-1 text-xs font-medium text-gray-900 hover:text-gray-600 transition-colors"
                          >
                            {update.cta.text}
                            <ArrowRight className="h-3 w-3" />
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>

            {/* Feedback Footer */}
            <footer className="mt-10 pt-6 border-t border-gray-200">
              <p className="text-[10px] text-gray-500">
                Have a feature request?{' '}
                <a href="mailto:hello@opside.co" className="text-gray-900 hover:text-gray-600 font-medium">
                  Let us know
                </a>
              </p>
            </footer>

          </div>
        </div>
      </div>
    </PageLayout>
  );
}
