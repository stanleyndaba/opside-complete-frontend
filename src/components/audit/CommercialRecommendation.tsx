import { ArrowRight, CheckCircle2, CircleAlert, FilePlus2, MessagesSquare, RefreshCw, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Button } from '@/components/ui/button';
import type { AuditCommercialDecision, AuditTeaserSummary, RecoverOnceQuote } from '@/lib/api';

type RecommendationKind = 'no_sale' | 'evidence_remediation' | 'nurture' | 'recover_once' | 'workspace' | 'talk_to_sales' | 'fallback';

type CommercialRecommendationProps = {
  decision: AuditCommercialDecision | null;
  teaser: AuditTeaserSummary;
  recoverOnceQuote: RecoverOnceQuote | null;
  isRecoverOnceQuoteLoading: boolean;
  onReviewRecoverOnce: () => void;
  onReviewWorkspace: () => void;
  reportUploadHref: string;
};

function formatAuditDate(value: string | null): string | null {
  if (!value) return null;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return null;
  return new Date(timestamp).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getRecommendationKind(decision: AuditCommercialDecision | null): RecommendationKind {
  if (!decision) return 'fallback';
  if (decision.route === 'RECOVER_ONCE' && decision.eligibility === 'eligible') return 'recover_once';
  if (decision.route === 'WORKSPACE' && decision.eligibility === 'eligible') return 'workspace';
  if (decision.route === 'RECOVERY_CONTROL' && decision.eligibility === 'eligible') return 'talk_to_sales';
  if (decision.route === 'EVIDENCE_REMEDIATION') return 'evidence_remediation';
  if (decision.route === 'NURTURE') return 'nurture';
  if (decision.route === 'NO_SALE' || decision.eligibility === 'ineligible') return 'no_sale';
  return 'fallback';
}

function listSentence(values: string[]): string | null {
  const distinct = Array.from(new Set(values.filter(Boolean)));
  if (!distinct.length) return null;
  if (distinct.length === 1) return distinct[0];
  if (distinct.length === 2) return `${distinct[0]} and ${distinct[1]}`;
  return `${distinct.slice(0, -1).join(', ')}, and ${distinct[distinct.length - 1]}`;
}

function EvidenceFacts({ teaser, decision }: Pick<CommercialRecommendationProps, 'teaser' | 'decision'>) {
  const evidence = decision?.evidenceBasis?.current;
  const findings = typeof evidence?.findingsCount === 'number' ? evidence.findingsCount : teaser.findingsCount;
  const evidenceReady = typeof evidence?.evidenceReadyCount === 'number' ? evidence.evidenceReadyCount : teaser.evidenceReadyCount;
  const records = typeof evidence?.recordsReviewed === 'number' ? evidence.recordsReviewed : teaser.recordsReviewed;
  const unavailable = evidence?.sourcesUnavailable || teaser.sourcesUnavailable || [];
  const hasFacts = typeof records === 'number' || findings > 0 || evidenceReady > 0 || unavailable.length > 0;

  if (!hasFacts) return null;

  return (
    <dl className="mt-4 grid gap-3 rounded-[10px] border border-[#E8E7E1] bg-white p-4 text-left sm:grid-cols-3">
      <div>
        <dt className="text-[11px] font-semibold text-[#777A82]">Records reviewed</dt>
        <dd className="mt-1 text-[14px] font-semibold text-[#191B20]">{typeof records === 'number' ? records.toLocaleString() : 'Not recorded'}</dd>
      </div>
      <div>
        <dt className="text-[11px] font-semibold text-[#777A82]">Potential opportunities</dt>
        <dd className="mt-1 text-[14px] font-semibold text-[#191B20]">{findings.toLocaleString()}</dd>
      </div>
      <div>
        <dt className="text-[11px] font-semibold text-[#777A82]">Evidence ready</dt>
        <dd className="mt-1 text-[14px] font-semibold text-[#191B20]">{evidenceReady.toLocaleString()}</dd>
      </div>
      {unavailable.length ? (
        <div className="border-t border-[#E8E7E1] pt-3 text-[12px] leading-5 text-[#595E68] sm:col-span-3">
          <span className="font-semibold text-[#191B20]">Additional evidence needed:</span> {listSentence(unavailable)}.
        </div>
      ) : null}
    </dl>
  );
}

function EvidenceActions({ reportUploadHref }: Pick<CommercialRecommendationProps, 'reportUploadHref'>) {
  return (
    <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
      <Button asChild className="h-10 rounded-[10px] bg-[#3F51A8] px-4 text-[13px] font-semibold text-white shadow-none hover:bg-[#31418D]">
        <Link to={reportUploadHref}>Use Amazon reports <ArrowRight className="ml-2 h-4 w-4" /></Link>
      </Button>
    </div>
  );
}

/**
 * This component contains no classification, score, price, or eligibility
 * calculation. It only translates a decision already made by the backend.
 */
export function CommercialRecommendation({
  decision,
  teaser,
  recoverOnceQuote,
  isRecoverOnceQuoteLoading,
  onReviewRecoverOnce,
  onReviewWorkspace,
  reportUploadHref,
}: CommercialRecommendationProps) {
  if (teaser.syntheticTraining) return null;

  const kind = getRecommendationKind(decision);
  const reason = decision?.reason;
  const recheckDate = formatAuditDate(decision?.nextEligibleAt || null);
  const recurring = decision?.comparison?.recurring_burden === true;
  const quoteReady = recoverOnceQuote?.status === 'available' || recoverOnceQuote?.status === 'accepted';

  const frame = 'mt-6 rounded-[10px] border border-[#D7D7D1] bg-[#F4F3ED] p-4 sm:p-5';
  const headingClass = 'mt-1 font-lora text-[25px] font-normal leading-tight tracking-[-0.02em] text-[#191B20]';
  const bodyClass = 'mt-2 max-w-2xl text-[13px] leading-5 text-[#595E68]';

  if (kind === 'recover_once') {
    const manualReview = recoverOnceQuote?.status === 'manual_review_required';
    return (
      <section className={frame} aria-labelledby="commercial-recommendation-title">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#0E766C]" aria-hidden="true" />
          <div>
            <p className="text-[12px] font-semibold text-[#595E68]">Recommended next step</p>
            <h2 id="commercial-recommendation-title" className={headingClass}>Review a fixed Recover Once scope.</h2>
            <p className={bodyClass}>Margin identified an evidence-supported, bounded recovery scope in this audit. Review the recorded scope and one generated quote before deciding whether to continue to checkout.</p>
          </div>
        </div>
        <EvidenceFacts teaser={teaser} decision={decision} />
        <div className="mt-4 rounded-[10px] border border-[#E8E7E1] bg-white p-4">
          <p className="text-[12px] font-semibold text-[#191B20]">Why this is recommended</p>
          <p className="mt-1 text-[13px] leading-5 text-[#595E68]">{reason || 'Margin recorded a one-time recovery route from the available audit evidence.'}</p>
          <p className="mt-3 text-[12px] leading-5 text-[#595E68]">This is a review of potential recovery work. It does not prove reimbursement, authorize filing, or confirm payment.</p>
        </div>
        {manualReview ? (
          <div className="mt-4 rounded-[10px] border border-amber-300 bg-amber-50 p-4 text-[13px] leading-5 text-amber-900">
            <p className="font-semibold">A fixed quote cannot be issued automatically yet.</p>
            <p className="mt-1">{recoverOnceQuote.manual_review_reason || 'The recorded scope needs additional evidence or manual assessment before a fixed quote can be finalized.'}</p>
            <p className="mt-2">Review the recorded evidence or add supported Amazon reports. Margin has not opened a recovery engagement.</p>
            <EvidenceActions reportUploadHref={reportUploadHref} />
          </div>
        ) : (
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[12px] font-medium text-[#595E68]">{isRecoverOnceQuoteLoading ? 'Preparing the generated quote from this recorded scope.' : quoteReady ? 'Your generated quote is ready to inspect before checkout.' : 'A fixed quote is not available for checkout yet.'}</p>
            </div>
            <Button onClick={onReviewRecoverOnce} disabled={!quoteReady || isRecoverOnceQuoteLoading} className="h-10 shrink-0 rounded-[10px] bg-[#3F51A8] px-4 text-[13px] font-semibold text-white shadow-none hover:bg-[#31418D] disabled:bg-[#A5A7A3]">
              {isRecoverOnceQuoteLoading ? 'Preparing quote' : quoteReady ? 'Review fixed recovery' : 'Quote unavailable'} <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}
      </section>
    );
  }

  if (kind === 'workspace') {
    return (
      <section className={frame} aria-labelledby="commercial-recommendation-title">
        <div className="flex items-start gap-3">
          <RefreshCw className="mt-0.5 h-5 w-5 shrink-0 text-[#3F51A8]" aria-hidden="true" />
          <div>
            <p className="text-[12px] font-semibold text-[#595E68]">Recommended next step</p>
            <h2 id="commercial-recommendation-title" className={headingClass}>Review Recovery Workspace for ongoing recovery work.</h2>
            <p className={bodyClass}>Margin recorded an ongoing recovery or control workload rather than only a single isolated recovery decision. Review why continuous monitoring is recommended before checkout.</p>
          </div>
        </div>
        <EvidenceFacts teaser={teaser} decision={decision} />
        <div className="mt-4 rounded-[10px] border border-[#E8E7E1] bg-white p-4">
          <p className="text-[12px] font-semibold text-[#191B20]">Why this is recommended</p>
          <p className="mt-1 text-[13px] leading-5 text-[#595E68]">{reason || 'Margin recorded ongoing recovery work that is better handled through continuous monitoring.'}</p>
          {recurring ? <p className="mt-2 text-[12px] leading-5 text-[#595E68]">The recorded audit comparison indicates continuing recovery work across the available audit record.</p> : null}
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-[12px] leading-5 text-[#595E68]">Review what the Workspace coordinates, the seller-approval boundary, and the monthly billing disclosure before continuing to checkout.</p>
          <Button onClick={onReviewWorkspace} className="h-10 shrink-0 rounded-[10px] bg-[#3F51A8] px-4 text-[13px] font-semibold text-white shadow-none hover:bg-[#31418D]">Review Recovery Workspace <ArrowRight className="ml-2 h-4 w-4" /></Button>
        </div>
      </section>
    );
  }

  if (kind === 'talk_to_sales') {
    return (
      <section className={frame} aria-labelledby="commercial-recommendation-title">
        <div className="flex items-start gap-3">
          <MessagesSquare className="mt-0.5 h-5 w-5 shrink-0 text-[#3F51A8]" aria-hidden="true" />
          <div>
            <p className="text-[12px] font-semibold text-[#595E68]">Recommended next step</p>
            <h2 id="commercial-recommendation-title" className={headingClass}>Talk to Sales about a recovery-control engagement.</h2>
            <p className={bodyClass}>Margin recorded an ongoing or more complex recovery workload. A specialist can understand the operating context and confirm the right scope before any commercial commitment.</p>
          </div>
        </div>
        <EvidenceFacts teaser={teaser} decision={decision} />
        <div className="mt-4 rounded-[10px] border border-[#E8E7E1] bg-white p-4">
          <p className="text-[12px] font-semibold text-[#191B20]">Why this is recommended</p>
          <p className="mt-1 text-[13px] leading-5 text-[#595E68]">{reason || 'The recorded audit indicates ongoing recovery-control work that needs a scoped conversation.'}</p>
          <p className="mt-2 text-[12px] leading-5 text-[#595E68]">This is a sales conversation, not an automatic purchase or a promise of recovery.</p>
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-[12px] leading-5 text-[#595E68]">Talk to Sales about larger, complex, or multi-account requirements. No payment is collected from this route.</p>
          <Button asChild className="h-10 shrink-0 rounded-[10px] bg-[#3F51A8] px-4 text-[13px] font-semibold text-white shadow-none hover:bg-[#31418D]">
            <Link to="/sales">Talk to Sales <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      </section>
    );
  }

  if (kind === 'evidence_remediation') {
    const missingSources = listSentence(decision?.evidenceBasis?.current?.sourcesUnavailable || teaser.sourcesUnavailable || []);
    return (
      <section className={frame} aria-labelledby="commercial-recommendation-title">
        <div className="flex items-start gap-3">
          <FilePlus2 className="mt-0.5 h-5 w-5 shrink-0 text-[#3F51A8]" aria-hidden="true" />
          <div>
            <p className="text-[12px] font-semibold text-[#595E68]">What happens next</p>
            <h2 id="commercial-recommendation-title" className={headingClass}>Additional evidence is needed before Margin can recommend a paid recovery route.</h2>
            <p className={bodyClass}>Margin cannot responsibly make a stronger commercial recommendation from this recorded audit yet. Adding supported Amazon reports can make the available recovery evidence more complete.</p>
          </div>
        </div>
        <EvidenceFacts teaser={teaser} decision={decision} />
        <div className="mt-4 rounded-[10px] border border-[#E8E7E1] bg-white p-4">
          <p className="text-[12px] font-semibold text-[#191B20]">Why this matters</p>
          <p className="mt-1 text-[13px] leading-5 text-[#595E68]">{reason || 'The audit does not contain enough usable evidence to establish a paid recovery recommendation.'}</p>
          {missingSources ? <p className="mt-2 text-[12px] leading-5 text-[#595E68]">Relevant evidence currently unavailable: {missingSources}.</p> : null}
        </div>
        <EvidenceActions reportUploadHref={reportUploadHref} />
        {recheckDate ? <p className="mt-4 text-[12px] leading-5 text-[#595E68]">The recorded audit indicates that a recheck may be appropriate on or after {recheckDate}; Margin is not promising an automatic review.</p> : null}
      </section>
    );
  }

  if (kind === 'nurture') {
    return (
      <section className={frame} aria-labelledby="commercial-recommendation-title">
        <div className="flex items-start gap-3">
          <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-800" aria-hidden="true" />
          <div>
            <p className="text-[12px] font-semibold text-[#595E68]">What this means</p>
            <h2 id="commercial-recommendation-title" className={headingClass}>Margin found items worth attention, but cannot route this audit into an automatic paid recovery path.</h2>
            <p className={bodyClass}>The current audit evidence or scope does not support an automatic Recover Once or Recovery Workspace recommendation. Review the recorded evidence and add supported information where available.</p>
          </div>
        </div>
        <EvidenceFacts teaser={teaser} decision={decision} />
        <div className="mt-4 rounded-[10px] border border-[#E8E7E1] bg-white p-4">
          <p className="text-[12px] font-semibold text-[#191B20]">Why Margin is not recommending a paid route yet</p>
          <p className="mt-1 text-[13px] leading-5 text-[#595E68]">{reason || 'The recorded evidence is not yet strong enough to support automatic commercial routing.'}</p>
          <p className="mt-2 text-[12px] leading-5 text-[#595E68]">This does not create a recovery engagement, open a case, or promise human review.</p>
        </div>
        <EvidenceActions reportUploadHref={reportUploadHref} />
        {recheckDate ? <p className="mt-4 text-[12px] leading-5 text-[#595E68]">The recorded audit indicates that a recheck may be appropriate on or after {recheckDate}; Margin is not promising an automatic review.</p> : null}
      </section>
    );
  }

  if (kind === 'no_sale') {
    const limitedCoverage = teaser.finalStatus === 'partial_no_findings' || teaser.finalStatus === 'partial_with_findings' || Boolean((decision?.evidenceBasis?.current?.sourcesUnavailable || teaser.sourcesUnavailable || []).length);
    return (
      <section className={frame} aria-labelledby="commercial-recommendation-title">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#595E68]" aria-hidden="true" />
          <div>
            <p className="text-[12px] font-semibold text-[#595E68]">Recommendation</p>
            <h2 id="commercial-recommendation-title" className={headingClass}>Margin does not currently recommend a paid recovery route from this audit.</h2>
            <p className={bodyClass}>{limitedCoverage ? 'The available evidence does not support a sufficiently reliable paid recovery recommendation. This is not a statement that no recovery opportunity exists.' : 'Margin reviewed the available audit activity and did not identify a current paid recovery route.'}</p>
          </div>
        </div>
        <EvidenceFacts teaser={teaser} decision={decision} />
        <div className="mt-4 rounded-[10px] border border-[#E8E7E1] bg-white p-4">
          <p className="text-[12px] font-semibold text-[#191B20]">Why this is the recommendation</p>
          <p className="mt-1 text-[13px] leading-5 text-[#595E68]">{reason || 'Margin did not identify a paid recovery route from the audit truth available today.'}</p>
        </div>
        {limitedCoverage ? <EvidenceActions reportUploadHref={reportUploadHref} /> : null}
        {recheckDate ? <p className="mt-4 text-[12px] leading-5 text-[#595E68]">The recorded audit indicates that a new audit may be appropriate on or after {recheckDate}. Margin is not promising an automatic review.</p> : null}
      </section>
    );
  }

  return (
    <section className={frame} aria-labelledby="commercial-recommendation-title">
      <div className="flex items-start gap-3">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#595E68]" aria-hidden="true" />
        <div>
          <p className="text-[12px] font-semibold text-[#595E68]">Recorded audit outcome</p>
          <h2 id="commercial-recommendation-title" className={headingClass}>Margin cannot recommend a paid recovery route from the recorded audit yet.</h2>
          <p className={bodyClass}>Margin is preserving the audit result rather than guessing from incomplete or unsupported commercial data. Review the available evidence or add supported Amazon reports before taking a recovery action.</p>
        </div>
      </div>
      <EvidenceFacts teaser={teaser} decision={decision} />
      <EvidenceActions reportUploadHref={reportUploadHref} />
    </section>
  );
}

export default CommercialRecommendation;
