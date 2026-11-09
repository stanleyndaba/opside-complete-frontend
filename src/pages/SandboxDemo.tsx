import { useEffect, useState, type ReactNode } from "react";
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
  EvidenceIntakeStage,
  EvidenceRegisterStage,
  EvidenceMatchStage,
  ArtifactAnalysisStage,
  TeamHandoffStage,
  AmazonCorrespondenceStage,
  AccuracyLearningStage,
  ReconciledAnomalies,
  RecoveryPositionStage,
  RecoveryPipelineSequence,
} from "./DuplicatePipelinePreview";
import { ReportGenerationStage } from "@/components/report-generation";

const principleStages = [
  "The account enters Margin",
  "Activity requiring attention",
  "Source populations and evidence context",
  "The Recovery Audit",
  "The discrepancy register",
  "The proof gate",
  "Connected systems",
  "Supporting record intake",
  "Evidence Register",
  "Evidence matching",
  "Artifact analysis",
  "Financial position",
  "Financial determination and recovery economics",
  "The routine decision",
  "Routine library",
  "Generate the routine plan",
  "Inspect the routine plan",
  "Saved routine",
  "Approve and implement",
  "Analysis Workspace",
  "Resolution workflow",
  "Recovery case build",
  "Seller approval queue",
  "Evidence-linked approval queue",
  "Team handoff",
  "Amazon correspondence",
  "Claims and filing progression",
  "Actual outcome reconciliation",
  "Recovery Position",
  "Learning from recovery",
  "Final seller view",
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

function FinalSellerView() {
  return <main className="min-h-screen bg-white px-5 py-12 font-google-sans text-[#182026] sm:px-10 sm:py-20"><div className="mx-auto max-w-[980px]"><p className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#7B8A97]">Margin / final seller view</p><h1 className="mt-3 text-[26px] font-normal tracking-tight sm:text-[38px]">The account can now be seen as a financial position.</h1><p className="mt-4 max-w-[720px] text-[13px] leading-6 text-[#59636B]">What was reviewed, what was supported, what was approved, what was recovered, what remains open, and what still requires action are connected in one operating record.</p><div className="mt-10 grid gap-3 sm:grid-cols-3">{[["Reviewed", "$184,600", "Account activity examined"], ["Recovered", "$93,600", "Matched to settlement and ledger"], ["Open", "$58,200", "Owned for further resolution"], ["Not substantiated", "$32,800", "Outside the claim position"], ["Controls", "Configured", "Recurring work can continue"], ["Close state", "Visible", "Nothing is hidden in the queue"]].map(([label, value, detail]) => <article key={label} className="border-t border-[#DCE3E7] pt-4"><p className="text-[10px] uppercase tracking-tight text-[#8A99A5]">{label}</p><p className="mt-2 text-[20px] font-medium tracking-tight">{value}</p><p className="mt-1 text-[11px] leading-4 text-[#66737F]">{detail}</p></article>)}</div></div></main>;
}

export default function SandboxDemo() {
  const reduceMotion = useReducedMotion();
  const [stage, setStage] = useState(0);
  const advance = () => setStage((current) => Math.min(current + 1, principleStages.length - 1));
  useEffect(() => {
    const staticDurations: Record<number, number> = { 1: 9000, 2: 12000, 6: 12000, 7: 7000, 8: 10500, 9: 9000, 10: 9000, 11: 26000, 12: 12000, 13: 6500, 14: 11000, 15: 8000, 16: 7000, 17: 10000, 18: 7000, 19: 7500, 20: 28000, 21: 14000, 22: 9000, 23: 16000, 24: 13000, 25: 8500, 26: 15000, 27: 12000, 28: 9000, 29: 14000, 30: 9000 };
    const duration = reduceMotion ? 900 : staticDurations[stage];
    if (!duration) return;
    const timer = window.setTimeout(advance, duration);
    return () => window.clearTimeout(timer);
  }, [advance, reduceMotion, stage]);

  const common = { onComplete: advance };
  let content: ReactNode;
  switch (stage) {
    case 0: content = <QueryStage {...common} />; break;
    case 1: content = <ActivityWheel />; break;
    case 2: content = <EvidenceRequired showSearch={false} showSidebar={false} flat />; break;
    case 3: content = <AuditFindingsStage {...common} />; break;
    case 4: content = <IssuesFoundStage {...common} />; break;
    case 5: content = <ProofRequiredStage {...common} />; break;
    case 6: content = <PlatformSimulationStage {...common} />; break;
    case 7: content = <EvidenceIntakeStage stage="documents" />; break;
    case 8: content = <EvidenceRegisterStage />; break;
    case 9: content = <EvidenceMatchStage />; break;
    case 10: content = <ArtifactAnalysisStage {...common} />; break;
    case 11: content = <FinancialAnalysisWorkspace reduceMotion={Boolean(reduceMotion)} />; break;
    case 12: content = <FinancialAnalysisWorkspace reduceMotion={Boolean(reduceMotion)} />; break;
    case 13: content = <ActivityWheel />; break;
    case 14: content = <RoutineLibrary reduceMotion={Boolean(reduceMotion)} />; break;
    case 15: content = <RoutinePlanStage />; break;
    case 16: content = <RoutinePlanStage />; break;
    case 17: content = <RoutineWorkspace />; break;
    case 18: content = <ImplementingRoutine reduceMotion={Boolean(reduceMotion)} />; break;
    case 19: content = <FinancialAnalysisWorkspace reduceMotion={Boolean(reduceMotion)} />; break;
    case 20: content = <FinancialResolutionWorkflow />; break;
    case 21: content = <ReportGenerationStage onComplete={advance} />; break;
    case 22: content = <RecoveryPipelineSequence workspaceMode />; break;
    case 23: content = <RecoveryPipelineSequence workspaceMode />; break;
    case 24: content = <TeamHandoffStage />; break;
    case 25: content = <AmazonCorrespondenceStage />; break;
    case 26: content = <RecoveryPipelineSequence workspaceMode />; break;
    case 27: content = <ReconciledAnomalies cards={[]} />; break;
    case 28: content = <RecoveryPositionStage />; break;
    case 29: content = <AccuracyLearningStage />; break;
    default: content = <FinalSellerView />;
  }
  return <main className="min-h-screen bg-white font-google-sans text-[#182026]"><div className="sticky top-0 z-50 flex items-center justify-between border-b border-[#E8EFF1] bg-white/95 px-4 py-3 backdrop-blur-sm sm:px-8"><span className="text-[10px] font-medium uppercase tracking-[0.14em] text-[#7B8A97]">Margin · Principal Demo</span><span className="text-[10px] tabular-nums text-[#8A99A5]">{String(stage + 1).padStart(2, "0")} / {principleStages.length} · {principleStages[stage]}</span></div><AnimatePresence mode="wait"><motion.div key={stage} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduceMotion ? 0 : 0.3 }}>{content}</motion.div></AnimatePresence></main>;
}
