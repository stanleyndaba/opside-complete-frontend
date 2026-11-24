import React from "react";
import { ArrowRight, Check, ChevronRight, CircleCheck, Link2, SearchCheck, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { BrandFooter } from "@/components/layout/BrandFooter";
import { PublicNavbar } from "@/components/layout/PublicNavbar";

const container = "mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12";
const eyebrow = "font-google-sans text-[11px] font-semibold uppercase tracking-[0.12em] text-[#245BFF]";
const heading = "font-lora font-normal leading-[1.02] tracking-[-0.045em] text-[#182026]";
const body = "text-[15px] leading-7 text-[#52616A] sm:text-[17px] sm:leading-8";
const primaryCta = "inline-flex h-12 items-center justify-center gap-2 rounded-[3px] bg-[#F05A3C] px-5 text-[14px] font-semibold text-white shadow-[0_12px_28px_rgba(240,90,60,0.18)] transition-colors hover:bg-[#D9472D]";
const secondaryCta = "inline-flex h-12 items-center justify-center gap-2 rounded-[3px] border border-[#C8D6DF] bg-white px-5 text-[14px] font-semibold text-[#182026] transition-colors hover:border-[#245BFF] hover:text-[#245BFF]";

const audiences = [
  {
    title: "Finance Teams & Controllers",
    label: "Financial close",
    image: "/generated/teams/finance-teams-controllers.png",
    copy: "Close the gap between reconciliation and explanation. Give Finance a defensible account of what happened, what is supported and what remains open.",
  },
  {
    title: "Founder-led Amazon Businesses",
    label: "Delegated ownership",
    image: "/generated/teams/founder-led-amazon-businesses.png",
    copy: "Stop carrying every unresolved financial question yourself. Margin takes responsibility for an agreed scope and shows you the conclusion.",
  },
  {
    title: "Marketplace Operations Teams",
    label: "Event accountability",
    image: "/generated/teams/marketplace-operation-teams.png",
    copy: "Connect shipments, returns, inventory and marketplace events to the financial consequences they create.",
  },
  {
    title: "Aggregators & Multi-brand Operators",
    label: "Portfolio control",
    image: "/generated/teams/aggregators-multi-brand-operators.png",
    copy: "Maintain one investigative standard across brands, accounts and product portfolios without losing ownership between teams.",
  },
  {
    title: "Enterprise & Multi-marketplace Businesses",
    label: "Scale control",
    image: "/generated/teams/enterprise-multi-marketplace-businesses.png",
    copy: "Establish financial control across marketplaces, entities, currencies, accounts and high-volume operational histories.",
  },
];

const lifecycle = [
  ["Detected", "A potential issue has been identified."],
  ["Investigated", "Relevant records and connected events have been examined."],
  ["Validated", "The financial discrepancy has been established or qualified."],
  ["Actionable", "A justified course of action is clear."],
  ["Acted upon", "The approved work has been carried out."],
  ["Resolved", "An outcome has been obtained or the issue otherwise concluded."],
  ["Reconciled", "The financial outcome has been verified against relevant records."],
];

const standards = [
  "No unsupported conclusions — detection is not proof.",
  "No unnecessary claims — action follows evidence and circumstances.",
  "No false closure — a closed Amazon case is not automatic financial resolution.",
  "No hidden uncertainty — missing evidence and limitations remain visible.",
  "No abandoned ownership — agreed work has a clear owner and status.",
  "No misleading metrics — identified, validated, actionable, recovered and reconciled are different outcomes.",
  "No unlimited-capacity promise — scope and delivery capacity are established before acceptance.",
  "No customer confusion — the customer understands what was investigated and what remains.",
];

function SectionIntro({ label, title, copy, dark = false }: { label: string; title: string; copy?: string; dark?: boolean }) {
  return (
    <div className="max-w-[850px]">
      <p className={`${eyebrow} ${dark ? "text-[#86A7FF]" : ""}`}>{label}</p>
      <h2 className={`${heading} mt-4 text-[36px] sm:text-[48px] md:text-[60px] ${dark ? "text-white" : ""}`}>{title}</h2>
      {copy ? <p className={`mt-5 max-w-[760px] ${body} ${dark ? "text-white/70" : ""}`}>{copy}</p> : null}
    </div>
  );
}

function PositioningPreview() {
  return (
    <div className="min-h-screen bg-[#FAFAF7] text-[#182026]">
      <PublicNavbar variant="light" wide />
      <div className="border-b border-[#D8E3E8] bg-[#182026] px-5 py-2.5 pt-[calc(2.25rem+0.625rem)] text-center text-[11px] font-semibold uppercase tracking-[0.12em] text-white/75 sm:px-6">
        Positioning preview — homepage unchanged
      </div>

      <main>
        <section className="relative overflow-hidden bg-[#FAFAF7] py-20 sm:py-28 md:py-36">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(36,91,255,0.12),transparent_27%),radial-gradient(ellipse_at_12%_92%,rgba(240,90,60,0.09),transparent_34%)]" />
          <div className={`${container} relative`}>
            <div className="grid items-center gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
              <div className="max-w-[800px]">
                <p className={`${eyebrow} border-l-2 border-[#245BFF] pl-3`}>Amazon financial operations and control</p>
                <h1 className={`${heading} mt-5 max-w-[780px] text-[48px] sm:text-[64px] md:text-[82px]`}>Know what actually happened to your Amazon money.</h1>
                <p className="mt-7 max-w-[720px] text-[17px] leading-8 text-[#33454E] sm:text-[20px] sm:leading-9">Margin investigates the connected operational and financial events behind your Amazon records, establishes what is correct, identifies what remains unresolved and takes justified work through to verified financial resolution.</p>
                <p className="mt-6 max-w-[650px] border-l-2 border-[#F05A3C] pl-4 text-[14px] font-semibold leading-6 text-[#182026] sm:text-[16px] sm:leading-7">For established Amazon businesses with meaningful transaction complexity, recurring financial exceptions and teams that cannot afford to carry every investigation themselves.</p>
                <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Link to="/audit-start" className={primaryCta}>Establish your financial position <ChevronRight className="h-4 w-4" /></Link>
                  <Link to="/sales" className={secondaryCta}>Discuss delegated responsibility <ArrowRight className="h-4 w-4" /></Link>
                </div>
                <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-semibold text-[#66737F]
                ">
                  {["Evidence before action", "Defined scope ownership", "Verified outcomes"].map((item) => <span key={item} className="inline-flex items-center gap-1.5"><span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-[#245BFF] text-white"><Check className="h-2.5 w-2.5" strokeWidth={3} /></span>{item}</span>)}
                </div>
              </div>
              <div className="relative min-h-[410px] overflow-hidden rounded-[10px] border border-[#C9D9E1] bg-white p-4 shadow-[0_26px_70px_rgba(37,49,58,0.12)] sm:min-h-[500px] sm:p-7">
                <div className="absolute inset-0 bg-[linear-gradient(rgba(36,91,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(36,91,255,0.05)_1px,transparent_1px)] bg-[size:34px_34px]" />
                <div className="relative flex h-full min-h-[370px] flex-col justify-between">
                  <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.1em] text-[#66737F]"><span>Financial position</span><span className="rounded-full bg-[#EEF3FF] px-3 py-1 text-[#245BFF]">Under investigation</span></div>
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {["Inventory event", "Related adjustment", "Settlement treatment", "Final conclusion"].map((item, index) => <div key={item} className={`rounded-[8px] border p-3 sm:p-4 ${index === 3 ? "border-[#F05A3C] bg-[#FFF5F1]" : "border-[#D8E3E8] bg-[#FAFAF7]"}`}><div className="mb-5 h-2 w-2 rounded-full bg-[#245BFF]" /><p className="text-[13px] font-semibold text-[#182026] sm:text-[14px]">{item}</p><p className="mt-1 text-[11px] leading-5 text-[#66737F]">{index === 3 ? "Verified, qualified or still open" : "Connected evidence"}</p></div>)}
                  </div>
                  <div className="flex items-center justify-between border-t border-[#D8E3E8] pt-4 text-[12px] font-semibold text-[#182026]"><span>What happened?</span><span className="inline-flex items-center gap-1 text-[#F05A3C]">Follow through <ArrowRight className="h-3.5 w-3.5" /></span></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#D8E3E8] bg-white py-16 sm:py-20 md:py-24">
          <div className={container}>
            <SectionIntro label="The problem" title="A recorded transaction is not the same as a correct financial outcome." copy="A claim can be submitted. A case can be closed. A reimbursement can be received. None of those events, by themselves, establish that the complete financial position is correct." />
            <div className="mt-12 grid gap-4 md:grid-cols-4">
              {["Recorded", "Submitted", "Received", "Resolved"].map((item, index) => <div key={item} className={`relative min-h-[170px] rounded-[8px] border p-5 ${index === 3 ? "border-[#245BFF] bg-[#EEF3FF]" : "border-[#D8E3E8] bg-[#FAFAF7]"}`}><span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#66737F]">0{index + 1}</span><h3 className="mt-8 text-[22px] font-semibold tracking-[-0.03em]">{item}</h3><p className="mt-2 text-[12px] leading-5 text-[#66737F]">{index === 0 ? "An entry exists." : index === 1 ? "A process was started." : index === 2 ? "Money moved." : "The connected financial position is established and documented."}</p>{index < 3 ? <ArrowRight className="absolute right-4 top-1/2 hidden h-4 w-4 translate-x-1/2 text-[#245BFF] md:block" /> : null}</div>)}
            </div>
          </div>
        </section>

        <section className="bg-[#182026] py-16 text-white sm:py-20 md:py-24">
          <div className={container}>
            <SectionIntro dark label="The connected chain" title="One Amazon event can create a chain of financial consequences." copy="Margin does not treat each discrepancy as an isolated opportunity. It connects the operational event, related records, evidence, decision, action and final financial treatment." />
            <div className="mt-12 grid gap-3 md:grid-cols-6">
              {["Operational event", "Inventory / returns", "Adjustments / fees", "Settlement", "Evidence + decision", "Verified outcome"].map((item, index) => <React.Fragment key={item}><div className="flex min-h-[150px] flex-col justify-between rounded-[8px] border border-white/15 bg-white/[0.05] p-4"><span className="text-[11px] font-semibold text-[#86A7FF]">0{index + 1}</span><p className="max-w-[130px] text-[15px] font-semibold leading-5 text-white">{item}</p></div>{index < 5 ? <div className="hidden items-center justify-center md:flex"><ArrowRight className="h-4 w-4 text-[#F05A3C]" /></div> : null}</React.Fragment>)}
            </div>
            <div className="mt-8 rounded-[8px] border border-[#F05A3C]/40 bg-[#F05A3C]/10 p-5 text-[14px] font-semibold leading-6 text-white sm:p-6">The question is not only “did Amazon pay?” It is “what happened, what was the correct treatment, what remains unresolved and has the final position been reconciled?”</div>
          </div>
        </section>

        <section className="bg-[#EEF3FF] py-16 sm:py-20 md:py-24">
          <div className={container}>
            <SectionIntro label="The responsibility gap" title="The problem is not always finding an exception. It is knowing who owns the complete outcome." copy="Finance sees the settlement. Operations sees the event. A recovery provider sees the claim. Accounting records the entry. The connected chain can still remain unowned." />
            <div className="mt-12 grid gap-4 lg:grid-cols-[1fr_auto_1fr] lg:items-center">
              <div className="space-y-3">{["Marketplace operations", "Finance / accounting", "Recovery provider"].map((item) => <div key={item} className="flex items-center gap-3 rounded-[8px] border border-[#C9D9E1] bg-white p-4 text-[14px] font-semibold"><span className="h-2.5 w-2.5 rounded-full bg-[#245BFF]" />{item}<span className="ml-auto text-[11px] font-medium text-[#66737F]">sees one part</span></div>)}</div>
              <div className="flex justify-center"><div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#F05A3C] text-white shadow-[0_10px_24px_rgba(240,90,60,0.25)]"><Link2 className="h-7 w-7" /></div></div>
              <div className="rounded-[8px] border-2 border-[#245BFF] bg-white p-6 shadow-[0_16px_36px_rgba(36,91,255,0.12)]"><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#245BFF]">Margin owns the agreed scope</p><h3 className="mt-3 text-[25px] font-semibold leading-tight tracking-[-0.035em]">Connect the work. Explain the conclusion. Verify the outcome.</h3><p className="mt-3 text-[13px] leading-6 text-[#52616A]">Not every question will have a perfect answer. Every conclusion should have a clear basis, owner, status and next step.</p></div>
            </div>
          </div>
        </section>

        <section className="bg-white py-16 sm:py-20 md:py-24">
          <div className={container}>
            <SectionIntro label="The Margin investigation lifecycle" title="We do not stop at detection, submission or explanation." copy="The value is in moving a financial question through disciplined investigation and responsible follow-through until the conclusion is verified or clearly remains open." />
            <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-7">{lifecycle.map(([title, copy], index) => <div key={title} className="relative rounded-[8px] border border-[#D8E3E8] bg-[#FAFAF7] p-4"><div className="flex items-center justify-between"><span className="text-[11px] font-semibold text-[#245BFF]">0{index + 1}</span>{index === lifecycle.length - 1 ? <CircleCheck className="h-4 w-4 text-[#F05A3C]" /> : null}</div><h3 className="mt-8 text-[16px] font-semibold">{title}</h3><p className="mt-2 text-[12px] leading-5 text-[#66737F]">{copy}</p>{index < lifecycle.length - 1 ? <ChevronRight className="absolute -right-3 top-1/2 z-10 hidden h-5 w-5 rounded-full bg-white text-[#245BFF] lg:block" /> : null}</div>)}</div>
            <div className="mt-10 grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center"><div className="overflow-hidden rounded-[8px] border border-[#D8E3E8] bg-[#F7F8F7]"><img src="/margin-workflow-section.png" alt="Margin workflow connecting a financial position to authorised action and reconciled outcome" className="h-auto w-full" loading="lazy" /></div><div><p className={`${eyebrow}`}>What the customer receives</p><ul className="mt-5 space-y-3">{["A defined owner for the agreed scope", "Evidence-backed conclusions and visible uncertainty", "Justified action carried through", "An outcome that is verified and documented"].map((item) => <li key={item} className="flex gap-3 text-[15px] leading-6 text-[#33454E]"><Check className="mt-1 h-4 w-4 shrink-0 text-[#F05A3C]" />{item}</li>)}</ul></div></div>
          </div>
        </section>

        <section className="bg-[#F7F8F7] py-16 sm:py-20 md:py-24">
          <div className={container}>
            <SectionIntro label="Built for established Amazon businesses" title="The work changes by buyer. The standard does not." copy="Margin is designed for businesses where marketplace activity has become too complex for periodic manual checks and too consequential to leave between systems." />
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{audiences.map((audience, index) => <article key={audience.title} className={`group overflow-hidden rounded-[8px] border border-[#D8E3E8] bg-white ${index === audiences.length - 1 ? "sm:col-span-2 lg:col-span-1" : ""}`}><div className="aspect-[4/2.6] overflow-hidden bg-[#E9E9E5]"><img src={audience.image} alt={audience.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.035]" loading="lazy" /></div><div className="p-5 sm:p-6"><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#245BFF]">{audience.label}</p><h3 className="mt-3 text-[22px] font-semibold leading-tight tracking-[-0.035em]">{audience.title}</h3><p className="mt-3 text-[14px] leading-6 text-[#52616A]">{audience.copy}</p></div></article>)}</div>
          </div>
        </section>

        <section className="bg-white py-16 sm:py-20 md:py-24">
          <div className={container}>
            <SectionIntro label="Why existing arrangements leave a gap" title="Margin connects the work that other systems often leave distributed." copy="This is not a claim that other providers are incapable. It is a clearer definition of the responsibility Margin is designed to accept." />
            <div className="mt-12 overflow-x-auto rounded-[8px] border border-[#D8E3E8]"><table className="w-full min-w-[760px] border-collapse text-left text-[13px]"><thead><tr className="bg-[#182026] text-white"><th className="p-4 font-semibold">Category</th><th className="p-4 font-semibold">Primarily provides</th><th className="p-4 font-semibold">The question Margin must answer</th></tr></thead><tbody>{[["Recovery providers", "Recovery investigation and claim management", "Has the underlying financial position been established and closed?"], ["Seller analytics", "Visibility into profitability and performance", "What explains the underlying financial movements?"], ["Accounting platforms", "Settlement imports and accounting workflows", "Were the operational events behind the entries investigated?"], ["Internal finance teams", "Financial judgment and internal execution", "Is there enough capacity and ownership to close every material exception?"], ["Margin", "Connected investigation and justified resolution", "What happened, what is supported, what remains unresolved and is it closed?"]].map(([category, provides, question], index) => <tr key={category} className={`border-t border-[#D8E3E8] ${index === 4 ? "bg-[#EEF3FF] font-semibold" : "bg-white"}`}><td className="p-4 text-[#182026]">{category}</td><td className="p-4 text-[#52616A]">{provides}</td><td className="p-4 text-[#182026]">{question}</td></tr>)}</tbody></table></div>
          </div>
        </section>

        <section className="bg-[#182026] py-16 text-white sm:py-20 md:py-24">
          <div className={container}>
            <SectionIntro dark label="The Margin standard" title="We establish before acting, and verify before closing." copy="These are not marketing claims. They are the standards that should govern investigations, customer communication, reporting, quality assurance and commercial commitments." />
            <div className="mt-12 grid gap-x-10 gap-y-4 md:grid-cols-2">{standards.map((standard) => <div key={standard} className="flex gap-3 border-t border-white/15 pt-4 text-[14px] leading-6 text-white/82"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#86A7FF]" />{standard}</div>)}</div>
          </div>
        </section>

        <section className="bg-[#EEF3FF] py-16 sm:py-20 md:py-24">
          <div className={container}>
            <SectionIntro label="Proof that Margin can carry the work" title="Trust is earned by showing the investigation, not by promising sophistication." copy="A strong proof asset makes the responsibility visible: what the customer could not establish, what Margin examined, what it concluded, what action was justified and what was ultimately reconciled." />
            <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{[["Investigation record", "Depth, evidence and reasoning"], ["Before-and-after reconciliation", "Financial outcome, not activity"], ["Scope and delivery record", "Ability to manage responsibility"], ["Repeat engagement", "Continued customer confidence"]].map(([title, copy]) => <div key={title} className="rounded-[8px] border border-[#C9D9E1] bg-white p-5"><SearchCheck className="h-6 w-6 text-[#F05A3C]" /><h3 className="mt-8 text-[18px] font-semibold">{title}</h3><p className="mt-2 text-[13px] leading-5 text-[#66737F]">{copy}</p></div>)}</div>
            <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_1.15fr] lg:items-center"><div><p className={eyebrow}>Illustrative investigation record</p><h3 className={`${heading} mt-4 text-[32px] sm:text-[42px]`}>One discrepancy. Several connected records. One accountable conclusion.</h3><p className={`mt-5 ${body}`}>This is the proof standard: not “we found money,” but “we established what happened, what was already accounted for, what was justified and what remains open.”</p></div><div className="rounded-[8px] border border-[#C9D9E1] bg-white p-5 shadow-[0_16px_36px_rgba(36,91,255,0.08)]"><div className="flex items-center justify-between border-b border-[#D8E3E8] pb-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-[#66737F]"><span>Investigation summary</span><span className="text-[#F05A3C]">Qualified outcome</span></div>{["Inventory discrepancy linked to adjustment", "Settlement treatment compared with source records", "Evidence threshold and uncertainty recorded", "Justified action followed through", "Financial outcome verified or left open"].map((item) => <div key={item} className="flex items-center gap-3 border-b border-[#EEF2F4] py-3 text-[13px] font-semibold text-[#182026]"><CircleCheck className="h-4 w-4 shrink-0 text-[#245BFF]" />{item}</div>)}</div></div>
          </div>
        </section>

        <section className="bg-white py-16 sm:py-20 md:py-24">
          <div className={container}>
            <SectionIntro label="What customers buy" title="You are not buying another dashboard. You are transferring responsibility for an agreed scope of financial work." copy="Every engagement needs explicit scope, responsibilities, exclusions, dependencies and escalation paths. The price reflects the complexity, expertise, execution and accountability required." />
            <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-5">{[["Initial Financial Audit", "Establish the available financial picture and potential exceptions."], ["Defined Financial Resolution", "Own a defined set of investigations and justified actions."], ["Complex Resolution Programme", "Investigate interconnected operational and financial events."], ["Financial Control Pilot", "Ongoing investigation, exception management and reporting."], ["Enterprise Control Programme", "Broader, explicitly scoped financial operations responsibility."]].map(([title, copy], index) => <div key={title} className={`rounded-[8px] border p-5 ${index === 4 ? "border-[#245BFF] bg-[#EEF3FF]" : "border-[#D8E3E8] bg-[#FAFAF7]"}`}><span className="text-[11px] font-semibold text-[#245BFF]">0{index + 1}</span><h3 className="mt-7 text-[18px] font-semibold leading-tight">{title}</h3><p className="mt-3 text-[13px] leading-5 text-[#66737F]">{copy}</p></div>)}</div>
          </div>
        </section>

        <section className="bg-[#FAFAF7] py-20 sm:py-28 md:py-36">
          <div className={`${container} text-center`}>
            <p className={eyebrow}>Start with the financial position</p>
            <h2 className={`${heading} mx-auto mt-4 max-w-[920px] text-[42px] sm:text-[58px] md:text-[72px]`}>Stop carrying unresolved Amazon financial work without a clear owner.</h2>
            <p className={`mx-auto mt-6 max-w-[700px] ${body}`}>Define the scope you need Margin to own. We establish what the available records support, explain what remains uncertain and show how the work will be taken through to its financial conclusion.</p>
            <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row"><Link to="/sales" className={primaryCta}>Discuss a defined scope of responsibility <ChevronRight className="h-4 w-4" /></Link><Link to="/audit-start" className={secondaryCta}>Start with a financial position review <ArrowRight className="h-4 w-4" /></Link></div>
            <div className="mx-auto mt-10 flex max-w-[680px] flex-wrap justify-center gap-x-6 gap-y-2 text-[11px] font-semibold text-[#66737F]"><span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#245BFF]" />Defined scope</span><span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#245BFF]" />Evidence-backed work</span><span className="inline-flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-[#245BFF]" />Verified or clearly unresolved outcome</span></div>
          </div>
        </section>
      </main>
      <BrandFooter wide />
    </div>
  );
}

export default PositioningPreview;
