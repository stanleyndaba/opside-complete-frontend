import React, { useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { RefreshCw, Search, ChevronRight, X } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';

import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle 
} from '@/components/ui/sheet';
import { useTenant } from '@/contexts/TenantContext';
import { api } from '@/lib/api';
import { normalizeTenantSlug, tenantRoute } from '@/lib/routes';
import { cn } from '@/lib/utils';

type QueueRow = NonNullable<Awaited<ReturnType<typeof api.getDisputeCaseQueue>>['data']>['rows'][number];
type AppealMode = 'all' | 'denied' | 'underpaid' | 'ready' | 'needs_rebuild';
type AppealTone = 'ready' | 'strengthen' | 'blocked';

type AppealCandidate = QueueRow & {
  appealGap: number;
  appealState: 'denied' | 'underpaid';
  appealReasonText: string;
  policyAngle: string;
  strengthScore: number;
  strengthTone: AppealTone;
  strengthLabel: string;
  nextStep: string;
};

type AppealProgressSnapshot = {
  label: 'Detected' | 'Evidence' | 'Filed' | 'Amazon response';
  toneClass: string;
};

const PAGE_SIZE = 10;

const money = (value: number | null | undefined, currency = 'USD') =>
  value == null || Number.isNaN(value)
    ? 'Not available'
    : new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);

const label = (value: string | null | undefined) =>
  value ? value.replace(/[_-]+/g, ' ').trim().replace(/\b\w/g, (char) => char.toUpperCase()) : 'Not available';

const amount = (value: number | null | undefined) =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const normalize = (value: unknown) => String(value || '').trim().toLowerCase();

const hasFiledTruth = (row: QueueRow) =>
  row.has_filing_truth === true ||
  row.submission_proof?.proof_present === true ||
  Boolean(row.amazon_case_id || row.submission_proof?.amazon_case_id || row.submission_proof?.external_reference || row.submission_proof?.proof_reference);

const hasApprovalTruth = (row: QueueRow) =>
  row.has_approval_truth === true && hasFiledTruth(row);

const hasRejectionTruth = (row: QueueRow) =>
  row.has_rejection_truth === true && hasFiledTruth(row);

const hasAmazonResponseTruth = (row: QueueRow) =>
  row.has_amazon_response_truth === true && hasFiledTruth(row);

const isDenied = (status: string | null | undefined) =>
  ['rejected', 'denied', 'lost'].includes(String(status || '').trim().toLowerCase());

const lowballGap = (row: QueueRow) => {
  if (!hasApprovalTruth(row)) return 0;
  const requested = amount(row.requested_amount);
  const approved = amount(row.approved_amount);
  if (requested == null || approved == null || approved >= requested) return 0;
  return requested - approved;
};

const appealGap = (row: QueueRow) =>
  lowballGap(row) ||
  amount(row.requested_amount) ||
  (hasApprovalTruth(row) ? amount(row.approved_amount) : null) ||
  amount(row.expected_payout_amount) ||
  0;

const appealState = (row: QueueRow): AppealCandidate['appealState'] | null => {
  if (lowballGap(row) > 0) return 'underpaid';
  if (hasRejectionTruth(row) && isDenied(row.status)) return 'denied';
  if (hasRejectionTruth(row) && (row.rejection_reason || row.rejection_category)) return 'denied';
  return null;
};

const appealReason = (row: QueueRow, state: AppealCandidate['appealState'], isDemoTenant = false) => {
  if (state === 'underpaid') {
    return isDemoTenant
      ? 'Rejected because the shipment and inventory records do not confirm an eligible inbound discrepancy.'
      : 'Amazon approval is recorded below the requested claim value.';
  }
  if (state === 'denied') {
    return row.rejection_reason || 'Rejected because the shipment and inventory records do not confirm an eligible inbound discrepancy.';
  }
  if (row.rejection_reason) return row.rejection_reason;
  if (row.rejection_category) return label(row.rejection_category);
  return 'Amazon rejection is recorded for this submitted case, but no detailed response text is stored yet.';
};

const policyAngle = (row: QueueRow, state: AppealCandidate['appealState']) => {
  const reason = `${row.rejection_category || ''} ${row.rejection_reason || ''}`.toLowerCase();
  if (state === 'underpaid') {
    return 'Compare the recorded Amazon approval against the requested value, then verify invoice-backed unit cost before asking for correction.';
  }
  if (reason.includes('proof') || reason.includes('insufficient')) {
    return 'Add the exact missing proof Amazon asked for before any retry is treated as safe.';
  }
  if (reason.includes('value') || reason.includes('valuation')) {
    return 'Verify the documented cost basis and only challenge the valuation if the invoice trail supports it.';
  }
  if (reason.includes('duplicate') || reason.includes('already reimbursed')) {
    return 'Check case history and payout truth before challenging a duplicate or already-paid response.';
  }
  return 'Review the recorded Amazon response against the evidence trail before deciding whether retry is supportable.';
};

const assess = (row: QueueRow) => {
  let score = 35;
  const docs = Number(row.matched_document_count || 0);
  const proof = String(row.proof_status || '').toLowerCase();
  const missing = Array.isArray(row.missing_requirements) ? row.missing_requirements.length : 0;

  if (docs >= 3) score += 30;
  else if (docs >= 1) score += 18;
  if (proof === 'filing_ready') score += 20;
  else if (proof === 'manual_review') score += 10;
  if (row.rejection_reason || row.rejection_category) score += 10;
  if (!missing) score += 10;
  if (lowballGap(row) > 0) score += 8;
  score = Math.min(score, 96);

  if (score >= 80) {
    return { score, tone: 'ready' as AppealTone, label: 'Ready to review', nextStep: 'Review the Amazon response and confirm the support packet before retry.' };
  }
  if (docs > 0) {
    return { score, tone: 'strengthen' as AppealTone, label: 'Needs stronger proof', nextStep: 'Add the missing proof source before moving this back to filing.' };
  }
  return { score, tone: 'blocked' as AppealTone, label: 'Not retry-ready', nextStep: 'Do not retry yet. Link the required source records first.' };
};

const toneClass = (tone: AppealTone) =>
  tone === 'ready'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
    : tone === 'strengthen'
      ? 'border-blue-200 bg-blue-50 text-blue-700'
      : 'border-slate-200 bg-slate-50 text-slate-600';

const pushbackToneClass = (state: AppealCandidate['appealState']) =>
  state === 'underpaid'
    ? 'border-blue-200 bg-blue-50 text-blue-700'
    : 'border-rose-200 bg-rose-50 text-rose-700';

const truncate = (value: string, limit: number) =>
  value.length <= limit ? value : `${value.slice(0, limit).trimEnd()}...`;

const cleanAmazonResponse = (value: string | null | undefined) => {
  if (!value) return '';

  let text = String(value)
    .replace(/\r?\n+/g, ' ')
    .replace(/https?:\/\/\S+/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  const cutMarkers = [
    'MORE WAYS TO GET HELP',
    'Visit our Seller Forums',
    'Browse all Seller Help topics',
    'Please note: this e-mail was sent from',
    'Click here for yes:',
    'Click here for no:',
  ];

  const cutoff = cutMarkers.reduce((earliest, marker) => {
    const index = text.toLowerCase().indexOf(marker.toLowerCase());
    return index >= 0 && index < earliest ? index : earliest;
  }, text.length);

  text = text.slice(0, cutoff).trim();
  text = text.replace(/\s{2,}/g, ' ').trim();

  return text;
};

const proofNeedFor = (rawValue: string, row: AppealCandidate) => {
  const normalized = normalize(rawValue);
  const caseContext = normalize(`${row.case_type || ''} ${row.anomaly_type || ''} ${row.rejection_category || ''}`);
  const sourceRecord =
    caseContext.includes('inbound') || caseContext.includes('shipment') || caseContext.includes('warehouse') || caseContext.includes('transfer')
      ? 'shipment or receiving record tied to the units'
      : caseContext.includes('return') || caseContext.includes('refund')
        ? 'return, refund, or customer-order trail tied to the unit'
        : caseContext.includes('fee')
          ? 'fee event or settlement ledger entry tied to the charge'
          : 'invoice, inventory, shipment, return, or settlement record tied to this case';

  if (normalized === 'proof_snapshot') {
    return {
      title: 'Evidence decision snapshot',
      detail: 'Missing policy lane, quantity/value math, deadline check, and matched source links for this case.'
    };
  }

  if (normalized === 'supporting_document' || normalized === 'missing_evidence_links') {
    return {
      title: 'Linked source document',
      detail: `Link a ${sourceRecord}.`
    };
  }

  if (normalized === 'unit_cost_proof' || normalized === 'missing_unit_cost_proof') {
    return {
      title: 'Invoice unit-cost proof',
      detail: 'Link an invoice or supplier document showing unit cost for the SKU/FNSKU/ASIN.'
    };
  }

  if (normalized.startsWith('document_type:')) {
    const documentType = label(normalized.split(':')[1]);
    return {
      title: `Required document: ${documentType}`,
      detail: `Amazon response review needs a linked ${documentType.toLowerCase()} document before retry.`
    };
  }

  if (normalized.startsWith('document_family:')) {
    const family = normalized
      .split(':')[1]
      ?.split('|')
      .map(label)
      .join(' or ');
    return {
      title: family ? `Required document family: ${family}` : 'Required document family',
      detail: family ? `Link one of these document types: ${family}.` : 'Link the required document family before retry.'
    };
  }

  if (normalized.includes('quantity')) {
    return {
      title: 'Quantity movement proof',
      detail: 'Link records showing units sent, received, refunded, adjusted, or reimbursed.'
    };
  }

  if (normalized.includes('identifier')) {
    return {
      title: 'Verified case identifiers',
      detail: 'Add the SKU/FNSKU/ASIN, order ID, shipment ID, or Amazon case reference needed to support this case.'
    };
  }

  return {
    title: label(rawValue),
    detail: `Resolve this recorded blocker before retry: ${label(rawValue)}.`
  };
};

const proofNeeds = (row: AppealCandidate) =>
  (Array.isArray(row.missing_requirements) ? row.missing_requirements : [])
    .filter((value): value is string => Boolean(value))
    .map((value) => proofNeedFor(value, row));

const responsePreview = (row: AppealCandidate) => {
  const cleaned = cleanAmazonResponse(row.rejection_reason);
  const source = cleaned || row.appealReasonText;
  const sentences = source.split(/(?<=[.!?])\s+/).filter(Boolean);
  return truncate((sentences.slice(0, 2).join(' ') || source).trim(), 220);
};

const appealProgressTone = (label: AppealProgressSnapshot['label']) => {
  switch (label) {
    case 'Amazon response':
      return 'text-blue-600';
    case 'Filed':
      return 'text-blue-500';
    case 'Evidence':
      return 'text-slate-500';
    default:
      return 'text-slate-400';
  }
};

const getAppealProgressSnapshot = (row: AppealCandidate): AppealProgressSnapshot => {
  if (hasAmazonResponseTruth(row)) {
    return { label: 'Amazon response', toneClass: appealProgressTone('Amazon response') };
  }
  if (hasFiledTruth(row)) {
    return { label: 'Filed', toneClass: appealProgressTone('Filed') };
  }
  if (Number(row.matched_document_count || 0) > 0) {
    return { label: 'Evidence', toneClass: appealProgressTone('Evidence') };
  }
  return { label: 'Detected', toneClass: appealProgressTone('Detected') };
};

const reopenStateSummary = (row: AppealCandidate) =>
  row.strengthTone === 'ready'
    ? 'Enough support is linked to review this response without another evidence pass.'
    : row.strengthTone === 'strengthen'
      ? 'The case has a starting proof trail, but a stronger source should be added first.'
      : 'Required source records are missing, so retry should stay blocked.';

const missingProofSummary = (row: AppealCandidate) => {
  const missing = proofNeeds(row);
  const documentCount = Math.max(Number(row.matched_document_count || 0), 0);

  if (missing.length > 0) {
    return truncate(missing.slice(0, 2).map((item) => item.title).join(' + ') + (missing.length > 2 ? ` +${missing.length - 2} more` : ''), 90);
  }

  if (documentCount === 0) return 'No linked documents yet';
  if (documentCount === 1) return 'No missing proof recorded';
  return 'No missing proof recorded';
};

const evidenceRebuildSummary = (row: AppealCandidate) => {
  const missing = proofNeeds(row);
  const documentCount = Math.max(Number(row.matched_document_count || 0), 0);

  if (missing.length > 0) {
    return truncate(missing.slice(0, 2).map((item) => item.detail).join(' '), 160);
  }

  if (row.strengthTone === 'ready') return `${documentCount} linked source document${documentCount === 1 ? '' : 's'}; verify they match the Amazon response before retry.`;
  if (documentCount === 0) return 'Source records need to be reconnected first.';
  return 'One stronger proof source should be added before retry.';
};

const twoLineClampStyle = {
  display: '-webkit-box',
  WebkitLineClamp: 2,
  WebkitBoxOrient: 'vertical' as const,
  overflow: 'hidden',
};

export default function Appeals() {
  const navigate = useNavigate();
  const { tenantSlug } = useParams<{ tenantSlug?: string }>();
  const { tenant, isReady } = useTenant();
  const activeTenantSlug = normalizeTenantSlug(tenantSlug) || normalizeTenantSlug(tenant?.slug);

  const [rows, setRows] = useState<QueueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [mode, setMode] = useState<AppealMode>('all');
  const [rejectionCategory, setRejectionCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady || !activeTenantSlug) return;
    let cancelled = false;

    const fetchQueue = async () => {
      setLoading(true);
      try {
        const response = await api.getDisputeCaseQueue({}, activeTenantSlug);
        if (!cancelled) {
          if (response.ok && response.data) {
            setRows(response.data.rows);
            setError(null);
          } else {
            setError(response.error || 'Failed to load response queue');
          }
        }
      } catch (err) {
        if (!cancelled) setError('Network error loading appeals');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchQueue();
    return () => { cancelled = true; };
  }, [activeTenantSlug, isReady, refreshKey]);

  const candidates = useMemo(() => {
    const isDemo = activeTenantSlug === 'demo-workspace';
    return rows
      .filter((row) => hasAmazonResponseTruth(row))
      .map((row): AppealCandidate => {
        const state = appealState(row) || 'denied';
        return {
          ...row,
          appealGap: appealGap(row),
          appealState: state,
          appealReasonText: appealReason(row, state, isDemo),
          policyAngle: policyAngle(row, state),
          ...assess(row)
        };
      });
  }, [activeTenantSlug, rows]);

  const rejectionCategories = useMemo(() =>
    Array.from(new Set(candidates.map((c) => c.rejection_category).filter(Boolean) as string[])).sort(),
    [candidates]
  );

  const filtered = useMemo(() => {
    const query = normalize(search);
    return candidates.filter((row) => {
      const matchesMode =
        mode === 'all' ||
        (mode === 'denied' && row.appealState === 'denied') ||
        (mode === 'underpaid' && row.appealState === 'underpaid') ||
        (mode === 'ready' && row.strengthTone === 'ready') ||
        (mode === 'needs_rebuild' && row.strengthTone !== 'ready');

      const matchesCategory = rejectionCategory === 'all' || row.rejection_category === rejectionCategory;

      if (!query) return matchesMode && matchesCategory;

      const searchable = [
        row.case_number,
        row.amazon_case_id,
        row.store_name,
        row.sku,
        row.asin,
        row.order_id,
        row.rejection_reason,
        row.rejection_category,
        row.strengthLabel,
        row.nextStep
      ].join(' ');

      return matchesMode && matchesCategory && normalize(searchable).includes(query);
    });
  }, [candidates, mode, rejectionCategory, search]);

  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const summary = useMemo(() => ({
    totalGap: filtered.reduce((acc, row) => acc + row.appealGap, 0),
    needsProof: filtered.filter((row) => row.strengthTone !== 'ready').length,
    lastUpdatedAt: rows.reduce((acc, row) => {
      const date = row.updated_at ? new Date(row.updated_at).getTime() : 0;
      return date > acc ? date : acc;
    }, 0)
  }), [filtered, rows]);

  const selectedCase = useMemo(() =>
    candidates.find((c) => c.dispute_case_id === selectedCaseId),
    [candidates, selectedCaseId]
  );

  return (
    <PageLayout title="Appeals" noPadding>
      <div className="min-h-screen bg-[#FAFAF7] font-sans text-[#111827]">
        {/* Appeals context */}
        <div className="border-b border-[#DCE8EE] bg-[#FAFAF7] px-4 py-7 sm:px-6 lg:px-8 lg:py-8">
          <div className="mx-auto max-w-[1280px]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-[13px] font-medium tracking-tight text-[#66737F]">Response review</p>
                <h1 className="mt-1.5 font-lora text-[34px] font-normal leading-tight tracking-tight text-[#182026] sm:text-[38px]">Appeals</h1>
                <p className="mt-2.5 text-[14px] leading-6 text-[#66737F]">Review recorded Amazon responses, verify the evidence behind each decision, and decide whether resubmission is supportable.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {summary.lastUpdatedAt ? <p className="text-[12px] font-medium tracking-tight text-[#66737F]">Updated {formatDistanceToNow(new Date(summary.lastUpdatedAt), { addSuffix: true })}</p> : null}
                <Button onClick={() => setRefreshKey((c) => c + 1)} variant="outline" className="h-9 rounded-md border-[#DCE8EE] bg-white px-3 text-[13px] font-medium tracking-tight text-[#4D5B66] hover:bg-[#F7FAFC]">
                  <RefreshCw className={cn("mr-2 h-3.5 w-3.5", loading && "animate-spin")} />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Review summary */}
        <div className="border-b border-[#DCE8EE] bg-white px-4 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-[1280px] grid-cols-1 divide-y divide-[#E7EEF2] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="py-2.5 sm:pr-7">
              <p className="text-[12px] font-medium tracking-tight text-[#66737F]">Approval gap</p>
              <p className="mt-1 text-[18px] font-semibold tabular-nums tracking-tight text-[#182026]">{money(summary.totalGap)}</p>
              <p className="mt-0.5 text-[11px] leading-4 text-[#66737F]">Recorded requested value not yet reflected in Amazon approval.</p>
            </div>
            <div className="py-2.5 sm:px-7">
              <p className="text-[12px] font-medium tracking-tight text-[#66737F]">Needs proof</p>
              <p className="mt-1 text-[18px] font-semibold tabular-nums tracking-tight text-[#182026]">{summary.needsProof} case{summary.needsProof === 1 ? '' : 's'}</p>
              <p className="mt-0.5 text-[11px] leading-4 text-[#66737F]">Responses blocked until their required source evidence is linked.</p>
            </div>
            <div className="py-2.5 sm:pl-7">
              <p className="text-[12px] font-medium tracking-tight text-[#66737F]">Visible responses</p>
              <p className="mt-1 text-[18px] font-semibold tabular-nums tracking-tight text-[#182026]">{filtered.length} response{filtered.length === 1 ? '' : 's'}</p>
              <p className="mt-0.5 text-[11px] leading-4 text-[#66737F]">Matches the current search and review filters.</p>
            </div>
          </div>
        </div>

        {/* Appeal review table */}
        <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8">
          {/* Synthesis / Search Bar */}
          <div className="mb-8 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search case, SKU, order, or rejection reason..."
                className="h-12 w-full rounded-[10px] border border-[#E5E7EB] bg-white pl-11 pr-20 text-[14px] font-normal tracking-tight text-[#111827] outline-none transition focus:border-[#0B74DE] focus:ring-4 focus:ring-[#0B74DE]/5 shadow-sm"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md bg-[#F3F5F4] px-2 py-1 text-[10px] font-bold text-[#9CA3AF]">
                ⌘ K
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-[10px] border border-[#E5E7EB] bg-white p-1 shadow-sm">
                <div className="px-3 py-1.5 text-[12px] font-medium tracking-tight text-[#4D5B66]">State</div>
                <div className="h-4 w-px bg-[#E5E7EB]" />
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as AppealMode)}
                  className="bg-transparent px-3 py-1.5 text-[12px] font-semibold text-[#111827] outline-none"
                >
                  <option value="all">All responses</option>
                  <option value="denied">Denied only</option>
                  <option value="underpaid">Value gaps</option>
                  <option value="ready">Ready to review</option>
                  <option value="needs_rebuild">Needs proof</option>
                </select>
              </div>

              <div className="flex items-center gap-2 rounded-[10px] border border-[#E5E7EB] bg-white p-1 shadow-sm">
                <div className="px-3 py-1.5 text-[12px] font-medium tracking-tight text-[#4D5B66]">Reason</div>
                <div className="h-4 w-px bg-[#E5E7EB]" />
                <select
                  value={rejectionCategory}
                  onChange={(e) => setRejectionCategory(e.target.value)}
                  className="bg-transparent px-3 py-1.5 text-[12px] font-semibold text-[#111827] outline-none max-w-[160px]"
                >
                  <option value="all">All reasons</option>
                  {rejectionCategories.map((c) => (
                    <option key={c} value={c}>{label(c)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Appeal Ledger Table */}
          <div className="rounded-[10px] border border-[#E5E7EB] bg-white shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32">
                <RefreshCw className="h-8 w-8 animate-spin text-[#0B74DE] mb-4" />
                <p className="text-[14px] font-bold text-[#111827]">Analyzing verified responses...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left min-w-[1400px]">
                  <thead>
                    <tr className="border-b border-[#F3F5F4] bg-[#F9FAFB]">
                      <th className="px-6 py-4 text-[11px] font-bold tracking-tight text-[#9CA3AF]">Case</th>
                      <th className="px-6 py-4 text-[11px] font-bold tracking-tight text-[#9CA3AF]">Verified Response</th>
                      <th className="px-6 py-4 text-[11px] font-bold tracking-tight text-[#9CA3AF]">Review State</th>
                      <th className="px-6 py-4 text-[11px] font-bold tracking-tight text-[#9CA3AF]">Required Proof</th>
                      <th className="px-6 py-4 text-[11px] font-bold tracking-tight text-[#9CA3AF]">Review Basis</th>
                      <th className="px-6 py-4 text-[11px] font-bold tracking-tight text-[#9CA3AF]">Next Step</th>
                      <th className="w-12 px-6 py-4" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F3F5F4]">
                    {paged.map((row) => {
                      const progress = getAppealProgressSnapshot(row);
                      return (
                        <tr 
                          key={row.dispute_case_id}
                          onClick={() => setSelectedCaseId(row.dispute_case_id)}
                          className="group cursor-pointer transition-colors hover:bg-[#F3F5F4]/50 align-top"
                        >
                          <td className="px-6 py-6">
                            <div className="w-[280px] space-y-4">
                              <div className="space-y-1.5">
                                <p className="text-[14px] font-bold tracking-tight text-[#111827]">
                                  {row.case_number || row.claim_number || row.amazon_case_id || 'Response case'}
                                </p>
                                <p className="text-[12px] font-medium text-[#6B7280]">{row.store_name || 'Store unavailable'}</p>
                                <p className="text-[11px] font-medium tracking-tight text-[#9CA3AF]">
                                  {[row.order_id, row.sku, row.asin].filter(Boolean).join(' / ') || 'Identifiers unavailable'}
                                </p>
                                <div className="pt-1 flex items-center gap-1.5">
                                  <span className="text-[9px] font-bold tracking-tight text-[#D1D5DB]">Case progress:</span>
                                  <span className={cn("text-[10px] font-bold tracking-tight", progress.toneClass)}>{progress.label}</span>
                                </div>
                              </div>
                              
                              <div className="pt-4 border-t border-[#F3F5F4] space-y-2">
                                <p className="text-[10px] font-bold tracking-tight text-[#9CA3AF]">Amount at stake</p>
                                <div className="space-y-1">
                                  <div className="flex justify-between text-[12px]">
                                    <span className="text-[#9CA3AF]">Requested</span>
                                    <span className="font-semibold text-[#111827]">{money(row.requested_amount, row.currency)}</span>
                                  </div>
                                  <div className="flex justify-between text-[12px]">
                                    <span className="text-[#9CA3AF]">Amazon approval</span>
                                    <span className="font-semibold text-[#111827]">{money(hasApprovalTruth(row) ? row.approved_amount : 0, row.currency)}</span>
                                  </div>
                                  <div className="flex justify-between text-[12px]">
                                    <span className="text-[#9CA3AF]">Review gap</span>
                                    <span className={cn("font-bold", row.appealGap > 0 ? "text-[#111827]" : "text-[#9CA3AF]")}>
                                      {money(row.appealGap, row.currency)}
                                    </span>
                                  </div>
                                </div>
                                <p className="text-[10px] font-medium leading-relaxed text-[#9CA3AF]">
                                  {hasApprovalTruth(row)
                                    ? 'Approval value is shown only because filing and approval truth are recorded.'
                                    : 'No Amazon approval value is recorded for this response.'}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-6">
                            <div className="w-[300px] space-y-4">
                              <Badge variant="outline" className={cn("rounded-full px-2.5 py-0.5 text-[9px] font-bold tracking-tight border-transparent", pushbackToneClass(row.appealState))}>
                                {row.appealState === 'underpaid' ? 'Approved-value gap' : 'Denied response'}
                              </Badge>
                              <p className="text-[13px] font-semibold leading-relaxed tracking-tight text-[#111827]" style={twoLineClampStyle}>
                                {responsePreview(row)}
                              </p>
                              <div className="flex flex-wrap items-center gap-3">
                                {row.rejection_category && (
                                <div className="text-[10px] font-medium tracking-tight text-[#66737F]">
                                  Reason: {label(row.rejection_category)}
                                </div>
                                )}
                                <button className="text-[10px] font-bold tracking-tight text-[#0B74DE] hover:underline">
                                  View source detail
                                </button>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-6">
                            <div className="w-[220px] space-y-4">
                              <Badge variant="outline" className={cn("rounded-full px-2.5 py-0.5 text-[9px] font-bold tracking-tight border-transparent", toneClass(row.strengthTone))}>
                                {row.strengthLabel}
                              </Badge>
                              <p className="text-[12px] font-bold tracking-tight text-[#111827]">{reopenStateSummary(row)}</p>
                              <p className="text-[11px] font-medium leading-relaxed text-[#6B7280]">
                                {row.strengthTone === 'ready'
                                  ? 'Support is strong enough to review without another evidence pass.'
                                  : row.strengthTone === 'strengthen'
                                    ? 'The support pack is close, but one stronger source should be added first.'
                                    : 'This case should not be retried until the required proof is linked.'}
                              </p>
                            </div>
                          </td>

                          <td className="px-6 py-6">
                            <div className="w-[240px] space-y-2">
                              <p className="text-[13px] font-bold tracking-tight text-[#111827]">{missingProofSummary(row)}</p>
                              <p className="text-[11px] font-medium leading-relaxed text-[#6B7280]">{evidenceRebuildSummary(row)}</p>
                            </div>
                          </td>

                          <td className="px-6 py-6">
                            <div className="w-[260px] space-y-2">
                              <p className="text-[13px] font-semibold leading-relaxed tracking-tight text-[#111827]" style={twoLineClampStyle}>
                                {row.policyAngle}
                              </p>
                              <div className="text-[10px] font-medium tracking-tight text-[#66737F]">
                                {row.updated_at ? `Updated ${formatDistanceToNow(new Date(row.updated_at), { addSuffix: true })}` : 'Update pending'}
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-6">
                            <div className="w-[200px] space-y-3">
                              <p className="text-[12px] font-bold leading-relaxed text-[#111827]">{row.nextStep}</p>
                              <Button className="h-8 w-full rounded-md bg-[#0B74DE] text-[12px] font-medium tracking-tight text-white shadow-none hover:bg-[#075EAF]">
                                Review response
                              </Button>
                            </div>
                          </td>

                          <td className="px-6 py-6">
                            <ChevronRight className="h-4 w-4 text-[#E5E7EB] group-hover:text-[#111827] group-hover:translate-x-0.5 transition-all" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            
            {!loading && filtered.length === 0 && (
              <div className="py-32 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#F3F5F4] text-[#9CA3AF]">
                  <Search className="h-6 w-6" />
                </div>
                <h3 className="text-[15px] font-bold text-[#111827]">No responses found</h3>
                <p className="mt-1 text-[13px] text-[#6B7280]">Adjust your filters to find verified Amazon responses.</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          <div className="mt-8 flex items-center justify-between border-t border-[#E5E7EB] pt-8">
            <p className="text-[12px] font-medium text-[#9CA3AF]">
              Page {page} of {totalPages || 1} — {filtered.length} responses visible
            </p>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                disabled={page === 1} 
                onClick={() => setPage(p => p - 1)}
                className="text-[12px] font-bold text-[#4B5563] hover:bg-[#F3F5F4]"
              >
                Previous
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                disabled={page === totalPages || totalPages === 0} 
                onClick={() => setPage(p => p + 1)}
                className="text-[12px] font-bold text-[#4B5563] hover:bg-[#F3F5F4]"
              >
                Next
              </Button>
            </div>
          </div>
        </div>

        {/* Case Detail Side-Sheet */}
        <Sheet open={!!selectedCaseId} onOpenChange={(open) => !open && setSelectedCaseId(null)}>
          <SheetContent side="right" className="w-full overflow-y-auto border-l border-[#DCE8EE] bg-white p-0 text-[#182026] sm:max-w-[620px]">
            {selectedCase && (
              <div className="flex min-h-full flex-col">
                <SheetHeader className="border-b border-[#DCE8EE] px-5 py-5 text-left sm:px-6">
                  <p className="text-[11px] font-medium tracking-tight text-[#66737F]">Response record</p>
                  
                  <SheetTitle className="mt-1 break-words font-lora text-[25px] font-normal leading-tight tracking-tight text-[#182026]">
                    {selectedCase.case_number || selectedCase.amazon_case_id}
                  </SheetTitle>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge variant="outline" className="rounded-md border-[#DCE8EE] bg-[#F7FAFC] px-2 py-0.5 text-[10px] font-medium tracking-tight text-[#4D5B66]">
                      {selectedCase.store_name}
                    </Badge>
                    <Badge variant="outline" className={cn("rounded-md border px-2 py-0.5 text-[10px] font-medium tracking-tight", pushbackToneClass(selectedCase.appealState))}>
                      {selectedCase.appealState === 'underpaid' ? 'Value Gap' : 'Denied'}
                    </Badge>
                  </div>
                </SheetHeader>

                <div className="flex-1 space-y-6 px-5 py-5 sm:px-6">
                  <div className="space-y-6 pb-3">
                    {/* Amazon Response Analysis */}
                    <section>
                      <h3 className="text-[12px] font-medium tracking-tight text-[#66737F]">Amazon response analysis</h3>
                      <div className="mt-2 rounded-md border border-[#DCE8EE] bg-[#F7FAFC] p-3.5">
                        <p className="text-[13px] leading-5 text-[#182026]">
                          {selectedCase.rejection_reason || selectedCase.appealReasonText}
                        </p>
                        {selectedCase.rejection_category && (
                          <p className="mt-3 text-[12px] font-medium text-[#0B74DE]">Categorized as: {label(selectedCase.rejection_category)}</p>
                        )}
                      </div>
                    </section>

                    {/* Financial Variance */}
                    <section className="border-t border-[#E7EEF2] pt-5">
                      <div className="flex items-baseline justify-between gap-4">
                        <h3 className="text-[16px] font-semibold tracking-tight text-[#182026]">Financial variance</h3>
                        <p className="text-[11px] font-medium text-[#66737F]">Recorded Amazon decision</p>
                      </div>
                      <div className="mt-3 divide-y divide-[#E7EEF2] rounded-md border border-[#DCE8EE] bg-white sm:grid sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                        <div className="p-3">
                          <p className="text-[12px] font-medium tracking-tight text-[#66737F]">Requested value</p>
                          <p className="mt-1 text-[17px] font-semibold tabular-nums tracking-tight text-[#182026]">{money(selectedCase.requested_amount, selectedCase.currency)}</p>
                        </div>
                        <div className="p-3">
                          <p className="text-[12px] font-medium tracking-tight text-[#66737F]">Amazon approval</p>
                          <p className="mt-1 text-[17px] font-semibold tabular-nums tracking-tight text-[#182026]">{money(hasApprovalTruth(selectedCase) ? selectedCase.approved_amount : 0, selectedCase.currency)}</p>
                        </div>
                        <div className="bg-[#F6FAFE] p-3">
                          <p className="text-[12px] font-medium tracking-tight text-[#0B74DE]">Value still under review</p>
                          <p className="mt-1 text-[17px] font-semibold tabular-nums tracking-tight text-[#0B74DE]">{money(selectedCase.appealGap, selectedCase.currency)}</p>
                          <p className="mt-1 text-[11px] leading-4 text-[#66737F]">Difference between requested and recorded approval.</p>
                        </div>
                      </div>
                    </section>

                    {/* Complete review basis and recorded case truth */}
                    <section className="border-t border-[#E7EEF2] pt-5">
                      <h3 className="text-[16px] font-semibold tracking-tight text-[#182026]">Review basis and case record</h3>
                      <p className="mt-1 text-[12px] leading-5 text-[#66737F]">Recorded response, evidence state, and identifiers used to decide whether an appeal can move forward.</p>

                      <div className="mt-3 divide-y divide-[#E7EEF2] rounded-md border border-[#DCE8EE] bg-white">
                        <div className="p-3">
                          <p className="text-[12px] font-medium tracking-tight text-[#66737F]">Review basis</p>
                          <p className="mt-1.5 text-[13px] leading-5 text-[#182026]">{selectedCase.policyAngle}</p>
                        </div>
                        <div className="grid grid-cols-1 divide-y divide-[#E7EEF2] sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                          <div className="p-3">
                            <p className="text-[12px] font-medium tracking-tight text-[#66737F]">Amazon case ID</p>
                            <p className="mt-1 text-[13px] font-medium text-[#182026]">{selectedCase.amazon_case_id || 'Not available'}</p>
                          </div>
                          <div className="p-3">
                            <p className="text-[12px] font-medium tracking-tight text-[#66737F]">Recorded response</p>
                            <p className="mt-1 text-[13px] font-medium text-[#182026]">{selectedCase.updated_at ? `Updated ${formatDistanceToNow(new Date(selectedCase.updated_at), { addSuffix: true })}` : 'Update pending'}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 divide-y divide-[#E7EEF2] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                          <div className="p-3">
                            <p className="text-[12px] font-medium tracking-tight text-[#66737F]">Order</p>
                            <p className="mt-1 break-words text-[13px] font-medium text-[#182026]">{selectedCase.order_id || 'Not available'}</p>
                          </div>
                          <div className="p-3">
                            <p className="text-[12px] font-medium tracking-tight text-[#66737F]">SKU</p>
                            <p className="mt-1 break-words text-[13px] font-medium text-[#182026]">{selectedCase.sku || 'Not available'}</p>
                          </div>
                          <div className="p-3">
                            <p className="text-[12px] font-medium tracking-tight text-[#66737F]">ASIN</p>
                            <p className="mt-1 break-words text-[13px] font-medium text-[#182026]">{selectedCase.asin || 'Not available'}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 divide-y divide-[#E7EEF2] sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                          <div className="p-3">
                            <p className="text-[12px] font-medium tracking-tight text-[#66737F]">Filing and response truth</p>
                            <p className="mt-1 text-[13px] leading-5 text-[#182026]">{hasFiledTruth(selectedCase) ? 'Filing recorded' : 'Filing not recorded'} · {hasApprovalTruth(selectedCase) ? 'Approval recorded' : 'No approval recorded'} · {hasRejectionTruth(selectedCase) ? 'Rejection recorded' : 'No rejection recorded'}</p>
                          </div>
                          <div className="p-3">
                            <p className="text-[12px] font-medium tracking-tight text-[#66737F]">Evidence state</p>
                            <p className="mt-1 text-[13px] leading-5 text-[#182026]">{Math.max(Number(selectedCase.matched_document_count || 0), 0)} linked document{Math.max(Number(selectedCase.matched_document_count || 0), 0) === 1 ? '' : 's'} · {label(selectedCase.proof_status || 'not available')}</p>
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* Resubmission Readiness */}
                    <section className="border-t border-[#E7EEF2] pt-5">
                      <h3 className="text-[16px] font-semibold tracking-tight text-[#182026]">Resubmission readiness</h3>
                      <div className="mt-3 space-y-4">
                        <div className="border-l-2 border-[#66737F] pl-3">
                          <p className="text-[13px] font-medium text-[#182026]">{selectedCase.strengthLabel}</p>
                          <p className="mt-1 text-[12px] leading-5 text-[#66737F]">{reopenStateSummary(selectedCase)}</p>
                        </div>

                        <div className="space-y-3 rounded-md border border-[#DCE8EE] p-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[12px] font-bold text-[#111827]">Required Evidence</span>
                            <span className="text-[10px] font-bold text-[#9CA3AF] tracking-tight">{proofNeeds(selectedCase).length} Blockers</span>
                          </div>
                          <div className="space-y-3">
                            {proofNeeds(selectedCase).map((need, i) => (
                              <div key={i} className="flex items-start gap-3 border-t border-[#E7EEF2] pt-3 first:border-t-0 first:pt-0">
                                <span className="mt-0.5 text-[11px] font-medium tabular-nums text-[#66737F]">{String(i + 1).padStart(2, '0')}</span>
                                <div>
                                  <p className="text-[12px] font-medium text-[#182026]">{need.title}</p>
                                  <p className="mt-0.5 text-[11px] leading-4 text-[#66737F]">{need.detail}</p>
                                </div>
                              </div>
                            ))}
                            {proofNeeds(selectedCase).length === 0 && (
                              <p className="text-[12px] text-[#6B7280]">No missing evidence recorded for this case.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </section>

                    <section className="border-t border-[#E7EEF2] pt-5">
                      <h3 className="text-[16px] font-semibold tracking-tight text-[#182026]">Decision record</h3>
                      <div className="mt-3 rounded-md border border-[#DCE8EE] bg-[#F7FAFC] p-3">
                        <p className="text-[12px] font-medium tracking-tight text-[#66737F]">Next step</p>
                        <p className="mt-1.5 text-[14px] font-medium leading-5 text-[#182026]">{selectedCase.nextStep}</p>
                        <div className="mt-4 border-t border-[#E7EEF2] pt-4">
                          <p className="text-[12px] font-medium tracking-tight text-[#66737F]">Evidence rebuild guidance</p>
                          <p className="mt-1.5 text-[13px] leading-5 text-[#4D5B66]">{evidenceRebuildSummary(selectedCase)}</p>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>

                <div className="shrink-0 border-t border-[#DCE8EE] bg-white px-5 py-4 sm:px-6">
                  <div className="flex flex-col gap-2.5">
                    <Button variant="outline" className="h-10 w-full rounded-md border-[#DCE8EE] bg-white text-[13px] font-medium tracking-tight text-[#4D5B66] shadow-none hover:bg-[#F7FAFC]">
                      Initiate appeal review
                    </Button>
                    <Button variant="outline" className="h-10 w-full rounded-md border-[#DCE8EE] bg-white text-[13px] font-medium tracking-tight text-[#4D5B66] hover:bg-[#F7FAFC]">
                      View original case detail
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </PageLayout>
  );
}
