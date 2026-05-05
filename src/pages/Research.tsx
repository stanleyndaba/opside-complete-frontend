import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import { BrandFooter } from '@/components/layout/BrandFooter';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { SITE_META } from '@/config/site';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useOnboardingCapacity } from '@/hooks/useOnboardingCapacity';

const sectionLinks = [
  { href: '#automation', label: 'Automation' },
  { href: '#compare', label: 'Compare' },
  { href: '#eligibility', label: 'Eligibility' },
  { href: '#documentation', label: 'Documentation' },
  { href: '#denials', label: 'Denials' },
  { href: '#filing', label: 'Filing' },
  { href: '#tracking', label: 'Tracking' }
];

const buyerNeeds = [
  {
    label: 'Find the money',
    detail: 'Sellers want the missed reimbursement opportunities surfaced without having to hunt manually through reports, reimbursements, and payout activity.'
  },
  {
    label: 'Know what is valid',
    detail: 'They want to understand whether the case is actually supportable before they spend time filing it or trusting a third-party tool.'
  },
  {
    label: 'File without weak claims',
    detail: 'They want a workflow that reduces duplicate, unsupported, or late filings instead of creating more noise in the account.'
  },
  {
    label: 'Track it until payout',
    detail: 'They want visibility after filing so approved reimbursement amounts do not get mistaken for cash that never actually landed.'
  }
];

const softwareTypes = [
  {
    label: 'Tracking tools',
    detail: 'Useful when a seller mainly wants visibility, but weaker if they still have to interpret discrepancies, gather evidence, and manage filing logic themselves.'
  },
  {
    label: 'Audit services',
    detail: 'Helpful when the goal is specialist review, but the seller still needs to understand how deeply the service handles evidence, filing control, and payout follow-through.'
  },
  {
    label: 'Full workflow platforms',
    detail: 'Strongest when they connect detection, evidence, filing readiness, and payout tracking into one operating system instead of splitting the work across tools.'
  }
];

const comparisonChecks = [
  'How deeply the software detects reimbursement opportunities across shipments, inventory, refunds, fees, and payout activity',
  'Whether evidence is actually gathered and matched, or just left as a manual seller task',
  'How the workflow handles weak, duplicate, or already-active Amazon case paths',
  'Whether approval and payout are kept separate so recovered value is not overstated',
  'How clearly the seller can see what is detected, blocked, filed, approved, and actually paid out'
];

const eligibilityChecks = [
  {
    label: 'Identity trail',
    detail: 'The shipment, order, product, quantity, and reimbursement trail need to point to the same operational loss cleanly.'
  },
  {
    label: 'Evidence trail',
    detail: 'A seller should know whether the support is already attached, still weak, or still missing before the case is treated as filing-ready.'
  },
  {
    label: 'Timing and policy window',
    detail: 'A valid case still has to sit inside the relevant policy and timing path. Software should help make that visible, not leave it ambiguous.'
  },
  {
    label: 'Case-state truth',
    detail: 'If Amazon is already handling the issue in an active case or thread, the correct move may be to hold rather than create a duplicate filing.'
  }
];

const documentationGroups = [
  {
    label: 'Lost or damaged inventory',
    detail: 'Sellers usually need the product identity trail, quantity trail, and supporting cost or inventory records to show that the loss is real and attributable.'
  },
  {
    label: 'Inbound shipment shortages',
    detail: 'Shipment identifiers, received quantity differences, delivery or shipment records, and related support matter because the quantity gap alone is not enough.'
  },
  {
    label: 'Refund without return',
    detail: 'Order, refund, and return-state evidence matter because the issue is not simply that a refund happened, but that the unit path did not reconcile.'
  },
  {
    label: 'Fee or reimbursement discrepancies',
    detail: 'Ledger movement, fee records, reimbursement entries, and supporting product or transaction context matter because value math has to be defensible.'
  }
];

const denialReasons = [
  'The identifier trail breaks under review, even if the case looked obvious at first',
  'The evidence is too weak, too incomplete, or not actually attached to the claim path',
  'Amazon is already handling the issue through a live case or thread',
  'The claim sits outside the relevant timing or policy path',
  'The value calculation is unclear, overstated, or not supported cleanly enough'
];

const workflowStages = [
  {
    label: 'Detect',
    detail: 'The software should reveal missed reimbursement issues explicitly instead of leaving the seller with raw operational activity to interpret.'
  },
  {
    label: 'Prepare',
    detail: 'The evidence and filing path should be assembled before the case is treated as ready, not after a blind submission creates more work.'
  },
  {
    label: 'File carefully',
    detail: 'A third-party tool should reduce manual effort without filing everything indiscriminately. Controlled filing logic matters more than sheer volume.'
  },
  {
    label: 'Track the outcome',
    detail: 'The workflow should stay visible after filing so the seller can see replies, approvals, holds, and payout reality in one place.'
  }
];

const trackingStates = [
  { label: 'Detected', detail: 'A reimbursement issue exists and is now explicit.' },
  { label: 'Evidence matched', detail: 'Support is attached strongly enough for the case to move toward review.' },
  { label: 'Ready to file', detail: 'The identity, evidence, and timing path still hold.' },
  { label: 'Filed or active', detail: 'The case is moving through Amazon-facing workflow or active case handling.' },
  { label: 'Approved vs paid out', detail: 'Approval is visible separately from the moment reimbursement truth shows up in payout or settlement records.' }
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

export default function Research() {
  const navigate = useNavigate();
  const { isFull } = useOnboardingCapacity();

  usePageMeta({
    title: 'FBA Reimbursement Research | Margin',
    description:
      'How Amazon sellers evaluate FBA reimbursement software, audit services, documentation, filing workflow, eligibility, deadlines, and payout tracking.',
    url: `${SITE_META.url}/research`,
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
              <div className={labelClass}>Research Hub</div>
              <h1 className="mt-5 max-w-[980px] text-[38px] font-semibold leading-[0.98] tracking-[-0.06em] text-[#182026] sm:text-[46px] md:text-[76px]">
                How sellers evaluate FBA reimbursement software, audit services, and recovery workflow quality.
              </h1>
              <p className="mt-5 max-w-[760px] text-[16px] leading-7 text-[#4D5B66] md:mt-7 md:text-[19px] md:leading-8">
                Sellers researching reimbursement tools are usually asking the same practical questions: what these services really do, how valid claims are determined, what evidence matters, why claims get denied, and how recovery should be tracked until payout.
              </p>

              <div className="mt-8 flex w-full max-w-[420px] flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={handlePrimaryCta}
                  className="inline-flex h-11 items-center justify-between rounded-full bg-[#0B74DE] px-5 text-[13px] font-semibold text-white shadow-[0_18px_40px_rgba(11,116,222,0.22)] transition-colors hover:bg-[#0869C9] sm:min-w-[176px] sm:justify-center md:h-12 md:px-6 md:text-sm"
                >
                  {isFull ? 'Join Waitlist' : 'Reserve Early Access'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>

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

        <section className="relative border-t border-[#E4EDF1] py-16 md:py-28" id="automation">
          <div className={containerClass}>
            <motion.div {...revealProps}>
              <div className={labelClass}>01. What Sellers Are Really Buying</div>
              <h2 className={headingClass}>
                Most FBA reimbursement research is really about reducing labor, uncertainty, and claim failure.
              </h2>
              <p className={bodyClass}>
                When sellers ask which software or service is best, they are usually not shopping for a dashboard. They are trying to find a system that can uncover missed reimbursement opportunities, validate them properly, and reduce the operational pain of following them through.
              </p>
            </motion.div>

            <div className="mt-10 border-t border-[#D8E3E8] md:mt-14">
              {buyerNeeds.map((item, index) => (
                <motion.div
                  key={item.label}
                  {...revealProps}
                  transition={{ ...revealProps.transition, delay: index * 0.04 }}
                  className="grid gap-3 border-b border-[#D8E3E8] py-6 md:grid-cols-[220px_minmax(0,1fr)] md:gap-8 md:py-8"
                >
                  <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#0B74DE]">{item.label}</div>
                  <p className="max-w-[720px] text-[15px] leading-7 text-[#66737F] md:text-[17px] md:leading-8">
                    {item.detail}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative border-t border-[#E4EDF1] bg-[#F3F6F8] py-16 md:py-28">
          <div className={containerClass}>
            <motion.div {...revealProps}>
              <div className={labelClass}>02. Software, Services, and Fit</div>
              <h2 className={headingClass}>
                Sellers should know the difference between a tracker, an audit service, and a full recovery workflow platform.
              </h2>
              <p className={bodyClass}>
                The best fit depends on what the seller actually needs removed from their workload. The deeper the workflow goes into detection, evidence, filing readiness, and payout truth, the less manual recovery work gets pushed back on the operator.
              </p>
            </motion.div>

            <div className="mt-10 overflow-hidden rounded-[34px] border border-[#CFE0EA] bg-white shadow-[0_34px_100px_rgba(37,49,58,0.1)] md:mt-16">
              {softwareTypes.map((item, index) => (
                <motion.div
                  key={item.label}
                  {...revealProps}
                  transition={{ ...revealProps.transition, delay: index * 0.04 }}
                  className={`grid gap-3 px-5 py-6 md:grid-cols-[220px_minmax(0,1fr)] md:gap-8 md:px-8 md:py-8 ${
                    index > 0 ? 'border-t border-[#D8E3E8]' : ''
                  }`}
                >
                  <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#0B74DE]">{item.label}</div>
                  <p className="max-w-[720px] text-[15px] leading-7 text-[#66737F] md:text-[17px] md:leading-8">
                    {item.detail}
                  </p>
                </motion.div>
              ))}
            </div>

            <motion.div {...revealProps} className="mt-8 max-w-[760px] md:mt-10">
              <p className="text-[15px] leading-7 text-[#66737F] md:text-[17px] md:leading-8">
                If a seller operates in the UK or across multiple marketplaces, regional fit still matters. Before choosing any platform, they should verify marketplace coverage, evidence handling, filing model, and how clearly recovery status is tracked across the workflow.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="relative border-t border-[#E4EDF1] py-16 md:py-28" id="compare">
          <div className={containerClass}>
            <motion.div {...revealProps}>
              <div className={labelClass}>03. What To Compare</div>
              <h2 className={headingClass}>
                The strongest reimbursement software is not the one that looks busy. It is the one that handles the workflow truthfully.
              </h2>
              <p className={bodyClass}>
                Sellers comparing leading tools should not stop at whether a platform can surface discrepancies. They should also understand how evidence, filing control, and payout tracking are handled once the case becomes operational.
              </p>
            </motion.div>

            <div className="mt-10 border-t border-[#D8E3E8] md:mt-14">
              {comparisonChecks.map((item, index) => (
                <motion.div
                  key={item}
                  {...revealProps}
                  transition={{ ...revealProps.transition, delay: index * 0.04 }}
                  className="grid gap-3 border-b border-[#D8E3E8] py-5 md:grid-cols-[54px_minmax(0,1fr)] md:gap-6 md:py-7"
                >
                  <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#9AA8B2]">0{index + 1}</div>
                  <p className="max-w-[760px] text-[15px] leading-7 text-[#66737F] md:text-[17px] md:leading-8">
                    {item}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative border-t border-[#E4EDF1] bg-[#F3F6F8] py-16 md:py-28" id="eligibility">
          <div className={containerClass}>
            <motion.div {...revealProps}>
              <div className={labelClass}>04. Eligibility and Deadlines</div>
              <h2 className={headingClass}>
                A good reimbursement platform should help the seller understand whether the case is actually valid before it moves.
              </h2>
              <p className={bodyClass}>
                Research around eligibility, lost inventory, damaged inventory, and deadlines all points to the same need: sellers want to know if the case is truly recoverable, not just numerically interesting. Software should turn that into operational clarity.
              </p>
            </motion.div>

            <div className="mt-10 border-t border-[#D8E3E8] md:mt-14">
              {eligibilityChecks.map((item, index) => (
                <motion.div
                  key={item.label}
                  {...revealProps}
                  transition={{ ...revealProps.transition, delay: index * 0.04 }}
                  className="grid gap-3 border-b border-[#D8E3E8] py-6 md:grid-cols-[220px_minmax(0,1fr)] md:gap-8 md:py-8"
                >
                  <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#0B74DE]">{item.label}</div>
                  <p className="max-w-[720px] text-[15px] leading-7 text-[#66737F] md:text-[17px] md:leading-8">
                    {item.detail}
                  </p>
                </motion.div>
              ))}
            </div>

            <motion.div {...revealProps} className="mt-8 max-w-[760px] md:mt-10">
              <p className="text-[15px] leading-7 text-[#66737F] md:text-[17px] md:leading-8">
                The exact policy window and reimbursement rules can change, so sellers should always verify the current Amazon policy directly. What software should do is make timing and case-state risk more visible before the seller commits to a path.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="relative border-t border-[#E4EDF1] py-16 md:py-28" id="documentation">
          <div className={containerClass}>
            <motion.div {...revealProps}>
              <div className={labelClass}>05. Documentation and Evidence</div>
              <h2 className={headingClass}>
                Documentation questions are really questions about whether the evidence trail will survive review.
              </h2>
              <p className={bodyClass}>
                Sellers researching documentation are usually trying to avoid wasted time. They want to know what evidence matters for each claim type and whether the platform helps gather and match it before filing becomes a risk.
              </p>
            </motion.div>

            <div className="mt-10 overflow-hidden rounded-[34px] border border-[#CFE0EA] bg-white shadow-[0_34px_100px_rgba(37,49,58,0.1)] md:mt-16">
              {documentationGroups.map((item, index) => (
                <motion.div
                  key={item.label}
                  {...revealProps}
                  transition={{ ...revealProps.transition, delay: index * 0.04 }}
                  className={`grid gap-3 px-5 py-6 md:grid-cols-[240px_minmax(0,1fr)] md:gap-8 md:px-8 md:py-8 ${
                    index > 0 ? 'border-t border-[#D8E3E8]' : ''
                  }`}
                >
                  <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#0B74DE]">{item.label}</div>
                  <p className="max-w-[720px] text-[15px] leading-7 text-[#66737F] md:text-[17px] md:leading-8">
                    {item.detail}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative border-t border-[#E4EDF1] bg-[#F3F6F8] py-16 md:py-28" id="denials">
          <div className={containerClass}>
            <motion.div {...revealProps}>
              <div className={labelClass}>06. Denials and Disputes</div>
              <h2 className={headingClass}>
                Common denial reasons usually point to weak filing control, not just bad luck.
              </h2>
              <p className={bodyClass}>
                Questions about denials and disputes are usually a signal that the seller does not want more volume. They want fewer weak claims, cleaner evidence, and more confidence that the cases moving forward can hold up under review.
              </p>
            </motion.div>

            <div className="mt-10 border-t border-[#D8E3E8] md:mt-14">
              {denialReasons.map((item, index) => (
                <motion.div
                  key={item}
                  {...revealProps}
                  transition={{ ...revealProps.transition, delay: index * 0.04 }}
                  className="grid gap-3 border-b border-[#D8E3E8] py-5 md:grid-cols-[54px_minmax(0,1fr)] md:gap-6 md:py-7"
                >
                  <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#9AA8B2]">0{index + 1}</div>
                  <p className="max-w-[760px] text-[15px] leading-7 text-[#66737F] md:text-[17px] md:leading-8">
                    {item}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative border-t border-[#E4EDF1] py-16 md:py-28" id="filing">
          <div className={containerClass}>
            <motion.div {...revealProps}>
              <div className={labelClass}>07. Filing Workflow</div>
              <h2 className={headingClass}>
                A third-party reimbursement workflow should remove operational pain, not add blind filing risk.
              </h2>
              <p className={bodyClass}>
                When sellers ask how to file with a third-party tool, they are usually asking whether the tool gives them a cleaner path from detection to action. The right workflow prepares the case, controls weak submissions, and keeps the seller oriented the whole way through.
              </p>
            </motion.div>

            <div className="mt-10 border-t border-[#D8E3E8] md:mt-14">
              {workflowStages.map((item, index) => (
                <motion.div
                  key={item.label}
                  {...revealProps}
                  transition={{ ...revealProps.transition, delay: index * 0.04 }}
                  className="grid gap-3 border-b border-[#D8E3E8] py-6 md:grid-cols-[180px_minmax(0,1fr)] md:gap-8 md:py-8"
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

        <section className="relative border-t border-[#E4EDF1] bg-[#F3F6F8] py-16 md:py-28" id="tracking">
          <div className={containerClass}>
            <motion.div {...revealProps}>
              <div className={labelClass}>08. Tracking and Timeline</div>
              <h2 className={headingClass}>
                Sellers need status clarity after filing just as much as they need detection before it.
              </h2>
              <p className={bodyClass}>
                Research around claim status, timeline, and recovery tracking usually comes from frustration after the initial filing moment. A strong platform keeps the seller oriented across states, replies, approvals, and payout truth until the reimbursement is actually resolved.
              </p>
            </motion.div>

            <div className="mt-10 overflow-hidden rounded-[34px] border border-[#CFE0EA] bg-white shadow-[0_34px_100px_rgba(37,49,58,0.1)] md:mt-16">
              {trackingStates.map((item, index) => (
                <motion.div
                  key={item.label}
                  {...revealProps}
                  transition={{ ...revealProps.transition, delay: index * 0.04 }}
                  className={`grid gap-3 px-5 py-5 md:grid-cols-[200px_minmax(0,1fr)] md:gap-8 md:px-8 md:py-7 ${
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

            <motion.div {...revealProps} className="mt-8 max-w-[760px] md:mt-10">
              <p className="text-[15px] leading-7 text-[#66737F] md:text-[17px] md:leading-8">
                Exact reimbursement timelines vary by case type, evidence quality, and case-state conditions. The real requirement is not perfect speed prediction. It is being able to see where the case sits and why it is moving, waiting, or blocked.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="relative border-t border-[#E4EDF1] py-16 md:py-32">
          <div className={containerClass}>
            <motion.div
              {...revealProps}
              className="overflow-hidden rounded-[34px] border border-[#CFE0EA] bg-[linear-gradient(135deg,#FFFFFF_0%,#F8FAFC_52%,#EAF6EF_100%)] px-6 py-8 shadow-[0_34px_100px_rgba(37,49,58,0.1)] md:px-10 md:py-12"
            >
              <div className="max-w-[860px]">
                <div className={labelClass}>Margin Fit</div>
                <h2 className="mt-4 max-w-[860px] text-[32px] font-semibold leading-[1.02] tracking-[-0.045em] text-[#182026] sm:text-[38px] md:text-[66px]">
                  Margin is built for sellers who want a full recovery workflow, not just another report.
                </h2>
                <p className="mt-5 max-w-[720px] text-[15px] leading-7 text-[#66737F] md:text-[18px] md:leading-8">
                  The core job is simple: find missed reimbursement opportunities, make the claim validity clearer, prepare support carefully, and keep the seller oriented until the recovery outcome is actually visible.
                </p>
              </div>

              <div className="mt-8 flex w-full max-w-[420px] flex-col gap-3 sm:flex-row sm:items-center md:mt-10">
                <button
                  type="button"
                  onClick={handlePrimaryCta}
                  className="inline-flex h-11 items-center justify-between rounded-full bg-[#0B74DE] px-5 text-[13px] font-semibold text-white shadow-[0_18px_40px_rgba(11,116,222,0.22)] transition-colors hover:bg-[#0869C9] sm:min-w-[176px] sm:justify-center md:h-12 md:px-6 md:text-sm"
                >
                  {isFull ? 'Join Waitlist' : 'Reserve Early Access'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </button>

                <Link
                  to="/about-margin"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-[#CFE0EA] bg-white px-5 text-[13px] font-semibold text-[#25313A] transition-colors hover:bg-[#F8FAFC] sm:min-w-[176px] md:h-12 md:px-6 md:text-sm"
                >
                  About Margin
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
