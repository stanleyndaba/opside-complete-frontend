import type { RecoveryTruthPresentation } from './caseDetailTruthPresentation';

export interface RecoveryProgressLifecycleStep {
  label: string;
  active: boolean;
}

export interface RecoveryProgressPresentationInput {
  truthPresentation: RecoveryTruthPresentation;
  lifecycleSteps: RecoveryProgressLifecycleStep[];
  nextStep?: { title?: string | null; description?: string | null } | null;
  missingRequirements?: string[] | null;
  financialPayoutStatus?: string | null;
  financialReversalState?: string | null;
  accountingStatus?: string | null;
  closureState?: string | null;
  hasTrustedFiling: boolean;
  hasTrustedApproval: boolean;
  hasTrustedPayout: boolean;
  hasSafetyBlock: boolean;
  hasUnassessedSafety: boolean;
  truthUnavailable: boolean;
}

export interface RecoveryProgressResolutionState {
  owner: 'Margin' | 'Seller' | 'Amazon' | 'Accounting' | 'Not established';
  ownerDetail: string;
  sellerAction: string;
  nextAction: string;
}

export interface RecoveryProgressChecklistItem {
  label: string;
  complete: boolean;
  detail: string;
}

export interface RecoveryProgressPresentation {
  resolution: RecoveryProgressResolutionState;
  closureCondition: string;
  remaining: string;
  checklist: RecoveryProgressChecklistItem[];
}

const normalize = (value?: string | null) => String(value || '').trim().toLowerCase();

function deriveResolution(input: RecoveryProgressPresentationInput): RecoveryProgressResolutionState {
  const accountingState = normalize(input.accountingStatus);
  const reversalState = normalize(input.financialReversalState);
  const hasRequirements = Boolean(input.missingRequirements?.length);

  if (input.truthUnavailable) {
    return {
      owner: 'Not established',
      ownerDetail: 'Margin cannot determine the current owner while authoritative case truth is unavailable.',
      sellerAction: 'No seller action has been established from the current record.',
      nextAction: 'Refresh the authoritative case record before assigning an operational action.',
    };
  }

  if (input.hasSafetyBlock || input.hasUnassessedSafety || reversalState === 'review_required' || reversalState === 'reversed' || (accountingState && accountingState !== 'reconciled')) {
    const needsAccounting = input.hasTrustedPayout && accountingState !== 'reconciled';
    return {
      owner: needsAccounting ? 'Accounting' : 'Margin',
      ownerDetail: needsAccounting ? 'Accounting review is required before financial closure can be confirmed.' : 'Margin must resolve the recorded safety or review condition before the case can progress safely.',
      sellerAction: 'No action is required from you unless Margin asks for additional evidence.',
      nextAction: needsAccounting
        ? 'Reconcile the verified payment against the applicable accounting or settlement records and confirm that no offset or reversal remains.'
        : 'Review the recorded safety or reversal condition before treating this recovery as clear to proceed.',
    };
  }

  if (hasRequirements) {
    return {
      owner: 'Seller',
      ownerDetail: 'The current record lists evidence or approval requirements that need to be resolved before the next recovery action.',
      sellerAction: `Action required from you — ${input.missingRequirements?.join(', ')}.`,
      nextAction: 'Provide or confirm the outstanding requirement so Margin can continue the recovery workflow.',
    };
  }

  if (input.hasTrustedFiling && !input.hasTrustedApproval) {
    return {
      owner: 'Amazon',
      ownerDetail: 'Margin has established filing proof and is waiting for Amazon to provide the next outcome.',
      sellerAction: 'No action is required from you right now.',
      nextAction: 'Wait for Amazon’s response and review any evidence request or decision when it arrives.',
    };
  }

  if (input.hasTrustedApproval && !input.hasTrustedPayout) {
    return {
      owner: 'Amazon',
      ownerDetail: 'Amazon approval is established, but Margin has not yet verified the corresponding payment event.',
      sellerAction: 'No action is required from you right now.',
      nextAction: 'Monitor settlement activity and verify the payment against this recovery when it appears.',
    };
  }

  return {
    owner: 'Margin',
    ownerDetail: 'Margin is following the next operational state recorded for this recovery.',
    sellerAction: 'No action is required from you right now.',
    nextAction: input.nextStep?.description || 'Margin has not established a more specific next action from the current record.',
  };
}

function deriveClosureCondition(input: RecoveryProgressPresentationInput) {
  const closureState = normalize(input.closureState);
  const accountingState = normalize(input.accountingStatus);
  const reversalState = normalize(input.financialReversalState);

  if (input.truthUnavailable) {
    return 'Authoritative case truth must be restored before Margin can assess the closure condition.';
  }
  if (input.hasSafetyBlock || input.hasUnassessedSafety) {
    return 'The recorded safety condition must be resolved or assessed before financial closure can be claimed.';
  }
  if (reversalState === 'reversed' || reversalState === 'review_required') {
    return 'The reversal or offset condition must be resolved before financial closure can be claimed.';
  }
  if (input.hasTrustedPayout && accountingState !== 'reconciled') {
    return 'Accounting reconciliation and reversal-safe review must be complete before financial closure can be claimed.';
  }
  if (closureState === 'closed' || closureState === 'financially_closed') {
    return 'Financial closure has been established from the available closure checks.';
  }
  if (input.hasTrustedApproval && !input.hasTrustedPayout) {
    return 'A verified financial payment event must be established before closure review can begin.';
  }
  if (input.hasTrustedFiling && !input.hasTrustedApproval) {
    return 'Amazon must provide a supported outcome before the recovery can progress toward payment and closure.';
  }
  return 'Margin must establish the remaining evidence, action, and outcome conditions before closure can be considered.';
}

export function buildRecoveryProgressPresentation(input: RecoveryProgressPresentationInput): RecoveryProgressPresentation {
  const accountingState = normalize(input.accountingStatus);
  const reversalState = normalize(input.financialReversalState);
  const closureState = normalize(input.closureState);
  const resolution = deriveResolution(input);
  const closureCondition = deriveClosureCondition(input);

  return {
    resolution,
    closureCondition,
    remaining: input.truthUnavailable
      ? 'Authoritative truth refresh'
      : input.hasSafetyBlock || input.hasUnassessedSafety
        ? 'Safety review'
        : reversalState === 'reversed' || reversalState === 'review_required'
          ? 'Reversal or offset review'
          : input.hasTrustedPayout && accountingState !== 'reconciled'
            ? 'Accounting reconciliation'
            : input.hasTrustedPayout
              ? 'Closure review'
              : 'Outcome verification',
    checklist: [
      { label: 'Recovery identified', complete: input.lifecycleSteps[0]?.active === true, detail: 'Margin recorded the recovery condition.' },
      { label: 'Evidence established', complete: input.lifecycleSteps[1]?.active === true, detail: 'Supporting evidence is linked to the recovery record.' },
      { label: 'Filing outcome established', complete: input.hasTrustedFiling, detail: 'A submission reference or supported filing truth is available.' },
      { label: 'Amazon outcome established', complete: input.hasTrustedApproval, detail: 'An approval or supported Amazon outcome is available.' },
      { label: 'Payment verified', complete: input.hasTrustedPayout, detail: 'A matching financial event verifies the payment amount.' },
      { label: 'Accounting reconciled', complete: accountingState === 'reconciled', detail: 'Accounting reconciliation is required before financial closure.' },
      { label: 'Reversal-safe review', complete: !reversalState || ['clear', 'none', 'not_detected'].includes(reversalState), detail: 'No unresolved reversal or offset condition can remain before closure.' },
      { label: 'Financially closed', complete: ['closed', 'financially_closed'].includes(closureState), detail: 'Final closure is a distinct outcome from payment verification.' },
    ],
  };
}
