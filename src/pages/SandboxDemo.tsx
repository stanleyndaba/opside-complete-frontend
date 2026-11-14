import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
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
  TeamHandoffStage,
  AmazonCorrespondenceStage,
  AccuracyLearningStage,
  ReconciledAnomalies,
  RecoveryPositionStage,
  __previewRecords,
} from "./DuplicatePipelinePreview";
import { ReportGenerationStage } from "@/components/report-generation";

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
  "Team handoff",
  "Account query",
  "Amazon correspondence",
  "Reconciled outcome",
  "Recovery positions",
  "Learning from recovery",
] as const;

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

export default function SandboxDemo() {
  const reduceMotion = useReducedMotion();
  const [stage, setStage] = useState(0);
  const advance = useCallback(() => setStage((current) => Math.min(current + 1, principleStages.length - 1)), []);
  useEffect(() => {
    const staticDurations: Record<number, number> = { 0: 9000, 1: 9000, 2: 12000, 3: 11000, 4: 9000, 5: 12000, 6: 9000, 7: 11000, 8: 7000, 9: 12000, 10: 7000, 11: 9000, 12: 10000, 13: 8000, 14: 12000, 15: 7000, 16: 6500, 17: 7000, 18: 9500, 19: 9000, 20: 9000, 21: 14000, 22: 28000, 23: 14000, 24: 9000, 25: 8500, 26: 15000, 27: 9000, 28: 15000, 29: 12000, 30: 9000 };
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
    case 13: content = <ImplementingRoutine reduceMotion={Boolean(reduceMotion)} />; break;
    case 14: content = <PlatformSimulationStage {...common} />; break;
    case 15: content = <GeneratingPlanStage />; break;
    case 16: content = <ActivityWheel />; break;
    case 17: content = <EvidenceIntakeStage stage="dropzone" />; break;
    case 18: content = <EvidenceIntakeStage stage="documents" />; break;
    case 19: content = <EvidenceRegisterStage />; break;
    case 20: content = <EvidenceMatchStage />; break;
    case 21: content = <ArtifactAnalysisStage {...common} />; break;
    case 22: content = <FinancialResolutionWorkflow />; break;
    case 23: content = <ReportGenerationStage onComplete={advance} />; break;
    case 24: content = <ApproveOnceStage onComplete={advance} />; break;
    case 25: content = <TeamHandoffStage />; break;
    case 26: content = <QueryStage {...common} />; break;
    case 27: content = <AmazonCorrespondenceStage />; break;
    case 28: content = <ReconciledAnomalies cards={__previewRecords} />; break;
    case 29: content = <RecoveryPositionStage />; break;
    case 30: content = <AccuracyLearningStage />; break;
  }
  return <main className="min-h-screen bg-white font-google-sans text-[#182026]"><div className="sticky top-0 z-50 flex items-center justify-between border-b border-[#E8EFF1] bg-white/95 px-4 py-3 backdrop-blur-sm sm:px-8"><span className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#7B8A97]">Margin · Super Demo</span><span className="text-[10px] tabular-nums text-[#8A99A5]">{String(stage + 1).padStart(2, "0")} / {principleStages.length} · {principleStages[stage]}</span></div><AnimatePresence mode="wait"><motion.div key={stage} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0 : 0.3 }}>{content}</motion.div></AnimatePresence></main>;
}
