import { Link } from 'react-router-dom';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SITE_META } from '@/config/site';

const operationSteps = [
  'Approved',
  'Existing supported incidents enter preparation',
  'Evidence prepared',
  'Submission presented for your review',
  'You approve submission',
  'Amazon response received',
  'Payout checked',
  'Recovered / Partially Recovered / Unresolved',
  'Margin continues examining new account data'
];

export default function RecoveryWorkspace() {
  usePageMeta({
    title: 'Recovery Workspace | Margin',
    description: 'Review your Audit result and start your Recovery Workspace subscription.',
    url: `${SITE_META.url}/recovery-workspace`,
    image: SITE_META.image,
  });

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FBFAF7] font-sans text-[#191B20]">
      <header className="sticky top-0 z-50 border-b border-[#E8E7E1] bg-[#FBFAF7]/95 backdrop-blur">
        <div className="mx-auto flex min-h-12 max-w-[1280px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-6">
          <div className="min-w-0 px-1.5 py-1.5">
            <p className="text-[11px] font-medium tracking-tight text-[#595E68]">FBA Selling Partner Audit</p>
            <p className="mt-0.5 text-[10px] tracking-tight text-[#858792]">27 June 2026 — 13:41 pm UTC</p>
          </div>
          <Link to="/" title="Margin home" className="inline-flex min-w-0 items-center gap-2.5 rounded-md px-1.5 py-2 outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[#5165C7] focus-visible:ring-offset-2">
            <img src="/logoimagetwo.png" alt="Margin" width="20" height="20" className="h-5 w-auto object-contain" />
            <span className="font-merriweather text-[18px] font-semibold tracking-tight text-[#191B20]">Margin</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1180px] px-4 py-5 sm:px-6 sm:py-5 lg:px-6">
        <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-10">
          <article className="min-w-0 rounded-[16px] bg-white px-5 py-5 shadow-[0_1px_2px_rgba(25,27,32,0.05)] sm:px-6 sm:py-5" aria-labelledby="recovery-workspace-title">
            <header className="border-b border-[#E8E7E1] pb-7">
              <h1 id="recovery-workspace-title" className="max-w-2xl font-lora text-[15px] leading-[1.2] tracking-[-0.02em] text-[#191B20] sm:text-[17px]">Your Audit Result</h1>
              <p className="mt-2 inline-block max-w-2xl text-[14px] leading-6 text-[#595E68] sm:text-[15px]">We reviewed <strong className="font-semibold text-[#191B20]">3,214 orders, 41 inbound shipments, 22 returns, 17 fee records, and 86 inventory movements</strong> across <strong className="font-semibold text-[#191B20]">1 February to 30 April 2026</strong>.</p>
              <p className="mt-1.5 max-w-2xl text-[14px] leading-6 text-[#595E68]">We found the same type of recovery issue occurring across <strong className="font-semibold text-[#191B20]">4 independent incidents</strong> in separate periods.</p>
              <p className="mt-1.5 max-w-2xl text-[14px] leading-6 text-[#595E68]">This is not one bounded event. The evidence indicates a <strong className="font-semibold text-[#191B20]">recurring recovery pattern</strong>.</p>
            </header>

            <section className="border-b border-[#E8E7E1] py-5" aria-labelledby="what-we-found">
              <p className="text-[11px] font-semibold uppercase tracking-tight text-[#777A82]">The pattern</p>
              <h2 id="what-we-found" className="mt-1.5 inline-block border-b border-[#D4D4D0] pb-1 font-lora text-[15px] font-normal leading-tight tracking-[-0.02em]">What we found</h2>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]"><strong className="font-semibold text-[#191B20]">Inbound-shipment receiving discrepancies</strong> appeared in <strong className="font-semibold text-[#191B20]">4 independent incidents</strong>:</p>
              <ul className="mt-2 list-inside list-disc space-y-1.5 text-[14px] text-[#595E68]">
                <li><strong className="font-semibold text-[#191B20]">10 March 2026</strong> — 17 affected units across two related shipments; the receiving and inventory records diverge after the same supplier delivery</li>
                <li><strong className="font-semibold text-[#191B20]">24 March 2026</strong> — 9 affected units across one shipment; the settlement record does not reconcile to the receiving quantity</li>
                <li><strong className="font-semibold text-[#191B20]">9 April and 22 April 2026</strong></li>
              </ul>
              <p className="mt-2 text-[14px] leading-6 text-[#595E68]">These are separate incidents, not multiple records from one delivery, shipment, or event.</p>
            </section>

            <section className="border-b border-[#E8E7E1] py-5" aria-labelledby="what-this-means">
              <h2 id="what-this-means" className="mt-1.5 inline-block border-b border-[#D4D4D0] pb-1 font-lora text-[15px] font-normal leading-tight tracking-[-0.02em]">What this means</h2>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">A single recovery operation can address what has already happened.</p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">It does not address the fact that the same type of issue is continuing to appear.</p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#191B20] font-semibold">Recover Once closes a defined incident. Workspace keeps Margin responsible for the recurring recovery problem.</p>
            </section>

            <section className="border-b border-[#E8E7E1] py-5" aria-labelledby="what-we-can-support">
              <h2 id="what-we-can-support" className="mt-1.5 inline-block border-b border-[#D4D4D0] pb-1 font-lora text-[15px] font-normal leading-tight tracking-[-0.02em]">What we can support</h2>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">Three incidents are supported enough to enter evidence preparation: the shipment manifests, carrier receiving records, and inventory adjustments align for 31 of the 44 affected units. One incident remains review-only while the settlement and payout records are reconciled.</p>
              <p className="mt-3 text-[14px] leading-6 text-[#191B20] font-semibold">What remains unverified:</p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">For 13 affected units, the available records do not yet establish whether Amazon has already reimbursed the units or what amount, if any, remains outstanding. Margin will not count those units as recovered or recoverable until that question is answered.</p>
              <p className="mt-3 text-[14px] leading-6 text-[#595E68]">We will not treat an unverified condition as a confirmed recovery opportunity.</p>
            </section>

            <section className="border-b border-[#E8E7E1] py-5" aria-labelledby="why-recovery-workspace">
              <h2 id="why-recovery-workspace" className="mt-1.5 inline-block border-b border-[#D4D4D0] pb-1 font-lora text-[15px] font-normal leading-tight tracking-[-0.02em]">Why Recovery Workspace</h2>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">Your existing <strong className="font-semibold text-[#191B20]">3 qualifying incidents are included</strong> in Workspace.</p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">You do not pay another recovery fee to have Margin work on those incidents.</p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">Workspace is for sellers who do not want recovery work to depend on remembering to look for the next problem after every incident.</p>
            </section>

            <section className="border-b border-[#E8E7E1] py-5" aria-labelledby="what-covers">
              <h2 id="what-covers" className="mt-1.5 inline-block border-b border-[#D4D4D0] pb-1 font-lora text-[15px] font-normal leading-tight tracking-[-0.02em]">What $109/month covers</h2>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">Workspace includes:</p>
              <ul className="mt-2 list-inside list-disc space-y-1.5 text-[14px] text-[#595E68]">
                <li>Recurring examination of the connected account data available to Margin</li>
                <li>Identification of new qualifying recovery incidents</li>
                <li>Evidence organization and preparation for qualifying, evidence-supported issues</li>
                <li>Recovery documentation and response preparation</li>
                <li>Follow-through on submitted recovery matters</li>
                <li>Deadline and status tracking</li>
                <li>Payout and settlement checking where the required data is available</li>
                <li>A recorded history of findings, submissions, Amazon decisions, and outcomes</li>
              </ul>
              <p className="mt-3 text-[14px] leading-6 text-[#595E68]">Each month, you can see:</p>
              <ul className="mt-2 list-inside list-disc space-y-1.5 text-[14px] text-[#595E68]">
                <li>What new issues were identified</li>
                <li>What evidence supports each issue</li>
                <li>What Margin is doing about it</li>
                <li>What has been submitted</li>
                <li>What Amazon decided</li>
                <li>What Amazon paid</li>
                <li>What remains unresolved</li>
              </ul>
              <p className="mt-3 text-[14px] leading-6 text-[#191B20] font-semibold">If nothing new is found, Margin reports that honestly.</p>
            </section>

            <section className="border-b border-[#E8E7E1] py-5" aria-labelledby="what-ongoing-means">
              <h2 id="what-ongoing-means" className="mt-1.5 inline-block border-b border-[#D4D4D0] pb-1 font-lora text-[15px] font-normal leading-tight tracking-[-0.02em]">What "ongoing" means</h2>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">Workspace examines the <strong className="font-semibold text-[#191B20]">connected account data available to Margin as new data becomes available</strong>.</p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">It is not a promise that a human or system checks every transaction every second.</p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">It means the recurring examination and recovery responsibility remains active while your Workspace subscription is active.</p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">New incidents are evaluated against the evidence available at the time. Only <strong className="font-semibold text-[#191B20]">qualifying, evidence-supported recovery issues</strong> enter recovery work.</p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">There is no promise that every detected condition will qualify for submission.</p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#191B20] font-semibold">If a matter falls outside the included operating scope, Margin will show you the difference before proceeding.</p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">There are <strong className="font-semibold text-[#191B20]">no percentage-based recovery fees</strong>. Margin takes <strong className="font-semibold text-[#191B20]">0% of Amazon reimbursements</strong>.</p>
            </section>

            <section className="border-b border-[#E8E7E1] py-5" aria-labelledby="existing-incidents">
              <h2 id="existing-incidents" className="mt-1.5 inline-block border-b border-[#D4D4D0] pb-1 font-lora text-[15px] font-normal leading-tight tracking-[-0.02em]">Existing incidents: what happens first</h2>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">Your <strong className="font-semibold text-[#191B20]">4 incidents already identified by this Audit are included</strong>.</p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">Assuming the available evidence is sufficient, they typically enter evidence preparation within <strong className="font-semibold text-[#191B20]">1–2 business days after approval</strong>.</p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">New incidents follow their own preparation status and timing as new account data becomes available.</p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">Amazon's response time is outside Margin's control.</p>
            </section>

            <section className="border-b border-[#E8E7E1] py-5" aria-labelledby="why-price">
              <h2 id="why-price" className="mt-1.5 inline-block border-b border-[#D4D4D0] pb-1 font-lora text-[15px] font-normal leading-tight tracking-[-0.02em]">Why $109/month?</h2>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">You are not paying $109 because Margin promises a recovery every month.</p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">You are paying $109 so the <strong className="font-semibold text-[#191B20]">recurring examination, evidence work, follow-through, payout checking, and recovery history</strong> do not return to your own workload whenever the next issue appears.</p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#191B20] font-semibold">Recover Once means you bring each defined problem to Margin. Workspace means Margin keeps looking for the next one.</p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">You pay a fixed monthly fee.</p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#191B20] font-semibold">You keep 100% of whatever Amazon reimburses.</p>
            </section>

            <section className="border-b border-[#E8E7E1] py-5" aria-labelledby="what-if-no">
              <h2 id="what-if-no" className="mt-1.5 inline-block border-b border-[#D4D4D0] pb-1 font-lora text-[15px] font-normal leading-tight tracking-[-0.02em]">What happens if Amazon says no?</h2>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">If Amazon rejects a recovery matter, Margin records the decision and reason, completes appropriate follow-up where the available evidence supports it, and records the final outcome.</p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">A rejected or unresolved matter is never represented as recovered.</p>
            </section>

            <section className="border-b border-[#E8E7E1] py-5" aria-labelledby="what-if-evidence">
              <h2 id="what-if-evidence" className="mt-1.5 inline-block border-b border-[#D4D4D0] pb-1 font-lora text-[15px] font-normal leading-tight tracking-[-0.02em]">What if Amazon asks for more evidence?</h2>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">If the required evidence can be obtained from the connected account data or available sources, Margin continues the work.</p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">If the required evidence cannot be established, the matter is shown as <strong className="font-semibold text-[#191B20]">unresolved</strong> with the reason.</p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">Margin does not manufacture evidence to keep a case alive.</p>
            </section>

            <section className="border-b border-[#E8E7E1] py-5" aria-labelledby="does-not-promise">
              <h2 id="does-not-promise" className="mt-1.5 inline-block border-b border-[#D4D4D0] pb-1 font-lora text-[15px] font-normal leading-tight tracking-[-0.02em]">What Workspace does not promise</h2>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">Workspace does <strong className="font-semibold text-[#191B20]">not</strong> promise:</p>
              <ul className="mt-2 list-inside list-disc space-y-1.5 text-[14px] text-[#595E68]">
                <li>A recovery every month</li>
                <li>A particular reimbursement amount</li>
                <li>Amazon approval</li>
                <li>That every detected condition qualifies for recovery</li>
                <li>That Amazon will respond within a particular timeframe</li>
              </ul>
              <p className="mt-3 text-[14px] leading-6 text-[#595E68]">Some months may produce no new recovery issues.</p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#191B20] font-semibold">Margin will tell you when that happens.</p>
            </section>

            <section className="border-b border-[#E8E7E1] py-5" aria-labelledby="recover-once-vs-workspace">
              <h2 id="recover-once-vs-workspace" className="mt-1.5 inline-block border-b border-[#D4D4D0] pb-1 font-lora text-[15px] font-normal leading-tight tracking-[-0.02em]">Recover Once vs Workspace</h2>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="text-[14px] font-semibold text-[#191B20]">Recover Once</h3>
                  <p className="mt-1 text-[14px] leading-6 text-[#595E68]">For a bounded problem you want Margin to resolve once.</p>
                </div>
                <div>
                  <h3 className="text-[14px] font-semibold text-[#191B20]">Workspace</h3>
                  <p className="mt-1 text-[14px] leading-6 text-[#595E68]">For a recurring problem you want Margin to keep examining and managing over time.</p>
                </div>
              </div>
              <p className="mt-3 text-[14px] leading-6 text-[#595E68]">If you would rather only resolve the <strong className="font-semibold text-[#191B20]">4 incidents already identified</strong>, Recover Once remains available for that defined scope.</p>
            </section>

            <section className="pt-8" aria-labelledby="what-you-control">
              <p className="text-[11px] font-semibold uppercase tracking-tight text-[#777A82]">Seller-controlled</p>
              <h2 id="what-you-control" className="mt-1.5 inline-block border-b border-[#D4D4D0] pb-1 font-lora text-[15px] font-normal leading-tight tracking-[-0.02em]">What you control</h2>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">You remain in control of submissions.</p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#191B20] font-semibold">Nothing is filed or submitted to Amazon without your approval.</p>
              <p className="mt-3 text-[14px] leading-6 text-[#595E68]">You can cancel Workspace at any time.</p>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68]">If you cancel, Workspace remains active through the period you've paid for. Ongoing monitoring and new Workspace operations stop when that paid period ends. Your completed recovery history and recorded outcomes remain available.</p>
            </section>
          </article>

          <aside className="lg:sticky lg:top-20" aria-label="Recovery Workspace decision summary">
            <div className="rounded-[14px] border border-[#D7D7D1] bg-white p-5 shadow-[0_8px_24px_rgba(25,27,32,0.06)] sm:p-4">
              <p className="text-[11px] font-semibold uppercase tracking-tight text-[#777A82]">What happens after you approve</p>
              <h2 className="mt-1.5 inline-block border-b border-[#D4D4D0] pb-1 font-lora text-[15px] font-normal leading-tight tracking-[-0.02em]">The Workspace flow</h2>
              
              <div className="mt-4 border-y border-[#E8E7E1] py-4">
                <div className="grid gap-2">{operationSteps.map((step, index) => <div key={step} className="flex items-start gap-3 px-1 py-1"><span className="w-5 shrink-0 font-mono text-[11px] font-semibold text-[#3F51A8]">{index === 0 ? "✓" : "↓"}</span><span className={`text-[13px] leading-5 ${index === operationSteps.length - 1 ? 'font-semibold text-[#191B20]' : 'text-[#595E68]'}`}>{step}</span></div>)}</div>
              </div>

              <div className="mt-4">
                <p className="text-[11px] font-semibold uppercase tracking-tight text-[#777A82]">What this costs</p>
                <div className="mt-1.5 flex items-baseline justify-between gap-4">
                  <p className="text-[24px] font-semibold tracking-[-0.05em] text-[#191B20]">$109<span className="text-[15px] font-normal text-[#595E68]">/month</span></p>
                </div>
                <p className="mt-2 text-[13px] font-semibold leading-5 text-[#191B20]">0% recovery commission.</p>
                <p className="text-[13px] font-semibold leading-5 text-[#191B20]">You keep 100% of Amazon reimbursements.</p>
                <p className="mt-1 text-[13px] leading-5 text-[#595E68]">No percentage of recovered money is charged.</p>
              </div>
              
              <div className="mt-4 border-t border-[#E8E7E1] pt-5"><p className="text-[12px] font-semibold text-[#191B20]">Before you continue</p><p className="mt-1.5 text-[12px] italic leading-5 text-[#595E68]">I approve Margin to begin Recovery Workspace at $109/month. I understand that the 4 incidents identified in this Audit are included, that Workspace provides ongoing examination and recovery work for qualifying, evidence-supported issues, and that Amazon makes the final decision on any submitted recovery matter. I understand that nothing is submitted without my approval.</p></div>
              
              <button type="button" className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-[8px] bg-[#3F51A8] px-4 text-[13px] font-medium text-white transition-colors hover:bg-[#31418D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5165C7] focus-visible:ring-offset-2">Start Recovery Workspace — $109/month</button>
              
              <div className="mt-2.5 text-center">
                <p className="text-[11px] font-medium text-[#595E68]">0% commission · Keep 100% of Amazon reimbursements · Cancel anytime</p>
              </div>

              <div className="mt-4 border-t border-[#E8E7E1] pt-4 rounded-[8px] bg-[#F9F9F6] p-4 text-[12px] leading-5 text-[#595E68]">
                <strong className="font-semibold text-[#191B20]">Not ready?</strong> Tell us what's unclear: the pattern found, what Workspace covers, what "ongoing" means, the price, or how it differs from Recover Once.
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
