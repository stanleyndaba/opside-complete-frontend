import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import { BrandFooter } from '@/components/layout/BrandFooter';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { SITE_META } from '@/config/site';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useOnboardingCapacity } from '@/hooks/useOnboardingCapacity';

const sectionLinks = [
  { href: '#system', label: 'System' },
  { href: '#capabilities', label: 'Capabilities' },
  { href: '#why', label: 'Why' },
  { href: '#promise', label: 'Promise' }
];

const pillars = [
  {
    label: 'A reasoning system',
    detail:
      'Margin does not just store data or show dashboards. It reads across shipments, returns, reimbursements, transfers, fees, and payout activity to expose where Amazon may owe the seller money.'
  },
  {
    label: 'A coordinated recovery workflow',
    detail:
      'Detection, evidence collection, filing readiness, submission control, and payout tracking are handled as one connected workflow instead of a set of disconnected steps.'
  },
  {
    label: 'An ongoing operating layer',
    detail:
      'Margin is not meant to feel like a one-time audit. It is built for continuous recovery coverage, where new discrepancies, support gaps, and payout states stay visible over time.'
  }
];

const capabilities = [
  {
    label: 'Detection',
    detail: 'Find missed reimbursement and discrepancy opportunities across Amazon operational activity.'
  },
  {
    label: 'Evidence',
    detail: 'Collect and match supporting records from connected sources such as email, storage, and uploaded documents.'
  },
  {
    label: 'Readiness',
    detail: 'Separate what is supportable from what is weak, duplicate, thread-only, or outside the right path to move.'
  },
  {
    label: 'Filing control',
    detail: 'Help sellers review, prepare, and move valid cases without turning the workflow into blind submission.'
  },
  {
    label: 'Recovery tracking',
    detail: 'Keep approvals, waits, holds, and payout truth visible until the outcome is actually resolved.'
  }
];

const principles = [
  {
    label: 'Explainable',
    detail: 'The seller should be able to understand what is happening, what is blocked, and why.'
  },
  {
    label: 'Evidence-backed',
    detail: 'The case should move with support, not with guesswork or pressure to file everything.'
  },
  {
    label: 'Operationally calm',
    detail: 'The workflow should reduce noise and make recovery more readable, not create another surface of clutter.'
  },
  {
    label: 'Outcome-aware',
    detail: 'Approval should not be mistaken for payout. Recovery truth only matters when the outcome is actually visible.'
  }
];

const revealProps = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.18 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }
};

const containerClass = 'mx-auto w-full max-w-[1200px] px-5 sm:px-6 md:px-8';
const labelClass = 'text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0B74DE]';
const headingClass = 'mt-4 max-w-[920px] text-[31px] font-semibold leading-[1.02] tracking-[-0.045em] text-[#182026] sm:text-[36px] md:text-[60px]';
const bodyClass = 'mt-4 max-w-[760px] text-[15px] leading-7 text-[#66737F] md:mt-6 md:text-[18px] md:leading-8';

export default function AboutMargin() {
  const navigate = useNavigate();
  const { isFull } = useOnboardingCapacity();

  usePageMeta({
    title: 'About Margin | Operating System for FBA Recovery',
    description:
      'Margin is building an operating system for Amazon FBA recovery: detection, evidence collection, filing readiness, and payout tracking in one continuous workflow.',
    url: `${SITE_META.url}/about-margin`,
    image: SITE_META.image
  });

  const handlePrimaryCta = () => {
    if (isFull) {
      navigate('/waitlist?reason=capacity');
      return;
    }

    navigate('/early-access');
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FAFAF7] font-sans text-[#182026] selection:bg-[#0B74DE]/16 selection:text-[#182026]">
      <PublicNavbar variant="light" />

      <main className="relative">
        <div className="pointer-events-none fixed inset-0 opacity-[0.45] [background-image:linear-gradient(rgba(11,116,222,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(11,116,222,0.045)_1px,transparent_1px)] [background-size:64px_64px]" />
        <div
          className="pointer-events-none fixed inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")'
          }}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[760px] bg-[radial-gradient(circle_at_18%_8%,rgba(11,116,222,0.13),transparent_32%),radial-gradient(circle_at_84%_12%,rgba(46,125,91,0.1),transparent_28%)]" />

        <section className="relative pt-28 md:pt-40">
          <div className={containerClass}>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-[980px]"
            >
              <div className={labelClass}>About Margin</div>
              <h1 className="mt-5 max-w-[980px] text-[38px] font-semibold leading-[0.98] tracking-[-0.06em] text-[#182026] sm:text-[46px] md:text-[76px]">
                Margin is being built as the operating system for Amazon FBA recovery.
              </h1>
              <p className="mt-5 max-w-[760px] text-[16px] leading-7 text-[#4D5B66] md:mt-7 md:text-[19px] md:leading-8">
                At the surface, Margin should feel simple: find what Amazon may owe, prepare the support, control the filing path, and keep the recovery lifecycle visible. Underneath that simple experience is a deeper system built to reason across data, documents, actions, and outcomes over time.
              </p>

              <div className="mt-8 flex w-full max-w-[420px] flex-col gap-3 sm:flex-row sm:items-center">
                {isFull ? (
                  <button
                    type="button"
                    onClick={handlePrimaryCta}
                    className="hidden inline-flex h-11 items-center justify-between rounded-full bg-[#0B74DE] px-5 text-[13px] font-semibold text-white shadow-[0_18px_40px_rgba(11,116,222,0.22)] transition-colors hover:bg-[#0869C9] sm:min-w-[176px] sm:justify-center md:h-12 md:px-6 md:text-sm"
                  >
                    Join Waitlist
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePrimaryCta}
                    className="inline-flex h-11 items-center justify-between rounded-full bg-[#0B74DE] px-5 text-[13px] font-semibold text-white shadow-[0_18px_40px_rgba(11,116,222,0.22)] transition-colors hover:bg-[#0869C9] sm:min-w-[176px] sm:justify-center md:h-12 md:px-6 md:text-sm"
                  >
                    Reserve Early Access
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                )}

                <Link
                  to="/research"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-[#CFE0EA] bg-white px-5 text-[13px] font-semibold text-[#25313A] transition-colors hover:bg-[#F8FAFC] sm:min-w-[176px] md:h-12 md:px-6 md:text-sm"
                >
                  Research Hub
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="relative mt-14 border-y border-[#D8E3E8] bg-white/50 md:mt-20">
          <div className={containerClass}>
            <div className="overflow-x-auto py-4">
              <div className="flex min-w-max gap-2">
                {sectionLinks.map((item) => (
                  <a
                    key={item.href}
                    href={item.href}
                    className="rounded-full border border-[#DCE8EE] bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#66737F] transition-colors hover:bg-[#F3F6F8] hover:text-[#182026]"
                  >
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="relative border-t border-[#E4EDF1] py-16 md:py-28" id="system">
          <div className={containerClass}>
            <motion.div {...revealProps}>
              <div className={labelClass}>System Model</div>
              <h2 className={headingClass}>
                Margin is designed around a simple idea: recovery work should feel coordinated, not investigative.
              </h2>
              <p className={bodyClass}>
                Most sellers do not need another place to stare at raw operational activity. They need a system that can turn discrepancies, support, and state changes into something clear enough to act on and calm enough to trust.
              </p>
            </motion.div>

            <div className="mt-10 border-t border-[#D8E3E8] md:mt-14">
              {pillars.map((item, index) => (
                <motion.div
                  key={item.label}
                  {...revealProps}
                  transition={{ ...revealProps.transition, delay: index * 0.04 }}
                  className="grid gap-3 border-b border-[#D8E3E8] py-6 md:grid-cols-[220px_minmax(0,1fr)] md:gap-8 md:py-8"
                >
                  <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#0B74DE]">{item.label}</div>
                  <p className="max-w-[760px] text-[15px] leading-7 text-[#66737F] md:text-[17px] md:leading-8">
                    {item.detail}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative border-t border-[#E4EDF1] bg-[#F3F6F8] py-16 md:py-28" id="capabilities">
          <div className={containerClass}>
            <motion.div {...revealProps}>
              <div className={labelClass}>What Margin Coordinates</div>
              <h2 className={headingClass}>
                Recovery work becomes useful only when detection, evidence, filing control, and payout truth stay connected.
              </h2>
              <p className={bodyClass}>
                Margin is being shaped as one continuous workflow rather than a collection of isolated features. That means each part of the system should make the rest of the workflow clearer, not heavier.
              </p>
            </motion.div>

            <div className="mt-10 overflow-hidden rounded-[34px] border border-[#CFE0EA] bg-white shadow-[0_34px_100px_rgba(37,49,58,0.1)] md:mt-16">
              {capabilities.map((item, index) => (
                <motion.div
                  key={item.label}
                  {...revealProps}
                  transition={{ ...revealProps.transition, delay: index * 0.04 }}
                  className={`grid gap-3 px-5 py-6 md:grid-cols-[220px_minmax(0,1fr)] md:gap-8 md:px-8 md:py-8 ${
                    index > 0 ? 'border-t border-[#D8E3E8]' : ''
                  }`}
                >
                  <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#0B74DE]">{item.label}</div>
                  <p className="max-w-[760px] text-[15px] leading-7 text-[#66737F] md:text-[17px] md:leading-8">
                    {item.detail}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative border-t border-[#E4EDF1] py-16 md:py-28" id="why">
          <div className={containerClass}>
            <motion.div {...revealProps}>
              <div className={labelClass}>Why We Are Building</div>
              <h2 className={headingClass}>
                Too much seller loss still disappears into operational blind spots.
              </h2>
              <p className={bodyClass}>
                Inventory goes missing. Customers get refunded without returns. Transfers fall short. Cases get approved, but payouts never land. Supporting documents sit across inboxes, storage tools, and team systems. Recovery should not depend on whether a seller has time to become a full-time investigator.
              </p>
            </motion.div>

            <motion.div {...revealProps} className="mt-10 max-w-[820px] space-y-6 md:mt-14">
              <p className="text-[15px] leading-7 text-[#66737F] md:text-[17px] md:leading-8">
                The deeper reason Margin exists is that most sellers are being asked to perform reconciliation, evidence collection, filing judgment, and payout verification across too many disconnected surfaces.
              </p>
              <p className="text-[15px] leading-7 text-[#66737F] md:text-[17px] md:leading-8">
                We think recovery should be continuous, explainable, and calmer than that. It should feel like a working system on the seller&apos;s side, not another dashboard asking for more attention.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="relative border-t border-[#E4EDF1] bg-[#F3F6F8] py-16 md:py-28" id="promise">
          <div className={containerClass}>
            <motion.div {...revealProps}>
              <div className={labelClass}>Seller Promise</div>
              <h2 className={headingClass}>
                The product should make recovery clearer, stricter, and more trustworthy.
              </h2>
            </motion.div>

            <div className="mt-10 border-t border-[#D8E3E8] md:mt-14">
              {principles.map((item, index) => (
                <motion.div
                  key={item.label}
                  {...revealProps}
                  transition={{ ...revealProps.transition, delay: index * 0.04 }}
                  className="grid gap-3 border-b border-[#D8E3E8] py-6 md:grid-cols-[220px_minmax(0,1fr)] md:gap-8 md:py-8"
                >
                  <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#0B74DE]">{item.label}</div>
                  <p className="max-w-[760px] text-[15px] leading-7 text-[#66737F] md:text-[17px] md:leading-8">
                    {item.detail}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative border-t border-[#E4EDF1] py-16 md:py-32">
          <div className={containerClass}>
            <motion.div
              {...revealProps}
              className="overflow-hidden rounded-[34px] border border-[#CFE0EA] bg-[linear-gradient(135deg,#FFFFFF_0%,#F8FAFC_52%,#EAF6EF_100%)] px-6 py-8 shadow-[0_34px_100px_rgba(37,49,58,0.1)] md:px-10 md:py-12"
            >
              <div className="max-w-[860px]">
                <div className={labelClass}>Direction</div>
                <h2 className="mt-4 max-w-[860px] text-[32px] font-semibold leading-[1.02] tracking-[-0.045em] text-[#182026] sm:text-[38px] md:text-[66px]">
                  Margin is being built to help turn hidden Amazon discrepancies into recoverable outcomes with less manual friction.
                </h2>
                <p className="mt-5 max-w-[720px] text-[15px] leading-7 text-[#66737F] md:text-[18px] md:leading-8">
                  The goal is simple: when Amazon may owe a seller money, Margin should make the discrepancy clearer, the support stronger, the workflow more controlled, and the recovery state easier to trust.
                </p>
              </div>

              <div className="mt-8 flex w-full max-w-[420px] flex-col gap-3 sm:flex-row sm:items-center md:mt-10">
                {isFull ? (
                  <button
                    type="button"
                    onClick={handlePrimaryCta}
                    className="hidden inline-flex h-11 items-center justify-between rounded-full bg-[#0B74DE] px-5 text-[13px] font-semibold text-white shadow-[0_18px_40px_rgba(11,116,222,0.22)] transition-colors hover:bg-[#0869C9] sm:min-w-[176px] sm:justify-center md:h-12 md:px-6 md:text-sm"
                  >
                    Join Waitlist
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePrimaryCta}
                    className="inline-flex h-11 items-center justify-between rounded-full bg-[#0B74DE] px-5 text-[13px] font-semibold text-white shadow-[0_18px_40px_rgba(11,116,222,0.22)] transition-colors hover:bg-[#0869C9] sm:min-w-[176px] sm:justify-center md:h-12 md:px-6 md:text-sm"
                  >
                    Reserve Early Access
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                )}

                <Link
                  to="/pricing"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-[#CFE0EA] bg-white px-5 text-[13px] font-semibold text-[#25313A] transition-colors hover:bg-[#F8FAFC] sm:min-w-[176px] md:h-12 md:px-6 md:text-sm"
                >
                  View Pricing
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <BrandFooter />
    </div>
  );
}
