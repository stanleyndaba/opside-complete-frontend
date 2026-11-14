import { useState } from "react";
import { BookOpen, BriefcaseBusiness, CalendarClock, ChevronRight, ClipboardCheck, CreditCard, Database, FileText, Network, Undo2, Box, type LucideIcon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

type WorkflowDestination = {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
};

const workflowDestinations: WorkflowDestination[] = [
  {
    title: "Amazon Discrepancy & Recovery Detection",
    description: "Find shipment, inventory, fee, reimbursement and settlement differences that may warrant review.",
    icon: Box,
    href: "/amazon-discrepancy-recovery-detection",
  },
  {
    title: "Transaction Reconciliation",
    description: "Compare expected, approved and paid values to surface underpayments and valuation differences for review.",
    icon: CreditCard,
    href: "/transaction-reconciliation",
  },
  {
    title: "Recovery Eligibility Timing",
    description: "Prioritize potential recoveries by value, evidence readiness and remaining recovery eligibility window.",
    icon: CalendarClock,
    href: "/recovery-eligibility-timing",
  },
  {
    title: "Recovery Evidence",
    description: "Connect invoices, BOLs, PODs, shipment records, quantities and cost basis to the recovery they support.",
    icon: FileText,
    href: "/recovery-evidence",
  },
  {
    title: "Evidence-Backed Recovery Case Preparation",
    description: "Assemble the evidence, timeline, policy basis and financial value into one review-ready recovery.",
    icon: ClipboardCheck,
    href: "/evidence-backed-recovery-case-preparation",
  },
  {
    title: "Seller Approval & Filing",
    description: "Review every recovery before it enters the filing workflow. Nothing moves without approval.",
    icon: BriefcaseBusiness,
    href: "/seller-approval-filing",
  },
  {
    title: "Response & Appeal Management",
    description: "Keep Amazon requests, rejections, replies and supporting evidence on one recovery timeline.",
    icon: BookOpen,
    href: "/response-appeals-management",
  },
  {
    title: "Payout Verification",
    description: "Compare Amazon's approved value with the reimbursement that actually reached settlement.",
    icon: Database,
    href: "/payout-verification",
  },
  {
    title: "Reversal & Accounting Reconciliation",
    description: "Track later reversals, unresolved differences and accounting-ready recovery records.",
    icon: Undo2,
    href: "/reversal-accounting-reconciliation",
  },
  {
    title: "Integrations and Connectors",
    description: "Connect the records your business already relies on to establish the financial picture they cannot show separately.",
    icon: Network,
    href: "/integration-connectors",
  },
];

export function ExploreMoreWorkflows() {
  const [expanded, setExpanded] = useState(false);
  const { pathname } = useLocation();
  const otherWorkflows = workflowDestinations.filter((workflow) => workflow.href !== pathname);
  const visibleWorkflows = expanded ? otherWorkflows : otherWorkflows.slice(0, 4);

  return (
    <section aria-labelledby="explore-more-workflows-title" className="relative overflow-hidden bg-[#F5F6F4] py-12 sm:py-16 md:py-20">
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 md:px-8 lg:px-10 2xl:px-12">
        <div className="max-w-[760px]">
          <p className="font-mono text-[9px] font-normal uppercase tracking-tight text-[#F05A3C] sm:text-[10px]">Workflows</p>
          <h2 id="explore-more-workflows-title" className="mt-3 font-lora text-[34px] font-normal leading-[1.03] tracking-[-0.045em] text-[#182026] sm:text-[46px] md:text-[58px]">Explore more Workflows</h2>
          <p className="mt-5 max-w-[680px] text-[15px] leading-7 text-[#52616A] sm:text-[17px] sm:leading-8">Explore the connected workflow layers that take a recovery from the first discrepancy through evidence, controlled action, response and financial closure.</p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {visibleWorkflows.map(({ title, description, icon: Icon, href }) => (
            <article key={href} className="group flex min-h-[238px] flex-col rounded-[8px] bg-white p-5 shadow-[0_8px_24px_rgba(24,32,38,0.04)] transition-transform duration-200 hover:-translate-y-0.5 sm:p-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-[6px] bg-[#F1F5F6] text-[#52616A] transition-colors group-hover:bg-[#FDE9E4] group-hover:text-[#F05A3C]"><Icon className="h-[18px] w-[18px]" strokeWidth={1.6} /></div>
              <h3 className="mt-6 text-[15px] font-semibold leading-5 tracking-tight text-[#182026]">{title}</h3>
              <p className="mt-3 flex-1 text-[13px] leading-6 text-[#667177]">{description}</p>
              <Link to={href} className="mt-5 inline-flex w-fit items-center gap-1 text-[12px] font-semibold text-[#F05A3C] transition-colors hover:text-[#D9472D]">Learn more <ChevronRight className="h-3.5 w-3.5" /></Link>
            </article>
          ))}
        </div>
        {!expanded && otherWorkflows.length > 4 ? <button type="button" onClick={() => setExpanded(true)} className="mx-auto mt-8 inline-flex items-center gap-1 text-[13px] font-semibold text-[#F05A3C] transition-colors hover:text-[#D9472D]">See More <ChevronRight className="h-4 w-4" /></button> : null}
      </div>
    </section>
  );
}
