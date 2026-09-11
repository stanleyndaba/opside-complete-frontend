import { Link } from 'react-router-dom';
import { ArrowRight, Check, FileText, ShieldCheck } from 'lucide-react';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SITE_META } from '@/config/site';

const approvalItems = [
  ['Recovery issue', 'Inbound shipment receiving discrepancy'],
  ['Scope', '2 shipments, 1 supplier delivery, 17 units'],
  ['Evidence status', '14 of 17 units currently supported'],
  ['Known gap', 'Final settlement verification'],
  ['Estimated value', '$6,240 — not guaranteed'],
  ['Fixed fee', '$179'],
  ['Margin commission', '0%'],
  ['Margin will handle', 'Evidence organization, case documentation, response preparation, status follow-through, payout checking'],
  ['You control', 'Final approval before submission'],
] as const;

const operationSteps = [
  'Approved',
  'Evidence being prepared',
  'Submission ready for your review',
  'Submitted after your approval',
  'Amazon response received',
  'Payout checked',
  'Recovered / Partially recovered / Unresolved',
];

const completionSteps = [
  'Prepared and organized the available evidence.',
  'Prepared the defined recovery response.',
  'Obtained your approval before submission.',
  'Submitted the response to Amazon.',
  "Recorded Amazon's response.",
  'Checked the resulting payout where the available data permits.',
  'Shown the final outcome as Recovered, Partially recovered, or Unresolved.',
];

const workspaceBoundary = [
  'Recurring examination of the connected account data available to Margin',
  'Identification of new qualifying recovery incidents',
  'Evidence organization and preparation for qualifying, evidence-supported issues',
  'Recovery documentation and response preparation',
  'Follow-through on submitted recovery matters',
  'Deadline and status tracking',
  'Payout and settlement checking where the required data is available',
  "A recorded history of findings, submissions, Amazon decisions, and outcomes",
];

export default function RecoverOnce() {
  usePageMeta({
    title: 'Recover Once | Margin',
    description: 'Review the frozen Recover Once offer and approve a defined recovery operation.',
    url: `${SITE_META.url}/recover-once`,
    image: SITE_META.image,
  });

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FBFAF7] font-sans text-[#191B20]">
      <header className="sticky top-0 z-50 border-b border-[#E8E7E1] bg-[#FBFAF7]/95 backdrop-blur">
        <div className="mx-auto flex min-h-12 max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" title="Margin home" className="inline-flex min-w-0 items-center gap-2.5 rounded-md px-1.5 py-2 outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[#5165C7] focus-visible:ring-offset-2">
            <img src="/logoimagetwo.png" alt="Margin" width="20" height="20" className="h-5 w-auto object-contain" />
            <span className="font-merriweather text-[18px] font-semibold tracking-tight text-[#191B20]">Margin</span>
          </Link>
          <span className="inline-flex min-h-9 items-center rounded-[10px] bg-[#F0F0EC] px-3.5 text-[12px] font-medium text-[#595E68]">Recover Once</span>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-4 py-5 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <div className="mx-auto max-w-3xl space-y-4">
          <section className="rounded-[14px] border border-transparent bg-white p-4 shadow-[0_1px_2px_rgba(25,27,32,0.05)] sm:p-6" aria-labelledby="recover-once-title">
            <div className="border-b border-[#E8E7E1] pb-5">
              <div className="mb-3 flex items-center gap-2 text-[12px] font-semibold text-[#595E68]"><span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#F4F3ED] text-[#191B20]"><FileText className="h-3.5 w-3.5" aria-hidden="true" /></span><span>Recover Once</span></div>
              <h1 id="recover-once-title" className="font-lora text-[30px] font-normal leading-[1.08] tracking-[-0.02em] text-[#191B20] sm:text-[38px]">Your Audit Result</h1>
              <p className="mt-3 max-w-2xl text-[14px] leading-6 text-[#595E68]">We reviewed <strong className="font-semibold text-[#191B20]">3,214 orders, 41 inbound shipments, and 22 returns</strong> from <strong className="font-semibold text-[#191B20]">1 February to 30 April 2026</strong>.</p>
              <p className="mt-3 max-w-2xl text-[14px] leading-6 text-[#595E68]">We found <strong className="font-semibold text-[#191B20]">one defined inbound-shipment discrepancy</strong> affecting <strong className="font-semibold text-[#191B20]">17 units across two related shipments</strong>, both tied to the same supplier delivery and concentrated in the week of 10 March.</p>
              <p className="mt-3 max-w-2xl text-[14px] font-medium leading-6 text-[#191B20]">This is one specific event identified in the records reviewed — <strong className="font-semibold">not a general account warning.</strong></p>
            </div>

            <section className="mt-5 rounded-[10px] border border-[#D7D7D1] bg-[#F4F3ED] p-4 sm:p-5" aria-labelledby="what-margin-found">
              <h2 id="what-margin-found" className="text-[18px] font-semibold tracking-[-0.02em]">What Margin found</h2>
              <p className="mt-3 text-[14px] leading-6 text-[#595E68]">The records currently support the discrepancy for <strong className="font-semibold text-[#191B20]">14 of the 17 affected units</strong>.</p>
              <p className="mt-2 text-[14px] leading-6 text-[#595E68]">The remaining 3 units still require final verification.</p>
              <p className="mt-3 text-[14px] leading-6 text-[#595E68]">The shipment manifest, carrier receiving record, and inventory adjustment records align for the supported units. The remaining financial question is whether Amazon has already reimbursed any of the affected units and, if so, what amount remains outstanding.</p>
              <div className="mt-4 border-t border-[#D7D7D1] pt-4"><p className="text-[12px] font-semibold text-[#595E68]">Estimated value associated with the discrepancy</p><p className="mt-2 text-[15px] font-semibold text-[#191B20]">17 affected units × $367.06 estimated value per unit = $6,240.02</p><p className="mt-2 text-[22px] font-semibold tracking-[-0.03em] text-[#191B20]">Estimated value: $6,240</p><p className="mt-2 text-[12px] leading-5 text-[#595E68]">This is an estimate based on the records reviewed. It is <strong className="font-semibold text-[#191B20]">not a guaranteed reimbursement amount</strong> and does not mean Amazon owes $6,240.</p></div>
            </section>

            <section className="mt-4 rounded-[10px] border border-[#E8E7E1] bg-white p-4 sm:p-5" aria-labelledby="why-recover-once">
              <h2 id="why-recover-once" className="text-[18px] font-semibold tracking-[-0.02em]">Why Recover Once</h2>
              <p className="mt-3 text-[14px] leading-6 text-[#595E68]">This is a <strong className="font-semibold text-[#191B20]">bounded recovery issue</strong>:</p>
              <ul className="mt-2 space-y-1 text-[14px] leading-6 text-[#595E68]"><li>2 shipments</li><li>1 supplier delivery</li><li>17 affected units</li><li>1 defined discrepancy</li></ul>
              <p className="mt-3 text-[14px] leading-6 text-[#595E68]">It does not currently indicate an ongoing pattern requiring a recurring Recovery Workspace.</p>
              <p className="mt-3 text-[14px] font-semibold leading-6 text-[#191B20]">Recover Once is designed for exactly this kind of defined issue.</p>
            </section>

            <section className="mt-4 rounded-[10px] border border-[#D7D7D1] bg-[#F4F3ED] p-4 sm:p-5" aria-labelledby="fixed-fee">
              <h2 id="fixed-fee" className="text-[18px] font-semibold tracking-[-0.02em]">Why the $179 fixed fee makes sense</h2>
              <p className="mt-3 text-[14px] leading-6 text-[#595E68]">You are not paying Margin a percentage of the recovery.</p>
              <p className="mt-3 text-[15px] font-semibold text-[#191B20]">Recover Once: $179 fixed fee<br />Margin commission: 0%</p>
              <p className="mt-3 text-[14px] leading-6 text-[#595E68]">If Amazon ultimately reimburses $6,240, Margin still takes <strong className="font-semibold text-[#191B20]">0% of that reimbursement</strong>.</p>
              <p className="mt-2 text-[14px] font-semibold leading-6 text-[#191B20]">You keep the reimbursement.</p>
              <p className="mt-3 text-[14px] leading-6 text-[#595E68]">The $179 pays for Margin to carry out the defined recovery operation: organize the evidence, prepare the case documentation, manage the response, follow through on Amazon&apos;s decision, and check the resulting payout.</p>
              <p className="mt-3 text-[14px] leading-6 text-[#595E68]">Some recovery services charge <strong className="font-semibold text-[#191B20]">15–25% of recovered money</strong> instead.</p>
              <p className="mt-3 text-[14px] font-semibold leading-6 text-[#191B20]">Recover Once is different:</p>
              <ul className="mt-2 space-y-1 text-[14px] leading-6 text-[#595E68]"><li><strong className="font-semibold text-[#191B20]">You know the cost before approving.</strong></li><li><strong className="font-semibold text-[#191B20]">You keep 100% of the reimbursement.</strong></li><li><strong className="font-semibold text-[#191B20]">Margin does not take a percentage of the outcome.</strong></li></ul>
              <p className="mt-3 text-[14px] leading-6 text-[#595E68]">This is not necessarily the cheapest model for every situation. It is designed for sellers who prefer a <strong className="font-semibold text-[#191B20]">defined fixed cost and full ownership of the recovery.</strong></p>
            </section>

            <section className="mt-4 rounded-[10px] border border-[#E8E7E1] bg-white p-4 sm:p-5" aria-labelledby="approval-details">
              <h2 id="approval-details" className="text-[18px] font-semibold tracking-[-0.02em]">What you&apos;re approving</h2>
              <dl className="mt-4 overflow-hidden rounded-[10px] border border-[#E8E7E1] bg-[#FBFAF7]">{approvalItems.map(([label, value], index) => <div key={label} className={`grid gap-1 px-3 py-3 sm:grid-cols-[minmax(150px,0.38fr)_1fr] sm:gap-4 ${index > 0 ? 'border-t border-[#E8E7E1]' : ''}`}><dt className="text-[12px] font-semibold text-[#595E68]">{label}</dt><dd className="text-[13px] leading-5 text-[#191B20]">{value}</dd></div>)}</dl>
            </section>

            <section className="mt-4 rounded-[10px] border border-[#D7D7D1] bg-[#F4F3ED] p-4 sm:p-5" aria-labelledby="after-approval">
              <h2 id="after-approval" className="text-[18px] font-semibold tracking-[-0.02em]">What happens after approval</h2>
              <p className="mt-3 text-[14px] leading-6 text-[#595E68]">Once you approve and payment is completed:</p>
              <p className="mt-3 text-[14px] font-semibold leading-6 text-[#191B20]">Typical first submission target: 1–2 business days after approval, assuming the available evidence is sufficient to prepare the response.</p>
              <p className="mt-4 text-[14px] leading-6 text-[#595E68]">You will see the operation move through its status:</p>
              <ol className="mt-3 overflow-hidden rounded-[10px] border border-[#D7D7D1] bg-white">{operationSteps.map((step, index) => <li key={step} className={`flex items-center gap-3 px-3 py-2.5 text-[13px] ${index > 0 ? 'border-t border-[#E8E7E1]' : ''}`}><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#E9ECFF] text-[11px] font-semibold text-[#3F51A8]">{index + 1}</span><span className={index === operationSteps.length - 1 ? 'font-semibold text-[#191B20]' : 'text-[#595E68]'}>{step}</span></li>)}</ol>
              <p className="mt-3 text-[12px] leading-5 text-[#595E68]">Amazon&apos;s response time and final decision are outside Margin&apos;s control.</p>
            </section>

            <section className="mt-4 rounded-[10px] border border-[#E8E7E1] bg-white p-4 sm:p-5" aria-labelledby="more-evidence">
              <h2 id="more-evidence" className="text-[18px] font-semibold tracking-[-0.02em]">What if Amazon asks for more evidence?</h2>
              <p className="mt-3 text-[14px] leading-6 text-[#595E68]">If additional evidence is required and Margin can obtain or organize it from the available records, <strong className="font-semibold text-[#191B20]">the operation continues.</strong></p>
              <p className="mt-3 text-[14px] leading-6 text-[#595E68]">If the required evidence cannot be obtained or the issue cannot be substantiated further, Margin will show the case as <strong className="font-semibold text-[#191B20]">unresolved</strong> and explain why.</p>
              <p className="mt-3 text-[14px] font-semibold leading-6 text-[#191B20]">Margin will never represent an unresolved case as recovered.</p>
            </section>

            <section className="mt-4 rounded-[10px] border border-[#E8E7E1] bg-white p-4 sm:p-5" aria-labelledby="amazon-says-no">
              <h2 id="amazon-says-no" className="text-[18px] font-semibold tracking-[-0.02em]">What if Amazon says no?</h2>
              <p className="mt-3 text-[14px] leading-6 text-[#595E68]">Amazon makes the final reimbursement decision.</p>
              <p className="mt-3 text-[14px] leading-6 text-[#595E68]">If Amazon rejects the case, Margin records the rejection and the reason available from Amazon.</p>
              <p className="mt-3 text-[14px] leading-6 text-[#595E68]">The result will be shown as:</p>
              <ul className="mt-2 space-y-1 text-[14px] leading-6 text-[#595E68]"><li><strong className="font-semibold text-[#191B20]">Recovered</strong> — reimbursement confirmed</li><li><strong className="font-semibold text-[#191B20]">Partially recovered</strong> — some reimbursement confirmed</li><li><strong className="font-semibold text-[#191B20]">Unresolved</strong> — reimbursement not confirmed or the case could not be substantiated</li></ul>
              <p className="mt-3 text-[14px] leading-6 text-[#595E68]">The $179 remains the fixed fee for carrying out the defined operation, regardless of Amazon&apos;s final decision.</p>
            </section>

            <section className="mt-4 rounded-[10px] border border-[#D7D7D1] bg-[#F4F3ED] p-4 sm:p-5" aria-labelledby="approval-boundary">
              <h2 id="approval-boundary" className="text-[18px] font-semibold tracking-[-0.02em]">What you&apos;re approving</h2>
              <p className="mt-3 text-[14px] leading-6 text-[#595E68]">You are approving <strong className="font-semibold text-[#191B20]">Margin to carry out this specific recovery operation</strong>.</p>
              <p className="mt-3 text-[14px] leading-6 text-[#595E68]">You are <strong className="font-semibold text-[#191B20]">not</strong> approving a guaranteed reimbursement.</p>
              <p className="mt-3 text-[14px] leading-6 text-[#595E68]">Nothing is submitted to Amazon without your review and approval of the evidence and response.</p>
              <div className="mt-4 border-t border-[#D7D7D1] pt-4"><p className="text-[12px] font-semibold text-[#595E68]">Before you continue</p><p className="mt-2 text-[14px] font-medium leading-6 text-[#191B20]">“I approve Margin to carry out the Recover Once operation described above for $179. I understand that Amazon makes the final reimbursement decision, that the $6,240 figure is an estimate rather than a guaranteed payment, and that nothing is submitted without my review and approval first.”</p></div>
            </section>

            <section className="mt-4 rounded-[10px] border border-[#E8E7E1] bg-white p-4 sm:p-5" aria-labelledby="completion">
              <h2 id="completion" className="text-[18px] font-semibold tracking-[-0.02em]">Completion</h2>
              <p className="mt-3 text-[14px] leading-6 text-[#595E68]">The operation is complete when Margin has:</p>
              <ol className="mt-3 space-y-2 text-[14px] leading-6 text-[#595E68]">{completionSteps.map((step, index) => <li key={step} className="flex gap-3"><span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#DDF7F0] text-[#0E766C]"><Check className="h-3 w-3" aria-hidden="true" /></span><span><strong className="font-semibold text-[#191B20]">{index + 1}.</strong> {step}</span></li>)}</ol>
              <p className="mt-4 text-[14px] font-semibold leading-6 text-[#191B20]">You will see what happened. The case will not simply disappear into a queue.</p>
            </section>

            <section className="mt-4 rounded-[10px] border border-[#3F51A8] bg-[#E9ECFF] p-4 sm:p-5" aria-labelledby="your-decision">
              <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#3F51A8]" aria-hidden="true" /><div><h2 id="your-decision" className="text-[18px] font-semibold tracking-[-0.02em]">Your decision</h2><p className="mt-3 text-[14px] font-semibold leading-6 text-[#191B20]">Review evidence and approve — $179</p><button type="button" className="mt-4 inline-flex min-h-10 items-center gap-2 rounded-[8px] bg-[#3F51A8] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#31418D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5165C7] focus-visible:ring-offset-2">Review evidence and approve — $179 <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></button><p className="mt-5 border-t border-[#C8D0F2] pt-4 text-[14px] leading-6 text-[#595E68]"><strong className="font-semibold text-[#191B20]">Not ready?</strong></p><p className="mt-1 text-[13px] leading-5 text-[#595E68]">You can ask about <strong className="font-semibold text-[#191B20]">the estimate, the evidence, the $179 fee, what Margin handles, what you still control, or what happens if Amazon says no.</strong></p></div></div>
            </section>
          </section>
        </div>
      </main>
    </div>
  );
}
