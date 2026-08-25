import { readFileSync } from 'node:fs';
import { transformSync } from 'esbuild';

const sourcePath = new URL('../src/lib/caseDetailTruthPresentation.ts', import.meta.url);
const componentPath = new URL('../src/components/cases/RecoveryTruthRecord.tsx', import.meta.url);
const source = readFileSync(sourcePath, 'utf8');
const componentSource = readFileSync(componentPath, 'utf8');
const transformed = transformSync(source, { loader: 'ts', format: 'esm', target: 'es2022' }).code;
const moduleUrl = `data:text/javascript;base64,${Buffer.from(transformed).toString('base64')}`;
const {
  buildRecoveryTruthPresentation,
  getAccountingClaimBoundary,
  getRequestedRecoveryLanguage,
} = await import(moduleUrl);

let assertions = 0;
const assert = (condition, message) => {
  assertions += 1;
  if (!condition) throw new Error(message);
};

const verdict = (input) => buildRecoveryTruthPresentation(input);

// 1. Detection only
assert(verdict({ claimReadiness: 'not_claim_ready' }).label === 'Evidence review in progress', 'Detection-only state must not imply recovery eligibility.');

// 2. Evidence incomplete
assert(verdict({ filingStatus: 'pending', claimReadiness: 'not_claim_ready' }).label === 'Evidence review in progress', 'Evidence-incomplete state must remain an evidence review.');

// 3. Filed with proof
assert(verdict({ hasTrustedFiling: true, filingStatus: 'filed' }).label === 'Filed — awaiting Amazon outcome', 'Filed proof must render as awaiting Amazon outcome.');

// 4. Filed flag without sufficient proof
const filedWithoutProof = verdict({ filingStatus: 'filed', filingTruthLine: 'Internal filed state is recorded, but Margin has not verified an Amazon submission reference.' });
assert(filedWithoutProof.label === 'Filing proof required', 'A filed flag without proof must not render as filed.');
assert(/Do not imply that this case was successfully filed/i.test(filedWithoutProof.prohibitedImplication), 'Filing-proof gap must carry an explicit claim boundary.');

// 5. Approved, awaiting reimbursement
assert(verdict({ hasTrustedApproval: true, hasTrustedFiling: true }).label === 'Approved — payment not verified', 'Approved state must not imply payment.');

// 6. Recorded payout but unverified
const recordedOnly = verdict({ financialPayoutStatus: 'paid', hasTrustedPayout: false });
assert(recordedOnly.label === 'Payment recorded — verification required', 'A recorded payout must not be presented as verified payment.');
assert(/not treat a recorded payout as verified payment/i.test(recordedOnly.prohibitedImplication), 'Recorded payout must explicitly forbid a verified-payment implication.');

// 7. Partial verified payment
assert(verdict({ hasTrustedPayout: true, verifiedPaidAmount: 100, financialPayoutStatus: 'partially_paid' }).label === 'Partial payment verified — closure review continues', 'Partial verified payment must remain distinct from full payment or closure.');

// 8. Verified payment + accounting review (the ACME-CASE-2005 target state)
const acmeTruth = verdict({
  hasTrustedPayout: true,
  verifiedPaidAmount: 963.10,
  financialPayoutStatus: 'paid',
  accountingStatus: 'unavailable',
  accountingLimitation: 'No accounting connection is recorded for this recovery.',
  closureState: 'accounting_review',
  hasUnassessedSafety: true,
});
assert(acmeTruth.label === 'Open — review required', 'ACME verified payment plus accounting/safety review must render as Open — review required.');
assert(!/paid out|reconciled|completed|closed/i.test(acmeTruth.label), 'ACME must not be rendered as paid out, reconciled, completed, or closed.');

// 9. Financially closed
assert(verdict({ hasTrustedPayout: true, verifiedPaidAmount: 963.10, financialPayoutStatus: 'paid', accountingStatus: 'reconciled', closureState: 'financially_closed' }).label === 'Financially closed', 'Only an explicit financial-closure state without surviving constraints may render closed.');

// 10. Reversal review
assert(verdict({ hasTrustedPayout: true, verifiedPaidAmount: 963.10, financialPayoutStatus: 'paid', financialReversalState: 'review_required' }).label === 'Open — review required', 'Reversal review must prevent closure.');

// 11. FNSKU unavailable
assert(componentSource.includes('FNSKU unavailable') && componentSource.includes('cannot use an FNSKU to independently confirm'), 'FNSKU-unavailable rendering must preserve the identity limitation.');

// 12. FNSKU conflict
assert(componentSource.includes('Observed FNSKU values conflict') && componentSource.includes('not treated as an authoritative identity match'), 'FNSKU conflict must not render as authoritative identity.');

// 13. Safety not assessed
assert(verdict({ hasUnassessedSafety: true }).label === 'Open — review required', 'Unassessed safeguards must not render as safe or clear to proceed.');

// 14. Safety hold with completion-like signals
const safetyHoldClosedSignal = verdict({ hasTrustedPayout: true, verifiedPaidAmount: 963.10, financialPayoutStatus: 'paid', accountingStatus: 'reconciled', closureState: 'financially_closed', hasSafetyBlock: true });
assert(safetyHoldClosedSignal.label === 'Open — review required', 'A safety hold must outrank an otherwise completion-like closure signal.');

// 15. Accounting unavailable and raw runtime failure normalization
const accounting = getAccountingClaimBoundary({ status: 'unavailable', limitation: 'K.getRecoveryReconciliation is not a function' });
assert(accounting.label === 'Accounting reconciliation unavailable', 'Accounting runtime failures must render as unavailable.');
assert(!/is not a function/i.test(accounting.detail), 'Raw accounting runtime failures must not reach seller-facing copy.');

// 16. Missing expected amount
const missingRequested = getRequestedRecoveryLanguage(null);
assert(missingRequested.label === 'Requested recovery' && /No requested amount has been established/i.test(missingRequested.detail), 'Missing expected amount must not fabricate a recovery value.');

// 17. Derived quantity
assert(componentSource.includes('A derived inventory difference; it is not, by itself, a confirmed loss or recoverable amount.'), 'Derived quantity must not be presented as a confirmed loss.');

// 18. Generated context
assert(componentSource.includes('generated explanatory context from the current case fields; it is not independent evidence or outcome proof'), 'Generated context must be visibly separated from evidence and outcome proof.');

// 19. Truth unavailable
const unavailable = verdict({ truthUnavailable: true, hasTrustedPayout: true, verifiedPaidAmount: 963.10, financialPayoutStatus: 'paid' });
assert(unavailable.label === 'Case truth unavailable', 'Unavailable truth must outrank stored completion-like signals.');
assert(/Do not imply a recovery amount, filing state, payment state, or closure state/i.test(unavailable.prohibitedImplication), 'Unavailable truth must carry a complete claim boundary.');

// 20. Stale last-known truth
const stale = verdict({ hasTrustedPayout: true, verifiedPaidAmount: 963.10, financialPayoutStatus: 'paid', statusFeedUnavailable: true });
assert(stale.conditions.some((condition) => condition.label === 'Freshness' && condition.category === 'reconstructed'), 'Stale last-known truth must surface a reconstructed/freshness limitation.');

// 21. Contradictory simultaneous statuses
const contradictory = verdict({ hasTrustedPayout: true, verifiedPaidAmount: 963.10, financialPayoutStatus: 'paid', financialReversalState: 'reversed', closureState: 'financially_closed' });
assert(contradictory.label === 'Open — reversal detected', 'A reversal must outrank a contradictory financial-closure signal.');

const requested = getRequestedRecoveryLanguage(1284.66);
assert(requested.label === 'Requested recovery', 'Requested money must be labeled as requested recovery.');
assert(/not, by itself, an amount Amazon owes/i.test(requested.detail), 'Requested money must prohibit an amount-owed implication.');

console.log(`Case Detail Phase B.1 adversarial truth matrix passed (${assertions} assertions across 21 states).`);
