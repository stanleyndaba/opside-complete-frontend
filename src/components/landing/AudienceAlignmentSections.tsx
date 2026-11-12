import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

const audienceContent = {
  finance: {
    capabilityEyebrow: "Financial reconciliation",
    capabilityTitle: "Make sure the recovery fits the financial records—not just the Amazon case.",
    capabilityBody: "A successful case decision is important. Finance still needs to understand how the result appears in reimbursement, adjustment, settlement, payout and accounting records. Margin distinguishes what Amazon approved, what was recorded, what reached the relevant settlement or payout stage and what remains unaccounted for.",
    capabilityLead: "The case decision advances the work. The financial records establish the outcome.",
    points: ["Approved is not the same as recorded.", "Recorded is not the same as settled or paid.", "A residual difference remains visible until it is explained."],
  },
  founder: {
    capabilityEyebrow: "Delegated follow-through",
    capabilityTitle: "Have someone who can explain the decision—not just tell you what to submit.",
    capabilityBody: "Margin keeps the investigation, case history, evidence requirements, Amazon responses and outstanding actions connected as one position. You can understand the status, the reason for a decision, the evidence supporting it and what is preventing progress without personally rebuilding the investigation.",
    capabilityLead: "The answer should identify the next action and its accountable owner—not simply repeat a status label.",
    points: ["Margin carries the agreed investigation.", "You retain decision authority and approval.", "The work stays explainable as it moves forward."],
  },
  operations: {
    capabilityEyebrow: "Operational follow-through",
    capabilityTitle: "Know whether Amazon’s response resolved the issue—or just changed it.",
    capabilityBody: "An operational workflow can be complete while the financial consequence remains open. Margin connects the originating event, evidence, Amazon response, recovery value, subsequent actions and available financial records so Operations can see what was resolved, what changed and what still requires attention.",
    capabilityLead: "The operational case can close. The financial question still needs an answer.",
    points: ["Follow the event after the workflow moves on.", "Keep new evidence and responses attached to the original event.", "Make outstanding ownership and next action visible."],
  },
  aggregator: {
    capabilityEyebrow: "Portfolio continuity",
    capabilityTitle: "Make every resolved discrepancy easier to account for next time.",
    capabilityBody: "Margin preserves established evidence, prior decisions, linked financial events and verified outcomes so later investigations can build on what is already known. Relevant activity can be compared against previously examined events while each account’s history remains distinct.",
    capabilityLead: "A portfolio record should compound what the business has learned—not make every brand start again.",
    points: ["Keep account-level evidence separate.", "Recognise recurring patterns without treating brands as interchangeable.", "Expand the work where the evidence and business case justify it."],
  },
  enterprise: {
    capabilityEyebrow: "Governed financial work",
    capabilityTitle: "Turn financial investigation into work your organisation can see and control.",
    capabilityBody: "Margin brings the finding, investigation, evidence, decision, authorized action and subsequent financial outcome into a connected workflow. Your organisation can see what has been established, what is waiting for a decision, who owns the next step and what remains outstanding across the agreed marketplace and entity scope.",
    capabilityLead: "Make every marketplace financial investigation traceable, governed and accountable at scale.",
    points: ["Define scope, access and responsibility before work begins.", "Keep evidence and approvals attached to the financial position.", "Follow the outcome instead of assuming the case decision is final."],
  },
} as const;

type Audience = keyof typeof audienceContent;

function SectionShell({ children, tone = "soft" }: { children: ReactNode; tone?: "soft" | "white" }) {
  return <section className={`relative overflow-hidden py-10 sm:py-16 md:py-22 ${tone === "soft" ? "bg-[#F5F6F4]" : "bg-white"}`}>{children}</section>;
}

export function AudienceAlignmentSections({ audience }: { audience: Audience }) {
  const content = audienceContent[audience];
  const commercialPaths = audience === "enterprise"
    ? [
        ["01 / Defined engagement", "Defined Recovery Engagement", "For a specific, established recovery opportunity that needs investigation, evidence preparation and authorised follow-through."],
        ["02 / Control pilot", "Financial Control Pilot", "For a defined area of activity where the business wants a repeatable investigation, ownership and approval workflow."],
        ["03 / Ongoing control", "Ongoing Financial Control", "For continuing examination, recovery management and outcome reconciliation across the agreed scope."],
      ]
    : audience === "aggregator"
      ? [
          ["01 / Defined engagement", "Defined Recovery Engagement", "For a specific, established recovery opportunity that needs investigation, evidence preparation and authorised follow-through."],
          ["02 / Portfolio pilot", "Financial Control Pilot", "Begin with selected accounts or brands, establish the operating standard and use the findings to decide whether to expand."],
          ["03 / Ongoing control", "Ongoing Financial Control", "For continuing examination, recovery management and outcome reconciliation across the agreed portfolio scope."],
        ]
      : audience === "founder"
        ? [
            ["01 / Defined engagement", "Defined Recovery Engagement", "For a specific, established recovery opportunity where you want Margin to carry the investigation and agreed follow-through."],
            ["02 / First step", "Free Financial Position Review", "Start by establishing what the available records explain before deciding whether any paid recovery work is justified."],
          ]
        : audience === "operations"
          ? [
              ["01 / Defined engagement", "Defined Recovery Engagement", "For an established operational issue that needs evidence preparation, financial investigation and authorised follow-through."],
              ["02 / First step", "Free Financial Position Review", "Start with the event population and establish which operational exceptions warrant further financial investigation."],
            ]
          : [
              ["01 / Defined engagement", "Defined Recovery Engagement", "For a specific, established recovery opportunity that needs investigation, evidence preparation and authorised follow-through."],
              ["02 / First step", "Free Financial Position Review", "Start by establishing what the available records explain before deciding whether any paid recovery work is justified."],
            ];

  return <>
    <SectionShell tone="white">
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 md:px-8 lg:px-10 2xl:px-12">
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start lg:gap-20">
          <div>
            <p className="font-mono text-[5.5px] leading-tight font-semibold uppercase tracking-tight text-[#F05A3C]">Evidence before action</p>
            <h2 className="mt-3 max-w-[620px] font-lora text-[34px] font-normal leading-[1.03] tracking-[-0.045em] text-[#182026] sm:text-[46px] md:text-[58px]">An explanation is not the same as an established financial conclusion.</h2>
          </div>
          <div className="max-w-[720px] text-[15px] leading-7 text-[#52616A] sm:text-[17px] sm:leading-8">
            <p>Margin can use automated analysis and AI-assisted explanation inside the investigation, but the conclusion remains bounded by the available records, validation and approval rules. A detected difference is not automatically a loss, and a possible recovery is not automatically a claim.</p>
            <p className="mt-5 font-semibold text-[#294B61]">Evidence establishes the position. Your organisation decides what action is justified.</p>
            <div className="mt-7 space-y-3">
              {["Source records remain connected to the finding.", "Supported, inferred and unresolved matters stay distinguishable.", "Consequential actions remain subject to the agreed approval boundary."].map((item) => <div key={item} className="flex items-start gap-3 border-t border-[#DCE3E1] pt-3 text-[14px] font-semibold text-[#294B61]"><ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-[#26734D]" />{item}</div>)}
            </div>
          </div>
        </div>
      </div>
    </SectionShell>

    <SectionShell tone="soft">
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 md:px-8 lg:px-10 2xl:px-12">
        <div className="grid gap-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-start lg:gap-20">
          <div>
            <p className="font-mono text-[5.5px] leading-tight font-semibold uppercase tracking-tight text-[#F05A3C]">{content.capabilityEyebrow}</p>
            <h2 className="mt-3 max-w-[650px] font-lora text-[34px] font-normal leading-[1.03] tracking-[-0.045em] text-[#182026] sm:text-[46px] md:text-[58px]">{content.capabilityTitle}</h2>
          </div>
          <div className="max-w-[720px] text-[15px] leading-7 text-[#52616A] sm:text-[17px] sm:leading-8">
            <p>{content.capabilityBody}</p>
            <p className="mt-5 font-lora text-[22px] leading-[1.12] tracking-[-0.03em] text-[#294B61] sm:text-[28px]">{content.capabilityLead}</p>
            <div className="mt-7 grid gap-4 md:grid-cols-3">
              {content.points.map((item, index) => <div key={item} className="border-t-2 border-[#F05A3C] bg-white p-4"><Check className="h-5 w-5 text-[#26734D]" /><p className="mt-6 text-[14px] font-semibold leading-6 text-[#182026]">{item}</p><span className="mt-4 block font-mono text-[10px] text-[#8B857F]">Control point 0{index + 1}</span></div>)}
            </div>
          </div>
        </div>
      </div>
    </SectionShell>

    <SectionShell tone="white">
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 md:px-8 lg:px-10 2xl:px-12">
        <div className="max-w-[850px]">
          <p className="font-mono text-[5.5px] leading-tight font-semibold uppercase tracking-tight text-[#F05A3C]">Commercial journey</p>
          <h2 className="mt-3 font-lora text-[34px] font-normal leading-[1.03] tracking-[-0.045em] text-[#182026] sm:text-[46px] md:text-[58px]">Start with the position. Choose only the work it justifies.</h2>
          <p className="mt-5 max-w-[780px] text-[15px] leading-7 text-[#52616A] sm:text-[17px] sm:leading-8">The Free Financial Position Review establishes what the available records explain, what appears to have been accounted for, what potential exposure warrants further investigation and what remains unresolved. You decide whether the next step is defined recovery work, a scoped control engagement, ongoing financial control or no further action.</p>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {commercialPaths.map(([label, title, body]) => <article key={label} className="border-t-2 border-[#F05A3C] bg-[#F7F8F7] p-5"><p className="font-mono text-[10px] font-semibold uppercase tracking-tight text-[#8B857F]">{label}</p><h3 className="mt-6 font-lora text-[25px] leading-[1.08] tracking-[-0.025em] text-[#182026]">{title}</h3><p className="mt-4 text-[14px] leading-6 text-[#52616A]">{body}</p><a href="/contact" className="mt-6 inline-flex items-center gap-2 text-[13px] font-semibold text-[#635BFF] underline decoration-[#B8B0FF] underline-offset-4">Discuss the right scope <ArrowRight className="h-4 w-4" /></a></article>)}
        </div>
      </div>
    </SectionShell>
  </>;
}
