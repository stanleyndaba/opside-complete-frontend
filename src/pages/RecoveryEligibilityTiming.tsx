import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarClock,
  Check,
  CircleAlert,
  Clock3,
  FileCheck2,
  Scale,
  ShieldCheck,
} from 'lucide-react';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { BrandFooter } from '@/components/layout/BrandFooter';
import { ExploreMoreWorkflows } from '@/components/landing/ExploreMoreWorkflows';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SITE_META } from '@/config/site';

const eligibilityChecks = [
  ['Recovery category', 'Whether the event falls within an applicable recovery category.', Scale],
  ['Window remains open', 'Whether the relevant submission or investigation window remains open.', Clock3],
  ['Evidence support', 'Whether the available records support the potential claim.', FileCheck2],
  ['Additional records', 'Whether additional evidence is required before a defensible decision.', CircleAlert],
  ['Already addressed', 'Whether a previous claim, reimbursement or adjustment has addressed the issue.', Check],
  ['Worth pursuing', 'Whether the potential recovery justifies further action.', ShieldCheck],
] as const;

const priorityStates = [
  ['Approaching deadlines', 'Potential opportunities where the applicable time window may be narrowing.', 'Act sooner'],
  ['Evidence still required', 'Findings that need additional records before a defensible recovery decision can be made.', 'Complete the record'],
  ['Ready for assessment', 'Opportunities with sufficient information to determine whether recovery action is justified.', 'Assess now'],
  ['Already addressed or no longer actionable', 'Subsequent records or applicable conditions indicate further recovery action may not be warranted.', 'Keep visible'],
];

const distinctions = [
  ['Eligibility', 'Does the event satisfy the relevant recovery requirements?'],
  ['Timing', 'Is the applicable recovery window still open?'],
  ['Evidence', 'Can the available records substantiate the issue?'],
  ['Financial status', 'Has the amount already been accounted for or recovered?'],
  ['Action', 'Is there a justified next step?'],
];

const RecoveryEligibilityTiming = () => {
  usePageMeta({
    title: 'Recovery Eligibility & Timing | Margin',
    description: 'Understand what Amazon recovery opportunities may still qualify, which evidence is required, and when action needs to be prioritised.',
    url: `${SITE_META.url}/recovery-eligibility-timing`,
    image: SITE_META.image,
  });

  return (
    <div className="workflow-page min-h-screen bg-[#F7F8F7] text-[#30343B]">
      <PublicNavbar variant="light" />
      <main>
        <section className="relative overflow-hidden bg-white pb-16 pt-32 sm:pb-20 sm:pt-40 md:pb-28 md:pt-48">
          <div className="pointer-events-none absolute right-[-15%] top-[-18%] h-[580px] w-[580px] rounded-full bg-[#ECEFF0] blur-3xl" />
          <div className="mx-auto grid w-full max-w-[1280px] gap-14 px-5 sm:px-6 md:grid-cols-[minmax(0,1.03fr)_minmax(360px,0.77fr)] md:items-center md:gap-16 md:px-8 lg:px-10 2xl:px-12">
            <div className="relative max-w-[790px]">
              <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">Recovery eligibility and timing</p>
              <h1 className="max-w-[790px] font-lora text-[45px] font-normal leading-[0.99] tracking-[-0.055em] text-[#30343B] sm:text-[62px] md:text-[78px]">Know what you can still recover—and when you need to act.</h1>
              <p className="mt-7 max-w-[710px] text-[17px] leading-8 text-[#667177] sm:text-[19px] sm:leading-9">A financial discrepancy may be genuine, but that doesn't automatically mean it can still be recovered. Eligibility requirements, supporting evidence and marketplace deadlines can determine whether an opportunity remains actionable.</p>
              <p className="mt-5 max-w-[710px] text-[17px] leading-8 text-[#667177] sm:text-[19px] sm:leading-9">Margin evaluates identified discrepancies against relevant recovery conditions and applicable time windows, helping you understand which opportunities may qualify, what evidence is required and where action should be prioritised.</p>
              <Link to="#eligibility-checks" className="mt-8 inline-flex items-center gap-2 rounded-[7px] bg-[#30343B] px-5 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-[#20242A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#30343B]/35 focus-visible:ring-offset-2">Assess Your Recovery Opportunities <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            </div>

            <div className="relative min-h-[380px] md:min-h-[460px]">
              <div className="absolute left-[13%] top-[7%] h-[86%] w-px bg-gradient-to-b from-[#DCE2E2] via-[#6B8581] to-[#30343B]" />
              <div className="absolute left-[7%] top-[7%] flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7A858A]"><span className="h-3 w-3 rounded-full border-2 border-[#6B8581] bg-white" /> Original event</div>
              <div className="absolute left-[7%] top-[31%] flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7A858A]"><span className="h-3 w-3 rounded-full border-2 border-[#6B8581] bg-white" /> Evidence found</div>
              <div className="absolute left-[7%] top-[55%] flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7A858A]"><span className="h-3 w-3 rounded-full border-2 border-[#6B8581] bg-white" /> Eligibility assessed</div>
              <div className="absolute left-[7%] top-[79%] flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7A858A]"><span className="h-3 w-3 rounded-full border-2 border-[#30343B] bg-[#30343B]" /> Action prioritised</div>
              <div className="absolute left-[29%] top-[13%] right-0 border-t border-[#DCE2E2]" />
              <div className="absolute left-[29%] top-[37%] right-[9%] border-t border-[#DCE2E2]" />
              <div className="absolute left-[29%] top-[61%] right-[17%] border-t border-[#DCE2E2]" />
              <div className="absolute bottom-[9%] left-[29%] right-[2%] border-t border-[#30343B]" />
              <div className="absolute left-[31%] top-[8%] text-[14px] leading-6 text-[#667177]">Shipment received<br /><span className="font-semibold text-[#30343B]">Expected 4,800 · received 4,200</span></div>
              <div className="absolute left-[31%] top-[32%] text-[14px] leading-6 text-[#667177]">Records assembled<br /><span className="font-semibold text-[#30343B]">Inventory, settlement and case history</span></div>
              <div className="absolute left-[31%] top-[56%] text-[14px] leading-6 text-[#667177]">Window and support<br /><span className="font-semibold text-[#30343B]">Open · evidence still required</span></div>
              <div className="absolute bottom-[3%] left-[31%] max-w-[235px] text-[14px] leading-6 text-[#30343B]">Priority state<br /><span className="font-semibold text-[#5C7773]">Action needed before the record ages</span></div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#E1E5E5] bg-[#F4F5F4] py-16 sm:py-20 md:py-28"><div className="mx-auto grid w-full max-w-[1280px] gap-10 px-5 sm:px-6 md:grid-cols-[0.75fr_1.25fr] md:gap-16 md:px-8 lg:px-10 2xl:px-12"><div className="max-w-[520px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">Why timing matters</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">A valid discrepancy can become an unavailable recovery opportunity.</h2></div><div className="max-w-[720px] text-[16px] leading-8 text-[#667177] sm:text-[17px] sm:leading-9"><p>Marketplace discrepancies don't always become visible when they occur.</p><p className="mt-5">A shipment issue, missing inventory movement, unexpected fee or incomplete reimbursement may remain unexplained across reporting periods before anyone investigates it.</p><p className="mt-5">But recovery opportunities can be time-sensitive.</p><p className="mt-5">By the time a discrepancy reaches Finance, the relevant submission window may have narrowed or passed. Evidence may also be harder to retrieve, particularly when the original operational event occurred months earlier.</p><p className="mt-6 font-semibold text-[#30343B]">The question is therefore not only whether something went wrong. It's whether the business can still establish and pursue the appropriate recovery action in time.</p></div></div></section>

        <section id="eligibility-checks" className="scroll-mt-24 bg-white py-16 sm:py-20 md:py-28"><div className="mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12"><div className="grid gap-12 md:grid-cols-[0.72fr_1.28fr] md:gap-16"><div className="max-w-[520px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">The eligibility assessment</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">Understand what makes a discrepancy eligible.</h2><p className="mt-5 text-[16px] leading-7 text-[#667177] sm:text-[17px] sm:leading-8">A potential financial discrepancy must satisfy more than a difference between expected and recorded amounts.</p><p className="mt-5 text-[16px] leading-7 text-[#667177] sm:text-[17px] sm:leading-8">Its recovery eligibility may depend on the nature of the event, applicable Amazon policies, the relevant time window, available evidence and whether the issue has already been addressed.</p></div><div><div className="border-t border-[#DDE2E1]">{eligibilityChecks.map(([title, body, Icon]) => <div key={title} className="grid gap-4 border-b border-[#DDE2E1] py-6 sm:grid-cols-[42px_0.82fr_1.18fr] sm:items-center sm:gap-6"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F0F2F1] text-[#30343B]"><Icon className="h-5 w-5" strokeWidth={1.5} /></div><h3 className="text-[16px] font-semibold tracking-[-0.02em] text-[#30343B] sm:text-[17px]">{title}</h3><p className="text-[14px] leading-6 text-[#667177]">{body}</p></div>)}</div><p className="mt-9 max-w-[720px] border-l-2 border-[#5C7773] pl-4 text-[15px] font-semibold leading-7 text-[#30343B] sm:text-[17px] sm:leading-8">The result is a more informed assessment of what may be recoverable—not an assumption that every discrepancy represents an eligible claim.</p></div></div></div></section>

        <section className="border-y border-[#E1E5E5] bg-[#F4F5F4] py-16 sm:py-20 md:py-28"><div className="mx-auto grid w-full max-w-[1280px] gap-12 px-5 sm:px-6 md:grid-cols-[0.72fr_1.28fr] md:gap-16 md:px-8 lg:px-10 2xl:px-12"><div className="max-w-[520px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">Priority and urgency</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">Know which opportunities need attention first.</h2><p className="mt-5 text-[16px] leading-7 text-[#667177] sm:text-[17px] sm:leading-8">Not every potential recovery opportunity carries the same urgency.</p><p className="mt-5 text-[16px] leading-7 text-[#667177] sm:text-[17px] sm:leading-8">Some may have sufficient time for further investigation. Others may be approaching an applicable deadline and require earlier attention.</p></div><div className="max-w-[720px]"><p className="text-[16px] leading-8 text-[#667177] sm:text-[17px] sm:leading-9">Margin helps assess potential opportunities in the context of their relevant timing constraints, evidence requirements and financial significance.</p><div className="mt-8 grid gap-0 border-t border-[#DDE2E1]">{priorityStates.map(([title, body, action]) => <div key={title} className="grid gap-3 border-b border-[#DDE2E1] py-5 sm:grid-cols-[0.85fr_1.35fr_auto] sm:items-center sm:gap-6"><h3 className="text-[16px] font-semibold text-[#30343B]">{title}</h3><p className="text-[14px] leading-6 text-[#667177]">{body}</p><span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#5C7773]">{action}</span></div>)}</div><p className="mt-8 border-l-2 border-[#5C7773] pl-4 text-[15px] font-semibold leading-7 text-[#30343B] sm:text-[17px] sm:leading-8">Prioritisation should reflect the actual evidence and applicable rules—not simply the size of an estimated amount.</p></div></div></section>

        <section className="bg-white py-16 sm:py-20 md:py-28"><div className="mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12"><div className="max-w-[780px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">A dated investigation</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">Bring the timeline back to the original event.</h2><p className="mt-5 text-[16px] leading-7 text-[#667177] sm:text-[17px] sm:leading-8">Consider an inventory discrepancy.</p></div><div className="relative mt-12 grid gap-8 border-t border-[#DDE2E1] pt-8 sm:grid-cols-4 sm:gap-0 sm:border-t-0 sm:pt-0">{[
          ['01', 'Original event', 'A shipment is received with fewer units than expected.'],
          ['02', 'Uninvestigated period', 'The difference is not immediately investigated while other activity continues.'],
          ['03', 'Finance identifies it', 'Weeks later, the business needs to establish the event and applicable conditions.'],
          ['04', 'Actionable position', 'Margin connects the event history and records to what remains actionable.'],
        ].map(([number, title, body], index) => <div key={number} className={`relative ${index > 0 ? 'sm:border-l sm:border-[#DDE2E1] sm:pl-6' : ''} ${index < 3 ? 'sm:pr-6' : ''}`}><span className="text-[11px] font-semibold tracking-[0.16em] text-[#7A858A]">{number}</span><h3 className="mt-4 text-[16px] font-semibold text-[#30343B]">{title}</h3><p className="mt-3 text-[14px] leading-6 text-[#667177]">{body}</p></div>)}</div><p className="mt-12 max-w-[850px] border-l-2 border-[#5C7773] pl-4 text-[16px] font-semibold leading-7 text-[#30343B] sm:text-[17px] sm:leading-8">The earlier the discrepancy is identified and investigated, the more opportunity there may be to preserve evidence and pursue an eligible recovery.</p></div></section>

        <section className="border-y border-[#E1E5E5] bg-[#F4F5F4] py-16 sm:py-20 md:py-28"><div className="mx-auto grid w-full max-w-[1280px] gap-12 px-5 sm:px-6 md:grid-cols-[0.72fr_1.28fr] md:gap-16 md:px-8 lg:px-10 2xl:px-12"><div className="max-w-[520px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">Keep the questions separate</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">Don't confuse an open deadline with an established claim.</h2></div><div><p className="max-w-[720px] text-[16px] leading-8 text-[#667177] sm:text-[17px] sm:leading-9">An opportunity may fall within an applicable recovery window and still lack sufficient evidence.</p><p className="mt-5 max-w-[720px] text-[16px] leading-8 text-[#667177] sm:text-[17px] sm:leading-9">Equally, a discrepancy may appear significant but already have been resolved through a subsequent adjustment or reimbursement.</p><div className="mt-8 grid gap-0 border-t border-[#DDE2E1]">{distinctions.map(([title, body]) => <div key={title} className="grid gap-3 border-b border-[#DDE2E1] py-4 sm:grid-cols-[130px_1fr] sm:gap-6"><span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#5C7773]">{title}</span><span className="text-[15px] leading-6 text-[#30343B]">{body}</span></div>)}</div><p className="mt-8 border-l-2 border-[#5C7773] pl-4 text-[15px] font-semibold leading-7 text-[#30343B] sm:text-[17px] sm:leading-8">A deadline alone doesn't establish entitlement, and an estimated exposure should never be presented as a guaranteed recovery.</p></div></div></section>

        <section className="bg-white py-16 sm:py-20 md:py-28"><div className="mx-auto grid w-full max-w-[1280px] gap-12 px-5 sm:px-6 md:grid-cols-[0.75fr_1.25fr] md:gap-16 md:px-8 lg:px-10 2xl:px-12"><div className="max-w-[520px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">Controlled follow-through</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">Move eligible opportunities forward while they remain actionable.</h2></div><div className="max-w-[720px] text-[16px] leading-8 text-[#667177] sm:text-[17px] sm:leading-9"><p>Where the evidence supports recovery and the relevant conditions are satisfied, Margin can take the agreed work forward.</p><p className="mt-5">This may include preparing supporting evidence, organising case information, submitting authorised claims, managing responses and pursuing further review or appeals where justified.</p><p className="mt-5">Required seller approval and agreed authority govern consequential actions.</p><p className="mt-5">Margin also examines subsequent available records to establish whether the recovery was reflected financially, whether it was reversed or adjusted, and whether anything remains unresolved.</p><p className="mt-6 font-semibold text-[#30343B]">The objective is not simply to submit before a deadline. It is to pursue justified recovery and understand the financial outcome.</p></div></div></section>

        <section className="border-y border-[#E1E5E5] bg-[#F4F5F4] py-16 sm:py-20 md:py-28"><div className="mx-auto grid w-full max-w-[1280px] gap-12 px-5 sm:px-6 md:grid-cols-[0.75fr_1.25fr] md:gap-16 md:px-8 lg:px-10 2xl:px-12"><div className="max-w-[520px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">Ongoing financial control</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">Make recovery timing part of ongoing financial control.</h2></div><div className="max-w-[720px] text-[16px] leading-8 text-[#667177] sm:text-[17px] sm:leading-9"><p>Recovery eligibility shouldn't only be considered after Finance discovers an old discrepancy.</p><p className="mt-5">As new marketplace activity and records become available, potential issues can be examined against relevant recovery requirements and timing constraints.</p><p className="mt-5">Where supported by the available data and operating cadence, Margin can help keep outstanding opportunities visible, preserve relevant findings and identify matters requiring attention.</p><p className="mt-6 font-semibold text-[#30343B]">This gives your business a better opportunity to investigate earlier, protect supporting evidence and avoid allowing potentially actionable discrepancies to disappear into the next reporting period.</p></div></div></section>

        <section className="bg-white py-20 sm:py-24 md:py-32"><div className="mx-auto flex w-full max-w-[900px] flex-col items-center px-5 text-center sm:px-6"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F0F2F1] text-[#30343B]"><CalendarClock className="h-6 w-6" strokeWidth={1.5} /></div><p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">Establish the financial position</p><h2 className="mt-4 font-lora text-[38px] font-normal leading-[1.04] tracking-[-0.05em] text-[#30343B] sm:text-[52px]">Don't let an unexplained discrepancy become a missed opportunity.</h2><p className="mt-5 max-w-[700px] text-[16px] leading-7 text-[#667177] sm:text-[17px] sm:leading-8">Margin helps establish which financial discrepancies may qualify for recovery, what evidence supports them and when action may be required.</p><p className="mt-4 max-w-[700px] text-[16px] font-semibold leading-7 text-[#30343B] sm:text-[17px] sm:leading-8">Understand the opportunity. Know the applicable timing. Pursue what the evidence justifies.</p><Link to="/audit-start" className="mt-8 inline-flex items-center gap-2 rounded-[7px] bg-[#635BFF] px-5 py-3 text-[13px] font-semibold text-white shadow-[0_12px_26px_rgba(99,91,255,0.18)] transition-colors hover:bg-[#5148E5]">Establish Your Financial Position <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link><p className="mt-5 max-w-[600px] text-[13px] leading-6 text-[#7A858A]">Start with an initial review of your Amazon records. Understand what can be established, which opportunities may warrant recovery and what still needs attention.</p></div></section>
      <ExploreMoreWorkflows />
      </main>
      <BrandFooter wide />
    </div>
  );
};

export default RecoveryEligibilityTiming;
