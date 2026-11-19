import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { MousePointer2 } from "lucide-react";
import EvidenceRequired from "./EvidenceRequired";
import {
  FinancialAnalysisWorkspace,
  FinancialResolutionWorkflow,
  AllRoutines,
  RoutineLibrary,
  RoutineWorkspace,
  ImplementingRoutine,
} from "./Routine";
import {
  QueryStage,
  AuditFindingsStage,
  IssuesFoundStage,
  ProofRequiredStage,
  DocumentOrbitStage,
  PlatformSimulationStage,
  EvidenceAnalysisPanel,
  EvidenceIntakeStage,
  EvidenceRegisterStage,
  EvidenceMatchStage,
  ArtifactAnalysisStage,
  AccuracyLearningStage,
  ReconciledAnomalies,
  RecoveryPositionStage,
  __previewRecords,
} from "./DuplicatePipelinePreview";
import { ReportGenerationStage } from "@/components/report-generation";
import { DemoTestsShell } from "./DemoTests";
import { SlackInterface } from "./SlackInterface";
import CaseDetailDuplicateDemo from "./CaseDetailDuplicateDemo";

const principleStages = [
  "Record intake",
  "Evidence register",
  "Audit findings",
  "Discrepancy register",
  "Evidence required",
  "Evidence analysis",
  "Proof required",
  "Building controls",
  "Generating plan",
  "Analysis workspace",
  "Create routine",
  "Routine plan",
  "All routines",
  "Select Slack handoff",
  "Team handoff",
  "Implementing routine",
  "Platform simulation",
  "Generating plan",
  "Activity queue",
  "Record intake",
  "Source records assembled",
  "Evidence register",
  "Evidence match",
  "Artifact analysis",
  "Resolution workflow",
  "Case build",
  "Approve once",
  "Select Slack handoff",
  "Team handoff",
  "Account query",
  "Amazon correspondence",
  "Reconciled outcome",
  "Recovery positions",
  "Learning from recovery",
] as const;

const demoTestsShellStages = new Set([0, 1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 18, 19, 20, 21, 22, 23, 24, 25, 26, 29, 30, 31, 32]);

const wheelItems = [
  "Settlement variance requiring review",
  "Inbound receiving discrepancy",
  "Returns awaiting financial attribution",
  "Reimbursement case follow-up",
  "FBA fee and surcharge check",
  "Inventory movement reconciliation",
  "Payout ledger attribution",
];

function ActivityWheel() {
  const reduceMotion = useReducedMotion();
  const [active, setActive] = useState(3);
  useEffect(() => {
    if (reduceMotion) return;
    const timer = window.setInterval(() => setActive((value) => (value + 1) % wheelItems.length), 1050);
    return () => window.clearInterval(timer);
  }, [reduceMotion]);
  return <main className="flex min-h-screen items-center justify-center bg-white px-4 py-10 font-google-sans text-[#182026] sm:px-8"><div className="relative h-[430px] w-full max-w-[720px]" aria-label="Recurring Amazon financial activity wheel">{wheelItems.map((item, index) => { const raw = (index - active + wheelItems.length) % wheelItems.length; const slot = raw > 3 ? raw - wheelItems.length : raw; const distance = Math.abs(slot); const center = slot === 0; return <motion.div key={item} initial={false} animate={{ top: `calc(50% + ${slot * 50}px)`, width: `${center ? 100 : distance === 1 ? 86 : distance === 2 ? 72 : 58}%`, opacity: center ? 1 : distance === 1 ? 0.58 : distance === 2 ? 0.32 : 0.16 }} transition={{ duration: reduceMotion ? 0 : 0.82, ease: [0.22, 1, 0.36, 1] }} className={`absolute left-1/2 flex min-h-[56px] -translate-x-1/2 -translate-y-1/2 items-center gap-3 px-5 text-[13px] tracking-tight sm:min-h-[64px] sm:px-8 sm:text-[17px] ${center ? "z-10 bg-white text-[#182026] shadow-[0_8px_22px_rgba(73,62,52,0.06)]" : "bg-[#F2F0EE] text-[#77716B]"}`}><span className="h-3 w-3 shrink-0 rounded-full border border-current" /><span className="truncate">{item}</span></motion.div>; })}</div></main>;
}

function RoutinePlanStage() {
  return <main className="min-h-screen bg-white px-5 py-10 font-google-sans text-[#182026] sm:px-10 sm:py-16"><div className="mx-auto max-w-[980px]"><p className="text-[10px] font-medium uppercase tracking-tight text-[#8B857F]">Generated control plan</p><h1 className="mt-2 text-[24px] font-medium tracking-tight sm:text-[32px]">Settlement Variance Control</h1><p className="mt-2 max-w-[620px] text-[12px] leading-5 text-[#77716B]">The proposed routine defines when Margin runs, what it reads, what it does, and what it produces.</p><div className="mt-10 grid gap-3 sm:grid-cols-2">{[["Schedule", "Every Monday at 09:00 UTC"], ["Sources", "Gmail · Amazon · Outlook · OneDrive · QuickBooks"], ["Instructions", "Reconcile settlement variance and deliver findings with sources attached"], ["Deliver", "Deliver findings with the supporting source records attached"]].map(([title, body]) => <article key={title} className="rounded-[10px] bg-[#F1F2F2] p-5"><p className="text-[10px] font-semibold uppercase tracking-tight text-[#8B857F]">{title}</p><p className="mt-3 text-[13px] leading-5 text-[#36404A]">{body}</p></article>)}</div></div></main>;
}

function GeneratingPlanStage() {
  return <main className="flex min-h-screen items-center justify-center bg-white px-5 font-google-sans text-[#182026]"><div className="text-center"><div className="mx-auto h-5 w-5 rounded-full bg-[radial-gradient(circle_at_32%_28%,#A9E9FF_0%,#78D8F5_28%,#F59ACB_72%,#F277B8_100%)] shadow-[0_0_10px_rgba(143,207,246,0.64),0_0_16px_rgba(242,119,184,0.28)]" /><p className="mt-4 text-[20px] font-medium tracking-tight">Generating Plan</p><p className="mt-1 text-[12px] text-[#77716B]">Organising schedule, sources, instructions, and delivery.</p></div></main>;
}

function CreateRoutineStage({ onComplete }: { onComplete: () => void }) {
  return <main className="flex min-h-screen items-center justify-center bg-white px-5 font-google-sans"><button type="button" onClick={onComplete} className="rounded-[22px] bg-[#111111] px-8 py-4 text-[16px] font-semibold text-white shadow-[0_12px_24px_rgba(17,17,17,0.12)]">+ Create Routine</button></main>;
}

function ApproveOnceStage({ onComplete }: { onComplete: () => void }) {
  return <main className="flex min-h-screen items-center justify-center bg-white px-5 font-google-sans text-[#182026]"><div className="w-full max-w-[620px] rounded-[12px] border border-[#D8E3E8] bg-white p-6 shadow-[0_12px_30px_rgba(24,32,38,0.06)]"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#7B8A97]">Seller approval gate</p><h1 className="mt-2 text-[22px] font-medium tracking-tight">Approve the supported action once.</h1><p className="mt-3 text-[13px] leading-5 text-[#59636B]">The evidence-linked position is bounded, the remaining exceptions are visible, and only the permitted recovery action is ready to move forward.</p><button type="button" onClick={onComplete} className="mt-6 rounded-[8px] bg-[#0B74DE] px-4 py-2.5 text-[12px] font-semibold text-white">Approve once</button></div></main>;
}

function SlackHandoffTransition({ onComplete }: { onComplete: () => void }) {
  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState<"idle" | "moving" | "selected">(reduceMotion ? "selected" : "idle");
  useEffect(() => {
    if (reduceMotion) {
      const timer = window.setTimeout(onComplete, 1200);
      return () => window.clearTimeout(timer);
    }
    const moveTimer = window.setTimeout(() => setPhase("moving"), 600);
    const selectTimer = window.setTimeout(() => setPhase("selected"), 1900);
    const completeTimer = window.setTimeout(onComplete, 3100);
    return () => {
      window.clearTimeout(moveTimer);
      window.clearTimeout(selectTimer);
      window.clearTimeout(completeTimer);
    };
  }, [onComplete, reduceMotion]);

  const platforms = [
    { name: "Gmail", src: "/gmailicon.png", tone: "bg-[#FFF6F4]", position: "left-0" },
    { name: "Amazon", src: "/amazon-logo-transparent-circle.png", tone: "bg-[#FFF9EE]", position: "left-1/3" },
    { name: "Slack", src: "/slack-icon-2019.png", tone: "bg-[#F3F0FF]", position: "left-2/3" },
    { name: "QuickBooks", src: "/quickbooks.png", tone: "bg-[#F0FAF4]", position: "right-0" },
  ];

  return <main className="flex min-h-screen items-center justify-center bg-white px-5 py-12 font-google-sans text-[#182026] sm:px-10">
    <div className="w-full max-w-[860px] text-center">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#7B8A97]">Connected operating context</p>
      <h1 className="mt-3 text-[24px] font-medium tracking-[-0.04em] sm:text-[34px]">Choose where the handoff should happen.</h1>
      <p className="mx-auto mt-3 max-w-[540px] text-[12px] leading-5 tracking-tight text-[#66737F] sm:text-[14px]">Margin has assembled the evidence-backed position. The next step is to route the controlled handoff to the team’s working channel.</p>
      <div className="relative mx-auto mt-14 h-[138px] max-w-[720px] sm:mt-20 sm:h-[164px]" aria-label="Connected systems: Gmail, Amazon, Slack, and QuickBooks">
        {platforms.map((platform) => <motion.div key={platform.name} animate={phase === "selected" && platform.name === "Slack" ? { y: -8, scale: 1.06, borderColor: "#611F69", boxShadow: "0 18px 35px rgba(97,31,105,0.16)" } : { y: 0, scale: 1, borderColor: "#DCE5E8", boxShadow: "0 8px 20px rgba(24,32,38,0.05)" }} transition={{ duration: reduceMotion ? 0 : 0.38 }} className={`absolute top-0 flex h-[112px] w-[23%] min-w-[74px] flex-col items-center justify-center gap-3 rounded-[14px] border bg-white sm:h-[138px] ${platform.position}`}><span className={`flex h-12 w-12 items-center justify-center rounded-[13px] p-2.5 sm:h-16 sm:w-16 sm:p-3.5 ${platform.tone}`}><img src={platform.src} alt="" className="h-full w-full object-contain" /></span><span className="text-[10px] font-semibold tracking-tight text-[#52616A] sm:text-[12px]">{platform.name}</span></motion.div>)}
        <motion.div aria-hidden="true" animate={phase === "idle" ? { left: "8%", top: "126%" } : phase === "moving" ? { left: "72%", top: "100%" } : { left: "72%", top: "48%" }} transition={{ duration: reduceMotion ? 0 : 1.15, ease: [0.22, 1, 0.36, 1] }} className="pointer-events-none absolute z-20 text-[#182026] drop-shadow-[0_5px_6px_rgba(24,32,38,0.2)]"><MousePointer2 className="h-8 w-8 fill-white stroke-[1.8] sm:h-10 sm:w-10" /></motion.div>
      </div>
      <motion.p animate={{ opacity: phase === "selected" ? 1 : 0.65 }} className="mt-8 text-[11px] font-medium tracking-tight text-[#52616A] sm:text-[13px]">{phase === "selected" ? "Slack selected · opening Team Handoff" : "Connected records ready · selecting handoff channel"}</motion.p>
    </div>
  </main>;
}

export default function SandboxDemo() {
  const reduceMotion = useReducedMotion();
  const [stage, setStage] = useState(0);
  const advance = useCallback(() => setStage((current) => Math.min(current + 1, principleStages.length - 1)), []);
  useEffect(() => {
    const staticDurations: Record<number, number> = { 0: 9000, 1: 9000, 2: 12000, 3: 11000, 4: 9000, 5: 12000, 6: 9000, 7: 11000, 8: 7000, 9: 12000, 10: 7000, 11: 9000, 12: 9000, 13: 4200, 14: 10000, 15: 8000, 16: 12000, 17: 7000, 18: 6500, 19: 7000, 20: 9500, 21: 9000, 22: 9000, 23: 14000, 24: 28000, 25: 14000, 26: 9000, 27: 4200, 28: 8500, 29: 15000, 30: 15000, 31: 12000, 32: 12000, 33: 9000 };
    const duration = reduceMotion ? 900 : staticDurations[stage];
    if (!duration) return;
    const timer = window.setTimeout(advance, duration);
    return () => window.clearTimeout(timer);
  }, [advance, reduceMotion, stage]);

  const common = { onComplete: advance };
  let content: ReactNode;
  switch (stage) {
    case 0: content = <EvidenceIntakeStage stage="dropzone" />; break;
    case 1: content = <EvidenceRegisterStage />; break;
    case 2: content = <AuditFindingsStage {...common} />; break;
    case 3: content = <IssuesFoundStage {...common} />; break;
    case 4: content = <EvidenceRequired showSearch={false} showSidebar={false} flat />; break;
    case 5: content = <EvidenceAnalysisPanel {...common} />; break;
    case 6: content = <ProofRequiredStage {...common} />; break;
    case 7: content = <RoutineLibrary reduceMotion={Boolean(reduceMotion)} />; break;
    case 8: content = <GeneratingPlanStage />; break;
    case 9: content = <FinancialAnalysisWorkspace reduceMotion={Boolean(reduceMotion)} />; break;
    case 10: content = <CreateRoutineStage onComplete={advance} />; break;
    case 11: content = <RoutinePlanStage />; break;
    case 12: content = <AllRoutines reduceMotion={Boolean(reduceMotion)} />; break;
    case 13: content = <SlackHandoffTransition onComplete={advance} />; break;
    case 14: content = <SlackInterface embedded />; break;
    case 15: content = <ImplementingRoutine reduceMotion={Boolean(reduceMotion)} />; break;
    case 16: content = <PlatformSimulationStage {...common} />; break;
    case 17: content = <GeneratingPlanStage />; break;
    case 18: content = <ActivityWheel />; break;
    case 19: content = <EvidenceIntakeStage stage="dropzone" />; break;
    case 20: content = <EvidenceIntakeStage stage="documents" />; break;
    case 21: content = <EvidenceRegisterStage />; break;
    case 22: content = <EvidenceMatchStage />; break;
    case 23: content = <ArtifactAnalysisStage {...common} />; break;
    case 24: content = <FinancialResolutionWorkflow />; break;
    case 25: content = <ReportGenerationStage onComplete={advance} />; break;
    case 26: content = <ApproveOnceStage onComplete={advance} />; break;
    case 27: content = <SlackHandoffTransition onComplete={advance} />; break;
    case 28: content = <SlackInterface embedded />; break;
    case 29: content = <QueryStage {...common} />; break;
    case 30: content = <CaseDetailDuplicateDemo />; break;
    case 31: content = <ReconciledAnomalies cards={__previewRecords} />; break;
    case 32: content = <RecoveryPositionStage />; break;
    case 33: content = <AccuracyLearningStage />; break;
  }
  const renderedContent = demoTestsShellStages.has(stage) ? <DemoTestsShell>{content}</DemoTestsShell> : content;
  return <main className="min-h-screen bg-white font-google-sans text-[#182026]"><div className="sticky top-0 z-50 flex items-center justify-between border-b border-[#E8EFF1] bg-white/95 px-4 py-3 backdrop-blur-sm sm:px-8"><span className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#7B8A97]">Margin · Super Demo</span><span className="text-[10px] tabular-nums text-[#8A99A5]">{String(stage + 1).padStart(2, "0")} / {principleStages.length} · {principleStages[stage]}</span></div><AnimatePresence mode="wait"><motion.div key={stage} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0 : 0.3 }}>{renderedContent}</motion.div></AnimatePresence></main>;
}
