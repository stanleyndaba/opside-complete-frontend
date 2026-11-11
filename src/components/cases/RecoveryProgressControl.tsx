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
    return <span className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#182026] text-white"><Check className="h-3 w-3" strokeWidth={3} /></span>;
  }
  return <span className={cn('relative z-10 mt-0.5 h-4 w-4 shrink-0 rounded-full border-2 bg-white', muted ? 'border-[#C9D1D5]' : 'border-[#8A97A2]')} aria-hidden="true" />;
}

function TimelineNode({ children, complete = false, muted = false, last = false }: { children: React.ReactNode; complete?: boolean; muted?: boolean; last?: boolean }) {
  return <div className="relative flex gap-3 sm:gap-4">
    {!last ? <span className="absolute bottom-0 left-[11px] top-6 w-px bg-[#D8E0E3]" aria-hidden="true" /> : null}
    <TimelineMarker complete={complete} muted={muted} />
    <div className="min-w-0 flex-1 pb-5">{children}</div>
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
    <div className="pb-4 pt-0 sm:pb-6 sm:pt-2">
      <div className="mb-5 flex items-center gap-2 border-b border-[#E7EBED] pb-3 sm:mb-6 sm:pb-4">
        <span className="flex h-6 w-6 items-center justify-center text-[#66737F]" aria-hidden="true"><span className="relative block h-3 w-4 border-y-2 border-[#66737F] before:absolute before:left-0 before:right-0 before:top-[5px] before:border-t-2 before:border-[#66737F]" /></span>
        <h2 className="text-[14px] font-medium tracking-[-0.02em] text-[#66737F] sm:text-[16px]">Recovery resolution workflow</h2>
      </div>

      <div className="relative pl-0 sm:pl-1">
        <TimelineNode complete>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <h3 className="text-[15px] font-medium tracking-[-0.025em] text-[#182026] sm:text-[18px]">Current recovery state</h3>
            {props.statusFeedUnavailable ? <Badge variant="outline" className="rounded-full border-0 bg-[#F1F3F2] px-2.5 py-1 text-[10px] font-medium uppercase tracking-[0.08em] text-[#66737F]">Last known record</Badge> : null}
          </div>
          <p className="mt-1.5 text-[14px] font-medium tracking-[-0.02em] text-[#182026] sm:text-[16px]">{props.truthPresentation.label}</p>
          <p className="mt-1.5 max-w-3xl text-[12px] leading-5 text-[#66737F] sm:text-[13px] sm:leading-6">{props.truthPresentation.explanation}</p>
          <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[12px] sm:text-[13px]"><span className="font-medium text-[#182026]">Closure condition</span><span className="text-[#9AA7B0]">{progress.closureCondition}</span></div>
        </TimelineNode>

        <TimelineNode complete>
          <p className="text-[15px] font-medium tracking-[-0.025em] text-[#182026] sm:text-[18px]">Resolution control</p>
          <p className="mt-0.5 text-[12px] font-medium text-[#66737F] sm:text-[14px]">What happens next</p>
          <div className="mt-3 space-y-3 text-[12px] sm:text-[13px]">
            <div><p className="font-medium text-[#182026]">Responsible now</p><p className="mt-1 leading-5 text-[#66737F]">{progress.resolution.owner} <span className="text-[#9AA7B0]">· {progress.resolution.ownerDetail}</span></p></div>
            <div><p className="font-medium text-[#182026]">Seller action</p><p className="mt-1 leading-5 text-[#66737F]">{progress.resolution.sellerAction}</p></div>
            <div><p className="font-medium text-[#182026]">Next action</p><p className="mt-1 leading-5 text-[#66737F]">{progress.resolution.nextAction}</p>{props.nextStep?.title ? <p className="mt-2 text-[10px] font-medium uppercase tracking-[0.08em] text-[#9AA7B0]">Recorded step: {props.nextStep.title}</p> : null}</div>
          </div>
        </TimelineNode>

        <TimelineNode complete>
          <p className="text-[15px] font-medium tracking-[-0.025em] text-[#182026] sm:text-[18px]">Resolution path</p>
          <p className="mt-0.5 text-[12px] font-medium text-[#66737F] sm:text-[14px]">What remains before closure</p>
          <div className="mt-3 grid gap-x-5 gap-y-3 text-[12px] sm:grid-cols-2 sm:text-[13px]">
            <div><p className="font-medium text-[#182026]">Current</p><p className="mt-1 leading-5 text-[#66737F]">{props.truthPresentation.label}</p></div>
            <div><p className="font-medium text-[#182026]">Remaining</p><p className="mt-1 leading-5 text-[#66737F]">{progress.remaining}</p></div>
            <div><p className="font-medium text-[#182026]">Required before closure</p><p className="mt-1 leading-5 text-[#66737F]">{progress.closureCondition}</p></div>
            <div><p className="font-medium text-[#182026]">Final</p><p className="mt-1 leading-7 text-[#9AA7B0]">Financially closed</p></div>
          </div>
        </TimelineNode>

        <TimelineNode complete={completeMilestoneCount > 0}>
          <p className="text-[15px] font-medium tracking-[-0.025em] text-[#182026] sm:text-[18px]">Recovery progress</p>
          <p className="mt-0.5 text-[12px] font-medium text-[#66737F] sm:text-[14px]">Certified operational milestones</p>
          <div className="mt-3 grid gap-x-5 gap-y-3 sm:grid-cols-2">
            {props.lifecycleSteps.map((step) => <div key={step.label} className="flex items-start gap-3">{['Detected', 'Evidence', 'Filed', 'Approved'].includes(step.label) && step.active ? <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-[#0B74DE] text-white"><Check className="h-2.5 w-2.5" strokeWidth={3} /></span> : <span className={cn('mt-1 h-2 w-2 shrink-0 rounded-full', step.active ? 'bg-[#182026]' : 'bg-[#C9D1D5')} /> }<div><p className={cn('text-[12px] font-medium sm:text-[13px]', step.active ? 'text-[#182026]' : 'text-[#9AA7B0]')}>{step.label}</p><p className="mt-0.5 text-[10px] leading-4 text-[#66737F]">{step.label === 'Detected' ? 'Recovery identified — Margin recorded the recovery condition.' : step.label === 'Evidence' ? 'Evidence established — Supporting evidence is linked to the recovery record.' : step.label === 'Filed' ? 'Filing outcome established — A submission reference or supported filing truth is available.' : step.label === 'Approved' ? 'Amazon outcome established — An approval or supported Amazon outcome is available.' : 'Payment verified — A matching financial event verifies the payment amount.'}</p></div></div>)}
          </div>
          <div className="mt-4 space-y-1.5 border-l border-[#E7EBED] pl-3 text-[11px] leading-4 text-[#66737F] sm:text-[13px]"><p>Accounting reconciled <span className="text-[#9AA7B0]">· Accounting reconciliation is required before financial closure.</span></p><p>Reversal-safe review <span className="text-[#9AA7B0]">· No unresolved reversal or offset condition can remain before closure.</span></p><p>Financially closed <span className="text-[#9AA7B0]">· Final closure is a distinct outcome from payment verification.</span></p></div>
          <p className="mt-4 max-w-3xl text-[10px] leading-4 text-[#9AA7B0] sm:text-[14px]">Payment verification, accounting reconciliation, reversal review, and financial closure are separate conditions. A completed milestone does not by itself establish the next condition.</p>
        </TimelineNode>

        <TimelineNode last muted>
          <p className="text-[15px] font-medium tracking-[-0.025em] text-[#182026] sm:text-[18px]">Original requested recovery</p>
          <p className="mt-0.5 text-[12px] font-medium text-[#66737F] sm:text-[14px]">Requested amount</p>
          <p className="mt-2 max-w-2xl text-[13px] leading-5 text-[#66737F] sm:text-[13px] sm:leading-6">This is the amount originally requested. It is not, by itself, a verified payment or final financial outcome.</p>
          <p className="mt-3 text-[18px] font-medium tracking-[-0.03em] text-[#182026] sm:text-[24px]">$1,482.20</p>
        </TimelineNode>
      </div>
    </div>
  </div>;
}

export default RecoveryProgressControl;
