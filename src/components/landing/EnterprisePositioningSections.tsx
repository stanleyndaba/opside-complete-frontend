import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Check, Database, FileCheck2, LockKeyhole, ShieldCheck, Users, Workflow } from "lucide-react";
import { Link } from "react-router-dom";

const shell = "mx-auto w-full max-w-[1180px] px-5 sm:px-7 lg:px-10";
const eyebrow = "text-[10px] font-semibold uppercase tracking-[0.12em] text-[#245BFF]";
const heading = "font-lora text-[32px] font-normal leading-[1.03] tracking-[-0.045em] text-[#182026] sm:text-[43px] md:text-[55px]";
const body = "text-[14px] leading-7 text-[#52616A] sm:text-[16px] sm:leading-8";
const cta = "inline-flex h-11 w-fit items-center gap-2 rounded-[3px] bg-[#F05A3C] px-5 text-[13px] font-semibold text-white shadow-[0_12px_26px_rgba(240,90,60,0.16)] transition-colors hover:bg-[#D9472D]";
const mutedCta = "inline-flex h-11 w-fit items-center gap-2 rounded-[3px] bg-[#EEF0FF] px-5 text-[13px] font-semibold text-[#4338CA] transition-colors hover:bg-[#E5E7FF]";

function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.18 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function EnterpriseQualificationBand() {
  const dimensions = ["Multi-marketplace", "Multi-entity", "High transaction volume", "Evidence-linked outcomes", "Finance-controlled action"];
  return (
    <section aria-labelledby="enterprise-qualification-title" className="border-y border-[#D8E3EA] bg-[#F4F8FA] py-6 sm:py-8">
      <div className={`${shell} grid gap-5 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-12`}>
        <Reveal>
          <p className={eyebrow}>Built for high-volume Amazon operations</p>
          <h2 id="enterprise-qualification-title" className="mt-2 max-w-[620px] text-[21px] font-semibold leading-[1.12] tracking-[-0.035em] text-[#182026] sm:text-[25px]">Financial control across the records, entities, and marketplaces your operation already depends on.</h2>
        </Reveal>
        <Reveal className="grid border-t border-[#D8E3EA] pt-4 sm:grid-cols-2 lg:border-l lg:border-t-0 lg:pl-8 lg:pt-0 xl:grid-cols-3">
          {dimensions.map((item, index) => (
            <div key={item} className={`flex items-center gap-2 py-2 text-[12px] font-medium text-[#52616A] ${index > 0 ? "border-t border-[#D8E3EA] sm:border-t-0" : ""} ${index % 2 === 1 ? "sm:border-l sm:pl-4" : ""} xl:border-l xl:pl-4`}>
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#245BFF]" />
              {item}
            </div>
          ))}
          <p className="col-span-full mt-3 border-t border-[#D8E3EA] pt-3 text-[11px] leading-5 text-[#66737F]">Read-only investigation first. Consequential action only with seller approval.</p>
        </Reveal>
      </div>
    </section>
  );
}

export function EnterpriseCategoryStatement() {
  return (
    <section aria-labelledby="enterprise-category-title" className="bg-white py-12 sm:py-16 md:py-20">
      <div className={`${shell} grid gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:items-end lg:gap-16`}>
        <Reveal>
          <p className={eyebrow}>The category Margin owns</p>
          <h2 id="enterprise-category-title" className={`${heading} mt-3`}>The financial investigation and controlled recovery layer for complex Amazon operations.</h2>
        </Reveal>
        <Reveal className="max-w-[700px] lg:pb-1">
          <p className={body}>Amazon-native reporting shows activity. Accounting systems record entries. Recovery providers manage claims. Margin connects the operational event, financial position, evidence, authorization, recovery action, settlement treatment, and remaining responsibility.</p>
          <p className="mt-5 border-l-2 border-[#245BFF] pl-4 text-[15px] font-semibold leading-7 tracking-[-0.01em] text-[#182026] sm:text-[18px] sm:leading-8">Margin turns fragmented Amazon activity into a defensible financial position and carries justified work through to a verified outcome.</p>
        </Reveal>
      </div>
    </section>
  );
}

const operatingStages = [
  { number: "01", title: "Investigate", detail: "Connect the event across Amazon, warehouse, finance, accounting, and operational records.", icon: Database },
  { number: "02", title: "Establish", detail: "Separate what the evidence supports from what is estimated, missing, duplicated, reversed, or unresolved.", icon: FileCheck2 },
  { number: "03", title: "Govern", detail: "Route only justified work forward with approval boundaries, evidence requirements, owners, and action status.", icon: ShieldCheck },
  { number: "04", title: "Reconcile", detail: "Follow the result through Amazon’s decision, reimbursement, settlement, payout, reversal, offset, and final treatment.", icon: Workflow },
];

export function EnterpriseOperatingModelSection() {
  return (
    <section aria-labelledby="enterprise-operating-model-title" className="overflow-hidden bg-[#182026] py-12 text-white sm:py-16 md:py-20">
      <div className={shell}>
        <Reveal className="max-w-[760px]">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#AEB8FF]">The operating model</p>
          <h2 id="enterprise-operating-model-title" className="mt-3 font-lora text-[32px] font-normal leading-[1.03] tracking-[-0.045em] text-white sm:text-[44px] md:text-[55px]">Investigate. Establish. Govern. Reconcile.</h2>
          <p className="mt-5 max-w-[700px] text-[14px] leading-7 text-white/68 sm:text-[16px] sm:leading-8">One operating sequence from the first financial event to the verified outcome. The page should make the control model as memorable as the product visuals.</p>
        </Reveal>
        <div className="mt-9 grid gap-px overflow-hidden border border-white/12 bg-white/12 sm:grid-cols-2 lg:grid-cols-4">
          {operatingStages.map(({ number, title, detail, icon: Icon }) => (
            <Reveal key={title} className="bg-[#202A31] p-5 sm:p-6">
              <div className="flex items-center justify-between"><span className="font-mono text-[11px] font-semibold tracking-[0.12em] text-[#AEB8FF]">{number}</span><Icon className="h-4 w-4 text-[#AEB8FF]" strokeWidth={1.6} /></div>
              <h3 className="mt-9 text-[18px] font-semibold tracking-[-0.02em] text-white">{title}</h3>
              <p className="mt-2 text-[12px] leading-5 text-white/62">{detail}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

const scaleItems = [
  ["Marketplaces and currencies", "Preserve the context needed to interpret cross-marketplace activity."],
  ["Accounts and legal entities", "Keep ownership and financial responsibility visible across the operating boundary."],
  ["Orders, shipments, returns and fees", "Connect operational events to the financial consequences they create."],
  ["Reimbursements, adjustments and cases", "Distinguish an Amazon decision from the money that was actually recorded."],
  ["Evidence populations and periods", "Make the review period, source population, limitations and remaining gaps inspectable."],
  ["Owners, approvals and residuals", "Keep the next action and unresolved responsibility from disappearing between systems."],
];

export function EnterpriseOperatingScaleSection() {
  return (
    <section aria-labelledby="enterprise-scale-title" className="bg-[#F6F8F9] py-12 sm:py-16 md:py-20">
      <div className={`${shell} grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:items-start lg:gap-16`}>
        <Reveal>
          <p className={eyebrow}>Operating scale, not dashboard scale</p>
          <h2 id="enterprise-scale-title" className={`${heading} mt-3`}>Margin scales the investigation across the operating record.</h2>
          <p className={`mt-5 ${body}`}>Enterprise complexity is not only a larger transaction count. It is more systems, entities, reporting periods, decisions, currencies, evidence populations, and financial states that must remain connected.</p>
        </Reveal>
        <Reveal className="grid border-t border-[#D8E3EA] sm:grid-cols-2">
          {scaleItems.map(([title, detail], index) => (
            <div key={title} className={`border-b border-[#D8E3EA] py-4 sm:px-5 ${index % 2 === 1 ? "sm:border-l" : ""}`}>
              <h3 className="text-[14px] font-semibold tracking-tight text-[#182026]">{title}</h3>
              <p className="mt-1.5 text-[12px] leading-5 text-[#66737F]">{detail}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}

const excludedAccess = ["Amazon username, password or MFA code", "Unrestricted administrator access", "Bank, payment or payout initiation access", "Claim submission without separate approval"];

export function AmazonAuthorizationBoundarySection() {
  return (
    <section aria-labelledby="amazon-authorization-title" className="border-y border-[#D8E3EA] bg-white py-12 sm:py-16 md:py-20">
      <div className={`${shell} grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start lg:gap-16`}>
        <Reveal>
          <p className={eyebrow}>Amazon authorization boundary</p>
          <h2 id="amazon-authorization-title" className={`${heading} mt-3`}>Amazon-authorized access, scoped to the work.</h2>
          <p className={`mt-5 ${body}`}>Margin can begin with seller-provided records. When the investigation requires more, the seller authorizes only the Amazon roles, reports, marketplaces, and review period required for the defined question.</p>
          <p className="mt-5 border-l-2 border-[#245BFF] pl-4 text-[14px] font-semibold leading-6 text-[#182026] sm:text-[16px] sm:leading-7">Read access and permission to submit consequential actions are separate permissions.</p>
          <Link to="/access-scope" className={`${mutedCta} mt-6`}>Review the Amazon access scope <ArrowRight className="h-4 w-4" /></Link>
        </Reveal>
        <Reveal className="overflow-hidden rounded-[6px] border border-[#D8E3EA] bg-[#F6F8F9]">
          <div className="flex items-center justify-between border-b border-[#D8E3EA] px-5 py-4"><div className="flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-[#245BFF]" strokeWidth={1.6} /><span className="text-[12px] font-semibold text-[#182026]">What Margin does not request</span></div><span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#66737F]">Purpose-limited</span></div>
          <div className="grid gap-x-6 sm:grid-cols-2">
            {excludedAccess.map((item) => <div key={item} className="flex items-start gap-2 border-b border-[#D8E3EA] px-5 py-4 text-[12px] leading-5 text-[#52616A]"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#2D7B59]" strokeWidth={2.2} />{item}</div>)}
          </div>
          <p className="px-5 py-4 text-[11px] leading-5 text-[#66737F]">The initial review is records-first, read-only, and defined around one question and one agreed period.</p>
        </Reveal>
      </div>
    </section>
  );
}

const inspectionSteps = [
  ["01", "Original event", "Inbound, inventory, return, fee, reimbursement, reversal, case, or payout trail."],
  ["02", "Evidence position", "Source records, supporting files, calculation basis, and sufficiency state."],
  ["03", "Decision boundary", "What is supported, what remains unresolved, and what action is justified."],
  ["04", "Verified outcome", "Amazon response, settlement treatment, payout evidence, reversal, or remaining balance."],
];

export function FinancialPositionInspectionSection() {
  return (
    <section aria-labelledby="inspection-proof-title" className="bg-[#FAFAF7] py-12 sm:py-16 md:py-20">
      <div className={shell}>
        <div className="grid gap-10 lg:grid-cols-[0.86fr_1.14fr] lg:items-start lg:gap-16">
          <Reveal>
            <p className={eyebrow}>Proof of inspection</p>
            <h2 id="inspection-proof-title" className={`${heading} mt-3`}>Every material finding should be inspectable from source to outcome.</h2>
            <p className={`mt-5 ${body}`}>A senior buyer should be able to open one finding and understand how Margin reached the conclusion, what the records prove, who owns the next action, and whether the financial result was actually closed.</p>
          </Reveal>
          <Reveal className="overflow-hidden rounded-[8px] border border-[#D8E3EA] bg-white shadow-[0_18px_44px_rgba(24,32,38,0.06)]">
            <div className="flex items-center justify-between border-b border-[#D8E3EA] bg-[#F4F8FA] px-5 py-4"><div className="flex items-center gap-2"><FileCheck2 className="h-4 w-4 text-[#245BFF]" strokeWidth={1.7} /><span className="text-[12px] font-semibold text-[#182026]">Financial position inspection</span></div><span className="rounded-full bg-[#E9F5EE] px-2 py-1 text-[10px] font-semibold text-[#2D7B59]">Inspectable</span></div>
            <div className="divide-y divide-[#E8EEF1]">
              {inspectionSteps.map(([number, title, detail]) => <div key={number} className="grid grid-cols-[34px_minmax(0,1fr)] gap-3 px-5 py-4"><span className="font-mono text-[10px] font-semibold text-[#245BFF]">{number}</span><div><h3 className="text-[13px] font-semibold text-[#182026]">{title}</h3><p className="mt-1 text-[12px] leading-5 text-[#66737F]">{detail}</p></div></div>)}
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#D8E3EA] bg-[#F4F8FA] px-5 py-4 text-[11px] font-medium text-[#52616A]"><span>Supported exposure</span><span>Unresolved balance</span><span>Approval state</span><span>Verified outcome</span></div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

const lanes = [
  ["Finance", "Owns the financial position, materiality, reconciliation boundary, and close implications."],
  ["Operations", "Provides event context, operational ownership, source records, and accountable next steps."],
  ["Margin", "Investigates, connects evidence, prepares justified work, monitors progress, and verifies outcomes."],
  ["Amazon and external systems", "Remain external systems of record whose decisions, payments, reversals, and timing are tracked—not promised."],
];

export function EnterpriseOperatingBoundarySection() {
  return (
    <section aria-labelledby="operating-boundary-title" className="border-y border-[#D8E3EA] bg-white py-12 sm:py-16 md:py-20">
      <div className={shell}>
        <Reveal className="max-w-[760px]"><p className={eyebrow}>Organizational fit</p><h2 id="operating-boundary-title" className={`${heading} mt-3`}>A control layer your operating model can place somewhere.</h2><p className={`mt-5 ${body}`}>Finance owns the position. Operations owns the context. Margin carries the justified work. Amazon remains an external dependency whose response and payment treatment are tracked through the record.</p></Reveal>
        <div className="mt-9 overflow-hidden rounded-[8px] border border-[#D8E3EA] bg-[#F6F8F9]">
          {lanes.map(([title, detail], index) => <div key={title} className="grid gap-2 border-b border-[#D8E3EA] px-5 py-4 last:border-b-0 sm:grid-cols-[220px_minmax(0,1fr)] sm:gap-8 sm:px-6"><div className="flex items-center gap-2 text-[13px] font-semibold text-[#182026]"><span className="h-1.5 w-1.5 rounded-full bg-[#245BFF]" />{title}</div><p className="text-[12px] leading-5 text-[#66737F]">{detail}</p></div>)}
        </div>
      </div>
    </section>
  );
}

const assuranceItems = [
  ["Security overview", "How Margin protects sensitive financial operations."],
  ["Data-flow and tenant isolation", "Where records move, how workspaces remain separated, and what is logged."],
  ["Access and role matrix", "The Amazon roles, reports, marketplaces, and periods required for the work."],
  ["Retention, deletion and subprocessors", "The materials procurement and security teams need before processing begins."],
  ["AI and human oversight", "How AI supports analysis while findings and consequential actions remain controlled."],
  ["Incident response and questionnaire", "A direct path for security review, documentation requests, and escalation."],
];

export function EnterpriseAssuranceSection() {
  return (
    <section aria-labelledby="enterprise-assurance-title" className="bg-[#F4F5F4] py-12 sm:py-16 md:py-20">
      <div className={`${shell} grid gap-10 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16`}>
        <Reveal>
          <p className={eyebrow}>Enterprise assurance</p>
          <h2 id="enterprise-assurance-title" className={`${heading} mt-3`}>Precise disclosure for the people who need to review Margin.</h2>
          <p className={`mt-5 ${body}`}>Enterprise trust is not a badge wall. It is a clear path through security practices, access boundaries, data handling, human oversight, and the documents required before a serious engagement begins.</p>
          <div className="mt-6 flex flex-wrap gap-3"><Link to="/security" className={cta}>Read security practices <ArrowRight className="h-4 w-4" /></Link><Link to="/access-scope" className={mutedCta}>Review access scope <ArrowRight className="h-4 w-4" /></Link></div>
        </Reveal>
        <Reveal className="grid border-t border-[#D8E3EA] sm:grid-cols-2">
          {assuranceItems.map(([title, detail], index) => <div key={title} className={`border-b border-[#D8E3EA] py-4 sm:px-5 ${index % 2 === 1 ? "sm:border-l" : ""}`}><div className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-[#245BFF]" strokeWidth={1.8} /><h3 className="text-[13px] font-semibold text-[#182026]">{title}</h3></div><p className="mt-1.5 text-[12px] leading-5 text-[#66737F]">{detail}</p></div>)}
        </Reveal>
      </div>
    </section>
  );
}

const briefs = [
  { label: "Anonymized operating brief 01", title: "Cross-marketplace reconciliation", scope: "Multiple marketplaces · Multiple legal entities · Settlement and accounting records", result: "Margin connected the event population to settlement treatment, separated supported exposure from already-accounted activity, and left the remaining balance with an explicit owner and evidence requirement." },
  { label: "Anonymized operating brief 02", title: "Recurring FBA evidence population", scope: "Inbound shipments · Receiving records · Inventory movements · Reimbursement cases", result: "Margin created a repeatable evidence standard for the recovery population, identified unsupported positions before submission, and preserved the verified outcome for later close review." },
  { label: "Anonymized operating brief 03", title: "Provider and outcome verification", scope: "Existing recovery provider · Amazon decisions · Payout and reversal records", result: "Margin compared submitted, approved, paid, reversed, and unresolved outcomes so Finance could see what the existing operation had actually established." },
];

export function EnterpriseOperatingBriefsSection() {
  return (
    <section aria-labelledby="enterprise-briefs-title" className="bg-white py-12 sm:py-16 md:py-20">
      <div className={shell}>
        <Reveal className="max-w-[800px]"><p className={eyebrow}>Operating briefs</p><h2 id="enterprise-briefs-title" className={`${heading} mt-3`}>Proof should show the operation, not just the outcome.</h2><p className={`mt-5 ${body}`}>Each enterprise engagement should be understood through its operating scope, record population, evidence state, authorized action, and verified result. These examples are intentionally presented as operating briefs rather than decorative testimonials.</p></Reveal>
        <div className="mt-9 grid gap-4 lg:grid-cols-3">{briefs.map((brief) => <article key={brief.title} className="flex flex-col border border-[#D8E3EA] bg-[#F6F8F9] p-5 sm:p-6"><p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#245BFF]">{brief.label}</p><h3 className="mt-8 text-[19px] font-semibold leading-[1.12] tracking-[-0.025em] text-[#182026]">{brief.title}</h3><p className="mt-4 text-[11px] font-semibold leading-5 text-[#52616A]">{brief.scope}</p><div className="mt-5 border-t border-[#D8E3EA] pt-4"><p className="text-[12px] leading-6 text-[#66737F]">{brief.result}</p></div><span className="mt-auto pt-7 text-[10px] font-medium text-[#94A3B8]">Illustrative structure — replace with verified customer evidence when available.</span></article>)}</div>
      </div>
    </section>
  );
}

export function EnterpriseAssessmentSection() {
  return (
    <section aria-labelledby="enterprise-assessment-title" className="border-y border-[#D8E3EA] bg-[#182026] py-12 text-white sm:py-16 md:py-20">
      <div className={`${shell} grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end lg:gap-16`}>
        <Reveal><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#AEB8FF]">Enterprise operating assessment</p><h2 id="enterprise-assessment-title" className="mt-3 max-w-[800px] font-lora text-[32px] font-normal leading-[1.03] tracking-[-0.045em] text-white sm:text-[44px] md:text-[55px]">Start with a controlled assessment—not a platform migration.</h2><p className="mt-5 max-w-[760px] text-[14px] leading-7 text-white/68 sm:text-[16px] sm:leading-8">Define the marketplaces, accounts, entities, periods, records, owners, access boundary, approval model, and desired output. Expand only when the evidence earns it.</p></Reveal>
        <Reveal className="flex flex-col items-start gap-3 sm:flex-row lg:flex-col lg:items-end"><Link to="/sales" className={cta}>Discuss an enterprise operating assessment <ArrowRight className="h-4 w-4" /></Link><Link to="/access-scope" className="inline-flex h-11 items-center gap-2 rounded-[3px] px-1 text-[13px] font-semibold text-white/78 underline decoration-white/25 underline-offset-4 hover:text-white">Review the boundary first <ArrowRight className="h-4 w-4" /></Link></Reveal>
      </div>
    </section>
  );
}
