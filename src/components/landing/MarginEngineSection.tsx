import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, Check, CircleDollarSign, FileCheck2, GitBranch, SearchCheck, ShieldCheck, Waypoints } from "lucide-react";

const inputs = [
  { title: "Financial events", label: "What money moved", items: ["Orders", "Settlements", "Fees", "Refunds", "Payouts", "Adjustments"], icon: CircleDollarSign },
  { title: "Operational events", label: "What physically happened", items: ["Shipments", "Inventory", "Returns", "FBA movements", "Fulfillment events", "Account activity"], icon: Waypoints },
  { title: "Commercial context", label: "What the transaction means", items: ["SKU / ASIN", "Product data", "Order value", "Sales activity", "Marketplace context", "Seller configuration"], icon: GitBranch },
];

const outputs = [
  { title: "Findings", label: "Financial truth", copy: "Understand what happened.", items: ["What happened", "Should have happened", "What is missing", "Already resolved"], icon: SearchCheck },
  { title: "Recovery", label: "Action on legitimate entitlement", copy: "Act on what is legitimately owed.", items: ["Evidence packages", "Claims", "Disputes", "Appeals", "Follow-ups"], icon: FileCheck2 },
  { title: "Control", label: "What remains financially open", copy: "Know what is resolved and what remains open.", items: ["Recovered", "Reconciled", "Outstanding", "Unresolved", "Monitored"], icon: ShieldCheck },
];

const questions = ["What happened?", "What should have happened?", "What’s missing?", "What are we entitled to?", "What proves it?", "What should happen next?", "Did the money actually arrive?"];

function DataCard({ item, index }: { item: typeof inputs[number]; index: number }) {
  const Icon = item.icon;
  return (
    <motion.article initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ delay: index * 0.08, duration: 0.45 }} className="relative rounded-[7px] border border-[#D8E7EC] bg-white/75 p-4 shadow-[0_10px_24px_rgba(72,103,122,0.06)] backdrop-blur-xl">
      <div className="flex items-center gap-2"><Icon className="h-4 w-4 text-[#0B74DE]" strokeWidth={1.6} /><h3 className="text-[13px] font-semibold capitalize tracking-tight text-[#34414A]">{item.title}</h3></div>
      <p className="mt-2 font-mono text-[9px] font-semibold uppercase tracking-tight text-[#78909B]">{item.label}</p>
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-[#536872]">{item.items.map((entry) => <span key={entry}>{entry}</span>)}</div>
    </motion.article>
  );
}

function OutputCard({ item, index }: { item: typeof outputs[number]; index: number }) {
  const Icon = item.icon;
  return (
    <motion.article initial={{ opacity: 0, x: 12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ delay: index * 0.08, duration: 0.45 }} className="relative rounded-[7px] border border-[#D8E7EC] bg-white/75 p-4 shadow-[0_10px_24px_rgba(72,103,122,0.06)] backdrop-blur-xl">
      <div className="flex items-center gap-2"><Icon className="h-4 w-4 text-[#0B74DE]" strokeWidth={1.6} /><h3 className="font-lora text-[18px] leading-none tracking-tight text-[#34414A]" style={{ fontWeight: 400 }}>{item.title}</h3></div>
      <p className="mt-2 font-mono text-[9px] font-semibold uppercase tracking-tight text-[#78909B]">{item.label}</p>
      <p className="mt-3 text-[11px] font-medium leading-4 text-[#536872]">{item.copy}</p>
      <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-[#536872]">{item.items.map((entry) => <span key={entry}>{entry}</span>)}</div>
    </motion.article>
  );
}

export function MarginEngineSection() {
  const reduceMotion = useReducedMotion();
  return (
    <section className="relative overflow-hidden bg-[#F4FAFC] py-[52px] md:py-[76px]" aria-labelledby="margin-engine-title">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(178,220,232,0.28),transparent_38%)]" />
      <div className="relative mx-auto w-full max-w-[1240px] px-5 sm:px-8">
        <div className="mb-10 max-w-[620px] md:mb-14">
          <div className="mb-4 flex items-center gap-3"><div className="h-px w-8 bg-[#0B74DE]" /><span className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[#0B74DE]">02 / MARGIN ENGINE</span></div>
          <h2 id="margin-engine-title" className="font-lora text-[32px] leading-[1.03] tracking-[-0.04em] text-[#34414A] sm:text-[44px]" style={{ fontWeight: 400 }}>Reality becomes financial resolution.</h2>
          <p className="mt-4 text-[15px] leading-7 text-[#536872] sm:text-[17px]">Margin turns fragmented Amazon events into financial truth, entitlement, evidence, action, and control.</p>
        </div>

        <div className="relative grid items-center gap-8 lg:grid-cols-[0.9fr_1.2fr_0.9fr] lg:gap-12">
          <div className="space-y-3">{inputs.map((item, index) => <DataCard key={item.title} item={item} index={index} />)}</div>

          <motion.div initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.55 }} className="relative rounded-[10px] border border-[#BFDCE6] bg-white/78 p-5 shadow-[0_18px_50px_rgba(72,103,122,0.10)] backdrop-blur-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4 border-b border-[#D8E7EC] pb-4"><div><p className="font-mono text-[10px] font-semibold uppercase tracking-tight text-[#0B74DE]">Margin Engine</p><h3 className="mt-2 font-lora text-[25px] leading-none tracking-tight text-[#34414A]" style={{ fontWeight: 400 }}>Financial Event Resolution</h3></div><div className="rounded-full bg-[#D9EEF5] p-2 text-[#0B74DE]"><CircleDollarSign className="h-5 w-5" /></div></div>
            <div className="mt-5 space-y-2">{questions.map((question, index) => <motion.div key={question} initial={{ opacity: 0.45 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: index * 0.06 }} className="flex items-center gap-2 text-[12px] text-[#536872]"><span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#EAF5F8] text-[#0B74DE]"><Check className="h-2.5 w-2.5" /></span>{question}</motion.div>)}</div>
            <div className="mt-6 flex flex-wrap gap-2 border-t border-[#D8E7EC] pt-4">{["Relationships", "Definitions", "Rules", "Evidence", "Outcomes"].map((item) => <span key={item} className="rounded-full bg-[#F1F7F9] px-2.5 py-1 font-mono text-[9px] font-semibold uppercase tracking-tight text-[#64808D]">{item}</span>)}</div>
            {!reduceMotion && <motion.div aria-hidden="true" className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#0B74DE]/50 to-transparent" animate={{ x: ["-15%", "15%", "-15%"], opacity: [0.2, 0.7, 0.2] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} />}
          </motion.div>

          <div className="space-y-3">{outputs.map((item, index) => <OutputCard key={item.title} item={item} index={index} />)}</div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-2 text-center text-[11px] font-mono uppercase tracking-tight text-[#64808D] lg:hidden"><ArrowDown className="h-4 w-4 text-[#0B74DE]" /> Reality → Truth → Resolution → Control</div>
        <p className="mt-10 text-center font-lora text-[18px] leading-tight tracking-tight text-[#34414A] sm:text-[22px]" style={{ fontWeight: 400 }}>Every financial discrepancy becomes a traceable decision.</p>
      </div>
    </section>
  );
}
