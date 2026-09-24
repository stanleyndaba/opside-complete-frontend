import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SITE_META } from '@/config/site';

const operationSteps = [
  'Approved',
  'Evidence being prepared',
  'Submission ready for your review',
  'Submitted after your approval',
  'Amazon response received',
  'Payout checked',
  'Recovered / Partially recovered / Unresolved',
];

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
        <div className="mx-auto flex min-h-12 max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-6">
          <div className="min-w-0 px-1.5 py-1.5">
            <p className="text-[11px] font-medium tracking-tight text-[#595E68]">FBA Selling Partner Audit</p>
            <p className="mt-0.5 text-[10px] tracking-tight text-[#858792]">27 June 2026 · 13:41 pm UTC</p>
          </div>
          <Link to="/" title="Margin home" className="inline-flex min-w-0 items-center gap-2.5 rounded-md px-1.5 py-2 outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[#5165C7] focus-visible:ring-offset-2">
            <img src="/logoimagetwo.png" alt="Margin" width="20" height="20" className="h-5 w-auto object-contain" />
            <span className="font-merriweather text-[18px] font-semibold tracking-tight text-[#191B20]">Margin</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1180px] px-4 py-5 sm:px-6 sm:py-5 lg:px-6">
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10">
          <article className="min-w-0 rounded-[16px] bg-white px-5 py-5 shadow-[0_1px_2px_rgba(25,27,32,0.05)] sm:px-6 sm:py-5" aria-labelledby="recover-once-title">
            <header className="border-b border-[#E8E7E1] pb-7">
              <h1 id="recover-once-title" className="max-w-2xl text-[15px] leading-[1.2] tracking-[-0.02em] text-[#191B20] sm:text-[17px]">A complete view of your operation</h1>
              <p className="mt-2 inline-block max-w-2xl border-b border-[#D4D4D0] pb-1 text-[14px] leading-6 text-[#595E68] sm:text-[15px]">Investigation completed across <mark className="rounded-[2px] px-0.5 font-normal bg-[#E8EEF8] text-[#3F51A8]">10,442 placements</mark> in <mark className="rounded-[2px] px-0.5 font-normal bg-[#E9F3EC] text-[#26734D]">7 minutes</mark>.</p>
              <p className="mt-1.5 max-w-2xl text-[14px] leading-6 text-[#595E68]">Margin reviewed <mark className="rounded-[2px] px-0.5 font-normal bg-[#F8EEDB] text-[#8A5A16]">3,214 orders, 41 inbound shipments, and 22 returns</mark> from <mark className="rounded-[2px] px-0.5 font-normal bg-[#F3E7F0] text-[#7A4268]">1 February through 30 April 2026</mark>, comparing shipment, receiving, inventory-adjustment, and available financial records.</p>
              <p className="mt-1.5 max-w-2xl text-[14px] leading-6 text-[#595E68]">That comparison isolated <mark className="rounded-[2px] px-0.5 font-normal bg-[#E8EEF8] text-[#3F51A8]">one inbound-shipment discrepancy</mark> affecting <mark className="rounded-[2px] px-0.5 font-normal bg-[#E9F3EC] text-[#26734D]">17 units across two related shipments</mark>. Both shipments trace back to the same supplier delivery, with the activity concentrated in the week of 10 March.</p>
              <p className="mt-1.5 max-w-2xl text-[14px] font-medium leading-6 text-[#191B20]">The issue is not apparent from any one record alone. It becomes visible when the shipment manifest, carrier receiving record, and inventory adjustment history are reconciled together. This is a <mark className="rounded-[2px] px-0.5 font-normal bg-[#F8EEDB] text-[#8A5A16]">specific, bounded event within the reviewed records—not a general account warning.</mark></p>
            </header>

            <section className="border-b border-[#E8E7E1] py-5" aria-labelledby="what-margin-found">
              <p className="text-[11px] font-semibold uppercase tracking-tight text-[#777A82]">The finding</p>
              <h2 id="what-margin-found" className="mt-1.5 inline-block border-b border-[#D4D4D0] pb-1 text-[15px] font-normal leading-tight tracking-[-0.02em]">What Margin will handle</h2>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">The records currently substantiate <mark className="rounded-[2px] px-0.5 font-normal bg-[#F3E7F0] text-[#7A4268]">14 of the 17 affected units</mark>. The remaining 3 units are held for final verification rather than treated as confirmed.</p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">For the supported units, the shipment manifest, carrier receiving record, and inventory adjustment history align. The operational discrepancy is therefore evidenced. The remaining financial question is whether Amazon has already reimbursed any affected units and, if so, what amount remains outstanding.</p>
              <div className="mt-3 border-y border-[#E8E7E1] py-1.5">
                <dl className="grid gap-0 sm:grid-cols-3 sm:divide-x sm:divide-[#E8E7E1]">
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 py-1.5 sm:block sm:px-3 sm:first:pl-0 sm:last:pr-0">
                    <dt className="text-[10px] font-semibold uppercase tracking-tight text-[#777A82]">Supported units</dt>
                    <dd className="text-right text-[13px] font-semibold tracking-[-0.02em] text-[#191B20] sm:mt-0.5 sm:text-left">14 / 17 <span className="font-normal text-[#595E68]">affected units</span></dd>
                  </div>
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 border-t border-[#E8E7E1] py-1.5 sm:block sm:border-t-0 sm:px-3 sm:first:pl-0 sm:last:pr-0">
                    <dt className="text-[10px] font-semibold uppercase tracking-tight text-[#777A82]">Shipments</dt>
                    <dd className="text-right text-[13px] font-semibold tracking-[-0.02em] text-[#191B20] sm:mt-0.5 sm:text-left">2 <span className="font-normal text-[#595E68]">related shipments</span></dd>
                  </div>
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 border-t border-[#E8E7E1] py-1.5 sm:block sm:border-t-0 sm:px-3 sm:first:pl-0 sm:last:pr-0">
                    <dt className="text-[10px] font-semibold uppercase tracking-tight text-[#777A82]">Finding type</dt>
                    <dd className="text-right text-[13px] font-semibold tracking-[-0.02em] text-[#191B20] sm:mt-0.5 sm:text-left">Bounded <span className="font-normal text-[#595E68]">· one defined discrepancy</span></dd>
                  </div>
                </dl>
              </div>
              <div className="mt-1.5 border-l-2 border-[#3F51A8] pl-4"><p className="text-[12px] font-semibold text-[#595E68]">Estimated value associated with the discrepancy</p><p className="mt-1.5 text-[14px] font-semibold text-[#191B20]">17 affected units × $367.06 estimated value per unit = $6,240.02</p><p className="mt-1.5 text-[14px] font-semibold tracking-[-0.02em] text-[#191B20]">Estimated value: $6,240</p><p className="mt-1.5 text-[12px] leading-5 text-[#595E68]">This is an estimate based on the records reviewed. It is <mark className="rounded-[2px] px-0.5 font-normal bg-[#E8EEF8] text-[#3F51A8]">not a guaranteed reimbursement amount</mark> and does not mean Amazon owes $6,240.</p></div>
            </section>

            <section className="border-b border-[#E8E7E1] py-5" aria-labelledby="why-recover-once">
              <p className="text-[11px] font-semibold uppercase tracking-tight text-[#777A82]">The fit</p>
              <h2 id="why-recover-once" className="mt-1.5 inline-block border-b border-[#D4D4D0] pb-1 text-[15px] font-normal leading-tight tracking-[-0.02em]">Why Recover Once</h2>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">This is a <mark className="rounded-[2px] px-0.5 font-normal bg-[#E9F3EC] text-[#26734D]">bounded recovery issue</mark>: 2 shipments, 1 supplier delivery, 17 affected units, and 1 defined discrepancy.</p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">It does not currently indicate an ongoing pattern requiring a recurring Recovery Workspace.</p>
              <p className="mt-1.5 text-[14px] font-semibold leading-6 text-[#191B20]">Recover Once is designed for exactly this kind of defined issue.</p>
            </section>

            <section className="border-b border-[#E8E7E1] py-5" aria-labelledby="fixed-fee">
              <p className="text-[11px] font-semibold uppercase tracking-tight text-[#777A82]">The model</p>
              <h2 id="fixed-fee" className="mt-1.5 inline-block border-b border-[#D4D4D0] pb-1 text-[15px] font-normal leading-tight tracking-[-0.02em]">Why the $179 fixed fee makes sense</h2>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">You are not paying Margin a percentage of the recovery.</p>
              <dl className="mt-2 border-y border-[#E8E7E1] py-1.5 sm:grid sm:grid-cols-2 sm:divide-x sm:divide-[#E8E7E1]">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 py-1.5 sm:block sm:px-3 sm:first:pl-0 sm:last:pr-0"><dt className="text-[10px] font-semibold uppercase tracking-tight text-[#777A82]">Recover Once</dt><dd className="text-right text-[16px] font-semibold tracking-[-0.03em] text-[#191B20] sm:mt-0.5 sm:text-left">$179 <span className="text-[13px] font-normal text-[#595E68]">fixed fee</span></dd></div>
                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-3 border-t border-[#E8E7E1] py-1.5 sm:block sm:border-t-0 sm:px-3 sm:first:pl-0 sm:last:pr-0"><dt className="text-[10px] font-semibold uppercase tracking-tight text-[#777A82]">Margin commission</dt><dd className="text-right text-[16px] font-semibold tracking-[-0.03em] text-[#191B20] sm:mt-0.5 sm:text-left">0%</dd></div>
              </dl>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">If Amazon ultimately reimburses $6,240, Margin still takes <mark className="rounded-[2px] px-0.5 font-normal bg-[#F8EEDB] text-[#8A5A16]">0% of that reimbursement</mark>. <mark className="rounded-[2px] px-0.5 font-normal bg-[#F3E7F0] text-[#7A4268]">You keep the reimbursement.</mark></p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">The $179 pays for Margin to carry out the defined recovery operation: organize the evidence, prepare the case documentation, manage the response, follow through on Amazon&apos;s decision, and check the resulting payout.</p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">Some recovery services charge <mark className="rounded-[2px] px-0.5 font-normal bg-[#E8EEF8] text-[#3F51A8]">15–25% of recovered money</mark> instead.</p>
              <p className="mt-1.5 text-[14px] font-semibold leading-6 text-[#191B20]">Recover Once is different:</p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]"><mark className="rounded-[2px] px-0.5 font-normal bg-[#E9F3EC] text-[#26734D]">You know the cost before approving.</mark> <mark className="rounded-[2px] px-0.5 font-normal bg-[#F8EEDB] text-[#8A5A16]">You keep 100% of the reimbursement.</mark> <mark className="rounded-[2px] px-0.5 font-normal bg-[#F3E7F0] text-[#7A4268]">Margin does not take a percentage of the outcome.</mark></p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">This is not necessarily the cheapest model for every situation. It is designed for sellers who prefer a <mark className="rounded-[2px] px-0.5 font-normal bg-[#E8EEF8] text-[#3F51A8]">defined fixed cost and full ownership of the recovery.</mark></p>
            </section>

            <section className="border-b border-[#E8E7E1] py-5" aria-labelledby="after-approval">
              <p className="text-[11px] font-semibold uppercase tracking-tight text-[#777A82]">The operation</p>
              <h2 id="after-approval" className="mt-1.5 inline-block border-b border-[#D4D4D0] pb-1 text-[15px] font-normal leading-tight tracking-[-0.02em]">What happens after approval</h2>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">Once you approve and payment is completed, the <mark className="rounded-[2px] px-0.5 font-normal bg-[#E9F3EC] text-[#26734D]">typical first submission target is 1–2 business days after approval</mark>, assuming the available evidence is sufficient to prepare the response.</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">{operationSteps.map((step, index) => <div key={step} className="flex items-start gap-3 px-1 py-1"><span className="w-5 shrink-0 font-mono text-[11px] font-semibold text-[#3F51A8]">{index + 1}</span><span className={`text-[13px] leading-5 ${index === operationSteps.length - 1 ? 'font-semibold text-[#191B20]' : 'text-[#595E68]'}`}>{step}</span></div>)}</div>
              <p className="mt-1.5 text-[12px] leading-5 text-[#595E68]">Amazon&apos;s response time and final decision are outside Margin&apos;s control.</p>
            </section>

            <section className="border-b border-[#E8E7E1] py-5" aria-labelledby="evidence-and-outcomes">
              <p className="text-[11px] font-semibold uppercase tracking-tight text-[#777A82]">The boundaries</p>
              <h2 id="evidence-and-outcomes" className="mt-1.5 inline-block border-b border-[#D4D4D0] pb-1 text-[15px] font-normal leading-tight tracking-[-0.02em]">If the evidence or outcome changes</h2>
              <div className="mt-1.5 grid gap-4 sm:grid-cols-2"><div><h3 className="text-[14px] font-semibold text-[#191B20]">What if Amazon asks for more evidence?</h3><p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">If additional evidence is required and Margin can obtain or organize it from the available records, <mark className="rounded-[2px] px-0.5 font-normal bg-[#F8EEDB] text-[#8A5A16]">the operation continues.</mark></p><p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">If the required evidence cannot be obtained or the issue cannot be substantiated further, Margin will show the case as <mark className="rounded-[2px] px-0.5 font-normal bg-[#F3E7F0] text-[#7A4268]">unresolved</mark> and explain why.</p><p className="mt-1.5 text-[14px] font-semibold leading-6 text-[#191B20]">Margin will never represent an unresolved case as recovered.</p></div><div><h3 className="text-[14px] font-semibold text-[#191B20]">What if Amazon says no?</h3><p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">Amazon makes the final reimbursement decision. If Amazon rejects the case, Margin records the rejection and the reason available from Amazon.</p><p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">The result will be shown as <mark className="rounded-[2px] px-0.5 font-normal bg-[#E8EEF8] text-[#3F51A8]">Recovered</mark> — reimbursement confirmed; <mark className="rounded-[2px] px-0.5 font-normal bg-[#E9F3EC] text-[#26734D]">Partially recovered</mark> — some reimbursement confirmed; or <mark className="rounded-[2px] px-0.5 font-normal bg-[#F8EEDB] text-[#8A5A16]">Unresolved</mark> — reimbursement not confirmed or the case could not be substantiated.</p><p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">The $179 remains the fixed fee for carrying out the defined operation, regardless of Amazon&apos;s final decision.</p></div></div>
            </section>

            <section className="pt-8" aria-labelledby="completion">
              <p className="text-[11px] font-semibold uppercase tracking-tight text-[#777A82]">The finish line</p>
              <h2 id="completion" className="mt-1.5 inline-block border-b border-[#D4D4D0] pb-1 text-[15px] font-normal leading-tight tracking-[-0.02em]">Completion</h2>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">The operation is complete when Margin has prepared and organized the available evidence, prepared the defined recovery response, obtained your approval before submission, submitted the response to Amazon, recorded Amazon&apos;s response, checked the resulting payout where the available data permits, and shown the final outcome as <mark className="rounded-[2px] px-0.5 font-normal bg-[#F3E7F0] text-[#7A4268]">Recovered, Partially recovered, or Unresolved.</mark></p>
              <p className="mt-1.5 text-[14px] font-semibold leading-6 text-[#191B20]">You will see what happened. The case will not simply disappear into a queue.</p>
            </section>
          </article>

          <aside className="lg:sticky lg:top-20" aria-label="Recover Once decision summary">
            <div className="rounded-[14px] border border-[#D7D7D1] bg-white p-5 shadow-[0_8px_24px_rgba(25,27,32,0.06)] sm:p-4">
              <p className="text-[11px] font-semibold uppercase tracking-tight text-[#777A82]">Recovery quote</p>
              <h2 className="mt-1.5 inline-block border-b border-[#D4D4D0] pb-1 text-[15px] font-normal leading-tight tracking-[-0.02em]">Permission</h2>
              <div className="mt-2 border-y border-[#E8E7E1] py-2"><div className="flex items-baseline justify-between gap-4"><p className="text-[10px] font-semibold uppercase tracking-tight text-[#777A82]">Estimated value</p><p className="text-[14px] font-semibold tracking-[-0.05em] text-[#191B20]">$6,240</p></div><p className="mt-0.5 text-[11px] leading-5 text-[#595E68]">Estimate only — not a guaranteed reimbursement.</p></div>
              <dl className="mt-1.5 divide-y divide-[#E8E7E1] border-y border-[#E8E7E1]"><div className="flex items-center justify-between gap-4 py-3"><dt className="text-[12px] text-[#595E68]">Fixed fee</dt><dd className="text-[13px] font-semibold text-[#191B20]">$179</dd></div><div className="flex items-center justify-between gap-4 py-3"><dt className="text-[12px] text-[#595E68]">Margin commission</dt><dd className="text-[13px] font-semibold text-[#191B20]">0%</dd></div><div className="flex items-center justify-between gap-4 py-3"><dt className="text-[12px] text-[#595E68]">Evidence</dt><dd className="text-[13px] font-semibold text-[#191B20]">14 of 17 supported</dd></div></dl>
              <div className="mt-1.5"><p className="text-[12px] font-semibold text-[#191B20]">Offer details</p><dl className="mt-1.5 space-y-2">{approvalItems.map(([label, value]) => <div key={label} className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-3 text-[11px] leading-4"><dt className="text-[#777A82]">{label}</dt><dd className="text-right font-medium text-[#595E68]">{value}</dd></div>)}</dl></div>
              <div className="mt-1.5"><p className="text-[12px] font-semibold text-[#191B20]">What you&apos;re approving</p><p className="mt-1.5 text-[13px] leading-5 text-[#595E68]">Margin to carry out this specific recovery operation. You are not approving a guaranteed reimbursement.</p><p className="mt-1.5 text-[13px] leading-5 text-[#595E68]">Nothing is submitted to Amazon without your review and approval of the evidence and response.</p></div>
              <div className="mt-1.5 border-t border-[#E8E7E1] pt-5"><p className="text-[12px] font-semibold text-[#191B20]">Before you continue</p><p className="mt-1.5 text-[13px] leading-5 text-[#595E68]">“I approve Margin to carry out the Recover Once operation described above for $179. I understand that Amazon makes the final reimbursement decision, that the $6,240 figure is an estimate rather than a guaranteed payment, and that nothing is submitted without my review and approval first.”</p></div>
              <button type="button" className="mt-1.5 inline-flex min-h-10 w-fit items-center justify-center gap-2 rounded-[8px] bg-[#3F51A8] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#31418D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5165C7] focus-visible:ring-offset-2">Approve recovery — $179 <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></button>
              <p className="mt-1.5 border-t border-[#E8E7E1] pt-4 text-[13px] leading-5 text-[#595E68]"><mark className="rounded-[2px] px-0.5 font-normal bg-[#E8EEF8] text-[#3F51A8]">Not ready?</mark> You can ask about the estimate, the evidence, the $179 fee, what Margin handles, what you still control, or what happens if Amazon says no.</p>
            </div>
            <div className="mt-1.5 rounded-[14px] border border-[#E8E7E1] bg-white p-5"><div className="flex items-start gap-3"><div><p className="text-[12px] font-semibold text-[#191B20]">Seller-controlled operation</p><p className="mt-1 text-[12px] leading-5 text-[#595E68]">Margin prepares and follows through. You review and approve before anything is submitted.</p></div></div></div>
          </aside>
        </div>
      </main>
    </div>
  );
}
