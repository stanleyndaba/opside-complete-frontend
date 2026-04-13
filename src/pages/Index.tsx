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
import { useOnboardingCapacity } from '@/hooks/useOnboardingCapacity';

const whatWeDoPoints = [
  'A customer got a refund, the unit never came back, and no reimbursement was created.',
  'You sent 24 units, Amazon received 21, and the missing 3 units never became seller credits.',
  'Amazon approved the case, but the money still did not show up in settlements or payout truth.'
];

const processSteps = [
  {
    step: '01',
    title: 'You think the account reconciled',
    detail: 'The shipment closes, the return clears, or the reimbursement looks done. In reality, quantity gaps, unpaid approvals, and refund-without-return cases can still be sitting in the account.'
  },
  {
    step: '02',
    title: 'Margin reveals what actually broke',
    detail: 'Shipment IDs, ASINs, FNSKUs, quantities, fee math, and supporting documents are matched into one record so the real discrepancy stops hiding in raw Amazon activity.'
  },
  {
    step: '03',
    title: 'The case becomes ready or gets held',
    detail: 'If the issue is duplicate, thread-only, weak, or already outside policy, it stays blocked with an explicit reason. If it survives, it is prepared for filing.'
  },
  {
    step: '04',
    title: 'Amazon moves. Margin keeps the trail visible',
    detail: 'Filing, replies, evidence requests, approvals, and payout confirmation stay explicit until the reimbursement actually lands.'
  }
];

const mobileOrchestrationSteps = [
  {
    title: 'Detection',
    detail: 'A shipment arrives short, or Amazon refunds $41.90 and the unit never comes back. Margin catches the discrepancy before it stays buried.',
    signals: ['FBA Inventory', 'Shipments', 'Returns / Refunds']
  },
  {
    title: 'Evidence',
    detail: 'Seller Central shows movement, but not the full story. Margin matches shipment IDs, ASINs, FNSKUs, invoices, and email proof into one supportable record.',
    signals: ['Gmail', 'Outlook', 'Dropbox']
  },
  {
    title: 'Filing',
    detail: 'What looks claimable can still fail. Margin separates supportable cases from duplicates, thread-only issues, and cases already outside policy.',
    signals: ['Ready to file', 'Filed']
  },
  {
    title: 'Payout',
    detail: 'Amazon can approve a case and still delay the money. Margin keeps approvals, evidence requests, and payout confirmation visible until cash lands.',
    signals: ['Approved', 'Recovered $']
  }
];

const mobileWhatMarginScenarios = [
  {
    step: '01',
    title: 'A customer got a refund. The unit never came back.',
    detail: 'Margin flags the refund-without-return and pulls it into a case path instead of letting it disappear inside return noise.'
  },
  {
    step: '02',
    title: 'You sent 24 units. Amazon only received 21.',
    detail: 'Margin spots the 3-unit gap, checks the shipment identifiers, and separates it from weak or unsupported quantity mismatches.'
  },
  {
    step: '03',
    title: 'Amazon approved the case. The payout never landed.',
    detail: 'Margin keeps the approval visible until reimbursement truth actually shows up in payout and settlement records.'
  },
  {
    step: '04',
    title: 'A fee or weight charge looks wrong, but the proof is messy.',
    detail: 'Margin matches the identifiers and supporting records before anything is treated as ready to file.'
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
    value: '$179.20 approved can still mean $0.00 paid.',
    detail: 'Margin separates Amazon approval from confirmed payout so approved money does not get mistaken for recovered money.'
  },
  {
    value: 'A 3-unit shipment gap is not automatically a fileable claim.',
    detail: 'Margin keeps quantity gaps, duplicate issues, and weak cases separated instead of flattening them into one reimbursement number.'
  },
  {
    value: 'A live Amazon thread can make a new filing the wrong move.',
    detail: 'Margin shows when Amazon is already handling the issue so you do not stack duplicate claims on top of the real case.'
  }
];

const mobileProofBlocks = [
  {
    value: '$63.75 can look recoverable until the identifiers fail.',
    detail: 'Margin shows when a number is truly supportable and when it only looks promising on the surface.'
  },
  {
    value: 'A duplicate filing can cost the real case.',
    detail: 'If Amazon already has the issue in a live case or thread, Margin holds it instead of sending noise back into the account.'
  },
  {
    value: 'An approval is not the same as money received.',
    detail: 'Margin keeps waiting states, approvals, rejections, and payout confirmation visible until the reimbursement actually lands.'
  }
];

const mobileProofArtifacts = [
  ['Shipment ID', 'ASIN / FNSKU', 'Qty match'],
  ['Duplicate', 'Thread-only', 'Held'],
  ['Waiting', 'Approved', 'Paid out']
];

const filingRules = [
  'Shipment, ASIN, FNSKU, and quantity all point to the same missing or damaged inventory event',
  'Invoice, delivery proof, or related support is already matched',
  'Amazon is not already handling the same issue in a live case or thread',
  'The claim is still inside Amazon’s reimbursement window'
];

const holdRules = [
  'The shipment, product, or quantity trail still breaks under review',
  'The same issue already has a live Amazon case or thread',
  'Amazon email exists, but the correct move is to stay inside the thread',
  'The support is still too weak to survive filing'
];

const mobileFilingRules = [
  'The shipment, ASIN, and quantity all match the loss',
  'The invoice, delivery, or related support is present',
  'Amazon is not already handling the same issue in a live thread',
  'The reimbursement window is still open'
];

const mobileHoldRules = [
  'You cannot prove which shipment or quantity actually failed',
  'Amazon is already handling the issue in a live case or email thread',
  'The unit moved, but the support is still too weak to file',
  'The policy window already closed'
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

const eyebrowClass = 'text-[10px] font-medium tracking-tight text-[#9fb6d9]/72 md:text-[11px] md:text-white/42';
const containerClass = 'mx-auto w-full max-w-[1160px] px-4 sm:px-6 md:px-8';
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
  className = '',
  tone = 'neutral'
}: {
  children: React.ReactNode;
  className?: string;
  tone?: 'neutral' | 'slate' | 'blue' | 'graphite' | 'contrast';
}) {
  const toneClasses = {
    neutral:
      'border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.045)_0%,rgba(255,255,255,0.02)_18%,rgba(10,10,10,0.96)_100%)]',
    slate:
      'border-[#1d2530] bg-[linear-gradient(180deg,rgba(18,25,35,0.92)_0%,rgba(12,14,18,0.98)_58%,rgba(8,8,9,1)_100%)]',
    blue:
      'border-[#243347] bg-[linear-gradient(180deg,rgba(14,21,31,0.96)_0%,rgba(10,12,16,0.98)_48%,rgba(7,7,8,1)_100%)]',
    graphite:
      'border-[#1a1a1d] bg-[linear-gradient(180deg,rgba(18,18,19,0.96)_0%,rgba(11,11,12,0.98)_46%,rgba(7,7,7,1)_100%)]',
    contrast:
      'border-[#212733] bg-[linear-gradient(180deg,rgba(15,18,24,0.96)_0%,rgba(11,12,14,0.98)_42%,rgba(7,7,8,1)_100%)]'
  } as const;

  const glowClasses = {
    neutral: 'bg-white/[0.08]',
    slate: 'bg-[#8fb7ff]/[0.12]',
    blue: 'bg-[#73a6ff]/[0.14]',
    graphite: 'bg-white/[0.05]',
    contrast: 'bg-[#6f9be5]/[0.10]'
  } as const;

  return (
    <div
      className={`relative overflow-hidden rounded-[26px] px-4 py-7 shadow-[0_18px_44px_rgba(0,0,0,0.28)] sm:px-5 md:rounded-none md:border-0 md:bg-transparent md:px-0 md:py-0 md:shadow-none ${toneClasses[tone]} ${className}`}
    >
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-[#8fb7ff]/45 to-transparent md:hidden" />
      <div
        className={`pointer-events-none absolute -right-12 top-8 h-28 w-28 rounded-full blur-3xl md:hidden ${glowClasses[tone]}`}
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),rgba(255,255,255,0)_36%)] md:hidden" />
      <div className="relative">{children}</div>
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

        <section className="relative pb-12 pt-24 md:pb-36 md:pt-40">
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
                  className="inline-flex rounded-[5px] border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium tracking-tight text-white/72 md:px-3.5 md:py-1.5 md:text-[11px]"
                >
                  Web-based only. Mobile experience rollout mid-April 2026.
                </motion.div>
              </div>

              <h1 className="mt-3 max-w-[300px] text-[28px] font-light leading-[0.98] tracking-tight text-white sm:max-w-[332px] sm:text-[31px] md:mt-6 md:max-w-[760px] md:text-7xl">
                {isMobileLayout ? (
                  <>
                    A customer got a $42 refund.
                    <br />
                    The unit never came back.
                    <br />
                    No alert. No reimbursement.
                  </>
                ) : (
                  <>
                    Amazon received 24 units.
                    <br />
                    3 disappeared.
                    <br />
                    No alert. No reimbursement.
                  </>
                )}
              </h1>

              <p className="mt-4 max-w-[305px] text-[14px] leading-[1.72] text-white/62 md:mt-10 md:max-w-[760px] md:text-xl md:leading-8">
                {isMobileLayout
                  ? 'Margin finds it, proves it, and prepares the claim.'
                  : 'Margin finds the discrepancy, proves the quantity and payout truth, prepares the claim, and follows Amazon until the money lands.'}
              </p>

              <div className="mt-7 flex w-full max-w-[332px] flex-col items-stretch gap-2.5 sm:mt-10 sm:max-w-none sm:flex-row sm:items-start">
                <Button
                  onClick={isFull ? () => navigate('/waitlist?reason=capacity') : handleConnectAmazon}
                  className="h-10 w-full min-w-0 justify-between rounded-[5px] border border-white/10 bg-transparent px-4 text-[13px] font-medium text-white hover:bg-white/[0.04] sm:min-w-[168px] sm:w-auto sm:justify-center sm:px-5 sm:text-sm"
                >
                  {isFull ? 'Join Waitlist' : 'Connect Amazon'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={scrollToHowItWorks}
                  className="h-10 w-full min-w-0 justify-between rounded-[5px] border border-white bg-white px-4 text-[13px] font-medium text-black hover:bg-white/90 hover:text-black sm:min-w-[168px] sm:w-auto sm:justify-center sm:px-5 sm:text-sm"
                >
                  See how it works
                </Button>
              </div>

              {isFull ? (
                <div className="mt-4 max-w-[320px] text-[13px] leading-6 text-white/58">
                  <div>We’re onboarding a small batch of sellers right now.</div>
                  <div>Next batch opens in {capacity?.nextBatchHours ?? 24} hours.</div>
                </div>
              ) : null}

              <div className="mt-8 border-t border-white/8 pt-6 md:mt-8 md:border-0 md:pt-0">
                <MobileIntegrationsCarousel />
              </div>
            </motion.div>
          </div>
        </section>

        <section className="relative border-b border-white/8 bg-[linear-gradient(180deg,#0a0e14_0%,#070707_100%)] py-14 md:bg-transparent md:py-28">
          <div className={containerClass}>
            <MobilePhaseShell tone="blue">
              <motion.div {...mobileRevealProps} className={`max-w-[720px] ${mobileColumnClass}`}>
                <div className={eyebrowClass}>The orchestration layer</div>
                <h2 className="mt-2.5 max-w-[300px] text-[25px] font-light leading-[1.05] tracking-tight text-white sm:max-w-[320px] sm:text-[27px] md:mt-4 md:max-w-none md:text-6xl">
                  {isMobileLayout
                    ? 'You think the account is reconciled. A missing shipment, a refund-without-return, or an unpaid approval says otherwise.'
                    : 'See how short-received shipments, refund-without-return cases, unpaid approvals, and bad fee math turn into evidence-backed cases and confirmed payouts.'}
                </h2>
              </motion.div>

              <div className="mt-8 md:hidden">
                <div className="relative rounded-[22px] border border-[#233247] bg-[linear-gradient(180deg,rgba(12,16,22,0.92)_0%,rgba(9,10,12,0.98)_100%)] px-3.5 py-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                  <div className="absolute bottom-8 left-[17px] top-8 w-px bg-[#6f9be5]/20" />
                  <div className="space-y-0">
                    {mobileOrchestrationSteps.map((step, index) => (
                      <motion.div
                        {...mobileRevealProps}
                        key={step.title}
                        className={`flex gap-3 py-5 ${index > 0 ? 'border-t border-white/8' : ''}`}
                      >
                        <div className="relative z-10 pt-0.5 text-[11px] font-medium tracking-tight text-white/30">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full border border-[#4b6b97]/45 bg-[#0f141d] text-[#c8d8f4]">
                            0{index + 1}
                          </div>
                        </div>
                        <div>
                          <h3 className="text-[19px] font-medium tracking-tight text-white">{step.title}</h3>
                          <p className="mt-2 max-w-[288px] text-[14px] leading-[1.7] text-white/58">
                            {step.detail}
                          </p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {step.signals.map((signal) => (
                              <span
                                key={signal}
                                className="rounded-full border border-[#324860] bg-[#10161f] px-2.5 py-1 text-[10px] font-medium tracking-tight text-[#d8e5fb]/74"
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

        <section className="relative border-t border-white/8 bg-[linear-gradient(180deg,#090909_0%,#060708_100%)] py-16 md:hidden" id="how-margin-works-mobile">
          <div className={containerClass}>
            <MobilePhaseShell className={mobileColumnClass} tone="graphite">
              <motion.div {...mobileRevealProps}>
                <div className={eyebrowClass}>What Margin does</div>
                <h2 className="mt-2.5 max-w-[300px] text-[25px] font-light leading-[1.05] tracking-tight text-white sm:max-w-[320px] sm:text-[27px]">
                  Customer refunds, lost units, unpaid approvals, and bad fees should not stay hidden in the account.
                </h2>
                <p className="mt-3.5 max-w-[300px] text-[14px] leading-[1.72] text-white/60">
                  Margin handles those situations only after the discrepancy is made explicit and the support is strong enough to move.
                </p>
              </motion.div>

              <div className="mt-8 space-y-2.5">
                {mobileWhatMarginScenarios.map((item) => (
                  <motion.div
                    {...mobileRevealProps}
                    key={item.step}
                    className="rounded-[20px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.035)_0%,rgba(255,255,255,0.018)_100%)] px-3.5 py-4.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
                  >
                    <div className="text-sm font-medium tracking-tight text-[#9fb6d9]/52">{item.step}</div>
                    <h3 className="mt-2 max-w-[280px] text-[18px] font-medium leading-[1.14] tracking-tight text-white sm:text-[19px]">{item.title}</h3>
                    <p className="mt-2 max-w-[300px] text-[14px] leading-[1.72] text-white/58">{item.detail}</p>
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
              <h2 className="mt-3 text-[30px] font-light leading-[1.04] tracking-tight text-white sm:text-[32px] md:mt-4 md:text-6xl">
                These are the cases that keep leaking money out of FBA.
              </h2>
              <p className="mt-4 max-w-[620px] text-[15px] leading-6 text-white/60 md:mt-6 md:max-w-[700px] md:text-lg md:leading-8">
                Margin handles those situations by matching identifiers, evidence, and policy before anything is treated as ready to file.
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
              <h2 className="mt-3 text-[30px] font-light leading-[1.04] tracking-tight text-white sm:text-[32px] md:mt-4 md:text-6xl">
                You think everything reconciled. It usually didn&apos;t.
              </h2>
              <p className="mt-4 max-w-[620px] text-[15px] leading-6 text-white/60 md:mt-6 md:max-w-[720px] md:text-lg md:leading-8">
                Margin exposes what actually broke, prepares what is supportable, and keeps the payout trail visible until reimbursement truth is final.
              </p>
            </div>

            <div className={`mt-10 max-w-[980px] space-y-6 md:mt-16 md:space-y-12 ${mobileColumnClass}`}>
              {processSteps.map((item) => (
                <div key={item.step} className="grid gap-2 border-t border-white/8 pt-5 md:grid-cols-[88px_minmax(0,1fr)] md:gap-4 md:pt-8">
                  <div className="text-sm font-medium tracking-tight text-white/34">{item.step}</div>
                  <div>
                    <h3 className="text-[21px] font-medium leading-[1.08] tracking-tight text-white sm:text-[22px] md:text-3xl">{item.title}</h3>
                    <p className="mt-2 max-w-[340px] text-[15px] leading-6 text-white/58 md:mt-4 md:max-w-[760px] md:text-lg md:leading-8">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative border-t border-white/8 bg-[linear-gradient(180deg,#081019_0%,#060607_100%)] py-16 md:bg-transparent md:py-36">
          <div className={containerClass}>
            <motion.div {...mobileRevealProps} className={`max-w-[760px] ${mobileColumnClass}`}>
              <div className={eyebrowClass}>Proof</div>
              <h2 className="mt-2.5 max-w-[300px] text-[25px] font-light leading-[1.05] tracking-tight text-white sm:max-w-[320px] sm:text-[27px] md:mt-4 md:max-w-none md:text-6xl">
                {isMobileLayout
                  ? 'You should be able to tell which $63.75 case is real, which claim is duplicate, and which approval still has no payout.'
                  : 'You should be able to tell which $179.20 case is real, which claim is duplicate, and which approval still has no payout.'}
              </h2>
            </motion.div>

            <div className="mt-10 md:hidden">
              <MobilePhaseShell className={mobileColumnClass} tone="slate">
                <div className="space-y-8">
                  {mobileProofBlocks.map((item, index) => (
                    <motion.div
                      {...mobileRevealProps}
                      key={item.value}
                      className={`${index > 0 ? 'border-t border-white/7 pt-10' : ''}`}
                    >
                      <div className="text-sm font-medium tracking-tight text-white/28">0{index + 1}</div>
                      <div className="mt-3 max-w-[320px]">
                        <h3 className="text-[20px] font-medium leading-[1.08] tracking-tight text-white sm:text-[22px]">
                          {item.value}
                        </h3>
                        <p className="mt-3 max-w-[300px] text-[14px] leading-[1.72] text-white/60">
                          {item.detail}
                        </p>
                      </div>

                      <div className="mt-5 overflow-hidden rounded-[20px] border border-[#28374c] bg-[#0c1118]">
                        <div className="grid gap-px bg-[#243347]/50">
                          <div className="bg-[#0b0f15] px-4 py-3 text-[11px] font-medium tracking-tight text-[#a7bee0]/62">
                            Observed states
                          </div>
                          <div className="bg-[#0b0f15] px-4 py-4">
                            <div className="flex flex-wrap gap-2">
                              {mobileProofArtifacts[index].map((artifact) => (
                                <span
                                  key={artifact}
                                  className="rounded-full border border-[#324860] bg-[#10161f] px-3 py-1.5 text-[11px] font-medium tracking-tight text-[#d6e4fb]/72"
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

        <section className="relative border-t border-white/8 bg-[linear-gradient(180deg,#070809_0%,#060606_100%)] py-16 md:bg-transparent md:py-36">
          <div className={containerClass}>
            <motion.div {...mobileRevealProps} className={`max-w-[780px] ${mobileColumnClass}`}>
              <div className={eyebrowClass}>Decision system</div>
              <h2 className="mt-2.5 max-w-[300px] text-[25px] font-light leading-[1.05] tracking-tight text-white sm:max-w-[320px] sm:text-[27px] md:mt-4 md:max-w-none md:text-6xl">
                {isMobileLayout
                  ? 'Some cases look obvious. One missing identifier or one live Amazon thread can still get them denied.'
                  : 'Some cases look obvious until one missing identifier gets them denied.'}
              </h2>
              <p className="mt-3.5 max-w-[300px] text-[14px] leading-[1.72] text-white/58 md:mt-6 md:max-w-[680px] md:text-lg md:leading-8">
                {isMobileLayout
                  ? 'Margin files the ones that survive evidence, timing, and duplicate checks.'
                  : 'The job is not to file everything. It is to move only the cases that survive evidence, timing, and duplicate checks.'}
              </p>
            </motion.div>

            <div className="mt-10 md:hidden">
              <MobilePhaseShell className={mobileColumnClass} tone="contrast">
                <div className="space-y-4">
                  <motion.article
                    {...mobileRevealProps}
                    className="rounded-[22px] border border-[#30445c] bg-[linear-gradient(180deg,rgba(17,23,31,0.9)_0%,rgba(11,14,18,0.98)_100%)] p-4"
                  >
                    <div className="text-[11px] font-medium tracking-tight text-white/42">READY TO FILE</div>
                    <h3 className="mt-3 max-w-[280px] text-[20px] font-medium leading-[1.1] tracking-tight text-white sm:text-[21px]">
                      A 3-unit shipment gap moves only when the IDs, quantity truth, and policy window all line up.
                    </h3>
                    <p className="mt-3 max-w-[300px] text-[14px] leading-[1.72] text-white/68">
                      If the support is complete and the case is still inside policy, Margin prepares it for filing.
                    </p>

                    <div className="mt-6 border-t border-white/10">
                      {mobileFilingRules.map((item) => (
                        <div key={item} className="grid gap-2 border-b border-white/8 py-4">
                          <div className="text-sm font-medium tracking-tight text-white/30">IF</div>
                          <div className="text-[14px] leading-[1.7] text-white/84">{item}</div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 text-sm font-medium tracking-tight text-white">
                      → SYSTEM ACTION: FILE
                    </div>
                  </motion.article>

                  <motion.article
                    {...mobileRevealProps}
                    className="rounded-[22px] border border-white/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.025)_0%,rgba(255,255,255,0.012)_100%)] p-4"
                  >
                    <div className="text-[11px] font-medium tracking-tight text-white/30">OTHERWISE</div>
                    <h3 className="mt-3 max-w-[280px] text-[19px] font-medium leading-[1.1] tracking-tight text-white/82 sm:text-[20px]">
                      A duplicate thread, missing invoice, or broken quantity trail stops the case.
                    </h3>
                    <p className="mt-3 max-w-[300px] text-[14px] leading-[1.72] text-white/50">
                      That is not friction. That is how weak filings stay out of Amazon.
                    </p>

                    <div className="mt-6 border-t border-white/8">
                      {mobileHoldRules.map((item) => (
                        <div key={item} className="grid gap-2 border-b border-white/6 py-4">
                          <div className="text-sm font-medium tracking-tight text-white/22">OR</div>
                          <div className="text-[14px] leading-[1.7] text-white/60">{item}</div>
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
                      A short-received shipment moves only when the IDs, quantity trail, and policy window all line up.
                    </h3>
                    <p className="mt-3 max-w-[620px] text-[15px] leading-6 text-white/68 md:mt-5 md:max-w-[700px] md:text-lg md:leading-8">
                      If the shipment, support, and timing hold up, Margin prepares the case instead of making you guess.
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
                      A duplicate thread, broken quantity trail, or expired window stops the case.
                    </h3>
                    <p className="mt-3 max-w-[600px] text-[15px] leading-6 text-white/50 md:mt-5 md:max-w-[660px] md:text-lg md:leading-8">
                      That is not hesitation. That is how weak claims stay out of Amazon and real cases stay clean.
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

        <section className="relative border-t border-white/8 py-16 md:py-36">
          <div className={containerClass}>
            <motion.div {...mobileRevealProps} className="mx-auto max-w-[430px] md:max-w-[900px] md:text-center">
              <div className={eyebrowClass}>Common questions</div>
              <h2 className="mt-2.5 max-w-[300px] text-[25px] font-light leading-[1.05] tracking-tight text-white sm:max-w-[320px] sm:text-[27px] md:mt-4 md:max-w-none md:text-6xl">
                Questions sellers ask before connecting Amazon data.
              </h2>
              <p className="mt-3.5 max-w-[300px] text-[14px] leading-[1.72] text-white/60 md:mx-auto md:mt-6 md:max-w-[760px] md:text-lg md:leading-8">
                These answers explain how Margin detects reimbursement cases, verifies evidence, and keeps case status visible through payout.
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
                    <AccordionTrigger className="py-3.5 text-left text-[15px] font-medium tracking-tight text-white hover:no-underline md:py-5 md:text-lg">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 text-[14px] leading-[1.72] text-white/58 md:pb-5 md:text-base md:leading-8">
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

        <section className="relative border-t border-white/8 bg-[linear-gradient(180deg,#09111b_0%,#060708_100%)] py-16 md:bg-transparent md:py-40">
          <div className={containerClass}>
            <MobilePhaseShell className={mobileColumnClass} tone="blue">
              <motion.div {...mobileRevealProps} className="max-w-[980px]">
                <div className={eyebrowClass}>Start with clarity</div>
                <h2 className="mt-2.5 max-w-[300px] text-[27px] font-light leading-[1.03] tracking-tight text-white sm:max-w-[320px] sm:text-[29px] md:mt-4 md:max-w-[860px] md:text-7xl">
                  {isMobileLayout
                    ? 'You do not know how much Amazon owes you yet. The first missing case is usually already there.'
                    : 'You probably do not know how much Amazon owes you yet.'}
                </h2>
                <p className="mt-3.5 max-w-[300px] text-[14px] leading-[1.72] text-white/60 md:mt-8 md:max-w-[700px] md:text-lg md:leading-8">
                  {isMobileLayout
                    ? 'Margin starts with a read-only review, finds what broke across shipments, refunds, returns, and reimbursements, and shows what is supportable before anything is filed.'
                    : 'The first step is read-only. Margin reviews the inventory, shipment, return, fee, and reimbursement trail before anything is filed.'}
                </p>

                <div className="mt-8 max-w-[430px] space-y-4 md:mt-16 md:max-w-[880px] md:space-y-12">
                  <motion.div {...mobileRevealProps} className="grid gap-2 rounded-[20px] border border-white/8 bg-white/[0.03] px-3.5 py-4 md:grid-cols-[72px_minmax(0,1fr)] md:gap-4 md:rounded-none md:border-0 md:border-t md:border-white/8 md:bg-transparent md:px-0 md:py-0 md:pt-8">
                    <div className="text-sm font-medium tracking-tight text-white/34">01</div>
                    <div>
                      <h3 className="max-w-[260px] text-[18px] font-medium leading-[1.12] tracking-tight text-white sm:text-[19px] md:text-3xl">
                        {isMobileLayout ? 'Connect the account you already reconcile' : 'Connect the account you already reconcile'}
                      </h3>
                      <p className="mt-2 max-w-[290px] text-[14px] leading-[1.72] text-white/58 md:mt-3 md:max-w-[620px] md:text-lg md:leading-8">
                        {isMobileLayout
                          ? 'Margin reads the inventory, shipment, return, fee, and reimbursement trail without changing anything.'
                          : 'Read-only access gives Margin the shipment, return, fee, and reimbursement trail it needs to see what actually broke.'}
                      </p>
                    </div>
                  </motion.div>

                  <motion.div {...mobileRevealProps} className="grid gap-2 rounded-[20px] border border-white/8 bg-white/[0.028] px-3.5 py-4 md:grid-cols-[72px_minmax(0,1fr)] md:gap-4 md:rounded-none md:border-0 md:border-t md:border-white/8 md:bg-transparent md:px-0 md:py-0 md:pt-8">
                    <div className="text-sm font-medium tracking-tight text-white/34">02</div>
                    <div>
                      <h3 className="max-w-[260px] text-[18px] font-medium leading-[1.12] tracking-tight text-white sm:text-[19px] md:text-3xl">
                        {isMobileLayout ? 'See the cases Amazon never surfaced clearly' : 'See the cases Amazon never surfaced clearly'}
                      </h3>
                      <p className="mt-2 max-w-[290px] text-[14px] leading-[1.72] text-white/58 md:mt-3 md:max-w-[620px] md:text-lg md:leading-8">
                        {isMobileLayout
                          ? 'Missing units, refund-without-return, unpaid approvals, and damaged inventory are separated into supported, blocked, and duplicate lanes.'
                          : 'Missing units, refund-without-return, unpaid approvals, damaged inventory, and fee mismatches are separated into supportable, blocked, and duplicate lanes.'}
                      </p>
                    </div>
                  </motion.div>

                  <motion.div {...mobileRevealProps} className="grid gap-2 rounded-[20px] border border-white/8 bg-white/[0.03] px-3.5 py-4 md:grid-cols-[72px_minmax(0,1fr)] md:gap-4 md:rounded-none md:border-0 md:border-t md:border-white/8 md:bg-transparent md:px-0 md:py-0 md:pt-8">
                    <div className="text-sm font-medium tracking-tight text-white/34">03</div>
                    <div>
                      <h3 className="max-w-[260px] text-[18px] font-medium leading-[1.12] tracking-tight text-white sm:text-[19px] md:text-3xl">
                        {isMobileLayout ? 'Start with what is already ready' : 'Move what is ready. Hold what is weak.'}
                      </h3>
                      <p className="mt-2 max-w-[290px] text-[14px] leading-[1.72] text-white/58 md:mt-3 md:max-w-[620px] md:text-lg md:leading-8">
                        {isMobileLayout
                          ? 'Review the cases Margin prepared, or keep the workflow automated once the support is strong enough.'
                          : 'Review the cases Margin prepared, or keep the workflow automated once the support is strong enough.'}
                      </p>
                    </div>
                  </motion.div>
                </div>

                <motion.div {...mobileRevealProps} className="mt-10 flex w-full max-w-[332px] flex-col items-stretch gap-2.5 sm:mt-14 sm:max-w-none sm:flex-row sm:items-start">
                  <Button
                    onClick={handleConnectAmazon}
                    className="h-10 w-full min-w-0 justify-between rounded-[5px] border border-white/10 bg-transparent px-4 text-[13px] font-medium text-white hover:bg-white/[0.04] sm:min-w-[168px] sm:w-auto sm:justify-center sm:px-5 sm:text-sm"
                  >
                    Connect Amazon
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={scrollToHowItWorks}
                    className="h-10 w-full min-w-0 justify-between rounded-[5px] border border-white bg-white px-4 text-[13px] font-medium text-black hover:bg-white/90 hover:text-black sm:min-w-[168px] sm:w-auto sm:justify-center sm:px-5 sm:text-sm"
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
