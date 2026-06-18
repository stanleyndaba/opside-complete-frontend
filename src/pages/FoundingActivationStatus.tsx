import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Clock3, LockKeyhole, MessageSquare, ShieldCheck } from 'lucide-react';

import { BrandFooter } from '@/components/layout/BrandFooter';
import { PageLayout } from '@/components/layout/PageLayout';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { usePageMeta } from '@/hooks/usePageMeta';

const statusItems = [
  ['Seat secured', 'Founding 500 seat secured', CheckCircle2],
  ['Pricing locked', 'Founder pricing locked', LockKeyhole],
  ['Activation queued', 'Priority activation queued', Clock3],
  ['Onboarding', 'Founder onboarding begins soon', MessageSquare],
  ['Contact', 'Team will contact you for activation', ShieldCheck],
] as const;

export default function FoundingActivationStatus() {
  const [searchParams] = useSearchParams();
  const tenantSlug = searchParams.get('tenant');

  usePageMeta({
    title: 'Founding 500 Activation Status | Margin',
    description: 'Your Founding 500 seat is secured. Founder pricing is locked and priority activation is queued.',
  });

  return (
    <PageLayout title="Founding 500 Activation Status" noPadding hideNavbar hideSidebar hideLogo midnight>
      <div className="min-h-screen bg-[#060606] text-white">
        <PublicNavbar />
        <main className="relative overflow-hidden pt-32 md:pt-40">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(56,189,248,0.08),transparent_34%),linear-gradient(180deg,rgba(255,255,255,0.025)_0%,rgba(6,6,6,1)_46%)]" />

          <section className="relative mx-auto flex min-h-[calc(100vh-220px)] max-w-4xl flex-col items-center justify-center px-6 pb-24 text-center">
            <Badge variant="outline" className="mb-6 border-white/10 bg-white/[0.03] text-[10px] font-sans font-bold uppercase tracking-tight text-white/60">
              Founding Member Confirmed
            </Badge>

            <h1 className="max-w-3xl text-4xl font-light leading-tight tracking-tight text-white md:text-6xl">
              Founding 500 seat secured.
            </h1>
            <p className="mt-6 max-w-2xl text-sm leading-7 tracking-tight text-white/50 md:text-base">
              Founder pricing is locked and priority activation is queued. Founder onboarding begins soon, and a founder or team member will contact you before platform activation.
            </p>

            <div className="mt-10 grid w-full max-w-3xl grid-cols-1 gap-3 text-left sm:grid-cols-2">
              {statusItems.map(([label, text, Icon]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-400/20 bg-emerald-400/10 text-emerald-200">
                      <Icon className="h-4 w-4" strokeWidth={1.8} />
                    </div>
                    <div>
                      <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/35">{label}</div>
                      <div className="mt-1 text-sm font-semibold leading-6 text-white/82">{text}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {tenantSlug ? (
              <p className="mt-6 text-xs leading-6 text-white/38">
                Activation queue status is reserved for workspace {tenantSlug}.
              </p>
            ) : null}

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
              <Button asChild className="h-12 rounded-xl bg-white px-6 text-sm font-sans font-semibold text-black hover:bg-white/90">
                <Link to="/early-access">View Founding 500</Link>
              </Button>
              <Button asChild variant="outline" className="h-12 rounded-xl border-white/10 bg-transparent px-6 text-sm font-sans font-semibold text-white hover:bg-white/[0.05]">
                <Link to="/">Back to homepage</Link>
              </Button>
            </div>
          </section>
        </main>
        <BrandFooter />
      </div>
    </PageLayout>
  );
}
