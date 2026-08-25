import { AlertCircle, CheckCircle, Database, FileText, Info, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { CaseTruthTone, RecoveryTruthPresentation } from '@/lib/caseDetailTruthPresentation';

const NOT_AVAILABLE = 'Not available';

type SafetyState = 'yes' | 'no' | 'not_assessed' | string;

interface CaseDetailViewData {
  productName?: string | null;
  title?: string | null;
  sku?: string | null;
  asin?: string | null;
  fnsku?: string | null;
  facility?: string | null;
  warehouse?: string | null;
  created_at?: string | null;
  createdDate?: string | null;
  discovery_date?: string | null;
  updated_at?: string | null;
  identity_truth?: { fnsku?: { state?: string | null } | null } | null;
  evidence_summary?: { linked_document_count?: number | null; matched_document_count?: number | null; match_type?: string | null } | null;
  missing_requirements?: string[] | null;
  safety_evaluations?: {
    prior_reimbursement?: { state?: SafetyState | null } | null;
    inventory_adjustment?: { state?: SafetyState | null } | null;
    duplicate_claim?: { state?: SafetyState | null } | null;
  } | null;
}

interface SellerSummaryView {
  evidence_summary?: string | null;
}

interface PolicyBasisView {
  title?: string | null;
  summary?: string | null;
}

interface AccountingTruthView {
  status?: string | null;
  limitation?: string | null;
}

interface ClosureTruthView {
  state?: string | null;
  reason?: string | null;
}

interface SupportingDocumentView {
  id?: string | null;
  name?: string | null;
  filename?: string | null;
  title?: string | null;
  doc_type?: string | null;
  type?: string | null;
  matchType?: string | null;
}

const formatCurrency = (amount: number | null | undefined, currency = 'USD') => (
  typeof amount === 'number' && Number.isFinite(amount)
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)
    : NOT_AVAILABLE
);

const formatDate = (value?: string | null) => {
  if (!value) return NOT_AVAILABLE;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? NOT_AVAILABLE : date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
};

const formatStatus = (value?: string | null) => {
  const normalized = String(value || '').trim();
  return normalized ? normalized.replace(/[_-]+/g, ' ') : NOT_AVAILABLE;
};

const toneClasses: Record<CaseTruthTone, string> = {
  neutral: 'border-[#DCE8EE] bg-[#F7FAFC] text-[#182026]',
  attention: 'border-blue-200 bg-blue-50 text-blue-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-950',
  danger: 'border-red-200 bg-red-50 text-red-950',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-950',
};

const toneIconClasses: Record<CaseTruthTone, string> = {
  neutral: 'text-[#66737F]',
  attention: 'text-[#0B74DE]',
  warning: 'text-amber-700',
  danger: 'text-red-700',
  success: 'text-emerald-700',
};

function TruthSection({
  number,
  title,
  eyebrow,
  children,
}: {
  number: string;
  title: string;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[10px] border border-[#DCE8EE] bg-white p-4 shadow-[0_1px_2px_rgba(24,32,38,0.03)] sm:p-5">
      <div className="mb-4 flex items-start gap-3 border-b border-[#E7EEF2] pb-3">
        <span className="mt-0.5 inline-flex h-6 min-w-6 items-center justify-center rounded-md border border-[#DCE8EE] bg-[#F7FAFC] px-1 font-sans text-[10px] font-semibold text-[#66737F]">{number}</span>
        <div>
          <p className="text-[11px] font-medium tracking-tight text-[#66737F]">{eyebrow}</p>
          <h3 className="mt-0.5 font-lora text-[18px] font-normal tracking-tight text-[#182026]">{title}</h3>
        </div>
      </div>
      {children}
    </section>
  );
}

function TruthRow({
  label,
  value,
  detail,
  category,
}: {
  label: string;
  value: React.ReactNode;
  detail: string;
  category: string;
}) {
  return (
    <div className="border-b border-[#E7EEF2] py-3 last:border-b-0">
      <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div>
          <p className="text-[12px] font-medium tracking-tight text-[#182026]">{label}</p>
          <p className="mt-1 max-w-2xl text-[11px] leading-5 text-[#66737F]">{detail}</p>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:justify-end">
          <span className="text-[10px] font-medium uppercase tracking-tight text-[#8A97A2]">{category}</span>
          <span className="text-[13px] font-semibold tabular-nums tracking-tight text-[#182026]">{value}</span>
        </div>
      </div>
    </div>
  );
}

function Limitation({ title, children, tone = 'attention' }: { title: string; children: React.ReactNode; tone?: CaseTruthTone }) {
  return (
    <div className={cn('flex gap-3 border p-3', toneClasses[tone])}>
      <Info className={cn('mt-0.5 h-4 w-4 shrink-0', toneIconClasses[tone])} />
      <div>
        <p className="text-[12px] font-semibold tracking-tight">{title}</p>
        <p className="mt-1 text-[11px] leading-5 opacity-85">{children}</p>
      </div>
    </div>
  );
}

export interface RecoveryTruthRecordProps {
  caseData: CaseDetailViewData;
  tenantSlug?: string;
  truthPresentation: RecoveryTruthPresentation;
  requestedLanguage: { label: string; detail: string };
  accountingBoundary: { label: string; detail: string; prohibitedImplication: string };
  currency?: string;
  requestedAmount: number | null;
  estimatedClaimValue: number | null;
  approvedAmount: number | null;
  recordedPayoutAmount: number | null;
  verifiedPaidAmount: number | null;
  outstandingAmount: number | null;
  varianceAmount: number | null;
  trustedApproval: boolean;
  trustedPayout: boolean;
  hasResolvedBackend: boolean;
  hasSafetyBlock: boolean;
  hasUnassessedSafety: boolean;
  proofStatus?: string | null;
  payoutProofStatus?: string | null;
  filingStatus: string;
  filingTruthLine: string;
  nextStep?: { title?: string; description?: string } | null;
  sellerSummary?: SellerSummaryView | null;
  policyBasis?: PolicyBasisView | null;
  matchedDocuments: SupportingDocumentView[];
  inventory: {
    totalInput: number | null;
    totalOutput: number | null;
    calculatedStock: number | null;
    warehouseBalance: number | null;
    discrepancy: number | null;
  };
  findingNarrative: string;
  generatedNarrative: boolean;
  financialTruthLimitation?: string | null;
  accountingTruth?: AccountingTruthView | null;
  closureTruth?: ClosureTruthView | null;
  onOpenDocument?: (documentId: string) => void;
}

export function RecoveryTruthRecord({
  caseData,
  tenantSlug,
  truthPresentation,
  requestedLanguage,
  accountingBoundary,
  currency = 'USD',
  requestedAmount,
  estimatedClaimValue,
  approvedAmount,
  recordedPayoutAmount,
  verifiedPaidAmount,
  outstandingAmount,
  varianceAmount,
  trustedApproval,
  trustedPayout,
  hasResolvedBackend,
  hasSafetyBlock,
  hasUnassessedSafety,
  proofStatus,
  payoutProofStatus,
  filingStatus,
  filingTruthLine,
  nextStep,
  sellerSummary,
  policyBasis,
  matchedDocuments,
  inventory,
  findingNarrative,
  generatedNarrative,
  financialTruthLimitation,
  accountingTruth,
  closureTruth,
  onOpenDocument,
}: RecoveryTruthRecordProps) {
  const identityTruth = caseData?.identity_truth?.fnsku || null;
  const evidenceSummary = caseData?.evidence_summary || {};
  const missingRequirements = Array.isArray(caseData?.missing_requirements) ? caseData.missing_requirements : [];
  const safetyRows = [
    ['Prior reimbursement', caseData?.safety_evaluations?.prior_reimbursement?.state],
    ['Inventory adjustment', caseData?.safety_evaluations?.inventory_adjustment?.state],
    ['Duplicate claim', caseData?.safety_evaluations?.duplicate_claim?.state],
  ] as const;

  return (
    <div className="space-y-4">
      <section className={cn('rounded-[10px] border p-4 shadow-[0_1px_2px_rgba(24,32,38,0.03)] sm:p-5', toneClasses[truthPresentation.tone])}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={cn('border-current bg-white/70 text-[10px] font-semibold uppercase tracking-tight', toneIconClasses[truthPresentation.tone])}>E6 · Current conclusion</Badge>
              {!hasResolvedBackend && <Badge variant="outline" className="border-current bg-white/70 text-[10px] font-semibold uppercase tracking-tight">Awaiting verified case basis</Badge>}
            </div>
            <h2 className="mt-3 font-lora text-[24px] font-normal tracking-tight">{truthPresentation.label}</h2>
            <p className="mt-2 text-[13px] leading-6">{truthPresentation.explanation}</p>
          </div>
          <div className="max-w-xs border border-current/15 bg-white/60 p-3 text-[11px] leading-5">
            <p className="font-semibold uppercase tracking-tight">Claim boundary</p>
            <p className="mt-1 opacity-85">{truthPresentation.prohibitedImplication}</p>
          </div>
        </div>
      </section>

      <TruthSection number="01" title="Financial position" eyebrow="Observed, verified, derived, and constrained values are kept distinct">
        <div className="divide-y divide-[#E7EEF2]">
          <TruthRow label={requestedLanguage.label} value={formatCurrency(requestedAmount, currency)} detail={requestedLanguage.detail} category="Observed / requested" />
          <TruthRow label="Estimated recovery value" value={formatCurrency(estimatedClaimValue, currency)} detail="A calculated or estimated value. It is not approval, payment, or final closure." category="Derived" />
          <TruthRow label="Amazon-approved amount" value={trustedApproval ? formatCurrency(approvedAmount, currency) : NOT_AVAILABLE} detail={trustedApproval ? 'Approval is supported by filing and approval truth for this recovery.' : 'Approval has not been independently established from the current case record.'} category="Outcome" />
          <TruthRow label="Recorded payout" value={formatCurrency(recordedPayoutAmount, currency)} detail={recordedPayoutAmount === null ? 'No recorded payout is available.' : 'A recorded operational payout is not payment proof by itself.'} category="Observed / recorded" />
          <TruthRow label="Verified payment" value={trustedPayout ? formatCurrency(verifiedPaidAmount, currency) : NOT_AVAILABLE} detail={trustedPayout ? 'A matching financial event verifies this payment for the recovery.' : (financialTruthLimitation || 'Margin has not established a verified payment conclusion from the current financial evidence.')} category="Outcome" />
          <TruthRow label="Outstanding position" value={formatCurrency(outstandingAmount, currency)} detail={outstandingAmount === null ? 'A residual amount cannot be established until Margin has a valid payment target and reconciliation basis.' : 'This is a derived financial value; inspect the payment and closure conditions before treating it as final.'} category="Derived" />
          <TruthRow label="Variance" value={formatCurrency(varianceAmount, currency)} detail={varianceAmount === null ? 'Variance is not available until reconciliation establishes the necessary comparison values.' : 'This is a derived reconciliation value, not an independent payment fact.'} category="Derived" />
          <TruthRow label="Closure state" value={formatStatus(closureTruth?.state)} detail={closureTruth?.reason || 'No financial-closure conclusion has been established from the current record.'} category="Outcome" />
        </div>
      </TruthSection>

      <TruthSection number="02" title="Why Margin can currently conclude this" eyebrow="Conditions that establish or limit the current recovery judgment">
        <div className="grid gap-3 lg:grid-cols-2">
          {truthPresentation.conditions.length > 0 ? truthPresentation.conditions.map((condition) => (
            <div key={`${condition.label}-${condition.detail}`} className={cn('border p-3', toneClasses[condition.tone])}>
              <div className="flex items-center gap-2">
                {condition.tone === 'success' ? <CheckCircle className={cn('h-4 w-4', toneIconClasses[condition.tone])} /> : <AlertCircle className={cn('h-4 w-4', toneIconClasses[condition.tone])} />}
                <p className="text-[12px] font-semibold tracking-tight">{condition.label}</p>
                <span className="ml-auto text-[9px] font-medium uppercase tracking-tight opacity-70">{condition.category}</span>
              </div>
              <p className="mt-2 text-[11px] leading-5 opacity-85">{condition.detail}</p>
            </div>
          )) : (
            <Limitation title="No authoritative condition is available">
              Margin cannot establish the current recovery judgment until verified case truth is available.
            </Limitation>
          )}
        </div>
      </TruthSection>

      <TruthSection number="03" title="Proof record" eyebrow="Claim → establishing fact → relationship → proof → limitation">
        <div className="grid gap-3 lg:grid-cols-2">
          <div className="border border-[#DCE8EE] bg-[#F7FAFC] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-tight text-[#66737F]">Audit finding</p>
            <p className="mt-2 text-[13px] font-semibold leading-5 tracking-tight text-[#182026]">{findingNarrative || NOT_AVAILABLE}</p>
            {generatedNarrative && <p className="mt-2 text-[10px] leading-5 text-[#66737F]">This is generated explanatory context from the current case fields; it is not independent evidence or outcome proof.</p>}
          </div>
          <div className="border border-[#DCE8EE] bg-white p-4">
            <p className="text-[10px] font-semibold uppercase tracking-tight text-[#66737F]">Evidence relationship</p>
            <p className="mt-2 text-[13px] font-semibold leading-5 tracking-tight text-[#182026]">{sellerSummary?.evidence_summary || `${evidenceSummary?.linked_document_count ?? evidenceSummary?.matched_document_count ?? 0} linked document(s) are available for this recovery record.`}</p>
            <p className="mt-2 text-[11px] leading-5 text-[#66737F]">Match basis: {evidenceSummary?.match_type ? String(evidenceSummary.match_type).replace(/_/g, ' ') : NOT_AVAILABLE}</p>
          </div>
          <div className="border border-[#DCE8EE] bg-white p-4">
            <p className="text-[10px] font-semibold uppercase tracking-tight text-[#66737F]">Evidence sufficiency</p>
            <p className="mt-2 text-[13px] font-semibold leading-5 tracking-tight text-[#182026]">Proof status: {proofStatus ? formatStatus(proofStatus) : NOT_AVAILABLE}</p>
            <p className="mt-2 text-[11px] leading-5 text-[#66737F]">{missingRequirements.length ? `Still required: ${missingRequirements.join(', ')}.` : 'No missing evidence requirements are recorded for the current decision.'}</p>
          </div>
          <div className="border border-[#DCE8EE] bg-white p-4">
            <p className="text-[10px] font-semibold uppercase tracking-tight text-[#66737F]">Filing and payment proof</p>
            <p className="mt-2 text-[13px] font-semibold leading-5 tracking-tight text-[#182026]">Filing: {filingStatus}</p>
            <p className="mt-2 text-[11px] leading-5 text-[#66737F]">{filingTruthLine}</p>
            <p className="mt-2 text-[11px] leading-5 text-[#66737F]">Payment proof: {payoutProofStatus ? formatStatus(payoutProofStatus) : NOT_AVAILABLE}</p>
          </div>
        </div>
        <div className="mt-4 border-t border-[#E7EEF2] pt-4">
          <p className="text-[10px] font-semibold uppercase tracking-tight text-[#66737F]">Policy basis</p>
          <p className="mt-2 text-[13px] font-semibold tracking-tight text-[#182026]">{policyBasis?.title || 'Policy basis pending verification'}</p>
          <p className="mt-1 text-[11px] leading-5 text-[#66737F]">{policyBasis?.summary || 'Margin has not established a curated policy reference for this recovery record.'}</p>
        </div>
      </TruthSection>

      <TruthSection number="04" title="Limitations and safeguards" eyebrow="What Margin has not established and therefore will not imply">
        <div className="space-y-3">
          {identityTruth?.state === 'conflicted' && <Limitation title="Observed FNSKU values conflict" tone="warning">Margin cannot use an FNSKU to independently confirm this product relationship from the current record.</Limitation>}
          {identityTruth?.state === 'unavailable' && <Limitation title="FNSKU unavailable">Margin cannot use an FNSKU to independently confirm this product relationship from the current record.</Limitation>}
          {hasSafetyBlock && <Limitation title="Action paused by a safety signal" tone="warning">A duplicate, prior reimbursement, or inventory adjustment signal must be reconciled before Margin can safely proceed.</Limitation>}
          {hasUnassessedSafety && <Limitation title="Safety checks not assessed">Margin has not established whether every prior reimbursement, inventory adjustment, or duplicate-claim risk is clear. This is not the same as “no issue.”</Limitation>}
          <Limitation title={accountingBoundary.label}>{accountingBoundary.detail}</Limitation>
          {financialTruthLimitation && <Limitation title="Financial truth boundary">{financialTruthLimitation}</Limitation>}
          {!identityTruth?.state && !hasSafetyBlock && !hasUnassessedSafety && !financialTruthLimitation && <Limitation title="No additional limitation is available">Margin will only draw conclusions from the evidence and truth fields available on this record.</Limitation>}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {safetyRows.map(([label, state]) => (
            <div key={label} className="border border-[#DCE8EE] bg-[#F7FAFC] p-3">
              <p className="text-[10px] font-medium uppercase tracking-tight text-[#66737F]">{label}</p>
              <p className="mt-2 text-[12px] font-semibold tracking-tight text-[#182026]">{state ? formatStatus(state) : 'Not assessed'}</p>
            </div>
          ))}
        </div>
      </TruthSection>

      <TruthSection number="05" title="What happens next" eyebrow="The next action is separate from the recovery conclusion">
        <div className="border border-[#DCE8EE] bg-[#F7FAFC] p-4">
          <p className="text-[13px] font-semibold tracking-tight text-[#182026]">{nextStep?.title || 'No next step has been established'}</p>
          <p className="mt-2 max-w-3xl text-[12px] leading-5 text-[#66737F]">{nextStep?.description || 'Margin cannot state a next action until the current case truth is available.'}</p>
        </div>
      </TruthSection>

      <TruthSection number="06" title="Record detail" eyebrow="Identity, time, calculation, and provenance for inspection">
        <div className="grid gap-x-8 gap-y-4 md:grid-cols-2 xl:grid-cols-3">
          <TruthRow label="Product" value={caseData?.productName || caseData?.title || NOT_AVAILABLE} detail="Normalized product context from the current case record." category="Normalized" />
          <TruthRow label="SKU / ASIN" value={`${caseData?.sku || '-'} / ${caseData?.asin || '-'}`} detail="Product identifiers used in the recorded relationship chain." category="Identity" />
          <TruthRow label="FNSKU" value={caseData?.fnsku || NOT_AVAILABLE} detail={identityTruth?.state === 'conflicted' ? 'Observed values conflict; this is not treated as an authoritative identity match.' : identityTruth?.state === 'unavailable' ? 'No observed FNSKU is available in the case evidence.' : 'Observed or normalized from the current case evidence.'} category="Identity" />
          <TruthRow label="Facility" value={caseData?.facility || caseData?.warehouse || NOT_AVAILABLE} detail="Fulfillment location associated with the current record." category="Source fact" />
          <TruthRow label="Issue identified" value={formatDate(caseData?.created_at || caseData?.createdDate || caseData?.discovery_date)} detail="When Margin recorded or discovered this condition; this is not necessarily the Amazon event date." category="Temporal" />
          <TruthRow label="Last case update" value={formatDate(caseData?.updated_at)} detail="When the current case record was last updated; this is not source-data freshness by itself." category="Temporal" />
        </div>
        <div className="mt-5 border-t border-[#E7EEF2] pt-4">
          <p className="text-[10px] font-semibold uppercase tracking-tight text-[#66737F]">Inventory calculation</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <TruthRow label="Observed input" value={inventory.totalInput ?? NOT_AVAILABLE} detail="Movement total from the current inventory evidence." category="Source / normalized" />
            <TruthRow label="Observed output" value={inventory.totalOutput ?? NOT_AVAILABLE} detail="Movement total from the current inventory evidence." category="Source / normalized" />
            <TruthRow label="Expected stock" value={inventory.calculatedStock ?? NOT_AVAILABLE} detail="Calculated from the linked movement records." category="Derived" />
            <TruthRow label="Warehouse balance" value={inventory.warehouseBalance ?? NOT_AVAILABLE} detail="Recorded warehouse balance for the available source scope." category="Source / normalized" />
            <TruthRow label="Inventory discrepancy" value={inventory.discrepancy === null ? NOT_AVAILABLE : `${inventory.discrepancy} units`} detail="A derived inventory difference; it is not, by itself, a confirmed loss or recoverable amount." category="Derived" />
          </div>
        </div>
      </TruthSection>

      <TruthSection number="07" title="Supporting documents" eyebrow="Artifacts that support observations, relationships, and action proof">
        {matchedDocuments.length > 0 ? (
          <div className="divide-y divide-[#E7EEF2] border border-[#DCE8EE]">
            {matchedDocuments.map((document, index: number) => {
              const documentId = String(document?.id || '').trim();
              const label = String(document?.name || document?.filename || document?.title || `Evidence document ${index + 1}`);
              const type = String(document?.doc_type || document?.type || document?.matchType || 'Evidence').replace(/[_-]+/g, ' ');
              return (
                <div key={documentId || `${label}-${index}`} className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[#66737F]" />
                    <div>
                      <p className="truncate text-[12px] font-semibold tracking-tight text-[#182026]" title={label}>{label}</p>
                      <p className="mt-1 text-[11px] leading-5 text-[#66737F]">Artifact type: {type}. Its role is inspectable supporting evidence, not automatic proof of every case conclusion.</p>
                    </div>
                  </div>
                  {documentId && onOpenDocument ? (
                    <Button type="button" variant="outline" size="sm" className="h-7 shrink-0 border-[#D8E3E8] bg-white text-[11px] text-[#4D5B66]" onClick={() => onOpenDocument(documentId)}>Inspect</Button>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-start gap-3 border border-dashed border-[#D8E3E8] bg-[#F8FAFB] p-4">
            <Database className="mt-0.5 h-4 w-4 text-[#8A97A2]" />
            <p className="text-[11px] leading-5 text-[#66737F]">No linked evidence artifacts are available on this record. Margin must not imply evidence sufficiency from document count alone.</p>
          </div>
        )}
        {tenantSlug ? <p className="mt-3 text-[10px] text-[#8A97A2]">Documents open in the current tenant workspace for inspection.</p> : null}
      </TruthSection>
    </div>
  );
}

export default RecoveryTruthRecord;
