import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Archive, CalendarDays, Check, ChevronDown, Database, Layers3, MousePointer2, Search } from "lucide-react";
import EvidenceRequired from "./EvidenceRequired";

const routineItems = [
  "Drafted 18 review agendas",
  "Spot clients showing signs of attrition risk",
  "Generate the agenda for a quarterly review",
  "Build a review deck for a client’s annual meeting",
  "Find referral opportunities in my book",
  "Drafting scheduling emails  •  14 of 18",
  "Checked review dates across 8 clients",
];

const routineCards = [
  { title: "Schedule", body: "Runs every Monday at 09:00 UTC.", meta: "Collects", value: "Trigger", icon: CalendarDays, color: "text-[#5483A7]" },
  { title: "Sources", body: "", sourceLogos: [{ name: "Gmail", src: "/gmailicon.png" }, { name: "Amazon", src: "/amazon-logo-transparent-circle.png" }, { name: "Outlook", src: "/outlookicon.webp" }, { name: "OneDrive", src: "/onedriive.png" }, { name: "QuickBooks", src: "/quickbooks.png" }], meta: "Collects", value: "Connected records", icon: Database, color: "text-[#5483A7]" },
  { title: "Instructions", body: "Reconcile settlement variance and deliver findings with sources attached.", meta: "Collects", value: "Findings", icon: Layers3, color: "text-[#8068A9]" },
  { title: "Deliver", body: "Deliver findings with the supporting source records attached.", meta: "Collects", value: "Message", image: "/slack-icon-2019.png", color: "text-[#5C9A75]" },
];

const routineTypes = [
  "Settlement variance control",
  "Inbound shortage and receiving variance",
  "Reimbursement eligibility and duplicate recovery",
  "Return and refund reconciliation",
  "FBA fee and surcharge validation",
  "Inventory movement and ledger reconciliation",
  "Removal and disposal reimbursement watch",
  "Amazon case response and residual follow-up",
  "Payout attribution and clearing control",
  "Evidence sufficiency and exception monitoring",
];

function RoutineLibrary({ reduceMotion }: { reduceMotion: boolean }) {
  const [visibleCount, setVisibleCount] = useState(0);
  const [createdCount, setCreatedCount] = useState(0);

  useEffect(() => {
    if (reduceMotion) {
      setVisibleCount(routineTypes.length);
      setCreatedCount(routineTypes.length);
      return;
    }
    setVisibleCount(0);
    setCreatedCount(0);
    const timers: number[] = [];
    routineTypes.forEach((_, index) => {
      timers.push(window.setTimeout(() => setVisibleCount(index + 1), 280 + index * 620));
      timers.push(window.setTimeout(() => setCreatedCount(index + 1), 700 + index * 620));
    });
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [reduceMotion]);

  return <motion.main key="routine-library" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen bg-white px-5 py-8 font-google-sans text-[#182026] sm:px-10 sm:py-12 lg:px-16 lg:py-16">
    <div className="mx-auto max-w-[980px]">
      <div className="mb-8 sm:mb-10"><p className="font-mono text-[9px] font-semibold uppercase tracking-tight text-[#8B857F] sm:text-[10px]">Routine library</p><h1 className="mt-2 text-[20px] font-medium tracking-[-0.045em] sm:text-[30px]">Building recurring financial controls</h1><p className="mt-2 max-w-[620px] text-[11px] leading-5 text-[#77716B] sm:text-[14px] sm:leading-6">Margin is preparing the control routines that keep settlement activity, supporting evidence, and unresolved exceptions under review.</p></div>
      <div className="grid grid-cols-[minmax(0,1fr)_112px] border-b border-[#E5E7E7] pb-3 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#8B857F] sm:grid-cols-[minmax(0,1fr)_140px] sm:text-[10px]"><span>Routine type</span><span>Routine state</span></div>
      <div className="divide-y divide-[#ECEEEE]">
        {routineTypes.map((routine, index) => index < visibleCount ? <motion.div key={routine} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.3 }} className="grid min-h-[48px] grid-cols-[minmax(0,1fr)_112px] items-center gap-4 py-3 text-[11px] sm:grid-cols-[minmax(0,1fr)_140px] sm:py-3.5 sm:text-[13px]"><span className="min-w-0 pr-3 text-[#36404A]">{routine}</span>{index < createdCount ? <span className="inline-flex w-fit items-center rounded-full bg-[#EAF5EF] px-2.5 py-1 text-[9px] font-semibold normal-case tracking-normal text-[#2E7650] sm:text-[10px]">Created</span> : <span className="text-[10px] text-[#8B857F] sm:text-[11px]">Creating...</span>}</motion.div> : null)}
      </div>
    </div>
  </motion.main>;
}

function RoutineWorkspace() {
  return <motion.main key="routine-workspace" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="min-h-screen bg-[#FFFFFF] px-5 py-8 font-google-sans text-[#182026] sm:px-10 sm:py-12 lg:px-16 lg:py-16"><div className="mx-auto max-w-[980px]">
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.38 }}>
      <div className="mt-3 flex items-start justify-between gap-5"><div><h1 className="text-[16px] font-medium tracking-[-0.045em] sm:text-[23px]">Saved routine</h1><p className="mt-2 max-w-[600px] text-[12px] leading-5 text-[#77716B] sm:text-[15px] sm:leading-6">The operation is now preserved and ready to run against connected financial records.</p></div><span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#EAF5EF] px-2.5 py-1.5 text-[10px] font-semibold text-[#2E7650] sm:px-3 sm:text-[11px]"><span className="h-1.5 w-1.5 rounded-full bg-[#3E9A68]" />Active</span></div>
    </motion.div>
    <div className="relative mt-8 max-w-[920px] sm:mt-10"><span aria-hidden="true" className="absolute bottom-8 left-[10px] top-8 w-px bg-[#D7DBDC] sm:bottom-10 sm:left-[13px] sm:top-10" />
      <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.18, duration: 0.42 }} className="relative flex items-start gap-4 pb-5 sm:gap-6 sm:pb-6"><span className="relative z-10 mt-3 flex h-[21px] w-[21px] shrink-0 items-center justify-center rounded-full border border-[#B9C0C2] bg-[#FFFFFF] text-[8px] font-semibold text-[#667075] sm:mt-4 sm:h-[27px] sm:w-[27px] sm:text-[9px]">01</span><article className="min-w-0 flex-1 px-0 py-2 sm:py-3"><div className="flex items-start justify-between gap-4"><div><p className="font-mono text-[9px] font-semibold uppercase tracking-tight text-[#8B857F] sm:text-[10px]">Routine saved</p><p className="mt-2 font-mono text-[9px] font-semibold uppercase tracking-tight text-[#8B857F] sm:text-[10px]">Financial control · Amazon settlements</p><h2 className="mt-2 text-[13px] font-semibold tracking-[-0.035em] sm:text-[18px]">Settlement Variance Control</h2></div><span className="text-[18px] leading-none text-[#8D8781]">⋮</span></div><p className="mt-4 max-w-[620px] text-[11px] leading-5 text-[#77716B] sm:text-[12px]">The configured operation now exists as a persistent, reusable routine.</p></article></motion.div>
      <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.58, duration: 0.42 }} className="relative flex items-start gap-4 pb-5 sm:gap-6 sm:pb-6"><span className="relative z-10 mt-3 flex h-[21px] w-[21px] shrink-0 items-center justify-center rounded-full border border-[#B9C0C2] bg-[#FFFFFF] text-[8px] font-semibold text-[#667075] sm:mt-4 sm:h-[27px] sm:w-[27px] sm:text-[9px]">02</span><article className="min-w-0 flex-1 px-0 py-2 sm:py-3"><p className="font-mono text-[9px] font-semibold uppercase tracking-tight text-[#8B857F] sm:text-[10px]">Operating definition</p><div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-5 sm:grid-cols-4 sm:gap-x-8 sm:gap-y-0"><div><p className="text-[10px] text-[#8B857F] sm:text-[11px]">Schedule</p><p className="mt-1.5 text-[12px] font-medium sm:text-[14px]">Every Monday</p></div><div><p className="text-[10px] text-[#8B857F] sm:text-[11px]">Scope</p><p className="mt-1.5 text-[12px] font-medium sm:text-[14px]">Settlement activity</p></div><div><p className="text-[10px] text-[#8B857F] sm:text-[11px]">Last run</p><p className="mt-1.5 text-[12px] font-medium text-[#6D6863] sm:text-[14px]">Not yet run</p></div><div><p className="text-[10px] text-[#8B857F] sm:text-[11px]">Next run</p><p className="mt-1.5 text-[12px] font-medium sm:text-[14px]">Monday, 09:00</p></div></div></article></motion.div>
      <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.98, duration: 0.42 }} className="relative flex items-start gap-4 sm:gap-6"><span className="relative z-10 mt-3 flex h-[21px] w-[21px] shrink-0 items-center justify-center rounded-full border border-[#B9C0C2] bg-[#FFFFFF] text-[8px] font-semibold text-[#667075] sm:mt-4 sm:h-[27px] sm:w-[27px] sm:text-[9px]">03</span><article className="relative min-w-0 flex-1 px-0 py-2 sm:py-3"><p className="font-mono text-[9px] font-semibold uppercase tracking-tight text-[#8B857F] sm:text-[10px]">Ready to run</p><p className="mt-3 text-[11px] leading-5 text-[#77716B] sm:text-[12px]">Sources: Gmail, Amazon, Outlook, OneDrive, QuickBooks</p><p className="text-[11px] leading-5 text-[#77716B] sm:text-[12px]">Instruction: reconcile settlement variance and deliver findings with sources attached.</p><div className="mt-5 flex flex-col gap-4 border-t border-[#D9DDDD] pt-4 sm:flex-row sm:items-end sm:justify-between"><p className="text-[10px] text-[#8B857F] sm:text-[11px]">Created just now</p><button type="button" className="relative inline-flex h-9 shrink-0 items-center justify-center rounded-[6px] bg-[#111111] px-4 text-[11px] font-semibold text-white sm:h-10 sm:px-5 sm:text-[12px]">View routine <span className="ml-2">→</span><motion.div aria-hidden="true" initial={{ opacity: 0, x: -12, y: -10 }} animate={{ opacity: [0, 1, 1, 0], x: [-12, 0, 0, 8], y: [-10, 0, 0, 6] }} transition={{ delay: 1.65, duration: 1.15, times: [0, 0.2, 0.72, 1] }} className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/4 -translate-y-1/4 text-white drop-shadow-[0_3px_4px_rgba(0,0,0,0.28)]"><MousePointer2 className="h-6 w-6 fill-[#111111] stroke-[1.8]" /></motion.div></button></div></article></motion.div>
    </div>
  </div></motion.main>;
}
function FinancialResolutionWorkflow() {
  const searches = ["Inbound quantity variance", "Settlement credit attribution", "Receiving and custody trail"];
  const records = ["Shipment Receiving Register", "Carrier Custody Record", "Amazon Case Correspondence", "Settlement Transaction Detail", "Inventory Movement Ledger"];
  const reduceMotion = useReducedMotion();
  const [workflowStep, setWorkflowStep] = useState(0);
  useEffect(() => {
    if (reduceMotion) {
      setWorkflowStep(6);
      return;
    }
    setWorkflowStep(0);
    const timers = [850, 850, 900, 850, 950, 850].map((delay, index) => window.setTimeout(() => setWorkflowStep(index + 1), delay + index * 120));
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [reduceMotion]);
  const completedNode = "relative z-10 flex h-[10px] w-[10px] shrink-0 items-center justify-center rounded-full bg-[#4B5358] text-white";
  const heading = "text-[14px] font-medium leading-tight tracking-[-0.02em] sm:text-[16px]";
  const reveal = { initial: { opacity: 0, y: 5 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -5 }, transition: { duration: reduceMotion ? 0 : 0.3 } };
  return <motion.div key="financial-resolution-workflow" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="relative w-full bg-white px-3 py-3 font-google-sans text-[#182026] sm:px-8 sm:py-5 lg:px-16 lg:py-7">
    <div className="mx-auto max-w-[1500px]">
      <header className="px-1 pb-2 text-[#6D7478] sm:px-2 sm:pb-3">
        <h3 className="text-[17px] font-normal tracking-[-0.025em] sm:text-[20px]">Resolution workflow</h3>
      </header>
      <section aria-label="Resolution workflow steps" className="mt-2 bg-white px-2 py-4 sm:mt-3 sm:px-5 sm:py-6 lg:px-8 lg:py-7">
        <div className="relative pl-8 sm:pl-10 lg:pl-12">
          <AnimatePresence initial={false} mode="sync">
          {workflowStep >= 0 ? <motion.div key="position" {...reveal} className="relative flex items-center gap-2 pb-5 sm:pb-6"><span className={completedNode}><Check className="h-[5px] w-[5px]" strokeWidth={3} /></span><h4 className={heading}>Establishing financial position</h4></motion.div> : null}
          {workflowStep >= 1 ? <motion.div key="handoff-one" initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }} className="ml-1 flex h-5 items-center text-[#B8C0C3] sm:ml-2"><ChevronDown className="h-4 w-4" strokeWidth={1.7} /></motion.div> : null}
          {workflowStep >= 1 ? <motion.div key="reconcile" {...reveal} className="relative ml-4 border-l border-[#E4E8E9] pb-4 pl-5 sm:ml-7 sm:pb-5 sm:pl-7"><div className="flex flex-wrap items-center gap-x-4 gap-y-1.5"><span className={completedNode}><Check className="h-[5px] w-[5px]" strokeWidth={3} /></span><h4 className={heading}>Reconciling source records</h4><span className="inline-flex items-center gap-1.5 text-[11px] text-[#7E8589] sm:text-[14px]"><Database className="h-4 w-4" />Amazon SP-API · Settlement Ledger · ERP</span></div>{workflowStep >= 2 ? <motion.p {...reveal} className="mt-2.5 max-w-[1120px] text-[12px] leading-5 text-[#747C80] sm:text-[15px] sm:leading-6">The shipment, receiving, inventory, case, and settlement records resolve to one governed financial event.</motion.p> : null}</motion.div> : null}
          {workflowStep >= 3 ? <motion.div key="handoff-two" initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }} className="ml-10 flex h-5 items-center text-[#B8C0C3] sm:ml-16"><ChevronDown className="h-4 w-4" strokeWidth={1.7} /></motion.div> : null}
          {workflowStep >= 3 ? <motion.div key="testing" {...reveal} className="relative ml-12 border-l border-[#E4E8E9] pb-4 pl-6 sm:ml-20 sm:pb-5 sm:pl-10"><div className="flex items-center gap-2"><span className="relative z-10 flex h-[10px] w-[10px] shrink-0 items-center justify-center rounded-full bg-[#4169D7] text-white"><Check className="h-[5px] w-[5px]" strokeWidth={3} /></span><h4 className={heading}>Testing the supported position</h4></div>{workflowStep >= 4 ? <motion.div {...reveal} className="mt-3 sm:ml-9"><p className="text-[12px] text-[#747C80] sm:text-[15px]">Searching connected records</p><div className="mt-2 flex flex-wrap gap-2">{searches.map((item) => <span key={item} className="inline-flex items-center gap-2 rounded-[7px] border border-[#E6E9EA] bg-[#F4F6F7] px-2.5 py-1.5 text-[10px] text-[#6D7478] sm:px-3 sm:py-2 sm:text-[13px]"><Search className="h-3.5 w-3.5 sm:h-4 sm:w-4" />{item}</span>)}</div><p className="mt-4 text-[12px] text-[#747C80] sm:text-[15px]">Reading source records</p><div className="mt-2 space-y-1.5 text-[11px] text-[#667075] sm:text-[14px]">{records.map((record) => <div key={record} className="flex items-center gap-3"><img src="/pdf-document-icon-red.png" alt="PDF document" className="h-[30px] w-[30px] shrink-0 object-contain" />{record}</div>)}<div className="flex items-center gap-3"><Archive className="h-4 w-4 shrink-0 text-[#647B8C]" />3 additional source records</div></div></motion.div> : null}</motion.div> : null}
          {workflowStep >= 5 ? <motion.div key="determination" {...reveal} className="relative ml-8 flex items-center gap-2 pb-5 text-[#A4AAAC] sm:ml-12 sm:pb-6"><span className="relative z-10 flex h-[10px] w-[10px] shrink-0 items-center justify-center rounded-full border border-[#B9BFC1] bg-[#FBFCFC]" /><h4 className={heading}>Financial determination</h4></motion.div> : null}
          {workflowStep >= 6 ? <motion.div key="approval" {...reveal} className="relative ml-8 flex items-start gap-2 text-[#A4AAAC] sm:ml-12"><span className="relative z-10 mt-0.5 flex h-[10px] w-[10px] shrink-0 items-center justify-center rounded-full border border-[#B9BFC1] bg-[#FBFCFC]" /><div><h4 className={heading}>Approval boundary</h4><p className="mt-2 text-[11px] leading-4 sm:text-[14px] sm:leading-5">Finance review required before consequential action.</p></div></motion.div> : null}
          </AnimatePresence>
        </div>
      </section>
    </div>
  </motion.div>;
}

export default function Routine() {
  const reduceMotion = useReducedMotion();
  const [routineStep, setRoutineStep] = useState(0);
  useEffect(() => {
    if (reduceMotion) return;
  const timer = window.setInterval(() => setRoutineStep((step) => (step >= 52 ? 0 : step + 1)), 760);
    return () => window.clearInterval(timer);
  }, [reduceMotion]);

  const listBuilding = routineStep < 5;
  const listVisible = !reduceMotion && routineStep < 11;
  const buttonVisible = !reduceMotion && routineStep >= 27 && routineStep < 29;
  const routineTapped = routineStep === 28;
  const generatingPlanVisible = !reduceMotion && routineStep >= 29 && routineStep < 31;
  const cardsVisible = !reduceMotion && routineStep >= 31 && routineStep < 35;
  const routineLibraryVisible = !reduceMotion && routineStep >= 35 && routineStep < 44;
  const dashboardVisible = !reduceMotion && routineStep >= 44 && routineStep < 50;
  const evidenceRequiredVisible = !reduceMotion && routineStep >= 11 && routineStep < 27;
  const workflowVisible = reduceMotion || routineStep >= 50;
  const activeRoutineItem = reduceMotion ? 3 : ((3 - Math.floor(Math.max(0, routineStep - 4))) % routineItems.length + routineItems.length) % routineItems.length;
  const stackSlots = [-3, -2, -1, 0, 1, 2, 3];

  if (dashboardVisible) return <RoutineWorkspace />;
  if (routineLibraryVisible) return <RoutineLibrary reduceMotion={Boolean(reduceMotion)} />;
  if (evidenceRequiredVisible) return <EvidenceRequired showSearch={false} showSidebar={false} flat />;
  if (workflowVisible) return <main className="bg-white font-google-sans"><FinancialResolutionWorkflow /></main>;

  return <main className="min-h-screen bg-[#FFFFFF] p-3 font-google-sans sm:p-8"><div className="relative mx-auto flex min-h-[620px] w-full items-center justify-center bg-white px-4 py-8 sm:min-h-[760px] sm:px-8"><div className="relative flex min-h-[580px] w-full max-w-[1100px] items-center justify-center sm:min-h-[680px]" aria-label="Routine creation visual" aria-live="polite"><AnimatePresence mode="wait">
    {listVisible ? <motion.div key="routine-stack" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute left-1/2 top-1/2 h-[420px] w-full max-w-[650px] -translate-x-1/2 -translate-y-1/2">{routineItems.map((item, itemIndex) => { const rawSlot = (itemIndex - activeRoutineItem + routineItems.length) % routineItems.length; const slot = rawSlot > 3 ? rawSlot - routineItems.length : rawSlot; const distance = Math.abs(slot); const isActive = slot === 0; const isVisible = !listBuilding || distance <= routineStep; const width = isActive ? 100 : distance === 1 ? 86 : distance === 2 ? 72 : 58; const opacity = isActive ? 1 : distance === 1 ? 0.58 : distance === 2 ? 0.34 : 0.18; return <motion.div key={item} initial={{ opacity: 0, top: "50%", width: "58%" }} animate={{ opacity: isVisible ? opacity : 0, top: `calc(50% + ${slot * 50}px)`, width: `${width}%`, scale: isActive ? 1 : 0.98 }} transition={{ duration: reduceMotion ? 0 : 0.72, ease: [0.22, 1, 0.36, 1] }} className={`absolute left-1/2 flex min-h-[52px] -translate-x-1/2 -translate-y-1/2 items-center gap-3 px-5 text-[14px] tracking-[-0.015em] sm:min-h-[62px] sm:px-9 sm:text-[19px] ${isActive ? "z-10 bg-white text-[#182026] shadow-[0_8px_22px_rgba(73,62,52,0.05)]" : "bg-[#F2F0EE] text-[#77716B]"}`}><span className="relative h-[13px] w-[15px] shrink-0" aria-hidden="true"><span className="absolute left-0 top-[2px] h-[5px] w-[5px] rounded-full border border-current" /><span className="absolute left-[9px] top-[3px] h-px w-[6px] bg-current" /><span className="absolute left-0 top-[9px] h-[5px] w-[5px] rounded-full border border-current" /><span className="absolute left-[9px] top-[10px] h-px w-[6px] bg-current" /></span><span className="min-w-0 truncate">{item}</span></motion.div>; })}</motion.div> : null}
    {buttonVisible ? <motion.div key="routine-button" initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }} className="absolute inset-0 z-20 flex items-center justify-center"><button type="button" aria-label="Create Routine" className="relative inline-flex h-14 items-center justify-center rounded-[22px] bg-[#111111] px-8 text-[16px] font-semibold text-white shadow-[0_12px_24px_rgba(17,17,17,0.12)]">+ Create Routine</button><motion.div aria-hidden="true" className="pointer-events-none absolute left-[calc(50%+68px)] top-[calc(50%+32px)] text-[#182026] drop-shadow-[0_4px_5px_rgba(24,32,38,0.16)]" animate={{ x: routineTapped ? -14 : 0, y: routineTapped ? -10 : 0 }}><>{routineTapped ? <><motion.span initial={{ opacity: 0.9, scale: 0.65 }} animate={{ opacity: 0, scale: 1.55 }} transition={{ duration: 0.7 }} className="absolute -left-5 -top-5 h-12 w-12 rounded-full border-[3px] border-[#635BFF]/75" /><motion.span initial={{ opacity: 0.7, scale: 0.55 }} animate={{ opacity: 0, scale: 1.45 }} transition={{ delay: 0.08, duration: 0.7 }} className="absolute -left-9 -top-9 h-20 w-20 rounded-full border-2 border-[#B0AAFF]/80" /></> : null}</><MousePointer2 className="relative h-8 w-8 fill-white stroke-[1.8]" /></motion.div></motion.div> : null}
    {generatingPlanVisible ? <motion.div key="generating-plan" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.42 }} className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white text-center"><motion.div className="h-5 w-5 rounded-full bg-[radial-gradient(circle_at_32%_28%,#A9E9FF_0%,#78D8F5_28%,#F59ACB_72%,#F277B8_100%)] shadow-[0_0_10px_rgba(143,207,246,0.64),0_0_16px_rgba(242,119,184,0.28)]" animate={{ x: [0, -2, 2, -1, 0], y: [0, 1, -1, 1, 0], scale: [1, 0.94, 1.06, 0.97, 1], rotate: [0, -5, 5, -3, 0] }} transition={{ duration: 1.15, repeat: Infinity, ease: "easeInOut" }} /><p className="mt-3 text-[17px] font-medium tracking-[-0.025em] text-[#182026] sm:text-[21px]">Generating Plan</p><p className="mt-1 text-[10px] text-[#77716B] sm:text-[12px]">Organising schedule, sources, instructions, and delivery.</p></motion.div> : null}
    {cardsVisible ? <motion.div key="routine-cards" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 flex items-center justify-center bg-[#FFFFFF] px-4 py-8 sm:px-8 sm:py-12"><div className="relative w-full max-w-[960px] py-2 sm:py-4"><span aria-hidden="true" className="absolute bottom-8 left-[10px] top-8 w-px bg-[#D7DBDC] sm:bottom-10 sm:left-[13px] sm:top-10" />{routineCards.map((card, index) => { const Icon = card.icon; return <motion.div key={card.title} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: reduceMotion ? 0 : 0.42, delay: reduceMotion ? 0 : index * 0.5, ease: [0.22, 1, 0.36, 1] }} className="relative flex items-start gap-4 pb-5 last:pb-0 sm:gap-6 sm:pb-6"><span className="relative z-10 mt-3 flex h-[21px] w-[21px] shrink-0 items-center justify-center rounded-full border border-[#B9C0C2] bg-[#FFFFFF] text-[8px] font-semibold text-[#667075] sm:mt-4 sm:h-[27px] sm:w-[27px] sm:text-[9px]">{String(index + 1).padStart(2, "0")}</span><div className="min-w-0 flex-1 rounded-[10px] bg-[#F1F2F2] px-4 py-3 shadow-[0_6px_16px_rgba(73,62,52,0.045)] sm:px-7 sm:py-4"><div className="flex items-start gap-3"><span className={`mt-0.5 flex h-[15px] w-[15px] shrink-0 items-center justify-center ${card.color}`}>{card.image ? <img src={card.image} alt="Slack" className="h-[15px] w-[15px] object-contain" /> : Icon ? <Icon className="h-[15px] w-[15px]" strokeWidth={1.7} /> : null}</span><div className="min-w-0 flex-1"><div className="flex items-center justify-between gap-3"><div><p className="font-mono text-[8px] font-semibold uppercase tracking-tight text-[#8B857F] sm:text-[9px]">Step {String(index + 1).padStart(2, "0")}</p><h3 className="mt-1 text-[10.5px] font-semibold text-[#182026] sm:text-[12px]">{card.title}</h3></div><span className="text-[14px] text-[#6D6863]">···</span></div>{card.sourceLogos ? <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">{card.sourceLogos.map((source) => <span key={source.name} className="inline-flex items-center gap-1.5 text-[9px] text-[#5E5954] sm:text-[10px]"><img src={source.src} alt={`${source.name} logo`} className="h-4 w-4 object-contain" />{source.name}</span>)}</div> : <p className="mt-1.5 text-[10px] leading-4 text-[#5E5954] sm:text-[12px] sm:leading-5">{card.body}</p>}<p className="mt-1.5 text-[9px] text-[#8A847E] sm:text-[10px]"><span className="mr-2">{card.meta}</span><span className="text-[#5E5954]">{card.value}</span></p></div></div></div></motion.div>; })}</div></motion.div> : null}
    {dashboardVisible ? <motion.div key="routine-dashboard" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute inset-0 overflow-hidden bg-white px-5 py-5 text-[#182026] sm:px-8 sm:py-7"><div className="flex items-start justify-between gap-3"><div><h3 className="text-[22px] font-semibold tracking-[-0.035em] sm:text-[28px]">Routines</h3><p className="mt-1 text-[10px] text-[#77716B] sm:text-[12px]">Work that runs on a schedule. Share one with your organization and colleagues can take their own copy of it.</p></div><button type="button" className="rounded-[6px] bg-[#111111] px-3 py-2 text-[9px] font-semibold text-white sm:px-4 sm:text-[10px]">New routine⌄</button></div><div className="mt-5 flex items-center gap-5 border-b border-[#ECEAE7] text-[10px] text-[#77716B] sm:mt-7 sm:text-[12px]"><span className="border-b-2 border-[#182026] pb-3 font-semibold text-[#182026]">My builds</span><span>Discovery</span><span>Runs</span><span>Monitor</span><span>Builder</span></div><div className="mt-4 flex h-8 items-center gap-2 border-b border-[#F0EEEB] text-[9px] text-[#96908A] sm:text-[10px]"><SearchCheck className="h-3 w-3" />Search by name or creator</div><div className="mt-4 grid grid-cols-3 gap-3">{[["Excursion watch", "Runs nightly at 2:00 AM UTC", "Active", "🟦 🟨 🟢 🟣"], ["Deviation register digest", "Runs every Monday at 7:00 AM UTC", "Active", "🟨 🟣"], ["Literature sweep", "Runs weekdays at 6:00 AM UTC", "Paused", "▮"], ["Parity check", "Runs once on Jul 26, 2026 3:06 AM UTC", "Completed", ""]].map(([title, body, status, marks]) => <div key={title} className="min-h-[78px] border border-[#E2DFDB] bg-white p-3 shadow-[0_2px_7px_rgba(73,62,52,0.035)]"><div className="flex items-center justify-between gap-1"><h4 className="truncate text-[10px] font-semibold">{title}</h4><span className="text-[11px] text-[#8D8781]">⋮</span></div><p className="mt-2 truncate text-[8px] text-[#77716B]">{body}</p><div className="mt-3 flex items-center justify-between gap-1 text-[8px] text-[#8B857F]"><span>◌ {status}</span><span className="truncate">{marks}</span></div></div>)}</div><div className="mt-6"><p className="text-[10px] font-medium text-[#77716B]">More ideas</p><div className="mt-2 grid grid-cols-2 gap-x-8 gap-y-4"><div><h4 className="text-[9px] font-semibold">Morning results digest</h4><p className="mt-1 text-[8px] leading-3 text-[#77716B]">Summarize files added or changed in the project&apos;s data and outputs folders overnight; flag anomalies and failed runs.</p></div><div><h4 className="text-[9px] font-semibold">Weekly portfolio review</h4><p className="mt-1 text-[8px] leading-3 text-[#77716B]">Monday review across every program in the workspace: what moved, what stalled, and which decisions are waiting on someone.</p></div><div><h4 className="text-[9px] font-semibold">Weekly validation sweep</h4><p className="mt-1 text-[8px] leading-3 text-[#77716B]">Run validation checks on the current SDTM/ADaM datasets; flag new issues against last week and propose fixes.</p></div><div><h4 className="text-[9px] font-semibold">Competitor watch</h4><p className="mt-1 text-[8px] leading-3 text-[#77716B]">Weekly sweep of named competitors: new trial registrations, press, and publications, with what each means for this program.</p></div></div></div></motion.div> : null}
  </AnimatePresence></div></div></main>;
}
