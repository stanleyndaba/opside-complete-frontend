export type CaseTruthCategory =
  | 'source'
  | 'normalized'
  | 'relationship'
  | 'derived'
  | 'finding'
  | 'sufficiency'
  | 'outcome'
  | 'generated'
  | 'reconstructed';

export type CaseTruthTone = 'neutral' | 'attention' | 'warning' | 'danger' | 'success';

export interface CaseTruthCondition {
  label: string;
  detail: string;
  category: CaseTruthCategory;
  tone: CaseTruthTone;
}

export interface RecoveryTruthPresentationInput {
  truthUnavailable?: boolean;
  hasTrustedFiling?: boolean;
  hasTrustedApproval?: boolean;
  hasTrustedPayout?: boolean;
  filingStatus?: string | null;
  filingTruthLine?: string | null;
  claimReadiness?: string | null;
  financialPayoutStatus?: string | null;
  financialReversalState?: string | null;
  financialTruthLimitation?: string | null;
  verifiedPaidAmount?: number | null;
  outstandingAmount?: number | null;
  varianceAmount?: number | null;
  accountingStatus?: string | null;
  accountingLimitation?: string | null;
  closureState?: string | null;
  closureReason?: string | null;
  hasSafetyBlock?: boolean;
  hasUnassessedSafety?: boolean;
  statusFeedUnavailable?: boolean;
}

export interface RecoveryTruthPresentation {
  label: string;
  explanation: string;
  tone: CaseTruthTone;
  category: 'outcome';
  conditions: CaseTruthCondition[];
  prohibitedImplication: string;
}

const normalize = (value?: string | null) => String(value || '').trim().toLowerCase();

const titleCase = (value?: string | null) => {
  const normalized = String(value || '').trim();
  if (!normalized) return 'Not available';
  return normalized.replace(/[_-]+/g, ' ');
};

const normalizeAccountingLimitation = (value?: string | null) => {
  const suppliedLimitation = String(value || '').trim();
  const looksLikeRuntimeFailure = /(?:is not a function|typeerror|referenceerror|cannot read|undefined)/i.test(suppliedLimitation);
  return looksLikeRuntimeFailure ? null : (suppliedLimitation || null);
};

export function buildRecoveryTruthPresentation(input: RecoveryTruthPresentationInput): RecoveryTruthPresentation {
  const accountingState = normalize(input.accountingStatus);
  const closureState = normalize(input.closureState);
  const reversalState = normalize(input.financialReversalState);
  const paymentState = normalize(input.financialPayoutStatus);
  const readiness = normalize(input.claimReadiness);
  const safeAccountingLimitation = normalizeAccountingLimitation(input.accountingLimitation);
  const conditions: CaseTruthCondition[] = [];

  if (input.hasTrustedPayout && typeof input.verifiedPaidAmount === 'number') {
    conditions.push({
      label: 'Payment evidence',
      detail: 'A linked financial event verifies the payment amount for this recovery.',
      category: 'outcome',
      tone: 'success',
    });
  } else if (paymentState) {
    conditions.push({
      label: 'Payment status',
      detail: `Current recorded payment state: ${titleCase(paymentState)}. Margin has not established a verified payment conclusion.`,
      category: 'outcome',
      tone: 'attention',
    });
  }

  if (reversalState === 'reversed') {
    conditions.push({
      label: 'Reversal',
      detail: 'A reimbursement reversal is established. Margin cannot treat this recovery as closed.',
      category: 'outcome',
      tone: 'danger',
    });
  } else if (reversalState === 'review_required') {
    conditions.push({
      label: 'Reversal review',
      detail: 'A reversal-equivalent financial change needs review before final closure.',
      category: 'outcome',
      tone: 'warning',
    });
  }

  if (accountingState === 'reconciled') {
    conditions.push({
      label: 'Accounting',
      detail: 'An accounting reconciliation result is available for this recovery.',
      category: 'outcome',
      tone: 'success',
    });
  } else if (safeAccountingLimitation || accountingState) {
    conditions.push({
      label: 'Accounting',
      detail: safeAccountingLimitation || `Accounting reconciliation is ${titleCase(accountingState)}.`,
      category: 'outcome',
      tone: 'attention',
    });
  }

  if (input.hasSafetyBlock) {
    conditions.push({
      label: 'Safety',
      detail: 'A duplicate, prior-reimbursement, or inventory-adjustment safety signal prevents Margin from treating this as clear to proceed.',
      category: 'sufficiency',
      tone: 'warning',
    });
  } else if (input.hasUnassessedSafety) {
    conditions.push({
      label: 'Safeguards',
      detail: 'One or more duplicate-protection checks have not been assessed. This is not the same as a clear safety result.',
      category: 'sufficiency',
      tone: 'attention',
    });
  }

  if (input.statusFeedUnavailable && !input.truthUnavailable) {
    conditions.push({
      label: 'Freshness',
      detail: 'Live case updates are unavailable. Margin is showing the last known record and will retry the refresh.',
      category: 'reconstructed',
      tone: 'attention',
    });
  }

  if (input.hasTrustedFiling) {
    conditions.push({
      label: 'Filing proof',
      detail: input.filingTruthLine || 'Submission proof is linked to this recovery record.',
      category: 'outcome',
      tone: 'neutral',
    });
  } else if (input.filingTruthLine) {
    conditions.push({
      label: 'Filing state',
      detail: input.filingTruthLine,
      category: 'sufficiency',
      tone: 'neutral',
    });
  }

  if (input.truthUnavailable) {
    return {
      label: 'Case truth unavailable',
      explanation: 'Margin cannot establish a current recovery conclusion from this record while the authoritative case truth is unavailable.',
      tone: 'warning',
      category: 'outcome',
      conditions,
      prohibitedImplication: 'Do not imply a recovery amount, filing state, payment state, or closure state.',
    };
  }

  if (reversalState === 'reversed') {
    return {
      label: 'Open — reversal detected',
      explanation: 'A reversal affects this recovery. Margin is reconciling the financial change before treating any amount as final.',
      tone: 'danger',
      category: 'outcome',
      conditions,
      prohibitedImplication: 'Do not call this recovery paid, settled, reconciled, or closed.',
    };
  }

  const accountingNeedsReview = Boolean(safeAccountingLimitation) || Boolean(accountingState && accountingState !== 'reconciled');
  const needsReview = input.hasSafetyBlock || input.hasUnassessedSafety || reversalState === 'review_required' || accountingNeedsReview;

  if (needsReview) {
    return {
      label: 'Open — review required',
      explanation: input.hasTrustedPayout
        ? 'Payment evidence is verified, but this recovery is not financially closed because accounting, reversal, or safeguard conditions still require review.'
        : 'Margin cannot treat this recovery as clear to proceed or closed because accounting, reversal, or safeguard conditions still require review.',
      tone: 'warning',
      category: 'outcome',
      conditions,
      prohibitedImplication: 'Do not call this recovery paid out, reconciled, completed, or closed.',
    };
  }

  if (closureState === 'closed' || closureState === 'financially_closed') {
    return {
      label: 'Financially closed',
      explanation: input.closureReason || 'Margin has established the final recovery outcome from the available closure checks.',
      tone: 'success',
      category: 'outcome',
      conditions,
      prohibitedImplication: 'Do not show a remaining recovery action unless a new linked event changes this record.',
    };
  }

  if (input.hasTrustedPayout) {
    return {
      label: paymentState === 'partially_paid' ? 'Partial payment verified — closure review continues' : 'Payment verified — closure review continues',
      explanation: input.closureReason || 'Margin has verified payment evidence. Final closure still depends on the remaining outcome checks.',
      tone: 'attention',
      category: 'outcome',
      conditions,
      prohibitedImplication: 'Do not treat verified payment as final financial closure.',
    };
  }

  if (!input.hasTrustedPayout && ['paid', 'partially_paid'].includes(paymentState)) {
    return {
      label: 'Payment recorded — verification required',
      explanation: 'A payment state is recorded, but Margin has not verified a matching financial event for this recovery.',
      tone: 'attention',
      category: 'outcome',
      conditions,
      prohibitedImplication: 'Do not treat a recorded payout as verified payment or financial closure.',
    };
  }

  if (input.hasTrustedApproval) {
    return {
      label: 'Approved — payment not verified',
      explanation: 'Amazon approval is established, but Margin has not verified a corresponding payment in the financial evidence yet.',
      tone: 'attention',
      category: 'outcome',
      conditions,
      prohibitedImplication: 'Do not call this recovery paid or closed.',
    };
  }

  if (!input.hasTrustedFiling && ['filed', 'submitted', 'resubmitted'].includes(normalize(input.filingStatus))) {
    return {
      label: 'Filing proof required',
      explanation: 'An internal filed state is recorded, but Margin has not verified an Amazon submission reference for this recovery.',
      tone: 'warning',
      category: 'outcome',
      conditions,
      prohibitedImplication: 'Do not imply that this case was successfully filed with Amazon.',
    };
  }

  if (input.hasTrustedFiling) {
    return {
      label: 'Filed — awaiting Amazon outcome',
      explanation: 'Submission proof is recorded. Margin is tracking the Amazon outcome and any evidence or response requirements.',
      tone: 'neutral',
      category: 'outcome',
      conditions,
      prohibitedImplication: 'Do not imply Amazon approval, payment, or closure.',
    };
  }

  if (readiness === 'claim_ready') {
    return {
      label: 'Ready for review',
      explanation: 'Margin has a claim-ready finding, but it has not established a filed, approved, paid, or closed outcome.',
      tone: 'attention',
      category: 'outcome',
      conditions,
      prohibitedImplication: 'Do not imply that a claim has been filed or that an amount is owed or paid.',
    };
  }

  return {
    label: 'Evidence review in progress',
    explanation: 'Margin is evaluating the available record. It has not established a filing-ready or financial outcome conclusion.',
    tone: 'neutral',
    category: 'outcome',
    conditions,
    prohibitedImplication: 'Do not imply recovery eligibility, filing, payment, or closure.',
  };
}

export function getRequestedRecoveryLanguage(amount: number | null | undefined): { label: string; detail: string } {
  if (typeof amount !== 'number') {
    return {
      label: 'Requested recovery',
      detail: 'No requested amount has been established from the current record.',
    };
  }

  return {
    label: 'Requested recovery',
    detail: 'This is the amount requested or calculated for recovery. It is not, by itself, an amount Amazon owes, a verified payment, or a final outcome.',
  };
}

export function getAccountingClaimBoundary(input: { status?: string | null; limitation?: string | null }) {
  const status = normalize(input.status);
  const safeLimitation = normalizeAccountingLimitation(input.limitation) || '';
  if (status === 'reconciled') {
    return {
      label: 'Accounting reconciliation',
      detail: 'A reconciliation result is available for this recovery record.',
      prohibitedImplication: 'Do not infer broader financial closure unless the closure state also permits it.',
    };
  }

  return {
    label: 'Accounting reconciliation unavailable',
    detail: safeLimitation || 'Margin could not establish a current reconciliation result from this record. This does not mean the recovery is reconciled.',
    prohibitedImplication: 'Do not render a raw runtime error, “Reconciled,” or “No accounting issues.”',
  };
}

export const CASE_DETAIL_CLAIM_PERMISSION_VECTORS = [
  {
    name: 'requested amount is not an amount owed',
    input: { requested_amount: 1284.66, verified_paid_amount: null },
    allowed: 'Requested recovery: $1,284.66',
    prohibited: ['Amazon owes you $1,284.66', 'Payment: $1,284.66', 'Recovered: $1,284.66'],
  },
  {
    name: 'conflicted FNSKU cannot become authoritative identity',
    input: { fnsku_state: 'conflicted' },
    allowed: 'Observed FNSKU values conflict',
    prohibited: ['FNSKU: X as authoritative identity'],
  },
  {
    name: 'unassessed safety is not a clear safety result',
    input: { safety_state: 'not_assessed' },
    allowed: 'Not assessed',
    prohibited: ['Not detected', 'No issue', 'Safe'],
  },
  {
    name: 'unavailable accounting is not reconciliation',
    input: { accounting_status: 'unavailable' },
    allowed: 'Accounting reconciliation unavailable',
    prohibited: ['Reconciled', 'No accounting issues', 'raw runtime error'],
  },
] as const;
