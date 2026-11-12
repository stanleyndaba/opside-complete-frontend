import type { ReactNode } from "react";
import { ArrowRight, Check, ChevronRight, CircleAlert, ShieldCheck } from "lucide-react";
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

const founderReality = [
  "Revisiting old Amazon cases to understand what actually happened.",
  "Following up on reimbursements that appear approved but still need financial verification.",
  "Asking Operations or Finance to investigate issues across different records.",
  "Trying to determine whether an unresolved amount warrants further action.",
  "Carrying questions forward because the business has more urgent demands.",
];

const findings = [
  ["Established findings", "What the available records support."],
  ["Potential recovery opportunities", "Issues that may warrant a recovery process."],
  ["Apparently resolved matters", "Issues for which the records indicate a financial outcome has been recorded."],
  ["Unresolved questions", "Matters that cannot yet be conclusively explained."],
  ["Recommended next steps", "Where further investigation or action may be justified."],
];

const process = [
  ["Submit your records", "Provide the relevant Amazon reports for the agreed audit scope."],
  ["Margin investigates", "We examine the available records and assess what they establish."],
  ["Receive your findings", "You see what appears resolved, what remains unresolved and what may warrant further work."],
  ["Decide what happens next", "If the findings justify further work, we explain the proposed scope and commercial terms. You decide whether to proceed."],
];

function SectionHeading({ eyebrow, title, children, dark = false }: { eyebrow?: string; title: string; children?: ReactNode; dark?: boolean }) {
  return <div className="max-w-[840px]">
    {eyebrow ? <p className="font-mono text-[9px] leading-4 font-normal uppercase tracking-tight text-[#F05A3C] sm:text-[10px]">{eyebrow}</p> : null}
    <h2 className="mt-3 font-lora text-[34px] font-normal leading-[1.03] tracking-[-0.045em] text-[#182026] sm:text-[46px] md:text-[58px]">{title}</h2>
    {children}
  </div>;
}

export default function FounderLed() {
  usePageMeta({
    title: "Founder-led Amazon Businesses | Margin",
    description: "Margin takes on the investigation behind unresolved Amazon financial questions so founders can focus on running the business.",
    url: `${SITE_META.url}/founder-led`,
    image: SITE_META.image,
  });

  return <div className="landing-page landing-google-sans min-h-screen overflow-x-hidden bg-white text-[#182026] selection:bg-[#0B74DE]/16 selection:text-[#182026]">
    <PublicNavbar variant="light" wide />
    <main>
      <section className="relative overflow-hidden bg-white py-8 sm:py-16 md:py-24">
        <div className={`${containerClass} min-w-0 grid items-center gap-8 lg:grid-cols-[minmax(0,1.08fr)_minmax(360px,0.92fr)] lg:gap-20`}>
          <div>
            <p className="font-mono text-[9px] leading-4 font-normal uppercase tracking-tight text-[#F05A3C] sm:text-[10px]">Founder-led Amazon Businesses</p>
            <h1 className="mt-4 max-w-[760px] font-lora text-[42px] font-normal leading-[0.99] tracking-[-0.05em] text-[#182026] sm:text-[58px] md:text-[72px]">You built the business. You shouldn&apos;t have to investigate every Amazon financial issue yourself.</h1>
            <p className="mt-7 max-w-[680px] text-[16px] leading-8 text-[#52616A] sm:text-[18px]">Running an Amazon business already means managing people, inventory, cash flow, customers and growth. But when reimbursements, inventory issues, fees or settlement questions need investigating, the responsibility often finds its way back to you.</p>
            <p className="mt-5 max-w-[680px] text-[16px] font-semibold leading-8 text-[#294B61] sm:text-[18px]">Margin investigates what happened, establishes what the available records support, and takes justified recovery work through to its financial outcome—so you can focus on running the business.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center"><Link to="/review-consent" className={primaryCtaClass}>Review My Business <ArrowRight className="h-4 w-4" /></Link><a href="#investigates" className={secondaryCtaClass}>See What Margin Investigates <ChevronRight className="h-4 w-4" /></a></div>
            <p className="mt-5 max-w-[620px] text-[12px] leading-5 text-[#7A858A]">Start with your existing Amazon records. Understand what needs attention before deciding whether further work is worthwhile.</p>
          </div>
          <div className="relative w-full min-w-0 max-w-full min-h-[300px] overflow-hidden rounded-[8px] bg-[#E9E9E5] sm:min-h-[440px]">
            <img src="/abstract-object-02.png" alt="Founder-led Amazon business financial oversight" className="absolute inset-0 h-full w-full max-w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-black/10 to-black/75" />
            <div className="absolute inset-x-6 bottom-6 text-white sm:inset-x-8 sm:bottom-8"><span className="inline-flex rounded-[3px] bg-white/80 px-3 py-1.5 text-[11px] font-semibold text-[#273036]">Founder-led</span><p className="mt-4 max-w-[360px] font-lora text-[27px] leading-[1.06] tracking-[-0.035em] sm:text-[34px]">Run the business without carrying every financial investigation yourself.</p></div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#F5F6F4] py-10 sm:py-16 md:py-22"><div className={`${containerClass} min-w-0`}><SectionHeading eyebrow="Operating reality" title="You have enough to manage without becoming your own recovery department."><p className="mt-6 max-w-[760px] text-[15px] leading-7 text-[#52616A] sm:text-[17px] sm:leading-8">As the business grows, Amazon generates an ongoing stream of inventory events, returns, fees, adjustments, reimbursements and settlement activity. Some issues are straightforward. Others require reports to be compared, case histories reviewed, evidence assembled and financial outcomes checked. That work still has to happen—even when nobody has clear ownership of it.</p></SectionHeading><div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">{founderReality.map((item, index) => <div key={item} className="border-t border-[#D8DEDA] pt-4"><span className="font-mono text-[10px] text-[#8B857F]">0{index + 1}</span><p className="mt-3 text-[14px] leading-6 text-[#36454D]">{item}</p></div>)}</div><p className="mt-10 max-w-[720px] font-lora text-[23px] leading-[1.12] tracking-[-0.03em] text-[#182026] sm:text-[30px]">The problem isn&apos;t that you aren&apos;t paying attention. It&apos;s that attention alone doesn&apos;t create the time or process required to investigate everything properly.</p></div></section>

      <section className="relative overflow-hidden bg-white py-10 sm:py-16 md:py-22"><div className={`${containerClass} grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24`}><SectionHeading eyebrow="Returning burden" title="An issue doesn&apos;t stop consuming your time just because Amazon has closed the case." /><div className="max-w-[700px] text-[15px] leading-7 text-[#52616A] sm:text-[17px] sm:leading-8"><p>Consider an inventory issue. A unit goes missing. A case is opened. Amazon reviews it and records a decision. A reimbursement may follow.</p><p className="mt-5">But what if the reimbursement is difficult to trace? What if the amount needs checking? What if the original event and the financial outcome don&apos;t appear to line up?</p><p className="mt-5 font-semibold text-[#294B61]">Someone still needs to establish what happened.</p><p className="mt-5">That someone often becomes you—or a member of your team who already has other responsibilities.</p><p className="mt-5">Margin takes on the investigation within the agreed scope, distinguishing what the records establish from what remains uncertain and what may warrant further action.</p></div></div></section>

      <section className="relative overflow-hidden bg-[#F5F6F4] py-10 sm:py-16 md:py-22"><div className={`${containerClass} grid gap-8 lg:grid-cols-[1fr_1fr] lg:gap-20`}><SectionHeading eyebrow="The missing owner" title="You don&apos;t necessarily need another dashboard. You need someone to take the investigation further." /><div className="max-w-[680px] text-[15px] leading-7 text-[#52616A] sm:text-[17px] sm:leading-8"><p>Amazon provides reports and case information. Recovery services can help pursue eligible claims. Accounting tools record and reconcile financial activity. Your team understands how the business operates.</p><p className="mt-5">Each plays an important role.</p><p className="mt-5">But when a particular financial question requires someone to connect the original event, supporting records, Amazon&apos;s decision and the resulting financial activity, the investigation still needs an owner.</p><p className="mt-5 font-semibold text-[#294B61]">Margin is designed to take responsibility for that investigative work—not replace the systems and people already supporting your business.</p></div></div></section>

      <section id="investigates" className="relative overflow-hidden bg-white py-10 sm:py-16 md:py-22"><div className={`${containerClass} min-w-0`}><SectionHeading eyebrow="What Margin takes on" title="From the original issue to an explainable outcome."><p className="mt-6 max-w-[760px] text-[15px] leading-7 text-[#52616A] sm:text-[17px] sm:leading-8">Margin examines the relevant records to establish:</p></SectionHeading><div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-5">{["What happened in the first place.", "What Amazon recorded or decided.", "Whether supporting evidence is available.", "Whether a reimbursement or other financial outcome can be identified in the records.", "What appears resolved, what remains unresolved and what may justify further investigation."].map((item, index) => <div key={item} className="flex min-h-[150px] flex-col justify-between border-t-2 border-[#F05A3C] bg-[#F7F8F7] p-5"><span className="font-mono text-[10px] text-[#8B857F]">0{index + 1}</span><p className="mt-8 text-[15px] font-semibold leading-6 text-[#182026]">{item}</p></div>)}</div><p className="mt-9 max-w-[720px] text-[15px] leading-7 text-[#52616A] sm:text-[17px] sm:leading-8">Where the evidence supports recovery work, Margin establishes the next steps and proceeds only within the agreed scope and approval requirements.</p><p className="mt-5 max-w-[680px] font-lora text-[24px] leading-[1.1] tracking-[-0.03em] text-[#182026] sm:text-[30px]">You don&apos;t have to turn every possible issue into a claim. You need to know which issues deserve attention and why.</p></div></section>

      <section className="relative overflow-hidden bg-[#F5F6F4] py-10 sm:py-16 md:py-22"><div className={`${containerClass} min-w-0`}><SectionHeading eyebrow="What you get back" title="A clearer picture of what needs your attention—and what doesn&apos;t." /><div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-5">{findings.map(([title, body]) => <div key={title} className="border border-[#DCE3E1] bg-white p-5"><Check className="h-5 w-5 text-[#26734D]" /><h3 className="mt-6 text-[15px] font-semibold leading-5 text-[#182026]">{title}</h3><p className="mt-3 text-[13px] leading-5 text-[#667177]">{body}</p></div>)}</div><p className="mt-9 max-w-[760px] text-[15px] leading-7 text-[#52616A] sm:text-[17px] sm:leading-8">Your Free Financial Position Review is designed to give you an evidence-based starting point. The purpose isn&apos;t to produce the longest possible list of claims. It&apos;s to give you a useful basis for deciding what deserves attention.</p></div></section>

      <section className="relative overflow-hidden bg-[#F5F6F4] py-10 text-[#182026] sm:py-20 md:py-24"><div className={`${containerClass} min-w-0`}><SectionHeading dark eyebrow="Why Margin" title="You shouldn&apos;t have to manage the investigation as well as the business."><p className="mt-6 max-w-[760px] text-[15px] leading-7 text-[#52616A] sm:text-[17px] sm:leading-8">Margin follows a disciplined process:</p></SectionHeading><div className="mt-8 flex flex-wrap items-center gap-x-3 gap-y-3 text-[13px] font-semibold text-[#182026] sm:text-[16px]">{["DETECT", "INVESTIGATE", "EVIDENCE", "DETERMINE", "APPROVE", "ACT", "RECOVER", "RECONCILE"].map((item, index, items) => <span key={item} className="inline-flex items-center gap-3"><span>{item}</span>{index < items.length - 1 ? <ArrowRight className="h-4 w-4 text-[#F05A3C]" /> : null}</span>)}</div><p className="mt-9 max-w-[760px] text-[15px] leading-7 text-[#52616A] sm:text-[17px] sm:leading-8">That means investigating before drawing conclusions, establishing evidence before making claims, respecting your approval boundaries and following justified recovery work towards its financial outcome.</p><p className="mt-6 max-w-[700px] font-lora text-[25px] leading-[1.1] tracking-[-0.03em] text-[#182026] sm:text-[34px]">The objective is not to create more work for you. It is to take appropriate work off your plate while keeping you informed and in control.</p></div></section>

      <section className="relative overflow-hidden bg-white py-10 sm:py-16 md:py-22"><div className={`${containerClass} grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-24`}><SectionHeading eyebrow="Your business. Your records. Your approval." title="Hand over the investigation, not control of your business." /><div className="max-w-[680px] text-[15px] leading-7 text-[#52616A] sm:text-[17px] sm:leading-8"><p>You should understand what Margin is examining, what the findings support and what would happen next.</p><p className="mt-6 font-semibold text-[#294B61]">The engagement should establish:</p><div className="mt-4 space-y-3">{["Which records and accounts are within scope.", "What Margin will investigate.", "What findings and deliverables you can expect.", "Which actions require your approval.", "How information is accessed and handled."].map((item) => <div key={item} className="flex items-start gap-3"><ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-[#26734D]" /><span>{item}</span></div>)}</div><p className="mt-7">Margin does not treat a possible recovery as permission to act. Recovery work proceeds within the agreed scope and required seller approvals.</p></div></div></section>

      <section className="relative overflow-hidden bg-[#F5F6F4] py-10 sm:py-16 md:py-22"><div className={`${containerClass} min-w-0`}><SectionHeading eyebrow="Start without committing to paid work" title="First, find out whether there&apos;s anything worth pursuing." /><div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">{process.map(([title, body], index) => <div key={title} className="relative border-t border-[#C9D4D0] pt-5"><span className="font-mono text-[10px] text-[#8B857F]">0{index + 1}</span><h3 className="mt-5 font-lora text-[23px] leading-[1.08] tracking-[-0.025em] text-[#182026]">{title}</h3><p className="mt-4 text-[14px] leading-6 text-[#667177]">{body}</p></div>)}</div><p className="mt-9 max-w-[720px] text-[15px] font-semibold leading-7 text-[#294B61] sm:text-[17px] sm:leading-8">There is no obligation to purchase a paid service after the audit.</p></div></section>

      <section className="relative overflow-hidden bg-white py-12 sm:py-20 md:py-28"><div className={`${containerClass} text-center`}><CircleAlert className="mx-auto h-8 w-8 text-[#F05A3C]" /><h2 className="mx-auto mt-5 max-w-[820px] font-lora text-[38px] font-normal leading-[1.02] tracking-[-0.05em] text-[#182026] sm:text-[54px] md:text-[68px]">You have a business to grow. Let Margin take on the investigation.</h2><p className="mx-auto mt-6 max-w-[680px] text-[15px] leading-7 text-[#52616A] sm:text-[17px] sm:leading-8">Unresolved Amazon financial questions shouldn&apos;t have to compete indefinitely with the responsibilities that move your business forward.</p><p className="mx-auto mt-5 max-w-[680px] font-lora text-[22px] leading-[1.12] tracking-[-0.03em] text-[#294B61] sm:text-[28px]">Start with the records. Understand the findings. Decide what happens next.</p><div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"><Link to="/review-consent" className={primaryCtaClass}>Review My Business <ArrowRight className="h-4 w-4" /></Link><a href="#investigates" className={secondaryCtaClass}>See What Margin Investigates <ChevronRight className="h-4 w-4" /></a></div></div></section>
      <AudienceCapabilitySections audience="founder" />
      <AudienceAlignmentSections audience="founder" />
      <AudienceFaqSection audience="founder" />
    </main>
    <BrandFooter wide />
  </div>;
}
