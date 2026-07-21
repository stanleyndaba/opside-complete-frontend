import { motion } from 'framer-motion';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowRight, Check } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

import { BrandFooter } from '@/components/layout/BrandFooter';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { Button } from '@/components/ui/button';
import { getPublicRouteMeta } from '@/config/seo';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useStructuredData } from '@/hooks/useStructuredData';
import { useOnboardingCapacity } from '@/hooks/useOnboardingCapacity';
import { trackEarlyAccessCtaClicked } from '@/lib/analytics';

const issueTypes = [
  {
    label: 'Lost inventory',
    detail:
      'Units disappear between receiving, storage, transfer, fulfillment, or removal activity and never cleanly reconcile back to the seller ledger.',
  },
  {
    label: 'Inbound shortages',
    detail:
      'Shipment quantities arrive short or are received inconsistently, leaving sellers to prove what was actually sent and what Amazon actually counted.',
  },
  {
    label: 'Refund without return',
    detail:
      'Customers are refunded but the inventory path does not show a clean return outcome, creating a reimbursement question that often goes unnoticed.',
  },
  {
    label: 'Fee overcharges',
    detail:
      'Storage, fulfillment, weight, measurement, or other fee events can drift away from what the product or transaction records support.',
  },
  {
    label: 'Payout discrepancies',
    detail:
      'Approved reimbursements and account activity do not always reconcile cleanly to the cash that actually lands in settlement or payout reporting.',
  },
];

const comparisonRows = [
  { label: 'Discrepancy detection', detectionOnly: 'Highlights possible issues', managed: 'Highlights issues and keeps the case moving' },
  { label: 'Evidence organization', detectionOnly: 'Usually left to the seller', managed: 'Records are gathered, matched, and organized for review' },
  { label: 'Claim preparation', detectionOnly: 'Seller interprets next steps', managed: 'Claim path is structured before filing' },
  { label: 'Filing support', detectionOnly: 'Often outside scope', managed: 'Workflow continues into filing readiness and submission control' },
  { label: 'Rejection handling', detectionOnly: 'Follow-up becomes manual', managed: 'Rejections and low offers stay inside the recovery workflow' },
  { label: 'Payout tracking', detectionOnly: 'Approvals may be visible without payout truth', managed: 'Outcomes are tracked through approval, dispute, and payout reconciliation' },
];

const workflowSteps = [
  {
    step: '01',
    title: 'Detect',
    detail: 'Amazon events are converted into explicit recovery signals instead of staying buried across reports and ledgers.',
  },
  {
    step: '02',
    title: 'Classify',
    detail: 'Each event is mapped to the reimbursement path, timing logic, and case conditions that actually apply.',
  },
  {
    step: '03',
    title: 'Bind Evidence',
    detail: 'Supporting records are attached and checked before a case is treated as claim-ready.',
  },
  {
    step: '04',
    title: 'Approve',
    detail: 'Seller review stays in the loop before any filing action happens.',
  },
  {
    step: '05',
    title: 'Track Outcome',
    detail: 'Cases remain visible through submission, rejection handling, dispute handling, approval, and payout reconciliation.',
  },
];

const faqs = [
  {
    question: 'What is Amazon FBA reimbursement?',
    answer:
      'Amazon FBA reimbursement is the process of recovering money Amazon may owe when inventory, fees, refunds, or settlement activity do not reconcile correctly. It usually requires detection, evidence, timing awareness, and claim follow-through rather than a simple report export.',
  },
  {
    question: 'How long do Amazon reimbursement claims take?',
    answer:
      'Claim timing varies by claim type, evidence quality, and the current Amazon case path. Some cases move quickly, while others require follow-up, dispute handling, or payout reconciliation before they are actually resolved.',
  },
  {
    question: 'What types of reimbursement issues can Margin help identify?',
    answer:
      'Margin helps identify lost inventory, inbound shortages, refund-without-return cases, fee overcharges, reimbursement reversals, and payout discrepancies. The goal is to keep recovery work connected from detection to outcome.',
  },
  {
    question: 'Does Margin guarantee reimbursement?',
    answer:
      'No. Margin does not guarantee reimbursement outcomes. Amazon makes the final reimbursement decision. Margin helps identify reimbursement opportunities, organize support, manage filing workflow, and track the case through resolution.',
  },
  {
    question: 'Does Margin access my Amazon account without approval?',
    answer:
      'Margin starts read-only. Sellers stay in control, review evidence before action, and approve before filing. The workflow is designed to reduce manual work without removing seller oversight.',
  },
];

const revealProps = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.18 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
};

const containerClass = 'mx-auto w-full max-w-[1200px] px-5 sm:px-6 md:px-8';
const labelClass = 'text-[11px] font-semibold uppercase tracking-tight text-[#0B74DE]';
const headingClass = 'mt-4 max-w-[920px] text-[31px] font-semibold leading-[1.02] tracking-[-0.045em] text-[#182026] sm:text-[36px] md:text-[60px]';
const bodyClass = 'mt-4 max-w-[760px] text-[15px] leading-7 text-[#66737F] md:mt-6 md:text-[18px] md:leading-8';
const inlineLinkClass = 'font-semibold text-[#0B74DE] underline-offset-4 transition-colors hover:text-[#0869C9] hover:underline';

const pageMeta = getPublicRouteMeta('/amazon-fba-reimbursement')!;

const structuredData = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'FAQPage',
      '@id': `${pageMeta.canonical}#faq`,
      mainEntity: faqs.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.answer,
        },
      })),
    },
    {
      '@type': 'SoftwareApplication',
      '@id': `${pageMeta.canonical}#software`,
      name: 'Margin',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      url: pageMeta.canonical,
      description:
        'Margin identifies Amazon FBA reimbursement opportunities, organizes evidence, manages filing workflow, handles disputes, and tracks payouts through resolution.',
      offers: {
        '@type': 'Offer',
        price: '99',
        priceCurrency: 'USD',
        description: 'Early access activation for Margin recovery workflow',
      },
    },
    {
      '@type': 'Service',
      '@id': `${pageMeta.canonical}#service`,
      name: 'Amazon FBA reimbursement service',
      serviceType: 'Amazon FBA reimbursement management',
      provider: {
        '@type': 'Organization',
        name: 'Margin',
        url: 'https://margin-finance.com/',
      },
      areaServed: 'Worldwide',
      url: pageMeta.canonical,
      description:
        'Margin helps Amazon sellers recover money by identifying reimbursement issues, binding evidence, managing filing workflow, handling disputes, and reconciling payouts.',
    },
  ],
};

export default function AmazonFbaReimbursement() {
  const navigate = useNavigate();
  const { isFull } = useOnboardingCapacity();

  usePageMeta(pageMeta);
  useStructuredData(structuredData);

  const handlePrimaryCta = () => {
    if (isFull) {
      navigate('/waitlist?reason=capacity');
      return;
    }

    trackEarlyAccessCtaClicked({
      cta_location: 'amazon_fba_reimbursement',
      cta_text: 'Secure Early Access',
      destination: '/early-access',
    });
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
              'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
          }}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[760px] bg-[radial-gradient(circle_at_18%_8%,rgba(11,116,222,0.13),transparent_32%),radial-gradient(circle_at_84%_12%,rgba(46,125,91,0.1),transparent_28%)]" />

        <section className="relative pt-28 md:pt-40">
          <div className={containerClass}>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-[1020px]"
            >
              <div className={labelClass}>Amazon FBA Reimbursement</div>
              <h1 className="mt-5 max-w-[980px] text-[38px] font-semibold leading-[0.98] tracking-[-0.06em] text-[#182026] sm:text-[46px] md:text-[76px]">
                Amazon FBA Reimbursement Without The Manual Work
              </h1>
              <p className="mt-5 max-w-[780px] text-[16px] leading-7 text-[#4D5B66] md:mt-7 md:text-[19px] md:leading-8">
                Most reimbursement tools stop at detection. Margin continues through evidence collection, filing, rejection handling, lowball dispute handling, and payout reconciliation so recovery work stays operational until the outcome is actually resolved.
              </p>

              <div className="mt-8 flex w-full max-w-[560px] flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  type="button"
                  onClick={handlePrimaryCta}
                  className="h-12 rounded-full bg-[#0B74DE] px-6 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(11,116,222,0.22)] hover:bg-[#0869C9]"
                >
                  {isFull ? 'Join Waitlist' : 'Secure Early Access'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <Link
                  to="/pricing"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-[#CFE0EA] bg-white px-6 text-sm font-semibold text-[#25313A] transition-colors hover:bg-[#F8FAFC]"
                >
                  View Pricing
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="relative mt-16 border-t border-[#E4EDF1] py-16 md:mt-20 md:py-28">
          <div className={containerClass}>
            <motion.div {...revealProps}>
              <div className={labelClass}>What It Means</div>
              <h2 className={headingClass}>Amazon FBA reimbursement covers the operational moments where Amazon activity and seller reality stop matching.</h2>
              <p className={bodyClass}>
                Sellers often discover reimbursement issues after meaningful time has already passed. That delay matters because evidence gets harder to assemble, case context gets harder to reconstruct, and some claim windows close before anyone has organized the right filing path.
              </p>
              <p className="mt-4 max-w-[760px] text-[15px] leading-7 text-[#66737F] md:text-[17px] md:leading-8">
                Those recovery paths often branch into <Link to="/amazon-lost-inventory-reimbursement" className={inlineLinkClass}>Amazon lost inventory reimbursement</Link>, <Link to="/amazon-inbound-shipment-shortage" className={inlineLinkClass}>Amazon inbound shipment shortage recovery</Link>, and <Link to="/amazon-fee-overcharge-reimbursement" className={inlineLinkClass}>Amazon fee overcharge recovery</Link> work, each with different evidence and timing requirements.
              </p>
            </motion.div>

            <div className="mt-10 border-t border-[#D8E3E8] md:mt-14">
              {issueTypes.map((item, index) => (
                <motion.div
                  key={item.label}
                  {...revealProps}
                  transition={{ ...revealProps.transition, delay: index * 0.04 }}
                  className="grid gap-3 border-b border-[#D8E3E8] py-6 md:grid-cols-[220px_minmax(0,1fr)] md:gap-8 md:py-8"
                >
                  <div className="text-[12px] font-semibold uppercase tracking-tight text-[#0B74DE]">{item.label}</div>
                  <p className="max-w-[760px] text-[15px] leading-7 text-[#66737F] md:text-[17px] md:leading-8">{item.detail}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative border-t border-[#E4EDF1] bg-[#F3F6F8] py-16 md:py-28">
          <div className={containerClass}>
            <motion.div {...revealProps}>
              <div className={labelClass}>Workflow Depth</div>
              <h2 className={headingClass}>Where most reimbursement tools stop is exactly where the harder work begins.</h2>
              <p className={bodyClass}>
                Detection matters, but detection alone does not recover money. Once a discrepancy is found, the seller still needs evidence organization, claim preparation, filing control, rejection handling, and payout follow-through.
              </p>
              <p className="mt-4 max-w-[760px] text-[15px] leading-7 text-[#66737F] md:text-[17px] md:leading-8">
                That is also why sellers often look at an <Link to="/amazon-reimbursement-audit" className={inlineLinkClass}>Amazon reimbursement audit</Link> before deciding how findings should move through the rest of the workflow.
              </p>
            </motion.div>

            <motion.div
              {...revealProps}
              className="mt-10 overflow-hidden rounded-[34px] border border-[#CFE0EA] bg-white shadow-[0_34px_100px_rgba(37,49,58,0.1)] md:mt-16"
            >
              <div className="grid grid-cols-[minmax(0,1.2fr)_minmax(180px,1fr)_minmax(180px,1fr)] border-b border-[#D8E3E8] bg-[#F8FAFC] px-5 py-4 text-[11px] font-semibold uppercase tracking-tight text-[#66737F] md:px-8">
                <div>Capability</div>
                <div>Detection Only</div>
                <div>Managed Recovery Workflow</div>
              </div>

              {comparisonRows.map((row, index) => (
                <div
                  key={row.label}
                  className={`grid grid-cols-[minmax(0,1.2fr)_minmax(180px,1fr)_minmax(180px,1fr)] gap-4 px-5 py-5 md:px-8 md:py-6 ${
                    index > 0 ? 'border-t border-[#D8E3E8]' : ''
                  }`}
                >
                  <div className="text-[15px] font-semibold leading-7 text-[#182026] md:text-[17px]">{row.label}</div>
                  <div className="text-[14px] leading-7 text-[#66737F] md:text-[15px]">{row.detectionOnly}</div>
                  <div className="text-[14px] leading-7 text-[#66737F] md:text-[15px]">{row.managed}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        <section className="relative border-t border-[#E4EDF1] py-16 md:py-28">
          <div className={containerClass}>
            <motion.div {...revealProps}>
              <div className={labelClass}>How Margin Works</div>
              <h2 className={headingClass}>Margin keeps the reimbursement workflow connected from first discrepancy to final payout truth.</h2>
              <p className={bodyClass}>
                The recovery workflow is built around the same operational stages Margin already uses elsewhere: detect the event, classify the path, bind evidence, keep seller approval in the loop, and track the outcome through filing and reconciliation.
              </p>
            </motion.div>

            <div className="relative mt-10 md:mt-14">
              <div className="relative z-10 grid gap-3 border-y border-[#D8E3E8] bg-white/36 lg:grid-cols-5 lg:gap-0">
                {workflowSteps.map((item, index) => (
                  <motion.div
                    key={item.step}
                    {...revealProps}
                    whileHover={{ y: -3 }}
                    transition={{ ...revealProps.transition, delay: index * 0.08 }}
                    className={`group relative min-h-[188px] overflow-hidden bg-white/40 px-5 py-6 transition-[background-color,box-shadow] duration-500 hover:bg-white/92 hover:shadow-[0_18px_48px_rgba(11,116,222,0.09)] md:px-6 lg:min-h-[176px] ${
                      index > 0 ? 'border-t border-[#D8E3E8] lg:border-l lg:border-t-0' : ''
                    }`}
                  >
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(11,116,222,0.06),transparent_42%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    <div className="relative flex h-full flex-col">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#BFD8EA] bg-white text-[11px] font-semibold tracking-tight text-[#0B74DE] shadow-[0_10px_24px_rgba(37,49,58,0.06)]">
                        {item.step}
                      </div>
                      <h3 className="mt-7 text-[18px] font-semibold leading-tight tracking-[-0.025em] text-[#182026] md:text-[20px]">{item.title}</h3>
                      <p className="mt-3 text-[14px] leading-7 text-[#66737F]">{item.detail}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="relative border-t border-[#E4EDF1] bg-[#F3F6F8] py-16 md:py-28">
          <div className={containerClass}>
            <motion.div {...revealProps}>
              <div className={labelClass}>FAQ</div>
              <h2 className={headingClass}>Frequently asked questions about Amazon FBA reimbursement.</h2>
            </motion.div>

            <div className="mt-10 md:mt-14">
              <Accordion type="single" collapsible className="w-full border-t border-[#DADFE3]">
                {faqs.map((item, index) => (
                  <AccordionItem key={item.question} value={`faq-${index}`} className="border-b border-[#DADFE3] px-0">
                    <AccordionTrigger className="py-6 text-left text-[19px] font-semibold tracking-[-0.035em] text-[#050607] hover:no-underline md:py-7 md:text-[24px] [&>svg]:h-5 [&>svg]:w-5 [&>svg]:text-[#6C737A]">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="max-w-[860px] pb-7 pr-10 text-[15px] leading-7 text-[#66737F] md:text-[17px] md:leading-8">
                      <p>{item.answer}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        <section className="relative border-t border-[#E4EDF1] py-16 md:py-28">
          <div className={containerClass}>
            <motion.div
              {...revealProps}
              className="overflow-hidden rounded-[34px] border border-[#CFE0EA] bg-[linear-gradient(135deg,#FFFFFF_0%,#F8FAFC_52%,#EAF6EF_100%)] px-6 py-8 shadow-[0_34px_100px_rgba(37,49,58,0.1)] md:px-10 md:py-12"
            >
              <div className="max-w-[900px]">
                <div className={labelClass}>Next Step</div>
                <h2 className="mt-4 max-w-[860px] text-[32px] font-semibold leading-[1.02] tracking-[-0.045em] text-[#182026] sm:text-[38px] md:text-[66px]">
                  Margin is built for sellers who need reimbursement recovery to continue after detection.
                </h2>
                <p className="mt-5 max-w-[760px] text-[15px] leading-7 text-[#66737F] md:text-[18px] md:leading-8">
                  Explore the early access flow, review pricing, or go deeper into the research page comparing reimbursement tools and recovery workflow quality.
                </p>
                <p className="mt-4 max-w-[760px] text-[15px] leading-7 text-[#66737F] md:text-[17px] md:leading-8">
                  Sellers comparing operating models can also review the <Link to="/getida-alternative" className={inlineLinkClass}>GETIDA alternative</Link> and <Link to="/sellerboard-alternative" className={inlineLinkClass}>Sellerboard alternative</Link> pages for workflow-focused evaluation.
                </p>
              </div>

              <div className="mt-8 flex flex-col gap-3 md:mt-10">
                <Button
                  type="button"
                  onClick={handlePrimaryCta}
                  className="h-12 w-fit rounded-full bg-[#0B74DE] px-6 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(11,116,222,0.22)] hover:bg-[#0869C9]"
                >
                  {isFull ? 'Join Waitlist' : 'Secure Early Access'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <div className="flex flex-col gap-3 text-[14px] font-semibold text-[#25313A] md:flex-row md:items-center md:gap-5">
                  <Link
                    to="/early-access"
                    onClick={() => trackEarlyAccessCtaClicked({
                      cta_location: 'amazon_fba_reimbursement_inline_link',
                      cta_text: 'Start Early Access',
                      destination: '/early-access',
                    })}
                    className="inline-flex items-center gap-2 text-[#0B74DE] hover:text-[#0869C9]"
                  >
                    <Check className="h-4 w-4" />
                    Early access
                  </Link>
                  <Link to="/pricing" className="inline-flex items-center gap-2 text-[#0B74DE] hover:text-[#0869C9]">
                    <Check className="h-4 w-4" />
                    Pricing
                  </Link>
                  <Link to="/fba-reimbursement-research" className="inline-flex items-center gap-2 text-[#0B74DE] hover:text-[#0869C9]">
                    <Check className="h-4 w-4" />
                    FBA reimbursement research
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <BrandFooter />
    </div>
  );
}
