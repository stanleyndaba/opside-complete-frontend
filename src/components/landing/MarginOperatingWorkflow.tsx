import { motion, useReducedMotion } from "framer-motion";
import {
  AlertTriangle,
  ArrowDown,
  CheckCircle2,
  ClipboardCheck,
  Database,
  FileWarning,
  GitBranch,
  Link2,
  RefreshCw,
  SearchCheck,
  Send,
  ShieldCheck,
  UserCheck,
  WalletCards,
} from "lucide-react";
import { useState } from "react";

const layers = [
  {
    id: "source",
    label: "Source records",
    question: "Where the financial activity begins",
    icon: Database,
    tone: "#526AB1",
    surface: "#F1F4FA",
    nodes: [
      { title: "Amazon financial activity", detail: "Orders · Fees · Inventory · Returns", icon: Database, state: "Available records" },
      { title: "Settlements and payouts", detail: "Adjustments · Credits · Downstream activity", icon: WalletCards, state: "Available records" },
    ],
  },
  {
    id: "relationships",
    label: "Evidence relationships",
    question: "What records explain the event",
    icon: Link2,
    tone: "#66737F",
    surface: "#F3F5F5",
    nodes: [
      { title: "Normalize financial events", detail: "IDs · Amounts · Dates · References", icon: Link2, state: "Relationships linked" },
      { title: "Evidence sufficiency", detail: "Complete, missing, conflicting, or inferred", icon: SearchCheck, state: "Decision gate" },
    ],
  },
  {
    id: "investigation",
    label: "Investigation",
    question: "Why does the position differ",
    icon: SearchCheck,
    tone: "#8B6D4B",
    surface: "#F5F1EB",
    nodes: [
      { title: "Build the financial chain", detail: "Original event → Expected → Observed → Consequence", icon: SearchCheck, state: "Position tested" },
      { title: "Isolate the unresolved difference", detail: "Test causes and alternative explanations", icon: AlertTriangle, state: "Gap remains visible" },
    ],
  },
  {
    id: "action",
    label: "Action and authorization",
    question: "What happens next and who decides",
    icon: ShieldCheck,
    tone: "#4D7869",
    surface: "#EEF4F1",
    nodes: [
      { title: "Supported recovery or correction", detail: "Evidence request · Seller approval · Scope", icon: UserCheck, state: "Decision required" },
      { title: "Execute and manage response", detail: "Submit · Rejection · Appeal · Approval · Closure", icon: Send, state: "Controlled action" },
    ],
  },
  {
    id: "truth",
    label: "Financial truth",
    question: "What is accounted for and what is not",
    icon: ClipboardCheck,
    tone: "#635BFF",
    surface: "#F1F0FF",
    nodes: [
      { title: "Trace the actual credit", detail: "Credit or adjustment → Settlement → Payout", icon: RefreshCw, state: "Downstream checked" },
      { title: "Financial Position Brief", detail: "Reconciled · Partially explained · Unresolved", icon: ClipboardCheck, state: "Position established" },
    ],
  },
] as const;

const lifecycleCards = [
  {
    title: "Recovery lifecycle",
    detail: "Investigate → Establish evidence → Authorize → Submit → Manage response → Determine outcome",
    icon: ShieldCheck,
    tone: "#4D7869",
  },
  {
    title: "Financial reconciliation lifecycle",
    detail: "Trace original activity → Connect downstream events → Verify settlement → Account for residuals",
    icon: RefreshCw,
    tone: "#635BFF",
  },
];

const caseFlow = [
  {
    eyebrow: "Amazon signal",
    title: "Settlement line does not match the expected position",
    detail: "Case 19822888381 · Residual exposure $19,240",
    state: "Needs examination",
    tone: "#526AB1",
    platforms: [{ src: "/amazon-logo-transparent-circle.png", alt: "Amazon" }],
  },
  {
    eyebrow: "Margin gathers context",
    title: "Records joined around the original event",
    detail: "Settlement · shipment · return · finance records",
    state: "Evidence connected",
    tone: "#8B6D4B",
    platforms: [
      { src: "/gmailicon.png", alt: "Gmail" },
      { src: "/Dropbox_Icon.svg.png", alt: "Dropbox" },
      { src: "/xero.png", alt: "Xero" },
    ],
  },
  {
    eyebrow: "Seller decision",
    title: "Supported recovery is ready for approval",
    detail: "Evidence basis · amount · requested action · limitations",
    state: "Waiting for authorization",
    tone: "#4D7869",
    platforms: [{ src: "/slack-icon-2019.png", alt: "Slack" }],
  },
  {
    eyebrow: "Financial consequence",
    title: "Credit traced through settlement and payout",
    detail: "Approved $26,000 · $18,650 matched · $7,350 still open",
    state: "Position remains visible",
    tone: "#635BFF",
    platforms: [
      { src: "/amazon-logo-transparent-circle.png", alt: "Amazon" },
      { src: "/quickbooks.png", alt: "QuickBooks" },
      { src: "/xero.png", alt: "Xero" },
    ],
  },
] as const;

function PlatformMarks({ platforms }: { platforms: readonly { src: string; alt: string }[] }) {
  return (
    <div className="flex items-center gap-1.5" aria-label={`Connected platforms: ${platforms.map((platform) => platform.alt).join(", ")}`}>
      {platforms.map((platform) => (
        <span key={`${platform.src}-${platform.alt}`} className="flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-[0_2px_8px_rgba(24,32,38,0.08)]">
          <img src={platform.src} alt={platform.alt} className="h-4 w-4 object-contain" />
        </span>
      ))}
    </div>
  );
}

export function MarginOperatingWorkflow() {
  const reduceMotion = useReducedMotion();
  const [activeLayer, setActiveLayer] = useState("investigation");
  const active = layers.find((layer) => layer.id === activeLayer) ?? layers[2];

  return (
    <section className="relative overflow-hidden bg-[#F4F7F7] py-14 sm:py-18 md:py-24" aria-labelledby="margin-operating-workflow-title">
      <div className="pointer-events-none absolute inset-0 opacity-[0.42] [background-image:radial-gradient(#B9C5C8_0.8px,transparent_0.8px)] [background-size:18px_18px]" aria-hidden="true" />
      <div className="relative mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12">
        <motion.div initial={reduceMotion ? false : { opacity: 0, y: 14 }} whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ duration: 0.55 }} className="mb-12 overflow-hidden bg-white shadow-[0_16px_38px_rgba(48,52,59,0.07)] sm:mb-16">
          <div className="flex flex-col gap-3 border-b border-[#E6EBEC] px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-7">
            <div>
              <p className="font-google-sans text-[10px] font-semibold uppercase tracking-tight text-[#71808A]">A recovery in motion</p>
              <h2 className="mt-2 max-w-[720px] font-lora text-[27px] leading-[1.04] tracking-[-0.04em] text-[#182026] sm:text-[36px]" style={{ fontWeight: 400 }}>One financial discrepancy. Every consequence kept in view.</h2>
            </div>
            <p className="max-w-[300px] text-[11px] leading-5 text-[#71808A]">This is the operating state Margin is establishing—not a straight line from claim to credit.</p>
          </div>
          <div className="relative grid gap-2 px-4 py-5 sm:px-7 sm:py-7 lg:grid-cols-4 lg:gap-3">
            <svg className="pointer-events-none absolute left-[11%] right-[11%] top-[52px] hidden h-[86px] w-[78%] overflow-visible lg:block" viewBox="0 0 1000 100" fill="none" aria-hidden="true">
              <defs><marker id="margin-workflow-arrow" markerWidth="7" markerHeight="7" refX="5" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7" fill="none" stroke="#A6B2B4" strokeWidth="1.2" /></marker></defs>
              <path d="M35 48 C105 4 155 92 250 48 S395 4 500 48 S650 92 750 48 S875 4 965 48" stroke="#B9C5C8" strokeWidth="1.4" strokeDasharray="5 6" markerEnd="url(#margin-workflow-arrow)" />
            </svg>
            {caseFlow.map((step, index) => (
              <div key={step.eyebrow} className="relative z-10">
                <div className="bg-[#FAFBFB] p-4 ring-1 ring-[#E3E9EA] transition-shadow hover:shadow-[0_10px_22px_rgba(48,52,59,0.07)] sm:min-h-[184px]">
                  <div className="flex items-start justify-between gap-3"><p className="text-[9px] font-semibold uppercase tracking-[0.08em]" style={{ color: step.tone }}>{step.eyebrow}</p><PlatformMarks platforms={step.platforms} /></div>
                  <p className="mt-4 text-[12px] font-semibold leading-5 text-[#30343B]">{step.title}</p>
                  <p className="mt-2 text-[10px] leading-4 text-[#71808A]">{step.detail}</p>
                  <p className="mt-4 inline-flex items-center gap-1.5 text-[9px] font-semibold" style={{ color: step.tone }}><span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: step.tone }} />{step.state}</p>
                </div>
                {index < caseFlow.length - 1 ? <div className="flex h-7 items-center justify-center text-[#A6B2B4] lg:hidden"><ArrowDown className="h-4 w-4" /></div> : null}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#E6EBEC] px-5 py-3 text-[10px] text-[#71808A] sm:px-7"><span>Verified match</span><span className="text-[#8B6D4B]">Unresolved relationship</span><span className="text-[#4D7869]">Authorization boundary</span><span className="text-[#635BFF]">Downstream financial state</span></div>
        </motion.div>
        <div className="grid items-start gap-10 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
          <motion.div initial={reduceMotion ? false : { opacity: 0, y: 14 }} whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }} viewport={{ once: true, margin: "-48px" }} transition={{ duration: 0.6 }} className="max-w-[560px] lg:sticky lg:top-28">
            <p className="font-google-sans text-[10px] font-semibold uppercase tracking-tight text-[#71808A]">The operating workflow</p>
            <h2 id="margin-operating-workflow-title" className="mt-4 font-lora text-[35px] leading-[1.02] tracking-[-0.045em] text-[#182026] sm:text-[46px] md:text-[56px]" style={{ fontWeight: 400 }}>
              Financial activity becomes explainable.
            </h2>
            <p className="mt-5 max-w-[510px] text-[15px] leading-7 text-[#4D5B66] md:text-[17px] md:leading-8">
              Margin does not stop when Amazon closes a case. It traces the original event, tests the evidence, manages the authorized action, and keeps the downstream financial position visible.
            </p>
            <p className="mt-4 max-w-[500px] font-lora text-[20px] leading-[1.16] tracking-[-0.03em] text-[#315C70] sm:text-[23px]">
              The recovery lifecycle and the reconciliation lifecycle intersect. Neither replaces the other.
            </p>

            <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="Workflow layers">
              {layers.map((layer) => {
                const Icon = layer.icon;
                const selected = layer.id === activeLayer;
                return (
                  <button
                    key={layer.id}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setActiveLayer(layer.id)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#635BFF]/30 ${selected ? "bg-[#182026] text-white" : "bg-white/75 text-[#66737F] hover:bg-white hover:text-[#182026]"}`}
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.8} />
                    {layer.label}
                  </button>
                );
              })}
            </div>

            <motion.div key={active.id} initial={reduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }} className="mt-6 bg-white/80 p-4 shadow-[0_12px_28px_rgba(48,52,59,0.05)]">
              <div className="flex items-center gap-2" style={{ color: active.tone }}>
                <active.icon className="h-4 w-4" strokeWidth={1.8} />
                <p className="text-[11px] font-semibold">{active.label}</p>
              </div>
              <p className="mt-2 text-[13px] leading-5 text-[#66737F]">{active.question}</p>
            </motion.div>
          </motion.div>

          <div className="relative min-w-0" role="region" aria-label="Margin financial investigation workflow">
            <div className="absolute bottom-8 left-[17px] top-8 hidden w-px bg-[#C8D4D5] sm:block" aria-hidden="true" />
            <div className="space-y-3 sm:space-y-4">
              {layers.map((layer, layerIndex) => {
                const LayerIcon = layer.icon;
                const isActive = layer.id === activeLayer;
                return (
                  <motion.div key={layer.id} initial={reduceMotion ? false : { opacity: 0, x: 14 }} whileInView={reduceMotion ? undefined : { opacity: 1, x: 0 }} viewport={{ once: true, margin: "-32px" }} transition={{ duration: 0.45, delay: layerIndex * 0.04 }} className="relative grid gap-2 sm:grid-cols-[36px_minmax(0,1fr)] sm:gap-4">
                    <div className="relative z-10 mt-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#F4F7F7]" style={{ color: layer.tone }}>
                      <div className="flex h-8 w-8 items-center justify-center rounded-full border border-current bg-white shadow-[0_4px_12px_rgba(48,52,59,0.08)]"><LayerIcon className="h-4 w-4" strokeWidth={1.7} /></div>
                    </div>
                    <div className={`relative overflow-hidden bg-white/90 p-3.5 shadow-[0_10px_24px_rgba(48,52,59,0.05)] transition-shadow sm:p-4 ${isActive ? "ring-1 ring-[#182026]/12" : ""}`}>
                      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
                        <div><p className="text-[12px] font-semibold text-[#182026]">{layer.label}</p><p className="mt-0.5 text-[11px] text-[#7A858A]">{layer.question}</p></div>
                        <span className="text-[9px] font-semibold uppercase tracking-[0.1em]" style={{ color: layer.tone }}>Layer {String(layerIndex + 1).padStart(2, "0")}</span>
                      </div>
                      <div className="grid gap-2 md:grid-cols-2">
                        {layer.nodes.map((node, nodeIndex) => {
                          const NodeIcon = node.icon;
                          return (
                            <div key={node.title} className="relative min-h-[92px] border border-[#E2E8E9] bg-[#FAFBFB] p-3">
                              <div className="flex items-start justify-between gap-2"><div className="flex items-center gap-2"><span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ backgroundColor: layer.surface, color: layer.tone }}><NodeIcon className="h-3.5 w-3.5" strokeWidth={1.8} /></span><p className="text-[11px] font-semibold leading-4 text-[#30343B]">{node.title}</p></div>{nodeIndex === 1 && layer.id === "investigation" ? <GitBranch className="h-3.5 w-3.5 text-[#8B6D4B]" /> : null}</div>
                              <p className="mt-2 text-[10px] leading-4 text-[#71808A]">{node.detail}</p>
                              <p className="mt-2 inline-flex items-center gap-1 text-[9px] font-semibold" style={{ color: layer.tone }}><CheckCircle2 className="h-3 w-3" strokeWidth={2} /> {node.state}</p>
                            </div>
                          );
                        })}
                      </div>
                      {layer.id === "relationships" ? <div className="mt-3 flex items-center gap-2 text-[10px] text-[#8B6D4B]"><FileWarning className="h-3.5 w-3.5" /> Missing evidence loops back to a specific request, not a generic upload.</div> : null}
                      {layer.id === "action" ? <div className="mt-3 flex items-center gap-2 text-[10px] text-[#4D7869]"><ShieldCheck className="h-3.5 w-3.5" /> Seller authorization remains the decision boundary.</div> : null}
                    </div>
                    {layerIndex < layers.length - 1 ? <ArrowDown className="absolute -bottom-3 left-[13px] z-20 hidden h-6 w-6 rounded-full bg-[#F4F7F7] p-1 text-[#8B9A9F] sm:block" aria-hidden="true" /> : null}
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {lifecycleCards.map((card) => {
                const Icon = card.icon;
                return <div key={card.title} className="bg-[#182026] p-4 text-white"><div className="flex items-center gap-2" style={{ color: card.tone }}><Icon className="h-4 w-4" strokeWidth={1.8} /><p className="text-[11px] font-semibold">{card.title}</p></div><p className="mt-2 text-[11px] leading-5 text-white/65">{card.detail}</p></div>;
              })}
            </div>
            <div className="mt-3 flex items-start gap-3 bg-white p-4 shadow-[0_10px_24px_rgba(48,52,59,0.06)]"><ClipboardCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#635BFF]" strokeWidth={1.7} /><div><p className="text-[12px] font-semibold text-[#182026]">Financial Position Brief</p><p className="mt-1 text-[11px] leading-5 text-[#66737F]">Examined · Supported · Reconciled · Unresolved · Action justified · Limitations recorded</p></div></div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default MarginOperatingWorkflow;
