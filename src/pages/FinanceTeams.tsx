import type { ReactNode } from "react";
import { ArrowRight, Check, ChevronRight, FileCheck2, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { BrandFooter } from "@/components/layout/BrandFooter";
import { AudienceFaqSection } from "@/components/landing/AudienceFaqSection";
import { AudienceCapabilitySections } from "@/components/landing/AudienceCapabilitySections";
import { AudienceAlignmentSections } from "@/components/landing/AudienceAlignmentSections";
import { PublicNavbar } from "@/components/layout/PublicNavbar";
import { usePageMeta } from "@/hooks/usePageMeta";
import { SITE_META } from "@/config/site";

const primaryCtaClass = "landing-action-cta landing-pressable inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#F05A3C] px-4 py-3 text-center text-[13px] font-semibold leading-5 sm:w-auto text-white shadow-[0_12px_26px_rgba(240,90,60,0.18)] transition-colors hover:bg-[#D9472D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F05A3C]/35 focus-visible:ring-offset-2";
const secondaryCtaClass = "landing-pressable inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[7px] bg-white px-4 py-3 text-center text-[13px] font-semibold leading-5 sm:w-auto text-[#182026] transition-colors hover:bg-[#F7F7F5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F05A3C]/35 focus-visible:ring-offset-2";
const containerClass = "mx-auto min-w-0 w-full max-w-[1280px] px-4 sm:px-6 md:px-8 lg:px-10 2xl:px-12";

function Heading({ eyebrow, title, children, dark = false }: { eyebrow?: string; title: string; children?: ReactNode; dark?: boolean }) {
  return <div className="max-w-[850px]">
    {eyebrow ? <p className={`font-mono text-[4px] leading-tight font-normal uppercase tracking-tight text-[#F05A3C]`}>{eyebrow}</p> : null}
    <h2 className={`mt-3 font-lora text-[34px] font-normal leading-[1.03] tracking-[-0.045em] text-[#182026] sm:text-[46px] md:text-[58px]`}>{title}</h2>
    {children}
  </div>;
}

const controlAreas = [
  ["Marketplace reconciliation", "Connect operational events, Amazon records, settlement activity and the resulting financial position."],
  ["Evidence and exception control", "Separate established findings from unsupported signals, incomplete evidence and unresolved exceptions."],
  ["Recovery oversight", "Keep authorized recovery work, responses, follow-up and financial outcomes visible in one accountable record."],
  ["Close and reporting support", "Give Finance a defensible basis for review, challenge, approval and period-end follow-through."],
];

const operatingPrinciples = [
  "A financial conclusion should be traceable to its source records.",
  "A possible recovery should not be presented as an established outcome.",
  "An approved action should remain open until its financial result is verified.",
  "Unresolved exceptions should remain visible instead of disappearing into a summary.",
];

export default function FinanceTeams() {
  usePageMeta({
    title: "Finance Teams & Controllers | Margin",
    description: "Margin helps Finance teams establish what happened, what has been accounted for, what remains unresolved and what deserves action across Amazon financial activity.",
    url: `${SITE_META.url}/finance-teams`,
    image: SITE_META.image,
  });

  return <div className="landing-page landing-google-sans min-h-screen overflow-x-hidden bg-white text-[#182026] selection:bg-[#0B74DE]/16 selection:text-[#182026]">
    <PublicNavbar variant="light" wide />
    <main>
      <section className="relative overflow-hidden bg-white py-8 sm:py-16 md:py-24">
        <div className={`${containerClass} min-w-0 grid items-center gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] lg:gap-20`}>
          <div>
            <p className="font-mono text-[4px] leading-tight font-normal uppercase tracking-tight text-[#F05A3C]">Finance Teams &amp; Controllers</p>
            <h1 className="mt-4 max-w-[760px] font-lora text-[42px] font-normal leading-[0.99] tracking-[-0.05em] text-[#182026] sm:text-[58px] md:text-[72px]">Keep the financial picture accountable.</h1>
            <p className="mt-7 max-w-[680px] text-[16px] leading-8 text-[#52616A] sm:text-[18px]">Marketplace reconciliation, financial reporting and recovery work rarely stay inside one record or one team. Finance still needs to establish what happened, what has been accounted for and what remains unresolved.</p>
            <p className="mt-5 max-w-[680px] text-[16px] font-semibold leading-8 text-[#294B61] sm:text-[18px]">Margin connects the investigation, evidence, decision and financial outcome so Finance can review a defensible position instead of rebuilding every question from the beginning.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"><Link to="/review-consent" className={primaryCtaClass}>Start a Free Financial Position Review <ArrowRight className="h-4 w-4" /></Link><a href="#control" className={secondaryCtaClass}>See the Finance control model <ChevronRight className="h-4 w-4" /></a></div>
            <p className="mt-5 max-w-[620px] text-[12px] leading-5 text-[#7A858A]">Start with the records already available to your business. Establish the position before deciding what deserves further work.</p>
          </div>
          <div className="relative w-full min-w-0 max-w-full min-h-[300px] overflow-hidden rounded-[8px] bg-[#E9E9E5] sm:min-h-[440px]"><img src="/abstract-object-01.png" alt="Finance team financial control across Amazon records" className="absolute inset-0 h-full w-full max-w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/10 to-black/75" /><div className="absolute inset-x-6 bottom-6 text-white sm:inset-x-8 sm:bottom-8"><span className="inline-flex rounded-[3px] bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-[#273036]">Finance control</span><p className="mt-4 max-w-[360px] font-lora text-[27px] leading-[1.06] tracking-[-0.035em] sm:text-[34px]">Know what happened, what is supported and what still needs attention.</p></div></div>
        </div>
      </section>

      <section id="control" className="relative overflow-hidden bg-[#F5F6F4] py-10 sm:py-16 md:py-22"><div className={`${containerClass} min-w-0`}><Heading eyebrow="The Finance requirement" title="Financial control starts before the answer is reported."><p className="mt-6 max-w-[780px] text-[15px] leading-7 text-[#52616A] sm:text-[17px] sm:leading-8">When an Amazon financial issue is escalated to Finance, the question is rarely only whether a claim exists. Finance needs to know which event created the exposure, what the source records establish, what Amazon recorded or decided, what has already been accounted for and what remains unresolved.</p></Heading><div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">{controlAreas.map(([title, body], index) => <article key={title} className="border-t-2 border-[#F05A3C] bg-white p-5"><span className="font-mono text-[10px] text-[#8B857F]">0{index + 1}</span><h3 className="mt-7 font-lora text-[24px] leading-[1.08] tracking-[-0.025em] text-[#182026]">{title}</h3><p className="mt-4 text-[13px] leading-6 text-[#667177]">{body}</p></article>)}</div></div></section>

      <section className="relative overflow-hidden bg-white py-10 sm:py-16 md:py-22"><div className={`${containerClass} grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-24`}><Heading eyebrow="One accountable position" title="Finance should not have to reconstruct the investigation before it can challenge the conclusion." /><div className="max-w-[700px] text-[15px] leading-7 text-[#52616A] sm:text-[17px] sm:leading-8"><p>Amazon reports, case histories, inventory records, settlement activity, accounting entries and internal correspondence may each explain one part of an issue.</p><p className="mt-5">Margin brings the relevant records together around the financial question, preserving source lineage and the reasoning that connects an observed event to a supported position.</p><div className="mt-7 space-y-3">{["Original event and affected population", "Evidence used to test the position", "Amazon decision or response", "Accounted-for value and settlement treatment", "Remaining exception and next action"].map((item) => <div key={item} className="flex items-center gap-3 border-t border-[#DCE3E1] pt-3 text-[14px] font-semibold text-[#294B61]"><FileCheck2 className="h-4 w-4 shrink-0 text-[#26734D]" />{item}</div>)}</div></div></div></section>

      <section className="relative overflow-hidden bg-[#F5F6F4] py-10 sm:py-16 md:py-22"><div className={`${containerClass} grid gap-8 lg:grid-cols-[1fr_1fr] lg:gap-20`}><Heading eyebrow="The Margin standard" title="Not every discrepancy is a recovery. Not every recovery is complete."><p className="mt-6 max-w-[650px] text-[15px] leading-7 text-[#52616A] sm:text-[17px] sm:leading-8">Margin examines the available evidence before turning an observation into a financial conclusion. The position remains qualified where records are incomplete, the relationship is unsupported or the resulting outcome has not been reconciled.</p></Heading><div className="space-y-4">{operatingPrinciples.map((item, index) => <div key={item} className="flex items-start gap-4 border-b border-[#D8DEDA] pb-4"><span className="font-mono text-[10px] text-[#8B857F]">0{index + 1}</span><p className="max-w-[560px] text-[15px] font-semibold leading-6 text-[#294B61]">{item}</p></div>)}</div></div></section>

      <section className="relative overflow-hidden bg-[#F5F6F4] py-10 text-[#182026] sm:py-20 md:py-24"><div className={`${containerClass} min-w-0`}><Heading dark eyebrow="Controlled recovery work" title="Finance can approve action without surrendering control."><p className="mt-6 max-w-[760px] text-[15px] leading-7 text-[#52616A] sm:text-[17px] sm:leading-8">Margin can carry the agreed investigation, evidence preparation, submission, response management and follow-through. Your team retains the decision rights that belong to the business.</p></Heading><div className="mt-10 grid gap-4 md:grid-cols-3">{[["Review", "Challenge the position, source records and assumptions before action."], ["Approve", "Authorize a defined recovery operation within the agreed scope."], ["Verify", "Keep the outcome open until the financial treatment is checked." ]].map(([title, body]) => <div key={title} className="border-t border-white/30 pt-5"><ShieldCheck className="h-5 w-5 text-[#F05A3C]" /><h3 className="mt-5 font-lora text-[27px] leading-[1.05] tracking-[-0.025em] text-white">{title}</h3><p className="mt-3 text-[14px] leading-6 text-white/70">{body}</p></div>)}</div></div></section>

      <section className="relative overflow-hidden bg-white py-10 sm:py-16 md:py-22"><div className={`${containerClass} min-w-0`}><Heading eyebrow="What Finance receives" title="A position your team can inspect, challenge and carry forward."><p className="mt-6 max-w-[760px] text-[15px] leading-7 text-[#52616A] sm:text-[17px] sm:leading-8">Margin helps distinguish established findings, potential recovery opportunities, apparently resolved matters, unresolved questions and recommended next steps. The output is not a longer list of claims. It is a clearer basis for deciding what deserves attention.</p></Heading><div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{["Source-backed findings", "Supported exposure", "Accounted-for value", "Open exceptions"].map((item, index) => <div key={item} className="border border-[#DCE3E1] bg-[#F7F8F7] p-5"><Check className="h-5 w-5 text-[#26734D]" /><p className="mt-7 font-lora text-[22px] leading-[1.08] tracking-[-0.025em] text-[#182026]">{item}</p><span className="mt-4 block font-mono text-[10px] text-[#8B857F]">Finance review point 0{index + 1}</span></div>)}</div></div></section>

      <section className="relative overflow-hidden bg-[#F5F6F4] py-12 sm:py-20 md:py-28"><div className={`${containerClass} text-center`}><h2 className="mx-auto max-w-[820px] font-lora text-[38px] font-normal leading-[1.02] tracking-[-0.05em] text-[#182026] sm:text-[54px] md:text-[68px]">Give Finance a defensible position—not another investigation to rebuild.</h2><p className="mx-auto mt-6 max-w-[680px] text-[15px] leading-7 text-[#52616A] sm:text-[17px] sm:leading-8">Start with the available records. Establish what happened, what is supported and what still needs attention. Then decide what should happen next.</p><div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"><Link to="/review-consent" className={primaryCtaClass}>Start a Free Financial Position Review <ArrowRight className="h-4 w-4" /></Link><Link to="/contact" className={secondaryCtaClass}>Talk to Margin <ChevronRight className="h-4 w-4" /></Link></div></div></section>
      <AudienceCapabilitySections audience="finance" />
      <AudienceAlignmentSections audience="finance" />
      <AudienceFaqSection audience="finance" />
    </main>
    <BrandFooter wide />
  </div>;
}
