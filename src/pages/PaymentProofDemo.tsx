import { useEffect, useState } from 'react';
import { ArrowDown, Check, FileText, ShieldCheck } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SITE_META } from '@/config/site';

const recoveryStatuses = [
  ['Recovery approved', '#10D991'],
  ['Under review', '#F4C9B5'],
  ['Residual unresolved', '#FF5517'],
  ['Reconciled', '#22C7C1'],
] as const;

function Connector({ className = '', delay = 0 }: { className?: string; delay?: number }) {
  return <motion.span aria-hidden="true" className={`absolute block origin-left bg-[#182026] ${className}`} initial={{ scaleX: 0, opacity: 0 }} animate={{ scaleX: 1, opacity: 1 }} transition={{ delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] }} />;
}

function OutcomeVerified({ visible }: { visible: boolean }) {
  return (
    <motion.div initial={{ opacity: 0, y: -22, scale: 0.96 }} animate={visible ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: -22, scale: 0.96 }} transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="absolute left-1/2 top-0 z-20 w-[230px] -translate-x-1/2 rounded-[18px] border border-white/80 bg-white/95 px-5 py-5 text-center shadow-[0_18px_50px_rgba(42,61,118,0.12)] backdrop-blur sm:w-[285px] sm:px-7 sm:py-6">
      <p className="font-google-sans text-[20px] tracking-[-0.03em] text-[#182026] sm:text-[25px]">Outcome Verified</p>
      <div className="mx-auto mt-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#10D991] text-white shadow-[0_8px_20px_rgba(16,217,145,0.25)] sm:h-16 sm:w-16"><Check className="h-8 w-8 sm:h-9 sm:w-9" strokeWidth={3.2} /></div>
      <p className="mt-3 font-mono text-[9px] uppercase tracking-[0.12em] text-[#6D7B84]">Financial position reconciled</p>
    </motion.div>
  );
}

export default function PaymentProofDemo() {
  usePageMeta({ title: 'Evidence to Resolution | Margin', description: 'A code-driven demonstration of Margin turning collected evidence into an actionable financial determination and verified outcome.', url: `${SITE_META.url}/payment-proof-demo`, image: SITE_META.image });
  const reduceMotion = useReducedMotion();
  const [cycle, setCycle] = useState(0);
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (reduceMotion) { setStage(6); return; }
    setStage(0);
    const timers = [400, 850, 1250, 1700, 2150, 2600].map((delay, index) => window.setTimeout(() => setStage(index + 1), delay));
    timers.push(window.setTimeout(() => setCycle((value) => value + 1), 7600));
    return () => timers.forEach(window.clearTimeout);
  }, [cycle, reduceMotion]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#F7F7FF] px-4 py-10 font-google-sans text-[#182026] sm:px-8 sm:py-14">
      <section className="mx-auto max-w-[1180px]">
        <div className="relative mx-auto min-h-[690px] max-w-[1080px] rounded-[28px] border border-white/80 bg-[radial-gradient(circle_at_50%_42%,rgba(255,255,255,0.96),rgba(239,241,255,0.76)_68%,rgba(232,235,255,0.5))] px-4 py-8 shadow-[0_24px_80px_rgba(57,70,142,0.09)] sm:min-h-[720px] sm:px-10 sm:py-10">
          <div className="absolute inset-0 opacity-40 [background-image:linear-gradient(rgba(105,117,180,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(105,117,180,0.05)_1px,transparent_1px)] [background-size:34px_34px]" aria-hidden="true" />
          <OutcomeVerified visible={stage >= 5} />

          <motion.div initial={{ opacity: 0, x: -22 }} animate={{ opacity: stage >= 1 ? 1 : 0.35, x: stage >= 1 ? 0 : -22 }} transition={{ duration: 0.55 }} className="absolute left-4 top-[190px] z-10 w-[190px] rounded-[18px] bg-white/95 p-5 shadow-[0_18px_45px_rgba(47,62,122,0.11)] sm:left-8 sm:top-[210px] sm:w-[250px] sm:p-7">
            <p className="font-google-sans text-[18px] tracking-[-0.03em] sm:text-[22px]">Evidence Collected</p>
            <div className="mt-5 flex items-start gap-3"><FileText className="h-12 w-12 shrink-0 text-[#F5B18B] sm:h-16 sm:w-16" strokeWidth={1.35} /><div className="mt-1 space-y-2">{[72, 92, 58].map((width) => <span key={width} className="block h-2 rounded-full bg-[#EEF0F3]" style={{ width: `${width}px` }} />)}</div></div>
            <p className="mt-5 font-mono text-[9px] uppercase tracking-[0.12em] text-[#8A99A5]">Amazon records · case history</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 22 }} animate={{ opacity: stage >= 2 ? 1 : 0.35, x: stage >= 2 ? 0 : 22 }} transition={{ duration: 0.55 }} className="absolute right-4 top-[190px] z-10 w-[190px] rounded-[18px] bg-white/95 p-5 shadow-[0_18px_45px_rgba(47,62,122,0.11)] sm:right-8 sm:top-[210px] sm:w-[250px] sm:p-7">
            <p className="font-google-sans text-[18px] tracking-[-0.03em] sm:text-[22px]">Recovery Status</p>
            <div className="mt-5 space-y-3">{recoveryStatuses.map(([label, color]) => <div key={label} className="flex items-center gap-2.5 text-[11px] text-[#4D5B66] sm:text-[13px]"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />{label}</div>)}</div>
          </motion.div>

          <Connector className="left-[206px] top-[350px] h-px w-[calc(50%-205px)] sm:left-[278px] sm:top-[365px] sm:w-[calc(50%-278px)]" delay={0.7} />
          <Connector className="right-[206px] top-[350px] h-px w-[calc(50%-205px)] origin-right sm:right-[278px] sm:top-[365px] sm:w-[calc(50%-278px)]" delay={0.95} />
          <Connector className="left-1/2 top-[122px] h-[105px] w-px origin-top -translate-x-1/2" delay={1.05} />

          <motion.div initial={{ opacity: 0, y: 24, scale: 0.98 }} animate={{ opacity: stage >= 2 ? 1 : 0.35, y: stage >= 2 ? 0 : 24, scale: stage >= 2 ? 1 : 0.98 }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }} className="absolute left-1/2 top-[280px] z-10 w-[270px] -translate-x-1/2 rounded-[20px] bg-white px-7 py-8 shadow-[0_24px_60px_rgba(47,62,122,0.15)] sm:top-[300px] sm:w-[370px] sm:px-10 sm:py-10">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.12em] text-[#18B987]">Financial Determination</p>
            <p className="mt-3 font-google-sans text-[42px] leading-none tracking-[-0.05em] sm:text-[62px]">$26,000</p>
            <p className="mt-2 text-[11px] font-semibold text-[#52616A] sm:text-[13px]">Approved by Amazon</p>
            <div className="mt-7 space-y-2"><div className="flex items-center justify-between text-[10px] text-[#71818A]"><span>Reconciled</span><strong className="text-[#18B987]">$6,760</strong></div><div className="h-2 overflow-hidden rounded-full bg-[#EEF0F3]"><motion.span className="block h-full rounded-full bg-[#22C7C1]" initial={{ width: 0 }} animate={{ width: '26%' }} transition={{ delay: 1.5, duration: 0.7 }} /></div><div className="flex items-center justify-between text-[10px] text-[#71818A]"><span>Remaining unresolved</span><strong className="text-[#FF5517]">$19,240</strong></div><div className="h-2 overflow-hidden rounded-full bg-[#EEF0F3]"><motion.span className="block h-full rounded-full bg-[#FF5517]" initial={{ width: 0 }} animate={{ width: '74%' }} transition={{ delay: 1.65, duration: 0.7 }} /></div></div>
            <div className="mt-8 grid grid-cols-2 gap-5"><div className="text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#10D991] text-white sm:h-20 sm:w-20"><ShieldCheck className="h-9 w-9 sm:h-11 sm:w-11" strokeWidth={1.7} /></div><p className="mt-3 text-[11px] font-medium text-[#182026] sm:text-[13px]">Financially verified</p></div><div className="text-center"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#FF5517] text-white sm:h-20 sm:w-20"><ArrowDown className="h-9 w-9 sm:h-11 sm:w-11" strokeWidth={1.7} /></div><p className="mt-3 text-[11px] font-medium text-[#182026] sm:text-[13px]">Balance remains</p></div></div>
          </motion.div>

          <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[#8791B2] sm:bottom-7"><ShieldCheck className="h-3.5 w-3.5" />Evidence-linked financial outcome</div>
        </div>


      </section>
    </main>
  );
}
