import React, { useState } from 'react';
import { Calendar, ArrowRight, Activity, Terminal, Shield, Zap, Info, Clock, ExternalLink, Sparkles, Send } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// Updates (reverse-chronological)
const updates = [{
  id: 1,
  title: "Filter Your Reports to Find Insights Faster",
  date: "September 4, 2025",
  tag: "New Feature",
  description: "We heard from many of you that you wanted an easier way to analyze quarterly performance, so we've added a powerful new Date Range Picker to the Reports page.",
  highlights: ["Filter reports by custom date ranges", "Compare performance across different time periods", "Export filtered data for deeper analysis"],
  cta: { text: "View Reports", href: "/reports" },
  updateId: "REF_004"
}, {
  id: 2,
  title: "Faster Recovery Detection System",
  date: "August 28, 2025",
  tag: "Improvement",
  description: "Our AI-powered recovery detection system is now 3x faster at identifying potential claims, getting your money back sooner.",
  highlights: ["50% reduction in detection time", "More accurate claim categorization", "Improved false positive filtering"],
  cta: { text: "View Recoveries", href: "/recoveries" },
  updateId: "REF_003"
}, {
  id: 4,
  title: "Enhanced Evidence Locker with Document Preview",
  date: "August 15, 2025",
  tag: "New Feature",
  description: "You can now preview documents directly in the Evidence Locker without downloading them, making case review faster and more efficient.",
  highlights: ["In-browser PDF preview", "Image thumbnail gallery", "Quick document search and filtering"],
  cta: { text: "Open Evidence Locker", href: "/evidence-locker" },
  updateId: "REF_001"
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
    <PageLayout title="What's New" midnight>
      <div className="min-h-screen bg-[#050505] relative overflow-hidden">
        {/* Aesthetic Background Elements */}
        <div className="absolute top-0 left-0 w-full h-[800px] bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.06),transparent_70%)] pointer-events-none" />
        <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

        <div className="relative z-10 container max-w-4xl mx-auto px-6 py-12">
          {/* Professional Header */}
          <motion.header
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-20 border-b border-white/5 pb-12"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-8 bg-emerald-500/50" />
              <span className="text-[10px] font-sans font-bold uppercase tracking-tight text-emerald-500/80">Updates & Releases</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-sans font-bold text-white mb-4 tracking-tight">
              Product <span className="text-white/40">Updates</span>
            </h1>
            <p className="text-gray-400 max-w-xl text-lg leading-relaxed font-sans font-bold italic tracking-tight">
              Stay informed about the latest enhancements, feature releases, and platform improvements designed to maximize your FBA recoveries.
            </p>
          </motion.header>

          {/* Timeline Feed */}
          <div className="relative">
            {/* The vertical connector line */}
            <div className="absolute left-[11px] top-4 bottom-4 w-px bg-gradient-to-b from-emerald-500/30 via-emerald-500/5 to-transparent hidden md:block" />

            {orderedMonths.map((month, monthIdx) => (
              <section key={month} className="mb-16">
                <motion.div
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  className="flex items-center gap-6 mb-8 md:ml-[32px]"
                >
                  <span className="text-[10px] font-sans font-bold text-gray-500 uppercase tracking-tight bg-white/[0.02] border border-white/5 px-3 py-1 rounded-full">{month}</span>
                  <div className="h-px flex-1 bg-white/5" />
                </motion.div>

                <div className="space-y-12">
                  {groups[month].map((update, idx) => (
                    <motion.div
                      key={update.id}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="relative md:pl-[64px]"
                    >
                      {/* Timeline Marker */}
                      <div className="absolute left-[6px] top-6 w-2.5 h-2.5 rounded-full bg-[#050505] border border-emerald-500/50 hidden md:flex items-center justify-center">
                        <div className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                      </div>

                      <div className="group relative bg-[#0c0c0c] border border-white/5 rounded-2xl p-8 hover:border-emerald-500/30 transition-all duration-500">
                        {/* Status Line */}
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                          <div className="flex items-center gap-4">
                            <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-[9px] font-sans font-bold text-emerald-500 uppercase tracking-tight rounded">
                              {update.tag}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-sans font-bold text-gray-500 tracking-tight">
                            <Clock className="h-3 w-3" />
                            {update.date}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="max-w-2xl">
                          <h3 className="text-2xl font-medium text-white mb-4 tracking-tight group-hover:text-emerald-400 transition-colors">
                            {update.title}
                          </h3>
                          <p className="text-gray-400 text-sm leading-relaxed mb-6 font-sans font-bold tracking-tight">
                            {update.description}
                          </p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                            {update.highlights.map((item, index) => (
                              <div key={index} className="flex items-start gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl group/item hover:bg-white/[0.04] transition-colors">
                                <div className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-500/30 group-hover/item:bg-emerald-500 transition-colors" />
                                <span className="text-xs text-gray-400 leading-snug">{item}</span>
                              </div>
                            ))}
                          </div>


                        </div>

                        {/* Decorative Corner */}
                        <div className="absolute top-0 right-0 p-6 opacity-[0.02] group-hover:opacity-10 transition-opacity">
                          <Sparkles className="w-16 h-16 text-white" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          {/* Support & Feedback Section */}
          <motion.footer
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="mt-20 pt-12 border-t border-white/5 text-center"
          >
            {/* Support Button */}
            <div className="flex flex-col items-center gap-3 mb-10">
              <a
                href="mailto:support@margin-finance.com"
                className="inline-flex items-center gap-2.5 px-8 py-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500 hover:text-black hover:border-emerald-500 transition-all duration-300 text-sm font-sans font-bold text-emerald-500 uppercase tracking-tight"
              >
                Support
              </a>
              <span className="text-[9px] font-sans font-bold text-white/20 tracking-tight uppercase">12 minute response time</span>
            </div>

            <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 bg-white/[0.02] border border-white/5 rounded-full">
              <Zap className="h-3 w-3 text-emerald-500" />
              <span className="text-[9px] font-sans font-bold text-gray-500 uppercase tracking-tight">Feedback Channel Open</span>
            </div>
            <div className="max-w-xl mx-auto">
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Changelogs and user feature request"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-3.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-300 pr-12 font-sans font-bold tracking-tight"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-black transition-all duration-300">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.footer>
        </div>
      </div>
    </PageLayout>
  );
}
