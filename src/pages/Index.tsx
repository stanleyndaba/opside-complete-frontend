import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { BrandFooter } from '@/components/layout/BrandFooter';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { CookieConsent } from '@/components/landing/CookieConsent';
import { RecoveryEngineVisualization } from '@/components/landing/RecoveryEngineVisualization';
import { SITE_META } from '@/config/site';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useOnboardingCapacity } from '@/hooks/useOnboardingCapacity';

const proofItems = [
  {
    title: 'Inbound shipment discrepancies',
    detail: 'Short receives, missing units, warehouse drift'
  },
  {
    title: 'Lost or damaged inventory',
    detail: 'Claimable operational loss across FBA states'
  },
  {
    title: 'Refund without return',
    detail: 'Refund events separated from actual unit return'
  },
  {
    title: 'Fee discrepancies',
    detail: 'Charges, adjustments, and reimbursement gaps'
  }
];

const workflowSteps = [
  {
    step: '01',
    title: 'Connect Amazon or upload FBA data',
    detail: 'Margin starts with a read-only view of inventory, shipments, refunds, fees, reimbursements, and payout activity.'
  },
  {
    step: '02',
    title: 'Audit the operational trail',
    detail: 'The system checks where identifiers, quantities, approvals, and ledger movement stop lining up cleanly.'
  },
  {
    step: '03',
    title: 'Detect missed reimbursement opportunities',
    detail: 'Potential recovery issues are surfaced as explicit cases instead of staying buried in Seller Central activity.'
  },
  {
    step: '04',
    title: 'Prepare evidence and filing path',
    detail: 'Supporting records are matched, weak cases are held, and supportable cases move toward filing with clear reasoning.'
  },
  {
    step: '05',
    title: 'Track the recovery lifecycle',
    detail: 'Filed, approved, blocked, and recovered states stay visible until the outcome is actually resolved.'
  }
];

const recoveryCategories = [
  {
    label: 'Inbound shipment shortages',
    title: 'When quantities land short, the case should not disappear into receiving noise.',
    detail: 'Margin traces shipment identifiers, received quantities, and support records before the loss gets treated as recoverable.',
    states: ['Quantity drift', 'Shipment trail', 'Case ready']
  },
  {
    label: 'Lost or damaged inventory',
    title: 'Units marked lost or damaged still need clean recovery truth.',
    detail: 'Margin keeps the discrepancy, the support, and the filing path tied together so the case stays visible from discovery to outcome.',
    states: ['Inventory event', 'Evidence linked', 'Awaiting response']
  },
  {
    label: 'Refund without return',
    title: 'A refund event is not the same thing as inventory being returned properly.',
    detail: 'Margin separates return noise from missing-unit reality so refund-driven cases do not get written off too early.',
    states: ['Refund event', 'No return', 'Supportable case']
  },
  {
    label: 'Fee discrepancies',
    title: 'Charges and reimbursements need the same level of operational scrutiny as inventory loss.',
    detail: 'When fee math, reimbursements, or reversals stop matching the ledger, Margin surfaces the break with evidence attached.',
    states: ['Ledger drift', 'Validation', 'Recovery tracked']
  }
];

const sellerReasons = [
  {
    title: 'Less manual audit work',
    detail: 'Sellers do not need to keep hunting through reports, inboxes, and payout screens just to understand what broke.'
  },
  {
    title: 'Visible recoverable value',
    detail: 'Margin separates what looks interesting from what is actually supportable and worth moving.'
  },
  {
    title: 'Evidence-backed case preparation',
    detail: 'Cases move with matched support instead of guesswork, duplicate pressure, or weak filing logic.'
  },
  {
    title: 'Clear recovery tracking',
    detail: 'Detected, prepared, filed, approved, blocked, and recovered states stay readable as the workflow moves.'
  }
];

const systemShowcaseStates = [
  {
    label: 'Detected',
    detail: 'The discrepancy becomes explicit.'
  },
  {
    label: 'Evidence matched',
    detail: 'Support is attached to the case.'
  },
  {
    label: 'Ready to file',
    detail: 'Weak and duplicate issues stay held.'
  },
  {
    label: 'Submitted',
    detail: 'The operational trail stays visible.'
  },
  {
    label: 'Recovered',
    detail: 'Approval and payout are no longer confused.'
  }
];

const faqs = [
  {
    question: 'What does Margin do after I connect my Amazon account?',
    answer: 'Margin audits the seller operation for missed reimbursement opportunities across inventory, shipments, returns, reimbursements, fees, and payout activity. It then separates what is supportable from what still needs more proof or review.'
  },
  {
    question: 'Is Margin a one-time audit or ongoing coverage?',
    answer: 'Margin is built for ongoing recovery coverage. It starts with a recovery audit, then continues monitoring new discrepancies, evidence readiness, filing movement, and payout outcomes over time.'
  },
  {
    question: 'Does Margin file every issue it finds?',
    answer: 'No. Margin is built to hold weak, duplicate, thread-only, or unsupported cases instead of pushing them forward carelessly. The goal is controlled recovery work, not volume filing.'
  },
  {
    question: 'Where does Margin get supporting evidence from?',
    answer: 'Margin can use connected sources such as Gmail, Google Drive, Dropbox, Slack, and manual uploads. Documents are parsed and matched into the recovery workflow so sellers can see which cases have support and which still need it.'
  },
  {
    question: 'How will I know what is happening with my cases?',
    answer: 'Margin keeps recovery status explicit across the workflow: detected, evidence matched, ready to file, filed, held, approved, awaiting payout, and recovered.'
  },
  {
    question: 'How does Margin pricing work?',
    answer: 'Margin uses flat subscription pricing with no recovery commissions. Sellers get ongoing monitoring, evidence-backed case preparation, filing workflow support, and recovery tracking without commission-based billing.'
  }
];

const integrationLogos = [
  { name: 'Amazon', src: '/AMZN.png', className: 'h-4 w-auto md:h-5' },
  { name: 'Gmail', src: '/gmailicon.png', className: 'h-5 w-auto md:h-6' },
  { name: 'Outlook', src: '/outlookicon.webp', className: 'h-5 w-auto md:h-6' },
  { name: 'Google Drive', src: '/gd.png', className: 'h-5 w-auto md:h-6' },
  { name: 'Dropbox', src: '/Dropbox_Icon.svg.png', className: 'h-5 w-auto md:h-6' },
  { name: 'OneDrive', src: '/onedriive.png', className: 'h-5 w-auto md:h-6' },
  { name: 'Adobe Sign', src: '/dobe.png', className: 'h-5 w-auto md:h-6' },
  { name: 'Slack', src: '/slack-icon-2019.png', className: 'h-5 w-auto md:h-6' }
];

const containerClass = 'mx-auto w-full max-w-[1200px] px-5 sm:px-6 md:px-8';
const sectionLabelClass = 'text-[10px] font-medium uppercase tracking-[0.18em] text-sky-100/52';
const sectionHeadingClass = 'mt-4 max-w-[900px] text-[31px] font-light leading-[1.02] tracking-tight text-white sm:text-[36px] md:text-[64px]';
const sectionBodyClass = 'mt-4 max-w-[720px] text-[15px] leading-7 text-white/62 md:mt-6 md:text-[18px] md:leading-8';
const revealProps = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }
};

function IntegrationsCarousel({ isMobileLayout }: { isMobileLayout: boolean }) {
  return (
    <motion.div {...revealProps}>
      <div className="relative flex items-center justify-center py-1 md:py-2">
        <motion.div
          className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 origin-center bg-gradient-to-r from-transparent via-sky-400/24 to-transparent"
          initial={{ scaleX: 0.55, opacity: 0 }}
          whileInView={{ scaleX: 1, opacity: 1 }}
          viewport={{ once: true, amount: 0.45 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        />
        <div className="relative z-10 mx-auto inline-flex rounded-[6px] border border-sky-400/12 bg-[#070707] px-3 py-1 text-[10px] font-medium tracking-tight text-sky-100/56 md:px-4 md:py-1.5 md:text-[11px]">
          Integrations
        </div>
      </div>

      <div className="relative mt-4 overflow-hidden md:mt-6">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[#070707] to-transparent md:w-28" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[#070707] to-transparent md:w-28" />
        <motion.div
          className="flex w-max items-center gap-8 px-2 md:gap-12 md:px-4"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: isMobileLayout ? 20 : 28, repeat: Infinity, ease: 'linear' }}
        >
          {[...integrationLogos, ...integrationLogos].map((logo, index) => (
            <div
              key={`${logo.name}-${index}`}
              className="flex h-9 w-[46px] shrink-0 items-center justify-center md:h-14 md:w-[92px] lg:w-[104px]"
              aria-label={logo.name}
              title={logo.name}
            >
              <img
                src={logo.src}
                alt={logo.name}
                className={`${logo.className} object-contain opacity-90 saturate-110`}
              />
            </div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}

function MobileSystemPreview() {
  return (
    <div className="overflow-hidden rounded-[22px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045)_0%,rgba(7,9,12,0.96)_100%)]">
      <div className="grid grid-cols-[auto_1fr] gap-3 border-b border-white/8 px-4 py-3 text-[10px] uppercase tracking-[0.16em] text-white/42">
        <span>State</span>
        <span>Meaning</span>
      </div>
      {systemShowcaseStates.map((item, index) => (
        <motion.div
          key={item.label}
          {...revealProps}
          transition={{ ...revealProps.transition, delay: index * 0.05 }}
          className={`grid grid-cols-[auto_1fr] gap-4 px-4 py-4 ${index > 0 ? 'border-t border-white/7' : ''}`}
        >
          <div className="pt-0.5 text-[11px] uppercase tracking-[0.16em] text-sky-100/58">{item.label}</div>
          <div className="text-[14px] leading-7 text-white/62">{item.detail}</div>
        </motion.div>
      ))}
    </div>
  );
}

export default function Index() {
  const navigate = useNavigate();
  const [showMoreFaqs, setShowMoreFaqs] = useState(false);
  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const { isFull, capacity } = useOnboardingCapacity();

  usePageMeta(SITE_META);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(max-width: 767px)');
    const sync = () => setIsMobileLayout(mediaQuery.matches);
    sync();

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', sync);
      return () => mediaQuery.removeEventListener('change', sync);
    }

    mediaQuery.addListener(sync);
    return () => mediaQuery.removeListener(sync);
  }, []);

  const handlePrimaryCta = () => {
    if (isFull) {
      navigate('/waitlist?reason=capacity');
      return;
    }

    navigate('/login');
  };

  const scrollToWorkflow = () => {
    if (typeof document === 'undefined') return;
    document.getElementById('how-margin-works')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const visibleFaqCount = showMoreFaqs ? faqs.length : isMobileLayout ? 3 : 4;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050505] font-sans text-white selection:bg-sky-400/25 selection:text-white">
      <PublicNavbar />

      <main className="relative">
        <div
          className="pointer-events-none fixed inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")'
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_8%,rgba(56,189,248,0.08),transparent_36%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_90%,rgba(148,163,184,0.06),transparent_32%)]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#090909] via-[#050505] to-[#040404]" />

        <section className="relative pt-28 md:pt-40">
          <div className={containerClass}>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="w-full"
            >
              <div className="max-w-[780px]">
                <div className={sectionLabelClass}>Amazon FBA Recovery Platform</div>

                <h1 className="mt-5 max-w-[760px] text-[38px] font-light leading-[0.98] tracking-tight text-white sm:text-[46px] md:text-[78px]">
                  Turn hidden Amazon reimbursement loss into evidence-backed recovery cases.
                </h1>

                <p className="mt-5 max-w-[640px] text-[16px] leading-7 text-white/62 md:mt-7 md:text-[19px] md:leading-8">
                  Margin audits the operational trail across inventory, shipments, refunds, fees, reimbursements, and payouts to identify missed reimbursement opportunities, prepare the support, and keep the recovery workflow visible.
                </p>

                <div className="mt-8 flex w-full max-w-[420px] flex-col gap-3 sm:flex-row sm:items-center">
                  <Button
                    onClick={handlePrimaryCta}
                    className="h-11 justify-between rounded-full border border-sky-300/18 bg-sky-300/[0.08] px-5 text-[13px] font-medium text-sky-50 hover:bg-sky-300/[0.13] sm:min-w-[176px] sm:justify-center md:h-12 md:px-6 md:text-sm"
                  >
                    {isFull ? 'Join Waitlist' : 'Connect Amazon'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    onClick={scrollToWorkflow}
                    className="h-11 justify-between rounded-full border border-white/12 bg-transparent px-5 text-[13px] text-white hover:bg-white/[0.04] sm:min-w-[176px] sm:justify-center md:h-12 md:px-6 md:text-sm"
                  >
                    See how it works
                  </Button>
                </div>

                <div className="mt-6 flex w-full justify-center">
                  <Link
                    to="/early-access"
                    className="group inline-flex max-w-[560px] flex-wrap items-center justify-center gap-2 rounded-full border border-amber-200/18 bg-[linear-gradient(135deg,rgba(250,204,21,0.12),rgba(56,189,248,0.08))] px-4 py-2.5 text-center shadow-[0_18px_50px_rgba(15,23,42,0.45)] backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-white/18 hover:bg-[linear-gradient(135deg,rgba(250,204,21,0.16),rgba(56,189,248,0.11))]"
                  >
                    <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-amber-100">Early Access</span>
                    <span className="hidden h-3 w-px bg-white/15 sm:block" />
                    <span className="text-[12px] text-white/72 transition-colors group-hover:text-white/88">
                      Reserve one of the first 100 spots
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-white/78 transition-all group-hover:translate-x-0.5 group-hover:text-white" />
                  </Link>
                </div>

                {isFull ? (
                  <div className="mt-5 max-w-[360px] text-[13px] leading-6 text-white/56">
                    <div>We are onboarding a small batch of sellers right now.</div>
                    <div>Next batch opens in {capacity?.nextBatchHours ?? 24} hours.</div>
                  </div>
                ) : null}
              </div>
            </motion.div>
          </div>
        </section>

        <section className="relative mt-14 border-y border-white/8 bg-white/[0.02] md:mt-20">
          <div className={containerClass}>
            <div className="grid md:grid-cols-4">
              {proofItems.map((item, index) => (
                <motion.div
                  key={item.title}
                  {...revealProps}
                  transition={{ ...revealProps.transition, delay: index * 0.05 }}
                  className={`px-0 py-5 md:px-6 md:py-7 ${index > 0 ? 'border-t border-white/8 md:border-l md:border-t-0' : ''}`}
                >
                  <div className="text-[11px] uppercase tracking-[0.16em] text-white/34">{item.title}</div>
                  <p className="mt-2 max-w-[220px] text-[14px] leading-7 text-white/58">{item.detail}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative py-10 md:py-12">
          <div className={containerClass}>
            <div className="max-w-[460px] md:mx-auto md:max-w-[660px] md:text-center">
              <div className="text-[10px] uppercase tracking-[0.16em] text-white/36">Works with the sources already inside your recovery workflow</div>
            </div>
            <div className="mt-6 md:mt-8">
              <IntegrationsCarousel isMobileLayout={isMobileLayout} />
            </div>
          </div>
        </section>

        <section className="relative border-t border-white/8 py-16 md:py-32" id="how-margin-works">
          <div className={containerClass}>
            <motion.div {...revealProps}>
              <div className={sectionLabelClass}>How Margin Works</div>
              <h2 className={sectionHeadingClass}>
                A controlled recovery workflow for Amazon FBA operators.
              </h2>
              <p className={sectionBodyClass}>
                Margin does not dump raw activity back on the seller. It turns operational noise into a clear sequence: audit, detect, prepare, file, and track.
              </p>
            </motion.div>

            <div className="mt-10 border-t border-white/8 md:mt-16">
              {workflowSteps.map((item, index) => (
                <motion.div
                  key={item.step}
                  {...revealProps}
                  transition={{ ...revealProps.transition, delay: index * 0.04 }}
                  className="grid gap-4 border-b border-white/8 py-6 md:grid-cols-[88px_minmax(0,1fr)] md:gap-8 md:py-9"
                >
                  <div className="text-[13px] uppercase tracking-[0.16em] text-sky-100/52">{item.step}</div>
                  <div className="max-w-[800px]">
                    <h3 className="text-[22px] font-medium leading-[1.08] tracking-tight text-white md:text-[34px]">
                      {item.title}
                    </h3>
                    <p className="mt-3 max-w-[680px] text-[15px] leading-7 text-white/60 md:text-[18px] md:leading-8">
                      {item.detail}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative border-t border-white/8 bg-[#07090c] py-16 md:bg-transparent md:py-32">
          <div className={containerClass}>
            <motion.div {...revealProps}>
              <div className={sectionLabelClass}>Recovery Categories</div>
              <h2 className={sectionHeadingClass}>
                The reimbursement issues sellers usually do not see clearly enough.
              </h2>
              <p className={sectionBodyClass}>
                Margin keeps recovery categories explicit so the seller can understand where the loss happened, what support exists, and whether the case should move.
              </p>
            </motion.div>

            <div className="mt-10 overflow-hidden rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(7,9,12,0.96)_100%)] md:mt-16">
              {recoveryCategories.map((item, index) => (
                <motion.div
                  key={item.label}
                  {...revealProps}
                  transition={{ ...revealProps.transition, delay: index * 0.04 }}
                  className={`grid gap-4 px-5 py-6 md:grid-cols-[220px_minmax(0,1fr)_auto] md:items-start md:gap-8 md:px-8 md:py-9 ${
                    index > 0 ? 'border-t border-white/8' : ''
                  }`}
                >
                  <div className="text-[12px] uppercase tracking-[0.16em] text-sky-100/50">{item.label}</div>

                  <div className="max-w-[680px]">
                    <h3 className="text-[22px] font-medium leading-[1.08] tracking-tight text-white md:text-[32px]">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-[15px] leading-7 text-white/60 md:text-[17px] md:leading-8">
                      {item.detail}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 md:max-w-[220px] md:justify-end">
                    {item.states.map((state) => (
                      <span
                        key={state}
                        className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] uppercase tracking-[0.14em] text-white/56"
                      >
                        {state}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative border-t border-white/8 py-16 md:py-32">
          <div className={containerClass}>
            <motion.div {...revealProps}>
              <div className={sectionLabelClass}>Product View</div>
              <h2 className={sectionHeadingClass}>
                The recovery workflow stays visible from first signal to final outcome.
              </h2>
              <p className={sectionBodyClass}>
                Margin is built to feel like a controlled operating system for reimbursement work, not a spreadsheet chase and not a cluttered dashboard dump.
              </p>
            </motion.div>

            <div className="mt-10 md:hidden">
              <MobileSystemPreview />
            </div>

            <motion.div
              {...revealProps}
              className="relative mx-auto mt-12 hidden max-w-[1120px] overflow-hidden rounded-none border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(7,8,10,0.99)_100%)] md:block"
            >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-300/30 to-transparent" />
              <div className="grid grid-cols-5 border-b border-white/8 px-8 py-4 text-[10px] uppercase tracking-[0.16em] text-white/38">
                {systemShowcaseStates.map((item) => (
                  <div key={item.label}>{item.label}</div>
                ))}
              </div>
              <div className="px-5 py-6 md:px-6 md:py-7">
                <RecoveryEngineVisualization />
              </div>
            </motion.div>
          </div>
        </section>

        <section className="relative border-t border-white/8 bg-[#07090c] py-16 md:bg-transparent md:py-32">
          <div className={containerClass}>
            <motion.div {...revealProps}>
              <div className={sectionLabelClass}>Why Sellers Use Margin</div>
              <h2 className={sectionHeadingClass}>
                Built to reduce audit drag and make recovery work readable.
              </h2>
            </motion.div>

            <div className="mt-10 border-t border-white/8 md:mt-16">
              {sellerReasons.map((item, index) => (
                <motion.div
                  key={item.title}
                  {...revealProps}
                  transition={{ ...revealProps.transition, delay: index * 0.04 }}
                  className="grid gap-3 border-b border-white/8 py-6 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:gap-10 md:py-8"
                >
                  <h3 className="text-[22px] font-medium leading-[1.08] tracking-tight text-white md:text-[28px]">
                    {item.title}
                  </h3>
                  <p className="max-w-[660px] text-[15px] leading-7 text-white/60 md:text-[17px] md:leading-8">
                    {item.detail}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative border-t border-white/8 py-16 md:py-32">
          <div className={containerClass}>
            <motion.div {...revealProps} className="mx-auto max-w-[900px] md:text-center">
              <div className={sectionLabelClass}>Understanding Margin</div>
              <h2 className={sectionHeadingClass}>
                What sellers usually want to understand before they start with Margin.
              </h2>
              <p className={`${sectionBodyClass} md:mx-auto`}>
                These answers explain what Margin looks for, how reimbursement cases move, what gets held back, and how recovery stays visible from detection through payout.
              </p>
            </motion.div>

            <div className="mx-auto mt-10 max-w-[940px] md:mt-14">
              <Accordion type="single" collapsible className="space-y-2 md:space-y-4">
                {faqs.slice(0, visibleFaqCount).map((item, index) => (
                  <AccordionItem key={item.question} value={`faq-${index}`} className="border-t border-white/8 px-1">
                    <AccordionTrigger className="py-4 text-left text-[15px] font-medium tracking-tight text-white hover:no-underline md:py-5 md:text-[18px]">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="pb-5 text-[14px] leading-7 text-white/58 md:text-[16px] md:leading-8">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              {!showMoreFaqs ? (
                <div className="mt-8 flex justify-center md:mt-10">
                  <Button
                    variant="outline"
                    onClick={() => setShowMoreFaqs(true)}
                    className="rounded-full border border-white/10 bg-transparent px-6 text-sm text-white hover:bg-white/[0.04]"
                  >
                    Show more questions
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="relative border-t border-white/8 bg-[#07090c] py-16 md:bg-transparent md:py-36">
          <div className={containerClass}>
            <motion.div
              {...revealProps}
              className="overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(5,7,10,0.98)_100%)] px-6 py-8 md:px-10 md:py-12"
            >
              <div className="max-w-[880px]">
                <div className={sectionLabelClass}>Start With Clarity</div>
                <h2 className="mt-4 max-w-[860px] text-[32px] font-light leading-[1.02] tracking-tight text-white sm:text-[38px] md:text-[68px]">
                  Start with a read-only recovery audit.
                </h2>
                <p className="mt-5 max-w-[700px] text-[15px] leading-7 text-white/62 md:text-[18px] md:leading-8">
                  Connect Amazon, let Margin audit the operational trail, and see which reimbursement opportunities are supportable before anything gets pushed forward.
                </p>
              </div>

              <div className="mt-8 flex w-full max-w-[420px] flex-col gap-3 sm:flex-row sm:items-center md:mt-10">
                <Button
                  onClick={handlePrimaryCta}
                  className="h-11 justify-between rounded-full border border-sky-300/18 bg-sky-300/[0.08] px-5 text-[13px] font-medium text-sky-50 hover:bg-sky-300/[0.13] sm:min-w-[176px] sm:justify-center md:h-12 md:px-6 md:text-sm"
                >
                  {isFull ? 'Join Waitlist' : 'Connect Amazon'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <Button
                  variant="outline"
                  onClick={scrollToWorkflow}
                  className="h-11 justify-between rounded-full border border-white/12 bg-transparent px-5 text-[13px] text-white hover:bg-white/[0.04] sm:min-w-[176px] sm:justify-center md:h-12 md:px-6 md:text-sm"
                >
                  Review the workflow
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <BrandFooter />
      <CookieConsent />
    </div>
  );
}
