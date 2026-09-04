import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { tenantRoute } from '@/lib/routes';
import { useTenant } from '@/contexts/TenantContext';
import { AiExplanationContent } from '@/components/ai/AiExplanationContent';
import { Navbar } from '@/components/layout/Navbar';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  FileText, Link2, Search, Send, CircleDollarSign, Info, Mail, Cloud,
  ArrowRight, ArrowUp, ArrowDown, Plus, CheckCircle, RefreshCw, RotateCcw,
  Download, Bell, TrendingDown, TrendingUp, Loader2, X,
  ChevronDown, Clock, MoreVertical, Files
} from 'lucide-react';
import { api, detectionApi, buildApiUrl, type AutoFileGateStatus } from '@/lib/api';
import { recoveryApi } from '@/lib/recoveryApi';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { useNotifications } from '@/components/providers/NotificationsProvider';
import { SyncLogModal } from '@/components/modals/SyncLogModal';
import { format, formatDistanceToNow, formatDistanceToNowStrict } from 'date-fns';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { DisputeCasesTable } from '@/components/disputes/DisputeCasesTable';
import { EvidenceMatchingTable } from '@/components/evidence/EvidenceMatchingTable';
import { useAiExplanation } from '@/hooks/useAiExplanation';
import { useStatusStream, type StatusEvent } from '@/hooks/use-status-stream';

// Icon imports for document sources

// Helper to render bold text from "**text**" markdown
const renderNotificationMessage = (message: any) => {
  if (!message || typeof message !== 'string') return '';
  const parts = message.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-bold text-gray-700">{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
};

// Helper to strip emojis from text
const stripEmojis = (text: any) => {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{231A}-\u{231B}\u{23E9}-\u{23F3}\u{23F8}-\u{23FA}\u{25AA}-\u{25AB}\u{25B6}\u{25C0}\u{25FB}-\u{25FE}\u{2614}-\u{2615}\u{2648}-\u{2653}\u{267F}\u{2693}\u{26A1}\u{26AA}-\u{26AB}\u{26BD}-\u{26BE}\u{26C4}-\u{26C5}\u{26CE}\u{26D4}\u{26EA}\u{26F2}-\u{26F3}\u{26F5}\u{26FA}\u{26FD}\u{2702}\u{2705}\u{2708}-\u{270D}\u{270F}]/gu, '').trim();
};

interface DashboardBlocker {
  key: string;
  label: string;
  count: number;
  severity: 'low' | 'medium' | 'high';
}

interface DashboardSummary {
  detections_count: number;
  cases_count: number;
  filed_count: number;
  approved_count: number;
  recovered_count: number;
  billed_count: number;
  estimated_value_total: number;
  filed_value_total: number;
  approved_value_total: number;
  recovered_cash_total: number;
  billed_revenue_total: number;
  outstanding_amount?: number;
  last_payout_date?: string | null;
  payout_count?: number;
  last_updated_at: string;
  integrations_summary: {
    connected_count: number;
    stale_count: number;
    last_ingest_at: string | null;
  };
  evidence_summary: {
    total_documents: number;
    parsed_documents: number;
    matched_documents: number;
    failed_documents: number;
    needs_review_documents: number;
  };
  blockers: DashboardBlocker[];
}

interface LaunchMonitorMetrics {
  agent7_ready_count: number | null;
  agent7_duplicate_blocked_count: number | null;
  agent7_insufficient_data_count: number | null;
  agent7_thread_only_count: number | null;
  agent7_pending_safety_verification_count: number | null;
  agent7_filed_count: number | null;
  agent7_needs_evidence_count: number | null;
  agent7_approved_count: number | null;
  agent7_rejected_count: number | null;
  agent7_paid_count: number | null;
  unmatched_amazon_email_count: number | null;
  notification_failed_count: number | null;
  notification_partial_count: number | null;
}

interface LaunchMonitorAlert {
  key: 'duplicate_blocked_spike' | 'unmatched_amazon_email_spike' | 'notification_failure_present' | 'pending_safety_verification_backlog';
  label: string;
  severity: 'medium' | 'high';
  active: boolean | null;
  count: number | null;
  threshold: number | null;
  detail: string;
}

interface LaunchMonitorEvent {
  id: string;
  event_type: 'case_blocked' | 'case_filed' | 'amazon_thread_linked' | 'needs_evidence' | 'approved' | 'rejected' | 'paid' | 'notification_failed' | 'notification_partial' | 'unmatched_email_created';
  title: string;
  detail: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
  dispute_case_id: string | null;
  amazon_case_id: string | null;
  notification_id: string | null;
  source_table: 'dispute_cases' | 'dispute_submissions' | 'unmatched_case_messages' | 'notifications';
  source_id: string;
  status: string | null;
}

interface LaunchMonitorPayload {
  metrics: LaunchMonitorMetrics;
  alerts: LaunchMonitorAlert[];
  recent_events: LaunchMonitorEvent[] | null;
  last_updated_at: string | null;
}

const pluralize = (count: number, singular: string, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`;

const SYNC_SCOPED_DETECTION_RESULTS_LIMIT = 500;

const toTitleCase = (value: string) =>
  value.replace(/\w\S*/g, word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

const formatLaunchEventTypeLabel = (value: LaunchMonitorEvent['event_type']) =>
  toTitleCase(value.replace(/_/g, ' '));

const isTechnicalQueueDetail = (value?: string | null) => {
  const normalized = String(value || '').toLowerCase();
  return (
    normalized.includes('redis_quota_exceeded') ||
    normalized.includes('max requests limit exceeded') ||
    normalized.includes('upstash.com/docs/redis') ||
    normalized.includes('dispatch queue cannot safely accept more work')
  );
};

const normalizeIssueTypeKey = (value?: string | null) =>
  (value || '').toLowerCase().replace(/[:\-\s]+/g, '_').trim();

const formatIssueTypeLabel = (value?: string | null) => {
  if (!value) return 'Unknown issue';
  return toTitleCase(value.replace(/_/g, ' ').trim());
};

const ISSUE_COPY: Record<string, { title: string; summary: string; eventLabel: string }> = {
  reimbursement_duplicate_missed: {
    title: 'Duplicate Reimbursement Missing',
    summary: 'Amazon recorded duplicate reimbursement activity, but one expected reimbursement is missing from the settlement trail.',
    eventLabel: 'Reimbursement discrepancy',
  },
  damaged_warehouse: {
    title: 'Damaged in Warehouse',
    summary: 'Amazon marked inventory as damaged in the warehouse, but the matching reimbursement is missing or incomplete.',
    eventLabel: 'Warehouse damage discrepancy',
  },
  lost_warehouse: {
    title: 'Lost in Warehouse',
    summary: 'Amazon marked inventory as lost in the warehouse, but the matching reimbursement is missing or incomplete.',
    eventLabel: 'Warehouse loss discrepancy',
  },
  lost_inbound: {
    title: 'Lost at Inbound',
    summary: 'Amazon logged an inbound loss, but the expected reimbursement does not fully reconcile with the shipment outcome.',
    eventLabel: 'Inbound shipment discrepancy',
  },
  damaged_inbound: {
    title: 'Damaged at Inbound',
    summary: 'Amazon marked inbound inventory as damaged, but the related reimbursement does not fully reconcile.',
    eventLabel: 'Inbound shipment discrepancy',
  },
  carrier_claim: {
    title: 'Carrier Claim Mismatch',
    summary: 'Amazon reflects a carrier-related loss, but the corresponding reimbursement or adjustment is missing from settlement.',
    eventLabel: 'Carrier claim discrepancy',
  },
  carrierclaim: {
    title: 'Carrier Claim Mismatch',
    summary: 'Amazon reflects a carrier-related loss, but the corresponding reimbursement or adjustment is missing from settlement.',
    eventLabel: 'Carrier claim discrepancy',
  },
  customer_return: {
    title: 'Customer Return Mismatch',
    summary: 'Amazon received a customer return event, but the inventory, reimbursement, or settlement outcome does not reconcile.',
    eventLabel: 'Return discrepancy',
  },
  customerreturn: {
    title: 'Customer Return Mismatch',
    summary: 'Amazon received a customer return event, but the inventory, reimbursement, or settlement outcome does not reconcile.',
    eventLabel: 'Return discrepancy',
  },
  reimbursement_reversal: {
    title: 'Reimbursement Reversal Mismatch',
    summary: 'Amazon reversed a reimbursement, but the reversal does not line up with the underlying loss and settlement trail.',
    eventLabel: 'Reimbursement reversal discrepancy',
  },
  reimbursementreversal: {
    title: 'Reimbursement Reversal Mismatch',
    summary: 'Amazon reversed a reimbursement, but the reversal does not line up with the underlying loss and settlement trail.',
    eventLabel: 'Reimbursement reversal discrepancy',
  },
  partial_reimbursement: {
    title: 'Partial Reimbursement',
    summary: 'Amazon recognized the loss, but only part of the expected reimbursement was credited back.',
    eventLabel: 'Reimbursement discrepancy',
  },
  refund_no_return: {
    title: 'Refund Without Return',
    summary: 'Amazon refunded the order, but no matching return was received back into FBA.',
    eventLabel: 'Refund event discrepancy',
  },
  refundevent: {
    title: 'Refund Event Discrepancy',
    summary: 'Amazon posted a refund event, but the related return, charge, or settlement offset does not reconcile.',
    eventLabel: 'Refund event discrepancy',
  },
  refund_event: {
    title: 'Refund Event Discrepancy',
    summary: 'Amazon posted a refund event, but the related return, charge, or settlement offset does not reconcile.',
    eventLabel: 'Refund event discrepancy',
  },
  return_discrepancy: {
    title: 'Return Discrepancy',
    summary: 'Amazon recorded a return outcome that does not reconcile with the refund, restock, or settlement trail.',
    eventLabel: 'Return discrepancy',
  },
  return_not_restocked: {
    title: 'Return Not Restocked',
    summary: 'Amazon received the return, but the unit was not restocked or reimbursed correctly.',
    eventLabel: 'Return discrepancy',
  },
  refund_commission_error: {
    title: 'Refund Commission Error',
    summary: 'Amazon refunded the order, but the related commission adjustment does not reconcile with the refund trail.',
    eventLabel: 'Refund event discrepancy',
  },
  refund_exceeds_charge: {
    title: 'Refund Exceeds Charge',
    summary: 'Amazon refunded more than the original charge, or the settlement offset does not reconcile with the order total.',
    eventLabel: 'Refund event discrepancy',
  },
  refundcommission: {
    title: 'Refund Commission Mismatch',
    summary: 'Amazon posted a refund commission adjustment, but the commission reversal does not reconcile with the refund event.',
    eventLabel: 'Refund event discrepancy',
  },
  fba_inventory_reimbursement: {
    title: 'Inventory Reimbursement Mismatch',
    summary: 'Amazon posted an inventory reimbursement event that does not reconcile with the underlying unit loss or reimbursement amount.',
    eventLabel: 'Reimbursement discrepancy',
  },
  fbainventoryreimbursement: {
    title: 'Inventory Reimbursement Mismatch',
    summary: 'Amazon posted an inventory reimbursement event that does not reconcile with the underlying unit loss or reimbursement amount.',
    eventLabel: 'Reimbursement discrepancy',
  },
};

const getIssueCopy = (value?: string | null) => {
  const normalized = normalizeIssueTypeKey(value);
  const fallbackTitle = formatIssueTypeLabel(value);

  if (normalized && ISSUE_COPY[normalized]) {
    return ISSUE_COPY[normalized];
  }

  return {
    title: fallbackTitle,
    summary: 'Amazon activity for this finding does not reconcile with the expected reimbursement, return, or settlement trail.',
    eventLabel: 'Detected discrepancy',
  };
};

const ISSUE_LIFECYCLE_STATES = {
  detected: 'Detected',
  flagged: 'Flagged',
  identified: 'Identified',
  logged: 'Logged',
} as const;
const DEMO_WORKSPACE_SLUGS = new Set(['demo-workspace', 'demo-worspace']);
const DEMO_FINDINGS_TARGET_COUNT = 25;
const DEMO_FINDING_TIMESTAMPS = [
  '2026-04-17T06:24:00.000Z',
  '2026-04-16T11:42:00.000Z',
  '2026-03-28T15:18:00.000Z',
  '2026-03-21T09:07:00.000Z',
  '2026-03-18T13:36:00.000Z',
  '2026-03-14T07:51:00.000Z',
  '2026-03-11T16:09:00.000Z',
  '2026-03-07T10:28:00.000Z',
  '2026-03-02T14:55:00.000Z',
  '2026-02-26T08:19:00.000Z',
  '2026-02-22T12:47:00.000Z',
  '2026-02-18T17:12:00.000Z',
  '2026-02-13T09:33:00.000Z',
  '2026-02-09T15:44:00.000Z',
  '2026-02-04T07:58:00.000Z',
  '2026-01-30T13:21:00.000Z',
  '2026-01-26T10:06:00.000Z',
  '2026-01-21T16:37:00.000Z',
  '2026-01-17T08:48:00.000Z',
  '2026-01-12T14:16:00.000Z',
  '2026-01-08T11:04:00.000Z',
  '2026-01-03T15:52:00.000Z',
  '2025-12-29T09:41:00.000Z',
  '2025-12-22T13:29:00.000Z',
  '2025-12-18T07:35:00.000Z',
];
const DEMO_FINDING_REF_PREFIXES = ['ACM-LI', 'ACM-FD', 'ACM-DC', 'ACM-IR', 'ACM-RR', 'ACM-ST', 'ACM-IN', 'ACM-RT'];
const DEMO_FINDING_ANOMALIES = [
  'inbound_shipment_shortage',
  'incorrect_fee',
  'duplicate_charge',
  'missing_unit',
  'refund_no_return',
  'reimbursement_reversal',
  'lost_warehouse',
  'weight_fee_overcharge',
  'storage_overcharge',
  'return_not_restocked',
  'partial_reimbursement',
  'fulfillment_fee_error',
];
const DEMO_FINDING_STATUSES = ['detected', 'pending', 'ready_to_file', 'filed', 'reviewed'];
const DEMO_FINDING_MOVEMENTS = [
  {
    state: 'preview_finding',
    label: 'Preview finding',
    detail: 'Margin found this discrepancy. It has not been converted into a filing case yet.',
    next_action_label: 'View finding',
  },
  {
    state: 'preparing_case',
    label: 'Preparing case',
    detail: 'Identifiers and evidence are being reconciled before this moves into Amazon filing.',
    next_action_label: 'Review proof',
  },
  {
    state: 'ready_to_file',
    label: 'Evidence-ready',
    detail: 'Evidence and policy checks are aligned for the next justified recovery action.',
    next_action_label: 'Open filing review',
  },
  {
    state: 'filed',
    label: 'Filed',
    detail: 'Amazon review is open and Margin is watching response and payout movement.',
    next_action_label: 'Open case',
  },
  {
    state: 'blocked',
    label: 'Blocked',
    detail: 'Blocked: Margin is holding the case while duplicate or reimbursement proof is checked.',
    next_action_label: 'Review blocker',
    block_reasons: ['possible_duplicate'],
  },
];

const getIssueLifecycleStateLabel = (result: any) => {
  // FE-only display copy for the Issues Found table. Backend wiring can replace this later.
  const normalizedType = normalizeIssueTypeKey(result?.anomaly_type);
  const title = String(result?.seller_summary?.title || '').toLowerCase();
  const haystack = `${normalizedType} ${title}`;

  if (haystack.includes('refund')) return ISSUE_LIFECYCLE_STATES.identified;
  if (haystack.includes('fee') || haystack.includes('charge')) return ISSUE_LIFECYCLE_STATES.logged;
  if (haystack.includes('inbound') || haystack.includes('shortage') || haystack.includes('discrepancy')) return ISSUE_LIFECYCLE_STATES.flagged;
  if (haystack.includes('lost') || haystack.includes('missing_unit') || haystack.includes('warehouse')) return ISSUE_LIFECYCLE_STATES.detected;

  return ISSUE_LIFECYCLE_STATES.detected;
};

const isDemoWorkspaceSlug = (slug?: string | null) => DEMO_WORKSPACE_SLUGS.has(String(slug || '').toLowerCase());

const buildDemoFindingRef = (index: number) =>
  `${DEMO_FINDING_REF_PREFIXES[index % DEMO_FINDING_REF_PREFIXES.length]}-2604-${String(index + 1).padStart(4, '0')}`;

const formatFindingReference = (result: any, index: number) => {
  const directRef = String(result?.claim_number || result?.reference_id || result?.external_reference || '').trim();
  if (directRef && directRef !== '00000000') return directRef;

  const evidenceRef = String(
    result?.evidence?.shipment_id ||
    result?.evidence?.order_id ||
    result?.evidence?.amazon_order_id ||
    result?.filing_movement?.case_number ||
    ''
  ).trim();
  if (evidenceRef) return evidenceRef;

  return buildDemoFindingRef(index);
};

const withDemoFindingPresentation = (result: any, index: number) => {
  const timestamp = DEMO_FINDING_TIMESTAMPS[index % DEMO_FINDING_TIMESTAMPS.length];
  const daysRemaining = Math.max(7, 62 - (index * 3));
  return {
    ...result,
    claim_number: formatFindingReference(result, index),
    detected_at: timestamp,
    discovery_date: timestamp,
    created_at: timestamp,
    deadline_date: new Date(new Date(timestamp).getTime() + (daysRemaining * 86400000)).toISOString(),
    days_remaining: typeof result?.days_remaining === 'number' ? result.days_remaining : daysRemaining,
  };
};

const buildDemoFindingInvestigation = (result: any, index: number) => {
  const type = String(result?.anomaly_type || '').toLowerCase();
  const amount = Number(result?.estimated_value) || 0;
  const formatSyntheticAmount = (value: number) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: result?.currency || 'USD',
  }).format(value);
  const expected = Number((amount * 0.92).toFixed(2));
  const charge = Number((expected + amount).toFixed(2));
  const source = type.includes('storage')
    ? 'Amazon FBA Storage Fee'
    : type.includes('fee') || type.includes('fulfillment')
      ? 'Amazon FBA Fee Transaction'
      : type.includes('inbound') || type.includes('lost')
        ? 'Amazon FBA Inbound Shipment'
        : type.includes('refund') || type.includes('return')
          ? 'Amazon FBA Customer Returns'
          : 'Amazon FBA Settlement Activity';
  const policy = type.includes('storage')
    ? 'Storage fee exceeds the supported inventory-cost basis.'
    : type.includes('fee') || type.includes('fulfillment')
      ? 'Fee charged does not match the supported fee basis.'
      : type.includes('inbound') || type.includes('lost')
        ? 'Received quantity does not reconcile with shipped quantity.'
        : 'Settlement activity does not reconcile with the expected seller outcome.';
  const unresolved = index % 4 === 0
    ? 'Awaiting seller approval before the supported recovery action can be opened.'
    : index % 4 === 1
      ? 'Evidence is assembled; Margin is waiting for the filing gate to clear.'
      : index % 4 === 2
        ? 'Amazon response or payout confirmation is still outstanding.'
        : 'The initial outcome is incomplete and needs a final payout reconciliation.';

  return {
    amazonSource: `${source} · Settlement SETTLE-ACME-${String(index + 1).padStart(4, '0')}`,
    investigationStatus: 'Investigation complete',
    diagnosis: 'Margin connected the Amazon activity, seller records, and expected outcome to identify the recovery gap.',
    whyUnresolved: unresolved,
    analysis: {
      chargeApplied: formatSyntheticAmount(charge),
      expectedAmount: formatSyntheticAmount(expected),
      difference: formatSyntheticAmount(amount),
      policyRule: policy,
    },
    investigationTimeline: [
      'Amazon activity matched to the seller event',
      'Expected outcome compared with the recorded charge',
      'Evidence and policy checks completed',
    ],
  };
};

const expandDemoFindings = (results: any[]) => {
  const source = results.length ? results : [{}];
  const expanded = source.map(withDemoFindingPresentation);

  for (let index = expanded.length; index < DEMO_FINDINGS_TARGET_COUNT; index += 1) {
    const base = source[index % source.length] || {};
    const timestamp = DEMO_FINDING_TIMESTAMPS[index % DEMO_FINDING_TIMESTAMPS.length];
    const daysRemaining = Math.max(7, 62 - (index * 2));
    const anomalyType = DEMO_FINDING_ANOMALIES[index % DEMO_FINDING_ANOMALIES.length];
    const orderNumber = 42000 + index;
    const quantityGap = 2 + (index % 11);
    const status = DEMO_FINDING_STATUSES[index % DEMO_FINDING_STATUSES.length];
    const movement = DEMO_FINDING_MOVEMENTS[index % DEMO_FINDING_MOVEMENTS.length];

    expanded.push({
      ...base,
      id: `demo-finding-${String(index + 1).padStart(2, '0')}`,
      claim_number: buildDemoFindingRef(index),
      anomaly_type: anomalyType,
      severity: index % 4 === 0 ? 'high' : index % 3 === 0 ? 'low' : 'medium',
      estimated_value: Number((96 + ((index * 47.35) % 1280)).toFixed(2)),
      currency: base.currency || 'USD',
      confidence_score: Number((0.74 + ((index % 9) * 0.025)).toFixed(2)),
      status,
      detected_at: timestamp,
      discovery_date: timestamp,
      created_at: timestamp,
      deadline_date: new Date(new Date(timestamp).getTime() + (daysRemaining * 86400000)).toISOString(),
      days_remaining: daysRemaining,
      source_type: base.source_type || 'sp_api',
      review_tier: status === 'reviewed' ? 'review_only' : 'claim_candidate',
      claim_readiness: status === 'reviewed' ? 'not_claim_ready' : 'claim_ready',
      recommended_action: status === 'filed' ? 'monitor' : 'review',
      value_label: 'estimated_recovery',
      filing_movement: movement,
      evidence: {
        ...(base.evidence || {}),
        order_id: `113-${orderNumber}-${String(1000000 + index * 7919).slice(0, 7)}`,
        shipment_id: `FBA17ACME${String(index + 1).padStart(3, '0')}`,
        sku: `ACME-DEMO-SKU-${String(index + 1).padStart(2, '0')}`,
        asin: `B0ACME${String(index + 1).padStart(4, '0')}`,
        issue: `Demo discrepancy ${index + 1} queued for seller review`,
        quantity_shipped: 32 + (index * 3),
        quantity_received: 32 + (index * 3) - quantityGap,
        quantity_gap: quantityGap,
        missing_quantity: quantityGap,
        fulfillment_center: ['ONT8', 'LHR3', 'ABE8', 'FTW1', 'SBD1'][index % 5],
      },
    });
  }

  return expanded;
};

const buildDashboardDetectionMeta = (
  uploadSyncId: string | null,
  resultsMeta?: {
    syncId?: string;
    status?: 'pending' | 'processing' | 'completed' | 'failed';
    processedAt?: string | null;
    errorMessage?: string | null;
    isSandbox?: boolean;
  } | null,
  statusPayload?: {
    sync_id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    processed_at?: string | null;
    error_message?: string | null;
    is_sandbox?: boolean;
    results?: {
      claimsFound?: number;
      estimatedRecovery?: number;
    };
  } | null,
  total?: number | null
) => {
  if (!uploadSyncId && !resultsMeta && !statusPayload) return null;

  return {
    syncId: statusPayload?.sync_id || resultsMeta?.syncId || uploadSyncId || '',
    status: statusPayload?.status || resultsMeta?.status || 'pending',
    processedAt: statusPayload?.processed_at ?? resultsMeta?.processedAt ?? null,
    errorMessage: statusPayload?.error_message ?? resultsMeta?.errorMessage ?? null,
    isSandbox: statusPayload?.is_sandbox ?? resultsMeta?.isSandbox ?? false,
    claimsFound: typeof statusPayload?.results?.claimsFound === 'number'
      ? statusPayload.results.claimsFound
      : typeof total === 'number'
        ? total
        : null,
    estimatedRecovery: typeof statusPayload?.results?.estimatedRecovery === 'number'
      ? statusPayload.results.estimatedRecovery
      : null,
  };
};

const describeDashboardLiveSignal = (event: StatusEvent): string | null => {
  if (event.type === 'detection') {
    if (event.status === 'completed') return 'Findings refreshed';
    if (event.status === 'started' || event.status === 'created') return 'Detection started';
    return 'Detection updated';
  }

  if (event.type === 'case' || event.type === 'filing') {
    return 'Filing readiness updated';
  }

  if (event.type === 'evidence') {
    return 'Evidence status updated';
  }

  if (event.type === 'payout' || event.type === 'recovery' || event.type === 'billing') {
    return 'Recovery status updated';
  }

  if (event.type === 'sync') {
    return event.status === 'completed' ? 'Amazon sync completed' : 'Amazon sync updated';
  }

  if (event.type === 'notification') {
    return 'Notification activity updated';
  }

  return null;
};

const isProcessedFindingStatus = (status?: string | null) =>
  ['filed', 'resolved', 'converted'].includes((status || '').toLowerCase());

const isReadyToFileFinding = (result: any) => {
  const status = String(result?.status || '').toLowerCase();
  const movementState = String(result?.filing_movement?.state || '').toLowerCase();
  const eligibilityStatus = String(result?.filing_movement?.eligibility_status || '').toUpperCase();
  const filingStatus = String(result?.filing_movement?.filing_status || '').toLowerCase();

  if (status === 'ready_to_file' || movementState === 'ready_to_file') return true;
  return eligibilityStatus === 'READY' && ['pending', 'retrying', 'pending_approval'].includes(filingStatus);
};

const formatIssueStatusLabel = (status?: string | null) => {
  const normalized = (status || '').toLowerCase();

  switch (normalized) {
    case 'pending':
      return 'Pending review';
    case 'detected':
      return 'Under review';
    case 'filed':
      return 'With Amazon';
    case 'converted':
      return 'Evidence-ready';
    case 'resolved':
      return 'Closed';
    case 'ready_to_file':
      return 'Evidence-ready';
    default:
      return normalized ? toTitleCase(normalized.replace(/_/g, ' ')) : 'Needs review';
  }
};

const formatFindingReadinessLabel = (result: any) => {
  const tier = String(result?.review_tier || '').toLowerCase();
  const readiness = String(result?.claim_readiness || '').toLowerCase();
  if (tier === 'monitoring') return 'Monitoring';
  if (tier === 'review_only' || readiness === 'not_claim_ready') return 'Review only';
  return 'Claim candidate';
};

const formatFindingValueLabel = (result: any) => {
  const label = String(result?.value_label || 'estimated_recovery').toLowerCase();
  if (label === 'potential_exposure') return 'Potential exposure';
  if (label === 'no_recovery_value') return 'No recovery value';
  return 'Amount under review';
};

const cleanSellerText = (value?: unknown) => {
  const text = typeof value === 'string' ? value.trim() : '';
  return text.length ? text : null;
};

const normalizeBlockReasonKey = (value?: unknown) =>
  String(value || '').trim().toLowerCase();

const formatBlockReasonLabel = (reason?: unknown) => {
  const normalized = normalizeBlockReasonKey(reason);
  if (!normalized) return 'Filing hold';
  if (normalized.includes('review_only_detection_not_claim_ready')) return 'Review-only, not claim-ready';
  if (normalized.includes('duplicate')) return 'Possible duplicate';
  if (normalized.includes('already_reimbursed')) return 'Already reimbursed';
  if (normalized.includes('safety_hold')) return 'Safety hold';
  if (normalized.includes('thread_only')) return 'Thread-only case';
  if (normalized.includes('insufficient_data')) return 'Missing required evidence';
  if (normalized.includes('payment_required')) return 'Account setup required';
  if (normalized.includes('quarantined_dangerous_doc')) return 'Document safety hold';
  if (normalized.includes('redis_quota_exceeded')) return 'Filing queue paused';
  return toTitleCase(String(reason).replace(/[_-]+/g, ' '));
};

const getBlockReasonLabels = (reasons?: unknown) => {
  if (!Array.isArray(reasons)) return [];
  return Array.from(new Set(
    reasons
      .map(formatBlockReasonLabel)
      .filter(Boolean)
  ));
};

const getFindingBlockContext = (finding?: any, movementOverride?: any) => {
  if (!finding && !movementOverride) return null;
  const movement = movementOverride || finding?.filingMovement || finding?.filing_movement || null;
  const movementState = String(
    finding?.movementState
    || movement?.state
    || finding?.filing_movement?.state
    || ''
  ).toLowerCase();
  const rawReasons = [
    ...(Array.isArray(finding?.blockReasons) ? finding.blockReasons : []),
    ...(Array.isArray(movement?.block_reasons) ? movement.block_reasons : []),
    ...(Array.isArray(finding?.filing_movement?.block_reasons) ? finding.filing_movement.block_reasons : []),
  ];
  const labels = getBlockReasonLabels(rawReasons);
  const isBlocked = movementState === 'blocked' || rawReasons.length > 0;

  if (!isBlocked) return null;

  const whyNotClaimReady = cleanSellerText(
    finding?.whyNotClaimReady
    || finding?.why_not_claim_ready
    || finding?.evidence?.why_not_claim_ready
  );
  const normalizedReasons = rawReasons.map(normalizeBlockReasonKey);
  const hasReviewOnlyHold = normalizedReasons.some((reason) => reason.includes('review_only_detection_not_claim_ready'));
  const hasDuplicateHold = normalizedReasons.some((reason) => reason.includes('duplicate'));
  const hasAlreadyReimbursedHold = normalizedReasons.some((reason) => reason.includes('already_reimbursed'));
  const hasEvidenceHold = normalizedReasons.some((reason) => reason.includes('insufficient_data'));

  let reason = whyNotClaimReady;
  if (!reason && hasReviewOnlyHold) {
    reason = 'This finding is visible for reconciliation, but it is not claim-ready yet. Margin is holding it until the records show a supported loss, missing reimbursement, or policy-backed recovery gap.';
  } else if (!reason && hasDuplicateHold) {
    reason = 'Margin found a possible duplicate or previously handled recovery path, so it is holding this before another Amazon submission is created.';
  } else if (!reason && hasAlreadyReimbursedHold) {
    reason = 'A reimbursement or payout trail already appears linked to this issue, so Margin is holding the case instead of filing a duplicate claim.';
  } else if (!reason && hasEvidenceHold) {
    reason = 'The required identifiers, documents, or reconciliation records are not complete enough to support a filing yet.';
  } else if (!reason) {
    reason = 'A filing gate has not cleared yet, so Margin is holding this finding before any Amazon submission is made.';
  }

  const nextStep = hasReviewOnlyHold
    ? 'Next: reconcile the source records. Margin will only move it toward filing if the data later supports an actual reimbursement claim.'
    : hasEvidenceHold
      ? 'Next: add or reconnect the missing proof so Margin can decide whether the case is supportable.'
      : 'Next: review the hold reason and linked records before Margin allows filing to continue.';

  return {
    labels: labels.length ? labels : ['Filing hold'],
    reason,
    nextStep,
  };
};

const getSellerFilingMovementDetail = (movement?: any, fallbackStatus?: string | null, finding?: any) => {
  const blockContext = getFindingBlockContext(finding, movement);
  if (blockContext) {
    return `Blocked: ${blockContext.reason}`;
  }

  const rawDetail = cleanSellerText(movement?.detail);
  if (rawDetail && !/Margin is holding this case:\s*[a-z0-9_,:\s-]+\./i.test(rawDetail)) {
    return rawDetail;
  }

  return getFindingStateMeta(fallbackStatus).detail;
};

const getFindingStateMeta = (status?: string | null) => {
  const normalized = (status || '').toLowerCase();

  switch (normalized) {
    case 'ready_to_file':
      return {
        label: 'Evidence-ready',
        detail: 'Policy and identifier checks passed, so this is prepared for the next justified recovery action.',
        actionLabel: 'View finding',
        tone: 'border-[#B9E6D3] bg-[#F4FBF7] text-[#047857]',
        Icon: CheckCircle,
      };
    case 'filed':
      return {
        label: 'With Amazon',
        detail: 'This evidence-backed recovery is actively being followed with Amazon.',
        actionLabel: 'Open cases',
        tone: 'border-[#C8D8FF] bg-[#F2F7FF] text-[#0B74DE]',
        Icon: Send,
      };
    case 'converted':
      return {
        label: 'Evidence-ready',
        detail: 'This finding is now held in the controlled recovery workflow for follow-through.',
        actionLabel: 'Open cases',
        tone: 'border-[#D9D1FF] bg-[#F7F5FF] text-[#5B4BB7]',
        Icon: ArrowRight,
      };
    case 'resolved':
      return {
        label: 'Closed',
        detail: 'This finding is already tied off and no further filing is needed.',
        actionLabel: 'Open cases',
        tone: 'border-[#E9E9EC] bg-[#FAFAFB] text-[#50525B]',
        Icon: CheckCircle,
      };
    case 'pending':
      return {
        label: 'Under review',
        detail: 'Margin is still checking whether this discrepancy is supportable.',
        actionLabel: 'View finding',
        tone: 'border-[#D9D1FF] bg-[#F7F5FF] text-[#5B4BB7]',
        Icon: Clock,
      };
    case 'detected':
      return {
        label: 'Under review',
        detail: 'Margin is checking this discrepancy against the records before it can become a recovery case.',
        actionLabel: 'View finding',
        tone: 'border-[#C8D8FF] bg-[#F2F7FF] text-[#0B74DE]',
        Icon: Info,
      };
    default:
      return {
        label: formatIssueStatusLabel(status),
        detail: 'Review this discrepancy to decide whether it should move into a case.',
        actionLabel: 'View finding',
        tone: 'border-[#E9E9EC] bg-[#FAFAFB] text-[#50525B]',
        Icon: Info,
      };
  }
};

const getFindingMovementMeta = (
  movement?: {
    state?: string;
    label?: string;
    detail?: string;
    next_action_label?: string;
    block_reasons?: string[];
  } | null,
  fallbackStatus?: string | null,
  finding?: any
) => {
  const state = (movement?.state || '').toLowerCase();
  const fallback = getFindingStateMeta(fallbackStatus);

  const movementMeta: Record<string, { tone: string; Icon: typeof Info }> = {
    preview_finding: {
      tone: 'border-[#C8D8FF] bg-[#F2F7FF] text-[#0B74DE]',
      Icon: Info,
    },
    preparing_case: {
      tone: 'border-[#D9D1FF] bg-[#F7F5FF] text-[#5B4BB7]',
      Icon: ArrowRight,
    },
    evidence_needed: {
      tone: 'border-[#F4C6CD] bg-[#FFF6F7] text-[#8B3541]',
      Icon: Clock,
    },
    ready_to_file: {
      tone: 'border-[#B9E6D3] bg-[#F4FBF7] text-[#047857]',
      Icon: CheckCircle,
    },
    queued_for_filing: {
      tone: 'border-[#C8D8FF] bg-[#F2F7FF] text-[#0B74DE]',
      Icon: Send,
    },
    filed: {
      tone: 'border-[#C8D8FF] bg-[#F2F7FF] text-[#0B74DE]',
      Icon: Send,
    },
    awaiting_payout: {
      tone: 'border-[#B9E6D3] bg-[#F4FBF7] text-[#047857]',
      Icon: CircleDollarSign,
    },
    completed: {
      tone: 'border-[#B9E6D3] bg-[#F4FBF7] text-[#047857]',
      Icon: CheckCircle,
    },
    blocked: {
      tone: 'border-[#FECDCA] bg-[#FEF3F2] text-[#B42318]',
      Icon: X,
    },
  };

  const resolved = movementMeta[state];
  if (!movement?.label && !movement?.detail && !resolved) return fallback;

  return {
    label: movement?.label || fallback.label,
    detail: getSellerFilingMovementDetail(movement, fallbackStatus, finding),
    actionLabel: movement?.next_action_label || fallback.actionLabel,
    tone: resolved?.tone || fallback.tone,
    Icon: resolved?.Icon || fallback.Icon,
  };
};

const formatFindingDateLabel = (value?: string | null) => {
  if (!value) return 'Not available';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Not available';
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatDaysRemainingLabel = (value?: number | string | null, expired?: boolean | null) => {
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) return 'Not available';
  if (expired) return 'Expired';
  const days = Math.max(0, Math.ceil(parsed));
  if (days === 0) return '0 days left';
  return `${days} ${days === 1 ? 'day' : 'days'} left`;
};

const formatFindingDateTimeLabel = (value?: string | null) => {
  if (!value) return 'Not available';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'Not available';
  return parsed.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatConfidenceLabel = (value?: number | null) => {
  if (typeof value !== 'number' || Number.isNaN(value)) return 'Not available';
  const normalized = value > 1 ? value : value * 100;
  return `${Math.round(normalized)}%`;
};

const formatSourceTypeLabel = (value?: string | null) => {
  const normalized = (value || '').replace(/_/g, ' ').trim();
  if (normalized.toLowerCase() === 'sp api') return 'SP API';
  return normalized ? toTitleCase(normalized) : 'Not available';
};

const EVIDENCE_PREVIEW_KEYS: Array<[string, string]> = [
  ['order_id', 'Order ID'],
  ['amazon_order_id', 'Amazon order'],
  ['sku', 'SKU'],
  ['fnsku', 'FNSKU'],
  ['asin', 'ASIN'],
  ['shipment_id', 'Shipment'],
  ['transfer_id', 'Transfer'],
  ['settlement_id', 'Settlement'],
  ['quantity', 'Quantity'],
  ['units', 'Units'],
  ['amount', 'Amount'],
];

const formatEvidenceValue = (value: unknown) => {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  return null;
};

const getEvidencePreviewItems = (evidence: unknown) => {
  if (!evidence || typeof evidence !== 'object' || Array.isArray(evidence)) return [];
  const evidenceRecord = evidence as Record<string, unknown>;
  const seen = new Set<string>();
  const prioritized = EVIDENCE_PREVIEW_KEYS.flatMap(([key, label]) => {
    const value = formatEvidenceValue(evidenceRecord[key]);
    if (!value) return [];
    seen.add(key);
    return [{ label, value }];
  });

  const fallback = Object.entries(evidenceRecord)
    .filter(([key]) => !seen.has(key))
    .flatMap(([key, value]) => {
      const formatted = formatEvidenceValue(value);
      if (!formatted) return [];
      return [{ label: toTitleCase(key.replace(/_/g, ' ')), value: formatted }];
    });

  return [...prioritized, ...fallback].slice(0, 6);
};

const getRequiredEvidenceItems = (policy: any) => {
  const candidates = [
    policy?.required_evidence,
    policy?.requiredEvidence,
    policy?.evidence_requirements,
    policy?.evidenceRequirements,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) {
      return candidate
        .map((item) => (typeof item === 'string' ? item.trim() : ''))
        .filter(Boolean)
        .slice(0, 8);
    }

    if (typeof candidate === 'string' && candidate.trim()) {
      return candidate
        .split(/[;\n]/)
        .map((item) => item.trim())
        .filter(Boolean)
        .slice(0, 8);
    }
  }

  return [];
};

const getRequiredDocumentationItems = (policy: any) => {
  const documentationCandidates = [
    policy?.required_documentation,
    policy?.requiredDocumentation,
    policy?.documentation_requirements,
    policy?.documentationRequirements,
  ];

  for (const candidate of documentationCandidates) {
    if (!Array.isArray(candidate)) continue;

    const normalized = candidate
      .flatMap((item) => {
        if (typeof item === 'string') {
          const label = item.trim();
          return label ? [{ label, detail: '' }] : [];
        }

        if (!item || typeof item !== 'object') return [];
        const record = item as Record<string, unknown>;
        const label = String(record.label || record.title || record.name || '').trim();
        const detail = String(record.detail || record.description || record.summary || '').trim();
        if (!label && !detail) return [];
        return [{ label: label || 'Required documentation', detail }];
      })
      .slice(0, 8);

    if (normalized.length) return normalized;
  }

  return getRequiredEvidenceItems(policy).map((label) => ({ label, detail: '' }));
};

type DashboardTab = 'overview' | 'discrepancies' | 'disputes' | 'evidence';

const parseDashboardTab = (rawTab: string | null): DashboardTab | null => {
  const normalized = typeof rawTab === 'string' ? rawTab.trim().toLowerCase() : '';
  if (normalized === 'overview' || normalized === 'discrepancies' || normalized === 'disputes' || normalized === 'evidence') {
    return normalized;
  }
  return null;
};

export function Dashboard() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { tenant } = useTenant();
  const activeSlug = tenantSlug || tenant?.slug || '';
  const isDemoWorkspace = isDemoWorkspaceSlug(activeSlug);
  const aiExplainEnabled = isDemoWorkspace;
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const uploadSyncId = useMemo(() => {
    const raw = searchParams.get('syncId');
    const normalized = typeof raw === 'string' ? raw.trim() : '';
    return normalized.length > 0 ? normalized : null;
  }, [searchParams]);
  const explicitTab = useMemo(() => parseDashboardTab(searchParams.get('tab')), [searchParams]);
  const resolvedDashboardTab = useMemo<DashboardTab>(
    () => explicitTab || (uploadSyncId ? 'discrepancies' : 'overview'),
    [explicitTab, uploadSyncId]
  );
  const [activeTab, setActiveTab] = useState<DashboardTab>(resolvedDashboardTab);
  const [pipelineWindow, setPipelineWindow] = useState('90d');
  const isSyncScopedDetections = Boolean(uploadSyncId);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed(prev => !prev);
  }, []);

  useEffect(() => {
    setActiveTab(resolvedDashboardTab);
  }, [resolvedDashboardTab]);

  const handleTabChange = useCallback((tab: DashboardTab) => {
    setActiveTab(tab);
    const nextSearchParams = new URLSearchParams(location.search);
    const leavingSyncScopedDiscrepancies = Boolean(uploadSyncId) && tab !== 'discrepancies';

    if (leavingSyncScopedDiscrepancies) {
      nextSearchParams.delete('syncId');
      nextSearchParams.set('tab', tab);
    } else if (!uploadSyncId && tab === 'overview') {
      nextSearchParams.delete('tab');
    } else {
      nextSearchParams.set('tab', tab);
    }
    const nextSearch = nextSearchParams.toString();
    const currentSearch = location.search.startsWith('?') ? location.search.slice(1) : location.search;
    if (nextSearch !== currentSearch) {
      navigate(
        {
          pathname: location.pathname,
          search: nextSearch ? `?${nextSearch}` : '',
        },
        { replace: true }
      );
    }
  }, [location.pathname, location.search, navigate, uploadSyncId]);

  const [isExporting, setIsExporting] = useState(false);
  const [dashboardSummary, setDashboardSummary] = useState<DashboardSummary | null>(null);
  const [launchMonitor, setLaunchMonitor] = useState<LaunchMonitorPayload | null>(null);

  const handleBatchExport = async () => {
    if (isExporting) return;

    setIsExporting(true);
    toast({
      title: "EXPORT_INITIATED",
      description: "Preparing batch export of all pending claims...",
    });

    try {
      const tenantArg = activeSlug;
      const response = await fetch(buildApiUrl('/api/export-claims'), {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('session_token') || ''}`,
          'x-user-id': localStorage.getItem('user_id') || '',
          'x-tenant-id': localStorage.getItem('active_tenant_id') || '',
        },
        body: JSON.stringify({ tenantSlug: tenantArg }),
      });

      if (!response.ok) {
        throw new Error(`Export failed with status ${response.status}`);
      }

      // Convert the response to a Blob
      const blob = await response.blob();

      // Programmatically trigger the download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      // Get filename from Content-Disposition header if available
      const disposition = response.headers.get('content-disposition');
      let filename = `Margin_Claim_Batch_${new Date().toISOString().split('T')[0]}.csv`;

      if (disposition && disposition.indexOf('attachment') !== -1) {
        const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
        const matches = filenameRegex.exec(disposition);
        if (matches != null && matches[1]) {
          filename = matches[1].replace(/['"]/g, '');
        }
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "EXPORT_COMPLETE",
        description: "Batch export downloaded successfully.",
      });
    } catch (err: any) {
      console.error("[Download Error]", err);
      toast({
        title: "EXPORT_FAILED",
        description: err.message || "An error occurred while exporting the claims.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const openCaseIdModal = (id: string) => {
    setActiveClaimIdForCase(id);
    setCaseIdInput("");
    setCaseIdModalOpen(true);
  };

  const handleCaseIdUpdate = async () => {
    if (!caseIdInput.trim() || !activeClaimIdForCase) return;

    setIsLinkingCase(true);
    try {
      toast({
        title: "MANUAL_LINK_UNAVAILABLE",
        description: "Manual Amazon case linking is hidden until a tenant-safe backend endpoint is available.",
        variant: "destructive",
      });
    } catch (err: any) {
      toast({
        title: "LINK_FAILED",
        description: err.message || "Failed to link Amazon Case ID",
        variant: "destructive"
      });
    } finally {
      setIsLinkingCase(false);
    }
  };

  const handleMarkFalsePositive = async (id: string) => {
    try {
      toast({
        title: "FALSE_POSITIVE_ACTION_UNAVAILABLE",
        description: `False positive dismissal for ${id.substring(0, 8)} is hidden until a tenant-safe backend endpoint exists.`,
        variant: "destructive",
      });
    } catch (err: any) {
      toast({
        title: "UPDATE_FAILED",
        description: err.message || "Failed to update claim status",
        variant: "destructive"
      });
    }
  };

  const formatCurrency = useCallback((amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  }, []);

  // Live dashboard recoveries metrics (Continuous Sync UX)
  const [recoveredTotal, setRecoveredTotal] = useState<number | null>(null);
  const [recoveredCurrency, setRecoveredCurrency] = useState<string>('USD');
  const [submittedClaimsCount, setSubmittedClaimsCount] = useState<number | null>(null);
  const hasFetchedRef = useRef(false);
  const [pendingRecoveryAmount, setPendingRecoveryAmount] = useState<number | null>(null);
  const [pendingClaimsCount, setPendingClaimsCount] = useState<number | null>(null);
  const [approvedRecoveryAmount, setApprovedRecoveryAmount] = useState<number | null>(null);
  const [nextPaymentAmount, setNextPaymentAmount] = useState<number | null>(null);
  const [nextPaymentDate, setNextPaymentDate] = useState<string | null>(null);
  const [successRate, setSuccessRate] = useState<number | null>(null);
  const [reconciledCount, setReconciledCount] = useState<number | null>(null);
  const [approvedClaimsThisMonth, setApprovedClaimsThisMonth] = useState<number | null>(null);
  const [settlementRate, setSettlementRate] = useState<number | null>(null);
  const [dashboardMetrics, setDashboardMetrics] = useState<{
    today: number;
    todayGrowth: number;
    thisWeek: number;
    thisWeekGrowth: number;
    thisMonth: number;
    thisMonthGrowth: number;
  } | null>(null);
  const [isActivityExpanded, setIsActivityExpanded] = useState<boolean>(true);
  const [showSyncModal, setShowSyncModal] = useState<boolean>(false);
  const [providerLoading, setProviderLoading] = useState<'gmail' | 'outlook' | 'gdrive' | 'dropbox' | null>(null);
  // Sync status fields from API response
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [needsSync, setNeedsSync] = useState<boolean>(false);
  const [syncTriggered, setSyncTriggered] = useState<boolean>(false);
  const [dataSource, setDataSource] = useState<string | null>(null);
  const [recoverySource, setRecoverySource] = useState<string | null>(null);
  const [activeSyncId, setActiveSyncId] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const syncPollingRef = useRef<number | null>(null);
  const syncCheckTimeoutRef = useRef<number | null>(null);
  const upcomingPaymentsLoadedRef = useRef(false);
  const [quickActionsEditOpen, setQuickActionsEditOpen] = useState<boolean>(false);
  const [quickNoticeOpen, setQuickNoticeOpen] = useState<boolean>(false);
  const [contactSubject, setContactSubject] = useState<string>('');
  const [contactQuery, setContactQuery] = useState<string>('');
  const [contactSubmitting, setContactSubmitting] = useState<boolean>(false);
  const [dashboardAutoFileEnabled, setDashboardAutoFileEnabled] = useState<boolean>(true);
  const [dashboardAutoFileGateStatus, setDashboardAutoFileGateStatus] = useState<AutoFileGateStatus | null>(null);
  const [dashboardAutoFileLoading, setDashboardAutoFileLoading] = useState<boolean>(true);
  const [dashboardAutoFileSaving, setDashboardAutoFileSaving] = useState<boolean>(false);
  // Evidence stats
  const [evidenceStatus, setEvidenceStatus] = useState<{ documentsCount: number; processingCount: number } | null>(null);
  const [inviteOpen, setInviteOpen] = useState<boolean>(false);
  const [inviteEmail, setInviteEmail] = useState<string>('');
  const { toast } = useToast();
  const { notifications, unreadCount } = useNotifications();
  const { isReady } = useTenant();
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const loadDashboardAutoFilePreference = useCallback(async (options?: { silent?: boolean }): Promise<boolean> => {
    if (!activeSlug) {
      setDashboardAutoFileLoading(false);
      setDashboardAutoFileGateStatus(null);
      return false;
    }

    if (!options?.silent) {
      setDashboardAutoFileLoading(true);
    }

    try {
      const response = await api.getAutoFilePreference(activeSlug);
      if (response.ok && response.data?.data) {
        setDashboardAutoFileEnabled(response.data.data.enabled);
        setDashboardAutoFileGateStatus(response.data.data.gateStatus ?? null);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to load dashboard Auto-File preference:', error);
      return false;
    } finally {
      if (!options?.silent) {
        setDashboardAutoFileLoading(false);
      }
    }
  }, [activeSlug]);

  useEffect(() => {
    if (!isReady || !activeSlug) {
      setDashboardAutoFileLoading(false);
      return;
    }

    void loadDashboardAutoFilePreference();
  }, [activeSlug, isReady, loadDashboardAutoFilePreference]);

  const handleDashboardAutoFileChange = useCallback(async (enabled: boolean) => {
    if (!activeSlug) {
      return;
    }

    const previousValue = dashboardAutoFileEnabled;
    const previousGateStatus = dashboardAutoFileGateStatus;
    setDashboardAutoFileSaving(true);

    try {
      const response = await api.saveAutoFilePreference(enabled, activeSlug);
      if (!response.ok || !response.data?.data) {
        setDashboardAutoFileEnabled(previousValue);
        setDashboardAutoFileGateStatus(previousGateStatus);
        toast({
          title: 'Filing authority not saved',
          description: response.error || 'Margin could not update this control.',
          variant: 'destructive',
        });
        return;
      }

      setDashboardAutoFileEnabled(response.data.data.enabled);
      setDashboardAutoFileGateStatus(response.data.data.gateStatus ?? null);

      await loadDashboardAutoFilePreference({ silent: true });

      toast({
        title: response.data.data.enabled ? 'Approved filing authority enabled' : 'Review before filing enabled',
        description: response.data.data.enabled
          ? 'Margin may submit only evidence-complete cases that meet the rules you approved.'
          : 'Margin will prepare evidence-backed work for your approval before each new filing.',
      });
    } catch (error) {
      console.error('Failed to save dashboard Auto-File preference:', error);
      setDashboardAutoFileEnabled(previousValue);
      setDashboardAutoFileGateStatus(previousGateStatus);
      toast({
        title: 'Auto-File not saved',
        description: 'Margin could not update this control.',
        variant: 'destructive',
      });
    } finally {
      setDashboardAutoFileSaving(false);
    }
  }, [
    activeSlug,
    dashboardAutoFileEnabled,
    dashboardAutoFileGateStatus,
    loadDashboardAutoFilePreference,
    toast,
  ]);

  const handleContactSupportSubmit = useCallback(async () => {
    const subject = contactSubject.trim();
    const query = contactQuery.trim();

    if (!subject || !query) {
      toast({
        title: 'Query incomplete',
        description: 'Subject and your query are required before sending.',
        variant: 'destructive',
      });
      return;
    }

    setContactSubmitting(true);
    try {
      const response = await api.createSupportRequest({
        category: 'general',
        subject,
        message: query,
        severity: 'normal',
        source_page: 'dashboard_contact_us_modal',
        idempotency_key: crypto.randomUUID(),
      });

      if (!response.ok || !response.data?.success) {
        throw new Error(response.error || 'Failed to send support query');
      }

      toast({
        title: `Request saved: ${response.data.request.request_id.slice(0, 8)}`,
        description: response.data.request.delivery?.internal_notification?.status === 'accepted' || response.data.request.delivery?.internal_notification?.status === 'delivered'
          ? 'Margin saved your request and accepted the support notification for delivery.'
          : 'Margin saved your request. Support notification delivery is still being recorded.',
      });
      setQuickNoticeOpen(false);
      setContactSubject('');
      setContactQuery('');
    } catch (err: any) {
      toast({
        title: 'Could not send query',
        description: err?.message || 'Please email support@margin-finance.com directly.',
        variant: 'destructive',
      });
    } finally {
      setContactSubmitting(false);
    }
  }, [contactQuery, contactSubject, toast]);

  const [showDiscrepancyModal, setShowDiscrepancyModal] = useState<boolean>(false);
  const [showProofNeededModal, setShowProofNeededModal] = useState<boolean>(false);
  const [activeDiscrepancy, setActiveDiscrepancy] = useState<any>(null);
  const findingExplanation = useAiExplanation((id) => api.explainFinding(id, activeSlug), aiExplainEnabled);

  const { formatCurrency: formatCurrencyWithSelection } = useCurrency();
  // Phase 3: Detection statistics
  const [detectionStats, setDetectionStats] = useState<{
    totalDetections: number;
    estimatedRecovery: number;
    highConfidence: number;
    averageConfidence: number | null;
  } | null>(null);
  const [detectionResults, setDetectionResults] = useState<any[]>([]);
  const [loadingDetections, setLoadingDetections] = useState<boolean>(false);
  const [isRefreshingFindings, setIsRefreshingFindings] = useState<boolean>(false);
  const [detectionTotal, setDetectionTotal] = useState<number>(0);
  const [detectionResultsMeta, setDetectionResultsMeta] = useState<{
    syncId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    processedAt?: string | null;
    errorMessage?: string | null;
    isSandbox?: boolean;
    claimsFound?: number | null;
    estimatedRecovery?: number | null;
  } | null>(null);
  const [showProcessed, setShowProcessed] = useState<boolean>(false);
  const [latestDashboardSignal, setLatestDashboardSignal] = useState<{ label: string; timestamp: string; eventType: string } | null>(null);
  const detectionRequestRef = useRef(0);

  // Case ID Linking State
  const [caseIdModalOpen, setCaseIdModalOpen] = useState(false);
  const [activeClaimIdForCase, setActiveClaimIdForCase] = useState<string | null>(null);
  const [caseIdInput, setCaseIdInput] = useState("");
  const [isLinkingCase, setIsLinkingCase] = useState(false);

  const displayNotifications = useMemo(() => {
    return notifications;
  }, [notifications]);

  useEffect(() => {
    findingExplanation.reset();
  }, [activeDiscrepancy?.id, activeSlug]);

  useEffect(() => {
    if (!showDiscrepancyModal) {
      findingExplanation.reset();
    }
  }, [findingExplanation, showDiscrepancyModal]);

  // Helper to intercept and transform notification titles for high-fidelity Amazon lingo
  const enrichNotificationTitle = useCallback((title: any) => {
    if (!title || typeof title !== 'string') return '';
    let cleanTitle = stripEmojis(title);

    // Weaponize "Deposit Confirmed" -> "Reimbursement Approved"
    cleanTitle = cleanTitle.replace(/Deposit Confirmed/gi, 'Reimbursement Approved');
    cleanTitle = cleanTitle.replace(/Funds Deposited/gi, 'Reimbursement Approved');

    // Weaponize "Discrepancies Found" -> "Audit Complete: $[Amount] At Risk"
    const claimMatch = cleanTitle.match(/Detected (\d+) High-Probability Claims?/i);
    const discMatch = cleanTitle.match(/(\d+) Discrepancies Found/i);
    const count = claimMatch ? claimMatch[1] : (discMatch ? discMatch[1] : null);

    if (count) {
      const amountMatch = cleanTitle.match(/\$[\d,]+\.?\d*/);
      const amount = amountMatch ? amountMatch[0] : (pendingRecoveryAmount && pendingRecoveryAmount > 0 ? formatCurrencyWithSelection(pendingRecoveryAmount, recoveredCurrency) : '$0.00');
      return `Audit Complete: ${amount} At Risk`;
    }

    return cleanTitle;
  }, [pendingRecoveryAmount, recoveredCurrency, formatCurrencyWithSelection]);

  // Helper to extract dollar amount from notification title for ledger-style display
  const extractAmountFromTitle = useCallback((title: string): { label: string; amount: string | null } => {
    if (!title || typeof title !== 'string') return { label: '', amount: null };

    // Match patterns like "Deposit Confirmed: $843.53" or "$1,234.56"
    const amountMatch = title.match(/\$[\d,]+\.?\d*/);
    if (amountMatch) {
      // Remove the amount from the label
      const label = title.replace(/:?\s*\$[\d,]+\.?\d*/, '').trim();
      return { label, amount: amountMatch[0] };
    }

    return { label: title, amount: null };
  }, []);

  // Format date for ledger display (Jan 12 format)
  const formatLedgerDate = useCallback((dateStr: string): string => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  }, []);

  const [selectedQuickActions, setSelectedQuickActions] = useState<string[]>(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('clario.quickActions') : null;
      const parsed = raw ? JSON.parse(raw) : null;
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : ['ingest_now', 'invite_teammate'];
    } catch { return ['ingest_now', 'invite_teammate']; }
  });

  // Auto-persist quick actions to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('clario.quickActions', JSON.stringify(selectedQuickActions));
    } catch { }
  }, [selectedQuickActions]);
  const QUICK_ActionS: Array<{ id: string; label: string; subtitle: string }> = [
    { id: 'connect_evidence', label: 'Connect sources', subtitle: 'Sync evidence sources' },
    { id: 'review_high_conf', label: 'High confidence', subtitle: 'Audit verified claims' },
    { id: 'resolve_new', label: 'New opportunities', subtitle: 'Start new recoveries' },
    { id: 'run_detector', label: 'Run detector', subtitle: 'Scan for FBA errors' },
    { id: 'ingest_now', label: 'Ingest docs', subtitle: 'Process backlog' },
    { id: 'smart_sync', label: 'Inventory sync', subtitle: 'Optimize stock' },
    { id: 'upcoming_payments', label: 'Payments', subtitle: 'Track payouts' },
    { id: 'export_history', label: 'Export', subtitle: 'Audit reports' },
    { id: 'evidence_locker', label: 'Doc Locker', subtitle: 'Manage files' },
    { id: 'invite_teammate', label: 'Invite teammate', subtitle: 'Add team members' },
    { id: 'configure_alerts', label: 'Alerts', subtitle: 'System webhooks' },
    { id: 'security_setup', label: 'Security', subtitle: 'Lock access' },
  ];

  // Reset metrics when activeSlug changes to prevent "old data flash"
  useEffect(() => {
    setDashboardSummary(null);
    setLaunchMonitor(null);
    setRecoveredTotal(null);
    setSubmittedClaimsCount(null);
    setPendingRecoveryAmount(null);
    setPendingClaimsCount(null);
    setApprovedRecoveryAmount(null);
    setNextPaymentAmount(null);
    setNextPaymentDate(null);
    setSuccessRate(null);
    setReconciledCount(null);
    setApprovedClaimsThisMonth(null);
    setSettlementRate(null);
    setDashboardMetrics(null);
    setDetectionStats(null);
    setEvidenceStatus(null);
    setDetectionResults([]);
    setDetectionTotal(0);
    setDetectionResultsMeta(null);
    setIsRefreshingFindings(false);
    setLatestDashboardSignal(null);
  }, [activeSlug, uploadSyncId]);

  const fetchDashboardSummary = useCallback(async () => {
    if (!isReady || !activeSlug) return;
    try {
      const response = await api.getDashboardSummary(activeSlug);
      if (!mountedRef.current) return;
      if (response.ok && response.data?.summary) {
      setDashboardSummary(response.data.summary as DashboardSummary);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard summary:', error);
    }
  }, [activeSlug, isReady]);

  const fetchLaunchMonitor = useCallback(async () => {
    if (!isReady || !activeSlug) return;
    try {
      const response = await api.getLaunchMonitor(activeSlug, 20);
      if (!mountedRef.current) return;
      if (response.ok && response.data?.data) {
        setLaunchMonitor(response.data.data as LaunchMonitorPayload);
      }
    } catch (error) {
      console.error('Failed to fetch launch monitor:', error);
    }
  }, [activeSlug, isReady]);

  const executeQuickAction = useCallback(async (actionId: string) => {
    if (!activeSlug) return;

    if (actionId === 'connect_evidence') {
      navigate(tenantRoute(activeSlug, '/integrations-hub'));
      return;
    }

    if (actionId === 'invite_teammate') {
      setInviteOpen(true);
      return;
    }

    if (actionId === 'evidence_locker') {
      navigate(tenantRoute(activeSlug, '/evidence-locker'));
      return;
    }

    if (actionId === 'upcoming_payments') {
      navigate(tenantRoute(activeSlug, '/billing'));
      return;
    }

    if (actionId === 'ingest_now') {
      try {
        const response = await api.ingestAllEvidence({ maxResults: 50, autoParse: true }, activeSlug);
        if (!response.ok) {
          throw new Error(response.error || 'Evidence ingestion failed');
        }
        toast({
          title: 'INGESTION_STARTED',
          description: response.data?.message || 'Evidence ingestion was queued. Review Evidence Records for final FULL, DEGRADED, or REJECTED intake states.'
        });
        await fetchDashboardSummary();
      } catch (error: any) {
        toast({
          title: 'INGESTION_FAILED',
          description: error?.message || 'Evidence ingestion could not be started.',
          variant: 'destructive'
        });
      }
      return;
    }

    toast({
      title: 'ACTION_UNAVAILABLE',
      description: `${actionId.replace(/_/g, ' ')} is not available from the dashboard until a tenant-safe action is wired.`,
      variant: 'destructive'
    });
  }, [activeSlug, fetchDashboardSummary, navigate, toast]);

  // Fetch evidence status and detection statistics
  useEffect(() => {
    if (!isReady || !activeSlug) return;
    (async () => {
      const [statusRes, detectionStatsRes] = await Promise.all([
        api.getEvidenceStatus(activeSlug).catch(() => ({ ok: false, data: null })),
        detectionApi.getDetectionStatistics(undefined, activeSlug).catch(() => ({ ok: false, data: null })),
      ]);
      if (mountedRef.current) {
        if (statusRes.ok && statusRes.data) {
          setEvidenceStatus(statusRes.data);
        }
        if (detectionStatsRes.ok && detectionStatsRes.data?.statistics) {
          const stats = detectionStatsRes.data.statistics as any;
          const explicitAverage =
            typeof stats.average_confidence === 'number' ? stats.average_confidence * 100 :
              typeof stats.averageConfidence === 'number' ? stats.averageConfidence :
                null;
          setDetectionStats({
            totalDetections: stats.total_anomalies ?? stats.totalDetections ?? 0,
            estimatedRecovery: stats.total_value ?? stats.estimatedRecovery ?? 0,
            highConfidence: stats.by_confidence?.high ?? stats.highConfidence ?? 0,
            averageConfidence: explicitAverage
          });
        }
      }
    })();
  }, [isReady, activeSlug]);

  const fetchDetections = useCallback(async (
    options: { background?: boolean; suppressErrorToast?: boolean } = {}
  ) => {
    if (!isReady || !activeSlug) return;

    const requestId = ++detectionRequestRef.current;
    const useBackgroundRefresh = options.background === true;

    if (useBackgroundRefresh) {
      setIsRefreshingFindings(true);
    } else {
      setLoadingDetections(true);
    }

    try {
      const [resultsOutcome, statusOutcome] = await Promise.allSettled([
        detectionApi.getDetectionResults(
          uploadSyncId
            ? { limit: SYNC_SCOPED_DETECTION_RESULTS_LIMIT, syncId: uploadSyncId }
            : { limit: 50 },
          activeSlug
        ),
        uploadSyncId
          ? detectionApi.getDetectionStatus(uploadSyncId, activeSlug)
          : Promise.resolve(null),
      ]);

      if (!mountedRef.current || requestId !== detectionRequestRef.current) return;

      const resultsResponse = resultsOutcome.status === 'fulfilled' ? resultsOutcome.value : null;
      const statusResponse = statusOutcome.status === 'fulfilled' ? statusOutcome.value : null;
      const hasResults = Boolean(resultsResponse?.ok && resultsResponse.data?.results);
      const hasStatusTruth = Boolean(statusResponse?.ok);

      if (hasResults) {
        setDetectionResults(resultsResponse!.data.results);
        setDetectionTotal(resultsResponse!.data.total);
      } else if (!useBackgroundRefresh) {
        setDetectionResults([]);
        setDetectionTotal(0);
      }

      const mergedMeta = buildDashboardDetectionMeta(
        uploadSyncId,
        resultsResponse?.ok ? resultsResponse.data?.meta : null,
        statusResponse?.ok ? statusResponse.data : null,
        resultsResponse?.ok ? resultsResponse.data?.total : null
      );
      setDetectionResultsMeta(mergedMeta);

      if (!hasResults && !hasStatusTruth && !options.suppressErrorToast) {
        toast({
          title: 'Recovery data is unavailable',
          description: 'Margin could not load the latest findings for this workspace. Refresh the account or open Integrations to check the connection.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Failed to fetch detections:', error);
      if (!mountedRef.current || requestId !== detectionRequestRef.current) return;
      if (!useBackgroundRefresh) {
        setDetectionResults([]);
        setDetectionTotal(0);
        setDetectionResultsMeta(null);
      }
      if (!options.suppressErrorToast) {
        toast({
          title: 'Recovery data is unavailable',
          description: 'Margin could not load the latest findings for this workspace. Refresh the account or open Integrations to check the connection.',
          variant: 'destructive'
        });
      }
    } finally {
      if (!mountedRef.current || requestId !== detectionRequestRef.current) return;
      setLoadingDetections(false);
      setIsRefreshingFindings(false);
    }
  }, [activeSlug, isReady, toast, uploadSyncId]);

  // Fetch detection results for anomaly ledger counter
  useEffect(() => {
    if (!isReady || !activeSlug) return;

    setDetectionResults([]);
    setDetectionTotal(0);
    setDetectionResultsMeta(null);
    setIsRefreshingFindings(false);
    void fetchDetections();
  }, [activeSlug, fetchDetections, isReady, uploadSyncId]);

  const updateUpcomingMetrics = useCallback((payments: any[]) => {
    upcomingPaymentsLoadedRef.current = true;

    const normalizeNumber = (value: any): number | undefined => {
      if (typeof value === 'number' && Number.isFinite(value)) return value;
      if (typeof value === 'string') {
        const sanitized = value.replace(/[$,]/g, '').trim();
        if (!sanitized) return undefined;
        const parsed = Number(sanitized);
        return Number.isFinite(parsed) ? parsed : undefined;
      }
      return undefined;
    };

    const normalizedPayments = Array.isArray(payments)
      ? payments.map((payment) => {
        const amount =
          normalizeNumber(payment?.guaranteedAmount) ??
          normalizeNumber(payment?.amount) ??
          normalizeNumber(payment?.claim_amount) ??
          normalizeNumber(payment?.claimAmount) ??
          normalizeNumber(payment?.expectedAmount) ??
          (typeof payment?.amount_cents === 'number' ? payment.amount_cents / 100 : undefined) ??
          0;

        const date =
          payment?.expectedPayoutDate ||
          payment?.expected_payout_date ||
          payment?.payoutDate ||
          payment?.payout_date ||
          payment?.expectedDate ||
          payment?.expected_date ||
          payment?.estimatedPayoutDate ||
          payment?.estimated_payout_date ||
          null;

        return {
          amount: Number.isFinite(amount) ? amount : 0,
          date: date ? String(date) : null
        };
      })
      : [];

    if (normalizedPayments.length === 0) {
      setPendingRecoveryAmount(0);
      setPendingClaimsCount(0);
      setNextPaymentAmount(0);
      setNextPaymentDate(null);
      return;
    }

    setPendingClaimsCount(normalizedPayments.length);
    const totalPending = normalizedPayments.reduce((sum, entry) => sum + Math.max(entry.amount, 0), 0);
    setPendingRecoveryAmount(totalPending);

    const datedPayments = normalizedPayments.filter(entry => entry.date);
    if (datedPayments.length > 0) {
      const sortedByDate = [...datedPayments].sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());
      const nextDate = sortedByDate[0]?.date as string;
      const amountForNextDate = normalizedPayments
        .filter(entry => entry.date === nextDate)
        .reduce((sum, entry) => sum + Math.max(entry.amount, 0), 0);

      setNextPaymentAmount(amountForNextDate);
      setNextPaymentDate(nextDate);
    } else {
      setNextPaymentAmount(totalPending);
      setNextPaymentDate(null);
    }
  }, []); // Removed activeSlug, toast from dependencies as they are not used in this callback

  const fetchRecoveriesOnce = useCallback(async () => {
    try {
      const res = await api.getAmazonRecoveries(activeSlug);
      if (!mountedRef.current) return;
      if (res.ok && res.data) {
        const data = res.data as any;
        setRecoveredTotal(data.total_recovered ?? data.totalAmount ?? 0);
        if (data.currency) setRecoveredCurrency(data.currency);
        if (typeof data.submitted_claims_count === 'number') setSubmittedClaimsCount(data.submitted_claims_count);
        if (typeof data.reconciled_count === 'number') setReconciledCount(data.reconciled_count);

        setPendingRecoveryAmount(data.pending_recovery_amount ?? 0);
        setPendingClaimsCount(data.pending_claims_count ?? 0);
        setApprovedRecoveryAmount(data.approved_recovery_amount ?? 0);
        setNextPaymentAmount(data.next_payment_amount ?? 0);
        setNextPaymentDate(data.next_payment_date ?? null);
        setSuccessRate(data.success_rate ?? null);
        setApprovedClaimsThisMonth(data.approved_claims_this_month ?? null);
        if (typeof data.settlement_rate === 'number') setSettlementRate(data.settlement_rate);
        if (data.syncTriggered || data.needsSync) {
          checkAndMonitorSync();
        }
      }
    } catch (err) {
      console.error('Failed to fetch recoveries:', err);
    }
  }, [activeSlug]);

  // Fetch recoveries
  useEffect(() => {
    if (!isReady || !activeSlug) return;
    void checkAndMonitorSync();
  }, [activeSlug, isReady]);

  // Function to check sync status and monitor completion
  async function checkAndMonitorSync() {
    if (!mountedRef.current) return;

    try {
      // Check if there's an active sync using the documented API
      const { getActiveSyncStatus } = await import('@/lib/inventoryApi');
      const syncStatus = await getActiveSyncStatus(activeSlug);

      // If there's an active sync, get the syncId
      if (syncStatus.hasActiveSync && syncStatus.lastSync?.syncId) {
        const syncId = syncStatus.lastSync.syncId;
        setActiveSyncId(syncId);

        // Update sync message from lastSync data
        if (syncStatus.lastSync.message) {
          setSyncMessage(syncStatus.lastSync.message);
        }

        // Start polling for sync completion
        startSyncPolling(syncId);
      } else if (syncStatus.lastSync) {
        // Handle completed/failed syncs
        const lastSyncStatus = syncStatus.lastSync.status;

        // Check for completed status (including legacy 'complete' value)
        if (lastSyncStatus === 'completed' || lastSyncStatus === 'complete') {
          // Sync completed, refresh data
          await fetchDashboardSummary();
          setSyncTriggered(false);
          setNeedsSync(false);
          setSyncMessage(null);
          setLastSyncTime(new Date());

          // Toast removed per user request

          // Clear polling
          if (syncPollingRef.current) {
            clearInterval(syncPollingRef.current);
            syncPollingRef.current = null;
          }
        } else if (lastSyncStatus === 'failed') {
          // Sync failed
          setSyncTriggered(false);
          setNeedsSync(true); // Still needs sync
          setSyncMessage(syncStatus.lastSync.message || 'We hit a temporary issue while updating your Amazon records. Please try again.');

          // Show error toast with more details
          toast({
            title: 'Amazon Update Paused',
            description: syncStatus.lastSync.message || 'We hit a temporary issue while updating your Amazon records. Please try again.',
            variant: 'destructive',
            duration: 6000,
          });

          // Clear polling
          if (syncPollingRef.current) {
            clearInterval(syncPollingRef.current);
            syncPollingRef.current = null;
          }
        } else if (lastSyncStatus === 'cancelled') {
          // Sync cancelled
          setSyncTriggered(false);
          setNeedsSync(false);
          setSyncMessage('Sync was cancelled.');

          toast({
            title: 'Sync Cancelled',
            description: 'The sync was cancelled.',
            duration: 4000,
          });

          // Clear polling
          if (syncPollingRef.current) {
            clearInterval(syncPollingRef.current);
            syncPollingRef.current = null;
          }
        }
      }
    } catch (error) {
      console.error('Error checking sync status:', error);
    }
  }

  // Function to poll for sync completion
  function startSyncPolling(syncId: string) {
    // Clear any existing polling
    if (syncPollingRef.current) {
      clearInterval(syncPollingRef.current);
    }

    let pollCount = 0;
    const maxPolls = 120; // Poll for up to 10 minutes (120 * 5 seconds)

    syncPollingRef.current = window.setInterval(async () => {
      if (!mountedRef.current) {
        if (syncPollingRef.current) {
          clearInterval(syncPollingRef.current);
          syncPollingRef.current = null;
        }
        return;
      }

      pollCount++;

      try {
        // Import getSyncStatus from inventoryApi
        const { getSyncStatus } = await import('@/lib/inventoryApi');
        const status = await getSyncStatus(syncId, activeSlug);

        // Check for completed status (including legacy 'complete' value)
        if (status.status === 'completed' || status.status === 'complete') {
          // Sync completed, refresh data
          await fetchDashboardSummary();
          setSyncTriggered(false);
          setNeedsSync(false);
          setSyncMessage('Sync completed successfully!');

          // Clear polling
          if (syncPollingRef.current) {
            clearInterval(syncPollingRef.current);
            syncPollingRef.current = null;
          }
        } else if (status.status === 'failed') {
          // Sync failed
          setSyncTriggered(false);
          setNeedsSync(true);
          setSyncMessage('We hit a temporary issue while updating your Amazon records. Please try again.');
          await fetchDashboardSummary();

          toast({
            title: 'Amazon Update Paused',
            description: status.message || status.error || 'We hit a temporary issue while updating your Amazon records. Please try again.',
            variant: 'destructive',
            duration: 6000,
          });

          // Clear polling
          if (syncPollingRef.current) {
            clearInterval(syncPollingRef.current);
            syncPollingRef.current = null;
          }
        }
        // If still in progress, continue polling
      } catch (error) {
        console.error('Error polling sync status:', error);

        // Stop polling after max attempts or if there's an error
        if (pollCount >= maxPolls) {
          if (syncPollingRef.current) {
            clearInterval(syncPollingRef.current);
            syncPollingRef.current = null;
          }
          setSyncMessage('Sync is taking longer than expected. Please check back later.');
        }
      }
    }, 5000); // Poll every 5 seconds

    // Set timeout to stop polling after 10 minutes
    syncCheckTimeoutRef.current = window.setTimeout(() => {
      if (syncPollingRef.current) {
        clearInterval(syncPollingRef.current);
        syncPollingRef.current = null;
      }
      setSyncMessage('Sync is taking longer than expected. Please check the sync page for details.');
    }, 600000); // 10 minutes
  }

  async function fetchMetrics() {
    if (!isReady) return;
    const res = await api.getRecoveriesMetrics(activeSlug);
    if (!mountedRef.current) return;
    if (res.ok && res.data) {
      const d: any = res.data;
      // Prefer backend fields if present; otherwise fallback to existing placeholders
      const pending = typeof d.valueInProgress === 'number' ? d.valueInProgress : (typeof d.pendingAmount === 'number' ? d.pendingAmount : null);
      const rate = typeof d.successRate === 'number' ? d.successRate : (typeof d.successRate30d === 'number' ? d.successRate30d : null);
      const approved = (
        typeof d.approvedValue === 'number' ? d.approvedValue :
          typeof d.valueApproved === 'number' ? d.valueApproved :
            typeof d.paidValue === 'number' ? d.paidValue :
              typeof d.valuePaid === 'number' ? d.valuePaid :
                typeof d.approvedAmount === 'number' ? d.approvedAmount :
                  typeof d.amountApproved === 'number' ? d.amountApproved :
                    null
      );
      const nextPay = (
        typeof d.nextPaymentAmount === 'number' ? d.nextPaymentAmount :
          typeof d.nextPayoutAmount === 'number' ? d.nextPayoutAmount :
            typeof d.nextPayout === 'number' ? d.nextPayout :
              typeof d.expectedPayoutAmount === 'number' ? d.expectedPayoutAmount :
                typeof d.payoutDue === 'number' ? d.payoutDue :
                  null
      );
      const approvedClaimsMonth = (
        typeof d.approvedClaimsThisMonth === 'number' ? d.approvedClaimsThisMonth :
          typeof d.claimsApprovedThisMonth === 'number' ? d.claimsApprovedThisMonth :
            typeof d.approvedCountThisMonth === 'number' ? d.approvedCountThisMonth :
              typeof d.claimsApproved === 'number' ? d.claimsApproved :
                null
      );
      // Note: pendingRecoveryAmount is now sourced from fetchDisputeMetrics (dispute_cases) to avoid race conditions
      // if (pending !== null && !upcomingPaymentsLoadedRef.current) setPendingRecoveryAmount(pending);
      if (rate !== null) setSuccessRate(rate);
      if (approved !== null) setApprovedRecoveryAmount(approved);
      // Note: nextPaymentAmount is now sourced from fetchDisputeMetrics (dispute_cases) to avoid race conditions
      // if (nextPay !== null && !upcomingPaymentsLoadedRef.current) {
      //   setNextPaymentAmount(nextPay);
      //   setNextPaymentDate(null);
      // }
      if (approvedClaimsMonth !== null) setApprovedClaimsThisMonth(approvedClaimsMonth);
      if (d.dashboard) setDashboardMetrics(d.dashboard);
    }
  }

  // Fetch real dispute case data for Next Payment and Pending tiles
  const fetchDisputeMetrics = useCallback(async () => {
    if (!isReady) return;
    try {
      const res = await api.getDisputeCases({ limit: 500 }, activeSlug);
      if (!mountedRef.current) return;

      if (res.ok && res.data?.cases) {
        const cases = res.data.cases;

        // Next Payment = Approved disputes (awaiting payout)
        const approvedCases = cases.filter((c: any) => {
          const status = (c.status || '').toLowerCase();
          return status === 'approved' || status === 'resolved' || status === 'won';
        });
        const approvedTotal = approvedCases.reduce((sum: number, c: any) => {
          const amount = parseFloat(String(c.amount ?? c.claim_amount ?? c.actual_payout_amount ?? 0)) || 0;
          return sum + amount;
        }, 0);

        // Paid/Complete = Already settled disputes
        const paidCases = cases.filter((c: any) => {
          const status = (c.status || '').toLowerCase();
          return status === 'paid' || status === 'complete' || status === 'completed';
        });
        const paidTotal = paidCases.reduce((sum: number, c: any) => {
          const amount = parseFloat(String(c.amount ?? c.claim_amount ?? c.actual_payout_amount ?? 0)) || 0;
          return sum + amount;
        }, 0);

        // Pending = Submitted disputes (waiting for Amazon approval)
        const pendingCases = cases.filter((c: any) => {
          const status = (c.status || '').toLowerCase();
          return status === 'submitted' || status === 'pending' || status === 'under review' || status === 'in review';
        });
        const pendingTotal = pendingCases.reduce((sum: number, c: any) => {
          const amount = parseFloat(String(c.amount ?? c.claim_amount ?? c.actual_payout_amount ?? 0)) || 0;
          return sum + amount;
        }, 0);

        // Find next expected payout date from approved cases
        const datedApproved = approvedCases.filter((c: any) => c.expected_payout_date || c.expectedPayoutDate);
        let nextDate: string | null = null;
        if (datedApproved.length > 0) {
          const sorted = [...datedApproved].sort((a: any, b: any) => {
            const dateA = new Date(a.expected_payout_date || a.expectedPayoutDate);
            const dateB = new Date(b.expected_payout_date || b.expectedPayoutDate);
            return dateA.getTime() - dateB.getTime();
          });
          nextDate = sorted[0]?.expected_payout_date || sorted[0]?.expectedPayoutDate || null;
        }

        // Update state with real values
        // If there are approved cases awaiting payout, show that as estimated payout
        // Otherwise, if all cases are already paid, show the paid total as "estimated payout" (next settlement cycle)
        const estimatedPayout = approvedTotal > 0 ? approvedTotal : paidTotal;
        setNextPaymentAmount(estimatedPayout);
        setNextPaymentDate(nextDate);
        setPendingRecoveryAmount(pendingTotal);
        setPendingClaimsCount(pendingCases.length);

        // Calculate settlement rate: (approved + paid) / (approved + paid + pending + rejected)
        const rejectedCases = cases.filter((c: any) => {
          const status = (c.status || '').toLowerCase();
          return status === 'rejected' || status === 'denied' || status === 'lost';
        });
        const successfulCount = approvedCases.length + paidCases.length;
        const totalDecided = successfulCount + rejectedCases.length;
        const rate = totalDecided > 0 ? (successfulCount / totalDecided) * 100 : (cases.length > 0 ? 100 : 0);
        setSettlementRate(rate);

        console.log('[Dashboard] Dispute metrics:', {
          approved: { count: approvedCases.length, total: approvedTotal },
          paid: { count: paidCases.length, total: paidTotal },
          pending: { count: pendingCases.length, total: pendingTotal },
          rejected: { count: rejectedCases.length },
          settlementRate: rate.toFixed(1)
        });
      } else {
        console.warn('[Dashboard] No dispute cases returned');
        setSettlementRate(0);
      }
    } catch (error) {
      console.error('[Dashboard] Failed to fetch dispute metrics:', error);
    }
  }, [activeSlug, isReady]);

  const refreshDashboardPrimary = useCallback(async () => {
    await Promise.allSettled([
      fetchDashboardSummary(),
      fetchDisputeMetrics(),
    ]);
  }, [fetchDashboardSummary, fetchDisputeMetrics]);

  const refreshDashboardLive = useCallback(async () => {
    const primaryRefresh = refreshDashboardPrimary();
    void fetchLaunchMonitor();
    await primaryRefresh;
  }, [fetchLaunchMonitor, refreshDashboardPrimary]);

  useStatusStream((event) => {
    if (!activeSlug) return;

    const scopedSyncId = String(event.data?.sync_id || event.data?.syncId || '').trim();
    if (uploadSyncId && scopedSyncId && scopedSyncId !== uploadSyncId) {
      return;
    }

    if (
      event.type === 'sync' ||
      event.type === 'detection' ||
      event.type === 'evidence' ||
      event.type === 'case' ||
      event.type === 'filing' ||
      event.type === 'payout' ||
      event.type === 'recovery' ||
      event.type === 'notification'
    ) {
      const liveSignalLabel = describeDashboardLiveSignal(event);
      if (liveSignalLabel) {
        setLatestDashboardSignal({
          label: liveSignalLabel,
          timestamp: event.timestamp,
          eventType: event.eventType,
        });
      }
      if (
        event.type === 'detection' ||
        event.type === 'evidence' ||
        event.type === 'case' ||
        event.type === 'filing' ||
        event.type === 'payout' ||
        event.type === 'recovery'
      ) {
        void fetchDetections({ background: true, suppressErrorToast: true });
      }
      void refreshDashboardLive();
    }
  }, activeSlug);

  // Event-driven dashboard updates with slow polling fallback for recovery after disconnects.
  useEffect(() => {
    if (!isReady || !activeSlug) return;
    let pollTimer: number | null = null;

    const initFetch = async () => {
      await refreshDashboardLive();
    };

    initFetch();
    hasFetchedRef.current = true;

    pollTimer = window.setInterval(async () => {
      await refreshDashboardLive();
    }, 60000) as unknown as number;

    return () => {
      if (pollTimer) window.clearInterval(pollTimer);
      if (syncPollingRef.current) {
        clearInterval(syncPollingRef.current);
        syncPollingRef.current = null;
      }
      if (syncCheckTimeoutRef.current) {
        clearTimeout(syncCheckTimeoutRef.current);
        syncCheckTimeoutRef.current = null;
      }
    };
  }, [activeSlug, isReady, refreshDashboardLive]);

  const mainClass = isSidebarCollapsed ? 'ml-16' : 'ml-[282px]';

  const syncScopedDetectionCount = useMemo(() => {
    if (isDemoWorkspace) return Math.max(DEMO_FINDINGS_TARGET_COUNT, detectionResults.length);
    if (!isSyncScopedDetections) return detectionTotal;
    if (typeof detectionResultsMeta?.claimsFound === 'number' && detectionResultsMeta.claimsFound >= 0) {
      return detectionResultsMeta.claimsFound;
    }
    if (typeof detectionTotal === 'number' && detectionTotal > 0) return detectionTotal;
    return detectionResults.length;
  }, [detectionResults.length, detectionResultsMeta?.claimsFound, detectionTotal, isDemoWorkspace, isSyncScopedDetections]);
  const syncScopedResultCapDisclosure = useMemo(() => {
    if (!isSyncScopedDetections) return null;
    if (detectionResults.length < SYNC_SCOPED_DETECTION_RESULTS_LIMIT) return null;
    if (syncScopedDetectionCount <= detectionResults.length) return null;
    return `This upload returned ${pluralize(syncScopedDetectionCount, 'finding')}. The dashboard currently loads only the first ${SYNC_SCOPED_DETECTION_RESULTS_LIMIT} rows for this sync, so the table below shows a subset of the upload results.`;
  }, [detectionResults.length, isSyncScopedDetections, syncScopedDetectionCount]);
  const detectedOpportunitiesCount = isSyncScopedDetections
    ? syncScopedDetectionCount
    : isDemoWorkspace
      ? Math.max(DEMO_FINDINGS_TARGET_COUNT, detectionResults.length)
      : dashboardSummary?.detections_count ?? detectionStats?.totalDetections ?? detectionTotal ?? detectionResults.length;
  const filedClaimsCount = dashboardSummary?.filed_count ?? 0;
  const approvedClaimsCount = dashboardSummary?.approved_count ?? 0;
  const recoveredClaimsCount = dashboardSummary?.recovered_count ?? 0;
  const recoveredCashTotal = dashboardSummary?.recovered_cash_total ?? 0;
  const estimatedValueTotal = dashboardSummary?.estimated_value_total ?? 0;
  const filedValueTotal = dashboardSummary?.filed_value_total ?? 0;
  const approvedValueTotal = dashboardSummary?.approved_value_total ?? 0;
  const activeBlockers = dashboardSummary?.blockers ?? [];
  const primaryBlocker = activeBlockers[0] || null;
  const hasLiveRecoveryValue = estimatedValueTotal > 0 || filedValueTotal > 0 || approvedValueTotal > 0 || recoveredCashTotal > 0;
  const launchMetrics = launchMonitor?.metrics ?? null;
  const formattedLastUpdated = useMemo(() => {
    if (!dashboardSummary?.last_updated_at) return 'Unavailable';
    const timestamp = new Date(dashboardSummary.last_updated_at);
    if (Number.isNaN(timestamp.getTime())) return 'Unavailable';
    return formatDistanceToNow(timestamp, { addSuffix: true });
  }, [dashboardSummary?.last_updated_at]);
  const activeLaunchAlerts = useMemo(
    () => (launchMonitor?.alerts || []).filter((alert) => alert.active !== false),
    [launchMonitor?.alerts]
  );
  const formattedLaunchLastUpdated = useMemo(() => {
    if (!launchMonitor?.last_updated_at) return 'Not Available';
    const timestamp = new Date(launchMonitor.last_updated_at);
    if (Number.isNaN(timestamp.getTime())) return 'Not Available';
    return `${formatDistanceToNowStrict(timestamp, { addSuffix: true })} (${format(timestamp, 'MMM dd, yyyy, HH:mm')})`;
  }, [launchMonitor?.last_updated_at]);
  const headerLastUpdated = useMemo(() => {
    if (launchMonitor?.last_updated_at) return formattedLaunchLastUpdated;
    if (!dashboardSummary?.last_updated_at) return 'Not Available';
    const timestamp = new Date(dashboardSummary.last_updated_at);
    if (Number.isNaN(timestamp.getTime())) return 'Not Available';
    return `${formatDistanceToNowStrict(timestamp, { addSuffix: true })} (${format(timestamp, 'MMM dd, yyyy, HH:mm')})`;
  }, [dashboardSummary?.last_updated_at, formattedLaunchLastUpdated, launchMonitor?.last_updated_at]);
  const syncScopedIssuesUpdatedLabel = useMemo(() => {
    if (!isSyncScopedDetections) return formattedLastUpdated;
    const processedAt = detectionResultsMeta?.processedAt;
    if (!processedAt) return 'Not Available';
    const timestamp = new Date(processedAt);
    if (Number.isNaN(timestamp.getTime())) return 'Not Available';
    return `${formatDistanceToNowStrict(timestamp, { addSuffix: true })} (${format(timestamp, 'MMM dd, yyyy, HH:mm')})`;
  }, [detectionResultsMeta?.processedAt, formattedLastUpdated, isSyncScopedDetections]);
  const discrepancyHeaderLastUpdatedLabel = useMemo(() => {
    if (activeTab === 'discrepancies' && isSyncScopedDetections) {
      return `Upload processed: ${syncScopedIssuesUpdatedLabel}`;
    }
    return `Last checked ${headerLastUpdated} · Your position reflects the records Margin has examined.`;
  }, [activeTab, headerLastUpdated, isSyncScopedDetections, syncScopedIssuesUpdatedLabel]);
  const latestDashboardSignalLabel = useMemo(() => {
    if (!latestDashboardSignal?.timestamp) return null;
    const timestamp = new Date(latestDashboardSignal.timestamp);
    if (Number.isNaN(timestamp.getTime())) return latestDashboardSignal.label;
    return `${latestDashboardSignal.label} ${formatDistanceToNowStrict(timestamp, { addSuffix: true })}`;
  }, [latestDashboardSignal]);
  const syncScopedDetectionStatus = (detectionResultsMeta?.status || '').toLowerCase();
  const syncScopedErrorMessage = detectionResultsMeta?.errorMessage?.trim() || null;
  const isSyncScopedSandbox = detectionResultsMeta?.isSandbox === true;
  const syncScopedDetectionStatusMeta = useMemo(() => {
    switch (syncScopedDetectionStatus) {
      case 'completed':
        return {
          label: 'Completed',
          tone: 'border-[#B9E6D3] bg-[#F4FBF7] text-[#26785E]'
        };
      case 'processing':
        return {
          label: 'Processing',
          tone: 'border-[#C8D8FF] bg-[#F2F7FF] text-[#0B74DE]'
        };
      case 'pending':
        return {
          label: 'Pending',
          tone: 'border-[#DCE8EE] bg-[#F5F8FA] text-[#4D5B66]'
        };
      case 'failed':
        return {
          label: 'Failed',
          tone: 'border-[#F4C6CD] bg-[#FFF6F7] text-[#8B3541]'
        };
      default:
        return {
          label: 'Not Available',
          tone: 'border-[#E9E9EC] bg-[#FAFAFB] text-[#50525B]'
        };
    }
  }, [syncScopedDetectionStatus]);
  const syncScopedEstimatedRecoveryLabel = useMemo(() => {
    if (!isSyncScopedDetections) return 'Not Available';
    const scopedResults = isDemoWorkspace ? expandDemoFindings(detectionResults) : detectionResults;
    const fallbackLoadedValue = scopedResults.reduce((sum, result) => sum + (Number(result?.estimated_value) || 0), 0);

    if (typeof detectionResultsMeta?.estimatedRecovery === 'number') {
      return formatCurrencyWithSelection(detectionResultsMeta.estimatedRecovery, scopedResults.find((result) => result?.currency)?.currency || 'USD');
    }

    if (fallbackLoadedValue > 0) {
      return formatCurrencyWithSelection(fallbackLoadedValue, scopedResults.find((result) => result?.currency)?.currency || 'USD');
    }

    if (syncScopedDetectionStatus === 'completed') {
      return formatCurrencyWithSelection(0, scopedResults.find((result) => result?.currency)?.currency || 'USD');
    }

    return 'Not Available';
  }, [detectionResults, detectionResultsMeta?.estimatedRecovery, formatCurrencyWithSelection, isDemoWorkspace, isSyncScopedDetections, syncScopedDetectionStatus]);
  const syncScopedDetectionMetaRows = useMemo(() => {
    if (!isSyncScopedDetections || !uploadSyncId) return [];
    const rows = [
      {
        label: 'Upload sync',
        value: uploadSyncId,
      },
      {
        label: 'Detection status',
        value: syncScopedDetectionStatusMeta.label,
        tone: syncScopedDetectionStatusMeta.tone,
      },
      ...(isSyncScopedSandbox ? [{
        label: 'Environment',
        value: 'Sandbox upload',
        tone: 'border-fuchsia-500/25 bg-fuchsia-500/[0.08] text-fuchsia-100',
      }] : []),
      {
        label: 'Finished processing',
        value: syncScopedIssuesUpdatedLabel,
      },
      {
        label: 'Total findings in this upload',
        value: pluralize(syncScopedDetectionCount, 'finding'),
      },
      {
        label: 'Estimated recovery in this upload',
        value: syncScopedEstimatedRecoveryLabel,
      },
    ];
    if (syncScopedDetectionStatus === 'failed' && syncScopedErrorMessage) {
      rows.push({
        label: 'Failure reason',
        value: syncScopedErrorMessage,
      });
    }
    return rows;
  }, [isSyncScopedDetections, isSyncScopedSandbox, syncScopedDetectionCount, syncScopedDetectionStatus, syncScopedDetectionStatusMeta.label, syncScopedDetectionStatusMeta.tone, syncScopedErrorMessage, syncScopedEstimatedRecoveryLabel, syncScopedIssuesUpdatedLabel, uploadSyncId]);
  const issuesFoundHeading = isSyncScopedDetections ? 'This upload\'s findings' : 'Recent findings';
  const issuesFoundDescription = isSyncScopedDetections
    ? 'Showing detections from your latest CSV upload. The upload total above reflects everything this sync found, while the table below reflects only the findings currently visible in this view.'
    : 'Review what Margin found, whether a discrepancy is ready, already moved into a case, or still needs review.';
  const dashboardDetectionResults = useMemo(
    () => isDemoWorkspace ? expandDemoFindings(detectionResults) : detectionResults,
    [detectionResults, isDemoWorkspace]
  );
  const visibleDetectionResults = useMemo(
    () => dashboardDetectionResults.filter(result => showProcessed ? true : !isProcessedFindingStatus(result.status)),
    [dashboardDetectionResults, showProcessed]
  );
  const findingsCurrency = dashboardDetectionResults.find((result) => typeof result?.currency === 'string' && result.currency.trim())?.currency || 'USD';
  const visibleFindingsValueTotal = useMemo(
    () => visibleDetectionResults.reduce((sum, result) => sum + (Number(result.estimated_value) || 0), 0),
    [visibleDetectionResults]
  );
  const syncScopedEstimatedRecovery = useMemo(() => {
    if (!isSyncScopedDetections) return null;
    if (typeof detectionResultsMeta?.estimatedRecovery === 'number') {
      return detectionResultsMeta.estimatedRecovery;
    }
    if (visibleDetectionResults.length > 0) {
      return visibleFindingsValueTotal;
    }
    if (syncScopedDetectionStatus === 'completed' && syncScopedDetectionCount === 0) {
      return 0;
    }
    return null;
  }, [
    detectionResultsMeta?.estimatedRecovery,
    isSyncScopedDetections,
    syncScopedDetectionCount,
    syncScopedDetectionStatus,
    visibleDetectionResults.length,
    visibleFindingsValueTotal,
  ]);
  const issuesFoundRecoveryValue = useMemo(() => {
    if (isSyncScopedDetections) {
      return syncScopedEstimatedRecovery;
    }
    return visibleFindingsValueTotal;
  }, [isSyncScopedDetections, syncScopedEstimatedRecovery, visibleFindingsValueTotal]);
  const issuesFoundRecoveryLabel = useMemo(() => {
    if (issuesFoundRecoveryValue === null || issuesFoundRecoveryValue === undefined) return 'Not Available';
    return formatCurrencyWithSelection(issuesFoundRecoveryValue, findingsCurrency);
  }, [findingsCurrency, formatCurrencyWithSelection, issuesFoundRecoveryValue]);
  const readyToFileFindingsCount = useMemo(
    () => dashboardDetectionResults.filter(isReadyToFileFinding).length,
    [dashboardDetectionResults]
  );
  const needsReviewFindingsCount = useMemo(
    () => dashboardDetectionResults.filter(result => !isReadyToFileFinding(result) && ['detected', 'pending'].includes((result.status || '').toLowerCase())).length,
    [dashboardDetectionResults]
  );
  const issuesFoundSummaryRows = useMemo(() => ([
    {
      label: isSyncScopedDetections ? 'Estimated recovery in this upload' : 'Estimated recovery in view',
      value: issuesFoundRecoveryLabel,
      valueTone: 'default' as const,
      detail: isSyncScopedDetections
        ? typeof detectionResultsMeta?.estimatedRecovery === 'number'
          ? 'Upload-scoped detection value from the latest processing run'
          : 'Based on the findings currently loaded for this upload view'
        : 'Based on findings in view'
    },
    {
      label: isSyncScopedDetections ? 'Findings currently in view' : 'In view',
      value: pluralize(visibleDetectionResults.length, 'finding'),
      valueTone: 'default' as const,
      detail: isSyncScopedDetections ? 'Shown in this upload view' : 'Shown in this view'
    },
    {
      label: 'Ready to file',
      value: pluralize(readyToFileFindingsCount, 'finding'),
      valueTone: readyToFileFindingsCount > 0 ? 'ready' as const : 'muted' as const,
      detail: readyToFileFindingsCount > 0 ? 'Linked cases passed support checks' : 'Nothing is ready yet'
    },
    {
      label: 'Needs review',
      value: pluralize(needsReviewFindingsCount, 'finding'),
      valueTone: needsReviewFindingsCount > 0 ? 'review' as const : 'muted' as const,
      detail: needsReviewFindingsCount > 0 ? 'Still waiting on review or evidence' : 'No review backlog right now'
    }
  ]), [
    detectionResultsMeta?.estimatedRecovery,
    isSyncScopedDetections,
    issuesFoundRecoveryLabel,
    needsReviewFindingsCount,
    readyToFileFindingsCount,
    visibleDetectionResults.length
  ]);
  const issuesFoundProofHeadline = useMemo(() => {
    if (isSyncScopedDetections && syncScopedDetectionCount > 0) {
      return `${pluralize(syncScopedDetectionCount, 'finding')} worth ${issuesFoundRecoveryLabel} are attached to this upload.`;
    }
    if (visibleDetectionResults.length > 0) {
      return `${pluralize(visibleDetectionResults.length, 'finding')} worth ${issuesFoundRecoveryLabel} are currently in view.`;
    }
    if (loadingDetections && visibleDetectionResults.length === 0 && isSyncScopedDetections) {
      return 'Margin is loading the filing-ready view for this upload.';
    }
    if (loadingDetections && visibleDetectionResults.length === 0) {
      return 'Margin is loading the latest filing-ready findings.';
    }
    if (isSyncScopedDetections && syncScopedDetectionStatus === 'completed') {
      return `This upload finished with ${pluralize(syncScopedDetectionCount, 'finding')} and ${issuesFoundRecoveryLabel} in detected value.`;
    }
    return 'Margin is holding the latest discrepancy truth for this workspace.';
  }, [
    isSyncScopedDetections,
    issuesFoundRecoveryLabel,
    loadingDetections,
    syncScopedDetectionCount,
    syncScopedDetectionStatus,
    visibleDetectionResults.length,
  ]);
  const issuesFoundLoadingState = useMemo(() => {
    if (isSyncScopedDetections) {
      if (syncScopedDetectionStatus === 'processing' || syncScopedDetectionStatus === 'pending') {
        return {
          title: 'Detection is still moving for this upload',
          detail: typeof detectionResultsMeta?.claimsFound === 'number' && detectionResultsMeta.claimsFound > 0
            ? `${pluralize(detectionResultsMeta.claimsFound, 'finding')} already surfaced while Margin prepares the filing-ready view.`
            : 'Margin is loading the findings, value, and filing readiness for this upload.',
        };
      }

      return {
        title: 'Loading findings for this upload',
        detail: 'Margin is preparing the upload-scoped findings, value proof, and filing state now.',
      };
    }

    return {
      title: 'Preparing the filing-ready findings view',
      detail: 'Margin is loading the latest discrepancies, value proof, and case readiness for this account.',
    };
  }, [detectionResultsMeta?.claimsFound, isSyncScopedDetections, syncScopedDetectionStatus]);
  const activeDiscrepancyCopy = useMemo(() => {
    if (!activeDiscrepancy) return null;
    const derivedCopy = getIssueCopy(
      activeDiscrepancy.reason || activeDiscrepancy.anomaly_type || activeDiscrepancy.title
    );

    return {
      title: activeDiscrepancy.issueTitle || derivedCopy.title,
      summary: activeDiscrepancy.issueSummary || derivedCopy.summary,
      eventLabel: activeDiscrepancy.issueEventLabel || derivedCopy.eventLabel,
      recoverabilityReason: activeDiscrepancy.recoverabilityReason || 'Margin is holding this finding in review until identifiers, evidence, and policy support line up.',
      evidenceSummary: activeDiscrepancy.evidenceSummary || 'Structured evidence is available on the backend detection record.',
    };
  }, [activeDiscrepancy]);
  const activeDiscrepancyBlockContext = useMemo(
    () => getFindingBlockContext(activeDiscrepancy),
    [activeDiscrepancy]
  );
  const activeDiscrepancyEvidenceItems = useMemo(
    () => getEvidencePreviewItems(activeDiscrepancy?.evidence),
    [activeDiscrepancy?.evidence]
  );
  const activeDiscrepancyPolicyBasis = useMemo(
    () => activeDiscrepancy?.policyBasis || activeDiscrepancy?.policy_basis || null,
    [activeDiscrepancy]
  );
  const activeDiscrepancyRequiredDocumentationItems = useMemo(
    () => getRequiredDocumentationItems(activeDiscrepancyPolicyBasis),
    [activeDiscrepancyPolicyBasis]
  );
  const activeDiscrepancyDaysRemainingLabel = useMemo(
    () => formatDaysRemainingLabel(activeDiscrepancy?.daysRemaining, activeDiscrepancy?.expired),
    [activeDiscrepancy]
  );
  const activeDiscrepancyMetaRows = useMemo(() => {
    if (!activeDiscrepancy) return [];
    return [
      {
        label: 'Backend record',
        value: activeDiscrepancy.id?.substring(0, 12) || 'Not available',
      },
      {
        label: 'Source',
        value: formatSourceTypeLabel(activeDiscrepancy.sourceType),
      },
      {
        label: 'Sync',
        value: activeDiscrepancy.syncId || 'Not available',
      },
      {
        label: 'Confidence',
        value: formatConfidenceLabel(activeDiscrepancy.confidenceScore),
      },
      {
        label: 'Coverage',
        value: activeDiscrepancy.coverageFamily || 'Launch detector',
      },
      {
        label: 'Readiness',
        value: activeDiscrepancy.reviewTier === 'monitoring'
          ? 'Monitoring'
          : activeDiscrepancy.claimReadiness === 'not_claim_ready'
            ? 'Not claim-ready'
            : 'Claim candidate',
      },
      {
        label: 'Severity',
        value: activeDiscrepancy.severity ? toTitleCase(String(activeDiscrepancy.severity).replace(/_/g, ' ')) : 'Not available',
      },
      {
        label: 'Deadline',
        value: formatFindingDateLabel(activeDiscrepancy.deadlineDate),
      },
      {
        label: 'Movement',
        value: activeDiscrepancy.movementLabel || activeDiscrepancy.stateLabel || 'Not available',
      },
      {
        label: 'Case link',
        value: activeDiscrepancy.caseNumber || activeDiscrepancy.amazonCaseId || activeDiscrepancy.linkedCaseId || 'Not linked yet',
      },
    ];
  }, [activeDiscrepancy]);
  const activeDiscrepancyPolicyRows = useMemo(() => {
    const policy = activeDiscrepancyPolicyBasis;
    if (!policy) {
      return [
        { label: 'Amazon policy', value: 'Policy basis pending verification' },
        { label: 'Source', value: 'Amazon Seller Central Help' },
        { label: 'Days left', value: activeDiscrepancyDaysRemainingLabel },
      ];
    }

    return [
      {
        label: 'Amazon policy',
        value: policy.title || 'Policy basis pending verification',
      },
      {
        label: 'Status',
        value: policy.verification_status === 'official_reference_configured'
          ? 'Official reference configured'
          : 'Pending verification',
      },
      {
        label: 'Source',
        value: policy.source_name || 'Amazon Seller Central Help',
      },
      {
        label: 'Verified',
        value: policy.last_verified_at ? formatFindingDateLabel(policy.last_verified_at) : 'Pending verification',
      },
      {
        label: 'Days left',
        value: activeDiscrepancyDaysRemainingLabel,
      },
      {
        label: 'Deadline',
        value: formatFindingDateLabel(activeDiscrepancy?.deadlineDate),
      },
    ];
  }, [activeDiscrepancy?.deadlineDate, activeDiscrepancyDaysRemainingLabel, activeDiscrepancyPolicyBasis]);
  const syncScopedEmptyState = useMemo(() => {
    if (!isSyncScopedDetections) return null;

    const syncLabel = uploadSyncId ? `Sync ${uploadSyncId}` : 'This upload';

    if (syncScopedDetectionStatus === 'processing' || syncScopedDetectionStatus === 'pending') {
      return {
        title: 'Detection is still processing for this upload.',
        description: `${syncLabel} is still running through Agent 3. Findings for this upload are not final yet.`,
        showViewAllCta: false,
      };
    }

    if (syncScopedDetectionStatus === 'failed') {
      return {
        title: 'Detection failed for this upload.',
        description: syncScopedErrorMessage || `${syncLabel} failed before upload-scoped findings could be returned.`,
        showViewAllCta: false,
      };
    }

    if (syncScopedDetectionCount > 0 && !showProcessed) {
      return {
        title: 'This upload has findings, but none are currently visible.',
        description: `All findings for ${syncLabel} are already processed and hidden in this view. Turn on “Show processed” to review them.`,
        showViewAllCta: false,
      };
    }

    if (syncScopedDetectionStatus === 'completed' && syncScopedDetectionCount === 0) {
      return {
        title: 'No new issues were found for this upload.',
        description: `${syncLabel} completed successfully and returned zero findings for this upload.`,
        showViewAllCta: true,
      };
    }

    return {
      title: 'Findings for this upload are not available yet.',
      description: syncScopedErrorMessage || `${syncLabel} has not returned a final upload-scoped findings state yet.`,
      showViewAllCta: false,
    };
  }, [
    isSyncScopedDetections,
    showProcessed,
    syncScopedDetectionStatus,
    syncScopedDetectionCount,
    syncScopedErrorMessage,
    uploadSyncId,
  ]);
  const lastSyncResult = useMemo(() => {
    if (activeSyncId || syncTriggered) {
      return {
        value: 'Sync in progress',
        detail: syncMessage || 'We are pulling your latest account records now.'
      };
    }
    if (needsSync) {
      return {
        value: 'Needs attention',
        detail: syncMessage || 'A refresh is needed to bring in your latest account records.'
      };
    }
    if (lastSyncTime) {
      return {
        value: 'Completed',
        detail: `Last sync ${formatDistanceToNow(lastSyncTime, { addSuffix: true })}`
      };
    }
    const lastIngestAt = dashboardSummary?.integrations_summary?.last_ingest_at;
    if (lastIngestAt) {
      const timestamp = new Date(lastIngestAt);
      if (!Number.isNaN(timestamp.getTime())) {
        return {
          value: 'Completed',
          detail: `Last ingest ${formatDistanceToNow(timestamp, { addSuffix: true })}`
        };
      }
    }
    return {
      value: 'Not run yet',
      detail: 'No sync result recorded yet.'
    };
  }, [activeSyncId, dashboardSummary?.integrations_summary?.last_ingest_at, lastSyncTime, needsSync, syncMessage, syncTriggered]);
  const latestOperationalEvent = useMemo(() => {
    const recentEvents = launchMonitor?.recent_events;
    if (!recentEvents || recentEvents.length === 0) return null;
    return recentEvents[0];
  }, [launchMonitor?.recent_events]);
  const overviewHeadline = useMemo(() => {
    const readyCount = launchMetrics?.agent7_ready_count ?? 0;
    const filedCount = filedClaimsCount;
    const approvedCount = approvedClaimsCount;
    const paidCount = recoveredClaimsCount;
    const needsEvidenceCount = launchMetrics?.agent7_needs_evidence_count ?? 0;
    const safetyVerificationCount = launchMetrics?.agent7_pending_safety_verification_count ?? 0;
    const insufficientDataCount = launchMetrics?.agent7_insufficient_data_count ?? 0;

    if (!dashboardSummary && !launchMonitor) {
      return 'Margin is checking your latest recovery position.';
    }
    if (activeSyncId || syncTriggered) {
      return 'Margin is pulling your latest Amazon activity now.';
    }
    if (needsEvidenceCount > 0) {
      return `${pluralize(needsEvidenceCount, 'recovery')} need${needsEvidenceCount === 1 ? 's' : ''} purchase evidence before Margin can act. We have not filed anything without that proof.`;
    }
    if (safetyVerificationCount > 0 || insufficientDataCount > 0) {
      return `Margin is verifying the identifiers and records for ${pluralize(safetyVerificationCount + insufficientDataCount, 'recovery')}. Nothing will move forward until it is supportable.`;
    }
    if (approvedCount > 0 && paidCount === 0) {
      return `Amazon has indicated recovery on ${pluralize(approvedCount, 'case')}. Margin is checking when and how the money appears in your settlement.`;
    }
    if (filedCount > 0) {
      return `Margin is carrying ${pluralize(filedCount, 'evidence-backed case')} with Amazon. You do not need to chase an update right now.`;
    }
    if (readyCount > 0) {
      return `${pluralize(readyCount, 'case')} ${readyCount === 1 ? 'is' : 'are'} evidence-ready. Margin has prepared the work; it will move only under your current filing authority.`;
    }
    if (detectedOpportunitiesCount > 0) {
      return `We are checking ${pluralize(detectedOpportunitiesCount, 'Amazon event')} against your records. Nothing will move forward until it is supportable.`;
    }
    if (recoveredCashTotal > 0) {
      return `Margin verified ${formatCurrencyWithSelection(recoveredCashTotal, recoveredCurrency)} in payout. The recovery record stays open until the final financial state is clear.`;
    }
    return 'Margin examined the records in scope. No justified recovery action is open right now.';
  }, [
    activeSyncId,
    approvedClaimsCount,
    dashboardSummary,
    detectedOpportunitiesCount,
    filedClaimsCount,
    formatCurrencyWithSelection,
    launchMetrics,
    launchMonitor,
    recoveredClaimsCount,
    recoveredCashTotal,
    recoveredCurrency,
    syncTriggered
  ]);
  const overviewNarrative = useMemo(() => {
    const narrativeNeedsEvidenceCount = launchMetrics?.agent7_needs_evidence_count ?? 0;
    const latestEventTimestamp = latestOperationalEvent?.timestamp
      ? new Date(latestOperationalEvent.timestamp)
      : null;
    const lastCheckedSummary = latestEventTimestamp && !Number.isNaN(latestEventTimestamp.getTime())
      ? `Last checked ${formatDistanceToNow(latestEventTimestamp, { addSuffix: true })}.`
      : dashboardSummary
        ? `Last checked ${formattedLastUpdated}.`
        : 'Margin is establishing the latest recovery position.';

    if (narrativeNeedsEvidenceCount > 0) {
      return `${lastCheckedSummary} ${pluralize(narrativeNeedsEvidenceCount, 'recovery')} need${narrativeNeedsEvidenceCount === 1 ? 's' : ''} purchase evidence before Margin can move ${narrativeNeedsEvidenceCount === 1 ? 'it' : 'them'} forward. Nothing has been filed without that proof.`;
    }
    if (primaryBlocker) {
      return `${lastCheckedSummary} Margin is holding ${pluralize(primaryBlocker.count, 'recovery')} until the records establish the next justified step.`;
    }
    if (needsSync) {
      return `${lastCheckedSummary} Margin needs a fresh Amazon record pull before it can update this position.`;
    }
    if (recoveredCashTotal > 0) {
      return `${lastCheckedSummary} Margin has verified the payout recorded here and is still watching the remaining recovery work.`;
    }
    return `${lastCheckedSummary} No action is needed from you. Margin is still checking the records in scope.`;
  }, [
    dashboardSummary,
    formattedLastUpdated,
    formatCurrencyWithSelection,
    latestOperationalEvent,
    launchMetrics,
    needsSync,
    primaryBlocker,
    recoveredCashTotal,
    recoveredCurrency
  ]);
  const overviewStatusRows = useMemo(() => {
    const readyCount = launchMetrics?.agent7_ready_count ?? 0;
    const duplicateBlockedCount = launchMetrics?.agent7_duplicate_blocked_count ?? 0;
    const insufficientDataCount = launchMetrics?.agent7_insufficient_data_count ?? 0;
    const safetyVerificationCount = launchMetrics?.agent7_pending_safety_verification_count ?? 0;
    const filedCount = filedClaimsCount;
    const approvedCount = approvedClaimsCount;
    const paidCount = recoveredClaimsCount;
    const needsEvidenceCount = launchMetrics?.agent7_needs_evidence_count ?? 0;

    const currentStatus = (() => {
      if (!dashboardSummary && !launchMonitor) {
        return {
          label: 'Current status',
          value: 'Checking account status',
          detail: 'Margin is loading the latest filing, thread, and notification truth.'
        };
      }
      if (activeSyncId || syncTriggered) {
        return {
          label: 'Current status',
          value: 'Syncing Amazon data',
          detail: lastSyncResult.detail
        };
      }
      if (needsEvidenceCount > 0) {
        return {
          label: 'Recovery state',
          value: 'Evidence needed',
          detail: `Margin will not advance ${pluralize(needsEvidenceCount, 'recovery')} until the missing proof is clear.`
        };
      }
      if (safetyVerificationCount > 0 || insufficientDataCount > 0) {
        return {
          label: 'Recovery state',
          value: 'Evidence needed',
          detail: `${pluralize(safetyVerificationCount + insufficientDataCount, 'recovery')} remain under review while Margin verifies the identifiers and records.`
        };
      }
      if (approvedCount > 0 && paidCount === 0) {
        return {
          label: 'Recovery state',
          value: 'Payout check',
          detail: `${pluralize(approvedCount, 'case')} have Amazon action to verify against the settlement outcome.`
        };
      }
      if (filedCount > 0) {
        return {
          label: 'Recovery state',
          value: 'With Amazon',
          detail: `${pluralize(filedCount, 'evidence-backed case')} ${filedCount === 1 ? 'is' : 'are'} in active recovery with Amazon.`
        };
      }
      if (readyCount > 0) {
        return {
          label: 'Recovery state',
          value: 'Evidence-backed',
          detail: `${pluralize(readyCount, 'case')} ${readyCount === 1 ? 'is' : 'are'} prepared for the next justified action.`
        };
      }
      if (detectedOpportunitiesCount > 0) {
        return {
          label: 'Recovery state',
          value: 'Under review',
          detail: `Margin is checking ${pluralize(detectedOpportunitiesCount, 'Amazon event')} against the records in scope.`
        };
      }
      if (recoveredCashTotal > 0) {
        return {
          label: 'Recovery state',
          value: 'Paid and verified',
          detail: `${formatCurrencyWithSelection(recoveredCashTotal, recoveredCurrency)} has been matched to the expected recovery record.`
        };
      }
      return {
        label: 'Recovery state',
        value: 'No open recovery action',
        detail: 'Margin examined the records in scope and is continuing to watch for a justified recovery action.'
      };
    })();

    const lastMovement = (() => {
      if (latestOperationalEvent) {
        const timestamp = new Date(latestOperationalEvent.timestamp);
        const relativeTime = Number.isNaN(timestamp.getTime())
          ? 'recently'
          : formatDistanceToNow(timestamp, { addSuffix: true });

        return {
          label: 'Last movement',
          value: formatLaunchEventTypeLabel(latestOperationalEvent.event_type),
          detail: `${latestOperationalEvent.title}. Recorded ${relativeTime}.${latestOperationalEvent.amazon_case_id ? ` Amazon case ${latestOperationalEvent.amazon_case_id}.` : ''}`
        };
      }
      if (dashboardSummary?.last_updated_at) {
        return {
          label: 'Last movement',
          value: 'Dashboard refreshed',
          detail: `Recovery summary updated ${formattedLastUpdated}.`
        };
      }
      return {
        label: 'Last movement',
        value: 'No movement yet',
        detail: 'Margin has not recorded a filing, Amazon thread change, or notification event for this workspace yet.'
      };
    })();

    const needsFromYou = (() => {
      const notificationFailureAlert = activeLaunchAlerts.find((alert) => alert.key === 'notification_failure_present');
      const unmatchedEmailAlert = activeLaunchAlerts.find((alert) => alert.key === 'unmatched_amazon_email_spike');

      if (needsEvidenceCount > 0) {
        return {
          label: 'Needs from you',
          value: 'Send evidence',
          detail: `${pluralize(needsEvidenceCount, 'case')} are waiting on Amazon-requested proof.`
        };
      }
      if (safetyVerificationCount > 0 || insufficientDataCount > 0) {
        return {
          label: 'Needs from you',
          value: 'Verify identifiers',
          detail: `${pluralize(safetyVerificationCount + insufficientDataCount, 'case')} still need shipment, order, or product truth before filing.`
        };
      }
      if (needsSync) {
        return {
          label: 'Needs from you',
          value: 'Refresh account',
          detail: syncMessage || 'Run a refresh so Margin can pull the latest Amazon records.'
        };
      }
      if (duplicateBlockedCount > 0) {
        return {
          label: 'Needs from you',
          value: 'Review duplicate holds',
          detail: `${pluralize(duplicateBlockedCount, 'case')} were held to avoid redundant Amazon filings.`
        };
      }
      if (notificationFailureAlert?.active) {
        return {
          label: 'Needs from you',
          value: 'Check notifications',
          detail: notificationFailureAlert.detail
        };
      }
      if (unmatchedEmailAlert?.active) {
        return {
          label: 'Needs from you',
          value: 'Review unmatched emails',
          detail: unmatchedEmailAlert.detail
        };
      }
      if (readyCount > 0) {
        return {
          label: 'Needs from you',
          value: 'Nothing urgent',
          detail: `${pluralize(readyCount, 'case')} already passed the truth gate and can move when you are ready.`
        };
      }
      return {
        label: 'Needs from you',
        value: 'No action needed',
        detail: 'No action is needed from you. Margin is still checking the records in scope.'
      };
    })();

    return [currentStatus, lastMovement, needsFromYou];
  }, [
    activeLaunchAlerts,
    activeSyncId,
    approvedClaimsCount,
    dashboardSummary,
    detectedOpportunitiesCount,
    filedClaimsCount,
    formattedLastUpdated,
    formatCurrencyWithSelection,
    lastSyncResult.detail,
    latestOperationalEvent,
    launchMetrics,
    launchMonitor,
    needsSync,
    recoveredClaimsCount,
    recoveredCashTotal,
    recoveredCurrency,
    syncMessage,
    syncTriggered
  ]);
  const overviewCurrentStatus = overviewStatusRows[0];
  const overviewNeedsFromYou = overviewStatusRows[2];
  const readyToFileCount = launchMetrics?.agent7_ready_count ?? 0;
  const needsEvidenceCount = launchMetrics?.agent7_needs_evidence_count ?? 0;
  const safetyVerificationCount = launchMetrics?.agent7_pending_safety_verification_count ?? 0;
  const insufficientDataCount = launchMetrics?.agent7_insufficient_data_count ?? 0;
  const inMotionClaimsCount = filedClaimsCount + approvedClaimsCount;
  const inMotionValueTotal = filedValueTotal + approvedValueTotal;
  const blockedPipelineCount = needsEvidenceCount + safetyVerificationCount + insufficientDataCount;
  const filingAuthority = useMemo(() => {
    if (dashboardAutoFileLoading) {
      return {
        label: 'Checking filing authority',
        detail: 'Margin is confirming the current seller-approved filing boundary.'
      };
    }

    if (!dashboardAutoFileEnabled) {
      return {
        label: 'Review before filing',
        detail: 'Margin prepares evidence-backed work. You approve each new filing.'
      };
    }

    const authorityPaused = dashboardAutoFileGateStatus?.globalFilingEnabled === false
      || dashboardAutoFileGateStatus?.queueAvailable === false
      || dashboardAutoFileGateStatus?.paymentRequired === true;

    if (authorityPaused) {
      return {
        label: 'Filing authority paused',
        detail: 'Margin can continue examining and preparing work. No new filing will be submitted until you change this.'
      };
    }

    return {
      label: 'Approved filing authority',
      detail: 'Margin may submit only evidence-complete cases that meet the rules you approved.'
    };
  }, [dashboardAutoFileEnabled, dashboardAutoFileGateStatus, dashboardAutoFileLoading]);

  const overviewFoundValueLabel = useMemo(
    () => formatCurrencyWithSelection(estimatedValueTotal, recoveredCurrency),
    [estimatedValueTotal, formatCurrencyWithSelection, recoveredCurrency]
  );
  const overviewInMotionValueLabel = useMemo(
    () => formatCurrencyWithSelection(inMotionValueTotal, recoveredCurrency),
    [formatCurrencyWithSelection, inMotionValueTotal, recoveredCurrency]
  );
  const overviewPaidBackValueLabel = useMemo(
    () => formatCurrencyWithSelection(recoveredCashTotal, recoveredCurrency),
    [formatCurrencyWithSelection, recoveredCashTotal, recoveredCurrency]
  );
  const overviewHeroMetrics = useMemo(() => ([
    {
        label: 'With Amazon',
        value: overviewInMotionValueLabel,
        detail: inMotionClaimsCount > 0
          ? `${pluralize(inMotionClaimsCount, 'case')} filed, under review, or in payout check`
          : 'No evidence-backed case is with Amazon yet.'
    },
    {
        label: 'Paid and verified',
        value: overviewPaidBackValueLabel,
        detail: recoveredCashTotal > 0
          ? `${pluralize(recoveredClaimsCount, 'case')} matched to the expected recovery record`
          : 'Margin has not verified a payout yet.'
    }
  ]), [
    inMotionClaimsCount,
    overviewInMotionValueLabel,
    overviewPaidBackValueLabel,
    recoveredCashTotal,
    recoveredClaimsCount
  ]);
  const overviewPipelineStages = useMemo(() => {
    const blockedDetail = needsEvidenceCount > 0
      ? `${pluralize(needsEvidenceCount, 'case')} waiting on Amazon-requested proof`
      : blockedPipelineCount > 0
        ? `${pluralize(blockedPipelineCount, 'case')} still need verified identifiers`
        : 'No blockers are holding cases back right now';

    return [
      {
        label: 'Under review',
        value: pluralize(detectedOpportunitiesCount, 'event'),
        detail: detectedOpportunitiesCount > 0 ? `${overviewFoundValueLabel} under review` : 'No Amazon events are under review.',
        tone: detectedOpportunitiesCount > 0 ? 'border-[#C8D8FF] bg-[#F2F7FF]' : 'border-[#E9E9EC] bg-[#FAFAFB]',
        dotTone: detectedOpportunitiesCount > 0 ? 'bg-[#0B74DE]' : 'bg-[#D1D5DB]',
        active: detectedOpportunitiesCount > 0,
        onClick: () => handleTabChange('discrepancies')
      },
      {
        label: 'Evidence needed',
        value: pluralize(blockedPipelineCount, 'case'),
        detail: blockedDetail,
        tone: blockedPipelineCount > 0 ? 'border-[#F4C6CD] bg-[#FFF6F7]' : 'border-[#DCE8EE] bg-[#FAFAF7]',
        dotTone: blockedPipelineCount > 0 ? 'bg-[#BE3A4A]' : 'bg-[#B8C4CE]',
        active: blockedPipelineCount > 0,
        onClick: () => navigate(tenantRoute(activeSlug, '/dispute-cases'))
      },
      {
        label: 'With Amazon',
        value: pluralize(filedClaimsCount, 'case'),
        detail: filedClaimsCount > 0 ? `${formatCurrencyWithSelection(filedValueTotal, recoveredCurrency)} in active recovery` : 'No evidence-backed case is with Amazon yet.',
        footerDetail: 'Oldest waiting 5 days',
        tone: filedClaimsCount > 0 ? 'border-[#C8D8FF] bg-[#F2F7FF]' : 'border-[#E9E9EC] bg-[#FAFAFB]',
        dotTone: filedClaimsCount > 0 ? 'bg-[#0B74DE]' : 'bg-[#D1D5DB]',
        active: filedClaimsCount > 0,
        onClick: () => navigate(tenantRoute(activeSlug, '/dispute-cases'))
      },
      {
        label: 'Payout check',
        value: pluralize(approvedClaimsCount, 'case'),
        detail: approvedClaimsCount > 0 ? `${formatCurrencyWithSelection(approvedValueTotal, recoveredCurrency)} awaiting payout verification` : 'No Amazon action is awaiting payout verification.',
        tone: approvedClaimsCount > 0 ? 'border-[#D9D1FF] bg-[#F7F5FF]' : 'border-[#E9E9EC] bg-[#FAFAFB]',
        dotTone: approvedClaimsCount > 0 ? 'bg-[#5B4BB7]' : 'bg-[#D1D5DB]',
        active: approvedClaimsCount > 0,
        onClick: () => navigate(tenantRoute(activeSlug, '/recoveries'))
      },
      {
        label: 'Paid and verified',
        value: overviewPaidBackValueLabel,
        detail: recoveredCashTotal > 0 ? `${pluralize(recoveredClaimsCount, 'case')} matched to the expected recovery record` : 'Margin has not verified a payout yet.',
        tone: recoveredCashTotal > 0 ? 'border-[#B9E6D3] bg-[#F4FBF7]' : 'border-[#E9E9EC] bg-[#FAFAFB]',
        dotTone: recoveredCashTotal > 0 ? 'bg-[#2B7A5A]' : 'bg-[#D1D5DB]',
        active: recoveredCashTotal > 0,
        onClick: () => navigate(tenantRoute(activeSlug, '/recoveries'))
      }
    ];
  }, [
    activeSlug,
    approvedClaimsCount,
    approvedValueTotal,
    blockedPipelineCount,
    detectedOpportunitiesCount,
    filedClaimsCount,
    filedValueTotal,
    formatCurrencyWithSelection,
    handleTabChange,
    navigate,
    needsEvidenceCount,
    overviewFoundValueLabel,
    overviewPaidBackValueLabel,
    recoveredCashTotal,
    recoveredClaimsCount,
    recoveredCurrency,
  ]);
  const isOverviewLoading = !dashboardSummary && !launchMonitor;
  if (!activeSlug) {
    return (
      <div className="platform-vitality-dashboard relative flex h-screen min-h-screen flex-col overflow-hidden bg-[#FAFAF7] text-[#111827]">
        <Navbar sidebarCollapsed={isSidebarCollapsed} forceTransparent />
        <div className="flex-1 flex h-full overflow-hidden">
          <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
          <main className={cn('flex-1 transition-all duration-300 overflow-y-auto font-montserrat', mainClass)}>
            <div className="relative pt-8 px-8">
              <div className="rounded-[2px] border border-[#D8E3E8] bg-white p-8 text-[#111827] shadow-none">
                <h1 className="text-lg font-sans font-bold tracking-tight">Tenant context required</h1>
                <p className="mt-3 font-sans text-sm text-[#4B5563]">
                  Dashboard metrics are blocked until a real tenant workspace is selected.
                </p>
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div
      className="platform-vitality-dashboard relative flex h-screen min-h-screen flex-col overflow-hidden bg-[#FAFAF7] text-[#111827]">
      <div className="pointer-events-none absolute inset-0 bg-[#FAFAF7]" />

      <Navbar
        sidebarCollapsed={isSidebarCollapsed}
        forceTransparent
      />
      <div className="flex-1 flex h-full overflow-hidden">
        <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
        <main className={cn('flex-1 transition-all duration-300 overflow-y-auto font-montserrat', mainClass)}>
          <div className="relative pt-8">
            <div className="relative mx-auto w-full max-w-full px-8 pb-8 text-[#111827]">
              {/* Recovery control header */}
              <header className="mb-7">
                <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
                  <div className="min-w-0">
                    <p className="text-[12px] font-sans font-medium text-[#66737F]">
                      Recovery control
                    </p>
                    <h1 className="mt-1 font-lora text-[30px] font-normal leading-tight tracking-tight text-[#182026] sm:text-[34px]">
                      Your recovery position
                    </h1>
                  </div>

                  <div className="flex shrink-0 items-center gap-2.5 self-start px-1 py-1 xl:self-auto">
                    <Switch
                      checked={dashboardAutoFileEnabled}
                      onCheckedChange={(checked) => {
                        void handleDashboardAutoFileChange(checked);
                      }}
                      disabled={dashboardAutoFileLoading || dashboardAutoFileSaving}
                      aria-label="Filing authority seller-controlled switch"
                      className="h-5 w-9 border border-[#B8C4CE] data-[state=checked]:bg-[#0B74DE] data-[state=unchecked]:bg-[#8A99A5]"
                    />
                    <div className="min-w-0">
                      <p className="text-[13px] font-sans font-medium text-[#182026]">
                        {filingAuthority.label}
                      </p>
                      <p className="mt-0.5 max-w-[300px] text-[10px] font-sans leading-4 text-[#66737F]">
                        {filingAuthority.detail}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex flex-col border-b border-[#DCE8EE] sm:flex-row sm:items-end sm:justify-between sm:gap-6">
                  <div
                    role="tablist"
                    aria-label="Recovery position views"
                    className="-mb-px flex min-w-0 overflow-x-auto"
                  >
                    <button
                      role="tab"
                      aria-selected={activeTab === 'overview'}
                      onClick={() => handleTabChange('overview')}
                      className={cn(
                        "shrink-0 border-b-2 px-0 py-3 pr-6 text-[12px] font-sans transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B74DE]/30 focus-visible:ring-inset",
                        activeTab === 'overview'
                          ? "border-[#0B74DE] font-medium text-[#182026]"
                          : "border-transparent text-[#66737F] hover:border-[#C7D7DF] hover:text-[#182026]"
                      )}
                    >
                      Position
                    </button>
                    <button
                      role="tab"
                      aria-selected={activeTab === 'discrepancies'}
                      onClick={() => handleTabChange('discrepancies')}
                      className={cn(
                        "shrink-0 border-b-2 px-0 py-3 pr-6 text-[12px] font-sans transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B74DE]/30 focus-visible:ring-inset",
                        activeTab === 'discrepancies'
                          ? "border-[#0B74DE] font-medium text-[#182026]"
                          : "border-transparent text-[#66737F] hover:border-[#C7D7DF] hover:text-[#182026]"
                      )}
                    >
                      Work in progress
                    </button>
                    <button
                      role="tab"
                      aria-selected={activeTab === 'evidence'}
                      onClick={() => handleTabChange('evidence')}
                      className={cn(
                        "shrink-0 border-b-2 px-0 py-3 text-[12px] font-sans transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B74DE]/30 focus-visible:ring-inset",
                        activeTab === 'evidence'
                          ? "border-[#0B74DE] font-medium text-[#182026]"
                          : "border-transparent text-[#66737F] hover:border-[#C7D7DF] hover:text-[#182026]"
                      )}
                    >
                      Proof record
                    </button>
                  </div>
                  <p className="pb-3 text-[10px] font-sans text-[#8A99A5] sm:text-right">
                    {discrepancyHeaderLastUpdatedLabel}
                  </p>
                </div>
              </header>

              {activeTab === 'overview' ? (
                <div className="relative space-y-5 text-[#182026]">
                  <div className="relative z-10 space-y-5">
                    <div className="space-y-5">
                      <section aria-labelledby="recovery-pipeline-heading" className="rounded-[10px] border border-[#DCE8EE] bg-white p-5 shadow-[0_2px_8px_rgba(24,32,38,0.03)] sm:p-6">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                          <div>
                            <h2 id="recovery-pipeline-heading" className="font-lora text-[22px] font-normal tracking-tight text-[#182026]">
                              Recovery in motion
                            </h2>
                            <p className="mt-1.5 text-[12px] font-sans leading-5 text-[#66737F]">
                              Each event must earn its next step.
                            </p>
                          </div>
                          <Select value={pipelineWindow} onValueChange={setPipelineWindow}>
                            <SelectTrigger className="h-9 w-[160px] self-start rounded-[8px] border-[#DCE8EE] bg-[#FAFAF7] px-3 text-[11px] font-sans font-medium text-[#4D5B66] shadow-none focus:ring-0 focus:ring-offset-0 lg:self-auto">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent align="end" className="rounded-[8px] border-[#DCE8EE] bg-white text-[11px] font-sans text-[#4D5B66] shadow-[0_8px_24px_rgba(24,32,38,0.08)]">
                              <SelectItem value="90d">Last 90 days</SelectItem>
                              <SelectItem value="30d">Last 30 days</SelectItem>
                              <SelectItem value="12m">Last 12 months</SelectItem>
                              <SelectItem value="all">All time</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="mt-5 grid overflow-hidden rounded-[8px] border border-[#DCE8EE] sm:grid-cols-2 xl:grid-cols-5">
                          {overviewPipelineStages.map((stage) => (
                            <button
                              key={stage.label}
                              onClick={stage.onClick}
                              className={cn(
                                "group/stage min-h-[142px] border-b border-[#DCE8EE] px-4 py-4 text-left transition-colors duration-200 hover:bg-[#F8FBFD] sm:[&:nth-child(odd)]:border-r xl:border-b-0 xl:border-r xl:[&:nth-child(odd)]:border-r xl:last:border-r-0",
                                stage.active ? stage.tone : "bg-white"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                <span className={cn("h-2 w-2 rounded-full", stage.dotTone)} />
                                <span className="text-[11px] font-sans font-medium text-[#4D5B66]">
                                  {stage.label}
                                </span>
                              </div>
                              <div className="mt-4 text-[18px] font-sans font-medium leading-none tracking-tight text-[#182026]">
                                {isOverviewLoading ? (
                                  <Skeleton className="h-5 w-20 bg-[#E8EFF3]" />
                                ) : (
                                  stage.value
                                )}
                              </div>
                              <p className="mt-3 text-[11px] font-sans leading-5 text-[#66737F]">
                                {stage.detail}
                              </p>
                              {'footerDetail' in stage && stage.footerDetail ? (
                                <>
                                  <div className="mt-3 h-px w-full bg-[#DCE8EE]" />
                                  <p className="mt-2 text-[10px] font-sans leading-4 text-[#66737F]">
                                    {stage.footerDetail}
                                  </p>
                                </>
                              ) : null}
                            </button>
                          ))}
                        </div>
                      </section>

                      <section aria-labelledby="recovery-position-heading" className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(220px,0.65fr)_minmax(220px,0.65fr)]">
                        <article className="rounded-[10px] border border-[#DCE8EE] bg-white p-6 shadow-[0_2px_8px_rgba(24,32,38,0.03)] xl:p-7">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-[11px] font-sans font-medium text-[#66737F]">
                                Recovery position
                              </p>
                              <div className="mt-2 flex items-center gap-2 text-[11px] font-sans font-medium text-[#4D5B66]">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#0B74DE]" />
                                {overviewCurrentStatus.value}
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-sans text-[#8A99A5]">Amount under review</p>
                              {isOverviewLoading ? (
                                <Skeleton className="mt-2 ml-auto h-9 w-32 bg-[#E8EFF3]" />
                              ) : (
                                <p className="mt-1 text-[34px] font-sans font-light leading-none tracking-tight text-[#182026] sm:text-[40px]">
                                  {overviewFoundValueLabel}
                                </p>
                              )}
                              <p className="mt-2 max-w-[205px] text-[10px] font-sans leading-4 text-[#66737F]">
                                Not recovered. Margin is still establishing what the records support.
                              </p>
                              <p className="mt-1 text-[10px] font-sans text-[#66737F]">
                                {pluralize(detectedOpportunitiesCount, 'Amazon event')} under review
                              </p>
                            </div>
                          </div>

                          <h2 id="recovery-position-heading" className="mt-7 max-w-3xl font-lora text-[28px] font-normal leading-[1.16] tracking-tight text-[#182026] xl:text-[34px]">
                            {overviewHeadline}
                          </h2>
                          <p className="mt-4 max-w-3xl text-[13px] font-sans leading-6 text-[#4D5B66]">
                            {overviewNarrative}
                          </p>

                          <div className="mt-5 border-t border-[#DCE8EE] pt-4">
                            <p className="text-[11px] font-sans leading-5 text-[#66737F]">
                              Amounts are not recovered until Margin verifies the payout against the expected recovery record.
                            </p>
                          </div>

                          <div className="mt-5 flex flex-wrap gap-2">
                            {readyToFileCount > 0 ? (
                              <div className="inline-flex items-center gap-2 rounded-[6px] border border-[#B9E6D3] bg-[#F4FBF7] px-3 py-1.5 text-[10px] font-sans font-medium text-[#26785E]">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#5BC9A8]" />
                                {pluralize(readyToFileCount, 'case')} ready to file
                              </div>
                            ) : null}
                            <div className="inline-flex items-center gap-2 rounded-[6px] border border-[#DCE8EE] bg-[#FAFAF7] px-3 py-1.5 text-[10px] font-sans text-[#4D5B66]">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#8A99A5]" />
                              {overviewNeedsFromYou.detail}
                            </div>
                            {latestDashboardSignalLabel ? (
                              <div className="inline-flex items-center gap-2 rounded-[6px] border border-[#DCE8EE] bg-[#FAFAF7] px-3 py-1.5 text-[10px] font-sans text-[#4D5B66]">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#66A9E8]" />
                                {latestDashboardSignalLabel}
                              </div>
                            ) : null}
                          </div>
                        </article>

                        {overviewHeroMetrics.map((item) => (
                          <article
                            key={item.label}
                            className="flex min-h-[186px] flex-col rounded-[10px] border border-[#DCE8EE] bg-white p-5 shadow-[0_2px_8px_rgba(24,32,38,0.03)] transition-colors duration-200 hover:bg-[#F8FBFD]"
                          >
                            <p className="text-[11px] font-sans font-medium text-[#66737F]">
                              {item.label}
                            </p>
                            <div className="mt-5 text-[30px] font-sans font-medium leading-none tracking-tight text-[#182026]">
                              {isOverviewLoading ? (
                                <Skeleton className="h-8 w-28 bg-[#E8EFF3]" />
                              ) : (
                                item.value
                              )}
                            </div>
                            <p className="mt-auto pt-5 text-[12px] font-sans leading-6 text-[#66737F]">
                              {item.detail}
                            </p>
                          </article>
                        ))}
                      </section>
                    </div>

                  {/* System Activity - Audit Registry Sidebar */}
                  <div className="hidden lg:col-span-1">
                    <div className="bg-white border border-[#D8E3E8] rounded-[2px] h-full flex flex-col shadow-none relative overflow-hidden">
                      

                      <div className="px-5 py-4 border-b border-[#D8E3E8] bg-[#FAFAFB] flex items-center justify-between w-full transition-all group">
                        <div className="flex items-center gap-4">
                          <div>
                            <h3 className="text-[12px] font-medium text-[#1B1C20] tracking-tight">Your Notifications</h3>
                            <p className="text-[10px] font-sans font-bold text-[#9CA3AF] uppercase tracking-tight mt-1">
                              User-scoped activity
                            </p>
                          </div>
                        </div>
                      </div>

                      {true && (
                        <>
                          <div className="flex-1 max-h-[800px] overflow-y-auto scrollbar-hide divide-y divide-white/5">
                            {displayNotifications.length === 0 ? (
                              <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                                <div className="relative flex h-3 w-3 mb-6">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E9E9EC] opacity-20"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#B8C4CE]"></span>
                                </div>
                                <p className="text-[10px] text-[#858792] font-mono uppercase tracking-tight">No recent notifications</p>
                              </div>
                            ) : (
                              <div className="flex flex-col">
                                {displayNotifications.slice(0, 15).map((notification) => {
                                  const isUnread = notification.status !== 'read';
                                  const notificationDate = new Date(notification.created_at);
                                  const isValidDate = notificationDate instanceof Date && !isNaN(notificationDate.getTime());
                                  const timeAgo = isValidDate
                                    ? formatDistanceToNow(notificationDate, { addSuffix: true })
                                    : 'time unavailable';
                                  const typeLabel = (notification.type || 'notification').replace(/_/g, ' ');
                                  const notificationLabel = stripEmojis(notification.title) || 'Notification';

                                  return (
                                    <HoverCard key={notification.id} openDelay={100} closeDelay={100}>
                                      <HoverCardTrigger asChild>
                                        <div
                                          className={cn(
                                            "group relative px-5 py-4 cursor-pointer transition-all duration-300 border-l-2 border-transparent hover:bg-[#F2F7FF]",
                                            isUnread ? "bg-[#F2F7FF] border-l-[#0B74DE]" : "bg-transparent"
                                          )}
                                          onClick={() => navigate(tenantRoute(activeSlug, '/recoveries'))}>

                                          {/* Hover Glow Bar */}
                                          <div className="absolute left-[-2px] top-3 bottom-3 w-[2px] bg-white/60 shadow-[0_0_15px_rgba(255,255,255,0.2)] opacity-0 group-hover:opacity-100 transition-opacity" />

                                          <div className="flex flex-col gap-1.5">
                                            <div className="flex items-center justify-between gap-4">
                                              <p className={cn(
                                                "text-[11px] tracking-tight truncate font-semibold",
                                                isUnread ? "text-[#111827]" : "text-[#6B7280] group-hover:text-[#0B74DE] transition-colors"
                                              )}>
                                                {notificationLabel}
                                              </p>
                                            </div>

                                            <div className="flex items-center justify-between">
                                              <div className="flex items-center gap-2">
                                                <span className={cn(
                                                  "text-[9px] font-mono font-bold",
                                                  isUnread ? "text-[#0B74DE]" : "text-[#9CA3AF]"
                                                )}>
                                                  {typeLabel}
                                                </span>
                                                <span className="text-[#D8D8DE] h-2 w-[1px] bg-[#E9E9EC]" />
                                                <span className="text-[9px] text-[#9CA3AF] font-mono uppercase">
                                                  {notification.id.substring(0, 8).toUpperCase()}
                                                </span>
                                              </div>
                                              <span className="text-[9px] text-[#858792] font-mono tabular-nums">
                                                {formatLedgerDate(notification.created_at)}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      </HoverCardTrigger>

                                      <HoverCardContent side="left" align="start" className="w-80 p-0 overflow-hidden border-gray-100 rounded-none shadow-2xl animate-in fade-in slide-in-from-right-1">
                                        {/* ... Tooltip content remains same ... */}
                                        <div className="p-5">
                                          <div className="flex items-center gap-3 mb-3">
                                            <div className={cn(
                                              "px-2 py-0.5 text-xs font-bold border",
                                              notification.type === 'funds_deposited' || notification.type === 'refund_approved' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                                notification.type === 'amazon_challenge' || notification.type === 'user_action_required' ? "bg-[#FFF6F7] text-[#8B3541] border-[#F4C6CD]" :
                                                  "bg-blue-50 text-blue-700 border-blue-100"
                                            )}>
                                              {notification.type.replace(/_/g, ' ')}
                                            </div>
                                            <span className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                                              <Clock className="h-3 w-3" />
                                              {timeAgo}
                                            </span>
                                          </div>

                                          <h4 className="text-[13px] font-semibold text-gray-900 leading-snug mb-3">
                                            {notification.title}
                                          </h4>

                                          <div className="text-sm text-gray-600 leading-relaxed bg-gray-50/50 p-4 border border-gray-100 font-mono">
                                            {renderNotificationMessage(notification.message)}
                                          </div>

                                          <div className="mt-4 flex items-center justify-between pt-4 border-t border-gray-50">
                                            <span className="text-xs text-gray-400 font-mono">
                                              LOG.{notification.id.substring(0, 8).toUpperCase()}
                                            </span>
                                            <button
                                              onClick={() => {
                                                if (notification.type === 'claim_detected') {
                                                  setActiveDiscrepancy(notification);
                                                  setShowDiscrepancyModal(true);
                                                } else {
                                                  navigate(tenantRoute(activeSlug, '/recoveries'));
                                                }
                                              }}
                                              className="text-xs font-bold text-gray-900 flex items-center gap-1.5 hover:underline">
                                              {notification.type === 'claim_detected' ? 'Open' : 'Open Record'} <ArrowRight className="h-3 w-3" />
                                            </button>
                                          </div>
                                        </div>
                                      </HoverCardContent>
                                    </HoverCard>
                                  );
                                })}
                              </div>
                            )}
                          </div>

                          <div className="border-t border-[#F0F0F2] p-4 bg-[#FAFAFB]">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(tenantRoute(activeSlug, '/notifications'))}
                              className="w-full h-8 text-[10px] font-mono font-bold text-[#6B7280] hover:text-[#0B74DE] uppercase tracking-tight transition-colors"
                            >
                              All Notifications
                            </Button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                </div>
              ) : activeTab === 'discrepancies' ? (
                <div className="space-y-4">
                  {/* Issues Found View */}
                  <div className="relative space-y-4">
                    <div className="border-b border-[#DCE8EE] pb-5">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-3xl">
                          <p className="text-[11px] font-sans font-medium text-[#66737F]">Work in progress</p>
                          <h2 className="mt-2 font-lora text-[26px] font-normal leading-tight tracking-tight text-[#182026]">
                            {issuesFoundHeading}
                          </h2>
                          <p className="mt-3 text-[12px] font-sans leading-5 text-[#4D5B66]">
                            {issuesFoundProofHeadline}
                          </p>
                          <p className="mt-2 max-w-3xl text-[11px] font-sans leading-5 text-[#66737F]">
                            {issuesFoundDescription}
                          </p>
                        </div>
                        {latestDashboardSignalLabel ? (
                          <div className="flex shrink-0 items-center gap-2 rounded-[6px] border border-[#DCE8EE] bg-white px-3 py-2 text-[10px] font-sans text-[#4D5B66] shadow-[0_2px_8px_rgba(24,32,38,0.03)]">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#66A9E8]" />
                            {latestDashboardSignalLabel}
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-5 flex flex-wrap gap-x-8 gap-y-3 border-t border-[#DCE8EE] pt-4">
                        {issuesFoundSummaryRows.map((item) => (
                          <div key={item.label} className="min-w-[140px]">
                            <p className="text-[10px] font-sans text-[#8A99A5]">
                              {item.label}
                            </p>
                            <p
                              className={cn(
                                "mt-1 text-[14px] font-sans font-medium leading-none tracking-tight",
                                item.valueTone === 'muted'
                                  ? 'text-[#4D5B66]'
                                  : 'text-[#182026]'
                              )}
                            >
                              {item.value}
                            </p>
                          </div>
                        ))}
                      </div>

                      {isSyncScopedDetections ? (
                        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-[10px] font-sans tracking-tight text-[#6B7280]">
                          {syncScopedDetectionMetaRows.map((item) => (
                            <span key={item.label}>
                              {item.label}: <span className="text-[#50525B]">{item.value}</span>
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    {loadingDetections ? (
                      <div className="border-y border-[#E9E9EC] py-12 flex flex-col items-center justify-center gap-4">
                        <Loader2 className="h-6 w-6 text-[#6B7280] animate-spin" />
                        <div className="text-center">
                          <div className="text-[11px] font-sans font-medium text-[#6B7280] tracking-tight animate-pulse">
                            {issuesFoundLoadingState.title}
                          </div>
                          <div className="mt-2 text-[11px] font-sans leading-5 text-[#858792] tracking-tight">
                            {issuesFoundLoadingState.detail}
                          </div>
                        </div>
                      </div>
                    ) : visibleDetectionResults.length === 0 ? (
                      <div className="border-y border-[#E9E9EC] py-12 flex flex-col items-center justify-center text-center">
                        <div className="text-[9px] font-sans font-medium uppercase tracking-tight text-[#858792]">No rows</div>
                        <h3 className="mt-3 text-[15px] font-sans font-medium text-[#1B1C20] tracking-tight">
                          {isSyncScopedDetections ? syncScopedEmptyState?.title : 'No open issues right now'}
                        </h3>
                        <p className="text-[11px] text-[#6B7280] mt-2 font-sans max-w-sm mx-auto leading-5">
                          {isSyncScopedDetections
                            ? syncScopedEmptyState?.description
                            : 'Margin is not holding any unresolved findings in this view right now.'}
                        </p>
                        {isSyncScopedDetections && syncScopedEmptyState?.showViewAllCta ? (
                          <button
                            onClick={() => navigate({
                              pathname: tenantRoute(activeSlug, '/dashboard'),
                              search: '?tab=discrepancies',
                            })}
                            className="mt-6 flex h-8 items-center gap-3 border border-[#E9E9EC] px-4 text-[10px] font-sans font-medium uppercase tracking-tight text-[#1B1C20] transition-colors hover:bg-[#FAFAFB] group"
                          >
                            <span>View all detections</span>
                            <ArrowRight className="h-3 w-3 text-[#858792] group-hover:translate-x-1 transition-transform" />
                          </button>
                        ) : !isSyncScopedDetections ? (
                          <button
                            onClick={() => navigate(tenantRoute(activeSlug, '/recoveries'))}
                            className="mt-6 flex h-8 items-center gap-3 border border-[#E9E9EC] px-4 text-[10px] font-sans font-medium uppercase tracking-tight text-[#1B1C20] transition-colors hover:bg-[#FAFAFB] group"
                          >
                            <span>View {filedClaimsCount} filed {filedClaimsCount === 1 ? 'case' : 'cases'}</span>
                            <ArrowRight className="h-3 w-3 text-[#858792] group-hover:translate-x-1 transition-transform" />
                          </button>
                        ) : null}
                      </div>
                    ) : (
                      <div>
                        <div className="border-b border-[#E9E9EC] py-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                          <div className="text-[11px] font-sans tracking-tight text-[#6B7280]">
                            {isSyncScopedDetections
                              ? 'Review the findings currently shown for this upload. Processed rows and active filters can make the table count smaller than the upload total above.'
                              : 'Open the findings below to review what is ready, what is filed, and what still needs attention.'}
                          </div>
                          <div className="flex items-center gap-4">
                            {isRefreshingFindings ? (
                              <div className="inline-flex items-center gap-2 text-[10px] font-sans font-medium tracking-tight text-[#6B7280]">
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Refreshing findings
                              </div>
                            ) : null}
                            <div className="flex items-center gap-3">
                              <span className="text-[11px] font-sans font-medium text-[#858792] tracking-tight">Show processed</span>
                              <button
                                onClick={() => setShowProcessed(!showProcessed)}
                                className={cn(
                                  "w-8 h-4 rounded-full relative transition-colors duration-300",
                                  showProcessed ? "bg-[#B8C4CE]" : "bg-[#E9E9EC]"
                                )}
                              >
                                <div className={cn(
                                  "absolute top-0.5 left-0.5 w-3 h-3 rounded-full bg-white transition-transform duration-300",
                                  showProcessed ? "translate-x-4" : "translate-x-0"
                                )} />
                              </button>
                            </div>
                          <Button
                            onClick={handleBatchExport}
                            disabled={isExporting}
                            className={`h-8 rounded-none px-4 bg-transparent hover:bg-[#FAFAFB] text-[#50525B] hover:text-[#0B74DE] border border-[#E9E9EC] text-[10px] font-sans font-medium uppercase tracking-tight transition-all ${isExporting ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {isExporting ? (
                              <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                            ) : (
                              <Download className="h-3 w-3 mr-2" />
                            )}
                            Export findings
                          </Button>
                          </div>
                        </div>
                        {isSyncScopedDetections && syncScopedResultCapDisclosure ? (
                          <div className="border-b border-[#F4C6CD] bg-[#FFF6F7] px-4 py-3 text-[11px] font-sans leading-5 text-[#8B3541]">
                            {syncScopedResultCapDisclosure}
                          </div>
                        ) : null}

                        <div className="border-y border-[#E9E9EC] bg-transparent">
                          <div className="hidden border-b border-[#F0F0F2] px-5 py-3 xl:grid xl:grid-cols-[minmax(0,1.35fr)_150px_minmax(0,1fr)_auto] xl:gap-5">
                            {['Issue', 'Value', 'Movement', 'Action'].map((label) => (
                              <div key={label} className="text-[9px] font-sans font-medium uppercase tracking-tight text-[#858792]">
                                {label}
                              </div>
                            ))}
                          </div>
                          <div className="divide-y divide-[#F0F0F2]">
                            {visibleDetectionResults.map((result, index) => {
                              const isProcessed = isProcessedFindingStatus(result.status);
                              const stateMeta = getFindingMovementMeta(result.filing_movement, result.status, result);
                              const StateIcon = stateMeta.Icon;
                              const fallbackIssueCopy = getIssueCopy(result.anomaly_type);
                              const issueCopy = {
                                title: result.seller_summary?.title || fallbackIssueCopy.title,
                                summary: result.seller_summary?.summary || fallbackIssueCopy.summary,
                                eventLabel: result.seller_summary?.event_label || fallbackIssueCopy.eventLabel,
                                recoverabilityReason: result.seller_summary?.recoverability_reason,
                                evidenceSummary: result.seller_summary?.evidence_summary,
                              };
                              const issueLifecycleStateLabel = getIssueLifecycleStateLabel(result);
                              const detectedAt = result.detected_at || result.discovery_date || result.created_at;
                              const foundOnLabel = formatFindingDateTimeLabel(detectedAt);
                              const findingReference = formatFindingReference(result, index);
                              const readinessLabel = formatFindingReadinessLabel(result);
                              const daysRemainingLabel = formatDaysRemainingLabel(result.days_remaining, result.expired);
                              const showDaysRemaining = daysRemainingLabel !== 'Not available';
                              const valueLabel = formatFindingValueLabel(result);
                              const linkedRecoveryCaseId = result.filing_movement?.dispute_case_id || '';
                              const recoveryFocusId = linkedRecoveryCaseId || result.id || '';
                              const linkedRecoverySearch =
                                result.filing_movement?.case_number
                                || result.filing_movement?.amazon_case_id
                                || recoveryFocusId
                                || result.id
                                || '';
                              const openDiscrepancySurface = (surface: 'detail' | 'proof') => {
                                const demoInvestigation = isDemoWorkspace
                                  ? buildDemoFindingInvestigation(result, index)
                                  : null;
                                setActiveDiscrepancy({
                                  id: result.id,
                                  reason: result.anomaly_type,
                                  issueTitle: issueCopy.title,
                                  issueSummary: issueCopy.summary,
                                  issueEventLabel: issueCopy.eventLabel,
                                  recoverabilityReason: issueCopy.recoverabilityReason,
                                  evidenceSummary: issueCopy.evidenceSummary,
                                  estimatedRecovery: result.estimated_value,
                                  currency: result.currency || 'USD',
                                  occurrenceDate: detectedAt,
                                  status: result.status,
                                  stateLabel: stateMeta.label,
                                  stateDetail: stateMeta.detail,
                                  stateTone: stateMeta.tone,
                                  movementLabel: result.filing_movement?.label,
                                  movementDetail: stateMeta.detail,
                                  movementState: result.filing_movement?.state,
                                  nextActionLabel: result.next_action_label || result.filing_movement?.next_action_label,
                                  linkedCaseId: result.filing_movement?.dispute_case_id,
                                  caseNumber: result.filing_movement?.case_number,
                                  amazonCaseId: result.filing_movement?.amazon_case_id,
                                  blockReasons: result.filing_movement?.block_reasons || [],
                                  filingMovement: result.filing_movement,
                                  policyBasis: result.policy_basis,
                                  isProcessed,
                                  sourceType: result.source_type,
                                  syncId: result.sync_id,
                                  severity: result.severity,
                                  confidenceScore: result.confidence_score,
                                  evidence: result.evidence,
                                  deadlineDate: result.deadline_date,
                                  daysRemaining: result.days_remaining,
                                  expired: result.expired,
                                  reviewTier: result.review_tier,
                                  claimReadiness: result.claim_readiness,
                                  recommendedAction: result.recommended_action,
                                  valueLabel: result.value_label,
                                  whyNotClaimReady: result.why_not_claim_ready,
                                  coverageFamily: result.coverage_family,
                                  demoInvestigation,
                                });

                                if (surface === 'proof') {
                                  setShowProofNeededModal(true);
                                  return;
                                }

                                setShowDiscrepancyModal(true);
                              };
                              const openLinkedRecoveryCase = () => {
                                if (!recoveryFocusId) {
                                  openDiscrepancySurface('detail');
                                  return;
                                }

                                const params = new URLSearchParams();
                                params.set('caseId', recoveryFocusId);
                                if (linkedRecoverySearch) {
                                  params.set('q', linkedRecoverySearch);
                                }
                                navigate(tenantRoute(activeSlug, `/recoveries?${params.toString()}`));
                              };

                              return (
                                <div
                                  key={result.id}
                                  className={cn(
                                    "px-5 py-3.5 transition-colors hover:bg-[#F8FAFB]",
                                    isProcessed ? "opacity-70" : ""
                                  )}
                                >
                                  <div className="flex flex-col gap-4 xl:grid xl:grid-cols-[minmax(0,1.35fr)_150px_minmax(0,1fr)_auto] xl:items-center xl:gap-5">
                                  <div className="min-w-0">
                                    <button
                                      type="button"
                                      onClick={openLinkedRecoveryCase}
                                      className="block max-w-full text-left text-[12px] font-sans font-medium tracking-tight text-[#1B1C20] transition-colors hover:text-[#0B74DE] hover:underline hover:underline-offset-4 focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#C8D8FF]"
                                    >
                                      {issueCopy.title}
                                      <span className="text-[#6B7280]"> — {issueLifecycleStateLabel}</span>
                                    </button>
                                    <p className="mt-1.5 max-w-2xl text-[11px] font-sans leading-5 tracking-tight text-[#6B7280]">
                                      {issueCopy.summary}
                                    </p>
                                    <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[10px] font-sans tracking-tight text-[#6B7280]">
                                      <span>Ref {findingReference}</span>
                                      <span>Found {foundOnLabel}</span>
                                      <span>{readinessLabel}</span>
                                      {showDaysRemaining ? (
                                        <span className="inline-flex items-center rounded-[3px] bg-[#0B74DE] px-1.5 py-0.5 text-[9px] font-medium leading-none text-[#FFFFFF]">
                                          {daysRemainingLabel}
                                        </span>
                                      ) : null}
                                    </div>
                                  </div>

                                  <div className="xl:text-right">
                                    <div className="text-[9px] font-sans font-medium uppercase tracking-tight text-[#858792]">
                                      {valueLabel}
                                    </div>
                                    <div className="mt-1.5 text-[16px] font-sans font-medium tracking-tight text-[#1B1C20]">
                                      {result.value_label === 'no_recovery_value'
                                        ? 'Review'
                                        : formatCurrencyWithSelection(result.estimated_value, result.currency || 'USD')}
                                    </div>
                                  </div>

                                  <div className="min-w-0">
                                    <div className="text-[9px] font-sans font-medium uppercase tracking-tight text-[#858792]">
                                      Filing movement
                                    </div>
                                    <div className={cn(
                                      "mt-1.5 inline-flex items-center gap-2 text-[10px] font-sans font-medium tracking-tight text-[#50525B]"
                                    )}>
                                      <StateIcon className="h-3.5 w-3.5" />
                                      <span>{stateMeta.label}</span>
                                    </div>
                                    <p className="mt-1.5 max-w-md text-[10px] font-sans leading-5 text-[#6B7280]">
                                      {stateMeta.detail}
                                    </p>
                                  </div>

                                  <div className="flex items-center justify-end gap-3">
                                    {isProcessed ? (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 rounded-none px-2.5 text-[9px] font-sans font-medium uppercase tracking-tight text-[#50525B] hover:text-[#0B74DE] hover:bg-[#FAFAFB] border border-transparent hover:border-[#E9E9EC] transition-all"
                                        onClick={openLinkedRecoveryCase}
                                      >
                                        Open cases
                                      </Button>
                                    ) : null}
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 rounded-none text-[#9CA3AF] hover:text-[#0B74DE] hover:bg-[#FAFAFB] transition-all border border-transparent hover:border-[#E9E9EC]"
                                        >
                                          <MoreVertical className="h-3.5 w-3.5" />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent
                                        align="end"
                                        className="platform-vitality-page min-w-[180px] rounded-lg border border-[#E5E7EB] bg-white p-1 text-[#111827] shadow-[0_18px_45px_rgba(17,24,39,0.10)] backdrop-blur-xl"
                                      >
                                        <DropdownMenuItem
                                          onClick={() => openDiscrepancySurface('detail')}
                                          className="cursor-pointer rounded-md py-2 text-[11px] font-sans font-medium tracking-tight text-[#4B5563] hover:bg-[#F3F7FF] hover:text-[#0052FF] focus:bg-[#F3F7FF] focus:text-[#0052FF]"
                                        >
                                          <Info className="h-3 w-3 mr-2" />
                                          View finding
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                          onClick={() => openDiscrepancySurface('proof')}
                                          className="cursor-pointer rounded-md py-2 text-[11px] font-sans font-medium tracking-tight text-[#4B5563] hover:bg-[#F3F7FF] hover:text-[#0052FF] focus:bg-[#F3F7FF] focus:text-[#0052FF]"
                                        >
                                          <Files className="h-3 w-3 mr-2" />
                                          Proof needed
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Heartbeat / Audit Log Footer */}
                        <div className="mt-4 flex flex-col gap-3 border-t border-[#F0F0F2] pt-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="flex flex-wrap items-center gap-6">
                            <div className="flex items-center gap-2">
                              <div className="h-1 w-1 rounded-full bg-[#B8C4CE]" />
                              <span className="text-[10px] font-sans font-medium text-[#858792] tracking-tight">
                                {isSyncScopedDetections ? 'Findings currently shown:' : 'Open issues loaded:'} <span className="text-[#50525B]">{visibleDetectionResults.length}</span>
                              </span>
                            </div>
                            <span className="text-[#9CA3AF]">|</span>
                            <div className="flex items-center gap-2 text-[10px] font-sans font-medium text-[#858792] tracking-tight">
                              {isSyncScopedDetections ? 'Upload processed:' : 'Last updated:'} <span className="text-[#50525B]">{isSyncScopedDetections ? syncScopedIssuesUpdatedLabel : formattedLastUpdated}</span>
                            </div>
                            <span className="text-[#9CA3AF]">|</span>
                            <div className="flex items-center gap-2 text-[10px] font-sans font-medium text-[#858792] tracking-tight">
                              Scope: <span className="text-[#50525B]">{isSyncScopedDetections ? 'This upload' : 'Account summary'}</span>
                            </div>
                            {isSyncScopedDetections ? (
                              <>
                                <span className="text-[#9CA3AF]">|</span>
                                <div className="flex items-center gap-2 text-[10px] font-sans font-medium text-[#858792] tracking-tight">
                                  Sync: <span className="text-[#50525B]">{uploadSyncId}</span>
                                </div>
                              </>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-sans font-medium text-[#1B1C20] tracking-tight">
                            Showing findings with backend filing movement and next action
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : activeTab === 'evidence' ? (
                <div className="space-y-5">
                  <div className="relative overflow-hidden rounded-[10px] border border-[#DCE8EE] bg-white shadow-[0_2px_8px_rgba(24,32,38,0.03)]">
                    <EvidenceMatchingTable />
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="relative overflow-hidden rounded-[10px] border border-[#DCE8EE] bg-white shadow-[0_2px_8px_rgba(24,32,38,0.03)]">
                    <DisputeCasesTable />
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      {/* Quick Actions Editor */}
      <Dialog open={quickActionsEditOpen} onOpenChange={setQuickActionsEditOpen}>
        <DialogContent className="max-w-md overflow-hidden rounded-[10px] border border-[#DCE8EE] bg-white p-0 text-[#182026] shadow-[0_18px_45px_rgba(24,32,38,0.10)]">
          <DialogHeader className="border-b border-[#DCE8EE] bg-[#FAFAF7] px-6 py-5">
            <DialogTitle className="font-lora text-[22px] font-normal tracking-tight text-[#182026]">Configure workspace shortcuts</DialogTitle>
            <DialogDescription className="mt-1 text-[11px] font-sans leading-5 text-[#66737F]">Choose the operational modules shown in your workspace.</DialogDescription>
          </DialogHeader>
          <div className="p-6 max-h-[400px] overflow-y-auto space-y-2">
            {QUICK_ActionS.map((a) => (
              <label key={a.id} className="group flex cursor-pointer items-center gap-4 rounded-[8px] border border-transparent p-4 transition-colors hover:border-[#DCE8EE] hover:bg-[#F8FBFD]">
                <Checkbox
                  className="border-[#C8D8FF] data-[state=checked]:border-[#0B74DE] data-[state=checked]:bg-[#0B74DE]"
                  checked={selectedQuickActions.includes(a.id)}
                  onCheckedChange={(c) => {
                    setSelectedQuickActions(prev => {
                      const next = new Set(prev);
                      if (c) next.add(a.id); else next.delete(a.id);
                      return Array.from(next);
                    });
                  }}
                />
                <div className="flex flex-col">
                  <span className="text-[12px] font-sans font-medium text-[#182026] transition-colors group-hover:text-[#0B74DE]">{a.label.replace('_', ' ')}</span>
                  <span className="text-[10px] font-sans text-[#8A99A5]">{a.subtitle.replace('_', ' ')}</span>
                </div>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-3 border-t border-[#DCE8EE] bg-[#FAFAF7] px-6 py-4">
            <button
              onClick={() => setQuickActionsEditOpen(false)}
              className="rounded-[8px] px-4 py-2 text-[11px] font-sans font-medium text-[#66737F] transition-colors hover:bg-white hover:text-[#182026]"
            >
              Cancel
            </button>
            <button
              className="rounded-[8px] border border-[#0B74DE] bg-[#0B74DE] px-4 py-2 text-[11px] font-sans font-medium text-white transition-colors hover:bg-[#0968C8]"
              onClick={() => { try { localStorage.setItem('clario.quickActions', JSON.stringify(selectedQuickActions)); toast({ title: 'Quick actions updated', description: 'Your workspace shortcuts were saved.' }); } catch { } setQuickActionsEditOpen(false); }}
            >
              Save changes
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Contact Support Modal */}
      <Dialog open={quickNoticeOpen} onOpenChange={setQuickNoticeOpen}>
        <DialogContent className="platform-vitality-page w-[min(94vw,920px)] max-w-4xl overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white p-0 text-[#111827] shadow-[0_18px_45px_rgba(17,24,39,0.10)] backdrop-blur-xl">
          <DialogHeader className="border-b border-[#E5E7EB] bg-[#FAFAF7] px-5 pb-4 pt-5">
            <div className="text-[9px] font-sans font-medium uppercase tracking-tight text-[#66737F]">
              Support channel
            </div>
            <DialogTitle className="mt-2 text-[18px] font-sans font-semibold tracking-tight text-[#111827]">
              Contact Us
            </DialogTitle>
            <DialogDescription className="mt-1 text-[11px] font-sans leading-5 text-[#66737F]">
              Routed to the Margin support inbox.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5 px-5 py-5">
            <p className="max-w-3xl text-[12px] font-sans leading-5 tracking-tight text-[#4B5563]">
Send a tracked message to support@margin-finance.com. Margin uses the verified email on your account for reply routing. Include anything we should know about your workspace, filing, evidence, or billing question.
            </p>
            <div className="grid gap-3 border-t border-[#E5E7EB] pt-4 md:grid-cols-[200px_minmax(0,1fr)] md:gap-5">
              <label htmlFor="contact-subject" className="pt-3 text-[10px] font-sans font-semibold uppercase tracking-tight text-[#66737F]">
                Subject
              </label>
              <Input
                id="contact-subject"
                value={contactSubject}
                onChange={(event) => setContactSubject(event.target.value)}
                placeholder="What should we help with?"
                className="h-11 rounded-none border-0 border-b border-[#CFE0EA] bg-transparent px-0 text-[12px] font-sans text-[#111827] placeholder:text-[#9CA3AF] focus-visible:border-[#0B74DE] focus-visible:ring-0"
              />
            </div>
            <div className="grid gap-3 border-t border-[#E5E7EB] pt-4 md:grid-cols-[200px_minmax(0,1fr)] md:gap-5">
              <div>
                <label htmlFor="contact-query" className="text-[10px] font-sans font-semibold uppercase tracking-tight text-[#66737F]">
                  Your query
                </label>
                <p className="mt-1.5 text-[10px] font-sans leading-4 tracking-tight text-[#8A97A3]">
This is saved as a support request. Margin records notification delivery separately from the request itself.
                </p>
              </div>
              <Textarea
                id="contact-query"
                value={contactQuery}
                onChange={(event) => setContactQuery(event.target.value)}
                placeholder="Tell us what is happening..."
                className="min-h-[118px] resize-none rounded-none border-0 border-b border-[#CFE0EA] bg-transparent px-0 text-[12px] font-sans leading-5 text-[#111827] placeholder:text-[#9CA3AF] focus-visible:border-[#0B74DE] focus-visible:ring-0"
              />
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 border-t border-[#E5E7EB] bg-[#F8FAFC] px-5 py-4">
            <div className="hidden text-[10px] font-sans leading-4 text-[#66737F] sm:block">
              Routed to support@margin-finance.com.
            </div>
            <button
              onClick={handleContactSupportSubmit}
              disabled={contactSubmitting}
              className="h-9 min-w-[154px] rounded-full border border-[#0B74DE] bg-[#0B74DE] px-4 text-[10px] font-sans font-semibold uppercase tracking-tight text-white transition-colors hover:bg-[#005FBA] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {contactSubmitting ? 'Sending...' : 'Send Query Now'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="max-w-sm overflow-hidden rounded-[10px] border border-[#DCE8EE] bg-white p-0 text-[#182026] shadow-[0_18px_45px_rgba(24,32,38,0.10)]">
          <DialogHeader className="border-b border-[#DCE8EE] bg-[#FAFAF7] px-6 py-5">
            <DialogTitle className="font-lora text-[22px] font-normal tracking-tight text-[#182026]">Invite workspace access</DialogTitle>
            <DialogDescription className="mt-1 text-[11px] font-sans leading-5 text-[#66737F]">Invite a teammate with read-only access to this workspace.</DialogDescription>
          </DialogHeader>
          <div className="p-6">
            <Input
              type="email"
              placeholder="name@company.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="h-10 rounded-[8px] border-[#DCE8EE] bg-[#FAFAF7] text-[12px] font-sans text-[#182026] placeholder:text-[#8A99A5] focus-visible:border-[#0B74DE] focus-visible:ring-0"
            />
          </div>
          <div className="flex justify-end gap-3 border-t border-[#DCE8EE] bg-[#FAFAF7] px-6 py-4">
            <button
              onClick={() => setInviteOpen(false)}
              className="rounded-[8px] px-4 py-2 text-[11px] font-sans font-medium text-[#66737F] transition-colors hover:bg-white hover:text-[#182026]"
            >
              Cancel
            </button>
            <button
              className="rounded-[8px] border border-[#0B74DE] bg-[#0B74DE] px-4 py-2 text-[11px] font-sans font-medium text-white transition-colors hover:bg-[#0968C8]"
              onClick={async () => { if (!inviteEmail) return; try { await api.post(`/api/team/invite?tenantSlug=${activeSlug}`, { email: inviteEmail }); toast({ title: 'Invite sent', description: 'The workspace invitation is being prepared.' }); } catch (e: any) { toast({ title: 'Invite could not be sent', description: e?.message || 'Access provision failed.', variant: 'destructive' }); } setInviteOpen(false); setInviteEmail(''); }}
            >
              Send invite
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Finding detail modal */}
      <Dialog open={showDiscrepancyModal} onOpenChange={setShowDiscrepancyModal}>
        <DialogContent className="platform-vitality-page max-h-[72vh] w-[min(96vw,1120px)] max-w-none overflow-hidden rounded-[10px] border border-[#DCE8EE] bg-white p-0 text-[#182026] shadow-[0_18px_45px_rgba(24,32,38,0.10)]">
          {activeDiscrepancy ? (
            <>
              <DialogHeader className="border-b border-[#E9E9EC] px-4 pb-2 pt-2.5">
                <div className="flex items-start justify-between gap-4">
                  <div className="max-w-4xl">
                    <div className="text-[10px] font-sans text-[#8A99A5]">
                      Finding detail
                    </div>
                    <DialogTitle className="mt-1 text-[21px] font-sans font-normal leading-tight tracking-tight text-[#182026]">
                      {activeDiscrepancyCopy?.title || formatIssueTypeLabel(activeDiscrepancy.reason || activeDiscrepancy.anomaly_type || activeDiscrepancy.title || 'Finding details')}
                    </DialogTitle>
                    <DialogDescription className="mt-1 max-w-3xl text-[11px] font-sans leading-4 tracking-tight text-[#6B7280]">
                      {activeDiscrepancyCopy?.summary || activeDiscrepancy.stateDetail || activeDiscrepancy.message || 'Margin found this discrepancy and is still checking whether it should move into a recovery case.'}
                    </DialogDescription>
                    {aiExplainEnabled && activeDiscrepancy?.id ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (findingExplanation.open) {
                            findingExplanation.setOpen(false);
                            return;
                          }
                          void findingExplanation.openFor(String(activeDiscrepancy.id));
                        }}
                        className="mt-2 text-[11px] font-sans font-medium text-[#4D5B66] underline decoration-[#DCE8EE] underline-offset-4 transition-colors hover:text-[#0B74DE]"
                      >
                        Explain
                      </button>
                    ) : null}
                  </div>
                </div>
              </DialogHeader>

              {findingExplanation.open ? (
                <div className="border-b border-[#E9E9EC] bg-[#FAFAFB]">
                  <AiExplanationContent
                    loading={findingExplanation.loading}
                    error={findingExplanation.error}
                    explanation={findingExplanation.explanation}
                    onRetry={() => { void findingExplanation.retry(); }}
                  />
                </div>
              ) : null}

              <div className="grid max-h-[52vh] gap-0 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.58fr)]">
                <div className="border-b border-[#E9E9EC] px-4 py-2 lg:border-b-0 lg:border-r">
                  <div className="grid border-y border-[#E9E9EC] md:grid-cols-3 md:divide-x md:divide-[#F0F0F2]">
                    <div className="py-2 md:pr-4">
                      <div className="text-[9px] font-sans font-medium uppercase tracking-tight text-[#858792]">
                        {activeDiscrepancy.valueLabel === 'potential_exposure'
                          ? 'Potential exposure'
                          : activeDiscrepancy.valueLabel === 'no_recovery_value'
                            ? 'Recovery value'
                            : 'Amount under review'}
                      </div>
                      <div className="mt-1 text-[17px] font-sans font-medium tracking-tight text-[#182026]">
                        {activeDiscrepancy.valueLabel === 'no_recovery_value'
                          ? 'Not claim-ready'
                          : typeof activeDiscrepancy.estimatedRecovery === 'number'
                          ? formatCurrency(activeDiscrepancy.estimatedRecovery, activeDiscrepancy.currency || 'USD')
                          : 'Not available'}
                      </div>
                    </div>
                    <div className="border-t border-[#E9E9EC] py-3 md:border-t-0 md:px-5">
                      <div className="text-[9px] font-sans font-medium uppercase tracking-tight text-[#858792]">Found on</div>
                      <div className="mt-1 text-[12px] font-sans font-medium tracking-tight text-[#1B1C20]">
                        {formatFindingDateTimeLabel(activeDiscrepancy.occurrenceDate)}
                      </div>
                    </div>
                      <div className="border-t border-[#E9E9EC] py-2 md:border-t-0 md:pl-5">
                      <div className="text-[9px] font-sans font-medium uppercase tracking-tight text-[#858792]">Amazon source / activity</div>
                      <div className="mt-1 text-[11px] font-sans font-medium leading-4 tracking-tight text-[#1B1C20]">
                        {activeDiscrepancy.demoInvestigation?.amazonSource || activeDiscrepancy.movementLabel || 'Amazon activity'}
                      </div>
                      <span
                        className={cn(
                          "mt-2 inline-flex items-center gap-2 border px-2.5 py-0.5 text-[10px] font-sans font-medium tracking-tight",
                          activeDiscrepancy.stateTone || getFindingStateMeta(activeDiscrepancy.status).tone
                        )}
                      >
                        <Info className="h-3.5 w-3.5" />
                        <span>{activeDiscrepancy.stateLabel || getFindingStateMeta(activeDiscrepancy.status).label}</span>
                      </span>
                      {activeDiscrepancy.demoInvestigation ? (
                        <div className="mt-2 inline-flex items-center border border-[#B9D9C8] bg-[#F2FBF5] px-2 py-0.5 text-[9px] font-sans font-semibold uppercase tracking-tight text-[#26734D]">
                          Diagnosed by Margin
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-2 grid gap-2 xl:grid-cols-[minmax(0,1fr)_minmax(260px,0.62fr)]">
                    <div>
                      <div className="text-[10px] font-sans font-medium uppercase tracking-tight text-[#858792]">What Margin found</div>
                      <p className="mt-1.5 text-[12px] font-sans leading-4 tracking-tight text-[#50525B]">
                        {activeDiscrepancyCopy?.summary || 'Amazon records do not reconcile with the expected seller outcome for this finding.'}
                      </p>
                      <div className="mt-2 inline-flex items-center border border-[#E9E9EC] bg-[#FAFAFB] px-2.5 py-0.5 text-[10px] font-sans font-medium tracking-tight text-[#50525B]">
                        {activeDiscrepancyCopy?.eventLabel || 'Detected discrepancy'}
                      </div>
                      <div className="mt-3 border-t border-[#E9E9EC] pt-2.5">
                        <div className="text-[10px] font-sans font-medium uppercase tracking-tight text-[#858792]">Evidence used</div>
                        <p className="mt-1.5 text-[12px] font-sans leading-4 tracking-tight text-[#50525B]">
                          {activeDiscrepancyCopy?.evidenceSummary || 'Structured evidence is available on the backend detection record.'}
                        </p>
                      </div>
                      {activeDiscrepancy.demoInvestigation ? (
                        <div className="mt-2 border border-[#CFE0EA] bg-[#F7FBFF] p-2.5">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-[10px] font-sans font-semibold uppercase tracking-tight text-[#0B74DE]">Margin analysis</div>
                            <div className="text-[9px] font-sans font-semibold uppercase tracking-tight text-[#26734D]">Investigation complete</div>
                          </div>
                          <p className="mt-1.5 text-[11px] font-sans leading-4 tracking-tight text-[#50525B]">{activeDiscrepancy.demoInvestigation.diagnosis}</p>
                          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-[#DCEAF4] pt-2">
                            <div><div className="text-[9px] font-sans uppercase tracking-tight text-[#858792]">Charge applied</div><div className="mt-0.5 text-[12px] font-sans font-medium text-[#182026]">{activeDiscrepancy.demoInvestigation.analysis.chargeApplied}</div></div>
                            <div><div className="text-[9px] font-sans uppercase tracking-tight text-[#858792]">What it should have been</div><div className="mt-0.5 text-[12px] font-sans font-medium text-[#182026]">{activeDiscrepancy.demoInvestigation.analysis.expectedAmount}</div></div>
                            <div><div className="text-[9px] font-sans uppercase tracking-tight text-[#858792]">Difference</div><div className="mt-0.5 text-[12px] font-sans font-semibold text-[#0B74DE]">{activeDiscrepancy.demoInvestigation.analysis.difference}</div></div>
                            <div className="col-span-2"><div className="text-[9px] font-sans uppercase tracking-tight text-[#858792]">Policy rule</div><div className="mt-0.5 text-[11px] font-sans leading-4 text-[#50525B]">{activeDiscrepancy.demoInvestigation.analysis.policyRule}</div></div>
                          </div>
                        </div>
                      ) : null}
                      <div className="mt-2 border-y border-[#E9E9EC] bg-[#FFFBF8] py-2">
                        <div className="text-[10px] font-sans font-semibold uppercase tracking-tight text-[#A95F49]">Why unresolved</div>
                        <p className="mt-1 text-[12px] font-sans leading-4 tracking-tight text-[#6B7280]">
                          {activeDiscrepancy.demoInvestigation?.whyUnresolved || activeDiscrepancyCopy?.recoverabilityReason || 'Margin is holding this finding in review until identifiers, evidence, and policy support line up.'}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-[#E9E9EC] pt-2 xl:border-l xl:border-t-0 xl:pl-3 xl:pt-0">
                      <div className="text-[10px] font-sans font-medium uppercase tracking-tight text-[#858792]">Current filing movement</div>
                      <p className="mt-1.5 text-[12px] font-sans leading-4 tracking-tight text-[#50525B]">
                        {activeDiscrepancyBlockContext
                          ? 'Margin is not filing this finding yet. The hold prevents weak or unsupported submissions from being sent to Amazon.'
                          : activeDiscrepancy.movementDetail || activeDiscrepancy.stateDetail || activeDiscrepancy.message || 'Margin found this discrepancy, but it will only move forward if the identifiers, evidence, and policy checks line up.'}
                      </p>
                      {activeDiscrepancyBlockContext ? (
                        <div className="mt-2 border-l border-red-500/25 bg-red-500/[0.035] px-2.5 py-2">
                          <div className="text-[9px] font-sans font-medium uppercase tracking-tight text-red-100/55">
                            Why it is blocked
                          </div>
                          <p className="mt-1 text-[11px] font-sans leading-4 tracking-tight text-red-50/80">
                            {activeDiscrepancyBlockContext.reason}
                          </p>
                          <p className="mt-1.5 text-[11px] font-sans leading-4 tracking-tight text-[#6B7280]">
                            {activeDiscrepancyBlockContext.nextStep}
                          </p>
                        </div>
                      ) : (
                        <p className="mt-1.5 text-[11px] font-sans leading-4 tracking-tight text-[#6B7280]">
                          {activeDiscrepancy.isProcessed
                            ? 'This finding has already moved into a recovery case. Open cases to review what Amazon is doing next.'
                            : activeDiscrepancy.whyNotClaimReady
                              ? activeDiscrepancy.whyNotClaimReady
                            : activeDiscrepancy.nextActionLabel
                              ? `Next action: ${activeDiscrepancy.nextActionLabel}.`
                              : 'Margin keeps this finding in review until it is either ready to move into a case or held with a clear reason.'}
                        </p>
                      )}
                      {activeDiscrepancyBlockContext?.labels?.length ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {activeDiscrepancyBlockContext.labels.slice(0, 3).map((reason: string) => (
                            <span key={reason} className="border border-red-500/15 bg-red-500/[0.06] px-2 py-0.5 text-[9px] font-sans font-medium tracking-tight text-red-100/75">
                              {reason}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>

                </div>

                <div className="px-4 py-2">
                  <div className="text-[10px] font-sans font-medium uppercase tracking-tight text-[#858792]">Backend detection record</div>
                  <div className="mt-1.5 grid grid-cols-2 border-y border-[#E9E9EC]">
                    {activeDiscrepancyMetaRows.map((item) => (
                      <div key={item.label} className="border-b border-[#F0F0F2] py-1.5 pr-2.5 odd:border-r odd:border-[#F0F0F2] even:pl-2.5 last:border-b-0 [&:nth-last-child(2)]:border-b-0">
                        <div className="text-[9px] font-sans font-medium uppercase tracking-tight text-[#858792]">{item.label}</div>
                        <div className="mt-1 break-words text-[11px] font-sans font-medium tracking-tight text-[#50525B]">{item.value}</div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3">
                    <div className="text-[10px] font-sans font-medium uppercase tracking-tight text-[#858792]">Amazon policy basis</div>
                    <div className="mt-2 grid grid-cols-2 border-y border-[#E9E9EC]">
                      {activeDiscrepancyPolicyRows.map((item) => (
                        <div key={item.label} className="border-b border-[#F0F0F2] py-1.5 pr-2.5 odd:border-r odd:border-[#F0F0F2] even:pl-2.5 last:border-b-0 [&:nth-last-child(2)]:border-b-0">
                          <div className="text-[9px] font-sans font-medium uppercase tracking-tight text-[#858792]">{item.label}</div>
                          <div className="mt-1 break-words text-[11px] font-sans font-medium tracking-tight text-[#50525B]">{item.value}</div>
                        </div>
                      ))}
                    </div>
                    {activeDiscrepancyPolicyBasis?.summary ? (
                      <p className="mt-2 text-[11px] font-sans leading-4 tracking-tight text-[#6B7280]">
                        {activeDiscrepancyPolicyBasis.summary}
                      </p>
                    ) : null}
                    {activeDiscrepancyPolicyBasis?.source_url ? (
                      <a
                        href={activeDiscrepancyPolicyBasis.source_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-2 inline-flex text-[10px] font-sans font-medium tracking-tight text-[#50525B] underline decoration-white/20 underline-offset-4 transition-colors hover:text-[#0B74DE]"
                      >
                        Open Amazon policy reference
                      </a>
                    ) : null}
                  </div>

                  <div className="mt-3">
                    <div className="text-[10px] font-sans font-medium uppercase tracking-tight text-[#858792]">Evidence fields</div>
                    {activeDiscrepancyEvidenceItems.length > 0 ? (
                      <div className="mt-2 grid grid-cols-2 border-y border-[#E9E9EC]">
                        {activeDiscrepancyEvidenceItems.map((item) => (
                          <div key={`${item.label}-${item.value}`} className="border-b border-[#F0F0F2] py-1.5 pr-2.5 odd:border-r odd:border-[#F0F0F2] even:pl-2.5 last:border-b-0 [&:nth-last-child(2)]:border-b-0">
                            <div className="text-[9px] font-sans font-medium uppercase tracking-tight text-[#858792]">{item.label}</div>
                            <div className="mt-1 break-words text-[11px] font-sans font-medium tracking-tight text-[#50525B]">{item.value}</div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-2 border-y border-[#E9E9EC] py-3 text-[11px] font-sans leading-5 text-[#6B7280]">
                        No structured evidence fields were returned with this backend detection row.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <DialogFooter className="flex flex-col gap-2 border-t border-[#E9E9EC] px-4 py-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-[10px] font-sans leading-4 tracking-tight text-[#6B7280]">
                  Populated from the persisted backend detection result. Margin files only what can be supported by evidence and policy.
                </div>
                <div className="flex items-center gap-3">
                  {activeDiscrepancy.isProcessed ? (
                    <Button
                      onClick={() => {
                        setShowDiscrepancyModal(false);
                        navigate(tenantRoute(activeSlug, '/recoveries'));
                      }}
                      className="h-8 rounded-md border border-[#0B74DE] bg-[#0B74DE] px-3.5 text-[10px] font-sans font-medium uppercase tracking-tight text-white hover:bg-[#005FBA]"
                    >
                      Open cases
                    </Button>
                  ) : null}
                  <Button
                    variant="outline"
                    onClick={() => setShowDiscrepancyModal(false)}
                    className="h-8 rounded-md border-[#E5E7EB] bg-white px-3.5 text-[10px] font-sans font-medium uppercase tracking-tight text-[#4B5563] hover:border-[#D8E7FF] hover:bg-[#F3F7FF] hover:text-[#0052FF]"
                  >
                    Close
                  </Button>
                </div>
              </DialogFooter>
            </>
          ) : (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-[#0B74DE]" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Proof needed modal */}
      <Dialog open={showProofNeededModal} onOpenChange={setShowProofNeededModal}>
        <DialogContent className="platform-vitality-page max-h-[70vh] w-[min(96vw,1080px)] max-w-none overflow-hidden rounded-[10px] border border-[#DCE8EE] bg-white p-0 text-[#182026] shadow-[0_18px_45px_rgba(24,32,38,0.10)]">
          {activeDiscrepancy ? (
            <>
              <DialogHeader className="border-b border-[#E9E9EC] px-4 pb-2.5 pt-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="max-w-4xl">
                    <div className="text-[10px] font-sans text-[#8A99A5]">
                      Proof required
                    </div>
                    <DialogTitle className="mt-1 font-lora text-[21px] font-normal leading-tight tracking-tight text-[#182026]">
                      Evidence required for this finding
                    </DialogTitle>
                    <DialogDescription className="mt-1 max-w-3xl text-[11px] font-sans leading-4 tracking-tight text-[#6B7280]">
                      Margin checks connected sources first. If the proof cannot be found automatically, upload it in Evidence Records so the case can keep moving.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="grid max-h-[50vh] gap-0 overflow-y-auto lg:grid-cols-[minmax(0,0.86fr)_minmax(360px,0.62fr)]">
                <div className="border-b border-[#E9E9EC] px-4 py-3 lg:border-b-0 lg:border-r lg:border-[#E9E9EC]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="border border-[#E9E9EC] bg-[#FAFAFB] px-2.5 py-0.5 text-[10px] font-sans font-medium tracking-tight text-[#50525B]">
                      {activeDiscrepancyCopy?.title || 'Detected finding'}
                    </span>
                    <span className={cn(
                      "border px-2.5 py-0.5 text-[10px] font-sans font-medium tracking-tight",
                      activeDiscrepancy.claimReadiness === 'not_claim_ready'
                        ? "border-[#F4C6CD] bg-[#FFF6F7] text-[#8B3541]"
                        : "border-[#B9E6D3] bg-[#F4FBF7] text-[#26785E]"
                    )}>
                      {activeDiscrepancy.reviewTier === 'monitoring'
                        ? 'Monitoring'
                        : activeDiscrepancy.claimReadiness === 'not_claim_ready'
                          ? 'Not claim-ready'
                          : 'Claim candidate'}
                    </span>
                  </div>

                  <div className="mt-3 border-y border-[#E9E9EC] py-2.5">
                    <div className="text-[10px] font-sans font-medium uppercase tracking-tight text-[#858792]">
                      Required documentation
                    </div>
                    {activeDiscrepancyRequiredDocumentationItems.length > 0 ? (
                      <div className="mt-2 divide-y divide-[#F0F0F2] border-y border-[#F0F0F2]">
                        {activeDiscrepancyRequiredDocumentationItems.map((item) => (
                          <div
                            key={`${item.label}-${item.detail}`}
                            className="grid gap-1 px-2.5 py-2 sm:grid-cols-[minmax(130px,0.44fr)_minmax(0,1fr)] sm:gap-3"
                          >
                            <div className="text-[11px] font-sans font-medium leading-4 tracking-tight text-[#1B1C20]">
                              {item.label}
                            </div>
                            <div className="text-[11px] font-sans leading-4 tracking-tight text-[#6B7280]">
                              {item.detail || 'Required for this detector family before the finding can be treated as supported.'}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2 text-[12px] font-sans leading-5 tracking-tight text-[#50525B]">
                        Policy basis pending verification. Margin will not treat this as filing-ready until the required documentation checklist is confirmed.
                      </p>
                    )}
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <div>
                      <div className="text-[10px] font-sans font-medium uppercase tracking-tight text-[#858792]">
                        What Margin already found
                      </div>
                      <p className="mt-1.5 text-[12px] font-sans leading-4 tracking-tight text-[#50525B]">
                        {activeDiscrepancyCopy?.evidenceSummary || 'Structured detection fields are available, but Margin is still checking whether they are enough to support filing.'}
                      </p>
                      {activeDiscrepancyEvidenceItems.length > 0 ? (
                        <div className="mt-2 grid grid-cols-2 border-y border-[#E9E9EC]">
                          {activeDiscrepancyEvidenceItems.slice(0, 4).map((item) => (
                            <div
                              key={`${item.label}-${item.value}`}
                              className="border-b border-[#F0F0F2] py-1.5 pr-2.5 odd:border-r odd:border-[#F0F0F2] even:pl-2.5 last:border-b-0 [&:nth-last-child(2)]:border-b-0"
                            >
                              <div className="text-[9px] font-sans font-medium uppercase tracking-tight text-[#858792]">
                                {item.label}
                              </div>
                              <div className="mt-1 break-words text-[11px] font-sans font-medium tracking-tight text-[#50525B]">
                                {item.value}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div className="border-t border-[#E9E9EC] pt-3 md:border-l md:border-t-0 md:pl-3 md:pt-0">
                      <div className="text-[10px] font-sans font-medium uppercase tracking-tight text-[#858792]">
                        If proof is missing
                      </div>
                      <p className="mt-1.5 text-[12px] font-sans leading-4 tracking-tight text-[#50525B]">
                        Margin keeps looking across connected repositories before asking the seller. If one required document is not found, upload it in Evidence Records and Margin can attach it to the filing workflow.
                      </p>
                      {activeDiscrepancy.whyNotClaimReady ? (
                        <p className="mt-3 border-l border-[#F4C6CD] pl-3 text-[11px] font-sans leading-4 tracking-tight text-[#8B3541]">
                          {activeDiscrepancy.whyNotClaimReady}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="px-4 py-3">
                  <div className="text-[10px] font-sans font-medium uppercase tracking-tight text-[#858792]">
                    Why this proof matters
                  </div>
                  <p className="mt-1.5 text-[12px] font-sans leading-4 tracking-tight text-[#50525B]">
                    {activeDiscrepancyCopy?.recoverabilityReason || 'Margin only advances a finding when the identifiers, evidence, and policy basis line up clearly enough to support seller review or filing.'}
                  </p>

                  <div className="mt-3 border-y border-[#E9E9EC] py-2.5">
                    <div className="text-[10px] font-sans font-medium uppercase tracking-tight text-[#858792]">
                      Amazon policy basis
                    </div>
                    <div className="mt-1.5 text-[12px] font-sans font-medium tracking-tight text-[#1B1C20]">
                      {activeDiscrepancyPolicyBasis?.title || 'Policy basis pending verification'}
                    </div>
                    <p className="mt-1.5 text-[11px] font-sans leading-4 tracking-tight text-[#6B7280]">
                      {activeDiscrepancyPolicyBasis?.summary || 'Margin will keep this proof requirement conservative until an official policy reference is available for this detector family.'}
                    </p>
                    <div className="mt-2 divide-y divide-[#F0F0F2] border-y border-[#F0F0F2]">
                      <div className="grid gap-1 px-2.5 py-2 sm:grid-cols-[120px_minmax(0,1fr)]">
                        <div className="text-[9px] font-sans font-medium uppercase tracking-tight text-[#858792]">
                          Policy rule
                        </div>
                        <div className="text-[11px] font-sans leading-4 tracking-tight text-[#50525B]">
                          {activeDiscrepancyPolicyBasis?.amazon_policy_rule || 'Official policy rule pending verification for this detector family.'}
                        </div>
                      </div>
                      <div className="grid gap-1 px-2.5 py-2 sm:grid-cols-[120px_minmax(0,1fr)]">
                        <div className="text-[9px] font-sans font-medium uppercase tracking-tight text-[#858792]">
                          Claim window
                        </div>
                        <div className="text-[11px] font-sans leading-4 tracking-tight text-[#50525B]">
                          {activeDiscrepancyPolicyBasis?.policy_window?.rule || 'Window pending verification.'}
                        </div>
                      </div>
                      <div className="grid gap-1 px-2.5 py-2 sm:grid-cols-[120px_minmax(0,1fr)]">
                        <div className="text-[9px] font-sans font-medium uppercase tracking-tight text-[#858792]">
                          Starts from
                        </div>
                        <div className="text-[11px] font-sans leading-4 tracking-tight text-[#50525B]">
                          {activeDiscrepancyPolicyBasis?.policy_window?.start_event || 'Detector-specific event date.'}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 divide-x divide-[#F0F0F2]">
                        <div className="px-2.5 py-2">
                          <div className="text-[9px] font-sans font-medium uppercase tracking-tight text-[#858792]">
                            Days left
                          </div>
                          <div className="mt-1 text-[12px] font-sans font-medium tracking-tight text-[#1B1C20]">
                            {activeDiscrepancyDaysRemainingLabel}
                          </div>
                        </div>
                        <div className="px-2.5 py-2">
                          <div className="text-[9px] font-sans font-medium uppercase tracking-tight text-[#858792]">
                            Deadline
                          </div>
                          <div className="mt-1 text-[12px] font-sans font-medium tracking-tight text-[#1B1C20]">
                            {formatFindingDateLabel(activeDiscrepancy.deadlineDate)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      <span className="border border-[#E9E9EC] bg-[#FAFAFB] px-2 py-0.5 text-[9px] font-sans font-medium tracking-tight text-[#6B7280]">
                        {activeDiscrepancyPolicyBasis?.source_name || 'Amazon Seller Central Help'}
                      </span>
                      <span className="border border-[#E9E9EC] bg-[#FAFAFB] px-2 py-0.5 text-[9px] font-sans font-medium tracking-tight text-[#6B7280]">
                        {activeDiscrepancyPolicyBasis?.last_verified_at
                          ? `Verified ${formatFindingDateLabel(activeDiscrepancyPolicyBasis.last_verified_at)}`
                          : 'Verification pending'}
                      </span>
                      {activeDiscrepancyPolicyBasis?.source_url ? (
                        <a
                          href={activeDiscrepancyPolicyBasis.source_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 border border-[#E9E9EC] bg-[#FAFAFB] px-2 py-0.5 text-[9px] font-sans font-medium tracking-tight text-[#6B7280] transition-colors hover:border-[#C8D8FF] hover:text-[#0B74DE]"
                        >
                          <Link2 className="h-2.5 w-2.5" />
                          Amazon reference
                        </a>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-3">
                    <div className="text-[10px] font-sans font-medium uppercase tracking-tight text-[#858792]">
                      Where Margin checks first
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-1.5">
                      {['Connected email', 'Cloud storage', 'Team repositories', 'Uploaded documents'].map((source) => (
                        <div
                          key={source}
                          className="border border-[#F0F0F2] bg-[#FAFAFB] px-2.5 py-1.5 text-[10px] font-sans font-medium tracking-tight text-[#50525B]"
                        >
                          {source}
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 text-[11px] font-sans leading-4 tracking-tight text-[#6B7280]">
                      This does not mean every connected source already contains the proof. It means Margin checks the repositories first and only asks for upload when the required document is still missing.
                    </p>
                  </div>
                </div>
              </div>

              <DialogFooter className="flex flex-col gap-2 border-t border-[#DCE8EE] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-[10px] font-sans leading-4 text-[#66737F]">
                  Proof guidance is derived from configured Amazon references, backend finding truth, and the stored deadline. It is not a filing guarantee.
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => {
                      setShowProofNeededModal(false);
                      navigate(tenantRoute(activeSlug, '/evidence-locker'));
                    }}
                    className="h-8 rounded-[8px] border border-[#0B74DE] bg-[#0B74DE] px-3.5 text-[10px] font-sans font-medium text-white hover:bg-[#0968C8]"
                  >
                    Open Evidence Records
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowProofNeededModal(false)}
                    className="h-8 rounded-[8px] border-[#DCE8EE] bg-white px-3.5 text-[10px] font-sans font-medium text-[#4D5B66] hover:border-[#BFD2DE] hover:bg-[#F8FBFD] hover:text-[#182026]"
                  >
                    Close
                  </Button>
                </div>
              </DialogFooter>
            </>
          ) : (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-[#0B74DE]" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Enter Amazon Case ID Modal */}
      <Dialog open={caseIdModalOpen} onOpenChange={setCaseIdModalOpen}>
        <DialogContent className="max-w-md rounded-[10px] border border-[#DCE8EE] bg-white p-6 text-[#182026] shadow-[0_18px_45px_rgba(24,32,38,0.10)]">
          <DialogHeader>
            <DialogTitle className="font-lora text-[24px] font-normal tracking-tight text-[#182026]">
              Link Amazon case ID
            </DialogTitle>
            <DialogDescription className="mt-2 text-[11px] font-sans leading-5 text-[#66737F]">
              Enter the case ID provided by Amazon Seller Support to track this claim.
            </DialogDescription>
          </DialogHeader>

          <div className="my-6">
            <Input
              value={caseIdInput}
              onChange={(e) => setCaseIdInput(e.target.value)}
              placeholder="e.g. CASE-123456789"
              className="h-11 rounded-[8px] border-[#DCE8EE] bg-[#FAFAF7] text-[12px] font-sans text-[#182026] placeholder:text-[#8A99A5] focus-visible:border-[#0B74DE] focus-visible:ring-0"
              disabled={isLinkingCase}
            />
          </div>

          <DialogFooter className="flex items-center justify-end gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setCaseIdModalOpen(false)}
              className="h-10 rounded-[8px] border-[#DCE8EE] bg-[#FAFAF7] px-4 py-2 text-[11px] font-sans font-medium text-[#66737F] hover:bg-white hover:text-[#182026]"
              disabled={isLinkingCase}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCaseIdUpdate}
              disabled={!caseIdInput.trim() || isLinkingCase}
              className="flex h-10 items-center rounded-[8px] border border-[#0B74DE] bg-[#0B74DE] px-5 py-2 text-[11px] font-sans font-medium text-white transition-colors hover:bg-[#0968C8]"
            >
              {isLinkingCase ? (
                <>
                  <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Case ID"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SyncLogModal isOpen={showSyncModal} onClose={() => setShowSyncModal(false)} />
    </div>
  );
}
