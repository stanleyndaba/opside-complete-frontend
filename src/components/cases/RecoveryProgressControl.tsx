import { CheckCircle, Clock3, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CaseTruthTone, RecoveryTruthPresentation } from '@/lib/caseDetailTruthPresentation';
import {
  buildRecoveryProgressPresentation,
  type RecoveryProgressLifecycleStep,
} from '@/lib/caseDetailRecoveryProgressPresentation';

export interface RecoveryProgressControlProps {
  truthPresentation: RecoveryTruthPresentation;
  lifecycleSteps: RecoveryProgressLifecycleStep[];
  nextStep?: { title?: string | null; description?: string | null } | null;
  missingRequirements?: string[] | null;
  proofStatus?: string | null;
  financialPayoutStatus?: string | null;
  financialReversalState?: string | null;
  accountingStatus?: string | null;
  accountingLimitation?: string | null;
  closureState?: string | null;
  closureReason?: string | null;
  hasTrustedFiling: boolean;
  hasTrustedApproval: boolean;
  hasTrustedPayout: boolean;
  hasSafetyBlock: boolean;
  hasUnassessedSafety: boolean;
  truthUnavailable: boolean;
  statusFeedUnavailable: boolean;
}

type Tone = 'neutral' | 'attention' | 'warning' | 'danger' | 'success';

const toneClasses: Record<Tone, string> = {
  neutral: 'border-[#DCE8EE] bg-[#F7FAFC] text-[#182026]',
  attention: 'border-blue-200 bg-blue-50 text-blue-950',
  warning: 'border-amber-200 bg-amber-50 text-amber-950',
  danger: 'border-red-200 bg-red-50 text-red-950',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-950',
};

const toneFromTruth = (tone: CaseTruthTone): Tone => tone;

export function RecoveryProgressControl(props: RecoveryProgressControlProps) {
  const progress = buildRecoveryProgressPresentation({
    truthPresentation: props.truthPresentation,
    lifecycleSteps: props.lifecycleSteps,
    nextStep: props.nextStep,
    missingRequirements: props.missingRequirements,
    financialPayoutStatus: props.financialPayoutStatus,
    financialReversalState: props.financialReversalState,
    accountingStatus: props.accountingStatus,
    closureState: props.closureState,
    hasTrustedFiling: props.hasTrustedFiling,
    hasTrustedApproval: props.hasTrustedApproval,
    hasTrustedPayout: props.hasTrustedPayout,
    hasSafetyBlock: props.hasSafetyBlock,
    hasUnassessedSafety: props.hasUnassessedSafety,
    truthUnavailable: props.truthUnavailable,
  });

  return (
    <div className="space-y-4">
      <section className={cn('rounded-[10px] border p-4 shadow-[0_1px_2px_rgba(24,32,38,0.03)] sm:p-5', toneClasses[toneFromTruth(props.truthPresentation.tone)])}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-current bg-white/70 text-[10px] font-semibold uppercase tracking-tight">Current recovery state</Badge>
              {props.statusFeedUnavailable ? <Badge variant="outline" className="border-current bg-white/70 text-[10px] font-semibold uppercase tracking-tight">Last known record</Badge> : null}
            </div>
            <h2 className="mt-3 font-lora text-[24px] font-normal tracking-tight">{props.truthPresentation.label}</h2>
            <p className="mt-2 text-[13px] leading-6">{props.truthPresentation.explanation}</p>
          </div>
          <div className="max-w-xs border border-current/15 bg-white/60 p-3 text-[11px] leading-5">
            <p className="font-semibold uppercase tracking-tight">Closure condition</p>
            <p className="mt-1 opacity-85">{progress.closureCondition}</p>
          </div>
        </div>
      </section>

      <section className="rounded-[10px] border border-[#DCE8EE] bg-white p-4 shadow-[0_1px_2px_rgba(24,32,38,0.03)] sm:p-5">
        <div className="mb-4 border-b border-[#E7EEF2] pb-3">
          <p className="text-[11px] font-medium tracking-tight text-[#66737F]">Resolution control</p>
          <h3 className="mt-0.5 font-lora text-[18px] font-normal tracking-tight text-[#182026]">What happens next</h3>
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          <div className="border border-[#DCE8EE] bg-[#F7FAFC] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-tight text-[#66737F]">Responsible now</p>
            <p className="mt-2 text-[13px] font-semibold tracking-tight text-[#182026]">{progress.resolution.owner}</p>
            <p className="mt-1 text-[11px] leading-5 text-[#66737F]">{progress.resolution.ownerDetail}</p>
          </div>
          <div className="border border-[#DCE8EE] bg-white p-3">
            <p className="text-[10px] font-semibold uppercase tracking-tight text-[#66737F]">Seller action</p>
            <p className="mt-2 text-[13px] font-semibold tracking-tight text-[#182026]">{progress.resolution.sellerAction}</p>
          </div>
          <div className="border border-[#DCE8EE] bg-white p-3">
            <p className="text-[10px] font-semibold uppercase tracking-tight text-[#66737F]">Next action</p>
            <p className="mt-2 text-[13px] font-semibold leading-5 tracking-tight text-[#182026]">{progress.resolution.nextAction}</p>
            {props.nextStep?.title ? <p className="mt-2 text-[10px] font-medium uppercase tracking-tight text-[#66737F]">Recorded step: {props.nextStep.title}</p> : null}
          </div>
        </div>
      </section>

      <section className="rounded-[10px] border border-[#DCE8EE] bg-white p-4 shadow-[0_1px_2px_rgba(24,32,38,0.03)] sm:p-5">
        <div className="mb-4 border-b border-[#E7EEF2] pb-3">
          <p className="text-[11px] font-medium tracking-tight text-[#66737F]">Resolution path</p>
          <h3 className="mt-0.5 font-lora text-[18px] font-normal tracking-tight text-[#182026]">What remains before closure</h3>
        </div>
        <div className="grid gap-3 lg:grid-cols-4">
          <div className="border border-[#DCE8EE] bg-[#F7FAFC] p-3"><p className="text-[10px] font-semibold uppercase tracking-tight text-[#66737F]">Current</p><p className="mt-2 text-[13px] font-semibold text-[#182026]">{props.truthPresentation.label}</p></div>
          <div className="border border-[#DCE8EE] bg-white p-3"><p className="text-[10px] font-semibold uppercase tracking-tight text-[#66737F]">Remaining</p><p className="mt-2 text-[13px] font-semibold text-[#182026]">{progress.remaining}</p></div>
          <div className="border border-[#DCE8EE] bg-white p-3"><p className="text-[10px] font-semibold uppercase tracking-tight text-[#66737F]">Required before closure</p><p className="mt-2 text-[13px] font-semibold leading-5 text-[#182026]">{progress.closureCondition}</p></div>
          <div className="border border-[#DCE8EE] bg-white p-3"><p className="text-[10px] font-semibold uppercase tracking-tight text-[#66737F]">Final</p><p className="mt-2 text-[13px] font-semibold text-[#182026]">Financially closed</p></div>
        </div>
      </section>

      <section className="rounded-[10px] border border-[#DCE8EE] bg-white p-4 shadow-[0_1px_2px_rgba(24,32,38,0.03)] sm:p-5">
        <div className="mb-5 border-b border-[#E7EEF2] pb-3">
          <p className="text-[11px] font-medium tracking-tight text-[#66737F]">Recovery progress</p>
          <h3 className="mt-0.5 font-lora text-[18px] font-normal tracking-tight text-[#182026]">Certified operational milestones</h3>
        </div>
        <div className="relative px-2 pt-2">
          <div className="absolute left-6 right-6 top-[26px] h-px bg-[#D8E3E8]" />
          <div className="relative z-10 grid grid-cols-5 gap-2">
            {props.lifecycleSteps.map((step, index) => (
              <div key={step.label} className="flex min-w-0 flex-col items-center gap-2 text-center">
                <div className={cn('flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-semibold', step.active ? 'border-[#66737F] bg-[#F1F3F4] text-[#182026]' : 'border-[#DCE8EE] bg-white text-[#8A97A2]')}>{step.active ? <CheckCircle className="h-3.5 w-3.5" /> : index + 1}</div>
                <span className={cn('text-[10px] font-medium leading-4 tracking-tight', step.active ? 'text-[#182026]' : 'text-[#66737F]')}>{step.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {progress.checklist.map((step) => (
            <div key={step.label} className="flex gap-2 border border-[#E7EEF2] bg-[#F8FAFB] p-2.5">
              {step.complete ? <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-700" /> : <Clock3 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#8A97A2]" />}
              <div><p className="text-[11px] font-semibold text-[#182026]">{step.label}</p><p className="mt-0.5 text-[10px] leading-4 text-[#66737F]">{step.detail}</p></div>
            </div>
          ))}
        </div>
        <div className="mt-4 flex gap-3 border border-[#DCE8EE] bg-[#F7FAFC] p-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#66737F]" />
          <p className="text-[11px] leading-5 text-[#66737F]">Payment verification, accounting reconciliation, reversal review, and financial closure are separate conditions. A completed milestone does not by itself establish the next condition.</p>
        </div>
      </section>
    </div>
  );
}

export default RecoveryProgressControl;
