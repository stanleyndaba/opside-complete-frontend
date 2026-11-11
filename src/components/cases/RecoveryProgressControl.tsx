import { Check } from 'lucide-react';
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

function TimelineMarker({ complete = false, muted = false }: { complete?: boolean; muted?: boolean }) {
  if (complete) {
    return <span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#182026] text-white"><Check className="h-3.5 w-3.5" strokeWidth={3} /></span>;
  }
  return <span className={cn('relative z-10 mt-1 h-5 w-5 shrink-0 rounded-full border-2 bg-white', muted ? 'border-[#C9D1D5]' : 'border-[#8A97A2]')} aria-hidden="true" />;
}

function TimelineNode({ children, complete = false, muted = false, last = false }: { children: React.ReactNode; complete?: boolean; muted?: boolean; last?: boolean }) {
  return <div className="relative flex gap-4 sm:gap-6">
    {!last ? <span className="absolute bottom-0 left-[13px] top-7 w-px bg-[#D8E0E3]" aria-hidden="true" /> : null}
    <TimelineMarker complete={complete} muted={muted} />
    <div className="min-w-0 flex-1 pb-9">{children}</div>
  </div>;
}

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
  const completeMilestoneCount = props.lifecycleSteps.filter((step) => step.active).length;

  return <div className="preview-google-sans w-full bg-white text-[#182026]">
    <div className="pb-8 pt-2 sm:pb-12 sm:pt-4">
      <div className="mb-8 flex items-center gap-3 border-b border-[#E7EBED] pb-5 sm:mb-10 sm:pb-6">
        <span className="flex h-8 w-8 items-center justify-center text-[#66737F]" aria-hidden="true"><span className="relative block h-4 w-5 border-y-2 border-[#66737F] before:absolute before:left-0 before:right-0 before:top-[5px] before:border-t-2 before:border-[#66737F]" /></span>
        <h2 className="text-[18px] font-medium tracking-[-0.02em] text-[#66737F] sm:text-[21px]">Recovery resolution workflow</h2>
      </div>

      <div className="relative pl-0 sm:pl-1">
        <TimelineNode complete>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <h3 className="text-[20px] font-medium tracking-[-0.025em] text-[#182026] sm:text-[25px]">Current recovery state</h3>
            {props.statusFeedUnavailable ? <Badge variant="outline" className="rounded-full border-0 bg-[#F1F3F2] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.08em] text-[#66737F]">Last known record</Badge> : null}
          </div>
          <p className="mt-3 text-[18px] font-medium tracking-[-0.02em] text-[#182026] sm:text-[22px]">{props.truthPresentation.label}</p>
          <p className="mt-3 max-w-3xl text-[14px] leading-7 text-[#66737F] sm:text-[16px] sm:leading-8">{props.truthPresentation.explanation}</p>
          <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[14px] sm:text-[16px]"><span className="font-medium text-[#182026]">Closure condition</span><span className="text-[#9AA7B0]">{progress.closureCondition}</span></div>
        </TimelineNode>

        <TimelineNode complete>
          <p className="text-[20px] font-medium tracking-[-0.025em] text-[#182026] sm:text-[25px]">Resolution control</p>
          <p className="mt-2 text-[16px] font-medium text-[#66737F] sm:text-[19px]">What happens next</p>
          <div className="mt-6 space-y-5 text-[14px] sm:text-[16px]">
            <div><p className="font-medium text-[#182026]">Responsible now</p><p className="mt-1 leading-7 text-[#66737F]">{progress.resolution.owner} <span className="text-[#9AA7B0]">· {progress.resolution.ownerDetail}</span></p></div>
            <div><p className="font-medium text-[#182026]">Seller action</p><p className="mt-1 leading-7 text-[#66737F]">{progress.resolution.sellerAction}</p></div>
            <div><p className="font-medium text-[#182026]">Next action</p><p className="mt-1 leading-7 text-[#66737F]">{progress.resolution.nextAction}</p>{props.nextStep?.title ? <p className="mt-2 text-[12px] font-medium uppercase tracking-[0.08em] text-[#9AA7B0]">Recorded step: {props.nextStep.title}</p> : null}</div>
          </div>
        </TimelineNode>

        <TimelineNode complete>
          <p className="text-[20px] font-medium tracking-[-0.025em] text-[#182026] sm:text-[25px]">Resolution path</p>
          <p className="mt-2 text-[16px] font-medium text-[#66737F] sm:text-[19px]">What remains before closure</p>
          <div className="mt-6 grid gap-x-8 gap-y-5 text-[14px] sm:grid-cols-2 sm:text-[16px]">
            <div><p className="font-medium text-[#182026]">Current</p><p className="mt-1 leading-7 text-[#66737F]">{props.truthPresentation.label}</p></div>
            <div><p className="font-medium text-[#182026]">Remaining</p><p className="mt-1 leading-7 text-[#66737F]">{progress.remaining}</p></div>
            <div><p className="font-medium text-[#182026]">Required before closure</p><p className="mt-1 leading-7 text-[#66737F]">{progress.closureCondition}</p></div>
            <div><p className="font-medium text-[#182026]">Final</p><p className="mt-1 leading-7 text-[#9AA7B0]">Financially closed</p></div>
          </div>
        </TimelineNode>

        <TimelineNode complete={completeMilestoneCount > 0}>
          <p className="text-[20px] font-medium tracking-[-0.025em] text-[#182026] sm:text-[25px]">Recovery progress</p>
          <p className="mt-2 text-[16px] font-medium text-[#66737F] sm:text-[19px]">Certified operational milestones</p>
          <div className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2">
            {props.lifecycleSteps.map((step) => <div key={step.label} className="flex items-start gap-3"><span className={cn('mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full', step.active ? 'bg-[#182026]' : 'bg-[#C9D1D5')} /><div><p className={cn('text-[14px] font-medium sm:text-[16px]', step.active ? 'text-[#182026]' : 'text-[#9AA7B0]')}>{step.label}</p><p className="mt-1 text-[12px] leading-5 text-[#66737F]">{step.label === 'Detected' ? 'Recovery identified — Margin recorded the recovery condition.' : step.label === 'Evidence' ? 'Evidence established — Supporting evidence is linked to the recovery record.' : step.label === 'Filed' ? 'Filing outcome established — A submission reference or supported filing truth is available.' : step.label === 'Approved' ? 'Amazon outcome established — An approval or supported Amazon outcome is available.' : 'Payment verified — A matching financial event verifies the payment amount.'}</p></div></div>)}
          </div>
          <div className="mt-7 space-y-3 border-l border-[#E7EBED] pl-5 text-[13px] leading-6 text-[#66737F] sm:text-[15px]"><p>Accounting reconciled <span className="text-[#9AA7B0]">· Accounting reconciliation is required before financial closure.</span></p><p>Reversal-safe review <span className="text-[#9AA7B0]">· No unresolved reversal or offset condition can remain before closure.</span></p><p>Financially closed <span className="text-[#9AA7B0]">· Final closure is a distinct outcome from payment verification.</span></p></div>
          <p className="mt-7 max-w-3xl text-[12px] leading-6 text-[#9AA7B0] sm:text-[14px]">Payment verification, accounting reconciliation, reversal review, and financial closure are separate conditions. A completed milestone does not by itself establish the next condition.</p>
        </TimelineNode>

        <TimelineNode last muted>
          <p className="text-[20px] font-medium tracking-[-0.025em] text-[#182026] sm:text-[25px]">Original requested recovery</p>
          <p className="mt-2 text-[16px] font-medium text-[#66737F] sm:text-[19px]">Requested amount</p>
          <p className="mt-3 max-w-2xl text-[14px] leading-7 text-[#66737F] sm:text-[16px] sm:leading-8">This is the amount originally requested. It is not, by itself, a verified payment or final financial outcome.</p>
          <p className="mt-5 text-[25px] font-medium tracking-[-0.03em] text-[#182026] sm:text-[32px]">$1,482.20</p>
        </TimelineNode>
      </div>
    </div>
  </div>;
}

export default RecoveryProgressControl;
