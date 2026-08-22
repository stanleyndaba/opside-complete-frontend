export function normalizeCaseDetailTenantSlug(value) {
  return String(value || '').trim().toLowerCase();
}

export function isCaseDetailDemoWorkspace(tenantSlug) {
  return normalizeCaseDetailTenantSlug(tenantSlug) === 'demo-workspace';
}

export function selectCaseDetailFailureState({ tenantSlug, caseId, failureReason, lastKnownCase, buildUnavailableCase, hydrateDemoCase }) {
  if (lastKnownCase && lastKnownCase.truth_unavailable !== true) {
    return {
      caseData: lastKnownCase,
      freshness: 'stale',
      preservedLastKnownTruth: true,
      error: failureReason || 'Case details unavailable',
    };
  }

  const unavailableCase = buildUnavailableCase(caseId, failureReason || 'Case details unavailable');
  const caseData = isCaseDetailDemoWorkspace(tenantSlug)
    ? hydrateDemoCase(unavailableCase, caseId)
    : unavailableCase;

  return {
    caseData,
    freshness: 'unavailable',
    preservedLastKnownTruth: false,
    error: failureReason || 'Case details unavailable',
  };
}

export function selectCaseDetailEventFailureState({ tenantSlug, caseId, lastKnownEvents, buildDemoEvents }) {
  if (Array.isArray(lastKnownEvents) && lastKnownEvents.length > 0) {
    return {
      events: lastKnownEvents,
      freshness: 'stale',
      preservedLastKnownTruth: true,
    };
  }

  return {
    events: isCaseDetailDemoWorkspace(tenantSlug) ? buildDemoEvents(caseId) : [],
    freshness: 'unavailable',
    preservedLastKnownTruth: false,
  };
}

export function isGeneratedCaseDetailContext(context) {
  return context?.generated === true;
}

export function isReconstructedCaseDetailEvent(event) {
  return event?.source === 'case_record' || event?.source === 'fallback_reconstruction';
}
