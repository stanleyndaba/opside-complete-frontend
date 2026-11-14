import React from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  Check,
  ClipboardCheck,
  FileCheck2,
  History,
  MessageSquareText,
  ShieldCheck,
  Timer,
} from 'lucide-react';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { BrandFooter } from '@/components/layout/BrandFooter';
import { ExploreMoreWorkflows } from '@/components/landing/ExploreMoreWorkflows';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SITE_META } from '@/config/site';

const controlRows = [
  ['Keeps the full case history connected', 'Margin maintains the relationship between the original discrepancy, the claim, supporting evidence, submitted responses, marketplace communications and subsequent decisions.', History],
  ['Establishes what the decision means', 'A rejection is not automatically proof that the original discrepancy was invalid. Margin examines the decision against the original case and supporting records.', FileCheck2],
  ['Identifies what the next response needs', 'When additional information is requested or an appeal is justified, Margin connects the response to the specific question or decision being addressed.', ClipboardCheck],
  ['Keeps deadlines and next actions visible', 'A response opportunity can be time-sensitive. The deadline is treated as a decision point: what needs to happen, what evidence is available, and whether the case is ready.', Timer],
  ['Carries the case through to its outcome', 'Margin maintains the case through subsequent decisions, additional requests and resulting financial outcomes. Seller approval remains part of the action process.', ShieldCheck],
] as const;

const decisionReasons = [
  'Missing or insufficient evidence.',
  'An incorrect or incomplete factual assessment.',
  'A policy or eligibility issue.',
  'Information that was not previously considered.',
  'A decision that does not appear to address the evidence submitted.',
];

const caseTimeline = [
  ['01', 'Original discrepancy identified', 'An inventory event indicates that units expected to be accounted for are not reflected in the expected financial outcome.'],
  ['02', 'Claim submitted', 'The case is supported with the available shipment, inventory and transaction records.'],
  ['03', 'Amazon issues a rejection', 'The decision cites insufficient supporting information.'],
  ['04', 'Margin re-examines the case', 'The original evidence is reviewed against the rejection reason and additional records are identified where available.'],
  ['05', 'The next action is determined', 'If new evidence supports a challenge and the appeal window remains open, Margin prepares the response for seller review and approval.'],
  ['06', 'The outcome is tracked', 'The subsequent decision is connected to the original case and its financial position.'],
];

const comparisonRows = [
  ['Track a case status', 'Preserve the case’s evidence and decision history'],
  ['Notify a team about a deadline', 'Establish what action is required and why'],
  ['Prepare an appeal', 'Assess whether the evidence supports challenging the decision'],
  ['Submit additional documents', 'Connect each supporting record to the issue being addressed'],
  ['Mark a case as appealed', 'Track the subsequent decision and financial outcome'],
];

const ResponseAppealsManagement = () => {
  usePageMeta({
    title: 'Response & Appeals Management | Margin',
    description: 'Keep Amazon responses, appeals, case history and supporting evidence connected so the next action is informed, supported and timely.',
    url: `${SITE_META.url}/response-appeals-management`,
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
              <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">Response and appeals management</p>
              <h1 className="max-w-[790px] font-lora text-[45px] font-normal leading-[0.99] tracking-[-0.055em] text-[#30343B] sm:text-[62px] md:text-[78px]">Make every response count. Give every appeal a stronger case.</h1>
              <p className="mt-7 max-w-[710px] text-[17px] leading-8 text-[#667177] sm:text-[19px] sm:leading-9">A claim is not necessarily resolved when it is submitted. Amazon may request further information, reject a claim, or issue a decision that warrants a challenge. Margin keeps the case history, evidence and decision context connected, helping establish what needs to be answered, whether an appeal is justified, and what additional information can support it.</p>
              <p className="mt-5 max-w-[710px] text-[17px] leading-8 text-[#667177] sm:text-[19px] sm:leading-9">The aim is not to appeal everything. It is to make the next response informed, supported and timely.</p>
              <Link to="#case-control" className="mt-8 inline-flex items-center gap-2 rounded-[7px] bg-[#30343B] px-5 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-[#20242A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#30343B]/35 focus-visible:ring-offset-2">See how response control works <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            </div>

            <div className="relative min-h-[380px] md:min-h-[460px]">
              <div className="absolute left-[13%] top-[7%] h-[86%] w-px bg-gradient-to-b from-[#DCE2E2] via-[#6B8581] to-[#30343B]" />
              <div className="absolute left-[7%] top-[7%] flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7A858A]"><span className="h-3 w-3 rounded-full border-2 border-[#6B8581] bg-white" /> Original case</div>
              <div className="absolute left-[7%] top-[31%] flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7A858A]"><span className="h-3 w-3 rounded-full border-2 border-[#6B8581] bg-white" /> Marketplace response</div>
              <div className="absolute left-[7%] top-[55%] flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7A858A]"><span className="h-3 w-3 rounded-full border-2 border-[#6B8581] bg-white" /> Evidence re-examined</div>
              <div className="absolute left-[7%] top-[79%] flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7A858A]"><span className="h-3 w-3 rounded-full border-2 border-[#30343B] bg-[#30343B]" /> Next action controlled</div>
              <div className="absolute left-[29%] top-[13%] right-0 border-t border-[#DCE2E2]" />
              <div className="absolute left-[29%] top-[37%] right-[9%] border-t border-[#DCE2E2]" />
              <div className="absolute left-[29%] top-[61%] right-[17%] border-t border-[#DCE2E2]" />
              <div className="absolute bottom-[9%] left-[29%] right-[2%] border-t border-[#30343B]" />
              <div className="absolute left-[31%] top-[8%] text-[14px] leading-6 text-[#667177]">Case history<br /><span className="font-semibold text-[#30343B]">Discrepancy · claim · evidence</span></div>
              <div className="absolute left-[31%] top-[32%] text-[14px] leading-6 text-[#667177]">Decision context<br /><span className="font-semibold text-[#30343B]">Rejected · insufficient support</span></div>
              <div className="absolute left-[31%] top-[56%] text-[14px] leading-6 text-[#667177]">Response basis<br /><span className="font-semibold text-[#30343B]">What changed · what remains missing</span></div>
              <div className="absolute bottom-[3%] left-[31%] max-w-[235px] text-[14px] leading-6 text-[#30343B]">Controlled next step<br /><span className="font-semibold text-[#5C7773]">Appeal justified · seller approval required</span></div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#E1E5E5] bg-[#F4F5F4] py-16 sm:py-20 md:py-28"><div className="mx-auto grid w-full max-w-[1280px] gap-10 px-5 sm:px-6 md:grid-cols-[0.75fr_1.25fr] md:gap-16 md:px-8 lg:px-10 2xl:px-12"><div className="max-w-[520px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">The response problem</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">A seller submits a claim. Then the process continues.</h2></div><div className="max-w-[720px] text-[16px] leading-8 text-[#667177] sm:text-[17px] sm:leading-9"><p>Amazon may request clarification or additional records. A claim may be partially approved, rejected, or closed. A decision may be challengeable, but only within a particular period and sometimes only once.</p><p className="mt-5">At that point, the seller needs more than the original claim submission.</p><p className="mt-5">They need to understand what Amazon actually decided, what reason was given, what evidence was already submitted, what information is still missing, whether the decision warrants a response or appeal, whether new evidence supports challenging it, what the applicable deadline is, and what happened after the response was submitted.</p><p className="mt-6 font-semibold text-[#30343B]">Without a connected case history, these questions can become another investigation. The cost is the risk of losing a valid recovery opportunity because the next action was incomplete, unsupported or late.</p></div></div></section>

        <section id="case-control" className="scroll-mt-24 bg-white py-16 sm:py-20 md:py-28"><div className="mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12"><div className="grid gap-12 md:grid-cols-[0.72fr_1.28fr] md:gap-16"><div className="max-w-[520px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">Evidence-led response control</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">What Margin does.</h2><p className="mt-5 text-[16px] leading-7 text-[#667177] sm:text-[17px] sm:leading-8">Margin connects each response to the history, decision, evidence and financial outcome that give it meaning.</p></div><div className="border-t border-[#DDE2E1]">{controlRows.map(([title, body, Icon]) => <div key={title} className="grid gap-4 border-b border-[#DDE2E1] py-6 sm:grid-cols-[42px_0.86fr_1.14fr] sm:items-center sm:gap-6"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F0F2F1] text-[#30343B]"><Icon className="h-5 w-5" strokeWidth={1.5} /></div><h3 className="text-[16px] font-semibold tracking-[-0.02em] text-[#30343B] sm:text-[17px]">{title}</h3><p className="text-[14px] leading-6 text-[#667177]">{body}</p></div>)}</div></div></div></section>

        <section className="border-y border-[#E1E5E5] bg-[#F4F5F4] py-16 sm:py-20 md:py-28"><div className="mx-auto grid w-full max-w-[1280px] gap-12 px-5 sm:px-6 md:grid-cols-[0.72fr_1.28fr] md:gap-16 md:px-8 lg:px-10 2xl:px-12"><div className="max-w-[520px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">Decision context</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">A rejection is not automatically the end of the investigation.</h2><p className="mt-5 text-[16px] leading-7 text-[#667177] sm:text-[17px] sm:leading-8">Nor does disagreement automatically make an appeal worthwhile.</p></div><div className="max-w-[720px]"><p className="text-[16px] leading-8 text-[#667177] sm:text-[17px] sm:leading-9">Margin examines available decision information against the original case and supporting records to help establish whether the issue relates to:</p><div className="mt-8 grid gap-0 border-t border-[#DDE2E1]">{decisionReasons.map((reason) => <div key={reason} className="flex items-start gap-3 border-b border-[#DDE2E1] py-4 text-[15px] leading-6 text-[#30343B] sm:text-[16px]"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#5C7773]" strokeWidth={2} /><span>{reason}</span></div>)}</div><p className="mt-8 border-l-2 border-[#5C7773] pl-4 text-[15px] font-semibold leading-7 text-[#30343B] sm:text-[17px] sm:leading-8">Where the available records do not establish a basis for further action, that uncertainty remains visible rather than being presented as an appeal opportunity.</p></div></div></section>

        <section className="bg-white py-16 sm:py-20 md:py-28"><div className="mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12"><div className="max-w-[780px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">Illustrative case workflow</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">A rejected claim is not the end of the investigation.</h2><p className="mt-5 text-[16px] leading-7 text-[#667177] sm:text-[17px] sm:leading-8">The case continues through the decision, the evidence gap, the next controlled action and the resulting financial position.</p></div><div className="relative mt-12 grid gap-8 border-t border-[#DDE2E1] pt-8 sm:grid-cols-3 sm:gap-x-0 sm:gap-y-10 sm:border-t-0 sm:pt-0">{caseTimeline.map(([number, title, body], index) => <div key={number} className={`relative ${index % 3 !== 0 ? 'sm:border-l sm:border-[#DDE2E1] sm:pl-6' : ''} ${index % 3 !== 2 ? 'sm:pr-6' : ''}`}><span className="text-[11px] font-semibold tracking-[0.16em] text-[#7A858A]">{number}</span><h3 className="mt-4 text-[16px] font-semibold text-[#30343B]">{title}</h3><p className="mt-3 text-[14px] leading-6 text-[#667177]">{body}</p></div>)}</div></div></section>

        <section className="border-y border-[#E1E5E5] bg-[#F4F5F4] py-16 sm:py-20 md:py-28"><div className="mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12"><div className="max-w-[760px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">Why this is different</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">Stop rebuilding the case every time Amazon responds.</h2><p className="mt-5 text-[16px] leading-7 text-[#667177] sm:text-[17px] sm:leading-8">A case-management tool can show that a response is due. An appeal service can help prepare a submission. Neither capability, by itself, establishes whether the underlying case has been properly investigated.</p><p className="mt-5 text-[16px] leading-7 text-[#667177] sm:text-[17px] sm:leading-8">Margin’s responsibility is to connect the response to the financial and operational evidence that produced the original case.</p></div><div className="mt-12 overflow-x-auto border-t border-[#DDE2E1]"><div className="min-w-[680px]"><div className="grid grid-cols-[0.85fr_1.15fr] border-b border-[#DDE2E1] py-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#7A858A]"><span>Typical response workflow</span><span>Margin’s intended responsibility</span></div>{comparisonRows.map(([typical, margin]) => <div key={typical} className="grid grid-cols-[0.85fr_1.15fr] border-b border-[#DDE2E1] py-5 text-[14px] leading-6"><span className="pr-8 text-[#667177]">{typical}</span><span className="font-semibold text-[#30343B]">{margin}</span></div>)}</div></div><p className="mt-9 max-w-[820px] border-l-2 border-[#5C7773] pl-4 text-[15px] font-semibold leading-7 text-[#30343B] sm:text-[17px] sm:leading-8">Margin is not trying to maximise the number of appeals. It is trying to improve the quality and control of the decisions that lead to them.</p></div></section>

        <section className="bg-white py-16 sm:py-20 md:py-28"><div className="mx-auto grid w-full max-w-[1280px] gap-12 px-5 sm:px-6 md:grid-cols-[0.75fr_1.25fr] md:gap-16 md:px-8 lg:px-10 2xl:px-12"><div className="max-w-[520px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">The commercial outcome</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">Keep the case, evidence, responses and outcomes connected.</h2></div><div className="max-w-[720px] text-[16px] leading-8 text-[#667177] sm:text-[17px] sm:leading-9"><p>Your team should not have to start another investigation every time a decision changes.</p><p className="mt-5">Margin keeps the case, evidence, responses and outcomes connected, helping your business understand what happened, what can still be done, and whether the financial matter has actually been resolved.</p><div className="mt-7 flex items-start gap-3 border-t border-[#DDE2E1] pt-5 text-[14px] leading-6 text-[#667177]"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#5C7773]" strokeWidth={1.7} />Response and appeal control remains evidence-led, time-aware and subject to seller approval.</div></div></div></section>

        <section className="border-t border-[#E1E5E5] bg-[#F4F5F4] py-20 sm:py-24 md:py-32"><div className="mx-auto flex w-full max-w-[900px] flex-col items-center px-5 text-center sm:px-6"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#30343B]"><MessageSquareText className="h-6 w-6" strokeWidth={1.5} /></div><p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">Establish the financial position</p><h2 className="mt-4 font-lora text-[38px] font-normal leading-[1.04] tracking-[-0.05em] text-[#30343B] sm:text-[52px]">Know what happened after Amazon responded.</h2><p className="mt-5 max-w-[700px] text-[16px] leading-7 text-[#667177] sm:text-[17px] sm:leading-8">Margin helps keep responses, evidence, decisions and financial outcomes connected so your team can establish what remains actionable and what has actually been resolved.</p><Link to="/audit-start" className="mt-8 inline-flex items-center gap-2 rounded-[7px] bg-[#635BFF] px-5 py-3 text-[13px] font-semibold text-white shadow-[0_12px_26px_rgba(99,91,255,0.18)] transition-colors hover:bg-[#5148E5]">Establish Your Financial Position <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div></section>
      <ExploreMoreWorkflows />
      </main>
      <BrandFooter wide />
    </div>
  );
};

export default ResponseAppealsManagement;
