import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, Zap, Users, ShieldAlert, FileSearch, Scale, BarChart3, Globe, ClipboardCheck } from 'lucide-react';

import { BrandFooter } from '@/components/layout/BrandFooter';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { SITE_META } from '@/config/site';
import { usePageMeta } from '@/hooks/usePageMeta';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const revealProps = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.18 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }
};

const containerClass = 'mx-auto w-full max-w-5xl px-6';
const labelClass = 'text-[11px] font-bold uppercase tracking-[0.15em] text-[#0B74DE]';
const sectionHeadingClass = 'font-lora text-3xl md:text-4xl font-medium tracking-tight text-[#182026] leading-tight';
const bodyTextClass = 'text-[16px] md:text-[18px] text-[#4D5B66] leading-relaxed tracking-tight';

export default function AboutMargin() {
  usePageMeta({
    title: 'About Margin — The Recovery Engine for Marketplace Businesses',
    description: 'Margin is building the Recovery Engine for marketplace businesses, starting with Amazon Seller Recovery and making unresolved marketplace money visible, evidence-backed, and accountable.',
    url: `${SITE_META.url}/about-margin`,
    image: SITE_META.image
  });

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FAFAF7] font-sans text-[#182026] selection:bg-[#0B74DE]/16 selection:text-[#182026]">
      <PublicNavbar variant="light" />

      <main className="relative">
        {/* Background effects */}
        <div className="pointer-events-none fixed inset-0 opacity-[0.45] [background-image:linear-gradient(rgba(11,116,222,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(11,116,222,0.045)_1px,transparent_1px)] [background-size:64px_64px]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[760px] bg-[radial-gradient(circle_at_18%_8%,rgba(11,116,222,0.13),transparent_32%),radial-gradient(circle_at_84%_12%,rgba(46,125,91,0.1),transparent_28%)]" />

        {/* Hero Section */}
        <section className="relative pt-32 pb-24 md:pt-48 md:pb-32">
          <div className={containerClass}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <span className={labelClass}>The Recovery Engine</span>
                <h1 className="font-lora text-4xl md:text-[76px] font-medium leading-[1.02] tracking-tight text-[#182026]">
                  Financial truth should not disappear inside a marketplace.
                </h1>
              </div>
              
              <div className="max-w-3xl space-y-6">
                <p className="text-xl md:text-2xl text-[#4D5B66] leading-relaxed tracking-tight font-medium">
                  Margin exists to make unresolved marketplace money visible, evidence-backed, and accountable.
                </p>
                <p className={bodyTextClass}>
                  We start with Amazon sellers because recovery becomes difficult long before it becomes optional. Inventory moves across accounts, warehouses, SKUs, markets, cases, reimbursements, reversals, and payouts. The records exist—but they rarely form one clear answer.
                </p>
                <p className={bodyTextClass}>
                  Margin brings those records together so a business can see what happened, what is supported, what remains uncertain, and what should happen next.
                </p>
              </div>

              <div className="pt-4 flex flex-wrap items-center gap-6">
                <Button asChild className="h-12 px-8 rounded-md bg-[#0B74DE] text-[14px] font-semibold text-white shadow-lg shadow-[#0B74DE]/20 hover:bg-[#075EBA] transition-all">
                  <Link to="/audit">Explore Recovery Audit</Link>
                </Button>
                <Link to="/contact" className="text-[14px] font-semibold text-[#182026] hover:underline flex items-center gap-2">
                  Talk to Margin <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Section 1: Why Margin exists */}
        <section className="py-24 border-t border-[#D8E3E8] bg-white/50">
          <div className={containerClass}>
            <div className="grid lg:grid-cols-12 gap-16">
              <div className="lg:col-span-5">
                <h2 className={sectionHeadingClass}>Important money should not depend on detective work.</h2>
              </div>
              <div className="lg:col-span-7 space-y-6">
                <p className={bodyTextClass}>
                  Marketplace businesses are expected to reconcile complex financial outcomes across systems they do not control.
                </p>
                <p className={bodyTextClass}>
                  An inventory discrepancy appears in one report. A case is discussed in another. A reimbursement is approved somewhere else. A reversal arrives later. The payout statement tells a different part of the story. The business is left to reconstruct the truth from fragments.
                </p>
                <p className={bodyTextClass}>
                  That work is expensive, repetitive, and easy to postpone—until the unresolved amount becomes material.
                </p>
                <div className="pt-6 p-8 rounded-xl border border-[#D8E3E8] bg-[#FAFAF7]">
                  <p className="text-[16px] font-semibold text-[#182026] leading-relaxed">
                    Margin exists to give marketplace businesses a reliable recovery record: what happened, what proves it, what is still missing, and who owns the next action.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: What we are building */}
        <section className="py-24 border-t border-[#D8E3E8]">
          <div className={containerClass}>
            <div className="max-w-3xl space-y-8">
              <div className="space-y-4">
                <h2 className={sectionHeadingClass}>Margin is the Recovery Engine for marketplace businesses.</h2>
                <p className="text-[14px] font-bold text-[#0B74DE] uppercase tracking-widest">Seller Recovery is the first business.</p>
              </div>
              <p className={bodyTextClass}>
                Margin examines the operational and financial records behind marketplace recovery, turns discrepancies into evidence-backed cases, and keeps the outcome visible through approval, payout, reversal, and final reconciliation.
              </p>
              <p className={bodyTextClass}>
                The immediate product is built for Amazon sellers. The larger company is built around a broader problem:
              </p>
              <blockquote className="border-l-4 border-[#0B74DE] pl-8 py-4">
                <p className="font-lora text-2xl md:text-3xl text-[#182026] leading-relaxed">
                  "When a marketplace transaction becomes financially unresolved, the business needs more than a report. It needs a trusted way to establish the truth and move the matter forward."
                </p>
              </blockquote>
              <p className="text-[16px] font-bold text-[#182026]">That is the Recovery Engine.</p>
            </div>
          </div>
        </section>

        {/* Section 3: The company belief */}
        <section className="py-24 bg-[#182026] text-white overflow-hidden relative">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none [background-image:linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] [background-size:40px_40px]" />
          <div className={containerClass + " relative z-10"}>
            <div className="max-w-3xl space-y-8">
              <h2 className="font-lora text-3xl md:text-4xl font-medium tracking-tight leading-tight">We believe recovery should be treated as an operating function.</h2>
              <p className="text-lg text-white/70 leading-relaxed">
                Recovery is often handled as a scattered side task: an occasional spreadsheet, a provider report, a support thread, a finance check, or a best-effort review when someone has time.
              </p>
              <p className="text-lg text-white/70 leading-relaxed font-semibold">
                That approach breaks as the business grows.
              </p>
              <p className="text-lg text-white/70 leading-relaxed">
                At scale, recovery affects cash, margin, inventory accuracy, financial close, provider accountability, and operational confidence. It belongs inside the operating system of the business—not outside it as an unexplained estimate.
              </p>
              <div className="pt-8 border-t border-white/10">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#0B74DE] mb-4">The Margin Belief</p>
                <p className="font-lora text-2xl md:text-3xl leading-relaxed text-white">
                  Money is not recovered when a system says "approved." Money is recovered when the outcome is supported, received, reconciled, and visible.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: How we work */}
        <section className="py-24 border-y border-[#D8E3E8]">
          <div className={containerClass}>
            <div className="mb-16">
              <h2 className={sectionHeadingClass}>How we work</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16">
              {[
                { title: "Evidence before assertion.", desc: "We do not begin with the amount a business hopes to recover. We begin with what the records can establish." },
                { title: "Truth before urgency.", desc: "A possible discrepancy is not the same as a verified recovery. Margin separates potential, verified, incomplete, reversed, paid, and unresolved states." },
                { title: "Control before automation.", desc: "Automation should make the operation easier to govern—not make it harder to understand. Important actions should have an owner, an evidence trail, and a clear state." },
                { title: "No forced sale.", desc: "If the evidence does not support a paid engagement, Margin should say so. A clean or incomplete result is better than an invented claim." },
                { title: "Approval is not payout.", desc: "A case is not finished because a platform marked it approved. The financial outcome must be followed through payment, reversal, offset, and final reconciliation." },
                { title: "The seller stays in control.", desc: "Margin can help examine, prepare, route, and monitor recovery work. The seller should understand what is happening and approve the actions that require approval." }
              ].map((item, i) => (
                <div key={i} className="space-y-4">
                  <h4 className="text-[16px] font-bold text-[#182026] tracking-tight">{item.title}</h4>
                  <p className="text-[14px] text-[#66737F] leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 5: The first business */}
        <section className="py-24 bg-white">
          <div className={containerClass}>
            <div className="grid lg:grid-cols-12 gap-16 items-start">
              <div className="lg:col-span-5 space-y-6">
                <h2 className={sectionHeadingClass}>The first business: <br />Seller Recovery</h2>
                <p className={bodyTextClass}>
                  We start where the financial and operational complexity is already visible.
                </p>
                <p className={bodyTextClass}>
                  Amazon sellers manage inventory, shipments, returns, reimbursements, transfers, fees, cases, and payouts across a marketplace that changes constantly.
                </p>
              </div>
              <div className="lg:col-span-7 rounded-2xl border border-[#D8E3E8] bg-[#FAFAF7] p-8 md:p-12 space-y-8">
                <h3 className="text-[13px] font-bold uppercase tracking-widest text-[#182026]">Margin's first Recovery Audit is designed to answer:</h3>
                <div className="grid sm:grid-cols-2 gap-6">
                  {[
                    "What may be missing?",
                    "What can the available records prove?",
                    "What has already been paid?",
                    "What was reversed or offset?",
                    "What is still incomplete?",
                    "What should the seller do next?"
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-[15px] font-medium text-[#182026]">
                      <div className="h-1.5 w-1.5 rounded-full bg-[#0B74DE]" />
                      {item}
                    </div>
                  ))}
                </div>
                <div className="pt-8 border-t border-[#D8E3E8]">
                  <p className="text-[15px] text-[#4D5B66] leading-relaxed">
                    From there, the seller can handle a defined recovery through <strong>Recover Once</strong>, or keep Margin examining the operation through <strong>Recovery Workspace</strong>.
                  </p>
                  <p className="mt-4 text-[15px] text-[#4D5B66] leading-relaxed italic">
                    The product may become more powerful over time. The promise remains simple: make recovery clearer, more controlled, and easier to trust.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: The engine beneath the product */}
        <section className="py-24 border-t border-[#D8E3E8]">
          <div className={containerClass}>
            <div className="max-w-3xl mb-16">
              <h2 className={sectionHeadingClass}>The engine beneath the product</h2>
              <p className="mt-4 text-lg text-[#4D5B66]">One truth model. Many recovery situations.</p>
            </div>

            <div className="rounded-lg border border-[#D8E3E8] bg-white shadow-sm overflow-hidden mb-12">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#FAFAF7] border-b border-[#D8E3E8]">
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-[#182026] w-[240px]">Layer</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-[#182026]">What it does</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#D8E3E8]">
                  {[
                    { l: "Operational record", d: "Reconstructs the inventory, return, shipment, case, or payout event." },
                    { l: "Evidence", d: "Shows which records support the finding and where coverage is incomplete." },
                    { l: "Commercial decision", d: "Determines whether the matter should be recovered, investigated, remediated, monitored, or closed." },
                    { l: "Outcome state", d: "Follows the matter through approval, payment, reversal, offset, and final resolution." }
                  ].map((row, i) => (
                    <tr key={i}>
                      <td className="px-6 py-5 text-[14px] font-bold text-[#182026]">{row.l}</td>
                      <td className="px-6 py-5 text-[14px] text-[#4D5B66]">{row.d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className={bodyTextClass + " max-w-3xl"}>
              This is what makes Margin more than an alerting tool or a reimbursement estimate. It is designed to preserve the relationship between what happened, what is proven, what is decided, and what finally occurred.
            </p>
          </div>
        </section>

        {/* Section 7: Consumer Recovery */}
        <section className="py-24 bg-[#FAFAF7] border-t border-[#D8E3E8]">
          <div className={containerClass}>
            <div className="grid lg:grid-cols-12 gap-16">
              <div className="lg:col-span-5 space-y-6">
                <h2 className={sectionHeadingClass}>The second test: <br />Consumer Recovery</h2>
                <p className={bodyTextClass}>
                  The engine should generalize—but the proof must come first.
                </p>
                <p className={bodyTextClass}>
                  Seller Recovery is the company's first business. Consumer Recovery is a later experiment built on the same underlying question:
                </p>
              </div>
              <div className="lg:col-span-7 space-y-8">
                <blockquote className="font-lora text-2xl md:text-3xl text-[#182026] leading-relaxed border-l-4 border-[#0B74DE] pl-8">
                  "What happens when a marketplace's financial record does not match the evidence held by the person on the other side of the transaction?"
                </blockquote>
                <p className={bodyTextClass}>
                  Consumer Recovery will remain narrow and evidence-heavy. It will focus on high-value unresolved transactions where the records support a meaningful contradiction—not generic customer support or promises of easy refunds.
                </p>
                <div className="pt-8 border-t border-[#D8E3E8]">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#8C9BA6] mb-6">The Order Matters</p>
                  <div className="flex flex-wrap items-center gap-4 text-[14px] font-bold text-[#182026] uppercase tracking-wider">
                    <span>Prove Seller Recovery</span>
                    <ArrowRight className="h-3 w-3 text-[#D8E3E8]" />
                    <span>Strengthen the engine</span>
                    <ArrowRight className="h-3 w-3 text-[#D8E3E8]" />
                    <span>Test the generalization</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 8: What Margin will not do */}
        <section className="py-24 border-t border-[#D8E3E8] bg-white">
          <div className={containerClass}>
            <div className="max-w-3xl space-y-12">
              <h2 className={sectionHeadingClass}>What Margin will not do</h2>
              <div className="space-y-6">
                {[
                  "Margin will not present every anomaly as recoverable money.",
                  "Margin will not confuse a possible amount with a verified outcome.",
                  "Margin will not force a seller to replace an existing provider without evidence.",
                  "Margin will not hide uncertainty behind a dashboard, a confidence score, or technical language.",
                  "Margin will not treat customer money, marketplace data, or operational access casually."
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <ShieldAlert className="h-5 w-5 text-[#0B74DE] mt-1 flex-shrink-0" />
                    <p className="text-[17px] font-medium text-[#182026] leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
              <p className="text-[14px] text-[#8C9BA6] italic pt-4">
                These are not marketing lines. They are product and operating constraints.
              </p>
            </div>
          </div>
        </section>

        {/* Section 9: Where we are now */}
        <section className="py-24 border-t border-[#D8E3E8] bg-[#FAFAF7]">
          <div className={containerClass}>
            <div className="grid lg:grid-cols-12 gap-16">
              <div className="lg:col-span-5">
                <h2 className={sectionHeadingClass}>Where we are now</h2>
                <p className="mt-6 text-lg text-[#4D5B66] leading-relaxed">
                  We are building the first reliable recovery loop.
                </p>
              </div>
              <div className="lg:col-span-7 space-y-8">
                <p className={bodyTextClass}>
                  Margin has built the core architecture for a server-owned, evidence-aware Recovery Audit with connected and manual entry paths. The system is designed to preserve intent, protect route boundaries, establish evidence states, support commercial decisions, and keep recovery outcomes visible.
                </p>
                <div className="space-y-4">
                  <p className="text-[13px] font-bold uppercase tracking-widest text-[#182026]">The remaining proof is commercial:</p>
                  <ul className="space-y-3">
                    {[
                      "real sellers must complete the Audit;",
                      "paid Recovery engagements must be delivered profitably;",
                      "the same customer loop must repeat;",
                      "and the product must earn recurring use through measurable control value."
                    ].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-[15px] text-[#4D5B66]">
                        <div className="h-1 w-1 rounded-full bg-[#0B74DE]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="text-[16px] font-semibold text-[#182026] italic">
                  "We would rather be precise about what has been proven than impressive about what has not."
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 10: The standard */}
        <section className="py-24 border-t border-[#D8E3E8] bg-white">
          <div className={containerClass}>
            <div className="max-w-3xl space-y-8">
              <h2 className={sectionHeadingClass}>The standard</h2>
              <p className={bodyTextClass}>
                Build the system we would trust with our own money.
              </p>
              <p className={bodyTextClass}>
                Margin is not being built to add another dashboard to an already crowded operation. It is being built to become the place where unresolved marketplace recovery is examined, understood, decided, executed, and remembered.
              </p>
              <div className="pt-8 grid sm:grid-cols-2 gap-8">
                {[
                  { label: "Clear", desc: "enough for a seller to understand" },
                  { label: "Rigorous", desc: "enough for finance to trust" },
                  { label: "Controlled", desc: "enough for operations to use" },
                  { label: "Transparent", desc: "enough for an enterprise buyer to evaluate" }
                ].map((item, i) => (
                  <div key={i} className="space-y-1">
                    <span className="text-[14px] font-bold text-[#182026] uppercase tracking-tight">{item.label}</span>
                    <p className="text-[14px] text-[#66737F]">{item.desc}</p>
                  </div>
                ))}
              </div>
              <p className="text-[15px] font-semibold text-[#182026] pt-4">
                ...and honest enough to say no when the evidence is not there.
              </p>
            </div>
          </div>
        </section>

        {/* Final Statement & CTA */}
        <section className="py-32 border-t border-[#D8E3E8] bg-[#FAFAF7]">
          <div className={containerClass}>
            <div className="max-w-4xl mx-auto text-center space-y-12">
              <p className="font-lora text-3xl md:text-5xl font-medium tracking-tight text-[#182026] leading-tight">
                Margin is building the Recovery Engine for marketplace businesses—starting with Amazon Seller Recovery and expanding only where the evidence proves the engine can carry more.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Button asChild className="h-12 px-8 rounded-md bg-[#0B74DE] text-[14px] font-semibold text-white shadow-lg shadow-[#0B74DE]/20 hover:bg-[#075EBA] transition-all">
                  <Link to="/audit">Run a Recovery Audit</Link>
                </Button>
                <Link to="/contact" className="text-[14px] font-semibold text-[#182026] hover:underline flex items-center gap-2">
                  Talk to the team building Margin <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <BrandFooter />
    </div>
  );
}
