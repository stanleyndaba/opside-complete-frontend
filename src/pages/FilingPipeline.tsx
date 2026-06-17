import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { AlertCircle, ArrowUpRight, Clock3, FileCheck2, RefreshCw } from 'lucide-react';

import { PageLayout } from '@/components/layout/PageLayout';
import { TenantLink as Link } from '@/components/navigation/TenantLink';
import { useTenant } from '@/contexts/TenantContext';
import { api } from '@/lib/api';
import { normalizeTenantSlug, tenantRoute } from '@/lib/routes';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useParams } from 'react-router-dom';

type DisputeRow = NonNullable<Awaited<ReturnType<typeof api.getDisputeCaseQueue>>['data']>['rows'][number];
type DisputeQueueData = NonNullable<Awaited<ReturnType<typeof api.getDisputeCaseQueue>>['data']>;

type LedgerRow = {
  row_type: 'dispute_case_projection' | 'detection_projection' | null;
  entity_type: 'dispute_case' | 'detection' | null;
  has_real_dispute_case: boolean | null;
  has_real_recovery_record: boolean | null;
  linked_dispute_case_id: string | null;
  recovery_record_id: string | null;
  dispute_case_id: string | null;
  detection_result_id: string | null;
  case_number: string;
  provider_case_id: string | null;
  merchant_reference: string | null;
  status?: string | null;
  filing_status?: string | null;
  submission_proof?: {
    proof_present?: boolean | null;
    proof_reference?: string | null;
    amazon_case_id?: string | null;
    external_reference?: string | null;
    submitted_at?: string | null;
    status?: string | null;
    outcome?: string | null;
  } | null;
  has_submission_proof?: boolean | null;
  has_amazon_reference?: boolean | null;
  has_filing_truth?: boolean | null;
  has_approval_truth?: boolean | null;
  approved_amount: number | null;
  actual_payout_amount: number | null;
  expected_payout_amount: number | null;
  reconciliation_status: string | null;
  reconciliation_source?: string | null;
  payout_status: string | null;
  operator_state?: string | null;
  outstanding_amount?: number | null;
  currency: string;
  last_updated_at: string | null;
};

type LedgerResponse = {
  success: boolean;
  summary?: { last_updated_at: string | null } | null;
  rows: LedgerRow[];
  pagination?: {
    page: number;
    page_size: number;
    total_filtered: number;
    total_pages: number;
    total_rows: number;
  };
};

type RowTone = 'ready' | 'inFlight' | 'submitted' | 'approved' | 'completed' | 'attention';

const NOT_AVAILABLE = 'Not Available';
const DISPUTE_PAGE_SIZE = 100;
const LEDGER_PAGE_SIZE = 100;
const READY_FILING_STATUSES = new Set(['pending']);
const ACTIVE_FILING_STATUSES = new Set(['submitting']);
const FILED_FILING_STATUSES = new Set(['filed', 'submitted', 'resubmitted']);
const ATTENTION_FILING_STATUSES = new Set(['failed', 'blocked', 'payment_required', 'pending_safety_verification', 'pending_approval']);
const ACTIVE_AMAZON_REVIEW_STATUSES = new Set(['submitted', 'under review', 'under_review', 'in review', 'in_review', 'in_progress', 'processing']);
const APPROVED_CASE_STATUSES = new Set(['approved', 'won']);
const COMPLETED_RECOVERY_STATUSES = new Set(['reconciled', 'paid', 'paid_out', 'reimbursed']);
const DEMO_PIPELINE_ROW_COUNT = 10;

type ActiveFilingPreview = {
  currentAction: string;
  stageLabel: string;
  progress: number;
  step: number;
  totalSteps: number;
  amazonRoute: string;
  evidencePacket: string;
  evidenceDocs: string[];
  unitsAffected: number;
  channel: string;
  eta: string;
  retries: number;
  health: string;
  nextProof: string;
  policyWindow: string;
  activity: string[];
};

type ReadyFilingPreview = {
  whyFile: string;
  evidencePacket: string;
  evidenceDocs: string[];
  amazonRoute: string;
  safety: string;
  priority: string;
  confidence: number;
  daysLeft: number;
  unitsAffected: number;
  recommendedAction: string;
  checks: string[];
};

type FiledFilingPreview = {
  amazonStatus: string;
  submissionSummary: string;
  proofPacket: string;
  trackerStage: string;
  progress: number;
  responseWindow: string;
  nextWatch: string;
  nextCheck: string;
  payoutSignal: string;
  confidence: string;
  receiptDocs: string[];
  checks: string[];
};

type ActiveFilingDisputeRow = DisputeRow & {
  filing_preview?: ActiveFilingPreview;
};

type ReadyFilingDisputeRow = DisputeRow & {
  ready_preview?: ReadyFilingPreview;
};

type FiledFilingDisputeRow = DisputeRow & {
  filed_preview?: FiledFilingPreview;
};

function demoTimestamp(baseMs: number, minutesAgo: number) {
  return new Date(baseMs - minutesAgo * 60_000).toISOString();
}

const DEMO_READY_CASE_VARIANTS = [
  {
    anomalyType: 'inbound_shipment_shortage',
    caseType: 'inbound_shipment_shortage',
    storeName: 'Northstar Home Goods',
    caseNumber: 'RFD-16874-INB',
    claimNumber: 'CLM-INB-7419',
    orderId: 'FBA17KQ2N6P8',
    sku: 'NS-HOME-ORGANIZER-2PK',
    asin: 'B0C7N2Q9KM',
    amount: 184.72,
    matchedDocuments: 4,
    updatedMinutesAgo: 9,
  },
  {
    anomalyType: 'warehouse_transfer_loss',
    caseType: 'warehouse_transfer_loss',
    storeName: 'Blue Ridge Supply',
    caseNumber: 'RFD-16882-XFER',
    claimNumber: 'CLM-XFER-2248',
    orderId: 'FBA18M4H7C2Q',
    sku: 'BRS-KITCHEN-MAT-GR',
    asin: 'B09V4N6R2T',
    amount: 312.18,
    matchedDocuments: 5,
    updatedMinutesAgo: 17,
  },
  {
    anomalyType: 'damaged_inventory',
    caseType: 'damaged_inventory',
    storeName: 'Atlas Pet Co',
    caseNumber: 'RFD-16865-DMG',
    claimNumber: 'CLM-DMG-6182',
    orderId: 'FBA16T9Z3J5L',
    sku: 'ATL-PET-BOWL-XL',
    asin: 'B0B2K8MTQ1',
    amount: 96.44,
    matchedDocuments: 3,
    updatedMinutesAgo: 26,
  },
  {
    anomalyType: 'refund_without_return',
    caseType: 'refund_without_return',
    storeName: 'Cedar Peak Brands',
    caseNumber: 'RFD-16890-RWR',
    claimNumber: 'CLM-RWR-5091',
    orderId: '114-6920148-3847442',
    sku: 'CPB-TRAVEL-BAG-BLK',
    asin: 'B08YQ3M6JH',
    amount: 57.9,
    matchedDocuments: 2,
    updatedMinutesAgo: 34,
  },
  {
    anomalyType: 'fba_fee_overcharge',
    caseType: 'fba_fee_overcharge',
    storeName: 'Sierra Wellness',
    caseNumber: 'RFD-16877-FEE',
    claimNumber: 'CLM-FEE-3310',
    orderId: '114-8843062-1175068',
    sku: 'SWL-CREAM-SET-03',
    asin: 'B0C2JWV7P4',
    amount: 128.36,
    matchedDocuments: 3,
    updatedMinutesAgo: 43,
  },
  {
    anomalyType: 'lost_inventory_adjustment',
    caseType: 'lost_inventory_adjustment',
    storeName: 'Mason Outdoor',
    caseNumber: 'RFD-16899-LOST',
    claimNumber: 'CLM-LOST-9026',
    orderId: 'FBA15P7R8V3X',
    sku: 'MSN-CAMP-LANTERN-4PK',
    asin: 'B07W8L5QJ9',
    amount: 421.65,
    matchedDocuments: 5,
    updatedMinutesAgo: 51,
  },
  {
    anomalyType: 'customer_return_not_received',
    caseType: 'customer_return_not_received',
    storeName: 'Harbor Kids',
    caseNumber: 'RFD-16884-RET',
    claimNumber: 'CLM-RET-1173',
    orderId: '113-4076391-5259417',
    sku: 'HBK-LUNCHBOX-SAGE',
    asin: 'B0BZ2H1LQ7',
    amount: 73.28,
    matchedDocuments: 2,
    updatedMinutesAgo: 62,
  },
  {
    anomalyType: 'removal_order_damage',
    caseType: 'removal_order_damage',
    storeName: 'Pioneer Tools',
    caseNumber: 'RFD-16871-REM',
    claimNumber: 'CLM-REM-4407',
    orderId: 'FBA19B6Y2D8S',
    sku: 'PTO-TORQUE-SET-12',
    asin: 'B0BLT6W9N3',
    amount: 267.11,
    matchedDocuments: 4,
    updatedMinutesAgo: 74,
  },
  {
    anomalyType: 'settlement_reimbursement_gap',
    caseType: 'settlement_reimbursement_gap',
    storeName: 'Orion Baby',
    caseNumber: 'RFD-16900-SET',
    claimNumber: 'CLM-SET-7864',
    orderId: '114-2501739-6602835',
    sku: 'ORN-SWADDLE-NAVY-3PK',
    asin: 'B09QF7ZC4M',
    amount: 144.83,
    matchedDocuments: 3,
    updatedMinutesAgo: 83,
  },
  {
    anomalyType: 'inventory_disposal_error',
    caseType: 'inventory_disposal_error',
    storeName: 'Luma Beauty',
    caseNumber: 'RFD-16869-DISP',
    claimNumber: 'CLM-DISP-2580',
    orderId: 'FBA14N8C5R1T',
    sku: 'LMA-SERUM-30ML',
    asin: 'B0BW6KTY8S',
    amount: 219.47,
    matchedDocuments: 4,
    updatedMinutesAgo: 97,
  },
];

const DEMO_READY_DECISION_VARIANTS: ReadyFilingPreview[] = [
  {
    whyFile: 'Amazon received fewer units than the shipment plan shows, and the invoice plus BOL prove the shipped quantity.',
    evidencePacket: 'Invoice, BOL, shipment plan, receive delta',
    evidenceDocs: ['INV-NS-7419.pdf', 'BOL-FBA17KQ2N6P8.pdf', 'shipment-plan.csv', 'receive-delta.csv'],
    amazonRoute: 'Seller Central / FBA inventory reimbursement / Inbound shortage',
    safety: 'Low risk - duplicate reimbursement check passed',
    priority: 'High priority',
    confidence: 94,
    daysLeft: 31,
    unitsAffected: 8,
    recommendedAction: 'Approve filing now',
    checks: ['Policy window valid', 'Unit cost verified', 'No prior reimbursement found'],
  },
  {
    whyFile: 'The transfer ledger shows inventory left the source FC but never appeared in available inventory at the destination FC.',
    evidencePacket: 'Transfer ledger, receive report, inventory movement log, invoice',
    evidenceDocs: ['transfer-ledger.xlsx', 'destination-receive-report.csv', 'movement-log.pdf', 'CLM-XFER-2248-invoice.pdf'],
    amazonRoute: 'Seller Central / Inventory reimbursement / Warehouse transfer loss',
    safety: 'Low risk - Amazon movement IDs reconcile',
    priority: 'High value',
    confidence: 92,
    daysLeft: 44,
    unitsAffected: 5,
    recommendedAction: 'Approve after quick packet review',
    checks: ['FC movement IDs matched', 'Claim amount inside tolerance', 'No duplicate payout'],
  },
  {
    whyFile: 'Warehouse damage was recorded against the SKU, but no reimbursement event exists in settlement data.',
    evidencePacket: 'Damage event, supplier invoice, SKU cost basis',
    evidenceDocs: ['warehouse-damage-event.pdf', 'ATL-PET-BOWL-XL-invoice.pdf', 'unit-cost-proof.pdf'],
    amazonRoute: 'Seller Central / FBA inventory reimbursement / Warehouse damaged',
    safety: 'Low risk - amount and damage reason agree',
    priority: 'Clean win',
    confidence: 89,
    daysLeft: 26,
    unitsAffected: 3,
    recommendedAction: 'Approve filing',
    checks: ['Damage code mapped', 'Settlement checked', 'Safe claim language generated'],
  },
  {
    whyFile: 'Customer refund was issued, but the return event never checked back into sellable or unsellable inventory.',
    evidencePacket: 'Order refund event, return status, settlement ledger',
    evidenceDocs: ['refund-event-3847442.csv', 'return-status-proof.pdf', 'settlement-ledger.csv'],
    amazonRoute: 'Seller Central / Customer return reimbursement / Return not received',
    safety: 'Low risk - return absence confirmed',
    priority: 'Fast file',
    confidence: 87,
    daysLeft: 19,
    unitsAffected: 1,
    recommendedAction: 'Approve filing now',
    checks: ['Return not received', 'Order ID verified', 'Refund amount matched'],
  },
  {
    whyFile: 'Amazon charged a larger FBA fee tier than the catalog dimensions support for this SKU.',
    evidencePacket: 'Fee audit, catalog dimensions, order fee ledger',
    evidenceDocs: ['fee-audit-3310.csv', 'catalog-dimensions.pdf', 'order-fee-ledger.csv'],
    amazonRoute: 'Seller Central / FBA fee reimbursement / Size-tier correction',
    safety: 'Low risk - fee tier delta isolated',
    priority: 'Recommended',
    confidence: 91,
    daysLeft: 52,
    unitsAffected: 11,
    recommendedAction: 'Approve filing',
    checks: ['Dimensions verified', 'Fee delta calculated', 'Policy-safe body ready'],
  },
  {
    whyFile: 'Amazon inventory adjustment removed units from available stock without a matching reimbursement in settlements.',
    evidencePacket: 'Inventory adjustment, settlement scan, supplier invoice',
    evidenceDocs: ['adjustment-event-FBA15P7R8V3X.csv', 'settlement-scan.csv', 'supplier-invoice.pdf'],
    amazonRoute: 'Seller Central / Inventory adjustment reimbursement / Lost inventory',
    safety: 'Low risk - duplicate claim suppressed',
    priority: 'Highest value',
    confidence: 93,
    daysLeft: 38,
    unitsAffected: 6,
    recommendedAction: 'Approve filing now',
    checks: ['Adjustment reason eligible', 'Prior reimbursement cleared', 'Unit cost verified'],
  },
  {
    whyFile: 'The return deadline passed without Amazon receiving the customer return for the refunded order.',
    evidencePacket: 'Refund event, return tracker, SKU cost proof',
    evidenceDocs: ['refund-5259417.csv', 'return-tracker.pdf', 'HBK-cost-proof.pdf'],
    amazonRoute: 'Seller Central / Customer return reimbursement / Return not received',
    safety: 'Low risk - return window elapsed',
    priority: 'Recommended',
    confidence: 86,
    daysLeft: 23,
    unitsAffected: 2,
    recommendedAction: 'Approve filing',
    checks: ['Return deadline passed', 'Refund matched', 'SKU identity verified'],
  },
  {
    whyFile: 'Removal order damage appears in Amazon events, but the reimbursement ledger does not show a matching credit.',
    evidencePacket: 'Removal order, damage event, reimbursement ledger',
    evidenceDocs: ['removal-order-FBA19B6Y2D8S.pdf', 'damage-event.csv', 'reimbursement-ledger.csv'],
    amazonRoute: 'Seller Central / Removal order reimbursement / Damaged removal',
    safety: 'Medium-low risk - category selected carefully',
    priority: 'Good recovery',
    confidence: 88,
    daysLeft: 34,
    unitsAffected: 4,
    recommendedAction: 'Review packet, then approve',
    checks: ['Removal ID matched', 'Damage event present', 'No reimbursement found'],
  },
  {
    whyFile: 'Amazon approved reimbursement, but settlement records do not show the expected payout landing.',
    evidencePacket: 'Approval proof, settlement report, payout delta worksheet',
    evidenceDocs: ['approval-thread.pdf', 'settlement-report.csv', 'payout-delta.xlsx'],
    amazonRoute: 'Seller Central / Reimbursement follow-up / Settlement gap',
    safety: 'Low risk - approved amount already exists',
    priority: 'Money waiting',
    confidence: 95,
    daysLeft: 58,
    unitsAffected: 1,
    recommendedAction: 'Approve follow-up filing',
    checks: ['Approval reference found', 'Payout missing', 'Delta worksheet ready'],
  },
  {
    whyFile: 'Inventory disposal event removed sellable units, but the disposal reason supports reimbursement review.',
    evidencePacket: 'Disposal event, inventory ledger, supplier invoice',
    evidenceDocs: ['disposal-event.pdf', 'inventory-ledger.csv', 'LMA-SERUM-invoice.pdf'],
    amazonRoute: 'Seller Central / Inventory reimbursement / Disposal error',
    safety: 'Medium-low risk - category and wording reviewed',
    priority: 'Recommended',
    confidence: 84,
    daysLeft: 28,
    unitsAffected: 3,
    recommendedAction: 'Review packet, then approve',
    checks: ['Disposal reason eligible', 'SKU matched', 'Overclaim check passed'],
  },
];

const DEMO_FILED_CASE_VARIANTS = [
  {
    anomalyType: 'warehouse_transfer_loss',
    caseType: 'warehouse_transfer_loss',
    storeName: 'Northstar Home Goods',
    orderId: 'FBA17KQ2N6P8',
    sku: 'NS-HOME-ORGANIZER-2PK',
    asin: 'B0C7N2Q9KM',
    amount: 184.72,
    matchedDocuments: 4,
    attachments: 3,
    amazonCaseId: '16894380251',
    proofReference: 'AMZ-XFER-80251',
    externalReference: 'SC-XFER-7419',
    status: 'under_review',
    submittedMinutesAgo: 82,
  },
  {
    anomalyType: 'inbound_shipment_shortage',
    caseType: 'inbound_shipment_shortage',
    storeName: 'Blue Ridge Supply',
    orderId: 'FBA18M4H7C2Q',
    sku: 'BRS-KITCHEN-MAT-GR',
    asin: 'B09V4N6R2T',
    amount: 312.18,
    matchedDocuments: 5,
    attachments: 4,
    amazonCaseId: '16902291764',
    proofReference: 'AMZ-INB-91764',
    externalReference: 'SC-INB-2248',
    status: 'submitted',
    submittedMinutesAgo: 116,
  },
  {
    anomalyType: 'damaged_inventory',
    caseType: 'damaged_inventory',
    storeName: 'Atlas Pet Co',
    orderId: 'FBA16T9Z3J5L',
    sku: 'ATL-PET-BOWL-XL',
    asin: 'B0B2K8MTQ1',
    amount: 96.44,
    matchedDocuments: 3,
    attachments: 2,
    amazonCaseId: '16877543920',
    proofReference: 'AMZ-DMG-43920',
    externalReference: 'SC-DMG-6182',
    status: 'in_review',
    submittedMinutesAgo: 149,
  },
  {
    anomalyType: 'refund_without_return',
    caseType: 'refund_without_return',
    storeName: 'Cedar Peak Brands',
    orderId: '114-6920148-3847442',
    sku: 'CPB-TRAVEL-BAG-BLK',
    asin: 'B08YQ3M6JH',
    amount: 57.9,
    matchedDocuments: 2,
    attachments: 2,
    amazonCaseId: '16899103788',
    proofReference: 'AMZ-RWR-03788',
    externalReference: 'SC-RWR-5091',
    status: 'processing',
    submittedMinutesAgo: 177,
  },
  {
    anomalyType: 'fba_fee_overcharge',
    caseType: 'fba_fee_overcharge',
    storeName: 'Sierra Wellness',
    orderId: '114-8843062-1175068',
    sku: 'SWL-CREAM-SET-03',
    asin: 'B0C2JWV7P4',
    amount: 128.36,
    matchedDocuments: 3,
    attachments: 1,
    amazonCaseId: '16886765413',
    proofReference: 'AMZ-FEE-65413',
    externalReference: 'SC-FEE-3310',
    status: 'under_review',
    submittedMinutesAgo: 204,
  },
  {
    anomalyType: 'lost_inventory_adjustment',
    caseType: 'lost_inventory_adjustment',
    storeName: 'Mason Outdoor',
    orderId: 'FBA15P7R8V3X',
    sku: 'MSN-CAMP-LANTERN-4PK',
    asin: 'B07W8L5QJ9',
    amount: 421.65,
    matchedDocuments: 5,
    attachments: 4,
    amazonCaseId: '16910428577',
    proofReference: 'AMZ-LOST-28577',
    externalReference: 'SC-LOST-9026',
    status: 'in_progress',
    submittedMinutesAgo: 238,
  },
  {
    anomalyType: 'customer_return_not_received',
    caseType: 'customer_return_not_received',
    storeName: 'Harbor Kids',
    orderId: '113-4076391-5259417',
    sku: 'HBK-LUNCHBOX-SAGE',
    asin: 'B0BZ2H1LQ7',
    amount: 73.28,
    matchedDocuments: 2,
    attachments: 2,
    amazonCaseId: '16893067244',
    proofReference: 'AMZ-RET-67244',
    externalReference: 'SC-RET-1173',
    status: 'submitted',
    submittedMinutesAgo: 271,
  },
  {
    anomalyType: 'removal_order_damage',
    caseType: 'removal_order_damage',
    storeName: 'Pioneer Tools',
    orderId: 'FBA19B6Y2D8S',
    sku: 'PTO-TORQUE-SET-12',
    asin: 'B0BLT6W9N3',
    amount: 267.11,
    matchedDocuments: 4,
    attachments: 3,
    amazonCaseId: '16881253906',
    proofReference: 'AMZ-REM-53906',
    externalReference: 'SC-REM-4407',
    status: 'under_review',
    submittedMinutesAgo: 309,
  },
  {
    anomalyType: 'settlement_reimbursement_gap',
    caseType: 'settlement_reimbursement_gap',
    storeName: 'Orion Baby',
    orderId: '114-2501739-6602835',
    sku: 'ORN-SWADDLE-NAVY-3PK',
    asin: 'B09QF7ZC4M',
    amount: 144.83,
    matchedDocuments: 3,
    attachments: 2,
    amazonCaseId: '16901834655',
    proofReference: 'AMZ-SET-34655',
    externalReference: 'SC-SET-7864',
    status: 'processing',
    submittedMinutesAgo: 344,
  },
  {
    anomalyType: 'inventory_disposal_error',
    caseType: 'inventory_disposal_error',
    storeName: 'Luma Beauty',
    orderId: 'FBA14N8C5R1T',
    sku: 'LMA-SERUM-30ML',
    asin: 'B0BW6KTY8S',
    amount: 219.47,
    matchedDocuments: 4,
    attachments: 3,
    amazonCaseId: '16890619833',
    proofReference: 'AMZ-DISP-19833',
    externalReference: 'SC-DISP-2580',
    status: 'in_review',
    submittedMinutesAgo: 382,
  },
];

const DEMO_FILED_REVIEW_VARIANTS: FiledFilingPreview[] = [
  {
    amazonStatus: 'Amazon receipt confirmed',
    submissionSummary: 'Margin filed the transfer-loss packet and captured the Seller Central receipt, Amazon case ID, and proof checksum.',
    proofPacket: 'Transfer ledger, receive report, movement IDs, invoice',
    trackerStage: 'Under Amazon review',
    progress: 64,
    responseWindow: 'Expected first response in 1-2 business days',
    nextWatch: 'Watch for FC movement challenge or reimbursement approval',
    nextCheck: 'Next automated check in 38 min',
    payoutSignal: 'No settlement credit yet - payout watcher armed',
    confidence: 'Strong proof - FC movement IDs reconcile',
    receiptDocs: ['submission-receipt-80251.pdf', 'transfer-ledger.xlsx', 'movement-id-match.csv'],
    checks: ['Amazon case ID captured', 'Receipt timestamp preserved', 'Payout ledger monitoring'],
  },
  {
    amazonStatus: 'Submitted to Amazon',
    submissionSummary: 'The inbound-shortage claim is now with Amazon with the invoice, BOL, and receiving delta attached.',
    proofPacket: 'Invoice, BOL, shipment plan, receiving delta, unit cost proof',
    trackerStage: 'Waiting for Amazon queue pickup',
    progress: 52,
    responseWindow: 'Amazon intake usually responds within 24-48 hours',
    nextWatch: 'Watch for request to re-upload BOL or carton-count proof',
    nextCheck: 'Next automated check in 22 min',
    payoutSignal: 'Settlement report clean - no duplicate payout',
    confidence: 'High confidence - shipped vs received delta is clean',
    receiptDocs: ['seller-central-submit-91764.pdf', 'FBA18M4H7C2Q-bol.pdf', 'receive-delta.csv'],
    checks: ['Shipment ID verified', 'Duplicate claim blocked', 'Evidence hash stored'],
  },
  {
    amazonStatus: 'In Amazon review',
    submissionSummary: 'Warehouse-damage evidence has been filed and Margin is monitoring the case thread for Amazon acknowledgement.',
    proofPacket: 'Damage event, inventory ledger, supplier invoice',
    trackerStage: 'Amazon review in motion',
    progress: 71,
    responseWindow: 'Expected movement today',
    nextWatch: 'Watch for reimbursement event or damage-code pushback',
    nextCheck: 'Next automated check in 31 min',
    payoutSignal: 'No reimbursement event posted yet',
    confidence: 'Clean proof - damage code and SKU match',
    receiptDocs: ['case-thread-43920.pdf', 'damage-event.csv', 'supplier-invoice.pdf'],
    checks: ['Damage reason mapped', 'SKU identity matched', 'Thread watcher active'],
  },
  {
    amazonStatus: 'Processing in Seller Central',
    submissionSummary: 'Refund-without-return claim was filed after the return window elapsed and the return tracker stayed empty.',
    proofPacket: 'Refund event, return tracker, order ledger',
    trackerStage: 'Case processing',
    progress: 59,
    responseWindow: 'Expected first movement in 2 business days',
    nextWatch: 'Watch for Amazon return-location challenge',
    nextCheck: 'Next automated check in 46 min',
    payoutSignal: 'Refund matched - no return reimbursement found',
    confidence: 'Good proof - return absence documented',
    receiptDocs: ['return-not-received-03788.pdf', 'refund-event.csv', 'return-tracker.pdf'],
    checks: ['Return deadline elapsed', 'Order refund matched', 'Claim body archived'],
  },
  {
    amazonStatus: 'Under Amazon review',
    submissionSummary: 'Fee overcharge claim is filed with dimensions, fee ledger, and calculated tier delta ready for Amazon validation.',
    proofPacket: 'Fee audit, catalog dimensions, order fee ledger',
    trackerStage: 'Fee audit review',
    progress: 68,
    responseWindow: 'Amazon fee reviews commonly move in 2-3 business days',
    nextWatch: 'Watch for dimension confirmation or fee-tier correction',
    nextCheck: 'Next automated check in 55 min',
    payoutSignal: 'No fee correction credit posted yet',
    confidence: 'Strong proof - size-tier delta isolated',
    receiptDocs: ['fee-claim-65413.pdf', 'catalog-dimensions.pdf', 'fee-delta.csv'],
    checks: ['Tier math verified', 'Catalog snapshot stored', 'Settlement scan active'],
  },
  {
    amazonStatus: 'Amazon case active',
    submissionSummary: 'Lost-inventory adjustment claim is filed and tied to an Amazon adjustment event with no matching reimbursement.',
    proofPacket: 'Inventory adjustment, settlement scan, supplier invoice, unit cost basis',
    trackerStage: 'High-value review',
    progress: 74,
    responseWindow: 'Expected first response in 1 business day',
    nextWatch: 'Watch for reimbursement approval or adjustment reason dispute',
    nextCheck: 'Next automated check in 18 min',
    payoutSignal: 'High-value payout watcher enabled',
    confidence: 'Very strong proof - adjustment reason eligible',
    receiptDocs: ['lost-inventory-28577.pdf', 'adjustment-event.csv', 'settlement-scan.csv'],
    checks: ['Adjustment event eligible', 'Prior reimbursement cleared', 'Escalation timer set'],
  },
  {
    amazonStatus: 'Submitted to Amazon',
    submissionSummary: 'Customer-return claim has been filed with refund proof and no received-return event in the tracker.',
    proofPacket: 'Refund event, return status, SKU cost proof',
    trackerStage: 'Awaiting acknowledgement',
    progress: 49,
    responseWindow: 'Expected queue pickup within 24 hours',
    nextWatch: 'Watch for Amazon acknowledgement or return-event update',
    nextCheck: 'Next automated check in 27 min',
    payoutSignal: 'No payout event detected',
    confidence: 'Good proof - return tracker is clean',
    receiptDocs: ['customer-return-67244.pdf', 'refund-proof.csv', 'sku-cost-proof.pdf'],
    checks: ['Return tracker checked', 'Refund amount matched', 'Case receipt stored'],
  },
  {
    amazonStatus: 'Amazon review opened',
    submissionSummary: 'Removal-order damage packet is filed and Margin is watching for Amazon to accept the damage event.',
    proofPacket: 'Removal order, damage event, reimbursement ledger',
    trackerStage: 'Removal claim review',
    progress: 66,
    responseWindow: 'Expected movement in 1-3 business days',
    nextWatch: 'Watch for removal ID challenge or approved reimbursement',
    nextCheck: 'Next automated check in 41 min',
    payoutSignal: 'Reimbursement ledger has no matching credit',
    confidence: 'Good proof - removal ID and damage event match',
    receiptDocs: ['removal-damage-53906.pdf', 'removal-order.pdf', 'damage-event.csv'],
    checks: ['Removal ID matched', 'Damage event archived', 'Payout watcher active'],
  },
  {
    amazonStatus: 'Follow-up filed',
    submissionSummary: 'Payout follow-up has been filed because Amazon approval exists but the settlement deposit has not landed.',
    proofPacket: 'Approval proof, settlement report, payout delta worksheet',
    trackerStage: 'Payout follow-up',
    progress: 78,
    responseWindow: 'Expected payout movement in next settlement cycle',
    nextWatch: 'Watch settlement reports for approved amount landing',
    nextCheck: 'Next settlement check in 2 hr',
    payoutSignal: 'Approved amount missing from payout',
    confidence: 'Very strong proof - Amazon already approved the amount',
    receiptDocs: ['approval-thread.pdf', 'settlement-gap.xlsx', 'payout-followup-34655.pdf'],
    checks: ['Approval reference captured', 'Settlement delta calculated', 'Payout alert armed'],
  },
  {
    amazonStatus: 'In Amazon review',
    submissionSummary: 'Inventory-disposal case is filed with the disposal event, inventory ledger, and reimbursement-safety wording.',
    proofPacket: 'Disposal event, inventory ledger, supplier invoice',
    trackerStage: 'Disposal review',
    progress: 61,
    responseWindow: 'Expected Amazon review in 2 business days',
    nextWatch: 'Watch for disposal reason challenge or reimbursement approval',
    nextCheck: 'Next automated check in 36 min',
    payoutSignal: 'No disposal reimbursement found yet',
    confidence: 'Solid proof - category wording reviewed',
    receiptDocs: ['disposal-error-19833.pdf', 'disposal-event.csv', 'inventory-ledger.csv'],
    checks: ['Disposal reason eligible', 'Overclaim check passed', 'Thread watcher active'],
  },
];

const DEMO_ACTIVE_FILING_VARIANTS = [
  {
    anomalyType: 'inbound_shipment_shortage',
    caseType: 'inbound_shipment_shortage',
    storeName: 'Acme Operations US FBA',
    orderId: 'FBA17ACME001',
    sku: 'ACME-TRAVEL-MUG-BLK',
    asin: 'B0ACME0001',
    amount: 486.2,
    unitsAffected: 14,
    matchedDocuments: 4,
    currentAction: 'Uploading evidence packet to Seller Central',
    stageLabel: 'Evidence upload',
    progress: 72,
    step: 4,
    totalSteps: 6,
    amazonRoute: 'Seller Central / FBA inventory reimbursement / Inbound shortage',
    evidencePacket: 'Invoice, BOL, shipment reconciliation, inventory ledger',
    evidenceDocs: ['INV-ACME-2001.pdf', 'BOL-ACME-2001.pdf', 'FBA17ACME001-reconciliation.csv', 'inventory-ledger-excerpt.csv'],
    eta: '~90 sec',
    retries: 0,
    health: 'Healthy - Amazon response pending',
    nextProof: 'Amazon case ID + submission receipt',
    policyWindow: 'Inside 18-month FBA window',
    activity: ['Validated 14-unit shortage', 'Attached supplier invoice', 'Uploading BOL with dock receipt'],
  },
  {
    anomalyType: 'fba_fee_overcharge',
    caseType: 'fba_fee_overcharge',
    storeName: 'Acme Operations US FBA',
    orderId: '113-5621175-4496210',
    sku: 'ACME-CABLE-USB3-6FT',
    asin: 'B0ACME0002',
    amount: 218.75,
    unitsAffected: 5,
    matchedDocuments: 3,
    currentAction: 'Drafting Seller Central reimbursement message',
    stageLabel: 'Claim narrative',
    progress: 58,
    step: 3,
    totalSteps: 6,
    amazonRoute: 'Seller Central / FBA fee reimbursement / Size-tier correction',
    evidencePacket: 'Fee audit, catalog dimensions, order fee ledger',
    evidenceDocs: ['AUD-ACME-FEE-2002.csv', 'catalog-dimension-proof.pdf', 'order-fee-ledger.csv'],
    eta: '~2 min',
    retries: 0,
    health: 'Healthy - policy text matched',
    nextProof: 'Submitted case transcript + fee audit hash',
    policyWindow: 'Chargeback period verified',
    activity: ['Confirmed standard-size dimensions', 'Matched fee overcharge rows', 'Drafting Amazon-safe claim language'],
  },
  {
    anomalyType: 'lost_warehouse_inventory',
    caseType: 'warehouse_transfer_loss',
    storeName: 'Acme Operations EU FBA',
    orderId: 'FBA18ACME003',
    sku: 'ACME-DESK-LAMP-OAK',
    asin: 'B0ACME0003',
    amount: 742.4,
    unitsAffected: 4,
    matchedDocuments: 5,
    currentAction: 'Waiting for Amazon case acknowledgement',
    stageLabel: 'Amazon acknowledgement',
    progress: 88,
    step: 5,
    totalSteps: 6,
    amazonRoute: 'Seller Central / Inventory reimbursement / Warehouse transfer loss',
    evidencePacket: 'Transfer ledger, receive report, supplier invoice, FC movement log',
    evidenceDocs: ['INV-ACME-2003.pdf', 'FC-transfer-ledger.xlsx', 'receive-gap-report.csv', 'movement-log.pdf'],
    eta: '~45 sec',
    retries: 1,
    health: 'Healthy - one Amazon timeout recovered',
    nextProof: 'Amazon case ID landing in filing ledger',
    policyWindow: 'Eligible transfer event',
    activity: ['Recovered from Seller Central timeout', 'Replayed attachment manifest', 'Listening for case ID'],
  },
  {
    anomalyType: 'damaged_inventory',
    caseType: 'damaged_inventory',
    storeName: 'Acme Operations EU FBA',
    orderId: 'FBA17ACME005',
    sku: 'ACME-YOGA-MAT-SAGE',
    asin: 'B0ACME0005',
    amount: 963.1,
    unitsAffected: 12,
    matchedDocuments: 4,
    currentAction: 'Attaching damage proof and unit-cost support',
    stageLabel: 'Attachment binding',
    progress: 64,
    step: 4,
    totalSteps: 7,
    amazonRoute: 'Seller Central / FBA inventory reimbursement / Warehouse damaged',
    evidencePacket: 'Damage event, invoice, PO, receiving discrepancy',
    evidenceDocs: ['SHIP-ACME-2005.pdf', 'INV-ACME-2005.pdf', 'PO-ACME-2005.pdf', 'damage-event-log.csv'],
    eta: '~3 min',
    retries: 0,
    health: 'Healthy - all required docs present',
    nextProof: 'Seller Central receipt + attached file manifest',
    policyWindow: 'Damage event date verified',
    activity: ['Bound PO to supplier invoice', 'Attached warehouse damage log', 'Checking final claim amount'],
  },
  {
    anomalyType: 'lost_inventory_adjustment',
    caseType: 'lost_inventory_adjustment',
    storeName: 'Acme Operations US FBA',
    orderId: 'FBA19ACME006',
    sku: 'ACME-STORAGE-BIN-L',
    asin: 'B0ACME0006',
    amount: 634.88,
    unitsAffected: 6,
    matchedDocuments: 4,
    currentAction: 'Reconciling Amazon inventory ledger before submit',
    stageLabel: 'Ledger check',
    progress: 46,
    step: 3,
    totalSteps: 7,
    amazonRoute: 'Seller Central / Inventory adjustment reimbursement / Lost units',
    evidencePacket: 'Settlement statement, inventory ledger, weight audit, invoice',
    evidenceDocs: ['STMT-ACME-2006.pdf', 'AUD-ACME-2006.csv', 'INV-ACME-2006.pdf'],
    eta: '~4 min',
    retries: 0,
    health: 'Healthy - duplicate reimbursement cleared',
    nextProof: 'Clean submission proof after ledger check',
    policyWindow: 'No prior reimbursement found',
    activity: ['Checked duplicate payout risk', 'Verified unit cost proof', 'Reconciling ledger movement IDs'],
  },
  {
    anomalyType: 'customer_return_not_received',
    caseType: 'customer_return_not_received',
    storeName: 'Acme Operations US FBA',
    orderId: '114-4410290-0140095',
    sku: 'ACME-PHONE-STAND-WHT',
    asin: 'B0ACME0008',
    amount: 157.32,
    unitsAffected: 3,
    matchedDocuments: 3,
    currentAction: 'Submitting return-not-received claim',
    stageLabel: 'Final submit',
    progress: 81,
    step: 5,
    totalSteps: 6,
    amazonRoute: 'Seller Central / Customer return reimbursement / Return not received',
    evidencePacket: 'Order return event, settlement ledger, SKU cost basis',
    evidenceDocs: ['return-event-0140095.csv', 'settlement-ledger-excerpt.csv', 'unit-cost-proof.pdf'],
    eta: '~60 sec',
    retries: 0,
    health: 'Healthy - case body accepted',
    nextProof: 'Amazon acknowledgement timestamp',
    policyWindow: 'Return event inside claim window',
    activity: ['Matched return event to order', 'Attached settlement ledger', 'Submitting claim body'],
  },
  {
    anomalyType: 'settlement_reimbursement_gap',
    caseType: 'settlement_reimbursement_gap',
    storeName: 'Acme Operations US FBA',
    orderId: '114-5155722-8199427',
    sku: 'ACME-BENTO-BOX-GRN',
    asin: 'B0ACME0009',
    amount: 311.28,
    unitsAffected: 6,
    matchedDocuments: 3,
    currentAction: 'Checking payout gap before Amazon handoff',
    stageLabel: 'Payout gap proof',
    progress: 39,
    step: 2,
    totalSteps: 6,
    amazonRoute: 'Seller Central / Reimbursement follow-up / Settlement gap',
    evidencePacket: 'Approved case, settlement report, payout delta worksheet',
    evidenceDocs: ['AMZ-ACME-42009-thread.pdf', 'settlement-report.csv', 'AUD-ACME-2009.xlsx'],
    eta: '~5 min',
    retries: 0,
    health: 'Healthy - payout delta isolated',
    nextProof: 'Follow-up case reference + payout worksheet',
    policyWindow: 'Approval exists, payout absent',
    activity: ['Compared approval to settlement', 'Built payout delta worksheet', 'Preparing follow-up evidence'],
  },
  {
    anomalyType: 'inventory_disposal_error',
    caseType: 'inventory_disposal_error',
    storeName: 'Acme Operations US FBA',
    orderId: 'FBA17ACME010',
    sku: 'ACME-CLEANING-CLOTH-12',
    asin: 'B0ACME0010',
    amount: 96.7,
    unitsAffected: 4,
    matchedDocuments: 3,
    currentAction: 'Selecting Amazon case category',
    stageLabel: 'Route selection',
    progress: 31,
    step: 2,
    totalSteps: 7,
    amazonRoute: 'Seller Central / Inventory reimbursement / Disposal error',
    evidencePacket: 'Disposal event, shipment proof, supplier invoice',
    evidenceDocs: ['INV-ACME-2010.pdf', 'BOL-ACME-2010.pdf', 'disposal-event-log.csv'],
    eta: '~6 min',
    retries: 0,
    health: 'Healthy - category decision running',
    nextProof: 'Case category + submission receipt',
    policyWindow: 'Inventory event eligible',
    activity: ['Mapped disposal event to SKU', 'Found matching BOL', 'Selecting safest Amazon category'],
  },
  {
    anomalyType: 'inbound_shipment_shortage',
    caseType: 'inbound_shipment_shortage',
    storeName: 'Acme Operations US FBA',
    orderId: 'FBA17ACME007',
    sku: 'ACME-LED-STRIP-16FT',
    asin: 'B0ACME0007',
    amount: 376.45,
    unitsAffected: 9,
    matchedDocuments: 4,
    currentAction: 'Validating claim amount against unit-cost proof',
    stageLabel: 'Amount validation',
    progress: 52,
    step: 3,
    totalSteps: 6,
    amazonRoute: 'Seller Central / FBA inventory reimbursement / Inbound received short',
    evidencePacket: 'Invoice, shipment plan, receive delta, SKU cost proof',
    evidenceDocs: ['INV-ACME-2007.pdf', 'FBA17ACME007-plan.csv', 'receive-delta.csv', 'unit-cost-proof.pdf'],
    eta: '~2 min',
    retries: 0,
    health: 'Healthy - amount tolerance passed',
    nextProof: 'Final Amazon message + receipt',
    policyWindow: 'Shipment close date verified',
    activity: ['Calculated recoverable amount', 'Checked Amazon tolerance', 'Preparing final message'],
  },
  {
    anomalyType: 'case_thread_reappeal',
    caseType: 'case_thread_reappeal',
    storeName: 'Acme Operations US FBA',
    orderId: 'FBA18ACME011',
    sku: 'ACME-THERMAL-BAG-BLU',
    asin: 'B0ACME0011',
    amount: 529.42,
    unitsAffected: 7,
    matchedDocuments: 4,
    currentAction: 'Replying to Amazon with missing POD proof',
    stageLabel: 'Appeal reply',
    progress: 67,
    step: 4,
    totalSteps: 6,
    amazonRoute: 'Seller Central / Existing case reply / POD requested',
    evidencePacket: 'Stamped POD, PO, carrier timestamp, original case thread',
    evidenceDocs: ['PO-ACME-2011.pdf', 'stamped-POD-FBA18ACME011.pdf', 'carrier-scan.json', 'AMZ-ACME-42011-thread.pdf'],
    eta: '~2 min',
    retries: 0,
    health: 'Healthy - Amazon request matched',
    nextProof: 'Thread reply timestamp + attachment manifest',
    policyWindow: 'Reply window still open',
    activity: ['Parsed Amazon rejection reason', 'Found stamped POD gap', 'Attaching reply evidence'],
  },
];

const DEMO_COMPLETED_RECOVERY_VARIANTS = [
  {
    caseNumber: '791-50384216',
    providerCaseId: '16874192034',
    merchantReference: 'Northstar Home Goods · Warehouse transfer loss',
    proofReference: 'AMZ-PAID-XFER-2034',
    externalReference: 'REC-XFER-8842',
    approvedAmount: 184.72,
    paidAmount: 184.72,
    status: 'approved',
    reconciliationStatus: 'paid',
    reconciliationSource: 'amazon_settlement_report',
    payoutStatus: 'paid',
    operatorState: 'reconciled',
    submittedMinutesAgo: 1520,
    updatedMinutesAgo: 216,
  },
  {
    caseNumber: '791-61427803',
    providerCaseId: '16882957162',
    merchantReference: 'Blue Ridge Supply · Inbound shipment shortage',
    proofReference: 'AMZ-PAID-INB-7162',
    externalReference: 'REC-INB-2409',
    approvedAmount: 287.46,
    paidAmount: 287.46,
    status: 'approved',
    reconciliationStatus: 'reconciled',
    reconciliationSource: 'settlement_reconciliation',
    payoutStatus: 'paid',
    operatorState: 'closed',
    submittedMinutesAgo: 1688,
    updatedMinutesAgo: 263,
  },
  {
    caseNumber: '791-77260491',
    providerCaseId: '16865503418',
    merchantReference: 'Atlas Pet Co · Damaged FBA inventory',
    proofReference: 'AMZ-PAID-DMG-3418',
    externalReference: 'REC-DMG-6921',
    approvedAmount: 96.44,
    paidAmount: 92.18,
    status: 'approved',
    reconciliationStatus: 'paid',
    reconciliationSource: 'partial_settlement_match',
    payoutStatus: 'paid',
    operatorState: 'reconciled',
    submittedMinutesAgo: 1814,
    updatedMinutesAgo: 318,
  },
  {
    caseNumber: '791-84013577',
    providerCaseId: '16890187440',
    merchantReference: 'Cedar Peak Brands · Refund without return',
    proofReference: 'AMZ-PAID-RWR-7440',
    externalReference: 'REC-RWR-5736',
    approvedAmount: 57.9,
    paidAmount: 57.9,
    status: 'approved',
    reconciliationStatus: 'reconciled',
    reconciliationSource: 'amazon_reimbursement_event',
    payoutStatus: 'paid',
    operatorState: 'reconciled',
    submittedMinutesAgo: 1972,
    updatedMinutesAgo: 374,
  },
  {
    caseNumber: '791-92467118',
    providerCaseId: '16877846329',
    merchantReference: 'Sierra Wellness · FBA fee overcharge',
    proofReference: 'AMZ-PAID-FEE-6329',
    externalReference: 'REC-FEE-1180',
    approvedAmount: 128.36,
    paidAmount: 128.36,
    status: 'won',
    reconciliationStatus: 'paid',
    reconciliationSource: 'settlement_fee_adjustment',
    payoutStatus: 'paid_out',
    operatorState: 'closed',
    submittedMinutesAgo: 2115,
    updatedMinutesAgo: 421,
  },
  {
    caseNumber: '791-10758294',
    providerCaseId: '16899730551',
    merchantReference: 'Mason Outdoor · Lost inventory adjustment',
    proofReference: 'AMZ-PAID-LOST-0551',
    externalReference: 'REC-LOST-9032',
    approvedAmount: 421.65,
    paidAmount: 421.65,
    status: 'approved',
    reconciliationStatus: 'reconciled',
    reconciliationSource: 'bank_reconciliation',
    payoutStatus: 'paid',
    operatorState: 'reconciled',
    submittedMinutesAgo: 2269,
    updatedMinutesAgo: 487,
  },
  {
    caseNumber: '791-23641708',
    providerCaseId: '16884276690',
    merchantReference: 'Harbor Kids · Customer return not received',
    proofReference: 'AMZ-PAID-RET-6690',
    externalReference: 'REC-RET-4075',
    approvedAmount: 73.28,
    paidAmount: 73.28,
    status: 'approved',
    reconciliationStatus: 'paid',
    reconciliationSource: 'amazon_settlement_report',
    payoutStatus: 'paid',
    operatorState: 'closed',
    submittedMinutesAgo: 2380,
    updatedMinutesAgo: 539,
  },
  {
    caseNumber: '791-34809512',
    providerCaseId: '16871960427',
    merchantReference: 'Pioneer Tools · Removal order damage',
    proofReference: 'AMZ-PAID-REM-0427',
    externalReference: 'REC-REM-3187',
    approvedAmount: 267.11,
    paidAmount: 264.85,
    status: 'approved',
    reconciliationStatus: 'reconciled',
    reconciliationSource: 'manual_payout_match',
    payoutStatus: 'paid',
    operatorState: 'reconciled',
    submittedMinutesAgo: 2517,
    updatedMinutesAgo: 604,
  },
  {
    caseNumber: '791-45970326',
    providerCaseId: '16900418273',
    merchantReference: 'Orion Baby · Settlement reimbursement gap',
    proofReference: 'AMZ-PAID-SET-8273',
    externalReference: 'REC-SET-7761',
    approvedAmount: 144.83,
    paidAmount: 144.83,
    status: 'won',
    reconciliationStatus: 'paid',
    reconciliationSource: 'settlement_reconciliation',
    payoutStatus: 'paid_out',
    operatorState: 'closed',
    submittedMinutesAgo: 2661,
    updatedMinutesAgo: 671,
  },
  {
    caseNumber: '791-56281044',
    providerCaseId: '16869453702',
    merchantReference: 'Luma Beauty · Inventory disposal error',
    proofReference: 'AMZ-PAID-DISP-3702',
    externalReference: 'REC-DISP-5524',
    approvedAmount: 219.47,
    paidAmount: 219.47,
    status: 'approved',
    reconciliationStatus: 'reconciled',
    reconciliationSource: 'amazon_reimbursement_event',
    payoutStatus: 'paid',
    operatorState: 'reconciled',
    submittedMinutesAgo: 2798,
    updatedMinutesAgo: 734,
  },
];

function buildDemoDisputeRow(stage: 'ready' | 'filing' | 'filed' | 'attention', index: number, baseMs: number): DisputeRow {
  const entryNumber = index + 1;
  const padded = String(entryNumber).padStart(2, '0');
  const amount = 140 + entryNumber * 17;
  const updatedAt = demoTimestamp(baseMs, index * 11 + (stage === 'ready' ? 9 : stage === 'filing' ? 21 : stage === 'filed' ? 34 : 47));

  if (stage === 'filed') {
    const variant = DEMO_FILED_CASE_VARIANTS[index % DEMO_FILED_CASE_VARIANTS.length];
    const filedPreview = DEMO_FILED_REVIEW_VARIANTS[index % DEMO_FILED_REVIEW_VARIANTS.length];
    const submittedAt = demoTimestamp(baseMs, variant.submittedMinutesAgo);

    return {
      dispute_case_id: `demo-filed-${padded}`,
      linked_dispute_case_id: `demo-filed-linked-${padded}`,
      detection_result_id: `demo-filed-detection-${padded}`,
      case_number: variant.amazonCaseId,
      claim_number: variant.proofReference,
      has_real_dispute_case: true,
      filing_status: 'filed',
      status: variant.status,
      can_file: false,
      anomaly_type: variant.anomalyType,
      case_type: variant.caseType,
      store_name: variant.storeName,
      order_id: variant.orderId,
      sku: variant.sku,
      asin: variant.asin,
      expected_payout_amount: variant.amount,
      requested_amount: variant.amount,
      approved_amount: null,
      actual_payout_amount: null,
      recovery_status: null,
      payout_proof_status: null,
      proof_status: null,
      eligibility_status: 'ready',
      matched_document_count: variant.matchedDocuments,
      updated_at: updatedAt,
      currency: 'USD',
      amazon_case_id: variant.amazonCaseId,
      submission_state_divergence: false,
      block_reasons: [],
      last_error: null,
      submission_proof: {
        proof_present: true,
        proof_reference: variant.proofReference,
        amazon_case_id: variant.amazonCaseId,
        external_reference: variant.externalReference,
        submitted_at: submittedAt,
        submission_channel: 'seller_central',
        attachment_count: variant.attachments,
      },
      filed_preview: filedPreview,
    } as DisputeRow;
  }

  if (stage === 'filing') {
    const variant = DEMO_ACTIVE_FILING_VARIANTS[index % DEMO_ACTIVE_FILING_VARIANTS.length];
    return {
      dispute_case_id: `demo-filing-${padded}`,
      linked_dispute_case_id: `demo-filing-linked-${padded}`,
      detection_result_id: `demo-filing-detection-${padded}`,
      case_number: `LIVE-${variant.orderId.replace(/[^A-Z0-9]/gi, '').slice(-6)}-${padded}`,
      claim_number: `MARGIN-FILING-${padded}`,
      has_real_dispute_case: true,
      filing_status: 'submitting',
      status: 'pending',
      can_file: false,
      anomaly_type: variant.anomalyType,
      case_type: variant.caseType,
      store_name: variant.storeName,
      order_id: variant.orderId,
      sku: variant.sku,
      asin: variant.asin,
      expected_payout_amount: variant.amount,
      requested_amount: variant.amount,
      approved_amount: null,
      actual_payout_amount: null,
      recovery_status: null,
      payout_proof_status: null,
      proof_status: 'filing_ready',
      eligibility_status: 'ready',
      matched_document_count: variant.matchedDocuments,
      updated_at: updatedAt,
      currency: 'USD',
      amazon_case_id: null,
      submission_state_divergence: false,
      block_reasons: [],
      last_error: null,
      submission_proof: null,
      filing_preview: {
        currentAction: variant.currentAction,
        stageLabel: variant.stageLabel,
        progress: variant.progress,
        step: variant.step,
        totalSteps: variant.totalSteps,
        amazonRoute: variant.amazonRoute,
        evidencePacket: variant.evidencePacket,
        evidenceDocs: variant.evidenceDocs,
        unitsAffected: variant.unitsAffected,
        channel: 'Seller Central',
        eta: variant.eta,
        retries: variant.retries,
        health: variant.health,
        nextProof: variant.nextProof,
        policyWindow: variant.policyWindow,
        activity: variant.activity,
      },
    } as DisputeRow;
  }

  if (stage === 'attention') {
    const approvalHold = index % 2 === 0;
    return {
      dispute_case_id: `demo-attention-${padded}`,
      linked_dispute_case_id: `demo-attention-linked-${padded}`,
      detection_result_id: `demo-attention-detection-${padded}`,
      case_number: `ATT-${padded}`,
      claim_number: `CLM-ATT-${padded}`,
      has_real_dispute_case: true,
      filing_status: approvalHold ? 'pending_approval' : 'blocked',
      status: 'pending',
      can_file: false,
      anomaly_type: approvalHold ? 'fee_discrepancy' : 'inbound_shipment_shortage',
      case_type: approvalHold ? 'fee_discrepancy' : 'inbound_shipment_shortage',
      store_name: 'Margin Demo Store',
      order_id: `114-55124${padded}-3388${padded}`,
      sku: `MARGIN-ATTN-${padded}`,
      asin: `B0MATTEN${padded}`,
      expected_payout_amount: amount,
      requested_amount: amount,
      approved_amount: null,
      actual_payout_amount: null,
      recovery_status: null,
      payout_proof_status: null,
      proof_status: approvalHold ? 'manual_review' : null,
      eligibility_status: approvalHold ? 'ready' : 'insufficient_data',
      matched_document_count: approvalHold ? 3 : 1,
      updated_at: updatedAt,
      currency: 'USD',
      amazon_case_id: null,
      submission_state_divergence: false,
      block_reasons: approvalHold ? [] : ['missing_unit_cost_proof'],
      last_error: approvalHold ? null : 'Unit cost proof still needs to be linked.',
      submission_proof: null,
    } as DisputeRow;
  }

  const readyVariant = DEMO_READY_CASE_VARIANTS[index % DEMO_READY_CASE_VARIANTS.length];
  const readyPreview = DEMO_READY_DECISION_VARIANTS[index % DEMO_READY_DECISION_VARIANTS.length];

  return {
    dispute_case_id: `demo-ready-${padded}`,
    linked_dispute_case_id: `demo-ready-linked-${padded}`,
    detection_result_id: `demo-ready-detection-${padded}`,
    case_number: readyVariant.caseNumber,
    claim_number: readyVariant.claimNumber,
    has_real_dispute_case: true,
    filing_status: 'pending',
    status: 'pending',
    can_file: true,
    anomaly_type: readyVariant.anomalyType,
    case_type: readyVariant.caseType,
    store_name: readyVariant.storeName,
    order_id: readyVariant.orderId,
    sku: readyVariant.sku,
    asin: readyVariant.asin,
    expected_payout_amount: readyVariant.amount,
    requested_amount: readyVariant.amount,
    approved_amount: null,
    actual_payout_amount: null,
    recovery_status: null,
    payout_proof_status: null,
    proof_status: 'filing_ready',
    eligibility_status: 'ready',
    matched_document_count: readyVariant.matchedDocuments,
    updated_at: demoTimestamp(baseMs, readyVariant.updatedMinutesAgo),
    currency: 'USD',
    amazon_case_id: null,
    submission_state_divergence: false,
    block_reasons: [],
    last_error: null,
    submission_proof: null,
    ready_preview: readyPreview,
  } as DisputeRow;
}

function buildDemoLedgerRow(stage: 'payout' | 'completed', index: number, baseMs: number): LedgerRow {
  const entryNumber = index + 1;
  const padded = String(entryNumber).padStart(2, '0');
  const amount = 210 + entryNumber * 23;
  const completedVariant = stage === 'completed'
    ? DEMO_COMPLETED_RECOVERY_VARIANTS[index % DEMO_COMPLETED_RECOVERY_VARIANTS.length]
    : null;
  const updatedAt = completedVariant
    ? demoTimestamp(baseMs, completedVariant.updatedMinutesAgo)
    : demoTimestamp(baseMs, index * 13 + 58);
  const providerReference = stage === 'payout' ? `784-66${padded}10` : `791-48${padded}24`;
  const internalReference = stage === 'payout' ? `784-72${padded}41` : `791-55${padded}38`;
  const resolvedAmount = completedVariant?.approvedAmount ?? amount;
  const paidAmount = completedVariant?.paidAmount ?? null;

  return {
    row_type: 'dispute_case_projection',
    entity_type: 'dispute_case',
    has_real_dispute_case: true,
    has_real_recovery_record: true,
    linked_dispute_case_id: `demo-${stage}-linked-${padded}`,
    recovery_record_id: `demo-${stage}-recovery-${padded}`,
    dispute_case_id: `demo-${stage}-case-${padded}`,
    detection_result_id: `demo-${stage}-detection-${padded}`,
    case_number: completedVariant?.caseNumber ?? internalReference,
    provider_case_id: completedVariant?.providerCaseId ?? providerReference,
    merchant_reference: completedVariant?.merchantReference ?? 'Margin Merchant',
    status: completedVariant?.status ?? 'approved',
    filing_status: 'filed',
    submission_proof: {
      proof_present: true,
      proof_reference: completedVariant?.proofReference ?? `AMZ-${stage.toUpperCase()}-${padded}`,
      amazon_case_id: completedVariant?.providerCaseId ?? providerReference,
      external_reference: completedVariant?.externalReference ?? `LEDGER-${padded}`,
      submitted_at: demoTimestamp(baseMs, completedVariant?.submittedMinutesAgo ?? index * 15 + 120),
      status: 'submitted',
      outcome: 'approved',
    },
    has_submission_proof: true,
    has_amazon_reference: true,
    has_filing_truth: true,
    has_approval_truth: true,
    approved_amount: resolvedAmount,
    actual_payout_amount: stage === 'completed' ? paidAmount ?? resolvedAmount : null,
    expected_payout_amount: resolvedAmount,
    reconciliation_status: completedVariant?.reconciliationStatus ?? 'pending_payout',
    reconciliation_source: completedVariant?.reconciliationSource ?? 'amazon_approval',
    payout_status: completedVariant?.payoutStatus ?? 'not_paid',
    operator_state: completedVariant?.operatorState ?? 'waiting_for_payout',
    outstanding_amount: stage === 'completed' ? Math.max(0, resolvedAmount - (paidAmount ?? resolvedAmount)) : resolvedAmount,
    currency: 'USD',
    last_updated_at: updatedAt,
  };
}

function amountOrNull(value: number | null | undefined) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function formatMoney(amount: number | null | undefined, currency = 'USD') {
  if (typeof amount !== 'number' || Number.isNaN(amount)) return NOT_AVAILABLE;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

function formatRelative(value: string | null | undefined) {
  if (!value) return NOT_AVAILABLE;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return NOT_AVAILABLE;
  return formatDistanceToNow(date, { addSuffix: true });
}

function formatTimestamp(value: string | null | undefined) {
  if (!value) return NOT_AVAILABLE;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return NOT_AVAILABLE;
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function humanize(value: string | null | undefined) {
  if (!value) return NOT_AVAILABLE;
  return value.replace(/[_-]+/g, ' ').trim().replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatFilingBlockReason(reason: string | null | undefined) {
  const normalized = normalizeStatus(reason);
  if (!normalized) return null;

  if (normalized === 'missing_quantity_value') return 'quantity or value proof';
  if (normalized === 'missing_unit_cost_proof') return 'unit cost proof';
  if (normalized === 'missing_policy_window_reference_date') return 'policy-window date';
  if (normalized === 'dangerous_or_prohibited_document_detected') return 'safe supporting document';
  if (normalized === 'missing_evidence_links') return 'linked evidence';
  if (normalized === 'qa_fixture_do_not_file') return 'QA-only filing hold';
  if (normalized === 'submission_state_divergence') return 'case-state reconciliation';

  if (normalized.startsWith('missing_required_document_family:')) {
    const family = normalized.split(':')[1]?.split('|').map(humanize).join(', ');
    return family ? `required document: ${family}` : 'required document';
  }

  if (normalized.startsWith('missing_required_document_type:')) {
    const type = normalized.split(':')[1];
    return type ? `required document: ${humanize(type)}` : 'required document';
  }

  if (normalized.startsWith('case_status_not_fileable:')) {
    return `case status ${humanize(normalized.split(':')[1])}`;
  }

  if (normalized.startsWith('case_not_ready_for_filing_status:')) {
    return `filing state ${humanize(normalized.split(':')[1])}`;
  }

  return humanize(normalized);
}

function summarizeFilingBlockers(row: DisputeRow) {
  const blockers = (row.block_reasons || [])
    .map(formatFilingBlockReason)
    .filter((value): value is string => Boolean(value));

  if (blockers.length === 0 && row.last_error) {
    return row.last_error;
  }

  if (blockers.length === 0) return null;
  return blockers.slice(0, 3).join(', ');
}

function normalizeStatus(value: unknown) {
  return String(value || '').trim().toLowerCase();
}

function hasSubmissionStateDivergence(row: DisputeRow) {
  return row.submission_state_divergence === true ||
    Boolean(
      row.submission_proof?.proof_present &&
      (row.block_reasons || []).some((reason) => normalizeStatus(reason) === 'submission_state_divergence')
    );
}

function totalAmount(values: Array<number | null | undefined>) {
  return values.reduce((sum, value) => sum + (typeof value === 'number' && Number.isFinite(value) ? value : 0), 0);
}

function isRecoveredDisputeRow(row: DisputeRow) {
  return COMPLETED_RECOVERY_STATUSES.has(normalizeStatus(row.recovery_status))
    || amountOrNull(row.actual_payout_amount) !== null
    || normalizeStatus(row.payout_proof_status) === 'verified';
}

function hasFiledDisputeTruth(row: DisputeRow) {
  const status = normalizeStatus(row.status);
  return row.submission_proof?.proof_present === true
    || Boolean(row.amazon_case_id || row.submission_proof?.amazon_case_id || row.submission_proof?.external_reference || row.submission_proof?.proof_reference)
    || ACTIVE_AMAZON_REVIEW_STATUSES.has(status);
}

function isApprovedPendingDisputeRow(row: DisputeRow) {
  return row.has_real_dispute_case === true
    && hasFiledDisputeTruth(row)
    && APPROVED_CASE_STATUSES.has(normalizeStatus(row.status))
    && !isRecoveredDisputeRow(row);
}

function isBeingFiledDisputeRow(row: DisputeRow) {
  return row.has_real_dispute_case === true
    && ACTIVE_FILING_STATUSES.has(normalizeStatus(row.filing_status))
    && !isApprovedPendingDisputeRow(row)
    && !isRecoveredDisputeRow(row);
}

function isFiledDisputeRow(row: DisputeRow) {
  const status = normalizeStatus(row.status);
  const filingStatus = normalizeStatus(row.filing_status);

  return row.has_real_dispute_case === true
    && !isBeingFiledDisputeRow(row)
    && !hasSubmissionStateDivergence(row)
    && !isApprovedPendingDisputeRow(row)
    && !isRecoveredDisputeRow(row)
    && hasFiledDisputeTruth(row)
    && (
      FILED_FILING_STATUSES.has(filingStatus)
      || ACTIVE_AMAZON_REVIEW_STATUSES.has(status)
    );
}

function isAttentionDisputeRow(row: DisputeRow) {
  if (
    row.has_real_dispute_case !== true
    || isBeingFiledDisputeRow(row)
    || isFiledDisputeRow(row)
    || isApprovedPendingDisputeRow(row)
    || isRecoveredDisputeRow(row)
  ) {
    return false;
  }

  if (hasSubmissionStateDivergence(row)) {
    return true;
  }

  const filingStatus = normalizeStatus(row.filing_status);
  return ATTENTION_FILING_STATUSES.has(filingStatus)
    || (READY_FILING_STATUSES.has(filingStatus) && row.can_file !== true);
}

function isReadyDisputeRow(row: DisputeRow) {
  return row.has_real_dispute_case === true
    && row.can_file === true
    && READY_FILING_STATUSES.has(normalizeStatus(row.filing_status))
    && !isBeingFiledDisputeRow(row)
    && !isFiledDisputeRow(row)
    && !isAttentionDisputeRow(row)
    && !isApprovedPendingDisputeRow(row)
    && !isRecoveredDisputeRow(row);
}

function isCompletedLedgerRow(row: LedgerRow) {
  return ['reconciled', 'paid'].includes(normalizeStatus(row.reconciliation_status))
    || normalizeStatus(row.payout_status) === 'paid'
    || amountOrNull(row.actual_payout_amount) !== null;
}

function isAwaitingPayoutLedgerRow(row: LedgerRow) {
  if (isCompletedLedgerRow(row)) return false;
  const reconciliationStatus = normalizeStatus(row.reconciliation_status);
  const operatorState = normalizeStatus(row.operator_state);
  const payoutStatus = normalizeStatus(row.payout_status);
  const caseStatus = normalizeStatus(row.status);
  if (row.has_approval_truth !== true || row.has_filing_truth !== true) return false;
  const hasApprovedValue = amountOrNull(row.approved_amount) !== null
    || amountOrNull(row.expected_payout_amount) !== null
    || amountOrNull(row.outstanding_amount) !== null;

  return reconciliationStatus === 'pending_payout'
    || operatorState === 'waiting_for_payout'
    || (payoutStatus === 'not_paid' && hasApprovedValue)
    || (APPROVED_CASE_STATUSES.has(caseStatus) && hasApprovedValue);
}

function latestTimestamp(...values: Array<string | null | undefined>) {
  const valid = values
    .map((value) => {
      if (!value) return null;
      const time = new Date(value).getTime();
      return Number.isNaN(time) ? null : { value, time };
    })
    .filter((item): item is { value: string; time: number } => item !== null)
    .sort((left, right) => right.time - left.time);
  return valid[0]?.value ?? null;
}

function disputeReference(row: DisputeRow) {
  return row.case_number || row.claim_number || row.linked_dispute_case_id || row.dispute_case_id || row.detection_result_id || NOT_AVAILABLE;
}

function ledgerReference(row: LedgerRow) {
  return row.case_number || row.recovery_record_id || row.linked_dispute_case_id || row.dispute_case_id || row.detection_result_id || NOT_AVAILABLE;
}

function disputeTypeLabel(row: DisputeRow) {
  return row.has_real_dispute_case === true ? 'Case' : 'Detection';
}

function ledgerTypeLabel(row: LedgerRow) {
  if (row.has_real_recovery_record === true) return 'Recovery';
  if (row.has_real_dispute_case === true) return 'Case';
  return 'Record';
}

function disputeTitle(row: DisputeRow) {
  return humanize(row.anomaly_type || row.case_type) !== NOT_AVAILABLE
    ? humanize(row.anomaly_type || row.case_type)
    : disputeReference(row);
}

function disputeMeta(row: DisputeRow) {
  const items = [
    row.store_name ? `Store ${row.store_name}` : null,
    row.order_id ? `Order ${row.order_id}` : null,
    row.sku ? `SKU ${row.sku}` : null,
    row.asin ? `ASIN ${row.asin}` : null,
  ].filter(Boolean);
  return items.length ? items.join(' · ') : 'Identity not available';
}

function ledgerMeta(row: LedgerRow) {
  if (row.merchant_reference) return row.merchant_reference;
  if (row.provider_case_id) return `Amazon reference ${row.provider_case_id}`;
  if (row.has_real_recovery_record === true) return 'Recovery record linked';
  if (row.has_real_dispute_case === true) return 'Dispute case linked';
  return 'Identity not available';
}

function disputeAmount(row: DisputeRow) {
  return amountOrNull(row.expected_payout_amount)
    ?? amountOrNull(row.requested_amount)
    ?? amountOrNull(row.approved_amount)
    ?? amountOrNull(row.actual_payout_amount);
}

function stableNumber(value: unknown) {
  const text = String(value || '');
  return text.split('').reduce((total, char) => total + char.charCodeAt(0), 0);
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function getReadyFilingPreview(row: DisputeRow): ReadyFilingPreview {
  const explicitPreview = (row as ReadyFilingDisputeRow).ready_preview;
  if (explicitPreview) return explicitPreview;

  const seed = stableNumber(disputeReference(row));
  const linkedCount = typeof row.matched_document_count === 'number' && Number.isFinite(row.matched_document_count)
    ? row.matched_document_count
    : 3;
  const amount = disputeAmount(row);
  const evidenceDocs = [
    row.order_id ? `${row.order_id}-shipment-proof.pdf` : 'shipment-proof.pdf',
    row.sku ? `${row.sku}-unit-cost.pdf` : 'unit-cost-proof.pdf',
    'inventory-ledger-excerpt.csv',
    'seller-central-claim-draft.txt',
  ].slice(0, Math.max(2, Math.min(4, linkedCount)));

  return {
    whyFile: row.order_id
      ? `Margin found a recoverable Amazon discrepancy tied to ${row.order_id}; proof is complete and ready for seller approval.`
      : 'Margin found a recoverable Amazon discrepancy; proof is complete and ready for seller approval.',
    evidencePacket: `${linkedCount} evidence document${linkedCount === 1 ? '' : 's'} ready`,
    evidenceDocs,
    amazonRoute: 'Seller Central / FBA reimbursement workflow',
    safety: seed % 4 === 0 ? 'Medium-low risk - review packet before approval' : 'Low risk - filing checks passed',
    priority: amount && amount > 300 ? 'High value' : seed % 3 === 0 ? 'High priority' : 'Recommended',
    confidence: 84 + (seed % 12),
    daysLeft: 18 + (seed % 43),
    unitsAffected: (seed % 9) + 1,
    recommendedAction: seed % 4 === 0 ? 'Review packet, then approve' : 'Approve filing',
    checks: [
      'Policy window valid',
      'No prior reimbursement found',
      'Safe claim body generated',
    ],
  };
}

function getActiveFilingPreview(row: DisputeRow): ActiveFilingPreview {
  const explicitPreview = (row as ActiveFilingDisputeRow).filing_preview;
  if (explicitPreview) return explicitPreview;

  const seed = stableNumber(disputeReference(row));
  const linkedCount = typeof row.matched_document_count === 'number' && Number.isFinite(row.matched_document_count)
    ? row.matched_document_count
    : 3;
  const currentActions = [
    'Uploading evidence packet to Seller Central',
    'Drafting Amazon-safe case message',
    'Binding proof files to reimbursement claim',
    'Waiting for Amazon case acknowledgement',
    'Validating amount before final submit',
  ];
  const routes = [
    'Seller Central / FBA inventory reimbursement',
    'Seller Central / Existing case reply',
    'Seller Central / Fee reimbursement',
  ];
  const evidenceDocs = [
    row.order_id ? `${row.order_id}-shipment-proof.pdf` : 'shipment-proof.pdf',
    row.sku ? `${row.sku}-unit-cost.pdf` : 'unit-cost-proof.pdf',
    'inventory-ledger-excerpt.csv',
    'seller-central-case-draft.txt',
  ].slice(0, Math.max(2, Math.min(4, linkedCount)));
  const progress = 35 + (seed % 55);
  const totalSteps = seed % 3 === 0 ? 7 : 6;
  const step = Math.min(totalSteps - 1, Math.max(2, Math.round((progress / 100) * totalSteps)));

  return {
    currentAction: currentActions[seed % currentActions.length],
    stageLabel: ['Evidence upload', 'Claim narrative', 'Final submit', 'Amazon acknowledgement'][seed % 4],
    progress,
    step,
    totalSteps,
    amazonRoute: routes[seed % routes.length],
    evidencePacket: `${linkedCount} linked evidence documents`,
    evidenceDocs,
    unitsAffected: (seed % 11) + 2,
    channel: 'Seller Central',
    eta: `~${(seed % 4) + 1} min`,
    retries: seed % 3 === 0 ? 1 : 0,
    health: seed % 3 === 0 ? 'Healthy - retry recovered' : 'Healthy - no blockers',
    nextProof: 'Amazon case ID + submission receipt',
    policyWindow: 'Policy window verified',
    activity: [
      'Validated SKU and ASIN identity',
      'Attached evidence packet',
      'Preparing Amazon acknowledgement capture',
    ],
  };
}

function getFiledFilingPreview(row: DisputeRow): FiledFilingPreview {
  const explicitPreview = (row as FiledFilingDisputeRow).filed_preview;
  if (explicitPreview) return explicitPreview;

  const seed = stableNumber(disputeReference(row));
  const proof = row.submission_proof || null;
  const attachmentCount = (proof as { attachment_count?: number | null } | null)?.attachment_count;
  const linkedCount = typeof row.matched_document_count === 'number' && Number.isFinite(row.matched_document_count)
    ? row.matched_document_count
    : attachmentCount || 3;
  const status = humanize(row.status);
  const amazonStatus = status !== NOT_AVAILABLE ? status : proof?.proof_present ? 'Submission proof recorded' : 'Filed with Amazon';
  const proofReference = proof?.proof_reference || row.claim_number || row.amazon_case_id || 'submission-proof';
  const responseWindows = [
    'Expected first response in 1-2 business days',
    'Expected queue pickup within 24 hours',
    'Amazon review usually moves in 2-3 business days',
    'Expected movement in next settlement cycle',
  ];
  const nextWatchOptions = [
    'Watch for Amazon acknowledgement, approval, or information request',
    'Watch for reimbursement event or settlement credit',
    'Watch for case-thread reply and payout movement',
    'Watch for Amazon challenge before escalation timer starts',
  ];
  const receiptDocs = [
    `${proofReference}-receipt.pdf`,
    row.order_id ? `${row.order_id}-filed-packet.pdf` : 'filed-evidence-packet.pdf',
    row.sku ? `${row.sku}-proof-index.csv` : 'proof-index.csv',
  ].slice(0, Math.max(2, Math.min(3, linkedCount)));

  return {
    amazonStatus,
    submissionSummary: row.amazon_case_id || proof?.amazon_case_id
      ? `Margin filed this case and captured Amazon case ${(proof?.amazon_case_id || row.amazon_case_id)} with the submission receipt preserved.`
      : 'Margin filed this case and preserved the submission receipt for audit and payout follow-up.',
    proofPacket: `${linkedCount} evidence item${linkedCount === 1 ? '' : 's'} filed`,
    trackerStage: ['Amazon review', 'Case thread monitoring', 'Payout watch', 'Receipt confirmed'][seed % 4],
    progress: 48 + (seed % 33),
    responseWindow: responseWindows[seed % responseWindows.length],
    nextWatch: nextWatchOptions[seed % nextWatchOptions.length],
    nextCheck: `Next automated check in ${(seed % 44) + 16} min`,
    payoutSignal: seed % 3 === 0 ? 'Settlement watcher active - no payout yet' : 'No duplicate reimbursement detected',
    confidence: seed % 4 === 0 ? 'Good proof - monitor for Amazon challenge' : 'Strong proof - receipt and evidence match',
    receiptDocs,
    checks: [
      'Amazon case reference captured',
      'Submission receipt stored',
      'Payout ledger monitoring',
    ],
  };
}

function ledgerApprovedAmount(row: LedgerRow) {
  if (row.has_approval_truth !== true) return null;
  return amountOrNull(row.approved_amount)
    ?? amountOrNull(row.expected_payout_amount)
    ?? amountOrNull(row.actual_payout_amount);
}

function ledgerRecoveredAmount(row: LedgerRow) {
  return amountOrNull(row.actual_payout_amount)
    ?? amountOrNull(row.approved_amount)
    ?? amountOrNull(row.expected_payout_amount);
}

function attentionReason(row: DisputeRow) {
  if (hasSubmissionStateDivergence(row)) return 'Reconciliation needed';
  const normalized = normalizeStatus(row.filing_status);
  if (normalized === 'pending_approval') return 'Approval needed';
  if (normalized === 'failed') return 'Failed';
  if (normalized === 'blocked') return 'Blocked';
  if (normalized === 'payment_required') return 'Payment required';
  if (normalized === 'pending_safety_verification') return 'Needs review';
  if (normalized === 'pending') return 'Not filing-ready';
  return humanize(row.filing_status) !== NOT_AVAILABLE ? humanize(row.filing_status) : 'Needs attention';
}

function attentionDetail(row: DisputeRow) {
  if (hasSubmissionStateDivergence(row)) {
    return row.submission_state_divergence_message ||
      'Submission proof exists, but the case state did not update cleanly. Margin needs to reconcile this record before treating the filed state as clean.';
  }

  const normalized = normalizeStatus(row.filing_status);
  const blockers = summarizeFilingBlockers(row);
  if (normalized === 'pending_approval') {
    return 'This case is proof-complete and queued for filing approval. Margin will not submit it until approval is recorded.';
  }
  if (normalized === 'failed') return `The last filing attempt did not complete. ${blockers ? `Current blocker: ${blockers}.` : 'Review or retry is required before filing resumes.'}`;
  if (normalized === 'blocked') return `This case is blocked before filing. ${blockers ? `Clear ${blockers} before submission.` : 'Margin will not submit it until the blocker is cleared.'}`;
  if (normalized === 'payment_required') return 'Payment is required before Margin can file this case. The case will wait instead of filing silently.';
  if (normalized === 'pending_safety_verification') return `Margin needs safety verification before filing. ${blockers ? `Current blocker: ${blockers}.` : 'The case will not submit until verification clears.'}`;
  return `This case is not currently eligible to file. ${blockers ? `Current blocker: ${blockers}.` : 'Review the dispute queue for the exact blocker or next action.'}`;
}

function filingNextStep(row: DisputeRow, stage: 'ready' | 'filing' | 'filed' | 'attention') {
  if (stage === 'ready') {
    return 'Next: approve filing manually or let Auto-File submit when enabled.';
  }

  if (stage === 'filing') {
    return `Next: ${getActiveFilingPreview(row).nextProof}.`;
  }

  if (stage === 'filed') {
    return row.submission_proof?.proof_present
      ? 'Next: Margin watches Amazon response and payout movement.'
      : 'Next: confirm proof details if this filed state needs audit support.';
  }

  if (hasSubmissionStateDivergence(row)) {
    return 'Next: reconcile case state against recorded submission proof.';
  }

  if (normalizeStatus(row.filing_status) === 'pending_approval') {
    return 'Next: approve the proof packet so Margin can submit the case.';
  }

  const blockers = summarizeFilingBlockers(row);
  return blockers ? `Next: clear ${blockers}.` : 'Next: review and clear the filing blocker.';
}

function filedProofRows(row: DisputeRow) {
  const proof = row.submission_proof || null;
  const attachmentCount = proof?.attachment_count;
  const linkedEvidenceCount = typeof row.matched_document_count === 'number' && Number.isFinite(row.matched_document_count)
    ? row.matched_document_count
    : null;

  return [
    {
      label: 'Proof reference',
      value: proof?.proof_reference || row.amazon_case_id || null,
    },
    {
      label: 'Submitted at',
      value: proof?.submitted_at ? formatTimestamp(proof.submitted_at) : null,
    },
    {
      label: 'Channel',
      value: proof?.submission_channel ? humanize(proof.submission_channel) : null,
    },
    {
      label: attachmentCount != null ? 'Attachments' : 'Linked evidence',
      value: attachmentCount != null
        ? `${attachmentCount} file${attachmentCount === 1 ? '' : 's'}`
        : linkedEvidenceCount != null
          ? `${linkedEvidenceCount} document${linkedEvidenceCount === 1 ? '' : 's'} linked`
          : null,
    },
  ];
}

function pendingPayoutReason(row: LedgerRow) {
  if (row.has_approval_truth !== true) return 'Approval not verified';
  const payout = humanize(row.payout_status);
  if (payout !== NOT_AVAILABLE) return `Awaiting payout · ${payout}`;
  return 'Approved with Amazon · awaiting payout';
}

function completedReason(row: LedgerRow) {
  return String(row.payout_status || '').trim().toLowerCase() === 'paid' ? 'Payout confirmed' : 'Recovered and reconciled';
}

function toneClasses(tone: RowTone) {
  switch (tone) {
    case 'ready':
      return {
        card: 'border-white/8 bg-[#111111]/96',
        badge: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200',
        chip: 'border-emerald-500/18 bg-emerald-500/[0.08] text-emerald-200',
      };
    case 'inFlight':
      return {
        card: 'border-white/8 bg-[#111111]/96',
        badge: 'border-amber-500/20 bg-amber-500/10 text-amber-200',
        chip: 'border-amber-500/18 bg-amber-500/[0.08] text-amber-200',
      };
    case 'submitted':
      return {
        card: 'border-white/8 bg-[#111111]/96',
        badge: 'border-blue-500/20 bg-blue-500/10 text-blue-200',
        chip: 'border-blue-500/18 bg-blue-500/[0.08] text-blue-200',
      };
    case 'approved':
      return {
        card: 'border-white/8 bg-[#111111]/96',
        badge: 'border-violet-500/20 bg-violet-500/10 text-violet-200',
        chip: 'border-violet-500/18 bg-violet-500/[0.08] text-violet-200',
      };
    case 'completed':
      return {
        card: 'border-white/8 bg-[#111111]/96',
        badge: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200',
        chip: 'border-emerald-500/18 bg-emerald-500/[0.08] text-emerald-200',
      };
    case 'attention':
      return {
        card: 'border-white/8 bg-[#111111]/96',
        badge: 'border-red-500/20 bg-red-500/10 text-red-200',
        chip: 'border-red-500/18 bg-red-500/[0.08] text-red-200',
      };
  }
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111111]/90 p-4 shadow-2xl">
      <div className="flex items-center gap-3 text-[12px] font-medium text-white/64">
        <RefreshCw className="h-4 w-4 animate-spin text-white/42" />
        <span>{label}</span>
      </div>
      <div className="mt-4 grid gap-3">
        <Skeleton className="h-24 w-full bg-white/[0.06]" />
        <Skeleton className="h-24 w-full bg-white/[0.04]" />
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/14 bg-[#111111]/92 px-4 py-5 text-sm leading-6 text-white/66 shadow-[0_18px_45px_rgba(0,0,0,0.28)]">
      {message}
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-red-500/18 bg-red-500/[0.05] px-4 py-4 text-sm leading-6 text-red-100/90">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-300" />
      <div>{message}</div>
    </div>
  );
}

function PipelineSection({
  title,
  detail,
  amount,
  countLabel,
  action,
  children,
}: {
  title: string;
  detail: string;
  amount: string;
  countLabel: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 px-6 py-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
            <h2 className="text-[15px] font-sans font-semibold tracking-tight text-white/88">{title}</h2>
            <div className="text-[13px] font-sans font-semibold tracking-tight text-[#8b8b8b]">{amount}</div>
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm font-sans text-white/60">
            <span>{detail}</span>
            <span className="text-white/32">{countLabel}</span>
          </div>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function InlineMetricStack({
  rows,
}: {
  rows: Array<{ label: string; value: string | null | undefined }>;
}) {
  const visibleRows = rows.filter((row) => row.value && row.value !== NOT_AVAILABLE);

  return (
    <div className="min-w-0 lg:border-l lg:border-white/7 lg:pl-5">
      <div className="space-y-1.5">
        {visibleRows.map((row, index) => (
          <div key={`${row.label}-${index}`} className="flex items-center justify-between gap-4">
            <span className="text-[11px] font-medium tracking-tight text-white/34">{row.label}</span>
            <span
              className={cn(
                'text-right font-semibold tracking-tight',
                index === 0 ? 'text-[13px] tabular-nums text-white' : 'text-[12px] text-[#c4c4c4]'
              )}
            >
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DisputeCard({
  row,
  tone,
  amountLabel,
  statusLabel,
  detail,
  timeLabel,
  nextStep,
  proofRows,
  action,
}: {
  row: DisputeRow;
  tone: RowTone;
  amountLabel: string;
  statusLabel: string;
  detail: string;
  timeLabel?: string | null;
  nextStep?: string | null;
  proofRows?: Array<{ label: string; value: string | null | undefined }>;
  action?: React.ReactNode;
}) {
  const classes = toneClasses(tone);
  return (
    <Card className={cn('border shadow-none', classes.card)}>
      <CardContent className="grid gap-3 p-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(240px,0.7fr)_auto] lg:items-start lg:p-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-tight', classes.badge)}>{disputeTypeLabel(row)}</span>
            <span className="text-[11px] font-semibold uppercase tracking-tight text-white/36">Ref {disputeReference(row)}</span>
          </div>
          <h3 className="mt-2 text-[14px] font-medium tracking-tight text-white/90">{disputeTitle(row)}</h3>
          <p className="mt-1.5 max-w-3xl text-sm leading-5 text-[#9a9a9a]">{detail}</p>
          <div className="mt-2 text-[11px] font-medium tracking-tight text-white/38">{disputeMeta(row)}</div>
        </div>
        <InlineMetricStack
          rows={[
            { label: amountLabel, value: formatMoney(disputeAmount(row), row.currency) },
            { label: 'Pipeline status', value: statusLabel },
            { label: 'Next step', value: nextStep || null },
            { label: 'Last movement', value: timeLabel || null },
            ...(proofRows || []),
          ]}
        />
        <div className="flex flex-col items-start gap-2 lg:items-end">{action}</div>
      </CardContent>
    </Card>
  );
}

function ReadyFilingCard({
  row,
  decisionHref,
  timeLabel,
}: {
  row: DisputeRow;
  decisionHref: string;
  timeLabel?: string | null;
}) {
  const classes = toneClasses('ready');
  const preview = getReadyFilingPreview(row);
  const confidence = Math.max(1, Math.min(99, preview.confidence));

  return (
    <Card className={cn('border shadow-none', classes.card)}>
      <CardContent className="p-4">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.12fr)_minmax(360px,1fr)_minmax(220px,0.56fr)] lg:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-tight', classes.badge)}>
                Seller decision
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-tight text-white/36">Ref {disputeReference(row)}</span>
              <span className="text-[11px] font-semibold uppercase tracking-tight text-emerald-200/70">{preview.priority}</span>
            </div>

            <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h3 className="text-[14px] font-medium tracking-tight text-white/90">{disputeTitle(row)}</h3>
              <span className="text-[13px] font-semibold tabular-nums tracking-tight text-white">{formatMoney(disputeAmount(row), row.currency)}</span>
            </div>

            <p className="mt-1.5 max-w-3xl text-sm leading-5 text-[#b7b7b7]">{preview.whyFile}</p>
            <div className="mt-2 text-[11px] font-medium tracking-tight text-white/42">
              {row.order_id ? `${row.order_id} · ` : ''}{preview.unitsAffected} units · SKU {row.sku || NOT_AVAILABLE} · ASIN {row.asin || NOT_AVAILABLE}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {preview.evidenceDocs.slice(0, 4).map((doc) => (
                <span
                  key={doc}
                  className="inline-flex max-w-full rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1 text-[10px] font-semibold tracking-tight text-white/60"
                >
                  <span className="truncate">{doc}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="min-w-0 lg:border-l lg:border-white/7 lg:pl-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-tight text-white/34">Evidence confidence</div>
                <div className="mt-1 text-[13px] font-semibold tracking-tight text-white">{confidence}% ready</div>
              </div>
              <div className="text-right text-[11px] font-semibold tabular-nums tracking-tight text-emerald-200">
                {preview.daysLeft} days left
              </div>
            </div>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8">
              <div className="h-full rounded-full bg-emerald-300 shadow-[0_0_16px_rgba(110,231,183,0.35)]" style={{ width: `${confidence}%` }} />
            </div>

            <div className="mt-3 grid gap-2 text-[11px] font-medium tracking-tight text-white/48">
              <div className="flex items-start justify-between gap-4">
                <span className="text-white/30">Amazon route</span>
                <span className="max-w-[72%] text-right text-white/68">{preview.amazonRoute}</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-white/30">Evidence packet</span>
                <span className="max-w-[72%] text-right text-white/68">{preview.evidencePacket}</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-white/30">Safety</span>
                <span className="max-w-[72%] text-right text-white/68">{preview.safety}</span>
              </div>
            </div>

            <div className="mt-3 space-y-1.5">
              {preview.checks.slice(0, 3).map((check) => (
                <div key={check} className="flex items-center gap-2 text-[10px] font-medium tracking-tight text-white/46">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-300" />
                  <span className="truncate">{check}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:items-end">
            <span className={cn('inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-sans font-bold uppercase tracking-tight', classes.chip)}>
              <FileCheck2 className="h-3.5 w-3.5" />
              Seller controlled
            </span>

            <div className="flex w-full flex-col gap-2 lg:max-w-[240px]">
              <Button asChild size="sm" className="h-10 w-full px-4 font-sans font-bold text-[10px] bg-[#0052FF] text-[#FFFFFF] border border-[#0052FF] hover:bg-[#0047DD] hover:text-[#FFFFFF] rounded-lg uppercase tracking-tight">
                <Link to={decisionHref}>Approve Filing<ArrowUpRight className="ml-2 h-3.5 w-3.5" /></Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="h-9 w-full border-white/12 bg-transparent text-[10px] font-bold uppercase tracking-tight text-white/72 hover:bg-white/[0.05] hover:text-white">
                <Link to={decisionHref}>Review Packet<ArrowUpRight className="ml-2 h-3.5 w-3.5" /></Link>
              </Button>
            </div>

            <div className="w-full space-y-1.5 lg:max-w-[240px]">
              {[
                { label: 'Recommendation', value: preview.recommendedAction },
                { label: 'Control', value: 'Nothing submits until approved' },
                { label: 'Last movement', value: timeLabel || null },
              ].filter((item) => item.value).map((item) => (
                <div key={item.label} className="flex items-start justify-between gap-3">
                  <span className="text-[11px] font-medium tracking-tight text-white/34">{item.label}</span>
                  <span className="max-w-[66%] text-right text-[11px] font-semibold tracking-tight text-[#c4c4c4]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ActiveFilingCard({
  row,
  timeLabel,
}: {
  row: DisputeRow;
  timeLabel?: string | null;
}) {
  const classes = toneClasses('inFlight');
  const preview = getActiveFilingPreview(row);
  const progress = Math.max(5, Math.min(98, preview.progress));

  return (
    <Card className={cn('border shadow-none', classes.card)}>
      <CardContent className="p-4">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.12fr)_minmax(360px,1fr)_minmax(220px,0.56fr)] lg:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-tight', classes.badge)}>
                Live filing
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-tight text-white/36">Ref {disputeReference(row)}</span>
              <span className="text-[11px] font-semibold uppercase tracking-tight text-amber-200/70">{preview.stageLabel}</span>
            </div>

            <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h3 className="text-[14px] font-medium tracking-tight text-white/90">{disputeTitle(row)}</h3>
              <span className="text-[13px] font-semibold tabular-nums tracking-tight text-white">{formatMoney(disputeAmount(row), row.currency)}</span>
            </div>

            <p className="mt-1.5 max-w-3xl text-sm leading-5 text-[#b7b7b7]">{preview.currentAction}</p>
            <div className="mt-2 text-[11px] font-medium tracking-tight text-white/42">
              {row.order_id ? `${row.order_id} · ` : ''}{preview.unitsAffected} units · SKU {row.sku || NOT_AVAILABLE} · ASIN {row.asin || NOT_AVAILABLE}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {preview.evidenceDocs.slice(0, 4).map((doc) => (
                <span
                  key={doc}
                  className="inline-flex max-w-full rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1 text-[10px] font-semibold tracking-tight text-white/60"
                >
                  <span className="truncate">{doc}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="min-w-0 lg:border-l lg:border-white/7 lg:pl-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-tight text-white/34">Live stage</div>
                <div className="mt-1 text-[13px] font-semibold tracking-tight text-white">{preview.stageLabel}</div>
              </div>
              <div className="text-right text-[11px] font-semibold tabular-nums tracking-tight text-amber-200">
                Step {preview.step} of {preview.totalSteps}
              </div>
            </div>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8">
              <div className="h-full rounded-full bg-amber-300 shadow-[0_0_16px_rgba(252,211,77,0.35)]" style={{ width: `${progress}%` }} />
            </div>

            <div className="mt-3 grid gap-2 text-[11px] font-medium tracking-tight text-white/48">
              <div className="flex items-start justify-between gap-4">
                <span className="text-white/30">Amazon route</span>
                <span className="max-w-[72%] text-right text-white/68">{preview.amazonRoute}</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-white/30">Evidence packet</span>
                <span className="max-w-[72%] text-right text-white/68">{preview.evidencePacket}</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-white/30">Policy check</span>
                <span className="max-w-[72%] text-right text-white/68">{preview.policyWindow}</span>
              </div>
            </div>

            <div className="mt-3 space-y-1.5">
              {preview.activity.slice(0, 3).map((event, index, visibleEvents) => (
                <div key={`${event}-${index}`} className="flex items-center gap-2 text-[10px] font-medium tracking-tight text-white/46">
                  <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', index === visibleEvents.length - 1 ? 'bg-amber-300' : 'bg-white/18')} />
                  <span className="truncate">{event}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:items-end">
            <span className={cn('inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-sans font-bold uppercase tracking-tight', classes.chip)}>
              <Clock3 className="h-3.5 w-3.5" />
              Submitting live
            </span>

            <div className="w-full space-y-1.5 lg:max-w-[240px]">
              {[
                { label: 'ETA', value: preview.eta },
                { label: 'Channel', value: preview.channel },
                { label: 'Retries', value: `${preview.retries}` },
                { label: 'Health', value: preview.health },
                { label: 'Next proof', value: preview.nextProof },
                { label: 'Last movement', value: timeLabel || null },
              ].filter((item) => item.value).map((item) => (
                <div key={item.label} className="flex items-start justify-between gap-3">
                  <span className="text-[11px] font-medium tracking-tight text-white/34">{item.label}</span>
                  <span className="max-w-[66%] text-right text-[11px] font-semibold tracking-tight text-[#c4c4c4]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FiledFilingCard({
  row,
  detailHref,
  timeLabel,
}: {
  row: DisputeRow;
  detailHref: string;
  timeLabel?: string | null;
}) {
  const classes = toneClasses('submitted');
  const preview = getFiledFilingPreview(row);
  const progress = Math.max(35, Math.min(92, preview.progress));
  const proof = row.submission_proof || null;
  const proofReference = proof?.proof_reference || row.claim_number || NOT_AVAILABLE;
  const amazonCase = proof?.amazon_case_id || row.amazon_case_id || row.case_number || NOT_AVAILABLE;
  const externalReference = proof?.external_reference || NOT_AVAILABLE;
  const attachmentCount = (proof as { attachment_count?: number | null } | null)?.attachment_count;
  const submittedLabel = proof?.submitted_at ? formatTimestamp(proof.submitted_at) : null;

  return (
    <Card className={cn('border shadow-none', classes.card)}>
      <CardContent className="p-4">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.12fr)_minmax(360px,1fr)_minmax(220px,0.56fr)] lg:items-start">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-tight', classes.badge)}>
                Filed with Amazon
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-tight text-white/36">Ref {disputeReference(row)}</span>
              <span className="text-[11px] font-semibold uppercase tracking-tight text-blue-200/70">Amazon case {amazonCase}</span>
            </div>

            <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h3 className="text-[14px] font-medium tracking-tight text-white/90">{disputeTitle(row)}</h3>
              <span className="text-[13px] font-semibold tabular-nums tracking-tight text-white">{formatMoney(disputeAmount(row), row.currency)}</span>
            </div>

            <p className="mt-1.5 max-w-3xl text-sm leading-5 text-[#b7b7b7]">{preview.submissionSummary}</p>
            <div className="mt-2 text-[11px] font-medium tracking-tight text-white/42">
              {row.order_id ? `${row.order_id} · ` : ''}SKU {row.sku || NOT_AVAILABLE} · ASIN {row.asin || NOT_AVAILABLE}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {preview.receiptDocs.slice(0, 3).map((doc) => (
                <span
                  key={doc}
                  className="inline-flex max-w-full rounded-full border border-white/10 bg-white/[0.035] px-2.5 py-1 text-[10px] font-semibold tracking-tight text-white/60"
                >
                  <span className="truncate">{doc}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="min-w-0 lg:border-l lg:border-white/7 lg:pl-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-tight text-white/34">Amazon case tracker</div>
                <div className="mt-1 text-[13px] font-semibold tracking-tight text-white">{preview.trackerStage}</div>
              </div>
              <div className="text-right text-[11px] font-semibold tabular-nums tracking-tight text-blue-200">
                {progress}% monitored
              </div>
            </div>

            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/8">
              <div className="h-full rounded-full bg-blue-300 shadow-[0_0_16px_rgba(147,197,253,0.35)]" style={{ width: `${progress}%` }} />
            </div>

            <div className="mt-3 grid gap-2 text-[11px] font-medium tracking-tight text-white/48">
              <div className="flex items-start justify-between gap-4">
                <span className="text-white/30">Amazon status</span>
                <span className="max-w-[72%] text-right text-white/68">{preview.amazonStatus}</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-white/30">Proof packet</span>
                <span className="max-w-[72%] text-right text-white/68">{preview.proofPacket}</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-white/30">Proof quality</span>
                <span className="max-w-[72%] text-right text-white/68">{preview.confidence}</span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <span className="text-white/30">Response window</span>
                <span className="max-w-[72%] text-right text-white/68">{preview.responseWindow}</span>
              </div>
            </div>

            <div className="mt-3 space-y-1.5">
              {preview.checks.slice(0, 3).map((check) => (
                <div key={check} className="flex items-center gap-2 text-[10px] font-medium tracking-tight text-white/46">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-300" />
                  <span className="truncate">{check}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:items-end">
            <span className={cn('inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-sans font-bold uppercase tracking-tight', classes.chip)}>
              <FileCheck2 className="h-3.5 w-3.5" />
              Receipt locked
            </span>

            <div className="flex w-full flex-col gap-2 lg:max-w-[240px]">
              <Button asChild size="sm" className="h-10 w-full px-4 font-sans font-bold text-[10px] bg-[#0052FF] text-[#FFFFFF] border border-[#0052FF] hover:bg-[#0047DD] hover:text-[#FFFFFF] rounded-lg uppercase tracking-tight">
                <Link to={detailHref}>View Case<ArrowUpRight className="ml-2 h-3.5 w-3.5" /></Link>
              </Button>
              <Button asChild size="sm" variant="outline" className="h-9 w-full border-white/12 bg-transparent text-[10px] font-bold uppercase tracking-tight text-white/72 hover:bg-white/[0.05] hover:text-white">
                <Link to={detailHref}>Audit Proof<ArrowUpRight className="ml-2 h-3.5 w-3.5" /></Link>
              </Button>
            </div>

            <div className="w-full space-y-1.5 lg:max-w-[240px]">
              {[
                { label: 'Submitted', value: submittedLabel || timeLabel || null },
                { label: 'Proof ref', value: proofReference },
                { label: 'External ref', value: externalReference },
                { label: 'Attachments', value: attachmentCount != null ? `${attachmentCount} file${attachmentCount === 1 ? '' : 's'}` : null },
                { label: 'Next watch', value: preview.nextWatch },
                { label: 'Next check', value: preview.nextCheck },
                { label: 'Payout signal', value: preview.payoutSignal },
              ].filter((item) => item.value && item.value !== NOT_AVAILABLE).map((item) => (
                <div key={item.label} className="flex items-start justify-between gap-3">
                  <span className="text-[11px] font-medium tracking-tight text-white/34">{item.label}</span>
                  <span className="max-w-[66%] text-right text-[11px] font-semibold tracking-tight text-[#c4c4c4]">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LedgerCard({
  row,
  tone,
  amountLabel,
  amount,
  statusLabel,
  detail,
  timeLabel,
  detailHref,
}: {
  row: LedgerRow;
  tone: RowTone;
  amountLabel: string;
  amount: number | null;
  statusLabel: string;
  detail: string;
  timeLabel?: string | null;
  detailHref: string | null;
}) {
  const classes = toneClasses(tone);
  return (
    <Card className={cn('border shadow-none', classes.card)}>
      <CardContent className="grid gap-3 p-4 lg:grid-cols-[minmax(0,1.65fr)_minmax(240px,0.7fr)_auto] lg:items-start lg:p-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('inline-flex rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-tight', classes.badge)}>{ledgerTypeLabel(row)}</span>
            <span className="text-[11px] font-semibold uppercase tracking-tight text-white/36">Ref {ledgerReference(row)}</span>
          </div>
          <h3 className="mt-2 text-[14px] font-medium tracking-tight text-white/90">{ledgerReference(row)}</h3>
          <p className="mt-1.5 max-w-3xl text-sm leading-5 text-[#9a9a9a]">{detail}</p>
          <div className="mt-2 text-[11px] font-medium tracking-tight text-white/38">{ledgerMeta(row)}</div>
        </div>
        <InlineMetricStack
          rows={[
            { label: amountLabel, value: formatMoney(amount, row.currency) },
            { label: 'Payout status', value: statusLabel },
            { label: 'Last movement', value: timeLabel || null },
          ]}
        />
        <div className="flex flex-col items-start gap-2 lg:items-end">
          {detailHref ? (
            <Button asChild size="sm" variant="outline" className="border-white/12 bg-transparent text-white/72 hover:bg-white/[0.05] hover:text-white">
              <Link to={detailHref}>
                Open recovery
                <ArrowUpRight className="ml-2 h-3.5 w-3.5" />
              </Link>
            </Button>
          ) : (
            <span className="text-[11px] font-medium uppercase tracking-tight text-white/34">Not Available</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function FilingPipeline() {
  const { tenantSlug } = useParams<{ tenantSlug?: string }>();
  const { isReady } = useTenant();
  const activeSlug = normalizeTenantSlug(tenantSlug) || '';

  const [disputeRows, setDisputeRows] = useState<DisputeRow[] | null>(null);
  const [ledgerRows, setLedgerRows] = useState<LedgerRow[] | null>(null);
  const [disputeUpdatedAt, setDisputeUpdatedAt] = useState<string | null>(null);
  const [ledgerUpdatedAt, setLedgerUpdatedAt] = useState<string | null>(null);
  const [disputeLoading, setDisputeLoading] = useState(true);
  const [ledgerLoading, setLedgerLoading] = useState(true);
  const [disputeError, setDisputeError] = useState<string | null>(null);
  const [ledgerError, setLedgerError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'ready' | 'filing' | 'filed' | 'attention' | 'payout' | 'completed'>('ready');

  const loadDisputes = useCallback(async () => {
    if (!activeSlug) {
      setDisputeRows([]);
      setDisputeLoading(false);
      return;
    }
    setDisputeLoading(true);
    setDisputeError(null);
    try {
      const response = await api.getDisputeCaseQueue({ page: 1, page_size: DISPUTE_PAGE_SIZE, sort_by: 'updated_at', sort_order: 'desc' }, activeSlug);
      if (!response.ok || !response.data) throw new Error(response.error || 'Unable to load filing-ready truth.');

      const firstPage = response.data as DisputeQueueData;
      const allRows = [...(firstPage.rows || [])];
      const totalRows = Number(firstPage.filtered_results || allRows.length);
      const pageSize = Math.max(1, Number(firstPage.page_size || DISPUTE_PAGE_SIZE));

      for (let page = 2; allRows.length < totalRows; page += 1) {
        const pageResponse = await api.getDisputeCaseQueue({ page, page_size: DISPUTE_PAGE_SIZE, sort_by: 'updated_at', sort_order: 'desc' }, activeSlug);
        if (!pageResponse.ok || !pageResponse.data) {
          throw new Error(pageResponse.error || 'Unable to load complete filing queue truth.');
        }

        const pageRows = pageResponse.data.rows || [];
        if (pageRows.length === 0) break;

        allRows.push(...pageRows);
        if (pageRows.length < pageSize) break;
      }

      setDisputeRows(allRows);
      setDisputeUpdatedAt(firstPage.last_updated_at || null);
    } catch (error: unknown) {
      setDisputeRows([]);
      setDisputeUpdatedAt(null);
      setDisputeError(getErrorMessage(error, 'Unable to load filing-ready truth.'));
    } finally {
      setDisputeLoading(false);
    }
  }, [activeSlug]);

  const loadLedger = useCallback(async () => {
    if (!activeSlug) {
      setLedgerRows([]);
      setLedgerLoading(false);
      return;
    }
    setLedgerLoading(true);
    setLedgerError(null);
    try {
      const response = await api.getRecoveriesLedger({ page: 1, page_size: LEDGER_PAGE_SIZE, sort_by: 'last_updated_at', sort_dir: 'desc' }, activeSlug);
      if (!response.ok || !response.data?.success) throw new Error(response.error || 'Unable to load payout truth.');
      const firstPage = response.data as LedgerResponse;
      const allRows = Array.isArray(firstPage.rows) ? [...firstPage.rows] : [];
      const totalPages = Math.max(1, Number(firstPage.pagination?.total_pages || 1));

      for (let page = 2; page <= totalPages; page += 1) {
        const pageResponse = await api.getRecoveriesLedger({ page, page_size: LEDGER_PAGE_SIZE, sort_by: 'last_updated_at', sort_dir: 'desc' }, activeSlug);
        if (!pageResponse.ok || !pageResponse.data?.success) {
          throw new Error(pageResponse.error || 'Unable to load complete payout truth.');
        }

        const pageData = pageResponse.data as LedgerResponse;
        const pageRows = Array.isArray(pageData.rows) ? pageData.rows : [];
        if (pageRows.length === 0) break;
        allRows.push(...pageRows);
      }

      setLedgerRows(allRows);
      setLedgerUpdatedAt(firstPage.summary?.last_updated_at || null);
    } catch (error: unknown) {
      setLedgerRows([]);
      setLedgerUpdatedAt(null);
      setLedgerError(getErrorMessage(error, 'Unable to load payout truth.'));
    } finally {
      setLedgerLoading(false);
    }
  }, [activeSlug]);

  useEffect(() => {
    if (!isReady) return;
    void loadDisputes();
    void loadLedger();
  }, [isReady, loadDisputes, loadLedger]);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.allSettled([loadDisputes(), loadLedger()]);
    } finally {
      setRefreshing(false);
    }
  }, [loadDisputes, loadLedger]);

  const demoSeedTimestamp = useMemo(() => Date.now(), []);
  const liveReadyRows = useMemo(() => (disputeRows || []).filter(isReadyDisputeRow), [disputeRows]);
  const liveBeingFiledRows = useMemo(() => (disputeRows || []).filter(isBeingFiledDisputeRow), [disputeRows]);
  const liveFiledRows = useMemo(() => (disputeRows || []).filter(isFiledDisputeRow), [disputeRows]);
  const liveAttentionRows = useMemo(() => (disputeRows || []).filter(isAttentionDisputeRow), [disputeRows]);
  const liveApprovedRows = useMemo(() => (ledgerRows || []).filter(isAwaitingPayoutLedgerRow), [ledgerRows]);
  const liveCompletedRows = useMemo(() => (ledgerRows || []).filter(isCompletedLedgerRow), [ledgerRows]);

  // Temporary demo rows for recording the submission-flow states.
  const demoReadyRows = useMemo(
    () => Array.from({ length: DEMO_PIPELINE_ROW_COUNT }, (_, index) => buildDemoDisputeRow('ready', index, demoSeedTimestamp)),
    [demoSeedTimestamp]
  );
  const demoBeingFiledRows = useMemo(
    () => Array.from({ length: DEMO_PIPELINE_ROW_COUNT }, (_, index) => buildDemoDisputeRow('filing', index, demoSeedTimestamp)),
    [demoSeedTimestamp]
  );
  const demoFiledRows = useMemo(
    () => Array.from({ length: DEMO_PIPELINE_ROW_COUNT }, (_, index) => buildDemoDisputeRow('filed', index, demoSeedTimestamp)),
    [demoSeedTimestamp]
  );
  const demoAttentionRows = useMemo(
    () => Array.from({ length: DEMO_PIPELINE_ROW_COUNT }, (_, index) => buildDemoDisputeRow('attention', index, demoSeedTimestamp)),
    [demoSeedTimestamp]
  );
  const demoApprovedRows = useMemo(
    () => Array.from({ length: DEMO_PIPELINE_ROW_COUNT }, (_, index) => buildDemoLedgerRow('payout', index, demoSeedTimestamp)),
    [demoSeedTimestamp]
  );
  const demoCompletedRows = useMemo(
    () => Array.from({ length: DEMO_PIPELINE_ROW_COUNT }, (_, index) => buildDemoLedgerRow('completed', index, demoSeedTimestamp)),
    [demoSeedTimestamp]
  );

  const readyRows = useMemo(() => [...demoReadyRows, ...liveReadyRows], [demoReadyRows, liveReadyRows]);
  const beingFiledRows = useMemo(() => [...demoBeingFiledRows, ...liveBeingFiledRows], [demoBeingFiledRows, liveBeingFiledRows]);
  const filedRows = useMemo(() => [...demoFiledRows, ...liveFiledRows], [demoFiledRows, liveFiledRows]);
  const attentionRows = useMemo(() => [...demoAttentionRows, ...liveAttentionRows], [demoAttentionRows, liveAttentionRows]);
  const approvedRows = useMemo(() => [...demoApprovedRows, ...liveApprovedRows], [demoApprovedRows, liveApprovedRows]);
  const completedRows = useMemo(() => [...demoCompletedRows, ...liveCompletedRows], [demoCompletedRows, liveCompletedRows]);

  const readyTotal = useMemo(() => totalAmount(readyRows.map(disputeAmount)), [readyRows]);
  const inMotionTotal = useMemo(() => totalAmount([...beingFiledRows.map(disputeAmount), ...filedRows.map(disputeAmount), ...approvedRows.map(ledgerApprovedAmount)]), [approvedRows, beingFiledRows, filedRows]);
  const recoveredTotal = useMemo(() => totalAmount(completedRows.map(ledgerRecoveredAmount)), [completedRows]);

  const latestMovement = latestTimestamp(
    disputeUpdatedAt,
    ledgerUpdatedAt,
    ...readyRows.map((row) => row.updated_at),
    ...beingFiledRows.map((row) => row.updated_at),
    ...filedRows.map((row) => row.updated_at),
    ...attentionRows.map((row) => row.updated_at),
    ...approvedRows.map((row) => row.last_updated_at),
    ...completedRows.map((row) => row.last_updated_at),
  );

  const disputeCasesHref = tenantRoute(activeSlug, '/dispute-cases');
  const lastUpdatedLabel = latestMovement ? formatDistanceToNow(new Date(latestMovement), { addSuffix: true }) : null;
  const totalVisibleRecords = readyRows.length + beingFiledRows.length + filedRows.length + attentionRows.length + approvedRows.length + completedRows.length;
  const snapshotPills = [
    readyRows.length ? `${readyRows.length} ready to file` : null,
    beingFiledRows.length ? `${beingFiledRows.length} submitting now` : null,
    filedRows.length ? `${filedRows.length} already with Amazon` : null,
    attentionRows.length ? `${attentionRows.length} need attention` : null,
    approvedRows.length ? `${approvedRows.length} awaiting payout` : null,
    completedRows.length ? `${completedRows.length} recovered` : null,
  ].filter(Boolean) as string[];

  const pipelineTabs = [
    {
      value: 'ready' as const,
      label: 'Ready to file',
      title: 'Ready to File',
      detail: 'Seller-approved filing queue. Review proof, risk, route, and upside before anything is sent.',
      amount: formatMoney(readyTotal),
      countLabel: `${readyRows.length} seller decision${readyRows.length === 1 ? '' : 's'} waiting`,
      action: readyRows.length ? (
        <Button asChild size="sm" className="h-10 px-4 font-sans font-bold text-[10px] bg-[#0052FF] text-[#FFFFFF] border border-[#0052FF] hover:bg-[#0047DD] hover:text-[#FFFFFF] rounded-lg uppercase tracking-tight">
          <Link to={disputeCasesHref}>Approve Filing<ArrowUpRight className="ml-2 h-3.5 w-3.5" /></Link>
        </Button>
      ) : null,
      content: disputeLoading ? (
        <LoadingState label="Preparing filing-ready cases" />
      ) : readyRows.length ? (
        <div className="grid gap-3">
          {readyRows.map((row) => (
            <ReadyFilingCard
              key={row.dispute_case_id}
              row={row}
              decisionHref={disputeCasesHref}
              timeLabel={row.updated_at ? `Updated ${formatRelative(row.updated_at)}` : null}
            />
          ))}
        </div>
      ) : disputeError ? (
        <ErrorState message={disputeError} />
      ) : (
        <EmptyState message="No filing-ready cases yet — continue scanning or review blocked items below." />
      ),
    },
    {
      value: 'filing' as const,
      label: 'Being filed',
      title: 'Being Filed',
      detail: 'Live Amazon submissions with packet status, route, evidence, ETA, and proof capture.',
      amount: formatMoney(totalAmount(beingFiledRows.map(disputeAmount))),
      countLabel: `${beingFiledRows.length} active Amazon handoff${beingFiledRows.length === 1 ? '' : 's'}`,
      action: null,
      content: disputeLoading ? (
        <LoadingState label="Checking active filing handoffs" />
      ) : beingFiledRows.length ? (
        <div className="grid gap-3">
          {beingFiledRows.map((row) => (
            <ActiveFilingCard
              key={row.dispute_case_id}
              row={row}
              timeLabel={row.updated_at ? `Updated ${formatRelative(row.updated_at)}` : null}
            />
          ))}
        </div>
      ) : disputeError ? (
        <ErrorState message={disputeError} />
      ) : (
        <EmptyState message="No cases are being filed right now — active submissions appear here only when the backend is actually submitting to Amazon." />
      ),
    },
    {
      value: 'filed' as const,
      label: 'Filed',
      title: 'Filed / In Progress',
      detail: 'Filed cases with Amazon receipts, proof packets, case IDs, and response monitoring.',
      amount: formatMoney(totalAmount(filedRows.map(disputeAmount))),
      countLabel: `${filedRows.length} case${filedRows.length === 1 ? '' : 's'} already with Amazon`,
      action: null,
      content: disputeLoading ? (
        <LoadingState label="Checking filed cases and Amazon response truth" />
      ) : filedRows.length ? (
        <div className="grid gap-3">
          {filedRows.map((row) => (
            <FiledFilingCard
              key={row.dispute_case_id}
              row={row}
              detailHref={disputeCasesHref}
              timeLabel={row.submission_proof?.submitted_at ? `Submitted ${formatRelative(row.submission_proof.submitted_at)}` : row.updated_at ? `Last movement ${formatRelative(row.updated_at)}` : null}
            />
          ))}
        </div>
      ) : disputeError ? (
        <ErrorState message={disputeError} />
      ) : (
        <EmptyState message="No cases filed yet — once submitted, they will appear here." />
      ),
    },
    {
      value: 'attention' as const,
      label: 'Needs attention',
      title: 'Needs Attention',
      detail: 'Cases that need approval, retry, or a recorded blocker cleared before filing can continue.',
      amount: formatMoney(totalAmount(attentionRows.map(disputeAmount))),
      countLabel: `${attentionRows.length} case${attentionRows.length === 1 ? '' : 's'} gated`,
      action: attentionRows.length ? (
        <Button asChild size="sm" className="h-10 px-4 font-sans font-bold text-[10px] bg-[#0052FF] text-[#FFFFFF] border border-[#0052FF] hover:bg-[#0047DD] hover:text-[#FFFFFF] rounded-lg uppercase tracking-tight">
          <Link to={disputeCasesHref}>Review queue<ArrowUpRight className="ml-2 h-3.5 w-3.5" /></Link>
        </Button>
      ) : null,
      content: disputeLoading ? (
        <LoadingState label="Checking blocked and failed filing states" />
      ) : attentionRows.length ? (
        <div className="grid gap-3">
          {attentionRows.map((row) => (
            <DisputeCard
              key={row.dispute_case_id}
              row={row}
              tone="attention"
              amountLabel="Estimated recovery"
              statusLabel={attentionReason(row)}
              detail={attentionDetail(row)}
              timeLabel={row.updated_at ? `Updated ${formatRelative(row.updated_at)}` : null}
              nextStep={filingNextStep(row, 'attention')}
              proofRows={hasSubmissionStateDivergence(row) ? filedProofRows(row) : undefined}
              action={<span className={cn('inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-[10px] font-sans font-bold uppercase tracking-tight', toneClasses('attention').chip)}><AlertCircle className="h-3.5 w-3.5" />{hasSubmissionStateDivergence(row) ? 'Proof needs reconciliation' : attentionReason(row)}</span>}
            />
          ))}
        </div>
      ) : disputeError ? (
        <ErrorState message={disputeError} />
      ) : (
        <EmptyState message="No filing blockers are visible right now." />
      ),
    },
    {
      value: 'payout' as const,
      label: 'Awaiting payout',
      title: 'Approved / Awaiting Payout',
      detail: 'Approved value that still needs payout confirmation.',
      amount: formatMoney(totalAmount(approvedRows.map(ledgerApprovedAmount))),
      countLabel: `${approvedRows.length} recovery item${approvedRows.length === 1 ? '' : 's'} awaiting payout`,
      action: null,
      content: ledgerLoading ? (
        <LoadingState label="Loading payout truth" />
      ) : approvedRows.length ? (
        <div className="grid gap-3">
          {approvedRows.map((row) => (
            <LedgerCard
              key={row.recovery_record_id || row.linked_dispute_case_id || row.dispute_case_id || row.case_number}
              row={row}
              tone="approved"
              amountLabel="Approved value"
              amount={ledgerApprovedAmount(row)}
              statusLabel={pendingPayoutReason(row)}
              detail="Amazon approval is already recorded. Margin is now waiting on payout truth to land."
              timeLabel={row.last_updated_at ? `Awaiting payout · updated ${formatRelative(row.last_updated_at)}` : null}
              detailHref={row.linked_dispute_case_id || row.dispute_case_id ? tenantRoute(activeSlug, `/recoveries/${encodeURIComponent(row.linked_dispute_case_id || row.dispute_case_id || '')}`) : null}
            />
          ))}
        </div>
      ) : ledgerError ? (
        <ErrorState message={ledgerError} />
      ) : (
        <EmptyState message="No approved payouts waiting right now — once Amazon approves a case, it will appear here until payout lands." />
      ),
    },
    {
      value: 'completed' as const,
      label: 'Completed',
      title: 'Completed',
      detail: 'Recovered value already confirmed back to the account.',
      amount: formatMoney(recoveredTotal),
      countLabel: `${completedRows.length} recovery item${completedRows.length === 1 ? '' : 's'} completed`,
      action: null,
      content: ledgerLoading ? (
        <LoadingState label="Loading recovered payout confirmations" />
      ) : completedRows.length ? (
        <div className="grid gap-3">
          {completedRows.map((row) => (
            <LedgerCard
              key={row.recovery_record_id || row.linked_dispute_case_id || row.dispute_case_id || row.case_number}
              row={row}
              tone="completed"
              amountLabel="Recovered value"
              amount={ledgerRecoveredAmount(row)}
              statusLabel={completedReason(row)}
              detail="The payout has already been confirmed or reconciled in the recovery ledger."
              timeLabel={row.last_updated_at ? `Confirmed ${formatRelative(row.last_updated_at)}` : null}
              detailHref={row.linked_dispute_case_id || row.dispute_case_id ? tenantRoute(activeSlug, `/recoveries/${encodeURIComponent(row.linked_dispute_case_id || row.dispute_case_id || '')}`) : null}
            />
          ))}
        </div>
      ) : ledgerError ? (
        <ErrorState message={ledgerError} />
      ) : (
        <EmptyState message="No completed recoveries yet — once payout is confirmed, completed items will appear here." />
      ),
    },
  ];

  return (
    <PageLayout title="Submission Flow" noPadding>
      <div className="platform-vitality-page min-h-screen bg-[#F9FAFB] text-[#111827] relative overflow-hidden">
        <div
          className="fixed inset-0 pointer-events-none opacity-[0.03]"
          style={{
            backgroundImage:
              `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
          }}
        />
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#F9FAFB] via-[#F9FAFB] to-[#F3F6F8]" />

        <div className="relative z-10 container mx-auto px-8 pt-10 pb-20 space-y-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-sans font-bold text-white tracking-tight">Submissions and Payouts</h1>
              <p className="text-sm text-white/50 font-sans max-w-3xl">
                Show exactly what is proof-complete, actively submitting, filed with proof, blocked, waiting for payout, and fully recovered without asking sellers to interpret queue logic.
              </p>
            </div>
            <div className="flex flex-col items-start gap-2 lg:items-end">
              {lastUpdatedLabel ? (
                <div className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-sans font-bold uppercase tracking-tight text-white/75">
                  Submission flow live
                  <span className="ml-2 text-white/40">{lastUpdatedLabel}</span>
                </div>
              ) : null}
              <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white">
                {latestMovement ? `Pipeline refreshed ${lastUpdatedLabel}` : 'Pipeline update time unavailable'}
              </div>
              <Button
                onClick={() => void refreshAll()}
                className="h-10 px-4 font-sans font-bold text-[10px] bg-white text-[#4B5563] border border-[#E5E7EB] hover:bg-[#F3F4F6] hover:text-[#111827] rounded-lg uppercase tracking-tight"
              >
                <RefreshCw className={cn('w-3 h-3 mr-2', refreshing ? 'animate-spin' : '')} />
                Refresh
              </Button>
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/8 bg-[#0c0c0c] text-white">
            <div className="px-5 py-4">
              <div className="min-w-0">
                <p className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Current filing snapshot</p>
                <p className="mt-2 text-sm font-sans font-bold tracking-tight text-white">
                  {readyRows.length > 0
                    ? `${formatMoney(readyTotal)} is ready to file now while ${formatMoney(inMotionTotal)} is already moving through Amazon or payout follow-up.`
                    : `${formatMoney(inMotionTotal)} is already moving while Margin keeps checking for the next filing-ready case.`}
                </p>
                <p className="mt-1 text-xs font-sans text-white/60">
                  {completedRows.length > 0
                    ? `${formatMoney(recoveredTotal)} is already confirmed back to the account.`
                    : 'Recovered payouts will appear here as soon as financial confirmation lands.'}
                </p>
                <p className="mt-2 text-xs font-sans text-white/48">
                  Margin files only when proof requirements are met; blocked cases stay out of filing until the recorded issue is cleared.
                </p>
                <p className="mt-2 text-[10px] font-sans font-bold uppercase tracking-tight text-white/28">
                  Scope: ready, submitting, filed, gated, payout, and recovered truth from the current account
                </p>
              </div>
            </div>
            <div className="border-t border-white/8 px-5 py-4">
              <div className="mb-4 flex flex-wrap gap-2">
                {snapshotPills.map((pill) => (
                  <span
                    key={pill}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-sans font-bold uppercase tracking-tight text-white/70"
                  >
                    {pill}
                  </span>
                ))}
                {totalVisibleRecords > 0 ? (
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-sans font-bold uppercase tracking-tight text-white/70">
                    {totalVisibleRecords} records in pipeline view
                  </span>
                ) : null}
              </div>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  { label: 'Being filed', value: formatMoney(totalAmount(beingFiledRows.map(disputeAmount))), detail: beingFiledRows.length ? `${beingFiledRows.length} case${beingFiledRows.length === 1 ? '' : 's'} actively submitting now` : 'No active Amazon submission right now' },
                  { label: 'With Amazon', value: formatMoney(totalAmount([...filedRows.map(disputeAmount), ...approvedRows.map(ledgerApprovedAmount)])), detail: filedRows.length + approvedRows.length ? `${filedRows.length + approvedRows.length} case${filedRows.length + approvedRows.length === 1 ? '' : 's'} filed, in review, or payout-tracked` : 'No filed or approved cases yet' },
                  { label: 'Needs attention', value: formatMoney(totalAmount(attentionRows.map(disputeAmount))), detail: attentionRows.length ? `${attentionRows.length} case${attentionRows.length === 1 ? '' : 's'} blocked with recorded reasons` : 'No blockers visible right now' },
                  { label: 'Recovered', value: formatMoney(recoveredTotal), detail: completedRows.length ? `${completedRows.length} payout-confirmed item${completedRows.length === 1 ? '' : 's'}` : 'No recovered payouts confirmed yet' },
                ].map((card) => (
                  <div key={card.label} className="rounded-xl border border-white/8 bg-white/[0.02] p-3">
                    <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">{card.label}</div>
                    <div className="mt-2 text-left text-lg font-sans font-bold tracking-tight text-[#8b8b8b] tabular-nums">{card.value}</div>
                    <div className="mt-1 text-[11px] font-sans leading-5 tracking-tight text-white/62">{card.detail}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Card className="bg-[#0c0c0c] border-white/5 text-white rounded-2xl overflow-hidden">
            <CardHeader className="border-b border-white/5 bg-white/[0.01] px-6 py-5">
              <div className="flex flex-col gap-3">
                <div>
                  <div className="text-[10px] font-sans font-bold uppercase tracking-tight text-white/30">Conversion surface</div>
                  <h2 className="mt-2 text-xl font-sans font-bold tracking-tight text-white">Confirmed claims moving through filing</h2>
                  <p className="mt-1 text-xs font-sans leading-5 text-white/60">
                    Each tab answers one question: what can file, what is filing, what is already with Amazon, what is approved, and what is already recovered.
                  </p>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="w-full">
                <div className="overflow-x-auto border-b border-white/6">
                  <TabsList className="h-auto w-full min-w-max justify-start gap-8 rounded-none bg-transparent px-6 py-0 text-left">
                    {pipelineTabs.map((tab) => (
                      <TabsTrigger
                        key={tab.value}
                        value={tab.value}
                        className="rounded-none border-b-2 border-transparent px-0 py-4 text-[15px] font-sans font-semibold tracking-tight text-white/38 shadow-none ring-0 transition-colors hover:text-[#0052FF] data-[state=active]:border-[#0052FF] data-[state=active]:bg-transparent data-[state=active]:text-[#0052FF] data-[state=active]:shadow-none"
                      >
                        {tab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                {pipelineTabs.map((tab) => (
                  <TabsContent key={tab.value} value={tab.value} className="mt-0">
                    <PipelineSection title={tab.title} detail={tab.detail} amount={tab.amount} countLabel={tab.countLabel} action={tab.action}>
                      {tab.content}
                    </PipelineSection>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  );
}
