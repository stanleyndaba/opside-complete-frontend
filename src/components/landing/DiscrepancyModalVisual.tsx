import React, { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

function TypewriterText({ text, speed = 3, delay = 0, onComplete }: { text: string; speed?: number; delay?: number; onComplete?: () => void }) {
  const reduceMotion = useReducedMotion();
  const [visibleText, setVisibleText] = useState(reduceMotion ? text : '');
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  useEffect(() => {
    if (reduceMotion) {
      setVisibleText(text);
      return;
    }
    setVisibleText('');
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

const reconstructionProofSteps = [
  ['Settlement and fee records', 'Relevant settlement periods, fee events, reimbursements, reversals, offsets, and Amazon-recognized amounts within the defined scope.'],
  ['Fulfillment and inventory events', 'Shipment, receiving, inventory, return, removal, and fulfillment records tied to the affected financial events.'],
  ['Entity and marketplace context', 'Account, legal entity, marketplace, currency, reporting period, SKU, order, and shipment identifiers required to establish entitlement.'],
  ['Financial reconciliation records', 'Expected entitlement, Amazon response, payout activity, ledger treatment, and remaining variance required to establish the final position.'],
] as const;

const reconstructionFindingSteps = [
  ['Material exposure under review', '$184,220 indicated exposure · $96,480 currently supported'],
  ['Found on', 'Jan 21, 2026, 04:37 PM'],
  ['Amazon source / activity', 'Amazon settlement and financial records · Scope connected'],
  ['What Margin found', 'Margin isolated a material exposure across settlement, fulfillment, and finance records. · $184,220 indicated · $96,480 supported'],
  ['Financial position', 'Margin reconciled the marketplace activity, operating records, settlement position, and financial context to establish the supported exposure and remaining variance.'],
  ['Why unresolved', 'The evidence position is established; the remaining action is subject to the defined finance approval gate.'],
  ['Evidence used', 'US · CA · UK · DE · 3 entities · 8 reporting periods · Settlement and finance records connected'],
] as const;

function ReconstructionStep({ label, text, index, status, tone = 'default', onComplete }: { label: string; text: string; index: number; status: 'done' | 'active' | 'pending'; tone?: 'default' | 'accent'; onComplete?: () => void }) {
  const reduceMotion = useReducedMotion();
  const isVisible = reduceMotion || status !== 'pending';
  const isActive = reduceMotion || status === 'active';
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
          className={cn('relative z-10 mt-1.5 h-[5px] w-[5px] rounded-full ring-2 ring-white', tone === 'accent' ? 'bg-[#0B74DE]' : 'bg-[#6A8795]')}
          aria-hidden="true"
        />
        {index > 0 ? <span className={cn('absolute bottom-1/2 left-1/2 w-px -translate-x-1/2 bg-[#C9D6DE]', status === 'pending' ? 'h-0' : 'h-1/2')} aria-hidden="true" /> : null}
        {index < 20 ? <span className={cn('absolute left-1/2 top-3 h-[calc(100%+6px)] w-px -translate-x-1/2 bg-[#C9D6DE]', status === 'done' ? 'opacity-100' : 'opacity-0')} aria-hidden="true" /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[7.5px] font-medium uppercase tracking-tight text-[#66737F]">{label}</p>
        <p className={cn('mt-1 text-[11px] leading-5', tone === 'accent' ? 'font-semibold text-[#0B74DE]' : 'text-[#4D5B66]')}>
          {isActive ? <TypewriterText text={text} speed={3} delay={70} onComplete={onComplete} /> : text}
        </p>
      </div>
    </motion.div>
  );
}

export function DiscrepancyModalVisual({ compactMobile = false }: { compactMobile?: boolean }) {
  const [mode, setMode] = useState<'finding' | 'proof'>('proof');
  const isProof = mode === 'proof';
  const reduceMotion = useReducedMotion();
  const steps = isProof ? reconstructionProofSteps : reconstructionFindingSteps;
  const [activeStep, setActiveStep] = useState(0);
  useEffect(() => {
    setActiveStep(0);
  }, [isProof]);
  const advanceStep = () => {
    if (reduceMotion) return;
    window.setTimeout(() => setActiveStep((current) => current + 1 >= steps.length ? 0 : current + 1), 420);
  };
  const headingText = isProof ? 'Evidence Margin will Assemble' : 'Cross-marketplace recovery exposure';
  const headingSubtext = isProof
    ? 'Margin will test the connected operating record across the defined marketplace and entity scope before requesting any additional evidence.'
    : 'A material recovery exposure has been isolated across settlement, fulfillment, and finance records. · $184,220 indicated exposure · $96,480 currently supported';

  return (
    <div className={`recognition-artifacts-visual relative ${compactMobile ? 'max-h-[80vh] overflow-y-auto overscroll-contain touch-pan-y sm:max-h-none sm:overflow-visible' : 'overflow-hidden'}`}>
      <div className="mx-auto w-full max-w-[900px] overflow-hidden rounded-[10px] border border-[#DCE8EE] bg-white text-[#182026] shadow-[0_18px_45px_rgba(24,32,38,0.16)]">
        <div className="flex items-start justify-between gap-4 border-b border-[#E9E9EC] px-4 pb-2.5 pt-3">
          <div>
            <p className="text-[10px] text-[#8A99A5]">{isProof ? 'Proof required' : 'Finding detail'}</p>
            <h3 className={`mt-1 font-normal leading-tight tracking-tight ${isProof ? 'whitespace-nowrap text-[18px] sm:text-[20px]' : 'text-[20px]'}`}>{headingText}</h3>
            <p className="mt-1 max-w-[610px] text-[10px] leading-4 tracking-tight text-[#6B7280]"><TypewriterText key={headingSubtext} text={headingSubtext} speed={3} /></p>
          </div>
          <button type="button" aria-label="Close preview" className="text-[18px] leading-none text-[#9CA3AF]">×</button>
        </div>
        <div className="flex border-b border-[#E9E9EC] bg-[#FAFAFB] px-4 py-2">
          <button type="button" onClick={() => setMode('finding')} className={`mr-4 border-b-2 pb-1 text-[11px] font-medium tracking-tight ${!isProof ? 'border-[#0B74DE] text-[#0B74DE]' : 'border-transparent text-[#66737F]'}`}>View finding</button>
          <button type="button" onClick={() => setMode('proof')} className={`border-b-2 pb-1 text-[11px] font-medium tracking-tight ${isProof ? 'border-[#0B74DE] text-[#0B74DE]' : 'border-transparent text-[#66737F]'}`}>Proof needed</button>
        </div>
        <div className="border-b border-[#E9E9EC] bg-white px-4 py-2"><p className="text-[10px] leading-4 tracking-tight text-[#66737F]">Review basis: <strong className="font-semibold text-[#182026]">Cross-marketplace entitlement and settlement reconciliation</strong> · Scope: <strong className="font-semibold text-[#182026]">US · CA · UK · DE · 3 entities · 8 reporting periods</strong></p></div>
        {isProof ? (
          <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="border-b border-[#E9E9EC] px-4 py-3 lg:border-b-0 lg:border-r">
              <div className="mb-3"><p className="mb-2 max-w-[560px] text-[10px] leading-4 tracking-tight text-[#98A5AE]">Settlement and entitlement review · 4 marketplaces · 3 entities · 8 reporting periods · REC-2026-0147 · Cross-marketplace recovery exposure</p><div className="flex gap-2"><span className="rounded-[10px] border-0 bg-[#EEF1F2] px-2 py-1 text-[10px] text-[#182026]">Cross-marketplace exposure</span><span className="rounded-[10px] border-0 bg-[#EEF1F2] px-2 py-1 text-[10px] font-medium text-[#182026]">Evidence under review</span></div></div>
              <p className="text-[7.5px] font-medium uppercase tracking-tight text-[#66737F]">Required documentation</p>
              <div className="mt-2 border-y border-[#E9E9EC] py-1">{reconstructionProofSteps.map(([label, text], index) => <ReconstructionStep key={label} label={label} text={text} index={index} status={reduceMotion ? 'done' : index < activeStep ? 'done' : index === activeStep ? 'active' : 'pending'} onComplete={index === activeStep ? advanceStep : undefined} />)}</div>
              <div className="mt-3 border-t border-[#E9E9EC] pt-3"><p className="text-[7.5px] font-medium uppercase tracking-tight text-[#66737F]">What Margin already found</p><p className="mt-1 text-[11px] leading-5 text-[#4D5B66]"><TypewriterText text="Margin connected the exposure across US, CA, UK, and DE marketplace activity, three operating entities, settlement periods, fulfillment records, and finance data." /></p></div>
            </div>
            <div className="px-4 py-3"><p className="text-[7.5px] font-medium uppercase tracking-tight text-[#66737F]">Evidence context</p><p className="mt-2 text-[11px] leading-5 text-[#4D5B66]"><TypewriterText text="The evidence record preserves source lineage, operating scope, policy basis, and financial responsibility across the recovery position." /></p></div>
          </div>
        ) : (
          <div className="grid gap-0 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="border-b border-[#E9E9EC] px-4 py-3 lg:border-b-0 lg:border-r">
              <div className="relative py-1">{reconstructionFindingSteps.map(([label, text], index) => <ReconstructionStep key={label} label={label} text={text} index={index} status={reduceMotion ? 'done' : index < activeStep ? 'done' : index === activeStep ? 'active' : 'pending'} onComplete={index === activeStep ? advanceStep : undefined} tone={index === 0 ? 'accent' : 'default'} />)}</div>
            </div>
            <div className="px-4 py-3"><p className="text-[7.5px] font-medium uppercase tracking-tight text-[#66737F]">Evidence context</p><p className="mt-2 text-[11px] leading-5 text-[#4D5B66]"><TypewriterText text="The connected operating record establishes a supported exposure position and identifies the remaining variance for controlled review." /></p></div>
          </div>
        )}
      </div>
    </div>
  );
}
