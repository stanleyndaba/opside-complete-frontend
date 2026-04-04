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
  'Find missed reimbursement opportunities across inventory, shipments, returns, fees, and reimbursements.',
  'Verify identifiers, quantities, and evidence before a case is considered ready.',
  'File only supportable cases, track Amazon replies, and stay with the case through payout.'
];

const processSteps = [
  {
    step: '01',
    title: 'Detect what is supportable',
    detail: 'Margin audits reimbursement opportunities and separates real claim candidates from noise.'
  },
  {
    step: '02',
    title: 'Verify the claim truth',
    detail: 'Shipment IDs, ASINs, FNSKUs, quantities, policy timing, and evidence are checked before anything is filed.'
  },
  {
    step: '03',
    title: 'File or hold with a clear reason',
    detail: 'Supportable cases move forward. Weak, duplicate, or thread-only cases are held instead of being pushed into Seller Support.'
  },
  {
    step: '04',
    title: 'Track Amazon until payout',
    detail: 'Case state, Amazon thread changes, approvals, requests for evidence, and payout truth stay visible in one place.'
  }
];

const mobileOrchestrationSteps = [
  {
    title: 'Detection',
    detail: 'Amazon inventory, shipment, return, fee, and reimbursement signals enter Margin and real claim candidates are separated from noise.',
    signals: ['FBA Inventory', 'Shipments', 'Returns / Refunds']
  },
  {
    title: 'Evidence',
    detail: 'Identifiers, quantities, policy timing, and supporting documents are matched before a case is considered ready.',
    signals: ['Gmail', 'Outlook', 'Dropbox']
  },
  {
    title: 'Filing',
    detail: 'Only supportable cases move forward. Weak, duplicate, or thread-only issues are held instead of pushed into Seller Support.',
    signals: ['Ready to file', 'Filed']
  },
  {
    title: 'Payout',
    detail: 'Amazon replies, approvals, evidence requests, and recovered dollars stay visible until the case is actually finished.',
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
    value: 'Fewer missed reimbursements',
    detail: 'Not more dashboards. Not more busywork. Only supportable cases that move.'
  },
  {
    value: 'Your Amazon trust protected',
    detail: 'Duplicate, weak, and thread-only filings are stopped before they happen.'
  },
  {
    value: 'Clear case truth',
    detail: 'Waiting, evidence, approvals, and payouts are always explicit.'
  }
];

const mobileProofArtifacts = [
  ['Detected', 'Evidence Ready', 'Filed'],
  ['Weak', 'Duplicate', 'Thread-only'],
  ['Waiting', 'Evidence', 'Approvals', 'Payouts']
];

const filingRules = [
  'Verified identifiers are present',
  'Evidence is matched or the case is otherwise supportable',
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
    answer: 'The real need is not automation by itself. Sellers want a system that detects missed reimbursements, verifies the claim truth, files only supportable cases, and tracks Amazon until payout. That is the lane Margin is built for.'
  },
  {
    question: 'What are common reasons for FBA reimbursement denials?',
    answer: 'Weak identifiers, missing quantity truth, unsupported evidence, expired policy windows, and duplicate or already-active issues are common reasons. Margin is designed to hold those cases instead of filing them blindly.'
  },
  {
    question: 'What documentation is required to submit a successful FBA reimbursement claim?',
    answer: 'It depends on the case type, but common proof includes shipment IDs, ASIN or FNSKU, quantity truth, supplier invoices, bills of lading, proof of delivery, and any Amazon thread-specific evidence requested during follow-up.'
  },
  {
    question: 'How can I check if I am eligible for FBA reimbursements?',
    answer: 'You need a trustworthy audit across your inventory, shipment, fee, return, and reimbursement data. Margin’s job is to surface supportable opportunities and separate them from weak or expired ones.'
  },
  {
    question: 'How do I track the status of reimbursement requests?',
    answer: 'You should be able to see whether a case is waiting on Amazon, needs evidence, approved, rejected, or paid. Margin is built to show that progression instead of leaving you guessing.'
  },
  {
    question: 'Will using an automated tool get my Amazon account suspended?',
    answer: 'A risky tool can create account problems if it files weak, duplicate, or careless cases. Margin is built around a pre-filing truth gate so unsupported cases are blocked before submission.'
  },
  {
    question: 'Do I have to manually upload invoices for every claim?',
    answer: 'Not necessarily. When your evidence sources are connected, Margin can use what is already available. If a critical document is missing, the system should tell you exactly what is needed rather than pretending the case is ready.'
  },
  {
    question: 'What is the typical timeframe for FBA reimbursement claim resolution?',
    answer: 'That depends on Amazon’s path for the specific case. Some cases move quickly, some need more evidence, and some are approved before payout is confirmed. The important part is having truthful visibility into what stage each case is in.'
  }
];

const eyebrowClass = 'text-[11px] font-medium tracking-tight text-white/42';
const containerClass = 'mx-auto w-full max-w-[1160px] px-6 md:px-8';
const mobileColumnClass = 'mx-auto max-w-[430px] md:mx-0 md:max-w-none';
const mobileRevealProps = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.22 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }
};

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

        <section className="relative pb-20 pt-24 md:pb-36 md:pt-40">
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
              <div className="inline-flex items-center gap-2 text-[13px] text-white/68 md:text-sm">
                <ShieldCheck className="h-4 w-4 text-white/60" />
                <span>Trust-first FBA reimbursement automation</span>
              </div>

              <h1 className="mt-6 max-w-[680px] text-[42px] font-light leading-[0.96] tracking-tight text-white md:mt-8 md:max-w-[760px] md:text-7xl">
                Recover the FBA reimbursements you&apos;re missing.
              </h1>

              <p className="mt-6 max-w-[620px] text-base leading-7 text-white/62 md:mt-10 md:max-w-[760px] md:text-xl md:leading-8">
                <span className="md:hidden">
                  Margin checks the case, files only what is real, and tracks Amazon until payout.
                </span>
                <span className="hidden md:inline">
                  Margin finds reimbursement opportunities, verifies the identifiers and evidence, files only supportable cases, and tracks Amazon until payout.
                </span>
              </p>

              <p className="mt-4 max-w-[560px] text-[15px] leading-6 text-white/48 md:mt-6 md:max-w-[700px] md:text-lg md:leading-7">
                No weak claims. No duplicates. No Seller Central guesswork.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:mt-10 sm:flex-row">
                <Button
                  onClick={handleConnectAmazon}
                  className="h-11 rounded-full border border-white/10 bg-[#141414] px-6 text-sm font-medium text-white hover:bg-[#1b1b1b]"
                >
                  Connect Amazon
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={scrollToHowItWorks}
                  className="h-11 rounded-full border border-white/10 bg-transparent px-6 text-sm font-medium text-white hover:bg-white/[0.04]"
                >
                  See how it works
                </Button>
              </div>

              <motion.div
                {...mobileRevealProps}
                className="mt-6 overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.03] md:hidden"
              >
                <div className="grid grid-cols-2 gap-px bg-white/8">
                  {mobileOrchestrationSteps.map((step) => (
                    <div key={step.title} className="bg-[#0a0a0a] px-4 py-3">
                      <div className="text-[11px] font-medium tracking-tight text-white/42">{step.title}</div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-4">
                  <p className="text-[15px] leading-6 text-white/58">
                    No weak claims. No duplicates. No Seller Central guesswork.
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        <section className="relative border-b border-white/8 bg-white/[0.02] md:bg-transparent py-16 md:py-28">
          <div className={containerClass}>
            <motion.div {...mobileRevealProps} className={`max-w-[720px] ${mobileColumnClass}`}>
              <div className={eyebrowClass}>The orchestration layer</div>
              <h2 className="mt-3 text-[34px] font-light tracking-tight text-white md:mt-4 md:text-6xl">
                <span className="md:hidden">Follow the recovery flow from signal to payout.</span>
                <span className="hidden md:inline">See how the recovery engine turns Amazon signals into filed cases and recovered money.</span>
              </h2>
              <p className="mt-4 max-w-[560px] text-[15px] leading-6 text-white/56 md:hidden">
                On mobile, this should read like a guided machine, not a crowded graph.
              </p>
            </motion.div>
          </div>

          <div className="mx-auto mt-8 max-w-[430px] px-6 md:hidden">
            <motion.div {...mobileRevealProps} className="mb-6">
              <div className="text-[11px] font-medium tracking-tight text-white/42">Integrations</div>
              <div className="relative mt-3 overflow-hidden rounded-[22px] border border-white/10 bg-[#0a0a0a] py-4">
                <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-[#0a0a0a] to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-[#0a0a0a] to-transparent" />
                <motion.div
                  className="flex w-max gap-3 px-4"
                  animate={{ x: ['0%', '-50%'] }}
                  transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
                >
                  {[...mobileIntegrationLogos, ...mobileIntegrationLogos].map((logo, index) => (
                    <div
                      key={`${logo.name}-${index}`}
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]"
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

            <div className="relative border-y border-white/8 py-2">
              <div className="absolute bottom-8 left-[9px] top-8 w-px bg-white/10" />
              <div className="space-y-0">
                {mobileOrchestrationSteps.map((step, index) => (
                  <motion.div
                    {...mobileRevealProps}
                    key={step.title}
                    className={`flex gap-4 py-5 ${index > 0 ? 'border-t border-white/8' : ''}`}
                  >
                    <div className="relative z-10 pt-0.5 text-[11px] font-medium tracking-tight text-white/30">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-[#0a0a0a]">
                        0{index + 1}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-[22px] font-medium tracking-tight text-white">{step.title}</h3>
                      <p className="mt-2 max-w-[320px] text-[15px] leading-6 text-white/58">
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

          <div className="relative left-1/2 mt-16 hidden w-screen max-w-[1320px] -translate-x-1/2 px-4 md:block md:px-8">
            <RecoveryEngineVisualization />
          </div>
        </section>

        <section className="relative border-t border-white/8 bg-white/[0.015] py-20 md:hidden" id="how-margin-works-mobile">
          <div className={containerClass}>
            <motion.div {...mobileRevealProps} className={mobileColumnClass}>
              <div className={eyebrowClass}>What Margin does</div>
              <h2 className="mt-3 text-[34px] font-light tracking-tight text-white">
                Find the money, verify the case, and move only when the claim is real.
              </h2>
              <p className="mt-4 max-w-[340px] text-[15px] leading-6 text-white/60">
                This should not feel like another dashboard. It should feel like a careful operator running reimbursement work in the background and telling you the truth when action is needed.
              </p>
            </motion.div>

            <div className={`mt-10 space-y-0 ${mobileColumnClass}`}>
              {processSteps.map((item) => (
                <motion.div
                  {...mobileRevealProps}
                  key={item.step}
                  className="border-t border-white/8 py-5"
                >
                  <div className="text-sm font-medium tracking-tight text-white/34">{item.step}</div>
                  <h3 className="mt-2 text-[24px] font-medium tracking-tight text-white">{item.title}</h3>
                  <p className="mt-2 max-w-[340px] text-[15px] leading-6 text-white/58">{item.detail}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative hidden md:block md:py-36">
          <div className={containerClass}>
            <div className={`max-w-[760px] ${mobileColumnClass}`}>
              <div className={eyebrowClass}>What Margin does</div>
              <h2 className="mt-3 text-[34px] font-light tracking-tight text-white md:mt-4 md:text-6xl">
                Find the money, verify the case, and move only when the claim is real.
              </h2>
              <p className="mt-4 max-w-[620px] text-[15px] leading-6 text-white/60 md:mt-6 md:max-w-[700px] md:text-lg md:leading-8">
                This should not feel like another dashboard. It should feel like a careful operator running reimbursement work in the background and telling you the truth when action is needed.
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
              <h2 className="mt-3 text-[34px] font-light tracking-tight text-white md:mt-4 md:text-6xl">
                The product has to feel careful, visible, and safe.
              </h2>
            </motion.div>

            <div className={`mt-10 max-w-[960px] space-y-8 md:hidden ${mobileColumnClass}`}>
              {proofBlocks.map((item, index) => (
                <motion.div
                  {...mobileRevealProps}
                  key={item.value}
                  className={`${index > 0 ? 'border-t border-white/7 pt-8' : ''}`}
                >
                  <div className="text-sm font-medium tracking-tight text-white/28">0{index + 1}</div>
                  <div className="mt-3 max-w-[360px]">
                    <h3 className="text-[28px] font-medium leading-[1.02] tracking-tight text-white">
                      {item.value}
                    </h3>
                    <p className="mt-2 max-w-[320px] text-[15px] leading-6 text-white/60">
                      {item.detail}
                    </p>
                  </div>

                  <div className="mt-5 overflow-hidden rounded-[22px] border border-white/10 bg-white/[0.03]">
                    <div className="grid gap-px bg-white/8">
                      <div className="bg-[#0a0a0a] px-4 py-3 text-[11px] font-medium tracking-tight text-white/42">
                        System proof
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
              <h2 className="mt-3 text-[34px] font-light tracking-tight text-white md:mt-4 md:text-6xl">
                We don’t file everything. We file what wins.
              </h2>
              <p className="mt-4 max-w-[560px] text-[15px] leading-6 text-white/58 md:mt-6 md:max-w-[680px] md:text-lg md:leading-8">
                The system evaluates readiness before taking action.
              </p>
            </motion.div>

            <div className={`mt-10 space-y-5 md:hidden ${mobileColumnClass}`}>
              <motion.article
                {...mobileRevealProps}
                className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5"
              >
                <div className="text-[11px] font-medium tracking-tight text-white/42">READY TO FILE</div>
                <h3 className="mt-3 text-[28px] font-medium tracking-tight text-white">
                  Cases move only when the claim is fully supportable.
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
                <h3 className="mt-3 text-[26px] font-medium tracking-tight text-white/82">
                  The system holds weak, incomplete, or already-active cases.
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
                      Cases move only when the claim is fully supportable.
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
                      The system holds weak, incomplete, or already-active cases.
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
              <h2 className="mt-3 text-[34px] font-light tracking-tight text-white md:mt-4 md:text-6xl">
                The page should answer the real objections, not dodge them.
              </h2>
              <p className="mt-4 max-w-[360px] text-[15px] leading-6 text-white/60 md:mx-auto md:mt-6 md:max-w-[760px] md:text-lg md:leading-8">
                These are the questions FBA sellers ask before they trust a reimbursement platform. The answers have to sound careful, specific, and believable.
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
                    className="rounded-full border border-white/10 bg-transparent px-6 text-sm text-white hover:bg-white/[0.04]"
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
            <motion.div {...mobileRevealProps} className={`max-w-[980px] ${mobileColumnClass}`}>
              <div className={eyebrowClass}>Start with clarity</div>
              <h2 className="mt-3 max-w-[720px] text-[38px] font-light tracking-tight text-white md:mt-4 md:max-w-[860px] md:text-7xl">
                Start recovering missed FBA money without adding more work.
              </h2>
              <p className="mt-4 max-w-[560px] text-[15px] leading-6 text-white/60 md:mt-8 md:max-w-[700px] md:text-lg md:leading-8">
                The first step should feel simple, safe, and controlled. You should understand what happens before anything is ever filed.
              </p>

              <div className="mt-10 max-w-[430px] space-y-6 md:mt-16 md:max-w-[880px] md:space-y-12">
                <motion.div {...mobileRevealProps} className="grid gap-2 border-t border-white/8 pt-5 md:grid-cols-[72px_minmax(0,1fr)] md:gap-4 md:pt-8">
                  <div className="text-sm font-medium tracking-tight text-white/34">01</div>
                  <div>
                    <h3 className="text-[24px] font-medium tracking-tight text-white md:text-3xl">
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
                    <h3 className="text-[24px] font-medium tracking-tight text-white md:text-3xl">
                      We detect and prepare cases
                    </h3>
                    <p className="mt-2 max-w-[320px] text-[15px] leading-6 text-white/58 md:mt-3 md:max-w-[620px] md:text-lg md:leading-8">
                      Real discrepancies are surfaced, matched with evidence, and separated from weak or duplicate noise.
                    </p>
                  </div>
                </motion.div>

                <motion.div {...mobileRevealProps} className="grid gap-2 border-t border-white/8 pt-5 md:grid-cols-[72px_minmax(0,1fr)] md:gap-4 md:pt-8">
                  <div className="text-sm font-medium tracking-tight text-white/34">03</div>
                  <div>
                    <h3 className="text-[24px] font-medium tracking-tight text-white md:text-3xl">
                      You review or let it run
                    </h3>
                    <p className="mt-2 max-w-[320px] text-[15px] leading-6 text-white/58 md:mt-3 md:max-w-[620px] md:text-lg md:leading-8">
                      Only strong, supportable cases move forward, while everything blocked stays explicit and visible.
                    </p>
                  </div>
                </motion.div>
              </div>

              <motion.div {...mobileRevealProps} className="mt-10 flex flex-col gap-3 sm:mt-14 sm:flex-row">
                <Button
                  onClick={handleConnectAmazon}
                  className="h-11 rounded-full border border-white/10 bg-[#141414] px-6 text-sm font-medium text-white hover:bg-[#1b1b1b]"
                >
                  Connect Amazon
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={scrollToHowItWorks}
                  className="h-11 rounded-full border border-white/10 bg-transparent px-6 text-sm font-medium text-white hover:bg-white/[0.04]"
                >
                  See how it works
                </Button>
              </motion.div>

              <motion.div
                {...mobileRevealProps}
                className="mt-6 rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-4 md:hidden"
              >
                <p className="max-w-[320px] text-[15px] leading-6 text-white/58">
                  Only strong, supportable cases move forward, while everything blocked stays explicit and visible.
                </p>
              </motion.div>
            </motion.div>
          </div>
        </section>
      </main>

      <BrandFooter />
      <CookieConsent />
    </div>
  );
}
