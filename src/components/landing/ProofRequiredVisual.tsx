import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

const proofSteps = [
  { label: "Settlement and fee records", text: "Relevant settlement periods, fee events, reimbursements, reversals, offsets, and Amazon-recognized amounts within the defined scope.", highlights: ["settlement periods", "reimbursements, reversals, offsets", "Amazon-recognized amounts"] },
  { label: "Fulfillment and inventory events", text: "Shipment, receiving, inventory, return, removal, and fulfillment records tied to the affected financial events.", highlights: ["Shipment, receiving, inventory", "affected financial events"] },
  { label: "Entity and marketplace context", text: "Account, legal entity, marketplace, currency, reporting period, SKU, order, and shipment identifiers required to establish entitlement.", highlights: ["legal entity, marketplace, currency", "shipment identifiers", "establish entitlement"] },
  { label: "Event identity and source population", text: "Shipment, order, SKU, ASIN, receiving, case, and settlement identifiers required to bind every source record to the same canonical financial event.", highlights: ["every source record", "same canonical financial event"] },
  { label: "Policy and entitlement basis", text: "Applicable Amazon policy, event dates, reimbursement window, fee basis, valuation method, and eligibility conditions used to test whether recovery is justified.", highlights: ["Applicable Amazon policy", "reimbursement window", "eligibility conditions"] },
  { label: "Prior response and recovery history", text: "Previous claims, credits, reversals, offsets, Amazon responses, evidence requests, and unresolved residuals required to prevent duplicate recovery.", highlights: ["Previous claims, credits, reversals, offsets", "Amazon responses", "prevent duplicate recovery"] },
  { label: "Financial reconciliation records", text: "Expected entitlement, Amazon response, payout activity, ledger treatment, and remaining variance required to establish the final position.", highlights: ["Expected entitlement", "remaining variance", "final position"] },
] as const;

function TypewriterText({ text, speed = 3, delay = 70, onComplete }: { text: string; speed?: number; delay?: number; onComplete?: () => void }) {
  const reduceMotion = useReducedMotion();
  const [visibleText, setVisibleText] = useState(reduceMotion ? text : "");
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    if (reduceMotion) {
      setVisibleText(text);
      onCompleteRef.current?.();
      return;
    }
    setVisibleText("");
    let index = 0;
    let interval: number | undefined;
    const start = window.setTimeout(() => {
      interval = window.setInterval(() => {
        index += 1;
        setVisibleText(text.slice(0, index));
        if (index >= text.length) {
          if (interval) window.clearInterval(interval);
          onCompleteRef.current?.();
        }
      }, speed);
    }, delay);
    return () => {
      window.clearTimeout(start);
      if (interval) window.clearInterval(interval);
    };
  }, [delay, reduceMotion, speed, text]);

  return <span>{visibleText}{!reduceMotion && visibleText.length < text.length ? <span className="ml-0.5 inline-block h-[0.9em] w-px translate-y-[0.12em] bg-[#8A99A5]" aria-hidden="true" /> : null}</span>;
}

function HighlightedProofText({ text, highlights }: { text: string; highlights: readonly string[] }) {
  const parts: Array<{ text: string; highlighted: boolean }> = [];
  let cursor = 0;
  const matches = highlights.flatMap((highlight) => {
    const start = text.indexOf(highlight);
    return start >= 0 ? [{ start, end: start + highlight.length }] : [];
  }).sort((a, b) => a.start - b.start);
  matches.forEach(({ start, end }) => {
    if (start < cursor) return;
    if (start > cursor) parts.push({ text: text.slice(cursor, start), highlighted: false });
    parts.push({ text: text.slice(start, end), highlighted: true });
    cursor = end;
  });
  if (cursor < text.length) parts.push({ text: text.slice(cursor), highlighted: false });
  return <>{parts.map((part, index) => part.highlighted ? <mark key={`${part.text}-${index}`} className="rounded-[2px] bg-[#DDEBFF] px-0.5 text-[#30343B] [box-decoration-break:clone]">{part.text}</mark> : <span key={`${part.text}-${index}`}>{part.text}</span>)}</>;
}

function ProofStep({ label, text, highlights, index, status, onComplete }: { label: string; text: string; highlights: readonly string[]; index: number; status: "done" | "active" | "pending"; onComplete?: () => void }) {
  const reduceMotion = useReducedMotion();
  const isVisible = reduceMotion || status !== "pending";
  const isActive = reduceMotion || status === "active";
  return (
    <motion.div
      initial={false}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 8 }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex gap-3 py-2.5"
      aria-hidden={!isVisible}
    >
      <div className="relative flex w-3 shrink-0 justify-center">
        <motion.span
          initial={false}
          animate={{ scale: isVisible ? 1 : 0, opacity: isVisible ? 1 : 0 }}
          transition={reduceMotion ? { duration: 0 } : { duration: 0.18 }}
          className="relative z-10 mt-1.5 h-[5px] w-[5px] rounded-full bg-[#6A8795] ring-2 ring-white"
          aria-hidden="true"
        />
        {index > 0 ? <span className={cn("absolute bottom-1/2 left-1/2 w-px -translate-x-1/2 bg-[#C9D6DE]", status === "pending" ? "h-0" : "h-1/2")} aria-hidden="true" /> : null}
        {index < proofSteps.length - 1 ? <span className={cn("absolute left-1/2 top-3 h-[calc(100%+6px)] w-px -translate-x-1/2 bg-[#C9D6DE]", status === "done" ? "opacity-100" : "opacity-0")} aria-hidden="true" /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-tight text-[#66737F]">{label}</p>
        <p className="mt-1 text-[11px] leading-5 text-[#4D5B66]">{isActive ? <TypewriterText text={text} onComplete={onComplete} /> : status === "done" ? <HighlightedProofText text={text} highlights={highlights} /> : null}</p>
      </div>
    </motion.div>
  );
}

export function ProofRequiredVisual({ onComplete }: { onComplete?: () => void }) {
  const reduceMotion = useReducedMotion();
  const [activeStep, setActiveStep] = useState(0);
  const [supportStage, setSupportStage] = useState<0 | 1 | 2>(0);
  const completedRef = useRef(false);

  useEffect(() => {
    if (!reduceMotion || !onComplete || completedRef.current) return;
    const timer = window.setTimeout(() => setSupportStage(1), 2600);
    return () => window.clearTimeout(timer);
  }, [onComplete, reduceMotion]);

  const advanceStep = () => {
    if (reduceMotion || completedRef.current) return;
    if (activeStep >= proofSteps.length - 1) {
      setActiveStep(proofSteps.length);
      window.setTimeout(() => setSupportStage(1), 1200);
      return;
    }
    window.setTimeout(() => setActiveStep((current) => current + 1), 420);
  };

  const completeWhatMarginFound = () => setSupportStage(2);
  const completeEvidenceContext = () => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete?.();
  };

  return (
    <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} aria-label="Proof required and evidence Margin will assemble" className="w-full px-0 py-5 sm:py-6">
      <div className="w-full overflow-hidden rounded-[10px] bg-white text-[#182026] shadow-[0_18px_45px_rgba(24,32,38,0.12)]">
        <div className="px-4 pb-2.5 pt-3 sm:px-6">
          <p className="text-[10px] text-[#8A99A5]">Proof required</p>
          <h2 className="mt-1 font-normal leading-tight tracking-tight text-[18px] sm:text-[20px]">Evidence Margin will Assemble</h2>
          <p className="mt-1 max-w-[610px] text-[10px] leading-4 tracking-tight text-[#6B7280]"><TypewriterText text="Margin will test the connected operating record across the defined marketplace and entity scope before requesting any additional evidence." /></p>
        </div>
        <div className="bg-white px-4 py-2 sm:px-6"><p className="text-[10px] leading-4 tracking-tight text-[#66737F]">Review basis: <strong className="font-semibold text-[#182026]">Cross-marketplace entitlement and settlement reconciliation</strong> · Scope: <strong className="font-semibold text-[#182026]">US · CA · UK · DE · 3 entities · 8 reporting periods</strong></p></div>
        <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="px-4 py-3 sm:px-6">
            <div className="mb-3"><p className="mb-2 max-w-[560px] text-[10px] leading-4 tracking-tight text-[#98A5AE]">Settlement and entitlement review · 4 marketplaces · 3 entities · 8 reporting periods · REC-2026-0147 · Cross-marketplace recovery exposure</p><div className="flex flex-wrap gap-2"><span className="rounded-[10px] border-0 bg-[#EEF1F2] px-2 py-1 text-[10px] text-[#182026]">Cross-marketplace exposure</span><span className="rounded-[10px] border-0 bg-[#EEF1F2] px-2 py-1 text-[10px] font-medium text-[#182026]">Evidence under review</span></div></div>
            <p className="text-[10px] font-medium uppercase tracking-tight text-[#66737F]">Required documentation</p>
            <div className="mt-2 border-y border-[#E9E9EC] py-1">{proofSteps.map(({ label, text, highlights }, index) => <ProofStep key={label} label={label} text={text} highlights={highlights} index={index} status={reduceMotion ? "done" : index < activeStep ? "done" : index === activeStep ? "active" : "pending"} onComplete={index === activeStep ? advanceStep : undefined} />)}</div>
            {supportStage >= 1 ? <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }} className="mt-3 pt-3"><p className="text-[10px] font-medium uppercase tracking-tight text-[#66737F]">What Margin already found</p><p className="mt-1 text-[11px] leading-5 text-[#4D5B66]"><TypewriterText text="Margin connected the exposure across US, CA, UK, and DE marketplace activity, three operating entities, settlement periods, fulfillment records, and finance data." onComplete={completeWhatMarginFound} /></p></motion.div> : null}
          </div>
          <div className="px-4 py-3 sm:px-6">{supportStage >= 2 ? <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.24 }}><p className="text-[10px] font-medium uppercase tracking-tight text-[#66737F]">Evidence context</p><p className="mt-2 text-[11px] leading-5 text-[#4D5B66]"><TypewriterText text="The evidence record preserves source lineage, operating scope, policy basis, and financial responsibility across the recovery position." onComplete={completeEvidenceContext} /></p></motion.div> : null}</div>
        </div>
      </div>
    </motion.section>
  );
}
