import { ArrowRight, CircleDot, FileCheck2, GitBranch, ShieldCheck, Users } from "lucide-react";

const capabilityContent = {
  finance: {
    sections: [
      {
        eyebrow: "Financial consequence",
        title: "An Amazon case decision is evidence of what happened—not proof that the books are finished.",
        body: "Finance needs the original event, the supporting records, Amazon’s response and the downstream money to remain connected. Margin keeps approval, recording, settlement, payout and residual difference distinguishable so a closed case does not become an assumed financial outcome.",
        points: ["Amazon approved", "Reimbursement recorded", "Settlement or payout verified", "Residual position explained"],
        icon: FileCheck2,
      },
      {
        eyebrow: "Investigation operations",
        title: "The financial position should carry the reasoning with it.",
        body: "A finding is useful when another reviewer can follow the source records, challenge the interpretation and see why the next action is justified. Margin turns the investigation into a record Finance can review, carry into close and revisit without rebuilding the history.",
        points: ["Source lineage stays attached", "Supported and unresolved remain separate", "Approval boundaries stay visible", "Follow-through remains open until verified"],
        icon: ShieldCheck,
      },
    ],
  },
  founder: {
    sections: [
      {
        eyebrow: "Amazon response",
        title: "Amazon can close the case while the financial question stays open.",
        body: "A reimbursement may be approved, delayed, partially recorded or difficult to reconcile. Margin keeps the case response connected to the evidence and the financial result, so you do not have to become the person who reconstructs what happened next.",
        points: ["Response linked to the original event", "Missing evidence made specific", "Rejection reason stays visible", "Next action has an owner"],
        icon: CircleDot,
      },
      {
        eyebrow: "Delegated follow-through",
        title: "When a recovery needs more work, the responsibility should not return to your inbox as a mystery.",
        body: "Margin can carry the agreed investigation, evidence preparation and authorized follow-through. You stay informed and retain the approval decision; Margin keeps the work moving within the scope you agreed.",
        points: ["You provide the records", "Margin investigates the position", "You approve consequential action", "The outcome remains visible"],
        icon: Users,
      },
    ],
  },
  operations: {
    sections: [
      {
        eyebrow: "Operational event tracing",
        title: "Follow the event after it leaves the warehouse, workflow or case queue.",
        body: "An inbound variance, return, inventory movement or settlement difference can travel through several systems before its financial consequence appears. Margin preserves the chain from operational event to evidence, response and recorded outcome.",
        points: ["Event population identified", "Connected records examined", "Amazon response attached", "Financial consequence followed"],
        icon: GitBranch,
      },
      {
        eyebrow: "Ownership after resolution",
        title: "An operational resolution is not automatically a financial outcome.",
        body: "The team may have fixed the process or closed the case while a reimbursement, reversal, offset or settlement question remains. Margin makes the remaining responsibility visible instead of letting the operational close hide the financial work.",
        points: ["What Operations resolved", "What Finance still needs", "What evidence is missing", "Who owns the next action"],
        icon: ShieldCheck,
      },
    ],
  },
  aggregator: {
    sections: [
      {
        eyebrow: "Account-level integrity",
        title: "A portfolio number is not an account-level financial position.",
        body: "Aggregated performance can hide which brand, marketplace, entity, SKU population or reporting period created the unresolved difference. Margin preserves that context so the portfolio can be examined without turning distinct seller records into one unsupported total.",
        points: ["Brand and account context", "Marketplace and currency context", "Evidence remains scoped", "Portfolio totals stay qualified"],
        icon: FileCheck2,
      },
      {
        eyebrow: "Repeatable financial control",
        title: "What one brand teaches should make the next investigation more consistent.",
        body: "Once a pattern, evidence requirement or decision rule is established, it can guide later work without erasing the history of the account being examined. Margin helps the operating standard compound while findings remain individually defensible.",
        points: ["Established checks can repeat", "Account histories stay distinct", "Recurring patterns become visible", "Expansion follows evidence"],
        icon: GitBranch,
      },
    ],
  },
  enterprise: {
    sections: [
      {
        eyebrow: "Governance and scope",
        title: "Every financial investigation needs an accountable boundary.",
        body: "At scale, the question is not only what Margin can find. It is which accounts, entities, marketplaces, periods, records, owners and approval rights are inside the engagement. Margin makes that operating boundary explicit before consequential work begins.",
        points: ["Scope is defined", "Access is purpose-limited", "Owners are visible", "Approval remains with the business"],
        icon: ShieldCheck,
      },
      {
        eyebrow: "Controlled scale",
        title: "The operating model should survive scale without losing the evidence trail.",
        body: "Finance, Operations, recovery providers and existing systems may each own part of the work. Margin connects the financial position, evidence, decision, authorized action and outcome so an enterprise team can inspect what is established, pending or unresolved across the agreed boundary.",
        points: ["One accountable position", "Connected source records", "Visible decision rights", "Outcome and residuals tracked"],
        icon: Users,
      },
    ],
  },
} as const;

type Audience = keyof typeof capabilityContent;

type IconType = (typeof FileCheck2);

function CapabilityBlock({
  eyebrow,
  title,
  body,
  points,
  icon: Icon,
  reverse,
}: {
  eyebrow: string;
  title: string;
  body: string;
  points: readonly string[];
  icon: IconType;
  reverse: boolean;
}) {
  return (
    <section className={`relative overflow-hidden py-14 sm:py-20 md:py-24 ${reverse ? "bg-[#F5F6F4]" : "bg-white"}`}>
      <div className="mx-auto grid w-full max-w-[1280px] gap-10 px-5 sm:px-6 md:px-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-start lg:gap-20 lg:px-10 2xl:px-12">
        <div className="max-w-[650px]">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8B857F]">{eyebrow}</p>
          <h2 className="mt-3 font-lora text-[34px] font-normal leading-[1.03] tracking-[-0.045em] text-[#182026] sm:text-[46px] md:text-[58px]">{title}</h2>
        </div>
        <div className="max-w-[720px] text-[15px] leading-7 text-[#52616A] sm:text-[17px] sm:leading-8">
          <p>{body}</p>
          <div className="mt-8 grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {points.map((point) => (
              <div key={point} className="flex items-start gap-3 border-t border-[#D8DEDA] pt-3 text-[14px] font-semibold leading-6 text-[#294B61]">
                <Icon className="mt-1 h-4 w-4 shrink-0 text-[#26734D]" />
                <span>{point}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-[#8B857F]">
            <span>Evidence-led operating context</span><ArrowRight className="h-3.5 w-3.5 text-[#F05A3C]" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function AudienceCapabilitySections({ audience }: { audience: Audience }) {
  return (
    <>
      {capabilityContent[audience].sections.map((section, index) => (
        <CapabilityBlock key={section.eyebrow} {...section} reverse={index % 2 === 1} />
      ))}
    </>
  );
}
