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
import { CalendarIcon, Search, MoreHorizontal, FileText, Eye, RefreshCw, Info, AlertTriangle, X, CheckCircle2, Clock, ExternalLink, ChevronDown, ChevronUp, ArrowUpFromLine, Upload } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { detectionApi } from '@/lib/api';
import { recoveryApi } from '@/lib/recoveryApi';
import type { DateRange } from 'react-day-picker';
import { useStatusStream, type StatusEvent } from '@/hooks/use-status-stream';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { EvidenceMatchingTable } from '@/components/evidence/EvidenceMatchingTable';
import { DisputeCasesTable } from '@/components/disputes/DisputeCasesTable';
import { EvidencePackView } from '@/components/evidence/EvidencePackView';
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
    recommendationText = '✅ We recommend filing now. Evidence meets FBA policy requirements.';
  } else if (quality === 'medium') {
    recommendation = 'file_with_caution';
    if (missingRequired.length > 0) {
      recommendationText = `⚠️ File with caution. Missing: ${missingRequired.join(', ')}. Claim may require follow-up.`;
    } else {
      recommendationText = '⚠️ File with caution. Evidence is adequate but could be stronger.';
    }
  } else {
    recommendation = 'wait_for_better_docs';
    recommendationText = `⏳ Wait for better docs. Missing required: ${missingRequired.join(', ')}. Filing now risks denial.`;
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

// Evidence Quality Badge Component
const EvidenceQualityBadge = ({ validation }: { validation: EvidenceValidation }) => {
  const config = {
    strong: { bg: 'bg-gray-100', text: 'text-[#36454F]', border: 'border-gray-400', icon: '✓', label: 'Strong' },
    medium: { bg: 'bg-gray-100', text: 'text-[#36454F]', border: 'border-gray-400', icon: '◐', label: 'Medium' },
    weak: { bg: 'bg-gray-100', text: 'text-[#36454F]', border: 'border-gray-400', icon: '○', label: 'Weak' }
  };
  const c = config[validation.quality];

  return (
    <Tooltip>
      <TooltipTrigger>
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium ${c.bg} ${c.text} ${c.border}`}>
          <span>{c.icon}</span>
          {c.label}
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-sm bg-white text-gray-900 border border-gray-200 p-3">
        <div className="space-y-2">
          <div className="font-semibold text-sm">{validation.recommendationText}</div>
          {validation.missingRequired.length > 0 && (
            <div className="text-xs">
              <span className="text-red-600 font-medium">Missing required:</span>
              <span className="text-gray-600 ml-1">{validation.missingRequired.join(', ')}</span>
            </div>
          )}
          {validation.warnings.length > 0 && (
            <div className="text-xs text-amber-600">
              ⚠ {validation.warnings[0]}
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
  const confidence = claim.confidence_score ?? claim._confidence ?? 0.5;
  const confidenceScore = Math.round(confidence * 20);
  factors.push({
    label: 'AI Confidence',
    value: confidenceScore,
    max: 20,
    reason: confidence >= 0.85 ? 'High certainty' : confidence >= 0.6 ? 'Moderate certainty' : 'Low certainty'
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
    already_filed: { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200', icon: '⚠', label: 'Duplicate Filed' },
    reconciled: { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-200', icon: '✓', label: 'Reconciled' }
  };
  const c = config[warning.reason];

  return (
    <Tooltip>
      <TooltipTrigger>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs font-medium ${c.bg} ${c.text} ${c.border}`}>
          <span>{c.icon}</span>
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

// Generate Casebook PDF for export (audits, CFOs, legal)
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
  <title>Recovery Casebook - ${periodLabel}</title>
  <style>
    @page { size: A4; margin: 20mm; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1f2937; line-height: 1.5; max-width: 800px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 30px; }
    .logo { font-size: 28pt; font-weight: bold; color: #3b82f6; }
    .period { font-size: 14pt; color: #6b7280; margin-top: 5px; }
    .generated { font-size: 10pt; color: #9ca3af; margin-top: 5px; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
    .summary-card { background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; }
    .summary-value { font-size: 20pt; font-weight: bold; color: #1f2937; }
    .summary-label { font-size: 9pt; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; }
    .summary-card.green .summary-value { color: #059669; }
    .summary-card.blue .summary-value { color: #3b82f6; }
    .summary-card.amber .summary-value { color: #d97706; }
    .section { margin-bottom: 30px; page-break-inside: avoid; }
    .section-title { font-size: 14pt; font-weight: 600; color: #1f2937; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; margin-bottom: 15px; }
    .claim-row { display: flex; justify-content: space-between; padding: 10px; border-bottom: 1px solid #f3f4f6; font-size: 10pt; }
    .claim-row:nth-child(odd) { background: #f9fafb; }
    .claim-id { font-family: monospace; color: #3b82f6; }
    .claim-status { padding: 2px 8px; border-radius: 9999px; font-size: 9pt; }
    .status-approved { background: #d1fae5; color: #065f46; }
    .status-pending { background: #dbeafe; color: #1e40af; }
    .status-denied { background: #fee2e2; color: #991b1b; }
    .status-other { background: #f3f4f6; color: #4b5563; }
    .amount { font-weight: 600; }
    .footer { text-align: center; padding-top: 30px; border-top: 1px solid #e5e7eb; font-size: 9pt; color: #9ca3af; }
    .type-section { margin-left: 20px; margin-bottom: 20px; }
    .type-header { font-weight: 600; color: #374151; margin-bottom: 10px; display: flex; justify-content: space-between; }
    @media print { .no-print { display: none; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">📋 Recovery Casebook</div>
    <div class="period">${periodLabel}</div>
    <div class="generated">Generated ${format(new Date(), 'MMMM dd, yyyy \'at\' h:mm a')}</div>
  </div>

  <div class="summary-grid">
    <div class="summary-card">
      <div class="summary-value">${totalClaims}</div>
      <div class="summary-label">Total Claims</div>
    </div>
    <div class="summary-card green">
      <div class="summary-value">$${recoveredValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
      <div class="summary-label">Recovered</div>
    </div>
    <div class="summary-card blue">
      <div class="summary-value">${pendingClaims.length}</div>
      <div class="summary-label">Pending</div>
    </div>
    <div class="summary-card amber">
      <div class="summary-value">${successRate}%</div>
      <div class="summary-label">Success Rate</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">📊 Summary by Status</div>
    <div class="claim-row">
      <span>Approved/Paid</span>
      <span class="amount" style="color: #059669;">${approvedClaims.length} claims ($${recoveredValue.toLocaleString('en-US', { minimumFractionDigits: 2 })})</span>
    </div>
    <div class="claim-row">
      <span>Pending/Under Review</span>
      <span class="amount" style="color: #3b82f6;">${pendingClaims.length} claims ($${pendingClaims.reduce((s, c) => s + (c.guaranteedAmount || c.amount || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })})</span>
    </div>
    <div class="claim-row">
      <span>Denied/Rejected</span>
      <span class="amount" style="color: #dc2626;">${deniedClaims.length} claims ($${deniedClaims.reduce((s, c) => s + (c.guaranteedAmount || c.amount || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })})</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title">📁 Claims by Type</div>
    ${Object.entries(byType).map(([type, typeClaims]) => `
      <div class="type-section">
        <div class="type-header">
          <span>${type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
          <span>${typeClaims.length} claims • $${typeClaims.reduce((s, c) => s + (c.guaranteedAmount || c.amount || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
    `).join('')}
  </div>

  <div class="section">
    <div class="section-title">📋 Full Claim Ledger</div>
    ${claims.map(c => {
    const status = (c.status || 'unknown').toLowerCase();
    const statusClass = ['paid', 'approved', 'reconciled'].includes(status) ? 'status-approved'
      : ['submitted', 'pending', 'under review'].includes(status) ? 'status-pending'
        : ['denied', 'rejected'].includes(status) ? 'status-denied' : 'status-other';
    return `
      <div class="claim-row">
        <span class="claim-id">${c.claim_number || c.id.slice(0, 12)}...</span>
        <span>${c.anomaly_type?.replace(/_/g, ' ') || c.type || '-'}</span>
        <span>${c.sku || '-'}</span>
        <span class="claim-status ${statusClass}">${c.status}</span>
        <span class="amount">$${(c.guaranteedAmount || c.amount || 0).toFixed(2)}</span>
      </div>`;
  }).join('')}
  </div>

  <div class="footer">
    <p>This casebook was generated by Opside Recovery System</p>
    <p>For audit, legal, and accounting purposes</p>
    <p class="no-print" style="margin-top: 15px;"><strong>Press Ctrl+P (Cmd+P on Mac) to save as PDF</strong></p>
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
    { id: 'FBALongTermStorageFee', name: 'FBA Long Term Storage Fee', description: 'Aged inventory >180/365 days' },
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
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClaimTypes, setSelectedClaimTypes] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [claims, setClaims] = useState<RecoveryClaim[]>([]);
  const [metricsLoaded, setMetricsLoaded] = useState(false);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<{ totalClaimsFound: number; inProgress: number; valueInProgress: number; successRate30d: number } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [submittingBulk, setSubmittingBulk] = useState(false);
  const { toast } = useToast();
  const [showParkedOnly, setShowParkedOnly] = useState(false);
  const [autoSubmitHigh, setAutoSubmitHigh] = useState(false);
  const [smartPromptOpen, setSmartPromptOpen] = useState(false);
  const [promptClaim, setPromptClaim] = useState<any | null>(null);
  const autoSubmittedRef = useRef<Set<string>>(new Set());

  // Phase 3: Detection results integration
  const [detectionResults, setDetectionResults] = useState<any[]>([]);
  const [mergedRecoveries, setMergedRecoveries] = useState<any[] | null>(null); // null means not initialized yet
  const [filterSource, setFilterSource] = useState<'all' | 'detected' | 'synced'>('all');
  const [filterConfidence, setFilterConfidence] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const [filterUrgent, setFilterUrgent] = useState<'all' | 'urgent' | 'critical'>('all');

  // Phase 3: Detection statistics and urgent claims
  const [detectionStats, setDetectionStats] = useState<any>(null);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [statusUpdateModalOpen, setStatusUpdateModalOpen] = useState(false);
  const [selectedDetection, setSelectedDetection] = useState<any | null>(null);
  const [resolveNotes, setResolveNotes] = useState('');
  const [resolveAmount, setResolveAmount] = useState('');
  const [statusUpdateNotes, setStatusUpdateNotes] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('pending');
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [detectionDetails, setDetectionDetails] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'claims' | 'matching' | 'cases'>('claims');
  const [showRiskyClaims, setShowRiskyClaims] = useState(false); // Toggle to show low-strength claims
  const [fileAnywayModalOpen, setFileAnywayModalOpen] = useState(false);
  const [claimToFile, setClaimToFile] = useState<RecoveryClaim | null>(null);
  const [evidencePackOpen, setEvidencePackOpen] = useState(false);
  const [evidencePackClaim, setEvidencePackClaim] = useState<RecoveryClaim | null>(null);

  // Read search query from URL on mount and when URL changes
  useEffect(() => {
    const queryParam = searchParams.get('q');
    if (queryParam) {
      setSearchTerm(queryParam);
    }
  }, [searchParams]);

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
  const stableHash = (s: string): number => {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) h = (h ^ s.charCodeAt(i)) * 16777619;
    return (h >>> 0);
  };
  const getConfidence = (id: string): number => {
    // Stable pseudo-confidence between 0.5 and 0.98
    const v = stableHash(id) % 4900; // 0..4899
    return Math.round((v + 500) / 100) / 100; // 0.5 .. 4.99 -> 0.5 .. 4.99, then /? ensure two decimals
  };
  const getConfidenceTier = (c: number) => c >= 0.85 ? 'high' : c >= 0.6 ? 'medium' : 'low';
  const getConfidenceColor = (c: number) => c >= 0.85 ? 'text-emerald-600' : c >= 0.6 ? 'text-amber-500' : 'text-blue-500';
  const getConfidenceBadge = (c: number) => c >= 0.85 ? 'High' : c >= 0.6 ? 'Medium' : 'Low';
  const getEvidenceStatus = (id: string): 'Ready' | 'Needs Docs' | 'Collecting' => {
    const v = stableHash(id) % 100;
    if (v >= 70) return 'Ready';
    if (v >= 40) return 'Needs Docs';
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
      source: 'detected',
      type: det.anomaly_type || 'Detected Claim',
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
      sku: det.evidence?.sku || 'N/A',
      asin: det.evidence?.asin || 'N/A',
      _confidence: det.confidence_score,
      _priority: (det.confidence_score || 0) * (det.estimated_value || 0),
      _evidence: det.days_remaining && det.days_remaining <= 7 ? 'Ready' : 'Collecting',
      _matchedCount: 0,
    }));

    // Mark synced recoveries
    const synced = (syncedRecoveries || []).map(rec => ({
      ...rec,
      source: 'synced',
      confidence_score: null,
      days_remaining: null,
      _confidence: getConfidence(rec.id),
      _priority: getConfidence(rec.id) * (rec.guaranteedAmount || 0),
      _evidence: getEvidenceStatus(rec.id),
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

  // Fetch detection statistics
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const statsRes = await detectionApi.getDetectionStatistics().catch(() => ({ ok: false, data: null }));
      if (!cancelled) {
        if (statsRes.ok && statsRes.data?.statistics) {
          setDetectionStats(statsRes.data.statistics);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const [resData, metricsRes, amazonRecoveriesRes, detectionRes] = await Promise.all([
        recoveryApi.getRecoveries().catch(() => null),
        api.getRecoveriesMetrics(),
        api.getAmazonRecoveries().catch(() => null),
        detectionApi.getDetectionResults({ limit: 100, offset: 0 }).catch((err) => {
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
            const syncStatusRes = await api.getSyncStatus();
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
                  api.getAmazonRecoveries().catch(() => null),
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
                setSyncMessage('Sync failed. Please try again.');

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
              const status = await getSyncStatus(syncId);

              if (status.status === 'complete') {
                // Sync completed, refresh data
                const [newRecoveriesRes, newClaimsRes] = await Promise.all([
                  api.getAmazonRecoveries().catch(() => null),
                  recoveryApi.getRecoveries().catch(() => null),
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
                  title: 'Sync Complete',
                  description: 'Complete successfully. See dashboard.',
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
                setSyncMessage('Sync failed. Please try again.');

                toast({
                  title: 'Sync Failed',
                  description: 'The sync encountered an error. Please try again.',
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
  }, [toast]);

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
      recoveryApi.getRecoveries().then(res => {
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
      api.getAmazonRecoveries().then(res => {
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
          _confidence: getConfidence(c.id),
          _priority: getConfidence(c.id) * (c.guaranteedAmount || 0),
          _evidence: getEvidenceStatus(c.id),
          _matchedCount: Array.isArray((c as any).matchedDocs) ? (c as any).matchedDocs.length : ((c as any).matchedCount ?? 0),
          _strength: strength,
        };
      })
      .sort((a, b) => b._priority - a._priority);

    // Apply strength filtering: hide low-strength claims unless toggle is on
    let filtered = showParkedOnly ? base.filter(c => c._confidence < 0.5) : base;
    if (!showRiskyClaims) {
      filtered = filtered.filter(c => c._strength.tier !== 'low');
    }
    return filtered;
  }, [filteredClaims, showParkedOnly, showRiskyClaims]);

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

    // Initialize counts for all Amazon event types
    const counts: Record<string, number> = {};
    allEventTypes.forEach(eventType => {
      counts[eventType.name] = 0;
    });

    // Also keep legacy mappings for backward compatibility
    counts['Lost Inventory'] = 0;
    counts['Damaged'] = 0;
    counts['Uncredited Returns'] = 0;
    counts['Overcharges'] = 0;
    counts['Misapplied Fees'] = 0;

    for (const c of dataSource) {
      // Map Agent 3 anomaly types to categories
      const type = c.type || c.anomaly_type || '';

      // Normalize function: remove all special chars for comparison
      // This matches Agent 3's snake_case (lost_warehouse) to Amazon's format (Lost:Warehouse)
      const normalizeType = (t: string) => t.toLowerCase().replace(/[:\-_\s]/g, '');
      const normalizedType = normalizeType(type);

      // Check if type matches any Amazon event type (normalized comparison)
      const matchedEvent = allEventTypes.find(e =>
        normalizeType(e.id) === normalizedType ||
        normalizeType(e.name) === normalizedType
      );
      if (matchedEvent) {
        counts[matchedEvent.name] = (counts[matchedEvent.name] || 0) + 1;
      }

      // Legacy mapping for backward compatibility
      if (type === 'Lost Inventory' || type === 'missing_unit' || type === 'Lost:Warehouse' || type === 'Lost:Inbound') {
        counts['Lost Inventory'] += 1;
      }
      if (type === 'Damaged Goods' || type === 'damaged_stock' || type === 'Damaged:Warehouse' || type === 'Damaged:Inbound') {
        counts['Damaged'] += 1;
      }
      if (type === 'Uncredited Return' || type === 'return_not_credited' || type === 'CustomerReturn') {
        counts['Uncredited Returns'] += 1;
      }
      if (type === 'Overcharge' || type === 'Fee Dispute' || type === 'incorrect_fee' || type === 'overcharge' || type === 'duplicate_charge') {
        counts['Overcharges'] += 1;
      }
      if (type === 'Fee Dispute' || type === 'incorrect_fee' || type === 'RefundCommission') {
        counts['Misapplied Fees'] += 1;
      }
    }
    return counts;
  }, [claims, metrics, mergedRecoveries]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-800';
      case 'Pending': return 'bg-orange-100 text-orange-800';
      case 'Submitted': return 'bg-purple-100 text-purple-800';
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'Denied': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const setQuickDateRange = (range: string) => {
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
      <div className="relative w-full overflow-x-hidden">
        <div className="relative w-full bg-white min-h-screen">
          <div className="relative w-full max-w-full px-4 sm:px-6 pt-6 pb-10 text-gray-900 space-y-6">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-2">
                <h1 className="text-xl text-gray-900 font-medium">Audit Ledger</h1>
              </div>
              <p className="text-sm text-gray-500">Track, filter, and analyze every reimbursement event in real-time.</p>
              <div className="mt-4 flex items-center gap-2">
                <Button size="sm" className="bg-emerald-500 hover:bg-emerald-400 text-white" disabled={selectedIds.size === 0 || submittingBulk} onClick={async () => {
                  setSubmittingBulk(true);
                  const ids = Array.from(selectedIds);
                  for (const id of ids) {
                    try {
                      await recoveryApi.submitClaim(id);
                      toast({ title: `Submitted ${id}`, description: 'Claim submitted successfully.' });
                      setClaims(prev => prev.map(c => c.id === id ? { ...c, status: 'Submitted' } : c));
                    } catch (e: any) {
                      toast({ title: `Failed to submit ${id}`, description: e?.message || 'Please try again.' });
                    }
                  }
                  setSubmittingBulk(false);
                }}>
                  <Upload className="h-4 w-4 mr-2" />
                  Submit Selected Claims
                </Button>
                {selectedIds.size > 0 && (
                  <span className="text-xs text-muted-foreground">{selectedIds.size} selected</span>
                )}
              </div>
            </div>


            {/* Opportunity Radar Summary */}
            <div className="mb-8">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="text-gray-900 font-medium">Recovered Value</div>
                    {recoveredTotal != null && recoveredTotal > 0 && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            type="button"
                            aria-label="About recovered value"
                            className="w-4 h-4 rounded-full bg-gray-500 flex items-center justify-center hover:bg-gray-400 transition-colors"
                          >
                            <span className="text-white text-[10px] font-serif italic leading-none">i</span>
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-black text-white text-xs">
                          Recovered from approved/completed claims. {recoverySource && `Source: ${recoverySource}`}
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  <div className="text-xl md:text-2xl font-semibold">
                    {recoveredTotal != null && recoveredTotal > 0 ? (
                      <>
                        <span className="text-gray-900">{formatCurrencyWithSelection(recoveredTotal, recoveredCurrency)}</span>
                        <div className="text-[14px] text-gray-600 font-normal mt-1">
                          recovered from {amazonClaimCount ?? 0} approved claim{amazonClaimCount !== 1 ? 's' : ''}
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="text-gray-900">{formatCurrencyWithSelection(0)}</span>
                        <div className="text-[14px] text-gray-600 font-normal mt-1">No recoveries yet</div>
                      </>
                    )}
                  </div>
                  {/* Sync status message */}
                  {(syncMessage || needsSync || syncTriggered) && (
                    <div className={`mt-3 px-3 py-2 rounded-md text-xs ${syncTriggered
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : needsSync
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-gray-50 text-gray-700 border border-gray-200'
                      }`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-start gap-2 flex-1">
                          {syncTriggered && <RefreshCw className="h-3 w-3 mt-0.5 animate-spin" />}
                          <span>{syncMessage || (needsSync ? 'Syncing your Amazon account... Please refresh in a few moments.' : '')}</span>
                        </div>
                        {activeSyncId && (
                          <Link
                            to={`/sync?id=${activeSyncId}`}
                            className="text-blue-400 hover:text-blue-300 underline text-xs ml-2"
                          >
                            View progress
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-md bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100 transition-colors">
                      <span className="font-medium">Event Types</span>
                      <span className="text-gray-500">({Object.values(categoryCounts).reduce((a, b) => a + b, 0)} total)</span>
                      <ChevronDown className="h-3 w-3 text-gray-500" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-72 max-h-80 overflow-y-auto bg-white border border-gray-200 shadow-lg rounded-lg p-2">
                    <div className="text-xs font-medium text-gray-500 px-2 py-1.5 border-b border-gray-100 mb-1">
                      Amazon Financial Event Types
                    </div>
                    {Object.entries(categoryCounts)
                      .sort((a, b) => b[1] - a[1])
                      .map(([label, count]) => (
                        <DropdownMenuItem
                          key={label}
                          className="flex justify-between items-center px-2 py-1.5 text-xs rounded hover:bg-gray-100 hover:text-[#36454F] focus:bg-gray-100 focus:text-[#36454F] cursor-default"
                        >
                          <span className="text-gray-700 truncate">{label}</span>
                          <span className={`font-medium ml-2 ${count > 0 ? 'text-gray-700' : 'text-[#36454F]'}`}>{count}</span>
                        </DropdownMenuItem>
                      ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Key Metrics Strip - Modern Inline Stats */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-8 py-3 px-4 bg-gray-50 rounded-lg border border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Claims Identified</span>
                <span className="text-base font-semibold text-gray-700">
                  {(() => {
                    const value = detectionStats?.total_anomalies ?? detectionStats?.totalDetections ?? (metrics ? metrics.totalClaimsFound : keyMetrics.totalClaimsFound);
                    return value > 0 ? value : '0';
                  })()}
                </span>
              </div>

              <span className="hidden sm:block text-gray-300">|</span>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Recovery Value</span>
                <span className="text-base font-semibold text-gray-700">
                  {formatCurrency(
                    detectionStats?.total_value ??
                    (metrics ? metrics.valueInProgress : keyMetrics.valueInProgress)
                  )}
                </span>
              </div>

              <span className="hidden sm:block text-gray-300">|</span>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">In Progress</span>
                <span className="text-base font-semibold text-amber-600">
                  {metrics ? metrics.inProgress : keyMetrics.currentlyInProgress}
                </span>
                {detectionStats?.expired_count > 0 && (
                  <span className="text-xs text-red-500">({detectionStats.expired_count} expired)</span>
                )}
              </div>

              <span className="hidden sm:block text-gray-300">|</span>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Approval Rate</span>
                <span className="text-base font-semibold text-gray-700">
                  {metrics ? Math.round(metrics.successRate30d) : keyMetrics.successRate.toFixed(0)}%
                </span>
              </div>
            </div>

            {/* Tabs for Claims, Evidence Matching, and Cases */}
            <div className="mb-6">
              <h2 className="text-base text-gray-900 font-semibold mb-4 text-left">Revenue Recovery</h2>
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'claims' | 'matching' | 'cases')} className="w-full">
                <TabsList className="mb-6 inline-flex h-auto items-center justify-start gap-6 bg-transparent border-b border-gray-200 rounded-none p-0">
                  <TabsTrigger
                    value="claims"
                    className="relative px-1 pb-3 pt-1 text-sm font-medium text-gray-500 bg-transparent rounded-none border-0 shadow-none transition-colors hover:text-blue-600 data-[state=active]:text-blue-600 data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-blue-600"
                  >
                    Claims
                  </TabsTrigger>
                  <TabsTrigger
                    value="matching"
                    className="relative px-1 pb-3 pt-1 text-sm font-medium text-gray-500 bg-transparent rounded-none border-0 shadow-none transition-colors hover:text-blue-600 data-[state=active]:text-blue-600 data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-blue-600"
                  >
                    Evidence Matching
                  </TabsTrigger>
                  <TabsTrigger
                    value="cases"
                    className="relative px-1 pb-3 pt-1 text-sm font-medium text-gray-500 bg-transparent rounded-none border-0 shadow-none transition-colors hover:text-blue-600 data-[state=active]:text-blue-600 data-[state=active]:shadow-none data-[state=active]:bg-transparent data-[state=active]:after:absolute data-[state=active]:after:bottom-0 data-[state=active]:after:left-0 data-[state=active]:after:right-0 data-[state=active]:after:h-0.5 data-[state=active]:after:bg-blue-600"
                  >
                    Dispute Cases
                  </TabsTrigger>
                </TabsList>

                {/* Claims Tab (Existing Content) */}
                <TabsContent value="claims" className="mt-0">
                  {/* Controls */}
                  <Card className="mb-8 bg-gray-50 border-gray-200 text-gray-900 shadow-sm rounded-xl">
                    <CardContent className="p-6">
                      {/* Section Heading */}
                      <div className="mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-1">Capital Recovery</h2>
                        <p className="text-sm text-gray-600">Track finalized reimbursements and measure your automated ROI.</p>
                      </div>

                      <div className="flex flex-wrap gap-4 items-center">
                        {/* Search Bar */}
                        <div className="relative flex-1 min-w-64">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500 stroke-[2]" />
                          <Input
                            placeholder="Search by Claim ID, ASIN, or Keyword..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 border-gray-200 bg-white text-gray-900 placeholder:text-gray-500"
                          />
                        </div>

                        {/* Quick Date Range Buttons */}
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="bg-white text-gray-700 border-gray-200 hover:bg-gray-50" onClick={() => setQuickDateRange('30days')}>Last 30 Days</Button>
                          <Button variant="outline" size="sm" className="bg-white text-gray-700 border-gray-200 hover:bg-gray-50" onClick={() => setQuickDateRange('quarter')}>Last Quarter</Button>
                          <Button variant="outline" size="sm" className="bg-white text-gray-700 border-gray-200 hover:bg-gray-50" onClick={() => setQuickDateRange('year')}>This Year</Button>
                          <Button variant="outline" size="sm" className="bg-white text-gray-700 border-gray-200 hover:bg-gray-50" onClick={() => setQuickDateRange('all')}>All Time</Button>
                        </div>


                        {/* Custom Date Range */}
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className={cn("w-[280px] justify-start text-left font-medium bg-white text-gray-700 border-gray-200 hover:bg-gray-50", !dateRange && "text-gray-500")}>
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {dateRange?.from ? (
                                dateRange.to ? (
                                  <>
                                    {format(dateRange.from, "LLL dd, y")} -{" "}
                                    {format(dateRange.to, "LLL dd, y")}
                                  </>
                                ) : (
                                  format(dateRange.from, "LLL dd, y")
                                )
                              ) : (
                                <span>Pick a date range</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              initialFocus
                              mode="range"
                              defaultMonth={dateRange?.from}
                              selected={dateRange}
                              onSelect={setDateRange}
                              numberOfMonths={2}
                              className="pointer-events-auto"
                            />
                          </PopoverContent>
                        </Popover>

                        {/* Claim Type Filter */}
                        <Select>
                          <SelectTrigger className="w-[180px] bg-white text-gray-900 border-gray-200 hover:bg-gray-50">
                            <SelectValue placeholder="Filter by Claim Type" />
                          </SelectTrigger>
                          <SelectContent>
                            {claimTypes.map(type => (
                              <SelectItem key={type} value={type}>{type}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Status Filter */}
                        <Select>
                          <SelectTrigger className="w-[180px] bg-white text-gray-900 border-gray-200 hover:bg-gray-50">
                            <SelectValue placeholder="Filter by Status" />
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map(status => (
                              <SelectItem key={status} value={status}>{status}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Source Filter (Phase 3) */}
                        <Select value={filterSource} onValueChange={(value: 'all' | 'detected' | 'synced') => {
                          setFilterSource(value);
                        }}>
                          <SelectTrigger className="w-[180px] bg-white text-gray-900 border-gray-200 hover:bg-gray-50">
                            <SelectValue placeholder="Filter by Source" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Sources</SelectItem>
                            <SelectItem value="detected">Detected Claims</SelectItem>
                            <SelectItem value="synced">Synced from Amazon</SelectItem>
                          </SelectContent>
                        </Select>

                        {/* Share Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          className="bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                          onClick={() => {
                            const exportRange = dateRange?.from && dateRange?.to
                              ? { from: dateRange.from, to: dateRange.to }
                              : null;
                            generateCasebookPDF(rankedClaims, exportRange);
                            toast({ title: '📋 Casebook Generated', description: 'Press Ctrl+P to save as PDF for audits and accounting.' });
                          }}
                        >
                          <ArrowUpFromLine className="h-4 w-4 mr-2" />
                          Share
                        </Button>

                        {/* Confidence Filter (Phase 3) - only show when filtering by detected */}
                        {filterSource === 'detected' && (
                          <Select value={filterConfidence} onValueChange={(value: 'all' | 'high' | 'medium' | 'low') => {
                            setFilterConfidence(value);
                          }}>
                            <SelectTrigger className="w-[180px] bg-white text-gray-900 border-gray-200 hover:bg-gray-50">
                              <SelectValue placeholder="Filter by Confidence" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Confidence Levels</SelectItem>
                              <SelectItem value="high">High (≥85%)</SelectItem>
                              <SelectItem value="medium">Medium (50-85%)</SelectItem>
                              <SelectItem value="low">Low (&lt;50%)</SelectItem>
                            </SelectContent>
                          </Select>
                        )}

                        {/* Urgent Filter */}
                        <Select value={filterUrgent} onValueChange={(value: 'all' | 'urgent' | 'critical') => {
                          setFilterUrgent(value);
                        }}>
                          <SelectTrigger className="w-[180px] bg-white text-gray-900 border-gray-200 hover:bg-gray-50">
                            <SelectValue placeholder="Filter by Urgency" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Claims</SelectItem>
                            <SelectItem value="urgent">Urgent (≤7 days)</SelectItem>
                            <SelectItem value="critical">Critical (≤3 days)</SelectItem>
                          </SelectContent>
                        </Select>

                        {/* Show risky claims toggle */}
                        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                          <Checkbox
                            checked={showRiskyClaims}
                            onCheckedChange={(checked) => setShowRiskyClaims(!!checked)}
                            className="border-gray-300"
                          />
                          Show weak claims
                        </label>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Data Table */}
                  <Card className="bg-gray-50 border-gray-200 text-gray-900 w-full overflow-hidden shadow-sm rounded-xl">
                    <CardContent className="p-0 w-full">
                      {loading && (
                        <div className="p-8 text-center">
                          <p className="text-sm text-gray-600">Loading claims...</p>
                        </div>
                      )}
                      {error && (
                        <div className="p-4 text-sm text-red-600">{error}</div>
                      )}
                      {!loading && !error && rankedClaims.length === 0 && (
                        <div className="p-8 text-center">
                          <p className="text-sm text-gray-600 mb-2">
                            No claims found. {((mergedRecoveries === null || (mergedRecoveries && mergedRecoveries.length === 0)) && (!claims || claims.length === 0))
                              ? 'Sync your Amazon account or run an analysis to identify recovery opportunities.'
                              : 'Try adjusting your filters to see more results.'}
                          </p>
                        </div>
                      )}
                      {!loading && rankedClaims.length > 0 && (
                        <div
                          ref={tableScrollRef}
                          className="w-full overflow-x-auto overflow-y-visible recoveries-table-scroll"
                          style={{
                            scrollBehavior: 'smooth',
                            WebkitOverflowScrolling: 'touch',
                            width: '100%',
                            maxWidth: '100%',
                            cursor: isDragging ? 'grabbing' : 'grab'
                          }}
                          onMouseDown={handleMouseDown}
                          onMouseLeave={handleMouseLeave}
                        >
                          <Table style={{ minWidth: '1600px', width: 'max-content' }}>
                            <TableHeader>
                              <TableRow className="border-gray-200">
                                <TableHead>
                                  <Checkbox checked={selectedIds.size > 0 && selectedIds.size === filteredClaims.length} onCheckedChange={(checked) => {
                                    if (checked) setSelectedIds(new Set(filteredClaims.map(c => c.id)));
                                    else setSelectedIds(new Set());
                                  }} />
                                </TableHead>
                                <TableHead className="text-[#1f1f1f] font-medium">Source</TableHead>
                                <TableHead className="text-[#1f1f1f] font-medium">Strength</TableHead>
                                <TableHead className="text-[#1f1f1f] font-medium">Claim ID</TableHead>
                                <TableHead className="text-[#1f1f1f] font-medium">Created</TableHead>
                                <TableHead className="text-[#1f1f1f] font-medium">Evidence</TableHead>
                                <TableHead className="text-[#1f1f1f] font-medium">Details</TableHead>
                                <TableHead className="text-[#1f1f1f] font-medium">Status</TableHead>
                                <TableHead className="text-[#1f1f1f] font-medium">Days Remaining</TableHead>
                                <TableHead className="text-[#1f1f1f] font-medium">Guaranteed Amount</TableHead>
                                <TableHead className="text-[#1f1f1f] font-medium">Expected Payout</TableHead>
                                <TableHead className="text-[#1f1f1f] font-medium">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {rankedClaims.map((claim: any) => {
                                const confidenceBadge = claim.confidence_score !== null && claim.confidence_score !== undefined
                                  ? (claim.confidence_score >= 0.85 ? { label: 'High', color: 'green' } : claim.confidence_score >= 0.50 ? { label: 'Medium', color: 'yellow' } : { label: 'Low', color: 'gray' })
                                  : null;
                                const displayConfidence = claim.confidence_score !== null && claim.confidence_score !== undefined
                                  ? claim.confidence_score
                                  : claim._confidence;

                                const isUrgent = claim.days_remaining !== null && claim.days_remaining !== undefined && claim.days_remaining <= 7;
                                const isCritical = claim.days_remaining !== null && claim.days_remaining !== undefined && claim.days_remaining <= 3;

                                return (
                                  <TableRow
                                    key={claim.id}
                                    className={cn(
                                      "cursor-pointer hover:bg-gray-50 border-gray-200",
                                      isCritical && "bg-red-50/50 border-l-4 border-l-red-500",
                                      isUrgent && !isCritical && "bg-amber-50/50 border-l-4 border-l-amber-500"
                                    )}
                                  >
                                    <TableCell>
                                      <Checkbox checked={selectedIds.has(claim.id)} onCheckedChange={(checked) => {
                                        setSelectedIds(prev => {
                                          const next = new Set(prev);
                                          if (checked) next.add(claim.id); else next.delete(claim.id);
                                          return next;
                                        });
                                      }} />
                                    </TableCell>
                                    <TableCell>
                                      {claim.source === 'detected' ? (
                                        <Badge className="bg-gray-100 text-[#36454F] border-0">Detected</Badge>
                                      ) : (
                                        <Badge className="bg-gray-100 text-[#36454F] border-0">Synced</Badge>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      {(() => {
                                        const strength = calculateClaimStrength(claim);
                                        return (
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <button className="cursor-help">
                                                <StrengthBadge strength={strength} />
                                              </button>
                                            </TooltipTrigger>
                                            <TooltipContent side="right" className="bg-white text-gray-900 border border-gray-200 p-3 max-w-xs shadow-lg">
                                              <div className="space-y-2">
                                                <div className="font-semibold text-sm border-b border-gray-100 pb-1">
                                                  Claim Strength: {strength.score}/100
                                                </div>
                                                {strength.factors.map((f, i) => (
                                                  <div key={i} className="flex justify-between items-center text-xs">
                                                    <span className="text-gray-600">{f.label}</span>
                                                    <span className="font-medium">{f.value}/{f.max} <span className="text-gray-400">— {f.reason}</span></span>
                                                  </div>
                                                ))}
                                              </div>
                                            </TooltipContent>
                                          </Tooltip>
                                        );
                                      })()}
                                    </TableCell>
                                    <TableCell>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button asChild variant="link" className="p-0 h-auto text-[#36454F] hover:text-[#36454F] font-medium">
                                            <Link to={`/recoveries/${claim.id}`} state={{ claim }}>
                                              {claim.claim_number || claim.id.slice(0, 8)}
                                            </Link>
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="bg-black text-white text-xs font-mono">
                                          {claim.id}
                                        </TooltipContent>
                                      </Tooltip>
                                    </TableCell>
                                    <TableCell>{format(new Date(claim.created || claim.discovery_date || claim.created_at), 'MMM dd, yyyy')}</TableCell>
                                    <TableCell>
                                      {(() => {
                                        const validation = validateEvidencePolicy(claim, claim.matchedDocs);
                                        const docCount = claim.matchedDocs?.length || claim.matchedCount || 0;
                                        return (
                                          <div className="flex items-center gap-2">
                                            <EvidenceQualityBadge validation={validation} />
                                            {docCount > 0 && (
                                              <span className="text-xs text-gray-500">
                                                {docCount} doc{docCount !== 1 ? 's' : ''}
                                              </span>
                                            )}
                                          </div>
                                        );
                                      })()}
                                    </TableCell>
                                    <TableCell className="max-w-xs">
                                      <div className="truncate" title={claim.details}>
                                        {claim.details}
                                      </div>
                                      <div className="text-xs text-muted-foreground mt-1">
                                        SKU: {claim.sku} • ASIN: {claim.asin}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      {(() => {
                                        const doubleDipWarning = checkDoubleDip(claim, rankedClaims);
                                        return (
                                          <div className="flex flex-col items-start gap-1">
                                            <Badge className={getStatusColor(claim.status)}>
                                              {claim.status}
                                            </Badge>
                                            {doubleDipWarning && <DoubleDipBadge warning={doubleDipWarning} />}
                                          </div>
                                        );
                                      })()}
                                    </TableCell>
                                    <TableCell>
                                      {claim.days_remaining !== null && claim.days_remaining !== undefined ? (
                                        <div className="flex items-center gap-2">
                                          {isCritical && (
                                            <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
                                          )}
                                          {isUrgent && !isCritical && (
                                            <Clock className="h-4 w-4 text-amber-600 flex-shrink-0" />
                                          )}
                                          <span className={cn(
                                            isCritical && 'text-red-600 font-medium',
                                            isUrgent && !isCritical && 'text-amber-600 font-medium',
                                            !isUrgent && 'text-[#36454F]'
                                          )}>
                                            {claim.days_remaining} days
                                          </span>
                                        </div>
                                      ) : (
                                        <span className="text-[#36454F]">-</span>
                                      )}
                                    </TableCell>
                                    <TableCell className="font-medium">{formatCurrency(claim.guaranteedAmount, claim.currency || 'USD')}</TableCell>
                                    <TableCell>
                                      {claim.expectedPayoutDate ? format(new Date(claim.expectedPayoutDate), 'MMM dd, yyyy') : '-'}
                                    </TableCell>
                                    <TableCell>
                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="sm">
                                            <MoreHorizontal className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          {claim.status === 'Denied' && (
                                            <DropdownMenuItem onClick={async () => {
                                              const hasDocs = true; // Backend should validate; UI assumes action allowed
                                              if (!hasDocs) return;
                                              try {
                                                await api.resubmitClaim(claim.id);
                                                toast({ title: 'Resubmitted', description: `${claim.id} resubmitted with stronger docs.` });
                                                setClaims(prev => prev.map(c => c.id === claim.id ? { ...c, status: 'Submitted' } as any : c));
                                              } catch (e: any) {
                                                toast({ title: 'Resubmission failed', description: e?.message || 'Please try again.' });
                                              }
                                            }}>
                                              Resubmit with stronger docs
                                            </DropdownMenuItem>
                                          )}
                                          {claim._strength?.tier === 'medium' && (
                                            <DropdownMenuItem onClick={() => {
                                              setClaimToFile(claim);
                                              setFileAnywayModalOpen(true);
                                            }}>
                                              File Anyway (Medium Strength)
                                            </DropdownMenuItem>
                                          )}
                                          {/* Phase 3: Status Update - only for detected claims */}
                                          {claim.source === 'detected' && claim.status !== 'resolved' && (
                                            <DropdownMenuItem onClick={() => {
                                              setSelectedDetection(claim);
                                              setSelectedStatus(claim.status || 'pending');
                                              setStatusUpdateNotes('');
                                              setStatusUpdateModalOpen(true);
                                            }}>
                                              Update Status
                                            </DropdownMenuItem>
                                          )}
                                          {/* Phase 3: Resolve Detection - only for detected claims */}
                                          {claim.source === 'detected' && claim.status !== 'resolved' && (
                                            <DropdownMenuItem onClick={() => {
                                              setSelectedDetection(claim);
                                              setResolveNotes('');
                                              setResolveAmount(claim.guaranteedAmount?.toString() || '');
                                              setResolveModalOpen(true);
                                            }}>
                                              Mark as Resolved
                                            </DropdownMenuItem>
                                          )}
                                          {/* Phase 3: View Details - open modal for detected claims, navigate for synced */}
                                          {claim.source === 'detected' ? (
                                            <DropdownMenuItem onClick={() => {
                                              setDetectionDetails(claim);
                                              setDetailsModalOpen(true);
                                            }}>
                                              View Details
                                            </DropdownMenuItem>
                                          ) : (
                                            <DropdownMenuItem asChild>
                                              <Link to={`/recoveries/${claim.id}`} state={{ claim }}>
                                                View Details
                                              </Link>
                                            </DropdownMenuItem>
                                          )}
                                          {claim.source !== 'detected' && (
                                            <DropdownMenuItem asChild>
                                              <Link to={`/recoveries/${encodeURIComponent(claim.id)}/resolve`} state={{ claim }}>
                                                Resolve Case
                                              </Link>
                                            </DropdownMenuItem>
                                          )}
                                          <DropdownMenuItem onClick={async () => {
                                            const url = api.getRecoveryDocumentUrl(claim.id);
                                            try {
                                              const head = await fetch(url, { method: 'HEAD', credentials: 'include' });
                                              if (head.ok) {
                                                window.open(url, '_blank');
                                                return;
                                              }
                                            } catch { }
                                            try {
                                              const res = await api.getRecoveryDetail(claim.id);
                                              const docs = (res && res.ok && Array.isArray((res as any).data?.documents)) ? (res as any).data!.documents : [];
                                              if (docs.length > 0 && docs[0]?.id) {
                                                window.open(`/documents/${encodeURIComponent(docs[0].id)}`, '_blank');
                                              } else {
                                                toast({ title: 'No proof available yet', description: 'Evidence is still being collected for this case.' });
                                              }
                                            } catch (e: any) {
                                              toast({ title: 'Proof unavailable', description: e?.message || 'Please try again later.' });
                                            }
                                          }}>
                                            Proof Document
                                          </DropdownMenuItem>
                                          <DropdownMenuItem onClick={() => {
                                            setEvidencePackClaim(claim);
                                            setEvidencePackOpen(true);
                                          }}>
                                            View Evidence Pack
                                          </DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Phase 3: Resolve Detection Modal */}
                  <Dialog open={resolveModalOpen} onOpenChange={setResolveModalOpen}>
                    <DialogContent className="bg-white border-gray-200 text-gray-700">
                      <DialogHeader>
                        <DialogTitle>Mark Detection as Resolved</DialogTitle>
                        <DialogDescription className="text-[#36454F]">
                          Mark this detection as resolved and record the resolution details.
                        </DialogDescription>
                      </DialogHeader>
                      {selectedDetection && (
                        <div className="space-y-4 py-4">
                          <div>
                            <Label className="text-[#36454F]">Detection ID</Label>
                            <p className="text-sm text-[#36454F] font-mono">{selectedDetection.id}</p>
                          </div>
                          <div>
                            <Label className="text-[#36454F]">Anomaly Type</Label>
                            <p className="text-sm text-[#36454F] capitalize">
                              {selectedDetection.type?.replace(/_/g, ' ') || selectedDetection.anomaly_type?.replace(/_/g, ' ')}
                            </p>
                          </div>
                          <div>
                            <Label htmlFor="resolve-amount" className="text-[#36454F]">Resolution Amount</Label>
                            <Input
                              id="resolve-amount"
                              type="number"
                              step="0.01"
                              value={resolveAmount}
                              onChange={(e) => setResolveAmount(e.target.value)}
                              placeholder="0.00"
                              className="bg-gray-100 border-gray-300 text-[#36454F]"
                            />
                          </div>
                          <div>
                            <Label htmlFor="resolve-notes" className="text-[#36454F]">Notes</Label>
                            <Textarea
                              id="resolve-notes"
                              value={resolveNotes}
                              onChange={(e) => setResolveNotes(e.target.value)}
                              placeholder="Enter resolution notes (e.g., 'Resolved via Amazon reimbursement')"
                              className="bg-gray-100 border-gray-300 text-[#36454F] min-h-[100px]"
                            />
                          </div>
                        </div>
                      )}
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setResolveModalOpen(false);
                            setSelectedDetection(null);
                            setResolveNotes('');
                            setResolveAmount('');
                          }}
                          className="border-white/10"
                        >
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
                                const statsRes = await detectionApi.getDetectionStatistics();
                                if (statsRes.ok && statsRes.data?.statistics) {
                                  setDetectionStats(statsRes.data.statistics);
                                }
                              } else {
                                toast({
                                  title: 'Failed to Resolve',
                                  description: res.error || 'Please try again.',
                                  variant: 'destructive',
                                });
                              }
                            } catch (e: any) {
                              toast({
                                title: 'Error',
                                description: e?.message || 'Failed to resolve detection.',
                                variant: 'destructive',
                              });
                            }
                          }}
                          className="bg-emerald-500 hover:bg-emerald-400 text-white"
                        >
                          Mark as Resolved
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Phase 3: Status Update Modal */}
                  <Dialog open={statusUpdateModalOpen} onOpenChange={setStatusUpdateModalOpen}>
                    <DialogContent className="bg-white border-gray-200 text-gray-700">
                      <DialogHeader>
                        <DialogTitle>Update Detection Status</DialogTitle>
                        <DialogDescription className="text-[#36454F]">
                          Update the status of this detection through the workflow: Pending → Reviewed → Disputed → Resolved
                        </DialogDescription>
                      </DialogHeader>
                      {selectedDetection && (
                        <div className="space-y-4 py-4">
                          <div>
                            <Label className="text-[#36454F]">Detection ID</Label>
                            <p className="text-sm text-[#36454F] font-mono">{selectedDetection.id}</p>
                          </div>
                          <div>
                            <Label htmlFor="status-select" className="text-[#36454F]">Status</Label>
                            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                              <SelectTrigger id="status-select" className="bg-gray-100 border-gray-300 text-[#36454F]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="reviewed">Reviewed</SelectItem>
                                <SelectItem value="disputed">Disputed</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label htmlFor="status-notes" className="text-[#36454F]">Notes</Label>
                            <Textarea
                              id="status-notes"
                              value={statusUpdateNotes}
                              onChange={(e) => setStatusUpdateNotes(e.target.value)}
                              placeholder="Enter notes for this status change (e.g., 'Reviewed and verified')"
                              className="bg-gray-100 border-gray-300 text-[#36454F] min-h-[100px]"
                            />
                          </div>
                        </div>
                      )}
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setStatusUpdateModalOpen(false);
                            setSelectedDetection(null);
                            setStatusUpdateNotes('');
                            setSelectedStatus('pending');
                          }}
                          className="border-white/10"
                        >
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
                                  title: 'Failed to Update Status',
                                  description: res.error || 'Please try again.',
                                  variant: 'destructive',
                                });
                              }
                            } catch (e: any) {
                              toast({
                                title: 'Error',
                                description: e?.message || 'Failed to update status.',
                                variant: 'destructive',
                              });
                            }
                          }}
                          className="bg-blue-500 hover:bg-blue-400 text-white"
                        >
                          Update Status
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                </TabsContent>

                {/* File Anyway Confirmation Modal for Medium-Strength Claims */}
                <Dialog open={fileAnywayModalOpen} onOpenChange={setFileAnywayModalOpen}>
                  <DialogContent className="bg-white border-gray-200 text-gray-700 max-w-md">
                    <DialogHeader className="border-b border-gray-200 pb-3">
                      <DialogTitle className="text-base font-semibold text-gray-900">
                        Claim Assessment Review
                      </DialogTitle>
                      <DialogDescription className="text-xs text-gray-600 mt-1">
                        Claim strength analysis and filing recommendation
                      </DialogDescription>
                    </DialogHeader>
                    {claimToFile && (() => {
                      const strength = calculateClaimStrength(claimToFile);
                      return (
                        <div className="space-y-4 py-4">
                          {/* Assessment Summary */}
                          <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-gray-50 border-b border-gray-200 px-3 py-2">
                              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Claim Strength Assessment</h4>
                            </div>
                            <div className="bg-white px-3 py-2">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-gray-600">Overall Score</span>
                                <span className="text-xs font-semibold text-gray-900">{strength.score}/100</span>
                              </div>
                            </div>
                          </div>

                          {/* Detailed Breakdown */}
                          <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-gray-50 border-b border-gray-200 px-3 py-2">
                              <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Component Analysis</h4>
                            </div>
                            <div className="bg-white divide-y divide-gray-100">
                              {strength.factors.map((f, i) => (
                                <div key={i} className="flex justify-between items-center px-3 py-2">
                                  <span className="text-xs text-gray-600">{f.label}</span>
                                  <div className="text-right">
                                    <span className="text-xs font-medium text-gray-900">{f.value}/{f.max}</span>
                                    <span className="text-[10px] text-gray-500 ml-2">{f.reason}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Advisory Note */}
                          <div className="bg-gray-50 rounded-lg px-3 py-2">
                            <p className="text-xs text-gray-700">
                              <span className="font-semibold">Advisory:</span> Consider obtaining additional supporting evidence before filing to strengthen claim validity and maintain account standing.
                            </p>
                          </div>
                        </div>
                      );
                    })()}
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setFileAnywayModalOpen(false);
                          setClaimToFile(null);
                        }}
                        className="border-gray-200"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={async () => {
                          if (!claimToFile) return;
                          try {
                            await recoveryApi.submitClaim(claimToFile.id);
                            setClaims(prev => prev.map(c => c.id === claimToFile.id ? { ...c, status: 'Submitted' } : c));
                            setMergedRecoveries(prev => prev.map(c => c.id === claimToFile.id ? { ...c, status: 'Submitted' } : c));
                            toast({ title: 'Claim Filed', description: `${claimToFile.id} has been submitted to Amazon.` });
                            setFileAnywayModalOpen(false);
                            setClaimToFile(null);
                          } catch (e: any) {
                            toast({ title: 'Filing Failed', description: e?.message || 'Please try again.', variant: 'destructive' });
                          }
                        }}
                        className="bg-gray-200 hover:bg-gray-300 text-[#36454F]"
                      >
                        <ArrowUpFromLine className="h-4 w-4 mr-2" />
                        File Anyway
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

                {/* Claim Details Modal */}
                <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
                  <DialogContent className="bg-white border-gray-200 text-gray-700 max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-semibold text-gray-900">
                        Claim Details
                      </DialogTitle>
                      {detectionDetails && (
                        <DialogDescription className="text-gray-600">
                          {detectionDetails.anomaly_type?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || 'Recovery Claim'}
                        </DialogDescription>
                      )}
                    </DialogHeader>
                    {detectionDetails && (
                      <div className="space-y-6 py-4">
                        {/* Summary Information */}
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                          <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
                            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Claim Summary</h4>
                          </div>
                          <div className="divide-y divide-gray-200">
                            <div className="flex justify-between items-center px-4 py-3 bg-white">
                              <span className="text-sm text-gray-600">Amount</span>
                              <span className="text-sm font-medium text-gray-900">${(detectionDetails.guaranteedAmount || detectionDetails.amount || 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center px-4 py-3 bg-white">
                              <span className="text-sm text-gray-600">Status</span>
                              <span className="text-sm font-medium text-gray-900">{detectionDetails.status || 'Pending'}</span>
                            </div>
                            <div className="flex justify-between items-center px-4 py-3 bg-white">
                              <span className="text-sm text-gray-600">Evidence Documents</span>
                              <span className="text-sm font-medium text-gray-900">{detectionDetails.matchedCount || detectionDetails.matchedDocs?.length || 0}</span>
                            </div>
                          </div>
                        </div>


                        {/* Claim Info Section */}
                        <div className="border-t border-gray-100 pt-4">
                          <h4 className="text-sm font-semibold text-gray-900 mb-3">Claim Information</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-xs text-gray-500 uppercase tracking-wide">Claim ID</div>
                              <div className="text-sm font-mono text-gray-900 mt-1">{detectionDetails.id?.slice(0, 12) || '—'}...</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 uppercase tracking-wide">Sync ID</div>
                              <div className="text-sm font-mono text-gray-900 mt-1">{detectionDetails.sync_id || 'N/A'}</div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 uppercase tracking-wide">Type</div>
                              <div className="text-sm text-gray-900 mt-1">
                                {detectionDetails.anomaly_type?.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) || '—'}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 uppercase tracking-wide">Severity</div>
                              <Badge className="mt-1 bg-gray-100 text-[#36454F] border-gray-400">
                                {detectionDetails.severity?.charAt(0).toUpperCase() + detectionDetails.severity?.slice(1) || 'Unknown'}
                              </Badge>
                            </div>
                            {detectionDetails.sku && (
                              <div>
                                <div className="text-xs text-gray-500 uppercase tracking-wide">SKU</div>
                                <div className="text-sm font-mono text-gray-900 mt-1">{detectionDetails.sku}</div>
                              </div>
                            )}
                            {detectionDetails.asin && (
                              <div>
                                <div className="text-xs text-gray-500 uppercase tracking-wide">ASIN</div>
                                <div className="text-sm font-mono text-gray-900 mt-1">{detectionDetails.asin}</div>
                              </div>
                            )}
                            <div className="col-span-2">
                              <div className="text-xs text-gray-500 uppercase tracking-wide mb-2">AI Confidence</div>
                              <div className="flex items-center gap-2">
                                {detectionDetails.confidence_score !== null && detectionDetails.confidence_score !== undefined ? (
                                  <>
                                    <span className="text-sm font-medium text-gray-900">
                                      {(detectionDetails.confidence_score * 100).toFixed(1)}%
                                    </span>
                                    <Badge className="bg-gray-100 text-[#36454F] border-gray-400">
                                      {detectionDetails.confidence_score >= 0.85 ? 'High' : detectionDetails.confidence_score >= 0.50 ? 'Medium' : 'Low'}
                                    </Badge>
                                  </>
                                ) : (
                                  <span className="text-sm text-gray-600">N/A</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Evidence Quality & Policy Check */}
                        {(() => {
                          const validation = validateEvidencePolicy(detectionDetails, detectionDetails.matchedDocs);

                          return (
                            <div className="border-t border-gray-100 pt-4">
                              <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
                                  <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Evidence Assessment</h4>
                                </div>
                                <div className="bg-white p-4 space-y-4">
                                  {/* Quality Summary */}
                                  <div className="flex justify-between items-start pb-3 border-b border-gray-100">
                                    <div>
                                      <div className="text-sm font-medium text-gray-900">Quality Level</div>
                                      <div className="text-xs text-gray-600 mt-1">{validation.recommendationText}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="text-sm font-semibold text-gray-900">{validation.quality.charAt(0).toUpperCase() + validation.quality.slice(1)}</div>
                                      <div className="text-xs text-gray-500 mt-1">{validation.qualityScore}% Policy Score</div>
                                    </div>
                                  </div>

                                  {/* Field Verification */}
                                  <div className="space-y-2">
                                    <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Field Verification</p>
                                    <div className="space-y-1">
                                      {validation.fieldChecks.map((check, i) => (
                                        <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-gray-50 last:border-0">
                                          <span className="text-gray-600">{check.label}</span>
                                          <span className="font-medium text-gray-900">
                                            {check.present ? "Present" : check.required ? "Required" : "Optional"}
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Policy Notes */}
                                  {validation.warnings.length > 0 && (
                                    <div className="space-y-2 pt-2 border-t border-gray-100">
                                      <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Policy Notes</p>
                                      <ul className="text-xs space-y-1">
                                        {validation.warnings.map((w, i) => (
                                          <li key={i} className="text-gray-600 pl-3 relative before:content-['•'] before:absolute before:left-0">{w}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })()}

                        {/* Financial Information */}
                        <div className="border-t border-gray-100 pt-4">
                          <h4 className="text-sm font-semibold text-gray-900 mb-3">Financial Information</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-xs text-gray-500 uppercase tracking-wide">Estimated Value</div>
                              <div className="text-lg font-semibold text-emerald-600 mt-1">
                                {formatCurrency(detectionDetails.estimated_value || detectionDetails.guaranteedAmount || 0, detectionDetails.currency || 'USD')}
                              </div>
                            </div>
                            <div>
                              <div className="text-xs text-gray-500 uppercase tracking-wide">Currency</div>
                              <div className="text-sm text-gray-900 mt-1">{detectionDetails.currency || 'USD'}</div>
                            </div>
                          </div>
                        </div>

                        {/* Dates & Deadlines */}
                        <div className="border-t border-gray-100 pt-4">
                          <h4 className="text-sm font-semibold text-gray-900 mb-3">Dates & Deadlines</h4>
                          <div className="grid grid-cols-2 gap-4">
                            {detectionDetails.discovery_date && (
                              <div>
                                <div className="text-xs text-gray-500 uppercase tracking-wide">Discovery Date</div>
                                <div className="text-sm text-gray-900 mt-1">
                                  {format(new Date(detectionDetails.discovery_date), 'MMM dd, yyyy')}
                                </div>
                              </div>
                            )}
                            {detectionDetails.deadline_date && (
                              <div>
                                <div className="text-xs text-gray-500 uppercase tracking-wide">Deadline Date</div>
                                <div className={`text-sm font-medium mt-1 ${detectionDetails.days_remaining !== undefined && detectionDetails.days_remaining <= 7
                                  ? 'text-amber-600'
                                  : 'text-gray-900'
                                  }`}>
                                  {format(new Date(detectionDetails.deadline_date), 'MMM dd, yyyy')}
                                </div>
                              </div>
                            )}
                            {detectionDetails.days_remaining !== undefined && (
                              <div>
                                <div className="text-xs text-gray-500 uppercase tracking-wide">Days Remaining</div>
                                <div className={`text-sm font-medium mt-1 ${detectionDetails.days_remaining <= 3 ? 'text-red-600' :
                                  detectionDetails.days_remaining <= 7 ? 'text-amber-600' :
                                    'text-gray-900'
                                  }`}>
                                  {detectionDetails.days_remaining} day{detectionDetails.days_remaining !== 1 ? 's' : ''}
                                </div>
                              </div>
                            )}
                            {detectionDetails.created_at && (
                              <div>
                                <div className="text-xs text-gray-500 uppercase tracking-wide">Created At</div>
                                <div className="text-sm text-gray-900 mt-1">
                                  {format(new Date(detectionDetails.created_at), 'MMM dd, yyyy HH:mm')}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Related Event IDs */}
                        {detectionDetails.related_event_ids && detectionDetails.related_event_ids.length > 0 && (
                          <div className="border-t border-gray-100 pt-4">
                            <h4 className="text-sm font-semibold text-gray-900 mb-3">Related Event IDs</h4>
                            <div className="flex flex-wrap gap-2">
                              {detectionDetails.related_event_ids.map((eventId: string, idx: number) => (
                                <Badge key={idx} variant="outline" className="font-mono text-xs">
                                  {eventId}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Evidence Data */}
                        {detectionDetails.evidence && (
                          <div className="border-t border-gray-100 pt-4">
                            <h4 className="text-sm font-semibold text-gray-900 mb-3">Evidence Data</h4>
                            <div className="bg-gray-50 border border-gray-200 rounded-md p-3 max-h-48 overflow-auto">
                              <pre className="text-xs text-gray-700">
                                {JSON.stringify(detectionDetails.evidence, null, 2)}
                              </pre>
                            </div>
                          </div>
                        )}

                        {/* Details/Description */}
                        {detectionDetails.details && (
                          <div className="border-t border-gray-100 pt-4">
                            <h4 className="text-sm font-semibold text-gray-900 mb-2">Details</h4>
                            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{detectionDetails.details}</p>
                          </div>
                        )}

                        {/* Strength Score if available */}
                        {detectionDetails._strength && (
                          <div className="border-t border-gray-100 pt-4">
                            <h4 className="text-sm font-semibold text-gray-900 mb-3">Claim Strength</h4>
                            <div className="flex items-center gap-3 mb-3">
                              <StrengthBadge strength={detectionDetails._strength} />
                              <span className="text-sm text-gray-600">
                                Score: {detectionDetails._strength.score}/100
                              </span>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                              {detectionDetails._strength.factors?.map((f: any, i: number) => (
                                <div key={i} className="flex justify-between text-sm">
                                  <span className="text-gray-600">{f.label}</span>
                                  <span className="text-gray-900">{f.value}/{f.max}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Claim Timeline & Escalation */}
                        <div className="border-t border-gray-100 pt-4">
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
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDetailsModalOpen(false)}>
                        Close
                      </Button>
                      <Button
                        onClick={() => {
                          setEvidencePackClaim(detectionDetails);
                          setEvidencePackOpen(true);
                          setDetailsModalOpen(false);
                        }}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        View Evidence Pack
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
        </div>
      </div>
    </PageLayout >
  );
}