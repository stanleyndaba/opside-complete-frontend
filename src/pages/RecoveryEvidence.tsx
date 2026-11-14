import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Check,
  ClipboardCheck,
  FileCheck2,
  FileSearch,
  Link2,
  PackageCheck,
  ShieldCheck,
  TriangleAlert,
  Upload,
} from 'lucide-react';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { BrandFooter } from '@/components/layout/BrandFooter';
import { ExploreMoreWorkflows } from '@/components/landing/ExploreMoreWorkflows';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SITE_META } from '@/config/site';

const evidenceResponsibilities = [
  {
    title: 'Connect evidence to the underlying event',
    body: 'Margin links relevant records to the discrepancy, transaction, inventory movement or recovery case they relate to. Instead of treating every uploaded document as an independent attachment, the case preserves its relationship to the event being investigated.',
    icon: Link2,
  },
  {
    title: 'Establish what each record supports',
    body: 'Different records provide different forms of proof. Margin distinguishes between what a record directly establishes, what it supports alongside other records, and what remains unverified. A delivery record, for example, does not automatically establish the contents of a shipment.',
    icon: FileCheck2,
  },
  {
    title: 'Identify missing or insufficient evidence',
    body: 'Margin helps surface missing ownership records, incomplete delivery information, absent condition documentation, unclear links between operational events and financial impact, inconsistent quantities or identifiers, and records that do not address the stated claim reason.',
    icon: TriangleAlert,
  },
  {
    title: 'Connect evidence to the recovery argument',
    body: 'Evidence should support a particular factual point in the case. Margin connects relevant records to the discrepancy and the reason for pursuing recovery, creating a clearer relationship between the event, the facts, the supporting records, the financial impact and the decision.',
    icon: ClipboardCheck,
  },
  {
    title: 'Preserve evidence throughout the case',
    body: 'Evidence remains relevant after submission. Margin preserves the original records and their relationship to the case as Amazon requests information, rejects a claim, issues a decision or introduces a question that warrants further investigation.',
    icon: ShieldCheck,
  },
];

const evidenceChecks = [
  ['Shipment plan', 'Available', 'Establishes that 100 units were planned for the shipment.'],
  ['Supplier packing record', 'Available', 'Supports that 100 units were prepared for dispatch.'],
  ['Carrier documentation', 'Needs review', 'May establish collection and delivery, but its detail must be examined to determine what it proves about shipment contents.'],
  ['Amazon receiving record', 'Available', 'Establishes that 92 units were recorded as received.'],
];

const comparisonRows = [
  ['Store supporting documents', 'Connect records to the events they relate to'],
  ['Attach files to claims', 'Establish what each record actually supports'],
  ['Collect documents', 'Identify missing or insufficient evidence'],
  ['Submit available records', 'Connect evidence to the specific recovery argument'],
  ['Retain case attachments', 'Preserve evidence relationships throughout the case'],
];

export default function RecoveryEvidence() {
  usePageMeta({
    title: 'Recovery Evidence | Margin',
    description: 'Connect recovery records to the events they support and establish what the available evidence can genuinely prove.',
    url: `${SITE_META.url}/recovery-evidence`,
    image: SITE_META.image,
  });

  return (
    <div className="workflow-page min-h-screen bg-[#F7F8F7] text-[#30343B]">
      <PublicNavbar variant="light" />
      <main>
        <section className="relative overflow-hidden bg-white pb-16 pt-32 sm:pb-20 sm:pt-40 md:pb-28 md:pt-48">
          <div className="pointer-events-none absolute right-[-14%] top-[-18%] h-[560px] w-[560px] rounded-full bg-[#ECEFF0] blur-3xl" />
          <div className="mx-auto grid w-full max-w-[1280px] gap-14 px-5 sm:px-6 md:grid-cols-[minmax(0,1.02fr)_minmax(360px,0.78fr)] md:items-center md:gap-16 md:px-8 lg:px-10 2xl:px-12">
            <div className="relative max-w-[780px]">
              <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">Recovery evidence</p>
              <h1 className="max-w-[780px] font-lora text-[45px] font-normal leading-[0.99] tracking-[-0.055em] text-[#30343B] sm:text-[62px] md:text-[78px]">Build every recovery case on evidence that establishes what happened.</h1>
              <p className="mt-7 max-w-[700px] text-[17px] leading-8 text-[#667177] sm:text-[19px] sm:leading-9">A discrepancy needs more than an explanation. It needs supporting records that connect the underlying event to the financial or operational impact. Margin brings relevant records together, examines what they establish, identifies what is missing, and connects the evidence to the recovery case it supports.</p>
              <p className="mt-6 max-w-[680px] border-l-2 border-[#5C7773] pl-4 text-[15px] font-semibold leading-7 text-[#30343B] sm:text-[17px] sm:leading-8">The objective is not to submit more documents. It is to make the case more defensible.</p>
              <a href="#why-evidence" className="mt-8 inline-flex items-center gap-2 rounded-[7px] bg-[#30343B] px-5 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-[#20242A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#30343B]/35 focus-visible:ring-offset-2">See how Margin builds the case <ArrowRight className="h-4 w-4" aria-hidden="true" /></a>
            </div>

            <div className="relative min-h-[360px] md:min-h-[440px]">
              <div className="absolute left-[13%] top-[8%] h-[84%] w-px bg-[#DCE2E2]" />
              <div className="absolute left-[13%] top-[8%] h-[84%] w-px bg-gradient-to-b from-transparent via-[#79918E] to-transparent" />
              {[
                ['Source records', 'Shipment plan', 'top-[10%]'],
                ['Operational proof', 'Packing and carrier records', 'top-[34%]'],
                ['Marketplace outcome', 'Amazon receipt · 92 units', 'top-[58%]'],
                ['Evidence position', 'Supported · gap identified', 'top-[82%]'],
              ].map(([label, value, position]) => (
                <div key={label} className={`absolute left-[7%] ${position} flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7A858A]`}>
                  <span className="h-3 w-3 rounded-full border-2 border-[#5C7773] bg-white" />
                  <span>{label}</span>
                  <span className="hidden text-[12px] font-medium normal-case tracking-normal text-[#30343B] sm:inline">{value}</span>
                </div>
              ))}
              <div className="absolute left-[29%] top-[17%] right-0 border-t border-[#DCE2E2]" />
              <div className="absolute left-[29%] top-[41%] right-[8%] border-t border-[#DCE2E2]" />
              <div className="absolute left-[29%] top-[65%] right-[18%] border-t border-[#DCE2E2]" />
              <div className="absolute bottom-[4%] left-[29%] right-[3%] border-t border-[#30343B]" />
              <div className="absolute left-[31%] top-[13%] max-w-[220px] text-[14px] leading-6 text-[#667177]">Expected quantity<br /><span className="font-semibold text-[#30343B]">100 units planned</span></div>
              <div className="absolute left-[31%] top-[37%] max-w-[220px] text-[14px] leading-6 text-[#667177]">Records examined<br /><span className="font-semibold text-[#30343B]">Packing and delivery support</span></div>
              <div className="absolute left-[31%] top-[61%] max-w-[220px] text-[14px] leading-6 text-[#667177]">Amazon receipt<br /><span className="font-semibold text-[#30343B]">92 units recorded</span></div>
              <div className="absolute bottom-[-1%] left-[31%] max-w-[230px] text-[14px] leading-6 text-[#30343B]">What the records support<br /><span className="font-semibold text-[#5C7773]">Difference established · carrier proof pending</span></div>
            </div>
          </div>
        </section>

        <section id="why-evidence" className="scroll-mt-24 border-y border-[#E1E5E5] bg-[#F4F5F4] py-16 sm:py-20 md:py-28">
          <div className="mx-auto grid w-full max-w-[1280px] gap-10 px-5 sm:px-6 md:grid-cols-[0.75fr_1.25fr] md:gap-16 md:px-8 lg:px-10 2xl:px-12">
            <div className="max-w-[520px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">The problem this addresses</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">A seller identifies a discrepancy. The next question is whether the business can prove it.</h2></div>
            <div className="max-w-[720px] text-[16px] leading-8 text-[#667177] sm:text-[17px] sm:leading-9"><p>An inventory shortage, damaged return, missing reimbursement or incorrect fee can appear straightforward in isolation. Establishing what happened may require records from different stages of the operation.</p><p className="mt-5">A shipment plan establishes what was expected. Supplier records may establish what was purchased or packed. Carrier documentation may establish transport and delivery. Amazon records may show what was received or adjusted. Transaction records may establish the financial consequence, while case communications may establish what Amazon requested or decided.</p><p className="mt-5">Each record proves something different. None should automatically be treated as proof of the entire discrepancy.</p><p className="mt-6 font-semibold text-[#30343B]">The real problem is not a lack of documents. It is the inability to consistently establish what those documents prove together.</p></div>
          </div>
        </section>

        <section className="bg-white py-16 sm:py-20 md:py-28">
          <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12">
            <div className="max-w-[720px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">What Margin does</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">Turn documents into an evidence position the case can rely on.</h2><p className="mt-5 text-[16px] leading-7 text-[#667177] sm:text-[17px] sm:leading-8">Evidence is not simply a collection of documents attached to a claim. It is the connection between what happened, what the seller says happened, what the records demonstrate and what the marketplace needs to assess.</p></div>
            <div className="mt-10 grid gap-3 sm:mt-14 md:grid-cols-2 lg:grid-cols-3">
              {evidenceResponsibilities.map(({ title, body, icon: Icon }) => <article key={title} className="flex min-h-[300px] flex-col bg-[#F4F5F4] p-6 sm:p-7 md:p-8"><div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#DCE2E5] bg-white text-[#30343B]"><Icon className="h-5 w-5" strokeWidth={1.5} /></div><div className="mt-auto pt-12"><h3 className="text-[16px] font-semibold tracking-[-0.02em] text-[#30343B] sm:text-[17px]">{title}</h3><p className="mt-3 text-[14px] leading-6 text-[#667177]">{body}</p></div></article>)}
            </div>
          </div>
        </section>

        <section className="border-y border-[#E1E5E5] bg-[#F4F5F4] py-16 sm:py-20 md:py-28">
          <div className="mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12">
            <div className="grid gap-10 md:grid-cols-[0.72fr_1.28fr] md:gap-16">
              <div className="max-w-[520px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">Illustrative evidence investigation</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">A shipment is recorded as short. Can the seller establish what was actually sent?</h2><p className="mt-5 text-[14px] leading-6 text-[#667177]">Hypothetical shipment. The numbers illustrate the evidence question, not an automatic recovery conclusion.</p></div>
              <div>
                <div className="grid gap-3 sm:grid-cols-3 sm:gap-4">
                  {[['EXPECTED SHIPMENT QUANTITY', '100 units', 'Planned quantity', PackageCheck], ['AMAZON RECEIPT RECORD', '92 units', 'Recorded as received', FileSearch], ['DIFFERENCE', '8 units', 'Requires evidence examination', TriangleAlert]].map(([label, amount, detail, Icon]) => <div key={label as string} className="bg-white p-5 sm:p-6"><Icon className="h-5 w-5 text-[#5C7773]" strokeWidth={1.5} /><p className="mt-8 text-[10px] font-semibold uppercase tracking-[0.13em] text-[#7A858A]">{label as string}</p><p className="mt-3 font-lora text-[32px] leading-none tracking-[-0.04em] text-[#30343B] sm:text-[38px]">{amount as string}</p><p className="mt-3 text-[13px] text-[#667177]">{detail as string}</p></div>)}
                </div>
                <p className="mt-8 max-w-[720px] border-l-2 border-[#5C7773] pl-4 text-[16px] font-semibold leading-7 text-[#30343B] sm:text-[17px] sm:leading-8">The available records support a difference between planned quantity and recorded receipt. Whether they prove that all 100 units were physically handed to the carrier still depends on the contents and reliability of the carrier documentation.</p>
                <div className="mt-8 grid gap-0 border-t border-[#DDE2E1] sm:grid-cols-2">{evidenceChecks.map(([title, status, body]) => <div key={title} className="flex items-start gap-3 border-b border-[#DDE2E1] py-4 sm:pr-6"><Check className={`mt-0.5 h-4 w-4 shrink-0 ${status === 'Needs review' ? 'text-[#A36A36]' : 'text-[#5C7773]'}`} strokeWidth={2} /><span><span className="block text-[15px] font-semibold text-[#30343B]">{title}</span><span className="mt-1 block text-[11px] font-semibold uppercase tracking-[0.1em] text-[#7A858A]">{status}</span><span className="mt-1 block text-[13px] leading-5 text-[#667177]">{body}</span></span></div>)}</div>
                <p className="mt-8 text-[15px] font-semibold leading-7 text-[#30343B] sm:text-[17px] sm:leading-8">The next step is to establish whether the evidence is sufficient, identify what remains missing and only then determine whether the recovery case is ready to proceed.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white py-16 sm:py-20 md:py-28">
          <div className="mx-auto grid w-full max-w-[1280px] gap-12 px-5 sm:px-6 md:grid-cols-[0.72fr_1.28fr] md:gap-16 md:px-8 lg:px-10 2xl:px-12">
            <div className="max-w-[520px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">Why this is different</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">A document repository stores files. A recovery workflow attaches files. Neither alone proves the facts.</h2></div>
            <div><div className="overflow-hidden border-t border-[#DDE2E1]"><div className="grid grid-cols-[0.9fr_1.1fr] border-b border-[#DDE2E1] py-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7A858A]"><span>Basic document handling</span><span>Margin's responsibility</span></div>{comparisonRows.map(([basic, margin]) => <div key={basic} className="grid grid-cols-[0.9fr_1.1fr] border-b border-[#DDE2E1] py-4 text-[13px] leading-5 sm:text-[14px]"><span className="pr-4 text-[#667177]">{basic}</span><span className="font-semibold text-[#30343B]">{margin}</span></div>)}</div><p className="mt-8 border-l-2 border-[#5C7773] pl-4 text-[16px] font-semibold leading-7 text-[#30343B] sm:text-[17px] sm:leading-8">Margin treats evidence as part of the financial investigation—not simply as paperwork required to submit a claim.</p></div>
          </div>
        </section>

        <section className="border-y border-[#E1E5E5] bg-[#F4F5F4] py-16 sm:py-20 md:py-28">
          <div className="mx-auto grid w-full max-w-[1280px] gap-12 px-5 sm:px-6 md:grid-cols-[0.72fr_1.28fr] md:gap-16 md:px-8 lg:px-10 2xl:px-12">
            <div className="max-w-[520px]"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">Positioning boundary</p><h2 className="mt-4 font-lora text-[36px] font-normal leading-[1.03] tracking-[-0.05em] text-[#30343B] sm:text-[48px]">Evidence is not volume. Evidence is not certainty.</h2></div>
            <div className="max-w-[720px] text-[16px] leading-8 text-[#667177] sm:text-[17px] sm:leading-9"><p>More attachments do not automatically make a stronger case. Relevance, reliability and the relationship between records matter.</p><p className="mt-5">Margin distinguishes facts established by source records from interpretations, assumptions and unresolved questions. It does not promise automated evidence sufficiency scoring, document authenticity checks or comprehensive requirements across every claim category unless those capabilities are implemented and validated.</p><p className="mt-5 font-semibold text-[#30343B]">The value of evidence extends beyond claims: investigation, financial traceability, disputes, appeals and the ability to explain how a financial conclusion was reached.</p></div>
          </div>
        </section>

        <section className="bg-white py-20 sm:py-24 md:py-32">
          <div className="mx-auto flex w-full max-w-[900px] flex-col items-center px-5 text-center sm:px-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F0F2F1] text-[#30343B]"><Upload className="h-6 w-6" strokeWidth={1.5} /></div>
            <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#7A858A]">Establish the financial position</p>
            <h2 className="mt-4 font-lora text-[38px] font-normal leading-[1.04] tracking-[-0.05em] text-[#30343B] sm:text-[52px]">Know what your business can prove before it pursues recovery.</h2>
            <p className="mt-5 max-w-[690px] text-[16px] leading-7 text-[#667177] sm:text-[17px] sm:leading-8">Your team should not have to discover an evidence gap after a claim has been submitted.</p>
            <p className="mt-4 max-w-[690px] text-[16px] leading-7 text-[#667177] sm:text-[17px] sm:leading-8">Margin connects the records, facts and financial impact behind a recovery case, helping establish what is supported, what is missing and whether the case is ready for action.</p>
            <Link to="/audit-start" className="mt-8 inline-flex items-center gap-2 rounded-[7px] bg-[#635BFF] px-5 py-3 text-[13px] font-semibold text-white shadow-[0_12px_26px_rgba(99,91,255,0.18)] transition-colors hover:bg-[#5148E5]">Establish Your Financial Position <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </div>
        </section>
      <ExploreMoreWorkflows />
      </main>
      <BrandFooter wide />
    </div>
  );
}
