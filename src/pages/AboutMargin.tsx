import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

import { BrandFooter } from '@/components/layout/BrandFooter';
import { PageLayout } from '@/components/layout/PageLayout';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { SITE_META } from '@/config/site';
import { usePageMeta } from '@/hooks/usePageMeta';

const pillars = [
  {
    label: '01',
    title: 'A reasoning system',
    body:
      'Margin does not just store data or show dashboards. It analyzes shipments, returns, reimbursements, transfers, fees, and payout activity to identify where Amazon may owe the seller money. It connects records, documents, and timelines so discrepancies can be understood, not just displayed.',
  },
  {
    label: '02',
    title: 'A multi-agent orchestration platform',
    body:
      'Different parts of Margin are responsible for different jobs: detection, evidence collection, filing readiness, submission control, payout tracking, and notifications. Instead of one generic workflow, Margin coordinates specialized layers that turn raw seller data into recovery action.',
  },
  {
    label: '03',
    title: 'A prompt-free, proactive application',
    body:
      'Sellers should not need to ask what to check, what to file, or what happened. Margin is designed to continuously monitor the account, surface new recovery opportunities, collect supporting evidence, and keep tracking claims and payouts over time.',
  },
];

const capabilities = [
  'Detects reimbursement and discrepancy opportunities across seller data.',
  'Collects supporting evidence from connected platforms like email, cloud storage, and team tools.',
  'Builds filing-ready case context with clear proof and status.',
  'Gives sellers control over review and auto-file behavior.',
  'Tracks submissions, approvals, and payout progress over time.',
];

export default function AboutMargin() {
  usePageMeta({
    title: 'About Margin | Prompt-Free Recovery for Amazon Sellers',
    description:
      'Margin is building a prompt-free recovery system for Amazon sellers: continuous monitoring, evidence collection, filing readiness, and payout tracking over time.',
    url: `${SITE_META.url}/about-margin`,
  });

  return (
    <PageLayout title="About Margin" noPadding hideNavbar hideSidebar hideLogo midnight>
      <div className="min-h-screen bg-[#070707] text-white relative overflow-hidden font-sans">
        <PublicNavbar />

        <div
          className="fixed inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#070707] to-[#050505]" />

        <main className="relative z-10 mx-auto w-full max-w-6xl px-6 pb-24 pt-32 md:px-10 md:pt-40 lg:pt-44">
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
            className="border-b border-white/10 pb-14"
          >
            <p className="text-[10px] font-bold uppercase tracking-tight text-white/35">
              About Margin
            </p>
            <div className="mt-8 grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
              <h1 className="max-w-3xl text-4xl font-light leading-tight tracking-tight text-white md:text-6xl">
                A prompt-free recovery system for Amazon sellers.
              </h1>
              <div className="space-y-5 text-sm leading-7 text-white/50 md:text-base md:leading-8">
                <p>
                  At the surface, Margin feels simple: it watches seller operations, finds where money is being lost, gathers the proof, and moves valid cases toward recovery.
                </p>
                <p>
                  Underneath that simple experience is a deeper system built to reason across data, documents, and actions. Margin is not a one-time audit tool. It is ongoing recovery coverage.
                </p>
              </div>
            </div>
          </motion.section>

          <section className="grid border-b border-white/10 py-14 lg:grid-cols-[280px_1fr] lg:gap-16">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-tight text-white/35">
                System Model
              </p>
              <h2 className="mt-4 max-w-xs text-2xl font-light tracking-tight text-white">
                Three ideas behind the product.
              </h2>
            </div>
            <div className="mt-10 divide-y divide-white/10 border-y border-white/10 lg:mt-0">
              {pillars.map((pillar) => (
                <article key={pillar.title} className="grid gap-5 py-8 md:grid-cols-[90px_1fr]">
                  <div className="text-[10px] font-bold uppercase tracking-tight text-white/35">
                    {pillar.label}
                  </div>
                  <div>
                    <h3 className="text-xl font-light tracking-tight text-white">
                      {pillar.title}
                    </h3>
                    <p className="mt-4 max-w-3xl text-sm leading-7 text-white/48">
                      {pillar.body}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="grid border-b border-white/10 py-14 lg:grid-cols-[280px_1fr] lg:gap-16">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-tight text-white/35">
                What Margin Does
              </p>
              <h2 className="mt-4 max-w-xs text-2xl font-light tracking-tight text-white">
                Recovery work, continuously coordinated.
              </h2>
            </div>
            <div className="mt-10 grid gap-0 border-y border-white/10 lg:mt-0">
              {capabilities.map((capability, index) => (
                <div
                  key={capability}
                  className="grid gap-4 border-b border-white/10 py-5 last:border-b-0 md:grid-cols-[70px_1fr]"
                >
                  <span className="text-[10px] font-bold uppercase tracking-tight text-white/35">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <p className="text-sm leading-7 text-white/60">{capability}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid border-b border-white/10 py-14 lg:grid-cols-[280px_1fr] lg:gap-16">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-tight text-white/35">
                Why We Are Building
              </p>
            </div>
            <div className="space-y-6 text-sm leading-7 text-white/52 md:text-base md:leading-8">
              <p>
                We are building Margin because too much seller money disappears into operational blind spots. Inventory goes missing. Customers get refunded without returns. Transfers fall short. Cases get approved, but payouts never land. Supporting documents sit across inboxes, drives, and team tools.
              </p>
              <p>
                Most sellers do not have the time to chase every discrepancy manually, and most tools still leave too much work, uncertainty, and money on the table. We think recovery should not depend on whether a seller has time to become an investigator.
              </p>
              <p>
                Recovery should be continuous. It should be explainable. And it should feel like a system already working on the seller's behalf.
              </p>
            </div>
          </section>

          <section className="grid gap-10 py-14 lg:grid-cols-[280px_1fr] lg:gap-16">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-tight text-white/35">
                Direction
              </p>
            </div>
            <div className="max-w-4xl">
              <h2 className="text-3xl font-light leading-tight tracking-tight text-white md:text-4xl">
                Margin is being built as the operating system for recovery workflows.
              </h2>
              <p className="mt-6 text-sm leading-7 text-white/52 md:text-base md:leading-8">
                The goal is simple: when Amazon owes a seller money, Margin should help turn that discrepancy into recovered cash with less manual work, less guesswork, and more trust.
              </p>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link
                  to="/pricing"
                  className="inline-flex h-11 items-center border border-white/15 bg-white px-5 text-[10px] font-bold uppercase tracking-tight text-black transition-colors hover:bg-white/90"
                >
                  View Pricing
                </Link>
                <Link
                  to="/waitlist"
                  className="inline-flex h-11 items-center border border-white/15 bg-white/[0.03] px-5 text-[10px] font-bold uppercase tracking-tight text-white transition-colors hover:bg-white/[0.06]"
                >
                  Join Waitlist
                </Link>
              </div>
            </div>
          </section>
        </main>

        <div className="relative z-10 w-full">
          <BrandFooter />
        </div>
      </div>
    </PageLayout>
  );
}
