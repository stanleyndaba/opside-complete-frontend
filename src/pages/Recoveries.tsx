import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { format, subDays, startOfYear, startOfQuarter } from 'date-fns';
import { CalendarIcon, Search, MoreHorizontal, FileText, Eye, RefreshCw, Info, AlertTriangle, X, CheckCircle2, Clock, ExternalLink, ChevronDown, ChevronUp, ArrowUpFromLine, Upload, Mail, Hexagon, ArrowRight, Loader2, Sparkles, FileSearch } from 'lucide-react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { TenantLink as Link } from '@/components/navigation/TenantLink';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { detectionApi } from '@/lib/api';
import { recoveryApi } from '@/lib/recoveryApi';
import { tenantRoute } from '@/lib/routes';
import type { DateRange } from 'react-day-picker';
import { useStatusStream, type StatusEvent } from '@/hooks/use-status-stream';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { EvidenceMatchingTable } from '@/components/evidence/EvidenceMatchingTable';
import { DisputeCasesTable } from '@/components/disputes/DisputeCasesTable';
import { EvidencePackView } from '@/components/evidence/EvidencePackView';
import { ProofDocumentsModal } from '@/components/evidence/ProofDocumentsModal';
import { ClaimNegotiationTimeline } from '@/components/claims/ClaimNegotiationTimeline';


interface RecoveryClaim {
  id: string;
  claim_number?: string; // Human-readable claim ID (e.g., LI-2412-0001)
  created?: string;
  created_at?: string;
  discovery_date?: string;
  type?: string;
  anomaly_type?: string;
  details?: string;
  status: string;
  guaranteedAmount?: number;
  amount?: number;
  expectedPayoutDate?: string | null;
  expected_payout_date?: string | null;
  sku?: string;
  asin?: string;
  confidence_score?: number;
  estimated_value?: number;
  matchedDocs?: any[];
  matchedCount?: number;
  [key: string]: any; // Allow additional properties
}

// Claim strength scoring types
interface ClaimStrength {
  score: number;
  tier: 'high' | 'medium' | 'low';
  factors: { label: string; value: number; max: number; reason: string }[];
}

// Policy-Aware Document Validator Types
interface PolicyFieldCheck {
  field: string;
  label: string;
  required: boolean;
  present: boolean;
  confidence: number;
  issue?: string;
}

interface EvidenceValidation {
  quality: 'strong' | 'medium' | 'weak';
  qualityScore: number;
  recommendation: 'file_now' | 'file_with_caution' | 'wait_for_better_docs';
  recommendationText: string;
  fieldChecks: PolicyFieldCheck[];
  missingRequired: string[];
  missingOptional: string[];
  warnings: string[];
}

// FBA Reimbursement Policy Requirements by Claim Type
const FBA_POLICY_REQUIREMENTS: Record<string, { required: string[]; optional: string[]; notes: string }> = {
  // Sourcing cost claims - strictest requirements
  'sourcing_cost': {
    required: ['invoice_number', 'invoice_date', 'supplier_name', 'buyer_name', 'sku', 'quantity', 'unit_price', 'total_amount', 'currency'],
    optional: ['vat_id', 'supplier_address', 'buyer_address', 'po_number'],
    notes: 'Amazon requires full invoice with document number, date, buyer/seller names, SKU details, quantities, price, and currency'
  },
  // Lost inventory
  'lost_warehouse': {
    required: ['sku', 'asin', 'quantity', 'shipment_id'],
    optional: ['tracking_number', 'invoice_number', 'unit_price'],
    notes: 'Proof of shipment receipt and original product cost strengthens claim'
  },
  'lost:warehouse': {
    required: ['sku', 'asin', 'quantity', 'shipment_id'],
    optional: ['tracking_number', 'invoice_number', 'unit_price'],
    notes: 'Proof of shipment receipt and original product cost strengthens claim'
  },
  // Damaged inventory
  'damaged_warehouse': {
    required: ['sku', 'asin', 'quantity'],
    optional: ['invoice_number', 'unit_price', 'damage_report'],
    notes: 'Invoice showing original purchase price increases reimbursement amount'
  },
  'damaged:warehouse': {
    required: ['sku', 'asin', 'quantity'],
    optional: ['invoice_number', 'unit_price', 'damage_report'],
    notes: 'Invoice showing original purchase price increases reimbursement amount'
  },
  // Customer returns
  'customer_return_unreturned': {
    required: ['order_id', 'sku', 'refund_date'],
    optional: ['tracking_number', 'return_label', 'invoice_number'],
    notes: 'Claims must be filed within 45 days of refund with no return received'
  },
  // Inbound shipments
  'inbound_shipment_lost': {
    required: ['shipment_id', 'tracking_number', 'sku', 'quantity'],
    optional: ['pod', 'invoice_number', 'packing_slip'],
    notes: 'High-value or international shipments require detailed tracking and POD'
  },
  // FBA fee errors
  'fba_fee_error': {
    required: ['sku', 'asin', 'fee_type'],
    optional: ['correct_dimensions', 'correct_weight', 'invoice_number'],
    notes: 'Product dimension/weight proof may be required for fee disputes'
  },
  'fbaweightbasedfee': {
    required: ['sku', 'asin', 'product_weight'],
    optional: ['invoice_number', 'manufacturer_specs'],
    notes: 'Provide manufacturer weight specifications if disputing measured weight'
  },
  // Default for unknown types
  'default': {
    required: ['sku', 'asin'],
    optional: ['invoice_number', 'tracking_number', 'order_id'],
    notes: 'Basic product identification required; additional docs strengthen claim'
  }
};

// Validate evidence against FBA policy requirements
const validateEvidencePolicy = (claim: RecoveryClaim, matchedDocs?: any[]): EvidenceValidation => {
  const claimType = (claim.anomaly_type || claim.type || '').toLowerCase().replace(/[:\-]/g, '_');
  const policy = FBA_POLICY_REQUIREMENTS[claimType] || FBA_POLICY_REQUIREMENTS['default'];

  // Collect all available fields from claim and matched documents
  const availableFields: Record<string, { present: boolean; confidence: number }> = {};

  // From claim data
  if (claim.sku) availableFields['sku'] = { present: true, confidence: 1.0 };
  if (claim.asin) availableFields['asin'] = { present: true, confidence: 1.0 };
  if (claim.order_id) availableFields['order_id'] = { present: true, confidence: 1.0 };
  if (claim.shipment_id) availableFields['shipment_id'] = { present: true, confidence: 1.0 };
  if (claim.quantity) availableFields['quantity'] = { present: true, confidence: 1.0 };

  // From matched documents (extracted data)
  if (matchedDocs && matchedDocs.length > 0) {
    for (const doc of matchedDocs) {
      const extracted = doc.extracted || doc.parsed_metadata || {};
      const confidence = doc.parser_confidence || doc.match_confidence || 0.7;

      if (extracted.invoice_numbers?.length) availableFields['invoice_number'] = { present: true, confidence };
      if (extracted.invoice_number) availableFields['invoice_number'] = { present: true, confidence };
      if (extracted.dates?.length) availableFields['invoice_date'] = { present: true, confidence };
      if (extracted.invoice_date) availableFields['invoice_date'] = { present: true, confidence };
      if (extracted.supplier_name || doc.supplier) availableFields['supplier_name'] = { present: true, confidence };
      if (extracted.buyer_name) availableFields['buyer_name'] = { present: true, confidence };
      if (extracted.amounts?.length || extracted.total_amount) availableFields['total_amount'] = { present: true, confidence };
      if (extracted.unit_price) availableFields['unit_price'] = { present: true, confidence };
      if (extracted.quantity) availableFields['quantity'] = { present: true, confidence };
      if (extracted.currency) availableFields['currency'] = { present: true, confidence };
      if (extracted.tracking_numbers?.length) availableFields['tracking_number'] = { present: true, confidence };
      if (extracted.order_ids?.length) availableFields['order_id'] = { present: true, confidence };
      if (extracted.skus?.length) availableFields['sku'] = { present: true, confidence };
      if (extracted.asins?.length) availableFields['asin'] = { present: true, confidence };
      if (extracted.fnskus?.length) availableFields['fnsku'] = { present: true, confidence };
      if (extracted.vat_id) availableFields['vat_id'] = { present: true, confidence };
      if (extracted.po_number) availableFields['po_number'] = { present: true, confidence };
    }
  }

  // Check required and optional fields
  const fieldChecks: PolicyFieldCheck[] = [];
  const missingRequired: string[] = [];
  const missingOptional: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  for (const field of policy.required) {
    const fieldData = availableFields[field];
    const check: PolicyFieldCheck = {
      field,
      label: field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      required: true,
      present: !!fieldData?.present,
      confidence: fieldData?.confidence || 0
    };

    if (!check.present) {
      missingRequired.push(check.label);
      check.issue = 'Missing required field';
    } else if (check.confidence < 0.7) {
      warnings.push(`${check.label} has low confidence (${(check.confidence * 100).toFixed(0)}%)`);
      check.issue = 'Low confidence extraction';
    }

    fieldChecks.push(check);
  }

  // Check optional fields
  for (const field of policy.optional) {
    const fieldData = availableFields[field];
    const check: PolicyFieldCheck = {
      field,
      label: field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
      required: false,
      present: !!fieldData?.present,
      confidence: fieldData?.confidence || 0
    };

    if (!check.present) {
      missingOptional.push(check.label);
    }

    fieldChecks.push(check);
  }

  // Calculate quality score
  const requiredPresent = policy.required.filter(f => availableFields[f]?.present).length;
  const optionalPresent = policy.optional.filter(f => availableFields[f]?.present).length;
  const requiredRatio = policy.required.length > 0 ? requiredPresent / policy.required.length : 1;
  const optionalRatio = policy.optional.length > 0 ? optionalPresent / policy.optional.length : 1;

  // Score: 70% from required fields, 30% from optional
  const qualityScore = Math.round((requiredRatio * 70) + (optionalRatio * 30));

  // Determine quality tier
  let quality: 'strong' | 'medium' | 'weak';
  if (qualityScore >= 80 && missingRequired.length === 0) {
    quality = 'strong';
  } else if (qualityScore >= 50 || missingRequired.length <= 1) {
    quality = 'medium';
  } else {
    quality = 'weak';
  }

  // Generate recommendation
  let recommendation: 'file_now' | 'file_with_caution' | 'wait_for_better_docs';
  let recommendationText: string;

  if (quality === 'strong') {
    recommendation = 'file_now';
    recommendationText = 'Strong evidence. Meets FBA requirements.';
  } else if (quality === 'medium') {
    recommendation = 'file_with_caution';
    if (missingRequired.length > 0) {
      recommendationText = `Adequate evidence. Missing: ${missingRequired.join(', ')}.`;
    } else {
      recommendationText = 'Adequate evidence. Could be stronger.';
    }
  } else {
    recommendation = 'wait_for_better_docs';
    recommendationText = `Weak evidence. Missing: ${missingRequired.join(', ')}.`;
  }

  // Add policy-specific warnings
  if (claimType.includes('sourcing') && !availableFields['vat_id']?.present) {
    warnings.push('VAT/Tax ID recommended for sourcing cost claims');
  }
  if (claimType.includes('inbound') && !availableFields['tracking_number']?.present) {
    warnings.push('Tracking number strongly recommended for inbound shipment claims');
  }
  if ((claim.amount || 0) > 500 && !availableFields['invoice_number']?.present) {
    warnings.push('High-value claim ($500+) - invoice strongly recommended');
  }

  return {
    quality,
    qualityScore,
    recommendation,
    recommendationText,
    fieldChecks,
    missingRequired,
    missingOptional,
    warnings
  };
};

// Evidence Quality Badge Component - Institutional Banking Style
const EvidenceQualityBadge = ({ validation, claim, matchedDocs }: { validation: EvidenceValidation; claim?: RecoveryClaim; matchedDocs?: any[] }) => {
  // Get claim type for policy lookup
  const claimType = claim?.type || claim?.anomaly_type || 'default';
  const normalizedType = claimType.toLowerCase().replace(/[^a-z_:]/g, '');
  const policy = FBA_POLICY_REQUIREMENTS[normalizedType] || FBA_POLICY_REQUIREMENTS['default'];

  // Calculate which required fields are present
  const presentFields = validation.fieldChecks?.filter(f => f.present) || [];
  const presentFieldNames = presentFields.map(f => f.field);
  const requiredFields = policy.required || [];
  const optionalFields = policy.optional || [];

  // Count matched documents - use all possible sources
  const docCount = matchedDocs?.length || claim?.matchedDocs?.length || claim?.matchedCount || (claim as any)?._matchedCount || 0;

  // Calculate readiness percentage (required fields)
  const requiredPresent = requiredFields.filter(f => presentFieldNames.includes(f)).length;
  const readinessPercent = requiredFields.length > 0
    ? Math.round((requiredPresent / requiredFields.length) * 100)
    : (docCount > 0 ? 50 : 0);

  // Status configuration
  const statusConfig = {
    strong: { label: 'Ready', bgColor: 'bg-gray-100', textColor: 'text-gray-700', iconColor: 'text-gray-600' },
    medium: { label: 'Partial', bgColor: 'bg-gray-50', textColor: 'text-gray-600', iconColor: 'text-gray-400' },
    weak: { label: 'Required', bgColor: 'bg-gray-50', textColor: 'text-gray-500', iconColor: 'text-gray-400' }
  };
  const status = statusConfig[validation.quality];

  // Format field name for display
  const formatFieldName = (field: string) => {
    return field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  };

  return (
    <Tooltip>
      <TooltipTrigger>
        <Info className={`h-4 w-4 ${status.iconColor} cursor-pointer hover:opacity-70 transition-opacity`} />
      </TooltipTrigger>
      <TooltipContent
        side="right"
        align="start"
        className="w-72 p-0 bg-white border border-gray-200 shadow-lg rounded-none">
        {/* Header */}
        <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500">
              Evidence Status
            </span>
            <span className={`text-xs font-medium px-1.5 py-0.5 ${status.bgColor} ${status.textColor}`}>
              {status.label}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="px-3 py-2 space-y-3">
          {/* Required Documents */}
          <div>
            <div className="text-xs font-semibold text-gray-500 mb-1.5">
              Required Documents
            </div>
            <div className="space-y-1">
              {requiredFields.slice(0, 5).map((field, i) => {
                const isPresent = presentFieldNames.includes(field);
                return (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className={isPresent ? 'text-gray-700' : 'text-gray-400'}>
                      {isPresent ? '✓' : '—'}
                    </span>
                    <span className={isPresent ? 'text-gray-700' : 'text-gray-400'}>
                      {formatFieldName(field)}
                    </span>
                  </div>
                );
              })}
              {requiredFields.length > 5 && (
                <div className="text-xs text-gray-400 mt-1">
                  +{requiredFields.length - 5} more required
                </div>
              )}
            </div>
          </div>

          {/* Matched Documents - Always show */}
          <div className="pt-2 border-t border-gray-100">
            <div className="text-xs font-semibold text-gray-500 mb-1.5">
              Matched Documents ({docCount})
            </div>
            <div className="space-y-0.5">
              {docCount > 0 ? (
                (matchedDocs || claim?.matchedDocs || []).length > 0 ? (
                  <>
                    {(matchedDocs || claim?.matchedDocs || []).slice(0, 3).map((doc: any, i: number) => (
                      <div key={i} className="text-xs text-gray-600 truncate">
                        {doc.filename || doc.title || doc.name || `Document ${i + 1}`}
                      </div>
                    ))}
                    {docCount > 3 && (
                      <div className="text-xs text-gray-400">
                        +{docCount - 3} more documents
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-xs text-gray-500">
                    {docCount} linked document{docCount !== 1 ? 's' : ''} — click "Proof Documents" to view
                  </div>
                )
              ) : (
                <div className="text-xs text-gray-400">
                  No documents linked yet
                </div>
              )}
            </div>
          </div>

          {/* Readiness Bar */}
          <div className="pt-2 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500">Claim Readiness</span>
              <span className="text-gray-700 font-medium">{readinessPercent}%</span>
            </div>
            <div className="h-1 bg-gray-100 w-full">
              <div
                className="h-1 bg-gray-400 transition-all duration-300"
                style={{ width: `${readinessPercent}%` }}
              />
            </div>
          </div>

          {/* Notes */}
          {policy.notes && (
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-400 leading-relaxed">
                {policy.notes}
              </p>
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

// Historical win rates by claim type (based on platform data)
const claimWinRates: Record<string, number> = {
  // High success types (85%+)
  'lost_warehouse': 95,
  'lost:warehouse': 95,
  'damaged_warehouse': 92,
  'damaged:warehouse': 92,
  'inbound_shipment_lost': 90,
  'customer_return_unreturned': 88,
  'removal_order_missing': 85,
  // Medium success types (70-84%)
  'fba_fee_error': 78,
  'fbaweightbasedfee': 75,
  'fbaperunitfulfillmentfee': 72,
  'duplicate_charge': 70,
  // Lower success types (below 70%)
  'general_adjustment': 55,
  'fee_error': 50,
  'default': 60,
};

// Calculate claim strength score (0-100)
const calculateClaimStrength = (claim: RecoveryClaim): ClaimStrength => {
  const factors: ClaimStrength['factors'] = [];

  // Factor 1: Evidence Completeness (0-30 points)
  const matchedDocs = claim.matchedDocs?.length || claim.matchedCount || 0;
  const evidenceScore = Math.min(30, matchedDocs * 10);
  factors.push({
    label: 'Evidence',
    value: evidenceScore,
    max: 30,
    reason: matchedDocs >= 3 ? 'Strong documentation' : matchedDocs >= 1 ? 'Partial evidence' : 'No evidence yet'
  });

  // Factor 2: Policy Window (0-25 points) - 60-day Amazon window
  const claimDate = new Date(claim.discovery_date || claim.created || claim.created_at || Date.now());
  const daysOld = Math.floor((Date.now() - claimDate.getTime()) / (1000 * 60 * 60 * 24));
  const daysLeft = Math.max(0, 60 - daysOld);
  const policyScore = daysLeft > 45 ? 25 : daysLeft > 30 ? 20 : daysLeft > 14 ? 15 : daysLeft > 7 ? 10 : daysLeft > 0 ? 5 : 0;
  factors.push({
    label: 'Policy Window',
    value: policyScore,
    max: 25,
    reason: daysLeft > 45 ? `${daysLeft} days left` : daysLeft > 14 ? `${daysLeft} days remaining` : daysLeft > 0 ? `Urgent: ${daysLeft} days left!` : 'Window expired'
  });

  // Factor 3: Historical Win Rate by Type (0-25 points)
  const typeKey = (claim.anomaly_type || claim.type || '').toLowerCase().replace(/[:\-]/g, '_');
  const historicalRate = claimWinRates[typeKey] || claimWinRates.default;
  const historyScore = Math.round((historicalRate / 100) * 25);
  factors.push({
    label: 'Win Rate',
    value: historyScore,
    max: 25,
    reason: `${historicalRate}% success rate`
  });

  // Factor 4: AI Confidence Score (0-20 points)
  const confidence = typeof claim.confidence_score === 'number'
    ? claim.confidence_score
    : (typeof claim._confidence === 'number' ? claim._confidence : null);
  const confidenceScore = Math.round((confidence ?? 0) * 20);
  factors.push({
    label: 'AI Confidence',
    value: confidenceScore,
    max: 20,
    reason: confidence === null
      ? 'No AI confidence available'
      : confidence >= 0.85 ? 'High certainty' : confidence >= 0.6 ? 'Moderate certainty' : 'Low certainty'
  });

  const totalScore = factors.reduce((sum, f) => sum + f.value, 0);
  const tier: ClaimStrength['tier'] = totalScore >= 75 ? 'high' : totalScore >= 45 ? 'medium' : 'low';

  return { score: totalScore, tier, factors };
};

// Strength Badge Component
const StrengthBadge = ({ strength, showScore = true }: { strength: ClaimStrength; showScore?: boolean }) => {
  const config = {
    high: { bg: 'bg-gray-100', text: 'text-[#36454F]', border: 'border-gray-400', icon: '●', label: 'Strong' },
    medium: { bg: 'bg-gray-100', text: 'text-[#36454F]', border: 'border-gray-400', icon: '●', label: 'Medium' },
    low: { bg: 'bg-gray-100', text: 'text-[#36454F]', border: 'border-gray-400', icon: '●', label: 'Weak' }
  };
  const c = config[strength.tier];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium ${c.bg} ${c.text} ${c.border}`}>
      {showScore ? `${strength.score}/100` : c.label}
    </span>
  );
};

// Double-Dip Guard: Cross-Claim Reconciliation
interface DuplicateWarning {
  isDuplicate: boolean;
  reason: 'prior_reimbursement' | 'inventory_adjustment' | 'already_filed' | 'reconciled';
  message: string;
  adjustedAmount?: number;
  originalAmount?: number;
  priorCaseId?: string;
}

// Check for duplicate claims across inventory adjustments, prior reimbursements
const checkDoubleDip = (claim: RecoveryClaim, allClaims: RecoveryClaim[]): DuplicateWarning | null => {
  const sku = claim.sku?.toLowerCase();
  const asin = claim.asin?.toLowerCase();
  const claimType = (claim.anomaly_type || claim.type || '').toLowerCase();
  const claimDate = new Date(claim.discovery_date || claim.created || claim.created_at || Date.now());
  const periodStart = new Date(claimDate.getTime() - 30 * 24 * 60 * 60 * 1000); // 30-day window
  const periodEnd = new Date(claimDate.getTime() + 30 * 24 * 60 * 60 * 1000);

  // Skip if no SKU/ASIN to match
  if (!sku && !asin) return null;

  // Check against other claims
  for (const other of allClaims) {
    if (other.id === claim.id) continue;

    const otherSku = other.sku?.toLowerCase();
    const otherAsin = other.asin?.toLowerCase();
    const otherType = (other.anomaly_type || other.type || '').toLowerCase();
    const otherDate = new Date(other.discovery_date || other.created || other.created_at || Date.now());
    const otherStatus = (other.status || '').toLowerCase();

    // Check if same SKU/ASIN and similar time period
    const skuMatch = sku && otherSku && sku === otherSku;
    const asinMatch = asin && otherAsin && asin === otherAsin;
    const typeMatch = claimType === otherType;
    const inPeriod = otherDate >= periodStart && otherDate <= periodEnd;

    if ((skuMatch || asinMatch) && typeMatch && inPeriod) {
      // Already paid/approved = prior reimbursement
      if (['paid', 'approved', 'reconciled', 'paid_out', 'reimbursed'].includes(otherStatus)) {
        return {
          isDuplicate: true,
          reason: 'prior_reimbursement',
          message: `Prior reimbursement found for ${sku || asin} in this period. Claim auto-adjusted to protect your account.`,
          priorCaseId: other.id,
          originalAmount: claim.guaranteedAmount || claim.amount,
          adjustedAmount: 0
        };
      }
      // Already submitted = already filed
      if (['submitted', 'under review', 'pending', 'in_progress'].includes(otherStatus)) {
        return {
          isDuplicate: true,
          reason: 'already_filed',
          message: `This issue was already filed (Case ${other.claim_number || other.id.slice(0, 8)}). Duplicate claim blocked.`,
          priorCaseId: other.id
        };
      }
    }
  }

  // Check if claim itself was reconciled (inventory adjustment already processed)
  if (claim.recovery_status === 'reconciled' || claim.inventory_adjustment_applied) {
    return {
      isDuplicate: true,
      reason: 'inventory_adjustment',
      message: 'Amazon already processed an inventory adjustment for this issue.',
      originalAmount: claim.guaranteedAmount || claim.amount,
      adjustedAmount: 0
    };
  }

  return null;
};

// Double-Dip Guard Badge Component
const DoubleDipBadge = ({ warning }: { warning: DuplicateWarning }) => {
  const config = {
    prior_reimbursement: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200', icon: '✓', label: 'Prior Reimbursement' },
    inventory_adjustment: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200', icon: '≡', label: 'Adjusted' },
    already_filed: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300', icon: '', label: 'Duplicate Filed' },
    reconciled: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', icon: '✓', label: 'Reconciled' }
  };
  const c = config[warning.reason];

  return (
    <Tooltip>
      <TooltipTrigger>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-sans font-bold ${c.bg} ${c.text} ${c.border} uppercase tracking-tight`}>
          {c.icon && <span>{c.icon}</span>}
          {c.label}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs bg-white text-gray-900 border border-gray-200 p-3">
        <div className="space-y-1">
          <div className="font-semibold text-sm">🛡️ Account Protection</div>
          <p className="text-xs text-gray-600">{warning.message}</p>
          {warning.priorCaseId && (
            <p className="text-xs text-gray-500">Prior Case: {warning.priorCaseId.slice(0, 12)}...</p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

// Generate Casebook PDF for export (audits, CFOs, legal) - Institutional Banking Style
const generateCasebookPDF = (claims: RecoveryClaim[], dateRange: { from: Date; to: Date } | null) => {
  const periodLabel = dateRange
    ? `${format(dateRange.from, 'MMM dd, yyyy')} - ${format(dateRange.to, 'MMM dd, yyyy')}`
    : 'All Time';

  // Calculate summary metrics
  const totalClaims = claims.length;
  const totalValue = claims.reduce((sum, c) => sum + (c.guaranteedAmount || c.amount || 0), 0);
  const approvedClaims = claims.filter(c => ['paid', 'approved', 'reconciled', 'paid_out'].includes((c.status || '').toLowerCase()));
  const recoveredValue = approvedClaims.reduce((sum, c) => sum + (c.guaranteedAmount || c.amount || 0), 0);
  const pendingClaims = claims.filter(c => ['submitted', 'pending', 'under review'].includes((c.status || '').toLowerCase()));
  const deniedClaims = claims.filter(c => ['denied', 'rejected'].includes((c.status || '').toLowerCase()));
  const successRate = totalClaims > 0 ? ((approvedClaims.length / totalClaims) * 100).toFixed(1) : '0';

  // Group by claim type
  const byType: Record<string, RecoveryClaim[]> = {};
  claims.forEach(c => {
    const type = c.anomaly_type || c.type || 'Other';
    if (!byType[type]) byType[type] = [];
    byType[type].push(c);
  });

  const casebookHTML = `
<!DOCTYPE html>
<html>
<head>
  <title>Recovery Statement - ${periodLabel}</title>
  <style>
    @page { size: A4; margin: 20mm; }
    * { box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      color: #1e293b;
      line-height: 1.4;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 30px;
      background: #fff;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 18px;
      font-weight: 600;
      color: #0f172a;
      letter-spacing: -0.5px;
    }
    .logo-sub {
      font-size: 10px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin-top: 2px;
    }
    .header-right {
      text-align: right;
    }
    .period {
      font-size: 11px;
      color: #475569;
    }
    .generated {
      font-size: 9px;
      color: #94a3b8;
      margin-top: 2px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1px;
      background: #e2e8f0;
      border: 1px solid #e2e8f0;
      margin-bottom: 30px;
    }
    .summary-card {
      background: #f8fafc;
      padding: 16px 12px;
      text-align: center;
    }
    .summary-value {
      font-size: 18px;
      font-weight: 600;
      color: #0f172a;
      font-variant-numeric: tabular-nums;
    }
    .summary-label {
      font-size: 9px;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-top: 4px;
    }
    .section {
      margin-bottom: 25px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 9px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }
    .data-table th {
      text-align: left;
      font-size: 8px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 8px 10px;
      border-bottom: 1px solid #e2e8f0;
      background: #f8fafc;
    }
    .data-table td {
      padding: 8px 10px;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
    }
    .data-table tr:hover { background: #f8fafc; }
    .data-table .mono {
      font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
      font-size: 9px;
    }
    .data-table .amount {
      text-align: right;
      font-variant-numeric: tabular-nums;
      font-weight: 500;
    }
    .status-badge {
      display: inline-block;
      padding: 2px 8px;
      font-size: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: #f1f5f9;
      color: #475569;
      border: 1px solid #e2e8f0;
    }
    .status-approved { background: #f0fdf4; color: #166534; border-color: #bbf7d0; }
    .status-pending { background: #fefce8; color: #854d0e; border-color: #fef08a; }
    .status-denied { background: #fef2f2; color: #991b1b; border-color: #fecaca; }
    .summary-row {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #f1f5f9;
      font-size: 11px;
    }
    .summary-row:last-child { border-bottom: none; }
    .summary-row .label { color: #64748b; }
    .summary-row .value { font-weight: 500; color: #0f172a; }
    .footer {
      text-align: center;
      padding-top: 30px;
      margin-top: 30px;
      border-top: 1px solid #e2e8f0;
      font-size: 9px;
      color: #94a3b8;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">MARGIN</div>
      <div class="logo-sub">Recovery Statement</div>
    </div>
    <div class="header-right">
      <div class="period">${periodLabel}</div>
      <div class="generated">Generated ${format(new Date(), 'MMMM dd, yyyy')}</div>
    </div>
  </div>

  <div class="summary-grid">
    <div class="summary-card">
      <div class="summary-value">${totalClaims}</div>
      <div class="summary-label">Total Claims</div>
    </div>
    <div class="summary-card">
      <div class="summary-value">$${recoveredValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
      <div class="summary-label">Recovered</div>
    </div>
    <div class="summary-card">
      <div class="summary-value">${pendingClaims.length}</div>
      <div class="summary-label">Pending</div>
    </div>
    <div class="summary-card">
      <div class="summary-value">${successRate}%</div>
      <div class="summary-label">Success Rate</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Status Summary</div>
    <div class="summary-row">
      <span class="label">Approved / Paid</span>
      <span class="value">${approvedClaims.length} claims — $${recoveredValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
    </div>
    <div class="summary-row">
      <span class="label">Pending Review</span>
      <span class="value">${pendingClaims.length} claims — $${pendingClaims.reduce((s, c) => s + (c.guaranteedAmount || c.amount || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
    </div>
    <div class="summary-row">
      <span class="label">Denied</span>
      <span class="value">${deniedClaims.length} claims — $${deniedClaims.reduce((s, c) => s + (c.guaranteedAmount || c.amount || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">Claims by Type</div>
    ${Object.entries(byType).map(([type, typeClaims]) => `
      <div class="summary-row">
        <span class="label">${type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
        <span class="value">${typeClaims.length} claims — $${typeClaims.reduce((s, c) => s + (c.guaranteedAmount || c.amount || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
      </div>
    `).join('')}
  </div>

  <div class="section">
    <div class="section-title">Claim Ledger</div>
    <table class="data-table">
      <thead>
        <tr>
          <th>Claim ID</th>
          <th>Type</th>
          <th>SKU</th>
          <th>Status</th>
          <th style="text-align: right;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${claims.map(c => {
    const status = (c.status || 'unknown').toLowerCase();
    const statusClass = ['paid', 'approved', 'reconciled'].includes(status) ? 'status-approved'
      : ['submitted', 'pending', 'under review'].includes(status) ? 'status-pending'
        : ['denied', 'rejected'].includes(status) ? 'status-denied' : '';
    return `
        <tr>
          <td class="mono">${c.claim_number || c.id.slice(0, 12)}</td>
          <td>${c.anomaly_type?.replace(/_/g, ' ') || c.type || '—'}</td>
          <td class="mono">${c.sku || '—'}</td>
          <td><span class="status-badge ${statusClass}">${c.status || 'Unknown'}</span></td>
          <td class="amount">$${(c.guaranteedAmount || c.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        </tr>`;
  }).join('')}
      </tbody>
    </table>
  </div>

  <div class="footer">
    <p>Margin Recovery Platform — Confidential</p>
    <p>For audit and accounting purposes only</p>
    <p class="no-print" style="margin-top: 12px; color: #64748b;"><strong>Press Ctrl+P (Cmd+P) to save as PDF</strong></p>
  </div>
</body>
</html>`;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(casebookHTML);
    printWindow.document.close();
  }
};

// Amazon Financial Event Types - Comprehensive List
const amazonEventCategories = {
  // Core Transaction Groups
  coreTransactions: [
    { id: 'ShipmentEvent', name: 'Shipment Event', description: 'Income/fees from selling an item' },
    { id: 'RefundEvent', name: 'Refund Event', description: 'Money returned to customers + fee clawbacks' },
    { id: 'GuaranteeClaimEvent', name: 'A-to-z Guarantee Claim', description: 'A-to-z claims' },
    { id: 'ChargebackEvent', name: 'Chargeback Event', description: 'Credit card chargebacks' },
    { id: 'AdjustmentEvent', name: 'Adjustment Event', description: 'FBA reimbursements and reversals' },
    { id: 'ServiceFeeEvent', name: 'Service Fee Event', description: 'Subscription, storage, and label fees' },
    { id: 'DebtRecoveryEvent', name: 'Debt Recovery Event', description: 'Amazon pulling money from your bank/card' },
    { id: 'SafeTReimbursementEvent', name: 'SAFE-T Reimbursement', description: 'SAFE-T claims (seller protection payouts)' },
  ],
  // FBA Fulfillment & Delivery Fees
  fbaFulfillment: [
    { id: 'FBAPerUnitFulfillmentFee', name: 'FBA Per Unit Fulfillment Fee', description: 'Pick & pack' },
    { id: 'FBAPerOrderFulfillmentFee', name: 'FBA Per Order Fee', description: 'Per order fee' },
    { id: 'FBAWeightBasedFee', name: 'FBA Weight Based Fee', description: 'Weight-based shipping' },
    { id: 'FBATransportationFee', name: 'FBA Transportation Fee', description: 'Inbound shipping to FBA' },
    { id: 'FBAInboundDefectFee', name: 'FBA Inbound Defect Fee', description: 'Problem with your shipment' },
    { id: 'FBAInboundConvenienceFee', name: 'FBA Inbound Convenience Fee', description: 'Prep service' },
    { id: 'FulfillmentNetworkFee', name: 'Fulfillment Network Fee', description: 'Export/Cross-border' },
  ],
  // Storage Fees
  storageFees: [
    { id: 'FBAStorageFee', name: 'FBA Storage Fee', description: 'Monthly storage' },
    { id: 'FBALongTermStorageFee', name: 'FBA Long Term Storage Fee', description: 'Aged inventory>180/365 days' },
    { id: 'FBAInventoryStorageOverageFee', name: 'FBA Storage Overage Fee', description: 'Exceeding storage limits' },
    { id: 'FBAExtraLargeStorageFee', name: 'FBA Extra Large Storage Fee', description: 'Oversize items' },
  ],
  // Inventory Management Fees
  inventoryManagement: [
    { id: 'FBARemovalFee', name: 'FBA Removal Fee', description: 'Return to seller' },
    { id: 'FBADisposalFee', name: 'FBA Disposal Fee', description: 'Destroy inventory' },
    { id: 'FBALiquidationFee', name: 'FBA Liquidation Fee', description: 'Liquidate inventory' },
    { id: 'FBAReturnProcessingFee', name: 'FBA Return Processing Fee', description: 'Free returns category fee' },
    { id: 'FBAUnplannedPrepFee', name: 'FBA Unplanned Prep Fee', description: 'Missing label/bubble wrap' },
  ],
  // Selling & Listing Fees
  sellingFees: [
    { id: 'Commission', name: 'Referral Fee', description: 'Commission on sales' },
    { id: 'FixedClosingFee', name: 'Fixed Closing Fee', description: 'Per item fee' },
    { id: 'VariableClosingFee', name: 'Variable Closing Fee', description: 'Media categories' },
    { id: 'HighVolumeListingFee', name: 'High Volume Listing Fee', description: 'Excess listings' },
    { id: 'RefundCommission', name: 'Refund Commission', description: 'Amazon keeps 20% on refunds' },
  ],
  // Adjustment Types (Lost & Found)
  adjustmentTypes: [
    { id: 'FBAInventoryReimbursement', name: 'FBA Inventory Reimbursement', description: 'General reimbursement' },
    { id: 'FBAInventoryReimbursementReversal', name: 'Reimbursement Reversal', description: 'Paid then taken back' },
    { id: 'WarehousingError', name: 'Warehousing Error', description: 'Lost/broke in warehouse' },
    { id: 'Lost:Warehouse', name: 'Lost: Warehouse', description: 'Lost in warehouse' },
    { id: 'Damaged:Warehouse', name: 'Damaged: Warehouse', description: 'Damaged in warehouse' },
    { id: 'Lost:Inbound', name: 'Lost: Inbound', description: 'Lost during inbound' },
    { id: 'Damaged:Inbound', name: 'Damaged: Inbound', description: 'Damaged during inbound' },
    { id: 'CarrierClaim', name: 'Carrier Claim', description: 'Lost by UPS/FedEx' },
    { id: 'CustomerReturn', name: 'Customer Return', description: 'Item returned to FBA' },
    { id: 'CustomerServiceIssue', name: 'Customer Service Issue', description: 'Goodwill concession' },
    { id: 'GeneralAdjustment', name: 'General Adjustment', description: 'Mystery bucket - audit these' },
  ],
  // Advertising & Marketing
  advertising: [
    { id: 'RunLightningDealFee', name: 'Lightning Deal Fee', description: 'Deal promotion fee' },
    { id: 'CouponClipFee', name: 'Coupon Clip Fee', description: 'Per coupon clip' },
    { id: 'CouponRedemptionFee', name: 'Coupon Redemption Fee', description: 'Coupon used' },
    { id: 'VineEnrollmentFee', name: 'Vine Enrollment Fee', description: 'Vine program' },
    { id: 'ProductAdsPaymentEvent', name: 'Product Ads Payment', description: 'Sponsored Products/Brands' },
  ],
};

// Flatten all event types for dropdown (sorted by category)
const allEventTypes = [
  ...amazonEventCategories.coreTransactions,
  ...amazonEventCategories.fbaFulfillment,
  ...amazonEventCategories.storageFees,
  ...amazonEventCategories.inventoryManagement,
  ...amazonEventCategories.sellingFees,
  ...amazonEventCategories.adjustmentTypes,
  ...amazonEventCategories.advertising,
];

// Legacy claimTypes for backward compatibility
const claimTypes = allEventTypes.map(e => e.name);
const statusOptions = ['New', 'Pending', 'Submitted', 'Paid', 'Denied'];

// Comprehensive mapping for all 64 Amazon detection types -> human-readable names
// Keys are lowercase with colons/dashes replaced by underscores (to match getTypeDisplay transformation)
const detectionTypeNames: Record<string, { name: string; category: string; icon?: string }> = {
  // === BATCH 1: Core Reimbursement Events (12 types) ===
  'lost_warehouse': { name: 'Lost in Warehouse', category: 'Reimbursement', icon: '📦' },
  'damaged_warehouse': { name: 'Damaged in Warehouse', category: 'Reimbursement', icon: '💔' },
  'lost_inbound': { name: 'Lost at Inbound', category: 'Reimbursement', icon: '🚚' },
  'damaged_inbound': { name: 'Damaged at Inbound', category: 'Reimbursement', icon: '📬' },
  'carrierclaim': { name: 'Carrier Claim', category: 'Reimbursement', icon: '🛡️' },
  'customerreturn': { name: 'Customer Return', category: 'Reimbursement', icon: '↩️' },
  'fbainventoryreimbursementreversal': { name: 'Reimbursement Reversal', category: 'Reimbursement', icon: '🔄' },
  'reimbursementreversal': { name: 'Reimbursement Reversal', category: 'Reimbursement', icon: '🔄' },
  'warehousingerror': { name: 'Warehousing Error', category: 'Reimbursement', icon: '🏭' },
  'customerserviceissue': { name: 'Customer Service Issue', category: 'Reimbursement', icon: '🎧' },
  'generaladjustment': { name: 'General Adjustment', category: 'Reimbursement', icon: '⚙️' },
  'fbainventoryreimbursement': { name: 'FBA Inventory Reimbursement', category: 'Reimbursement', icon: '💰' },

  // === BATCH 2: Fee Overcharges (10 types) ===
  'fbaweightbasedfee': { name: 'Weight-Based Fee', category: 'Fee', icon: '⚖️' },
  'fbaperunitfulfillmentfee': { name: 'Per-Unit Fulfillment Fee', category: 'Fee', icon: '📦' },
  'fbaperorderfulfillmentfee': { name: 'Per-Order Fulfillment Fee', category: 'Fee', icon: '🛒' },
  'fbatransportationfee': { name: 'Transportation Fee', category: 'Fee', icon: '🚛' },
  'fbainbounddefectfee': { name: 'Inbound Defect Fee', category: 'Fee', icon: '⚠️' },
  'fbainboundconveniencefee': { name: 'Inbound Convenience Fee', category: 'Fee', icon: '🎁' },
  'fulfillmentnetworkfee': { name: 'Fulfillment Network Fee', category: 'Fee', icon: '🌐' },
  'commission': { name: 'Commission', category: 'Fee', icon: '💳' },
  'fixedclosingfee': { name: 'Fixed Closing Fee', category: 'Fee', icon: '🔐' },
  'variableclosingfee': { name: 'Variable Closing Fee', category: 'Fee', icon: '📊' },

  // === BATCH 3: Storage & Inventory Fees (9 types) ===
  'fbastoragefee': { name: 'Storage Fee', category: 'Storage', icon: '🏢' },
  'fbalongtermstoragefee': { name: 'Long-Term Storage Fee', category: 'Storage', icon: '📅' },
  'fbainventorystorageoveragefee': { name: 'Storage Overage Fee', category: 'Storage', icon: '📈' },
  'fbaextralargestoragefee': { name: 'Extra Large Storage Fee', category: 'Storage', icon: '📦' },
  'fbaremovalfee': { name: 'Removal Fee', category: 'Storage', icon: '🚪' },
  'fbadisposalfee': { name: 'Disposal Fee', category: 'Storage', icon: '🗑️' },
  'fbaliquidationfee': { name: 'Liquidation Fee', category: 'Storage', icon: '💧' },
  'fbareturnprocessingfee': { name: 'Return Processing Fee', category: 'Storage', icon: '↩️' },
  'fbaunplannedprepfee': { name: 'Unplanned Prep Fee', category: 'Storage', icon: '🎁' },

  // === BATCH 4: Refunds & Returns (9 types) ===
  'refundevent': { name: 'Refund Event', category: 'Refund', icon: '💸' },
  'refundcommission': { name: 'Refund Commission', category: 'Refund', icon: '💳' },
  'restockingfee': { name: 'Restocking Fee', category: 'Refund', icon: '📦' },
  'giftwraptax': { name: 'Gift Wrap Tax', category: 'Refund', icon: '🎁' },
  'shippingtax': { name: 'Shipping Tax', category: 'Refund', icon: '🚛' },
  'goodwill': { name: 'Goodwill', category: 'Refund', icon: '❤️' },
  'retrochargeevent': { name: 'Retrocharge', category: 'Refund', icon: '⏪' },
  'highvolumelistingfee': { name: 'High Volume Listing Fee', category: 'Refund', icon: '📋' },
  'serviceprovidercreditevent': { name: 'Service Provider Credit', category: 'Refund', icon: '🏷️' },

  // === BATCH 5: Claims & Chargebacks (9 types) ===
  'guaranteeclaimevent': { name: 'A-to-Z Guarantee Claim', category: 'Claim', icon: '🛡️' },
  'chargebackevent': { name: 'Chargeback', category: 'Claim', icon: '💳' },
  'safetreimbursementevent': { name: 'SAFE-T Reimbursement', category: 'Claim', icon: '🔒' },
  'debtrecoveryevent': { name: 'Debt Recovery', category: 'Claim', icon: '💰' },
  'loanservicingevent': { name: 'Loan Servicing', category: 'Claim', icon: '🏦' },
  'paywithamazonevent': { name: 'Pay with Amazon', category: 'Claim', icon: '🛒' },
  'rentaltransactionevent': { name: 'Rental Transaction', category: 'Claim', icon: '📅' },
  'fbaliquidationevent': { name: 'FBA Liquidation', category: 'Claim', icon: '💧' },
  'taxwithholdingevent': { name: 'Tax Withholding', category: 'Claim', icon: '🏛️' },

  // === BATCH 6: Advertising & Other (11 types) ===
  'productadspaymentevent': { name: 'Product Ads Payment', category: 'Advertising', icon: '📢' },
  'servicefeeevent': { name: 'Service Fee', category: 'Advertising', icon: '🔧' },
  'sellerdealpaymentevent': { name: 'Seller Deal Payment', category: 'Advertising', icon: '🏷️' },
  'couponpaymentevent': { name: 'Coupon Payment', category: 'Advertising', icon: '🎫' },
  'couponredemptionfee': { name: 'Coupon Redemption Fee', category: 'Advertising', icon: '🎟️' },
  'runlightningdealfee': { name: 'Lightning Deal Fee', category: 'Advertising', icon: '⚡' },
  'vineenrollmentfee': { name: 'Vine Enrollment Fee', category: 'Advertising', icon: '🍇' },
  'imagingservicesfeeevent': { name: 'Imaging Services Fee', category: 'Advertising', icon: '📷' },
  'earlyreviewerprogramfee': { name: 'Early Reviewer Program Fee', category: 'Advertising', icon: '⭐' },
  'couponclipfee': { name: 'Coupon Clip Fee', category: 'Advertising', icon: '✂️' },
  'sellerreviewenrollmentpaymentevent': { name: 'Seller Review Enrollment', category: 'Advertising', icon: '📝' },

  // === Tax Collection at Source - International (3 types) ===
  'tcs_cgst': { name: 'TCS-CGST (Central)', category: 'Tax', icon: '🇮🇳' },
  'tcs_sgst': { name: 'TCS-SGST (State)', category: 'Tax', icon: '🇮🇳' },
  'tcs_igst': { name: 'TCS-IGST (Integrated)', category: 'Tax', icon: '🇮🇳' },

  // === Legacy/fallback types ===
  'missing_unit': { name: 'Missing Unit', category: 'Reimbursement', icon: '❓' },
  'overcharge': { name: 'Overcharge', category: 'Fee', icon: '💸' },
  'damaged_stock': { name: 'Damaged Stock', category: 'Reimbursement', icon: '💔' },
  'incorrect_fee': { name: 'Incorrect Fee', category: 'Fee', icon: '❌' },
  'duplicate_charge': { name: 'Duplicate Charge', category: 'Fee', icon: '2️⃣' },
  'adjustment_reimbursement': { name: 'Adjustment', category: 'Reimbursement', icon: '⚙️' },
  'liquidation_reimbursement': { name: 'Liquidation', category: 'Reimbursement', icon: '💧' },
  'fee_error': { name: 'Fee Error', category: 'Fee', icon: '⚠️' },
  'inventory_loss': { name: 'Inventory Loss', category: 'Reimbursement', icon: '📦' },
  'return_discrepancy': { name: 'Return Discrepancy', category: 'Refund', icon: '↩️' },
};

// Helper function to get human-readable type name
const getTypeDisplay = (type: string | undefined, anomalyType?: string): { name: string; category: string; icon: string } => {
  // Try anomaly_type first (from detection), then type
  const lookupKey = anomalyType || type || '';
  const lower = lookupKey.toLowerCase().replace(/[:\-]/g, '_');

  // Check direct match
  if (detectionTypeNames[lower]) {
    return { ...detectionTypeNames[lower], icon: detectionTypeNames[lower].icon || '📋' };
  }

  // Check if it matches an allEventTypes entry
  const eventMatch = allEventTypes.find(e =>
    e.id.toLowerCase() === lookupKey.toLowerCase() ||
    e.name.toLowerCase() === lookupKey.toLowerCase()
  );
  if (eventMatch) {
    return { name: eventMatch.name, category: 'Amazon Event', icon: '📦' };
  }

  // Format unknown types nicely
  const formatted = lookupKey
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .split(' ')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
    .trim();

  return { name: formatted || 'Unknown', category: 'Other', icon: '📋' };
};


export default function Recoveries() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();
  const { isReady } = useTenant();
  const activeSlug = tenantSlug;
  const navigate = useNavigate();
  if (!activeSlug && isReady) {
    throw new Error("tenantSlug required for Recoveries");
  }
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClaimTypes, setSelectedClaimTypes] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [quickDateRange, setQuickDateRangeState] = useState('30days');
  const [activeTab, setActiveTab] = useState<'claims' | 'matching' | 'cases'>('claims');
  const [filterSource, setFilterSource] = useState('all');
  const [filterConfidence, setFilterConfidence] = useState('all');
  const [filterUrgent, setFilterUrgent] = useState('all');
  const [showRiskyClaims, setShowRiskyClaims] = useState(true);
  const [showParkedOnly, setShowParkedOnly] = useState(false);
  const [claimToFile, setClaimToFile] = useState<RecoveryClaim | null>(null);
  const [fileAnywayModalOpen, setFileAnywayModalOpen] = useState(false);
  const [claims, setClaims] = useState<RecoveryClaim[]>([]);
  const [metricsLoaded, setMetricsLoaded] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<{ totalClaimsFound: number; inProgress: number; valueInProgress: number; successRate30d: number } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const loadData = useCallback(() => setRefreshTrigger(prev => prev + 1), []);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [submittingBulk, setSubmittingBulk] = useState(false);
  const { toast } = useToast();
  const [autoSubmitHigh, setAutoSubmitHigh] = useState(false);
  const [smartPromptOpen, setSmartPromptOpen] = useState(false);

  const [promptClaim, setPromptClaim] = useState<any | null>(null);
  const autoSubmittedRef = useRef<Set<string>>(new Set());

  // Phase 3: Detection results integration
  const [detectionResults, setDetectionResults] = useState<any[]>([]);
  const [mergedRecoveries, setMergedRecoveries] = useState<any[] | null>(null); // null means not initialized yet


  // Phase 3: Detection statistics and urgent claims
  const [detectionStats, setDetectionStats] = useState<any>(null);

  const resolveClaimFilingTruth = useCallback(async (claimOrId: RecoveryClaim | string) => {
    const claimId = typeof claimOrId === 'string' ? claimOrId : claimOrId?.id;
    const fallback = typeof claimOrId === 'string' ? null : claimOrId;

    if (!claimId) {
      return {
        claimId: '',
        linkedDisputeId: null,
        blockedReason: 'Missing recovery id.'
      };
    }

    if (!activeSlug) {
      return {
        claimId,
        linkedDisputeId: null,
        blockedReason: 'Tenant context is required before filing can proceed.'
      };
    }

    const detailResponse = await api.getRecoveryDetail(claimId, activeSlug).catch(() => null);
    const detail = detailResponse?.ok ? (detailResponse.data as any) : fallback;
    const linkedDisputeId = detail?.linked_dispute_case_id || detail?.dispute_case_id || null;
    const blockedReason = Array.isArray(detail?.block_reasons) && detail.block_reasons.length
      ? detail.block_reasons.join(', ')
      : (detail?.last_error || 'No linked dispute case exists for this recovery yet.');

    return {
      claimId,
      linkedDisputeId,
      blockedReason
    };
  }, [activeSlug]);

  const openCanonicalFilingQueue = useCallback((disputeId: string, sourceRecoveryId: string, intent: 'submit' | 'resubmit') => {
    if (!activeSlug) return;
    toast({
      title: intent === 'resubmit' ? 'Use Dispute Cases to retry filing' : 'Use Dispute Cases to file',
      description: `Opening the canonical Agent 7 queue for dispute case ${disputeId}.`
    });
    navigate(tenantRoute(activeSlug, '/dispute-cases'), {
      state: {
        highlightDisputeId: disputeId,
        sourceRecoveryId
      }
    });
  }, [activeSlug, navigate, toast]);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [statusUpdateModalOpen, setStatusUpdateModalOpen] = useState(false);
  const [selectedDetection, setSelectedDetection] = useState<any | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const [resolveAmount, setResolveAmount] = useState('');
  const [statusUpdateNotes, setStatusUpdateNotes] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('pending');
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detectionDetails, setDetectionDetails] = useState<any | null>(null);
  const [evidencePackOpen, setEvidencePackOpen] = useState(false);
  const [evidencePackClaim, setEvidencePackClaim] = useState<RecoveryClaim | null>(null);
  const [proofDocsModalOpen, setProofDocsModalOpen] = useState(false);

  const [proofDocsClaim, setProofDocsClaim] = useState<RecoveryClaim | null>(null);
  const [proofDocs, setProofDocs] = useState<any[]>([]);
  const [markAllReadModalOpen, setMarkAllReadModalOpen] = useState(false);

  // Read search query from URL on mount and when URL changes
  useEffect(() => {
    const queryParam = searchParams.get('q');
    if (queryParam) {
      setSearchTerm(queryParam);
    }
  }, [searchParams]);

  // Ref for cleanup/unmount tracking
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  // Table drag-to-scroll functionality
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef<boolean>(false);
  const hasDraggedRef = useRef<boolean>(false);
  const startXRef = useRef<number>(0);
  const scrollLeftRef = useRef<number>(0);
  const [isDragging, setIsDragging] = useState(false);

  // Handle mouse down for drag scrolling
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!tableScrollRef.current) return;
    const target = e.target as HTMLElement;
    // Don't start dragging if clicking on interactive elements
    if (target.closest('button, a, input, select, [role="checkbox"], [role="menuitem"], .dropdown-menu, [role="dialog"]')) {
      return;
    }
    // Initialize drag state (but don't prevent default yet - wait for actual drag)
    isDraggingRef.current = false;
    hasDraggedRef.current = false;
    const rect = tableScrollRef.current.getBoundingClientRect();
    startXRef.current = e.pageX - rect.left;
    scrollLeftRef.current = tableScrollRef.current.scrollLeft;
  }, []);

  // Handle mouse up to stop dragging
  const handleMouseUp = useCallback(() => {
    if (!tableScrollRef.current) return;
    // Only prevent click if we actually dragged
    if (hasDraggedRef.current) {
      // Prevent click event if we dragged
      setTimeout(() => {
        hasDraggedRef.current = false;
      }, 100);
    }
    isDraggingRef.current = false;
    setIsDragging(false);
    if (tableScrollRef.current) {
      tableScrollRef.current.style.cursor = 'grab';
    }
  }, []);

  // Handle mouse leave to stop dragging
  const handleMouseLeave = useCallback(() => {
    if (!tableScrollRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    hasDraggedRef.current = false;
    if (tableScrollRef.current) {
      tableScrollRef.current.style.cursor = 'grab';
    }
  }, []);

  // Global mouse handlers for drag scrolling (works even if mouse leaves the table)
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (!tableScrollRef.current) return;

      // Check if we should start dragging (after mouse moved a bit)
      if (!isDraggingRef.current && startXRef.current !== 0) {
        const rect = tableScrollRef.current.getBoundingClientRect();
        const x = e.pageX - rect.left;
        const deltaX = Math.abs(x - startXRef.current);

        // Start dragging only if mouse moved more than 5 pixels (drag threshold)
        if (deltaX > 5) {
          isDraggingRef.current = true;
          setIsDragging(true);
          hasDraggedRef.current = true;
          document.body.style.cursor = 'grabbing';
          document.body.style.userSelect = 'none';
        }
      }

      // Perform scrolling if dragging
      if (isDraggingRef.current && tableScrollRef.current) {
        e.preventDefault();
        const rect = tableScrollRef.current.getBoundingClientRect();
        const x = e.pageX - rect.left;
        const walk = (x - startXRef.current) * 2; // Scroll speed multiplier
        tableScrollRef.current.scrollLeft = scrollLeftRef.current - walk;
      }
    };

    const handleGlobalMouseUp = () => {
      if (isDraggingRef.current && tableScrollRef.current) {
        isDraggingRef.current = false;
        setIsDragging(false);
        tableScrollRef.current.style.cursor = 'grab';
      }
      startXRef.current = 0;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, []);

  // Amazon recoveries integration (from DASHBOARD_CLAIMS_INTEGRATION.md)
  const [recoveredTotal, setRecoveredTotal] = useState<number | null>(null);
  const [recoveredCurrency, setRecoveredCurrency] = useState<string>('USD');
  const [amazonClaimCount, setAmazonClaimCount] = useState<number | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [needsSync, setNeedsSync] = useState<boolean>(false);
  const [syncTriggered, setSyncTriggered] = useState<boolean>(false);
  const [recoverySource, setRecoverySource] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<string | null>(null);

  // Track previous claims to detect new recoveries
  const previousClaimIdsRef = useRef<Set<string>>(new Set());
  const hasInitializedRef = useRef<boolean>(false);
  const previousRecoveredTotalRef = useRef<number>(0);
  const [activeSyncId, setActiveSyncId] = useState<string | null>(null);
  const syncPollingRef = useRef<number | null>(null);
  const syncCheckTimeoutRef = useRef<number | null>(null);

  // Currency selector state
  const [selectedCurrency, setSelectedCurrency] = useState<string>('USD');
  const currencies = [
    { code: 'USD', symbol: '$', name: 'US Dollar', rate: 1 },
    { code: 'ZAR', symbol: 'R', name: 'South African Rand', rate: 18.5 },
    { code: 'EUR', symbol: '€', name: 'Euro', rate: 0.92 },
    { code: 'GBP', symbol: '£', name: 'British Pound', rate: 0.79 },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee', rate: 83.0 },
    { code: 'JPY', symbol: '¥', name: 'Japanese Yen', rate: 149.0 },
    { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', rate: 7.24 },
    { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', rate: 1.53 },
    { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', rate: 1.36 },
    { code: 'CHF', symbol: 'Fr', name: 'Swiss Franc', rate: 0.88 }
  ];

  // Convert currency function
  const convertCurrency = (amount: number, fromCurrency: string = 'USD') => {
    const fromRate = currencies.find(c => c.code === fromCurrency)?.rate || 1;
    const toRate = currencies.find(c => c.code === selectedCurrency)?.rate || 1;
    return (amount / fromRate) * toRate;
  };

  // Format currency with selected currency
  const formatCurrencyWithSelection = (amount: number, originalCurrency: string = 'USD') => {
    const convertedAmount = convertCurrency(amount, originalCurrency);
    const currencyInfo = currencies.find(c => c.code === selectedCurrency);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: selectedCurrency,
      currencyDisplay: 'symbol'
    }).format(convertedAmount);
  };

  // Helper function for currency formatting (defined early so it can be used in useEffect)
  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency
    }).format(amount);
  };

  // --- Opportunity Radar helpers ---
  const getConfidenceTier = (c: number) => c >= 0.85 ? 'high' : c >= 0.6 ? 'medium' : 'low';
  const getConfidenceColor = (c: number) => c >= 0.85 ? 'text-emerald-600' : c >= 0.6 ? 'text-[#9B4354]' : 'text-blue-500';
  const getConfidenceBadge = (c: number) => c >= 0.85 ? 'High' : c >= 0.6 ? 'Medium' : 'Low';
  const getEvidenceStatus = (claim: any): 'Ready' | 'Needs Docs' | 'Collecting' => {
    const matchedCount =
      (Array.isArray(claim?.matchedDocs) ? claim.matchedDocs.length : 0) ||
      claim?.matchedCount ||
      claim?.evidence_count ||
      claim?._matchedCount ||
      0;

    if (matchedCount > 0) return 'Ready';
    if (claim?.source === 'synced' || claim?.case_id || claim?.case_number) return 'Needs Docs';
    return 'Collecting';
  };

  // Helper function to merge recoveries with detection results (without applying filters)
  const mergeRecoveries = useCallback((syncedRecoveries: any[], detectedClaims: any[]) => {
    console.log('[Recoveries] mergeRecoveries called:', {
      syncedCount: syncedRecoveries?.length || 0,
      detectedCount: detectedClaims?.length || 0
    });

    // Transform detection results to match recovery format
    const detected = (detectedClaims || []).map(det => ({
      id: det.id,
      claim_number: det.claim_number || det.evidence?.claim_number,
      source: 'detected',
      type: det.anomaly_type || 'Detected Claim',
      anomaly_type: det.anomaly_type, // Keep original for evidence validation
      details: `${det.anomaly_type || 'Claim'} detected with ${(det.confidence_score * 100).toFixed(0)}% confidence`,
      status: det.status || 'New',
      guaranteedAmount: det.estimated_value || 0,
      currency: det.currency || 'USD',
      confidence_score: det.confidence_score,
      days_remaining: det.days_remaining,
      discovery_date: det.discovery_date,
      deadline_date: det.deadline_date,
      created: det.discovery_date || det.created_at || new Date().toISOString(),
      expectedPayoutDate: det.deadline_date || null,
      sku: det.evidence?.sku || det.sku || 'N/A',
      asin: det.evidence?.asin || det.asin || 'N/A',
      order_id: det.evidence?.order_id || det.order_id,
      shipment_id: det.evidence?.shipment_id || det.shipment_id,
      quantity: det.evidence?.quantity || det.quantity,
      _confidence: typeof det.confidence_score === 'number' ? det.confidence_score : null,
      _priority: (det.confidence_score || 0) * (det.estimated_value || 0),
      _evidence: det.days_remaining && det.days_remaining <= 7 ? 'Ready' : 'Collecting',
      // Use matched_document_count from backend (enhanced API that queries dispute_evidence_links)
      matchedDocs: det.matched_documents || [],
      matchedCount: det.matched_document_count || (Array.isArray(det.matched_document_ids) ? det.matched_document_ids.length : 0),
      _matchedCount: det.matched_document_count || (Array.isArray(det.matched_document_ids) ? det.matched_document_ids.length : 0),
    }));

    // Mark synced recoveries
    const synced = (syncedRecoveries || []).map(rec => ({
      ...rec,
      source: 'synced',
      confidence_score: null,
      days_remaining: null,
      _confidence: null,
      _priority: rec.guaranteedAmount || rec.amount || 0,
      _evidence: getEvidenceStatus(rec),
      _matchedCount: Array.isArray((rec as any).matchedDocs) ? (rec as any).matchedDocs.length : ((rec as any).matchedCount ?? 0),
    }));

    // Combine and sort (don't apply filters here - let filteredClaims handle that)
    const merged = [...detected, ...synced].sort((a, b) => {
      const dateA = new Date(a.discovery_date || a.created || a.created_at || 0).getTime();
      const dateB = new Date(b.discovery_date || b.created || b.created_at || 0).getTime();
      return dateB - dateA;
    });

    console.log('[Recoveries] mergeRecoveries result:', merged.length, 'items');
    setMergedRecoveries(merged);
  }, []);

  // Reset state on tenant switch to prevent flicker
  useEffect(() => {
    setClaims([]);
    setDetectionResults([]);
    setMergedRecoveries(null);
    setDetectionStats(null);
    setMetrics(null);
    setMetricsLoaded(false);
    setRecoveredTotal(null);
    setAmazonClaimCount(null);
    setSelectedIds(new Set());
  }, [activeSlug]);

  // Fetch detection statistics
  useEffect(() => {
    if (!isReady) return;
    let cancelled = false;
    (async () => {
      const statsRes = await detectionApi.getDetectionStatistics(undefined, activeSlug).catch(() => ({ ok: false, data: null }));
      if (!cancelled) {
        if (statsRes.ok && statsRes.data?.statistics) {
          setDetectionStats(statsRes.data.statistics);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [isReady, activeSlug, refreshTrigger]);

  useEffect(() => {
    if (!isReady) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [resData, metricsRes, amazonRecoveriesRes, detectionRes] = await Promise.all([
        recoveryApi.getRecoveries(activeSlug).catch(() => null),
        api.getRecoveriesMetrics(activeSlug),
        api.getAmazonRecoveries(activeSlug).catch(() => null),
        detectionApi.getDetectionResults({ limit: 100, offset: 0 }, activeSlug).catch((err) => {
          console.warn('Failed to fetch detection results:', err);
          return { ok: false, data: null };
        }),
      ]);
      if (!cancelled) {
        console.log('[Recoveries] Data fetch results:', {
          resData: resData ? (Array.isArray(resData) ? `${resData.length} items` : 'not array') : 'null',
          detectionRes: detectionRes?.ok ? `${detectionRes.data?.results?.length || 0} results` : 'failed',
          currentClaimsLength: claims.length
        });

        if (resData && Array.isArray(resData)) {
          const newClaims = resData as any[];
          console.log('[Recoveries] Got recoveries from API:', newClaims.length);

          // Detect new recoveries by comparing with previous claims
          if (hasInitializedRef.current) {
            const currentClaimIds = new Set(newClaims.map(c => c.id));
            const previousClaimIds = previousClaimIdsRef.current;

            // Find new claims that weren't in the previous set
            const newClaimIds = Array.from(currentClaimIds).filter(id => !previousClaimIds.has(id));

            if (newClaimIds.length > 0) {
              const newClaimsData = newClaims.filter(c => newClaimIds.includes(c.id));
              const totalNewAmount = newClaimsData.reduce((sum, c) => sum + (c.guaranteedAmount || 0), 0);

              // Show toast for new recoveries detected
              if (newClaimIds.length === 1) {
                const newClaim = newClaimsData[0];
                toast({
                  title: 'New Recovery Detected!',
                  description: `${newClaim.type || 'Recovery'} found: ${formatCurrency(newClaim.guaranteedAmount || 0)}`,
                  duration: 5000,
                });
              } else {
                toast({
                  title: 'New Recoveries Detected!',
                  description: `${newClaimIds.length} new recoveries found totaling ${formatCurrency(totalNewAmount)}`,
                  duration: 5000,
                });
              }
            }
          }

          // Update previous claim IDs
          previousClaimIdsRef.current = new Set(newClaims.map(c => c.id));
          hasInitializedRef.current = true;

          setClaims(newClaims);
          setError(null);

          // Merge with detection results
          if (detectionRes.ok && detectionRes.data?.results) {
            console.log('[Recoveries] Merging with detection results:', detectionRes.data.results.length);
            setDetectionResults(detectionRes.data.results);
            mergeRecoveries(newClaims, detectionRes.data.results);
          } else {
            // No detection results, but we have synced recoveries - merge with empty detection array
            console.log('[Recoveries] No detection results, merging recoveries only');
            setDetectionResults([]);
            mergeRecoveries(newClaims, []);
          }
        } else {
          // No synced recoveries from API - show empty state or merge with detection results only
          console.log('[Recoveries] No API data from recoveryApi.getRecoveries()');
          setClaims([]); // Clear any previous data

          // Only merge if we have detection results
          if (detectionRes.ok && detectionRes.data?.results) {
            console.log('[Recoveries] Merging detection results only (no synced recoveries)');
            setDetectionResults(detectionRes.data.results);
            // Merge detection results with empty claims array
            mergeRecoveries([], detectionRes.data.results);
          } else {
            // No detection results either - show empty state
            console.log('[Recoveries] No data available - showing empty state');
            setDetectionResults([]);
            mergeRecoveries([], []);
            // Set error only if API call actually failed (not just empty response)
            if (resData === null) {
              setError('Failed to load recoveries. Please try again.');
            } else {
              setError(null); // Empty response is OK, just no data yet
            }
          }
        }
        if (metricsRes.ok && metricsRes.data) {
          setMetrics(metricsRes.data);
          setMetricsError(null);
          setMetricsLoaded(true);
        } else {
          setMetricsError(metricsRes.error || null);
          setMetricsLoaded(true);
        }

        // Handle Amazon recoveries data
        if (amazonRecoveriesRes?.ok && amazonRecoveriesRes.data) {
          const data = amazonRecoveriesRes.data as any;
          const newTotal = data.totalAmount ?? 0;
          const previousTotal = previousRecoveredTotalRef.current;

          setRecoveredTotal(newTotal);
          previousRecoveredTotalRef.current = newTotal;

          if (data.currency) setRecoveredCurrency(data.currency);
          if (typeof data.claimCount === 'number') setAmazonClaimCount(data.claimCount);

          // Handle sync-related fields
          if (data.message) setSyncMessage(data.message);
          if (typeof data.needsSync === 'boolean') setNeedsSync(data.needsSync);
          if (typeof data.syncTriggered === 'boolean') setSyncTriggered(data.syncTriggered);
          if (data.dataSource) setDataSource(data.dataSource);
          if (data.source) setRecoverySource(data.source);

          // If sync is triggered or needed, check sync status and poll for completion
          if (data.syncTriggered || data.needsSync) {
            checkAndMonitorSync();
          } else {
            // Clear sync polling if sync is no longer needed
            if (syncPollingRef.current) {
              clearInterval(syncPollingRef.current);
              syncPollingRef.current = null;
            }
            if (syncCheckTimeoutRef.current) {
              clearTimeout(syncCheckTimeoutRef.current);
              syncCheckTimeoutRef.current = null;
            }
          }
        } else if (amazonRecoveriesRes?.data) {
          // Handle response even if not fully ok (might have sync info)
          const data = amazonRecoveriesRes.data as any;
          if (data.message) setSyncMessage(data.message);
          if (typeof data.needsSync === 'boolean') setNeedsSync(data.needsSync);
          if (typeof data.syncTriggered === 'boolean') setSyncTriggered(data.syncTriggered);

          // Check sync status if needed
          if (data.syncTriggered || data.needsSync) {
            checkAndMonitorSync();
          }
        }

        // Function to check sync status and monitor completion
        async function checkAndMonitorSync() {
          if (cancelled) return;

          try {
            // Check if there's an active sync
            const syncStatusRes = await api.getSyncStatus(undefined, activeSlug);
            if (syncStatusRes.ok && syncStatusRes.data) {
              const syncStatus = syncStatusRes.data as any;

              // If there's an active sync, get the syncId
              if (syncStatus.hasActiveSync && syncStatus.lastSync?.syncId) {
                const syncId = syncStatus.lastSync.syncId;
                setActiveSyncId(syncId);

                // Start polling for sync completion
                startSyncPolling(syncId);
              } else if (syncStatus.lastSync?.status === 'complete') {
                // Sync completed, refresh data
                const [newRecoveriesRes] = await Promise.all([
                  api.getAmazonRecoveries(activeSlug).catch(() => null),
                ]);
                if (newRecoveriesRes?.ok && newRecoveriesRes.data) {
                  const newData = newRecoveriesRes.data as any;
                  setRecoveredTotal(newData.totalAmount ?? 0);
                  if (newData.currency) setRecoveredCurrency(newData.currency);
                  if (typeof newData.claimCount === 'number') setAmazonClaimCount(newData.claimCount);
                }
                setSyncTriggered(false);
                setNeedsSync(false);
                setSyncMessage(null);

                // Clear polling
                if (syncPollingRef.current) {
                  clearInterval(syncPollingRef.current);
                  syncPollingRef.current = null;
                }
              } else if (syncStatus.lastSync?.status === 'failed') {
                // Sync failed
                setSyncTriggered(false);
                setNeedsSync(true);
                setSyncMessage('We hit a temporary issue while updating your Amazon records. Please try again.');

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
          const maxPolls = 120; // Poll for up to 10 minutes

          syncPollingRef.current = window.setInterval(async () => {
            if (cancelled) {
              if (syncPollingRef.current) {
                clearInterval(syncPollingRef.current);
                syncPollingRef.current = null;
              }
              return;
            }

            pollCount++;

            try {
              const { getSyncStatus } = await import('@/lib/inventoryApi');
              const status = await getSyncStatus(syncId, activeSlug);

              if (status.status === 'complete') {
                // Sync completed, refresh data
                const [newRecoveriesRes, newClaimsRes] = await Promise.all([
                  api.getAmazonRecoveries(activeSlug).catch(() => null),
                  recoveryApi.getRecoveries(activeSlug).catch(() => null),
                ]);

                if (newRecoveriesRes?.ok && newRecoveriesRes.data) {
                  const newData = newRecoveriesRes.data as any;
                  setRecoveredTotal(newData.totalAmount ?? 0);
                  if (newData.currency) setRecoveredCurrency(newData.currency);
                  if (typeof newData.claimCount === 'number') setAmazonClaimCount(newData.claimCount);
                }

                if (newClaimsRes && Array.isArray(newClaimsRes)) {
                  setClaims(newClaimsRes as any);
                }

                setSyncTriggered(false);
                setNeedsSync(false);
                setSyncMessage('Sync completed successfully!');

                toast({
                  title: 'Amazon Update Complete',
                  description: 'Your latest Amazon records are ready to review.',
                  duration: 5000,
                });

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

                toast({
                  title: 'Amazon Update Paused',
                  description: 'We hit a temporary issue while updating your Amazon records. Please try again shortly.',
                  variant: 'destructive',
                  duration: 5000,
                });

                // Clear polling
                if (syncPollingRef.current) {
                  clearInterval(syncPollingRef.current);
                  syncPollingRef.current = null;
                }
              }
            } catch (error) {
              console.error('Error polling sync status:', error);

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

        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      if (syncPollingRef.current) {
        clearInterval(syncPollingRef.current);
        syncPollingRef.current = null;
      }
      if (syncCheckTimeoutRef.current) {
        clearTimeout(syncCheckTimeoutRef.current);
        syncCheckTimeoutRef.current = null;
      }
    };
  }, [isReady, activeSlug, refreshTrigger, toast]);

  // Real-time recovery status updates; update table rows on the fly
  useStatusStream((evt: StatusEvent) => {
    // Handle recovery status updates
    if (evt.type === 'claim') {
      const claimId = evt.data?.id || evt.data?.claimId;
      if (claimId) {
        setClaims(prev => prev.map(c => c.id === claimId ? { ...c, status: evt.status } as any : c));
      }
    }

    // Handle detection events - new recoveries detected
    if (evt.type === 'detection') {
      // Show toast for detection events
      const detectionData = (evt as any).data;
      const claimCount = detectionData?.claimCount || detectionData?.count || detectionData?.newClaims;
      const totalAmount = detectionData?.totalAmount || detectionData?.amount;

      if (claimCount || totalAmount) {
        toast({
          title: 'New Recoveries Detected!',
          description: claimCount
            ? `${claimCount} new recovery${claimCount !== 1 ? 'ies' : ''} detected${totalAmount ? ` totaling ${formatCurrency(totalAmount)}` : ''}`
            : totalAmount
              ? `New recoveries totaling ${formatCurrency(totalAmount)} detected`
              : 'New recoveries have been detected',
          duration: 6000,
        });
      } else {
        toast({
          title: 'Recovery Detection Complete',
          description: 'Scan completed. Check for new recovery opportunities.',
          duration: 5000,
        });
      }

      // Refresh claims list to show new recoveries
      recoveryApi.getRecoveries(activeSlug).then(res => {
        if (Array.isArray(res)) {
          const newClaims = res as any[];
          const currentClaimIds = new Set(newClaims.map(c => c.id));
          const previousClaimIds = previousClaimIdsRef.current;

          // Find new claims
          const newClaimIds = Array.from(currentClaimIds).filter(id => !previousClaimIds.has(id));

          if (newClaimIds.length > 0) {
            // Update previous claim IDs
            previousClaimIdsRef.current = currentClaimIds;
            setClaims(newClaims);
          }
        }
      }).catch(() => {
        // Silently fail
      });
    }

    // Refresh Amazon recoveries when sync/detection events occur
    if (evt.type === 'sync' || evt.type === 'detection') {
      api.getAmazonRecoveries(activeSlug).then(res => {
        if (res.ok && res.data) {
          const data = res.data as any;
          const previousTotal = previousRecoveredTotalRef.current;
          const newTotal = data.totalAmount ?? 0;

          setRecoveredTotal(newTotal);
          previousRecoveredTotalRef.current = newTotal;

          if (data.currency) setRecoveredCurrency(data.currency);
          if (typeof data.claimCount === 'number') setAmazonClaimCount(data.claimCount);
          if (data.message) setSyncMessage(data.message);
          if (typeof data.needsSync === 'boolean') setNeedsSync(data.needsSync);
          if (typeof data.syncTriggered === 'boolean') setSyncTriggered(data.syncTriggered);
          if (data.source) setRecoverySource(data.source);
          if (data.dataSource) setDataSource(data.dataSource);

          // Show toast if recovered amount increased
          if (newTotal > previousTotal && previousTotal > 0) {
            const increase = newTotal - previousTotal;
            toast({
              title: 'Recovery Amount Updated',
              description: `Recovered amount increased by ${formatCurrency(increase, data.currency || 'USD')}`,
              duration: 5000,
            });
          }
        }
      }).catch(() => {
        // Silently fail - don't disrupt user experience
      });
    }

    // Handle filing events (Agent 7)
    if (evt.type === 'filing') {
      if (evt.status === 'started') {
        toast({
          title: 'Filing Dispute',
          description: `Submitting case ${evt.data?.case_number || evt.data?.case_id || ''} to Amazon...`,
          duration: 4000,
        });
      } else if (evt.status === 'completed') {
        const amazonCaseId = evt.data?.amazon_case_id;
        const caseNumber = evt.data?.case_number;

        toast({
          title: 'Case Filed Successfully',
          description: `Case ${caseNumber || ''} filed with Amazon${amazonCaseId ? `: ${amazonCaseId}` : ''}`,
          duration: 6000,
        });
      } else if (evt.status === 'failed') {
        toast({
          title: 'Filing Failed',
          description: evt.data?.error || 'Please check case details',
          variant: 'destructive',
          duration: 6000,
        });
      }
    }

    // Handle status updates from Amazon (Agent 7 polling)
    if (evt.type === 'status_updated') {
      const status = evt.data?.status;
      const caseId = evt.data?.case_id || evt.data?.case_number;

      if (status && caseId) {
        // Show toast for important status changes
        if (status === 'approved') {
          toast({
            title: 'Case Approved!',
            description: `Amazon approved case ${caseId}`,
            duration: 6000,
          });
        } else if (status === 'denied') {
          toast({
            title: 'Case Denied',
            description: `Amazon denied case ${caseId}. Retry will be attempted with stronger evidence.`,
            variant: 'destructive',
            duration: 6000,
          });
        } else if (status === 'in_progress') {
          toast({
            title: 'Case In Progress',
            description: `Amazon is reviewing case ${caseId}`,
            duration: 4000,
          });
        }
      }
    }

    // Agent 8: Recovery events (payout detection and reconciliation)
    if (evt.type === 'recovery') {
      if (evt.status === 'payout_detected') {
        const amount = evt.data?.amount || evt.data?.actual_amount;
        const caseNumber = evt.data?.case_number || evt.data?.case_id;

        toast({
          title: 'Payout Detected',
          description: `Detected payout${amount ? ` of ${formatCurrencyWithSelection(amount)}` : ''}${caseNumber ? ` for case ${caseNumber}` : ''}`,
          duration: 5000,
        });
      } else if (evt.status === 'matched') {
        toast({
          title: 'Payout Matched',
          description: `Payout matched to claim ${evt.data?.case_number || ''}`,
          duration: 4000,
        });
      } else if (evt.status === 'reconciled') {
        const amount = evt.data?.amount || evt.data?.actual_amount;
        const caseNumber = evt.data?.case_number || evt.data?.case_id;

        toast({
          title: 'Payout Reconciled',
          description: `Refund of ${amount ? formatCurrencyWithSelection(amount) : '$0.00'} credited. Funds arriving in 3–5 days.`,
          duration: 6000,
        });
      } else if (evt.status === 'discrepancy') {
        const expected = evt.data?.expected_amount || evt.data?.expected;
        const actual = evt.data?.actual_amount || evt.data?.actual;

        toast({
          title: 'Payout Discrepancy',
          description: `Expected ${expected ? formatCurrencyWithSelection(expected) : '$0.00'}, received ${actual ? formatCurrencyWithSelection(actual) : '$0.00'}`,
          variant: 'destructive',
          duration: 8000,
        });
      } else if (evt.status === 'failed') {
        toast({
          title: 'Recovery Detection Failed',
          description: evt.data?.error || 'Unable to detect payout',
          variant: 'destructive',
          duration: 6000,
        });
      }
    }
  });

  // Filter data based on search and filters - use mergedRecoveries if available
  const filteredClaims = useMemo(() => {
    // Use mergedRecoveries if it has data, otherwise fall back to claims
    // null means not initialized yet, so use claims
    // empty array means initialized but no data, so also use claims if available
    let sourceData: any[] = [];
    if (mergedRecoveries !== null) {
      // mergedRecoveries has been initialized
      if (mergedRecoveries.length > 0) {
        sourceData = mergedRecoveries;
      } else {
        // mergedRecoveries is empty, fall back to claims
        sourceData = (claims && claims.length > 0) ? claims : [];
      }
    } else {
      // mergedRecoveries not initialized yet, use claims
      sourceData = (claims && claims.length > 0) ? claims : [];
    }

    // Debug logging
    console.log('[Recoveries] Filtering data:', {
      sourceDataLength: sourceData.length,
      mergedRecoveries: mergedRecoveries !== null ? `${mergedRecoveries.length} items` : 'null',
      claimsLength: claims?.length || 0,
      filterSource,
      filterConfidence,
      loading
    });

    let filtered = sourceData.filter(claim => {
      // Source filter (Phase 3)
      if (filterSource !== 'all') {
        if (claim.source !== filterSource) return false;
      }

      // Confidence filter (Phase 3) - only for detected claims
      if (filterConfidence !== 'all' && filterSource === 'detected') {
        if (!claim.confidence_score) return false;
        if (filterConfidence === 'high' && claim.confidence_score < 0.85) return false;
        if (filterConfidence === 'medium' && (claim.confidence_score < 0.50 || claim.confidence_score >= 0.85)) return false;
        if (filterConfidence === 'low' && claim.confidence_score >= 0.50) return false;
      }

      // Search filter
      const searchMatch = !searchTerm ||
        claim.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.asin?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.details?.toLowerCase().includes(searchTerm.toLowerCase());

      // Date filter
      const claimDate = new Date(claim.created || claim.discovery_date || claim.created_at || 0);
      const dateMatch = (!dateRange?.from || claimDate >= dateRange.from) &&
        (!dateRange?.to || claimDate <= dateRange.to);

      // Claim type filter
      const typeMatch = selectedClaimTypes.length === 0 || selectedClaimTypes.includes(claim.type);

      // Status filter
      const statusMatch = selectedStatuses.length === 0 || selectedStatuses.includes(claim.status);

      // Urgent filter
      if (filterUrgent !== 'all') {
        const daysRemaining = claim.days_remaining;
        if (daysRemaining === null || daysRemaining === undefined) return false;
        if (filterUrgent === 'critical' && daysRemaining > 3) return false;
        if (filterUrgent === 'urgent' && daysRemaining > 7) return false;
      }

      return searchMatch && dateMatch && typeMatch && statusMatch;
    });

    return filtered;
  }, [mergedRecoveries, claims, filterSource, filterConfidence, filterUrgent, searchTerm, dateRange, selectedClaimTypes, selectedStatuses]);

  // Rank opportunities: prioritize by confidence * value
  const rankedClaims = useMemo(() => {
    const base = filteredClaims
      .map(c => {
        const strength = calculateClaimStrength(c);
        return {
          ...c,
          _confidence: typeof c.confidence_score === 'number' ? c.confidence_score : null,
          _priority: c.guaranteedAmount || c.amount || 0,
          _evidence: getEvidenceStatus(c),
          _matchedCount: Array.isArray((c as any).matchedDocs) ? (c as any).matchedDocs.length : ((c as any).matchedCount ?? 0),
          _strength: strength,
        };
      })
      .sort((a, b) => b._priority - a._priority);

    // Apply strength filtering: hide low-strength claims unless toggle is on
    let filtered = showParkedOnly
      ? base.filter(c => typeof c._confidence === 'number' && c._confidence < 0.5)
      : base;
    if (!showRiskyClaims) {
      filtered = filtered.filter(c => c._strength.tier !== 'low');
    }
    return filtered;
  }, [filteredClaims, showParkedOnly, showRiskyClaims]);

  // Group claims by month for timeline-style display
  const claimsByMonth = useMemo(() => {
    const groups: { [key: string]: { month: string; year: number; claims: typeof rankedClaims; sortKey: number } } = {};

    rankedClaims.forEach(claim => {
      const date = new Date(claim.created || claim.discovery_date || claim.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleString('en-US', { month: 'long' });
      const year = date.getFullYear();

      if (!groups[monthKey]) {
        groups[monthKey] = {
          month: monthName,
          year,
          claims: [],
          sortKey: date.getFullYear() * 100 + date.getMonth()
        };
      }
      groups[monthKey].claims.push(claim);
    });

    // Sort by most recent first
    return Object.values(groups).sort((a, b) => b.sortKey - a.sortKey);
  }, [rankedClaims]);

  // Calculate key metrics
  const keyMetrics = useMemo(() => {
    const totalClaimsFound = filteredClaims.length;
    const currentlyInProgress = filteredClaims.filter(claim =>
      ['New', 'Pending', 'Submitted'].includes(claim.status)
    ).length;
    const valueInProgress = filteredClaims
      .filter(claim => ['New', 'Pending', 'Submitted'].includes(claim.status))
      .reduce((sum, claim) => sum + claim.guaranteedAmount, 0);

    // Calculate 30-day success rate from all claims (use mergedRecoveries if available)
    const dataSource = mergedRecoveries !== null ? mergedRecoveries : claims;
    const thirtyDaysAgo = subDays(new Date(), 30);
    const recentClaims = dataSource.filter(claim => {
      const claimDate = new Date(claim.created || claim.discovery_date || claim.created_at || 0);
      return claimDate >= thirtyDaysAgo;
    });
    const successfulClaims = recentClaims.filter(claim => claim.status === 'Paid');
    const successRate = recentClaims.length > 0
      ? (successfulClaims.length / recentClaims.length) * 100
      : 0;

    return {
      totalClaimsFound,
      currentlyInProgress,
      valueInProgress,
      successRate
    };
  }, [filteredClaims, claims, mergedRecoveries]);

  // Owed top-line summary (non-paid)
  const owedSummary = useMemo(() => {
    // Prefer backend metrics when available
    if (metrics && (typeof (metrics as any).totalOwed === 'number' || typeof (metrics as any).owedTotal === 'number')) {
      const totalOwed = (metrics as any).totalOwed ?? (metrics as any).owedTotal;
      const openCount = (metrics as any).openCount ?? (metrics as any).openClaims ?? 0;
      return { totalOwed, openCount };
    }

    // Use mergedRecoveries (includes Agent 3 detections) if available, otherwise fall back to claims
    const dataSource = mergedRecoveries !== null ? mergedRecoveries : claims;
    const openStatuses = new Set(['New', 'Pending', 'Submitted']);
    const openClaims = dataSource.filter(c => openStatuses.has(c.status));
    const totalOwed = openClaims.reduce((sum, c) => sum + (c.guaranteedAmount || 0), 0);
    return { totalOwed, openCount: openClaims.length };
  }, [claims, metrics, mergedRecoveries]);

  // Category breakdown chips
  const categoryCounts = useMemo(() => {
    // Prefer backend-provided category counts if available
    const fromMetrics = (metrics as any)?.categoryCounts || (metrics as any)?.categories;
    if (fromMetrics && typeof fromMetrics === 'object') {
      return fromMetrics as Record<string, number>;
    }
    // Use mergedRecoveries (includes Agent 3 detections) if available, otherwise fall back to claims
    const dataSource = mergedRecoveries !== null ? mergedRecoveries : claims;

    // Initialize counts using detection type names (human-readable)
    const counts: Record<string, number> = {};

    for (const c of dataSource) {
      // Get the type from claim - prefer anomaly_type (from Agent 3) over type
      const rawType = c.anomaly_type || c.type || '';

      // Use getTypeDisplay to get the human-readable name
      const typeDisplay = getTypeDisplay(c.type, c.anomaly_type);
      const displayName = typeDisplay.name;

      // Count by displayable name (human-readable)
      if (displayName && displayName !== 'Unknown') {
        counts[displayName] = (counts[displayName] || 0) + 1;
      }
    }

    // Sort by count descending and keep only non-zero entries
    const sortedCounts: Record<string, number> = {};
    Object.entries(counts)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1])
      .forEach(([name, count]) => {
        sortedCounts[name] = count;
      });

    return sortedCounts;
  }, [claims, metrics, mergedRecoveries]);

  // Tab counts - real data for Claims, Evidence Matching, Dispute Cases tabs
  const tabCounts = useMemo(() => {
    const dataSource = mergedRecoveries !== null ? mergedRecoveries : claims;

    // Claims: total claims count
    const claimsCount = dataSource.length;

    // Evidence Matching: claims with matched documents or high confidence matches
    const evidenceMatchingCount = dataSource.filter(c =>
      (c.matchedDocs && c.matchedDocs.length > 0) ||
      (c.matchedCount && c.matchedCount > 0) ||
      (c.evidence_count && c.evidence_count > 0)
    ).length;

    // Dispute Cases: claims that have been submitted or are under active review
    const disputeStatuses = ['submitted', 'under_review', 'under review', 'in_progress', 'disputed', 'pending_review'];
    const disputeCasesCount = dataSource.filter(c =>
      disputeStatuses.includes((c.status || '').toLowerCase()) ||
      c.case_id || c.case_number
    ).length;

    return { claimsCount, evidenceMatchingCount, disputeCasesCount };
  }, [claims, mergedRecoveries]);

  const pipelineActiveCount = useMemo(() => {
    if (typeof amazonClaimCount === 'number' && amazonClaimCount > 0) return amazonClaimCount;
    if (metrics && typeof (metrics as any).pendingCount === 'number') return (metrics as any).pendingCount;
    return tabCounts.claimsCount;
  }, [amazonClaimCount, metrics, tabCounts.claimsCount]);
  const approvedRecoveriesCount = useMemo(
    () => claims.filter(c => ['paid', 'approved', 'reconciled', 'paid_out'].includes((c.status || '').toLowerCase())).length,
    [claims]
  );
  const monthlyPlanBenchmark = 99;
  const primaryRecoveryValue = owedSummary.totalOwed > 0
    ? owedSummary.totalOwed
    : (recoveredTotal != null && recoveredTotal > 0 ? recoveredTotal : 0);
  const recoveriesHeroLabel = owedSummary.totalOwed > 0
    ? 'Open recovery value'
    : recoveredTotal != null && recoveredTotal > 0
      ? 'Paid back so far'
      : 'Recovery activity';
  const recoveriesHeroSupportingLabel = owedSummary.totalOwed > 0
    ? `${owedSummary.openCount} ${owedSummary.openCount === 1 ? 'opportunity is' : 'opportunities are'} currently worth reviewing`
    : recoveredTotal != null && recoveredTotal > 0
      ? `${approvedRecoveriesCount} ${approvedRecoveriesCount === 1 ? 'case is' : 'cases are'} already tied to recovered cash`
      : pipelineActiveCount > 0
        ? `${pipelineActiveCount} ${pipelineActiveCount === 1 ? 'opportunity is' : 'opportunities are'} under watch`
        : 'No live recoveries are showing yet';
  const recoveriesPlanNote = owedSummary.totalOwed > 0
    ? `${formatCurrencyWithSelection(owedSummary.totalOwed, recoveredCurrency)} in open value is about ${(owedSummary.totalOwed / monthlyPlanBenchmark).toFixed(1)}x a $99 monthly plan.`
    : recoveredTotal != null && recoveredTotal > 0
      ? 'One recovered payout already covers the monthly plan.'
      : 'One supportable recovery can justify the monthly plan.';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-gray-100 text-gray-700 border border-gray-200';
      case 'Pending': return 'bg-gray-100 text-gray-700 border border-gray-200';
      case 'pending': return 'bg-gray-100 text-gray-700 border border-gray-200';
      case 'Submitted': return 'bg-gray-100 text-gray-700 border border-gray-200';
      case 'Paid': return 'bg-gray-100 text-gray-900 border border-gray-300 font-medium';
      case 'Denied': return 'bg-gray-50 text-gray-500 border border-gray-200';
      default: return 'bg-gray-100 text-gray-700 border border-gray-200';
    }
  };

  const setQuickDateRange = (range: string) => {
    setQuickDateRangeState(range);
    const now = new Date();
    switch (range) {
      case '30days':
        setDateRange({ from: subDays(now, 30), to: now });
        break;
      case 'quarter':
        setDateRange({ from: startOfQuarter(now), to: now });
        break;
      case 'year':
        setDateRange({ from: startOfYear(now), to: now });
        break;
      case 'all':
        setDateRange({ from: undefined, to: undefined });
        break;
    }
  };

  return (
    <PageLayout title="Reimbursements">
      <div className="relative w-full flex-1 overflow-x-hidden bg-[#FAFAF7]">
        <div className="relative w-full min-h-full bg-[#FAFAF7]">
          <div className="relative mx-auto w-full max-w-[1440px] px-4 pb-16 pt-6 sm:px-6 lg:px-8">
            {/* Recovery control context */}
            <div className="relative mb-6 border-b border-[#DCE8EE] pb-6">
              <div className="absolute -bottom-px left-0 h-px w-16 bg-[#0B74DE]" />
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[12px] font-medium tracking-tight text-[#66737F]">Recovery control</span>
                  </div>
                  <h1 className="mb-2 font-lora text-[32px] font-normal tracking-tight text-[#182026]">Recoveries</h1>
                  <p className="max-w-2xl text-[13px] leading-5 text-[#66737F]">
                    Review what Margin found, what the current evidence supports, and what remains unresolved through payout and reconciliation.
                  </p>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <Button
                    variant="ghost"
                    className={cn(
                      "h-10 px-4 text-[12px] font-medium tracking-tight transition-colors border rounded-md",
                      selectedIds.size === 0 || submittingBulk
                        ? "border-[#DCE8EE] bg-white text-[#AAB7C0]"
                        : "border-[#0B74DE] bg-[#0B74DE] text-white hover:bg-[#0968C8] hover:border-[#0968C8]"
                    )}
                    disabled={selectedIds.size === 0 || submittingBulk}
                    onClick={async () => {
                      setSubmittingBulk(true);
                      const ids = Array.from(selectedIds);
                      try {
                        const truths = await Promise.all(ids.map((id) => resolveClaimFilingTruth(id)));
                        const routed = truths.filter((truth) => Boolean(truth.linkedDisputeId));
                        const blocked = truths.filter((truth) => !truth.linkedDisputeId);

                        if (routed.length > 0) {
                          openCanonicalFilingQueue(String(routed[0].linkedDisputeId), routed[0].claimId, 'submit');
                          if (routed.length > 1) {
                            toast({
                              title: 'Additional selected cases need the same filing queue',
                              description: `${routed.length} selected recoveries are filing-ready through Dispute Cases.`
                            });
                          }
                        }

                        if (blocked.length > 0) {
                          toast({
                            title: 'Some selected cases are blocked',
                            description: blocked[0].blockedReason
                          });
                        }
                      } finally {
                        setSubmittingBulk(false);
                      }
                    }}>
                    {submittingBulk ? (
                      <Loader2 className="h-4 w-4 animate-spin text-white" />
                    ) : (
                      <>
                        File selected cases ({selectedIds.size} selected)
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Recovery truth summary */}
            <div className="mb-8 border border-[#DCE8EE] bg-white shadow-[0_2px_8px_rgba(24,32,38,0.03)]">
              <div className="flex flex-col gap-6 p-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[12px] font-medium tracking-tight text-[#66737F]">{recoveriesHeroLabel}</span>
                    {((recoveredTotal != null && recoveredTotal > 0) || owedSummary.totalOwed > 0) && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            aria-label="About recovered value"
                            className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-[#DCE8EE] text-[#66737F] transition-colors hover:border-[#0B74DE] hover:text-[#0B74DE]">
                            <span className="text-[9px] font-medium">i</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-xs border border-[#DCE8EE] bg-white text-[11px] leading-4 text-[#4D5B66] shadow-[0_8px_24px_rgba(24,32,38,0.10)]">
                          {owedSummary.totalOwed > 0
                            ? `Value currently in play across open cases. ${recoverySource ? `Source: ${recoverySource}` : ''}`.trim()
                            : `Recovered from approved/completed claims. ${recoverySource ? `Source: ${recoverySource}` : ''}`.trim()}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <div className="flex items-baseline gap-4">
                    <div className="font-lora text-[42px] font-normal tabular-nums tracking-tight text-[#182026]">
                      {formatCurrencyWithSelection(primaryRecoveryValue, recoveredCurrency)}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-medium tracking-tight text-[#4D5B66]">
                        {owedSummary.totalOwed > 0 ? 'Open value under review' : recoveredTotal != null && recoveredTotal > 0 ? 'Payouts confirmed so far' : 'Current watchlist'}
                      </span>
                      <span className="text-[11px] leading-4 text-[#66737F]">
                        {recoveriesHeroSupportingLabel}
                      </span>
                    </div>
                  </div>
                  <p className="mt-3 max-w-2xl text-[12px] leading-5 text-[#66737F]">
                    {recoveriesPlanNote}
                  </p>

                  {/* Sync status message - Matrix Alert style */}
                  {(syncMessage || needsSync || syncTriggered) && (
                    <div className={cn(
                      "mt-4 max-w-2xl border-l-2 px-3 py-2.5 text-[12px] leading-5 transition-colors",
                      syncTriggered
                        ? 'border-[#0B74DE] bg-[#F3F7FF] text-[#0B74DE]'
                        : needsSync
                          ? 'border-[#4F8A70] bg-[#F4FAF7] text-[#2F6C54]'
                          : 'border-[#B7C6D0] bg-[#F7FAFC] text-[#4D5B66]'
                    )}>
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          {syncTriggered ? (
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <div className="h-1.5 w-1.5 rounded-full bg-current animate-pulse shadow-[0_0_8px_rgba(current,0.5)]" />
                        )}
                        <span className="text-[12px] font-medium tracking-tight">
                            {syncMessage || (needsSync ? 'We are refreshing your latest Amazon records.' : '')}
                        </span>
                      </div>
                      {activeSyncId && (
                          <Link
                            to={`/sync?id=${activeSyncId}`}
                            className="rounded border border-current/20 px-2 py-1 text-[11px] font-medium tracking-tight hover:underline">
                            Open sync detail
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-9 gap-2 rounded-md border-[#DCE8EE] bg-white px-3 text-[11px] font-medium tracking-tight text-[#4D5B66] hover:bg-[#F7FAFC] hover:text-[#182026]">
                      <div className="flex items-center gap-2">
                        Issue breakdown
                      </div>
                      <span className="rounded border border-[#DCE8EE] bg-[#F7FAFC] px-1.5 py-0.5 text-[10px] tabular-nums text-[#66737F]">
                        ({Object.values(categoryCounts).reduce((a, b) => a + b, 0)})
                      </span>
                      <ChevronDown className="h-3.5 w-3.5 text-[#66737F]" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-80 rounded-md border border-[#DCE8EE] bg-white p-2 shadow-[0_12px_32px_rgba(24,32,38,0.10)] outline-none">
                    <div className="mb-2 border-b border-[#E7EEF2] px-3 py-2 text-[11px] font-medium tracking-tight text-[#66737F]">
                      Detected issue types
                    </div>
                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                      {Object.entries(categoryCounts)
                        .sort((a, b) => b[1] - a[1])
                        .map(([label, count]) => (
                          <DropdownMenuItem
                            key={label}
                            className="group flex cursor-default items-center justify-between rounded px-3 py-2 text-[11px] hover:bg-[#F7FAFC] focus:bg-[#F7FAFC]">
                            <span className="truncate text-[#4D5B66] group-hover:text-[#182026]">{label}</span>
                            <span className="tabular-nums text-[#8A99A5] group-hover:text-[#0B74DE]">{count}</span>
                          </DropdownMenuItem>
                        ))}
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>


            {/* Recovery work queues */}
            <div className="mb-8">
              <div className="mb-4 flex items-center justify-between gap-4">
                <div>
                  <h2 className="font-lora text-[22px] font-normal tracking-tight text-[#182026]">Recovery work</h2>
                  <p className="mt-1 text-[12px] leading-5 text-[#66737F]">Inspect the current record before Margin advances an evidence-backed action.</p>
                </div>
              </div>
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'claims' | 'matching' | 'cases')} className="w-full">
                <TabsList className="mb-5 flex h-10 w-full items-stretch justify-start gap-1 rounded-md border border-[#DCE8EE] bg-white p-1 sm:w-fit">
                  <TabsTrigger
                    value="claims"
                    className="group relative flex-1 rounded px-3 text-[12px] font-medium tracking-tight text-[#66737F] transition-colors hover:text-[#182026] data-[state=active]:bg-[#F3F7FF] data-[state=active]:text-[#0B74DE] sm:flex-none">
                    <div className="flex items-center justify-center gap-2">
                      Open opportunities
                      {tabCounts.claimsCount > 0 && (
                        <span className="rounded border border-[#DCE8EE] bg-white px-1.5 py-0.5 text-[10px] tabular-nums text-[#8A99A5] group-data-[state=active]:border-[#BFD8F6] group-data-[state=active]:text-[#0B74DE]">
                          {tabCounts.claimsCount}
                        </span>
                      )}
                    </div>

                  </TabsTrigger>
                  <TabsTrigger
                    value="matching"
                    className="group relative flex-1 rounded px-3 text-[12px] font-medium tracking-tight text-[#66737F] transition-colors hover:text-[#182026] data-[state=active]:bg-[#F3F7FF] data-[state=active]:text-[#0B74DE] sm:flex-none">
                    <div className="flex items-center justify-center gap-2">
                      Evidence-ready
                      {tabCounts.evidenceMatchingCount > 0 && (
                        <span className="rounded border border-[#DCE8EE] bg-white px-1.5 py-0.5 text-[10px] tabular-nums text-[#8A99A5] group-data-[state=active]:border-[#BFD8F6] group-data-[state=active]:text-[#0B74DE]">
                          {tabCounts.evidenceMatchingCount}
                        </span>
                      )}
                    </div>

                  </TabsTrigger>
                  <TabsTrigger
                    value="cases"
                    className="group relative flex-1 rounded px-3 text-[12px] font-medium tracking-tight text-[#66737F] transition-colors hover:text-[#182026] data-[state=active]:bg-[#F3F7FF] data-[state=active]:text-[#0B74DE] sm:flex-none">
                    <div className="flex items-center justify-center gap-2">
                      Filed with Amazon
                      {tabCounts.disputeCasesCount > 0 && (
                        <span className="rounded border border-[#DCE8EE] bg-white px-1.5 py-0.5 text-[10px] tabular-nums text-[#8A99A5] group-data-[state=active]:border-[#BFD8F6] group-data-[state=active]:text-[#0B74DE]">
                          {tabCounts.disputeCasesCount}
                        </span>
                      )}
                    </div>

                  </TabsTrigger>
                </TabsList>

                {/* Claims Tab (Existing Content) */}
                {/* Claims Tab - Matrix Ledger Controls */}
                <TabsContent value="claims" className="mt-0 outline-none">
                  <div className="mb-5">
                    <div className="overflow-hidden border border-[#DCE8EE] bg-white shadow-[0_2px_8px_rgba(24,32,38,0.03)]">
                      <div className="flex items-center justify-between border-b border-[#E7EEF2] px-5 py-4">
                        <div>
                          <h3 className="text-[14px] font-medium tracking-tight text-[#182026]">Open recovery queue</h3>
                          <p className="mt-1 max-w-xl text-[12px] leading-5 text-[#66737F]">Each record keeps the amount, evidence posture, lifecycle state, and next controlled action together.</p>
                        </div>
                        <div className="text-[11px] font-medium tracking-tight text-[#66737F]">Live updates on</div>
                      </div>

                      <div className="p-5">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                          {/* Main Search Column */}
                          <div className="lg:col-span-12 space-y-4">
                            <div className="relative group/search max-w-2xl">
                              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A99A5] transition-colors group-focus-within/search:text-[#0B74DE]" />
                              <Input
                                placeholder="Search claim, order, SKU, ASIN, or store"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="h-11 rounded-md border-[#DCE8EE] bg-white pl-10 text-[12px] text-[#182026] placeholder:text-[#8A99A5] focus:border-[#0B74DE] focus:ring-[#0B74DE]/10"
                              />
                            </div>

                            {/* Temporal Accents (Quick Filters) */}
                            <div className="flex flex-wrap gap-2">
                              {[
                                { label: 'Last 30 days', val: '30days' },
                                { label: 'This quarter', val: 'quarter' },
                                { label: 'This year', val: 'year' },
                                { label: 'All time', val: 'all' }
                              ].map((opt) => (
                                <Button
                                  key={opt.val}
                                  variant="ghost"
                                  size="sm"
                                  className={cn(
                                    "h-8 rounded-md border px-3 text-[11px] font-medium tracking-tight transition-colors",
                                    quickDateRange === opt.val
                                      ? "border-[#BFD8F6] bg-[#F3F7FF] text-[#0B74DE]"
                                      : "border-[#DCE8EE] bg-white text-[#66737F] hover:bg-[#F7FAFC] hover:text-[#182026]"
                                  )}
                                  onClick={() => setQuickDateRange(opt.val as any)}>
                                  {opt.label}
                                </Button>
                              ))}
                            </div>
                          </div>

                          {/* Filter Matrix Row */}
                          <div className="flex flex-wrap gap-3 border-t border-[#E7EEF2] pt-4 lg:col-span-12">
                            {/* Temporal Window Popover */}
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className={cn(
                                    "h-10 gap-2 rounded-md border-[#DCE8EE] bg-white px-3 text-[11px] font-medium tracking-tight hover:bg-[#F7FAFC] transition-colors",
                                    !dateRange ? "text-[#8A99A5]" : "text-[#4D5B66]"
                                  )}>
                                  <CalendarIcon className="h-4 w-4 text-[#66737F]" />
                                  {dateRange?.from ? (
                                    dateRange.to ? (
                                      `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd")}`
                                    ) : (
                                      format(dateRange.from, "MMM dd, y")
                                    )
                                  ) : (
                                    "Custom period"
                                  )}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto overflow-hidden rounded-md border border-[#DCE8EE] bg-white p-0 shadow-[0_12px_32px_rgba(24,32,38,0.10)]" align="start">
                                <Calendar
                                  initialFocus
                                  mode="range"
                                  defaultMonth={dateRange?.from}
                                  selected={dateRange}
                                  onSelect={setDateRange}
                                  numberOfMonths={2}
                                  className="bg-white text-[#182026] text-[11px]"
                                />
                              </PopoverContent>
                            </Popover>

                            <Button
                              variant="ghost"
                              className="h-10 gap-2 px-3 text-[11px] font-medium tracking-tight text-[#66737F] hover:bg-[#F7FAFC] hover:text-[#182026]"
                              onClick={() => loadData()}>
                              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                              Refresh
                            </Button>

                            {/* Spectrum Select Filter (Claim Type) */}
                            <Select
                              value={selectedClaimTypes.length > 0 ? selectedClaimTypes[0] : 'all'}
                              onValueChange={(value) => setSelectedClaimTypes(value === 'all' ? [] : [value])}>
                              <SelectTrigger className="h-10 min-w-[180px] rounded-md border-[#DCE8EE] bg-white px-3 text-[11px] font-medium tracking-tight text-[#4D5B66] hover:bg-[#F7FAFC]">
                                <SelectValue placeholder="Claim type" />
                              </SelectTrigger>
                              <SelectContent className="rounded-md border border-[#DCE8EE] bg-white p-1 text-[11px] text-[#182026] shadow-[0_12px_32px_rgba(24,32,38,0.10)]">
                                <SelectItem value="all" className="rounded px-2.5 py-2 hover:bg-[#F7FAFC] focus:bg-[#F7FAFC]">All claim types</SelectItem>
                                {claimTypes.map(type => (
                                  <SelectItem key={type} value={type} className="rounded px-2.5 py-2 hover:bg-[#F7FAFC] focus:bg-[#F7FAFC]">{type.replace(/_/g, ' ')}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            {/* Node Status Select */}
                            <Select
                              value={selectedStatuses.length > 0 ? selectedStatuses[0] : 'all'}
                              onValueChange={(value) => setSelectedStatuses(value === 'all' ? [] : [value])}>
                              <SelectTrigger className="h-10 min-w-[180px] rounded-md border-[#DCE8EE] bg-white px-3 text-[11px] font-medium tracking-tight text-[#4D5B66] hover:bg-[#F7FAFC]">
                                <SelectValue placeholder="Recovery state" />
                              </SelectTrigger>
                              <SelectContent className="rounded-md border border-[#DCE8EE] bg-white p-1 text-[11px] text-[#182026] shadow-[0_12px_32px_rgba(24,32,38,0.10)]">
                                <SelectItem value="all" className="rounded px-2.5 py-2 hover:bg-[#F7FAFC] focus:bg-[#F7FAFC]">All recovery states</SelectItem>
                                {['Pending', 'Approved', 'Submitted', 'Reimbursed', 'Denied', 'Under Review'].map(s => (
                                  <SelectItem key={s} value={s} className="rounded px-2.5 py-2 hover:bg-[#F7FAFC] focus:bg-[#F7FAFC]">{s.replace(/ /g, '_')}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <Button
                              variant="ghost"
                              onClick={() => {
                                setSearchTerm('');
                                setQuickDateRange('all');
                                setDateRange(undefined);
                                setSelectedClaimTypes([]);
                                setSelectedStatuses([]);
                              }}
                              className="ml-auto h-10 px-3 text-[11px] font-medium tracking-tight text-[#66737F] hover:bg-[#F7FAFC] hover:text-[#182026]">
                              Clear filters
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>


                  {/* Recovery records */}
                  <div className="overflow-hidden border border-[#DCE8EE] bg-white shadow-[0_2px_8px_rgba(24,32,38,0.03)]">
                    <div className="p-0">
                      {loading && (
                        <div className="flex flex-col items-center justify-center space-y-3 py-20">
                          <Loader2 className="h-6 w-6 animate-spin text-[#0B74DE]" />
                          <span className="text-[12px] font-medium tracking-tight text-[#66737F]">Checking recovery records…</span>
                        </div>
                      )}
                      {error && (
                        <div className="flex flex-col items-center justify-center space-y-2 px-6 py-20 text-center">
                          <div className="space-y-1"><span className="text-[12px] font-medium tracking-tight text-[#B42318]">Margin could not load this recovery ledger.</span><span className="block text-[11px] leading-5 text-[#66737F]">Refresh the workspace or reconnect Amazon before trying again.</span></div>
                        </div>
                      )}
                      {!loading && !error && rankedClaims.length === 0 && (
                        <div className="flex flex-col items-center justify-center space-y-3 py-24">
                          <div className="flex max-w-sm flex-col items-center px-6 text-center">
                            <span className="text-[13px] font-medium tracking-tight text-[#4D5B66]">No recovery cases in this view</span>
                            <span className="mt-2 text-[11px] leading-5 text-[#66737F]">
                              {((mergedRecoveries === null || (mergedRecoveries && mergedRecoveries.length === 0)) && (!claims || claims.length === 0))
                                ? 'Connect Amazon or run an audit to start a recovery review.'
                                : 'Adjust the current filters to review a broader recovery scope.'}
                            </span>
                          </div>
                        </div>
                      )}
                      {!loading && rankedClaims.length > 0 && (
                        <div className="mt-0 divide-y divide-[#E7EEF2]">
                          <div className="flex items-center border-b border-[#E7EEF2] bg-[#F7FAFC] px-5 py-3">
                            <Checkbox
                              checked={selectedIds.size > 0 && selectedIds.size === filteredClaims.length}
                              onCheckedChange={(checked) => {
                                if (checked) setSelectedIds(new Set(filteredClaims.map(c => c.id)));
                                else setSelectedIds(new Set());
                              }}
                              className="mr-4 border-[#B7C6D0] data-[state=checked]:border-[#0B74DE] data-[state=checked]:bg-[#0B74DE]"
                            />
                            <span className="text-[11px] font-medium tracking-tight text-[#66737F]">Select records for controlled filing review</span>
                          </div>

                          {claimsByMonth.map((monthGroup, groupIndex) => (
                            <React.Fragment key={`${monthGroup.month}-${monthGroup.year}`}>
                              {/* Matrix Institutional Month Header */}
                              <div className="sticky top-0 z-10 flex items-center justify-between border-y border-[#E7EEF2] bg-[#FAFAF7]/95 px-5 py-3 backdrop-blur">
                                <span className="text-[12px] font-medium tracking-tight text-[#4D5B66]">
                                  {monthGroup.month} {monthGroup.year}
                                </span>
                                <span className="text-[11px] tabular-nums text-[#8A99A5]">
                                  {monthGroup.claims.length} {monthGroup.claims.length === 1 ? 'record' : 'records'}
                                </span>
                              </div>

                              {/* Claims in this month - Matrix Grid */}
                              <div className="divide-y divide-[#E7EEF2]">
                                {monthGroup.claims.map((claim: any) => {
                                  const isUrgent = claim.days_remaining !== null && claim.days_remaining !== undefined && claim.days_remaining <= 7;
                                  const isCritical = claim.days_remaining !== null && claim.days_remaining !== undefined && claim.days_remaining <= 3;
                                  const claimDate = new Date(claim.created || claim.discovery_date || claim.created_at);

                                  return (
                                    <div
                                      key={claim.id}
                                      className={cn(
                                        "group relative bg-white transition-colors hover:bg-[#F7FAFC]",
                                        isCritical && "bg-[#FFF8F8]",
                                        isUrgent && !isCritical && "bg-[#F7FAFC]"
                                      )}>
                                      {/* Status Accent Line */}
                                      <div className={cn(
                                        "absolute bottom-0 left-0 top-0 w-[2px] transition-opacity",
                                        isCritical ? "bg-[#B42318] opacity-100" : isUrgent ? "bg-[#0B74DE] opacity-70" : "bg-[#B7C6D0] opacity-0 group-hover:opacity-100"
                                      )} />

                                      <div className="flex items-center px-5 py-4">
                                        <div className="flex-shrink-0 mr-8">
                                          <Checkbox
                                            checked={selectedIds.has(claim.id)}
                                            onCheckedChange={(checked) => {
                                              setSelectedIds(prev => {
                                                const next = new Set(prev);
                                                if (checked) next.add(claim.id); else next.delete(claim.id);
                                                return next;
                                              });
                                            }}
                                            className="border-[#B7C6D0] data-[state=checked]:border-[#0B74DE] data-[state=checked]:bg-[#0B74DE]"
                                          />
                                        </div>

                                        <div className="flex items-center gap-8 min-w-0 flex-1">
                                          <div className="flex h-7 w-7 shrink-0 items-center justify-center border border-[#DCE8EE] bg-[#F7FAFC] text-[10px] font-medium tabular-nums text-[#66737F]">
                                            {claim.id.slice(0, 1)}
                                          </div>

                                          <div className="flex flex-col min-w-0 flex-1">
                                            <div className="flex items-center gap-4 mb-1.5">
                                              <Link to={`/recoveries/${claim.id}`} state={{ claim }}>
                                                <span className="text-[12px] font-medium tracking-tight text-[#182026] transition-colors hover:text-[#0B74DE]">
                                                  {claim.claim_number || claim.id.slice(0, 16)}
                                                </span>
                                              </Link>
                                              <span className="text-[10px] text-[#8A99A5]">
                                                {format(claimDate, 'dd MMM yyyy, HH:mm')}
                                              </span>
                                            </div>

                                            <div className="mb-2 flex items-center gap-2 text-[11px] leading-4 text-[#66737F]">
                                              <span className="max-w-md truncate">{claim.details}</span>
                                              <span className="text-[#C4D1D8]">·</span>
                                              <span className="text-[#8A99A5]">SKU {claim.sku || 'Not available'}</span>
                                            </div>

                                            <div className="flex items-center gap-3 flex-wrap">
                                              <div className={cn(
                                                "rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-tight",
                                                claim.status === 'Submitted' ? "border-[#D8E7FF] bg-[#F3F7FF] text-[#0B74DE]" :
                                                  claim.status === 'Reimbursed' ? "border-[#CFE4DB] bg-[#F4FAF7] text-[#2F6C54]" :
                                                    claim.status === 'Denied' ? "border-[#F0D7DE] bg-[#FFF7F8] text-[#9B4354]" :
                                                      "border-[#DCE8EE] bg-[#F7FAFC] text-[#4D5B66]"
                                              )}>
                                                {claim.status}
                                              </div>
                                              <div className="h-4 w-px bg-[#E7EEF2]" />
                                              {(() => {
                                                const doubleDipWarning = checkDoubleDip(claim, rankedClaims);
                                                return doubleDipWarning ? <DoubleDipBadge warning={doubleDipWarning} /> : null;
                                              })()}
                                              <div className={cn(
                                                "text-[10px] font-medium tracking-tight",
                                                isCritical ? "text-[#B42318]" : isUrgent ? "text-[#0B74DE]" : "text-[#8A99A5]"
                                              )}>
                                                {claim.days_remaining !== null ? `${claim.days_remaining} days remaining` : 'No deadline available'}
                                              </div>
                                              <div className="h-4 w-px bg-[#E7EEF2]" />
                                              <EvidenceQualityBadge validation={validateEvidencePolicy(claim, claim.matchedDocs)} claim={claim} matchedDocs={claim.matchedDocs} />
                                            </div>
                                          </div>

                                          <div className="flex flex-col items-end gap-1">
                                            <span className="text-[15px] font-semibold tabular-nums tracking-tight text-[#182026]">
                                              {formatCurrency(claim.guaranteedAmount, claim.currency || 'USD')}
                                            </span>
                                            <span className="text-[10px] text-[#8A99A5]">Estimated recovery value</span>
                                          </div>
                                        </div>

                                        <div className="flex items-center gap-4 ml-8">
                                          <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                              <Button variant="ghost" className="h-9 w-9 rounded-md p-0 text-[#66737F] hover:bg-[#F3F7FA] hover:text-[#182026]">
                                                <MoreHorizontal className="h-4 w-4" />
                                              </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-56 rounded-md border border-[#DCE8EE] bg-white p-1 shadow-[0_12px_32px_rgba(24,32,38,0.10)]">
                                              <div className="mb-1 border-b border-[#E7EEF2] px-3 py-2 text-[11px] font-medium tracking-tight text-[#66737F]">Recovery actions</div>
                                              <DropdownMenuItem asChild className="cursor-pointer rounded px-3 py-2 text-[11px] font-medium tracking-tight text-[#4D5B66] hover:bg-[#F7FAFC] hover:text-[#182026]">
                                                <Link to={`/recoveries/${claim.id}`} state={{ claim }}>View recovery record</Link>
                                              </DropdownMenuItem>

                                              <DropdownMenuItem
                                                className="cursor-pointer rounded px-3 py-2 text-[11px] font-medium tracking-tight text-[#4D5B66] hover:bg-[#F7FAFC] hover:text-[#182026]"
                                                onClick={async () => {
                                                  try {
                                                    const res = await api.getRecoveryDetail(claim.id, activeSlug);
                                                    const docs = (res && res.ok && Array.isArray((res as any).data?.documents)) ? (res as any).data!.documents : [];
                                                    setProofDocs(docs);
                                                    setProofDocsClaim(claim);
                                                    setProofDocsModalOpen(true);
                                                  } catch (e: any) {
                                                    toast({ title: 'Error loading documents', description: e?.message });
                                                  }
                                                }}>
                                                View proof documents
                                              </DropdownMenuItem>

                                              <DropdownMenuItem
                                                className="cursor-pointer rounded px-3 py-2 text-[11px] font-medium tracking-tight text-[#4D5B66] hover:bg-[#F7FAFC] hover:text-[#182026]"
                                                onClick={() => {
                                                  setEvidencePackClaim(claim);
                                                  setEvidencePackOpen(true);
                                                }}>
                                                View evidence package
                                              </DropdownMenuItem>

                                              {claim.status === 'Denied' && (
                                                <DropdownMenuItem
                                                  className="cursor-pointer rounded px-3 py-2 text-[11px] font-medium tracking-tight text-[#9B4354] hover:bg-[#FFF7F8]"
                                                  onClick={async () => {
                                                    const truth = await resolveClaimFilingTruth(claim);
                                                    if (truth.linkedDisputeId) {
                                                      openCanonicalFilingQueue(String(truth.linkedDisputeId), claim.id, 'resubmit');
                                                      return;
                                                    }
                                                    toast({ title: 'Resubmission blocked', description: truth.blockedReason });
                                                  }}>
                                                  Review resubmission
                                                </DropdownMenuItem>
                                              )}
                                            </DropdownMenuContent>
                                          </DropdownMenu>

                                          <Link
                                            to={`/recoveries/${claim.id}`}
                                            state={{ claim }}
                                            className="group/link flex items-center gap-2 text-[11px] font-medium tracking-tight text-[#66737F] transition-colors hover:text-[#0B74DE]"
                                          >
                                            Open record
                                            <ArrowRight className="w-3 h-3 translate-x-0 group-hover/link:translate-x-1 transition-transform duration-300" />
                                          </Link>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </React.Fragment>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Phase 3: Resolve Detection Modal */}
                  <Dialog open={resolveModalOpen} onOpenChange={setResolveModalOpen}>
                    <DialogContent className="max-w-md overflow-hidden rounded-lg border border-[#DCE8EE] bg-white p-0 shadow-[0_18px_48px_rgba(24,32,38,0.14)]">
                      <DialogHeader className="border-b border-[#E7EEF2] px-6 py-5">
                        <DialogTitle className="font-lora text-[22px] font-normal tracking-tight text-[#182026]">Record resolution</DialogTitle>
                        <DialogDescription className="mt-1 text-[12px] leading-5 text-[#66737F]">
                          Record the confirmed outcome and keep the recovery lifecycle complete.
                        </DialogDescription>
                      </DialogHeader>
                      {selectedDetection && (
                        <div className="space-y-5 px-6 py-5">
                          <div>
                            <Label className="text-[11px] font-medium tracking-tight text-[#66737F]">Recovery ID</Label>
                            <p className="mt-1 text-[11px] text-[#4D5B66]">{selectedDetection.id}</p>
                          </div>
                          <div>
                            <Label className="text-[11px] font-medium tracking-tight text-[#66737F]">Recovery type</Label>
                            <p className="mt-1 text-[12px] text-[#4D5B66]">
                              {(selectedDetection.type || selectedDetection.anomaly_type || 'Not available').replace(/_/g, ' ')}
                            </p>
                          </div>
                          <div>
                            <Label htmlFor="resolve-amount" className="text-[11px] font-medium tracking-tight text-[#66737F]">Confirmed payout amount</Label>
                            <Input
                              id="resolve-amount"
                              type="number"
                              step="0.01"
                              value={resolveAmount}
                              onChange={(e) => setResolveAmount(e.target.value)}
                              placeholder="0.00"
                              className="mt-2 h-10 rounded-md border-[#DCE8EE] bg-white text-[12px] text-[#182026] placeholder:text-[#8A99A5] focus:border-[#0B74DE] focus:ring-[#0B74DE]/10"
                            />
                          </div>
                          <div>
                            <Label htmlFor="resolve-notes" className="text-[11px] font-medium tracking-tight text-[#66737F]">Resolution note</Label>
                            <Textarea
                              id="resolve-notes"
                              value={resolveNotes}
                              onChange={(e) => setResolveNotes(e.target.value)}
                              placeholder="Add the payout confirmation or resolution details Margin should record."
                              className="mt-2 min-h-[100px] rounded-md border-[#DCE8EE] bg-white text-[12px] text-[#182026] placeholder:text-[#8A99A5] focus:border-[#0B74DE] focus:ring-[#0B74DE]/10"
                            />
                          </div>
                        </div>
                      )}
                      <DialogFooter className="flex gap-3 border-t border-[#E7EEF2] bg-[#FAFAF7] px-6 py-4 sm:justify-end">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setResolveModalOpen(false);
                            setSelectedDetection(null);
                            setResolveNotes('');
                            setResolveAmount('');
                          }}
                          className="h-10 rounded-md border border-[#DCE8EE] bg-white px-4 text-[11px] font-medium tracking-tight text-[#4D5B66] hover:bg-[#F7FAFC] hover:text-[#182026]">
                          Cancel
                        </Button>
                        <Button
                          onClick={async () => {
                            if (!selectedDetection) return;
                            try {
                              const res = await detectionApi.resolveDetection(selectedDetection.id, {
                                notes: resolveNotes,
                                resolution_amount: resolveAmount ? parseFloat(resolveAmount) : undefined,
                              });
                              if (res.ok) {
                                toast({
                                  title: 'Detection Resolved',
                                  description: res.data?.message || 'Detection marked as resolved successfully.',
                                });
                                // Update the detection in state
                                setDetectionResults(prev => prev.map(d =>
                                  d.id === selectedDetection.id ? { ...d, status: 'resolved' } : d
                                ));
                                setMergedRecoveries(prev => prev?.map(c =>
                                  c.id === selectedDetection.id ? { ...c, status: 'resolved' } : c
                                ));
                                setResolveModalOpen(false);
                                setSelectedDetection(null);
                                setResolveNotes('');
                                setResolveAmount('');
                                // Refresh statistics
                                const statsRes = await detectionApi.getDetectionStatistics(undefined, activeSlug);
                                if (statsRes.ok && statsRes.data?.statistics) {
                                  setDetectionStats(statsRes.data.statistics);
                                }
                              } else {
                                toast({
                                  title: 'Unable to Resolve Right Now',
                                  description: 'We encountered an issue marking this claim as resolved. Please try again in a moment.'
                                });
                              }
                            } catch (e: any) {
                              console.error('[Mark as Resolved] Error:', e);
                              toast({
                                title: 'Unable to Resolve Right Now',
                                description: 'We encountered an issue marking this claim as resolved. Please try again in a moment.'
                              });
                            }
                          }}
                          className="h-10 rounded-md border border-[#0B74DE] bg-[#0B74DE] px-4 text-[11px] font-medium tracking-tight text-white hover:bg-[#0968C8]">
                          Save resolution
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Phase 3: Status Update Modal */}
                  <Dialog open={statusUpdateModalOpen} onOpenChange={setStatusUpdateModalOpen}>
                    <DialogContent className="max-w-md overflow-hidden rounded-lg border border-[#DCE8EE] bg-white p-0 shadow-[0_18px_48px_rgba(24,32,38,0.14)]">
                      <DialogHeader className="border-b border-[#E7EEF2] px-6 py-5">
                        <DialogTitle className="font-lora text-[22px] font-normal tracking-tight text-[#182026]">Update recovery state</DialogTitle>
                        <DialogDescription className="mt-1 text-[12px] leading-5 text-[#66737F]">
                          Update the lifecycle state and retain the reason in the recovery record.
                        </DialogDescription>
                      </DialogHeader>
                      {selectedDetection && (
                        <div className="space-y-5 px-6 py-5">
                          <div>
                            <Label className="text-[11px] font-medium tracking-tight text-[#66737F]">Recovery ID</Label>
                            <p className="mt-1 text-[11px] text-[#4D5B66]">{selectedDetection.id}</p>
                          </div>
                          <div>
                            <Label htmlFor="status-select" className="text-[11px] font-medium tracking-tight text-[#66737F]">New recovery state</Label>
                            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                              <SelectTrigger id="status-select" className="mt-2 h-10 rounded-md border-[#DCE8EE] bg-white text-[12px] text-[#182026]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="rounded-md border border-[#DCE8EE] bg-white p-1 text-[11px] text-[#182026] shadow-[0_12px_32px_rgba(24,32,38,0.10)]">
                                <SelectItem value="pending" className="rounded px-2.5 py-2 hover:bg-[#F7FAFC] focus:bg-[#F7FAFC]">Pending</SelectItem>
                                <SelectItem value="reviewed" className="rounded px-2.5 py-2 hover:bg-[#F7FAFC] focus:bg-[#F7FAFC]">Reviewed</SelectItem>
                                <SelectItem value="disputed" className="rounded px-2.5 py-2 hover:bg-[#F7FAFC] focus:bg-[#F7FAFC]">Disputed</SelectItem>
                                <SelectItem value="resolved" className="rounded px-2.5 py-2 hover:bg-[#F7FAFC] focus:bg-[#F7FAFC]">Resolved</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="status-notes" className="text-[11px] font-medium tracking-tight text-[#66737F]">Record note</Label>
                            <span className="ml-2 text-[10px] text-[#8A99A5]">Optional</span>
                            <Textarea
                              id="status-notes"
                              value={statusUpdateNotes}
                              onChange={(e) => setStatusUpdateNotes(e.target.value)}
                              placeholder="Explain why this recovery state changed."
                              className="mt-2 min-h-[100px] rounded-md border-[#DCE8EE] bg-white text-[12px] text-[#182026] placeholder:text-[#8A99A5] focus:border-[#0B74DE] focus:ring-[#0B74DE]/10"
                            />
                          </div>
                        </div>
                      )}
                      <DialogFooter className="flex gap-3 border-t border-[#E7EEF2] bg-[#FAFAF7] px-6 py-4 sm:justify-end">
                        <Button
                          variant="ghost"
                          onClick={() => {
                            setStatusUpdateModalOpen(false);
                            setSelectedDetection(null);
                            setStatusUpdateNotes('');
                            setSelectedStatus('pending');
                          }}
                          className="h-10 rounded-md border border-[#DCE8EE] bg-white px-4 text-[11px] font-medium tracking-tight text-[#4D5B66] hover:bg-[#F7FAFC] hover:text-[#182026]">
                          Cancel
                        </Button>
                        <Button
                          onClick={async () => {
                            if (!selectedDetection) return;
                            try {
                              const res = await detectionApi.updateDetectionStatus(selectedDetection.id, {
                                status: selectedStatus,
                                notes: statusUpdateNotes,
                              });
                              if (res.ok) {
                                toast({
                                  title: 'Status Updated',
                                  description: res.data?.message || 'Detection status updated successfully.',
                                });
                                // Update the detection in state
                                setDetectionResults(prev => prev.map(d =>
                                  d.id === selectedDetection.id ? { ...d, status: selectedStatus } : d
                                ));
                                setMergedRecoveries(prev => prev?.map(c =>
                                  c.id === selectedDetection.id ? { ...c, status: selectedStatus } : c
                                ));
                                setStatusUpdateModalOpen(false);
                                setSelectedDetection(null);
                                setStatusUpdateNotes('');
                                setSelectedStatus('pending');
                              } else {
                                toast({
                                  title: 'Unable to Update Status',
                                  description: 'We encountered an issue updating this claim. Please try again in a moment.'
                                });
                              }
                            } catch (e: any) {
                              console.error('[Update Status] Error:', e);
                              toast({
                                title: 'Unable to Update Status',
                                description: 'We encountered an issue updating this claim. Please try again in a moment.'
                              });
                            }
                          }}
                          className="h-10 rounded-md border border-[#0B74DE] bg-[#0B74DE] px-4 text-[11px] font-medium tracking-tight text-white hover:bg-[#0968C8]">
                          Save state
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Mark All Read Modal */}
                  <Dialog open={markAllReadModalOpen} onOpenChange={setMarkAllReadModalOpen}>
                    <DialogContent className="max-w-xs overflow-hidden rounded-lg border border-[#DCE8EE] bg-white p-0 shadow-[0_18px_48px_rgba(24,32,38,0.14)]">
                      <div className="px-6 py-7 text-center">

                        <h3 className="font-lora text-[22px] font-normal tracking-tight text-[#182026]">
                          Mark recovery records as reviewed
                        </h3>
                        <p className="mb-6 mt-2 text-[12px] leading-5 text-[#66737F]">
                          This updates the review state for all active recovery records in this workspace.
                        </p>
                        <div className="flex flex-col gap-2">
                          <Button
                            onClick={() => {
                              toast({
                                title: 'All Marked as Read',
                                description: 'All claims have been marked as reviewed.'
                              });
                              setMarkAllReadModalOpen(false);
                            }}
                            className="h-10 rounded-md border border-[#0B74DE] bg-[#0B74DE] text-[11px] font-medium tracking-tight text-white hover:bg-[#0968C8]">
                            Mark all as reviewed
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => setMarkAllReadModalOpen(false)}
                            className="h-10 text-[11px] font-medium tracking-tight text-[#66737F] hover:bg-[#F7FAFC] hover:text-[#182026]">
                            Cancel
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                </TabsContent>

                {/* File Anyway Confirmation Modal for Medium-Strength Claims */}
                <Dialog open={fileAnywayModalOpen} onOpenChange={setFileAnywayModalOpen}>
                  <DialogContent className="bg-white border border-[#DCE8EE] shadow-2xl backdrop-blur-3xl rounded-2xl max-w-lg max-h-[85vh] overflow-hidden p-0">
                    <DialogHeader className="border-b border-[#E7EEF2] px-6 py-5">
                      <DialogTitle className="font-lora text-[22px] font-normal tracking-tight text-[#182026]">
                        Evidence review before filing
                      </DialogTitle>
                      <DialogDescription className="mt-1 text-[12px] leading-5 text-[#66737F]">
                        Review the evidence posture and filing safeguards before sending this recovery to the controlled filing queue.
                      </DialogDescription>
                    </DialogHeader>
                    {claimToFile && (() => {
                      const strength = calculateClaimStrength(claimToFile);
                      const claimAmount = claimToFile.amount || claimToFile.estimated_value || claimToFile.claim_amount || 0;
                      const claimType = claimToFile.anomaly_type || claimToFile.type || claimToFile.claim_type || 'Unknown';
                      const claimDate = claimToFile.discovery_date || claimToFile.created || claimToFile.created_at;
                      return (
                        <div className="max-h-[calc(85vh-160px)] space-y-5 overflow-y-auto px-6 py-5">
                          {/* Claim Details */}
                          <div className="overflow-hidden border border-[#DCE8EE] bg-white">
                            <div className="border-b border-[#E7EEF2] bg-[#F7FAFC] px-4 py-3">
                              <h4 className="text-[12px] font-medium tracking-tight text-[#4D5B66]">Recovery record</h4>
                            </div>
                            <div className="divide-y divide-[#E7EEF2]">
                              <div className="flex justify-between items-center px-4 py-3">
                                <span className="text-[11px] text-[#66737F]">Recovery ID</span>
                                <span className="text-[11px] text-[#4D5B66]">{claimToFile.id?.slice(0, 16) || 'Not available'}</span>
                              </div>
                              <div className="flex justify-between items-center px-4 py-3">
                                <span className="text-[11px] text-[#66737F]">Estimated value</span>
                                <span className="text-[12px] font-semibold tabular-nums text-[#182026]">${typeof claimAmount === 'number' ? claimAmount.toFixed(2) : claimAmount}</span>
                              </div>
                              <div className="flex justify-between items-center px-4 py-3">
                                <span className="text-[11px] text-[#66737F]">Recovery type</span>
                                <span className="text-[11px] text-[#4D5B66]">{String(claimType).replace(/_/g, ' ')}</span>
                              </div>
                              {claimDate && (
                                <div className="flex justify-between items-center px-4 py-3">
                                  <span className="text-[11px] text-[#66737F]">Discovery date</span>
                                  <span className="text-[11px] text-[#4D5B66]">{new Date(claimDate).toLocaleDateString()}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Assessment Summary */}
                          <div className="bg-[#F7FAFC] border border-[#DCE8EE] rounded-xl p-6 relative group overflow-hidden">

                            <div className="flex flex-col gap-1">
                              <span className="text-[11px] font-medium tracking-tight text-[#66737F]">Evidence strength</span>
                              <div className="flex items-baseline gap-2">
                                <span className={cn(
                                  "text-4xl font-sans font-bold tracking-tighter",
                                  strength.score >= 80 ? "text-emerald-500" : strength.score >= 50 ? "text-[#9B4354]" : "text-red-500"
                                )}>
                                  {strength.score}
                                </span>
                                <span className="text-[11px] text-[#8A99A5]">/ 100</span>
                              </div>
                            </div>
                          </div>

                          {/* Detailed Breakdown */}
                          <div className="space-y-3">
                            <h4 className="text-[12px] font-medium tracking-tight text-[#4D5B66]">Evidence-strength basis</h4>
                            <div className="space-y-2">
                              {strength.factors.map((f, i) => (
                                <div key={i} className="flex items-center justify-between border border-[#E7EEF2] bg-white px-4 py-3">
                                  <div className="space-y-1">
                                    <span className="text-[11px] font-medium tracking-tight text-[#4D5B66]">{f.label}</span>
                                    <p className="text-[10px] leading-4 text-[#8A99A5]">{f.reason}</p>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-[12px] font-medium tabular-nums text-[#0B74DE]">{f.value}</span>
                                    <span className="text-[10px] text-[#8A99A5]"> / {f.max}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Advisory Note */}
                          <div className="bg-[#FFF7F8] border border-[#F0D7DE] rounded-xl px-5 py-4">
                            <p className="text-[11px] leading-5 text-[#9B4354]">
                              <span className="mr-2 font-medium">Review note:</span>
                              Add the missing supporting records before Margin can safely move this recovery toward filing. Do not bypass the review gate.
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                    <DialogFooter className="flex gap-3 border-t border-[#E7EEF2] bg-[#FAFAF7] px-6 py-4 sm:justify-end">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setFileAnywayModalOpen(false);
                          setClaimToFile(null);
                        }}
                        className="h-10 rounded-md border border-[#DCE8EE] bg-white px-4 text-[11px] font-medium tracking-tight text-[#4D5B66] hover:bg-[#F7FAFC] hover:text-[#182026]">
                        Cancel
                      </Button>
                      <Button
                        onClick={async () => {
                          if (!claimToFile) return;
                          try {
                            const truth = await resolveClaimFilingTruth(claimToFile);
                            if (truth.linkedDisputeId) {
                              openCanonicalFilingQueue(String(truth.linkedDisputeId), claimToFile.id, 'submit');
                            } else {
                              toast({
                                title: 'Filing blocked',
                                description: truth.blockedReason
                              });
                            }
                            setFileAnywayModalOpen(false);
                            setClaimToFile(null);
                          } catch (e: any) {
                            console.error('[File Anyway] Submit error:', e);
                            toast({
                              title: 'Unable to File Right Now',
                              description: 'We encountered an issue filing this claim. Please try again in a moment or contact support if the issue persists.'
                            });
                            setFileAnywayModalOpen(false);
                            setClaimToFile(null);
                          }
                        }}
                        className="h-10 rounded-md border border-[#0B74DE] bg-[#0B74DE] px-4 text-[11px] font-medium tracking-tight text-white hover:bg-[#0968C8]">
                        Continue to filing review
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Evidence Pack Dossier View */}
                {evidencePackClaim && (
                  <EvidencePackView
                    open={evidencePackOpen}
                    onClose={() => {
                      setEvidencePackOpen(false);
                      setEvidencePackClaim(null);
                    }}
                    claim={evidencePackClaim}
                  />
                )}

                {/* Proof Documents Modal */}
                <ProofDocumentsModal
                  open={proofDocsModalOpen}
                  onClose={() => {
                    setProofDocsModalOpen(false);
                    setProofDocsClaim(null);
                    setProofDocs([]);
                  }}
                  claimId={proofDocsClaim?.id || ''}
                  claimNumber={proofDocsClaim?.claim_number}
                  documents={proofDocs}
                />

                {/* Claim Details Modal - Institutional Banking Style */}
                <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
                  <DialogContent className="max-h-[90vh] max-w-2xl overflow-hidden rounded-lg border border-[#DCE8EE] bg-white p-0 text-[#182026] shadow-[0_18px_48px_rgba(24,32,38,0.14)]">
                    {/* Header - Institutional Style */}
                    <div className="border-b border-[#E7EEF2] px-6 py-5">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="mb-1 text-[11px] font-medium tracking-tight text-[#66737F]">Recovery record</div>
                          <DialogTitle className="font-lora text-[26px] font-normal tracking-tight text-[#182026]">
                            Claim detail
                          </DialogTitle>
                        </div>
                        {detectionDetails && (
                          <>
                            <div
                              className="cursor-pointer text-[11px] font-medium tracking-tight text-[#0B74DE] transition-colors hover:text-[#0968C8]"
                              onClick={() => {
                                navigator.clipboard.writeText(detectionDetails.id || '');
                                toast({ title: 'Copied', description: 'Claim ID copied to clipboard' });
                              }}
                              title="Click to copy">
                              {detectionDetails.claim_number || detectionDetails.id?.slice(0, 12) || 'Recovery record'}
                            </div>
                            <div className="mt-1 text-[10px] text-[#8A99A5]">
                              {detectionDetails.created_at || detectionDetails.discovery_date
                                ? format(new Date(detectionDetails.created_at || detectionDetails.discovery_date), 'dd_MMM_yyyy HH:mm')
                                : 'INDEX_PENDING'
                              }
                            </div>
                          </>
                        )}
                      </div>
                      {detectionDetails && (
                        <div className="mt-3 text-[11px] text-[#66737F]">
                          {(detectionDetails.anomaly_type || detectionDetails.type || 'Recovery claim').replace(/_/g, ' ')}
                        </div>
                      )}
                      {detectionDetails && (
                        <Link
                          to={`/recoveries/${detectionDetails.id}`}
                          state={{ claim: detectionDetails }}
                          className="group mt-4 inline-flex items-center text-[11px] font-medium tracking-tight text-[#0B74DE] transition-colors hover:text-[#0968C8]">
                          Open full recovery record
                          <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      )}
                    </div>

                    {detectionDetails && (
                      <div className="max-h-[calc(90vh-140px)] space-y-5 overflow-y-auto px-6 py-5">
                        {/* Summary Card - Institutional Style */}
                        <div className="overflow-hidden border border-[#DCE8EE] bg-white">
                          <div className="bg-[#F7FAFC] border-b border-[#E7EEF2] px-6 py-4">
                            <h4 className="text-[12px] font-medium tracking-tight text-[#4D5B66]">Recovery summary</h4>
                          </div>
                          <div className="divide-y divide-[#E7EEF2]">
                            <div className="flex justify-between items-center px-6 py-4">
                              <span className="text-[11px] text-[#66737F]">Expected recovery</span>
                              <span className="text-[16px] font-semibold tabular-nums tracking-tight text-[#182026]">
                                {formatCurrency(detectionDetails.guaranteedAmount || detectionDetails.amount || detectionDetails.estimated_value || 0, detectionDetails.currency || 'USD')}
                              </span>
                            </div>
                            <div className="flex justify-between items-center px-6 py-4">
                              <span className="text-[11px] text-[#66737F]">Current state</span>
                              <span className="text-[11px] font-medium tracking-tight text-[#4D5B66]">{detectionDetails.status || 'Pending'}</span>
                            </div>
                            <div className="flex justify-between items-center px-6 py-4">
                              <span className="text-[11px] text-[#66737F]">Evidence count</span>
                              <span className="text-[11px] font-medium tracking-tight text-[#4D5B66]">
                                {detectionDetails.matchedCount || detectionDetails.matchedDocs?.length || 0} linked documents
                              </span>
                            </div>
                          </div>
                        </div>


                        {/* Claim Info Section */}
                        <div className="space-y-4">
                          <h4 className="font-lora text-[18px] font-normal tracking-tight text-[#182026]">Record identifiers</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-[#F7FAFC] border border-[#E7EEF2] rounded-xl p-4">
                              <div className="text-[11px] font-medium tracking-tight text-[#66737F]">Recovery ID</div>
                              <div className="text-[10px] font-sans font-bold text-emerald-500/60 mt-2 uppercase tracking-tight">{detectionDetails.id?.slice(0, 16) || '—'}...</div>
                            </div>
                            <div className="bg-[#F7FAFC] border border-[#E7EEF2] rounded-xl p-4">
                              <div className="text-[11px] font-medium tracking-tight text-[#66737F]">Sync ID</div>
                              <div className="text-[10px] font-sans font-bold text-[#4D5B66] mt-2 uppercase tracking-tight">{detectionDetails.sync_id || 'N/A'}</div>
                            </div>
                            <div className="bg-[#F7FAFC] border border-[#E7EEF2] rounded-xl p-4">
                              <div className="text-[11px] font-medium tracking-tight text-[#66737F]">Recovery type</div>
                              <div className="text-[10px] font-sans font-bold text-[#4D5B66] mt-2 uppercase tracking-tight">
                                {detectionDetails.anomaly_type?.replace(/_/g, '_').toUpperCase() || '—'}
                              </div>
                            </div>
                            <div className="bg-[#F7FAFC] border border-[#E7EEF2] rounded-xl p-4">
                              <div className="text-[11px] font-medium tracking-tight text-[#66737F]">Severity</div>
                              <Badge className="mt-2 bg-white/5 hover:bg-white/10 text-[#4D5B66] border-[#DCE8EE] text-[9px] font-sans font-bold uppercase tracking-tight">
                                {detectionDetails.severity?.toUpperCase() || 'UNKNOWN'}
                              </Badge>
                            </div>
                            {detectionDetails.sku && (
                              <div className="bg-[#F7FAFC] border border-[#E7EEF2] rounded-xl p-4">
                                <div className="text-[11px] font-medium tracking-tight text-[#66737F]">SKU</div>
                                <div className="text-[10px] font-sans font-bold text-[#4D5B66] mt-2 uppercase tracking-tight">{detectionDetails.sku}</div>
                              </div>
                            )}
                            {detectionDetails.asin && (
                              <div className="bg-[#F7FAFC] border border-[#E7EEF2] rounded-xl p-4">
                                <div className="text-[11px] font-medium tracking-tight text-[#66737F]">ASIN</div>
                                <div className="text-[10px] font-sans font-bold text-[#4D5B66] mt-2 uppercase tracking-tight">{detectionDetails.asin}</div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Evidence Quality & Policy Check */}
                        {(() => {
                          const validation = validateEvidencePolicy(detectionDetails, detectionDetails.matchedDocs);

                          return (
                            <div className="space-y-4">
                              <h4 className="font-lora text-[18px] font-normal tracking-tight text-[#182026]">Evidence and policy checks</h4>
                              <div className="overflow-hidden border border-[#DCE8EE] bg-white">
                                <div className="bg-[#F7FAFC] border-b border-[#E7EEF2] px-6 py-4 flex items-center justify-between">
                                  <h4 className="text-[12px] font-medium tracking-tight text-[#4D5B66]">Validation status</h4>
                                  <span className={cn(
                                    "text-[10px] font-sans font-bold uppercase tracking-tight",
                                    validation.quality === 'strong' ? "text-emerald-500" : validation.quality === 'medium' ? "text-[#9B4354]" : "text-red-500"
                                  )}>
                                    {validation.quality} confidence
                                  </span>
                                </div>
                                <div className="p-6 space-y-6">
                                  {/* Quality Summary */}
                                  <div>
                                    <div className="text-[12px] font-medium tracking-tight text-[#182026]">Recommended next step</div>
                                    <div className="mt-2 text-[11px] leading-5 text-[#66737F]">{validation.recommendationText}</div>
                                  </div>

                                  {/* Field Verification */}
                                  <div className="space-y-3">
                                    <p className="text-[11px] font-medium tracking-tight text-[#66737F]">Field checks</p>
                                    <div className="grid grid-cols-1 gap-2">
                                      {validation.fieldChecks.map((check, i) => (
                                        <div key={i} className="group/field flex items-center justify-between border-b border-[#E7EEF2] py-2.5 text-[11px] last:border-0">
                                          <span className="text-[#66737F] transition-colors group-hover/field:text-[#4D5B66]">{check.label}</span>
                                          <span className={cn(
                                            "text-[10px] font-medium tracking-tight",
                                            check.present ? "text-[#2F6C54]" : check.required ? "text-[#B42318]" : "text-[#8A99A5]"
                                          )}>
                                            {check.present ? "Present" : check.required ? "Required" : "Not available"}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Policy Notes */}
                                  {validation.warnings.length > 0 && (
                                    <div className="space-y-3 pt-4 border-t border-[#E7EEF2]">
                                      <p className="text-[9px] font-sans font-bold text-red-500/40 uppercase tracking-tight">POLICY CONFLICT WARNINGS</p>
                                      <ul className="space-y-2">
                                        {validation.warnings.map((w, i) => (
                                          <li key={i} className="text-[9px] font-sans font-bold text-[#66737F] uppercase tracking-tight pl-4 relative before:content-['>'] before:absolute before:left-0 before:text-red-500/30 leading-relaxed">{w}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Financial Information - Institutional Style */}
                        <div className="overflow-hidden border border-[#DCE8EE] bg-white">
                          <div className="bg-[#F7FAFC] border-b border-[#E7EEF2] px-6 py-4">
                            <h4 className="font-lora text-[18px] font-normal tracking-tight text-[#182026]">Financial information</h4>
                          </div>
                          <div className="divide-y divide-[#E7EEF2]">
                            <div className="flex justify-between items-center px-6 py-4">
                              <span className="text-[11px] text-[#66737F]">Estimated recovery value</span>
                              <span className="text-[13px] font-semibold tabular-nums tracking-tight text-[#182026]">
                                {formatCurrency(detectionDetails.estimated_value || detectionDetails.guaranteedAmount || 0, detectionDetails.currency || 'USD')}
                              </span>
                            </div>
                            <div className="flex justify-between items-center px-6 py-4">
                              <span className="text-[11px] text-[#66737F]">Currency</span>
                              <span className="text-[11px] font-medium tracking-tight text-[#4D5B66]">{detectionDetails.currency || 'USD'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Dates & Deadlines */}
                        <div className="space-y-4">
                          <h4 className="font-lora text-[18px] font-normal tracking-tight text-[#182026]">Timing and deadlines</h4>
                          <div className="grid grid-cols-2 gap-4">
                            {detectionDetails.discovery_date && (
                              <div className="bg-[#F7FAFC] border border-[#E7EEF2] rounded-xl p-4">
                                <div className="text-[11px] font-medium tracking-tight text-[#66737F]">Discovery date</div>
                                <div className="text-[10px] font-sans font-bold text-[#4D5B66] mt-2 uppercase tracking-tight">
                                  {format(new Date(detectionDetails.discovery_date), 'dd_MMM_yyyy')}
                                </div>
                              </div>
                            )}
                            {detectionDetails.deadline_date && (
                              <div className="bg-[#F7FAFC] border border-[#E7EEF2] rounded-xl p-4">
                                <div className="text-[11px] font-medium tracking-tight text-[#66737F]">Filing deadline</div>
                                <div className={`text-[10px] font-sans font-bold mt-2 uppercase tracking-tight ${detectionDetails.days_remaining !== undefined && detectionDetails.days_remaining <= 7
                                  ? 'text-[#9B4354]'
                                  : 'text-[#4D5B66]'
                                  }`}>
                                  {format(new Date(detectionDetails.deadline_date), 'dd_MMM_yyyy')}
                                </div>
                              </div>
                            )}
                            {detectionDetails.days_remaining !== undefined && (
                              <div className="bg-[#F7FAFC] border border-[#E7EEF2] rounded-xl p-4">
                                <div className="text-[11px] font-medium tracking-tight text-[#66737F]">Time remaining</div>
                                <div className={`text-[10px] font-sans font-bold mt-2 uppercase tracking-tight ${detectionDetails.days_remaining <= 3 ? 'text-red-500' :
                                  detectionDetails.days_remaining <= 7 ? 'text-[#9B4354]' :
                                    'text-[#4D5B66]'
                                  }`}>
                                  {detectionDetails.days_remaining} days remaining
                                </div>
                              </div>
                            )}
                            {detectionDetails.created_at && (
                              <div className="bg-[#F7FAFC] border border-[#E7EEF2] rounded-xl p-4">
                                <div className="text-[11px] font-medium tracking-tight text-[#66737F]">Record created</div>
                                <div className="text-[10px] font-sans font-bold text-[#4D5B66] mt-2 uppercase tracking-tight">
                                  {format(new Date(detectionDetails.created_at), 'dd_MMM_yyyy HH:mm')}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>


                        {/* Related Event IDs */}
                        {detectionDetails.related_event_ids && detectionDetails.related_event_ids.length > 0 && (
                          <div className="space-y-4">
                            <h4 className="font-lora text-[18px] font-normal tracking-tight text-[#182026]">Linked transactions</h4>
                            <div className="flex flex-wrap gap-2">
                              {detectionDetails.related_event_ids.map((eventId: string, idx: number) => (
                                <Badge key={idx} variant="outline" className="font-sans font-bold text-[9px] bg-white/5 border-[#DCE8EE] text-[#4D5B66] uppercase tracking-tight">
                                  {eventId}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Evidence Data */}
                        {detectionDetails.evidence && (
                          <div className="space-y-4">
                            <h4 className="font-lora text-[18px] font-normal tracking-tight text-[#182026]">Source evidence</h4>
                            <div className="bg-[#F7FAFC] border border-[#E7EEF2] rounded-xl p-4 max-h-48 overflow-auto">
                              <pre className="text-[9px] font-sans font-bold text-[#66737F] uppercase tracking-tight">
                                {JSON.stringify(detectionDetails.evidence, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}

                        {/* Details/Description */}
                        {detectionDetails.details && (
                          <div className="space-y-4">
                            <h4 className="font-lora text-[18px] font-normal tracking-tight text-[#182026]">Recovery narrative</h4>
                            <p className="rounded-md border border-[#E7EEF2] bg-[#F7FAFC] p-4 text-[11px] leading-5 text-[#4D5B66]">{detectionDetails.details}</p>
                          </div>
                        )}


                        {/* Claim Timeline & Escalation */}
                        <div className="border-t border-[#E7EEF2] pt-6">
                          <ClaimNegotiationTimeline
                            claim={detectionDetails}
                            maxEscalations={2}
                            onEscalate={(playbook) => {
                              toast({
                                title: `Escalation: ${playbook.label}`,
                                description: playbook.autoTriggerable
                                  ? 'Auto-escalation initiated with updated evidence package.'
                                  : 'Manual review required. Check playbook actions above.',
                              });
                            }}
                          />
                        </div>
                      </div>
                    )}
                    <DialogFooter className="flex gap-3 border-t border-[#E7EEF2] bg-[#FAFAF7] px-6 py-4">

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDetailsModalOpen(false)}
                        className="h-10 rounded-md border border-[#DCE8EE] bg-white px-4 text-[11px] font-medium tracking-tight text-[#4D5B66] hover:bg-[#F7FAFC] hover:text-[#182026]">
                        Close
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          setEvidencePackClaim(detectionDetails);
                          setEvidencePackOpen(true);
                          setDetailsModalOpen(false);
                        }}
                        className="h-10 rounded-md border border-[#0B74DE] bg-[#0B74DE] px-4 text-[11px] font-medium tracking-tight text-white hover:bg-[#0968C8]">
                        View evidence package
                      </Button>

                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                {/* Evidence Matching Tab (Agent 6) */}
                <TabsContent value="matching" className="mt-0">
                  <EvidenceMatchingTable />
                </TabsContent>

                {/* Dispute Cases Tab (Agent 7) */}
                <TabsContent value="cases" className="mt-0">
                  <DisputeCasesTable />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div >
      </div >
    </PageLayout >
  );
}
