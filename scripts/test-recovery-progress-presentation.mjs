import { readFileSync } from 'node:fs';
import { transformSync } from 'esbuild';

const helperPath = new URL('../src/lib/caseDetailRecoveryProgressPresentation.ts', import.meta.url);
const componentPath = new URL('../src/components/cases/RecoveryProgressControl.tsx', import.meta.url);
const caseDetailPath = new URL('../src/pages/CaseDetail.tsx', import.meta.url);
const helperSource = readFileSync(helperPath, 'utf8');
const componentSource = readFileSync(componentPath, 'utf8');
const caseDetailSource = readFileSync(caseDetailPath, 'utf8');
const transformed = transformSync(helperSource, { loader: 'ts', format: 'esm', target: 'es2022' }).code;
const moduleUrl = `data:text/javascript;base64,${Buffer.from(transformed).toString('base64')}`;
const { buildRecoveryProgressPresentation } = await import(moduleUrl);

let assertions = 0;
const assert = (condition, message) => {
  assertions += 1;
  if (!condition) throw new Error(message);
};

const lifecycle = (active = []) => ['Detected', 'Evidence', 'Filed', 'Approved', 'Payment verified'].map((label) => ({ label, active: active.includes(label) }));
const truth = (label = 'Open — review required') => ({ label, explanation: 'Certified current-state explanation.', tone: 'attention', conditions: [], prohibitedImplication: 'No unsupported closure implication.' });
const present = (input = {}) => buildRecoveryProgressPresentation({
  truthPresentation: truth(),
  lifecycleSteps: lifecycle(),
  nextStep: { title: 'Recorded next step', description: 'Follow the existing recorded operational step.' },
  missingRequirements: null,
  financialPayoutStatus: null,
  financialReversalState: null,
  accountingStatus: null,
  closureState: null,
  hasTrustedFiling: false,
  hasTrustedApproval: false,
  hasTrustedPayout: false,
  hasSafetyBlock: false,
  hasUnassessedSafety: false,
  truthUnavailable: false,
  ...input,
});

// 1. Detected only
let result = present({ lifecycleSteps: lifecycle(['Detected']) });
assert(result.resolution.owner === 'Margin', 'Detected-only cases must not assign Amazon, seller, or accounting responsibility without support.');
assert(!result.checklist.find((item) => item.label === 'Payment verified').complete, 'Detected-only cases must not imply payment verification.');

// 2. Evidence incomplete
result = present({ lifecycleSteps: lifecycle(['Detected']), missingRequirements: ['Supplier invoice'] });
assert(result.resolution.owner === 'Seller', 'Evidence-incomplete cases with a seller requirement must make seller responsibility explicit.');
assert(/Supplier invoice/.test(result.resolution.sellerAction), 'Seller action must name the recorded missing requirement.');

// 3. Filed with proof
result = present({ lifecycleSteps: lifecycle(['Detected', 'Evidence', 'Filed']), hasTrustedFiling: true });
assert(result.resolution.owner === 'Amazon', 'A proof-backed filing awaiting outcome must be owned by Amazon.');
assert(/Amazon’s response/.test(result.resolution.nextAction), 'Filed-with-proof next action must be waiting for Amazon.');

// 4. Filed without proof
result = present({ lifecycleSteps: lifecycle(['Detected', 'Evidence']), hasTrustedFiling: false, missingRequirements: ['Filing proof'] });
assert(result.resolution.owner !== 'Amazon', 'A filed flag without filing proof must not be represented as waiting on Amazon.');
assert(!result.checklist.find((item) => item.label === 'Filing outcome established').complete, 'Filing proof gap must keep filing outcome incomplete.');

// 5. Approved awaiting payment
result = present({ lifecycleSteps: lifecycle(['Detected', 'Evidence', 'Filed', 'Approved']), hasTrustedFiling: true, hasTrustedApproval: true });
assert(result.resolution.owner === 'Amazon', 'Approval awaiting payment must not be treated as closed or seller-owned.');
assert(/financial payment event/.test(result.closureCondition), 'Approved-without-payment closure condition must require a verified payment event.');

// 6. Recorded payout without verification
result = present({ financialPayoutStatus: 'paid', hasTrustedPayout: false });
assert(!result.checklist.find((item) => item.label === 'Payment verified').complete, 'Recorded payout without proof must not mark payment verified.');
assert(!/Financial closure has been established/.test(result.closureCondition), 'Recorded payout without proof must not establish closure.');

// 7. Verified full payment
result = present({ lifecycleSteps: lifecycle(['Detected', 'Evidence', 'Filed', 'Approved', 'Payment verified']), hasTrustedFiling: true, hasTrustedApproval: true, hasTrustedPayout: true, financialPayoutStatus: 'paid', accountingStatus: 'reconciled', financialReversalState: 'clear' });
assert(result.checklist.find((item) => item.label === 'Payment verified').complete, 'Verified full payment must mark the payment milestone complete.');
assert(!result.checklist.find((item) => item.label === 'Financially closed').complete, 'Verified full payment must not imply financial closure without a closure state.');

// 8. Verified partial payment
result = present({ lifecycleSteps: lifecycle(['Detected', 'Evidence', 'Filed', 'Approved', 'Payment verified']), hasTrustedFiling: true, hasTrustedApproval: true, hasTrustedPayout: true, financialPayoutStatus: 'partially_paid', accountingStatus: 'reconciled', financialReversalState: 'clear' });
assert(result.checklist.find((item) => item.label === 'Payment verified').complete, 'A verified partial payment remains a verified payment event.');
assert(!result.checklist.find((item) => item.label === 'Financially closed').complete, 'A partial payment must not imply financial closure.');

// 9. Verified payment plus accounting review: ACME reference state
result = present({ lifecycleSteps: lifecycle(['Detected', 'Evidence', 'Filed', 'Approved', 'Payment verified']), hasTrustedFiling: true, hasTrustedApproval: true, hasTrustedPayout: true, financialPayoutStatus: 'paid', accountingStatus: 'unavailable', hasUnassessedSafety: true });
assert(result.resolution.owner === 'Accounting', 'Verified payment plus unavailable accounting must explicitly assign accounting review.');
assert(result.remaining === 'Safety review', 'Unassessed safety must remain visible before financial closure.');
assert(!result.checklist.find((item) => item.label === 'Financially closed').complete, 'ACME reference state must not render financially closed.');

// 10. Safety hold
result = present({ hasSafetyBlock: true, hasTrustedPayout: true, accountingStatus: 'reconciled', closureState: 'financially_closed' });
assert(/safety condition/.test(result.closureCondition), 'Safety hold must outrank a completion-like closure state.');
assert(result.resolution.owner === 'Margin', 'A safety hold without accounting gap must be owned by Margin.');

// 11. Reversal detected
result = present({ hasTrustedPayout: true, accountingStatus: 'reconciled', financialReversalState: 'reversed', closureState: 'financially_closed' });
assert(/reversal or offset/.test(result.closureCondition), 'Reversal must outrank a contradictory closure state.');
assert(result.remaining === 'Reversal or offset review', 'Reversal state must become the remaining resolution path.');

// 12. Stale data
assert(componentSource.includes('Last known record'), 'Stale record state must be visibly labelled in Recovery Progress.');
assert(componentSource.includes('Payment verification, accounting reconciliation, reversal review, and financial closure are separate conditions.'), 'Recovery Progress must disclose distinct closure stages.');

// 13. Truth unavailable
result = present({ truthUnavailable: true, hasTrustedPayout: true, accountingStatus: 'reconciled', closureState: 'financially_closed' });
assert(result.resolution.owner === 'Not established', 'Truth unavailable must block ownership assignment.');
assert(/Authoritative case truth/.test(result.closureCondition), 'Truth unavailable must block a closure conclusion.');

// 14. Missing requested amount
assert(caseDetailSource.includes("{requestedAmount !== null ? (") && caseDetailSource.includes('Original requested recovery'), 'Requested recovery reference must render only when an actual requested amount exists.');
assert(caseDetailSource.includes('not, by itself, a verified payment or final financial outcome'), 'Requested recovery copy must forbid payment/finality implication.');

// 15. Derived inventory discrepancy
assert(caseDetailSource.includes('A document or event is not automatically proof of filing, payment, or closure.'), 'Supporting-evidence section must distinguish artifacts from operational conclusions.');

// Product-noise removal
for (const internalLabel of ['Autonomous strategy and recovery path', 'Patient Zero', 'Active Council', 'Tactical Playbook', 'Continuous Protection', 'Generated System Guidance']) {
  assert(!caseDetailSource.includes(internalLabel), `Internal implementation label must not remain in Case Detail: ${internalLabel}`);
}
assert(caseDetailSource.includes('RecoveryProgressControl'), 'Case Detail must use the dedicated Recovery Progress control surface.');
assert(caseDetailSource.includes("{ label: 'Payment verified', active: hasPayout }"), 'Lifecycle terminal milestone must be Payment verified, not Recovered.');

// Phase B.3 integrated coherence: current outcome must outrank stale pre-filing guidance.
assert(caseDetailSource.includes('if (hasCurrentPayout) {') && caseDetailSource.includes('Filing approval is a historical step for this recovery.'), 'A verified payment must prevent the header from directing the seller to approve an already-filed recovery.');
assert(!caseDetailSource.includes('Payment is verified. ${recoveryTruthPresentation.explanation}'), 'The current-state header must not repeat the verified-payment conclusion.');
assert(caseDetailSource.includes('if (hasCurrentApproval) {') && caseDetailSource.includes('Amazon approval is established, but Margin has not yet verified the corresponding payment event.'), 'An established approval must take precedence over pre-filing seller-approval guidance.');
assert(!caseDetailSource.includes("caseReference === 'ACME-CASE-2005' ? 569.50"), 'ACME must not inject an unlabelled competing Amazon outcome amount.');
assert(!caseDetailSource.includes("replace(/\\$963\\.10/g, '$569.50')"), 'Supporting evidence must not rewrite an authoritative payment amount to a conflicting scenario amount.');

console.log(`Recovery Progress Phase B.2/B.3 matrix passed (${assertions} assertions across 15 states).`);
