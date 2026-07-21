import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Clock3, LockKeyhole, MessageSquare, ShieldCheck } from 'lucide-react';

import { BrandFooter } from '@/components/layout/BrandFooter';
import { PageLayout } from '@/components/layout/PageLayout';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { Button } from '@/components/ui/button';
import { SITE_META } from '@/config/site';
import { usePageMeta } from '@/hooks/usePageMeta';

const statusItems = [
  { label: 'Seat secured', text: 'Founding 500 seat secured', icon: CheckCircle2, state: 'complete' },
  { label: 'Pricing locked', text: 'Founder pricing locked', icon: LockKeyhole, state: 'complete' },
  { label: 'Activation queued', text: 'Priority activation queued', icon: Clock3, state: 'current' },
  { label: 'Onboarding', text: 'Founder onboarding begins soon', icon: MessageSquare, state: 'upcoming' },
  { label: 'Contact', text: 'Our team will contact you for activation', icon: ShieldCheck, state: 'upcoming' },
] as const;

export default function FoundingActivationStatus() {
  const [searchParams] = useSearchParams();
  const tenantSlug = searchParams.get('tenant');

  usePageMeta({
    title: 'Founding 500 Activation Status | Margin',
    description: 'Your Founding 500 seat is secured. Founder pricing is locked and priority activation is queued.',
    url: `${SITE_META.url}/founding-500/status`,
    robots: 'noindex, nofollow',
  });

  return (
    <PageLayout title="Founding 500 Activation Status" noPadding hideNavbar hideSidebar hideLogo plainBackground>
      <div className="min-h-screen overflow-x-hidden bg-[#FAFAF7] font-sans text-[#182026] selection:bg-[#0B74DE]/16 selection:text-[#182026]">
        <PublicNavbar variant="light" />

        <main className="relative overflow-hidden pt-32 md:pt-40">
          <div className="pointer-events-none absolute inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(11,116,222,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(11,116,222,0.04)_1px,transparent_1px)] [background-size:72px_72px]" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[720px] bg-[radial-gradient(circle_at_50%_0%,rgba(11,116,222,0.10),transparent_48%)]" />

          <section className="relative mx-auto flex min-h-[calc(100vh-180px)] w-full max-w-[960px] flex-col items-center px-5 pb-24 text-center sm:px-6 md:px-8 md:pb-32">
            <div className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-tight text-[#0B74DE]">
              <span className="h-2 w-2 rounded-full bg-[#2EAD7B]" />
              Founding member confirmed
            </div>

            <h1 className="mt-6 max-w-[820px] text-[40px] font-semibold leading-[0.98] tracking-[-0.055em] text-[#182026] sm:text-[52px] md:text-[72px]">
              Your Founding 500 seat is secured.
            </h1>
            <p className="mt-6 max-w-[680px] text-[16px] leading-8 text-[#66737F] md:text-[19px] md:leading-9">
              Founder pricing is locked and priority activation is queued. A founder or team member will contact you before platform activation begins.
            </p>

            <div className="mt-12 w-full overflow-hidden rounded-[20px] border border-[#E4EDF1] bg-white text-left md:mt-16">
              <div className="flex flex-col gap-3 border-b border-[#E4EDF1] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
                <div>
                  <h2 className="text-[18px] font-semibold tracking-[-0.025em] text-[#182026]">Activation status</h2>
                  <p className="mt-1 text-[13px] text-[#8896A1]">Your place in the Founding 500 onboarding flow.</p>
                </div>
                <div className="flex w-fit items-center gap-2 rounded-full border border-[#CFE0EA] bg-[#F8FBFD] px-3 py-1.5 text-[10px] font-bold uppercase tracking-tight text-[#0B74DE]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0B74DE]" />
                  Priority queue
                </div>
              </div>

              <div className="divide-y divide-[#E4EDF1]">
                {statusItems.map(({ label, text, icon: Icon, state }) => {
                  const isComplete = state === 'complete';
                  const isCurrent = state === 'current';

                  return (
                    <div key={label} className="flex items-center gap-4 px-5 py-4 sm:px-7">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border ${
                          isComplete
                            ? 'border-[#BFE6D4] bg-[#EAF7F1] text-[#2E7D5B]'
                            : isCurrent
                              ? 'border-[#BBD9F5] bg-[#EDF6FE] text-[#0B74DE]'
                              : 'border-[#E4EDF1] bg-[#FAFAF7] text-[#8896A1]'
                        }`}
                      >
                        <Icon className="h-4 w-4" strokeWidth={1.8} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[11px] font-semibold uppercase tracking-tight text-[#8896A1]">{label}</div>
                        <div className="mt-0.5 text-[14px] font-semibold tracking-[-0.01em] text-[#25313A] sm:text-[15px]">{text}</div>
                      </div>
                      <div className={`hidden text-[11px] font-semibold sm:block ${isComplete ? 'text-[#2E7D5B]' : isCurrent ? 'text-[#0B74DE]' : 'text-[#A1ADB6]'}`}>
                        {isComplete ? 'Complete' : isCurrent ? 'In progress' : 'Next'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {tenantSlug ? (
              <p className="mt-5 text-[12px] leading-6 text-[#8896A1]">
                Activation queue status is reserved for workspace <span className="font-semibold text-[#4D5B66]">{tenantSlug}</span>.
              </p>
            ) : null}

            <div className="mt-8 flex w-full flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild className="h-12 rounded-full bg-[#0B74DE] px-6 text-[14px] font-semibold text-white shadow-[0_14px_34px_rgba(11,116,222,0.18)] hover:bg-[#0962BF]">
                <Link to="/early-access">
                  View Founding 500
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-12 rounded-full border-[#CFE0EA] bg-white px-6 text-[14px] font-semibold text-[#25313A] hover:bg-[#F3F6F8]">
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
