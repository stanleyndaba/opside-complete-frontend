import { motion, useReducedMotion } from "framer-motion";
import { ArrowDown, Building2, CheckCircle2, FileCheck2, Layers, Store, WalletCards } from "lucide-react";

const inputs = [
  { title: "Financial Events", subtitle: "Amazon says one thing. Your bank says another. Your reports say something else.", label: "What money moved", items: ["Orders", "Settlements", "Fees", "Refunds", "Payouts", "Adjustments"], icon: Building2 },
  { title: "Operational Events", subtitle: "Inventory moved. Orders changed. Returns happened. Fees appeared. Refunds were issued. You can't reliably reconstruct what actually happened.", label: "What physically happened", items: ["Shipments", "Inventory", "Returns", "FBA movements", "Fulfillment events", "Account activity"], icon: Layers },
  { title: "Commercial Context", subtitle: "Amazon doesn't owe you because you think it does. You need the records, the timeline, the evidence, and the calculation.", label: "What the transaction means", items: ["SKU / ASIN", "Product data", "Order value", "Sales activity", "Marketplace context", "Seller configuration"], icon: Store },
];

const outputs = [
  { title: "Findings", label: "Financial truth", copy: "Know what Amazon got wrong.", items: ["What happened", "Should have happened", "What is missing", "Already resolved"], icon: FileCheck2 },
  { title: "Recovery", label: "Action on legitimate entitlement", copy: "Get back what you're owed.", items: ["Evidence packages", "Claims", "Disputes", "Appeals", "Follow-ups"], icon: WalletCards },
  { title: "Control", label: "What remains financially open", copy: "Know where your money stands.", items: ["Recovered", "Reconciled", "Outstanding", "Unresolved", "Monitored"], icon: CheckCircle2 },
];

const questions = ["What happened?", "What should have happened?", "What’s missing?", "What are we entitled to?", "What proves it?", "What should happen next?", "Did the money actually arrive?"];

function DataCard({ item, index }: { item: typeof inputs[number]; index: number }) {
  const Icon = item.icon;
  return (
    <motion.article initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ delay: index * 0.08, duration: 0.45 }} className="relative rounded-[7px] border border-[#D8E7EC] bg-white/75 p-3 shadow-[0_10px_24px_rgba(72,103,122,0.06)] backdrop-blur-xl">
      <div className="flex items-center gap-3"><span className="flex h-4 w-4 shrink-0 items-center justify-center text-[#6B7280]"><Icon className="h-full w-full" strokeWidth={1.5} /></span><h3 className="text-[13px] font-semibold tracking-tight text-[#34414A]">{item.title}</h3></div>
      <p className="mt-3 text-[11px] leading-5 text-[#536872]">{item.subtitle}</p>
    </motion.article>
  );
}

function OutputCard({ item, index }: { item: typeof outputs[number]; index: number }) {
  const Icon = item.icon;
  return (
    <motion.article initial={{ opacity: 0, x: 12 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ delay: index * 0.08, duration: 0.45 }} className="relative rounded-[7px] border border-[#D8E7EC] bg-white/75 p-3 shadow-[0_10px_24px_rgba(72,103,122,0.06)] backdrop-blur-xl">
      <div className="flex items-center gap-3"><span className="flex h-4 w-4 shrink-0 items-center justify-center text-[#6B7280]"><Icon className="h-full w-full" strokeWidth={1.5} /></span><h3 className="font-lora text-[18px] leading-none tracking-tight text-[#34414A]" style={{ fontWeight: 400 }}>{item.title}</h3></div>
      <p className="mt-3 text-[12px] font-medium leading-5 text-[#536872]">{item.copy}</p>
    </motion.article>
  );
}

export function MarginEngineSection() {
  const reduceMotion = useReducedMotion();
  return (
    <section className="relative hidden overflow-hidden bg-[#F4FAFC] py-[52px] md:block md:py-[76px]" aria-labelledby="margin-engine-title">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(178,220,232,0.28),transparent_38%)]" />
      <div className="relative mx-auto w-full max-w-[1240px] px-5 sm:px-8">
        <div className="mb-10 max-w-[720px] md:mb-14">
          <h2 id="margin-engine-title" className="font-lora text-[32px] leading-[1.03] tracking-[-0.04em] text-[#34414A] sm:text-[44px]" style={{ fontWeight: 400 }}>One Recovery Operation for Your Amazon Business</h2>
          <p className="mt-4 text-[15px] leading-7 text-[#536872] sm:text-[17px]">Margin turns fragmented Amazon events into financial truth, entitlement, evidence, action, and control.</p>
        </div>

        <div className="relative grid items-center gap-6 lg:grid-cols-[0.8fr_1fr_0.8fr] lg:gap-9">
          <svg className="pointer-events-none absolute inset-0 z-0 hidden h-full w-full overflow-visible lg:block" viewBox="0 0 1000 500" preserveAspectRatio="none" aria-hidden="true">
            <g fill="none" stroke="#B8CBD3" strokeWidth="1.15" strokeDasharray="2.5 4" opacity="0.78">
              <path d="M245 82 C285 82 286 182 328 238" />
              <path d="M245 250 C278 250 298 250 328 250" />
              <path d="M245 418 C285 418 286 318 328 262" />
              <path d="M332 250 C345 250 356 250 370 250" />
            </g>
            <g fill="none" stroke="#B8CBD3" strokeWidth="1.15" opacity="0.78">
              <path d="M630 250 C645 250 656 250 670 250" />
              <path d="M672 238 C714 182 715 82 755 82" />
              <path d="M672 250 C702 250 722 250 755 250" />
              <path d="M672 262 C714 318 715 418 755 418" />
            </g>
            <g fill="#34414A">
              <circle cx="330" cy="250" r="5" /><circle cx="370" cy="250" r="3.5" /><circle cx="670" cy="250" r="5" /><circle cx="630" cy="250" r="3.5" />
              <circle cx="630" cy="150" r="2.5" /><circle cx="630" cy="250" r="2.5" /><circle cx="630" cy="350" r="2.5" />
            </g>
          </svg>
          <div className="relative z-10 space-y-3">{inputs.map((item, index) => <DataCard key={item.title} item={item} index={index} />)}</div>

          <motion.div initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: 0.55 }} className="relative z-10 rounded-[10px] border border-[#BFDCE6] bg-white/78 p-4 shadow-[0_18px_50px_rgba(72,103,122,0.10)] backdrop-blur-2xl sm:p-5">
            <div className="border-b border-[#D8E7EC] pb-3"><div className="flex items-center gap-2"><img src="/logoimagetwo.png" alt="Margin" width="20" height="20" className="h-4 w-auto object-contain" /><span className="font-merriweather text-[14px] tracking-tight text-[#34414A]">Margin</span></div><h3 className="mt-3 font-lora text-[20px] leading-none tracking-tight text-[#34414A]" style={{ fontWeight: 400 }}>Financial Event Resolution</h3></div>
            <p className="hidden border-b border-[#D8E7EC] py-3 text-[11px] leading-5 tracking-tight text-[#536872] sm:block">{questions.join("  ·  ")}</p>
            {!reduceMotion && <motion.div aria-hidden="true" className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-[#0B74DE]/50 to-transparent" animate={{ x: ["-15%", "15%", "-15%"], opacity: [0.2, 0.7, 0.2] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }} />}
          </motion.div>

          <div className="relative z-10 space-y-3">{outputs.map((item, index) => <OutputCard key={item.title} item={item} index={index} />)}</div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-center gap-2 text-center text-[11px] font-mono uppercase tracking-tight text-[#64808D] lg:hidden"><ArrowDown className="h-4 w-4 text-[#0B74DE]" /> Reality → Truth → Resolution → Control</div>
        <p className="mt-10 text-center font-lora text-[18px] leading-tight tracking-tight text-[#34414A] sm:text-[22px]" style={{ fontWeight: 400 }}>Every financial discrepancy becomes a traceable decision.</p>
      </div>
    </section>
  );
}
