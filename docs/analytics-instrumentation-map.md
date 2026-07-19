# Margin Analytics Instrumentation Map

Updated: 2026-07-19

## Source Of Truth

- GA4 Measurement ID: `G-KKCKWRFS3H`
- GA4 script source: `index.html`
- Page view mode: manual SPA `page_view`; `send_page_view` remains `false`
- First-party backup: every `trackPageView` and `trackEvent` call also posts to `/api/metrics/track`
- Backend storage table: `public_analytics_events`
- GTM status: removed from cookie-consent runtime injection so direct GA4 is the only GA/GTM script path in source code

## Route Inventory

The React router currently defines 165 route entries.

### Current Public Pages

These are the routes that should appear as live public website pages in GA4 reports:

- `/` -> `pages/Index`
- `/about-margin` -> `pages/AboutMargin`
- `/sales` -> `pages/Sales`
- `/contact` -> `pages/Contact`
- `/login` -> `pages/Login`
- `/early-access` -> `pages/EarlyAccess`
- `/currency-margin` -> `pages/CurrencyMargin`
- `/payment/success` -> `pages/PaymentSuccess`
- `/founding-500/status` -> `pages/FoundingActivationStatus`
- `/privacy` -> `pages/Privacy`
- `/terms` -> `pages/Terms`
- `/refund-policy` -> `pages/RefundPolicy`
- `/docs` -> `pages/Docs`

### SEO / Prerendered Pages

These routes are intentionally public and included in sitemap/prerender output:

- `/amazon-fba-reimbursement`
- `/amazon-lost-inventory-reimbursement`
- `/amazon-reimbursement-audit`
- `/amazon-inbound-shipment-shortage`
- `/amazon-fee-overcharge-reimbursement`
- `/getida-alternative`
- `/sellerboard-alternative`
- `/research`
- `/fba-reimbursement-research`
- `/about-margin`
- `/early-access`
- `/contact`
- `/sales`
- `/privacy`
- `/terms`
- `/refund-policy`
- `/`

### Redirect / Obsolete Public Paths

- `/pricing` redirects to `/early-access`
- `/history` redirects into tenant billing context
- `/upcoming-payments` redirects into tenant billing context
- `/connect-amazon-account` redirects to `/connect-amazon`
- Legacy top-level app routes such as `/recoveries`, `/filing-pipeline`, `/dispute-cases`, `/appeals`, `/sync`, `/settings`, `/billing`, and `/pricing-adjust` are tenant redirects

### Hidden Demo / Artifact Routes

These routes are mounted but should not be treated as active public acquisition pages unless intentionally relaunched:

- `/accuracy-graph`
- `/accuracy-scaling`
- `/action-simulate`
- `/amazon-asks`
- `/api-connection`
- `/AppealSimulate`
- `/appealsimulate`
- `/auditable-outputs`
- `/auditable-workspace`
- `/card-review`
- `/claimsimulate`
- `/clocksimulate`
- `/closingcta`
- `/comparisonsimulate`
- `/countdown`
- `/designsimulate`
- `/discoverysimulate`
- `/discrepancy-stack`
- `/discrepancysimulate`
- `/documentsimulate`
- `/every-case`
- `/evidence-analysis`
- `/evidence-before-asked`
- `/evidence-chase`
- `/evidence-insight`
- `/evidence-match`
- `/feedback-learning`
- `/filesimulate`
- `/finality`
- `/finalpayoffsimulate`
- `/giving-up`
- `/google-drive`
- `/intro-pain`
- `/launch-countdown`
- `/margin-reads`
- `/margin-takes-over`
- `/memory-simulate`
- `/openstatement`
- `/plane`
- `/platformsimulate`
- `/readiness-simulate`
- `/readiness-simulate-two`
- `/reconciliation-simulate`
- `/reframesimulate`
- `/rejectsimulate`
- `/report-generation`
- `/results-scroll`
- `/scatterdesign`
- `/staresimulate`
- `/statementsimulate`
- `/supplier-chat`
- `/timeline-simulation`

### Application Pages

All `/app/...` tenant routes are application pages. They require a valid session, reviewer session, or explicit demo session. They should not be interpreted as public landing-page acquisition pages in GA4.

## Intended Visitor Journeys

Primary paid flow:

`/` -> `/early-access` -> `/currency-margin` -> Paystack Payment Page -> `/payment/success` when a return URL is used

SEO flow:

SEO page -> `/early-access` or `/pricing` -> `/early-access` -> `/currency-margin` -> Paystack

Blocked private-app flow:

`/app...` -> `AppAccessGate` -> `/early-access`, `/login`, or `/sales`

Waitlist flow:

`/waitlist` -> form submit -> waitlist success/error

Known current limitations:

- Paystack Payment Page is live, but full webhook reconciliation is intentionally not implemented yet.
- Checkout abandonment is tracked when a browser returns to Margin after a pending Paystack click without hitting `/payment/success`.
- Checkout cancelled/failed is tracked only if the return URL includes a detectable `status` or `payment_status` query value.

## Event Map

### Route / Page Events

- `page_view`: fires on first load and SPA route changes from `AnalyticsRouteTracker`
- `public_page_viewed`: fires for every route with route type and GA4 inclusion hint
- `homepage_viewed`: fires on `/`
- `redirect_observed`: fires for known redirect routes before/during navigation

### Section / Scroll Events

- `landing_section_viewed`: fires when a public page section enters view
- `landing_hero_viewed`: fires for detected homepage hero section
- `landing_problem_viewed`: fires for detected homepage problem/friction sections
- `landing_solution_viewed`: fires for detected homepage solution/control sections
- `landing_demo_viewed`: fires for detected demo section
- `landing_faq_viewed`: fires for detected FAQ section
- `scroll_depth_reached`: fires at 25%, 50%, 75%, and 90% on public pages

### CTA / Link / Form Events

- `cta_clicked`: fires for key CTA text patterns across public pages
- `outbound_link_clicked`: fires for external links
- `form_start`: fires on first field focus inside a form
- `form_submitted`: fires on form submit
- `waitlist_opened`: fires on `/waitlist`
- `waitlist_viewed`, `waitlist_signup_submitted`, `waitlist_signup_success`, `waitlist_signup_failed`: page-specific waitlist events

### Early Access / Payment Events

- `early_access_viewed`: fires on `/early-access`
- `early_access_hero_seen`: fires when Early Access hero is visible
- `early_access_offer_seen`: fires when Early Access offer section is visible
- `early_access_cta_seen`: fires for Early Access CTAs that route to `/currency-margin`
- `claim_access_clicked`: fires on Early Access / pricing / Paystack-intent CTAs
- `paystack_cta_seen`: fires on `/currency-margin` when actual Paystack buttons are visible
- `payment_button_clicked`: fires on Paystack button clicks
- `checkout_started`: fires from existing Paystack click handlers
- `checkout_opened`: fires from the public instrumentation layer on Paystack button click
- `outbound_payment_clicked`: fires from existing Paystack click handlers
- `checkout_abandoned`: fires when a pending Paystack click returns to Margin without success
- `checkout_cancelled`: fires on payment return with cancelled status
- `payment_failed`: fires on payment return with failed status
- `payment_success`: fires on Early Access success return

### Demo / Video Events

- `demo_cta_clicked`: fires when demo CTA is clicked
- `demo_modal_opened`: fires when demo modal opens
- `demo_embed_visible`: fires when the video embed is visible
- `demo_video_started`: fires from YouTube player `PLAYING` state
- `demo_video_progress_25`, `demo_video_progress_50`, `demo_video_progress_75`: fire from YouTube current-time/duration
- `demo_video_completed`: fires from YouTube `ENDED` state
- `demo_video_clicked`: fires when the external YouTube link is opened

### App Gate / Login Events

- `app_gate_viewed`: fires when a private app route is gated
- `reserved_demo_slug_blocked`: fires for reserved demo workspace attempts
- `blocked_demo_attempt`: generic demo-block event for GA4 reporting
- `app_gate_early_access_clicked`
- `app_gate_login_clicked`
- `app_gate_demo_request_clicked`
- `login_attempt`
- `login_success`
- `login_failed`
- `reviewer_login_success`

## Pass / Fail Checklist

- PASS: single direct GA4 script path remains in source code
- PASS: manual SPA `page_view` path remains active
- PASS: no code-level GTM runtime injection remains
- PASS: first-party analytics backup persists events server-side
- PASS: public routes, redirects, CTAs, forms, outbound links, and scroll depth are instrumented centrally
- PASS: Paystack button visibility is tracked only where Paystack is actually present
- PASS: video start/progress/completion uses YouTube player state instead of timer guesses
- PASS: hidden demo routes are identifiable and flagged as `hidden_demo`
- WARN: live GA4 UI cannot be verified from code alone because GA4 processing is external and delayed
- WARN: Paystack success remains manually verified until webhooks are intentionally introduced

## Queries

Use this to confirm first-party analytics after deployment:

```sql
select event_name, count(*)
from public_analytics_events
where created_at > now() - interval '24 hours'
group by event_name
order by count(*) desc;
```
