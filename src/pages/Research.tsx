import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import { BrandFooter } from '@/components/layout/BrandFooter';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { getPublicRouteMeta } from '@/config/seo';
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
    label: 'Loss detection',
    detail: 'A recovery system must identify missed reimbursement opportunities across reports, reimbursements, inventory movement, and payout activity without relying on manual report hunting.'
  },
  {
    label: 'Claim validity',
    detail: 'Detected discrepancies need to be tested against identity, evidence, timing, and case-state requirements before they are treated as recoverable claims.'
  },
  {
    label: 'Filing control',
    detail: 'A useful workflow reduces duplicate, unsupported, expired, or already-active case paths instead of increasing submission volume without quality control.'
  },
  {
    label: 'Payout reconciliation',
    detail: 'Approval and payout need to remain separate states so expected reimbursement value is not confused with cash that has actually landed.'
  }
];

const softwareTypes = [
  {
    label: 'Tracking tools',
    detail: 'Tracking tools are useful for visibility, but they leave significant work unresolved when discrepancy interpretation, evidence collection, and filing logic remain manual.'
  },
  {
    label: 'Audit services',
    detail: 'Audit services can add specialist review, but evaluation should examine how deeply the service handles evidence matching, filing control, and payout follow-through.'
  },
  {
    label: 'Full workflow platforms',
    detail: 'Full workflow platforms are strongest when detection, evidence, filing readiness, and payout tracking operate as one system instead of being split across disconnected tools.'
  }
];

const comparisonChecks = [
  'Depth of detection across shipments, inventory, refunds, fees, reimbursements, and payout activity',
  'Whether evidence is gathered, matched, and attached before a case advances toward filing',
  'How weak, duplicate, expired, or already-active Amazon case paths are handled',
  'Whether approval and payout are kept separate so recovered value is not overstated',
  'How clearly detected, blocked, filed, approved, paid, and rejected states are represented'
];

const eligibilityChecks = [
  {
    label: 'Identity trail',
    detail: 'The shipment, order, product, quantity, and reimbursement trail need to point to the same operational loss cleanly.'
  },
  {
    label: 'Evidence trail',
    detail: 'The workflow should distinguish attached, weak, and missing support before a case is treated as filing-ready.'
  },
  {
    label: 'Timing and policy window',
    detail: 'A valid case still has to sit inside the relevant policy and timing path. Software should make that condition visible instead of leaving it ambiguous.'
  },
  {
    label: 'Case-state truth',
    detail: 'If Amazon is already handling the issue in an active case or thread, the correct move may be to hold rather than create a duplicate filing.'
  }
];

const documentationGroups = [
  {
    label: 'Lost or damaged inventory',
    detail: 'The product identity trail, quantity trail, and supporting cost or inventory records need to show that the loss is real and attributable.'
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
    detail: 'The software should convert raw operational activity into explicit recovery signals rather than leaving discrepancies buried in source reports.'
  },
  {
    label: 'Prepare',
    detail: 'The evidence and filing path should be assembled before a case is treated as ready, not after a blind submission creates follow-up work.'
  },
  {
    label: 'File carefully',
    detail: 'Third-party filing should reduce manual effort without submitting every possible issue indiscriminately. Controlled filing logic matters more than volume.'
  },
  {
    label: 'Track the outcome',
    detail: 'The workflow should remain visible after filing so replies, approvals, holds, rejections, and payout reality can be evaluated in one place.'
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
const inlineLinkClass = 'font-semibold text-[#0B74DE] underline-offset-4 transition-colors hover:text-[#0869C9] hover:underline';

export default function Research() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isFull } = useOnboardingCapacity();

  usePageMeta(getPublicRouteMeta(location.pathname) || getPublicRouteMeta('/research')!);

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
                A practical guide to evaluating FBA reimbursement software, audit services, and recovery workflow quality.
              </h1>
              <p className="mt-5 max-w-[760px] text-[16px] leading-7 text-[#4D5B66] md:mt-7 md:text-[19px] md:leading-8">
                FBA reimbursement recovery depends on more than discrepancy detection. Claims require a valid loss event, supporting evidence, policy timing, filing control, and payout reconciliation. This research hub examines how reimbursement tools, audit services, and workflow platforms can be evaluated by the quality of their recovery process.
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
                FBA reimbursement tools exist to reduce the operational burden of identifying, validating, filing, and tracking recoverable Amazon losses.
              </h2>
              <p className={bodyClass}>
                The core problem is not only missed money. It is the fragmentation of recovery work across reports, shipment records, refund activity, case history, policy windows, and payout data. A strong reimbursement workflow reduces that fragmentation by turning scattered operational signals into structured recovery cases.
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

            <motion.div {...revealProps} className="mt-8 max-w-[760px] md:mt-10">
              <p className="text-[15px] leading-7 text-[#66737F] md:text-[17px] md:leading-8">
                For the main commercial category page, see <Link to="/amazon-fba-reimbursement" className={inlineLinkClass}>Amazon FBA reimbursement</Link>, where the same workflow is framed around seller intent rather than evaluation criteria.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="relative border-t border-[#E4EDF1] bg-[#F3F6F8] py-16 md:py-28">
          <div className={containerClass}>
            <motion.div {...revealProps}>
              <div className={labelClass}>02. Software, Services, and Fit</div>
              <h2 className={headingClass}>
                The category splits into tracking tools, audit services, and full recovery workflow platforms.
              </h2>
              <p className={bodyClass}>
                Fit depends on which parts of the recovery process are actually absorbed by the system. The deeper the workflow goes into detection, evidence, filing readiness, and payout truth, the less manual recovery work is pushed back onto operations.
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
                Regional fit still matters for UK and multi-marketplace operators. Evaluation should include marketplace coverage, evidence handling, filing model, and the clarity of recovery status across the workflow.
              </p>
              <p className="mt-4 text-[15px] leading-7 text-[#66737F] md:text-[17px] md:leading-8">
                Comparison traffic usually enters through pages like <Link to="/getida-alternative" className={inlineLinkClass}>GETIDA alternative</Link> and <Link to="/sellerboard-alternative" className={inlineLinkClass}>Sellerboard alternative</Link>, where those workflow questions are kept grounded in public information.
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
                Comparison should not stop at whether a platform can surface discrepancies. The stronger evaluation question is how evidence, filing control, and payout tracking are handled once a case becomes operational.
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
                A good reimbursement platform should make claim validity visible before a case moves.
              </h2>
              <p className={bodyClass}>
                Eligibility research around lost inventory, damaged inventory, and claim deadlines points to the same requirement: the workflow must distinguish a numerically interesting discrepancy from a recoverable case. Software should turn that distinction into operational clarity.
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
                Exact policy windows and reimbursement rules can change, so current Amazon policy should always be verified directly. The software role is to make timing, evidence, and case-state risk visible before a filing path is chosen.
              </p>
              <p className="mt-4 text-[15px] leading-7 text-[#66737F] md:text-[17px] md:leading-8">
                Eligibility pressure is especially visible on <Link to="/amazon-lost-inventory-reimbursement" className={inlineLinkClass}>Amazon lost inventory reimbursement</Link> work, where aged events can quickly weaken the evidence trail.
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
                Documentation quality determines whether a detected discrepancy can become a supportable claim. Evaluation should consider what evidence matters for each claim type and whether the platform gathers, matches, and attaches it before filing becomes a risk.
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

            <motion.div {...revealProps} className="mt-8 max-w-[760px] md:mt-10">
              <p className="text-[15px] leading-7 text-[#66737F] md:text-[17px] md:leading-8">
                Shipment-heavy evidence questions are clearest on <Link to="/amazon-inbound-shipment-shortage" className={inlineLinkClass}>Amazon inbound shipment shortage recovery</Link>, where document completeness often decides whether the claim path can move.
              </p>
            </motion.div>
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
                Denial patterns are useful because they reveal whether a workflow is filtering weak cases before submission. Stronger systems reduce unsupported volume, maintain cleaner evidence, and advance only the cases that can withstand review.
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
                The filing layer is where automation risk becomes visible. A strong workflow prepares the case, controls weak submissions, preserves approval visibility, and keeps the operator oriented from detection through action.
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

            <motion.div {...revealProps} className="mt-8 max-w-[760px] md:mt-10">
              <p className="text-[15px] leading-7 text-[#66737F] md:text-[17px] md:leading-8">
                When teams need one view across filing risk, denials, and queue priority, an <Link to="/amazon-reimbursement-audit" className={inlineLinkClass}>Amazon reimbursement audit</Link> often becomes the organizing layer.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="relative border-t border-[#E4EDF1] bg-[#F3F6F8] py-16 md:py-28" id="tracking">
          <div className={containerClass}>
            <motion.div {...revealProps}>
              <div className={labelClass}>08. Tracking and Timeline</div>
              <h2 className={headingClass}>
                Status clarity after filing is as important as detection before filing.
              </h2>
              <p className={bodyClass}>
                Claim status, timeline, and recovery tracking are post-filing quality signals. A strong platform keeps the case legible across states, replies, approvals, holds, rejections, and payout truth until the reimbursement is actually resolved.
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
                Exact reimbursement timelines vary by case type, evidence quality, and case-state conditions. The core requirement is not perfect speed prediction. It is visibility into where the case sits and why it is moving, waiting, or blocked.
              </p>
              <p className="mt-4 text-[15px] leading-7 text-[#66737F] md:text-[17px] md:leading-8">
                That same tracking discipline matters on <Link to="/amazon-fee-overcharge-reimbursement" className={inlineLinkClass}>Amazon fee overcharge recovery</Link>, where payout truth can drift away from the original charge story.
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
                  Margin is built for sellers who need a recovery workflow, not another reimbursement report.
                </h2>
                <p className="mt-5 max-w-[720px] text-[15px] leading-7 text-[#66737F] md:text-[18px] md:leading-8">
                  It finds missed reimbursement opportunities, clarifies claim validity, prepares support carefully, and keeps the recovery outcome visible through final payout state.
                </p>
              </div>

              <div className="mt-8 flex w-full max-w-[640px] flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center md:mt-10">
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

                <Link
                  to="/getida-alternative"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-[#CFE0EA] bg-white px-5 text-[13px] font-semibold text-[#25313A] transition-colors hover:bg-[#F8FAFC] sm:min-w-[176px] md:h-12 md:px-6 md:text-sm"
                >
                  GETIDA Alternative
                </Link>

                <Link
                  to="/sellerboard-alternative"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-[#CFE0EA] bg-white px-5 text-[13px] font-semibold text-[#25313A] transition-colors hover:bg-[#F8FAFC] sm:min-w-[176px] md:h-12 md:px-6 md:text-sm"
                >
                  Sellerboard Alternative
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
