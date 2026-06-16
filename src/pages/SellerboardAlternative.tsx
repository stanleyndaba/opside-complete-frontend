import { useMemo } from 'react';
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

const comparisonRows = [
  {
    topic: 'Discrepancy visibility',
    sellerboard: 'Public information not verified.',
    margin: 'Margin surfaces reimbursement discrepancies as workflow events that move into Detect and Classify stages.',
  },
  {
    topic: 'Recovery workflow management',
    sellerboard: 'Public information not verified.',
    margin: 'Margin is built around a recovery workflow that stays connected after a discrepancy is identified.',
  },
  {
    topic: 'Evidence organization',
    sellerboard: 'Public information not verified.',
    margin: 'Margin organizes supporting records around each reimbursement path so evidence stays attached to the case.',
  },
  {
    topic: 'Claim preparation',
    sellerboard: 'Public information not verified.',
    margin: 'Margin structures documentation and case context before a reimbursement issue is treated as filing-ready.',
  },
  {
    topic: 'Filing support',
    sellerboard: 'Public information not verified.',
    margin: 'Margin keeps filing inside a staged workflow with seller review before action.',
  },
  {
    topic: 'Seller approval controls',
    sellerboard: 'Public information not verified.',
    margin: 'Margin is designed around approval before filing so sellers stay in control of case movement.',
  },
  {
    topic: 'Rejection handling',
    sellerboard: 'Public information not verified.',
    margin: 'Margin keeps rejected cases visible so follow-up paths can be managed after the first response.',
  },
  {
    topic: 'Lowball dispute handling',
    sellerboard: 'Public information not verified.',
    margin: 'Margin keeps low offers in the workflow so evidence and payout variance can be reviewed.',
  },
  {
    topic: 'Payout reconciliation',
    sellerboard: 'Public information not verified.',
    margin: 'Margin tracks approvals, reversals, and settlement activity so the case outcome can be reconciled to payout truth.',
  },
  {
    topic: 'Recovery workflow visibility',
    sellerboard: 'Public information not verified.',
    margin: 'Margin tracks each opportunity through Detect, Classify, Bind Evidence, Approve, and Track Outcome.',
  },
];

const workflowSteps = [
  {
    step: '01',
    title: 'Detect',
    detail: 'Identify reimbursement-worthy activity across Amazon reports, ledgers, shipments, fees, refunds, and payout events.',
  },
  {
    step: '02',
    title: 'Classify',
    detail: 'Map each discrepancy to the reimbursement category, timing condition, and evidence path that applies.',
  },
  {
    step: '03',
    title: 'Bind Evidence',
    detail: 'Attach the supporting documentation and records needed before a case is treated as claim-ready.',
  },
  {
    step: '04',
    title: 'Approve',
    detail: 'Keep seller review in the loop before filing activity moves forward.',
  },
  {
    step: '05',
    title: 'Track Outcome',
    detail: 'Keep visibility through filing, replies, rejections, disputes, approval, reversal checks, and payout reconciliation.',
  },
];

const trustItems = [
  {
    label: 'Read-only first workflow',
    detail: 'Margin starts with read-only review so sellers can understand the recovery picture before any action path is chosen.',
  },
  {
    label: 'Seller approval before filing',
    detail: 'Cases stay visible for seller review before filing action moves forward.',
  },
  {
    label: 'No unauthorized account actions',
    detail: 'Margin is designed around controlled workflow steps, review, and approval rather than unapproved account activity.',
  },
];

const faqs = [
  {
    question: 'What should I look for in a Sellerboard alternative?',
    answer:
      'Look for clarity around the full reimbursement workflow, not only discrepancy visibility. Sellers should understand how a platform handles evidence preparation, claim readiness, filing support, rejection follow-up, dispute handling, payout reconciliation, and seller approval before action.',
  },
  {
    question: 'How does Margin differ from reimbursement reporting tools?',
    answer:
      'Margin is designed as a recovery workflow, not only a view of possible discrepancies. The workflow moves through Detect, Classify, Bind Evidence, Approve, and Track Outcome so reimbursement work stays connected from finding to resolution.',
  },
  {
    question: 'Does Margin guarantee reimbursements?',
    answer:
      'No. Amazon controls reimbursement decisions. Margin helps sellers identify opportunities, organize evidence, prepare claim workflows, manage follow-up, and track outcomes, but it does not guarantee that Amazon will approve a reimbursement.',
  },
  {
    question: 'Can I review cases before filing?',
    answer:
      'Yes. Margin is designed with seller approval before filing. The goal is to reduce manual work while keeping the seller in control of which cases move forward.',
  },
  {
    question: 'What happens after a reimbursement claim is submitted?',
    answer:
      'After submission, the work can continue through replies, document requests, rejections, low offers, dispute handling, approval, reversal checks, and payout reconciliation. Margin keeps those post-filing states visible in the recovery workflow.',
  },
];

const pageMeta = getPublicRouteMeta('/sellerboard-alternative')!;

const revealProps = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.18 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
};

const containerClass = 'mx-auto w-full max-w-[1200px] px-5 sm:px-6 md:px-8';
const labelClass = 'text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0B74DE]';
const headingClass = 'mt-4 max-w-[920px] text-[31px] font-semibold leading-[1.02] tracking-[-0.045em] text-[#182026] sm:text-[36px] md:text-[60px]';
const bodyClass = 'mt-4 max-w-[760px] text-[15px] leading-7 text-[#66737F] md:mt-6 md:text-[18px] md:leading-8';
const inlineLinkClass = 'font-semibold text-[#0B74DE] underline-offset-4 transition-colors hover:text-[#0869C9] hover:underline';

export default function SellerboardAlternative() {
  const navigate = useNavigate();
  const { isFull } = useOnboardingCapacity();

  const structuredData = useMemo(
    () => ({
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
            'Margin helps Amazon sellers manage reimbursement workflows from discrepancy detection through evidence preparation, approval, filing support, disputes, and payout reconciliation.',
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
          name: 'Sellerboard alternative reimbursement workflow',
          serviceType: 'Amazon reimbursement workflow software',
          provider: {
            '@type': 'Organization',
            name: 'Margin',
            url: 'https://margin-finance.com/',
          },
          areaServed: 'Worldwide',
          url: pageMeta.canonical,
          description:
            'Margin helps Amazon sellers evaluate a Sellerboard alternative focused on reimbursement workflow stages, including evidence preparation, seller approval, filing support, disputes, and payout reconciliation.',
        },
      ],
    }),
    []
  );

  usePageMeta(pageMeta);
  useStructuredData(structuredData);

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
              <div className={labelClass}>Sellerboard Alternative</div>
              <h1 className="mt-5 max-w-[980px] text-[38px] font-semibold leading-[0.98] tracking-[-0.06em] text-[#182026] sm:text-[46px] md:text-[76px]">
                Looking For A Sellerboard Alternative?
              </h1>
              <p className="mt-5 max-w-[840px] text-[16px] leading-7 text-[#4D5B66] md:mt-7 md:text-[19px] md:leading-8">
                Many Amazon sellers use software to monitor profitability and identify reimbursement opportunities. The operational work begins after a discrepancy is identified. Margin is designed to support the workflow that follows, including evidence preparation, filing support, dispute handling, and payout reconciliation.
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
                  to="/amazon-fba-reimbursement"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-[#CFE0EA] bg-white px-6 text-sm font-semibold text-[#25313A] transition-colors hover:bg-[#F8FAFC]"
                >
                  FBA Reimbursement
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="relative mt-16 border-t border-[#E4EDF1] bg-[#F3F6F8] py-16 md:mt-20 md:py-28">
          <div className={containerClass}>
            <motion.div {...revealProps}>
              <div className={labelClass}>Workflow Comparison</div>
              <h2 className={headingClass}>Compare reimbursement workflows without assuming unverified competitor details.</h2>
              <p className={bodyClass}>
                This page focuses on workflow questions sellers can use when evaluating Sellerboard and Margin. It does not assert unverified Sellerboard capabilities. When a workflow detail is not verified from public information, it is labeled that way.
              </p>
              <p className="mt-4 max-w-[760px] text-[15px] leading-7 text-[#66737F] md:text-[17px] md:leading-8">
                Sellers who want the category view before comparisons can start with <Link to="/amazon-fba-reimbursement" className={inlineLinkClass}>Amazon FBA reimbursement</Link>, then contrast that with the workflow framing on the <Link to="/getida-alternative" className={inlineLinkClass}>GETIDA alternative</Link> page.
              </p>
            </motion.div>

            <motion.div
              {...revealProps}
              className="mt-10 overflow-x-auto rounded-[30px] border border-[#CFE0EA] bg-white shadow-[0_34px_100px_rgba(37,49,58,0.1)] md:mt-16"
            >
              <div className="min-w-[780px]">
                <div className="grid grid-cols-[230px_minmax(240px,1fr)_minmax(280px,1.15fr)] border-b border-[#D8E3E8] bg-[#F8FAFC] px-5 py-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#66737F] md:px-8">
                  <div>Workflow Topic</div>
                  <div>Sellerboard</div>
                  <div>Margin</div>
                </div>

                {comparisonRows.map((row, index) => (
                  <div
                    key={row.topic}
                    className={`grid grid-cols-[230px_minmax(240px,1fr)_minmax(280px,1.15fr)] gap-5 px-5 py-5 md:px-8 md:py-6 ${
                      index > 0 ? 'border-t border-[#D8E3E8]' : ''
                    }`}
                  >
                    <div className="text-[15px] font-semibold leading-7 text-[#182026] md:text-[17px]">{row.topic}</div>
                    <div className="text-[14px] leading-7 text-[#66737F] md:text-[15px]">{row.sellerboard}</div>
                    <div className="text-[14px] leading-7 text-[#66737F] md:text-[15px]">{row.margin}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        <section className="relative border-t border-[#E4EDF1] py-16 md:py-28">
          <div className={containerClass}>
            <motion.div {...revealProps}>
              <div className={labelClass}>After Detection</div>
              <h2 className={headingClass}>Finding A Discrepancy Is Only The Beginning</h2>
              <p className={bodyClass}>
                The operational burden often comes after detection: locating documents, validating evidence, preparing claims, handling rejections, tracking outcomes, and reconciling payments. Margin approaches those stages as one connected recovery workflow.
              </p>
              <p className="mt-4 max-w-[760px] text-[15px] leading-7 text-[#66737F] md:text-[17px] md:leading-8">
                Teams that need to prioritize that work across claim types often back up into an <Link to="/amazon-reimbursement-audit" className={inlineLinkClass}>Amazon reimbursement audit</Link> so post-detection effort is organized before filing begins.
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
              <div className={labelClass}>Trust Controls</div>
              <h2 className={headingClass}>Margin keeps seller control visible inside the recovery workflow.</h2>
              <p className={bodyClass}>
                Reimbursement work touches account data, documentation, and case action. Margin is built around clear workflow stages, read-only review first, and seller approval before filing.
              </p>
            </motion.div>

            <div className="mt-10 grid gap-4 md:mt-14 md:grid-cols-3">
              {trustItems.map((item, index) => (
                <motion.div
                  key={item.label}
                  {...revealProps}
                  transition={{ ...revealProps.transition, delay: index * 0.06 }}
                  className="border-t border-[#D8E3E8] pt-5"
                >
                  <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#0B74DE]">{item.label}</div>
                  <p className="mt-4 text-[15px] leading-7 text-[#66737F] md:text-[17px] md:leading-8">{item.detail}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative border-t border-[#E4EDF1] py-16 md:py-28">
          <div className={containerClass}>
            <motion.div {...revealProps}>
              <div className={labelClass}>FAQ</div>
              <h2 className={headingClass}>Frequently asked questions about evaluating a Sellerboard alternative.</h2>
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

        <section className="relative border-t border-[#E4EDF1] bg-[#F3F6F8] py-16 md:py-28">
          <div className={containerClass}>
            <motion.div
              {...revealProps}
              className="overflow-hidden rounded-[34px] border border-[#CFE0EA] bg-[linear-gradient(135deg,#FFFFFF_0%,#F8FAFC_52%,#EAF6EF_100%)] px-6 py-8 shadow-[0_34px_100px_rgba(37,49,58,0.1)] md:px-10 md:py-12"
            >
              <div className="max-w-[900px]">
                <div className={labelClass}>Next Step</div>
                <h2 className="mt-4 max-w-[860px] text-[32px] font-semibold leading-[1.02] tracking-[-0.045em] text-[#182026] sm:text-[38px] md:text-[66px]">
                  Compare reimbursement workflow depth before choosing an operating model.
                </h2>
                <p className="mt-5 max-w-[760px] text-[15px] leading-7 text-[#66737F] md:text-[18px] md:leading-8">
                  Review the reimbursement workflow, audit scope, research framework, or early access path to see how Margin handles evidence and outcomes.
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

                <div className="flex flex-col gap-3 text-[14px] font-semibold text-[#25313A] md:flex-row md:flex-wrap md:items-center md:gap-5">
                  <Link to="/amazon-fba-reimbursement" className="inline-flex items-center gap-2 text-[#0B74DE] hover:text-[#0869C9]">
                    <Check className="h-4 w-4" />
                    Amazon FBA reimbursement
                  </Link>
                  <Link to="/amazon-reimbursement-audit" className="inline-flex items-center gap-2 text-[#0B74DE] hover:text-[#0869C9]">
                    <Check className="h-4 w-4" />
                    Amazon reimbursement audit
                  </Link>
                  <Link to="/fba-reimbursement-research" className="inline-flex items-center gap-2 text-[#0B74DE] hover:text-[#0869C9]">
                    <Check className="h-4 w-4" />
                    FBA reimbursement research
                  </Link>
                  <Link to="/early-access" className="inline-flex items-center gap-2 text-[#0B74DE] hover:text-[#0869C9]">
                    <Check className="h-4 w-4" />
                    Early access
                  </Link>
                  <Link to="/getida-alternative" className="inline-flex items-center gap-2 text-[#0B74DE] hover:text-[#0869C9]">
                    <Check className="h-4 w-4" />
                    GETIDA alternative
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
