import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Calculator,
  Check,
  ClipboardCheck,
  FileCheck2,
  FileText,
  GitBranch,
  Scale,
  ShieldCheck,
} from 'lucide-react';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { BrandFooter } from '@/components/layout/BrandFooter';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SITE_META } from '@/config/site';

const preparationAreas = [
  {
    title: 'Establish the case narrative',
    body: 'Margin brings the relevant findings together into a structured account of the discrepancy: what was expected, what the marketplace activity shows and how the observed outcome differs. The recovery request has a factual foundation rather than a collection of disconnected observations.',
    icon: FileText,
  },
  {
    title: 'Connect every material assertion to evidence',
    body: 'Relevant records are connected to the facts they substantiate. The case distinguishes what is directly supported, what depends on multiple records and what remains uncertain, so the explanation is grounded in the investigation.',
    icon: GitBranch,
  },
  {
    title: 'Establish the recovery rationale',
    body: 'A discrepancy alone does not explain why compensation should be issued. Margin connects the established facts to the applicable recovery basis and makes the reasoning understandable rather than simply asserting that a reimbursement is owed.',
    icon: Scale,
  },
  {
    title: 'Determine and substantiate the amount',
    body: 'The requested amount is connected to transaction values, inventory quantities, fees, adjustments and other available financial records. Where the amount cannot be determined reliably, the uncertainty remains visible instead of becoming false precision.',
    icon: Calculator,
  },
  {
    title: 'Structure the supporting submission',
    body: 'Case identifiers, explanation, discrepancy, financial impact, recovery rationale, evidence, requested amount and limitations are brought into a reviewable submission package without overstating what the records prove.',
    icon: ClipboardCheck,
  },
  {
    title: 'Establish whether the case is ready',
    body: 'Margin assesses the case against the requirements of the applicable recovery process. It identifies whether the position is sufficiently supported, needs more evidence or should not proceed before the case moves into seller approval.',
    icon: BadgeCheck,
  },
];

const caseSteps = [
  ['Factual account', 'Establish the shipment, expected quantity, recorded receipt and discrepancy.'],
  ['Evidence connection', 'Connect shipment plans, ownership records, packing documentation, carrier records and receiving information to the facts they support.'],
  ['Recovery rationale', 'Establish the applicable claim route and whether the evidence supports pursuing compensation.'],
  ['Financial calculation', 'Determine the requested amount using the relevant valuation basis and available records.'],
  ['Submission preparation', 'Assemble the explanation, supporting records and requested amount into a coherent case.'],
];

const comparisonRows = [
  ['Identify a potential claim', 'Establish the underlying discrepancy'],
  ['Collect supporting documents', 'Connect evidence to the facts being asserted'],
  ['Write a claim explanation', 'Build the explanation from the investigation'],
  ['Enter a reimbursement amount', 'Establish the financial basis for the amount'],
  ['Attach documents and submit', 'Prepare a structured, substantiated case for approval'],
  ['Track submission status', 'Preserve reasoning and evidence through the outcome'],
];

export default function EvidenceBackedRecoveryCasePreparation() {
  usePageMeta({
    title: 'Evidence-Backed Recovery Case Preparation | Margin',
    description: 'Turn established discrepancies into structured, financially substantiated recovery cases ready for review.',
    url: `${SITE_META.url}/evidence-backed-recovery-case-preparation`,
    image: SITE_META.image,
  });

  return (
    <div className="min-h-screen bg-[#F7F8F7] text-[#30343B]">
      <PublicNavbar variant="light" />
      <main>
        <section className="relative overflow-hidden bg-white pb-16 pt-32 sm:pb-20 sm:pt-40 md:pb-28 md:pt-48">
          <div className="pointer-events-none absolute right-[-14%] top-[-18%] h-[560px] w-[560px] rounded-full bg-[#ECEFF0] blur-3xl" />
          <div className="mx-auto grid w-full max-w-[1280px] gap-14 px-5 sm:px-6 md:grid-cols-[minmax(0,1.04fr)_minmax(360px,0.76fr)] md:items-center md:gap-16 md:px-8 lg:px-10 2xl:px-12">
            <div className="relative max-w-[790px]">
              <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">Evidence-backed case preparation</p>
              <h1 className="max-w-[790px] font-lora text-[45px] font-normal leading-[0.99] tracking-[-0.055em] text-[#30343B] sm:text-[62px] md:text-[78px]">Turn established discrepancies into recovery cases that are ready to stand behind.</h1>
              <p className="mt-7 max-w-[730px] text-[17px] leading-8 text-[#667177] sm:text-[19px] sm:leading-9">A recovery case needs more than a discrepancy and a collection of documents. It needs a clear account of what happened, why compensation is warranted, what the records establish and what amount is being pursued.</p>
              <p className="mt-6 max-w-[720px] border-l-2 border-[#5C7773] pl-4 text-[15px] font-semibold leading-7 text-[#30343B] sm:text-[17px] sm:leading-8">Margin brings the investigation, evidence and recovery rationale together so every submission is explainable, defensible and grounded in the available records.</p>
              <a href="#case-preparation" className="mt-8 inline-flex items-center gap-2 rounded-[7px] bg-[#30343B] px-5 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-[#20242A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#30343B]/35 focus-visible:ring-offset-2">See how a case is built <ArrowRight className="h-4 w-4" aria-hidden="true" /></a>
            </div>
            <div className="relative min-h-[360px] md:min-h-[440px]">
              <div className="absolute left-[12%] top-[9%] h-[80%] w-px bg-gradient-to-b from-transparent via-[#79918E] to-transparent" />
              {[
                ['01', 'Discrepancy', 'Established fact', 'top-[8%]'],
                ['02', 'Evidence', 'Connected records', 'top-[29%]'],
                ['03', 'Rationale', 'Applicable basis', 'top-[50%]'],
                ['04', 'Amount', 'Supported value', 'top-[71%]'],
                ['05', 'Case ready', 'For seller approval', 'top-[92%]'],
              ].map(([number, label, value, position]) => (
                <div key={number} className={`absolute left-[5%] ${position} flex items-center gap-3`}>
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F4F5F4] text-[10px] font-semibold text-[#5C7773]">{number}</span>
                  <div><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7A858A]">{label}</p><p className="text-[13px] font-semibold text-[#30343B]">{value}</p></div>
                </div>
              ))}
              <div className="absolute left-[27%] right-[2%] top-[17%] border-t border-[#DCE2E2]" />
              <div className="absolute left-[27%] right-[11%] top-[38%] border-t border-[#DCE2E2]" />
              <div className="absolute left-[27%] right-[19%] top-[59%] border-t border-[#DCE2E2]" />
              <div className="absolute left-[27%] right-[7%] top-[80%] border-t border-[#DCE2E2]" />
              <div className="absolute bottom-[1%] left-[27%] right-0 border-t border-[#30343B]" />
              <div className="absolute left-[30%] top-[12%] text-[13px] leading-6 text-[#667177]">8 units not received<br /><span className="font-semibold text-[#30343B]">100 planned · 92 received</span></div>
              <div className="absolute left-[30%] top-[33%] text-[13px] leading-6 text-[#667177]">Records linked<br /><span className="font-semibold text-[#30343B]">Plan · carrier · receiving</span></div>
              <div className="absolute left-[30%] top-[54%] text-[13px] leading-6 text-[#667177]">Recovery basis<br /><span className="font-semibold text-[#5C7773]">Eligibility assessed</span></div>
              <div className="absolute left-[30%] top-[75%] text-[13px] leading-6 text-[#667177]">Financial basis<br /><span className="font-semibold text-[#30343B]">Value remains supportable</span></div>
              <div className="absolute bottom-[-1%] left-[30%] text-[13px] leading-6 text-[#30343B]">Structured case<br /><span className="font-semibold text-[#5C7773]">Ready for seller review</span></div>
            </div>
          </div>
        </section>

        <section className="border-y border-[#E1E5E5] bg-[#F4F5F4] py-16 sm:py-20 md:py-28">
          <div className="mx-auto grid w-full max-w-[1280px] gap-10 px-5 sm:px-6 md:grid-cols-[0.75fr_1.25fr] md:gap-16 md:px-8 lg:px-10 2xl:px-12">
            <div className="max-w-[520px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">The problem this addresses</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">A discrepancy is not automatically a submission-ready case.</h2></div>
            <div className="max-w-[720px] text-[16px] leading-8 text-[#667177] sm:text-[17px] sm:leading-9"><p>An investigation may establish that something went wrong. Evidence may support particular facts. Eligibility may indicate that a recovery route remains available. But those findings still need to communicate what happened, which marketplace event is involved, what should have happened instead, what the records establish, why compensation is warranted, what process applies and how the amount was determined.</p><p className="mt-5">Without this preparation, teams can submit fragmented explanations, attach documents without explaining their relevance or request amounts that cannot be adequately substantiated.</p><p className="mt-6 font-semibold text-[#30343B]">The investigation, evidence and financial rationale must become one coherent recovery case. A numerical discrepancy alone does not justify a claim.</p></div>
          </div>
        </section>

        <section id="case-preparation" className="scroll-mt-24 bg-white py-16 sm:py-20 md:py-28">
          <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12">
            <div className="max-w-[750px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">What Margin does</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">Convert established evidence into a case that can be reviewed, approved and defended.</h2><p className="mt-5 text-[16px] leading-7 text-[#667177] sm:text-[17px] sm:leading-8">This is the transition between knowing what the records prove and presenting a recovery request that explains the facts, the rationale and the financial basis.</p></div>
            <div className="mt-10 grid gap-3 sm:mt-14 md:grid-cols-2 lg:grid-cols-3">
              {preparationAreas.map(({ title, body, icon: Icon }) => <article key={title} className="flex min-h-[300px] flex-col bg-[#F4F5F4] p-6 sm:p-7 md:p-8"><div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#DCE2E5] bg-white text-[#30343B]"><Icon className="h-5 w-5" strokeWidth={1.5} /></div><div className="mt-auto pt-12"><h3 className="text-[16px] font-semibold tracking-[-0.02em] text-[#30343B] sm:text-[17px]">{title}</h3><p className="mt-3 text-[14px] leading-6 text-[#667177]">{body}</p></div></article>)}
            </div>
          </div>
        </section>

        <section className="border-y border-[#E1E5E5] bg-[#F4F5F4] py-16 sm:py-20 md:py-28">
          <div className="mx-auto grid w-full max-w-[1280px] gap-10 px-5 sm:px-6 md:grid-cols-[0.72fr_1.28fr] md:gap-16 md:px-8 lg:px-10 2xl:px-12">
            <div className="max-w-[520px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">Illustrative case preparation · hypothetical amounts</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">From an inventory discrepancy to a substantiated recovery case.</h2><div className="mt-8 border-l-2 border-[#5C7773] pl-4"><p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7A858A]">Discrepancy identified</p><p className="mt-2 font-lora text-[38px] leading-none tracking-[-0.04em] text-[#30343B]">8 units</p><p className="mt-2 text-[14px] leading-6 text-[#667177]">Shipment plan: 100 units. Amazon receiving record: 92 units.</p></div></div>
            <div className="max-w-[760px]"><div className="grid gap-0 border-t border-[#DDE2E1]">{caseSteps.map(([title, body], index) => <div key={title} className="grid gap-3 border-b border-[#DDE2E1] py-5 sm:grid-cols-[42px_0.72fr_1.28fr] sm:items-start sm:gap-5"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[11px] font-semibold text-[#5C7773]">0{index + 1}</span><span className="text-[15px] font-semibold text-[#30343B]">{title}</span><span className="text-[14px] leading-6 text-[#667177]">{body}</span></div>)}</div><div className="mt-8 flex items-start gap-3 border-l-2 border-[#5C7773] pl-4"><ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-[#5C7773]" /><p className="text-[15px] font-semibold leading-7 text-[#30343B]">The resulting position is either sufficiently supported and ready for seller approval, or the remaining evidence and eligibility gaps are identified before submission.</p></div></div>
          </div>
        </section>

        <section className="bg-white py-16 sm:py-20 md:py-28">
          <div className="mx-auto grid w-full max-w-[1280px] gap-12 px-5 sm:px-6 md:grid-cols-[0.72fr_1.28fr] md:gap-16 md:px-8 lg:px-10 2xl:px-12">
            <div className="max-w-[520px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">Why this is different</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">Prepare the reasoning behind the recovery request.</h2></div>
            <div><div className="overflow-hidden border-t border-[#DDE2E1]"><div className="grid grid-cols-[0.9fr_1.1fr] border-b border-[#DDE2E1] py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7A858A]"><span>Basic claim preparation</span><span>Margin’s responsibility</span></div>{comparisonRows.map(([basic, margin]) => <div key={basic} className="grid grid-cols-[0.9fr_1.1fr] border-b border-[#DDE2E1] py-4 text-[13px] leading-5 sm:text-[14px]"><span className="pr-4 text-[#667177]">{basic}</span><span className="font-semibold text-[#30343B]">{margin}</span></div>)}</div><p className="mt-8 border-l-2 border-[#5C7773] pl-4 text-[16px] font-semibold leading-7 text-[#30343B] sm:text-[17px] sm:leading-8">Margin does not simply help sellers submit claims. It prepares the reasoning and evidence behind the recovery request.</p></div>
          </div>
        </section>

        <section className="border-y border-[#E1E5E5] bg-[#F4F5F4] py-16 sm:py-20 md:py-28">
          <div className="mx-auto grid w-full max-w-[1280px] gap-10 px-5 sm:px-6 md:grid-cols-[0.72fr_1.28fr] md:gap-16 md:px-8 lg:px-10 2xl:px-12">
            <div className="max-w-[520px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">The preparation boundary</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">Prepared does not mean guaranteed.</h2></div>
            <div className="max-w-[720px] text-[16px] leading-8 text-[#667177] sm:text-[17px] sm:leading-9"><p>A well-prepared case can still be rejected. Margin establishes and presents the strongest supportable case; the marketplace retains its decision authority. Preparation must remain distinct from filing, and evidence must remain distinct from authority to act.</p><div className="mt-8 grid gap-0 border-t border-[#DDE2E1]"><div className="flex items-start gap-3 border-b border-[#DDE2E1] py-4"><Check className="mt-1 h-4 w-4 shrink-0 text-[#5C7773]" /><span><strong className="text-[#30343B]">Established facts</strong><span className="mt-1 block text-[14px] leading-6">The case explains what happened and what the records show.</span></span></div><div className="flex items-start gap-3 border-b border-[#DDE2E1] py-4"><FileCheck2 className="mt-1 h-4 w-4 shrink-0 text-[#5C7773]" /><span><strong className="text-[#30343B]">Supportable rationale</strong><span className="mt-1 block text-[14px] leading-6">The recovery basis and requested amount are connected to evidence.</span></span></div><div className="flex items-start gap-3 border-b border-[#DDE2E1] py-4"><ShieldCheck className="mt-1 h-4 w-4 shrink-0 text-[#7A858A]" /><span><strong className="text-[#30343B]">Seller authority</strong><span className="mt-1 block text-[14px] leading-6">Approval and filing remain a separate, controlled decision.</span></span></div></div></div>
          </div>
        </section>

        <section className="bg-white py-20 sm:py-24 md:py-32">
          <div className="mx-auto flex w-full max-w-[900px] flex-col items-center px-5 text-center sm:px-6"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F0F2F1] text-[#30343B]"><BadgeCheck className="h-6 w-6" strokeWidth={1.5} /></div><p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">Establish the financial position</p><h2 className="mt-4 font-lora text-[38px] font-normal leading-[1.04] tracking-[-0.05em] text-[#30343B] sm:text-[52px]">Submit cases you can explain, substantiate and stand behind.</h2><p className="mt-5 max-w-[690px] text-[16px] leading-7 text-[#667177] sm:text-[17px] sm:leading-8">Margin brings the findings together, establishes the financial rationale and prepares the supporting case—so your team can review what is being pursued and why before authorising submission.</p><Link to="/audit-start" className="mt-8 inline-flex items-center gap-2 rounded-[7px] bg-[#635BFF] px-5 py-3 text-[13px] font-semibold text-white shadow-[0_12px_26px_rgba(99,91,255,0.18)] transition-colors hover:bg-[#5148E5]">Establish Your Financial Position <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div>
        </section>
      </main>
      <BrandFooter wide />
    </div>
  );
}
