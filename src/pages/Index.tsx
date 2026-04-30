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
    title: 'Wide detector coverage',
    detail: 'Margin scans a broad range of reimbursement signals across shipments, inventory, returns, fees, reimbursements, and payouts.',
    footer: 'Coverage across the workflow'
  },
  {
    title: 'Evidence-backed case preparation',
    detail: 'Margin connects the records, documents, and support before a case moves.',
    footer: 'Support attached before filing'
  },
  {
    title: 'Controlled filing',
    detail: 'Weak, duplicate, or unsupported issues stay held back instead of being pushed forward.',
    footer: 'Weak cases stay held back'
  },
  {
    title: 'Tracked through payout',
    detail: 'See what was detected, prepared, filed, approved, blocked, and actually paid out.',
    footer: 'Outcome verified through payout'
  }
];

const workflowSteps = [
  {
    step: '01',
    title: 'Connect Amazon and start read-only',
    detail: 'Margin begins with a read-only view of shipments, inventory, refunds, fees, reimbursements, and payout activity.'
  },
  {
    step: '02',
    title: 'Find valid reimbursement issues',
    detail: 'The system checks where quantities, events, reimbursements, and ledger activity stop matching cleanly.'
  },
  {
    step: '03',
    title: 'Prepare the evidence',
    detail: 'Supporting records are pulled together so each case can move with proof instead of guesswork.'
  },
  {
    step: '04',
    title: 'File only supportable cases',
    detail: 'Weak, duplicate, or unsupported issues stay held back while valid cases move forward with clear reasoning.'
  },
  {
    step: '05',
    title: 'Track every case through payout',
    detail: 'Detected, filed, approved, blocked, awaiting payout, and recovered states stay visible until the money lands.'
  }
];

const recoveryCategories = [
  {
    label: 'Inbound shipment shortages',
    title: 'Received units land short against the shipment plan.',
    detail: 'Margin checks quantities, shipment records, and supporting documents before the loss gets written off.',
    states: ['Quantity check', 'Evidence ready', 'Ready to file']
  },
  {
    label: 'Lost or damaged inventory',
    title: 'Inventory marked lost or damaged can still be reimbursable.',
    detail: 'Margin keeps the inventory event, the support, and the case state tied together from detection to resolution.',
    states: ['Inventory event', 'Support linked', 'Case active']
  },
  {
    label: 'Refund without return',
    title: 'A customer refund does not prove the unit came back.',
    detail: 'Margin separates refund activity from actual return and inventory resolution before the case moves.',
    states: ['Refund event', 'Return check', 'Case ready']
  },
  {
    label: 'Fee discrepancies',
    title: 'Fee math, reversals, and reimbursements can drift quietly.',
    detail: 'When the ledger stops matching, Margin surfaces the break and keeps the supporting trail attached.',
    states: ['Ledger break', 'Validated', 'Recovery tracked']
  }
];

const sellerReasons = [
  {
    title: 'Less manual investigation',
    detail: 'Sellers do not need to keep hunting through reports, inboxes, and payout screens just to see where money went missing.'
  },
  {
    title: 'Fewer weak claims',
    detail: 'Margin is built to hold weak, duplicate, or unsupported cases instead of filing everything it can find.'
  },
  {
    title: 'Evidence-backed case preparation',
    detail: 'Valid cases move with matched support instead of guesswork, duplicate pressure, or weak filing logic.'
  },
  {
    title: 'Flat subscription, no commissions',
    detail: 'Get ongoing recovery coverage without giving up a percentage of every reimbursement that comes back.'
  }
];

const systemShowcaseStates = [
  {
    label: 'Detected',
    detail: 'A valid reimbursement issue becomes explicit.'
  },
  {
    label: 'Evidence matched',
    detail: 'Supporting proof is attached to the case.'
  },
  {
    label: 'Ready to file',
    detail: 'Weak and duplicate issues stay held back.'
  },
  {
    label: 'Submitted',
    detail: 'The case stays visible after filing.'
  },
  {
    label: 'Recovered',
    detail: 'Approval and payout are tracked separately.'
  }
];

const faqs = [
  {
    question: 'What does Margin do after I connect my Amazon account?',
    answer: 'Margin starts with a read-only audit across shipments, inventory, refunds, fees, reimbursements, and payout activity. It surfaces valid reimbursement issues, prepares support, and separates what is ready to move from what still needs proof or review.'
  },
  {
    question: 'Is Margin a one-time audit or ongoing coverage?',
    answer: 'Margin is built for ongoing recovery coverage. It starts with a read-only audit, then continues monitoring new discrepancies, evidence readiness, filing movement, and payout outcomes over time.'
  },
  {
    question: 'Does Margin file every issue it finds?',
    answer: 'No. Margin is built to hold weak, duplicate, or unsupported cases instead of pushing everything forward carelessly. The goal is valid recovery work, not volume filing.'
  },
  {
    question: 'Where does Margin get supporting evidence from?',
    answer: 'Margin can use connected sources such as Gmail, Google Drive, Dropbox, Slack, and manual uploads. Documents are parsed and matched into the recovery workflow so sellers can see which cases have support and which still need it.'
  },
  {
    question: 'How will I know what is happening with my cases?',
    answer: 'Margin keeps case status explicit across the workflow: detected, evidence matched, ready to file, filed, held, approved, awaiting payout, and recovered.'
  },
  {
    question: 'How does Margin pricing work?',
    answer: 'Margin uses flat subscription pricing with no recovery commissions. Sellers can start with a read-only audit, then continue with ongoing monitoring, evidence-backed case preparation, filing workflow support, and recovery tracking without commission-based billing.'
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
  const [activeProofIndex, setActiveProofIndex] = useState(0);
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
                <div className={sectionLabelClass}>Amazon Reimbursement Recovery</div>

                <h1 className="mt-5 max-w-[760px] text-[38px] font-light leading-[0.98] tracking-tight text-white sm:text-[46px] md:text-[78px]">
                  Recover money Amazon owes you.
                </h1>

                <p className="mt-5 max-w-[640px] text-[16px] leading-7 text-white/62 md:mt-7 md:text-[19px] md:leading-8">
                  Margin finds valid reimbursement issues, prepares the evidence, files only supportable cases, and tracks every case through payout. Flat subscription. No commissions. Start read-only.
                </p>

                <div className="mt-8 grid w-full max-w-[420px] grid-cols-1 gap-3 min-[420px]:grid-cols-2 sm:flex sm:items-center">
                  <Button
                    onClick={handlePrimaryCta}
                    className="h-12 w-full justify-center gap-2 rounded-[18px] border border-sky-300/18 bg-sky-300/[0.08] px-5 text-[13px] font-medium text-sky-50 shadow-[0_14px_30px_rgba(10,16,24,0.24)] hover:bg-sky-300/[0.13] min-[420px]:px-4 sm:min-w-[176px] md:h-12 md:px-6 md:text-sm"
                  >
                    {isFull ? 'Join Waitlist' : 'Start read-only audit'}
                    <ArrowRight className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="outline"
                    onClick={scrollToWorkflow}
                    className="h-12 w-full justify-center rounded-[18px] border border-white/12 bg-white/[0.015] px-5 text-[13px] text-white hover:bg-white/[0.04] min-[420px]:px-4 sm:min-w-[176px] md:h-12 md:px-6 md:text-sm"
                  >
                    See how it works
                  </Button>
                </div>

                <div className="mt-6 flex w-full justify-center">
                  <Link
                    to="/early-access"
                    className="group inline-flex items-center justify-center gap-2 px-2 py-1 text-center transition-colors duration-200 hover:text-white"
                  >
                    <span className="text-[12px] font-semibold uppercase tracking-[0.28em] text-amber-100/92 transition-colors group-hover:text-white">
                      EARLY ACCESS
                    </span>
                    <ArrowRight className="h-4 w-4 text-white/82 transition-all group-hover:translate-x-0.5 group-hover:text-white" />
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
            <div
              className="flex flex-col md:flex-row md:items-stretch"
              onMouseLeave={() => {
                if (!isMobileLayout) {
                  setActiveProofIndex(0);
                }
              }}
            >
              {proofItems.map((item, index) => {
                const isActive = activeProofIndex === index;

                return (
                  <motion.button
                    key={item.title}
                    type="button"
                    aria-pressed={isActive}
                    {...revealProps}
                    transition={{ ...revealProps.transition, delay: index * 0.05 }}
                    whileTap={isMobileLayout ? { scale: 0.995 } : undefined}
                    onClick={() => setActiveProofIndex(index)}
                    onMouseEnter={() => {
                      if (!isMobileLayout) {
                        setActiveProofIndex(index);
                      }
                    }}
                    className={`group relative w-full overflow-hidden px-0 py-6 text-left transition-[flex-grow,transform,opacity,background-color] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] focus-visible:outline-none focus-visible:ring-0 md:min-h-[180px] md:px-6 md:py-7 ${
                      index > 0 ? 'md:border-l md:border-white/8' : ''
                    } ${
                      isActive
                        ? 'translate-y-[-2px] md:-translate-y-[3px] md:border-white/12 md:bg-white/[0.025]'
                        : !isMobileLayout
                          ? 'md:opacity-[0.82]'
                          : ''
                    }`}
                    style={!isMobileLayout ? { flexGrow: isActive ? 1.18 : 0.94, flexBasis: 0 } : undefined}
                  >
                    <div
                      className={`pointer-events-none absolute inset-x-0 top-0 hidden h-px bg-gradient-to-r from-transparent via-sky-300/45 to-transparent transition-opacity duration-300 md:block ${
                        isActive ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                    <div
                      className={`pointer-events-none absolute inset-0 hidden bg-[radial-gradient(circle_at_top,rgba(125,211,252,0.12),transparent_58%),linear-gradient(180deg,rgba(255,255,255,0.035)_0%,rgba(255,255,255,0)_78%)] transition-opacity duration-300 md:block ${
                        isActive ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                    {isActive && index > 0 ? (
                      <div className="pointer-events-none absolute bottom-5 left-0 top-5 w-px bg-gradient-to-b from-transparent via-sky-100/55 to-transparent md:hidden" />
                    ) : null}

                      <div className={`relative z-10 flex h-full flex-col ${index > 0 ? 'border-t border-white/8 pt-4' : ''} md:border-t-0 md:pt-0`}>
                        <div className="flex items-start justify-between gap-4">
                          <div
                            className={`text-[11px] uppercase tracking-[0.16em] transition-colors duration-300 ${
                              isActive ? 'text-white/84' : 'text-white/34'
                            }`}
                          >
                            {item.title}
                          </div>
                          <div
                            className={`shrink-0 text-[10px] uppercase tracking-[0.18em] transition-colors duration-300 ${
                              isActive ? 'text-sky-100/52' : 'text-white/18'
                            }`}
                          >
                            {String(index + 1).padStart(2, '0')}
                          </div>
                        </div>

                      <p
                          className={`mt-3 max-w-[280px] text-[14px] leading-7 transition-colors duration-300 ${
                            isActive ? 'text-white/78' : 'text-white/58'
                          }`}
                        >
                          {item.detail}
                        </p>

                        <div
                          className={`mt-5 text-[10px] uppercase tracking-[0.16em] transition-all duration-300 ${
                            isActive
                              ? 'max-h-10 translate-y-0 opacity-100 text-sky-100/50'
                              : 'max-h-0 translate-y-1 overflow-hidden opacity-0 text-transparent'
                          }`}
                        >
                          {item.footer}
                        </div>
                      </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="relative py-10 md:py-12">
          <div className={containerClass}>
              <div className="max-w-[460px] md:mx-auto md:max-w-[660px] md:text-center">
                <div className="text-[10px] uppercase tracking-[0.16em] text-white/36">Connect Amazon plus the inboxes and files where reimbursement proof already lives</div>
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
                Connect. Detect. Prove. File. Track.
              </h2>
              <p className={sectionBodyClass}>
                Margin turns Amazon reimbursement work into a clear sequence instead of another manual investigation.
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
                Where Margin finds lost money.
              </h2>
              <p className={sectionBodyClass}>
                Each category stays tied to what broke, what evidence exists, and whether the case should move.
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
                See every case from first signal to final payout.
              </h2>
              <p className={sectionBodyClass}>
                Margin keeps the full recovery state visible so sellers can see what was detected, what has evidence, what is ready, what was filed, and what actually paid out.
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
                Why sellers choose Margin.
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
                What sellers usually want to understand before they start.
              </h2>
              <p className={`${sectionBodyClass} md:mx-auto`}>
                These answers explain what Margin looks for, what gets held back, how supporting evidence works, and how recovery stays visible from detection through payout.
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
                  Start with a read-only reimbursement audit.
                </h2>
                <p className="mt-5 max-w-[700px] text-[15px] leading-7 text-white/62 md:text-[18px] md:leading-8">
                  Connect Amazon, let Margin find valid reimbursement issues, and see which cases have real evidence before anything gets filed.
                </p>
              </div>

              <div className="mt-8 flex w-full max-w-[420px] flex-col gap-3 sm:flex-row sm:items-center md:mt-10">
                <Button
                  onClick={handlePrimaryCta}
                  className="h-11 justify-between rounded-full border border-sky-300/18 bg-sky-300/[0.08] px-5 text-[13px] font-medium text-sky-50 hover:bg-sky-300/[0.13] sm:min-w-[176px] sm:justify-center md:h-12 md:px-6 md:text-sm"
                >
                  {isFull ? 'Join Waitlist' : 'Start read-only audit'}
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
