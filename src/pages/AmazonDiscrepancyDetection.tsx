import React from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CircleDollarSign,
  FileCheck2,
  Layers3,
  Search,
  ShieldCheck,
  Undo2,
} from 'lucide-react';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { BrandFooter } from '@/components/layout/BrandFooter';
import { ExploreMoreWorkflows } from '@/components/landing/ExploreMoreWorkflows';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SITE_META } from '@/config/site';

const detectionSignals = [
  {
    title: 'Inventory discrepancies',
    body: 'Differences between expected and recorded inventory movements.',
    icon: Layers3,
  },
  {
    title: 'Shipment discrepancies',
    body: 'Quantities or fulfilment outcomes that require further examination.',
    icon: Search,
  },
  {
    title: 'Unexpected fees and adjustments',
    body: 'Charges or financial changes that may not align with the underlying activity.',
    icon: CircleDollarSign,
  },
  {
    title: 'Missing or incomplete reimbursements',
    body: 'Potential differences between an established recovery entitlement and subsequent recorded financial activity.',
    icon: FileCheck2,
  },
  {
    title: 'Reversals and subsequent changes',
    body: 'Adjustments that may alter or undo a previously recorded outcome.',
    icon: Undo2,
  },
  {
    title: 'Recurring discrepancies',
    body: 'Similar patterns across events or periods that may point to a wider issue.',
    icon: AlertTriangle,
  },
];

const findingStates = [
  'Activity that is already accounted for.',
  'Differences explained by timing or subsequent events.',
  'Potential discrepancies requiring further evidence.',
  'Unresolved financial exposure.',
  'Recovery opportunities supported by the available evidence.',
];

const investigationSteps = [
  ['01', 'Identify the signal', 'Find the unexpected activity or financial difference.'],
  ['02', 'Trace the records', 'Connect the relevant source records and related events.'],
  ['03', 'Investigate the cause', 'Examine possible explanations and subsequent activity.'],
  ['04', 'Assess the support', 'Review evidence, recovery conditions and potential value.'],
  ['05', 'Decide what follows', 'Determine whether the finding is accounted for, unresolved, needs more information or warrants recovery action.'],
];

const AmazonDiscrepancyDetection = () => {
  usePageMeta({
    title: 'Amazon Discrepancy & Recovery Detection | Margin',
    description: 'Find discrepancies hiding in Amazon activity, investigate their financial significance, and identify which findings warrant attention or recovery action.',
    url: `${SITE_META.url}/amazon-discrepancy-recovery-detection`,
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
              <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">Amazon discrepancy detection</p>
              <h1 className="max-w-[790px] font-lora text-[45px] font-normal leading-[0.99] tracking-[-0.055em] text-[#30343B] sm:text-[62px] md:text-[78px]">Find the discrepancies hiding in your Amazon activity.</h1>
              <p className="mt-7 max-w-[710px] text-[17px] leading-8 text-[#667177] sm:text-[19px] sm:leading-9">Unexpected charges, missing inventory, incorrect adjustments and incomplete reimbursements can leave financial differences buried across Amazon’s operational and transaction records.</p>
              <p className="mt-5 max-w-[710px] text-[17px] leading-8 text-[#667177] sm:text-[19px] sm:leading-9">Margin examines available marketplace activity to identify discrepancies, investigate what may have caused them and establish whether they represent unresolved financial exposure or a potential recovery opportunity.</p>
              <Link to="#detection-signals" className="mt-8 inline-flex items-center gap-2 rounded-[7px] bg-[#30343B] px-5 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-[#20242A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#30343B]/35 focus-visible:ring-offset-2">See What Margin Can Detect <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            </div>

            <div className="relative min-h-[370px] md:min-h-[460px]">
              <div className="absolute left-[13%] top-[7%] h-[86%] w-px bg-gradient-to-b from-[#DCE2E2] via-[#6B8581] to-[#30343B]" />
              <div className="absolute left-[7%] top-[7%] flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7A858A]"><span className="h-3 w-3 rounded-full border-2 border-[#6B8581] bg-white" /> Activity stream</div>
              <div className="absolute left-[7%] top-[31%] flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7A858A]"><span className="h-3 w-3 rounded-full border-2 border-[#6B8581] bg-white" /> Difference found</div>
              <div className="absolute left-[7%] top-[55%] flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7A858A]"><span className="h-3 w-3 rounded-full border-2 border-[#6B8581] bg-white" /> Cause investigated</div>
              <div className="absolute left-[7%] top-[79%] flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7A858A]"><span className="h-3 w-3 rounded-full border-2 border-[#30343B] bg-[#30343B]" /> Supported decision</div>
              <div className="absolute left-[29%] top-[13%] right-0 border-t border-[#DCE2E2]" />
              <div className="absolute left-[29%] top-[37%] right-[9%] border-t border-[#DCE2E2]" />
              <div className="absolute left-[29%] top-[61%] right-[17%] border-t border-[#DCE2E2]" />
              <div className="absolute bottom-[9%] left-[29%] right-[2%] border-t border-[#30343B]" />
              <div className="absolute left-[31%] top-[8%] text-[14px] leading-6 text-[#667177]">Marketplace activity<br /><span className="font-semibold text-[#30343B]">1,842 transactions reviewed</span></div>
              <div className="absolute left-[31%] top-[32%] text-[14px] leading-6 text-[#667177]">Difference signal<br /><span className="font-semibold text-[#30343B]">Expected $1,484.80 · recorded $742.40</span></div>
              <div className="absolute left-[31%] top-[56%] text-[14px] leading-6 text-[#667177]">Related evidence<br /><span className="font-semibold text-[#30343B]">Settlement, inventory and case records</span></div>
              <div className="absolute bottom-[3%] left-[31%] max-w-[230px] text-[14px] leading-6 text-[#30343B]">Finding state<br /><span className="font-semibold text-[#5C7773]">Unresolved exposure · action justified</span></div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#E1E5E5] bg-[#F4F5F4] py-16 sm:py-20 md:py-28">
          <div className="mx-auto grid w-full max-w-[1280px] gap-10 px-5 sm:px-6 md:grid-cols-[0.75fr_1.25fr] md:gap-16 md:px-8 lg:px-10 2xl:px-12">
            <div className="max-w-[520px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">Why timing matters</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">The problem may begin long before anyone notices the financial impact.</h2></div>
            <div className="max-w-[720px] text-[16px] leading-8 text-[#667177] sm:text-[17px] sm:leading-9"><p>An operational event occurs. A shipment arrives short, inventory goes missing, a fee is assessed, a return is processed or an adjustment is recorded.</p><p className="mt-5">The expected financial treatment doesn’t follow—or the actual outcome differs from what should have happened.</p><p className="mt-5">But the discrepancy may not be obvious in the individual record. Its financial consequences can appear elsewhere, across subsequent transactions, adjustments, reimbursements or settlement activity.</p><p className="mt-5">By the time someone identifies the difference, the original event may be weeks or months old. Reconstructing what happened becomes more difficult, and applicable recovery windows may have narrowed.</p><p className="mt-6 font-semibold text-[#30343B]">The earlier a discrepancy is identified and understood, the more opportunity the business may have to investigate and act.</p></div>
          </div>
        </section>

        <section id="detection-signals" className="scroll-mt-24 bg-white py-16 sm:py-20 md:py-28">
          <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12">
            <div className="grid gap-12 md:grid-cols-[0.72fr_1.28fr] md:gap-16">
              <div className="max-w-[520px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">The detection layer</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">Identify where expected outcomes and recorded activity differ.</h2><p className="mt-5 text-[16px] leading-7 text-[#667177] sm:text-[17px] sm:leading-8">Margin examines available Amazon financial and operational records against relevant control rules and expected outcomes.</p><p className="mt-5 text-[16px] leading-7 text-[#667177] sm:text-[17px] sm:leading-8">It looks for patterns and inconsistencies that may indicate:</p></div>
              <div className="border-t border-[#DDE2E1]">{detectionSignals.map(({ title, body, icon: Icon }) => <div key={title} className="grid gap-4 border-b border-[#DDE2E1] py-6 sm:grid-cols-[42px_0.82fr_1.18fr] sm:items-center sm:gap-6"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F0F2F1] text-[#30343B]"><Icon className="h-5 w-5" strokeWidth={1.5} /></div><h3 className="text-[16px] font-semibold tracking-[-0.02em] text-[#30343B] sm:text-[17px]">{title}</h3><p className="text-[14px] leading-6 text-[#667177]">{body}</p></div>)}</div>
            </div>
            <p className="mt-10 max-w-[760px] border-l-2 border-[#5C7773] pl-4 text-[15px] font-semibold leading-7 text-[#30343B] sm:text-[17px] sm:leading-8">A detected difference is a reason to investigate—not proof that Amazon owes the business money.</p>
          </div>
        </section>

        <section className="border-y border-[#E1E5E5] bg-[#F4F5F4] py-16 sm:py-20 md:py-28">
          <div className="mx-auto grid w-full max-w-[1280px] gap-12 px-5 sm:px-6 md:grid-cols-[0.75fr_1.25fr] md:gap-16 md:px-8 lg:px-10 2xl:px-12">
            <div className="max-w-[520px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">From signal to significance</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">Know which discrepancies matter.</h2><p className="mt-5 text-[16px] leading-7 text-[#667177] sm:text-[17px] sm:leading-8">Not every anomaly is a financial loss. Some differences are explained by timing, subsequent activity, valid marketplace rules or records that have not yet been received.</p></div>
            <div className="max-w-[720px]"><p className="text-[16px] leading-8 text-[#667177] sm:text-[17px] sm:leading-9">Margin investigates potential findings against the available evidence to establish what they represent.</p><p className="mt-5 text-[16px] leading-8 text-[#667177] sm:text-[17px] sm:leading-9">It examines the originating activity, related transactions, expected treatment, subsequent adjustments and relevant recovery history where available.</p><p className="mt-7 text-[15px] font-semibold leading-7 text-[#30343B] sm:text-[17px] sm:leading-8">The investigation distinguishes between:</p><div className="mt-5 grid gap-0 border-t border-[#DDE2E1]">{findingStates.map((state) => <div key={state} className="flex items-start gap-3 border-b border-[#DDE2E1] py-4 text-[15px] leading-6 text-[#30343B] sm:text-[16px]"><Check className="mt-0.5 h-4 w-4 shrink-0 text-[#5C7773]" strokeWidth={2} /><span>{state}</span></div>)}</div><p className="mt-8 border-l-2 border-[#5C7773] pl-4 text-[15px] font-semibold leading-7 text-[#30343B] sm:text-[17px] sm:leading-8">This prevents a detected difference from being treated as a claim before its significance has been established.</p></div>
          </div>
        </section>

        <section className="bg-white py-16 sm:py-20 md:py-28">
          <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12">
            <div className="max-w-[780px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">A connected finding</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">Find the issue before it becomes a historical investigation.</h2><p className="mt-5 text-[16px] leading-7 text-[#667177] sm:text-[17px] sm:leading-8">Consider a shipment discrepancy.</p></div>
            <div className="relative mt-12 grid gap-8 border-t border-[#DDE2E1] pt-8 sm:grid-cols-4 sm:gap-0 sm:border-t-0 sm:pt-0">{[
              ['01', 'Expected quantity', 'Amazon records an expected quantity.'],
              ['02', 'Recorded outcome', 'Subsequent inventory records show a different outcome.'],
              ['03', 'Later activity', 'A reimbursement or adjustment appears—but its relationship is unclear.'],
              ['04', 'Investigation', 'Margin connects the originating event with the financial activity that follows.'],
            ].map(([number, title, body], index) => <div key={number} className={`relative ${index > 0 ? 'sm:border-l sm:border-[#DDE2E1] sm:pl-6' : ''} ${index < 3 ? 'sm:pr-6' : ''}`}><span className="text-[11px] font-semibold tracking-[0.16em] text-[#7A858A]">{number}</span><h3 className="mt-4 text-[16px] font-semibold text-[#30343B]">{title}</h3><p className="mt-3 text-[14px] leading-6 text-[#667177]">{body}</p></div>)}</div>
            <p className="mt-12 max-w-[850px] border-l-2 border-[#5C7773] pl-4 text-[16px] font-semibold leading-7 text-[#30343B] sm:text-[17px] sm:leading-8">Instead of looking only for a claim that can be submitted, the investigation seeks to establish what happened, what remains unresolved and whether further action is justified.</p>
          </div>
        </section>

        <section className="border-y border-[#E1E5E5] bg-[#F4F5F4] py-16 sm:py-20 md:py-28">
          <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12">
            <div className="grid gap-12 md:grid-cols-[0.72fr_1.28fr] md:gap-16"><div className="max-w-[520px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">The finding workflow</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">Turn detected discrepancies into supported decisions.</h2><p className="mt-5 text-[16px] leading-7 text-[#667177] sm:text-[17px] sm:leading-8">A useful detection system must do more than generate alerts.</p></div><div><p className="max-w-[720px] text-[16px] leading-8 text-[#667177] sm:text-[17px] sm:leading-9">For each potential finding, Margin needs to establish enough context for a meaningful decision:</p><div className="mt-8 grid gap-0 border-t border-[#DDE2E1]">{investigationSteps.map(([number, title, body]) => <div key={number} className="grid gap-3 border-b border-[#DDE2E1] py-5 sm:grid-cols-[42px_0.72fr_1.28fr] sm:items-start sm:gap-6"><span className="text-[11px] font-semibold tracking-[0.16em] text-[#7A858A]">{number}</span><h3 className="text-[16px] font-semibold text-[#30343B]">{title}</h3><p className="text-[14px] leading-6 text-[#667177]">{body}</p></div>)}</div><p className="mt-9 max-w-[720px] text-[15px] font-semibold leading-7 text-[#30343B] sm:text-[17px] sm:leading-8">The outcome is not simply a list of anomalies. It is a set of investigated findings with a clearer explanation of what the records support and what should happen next.</p></div></div>
          </div>
        </section>

        <section className="bg-white py-16 sm:py-20 md:py-28"><div className="mx-auto grid w-full max-w-[1280px] gap-12 px-5 sm:px-6 md:grid-cols-[0.75fr_1.25fr] md:gap-16 md:px-8 lg:px-10 2xl:px-12"><div className="max-w-[520px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">Controlled recovery</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">Recover what the evidence supports. Don’t claim what it doesn’t.</h2></div><div className="max-w-[720px] text-[16px] leading-8 text-[#667177] sm:text-[17px] sm:leading-9"><p>Where an investigation establishes a justified recovery opportunity, Margin can carry the agreed work forward.</p><p className="mt-5">That may involve assembling supporting records, preparing the case, managing responses, supplying additional evidence and pursuing an appeal where the evidence warrants it.</p><p className="mt-5">But detection does not automatically authorise submission. Recovery actions remain subject to the agreed scope and required seller approval.</p><p className="mt-5">And an approved claim is not necessarily a completed financial recovery. Margin follows the available subsequent records to establish whether the outcome was recorded and whether anything remains unresolved.</p></div></div></section>

        <section className="border-y border-[#E1E5E5] bg-[#F4F5F4] py-16 sm:py-20 md:py-28"><div className="mx-auto grid w-full max-w-[1280px] gap-12 px-5 sm:px-6 md:grid-cols-[0.75fr_1.25fr] md:gap-16 md:px-8 lg:px-10 2xl:px-12"><div className="max-w-[520px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">Pattern recognition</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">Recognise recurring issues—not just individual discrepancies.</h2></div><div className="max-w-[720px] text-[16px] leading-8 text-[#667177] sm:text-[17px] sm:leading-9"><p>An isolated discrepancy may be one event. Similar discrepancies across multiple shipments, transactions or reporting periods may indicate a broader pattern.</p><p className="mt-5">Where the records support a connection, Margin can preserve previous findings and examine subsequent activity against what has already been established.</p><p className="mt-5">This gives the business an opportunity to recognise repeated issues, investigate their underlying circumstances and bring relevant findings to the attention of the teams able to intervene.</p><p className="mt-6 font-semibold text-[#30343B]">Detection becomes more useful when it contributes to understanding—not simply another growing queue of alerts.</p></div></div></section>

        <section className="bg-white py-20 sm:py-24 md:py-32"><div className="mx-auto flex w-full max-w-[900px] flex-col items-center px-5 text-center sm:px-6"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F0F2F1] text-[#30343B]"><ShieldCheck className="h-6 w-6" strokeWidth={1.5} /></div><p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">Establish the financial position</p><h2 className="mt-4 font-lora text-[38px] font-normal leading-[1.04] tracking-[-0.05em] text-[#30343B] sm:text-[52px]">Know what is happening beneath your Amazon numbers.</h2><p className="mt-5 max-w-[700px] text-[16px] leading-7 text-[#667177] sm:text-[17px] sm:leading-8">Margin helps your business identify unexpected activity, understand its financial significance and establish which discrepancies warrant attention.</p><p className="mt-4 max-w-[700px] text-[16px] leading-7 text-[#667177] sm:text-[17px] sm:leading-8">Find what needs investigating. Understand what the evidence supports. Pursue justified recovery. Keep unresolved financial issues visible.</p><Link to="/audit-start" className="mt-8 inline-flex items-center gap-2 rounded-[7px] bg-[#635BFF] px-5 py-3 text-[13px] font-semibold text-white shadow-[0_12px_26px_rgba(99,91,255,0.18)] transition-colors hover:bg-[#5148E5]">Establish Your Financial Position <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link><p className="mt-5 max-w-[600px] text-[13px] leading-6 text-[#7A858A]">Start with an initial review of your Amazon records. See what Margin can establish, what remains unexplained and whether further recovery or financial control work is justified.</p></div></section>
      <ExploreMoreWorkflows />
      </main>
      <BrandFooter wide />
    </div>
  );
};

export default AmazonDiscrepancyDetection;
