import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Clock, ExternalLink, Send } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
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
      <div className="min-h-screen bg-[#FAFAF7] text-[#111827]">
        <div className="border-b border-[#DCE8EE] bg-[#FAFAF7] px-4 py-7 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-[980px]">
            <p className="text-[13px] font-medium tracking-tight text-[#66737F]">Product record</p>
            <h1 className="mt-1.5 font-lora text-[34px] font-normal leading-tight tracking-tight text-[#182026] sm:text-[38px]">What’s new</h1>
            <p className="mt-2.5 max-w-2xl text-[14px] leading-6 text-[#66737F]">Published changes to the Margin workspace, including new controls, recovery improvements, and operational refinements.</p>
          </div>
        </div>

        <main className="mx-auto max-w-[980px] px-4 py-7 sm:px-6 lg:px-8">
          {loading ? <div className="rounded-[10px] border border-[#DCE8EE] bg-white p-5 text-[13px] text-[#66737F]">Loading published product updates.</div> : null}
          {!loading && error ? <div className="rounded-[10px] border border-rose-200 bg-rose-50 px-5 py-4 text-[13px] text-rose-700">{error}</div> : null}
          {!loading && !error && orderedMonths.length === 0 ? (
            <div className="rounded-[10px] border border-[#DCE8EE] bg-white p-5"><h2 className="text-[16px] font-semibold tracking-tight text-[#182026]">No published updates yet</h2><p className="mt-1.5 text-[13px] leading-5 text-[#66737F]">New Margin release records will appear here as they are published.</p></div>
          ) : null}

          {!loading && !error ? <div className="space-y-8">{orderedMonths.map((month) => (
            <section key={month}>
              <div className="mb-3 flex items-center gap-3"><p className="text-[13px] font-medium tracking-tight text-[#66737F]">{month}</p><div className="h-px flex-1 bg-[#DCE8EE]" /></div>
              <div className="overflow-hidden rounded-[10px] border border-[#DCE8EE] bg-white shadow-[0_1px_2px_rgba(24,32,38,0.03)]">
                {groups[month].map((update, index) => {
                  const ctaHref = resolveCtaHref(update.cta_href, activeSlug);
                  return <article key={update.id} id={update.slug} className={index > 0 ? 'border-t border-[#E7EEF2] px-5 py-5 sm:px-6' : 'px-5 py-5 sm:px-6'}>
                    <div className="flex flex-wrap items-center justify-between gap-3"><div>{update.tag ? <span className="rounded-md border border-[#DCE8EE] bg-[#F7FAFC] px-2 py-0.5 text-[12px] font-medium tracking-tight text-[#4D5B66]">{update.tag}</span> : null}</div><p className="flex items-center gap-1.5 text-[12px] text-[#66737F]"><Clock className="h-3.5 w-3.5" />{formatUpdateDate(update.published_at || update.created_at)}</p></div>
                    <h2 className="mt-4 text-[20px] font-semibold tracking-tight text-[#182026]">{update.title}</h2>
                    <p className="mt-2 text-[14px] leading-6 text-[#66737F]">{update.summary}</p>
                    {update.highlights.length > 0 ? <ul className="mt-4 divide-y divide-[#E7EEF2] border-t border-[#E7EEF2]">{update.highlights.map((item, itemIndex) => <li key={itemIndex} className="py-2.5 text-[13px] leading-5 text-[#4D5B66]">{item}</li>)}</ul> : null}
                    {update.body ? <p className="mt-4 text-[13px] leading-6 text-[#66737F]">{update.body}</p> : null}
                    {update.cta_text && ctaHref ? <a href={ctaHref} className="mt-4 inline-flex h-9 items-center gap-2 rounded-md border border-[#DCE8EE] bg-white px-3 text-[13px] font-medium tracking-tight text-[#0B74DE] transition-colors hover:bg-[#F7FAFC]">{update.cta_text}{/^https?:\/\//i.test(ctaHref) ? <ExternalLink className="h-3.5 w-3.5" /> : <ArrowRight className="h-3.5 w-3.5" />}</a> : null}
                  </article>;
                })}
              </div>
            </section>
          ))}</div> : null}
        </main>

        <footer className="mx-auto max-w-[980px] px-4 pb-10 sm:px-6 lg:px-8">
          <div className="border-t border-[#DCE8EE] pt-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[13px] font-medium tracking-tight text-[#182026]">Need help with a change?</p><p className="mt-1 text-[13px] text-[#66737F]">Contact support with the update and the workspace task you need help with.</p></div><a href="mailto:support@margin-finance.com" className="inline-flex h-9 items-center justify-center rounded-md border border-[#DCE8EE] bg-white px-3 text-[13px] font-medium tracking-tight text-[#0B74DE] hover:bg-[#F7FAFC]">Contact support</a></div>
            <div className="mt-5 flex items-center rounded-md border border-[#DCE8EE] bg-white"><input type="text" placeholder="Share feedback on a product update" className="h-10 min-w-0 flex-1 bg-transparent px-3 text-[13px] tracking-tight text-[#182026] outline-none placeholder:text-[#8A97A2]" /><button type="button" aria-label="Send feedback" className="mr-1.5 flex h-7 w-7 items-center justify-center rounded-md text-[#66737F] hover:bg-[#F7FAFC] hover:text-[#0B74DE]"><Send className="h-4 w-4" /></button></div>
          </div>
        </footer>
      </div>
    </PageLayout>
  );
}
