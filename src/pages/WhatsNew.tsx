import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Clock, ExternalLink, Send } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { motion } from 'framer-motion';
import { api, type ProductUpdateRecord } from '@/lib/api';
import { useTenant } from '@/contexts/TenantContext';
import { normalizeTenantSlug, tenantRoute } from '@/lib/routes';
import { useLocation, useParams } from 'react-router-dom';

function formatUpdateDate(value?: string | null): string {
  if (!value) return 'Recently';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(date);
}

function formatMonthGroup(value?: string | null): string {
  if (!value) return 'Latest';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Latest';
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric'
  }).format(date);
}

function resolveCtaHref(href: string | null | undefined, tenantSlug: string | null): string | null {
  const normalized = String(href || '').trim();
  if (!normalized) return null;
  if (/^https?:\/\//i.test(normalized) || normalized.startsWith('mailto:')) {
    return normalized;
  }
  return tenantRoute(tenantSlug, normalized);
}

export default function WhatsNew() {
  const [updates, setUpdates] = useState<ProductUpdateRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { tenant } = useTenant();
  const { tenantSlug } = useParams<{ tenantSlug?: string }>();
  const location = useLocation();
  const routeSlugMatch = location.pathname.match(/^\/app\/([^/]+)/);
  const activeSlug =
    normalizeTenantSlug(tenant?.slug) ||
    normalizeTenantSlug(tenantSlug) ||
    normalizeTenantSlug(routeSlugMatch?.[1]);

  useEffect(() => {
    let mounted = true;

    const loadUpdates = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await api.getProductUpdates(activeSlug || undefined);
        if (!mounted) return;

        if (!response.ok || !response.data?.success) {
          throw new Error(response.error || 'Unable to load product updates');
        }

        setUpdates(response.data.data || []);
      } catch (err: any) {
        if (!mounted) return;
        setError(err?.message || 'Unable to load product updates');
        setUpdates([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadUpdates();

    return () => {
      mounted = false;
    };
  }, [activeSlug]);

  const groups = useMemo(() => {
    return updates.reduce<Record<string, ProductUpdateRecord[]>>((acc, update) => {
      const month = formatMonthGroup(update.published_at || update.created_at);
      acc[month] = acc[month] || [];
      acc[month].push(update);
      return acc;
    }, {});
  }, [updates]);

  const orderedMonths = Object.keys(groups);

  return (
    <PageLayout title="What's New">
      <div className="platform-vitality-page min-h-screen bg-[#F9FAFB] text-[#111827] relative overflow-hidden">
        <div className="absolute inset-x-0 inset-y-[-100px] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#F9FAFB] via-[#F9FAFB] to-[#F3F6F8]" />

        <div className="relative z-10 container max-w-4xl mx-auto px-6 py-12">
          {/* Professional Header */}
          <motion.header
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-20 border-b border-white/5 pb-12"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px w-8 bg-white/20" />
              <span className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/35">Updates & Releases</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-sans font-bold text-white mb-4 tracking-tight">
              Product <span className="text-white/40">Updates</span>
            </h1>
            <p className="text-gray-400 max-w-xl text-lg leading-relaxed font-sans font-bold tracking-tight">
              Stay informed about the latest enhancements, feature releases, and platform improvements designed to maximize your FBA recoveries.
            </p>
          </motion.header>

          {/* Timeline Feed */}
          <div className="relative">
            {/* The vertical connector line */}
            <div className="absolute left-[11px] top-4 bottom-4 w-px bg-gradient-to-b from-[#C7DAFF] via-[#E5E7EB] to-transparent hidden md:block" />

            {loading && (
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 text-sm font-sans font-bold tracking-tight text-white/50">
                Loading published product updates...
              </div>
            )}

            {!loading && error && (
              <div className="rounded-2xl border border-red-400/20 bg-red-500/[0.06] p-8 text-sm font-sans font-bold tracking-tight text-red-100/80">
                {error}
              </div>
            )}

            {!loading && !error && orderedMonths.length === 0 && (
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8">
                <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/35">
                  No published updates yet
                </div>
                <p className="mt-3 max-w-xl text-sm font-sans font-bold leading-6 tracking-tight text-gray-400">
                  Product rollouts will appear here after they are published as real Margin update records.
                </p>
              </div>
            )}

            {!loading && !error && orderedMonths.map((month) => (
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
                  {groups[month].map((update, idx) => {
                    const ctaHref = resolveCtaHref(update.cta_href, activeSlug);
                    return (
                    <motion.div
                      key={update.id}
                      id={update.slug}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="relative md:pl-[64px]"
                    >
                      {/* Timeline Marker */}
                      <div className="absolute left-[6px] top-6 w-2.5 h-2.5 rounded-full bg-white border border-[#D8E7FF] hidden md:flex items-center justify-center">
                        <div className="w-1 h-1 rounded-full bg-[#0052FF]" />
                      </div>

                      <div className="group relative bg-[#0c0c0c] border border-white/5 rounded-2xl p-8 hover:border-white/20 transition-all duration-500">
                        {/* Status Line */}
                        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                          <div className="flex items-center gap-4">
                            {update.tag && (
                              <span className="px-2 py-0.5 bg-white/10 border border-white/15 text-[9px] font-sans font-bold text-white/70 uppercase tracking-tight rounded">
                                {update.tag}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-sans font-bold text-gray-500 tracking-tight">
                            <Clock className="h-3 w-3" />
                            {formatUpdateDate(update.published_at || update.created_at)}
                          </div>
                        </div>

                        {/* Content */}
                        <div className="max-w-2xl">
                          <h3 className="text-2xl font-medium text-white mb-4 tracking-tight group-hover:text-white/80 transition-colors">
                            {update.title}
                          </h3>
                          <p className="text-gray-400 text-sm leading-relaxed mb-6 font-sans font-bold tracking-tight">
                            {update.summary}
                          </p>

                          {update.highlights.length > 0 && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                              {update.highlights.map((item, index) => (
                                <div key={index} className="flex items-start gap-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl group/item hover:bg-white/[0.04] transition-colors">
                                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-white/30 group-hover/item:bg-white/60 transition-colors" />
                                  <span className="text-xs text-gray-400 leading-snug">{item}</span>
                                </div>
                              ))}
                            </div>
                          )}

                          {update.body && (
                            <p className="mb-8 max-w-2xl text-xs leading-6 text-gray-500 font-sans font-bold tracking-tight">
                              {update.body}
                            </p>
                          )}

                          {update.cta_text && ctaHref && (
                            <a
                              href={ctaHref}
                              className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-4 py-2 text-[10px] font-sans font-bold uppercase tracking-tight text-[#4B5563] transition-all duration-300 hover:border-[#D8E7FF] hover:bg-[#F3F7FF] hover:text-[#0052FF]"
                            >
                              {update.cta_text}
                              {/^https?:\/\//i.test(ctaHref) ? <ExternalLink className="h-3 w-3" /> : <ArrowRight className="h-3 w-3" />}
                            </a>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                  })}
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
                className="inline-flex items-center gap-2.5 px-8 py-3 rounded-full bg-[#0052FF] border border-[#0052FF] hover:bg-[#0047DD] hover:border-[#0047DD] transition-all duration-300 text-sm font-sans font-bold text-[#FFFFFF] uppercase tracking-tight shadow-[0_12px_28px_rgba(0,82,255,0.14)]"
              >
                Support
              </a>
              <span className="text-[9px] font-sans font-bold text-white/20 tracking-tight uppercase">12 minute response time</span>
            </div>

            <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 bg-white/[0.02] border border-white/5 rounded-full">
              <span className="text-[9px] font-sans font-bold text-gray-500 uppercase tracking-tight">Feedback Channel Open</span>
            </div>
            <div className="max-w-xl mx-auto">
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Changelogs and user feature request"
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-3.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/10 transition-all duration-300 pr-12 font-sans font-bold tracking-tight"
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg bg-[#0052FF] text-[#FFFFFF] hover:bg-[#0047DD] transition-all duration-300">
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
