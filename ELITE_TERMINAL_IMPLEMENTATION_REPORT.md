# Margin Authenticated Platform — Elite Terminal Implementation Report

## North-star used

The authenticated platform was implemented against the forensic research grammar captured in `FORENSIC_PLATFORM_GRAMMAR_NOTES.md`, not against a generic visual refresh. The governing rules were:

> Information over decoration. Evidence before assertion. Numbers require state. Every status must communicate a next action or explain why no action is needed.

The implementation therefore treats Margin as a governed recovery workspace. The interface now gives priority to persistent scope, durable work objects, lifecycle state, evidence lineage, seller authority, and operational next action. Decorative terminal effects, dark/navy surfaces, protocol-coded status labels, and ambiguous financial claims were treated as defects rather than design preferences.

## Implemented areas

### Authenticated shell

`src/components/layout/Navbar.tsx` now uses a quiet light topbar with a persistent active-workspace context, marketplace selection, compact search, and no decorative separators between topbar control groups. Marketplace and integration counts use the same Margin blue emphasis rather than mixed blue/navy states. The logo remains a Merriweather wordmark with tight tracking.

`src/components/layout/Sidebar.tsx` now uses blue selected navigation states, a compact 1px active rail, borderless navigation items, and light count indicators. The referral surface was rewritten from an implementation-coded dark terminal modal into a seller-facing light invitation surface explaining that invited sellers keep 100% of recovered funds.

### Dashboard and pipeline

`src/components/layout/Dashboard.tsx` was revised as a lifecycle command center. Pipeline stages now distinguish detected issues, proof needed, Amazon review, awaiting payout, and paid back using light semantic states. Every financial figure is paired with its recovery lifecycle meaning and supporting detail. Finding movement tones were converted from dark-theme tokens into light evidence states for detected, evidence-needed, ready-to-file, filed, awaiting payout, completed, and blocked records.

The Dashboard issue table and detail surfaces were converted away from raw dark-theme utility tokens. Raw operational toast labels such as `FETCH_PROTOCOL_ERROR` were replaced with seller-facing language explaining impact and next action. Quick-action and invitation notifications now use plain language rather than protocol codes.

### Audit and evidence

`src/pages/audit.tsx` no longer presents `200_OK` as the primary result. The visible state is now `Data synchronized`, preserving the operational truth while removing transport-layer vocabulary.

`src/pages/EvidenceLocker.tsx` now uses compact title hierarchy and clearer `Evidence history` / `Evidence library` section labels. The existing distinctions between connected, stored, parsed, matched, linked, usable, and review-needed evidence were preserved.

### Recoveries

`src/pages/Recoveries.tsx` was moved away from the matrix/dark-terminal presentation into a light recovery ledger. The page now foregrounds the recovery lifecycle, uses compact page hierarchy, and translates loading, error, empty, resolution, advisory, and recommendation language into seller-facing terms. Examples include `Checking recovery records…`, `Margin could not load this recovery ledger`, `No recovery cases in this view`, `Resolution note`, and `Recommended next step`.

### Disputes, filing, appeals, notifications, settings, integrations

`src/pages/DisputeCases.tsx` now uses a light queue shell, compact title hierarchy, plain queue-state copy, light filter controls, and a bordered white record surface.

`src/pages/FilingPipeline.tsx` now uses Margin blue for active pipeline emphasis rather than dark navy, keeps the proposal → review → authorization → execution → confirmation distinction, and uses compact chain-of-custody hierarchy.

`src/pages/Appeals.tsx` now frames the page as a verified response workspace and explicitly preserves the epistemic boundary that internal estimates must not appear as Amazon approvals or denials. Its queue and unavailable states use light evidence surfaces.

`src/pages/NotificationHub.tsx` now foregrounds unread operational events, keeps preferences in a side panel, and removes the unnecessary separator treatment from unread count controls.

`src/pages/Settings.tsx` replaces `SYSTEM_CONFIG // READ_ONLY` with `ACCOUNT CONTROLS · LIVE DATA`, preserving the read-only/live-persistence truth while making it legible to sellers.

`src/pages/IntegrationsHub.tsx` now presents connected sources as an evidence-source registry. The search field is object-oriented and seller-readable, and the recovery reveal distinguishes estimated value from confirmed recovery. Blue emphasis is standardized to Margin blue.

### Shared design system

`src/index.css` now reinforces the authenticated platform grammar with a strict light canvas, white surfaces, 1px semantic borders, compact shadows, blue selected states, and reduced visual noise. Shared dense-page overrides convert legacy dark utility classes into light operational surfaces without removing the underlying functionality or workflow logic.

## Verification

The production build completed successfully with Vite:

```text
✓ built in 11.14s
```

The installed TypeScript compiler also completed successfully:

```text
npx --no-install tsc --noEmit
```

The final scan found no visible uses of `FETCH_PROTOCOL_ERROR`, `200_OK`, `Forbidden (403)`, `SYSTEM_CONFIG`, `READ_ONLY`, `ERROR_OVERRIDE`, `SYNCHRONIZING_DATA_NODES`, `ZERO_NODES_IDENTIFIED`, `tracking-wide`, or `tracking-widest` in the targeted authenticated surfaces. The remaining `THREAD_ONLY` occurrence is an internal eligibility enum in Dispute Cases, not a seller-visible label.

## Files changed

- `src/index.css`
- `src/components/layout/Navbar.tsx`
- `src/components/layout/Sidebar.tsx`
- `src/components/layout/Dashboard.tsx`
- `src/pages/audit.tsx`
- `src/pages/Recoveries.tsx`
- `src/pages/DisputeCases.tsx`
- `src/pages/EvidenceLocker.tsx`
- `src/pages/FilingPipeline.tsx`
- `src/pages/Appeals.tsx`
- `src/pages/NotificationHub.tsx`
- `src/pages/Settings.tsx`
- `src/pages/IntegrationsHub.tsx`

The changes are currently present in the working tree and have not been committed or pushed in this pass.
 houding
## Final design test

Before a seller takes a consequential action, the surface should make four things legible: **which workspace/account is active, what object is being operated on, what state it is in, and what the safest next action is**. That is the design test used for this implementation.
