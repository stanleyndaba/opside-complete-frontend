import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { BarChart3, FileText, Table2 } from "lucide-react";

const stages = [
  { id: "person", duration: 3200 },
  { id: "accounting", duration: 2700 },
  { id: "reports", duration: 2700 },
  { id: "provider", duration: 2500 },
  { id: "team", duration: 2900 },
  { id: "orbit", duration: 4200 },
  { id: "question", duration: 5000 },
  { id: "models", duration: 4100 },
  { id: "margin", duration: 4200 },
] as const;

type StageId = (typeof stages)[number]["id"];

const accounting = [
  { name: "Xero", src: "/xero.png" },
  { name: "QuickBooks", src: "/quickbooks.png" },
  { name: "NetSuite", src: null },
];

const team = [
  { name: "Finance", src: "/recovery-finance-avatar.png" },
  { name: "Operations", src: "/recovery-operations-avatar.png" },
  { name: "Owner", src: "/recovery-owner-avatar.png" },
];

const orbitItems = [
  { label: "Accounting", x: "10%", y: "28%", tone: "border-[#B9D0FF] bg-[#F3F7FF]" },
  { label: "Reports", x: "74%", y: "24%", tone: "border-[#D6C5FF] bg-[#FAF7FF]" },
  { label: "Provider", x: "82%", y: "64%", tone: "border-[#F4C9BC] bg-[#FFF8F5]" },
  { label: "Finance team", x: "13%", y: "70%", tone: "border-[#BFE5D6] bg-[#F4FBF8]" },
];

function phaseIndex(stage: StageId) {
  return stages.findIndex((item) => item.id === stage);
}

function Person({ visible, orbiting }: { visible: boolean; orbiting: boolean }) {
  return (
    <motion.div
      initial={false}
      animate={{ opacity: visible ? 1 : 0, x: visible ? 0 : -180, scale: visible ? 1 : 0.92 }}
      transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      className={`relative flex flex-col items-center ${orbiting ? "z-20" : "z-10"}`}
    >
      <motion.div animate={orbiting ? { y: [0, -5, 0] } : { y: 0 }} transition={{ duration: 3, repeat: orbiting ? Infinity : 0, ease: "easeInOut" }} className="relative">
        <div className="h-[106px] w-[106px] overflow-hidden rounded-full border-[5px] border-white bg-[#E8EEF2] shadow-[0_18px_42px_rgba(24,32,38,0.18)] sm:h-[132px] sm:w-[132px]">
          <img src="/recovery-finance-avatar.png" alt="Finance leader" className="h-full w-full object-cover" />
        </div>
        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#182026] px-3 py-1.5 text-[10px] font-semibold text-white shadow-[0_8px_20px_rgba(24,32,38,0.16)]">Finance leader</span>
      </motion.div>
      <p className="mt-7 text-center font-sora text-[16px] font-semibold tracking-[-0.035em] text-[#182026] sm:text-[19px]">$5M+ Amazon Business</p>
    </motion.div>
  );
}

function AccountingCluster({ visible }: { visible: boolean }) {
  return (
    <motion.div initial={false} animate={{ opacity: visible ? 1 : 0, x: visible ? 0 : -120 }} transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }} className="absolute left-[4%] top-[25%] flex flex-col items-center gap-3 sm:left-[8%] sm:top-[28%]">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#667781]">Has accounting software</p>
      <div className="flex items-center gap-2 rounded-full border border-[#D8E3E8] bg-white px-3 py-2 shadow-[0_10px_24px_rgba(24,32,38,0.08)] sm:gap-3 sm:px-4 sm:py-3">
        {accounting.map((item) => <div key={item.name} className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E6ECEF] bg-[#FAFCFC] p-1.5 sm:h-11 sm:w-11 sm:p-2">{item.src ? <img src={item.src} alt={item.name} className="h-full w-full object-contain" /> : <span className="text-[8px] font-bold leading-none text-[#68737A]">NS</span>}</div>)}
      </div>
    </motion.div>
  );
}

function ReportsCluster({ visible }: { visible: boolean }) {
  return (
    <motion.div initial={false} animate={{ opacity: visible ? 1 : 0, x: visible ? 0 : 120 }} transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }} className="absolute right-[4%] top-[24%] flex flex-col items-center gap-3 sm:right-[8%] sm:top-[28%]">
      <p className="text-center text-[10px] font-bold uppercase tracking-[0.13em] text-[#667781]">Has settlement reports<br />&amp; seller central data</p>
      <div className="flex items-center gap-3">
        <div className="flex h-14 w-14 flex-col items-center justify-center rounded-[10px] border border-[#D6C5FF] bg-[#FAF7FF] text-[#7658B5] shadow-[0_10px_24px_rgba(24,32,38,0.08)]"><FileText className="h-5 w-5" /><span className="mt-1 text-[8px] font-semibold">Settlement</span></div>
        <div className="flex h-14 w-14 flex-col items-center justify-center rounded-[10px] border border-[#B9D0FF] bg-[#F3F7FF] text-[#245BFF] shadow-[0_10px_24px_rgba(24,32,38,0.08)]"><Table2 className="h-5 w-5" /><span className="mt-1 text-[8px] font-semibold">Seller data</span></div>
      </div>
    </motion.div>
  );
}

function ProviderCluster({ visible }: { visible: boolean }) {
  return (
    <motion.div initial={false} animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : -100 }} transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }} className="absolute left-1/2 top-[7%] flex -translate-x-1/2 flex-col items-center gap-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#667781]">Uses a reimbursement provider</p>
      <div className="flex items-center gap-2 rounded-full border border-[#F4C9BC] bg-[#FFF8F5] px-4 py-2.5 shadow-[0_10px_24px_rgba(24,32,38,0.08)]"><span className="flex h-8 w-8 items-center justify-center rounded-[7px] bg-[#D9472D] text-[11px] font-black text-white">C</span><span className="text-[12px] font-semibold text-[#4B555B]">ClaimDesk</span></div>
    </motion.div>
  );
}

function TeamCluster({ visible }: { visible: boolean }) {
  return (
    <motion.div initial={false} animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 100 }} transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }} className="absolute bottom-[6%] left-1/2 flex -translate-x-1/2 flex-col items-center gap-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#667781]">Has a finance team</p>
      <div className="flex -space-x-3 rounded-full border border-[#BFE5D6] bg-[#F4FBF8] px-4 py-2.5 shadow-[0_10px_24px_rgba(24,32,38,0.08)]">
        {team.map((member) => <img key={member.name} src={member.src} alt={member.name} className="h-10 w-10 rounded-full border-2 border-white object-cover" />)}
      </div>
    </motion.div>
  );
}

function Orbit({ visible }: { visible: boolean }) {
  return (
    <motion.div initial={false} animate={{ opacity: visible ? 1 : 0, scale: visible ? 1 : 0.8 }} transition={{ duration: 0.9 }} className="pointer-events-none absolute inset-[4%]">
      <div className="absolute inset-[12%] rounded-full border border-dashed border-[#C8D6DE]" />
      <div className="absolute inset-[24%] rounded-full border border-[#E1E9ED]" />
      {orbitItems.map((item, index) => <motion.div key={item.label} animate={visible ? { rotate: [0, index % 2 ? -3 : 3, 0] } : {}} transition={{ duration: 4 + index * 0.35, repeat: visible ? Infinity : 0, ease: "easeInOut" }} style={{ left: item.x, top: item.y }} className={`absolute rounded-full border px-3 py-2 text-[10px] font-semibold text-[#53626A] shadow-[0_8px_20px_rgba(24,32,38,0.07)] ${item.tone}`}>{item.label}</motion.div>)}
    </motion.div>
  );
}

function TypeLine({ text, active }: { text: string; active: boolean }) {
  const [count, setCount] = useState(active ? text.length : 0);
  useEffect(() => {
    if (!active) { setCount(0); return; }
    setCount(0);
    const timer = window.setInterval(() => setCount((value) => value >= text.length ? value : value + 1), 42);
    return () => window.clearInterval(timer);
  }, [active, text]);
  return <span>{text.slice(0, count)}{active && count < text.length ? <span className="ml-1 inline-block h-[1em] w-px animate-pulse bg-current align-[-0.08em]" /> : null}</span>;
}

function ModelQuestion({ visible }: { visible: boolean }) {
  return (
    <motion.div initial={false} animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 20 }} transition={{ duration: 0.7 }} className="absolute inset-0 flex items-center justify-center px-6 text-center">
      <p className="max-w-[820px] font-sora text-[30px] font-semibold leading-[1.02] tracking-[-0.055em] text-[#182026] sm:text-[52px] md:text-[66px]"><TypeLine active={visible} text="With everything at hand. Can they establish what happened?" /></p>
    </motion.div>
  );
}

function Models({ visible }: { visible: boolean }) {
  return (
    <motion.div initial={false} animate={{ opacity: visible ? 1 : 0 }} transition={{ duration: 0.5 }} className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
      <div className="flex items-center gap-12 sm:gap-24">
        <motion.div initial={false} animate={{ x: visible ? 0 : -180, opacity: visible ? 1 : 0 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} className="flex flex-col items-center gap-3"><div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#D8E3E8] bg-white p-4 shadow-[0_12px_28px_rgba(24,32,38,0.10)] sm:h-20 sm:w-20"><img src="/ai-logos/claude.svg" alt="Claude" className="h-full w-full object-contain" /></div><span className="text-[11px] font-semibold text-[#697780]">Claude</span></motion.div>
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9AA7AE]">General purpose models</span>
        <motion.div initial={false} animate={{ x: visible ? 0 : 180, opacity: visible ? 1 : 0 }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }} className="flex flex-col items-center gap-3"><div className="flex h-16 w-16 items-center justify-center rounded-full border border-[#D8E3E8] bg-white p-4 shadow-[0_12px_28px_rgba(24,32,38,0.10)] sm:h-20 sm:w-20"><img src="/ai-logos/chatgpt.svg" alt="GPT" className="h-full w-full object-contain" /></div><span className="text-[11px] font-semibold text-[#697780]">GPT</span></motion.div>
      </div>
      <p className="mt-10 max-w-[620px] font-sora text-[28px] font-semibold leading-[1.03] tracking-[-0.05em] text-[#182026] sm:text-[46px]">aren&apos;t sufficient.</p>
    </motion.div>
  );
}

export default function DemoHero() {
  const reduceMotion = useReducedMotion();
  const [stageIndex, setStageIndex] = useState(0);
  const stage = stages[stageIndex].id;
  const index = phaseIndex(stage);
  const auto = useMemo(() => !reduceMotion, [reduceMotion]);

  useEffect(() => {
    if (!auto) return;
    const timer = window.setTimeout(() => setStageIndex((current) => (current + 1) % stages.length), stages[stageIndex].duration);
    return () => window.clearTimeout(timer);
  }, [auto, stageIndex]);

  const showOrbit = index >= phaseIndex("orbit") && index < phaseIndex("question");
  const showQuestion = stage === "question";
  const showModels = stage === "models";
  const showMargin = stage === "margin";
  const showPeople = index >= phaseIndex("person") && index < phaseIndex("question");

  return (
    <main className="min-h-screen overflow-hidden bg-white font-google-sans text-[#182026]">
      <section className="relative flex min-h-screen items-center justify-center px-4 py-10 sm:px-8">
        <div className="absolute left-5 top-5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#A0ABB1] sm:left-10 sm:top-8">Margin · Scene 01</div>
        <div className="absolute right-5 top-5 text-[10px] font-semibold uppercase tracking-[0.15em] text-[#A0ABB1] sm:right-10 sm:top-8">Financial complexity</div>

        <div className="relative h-[650px] w-full max-w-[1240px] sm:h-[760px]">
          <AnimatePresence mode="wait">
            {showPeople ? <motion.div key="people" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} className="absolute inset-0">
              <Person visible={showPeople} orbiting={showOrbit} />
              <AccountingCluster visible={index >= phaseIndex("accounting")} />
              <ReportsCluster visible={index >= phaseIndex("reports")} />
              <ProviderCluster visible={index >= phaseIndex("provider")} />
              <TeamCluster visible={index >= phaseIndex("team")} />
              <Orbit visible={showOrbit} />
            </motion.div> : null}
          </AnimatePresence>

          <AnimatePresence>
            {showQuestion ? <ModelQuestion key="question" visible /> : null}
            {showModels ? <Models key="models" visible /> : null}
            {showMargin ? <motion.div key="margin" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }} className="absolute inset-0 flex items-center justify-center px-6 text-center"><div><div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[22px] bg-[#245BFF] text-white shadow-[0_18px_42px_rgba(36,91,255,0.22)]"><BarChart3 className="h-9 w-9" strokeWidth={1.7} /></div><p className="mt-8 font-sora text-[42px] font-semibold leading-none tracking-[-0.06em] text-[#182026] sm:text-[72px]">Margin fixes that.</p><p className="mt-5 text-[14px] leading-6 text-[#667781] sm:text-[16px]">The connected financial investigation behind the answer.</p></div></motion.div> : null}
          </AnimatePresence>
        </div>

        <div className="absolute bottom-7 left-1/2 flex -translate-x-1/2 items-center gap-1.5" aria-label="Scene progress">
          {stages.map((item, itemIndex) => <button key={item.id} type="button" onClick={() => setStageIndex(itemIndex)} aria-label={`Show ${item.id} stage`} className={`h-1 rounded-full transition-all ${itemIndex === stageIndex ? "w-9 bg-[#245BFF]" : "w-3 bg-[#D8E3E8]"}`} />)}
        </div>
      </section>
    </main>
  );
}
