import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowDown,
  Check,
  ClipboardCheck,
  CloudUpload,
  FileText,
  UploadCloud,
} from 'lucide-react';

type JourneyVisualKind = 'consent' | 'review' | 'handoff';

type ReviewJourneyVisualProps = {
  kind: JourneyVisualKind;
};

const visualCopy: Record<JourneyVisualKind, { eyebrow: string; title: string }> = {
  consent: { eyebrow: 'Step 1 · Review terms', title: 'You remain in control.' },
  review: { eyebrow: 'Step 2 · Financial review', title: 'Margin follows the evidence.' },
  handoff: { eyebrow: 'Step 3 · File handoff', title: 'Send what you already have.' },
};

function FloatingIcon({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      aria-hidden="true"
      animate={reduceMotion ? undefined : { y: [0, -5, 0], rotate: [0, 1.5, 0] }}
      transition={reduceMotion ? undefined : { duration: 4.8, delay, repeat: Infinity, ease: 'easeInOut' }}
      className={`absolute flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#DCE7F0] bg-white text-[#0B74DE] shadow-[0_10px_24px_rgba(24,54,78,0.08)] ${className}`}
    >
      {children}
    </motion.div>
  );
}

function ConsentVisual() {
  return (
    <div className="relative mx-auto h-[190px] w-full max-w-[420px] overflow-hidden rounded-[18px] border border-[#E3EAF0] bg-[#F8FBFD] px-6 py-5 sm:h-[210px] sm:px-9">
      <div className="absolute inset-y-5 left-6 w-px bg-[#CFE3F0] sm:left-9" aria-hidden="true" />
      <div className="relative ml-5 flex h-full max-w-[285px] flex-col justify-center sm:ml-7">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#0B74DE]"><span className="h-1.5 w-1.5 rounded-full bg-[#0B74DE]" />Margin review</div>
        <div className="mt-3 border-t border-[#D8E5EC] pt-3">
          {['Records you provide', 'Read-only scope', 'You approve what happens next'].map((item, index) => (
            <div key={item} className="flex items-center gap-2.5 py-1.5 text-[12px] font-semibold tracking-tight text-[#30343B]"><span className={`flex h-4 w-4 items-center justify-center rounded-full ${index === 1 ? 'bg-[#0B74DE] text-white' : 'border border-[#A9C8DB] bg-white text-[#3B8F5A]'}`}><Check className="h-2.5 w-2.5" strokeWidth={3} /></span>{item}</div>
          ))}
        </div>
        <div className="mt-3 border-t border-[#D8E5EC] pt-2 text-[10px] leading-4 text-[#66737F]">The review boundary stays visible before any records are examined.</div>
      </div>
    </div>
  );
}

function ReviewVisual() {
  return (
    <div className="relative mx-auto h-[190px] w-full max-w-[420px] overflow-hidden rounded-[18px] border border-[#E3EAF0] bg-[#FAFCFD] px-6 py-5 sm:h-[210px] sm:px-9">
      <div className="relative flex h-full flex-col justify-center">
        <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.08em] text-[#48677A]"><span>Financial position</span><span className="text-[#0B74DE]">review path</span></div>
        <div className="relative mt-7 h-px bg-[#BFD9EA]" aria-hidden="true"><span className="absolute left-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border-2 border-white bg-[#0B74DE] shadow-[0_0_0_1px_#9BC8E5]" /><span className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#0B74DE] shadow-[0_0_0_1px_#9BC8E5]" /><span className="absolute right-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full border-2 border-white bg-[#0B74DE] shadow-[0_0_0_1px_#9BC8E5]" /></div>
        <div className="mt-3 grid grid-cols-3 text-[10px] font-semibold leading-4 text-[#30343B]"><div>originating<br />event</div><div className="text-center">supporting<br />evidence</div><div className="text-right">accounted<br />outcome</div></div>
        <div className="mt-6 grid grid-cols-[1fr_auto] items-center gap-4 border-t border-[#D8E5EC] pt-3"><span className="text-[11px] leading-4 text-[#66737F]">The review connects the records before it draws a conclusion.</span><span className="whitespace-nowrap text-[10px] font-semibold text-[#0B74DE]">connected</span></div>
      </div>
    </div>
  );
}

function HandoffVisual() {
  const reduceMotion = useReducedMotion();
  return (
    <div className="relative mx-auto h-[190px] w-full max-w-[420px] overflow-hidden rounded-[18px] border border-[#E3EAF0] bg-[linear-gradient(135deg,#FBFCFF_0%,#F1F7FB_58%,#F8FAF5_100%)] p-5 sm:h-[210px]">
      <motion.div aria-hidden="true" className="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-[#D8F0E5]/75 blur-2xl" animate={reduceMotion ? undefined : { x: [0, 16, 0], y: [0, -8, 0] }} transition={reduceMotion ? undefined : { duration: 6, repeat: Infinity, ease: 'easeInOut' }} />
      <FloatingIcon className="left-[16%] top-8" delay={0.5}><FileText className="h-5 w-5" strokeWidth={1.7} /></FloatingIcon>
      <FloatingIcon className="right-[15%] top-10" delay={1}><CloudUpload className="h-5 w-5" strokeWidth={1.7} /></FloatingIcon>
      <div className="relative flex h-full items-center justify-center">
        <motion.div animate={reduceMotion ? undefined : { y: [0, -4, 0] }} transition={reduceMotion ? undefined : { duration: 4, repeat: Infinity, ease: 'easeInOut' }} className="relative flex h-[96px] w-[126px] flex-col items-center justify-center rounded-[14px] border border-[#BFD9EA] bg-white shadow-[0_16px_35px_rgba(38,89,126,0.10)]"><UploadCloud className="h-8 w-8 text-[#0B74DE]" strokeWidth={1.5} /><span className="mt-2 text-[11px] font-semibold text-[#30343B]">Margin request</span><span className="mt-0.5 text-[9px] text-[#777A82]">files stay controlled</span></motion.div>
        <motion.div aria-hidden="true" animate={reduceMotion ? undefined : { x: [0, 8, 0], opacity: [0.4, 1, 0.4] }} transition={reduceMotion ? undefined : { duration: 2.8, repeat: Infinity, ease: 'easeInOut' }} className="absolute left-[23%] top-1/2 h-px w-[20%] bg-[#8CC8F5]" />
        <ArrowDown className="absolute bottom-1 left-1/2 h-4 w-4 translate-x-[48px] rotate-[-90deg] text-[#8CC8F5]" aria-hidden="true" />
        <div className="absolute bottom-3 right-[12%] flex items-center gap-1.5 rounded-full border border-[#DCE7F0] bg-white/90 px-2.5 py-1.5 text-[10px] font-semibold text-[#48677A] shadow-sm"><ClipboardCheck className="h-3 w-3 text-[#3B8F5A]" /> upload when ready</div>
      </div>
    </div>
  );
}

export function ReviewJourneyVisual({ kind }: ReviewJourneyVisualProps) {
  const copy = visualCopy[kind];
  const Visual = kind === 'consent' ? ConsentVisual : kind === 'review' ? ReviewVisual : HandoffVisual;
  return (
    <div className="mb-7" aria-label={`${copy.eyebrow}: ${copy.title}`}>
      <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-tight text-[#0B74DE]"><span className="h-1.5 w-1.5 rounded-full bg-[#0B74DE]" aria-hidden="true" />{copy.eyebrow}</div>
      <Visual />
    </div>
  );
}
