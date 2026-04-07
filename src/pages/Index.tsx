import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Clock, ShieldCheck } from 'lucide-react';
import { BrandFooter } from '@/components/layout/BrandFooter';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { CookieConsent } from '@/components/landing/CookieConsent';
import { RecoveryEngineVisualization } from '@/components/landing/RecoveryEngineVisualization';
import { SITE_META } from '@/config/site';
import { usePageMeta } from '@/hooks/usePageMeta';

const whatWeDoPoints = [
  'Detect reimbursement discrepancies across inventory, shipments, returns, fees, and reimbursements.',
  'Verify identifiers, quantities, and evidence before a case is considered ready.',
  'File only cases supported by evidence and policy, track Amazon replies, and stay with the case through payout.'
];

const processSteps = [
  {
    step: '01',
    title: 'Detect reimbursable discrepancies',
    detail: 'Margin audits reimbursement data and separates supported cases from unsupported or duplicate issues.'
  },
  {
    step: '02',
    title: 'Verify identifiers and evidence',
    detail: 'Shipment IDs, ASINs, FNSKUs, quantities, policy timing, and supporting documents are checked before any filing is prepared.'
  },
  {
    step: '03',
    title: 'File or hold with a reason',
    detail: 'Supported cases move forward. Cases that are weak, duplicate, or thread-only are held with an explicit reason.'
  },
  {
    step: '04',
    title: 'Track Amazon to final outcome',
    detail: 'Case status, Amazon thread changes, approvals, evidence requests, and payout confirmation stay visible in one place.'
  }
];

const mobileOrchestrationSteps = [
  {
    title: 'Detection',
    detail: 'Amazon inventory, shipment, return, fee, and reimbursement signals enter Margin and are screened for discrepancies that can be supported by evidence and policy.',
    signals: ['FBA Inventory', 'Shipments', 'Returns / Refunds']
  },
  {
    title: 'Evidence',
    detail: 'Identifiers, quantities, policy timing, and supporting documents are matched before a case is considered ready.',
    signals: ['Gmail', 'Outlook', 'Dropbox']
  },
  {
    title: 'Filing',
    detail: 'Only cases supported by evidence and policy move forward. Weak, duplicate, or thread-only issues are held.',
    signals: ['Ready to file', 'Filed']
  },
  {
    title: 'Payout',
    detail: 'Amazon replies, approvals, evidence requests, and payout confirmation remain visible until the case is closed.',
    signals: ['Approved', 'Recovered $']
  }
];

const mobileIntegrationLogos = [
  { name: 'Amazon', src: '/AMZN.png', className: 'max-h-4 max-w-[28px]' },
  { name: 'Gmail', src: '/gmailicon.png', className: 'max-h-5 max-w-5' },
  { name: 'Outlook', src: '/outlookicon.webp', className: 'max-h-5 max-w-5' },
  { name: 'Google Drive', src: '/gd.png', className: 'max-h-5 max-w-5' },
  { name: 'Dropbox', src: '/Dropbox_Icon.svg.png', className: 'max-h-5 max-w-5' },
  { name: 'OneDrive', src: '/onedriive.png', className: 'max-h-5 max-w-5' },
  { name: 'Adobe Sign', src: '/dobe.png', className: 'max-h-5 max-w-5' },
  { name: 'Slack', src: '/slack-icon-2019.png', className: 'max-h-5 max-w-5' }
];

const proofBlocks = [
  {
    value: 'Missed reimbursement cases are surfaced',
    detail: 'Cases that can be supported are identified for review instead of staying buried in operational data.'
  },
  {
    value: 'Unsupported filings are blocked',
    detail: 'Duplicate, weak, and thread-only filings are stopped before they reach Amazon.'
  },
  {
    value: 'Case status stays explicit',
    detail: 'Waiting, evidence requests, approvals, rejections, and payouts remain visible.'
  }
];

const mobileProofArtifacts = [
  ['Detected', 'Evidence Ready', 'Filed'],
  ['Weak', 'Duplicate', 'Thread-only'],
  ['Waiting', 'Evidence', 'Approvals', 'Payouts']
];

const filingRules = [
  'Verified identifiers are present',
  'Evidence is matched or the case can otherwise be supported by policy and records',
  'The issue is not already active or duplicated',
  'The case is still inside Amazon’s policy window'
];

const holdRules = [
  'Shipment, product, or quantity truth is missing',
  'The same issue already has a live case or thread',
  'Amazon email exists but should stay thread-only',
  'The evidence is not strong enough to support a filing yet'
];

const faqs = [
  {
    question: 'Which services help automate FBA reimbursement claims?',
    answer: 'Sellers do not just want automation. They want a system that detects reimbursement discrepancies, verifies the evidence, files only supported cases, and tracks Amazon until payout.'
  },
  {
    question: 'What are common reasons for FBA reimbursement denials?',
    answer: 'Weak identifiers, missing quantity truth, unsupported evidence, expired policy windows, and duplicate or already-active issues are common reasons for denial. Margin is designed to hold those cases instead of filing them.'
  },
  {
    question: 'What documentation is required to submit a successful FBA reimbursement claim?',
    answer: 'It depends on the case type, but common proof includes shipment IDs, ASIN or FNSKU, quantity truth, supplier invoices, bills of lading, proof of delivery, and any Amazon thread-specific evidence requested during follow-up.'
  },
  {
    question: 'How can I check if I am eligible for FBA reimbursements?',
    answer: 'You need an audit across inventory, shipments, fees, returns, and reimbursements that distinguishes supported cases from expired, duplicate, or unsupported ones.'
  },
  {
    question: 'How do I track the status of reimbursement requests?',
    answer: 'You should be able to see whether a case is waiting on Amazon, needs evidence, approved, rejected, or paid. Margin is designed to keep that case status explicit.'
  },
  {
    question: 'Will using an automated tool get my Amazon account suspended?',
    answer: 'A risky tool can create account problems if it files weak, duplicate, or careless cases. Margin applies a pre-filing truth gate so unsupported cases are blocked before submission.'
  },
  {
    question: 'Do I have to manually upload invoices for every claim?',
    answer: 'Not necessarily. When evidence sources are connected, Margin uses the available documents. If a required document is missing, the system should tell you exactly what is missing before a case is filed.'
  },
  {
    question: 'What is the typical timeframe for FBA reimbursement claim resolution?',
    answer: 'That depends on Amazon’s handling of the case. Some cases move quickly, some require more evidence, and some are approved before payout is confirmed. The important part is keeping the current case state explicit.'
  }
];

const eyebrowClass = 'text-[11px] font-medium tracking-tight text-white/42';
const containerClass = 'mx-auto w-full max-w-[1160px] px-5 sm:px-6 md:px-8';
const mobileColumnClass = 'mx-auto max-w-[390px] md:mx-0 md:max-w-none';
const mobileRevealProps = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.22 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }
};

function MobileIntegrationsCarousel() {
  return (
    <motion.div {...mobileRevealProps} className="md:hidden">
      <div className="relative flex items-center justify-center py-2">
        <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-white/10" />
        <div className="relative z-10 mx-auto inline-flex rounded-full border border-white/10 bg-[#0b0b0b]/85 px-4 py-1.5 text-[11px] font-medium tracking-tight text-white/52 backdrop-blur-sm">
          Integrations
        </div>
      </div>

      <div className="relative mt-6 overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[#070707] to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[#070707] to-transparent" />
        <motion.div
          className="flex w-max items-center gap-10 px-2"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          {[...mobileIntegrationLogos, ...mobileIntegrationLogos].map((logo, index) => (
            <div
              key={`${logo.name}-${index}`}
              className="flex h-10 shrink-0 items-center justify-center"
              aria-label={logo.name}
              title={logo.name}
            >
              <img
                src={logo.src}
                alt={logo.name}
                className={`${logo.className} object-contain opacity-90`}
              />
            </div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
}

function MobilePhaseShell({
  children,
  className = ''
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[28px] border border-white/8 bg-white/[0.025] px-5 py-8 shadow-[0_18px_44px_rgba(0,0,0,0.18)] sm:px-6 md:rounded-none md:border-0 md:bg-transparent md:px-0 md:py-0 md:shadow-none ${className}`}
    >
      {children}
    </div>
  );
}

export default function Index() {
  const navigate = useNavigate();
  const [showMoreFaqs, setShowMoreFaqs] = useState(false);
  const [isMobileLayout, setIsMobileLayout] = useState(false);
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

  const handleConnectAmazon = () => {
    navigate('/login');
  };

  const scrollToHowItWorks = () => {
    if (typeof document === 'undefined') return;
    const targetId = isMobileLayout ? 'how-margin-works-mobile' : 'how-margin-works';
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const visibleFaqCount = showMoreFaqs ? faqs.length : isMobileLayout ? 3 : 5;

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#070707] font-sans text-white selection:bg-white/15">
      <PublicNavbar />

      <main className="relative">
        <div className="pointer-events-none absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.02]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#090909] via-[#070707] to-[#050505]" />

        <section className="relative pb-16 pt-28 md:pb-36 md:pt-40">
          <div className="pointer-events-none absolute inset-x-0 top-12 overflow-hidden">
            <motion.div
              aria-hidden="true"
              className="absolute left-[10%] h-64 w-64 rounded-full border border-white/8 bg-white/[0.015] blur-3xl"
              animate={{ opacity: [0.18, 0.3, 0.18], y: [0, 14, 0] }}
              transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              aria-hidden="true"
              className="absolute right-[12%] top-24 h-72 w-72 rounded-full border border-white/6 bg-white/[0.02] blur-3xl"
              animate={{ opacity: [0.12, 0.24, 0.12], y: [0, -12, 0] }}
              transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
            />
          </div>

          <div className={containerClass}>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className={`max-w-[840px] ${mobileColumnClass}`}
            >
              <div className="flex justify-start md:justify-center">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: [0.78, 1, 0.78], y: [0, -2, 0] }}
                  transition={{ duration: 4.8, repeat: Infinity, ease: 'easeInOut' }}
                  className="inline-flex rounded-[5px] border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium tracking-tight text-white/72 md:px-3.5"
                >
                  Web-based only. Mobile experience rollout mid-April 2026.
                </motion.div>
              </div>

              <h1 className="mt-4 max-w-[320px] text-[38px] font-light leading-[0.95] tracking-tight text-white sm:max-w-[360px] sm:text-[42px] md:mt-6 md:max-w-[760px] md:text-7xl">
                Recover the FBA reimbursements you&apos;re missing.
              </h1>

              <p className="mt-5 max-w-[340px] text-[15px] leading-6 text-white/62 md:mt-10 md:max-w-[760px] md:text-xl md:leading-8">
                Margin detects reimbursement discrepancies, verifies the identifiers and evidence, files only cases supported by evidence and policy, and tracks Amazon until payout.
              </p>

              <div className="mt-8 flex w-full max-w-[340px] flex-col items-stretch gap-3 sm:mt-10 sm:max-w-none sm:flex-row sm:items-start">
                <Button
                  onClick={handleConnectAmazon}
                  className="h-11 w-full min-w-0 justify-between rounded-[5px] border border-white/10 bg-transparent px-5 text-sm font-medium text-white hover:bg-white/[0.04] sm:min-w-[168px] sm:w-auto sm:justify-center"
                >
                  Connect Amazon
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={scrollToHowItWorks}
                  className="h-11 w-full min-w-0 justify-between rounded-[5px] border border-white bg-white px-5 text-sm font-medium text-black hover:bg-white/90 hover:text-black sm:min-w-[168px] sm:w-auto sm:justify-center"
                >
                  See how it works
                </Button>
              </div>

              <div className="mt-8 border-t border-white/8 pt-6 md:mt-8 md:border-0 md:pt-0">
                <MobileIntegrationsCarousel />
              </div>
            </motion.div>
          </div>
        </section>

        <section className="relative border-b border-white/8 bg-white/[0.02] py-16 md:bg-transparent md:py-28">
          <div className={containerClass}>
            <MobilePhaseShell>
              <motion.div {...mobileRevealProps} className={`max-w-[720px] ${mobileColumnClass}`}>
                <div className={eyebrowClass}>The orchestration layer</div>
                <h2 className="mt-3 max-w-[320px] text-[34px] font-light tracking-tight text-white md:mt-4 md:max-w-none md:text-6xl">
                  See how the system routes Amazon signals into evidence-backed cases and confirmed payouts.
                </h2>
              </motion.div>

              <div className="mt-10 md:hidden">
                <div className="relative rounded-[24px] border border-white/8 bg-[#090909]/88 px-4 py-3">
                  <div className="absolute bottom-8 left-[17px] top-8 w-px bg-white/10" />
                  <div className="space-y-0">
                    {mobileOrchestrationSteps.map((step, index) => (
                      <motion.div
                        {...mobileRevealProps}
                        key={step.title}
                        className={`flex gap-4 py-6 ${index > 0 ? 'border-t border-white/8' : ''}`}
                      >
                        <div className="relative z-10 pt-0.5 text-[11px] font-medium tracking-tight text-white/30">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-[#0a0a0a]">
                            0{index + 1}
                          </div>
                        </div>
                        <div>
                          <h3 className="text-[22px] font-medium tracking-tight text-white">{step.title}</h3>
                          <p className="mt-2 max-w-[288px] text-[15px] leading-6 text-white/58">
                            {step.detail}
                          </p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {step.signals.map((signal) => (
                              <span
                                key={signal}
                                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium tracking-tight text-white/62"
                              >
                                {signal}
                              </span>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </MobilePhaseShell>
          </div>

          <div className="relative left-1/2 mt-16 hidden w-screen max-w-[1320px] -translate-x-1/2 px-4 md:block md:px-8">
            <RecoveryEngineVisualization />
          </div>
        </section>

        <section className="relative border-t border-white/8 bg-white/[0.015] py-20 md:hidden" id="how-margin-works-mobile">
          <div className={containerClass}>
            <MobilePhaseShell className={mobileColumnClass}>
              <motion.div {...mobileRevealProps}>
                <div className={eyebrowClass}>What Margin does</div>
                <h2 className="mt-3 max-w-[320px] text-[34px] font-light tracking-tight text-white">
                  Detect discrepancies, verify the case, and file only when the evidence is there.
                </h2>
                <p className="mt-4 max-w-[320px] text-[15px] leading-6 text-white/60">
                  The system should surface discrepancies, explain why a case is ready or blocked, and keep Amazon&apos;s response visible through payout.
                </p>
              </motion.div>

              <div className="mt-10 space-y-0">
                {processSteps.map((item) => (
                  <motion.div
                    {...mobileRevealProps}
                    key={item.step}
                    className="border-t border-white/8 py-6 first:pt-0"
                  >
                    <div className="text-sm font-medium tracking-tight text-white/34">{item.step}</div>
                    <h3 className="mt-2 max-w-[280px] text-[24px] font-medium tracking-tight text-white">{item.title}</h3>
                    <p className="mt-2 max-w-[320px] text-[15px] leading-6 text-white/58">{item.detail}</p>
                  </motion.div>
                ))}
              </div>
            </MobilePhaseShell>
          </div>
        </section>

        <section className="relative hidden md:block md:py-36">
          <div className={containerClass}>
            <div className={`max-w-[760px] ${mobileColumnClass}`}>
              <div className={eyebrowClass}>What Margin does</div>
              <h2 className="mt-3 text-[34px] font-light tracking-tight text-white md:mt-4 md:text-6xl">
                Detect discrepancies, verify the case, and file only when the evidence is there.
              </h2>
              <p className="mt-4 max-w-[620px] text-[15px] leading-6 text-white/60 md:mt-6 md:max-w-[700px] md:text-lg md:leading-8">
                The system should surface discrepancies, explain why a case is ready or blocked, and keep Amazon&apos;s response visible through payout.
              </p>
            </div>

            <div className={`mt-10 max-w-[980px] space-y-6 md:mt-14 md:space-y-8 ${mobileColumnClass}`}>
              {whatWeDoPoints.map((point, index) => (
                <div key={point} className="grid gap-2 border-t border-white/8 pt-5 md:grid-cols-[72px_minmax(0,1fr)] md:gap-4 md:pt-8">
                  <div className="text-sm font-medium tracking-tight text-white/34">0{index + 1}</div>
                  <p className="max-w-[360px] text-[22px] leading-8 text-white/82 md:max-w-[820px] md:text-2xl md:leading-9">
                    {point}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative hidden border-t border-white/8 md:block md:py-36" id="how-margin-works">
          <div className={containerClass}>
            <div className={`max-w-[780px] ${mobileColumnClass}`}>
              <div className={eyebrowClass}>How Margin works</div>
              <h2 className="mt-3 text-[34px] font-light tracking-tight text-white md:mt-4 md:text-6xl">
                Detect, verify, file, track, and follow through.
              </h2>
              <p className="mt-4 max-w-[620px] text-[15px] leading-6 text-white/60 md:mt-6 md:max-w-[720px] md:text-lg md:leading-8">
                The promise has to stay operationally true. Margin should know when to move, when to wait, and how to make that visible.
              </p>
            </div>

            <div className={`mt-10 max-w-[980px] space-y-6 md:mt-16 md:space-y-12 ${mobileColumnClass}`}>
              {processSteps.map((item) => (
                <div key={item.step} className="grid gap-2 border-t border-white/8 pt-5 md:grid-cols-[88px_minmax(0,1fr)] md:gap-4 md:pt-8">
                  <div className="text-sm font-medium tracking-tight text-white/34">{item.step}</div>
                  <div>
                    <h3 className="text-[24px] font-medium tracking-tight text-white md:text-3xl">{item.title}</h3>
                    <p className="mt-2 max-w-[340px] text-[15px] leading-6 text-white/58 md:mt-4 md:max-w-[760px] md:text-lg md:leading-8">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative border-t border-white/8 bg-white/[0.015] md:bg-transparent py-20 md:py-36">
          <div className={containerClass}>
            <motion.div {...mobileRevealProps} className={`max-w-[760px] ${mobileColumnClass}`}>
              <div className={eyebrowClass}>Proof</div>
              <h2 className="mt-3 max-w-[320px] text-[34px] font-light tracking-tight text-white md:mt-4 md:max-w-none md:text-6xl">
                The system has to stay visible, controlled, and evidence-based.
              </h2>
            </motion.div>

            <div className="mt-10 md:hidden">
              <MobilePhaseShell className={mobileColumnClass}>
                <div className="space-y-10">
                  {proofBlocks.map((item, index) => (
                    <motion.div
                      {...mobileRevealProps}
                      key={item.value}
                      className={`${index > 0 ? 'border-t border-white/7 pt-10' : ''}`}
                    >
                      <div className="text-sm font-medium tracking-tight text-white/28">0{index + 1}</div>
                      <div className="mt-3 max-w-[320px]">
                        <h3 className="text-[28px] font-medium leading-[1.02] tracking-tight text-white">
                          {item.value}
                        </h3>
                        <p className="mt-3 max-w-[320px] text-[15px] leading-6 text-white/60">
                          {item.detail}
                        </p>
                      </div>

                      <div className="mt-6 overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.03]">
                        <div className="grid gap-px bg-white/8">
                          <div className="bg-[#0a0a0a] px-4 py-3 text-[11px] font-medium tracking-tight text-white/42">
                            Observed states
                          </div>
                          <div className="bg-[#0a0a0a] px-4 py-4">
                            <div className="flex flex-wrap gap-2">
                              {mobileProofArtifacts[index].map((artifact) => (
                                <span
                                  key={artifact}
                                  className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] font-medium tracking-tight text-white/62"
                                >
                                  {artifact}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </MobilePhaseShell>
            </div>

            <div className={`mt-12 hidden max-w-[960px] space-y-10 md:mt-28 md:block md:space-y-20 ${mobileColumnClass}`}>
              {proofBlocks.map((item, index) => (
                <div
                  key={item.value}
                  className={`grid gap-3 md:grid-cols-[84px_minmax(0,1fr)] md:gap-10 ${index > 0 ? 'border-t border-white/7 pt-8 md:pt-16' : ''}`}
                >
                  <div className="pt-1 text-sm font-medium tracking-tight text-white/28">
                    0{index + 1}
                  </div>

                  <div className="max-w-[360px] md:max-w-[700px]">
                    <h3 className="text-[28px] font-medium leading-[1.02] tracking-tight text-white md:text-[56px]">
                      {item.value}
                    </h3>
                    <p className="mt-2 max-w-[320px] text-[15px] leading-6 text-white/60 md:mt-5 md:max-w-[560px] md:text-[22px] md:leading-9">
                      {item.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative border-t border-white/8 py-20 md:py-36">
          <div className={containerClass}>
            <motion.div {...mobileRevealProps} className={`max-w-[780px] ${mobileColumnClass}`}>
              <div className={eyebrowClass}>Decision system</div>
              <h2 className="mt-3 max-w-[320px] text-[34px] font-light tracking-tight text-white md:mt-4 md:max-w-none md:text-6xl">
                Not every discrepancy should be filed. Only supported cases move.
              </h2>
              <p className="mt-4 max-w-[560px] text-[15px] leading-6 text-white/58 md:mt-6 md:max-w-[680px] md:text-lg md:leading-8">
                The system evaluates readiness before any case is filed.
              </p>
            </motion.div>

            <div className="mt-10 md:hidden">
              <MobilePhaseShell className={mobileColumnClass}>
                <div className="space-y-5">
                  <motion.article
                    {...mobileRevealProps}
                    className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5"
                  >
                    <div className="text-[11px] font-medium tracking-tight text-white/42">READY TO FILE</div>
                    <h3 className="mt-3 max-w-[300px] text-[28px] font-medium tracking-tight text-white">
                      Cases move only when the evidence and policy conditions are met.
                    </h3>
                    <p className="mt-3 max-w-[320px] text-[15px] leading-6 text-white/68">
                      Margin prefers action only after the case is verified, supported, and clear of duplicate risk.
                    </p>

                    <div className="mt-6 border-t border-white/10">
                      {filingRules.map((item) => (
                        <div key={item} className="grid gap-2 border-b border-white/8 py-4">
                          <div className="text-sm font-medium tracking-tight text-white/30">IF</div>
                          <div className="text-[15px] leading-6 text-white/84">{item}</div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 text-sm font-medium tracking-tight text-white">
                      → SYSTEM ACTION: FILE
                    </div>
                  </motion.article>

                  <motion.article
                    {...mobileRevealProps}
                    className="rounded-[24px] border border-white/8 bg-white/[0.02] p-5"
                  >
                    <div className="text-[11px] font-medium tracking-tight text-white/30">OTHERWISE</div>
                    <h3 className="mt-3 max-w-[300px] text-[26px] font-medium tracking-tight text-white/82">
                      The system holds cases that are incomplete, unsupported, or already active.
                    </h3>
                    <p className="mt-3 max-w-[320px] text-[15px] leading-6 text-white/50">
                      Saying “not yet” is part of the product. If truth is missing, the correct move is to wait instead of filing noise.
                    </p>

                    <div className="mt-6 border-t border-white/8">
                      {holdRules.map((item) => (
                        <div key={item} className="grid gap-2 border-b border-white/6 py-4">
                          <div className="text-sm font-medium tracking-tight text-white/22">OR</div>
                          <div className="text-[15px] leading-6 text-white/60">{item}</div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 text-sm font-medium tracking-tight text-white/56">
                      → SYSTEM ACTION: HOLD
                    </div>
                  </motion.article>
                </div>
              </MobilePhaseShell>
            </div>

            <div className={`relative mt-10 hidden max-w-[980px] md:mt-20 md:block ${mobileColumnClass}`}>
              <div className="absolute bottom-10 left-3 top-8 hidden w-px bg-white/10 md:block" />

              <div className="space-y-12 md:space-y-20">
                <article className="relative md:pl-16">
                  <div className="absolute left-0 top-2 hidden h-6 w-6 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] md:flex">
                    <ShieldCheck className="h-3.5 w-3.5 text-white/80" />
                  </div>

                  <div className="max-w-[760px]">
                    <div className="text-[11px] font-medium tracking-tight text-white/42">READY TO FILE</div>
                    <h3 className="mt-3 text-[28px] font-medium tracking-tight text-white md:mt-4 md:text-5xl">
                      Cases move only when the evidence and policy conditions are met.
                    </h3>
                    <p className="mt-3 max-w-[620px] text-[15px] leading-6 text-white/68 md:mt-5 md:max-w-[700px] md:text-lg md:leading-8">
                      Margin prefers action only after the case is verified, supported, and clear of duplicate risk.
                    </p>
                  </div>

                  <div className="mt-6 max-w-[360px] border-t border-white/10 md:mt-10 md:max-w-[820px]">
                    {filingRules.map((item) => (
                      <div key={item} className="grid gap-2 border-b border-white/8 py-4 md:grid-cols-[28px_minmax(0,1fr)] md:gap-3 md:py-6">
                        <div className="text-sm font-medium tracking-tight text-white/30">IF</div>
                        <div className="text-[15px] leading-6 text-white/84 md:text-lg md:leading-7">{item}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 text-sm font-medium tracking-tight text-white md:mt-8">
                    → SYSTEM ACTION: FILE
                  </div>
                </article>

                <article className="relative md:pl-16">
                  <div className="absolute left-0 top-2 hidden h-6 w-6 items-center justify-center rounded-full border border-white/10 bg-white/[0.02] md:flex">
                    <Clock className="h-3.5 w-3.5 text-white/48" />
                  </div>

                  <div className="max-w-[700px]">
                    <div className="text-[11px] font-medium tracking-tight text-white/30">OTHERWISE</div>
                    <h3 className="mt-3 text-[26px] font-medium tracking-tight text-white/82 md:mt-4 md:text-4xl">
                      The system holds cases that are incomplete, unsupported, or already active.
                    </h3>
                    <p className="mt-3 max-w-[600px] text-[15px] leading-6 text-white/50 md:mt-5 md:max-w-[660px] md:text-lg md:leading-8">
                      Saying “not yet” is part of the product. If truth is missing, the correct move is to wait instead of filing noise.
                    </p>
                  </div>

                  <div className="mt-6 max-w-[360px] border-t border-white/8 md:mt-8 md:max-w-[760px]">
                    {holdRules.map((item) => (
                      <div key={item} className="grid gap-2 border-b border-white/6 py-4 md:grid-cols-[28px_minmax(0,1fr)] md:gap-3">
                        <div className="text-sm font-medium tracking-tight text-white/22">OR</div>
                        <div className="text-[15px] leading-6 text-white/60 md:text-base md:leading-7">{item}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 text-sm font-medium tracking-tight text-white/56 md:mt-7">
                    → SYSTEM ACTION: HOLD
                  </div>
                </article>
              </div>
            </div>
          </div>
        </section>

        <section className="relative border-t border-white/8 py-20 md:py-36">
          <div className={containerClass}>
            <motion.div {...mobileRevealProps} className="mx-auto max-w-[430px] md:max-w-[900px] md:text-center">
              <div className={eyebrowClass}>Questions sellers ask before they buy</div>
              <h2 className="mt-3 max-w-[320px] text-[34px] font-light tracking-tight text-white md:mt-4 md:max-w-none md:text-6xl">
                Answer the questions a skeptical seller will ask.
              </h2>
              <p className="mt-4 max-w-[360px] text-[15px] leading-6 text-white/60 md:mx-auto md:mt-6 md:max-w-[760px] md:text-lg md:leading-8">
                These are the questions sellers ask before they connect account data or let a system file reimbursement cases on their behalf.
              </p>
            </motion.div>

            <div className="mx-auto mt-10 max-w-[430px] md:mt-14 md:max-w-[920px]">
              <Accordion type="single" collapsible className="space-y-3 md:space-y-5">
                {faqs.slice(0, visibleFaqCount).map((item, index) => (
                  <AccordionItem
                    key={item.question}
                    value={`faq-${index}`}
                    className="border-t border-white/8 px-1"
                  >
                    <AccordionTrigger className="py-4 text-left text-base font-medium tracking-tight text-white hover:no-underline md:py-5 md:text-lg">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 text-[15px] leading-6 text-white/58 md:pb-5 md:text-base md:leading-8">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              {!showMoreFaqs ? (
                <div className="mt-10 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setShowMoreFaqs(true)}
                    className="w-full max-w-[260px] rounded-full border border-white/10 bg-transparent px-6 text-sm text-white hover:bg-white/[0.04] md:w-auto md:max-w-none"
                  >
                    Show more questions
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="relative border-t border-white/8 bg-white/[0.02] md:bg-transparent py-20 md:py-40">
          <div className={containerClass}>
            <MobilePhaseShell className={mobileColumnClass}>
              <motion.div {...mobileRevealProps} className="max-w-[980px]">
                <div className={eyebrowClass}>Start with clarity</div>
                <h2 className="mt-3 max-w-[320px] text-[38px] font-light tracking-tight text-white md:mt-4 md:max-w-[860px] md:text-7xl">
                  Start with a read-only review of missed FBA reimbursements.
                </h2>
                <p className="mt-4 max-w-[320px] text-[15px] leading-6 text-white/60 md:mt-8 md:max-w-[700px] md:text-lg md:leading-8">
                  The first step is read-only. Margin reviews your reimbursement data before any case is considered for filing.
                </p>

                <div className="mt-10 max-w-[430px] space-y-6 md:mt-16 md:max-w-[880px] md:space-y-12">
                  <motion.div {...mobileRevealProps} className="grid gap-2 border-t border-white/8 pt-5 md:grid-cols-[72px_minmax(0,1fr)] md:gap-4 md:pt-8">
                    <div className="text-sm font-medium tracking-tight text-white/34">01</div>
                    <div>
                      <h3 className="max-w-[280px] text-[24px] font-medium tracking-tight text-white md:text-3xl">
                        Connect your Amazon account
                      </h3>
                      <p className="mt-2 max-w-[320px] text-[15px] leading-6 text-white/58 md:mt-3 md:max-w-[620px] md:text-lg md:leading-8">
                        Secure, read-only access gives Margin the data it needs to audit reimbursement opportunities.
                      </p>
                    </div>
                  </motion.div>

                  <motion.div {...mobileRevealProps} className="grid gap-2 border-t border-white/8 pt-5 md:grid-cols-[72px_minmax(0,1fr)] md:gap-4 md:pt-8">
                    <div className="text-sm font-medium tracking-tight text-white/34">02</div>
                    <div>
                      <h3 className="max-w-[280px] text-[24px] font-medium tracking-tight text-white md:text-3xl">
                        Margin detects and prepares cases
                      </h3>
                      <p className="mt-2 max-w-[320px] text-[15px] leading-6 text-white/58 md:mt-3 md:max-w-[620px] md:text-lg md:leading-8">
                        Supported discrepancies are surfaced, matched with evidence, and separated from weak or duplicate issues.
                      </p>
                    </div>
                  </motion.div>

                  <motion.div {...mobileRevealProps} className="grid gap-2 border-t border-white/8 pt-5 md:grid-cols-[72px_minmax(0,1fr)] md:gap-4 md:pt-8">
                    <div className="text-sm font-medium tracking-tight text-white/34">03</div>
                    <div>
                      <h3 className="max-w-[280px] text-[24px] font-medium tracking-tight text-white md:text-3xl">
                        You review or keep the workflow automated
                      </h3>
                      <p className="mt-2 max-w-[320px] text-[15px] leading-6 text-white/58 md:mt-3 md:max-w-[620px] md:text-lg md:leading-8">
                        Only cases supported by evidence and policy move forward, while blocked cases remain explicit.
                      </p>
                    </div>
                  </motion.div>
                </div>

                <motion.div {...mobileRevealProps} className="mt-12 flex w-full max-w-[340px] flex-col items-stretch gap-3 sm:mt-14 sm:max-w-none sm:flex-row sm:items-start">
                  <Button
                    onClick={handleConnectAmazon}
                    className="h-11 w-full min-w-0 justify-between rounded-[5px] border border-white/10 bg-transparent px-5 text-sm font-medium text-white hover:bg-white/[0.04] sm:min-w-[168px] sm:w-auto sm:justify-center"
                  >
                    Connect Amazon
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={scrollToHowItWorks}
                    className="h-11 w-full min-w-0 justify-between rounded-[5px] border border-white bg-white px-5 text-sm font-medium text-black hover:bg-white/90 hover:text-black sm:min-w-[168px] sm:w-auto sm:justify-center"
                  >
                    See how it works
                  </Button>
                </motion.div>

              </motion.div>
            </MobilePhaseShell>
          </div>
        </section>
      </main>

      <BrandFooter />
      <CookieConsent />
    </div>
  );
}
