import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Sparkles, Zap, Bug, ArrowRight } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';

// Updates (reverse-chronological)
const updates = [{
  id: 1,
  title: "Filter Your Reports to Find Insights Faster",
  date: "September 4, 2025",
  tag: "NEW FEATURE",
  tagColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
  iconBg: "bg-emerald-50",
  iconColor: "text-emerald-600",
  icon: Sparkles,
  description: "We heard from many of you that you wanted an easier way to analyze quarterly performance, so we've added a powerful new Date Range Picker to the Reports page.",
  highlights: ["Filter reports by custom date ranges", "Compare performance across different time periods", "Export filtered data for deeper analysis"],
  cta: { text: "Try it on Reports", href: "/reports" }
}, {
  id: 2,
  title: "Faster Recovery Detection System",
  date: "August 28, 2025",
  tag: "IMPROVEMENT",
  tagColor: "bg-blue-50 text-blue-700 border-blue-200",
  iconBg: "bg-blue-50",
  iconColor: "text-blue-600",
  icon: Zap,
  description: "Our AI-powered recovery detection system is now 3x faster at identifying potential claims, getting your money back sooner.",
  highlights: ["50% reduction in detection time", "More accurate claim categorization", "Improved false positive filtering"],
  cta: { text: "View Recoveries", href: "/recoveries" }
}, {
  id: 3,
  title: "Dashboard Loading Issues on Mobile — Fixed",
  date: "August 22, 2025",
  tag: "BUG FIX",
  tagColor: "bg-amber-50 text-amber-700 border-amber-200",
  iconBg: "bg-amber-50",
  iconColor: "text-amber-600",
  icon: Bug,
  description: "We've resolved the slow loading times some users experienced on mobile devices when accessing the Command Center.",
  highlights: ["75% faster mobile load times", "Improved responsive design", "Better touch interactions"],
  cta: null
}, {
  id: 4,
  title: "Enhanced Evidence Locker with Document Preview",
  date: "August 15, 2025",
  tag: "NEW FEATURE",
  tagColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
  iconBg: "bg-emerald-50",
  iconColor: "text-emerald-600",
  icon: Sparkles,
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
          <div className="relative mx-auto max-w-3xl px-6 pt-12 md:pt-16 pb-16">

            {/* Header */}
            <header className="mb-12">
              <h1 className="text-3xl md:text-4xl font-semibold text-gray-900 tracking-tight">
                What's New
              </h1>
              <p className="mt-3 text-lg text-gray-600 leading-relaxed">
                We're constantly improving Clario to find and recover more for you.
                Here's what we've been working on.
              </p>
            </header>

            {/* Updates Timeline */}
            <div className="space-y-12">
              {orderedMonths.map((month) => (
                <section key={month}>
                  <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-6">
                    {month}
                  </h2>
                  <div className="space-y-6">
                    {groups[month].map((update) => {
                      const IconComponent = update.icon;
                      return (
                        <Card
                          key={update.id}
                          className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                        >
                          <CardContent className="p-6">
                            {/* Top row: Icon + Tag + Date */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className={`h-10 w-10 rounded-lg ${update.iconBg} flex items-center justify-center`}>
                                  <IconComponent className={`h-5 w-5 ${update.iconColor}`} />
                                </div>
                                <Badge className={`${update.tagColor} border text-xs font-medium`}>
                                  {update.tag}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                <Calendar className="h-3.5 w-3.5" />
                                {update.date}
                              </div>
                            </div>

                            {/* Title */}
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {update.title}
                            </h3>

                            {/* Description */}
                            <p className="text-sm text-gray-600 leading-relaxed mb-4">
                              {update.description}
                            </p>

                            {/* Highlights */}
                            <div className="space-y-2 mb-4">
                              {update.highlights.map((item, index) => (
                                <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                                  <div className="h-1.5 w-1.5 rounded-full bg-gray-300 flex-shrink-0" />
                                  {item}
                                </div>
                              ))}
                            </div>

                            {/* CTA */}
                            {update.cta && (
                              <a
                                href={update.cta.href}
                                className="inline-flex items-center gap-1 text-sm font-medium text-gray-900 hover:text-gray-600 transition-colors"
                              >
                                {update.cta.text}
                                <ArrowRight className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>

            {/* Feedback Footer */}
            <footer className="mt-12 pt-8 border-t border-gray-100">
              <p className="text-sm text-gray-500 text-center">
                Have a feature request?{' '}
                <a href="mailto:hello@getclario.com" className="text-gray-900 hover:text-gray-600 font-medium">
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