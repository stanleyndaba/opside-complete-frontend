import { readFileSync } from 'node:fs';
import { transformSync } from 'esbuild';

const sourcePath = new URL('../src/lib/caseDetailTruthPresentation.ts', import.meta.url);
const source = readFileSync(sourcePath, 'utf8');
const transformed = transformSync(source, { loader: 'ts', format: 'esm', target: 'es2022' }).code;
const moduleUrl = `data:text/javascript;base64,${Buffer.from(transformed).toString('base64')}`;
const {
  buildRecoveryTruthPresentation,
  getAccountingClaimBoundary,
  getRequestedRecoveryLanguage,
} = await import(moduleUrl);

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const acmeTruth = buildRecoveryTruthPresentation({
  hasTrustedPayout: true,
  verifiedPaidAmount: 963.10,
  financialPayoutStatus: 'paid',
  accountingStatus: 'unavailable',
  accountingLimitation: 'No accounting connection is recorded for this recovery.',
  closureState: 'accounting_review',
  hasUnassessedSafety: true,
});
assert(acmeTruth.label === 'Open — review required', 'verified payment with accounting/safety review must render as Open — review required');
assert(!/paid out|reconciled|completed|closed/i.test(acmeTruth.label), 'ACME state must not be rendered as paid out, reconciled, completed, or closed');

const reversalTruth = buildRecoveryTruthPresentation({
  hasTrustedPayout: true,
  verifiedPaidAmount: 963.10,
  financialPayoutStatus: 'reversed',
  financialReversalState: 'reversed',
});
assert(reversalTruth.label === 'Open — reversal detected', 'a confirmed reversal must keep recovery open');

const closedTruth = buildRecoveryTruthPresentation({
  hasTrustedPayout: true,
  verifiedPaidAmount: 963.10,
  financialPayoutStatus: 'paid',
  accountingStatus: 'reconciled',
  closureState: 'financially_closed',
});
assert(closedTruth.label === 'Financially closed', 'only explicit financial closure may render the closed label');

const requested = getRequestedRecoveryLanguage(1284.66);
assert(requested.label === 'Requested recovery', 'requested money must be labeled as requested recovery');
assert(/not, by itself, an amount Amazon owes/i.test(requested.detail), 'requested money must prohibit an amount-owed implication');

const accounting = getAccountingClaimBoundary({
  status: 'unavailable',
  limitation: 'K.getRecoveryReconciliation is not a function',
});
assert(accounting.label === 'Accounting reconciliation unavailable', 'accounting runtime failures must render as unavailable');
assert(!/is not a function/i.test(accounting.detail), 'raw accounting runtime failures must not reach the seller-facing boundary');

console.log('Case Detail truth-presentation claim-permission checks passed.');
