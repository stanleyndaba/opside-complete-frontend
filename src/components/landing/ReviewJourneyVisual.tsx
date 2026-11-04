import { motion, useReducedMotion } from 'framer-motion';
import {
  ArrowDown,
  Check,
  ClipboardCheck,
  CloudUpload,
  Database,
  FileCheck2,
  FileText,
  LockKeyhole,
  Search,
  ShieldCheck,
  Sparkles,
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
  const reduceMotion = useReducedMotion();
  return (
    <div className="relative mx-auto h-[190px] w-full max-w-[420px] overflow-hidden rounded-[18px] border border-[#E3EAF0] bg-[linear-gradient(135deg,#F9FCFF_0%,#EEF6FB_58%,#F9FAF8_100%)] p-5 sm:h-[210px]">
      <motion.div aria-hidden="true" className="absolute -right-12 -top-16 h-44 w-44 rounded-full bg-[#CFE9FF]/65 blur-2xl" animate={reduceMotion ? undefined : { scale: [1, 1.12, 1], opacity: [0.6, 0.85, 0.6] }} transition={reduceMotion ? undefined : { duration: 5.5, repeat: Infinity, ease: 'easeInOut' }} />
      <FloatingIcon className="right-[22%] top-7" delay={0.2}><FileText className="h-5 w-5" strokeWidth={1.7} /></FloatingIcon>
      <FloatingIcon className="bottom-8 left-[17%]" delay={0.8}><LockKeyhole className="h-5 w-5" strokeWidth={1.7} /></FloatingIcon>
      <div className="relative flex h-full items-center justify-center">
        <motion.div animate={reduceMotion ? undefined : { scale: [1, 1.035, 1] }} transition={reduceMotion ? undefined : { duration: 3.8, repeat: Infinity, ease: 'easeInOut' }} className="relative flex h-[106px] w-[106px] items-center justify-center rounded-full border border-[#BFD9EA] bg-white/90 shadow-[0_16px_35px_rgba(38,89,126,0.10)]">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0B74DE] text-white shadow-[0_10px_24px_rgba(11,116,222,0.24)]"><ShieldCheck className="h-8 w-8" strokeWidth={1.5} /></div>
          <motion.span aria-hidden="true" animate={reduceMotion ? undefined : { rotate: 360 }} transition={reduceMotion ? undefined : { duration: 12, repeat: Infinity, ease: 'linear' }} className="absolute inset-2 rounded-full border border-dashed border-[#8CC8F5]" />
        </motion.div>
        <div className="absolute bottom-3 right-[14%] flex items-center gap-1.5 rounded-full border border-[#DCE7F0] bg-white/90 px-2.5 py-1.5 text-[10px] font-semibold text-[#48677A] shadow-sm"><Check className="h-3 w-3 text-[#3B8F5A]" /> read-only scope</div>
      </div>
    </div>
  );
}

function ReviewVisual() {
  const reduceMotion = useReducedMotion();
  const nodes = [
    { label: 'event', icon: Database },
    { label: 'evidence', icon: FileCheck2 },
    { label: 'position', icon: Search },
  ];
  return (
    <div className="relative mx-auto h-[190px] w-full max-w-[420px] overflow-hidden rounded-[18px] border border-[#E3EAF0] bg-[linear-gradient(135deg,#F9FCFF_0%,#F1F7FB_58%,#FCFAF5_100%)] p-5 sm:h-[210px]">
      <motion.div aria-hidden="true" className="absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#D8EDFF]/70 blur-2xl" animate={reduceMotion ? undefined : { scale: [0.9, 1.15, 0.9], opacity: [0.45, 0.8, 0.45] }} transition={reduceMotion ? undefined : { duration: 5, repeat: Infinity, ease: 'easeInOut' }} />
      <div className="relative flex h-full items-center justify-center gap-2.5 sm:gap-5">
        {nodes.map(({ label, icon: Icon }, index) => (
          <div key={label} className="relative flex flex-col items-center gap-2">
            <motion.div animate={reduceMotion ? undefined : { y: [0, index % 2 ? 4 : -4, 0] }} transition={reduceMotion ? undefined : { duration: 3.8, delay: index * 0.35, repeat: Infinity, ease: 'easeInOut' }} className={`flex h-14 w-14 items-center justify-center rounded-[14px] border ${index === 2 ? 'border-[#B9D8F1] bg-[#0B74DE] text-white shadow-[0_10px_24px_rgba(11,116,222,0.2)]' : 'border-[#DCE7F0] bg-white text-[#0B74DE] shadow-[0_10px_24px_rgba(24,54,78,0.08)]'}`}><Icon className="h-6 w-6" strokeWidth={1.6} /></motion.div>
            <span className="text-[10px] font-semibold tracking-tight text-[#48677A]">{label}</span>
            {index < nodes.length - 1 ? <motion.div aria-hidden="true" animate={reduceMotion ? undefined : { opacity: [0.35, 1, 0.35] }} transition={reduceMotion ? undefined : { duration: 2.2, delay: index * 0.3, repeat: Infinity }} className="absolute left-[calc(100%+2px)] top-7 h-px w-5 bg-[#8CC8F5] sm:w-8" /> : null}
          </div>
        ))}
      </div>
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-[#DCE7F0] bg-white/90 px-2.5 py-1.5 text-[10px] font-semibold text-[#48677A] shadow-sm"><Sparkles className="h-3 w-3 text-[#635BFF]" /> financial position</div>
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
