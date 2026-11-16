import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";

function FastLandingTypewriter({ text, onComplete }: { text: string; onComplete?: () => void }) {
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
      }, 3);
    }, 70);
    return () => {
      window.clearTimeout(start);
      if (interval) window.clearInterval(interval);
    };
  }, [reduceMotion, text]);

  return <>{visibleText}{!reduceMotion && visibleText.length < text.length ? <span className="ml-0.5 inline-block h-[0.9em] w-px translate-y-[0.12em] bg-[#8A99A5]" aria-hidden="true" /> : null}</>;
}

export function OneRecordAnalysisVisual() {
  const checks = [
    ['Event identity resolved', 'Shipment, SKU, ASIN, receiving node, carrier movement, and settlement period resolve to one canonical financial event.'],
    ['Expected versus received reconciled', '2,416 units were expected; 2,352 were received. The 64-unit variance remains open after the receiving window closed.'],
    ['Cross-system evidence agrees', 'Carrier delivery, 3PL intake, and Amazon receiving records support the same delivery window and custody trail.'],
    ['Offsets and timing noise excluded', 'Inventory adjustments, duplicate lines, and subsequent settlement activity do not clear or duplicate the variance.'],
    ['Materiality and ownership assessed', 'Supported exposure is $4,144.00 at a verified $64.75 unit cost; Finance Operations owns the decision.'],
    ['Decision package ready', 'The supported exposure is separated from unresolved items and ready for the next controlled action.'],
  ];
  const narrative = [
    'Northstar Commerce LLC · Review scope: 9,284 inbound shipments · 2.8M units · Amazon US · Q3 2026',
    "For this event, Amazon's receiving record shows 2,352 units received against a shipment plan for 2,416 units. The supported exposure is $4,144.00, based on a verified unit cost of $64.75.",
    'The 64-unit difference remains unresolved after the receiving window closed; it is not a timing difference, duplicate line, or immaterial posting variance.',
    "Carrier delivery and 3PL intake records agree with Amazon's receiving window, establishing custody while leaving the shortage inside Amazon's receiving trail.",
    'The inventory ledger and settlement activity do not clear the variance; no offsetting reimbursement credit is recorded for the reviewed period.',
    'Margin states the supported exposure, preserves the unresolved remainder, and routes the decision to Finance Operations with the evidence already assembled.',
  ];
  const reduceMotion = useReducedMotion();
  const visualRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(visualRef, { once: true, amount: 0.28 });
  const [activeItem, setActiveItem] = useState(reduceMotion ? narrative.length : 0);

  useEffect(() => {
    if (reduceMotion) {
      setActiveItem(narrative.length);
      return;
    }
    if (!isInView || activeItem < narrative.length) return;
    const resetTimer = window.setTimeout(() => setActiveItem(0), 4000);
    return () => window.clearTimeout(resetTimer);
  }, [activeItem, isInView, reduceMotion, narrative.length]);

  const advance = () => {
    if (reduceMotion) return;
    setActiveItem((current) => Math.min(current + 1, narrative.length));
  };

  return (
    <div ref={visualRef} className="relative isolate max-h-[360px] overflow-y-auto bg-white sm:max-h-none sm:overflow-hidden">
      <div className="relative grid gap-3 bg-white p-3 sm:p-4 lg:grid-cols-[1.32fr_0.68fr] lg:gap-4">
        <div className="bg-white p-3 sm:p-4">
          <div className="flex items-center justify-between gap-3 pb-2"><div><p className="mt-0.5 font-lora text-[14px] font-normal leading-tight tracking-tight text-[#182026] sm:text-[15px]">Inbound receiving variance · Amazon US · Q3 2026</p></div></div>
          <div className="mt-2.5 space-y-1.5 text-[11px] leading-5 text-[#4D5B66]" aria-live="polite" aria-atomic="false">
            {narrative.map((line, index) => {
              const visible = reduceMotion || index <= activeItem;
              const active = !reduceMotion && index === activeItem;
              const content = reduceMotion || index < activeItem ? line : active ? <FastLandingTypewriter text={line} onComplete={advance} /> : null;
              return <motion.div key={line} initial={false} animate={visible ? { opacity: 1, y: 0, height: "auto" } : { opacity: 0, y: -14, height: 0 }} transition={{ duration: reduceMotion ? 0 : 0.18, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden">{content}</motion.div>;
            })}
          </div>
        </div>
        <div className="space-y-1.5 p-1 sm:p-2">
          <p className="mb-1 text-[11px] font-medium tracking-tight text-[#182026]">What the reconciliation establishes</p>
          {checks.map(([title, detail], index) => <motion.div key={title} initial={false} animate={reduceMotion || index < activeItem ? { opacity: 1, y: 0, height: "auto" } : { opacity: 0, y: -14, height: 0 }} transition={{ duration: reduceMotion ? 0 : 0.34, ease: [0.22, 1, 0.36, 1] }} className="overflow-hidden"><div className="flex items-start gap-2 rounded-[7px] bg-[#F1F3F4] px-2 py-1.5 text-[#182026]"><span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-[#16866B] text-white" aria-hidden="true"><Check className="h-2 w-2" strokeWidth={3} /></span><span className="min-w-0"><span className="block text-[10px] font-semibold leading-3.5 tracking-tight text-[#182026]">{title}</span><span className="mt-0.5 block text-[9px] leading-3.5 text-[#4D5B66]">{detail}</span></span></div></motion.div>)}
          <motion.div animate={reduceMotion || activeItem >= narrative.length ? { opacity: 1, y: 0 } : { opacity: 0, y: 5 }} transition={{ duration: 0.35 }} className="mt-1 flex items-center justify-between pt-3 text-[11px] font-medium tracking-tight text-[#182026]"><span>Supported recovery basis</span><ArrowRight className="h-3.5 w-3.5 text-[#0B74DE]" aria-hidden="true" /></motion.div>
        </div>
      </div>
    </div>
  );
}
