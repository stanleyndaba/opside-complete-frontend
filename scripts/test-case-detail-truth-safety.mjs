import assert from 'node:assert/strict';
import {
  isCaseDetailDemoWorkspace,
  isGeneratedCaseDetailContext,
  isReconstructedCaseDetailEvent,
  selectCaseDetailEventFailureState,
  selectCaseDetailFailureState,
} from '../src/lib/caseDetailTruthSafety.js';

const unavailable = (caseId, reason) => ({
  id: caseId,
  truth_unavailable: true,
  error: reason,
  documents: [],
  case_messages: [],
  verified_paid_amount: null,
  safety_evaluations: {
    prior_reimbursement: { state: 'not_assessed' },
    inventory_adjustment: { state: 'not_assessed' },
    duplicate_claim: { state: 'not_assessed' },
  },
});

let demoHydrationCalls = 0;
const hydrateDemo = (record) => {
  demoHydrationCalls += 1;
  return {
    ...record,
    demo_hydrated: true,
    documents: [{ id: 'demo-document' }],
    case_messages: [{ id: 'demo-message' }],
    verified_paid_amount: 569.5,
  };
};

const demoEvents = () => [{ id: 'demo-event' }];

assert.equal(isCaseDetailDemoWorkspace('demo-workspace'), true, 'RTR-18 demo workspace may hydrate');
assert.equal(isCaseDetailDemoWorkspace('DEMO-WORKSPACE'), true, 'RTR-18 demo workspace normalization remains explicit');
assert.equal(isCaseDetailDemoWorkspace('seller-live'), false, 'RTR-18 ordinary tenant must not be treated as demo');

const liveFailure = selectCaseDetailFailureState({
  tenantSlug: 'seller-live',
  caseId: 'LIVE-1',
  failureReason: 'API unavailable',
  lastKnownCase: null,
  buildUnavailableCase: unavailable,
  hydrateDemoCase: hydrateDemo,
});
assert.equal(liveFailure.freshness, 'unavailable', 'RTR-19 non-demo API failure is unavailable');
assert.equal(liveFailure.caseData.truth_unavailable, true, 'RTR-19 non-demo fallback is unavailable truth');
assert.equal(liveFailure.caseData.demo_hydrated, undefined, 'RTR-19 non-demo API failure must not hydrate demo data');
assert.deepEqual(liveFailure.caseData.documents, [], 'RTR-19 non-demo API failure must not receive demo documents');
assert.deepEqual(liveFailure.caseData.case_messages, [], 'RTR-19 non-demo API failure must not receive demo messages');
assert.equal(liveFailure.caseData.verified_paid_amount, null, 'RTR-19 non-demo API failure must not fabricate payment');
assert.equal(demoHydrationCalls, 0, 'RTR-19 non-demo failure must never invoke demo hydration');

const lastKnownCase = {
  id: 'LIVE-1',
  truth_unavailable: false,
  verified_paid_amount: 100,
  outstanding_amount: 0,
  safety_evaluations: { duplicate_claim: { state: 'no' } },
  documents: [{ id: 'real-document' }],
};
const staleFailure = selectCaseDetailFailureState({
  tenantSlug: 'seller-live',
  caseId: 'LIVE-1',
  failureReason: 'Refresh failed',
  lastKnownCase,
  buildUnavailableCase: unavailable,
  hydrateDemoCase: hydrateDemo,
});
assert.equal(staleFailure.freshness, 'stale', 'RTR-20 preserves a freshness limitation after refresh failure');
assert.equal(staleFailure.preservedLastKnownTruth, true, 'RTR-20 retains last-known truth');
assert.strictEqual(staleFailure.caseData, lastKnownCase, 'RTR-20 must preserve the exact established case state');
assert.equal(staleFailure.caseData.verified_paid_amount, 100, 'RTR-20 must not reset verified payment to zero');
assert.equal(staleFailure.caseData.safety_evaluations.duplicate_claim.state, 'no', 'RTR-20 must not reset safety to false or unavailable');
assert.equal(demoHydrationCalls, 0, 'RTR-20 non-demo stale failure must not invoke demo hydration');

const staleEvents = [{ id: 'real-event', source: 'notification' }];
const eventFailure = selectCaseDetailEventFailureState({
  tenantSlug: 'seller-live',
  caseId: 'LIVE-1',
  lastKnownEvents: staleEvents,
  buildDemoEvents: demoEvents,
});
assert.equal(eventFailure.freshness, 'stale', 'RTR-20 preserves last-known events after event refresh failure');
assert.strictEqual(eventFailure.events, staleEvents, 'RTR-20 must not replace known events with synthetic events');

const demoFailure = selectCaseDetailFailureState({
  tenantSlug: 'demo-workspace',
  caseId: 'DEMO-1',
  failureReason: 'Demo API unavailable',
  lastKnownCase: null,
  buildUnavailableCase: unavailable,
  hydrateDemoCase: hydrateDemo,
});
assert.equal(demoFailure.caseData.demo_hydrated, true, 'RTR-18 demo workspace may use explicitly scoped synthetic hydration');
assert.equal(demoHydrationCalls, 1, 'RTR-18 demo hydration is invoked only for the demo workspace');

assert.equal(isGeneratedCaseDetailContext({ generated: true }), true, 'RTR-16 generated context remains identified as generated');
assert.equal(isGeneratedCaseDetailContext({ generated: false }), false, 'RTR-16 non-generated context is not mislabeled');
assert.equal(isReconstructedCaseDetailEvent({ source: 'case_record' }), true, 'RTR-17 fallback case-record event is reconstructed');
assert.equal(isReconstructedCaseDetailEvent({ source: 'notification' }), false, 'RTR-17 notification event is not reconstructed');

console.log('Case Detail truth safety frontend checks: 18 passed');
