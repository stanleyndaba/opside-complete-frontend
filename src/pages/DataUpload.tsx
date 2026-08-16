import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/hooks/use-toast';
import { api, detectionApi } from '@/lib/api';
import { getFrontendAuthContext } from '@/lib/authSession';
import { supabase } from '@/lib/supabaseClient';
import { tenantRoute } from '@/lib/routes';
import {
    Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, X,
    Archive, Target, Info, ArrowRight
} from 'lucide-react';

// File state
interface UploadFile {
    file: File;
    id: string;
    status: 'pending' | 'uploading' | 'success' | 'skipped' | 'error';
    detectedType?: string;
    rowsInserted?: number;
    rowsSkipped?: number;
    rowsFailed?: number;
    error?: string;
}

// Ingestion result from backend
interface IngestionFileResult {
    success: boolean;
    csvType: string;
    fileName: string;
    rowsProcessed: number;
    rowsInserted: number;
    rowsSkipped: number;
    rowsFailed: number;
    errors: string[];
    detectionTriggered: boolean;
}

interface BatchResult {
    success: boolean;
    userId: string;
    totalFiles: number;
    results: IngestionFileResult[];
    detectionTriggered: boolean;
    detectionJobId?: string;
    syncId: string;
    error?: string;
    details?: string;
}

interface SupportedCsvType {
    type: string;
    enabled: boolean;
    description?: string;
}

interface PreviewDetectionResult {
    id: string;
    seller_id: string;
    sync_id: string;
    anomaly_type: string;
    severity: string;
    estimated_value: number;
    currency: string;
    confidence_score: number;
    evidence: any;
    status: string;
    discovery_date: string;
    deadline_date: string;
    days_remaining: number;
}

interface UploadDetectionState {
    syncId: string | null;
    status: 'pending' | 'processing' | 'completed' | 'failed' | null;
    processedAt?: string | null;
    errorMessage?: string | null;
    isSandbox: boolean;
}

type CsvUploadRunStatus = 'started' | 'detection_processing' | 'completed' | 'partial' | 'failed';
type CsvRunRecoverySource = 'persisted_run' | 'detection_queue_fallback' | 'detection_results_fallback' | 'last_known_sync_fallback';
interface CsvRunFileSummary {
    fileName: string;
    mimeType?: string;
    status: 'accepted' | 'ingested' | 'duplicate' | 'failed';
    csvType?: string;
    rowsProcessed?: number;
    rowsInserted?: number;
    rowsSkipped?: number;
    rowsFailed?: number;
    errors?: string[];
    detectionTriggered?: boolean;
    detectionJobId?: string;
}

interface CsvRunDetectionSnapshot {
    status: UploadDetectionState['status'];
    processedAt: string | null;
    errorMessage: string | null;
    resultsTotal: number;
    isSandbox: boolean;
}

interface CsvRunRehydrationRecord {
    syncId: string;
    source: CsvRunRecoverySource;
    uploadSummaryAvailable: boolean;
    recoveryNotice: string | null;
    createdAt: string | null;
    updatedAt: string | null;
    startedAt: string | null;
    completedAt: string | null;
    status: CsvUploadRunStatus | null;
    fileCount: number;
    filesSummary: CsvRunFileSummary[];
    detectionTriggered: boolean;
    detectionJobId?: string;
    error: string | null;
    isSandbox: boolean;
    batchResult: BatchResult | null;
    detection: CsvRunDetectionSnapshot | null;
}

interface DemoCsvSimulationRecord {
    run: CsvRunRehydrationRecord;
    previewResults: PreviewDetectionResult[];
}

type DetectionTruthLike = {
    status?: UploadDetectionState['status'];
    processed_at?: string | null;
    processedAt?: string | null;
    error_message?: string | null;
    errorMessage?: string | null;
    is_sandbox?: boolean;
    isSandbox?: boolean;
};

const ANOMALY_LABELS: Record<string, string> = {
    missing_unit: 'Missing Units', overcharge: 'Overcharge', damaged_stock: 'Damaged Stock',
    incorrect_fee: 'Incorrect Fee', duplicate_charge: 'Duplicate Charge',
    lost_warehouse: 'Lost in Warehouse', damaged_warehouse: 'Warehouse Damage',
    lost_inbound: 'Lost Inbound Shipment', damaged_inbound: 'Damaged Inbound',
    lost_in_transit: 'Lost in Transit', inbound_shipment_shortage: 'Inbound Shipment Shortage',
    carrier_claim: 'Carrier Claim', customer_return: 'Customer Return',
    reimbursement_reversal: 'Reimbursement Reversal', weight_fee_overcharge: 'Weight/Dimension Fee Drift',
    fulfillment_fee_error: 'Fulfillment Fee Error', storage_overcharge: 'Storage Overcharge',
    lts_overcharge: 'Long-Term Storage Overcharge', refund_no_return: 'Refund Without Return',
    refund_commission_error: 'Refund Commission Error', fba_inventory_reimbursement: 'FBA Inventory Reimbursement',
    removal_fee_error: 'Removal Fee Error', inbound_placement_fee: 'Inbound Placement Fee',
    aged_inventory_surcharge: 'Aged Inventory Surcharge', partial_reimbursement: 'Partial Reimbursement',
    return_not_restocked: 'Return Not Restocked', refund_exceeds_charge: 'Refund Exceeds Charge',
};
const formatAnomalyType = (type: string) => ANOMALY_LABELS[type] || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
const FALLBACK_SUPPORTED_TYPES = ['orders', 'shipments', 'returns', 'settlements', 'inventory', 'financial_events', 'fees', 'transfers'];
const formatCsvTypeLabel = (type: string) => type.replace(/_/g, ' ');
const DEMO_CSV_SYNC_PREFIX = 'demo-csv-';
const DEMO_PREVIEW_TEMPLATE: Array<Omit<PreviewDetectionResult, 'id' | 'seller_id' | 'sync_id' | 'discovery_date' | 'deadline_date' | 'days_remaining'>> = [
    {
        anomaly_type: 'inbound_shipment_shortage',
        severity: 'medium',
        estimated_value: 1516.72,
        currency: 'USD',
        confidence_score: 0.94,
        evidence: { shipment_id: 'FBA15Q9C71' },
        status: 'ready for filing',
    },
    {
        anomaly_type: 'weight_fee_overcharge',
        severity: 'medium',
        estimated_value: 684.11,
        currency: 'USD',
        confidence_score: 0.91,
        evidence: { fnsku: 'X001MARGIN7' },
        status: 'evidence linked',
    },
    {
        anomaly_type: 'duplicate_charge',
        severity: 'high',
        estimated_value: 318.44,
        currency: 'USD',
        confidence_score: 0.98,
        evidence: { order_id: '114-9473512-0023411' },
        status: 'claim candidate',
    },
    {
        anomaly_type: 'refund_no_return',
        severity: 'medium',
        estimated_value: 247.8,
        currency: 'USD',
        confidence_score: 0.89,
        evidence: { order_id: '113-2814007-4413824' },
        status: 'needs seller review',
    },
    {
        anomaly_type: 'reimbursement_reversal',
        severity: 'medium',
        estimated_value: 872.36,
        currency: 'USD',
        confidence_score: 0.93,
        evidence: { fnsku: 'X001CLAR10' },
        status: 'under review',
    },
    {
        anomaly_type: 'lost_warehouse',
        severity: 'high',
        estimated_value: 1261.54,
        currency: 'USD',
        confidence_score: 0.9,
        evidence: { fnsku: 'X001RECVR9' },
        status: 'case prepared',
    },
];

const inferDemoCsvType = (fileName: string): string => {
    const normalized = fileName.toLowerCase();

    if (/financial|event/.test(normalized)) return 'financial_events';
    if (/settlement|statement|payment/.test(normalized)) return 'settlements';
    if (/shipment|inbound|receiv/.test(normalized)) return 'shipments';
    if (/return|refund/.test(normalized)) return 'returns';
    if (/invent|ledger|stock/.test(normalized)) return 'inventory';
    if (/fee/.test(normalized)) return 'fees';
    if (/transfer/.test(normalized)) return 'transfers';
    if (/order/.test(normalized)) return 'orders';

    return 'settlements';
};

const getDemoCsvMetrics = (csvType: string, index: number) => {
    const byType: Record<string, { rowsProcessed: number; rowsInserted: number; rowsSkipped: number }> = {
        orders: { rowsProcessed: 4820, rowsInserted: 4820, rowsSkipped: 0 },
        shipments: { rowsProcessed: 244, rowsInserted: 244, rowsSkipped: 0 },
        returns: { rowsProcessed: 186, rowsInserted: 186, rowsSkipped: 0 },
        settlements: { rowsProcessed: 1936, rowsInserted: 1936, rowsSkipped: 0 },
        inventory: { rowsProcessed: 6124, rowsInserted: 6124, rowsSkipped: 0 },
        financial_events: { rowsProcessed: 3188, rowsInserted: 3188, rowsSkipped: 0 },
        fees: { rowsProcessed: 964, rowsInserted: 964, rowsSkipped: 0 },
        transfers: { rowsProcessed: 126, rowsInserted: 126, rowsSkipped: 0 },
    };

    const base = byType[csvType] || { rowsProcessed: 1280, rowsInserted: 1280, rowsSkipped: 0 };
    return {
        rowsProcessed: base.rowsProcessed + (index * 7),
        rowsInserted: base.rowsInserted + (index * 7),
        rowsSkipped: base.rowsSkipped,
    };
};

const buildDemoPreviewResults = (syncId: string, sellerId: string, csvTypes: string[]): PreviewDetectionResult[] => {
    const preferredTemplates = [
        ...(csvTypes.includes('shipments') ? [DEMO_PREVIEW_TEMPLATE[0]] : []),
        ...((csvTypes.includes('fees') || csvTypes.includes('settlements')) ? [DEMO_PREVIEW_TEMPLATE[1], DEMO_PREVIEW_TEMPLATE[2]] : []),
        ...((csvTypes.includes('returns') || csvTypes.includes('orders')) ? [DEMO_PREVIEW_TEMPLATE[3]] : []),
        ...(csvTypes.includes('financial_events') ? [DEMO_PREVIEW_TEMPLATE[4]] : []),
        ...((csvTypes.includes('inventory') || csvTypes.includes('transfers')) ? [DEMO_PREVIEW_TEMPLATE[5]] : []),
    ];

    const selectedTemplates = [...preferredTemplates];
    for (const template of DEMO_PREVIEW_TEMPLATE) {
        if (selectedTemplates.length >= 5) {
            break;
        }
        if (!selectedTemplates.includes(template)) {
            selectedTemplates.push(template);
        }
    }

    return selectedTemplates.slice(0, 5).map((template, index) => {
        const discoveredAt = new Date(Date.now() - ((index + 2) * 86400000));
        const daysRemaining = 62 - (index * 7);
        return {
            id: `${syncId}-finding-${index + 1}`,
            seller_id: sellerId,
            sync_id: syncId,
            anomaly_type: template.anomaly_type,
            severity: template.severity,
            estimated_value: template.estimated_value,
            currency: template.currency,
            confidence_score: template.confidence_score,
            evidence: template.evidence,
            status: template.status,
            discovery_date: discoveredAt.toISOString(),
            deadline_date: new Date(discoveredAt.getTime() + (daysRemaining * 86400000)).toISOString(),
            days_remaining: daysRemaining,
        };
    });
};

const safelyReadDemoCsvSimulation = (storageKey: string): DemoCsvSimulationRecord | null => {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const raw = localStorage.getItem(storageKey);
        if (!raw) {
            return null;
        }

        const parsed = JSON.parse(raw) as DemoCsvSimulationRecord | null;
        if (!parsed?.run?.syncId || !Array.isArray(parsed.previewResults)) {
            return null;
        }

        return parsed;
    } catch (_error) {
        return null;
    }
};

const readBackendMessage = (value: unknown): string | null => {
    if (typeof value === 'string') {
        const normalized = value.trim();
        return normalized.length > 0 ? normalized : null;
    }

    if (value && typeof value === 'object') {
        const record = value as Record<string, unknown>;
        return readBackendMessage(record.message)
            || readBackendMessage(record.details)
            || readBackendMessage(record.error);
    }

    return null;
};

const combineBackendMessages = (...values: unknown[]): string | null => {
    const seen = new Set<string>();
    const messages: string[] = [];

    values.forEach((value) => {
        const message = readBackendMessage(value);
        if (message && !seen.has(message)) {
            seen.add(message);
            messages.push(message);
        }
    });

    return messages.length > 0 ? messages.join(' · ') : null;
};

const extractApiFailureMessage = (response: any, fallback?: string): string | null => {
    return combineBackendMessages(
        response?.data?.error,
        response?.data?.details,
        response?.data?.message,
        response?.error,
        fallback || null,
    );
};

const toUploadDetectionState = (syncId: string, data?: any, fallbackError?: string | null): UploadDetectionState => ({
    syncId,
    status: data?.status || null,
    processedAt: data?.processed_at ?? data?.processedAt ?? null,
    errorMessage: data?.error_message ?? data?.errorMessage ?? fallbackError ?? null,
    isSandbox: Boolean(data?.is_sandbox ?? data?.isSandbox),
});

const readDetectionProcessedAt = (data?: DetectionTruthLike | null) =>
    data?.processedAt ?? data?.processed_at ?? null;

const readDetectionErrorMessage = (data?: DetectionTruthLike | null) =>
    data?.errorMessage ?? data?.error_message ?? null;

const readDetectionSandboxFlag = (data?: DetectionTruthLike | null) =>
    Boolean(data?.isSandbox ?? data?.is_sandbox);

const isDetectionTerminal = (status: UploadDetectionState['status'] | undefined | null): boolean => (
    status === 'completed' || status === 'failed'
);

const isDetectionInFlight = (status: UploadDetectionState['status'] | undefined | null): boolean => (
    status === 'pending' || status === 'processing'
);

const shouldOpenDetectionPreview = (data?: any): boolean => (
    isDetectionTerminal(data?.status) || Number(data?.results?.claimsFound || 0) > 0
);

const getDetectionToastMessage = (data?: any): string | null => {
    if (!data?.status) {
        return null;
    }

    if (data.status === 'completed') {
        return 'Detection completed for this upload.';
    }

    if (data.status === 'failed') {
        return combineBackendMessages(data?.error_message, 'Detection failed for this upload.');
    }

    if (data.status === 'pending' || data.status === 'processing') {
        return 'Detection is processing for this upload.';
    }

    return null;
};

const getEmptyDetectionCopy = (
    status: UploadDetectionState['status'],
    message: string | null,
): { title: string; description: string } => {
    if (status === 'pending' || status === 'processing') {
        return {
            title: 'Detection is still processing for this upload',
            description: message || 'The backend has not reported completed findings for this upload yet.',
        };
    }

    if (status === 'completed') {
        return {
            title: 'Detection completed with zero findings',
            description: message || 'The backend completed detection for this upload and returned zero findings.',
        };
    }

    if (status === 'failed') {
        return {
            title: 'Detection failed for this upload',
            description: message || 'The backend reported a failed detection state for this upload.',
        };
    }

    return {
        title: 'Detection results unavailable',
        description: message || 'The backend did not return detection results for this upload.',
    };
};

const formatCsvRecoverySource = (source: CsvRunRecoverySource): string => {
    switch (source) {
        case 'persisted_run':
            return 'Persisted CSV run record';
        case 'detection_queue_fallback':
            return 'Detection queue fallback';
        case 'detection_results_fallback':
            return 'Detection results fallback';
        case 'last_known_sync_fallback':
            return 'Last known sync fallback';
        default:
            return 'CSV refresh recovery';
    }
};

const getDetectionStatusFromRunRecord = (run: CsvRunRehydrationRecord): UploadDetectionState['status'] => {
    if (run.detection?.status) {
        return run.detection.status;
    }

    if (!run.detectionTriggered) {
        return null;
    }

    if (run.status === 'detection_processing' || run.status === 'started') {
        return 'processing';
    }

    if (run.status === 'completed' || run.status === 'partial') {
        return 'completed';
    }

    if (run.status === 'failed') {
        return 'failed';
    }

    return null;
};

const NOT_AVAILABLE = 'Not Available';

const parseTimestampMs = (value?: string | null): number | null => {
    if (!value) return null;
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
};

const formatDurationLabel = (durationMs?: number | null): string => {
    if (typeof durationMs !== 'number' || !Number.isFinite(durationMs) || durationMs < 0) {
        return NOT_AVAILABLE;
    }

    const totalSeconds = Math.max(1, Math.round(durationMs / 1000));
    if (totalSeconds < 60) {
        return `${totalSeconds}s`;
    }

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }

    if (minutes >= 10 || seconds === 0) {
        return `${minutes}m`;
    }

    return `${minutes}m ${seconds}s`;
};

const formatPipelineTimestamp = (value?: string | null): string => {
    if (!value) return NOT_AVAILABLE;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return NOT_AVAILABLE;
    return parsed.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
};

const formatDetectionStateLabel = (status: UploadDetectionState['status']): string => {
    switch (status) {
        case 'pending':
            return 'Queued';
        case 'processing':
            return 'Running';
        case 'completed':
            return 'Complete';
        case 'failed':
            return 'Failed';
        default:
            return NOT_AVAILABLE;
    }
};

const pluralize = (value: number, singular: string, plural = `${singular}s`) =>
    `${value.toLocaleString('en-US')} ${value === 1 ? singular : plural}`;

export default function DataUpload() {
    const { tenantSlug: urlTenantSlug } = useParams<{ tenantSlug?: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const { tenant } = useTenant();
    const currentTenantSlug = urlTenantSlug || tenant?.slug || 'default';
    const returnToAudit = new URLSearchParams(location.search).get('returnTo') === 'audit';
    const isDemoWorkspace = currentTenantSlug === 'demo-workspace';
    const { toast } = useToast();

    const [files, setFiles] = useState<UploadFile[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [batchResult, setBatchResult] = useState<BatchResult | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewResults, setPreviewResults] = useState<PreviewDetectionResult[]>([]);
    const [previewResultsTotal, setPreviewResultsTotal] = useState<number | null>(null);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [previewState, setPreviewState] = useState<UploadDetectionState>({
        syncId: null,
        status: null,
        processedAt: null,
        errorMessage: null,
        isSandbox: false,
    });
    const [previewMessage, setPreviewMessage] = useState<string | null>(null);
    const [rehydrationNotice, setRehydrationNotice] = useState<string | null>(null);
    const [rehydratedRun, setRehydratedRun] = useState<CsvRunRehydrationRecord | null>(null);
    const [supportedCsvTypes, setSupportedCsvTypes] = useState<SupportedCsvType[]>([]);
    const [uploadRequestStartedAt, setUploadRequestStartedAt] = useState<number | null>(null);
    const [uploadAcceptedAt, setUploadAcceptedAt] = useState<number | null>(null);
    const [elapsedNow, setElapsedNow] = useState(() => Date.now());
    const fileInputRef = useRef<HTMLInputElement>(null);
    const activeTenantId = tenant?.id || localStorage.getItem('active_tenant_id') || '';
    const latestCsvSyncStorageKey = `data_upload:last_csv_sync:${currentTenantSlug}:${activeTenantId || 'tenant'}`;
    const dismissedCsvSyncStorageKey = `data_upload:dismissed_sync:${currentTenantSlug}:${activeTenantId || 'tenant'}`;
    const demoCsvSimulationStorageKey = `data_upload:demo_csv_run:${currentTenantSlug}:${activeTenantId || 'tenant'}`;
    const detectionPollingRef = useRef({ token: 0, syncId: null as string | null });
    const dashboardRedirectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const detectionGateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isMountedRef = useRef(true);
    const [redirectGateSyncId, setRedirectGateSyncId] = useState<string | null>(null);
    const [detectionRedirectTimedOut, setDetectionRedirectTimedOut] = useState(false);

    const invalidateDetectionPolling = useCallback((clearSyncId = true) => {
        detectionPollingRef.current.token += 1;
        if (clearSyncId) {
            detectionPollingRef.current.syncId = null;
        }
    }, []);

    const beginDetectionPolling = useCallback((syncId: string) => {
        detectionPollingRef.current.token += 1;
        detectionPollingRef.current.syncId = syncId;
        return detectionPollingRef.current.token;
    }, []);

    const clearDashboardRedirect = useCallback(() => {
        if (dashboardRedirectTimeoutRef.current) {
            clearTimeout(dashboardRedirectTimeoutRef.current);
            dashboardRedirectTimeoutRef.current = null;
        }
    }, []);

    const clearDetectionGateTimeout = useCallback(() => {
        if (detectionGateTimeoutRef.current) {
            clearTimeout(detectionGateTimeoutRef.current);
            detectionGateTimeoutRef.current = null;
        }
    }, []);

    const persistDemoCsvSimulation = useCallback((record: DemoCsvSimulationRecord | null) => {
        if (!isDemoWorkspace || typeof window === 'undefined') {
            return;
        }

        try {
            if (!record) {
                localStorage.removeItem(demoCsvSimulationStorageKey);
                return;
            }

            localStorage.setItem(demoCsvSimulationStorageKey, JSON.stringify(record));
        } catch (_error) {
            // Demo persistence is best-effort only.
        }
    }, [demoCsvSimulationStorageKey, isDemoWorkspace]);

    const startDetectionRedirectTimeout = useCallback(() => {
        clearDetectionGateTimeout();
        setDetectionRedirectTimedOut(false);
        detectionGateTimeoutRef.current = setTimeout(() => {
            setDetectionRedirectTimedOut(true);
            detectionGateTimeoutRef.current = null;
        }, 60000);
    }, [clearDetectionGateTimeout]);

    const buildDashboardTarget = useCallback((syncId?: string | null) => {
        const basePath = tenantRoute(currentTenantSlug, '/dashboard');
        if (!syncId) {
            return basePath;
        }

        const params = new URLSearchParams({
            syncId,
            tab: 'discrepancies',
        });
        return `${basePath}?${params.toString()}`;
    }, [currentTenantSlug]);

    const goToDashboard = useCallback(() => {
        clearDashboardRedirect();
        const targetSyncId = redirectGateSyncId || previewState.syncId || batchResult?.syncId || rehydratedRun?.syncId || null;
        navigate(returnToAudit ? tenantRoute(currentTenantSlug, '/audit') : buildDashboardTarget(targetSyncId));
    }, [batchResult?.syncId, buildDashboardTarget, clearDashboardRedirect, currentTenantSlug, navigate, previewState.syncId, redirectGateSyncId, rehydratedRun?.syncId, returnToAudit]);

    const scheduleDashboardRedirect = useCallback((delayMs = 1400) => {
        clearDashboardRedirect();
        const targetSyncId = redirectGateSyncId || previewState.syncId || batchResult?.syncId || rehydratedRun?.syncId || null;
        dashboardRedirectTimeoutRef.current = setTimeout(() => {
            navigate(returnToAudit ? tenantRoute(currentTenantSlug, '/audit') : buildDashboardTarget(targetSyncId));
            dashboardRedirectTimeoutRef.current = null;
        }, delayMs);
    }, [batchResult?.syncId, buildDashboardTarget, clearDashboardRedirect, currentTenantSlug, navigate, previewState.syncId, redirectGateSyncId, rehydratedRun?.syncId, returnToAudit]);

    const armDetectionRedirectGate = useCallback((syncId: string) => {
        setRedirectGateSyncId(syncId);
        startDetectionRedirectTimeout();
    }, [startDetectionRedirectTimeout]);

    const isPollingCurrent = useCallback((syncId: string, token: number) => (
        isMountedRef.current
        && detectionPollingRef.current.token === token
        && detectionPollingRef.current.syncId === syncId
    ), []);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
            invalidateDetectionPolling();
            clearDetectionGateTimeout();
            clearDashboardRedirect();
        };
    }, [clearDashboardRedirect, clearDetectionGateTimeout, invalidateDetectionPolling]);

    useEffect(() => {
        const shouldTick = isUploading || isDetectionInFlight(previewState.status);
        if (!shouldTick) return;

        setElapsedNow(Date.now());
        const intervalId = window.setInterval(() => {
            setElapsedNow(Date.now());
        }, 1000);

        return () => window.clearInterval(intervalId);
    }, [isUploading, previewState.status]);

    const resolveSessionIdentity = useCallback(async () => {
        let resolvedUserId = localStorage.getItem('user_id') || '';
        let resolvedTenantId = tenant?.id || localStorage.getItem('active_tenant_id') || '';

        if (!resolvedUserId || !resolvedTenantId) {
            try {
                const me = await api.getMe(currentTenantSlug);
                if (me?.ok && me.data) {
                    const profile = me.data as any;
                    if (!resolvedUserId && profile.id) {
                        resolvedUserId = String(profile.id);
                        localStorage.setItem('user_id', resolvedUserId);
                    }
                    if (!resolvedTenantId && profile.tenant_id) {
                        resolvedTenantId = String(profile.tenant_id);
                        localStorage.setItem('active_tenant_id', resolvedTenantId);
                    }
                }
            } catch (_error) {
                // Fall through to honest validation below.
            }
        }

        if (!resolvedUserId) {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user?.id) {
                    resolvedUserId = String(user.id);
                    localStorage.setItem('user_id', resolvedUserId);
                }
            } catch (_error) {
                // Fall through to honest validation below.
            }
        }

        return {
            userId: resolvedUserId,
            tenantId: resolvedTenantId,
        };
    }, [currentTenantSlug, tenant?.id]);

    const loadUploadDetectionTruth = useCallback(async (syncId: string, pollingToken?: number) => {
        try {
            const statusRes = await detectionApi.getDetectionStatus(syncId, currentTenantSlug);
            if (pollingToken !== undefined && !isPollingCurrent(syncId, pollingToken)) {
                return null;
            }

            if (statusRes?.ok && statusRes.data) {
                setPreviewState(toUploadDetectionState(syncId, statusRes.data));
                return statusRes.data;
            }

            const failureMessage = extractApiFailureMessage(statusRes, 'Detection status unavailable for this upload.');
            setPreviewState(toUploadDetectionState(syncId, undefined, failureMessage));
            return null;
        } catch (error) {
            if (pollingToken !== undefined && !isPollingCurrent(syncId, pollingToken)) {
                return null;
            }

            const failureMessage = combineBackendMessages(error instanceof Error ? error.message : null, 'Detection status unavailable for this upload.');
            setPreviewState(toUploadDetectionState(syncId, undefined, failureMessage));
            return null;
        }
    }, [currentTenantSlug, isPollingCurrent]);

    const pollForUploadDetections = useCallback(async (syncId: string, pollingToken: number, startWithDelay = false) => {
        const maxAttempts = 120;
        let shouldDelay = startWithDelay;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            if (!isPollingCurrent(syncId, pollingToken)) {
                return;
            }

            if (shouldDelay) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
            shouldDelay = true;

            if (!isPollingCurrent(syncId, pollingToken)) {
                return;
            }

            const statusData = await loadUploadDetectionTruth(syncId, pollingToken);
            if (!isPollingCurrent(syncId, pollingToken)) {
                return;
            }

            if (!statusData) {
                continue;
            }

            if (isDetectionTerminal(statusData.status) && !isPreviewOpen) {
                setIsPreviewOpen(true);
            }

            if (isDetectionTerminal(statusData.status)) {
                return;
            }
        }
    }, [isPollingCurrent, isPreviewOpen, loadUploadDetectionTruth]);

    useEffect(() => {
        let cancelled = false;

        const fetchSupportedTypes = async () => {
            try {
                const { token } = await getFrontendAuthContext();
                const response = await fetch(api.buildApiUrl(`/api/csv-upload/supported-types?tenantSlug=${encodeURIComponent(currentTenantSlug)}`), {
                    credentials: 'include',
                    headers: {
                        ...(activeTenantId ? { 'x-tenant-id': activeTenantId } : {}),
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                });

                const payload = await response.json();
                if (!response.ok || !payload?.success || !Array.isArray(payload.supportedTypes)) {
                    return;
                }

                if (!cancelled) {
                    setSupportedCsvTypes(payload.supportedTypes);
                }
            } catch (_error) {
                // Upload endpoint still returns honest failures if this lookup fails.
            }
        };

        fetchSupportedTypes();
        return () => {
            cancelled = true;
        };
    }, [activeTenantId, currentTenantSlug]);

    const supportedTypeNames = useMemo(
        () => {
            const enabled = supportedCsvTypes.filter(type => type.enabled).map(type => formatCsvTypeLabel(type.type));
            return enabled.length > 0 ? enabled : FALLBACK_SUPPORTED_TYPES.map(formatCsvTypeLabel);
        },
        [supportedCsvTypes]
    );

    useEffect(() => {
        let cancelled = false;

        const rehydrateLatestCsvRun = async () => {
            const dismissedSyncId = typeof window !== 'undefined'
                ? sessionStorage.getItem(dismissedCsvSyncStorageKey)
                : null;

            if (isDemoWorkspace) {
                const demoSimulation = safelyReadDemoCsvSimulation(demoCsvSimulationStorageKey);
                if (demoSimulation?.run?.syncId && demoSimulation.run.syncId !== dismissedSyncId) {
                    try {
                        localStorage.setItem(latestCsvSyncStorageKey, demoSimulation.run.syncId);
                    } catch (_error) {
                        // Local fallback is best-effort only.
                    }

                    if (cancelled) return;

                    setFiles([]);
                    setBatchResult(demoSimulation.run.batchResult);
                    setPreviewResults(demoSimulation.previewResults);
                    setPreviewResultsTotal(
                        demoSimulation.run.detection?.resultsTotal ?? demoSimulation.previewResults.length ?? null
                    );
                    setPreviewMessage(null);
                    setPreviewState({
                        syncId: demoSimulation.run.syncId,
                        status: getDetectionStatusFromRunRecord(demoSimulation.run),
                        processedAt: demoSimulation.run.detection?.processedAt || demoSimulation.run.completedAt || null,
                        errorMessage: demoSimulation.run.detection?.errorMessage || demoSimulation.run.error || null,
                        isSandbox: demoSimulation.run.detection?.isSandbox ?? demoSimulation.run.isSandbox,
                    });
                    setRehydratedRun(demoSimulation.run);
                    setRehydrationNotice(null);
                    setIsPreviewOpen(Boolean(
                        demoSimulation.previewResults.length > 0
                        || demoSimulation.run.detection?.status
                        || demoSimulation.run.detectionTriggered
                    ));
                    return;
                }
            }

            try {
                const latestRunRes = await api.getLatestCsvUploadRun(currentTenantSlug);
                if (cancelled) return;

                const latestRun = latestRunRes?.ok ? latestRunRes.data?.run as CsvRunRehydrationRecord | null | undefined : null;
                if (latestRun?.syncId && latestRun.syncId !== dismissedSyncId) {
                    try {
                        localStorage.setItem(latestCsvSyncStorageKey, latestRun.syncId);
                    } catch (_error) {
                        // Local fallback is best-effort only.
                    }

                    setFiles([]);
                    setBatchResult(latestRun.uploadSummaryAvailable && latestRun.batchResult ? latestRun.batchResult : null);
                    setPreviewResults([]);
                    setPreviewResultsTotal(latestRun.detection?.resultsTotal ?? null);
                    setPreviewMessage(combineBackendMessages(latestRun.error, latestRun.recoveryNotice));
                    setPreviewState({
                        syncId: latestRun.syncId,
                        status: getDetectionStatusFromRunRecord(latestRun),
                        processedAt: latestRun.detection?.processedAt || latestRun.completedAt || null,
                        errorMessage: latestRun.detection?.errorMessage || latestRun.error || null,
                        isSandbox: latestRun.detection?.isSandbox ?? latestRun.isSandbox,
                    });
                    setRehydratedRun(latestRun);
                    setRehydrationNotice(combineBackendMessages(latestRun.recoveryNotice, latestRun.error));
                    setIsPreviewOpen(Boolean(
                        (latestRun.detection && (latestRun.detection.resultsTotal > 0 || latestRun.detection.status))
                        || (latestRun.detectionTriggered && getDetectionStatusFromRunRecord(latestRun))
                    ));
                    return;
                }
            } catch (_error) {
                // Fall through to the last-known sync fallback below.
            }

            const lastKnownSyncId = localStorage.getItem(latestCsvSyncStorageKey);
            if (!lastKnownSyncId || lastKnownSyncId === dismissedSyncId || cancelled) {
                return;
            }

            try {
                const [statusRes, resultsRes] = await Promise.all([
                    detectionApi.getDetectionStatus(lastKnownSyncId, currentTenantSlug),
                    detectionApi.getDetectionResults({ limit: 500, syncId: lastKnownSyncId }, currentTenantSlug),
                ]);

                if (cancelled) return;

                const statusTruth = statusRes?.ok && statusRes.data
                    ? statusRes.data
                    : (resultsRes?.ok ? resultsRes.data?.meta : null);
                const results = resultsRes?.ok && Array.isArray(resultsRes.data?.results) ? resultsRes.data.results : [];
                const resultsTotal = resultsRes?.ok
                    ? (typeof resultsRes.data?.total === 'number' ? resultsRes.data.total : results.length)
                    : 0;
                const hasRecoverableTruth = Boolean(statusTruth?.status || resultsTotal > 0);

                if (!hasRecoverableTruth) {
                    const failureNotice = 'Refresh recovery is not possible for the last known CSV run because no persisted CSV upload record or persisted detection records were found for it.';
                    setRehydratedRun({
                        syncId: lastKnownSyncId,
                        source: 'last_known_sync_fallback',
                        uploadSummaryAvailable: false,
                        recoveryNotice: failureNotice,
                        createdAt: null,
                        updatedAt: null,
                        startedAt: null,
                        completedAt: null,
                        status: null,
                        fileCount: 0,
                        filesSummary: [],
                        detectionTriggered: false,
                        detectionJobId: undefined,
                        error: failureNotice,
                        isSandbox: false,
                        batchResult: null,
                        detection: null,
                    });
                    setRehydrationNotice(failureNotice);
                    return;
                }

                const fallbackNotice = 'Recovered detection truth from the last known CSV sync ID. Per-file upload summary is not persisted for this run and cannot be reconstructed after refresh.';
                setFiles([]);
                setBatchResult(null);
                setPreviewResults(results);
                setPreviewResultsTotal(resultsTotal);
                setPreviewMessage(results.length > 0 ? null : fallbackNotice);
                setPreviewState(toUploadDetectionState(
                    lastKnownSyncId,
                    statusTruth,
                    extractApiFailureMessage(statusRes, fallbackNotice),
                ));
                setRehydratedRun({
                    syncId: lastKnownSyncId,
                    source: 'last_known_sync_fallback',
                    uploadSummaryAvailable: false,
                    recoveryNotice: fallbackNotice,
                    createdAt: null,
                    updatedAt: null,
                    startedAt: null,
                    completedAt: readDetectionProcessedAt(statusTruth),
                    status: statusTruth?.status === 'failed'
                        ? 'failed'
                        : statusTruth?.status === 'pending' || statusTruth?.status === 'processing'
                            ? 'detection_processing'
                            : statusTruth?.status === 'completed'
                                ? 'completed'
                                : null,
                    fileCount: 0,
                    filesSummary: [],
                    detectionTriggered: Boolean(statusTruth?.status || resultsTotal > 0),
                    detectionJobId: undefined,
                    error: readDetectionErrorMessage(statusTruth),
                    isSandbox: readDetectionSandboxFlag(statusTruth),
                    batchResult: null,
                    detection: {
                        status: statusTruth?.status || null,
                        processedAt: readDetectionProcessedAt(statusTruth),
                        errorMessage: readDetectionErrorMessage(statusTruth),
                        resultsTotal,
                        isSandbox: readDetectionSandboxFlag(statusTruth),
                    },
                });
                setRehydrationNotice(fallbackNotice);
                setIsPreviewOpen(Boolean(statusTruth?.status || resultsTotal > 0));
            } catch (_error) {
                if (cancelled) return;

                const failureNotice = 'Refresh recovery is not possible because the last known CSV sync ID could not be rehydrated from persisted detection truth.';
                setRehydratedRun({
                    syncId: lastKnownSyncId,
                    source: 'last_known_sync_fallback',
                    uploadSummaryAvailable: false,
                    recoveryNotice: failureNotice,
                    createdAt: null,
                    updatedAt: null,
                    startedAt: null,
                    completedAt: null,
                    status: null,
                    fileCount: 0,
                    filesSummary: [],
                    detectionTriggered: false,
                    detectionJobId: undefined,
                    error: failureNotice,
                    isSandbox: false,
                    batchResult: null,
                    detection: null,
                });
                setRehydrationNotice(failureNotice);
            }
        };

        rehydrateLatestCsvRun();
        return () => { cancelled = true; };
    }, [currentTenantSlug, demoCsvSimulationStorageKey, dismissedCsvSyncStorageKey, isDemoWorkspace, latestCsvSyncStorageKey]);

    useEffect(() => () => {
        clearDashboardRedirect();
        clearDetectionGateTimeout();
    }, [clearDashboardRedirect, clearDetectionGateTimeout]);

    useEffect(() => {
        if (!redirectGateSyncId) {
            return;
        }

        if (previewState.syncId !== redirectGateSyncId) {
            return;
        }

        if (previewState.status === 'completed') {
            clearDetectionGateTimeout();
            setDetectionRedirectTimedOut(false);
            setRedirectGateSyncId(null);
            scheduleDashboardRedirect();
            return;
        }

        if (previewState.status === 'failed') {
            clearDetectionGateTimeout();
            setDetectionRedirectTimedOut(false);
            setRedirectGateSyncId(null);
        }
    }, [
        clearDetectionGateTimeout,
        previewState.status,
        previewState.syncId,
        redirectGateSyncId,
        scheduleDashboardRedirect
    ]);

    const currentUploadSyncId = batchResult?.syncId || previewState.syncId;
    const isDemoSimulationSyncId = Boolean(currentUploadSyncId?.startsWith(DEMO_CSV_SYNC_PREFIX));
    const isPreviewPartial = previewResults.length > 0 && isDetectionInFlight(previewState.status);
    const previewEmptyState = useMemo(
        () => getEmptyDetectionCopy(previewState.status, previewMessage || previewState.errorMessage || null),
        [previewMessage, previewState.errorMessage, previewState.status]
    );
    const previewLoadedCount = previewResults.length;
    const previewKnownTotal = typeof previewResultsTotal === 'number' ? previewResultsTotal : previewLoadedCount;
    const previewIsTruncated = previewKnownTotal > previewLoadedCount;
    const previewRecoveryLabel = previewIsTruncated ? 'Loaded subset recovery' : 'Recovery';
    const previewBreakdownLabel = previewIsTruncated ? 'Top loaded claim categories by value' : 'Top claim categories by value';
    const previewResultsSummary = previewIsTruncated
        ? `Showing first ${previewLoadedCount} of ${previewKnownTotal} detections for this upload`
        : `${previewLoadedCount} of ${previewKnownTotal} detection result${previewKnownTotal !== 1 ? 's' : ''} loaded for this upload`;
    const previewRecoverySummaryLabel = previewIsTruncated ? 'Loaded subset recovery total' : 'Total estimated recovery';

    // Fetch detection data for the current upload only
    useEffect(() => {
        if (!isPreviewOpen) return;
        if (!currentUploadSyncId) {
            setPreviewResults([]);
            setPreviewResultsTotal(null);
            setPreviewMessage('Detection results unavailable because this upload has no sync ID.');
            setPreviewState(prev => ({ ...prev, syncId: null, status: null, processedAt: null, errorMessage: null, isSandbox: false }));
            return;
        }

        if (isDemoSimulationSyncId) {
            setIsPreviewLoading(false);
            return;
        }

        let cancelled = false;
        const fetchPreviewData = async () => {
            let shouldContinue = true;

            while (!cancelled && shouldContinue) {
                setIsPreviewLoading(true);
                try {
                    const [statusRes, resultsRes] = await Promise.all([
                        detectionApi.getDetectionStatus(currentUploadSyncId, currentTenantSlug),
                        detectionApi.getDetectionResults({ limit: 500, syncId: currentUploadSyncId }, currentTenantSlug),
                    ]);

                    if (cancelled) return;

                    const statusTruth = statusRes?.ok && statusRes.data
                        ? statusRes.data
                        : (resultsRes?.ok ? resultsRes.data?.meta : null);
                    const statusFailureMessage = statusRes?.ok
                        ? null
                        : extractApiFailureMessage(statusRes, 'Detection status unavailable for this upload.');

                    setPreviewState(toUploadDetectionState(currentUploadSyncId, statusTruth, statusFailureMessage));

                    if (resultsRes?.ok && Array.isArray(resultsRes.data?.results)) {
                        setPreviewResults(resultsRes.data.results);
                        setPreviewResultsTotal(
                            typeof resultsRes.data.total === 'number'
                                ? resultsRes.data.total
                                : resultsRes.data.results.length
                        );
                        if (resultsRes.data.results.length > 0) {
                            setPreviewMessage(null);
                        } else {
                            const emptyStateMessage = combineBackendMessages(
                                readDetectionErrorMessage(statusTruth),
                                statusFailureMessage,
                                extractApiFailureMessage(resultsRes),
                            );
                            setPreviewMessage(getEmptyDetectionCopy(statusTruth?.status || null, emptyStateMessage).description);
                        }
                    } else {
                        setPreviewResults([]);
                        setPreviewResultsTotal(null);
                        setPreviewMessage(
                            combineBackendMessages(
                                extractApiFailureMessage(resultsRes, 'Detection results unavailable for this upload.'),
                                statusFailureMessage,
                            ) || 'Detection results unavailable for this upload.'
                        );
                    }

                    shouldContinue = isDetectionInFlight(statusTruth?.status || null);
                } catch (err) {
                    console.error('Failed to fetch preview data:', err);
                    if (!cancelled) {
                        setPreviewResults([]);
                        setPreviewResultsTotal(null);
                        const failureMessage = combineBackendMessages(
                            err instanceof Error ? err.message : null,
                            'Detection results unavailable for this upload.',
                        ) || 'Detection results unavailable for this upload.';
                        setPreviewMessage(failureMessage);
                        setPreviewState(prev => ({
                            ...prev,
                            syncId: currentUploadSyncId,
                            errorMessage: failureMessage,
                        }));
                    }
                    shouldContinue = false;
                } finally {
                    if (!cancelled) {
                        setIsPreviewLoading(false);
                    }
                }

                if (!shouldContinue || cancelled) {
                    break;
                }

                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        };
        fetchPreviewData();
        return () => { cancelled = true; };
    }, [isPreviewOpen, currentTenantSlug, currentUploadSyncId, isDemoSimulationSyncId]);

    // Computed preview values
    const previewTotalRecovery = useMemo(() => previewResults.reduce((s, r) => s + (r.estimated_value || 0), 0), [previewResults]);
    const previewCurrency = previewResults[0]?.currency || 'USD';
    const fmt = useCallback((val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: previewCurrency }).format(val), [previewCurrency]);
    const previewTopTypes = useMemo(() => {
        const groups: Record<string, { count: number; value: number }> = {};
        previewResults.forEach(r => {
            if (!groups[r.anomaly_type]) groups[r.anomaly_type] = { count: 0, value: 0 };
            groups[r.anomaly_type].count++;
            groups[r.anomaly_type].value += r.estimated_value || 0;
        });
        return Object.entries(groups).sort((a, b) => b[1].value - a[1].value);
    }, [previewResults]);
    const previewDates = useMemo(() => {
        const ds = previewResults.map(r => r.discovery_date ? new Date(r.discovery_date).getTime() : NaN).filter(n => !isNaN(n));
        if (ds.length === 0) return null;
        const fmtD = (t: number) => new Date(t).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });
        return { from: fmtD(Math.min(...ds)), to: fmtD(Math.max(...ds)) };
    }, [previewResults]);
    const findingsProofCount = useMemo(() => {
        if (typeof previewResultsTotal === 'number') {
            return previewResultsTotal;
        }
        if (previewResults.length > 0) {
            return previewResults.length;
        }
        if (rehydratedRun?.detection?.resultsTotal !== undefined && rehydratedRun?.detection?.resultsTotal !== null) {
            return rehydratedRun.detection.resultsTotal;
        }
        if (previewState.status === 'completed') {
            return 0;
        }
        return null;
    }, [previewResults.length, previewResultsTotal, previewState.status, rehydratedRun?.detection?.resultsTotal]);
    const recoveryProofValue = useMemo(() => {
        if (previewResults.length > 0) {
            return previewTotalRecovery;
        }
        if (previewState.status === 'completed' && findingsProofCount === 0) {
            return 0;
        }
        return null;
    }, [findingsProofCount, previewResults.length, previewState.status, previewTotalRecovery]);
    const runStartedMs = useMemo(
        () => parseTimestampMs(rehydratedRun?.startedAt) ?? uploadRequestStartedAt,
        [rehydratedRun?.startedAt, uploadRequestStartedAt]
    );
    const detectionProcessedMs = useMemo(
        () => parseTimestampMs(previewState.processedAt) ?? parseTimestampMs(rehydratedRun?.completedAt),
        [previewState.processedAt, rehydratedRun?.completedAt]
    );
    const uploadAcceptedDurationMs = useMemo(() => {
        if (uploadRequestStartedAt === null || uploadAcceptedAt === null) {
            return null;
        }
        return Math.max(0, uploadAcceptedAt - uploadRequestStartedAt);
    }, [uploadAcceptedAt, uploadRequestStartedAt]);
    const detectionCompletedDurationMs = useMemo(() => {
        if (runStartedMs === null || detectionProcessedMs === null) {
            return null;
        }
        return Math.max(0, detectionProcessedMs - runStartedMs);
    }, [detectionProcessedMs, runStartedMs]);
    const pipelineElapsedMs = useMemo(() => {
        if (runStartedMs === null) {
            return null;
        }
        const endpoint = isDetectionTerminal(previewState.status) && detectionProcessedMs !== null
            ? detectionProcessedMs
            : elapsedNow;
        return Math.max(0, endpoint - runStartedMs);
    }, [detectionProcessedMs, elapsedNow, previewState.status, runStartedMs]);
    const detectionStateLabel = useMemo(
        () => formatDetectionStateLabel(previewState.status),
        [previewState.status]
    );
    const recoveryProofLabel = useMemo(() => {
        if (recoveryProofValue === null) {
            return NOT_AVAILABLE;
        }
        const formattedValue = fmt(recoveryProofValue);
        return previewIsTruncated && recoveryProofValue > 0 ? `${formattedValue} (loaded subset)` : formattedValue;
    }, [fmt, previewIsTruncated, recoveryProofValue]);
    const isWaitingForDetectionGate = Boolean(redirectGateSyncId)
        && previewState.syncId === redirectGateSyncId
        && !isDetectionTerminal(previewState.status);
    const pipelineStage = useMemo(() => {
        if (isUploading) {
            return {
                eyebrow: 'Stage 1 · Uploading files',
                title: 'Sending this CSV batch to your workspace',
                description: 'Margin is pushing your files into the ingestion path now so the recovery pipeline can start.',
                tone: 'neutral' as const,
            };
        }

        if (previewState.status === 'failed') {
            return {
                eyebrow: 'Detection needs attention',
                title: 'This upload hit a detection failure',
                description: previewState.errorMessage || 'The upload finished ingestion, but detection did not complete cleanly for this batch.',
                tone: 'failed' as const,
            };
        }

        if (previewState.syncId && isDetectionInFlight(previewState.status)) {
            if (typeof findingsProofCount === 'number' && findingsProofCount > 0) {
                return {
                    eyebrow: 'Stage 4 · Findings detected',
                    title: `${pluralize(findingsProofCount, 'finding')} already surfaced for this upload`,
                    description: recoveryProofValue !== null
                        ? `Margin already sees ${recoveryProofLabel} while the rest of detection finishes.`
                        : 'Margin is still finishing detection, but early findings are already available for review.',
                    tone: 'success' as const,
                };
            }

            return {
                eyebrow: 'Stage 3 · Detection running',
                title: 'Margin is analyzing the ingested records now',
                description: 'The upload was accepted and the detection queue is actively moving toward recoverable findings.',
                tone: 'neutral' as const,
            };
        }

        if (previewState.status === 'completed') {
            if (typeof findingsProofCount === 'number' && findingsProofCount > 0) {
                return {
                    eyebrow: 'Stage 5 · Ready to review',
                    title: `${pluralize(findingsProofCount, 'finding')} ready to review`,
                    description: recoveryProofValue !== null
                        ? `Margin surfaced ${recoveryProofLabel} for this upload and the results are ready now.`
                        : 'Detection finished and the findings for this upload are ready to review.',
                    tone: 'success' as const,
                };
            }

            return {
                eyebrow: 'Stage 5 · Detection complete',
                title: 'No findings were returned for this upload',
                description: 'Margin completed detection for this upload and did not surface new recoveries.',
                tone: 'neutral' as const,
            };
        }

        if (currentUploadSyncId) {
            return {
                eyebrow: 'Stage 2 · Upload accepted',
                title: 'Upload accepted and queued for detection',
                description: 'Margin has accepted this batch and is preparing the next detection pass for this workspace.',
                tone: 'neutral' as const,
            };
        }

        if (rehydratedRun) {
            return {
                eyebrow: 'Restored upload truth',
                title: 'Latest CSV run restored from persisted backend truth',
                description: rehydrationNotice || 'Margin recovered the latest CSV upload state for this workspace.',
                tone: 'neutral' as const,
            };
        }

        return null;
    }, [
        currentUploadSyncId,
        findingsProofCount,
        isUploading,
        previewState.errorMessage,
        previewState.status,
        previewState.syncId,
        recoveryProofLabel,
        recoveryProofValue,
        rehydratedRun,
        rehydrationNotice,
    ]);
    const pipelineToneClasses = useMemo(() => {
        switch (pipelineStage?.tone) {
            case 'success':
                return {
                    icon: 'text-emerald-300',
                    eyebrow: 'text-emerald-200/80',
                    title: 'text-[#182026]',
                    chip: 'border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-100',
                };
            case 'failed':
                return {
                    icon: 'text-red-300',
                    eyebrow: 'text-red-200/80',
                    title: 'text-[#182026]',
                    chip: 'border-red-500/20 bg-red-500/[0.08] text-red-100',
                };
            default:
                return {
                    icon: 'text-[#182026]',
                    eyebrow: 'text-[#66737F]',
                    title: 'text-[#182026]',
                    chip: 'border-[#D8E3EA] bg-[#FAFAF7] text-[#182026]',
                };
        }
    }, [pipelineStage?.tone]);
    const pipelineProofItems = useMemo(() => {
        const items: Array<{ label: string; value: string }> = [];

        if (currentUploadSyncId) {
            items.push({ label: 'Sync ID', value: currentUploadSyncId });
        }

        if (previewState.status) {
            items.push({ label: 'Detection state', value: detectionStateLabel });
        }

        if (typeof findingsProofCount === 'number') {
            items.push({ label: 'Findings', value: pluralize(findingsProofCount, 'finding') });
        }

        if (recoveryProofValue !== null || previewState.status) {
            items.push({ label: 'Estimated recovery', value: recoveryProofLabel });
        }

        if (uploadAcceptedDurationMs !== null) {
            items.push({ label: 'Upload accepted in', value: formatDurationLabel(uploadAcceptedDurationMs) });
        }

        if (detectionCompletedDurationMs !== null) {
            items.push({ label: 'Detection completed in', value: formatDurationLabel(detectionCompletedDurationMs) });
        } else if (pipelineElapsedMs !== null && (isUploading || isDetectionInFlight(previewState.status))) {
            items.push({ label: 'Elapsed', value: formatDurationLabel(pipelineElapsedMs) });
        }

        if (previewState.processedAt) {
            items.push({ label: 'Processed', value: formatPipelineTimestamp(previewState.processedAt) });
        }

        if (rehydratedRun?.source && rehydratedRun.source !== 'persisted_run') {
            items.push({ label: 'Source', value: formatCsvRecoverySource(rehydratedRun.source) });
        }

        if (previewState.isSandbox) {
            items.push({ label: 'Environment', value: 'Sandbox' });
        }

        return items;
    }, [
        currentUploadSyncId,
        detectionCompletedDurationMs,
        detectionStateLabel,
        findingsProofCount,
        isUploading,
        pipelineElapsedMs,
        previewState.isSandbox,
        previewState.processedAt,
        previewState.status,
        recoveryProofLabel,
        recoveryProofValue,
        rehydratedRun?.source,
        uploadAcceptedDurationMs,
    ]);
    const drawerSummaryItems = useMemo(() => [
        {
            label: 'Current stage',
            value: pipelineStage?.eyebrow.replace('Stage ', '').replace(' · ', ' · ') || NOT_AVAILABLE,
        },
        {
            label: 'Detection state',
            value: detectionStateLabel,
        },
        {
            label: 'Findings',
            value: typeof findingsProofCount === 'number' ? pluralize(findingsProofCount, 'finding') : NOT_AVAILABLE,
        },
        {
            label: 'Estimated recovery',
            value: recoveryProofLabel,
        },
        {
            label: detectionCompletedDurationMs !== null ? 'Detection completed in' : 'Elapsed',
            value: detectionCompletedDurationMs !== null
                ? formatDurationLabel(detectionCompletedDurationMs)
                : formatDurationLabel(pipelineElapsedMs),
        },
        {
            label: 'Processed',
            value: formatPipelineTimestamp(previewState.processedAt),
        },
    ], [
        detectionCompletedDurationMs,
        detectionStateLabel,
        findingsProofCount,
        pipelineElapsedMs,
        pipelineStage?.eyebrow,
        previewState.processedAt,
        recoveryProofLabel,
    ]);
    const amazonFilingCaseCountLabel = useMemo(
        () => (typeof findingsProofCount === 'number' ? pluralize(findingsProofCount, 'case') : NOT_AVAILABLE),
        [findingsProofCount]
    );
    const amazonFilingCaseCopy = useMemo(() => {
        if (typeof findingsProofCount !== 'number') {
            return 'Margin will show the Amazon filing count as soon as detection returns finding totals for this upload.';
        }

        if (findingsProofCount === 0) {
            return 'No Amazon filing cases are being prepared from this upload yet. If detection surfaces discrepancies, they will appear here first.';
        }

        if (isDetectionInFlight(previewState.status)) {
            return `Margin has already identified ${pluralize(findingsProofCount, 'case')} moving toward Amazon filing. Final evidence and duplicate checks continue before anything is submitted.`;
        }

        return `Margin is preparing ${pluralize(findingsProofCount, 'case')} from these preview findings for the Amazon filing workflow. Submission still follows evidence, review, and Auto-File controls.`;
    }, [findingsProofCount, previewState.status]);

    // Handle file selection
    const addFiles = useCallback((newFiles: FileList | File[]) => {
        const validFiles = Array.from(newFiles).filter(f => {
            const ext = f.name.toLowerCase().slice(f.name.lastIndexOf('.'));
            return ['.csv', '.txt', '.tsv'].includes(ext);
        });

        if (validFiles.length === 0) {
            toast({ title: 'Invalid file type', description: 'Only CSV, TXT, and TSV files are accepted.', variant: 'destructive' });
            return;
        }

        const uploadFiles: UploadFile[] = validFiles.map(file => ({
            file,
            id: `${file.name}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            status: 'pending' as const,
        }));

        setFiles(prev => [...prev, ...uploadFiles]);
        setBatchResult(null);
        setIsPreviewOpen(false);
        setPreviewResults([]);
        setPreviewResultsTotal(null);
        setPreviewMessage(null);
        setPreviewState({
            syncId: null,
            status: null,
            processedAt: null,
            errorMessage: null,
            isSandbox: false,
        });
        setUploadRequestStartedAt(null);
        setUploadAcceptedAt(null);
        setRehydratedRun(null);
        setRehydrationNotice(null);
    }, [toast]);

    // Remove a file
    const removeFile = useCallback((id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    }, []);

    // Drag and drop handlers
    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        if (e.dataTransfer.files?.length) {
            addFiles(e.dataTransfer.files);
        }
    }, [addFiles]);

    // Upload files to backend
    const handleUpload = async () => {
        if (files.length === 0 || isUploading) return;
        clearDashboardRedirect();
        clearDetectionGateTimeout();
        setRedirectGateSyncId(null);
        setDetectionRedirectTimedOut(false);
        const { userId: resolvedUserId, tenantId: resolvedTenantId } = await resolveSessionIdentity();

        if (isDemoWorkspace) {
            invalidateDetectionPolling();
            const startedAt = Date.now();
            setUploadRequestStartedAt(startedAt);
            setUploadAcceptedAt(null);
            setIsUploading(true);
            setBatchResult(null);
            setIsPreviewOpen(false);
            setPreviewResults([]);
            setPreviewResultsTotal(null);
            setPreviewMessage(null);
            setRehydrationNotice(null);
            setRehydratedRun(null);
            setPreviewState({
                syncId: null,
                status: null,
                processedAt: null,
                errorMessage: null,
                isSandbox: false,
            });
            setFiles(prev => prev.map(f => ({ ...f, status: 'uploading' as const })));

            try {
                await new Promise(resolve => setTimeout(resolve, 950));

                const syncId = `${DEMO_CSV_SYNC_PREFIX}${Date.now().toString(36)}`;
                const sellerId = resolvedUserId || 'demo-user-0001';
                const csvTypes = files.map(({ file }) => inferDemoCsvType(file.name));
                const ingestionResults: IngestionFileResult[] = files.map(({ file }, index) => {
                    const csvType = csvTypes[index];
                    const metrics = getDemoCsvMetrics(csvType, index);
                    return {
                        success: true,
                        csvType,
                        fileName: file.name,
                        rowsProcessed: metrics.rowsProcessed,
                        rowsInserted: metrics.rowsInserted,
                        rowsSkipped: metrics.rowsSkipped,
                        rowsFailed: 0,
                        errors: [],
                        detectionTriggered: true,
                    };
                });
                const previewFindings = buildDemoPreviewResults(syncId, sellerId, csvTypes);
                const processedAtIso = new Date(startedAt + 2800).toISOString();
                const demoBatchResult: BatchResult = {
                    success: true,
                    userId: sellerId,
                    totalFiles: files.length,
                    results: ingestionResults,
                    detectionTriggered: true,
                    syncId,
                };
                const demoRun: CsvRunRehydrationRecord = {
                    syncId,
                    source: 'persisted_run',
                    uploadSummaryAvailable: true,
                    recoveryNotice: null,
                    createdAt: new Date(startedAt).toISOString(),
                    updatedAt: processedAtIso,
                    startedAt: new Date(startedAt).toISOString(),
                    completedAt: processedAtIso,
                    status: 'completed',
                    fileCount: files.length,
                    filesSummary: ingestionResults.map((result, index) => ({
                        fileName: result.fileName,
                        mimeType: files[index]?.file.type || 'text/csv',
                        status: 'ingested',
                        csvType: result.csvType as CsvRunFileSummary['csvType'],
                        rowsProcessed: result.rowsProcessed,
                        rowsInserted: result.rowsInserted,
                        rowsSkipped: result.rowsSkipped,
                        rowsFailed: result.rowsFailed,
                        errors: result.errors,
                        detectionTriggered: true,
                    })),
                    detectionTriggered: true,
                    error: null,
                    isSandbox: false,
                    batchResult: demoBatchResult,
                    detection: {
                        status: 'completed',
                        processedAt: processedAtIso,
                        errorMessage: null,
                        resultsTotal: previewFindings.length,
                        isSandbox: false,
                    },
                };
                const demoRecord: DemoCsvSimulationRecord = {
                    run: demoRun,
                    previewResults: previewFindings,
                };

                setBatchResult(demoBatchResult);
                setUploadAcceptedAt(Date.now());
                try {
                    localStorage.setItem(latestCsvSyncStorageKey, syncId);
                    sessionStorage.removeItem(dismissedCsvSyncStorageKey);
                } catch (_error) {
                    // Local refresh fallback is best-effort only.
                }
                persistDemoCsvSimulation(demoRecord);
                setPreviewState({
                    syncId,
                    status: 'completed',
                    processedAt: processedAtIso,
                    errorMessage: null,
                    isSandbox: false,
                });
                setRehydratedRun(demoRun);
                setPreviewResults(previewFindings);
                setPreviewResultsTotal(previewFindings.length);
                setPreviewMessage(null);
                setIsPreviewOpen(true);
                setFiles(prev => prev.map((entry, index) => ({
                    ...entry,
                    status: 'success' as const,
                    detectedType: ingestionResults[index]?.csvType,
                    rowsInserted: ingestionResults[index]?.rowsInserted,
                    rowsSkipped: ingestionResults[index]?.rowsSkipped,
                    rowsFailed: ingestionResults[index]?.rowsFailed,
                    error: undefined,
                })));

                const totalRows = ingestionResults.reduce((sum, result) => sum + result.rowsInserted, 0);
                toast({
                    title: `${files.length} file${files.length > 1 ? 's' : ''} imported`,
                    description: `${totalRows.toLocaleString()} rows prepared for review · ${previewFindings.length} findings ready for the dashboard.`,
                });
            } catch (error: any) {
                const failureMessage = combineBackendMessages(error?.message, 'Demo upload could not be prepared.') || 'Demo upload could not be prepared.';
                toast({ title: 'Upload failed', description: failureMessage, variant: 'destructive' });
                setFiles(prev => prev.map(f => ({ ...f, status: 'error' as const, error: failureMessage })));
            } finally {
                setIsUploading(false);
            }
            return;
        }

        const { token: sessionToken } = await getFrontendAuthContext();

        if (!resolvedUserId) {
            toast({
                title: 'Sign in required',
                description: 'CSV upload needs a real signed-in user. Refresh your session and try again.',
                variant: 'destructive',
            });
            return;
        }
        if (!sessionToken) {
            toast({
                title: 'Session expired',
                description: 'CSV upload needs a live account session. Refresh the page and sign in again if needed.',
                variant: 'destructive',
            });
            return;
        }
        if (!currentTenantSlug && !resolvedTenantId) {
            toast({
                title: 'Workspace context missing',
                description: 'CSV upload needs an active workspace before it can write tenant-scoped data.',
                variant: 'destructive',
            });
            return;
        }

        invalidateDetectionPolling();
        setUploadRequestStartedAt(Date.now());
        setUploadAcceptedAt(null);
        setIsUploading(true);
        setBatchResult(null);
        setIsPreviewOpen(false);
        setPreviewResults([]);
        setPreviewResultsTotal(null);
        setPreviewMessage(null);
        setRehydrationNotice(null);
        setRehydratedRun(null);
        setPreviewState({
            syncId: null,
            status: null,
            processedAt: null,
            errorMessage: null,
            isSandbox: false,
        });

        // Mark all files as uploading
        setFiles(prev => prev.map(f => ({ ...f, status: 'uploading' as const })));

        try {
            const formData = new FormData();
            files.forEach(f => formData.append('files', f.file));

            const endpoint = `/api/csv-upload/ingest?tenantSlug=${encodeURIComponent(currentTenantSlug)}`;

            const url = api.buildApiUrl(endpoint);
            const response = await fetch(url, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
                    ...(resolvedUserId ? { 'x-user-id': resolvedUserId } : {}),
                    ...(resolvedTenantId ? { 'x-tenant-id': resolvedTenantId } : {}),
                },
                body: formData,
            });

            const result: BatchResult = await response.json();
            if (!response.ok || !result) {
                const reason = combineBackendMessages(
                    result?.error,
                    result?.details,
                    `Server returned ${response.status}`,
                ) || `Server returned ${response.status}`;
                throw new Error(reason);
            }
            setBatchResult(result);
            setUploadAcceptedAt(Date.now());
            try {
                if (result.syncId) {
                    localStorage.setItem(latestCsvSyncStorageKey, result.syncId);
                    sessionStorage.removeItem(dismissedCsvSyncStorageKey);
                }
            } catch (_error) {
                // Local refresh fallback is best-effort only.
            }
            setPreviewState({
                syncId: result.syncId || null,
                status: null,
                processedAt: null,
                errorMessage: null,
                isSandbox: false,
            });

            // Update individual file statuses
            setFiles(prev => prev.map(f => {
                const fileResult = result.results?.find(r => r.fileName === f.file.name);
                if (fileResult) {
                    const isSkippedOnly = fileResult.success && fileResult.rowsInserted === 0 && (fileResult.rowsSkipped || 0) > 0 && fileResult.rowsFailed === 0;
                    return {
                        ...f,
                        status: fileResult.success ? (isSkippedOnly ? 'skipped' as const : 'success' as const) : 'error' as const,
                        detectedType: fileResult.csvType,
                        rowsInserted: fileResult.rowsInserted,
                        rowsSkipped: fileResult.rowsSkipped,
                        rowsFailed: fileResult.rowsFailed,
                        error: fileResult.errors?.join('; '),
                    };
                }
                return { ...f, status: 'error' as const, error: 'No result from server' };
            }));

            // Show toast
            const insertedFileCount = result.results?.filter(r => r.rowsInserted > 0).length || 0;
            const skippedOnlyCount = result.results?.filter(r => r.success && r.rowsInserted === 0 && (r.rowsSkipped || 0) > 0 && r.rowsFailed === 0).length || 0;
            const failedCount = result.results?.filter(r => !r.success || r.rowsFailed > 0).length || 0;
            const totalRows = result.results?.reduce((sum, r) => sum + r.rowsInserted, 0) || 0;
            const totalSkipped = result.results?.reduce((sum, r) => sum + (r.rowsSkipped || 0), 0) || 0;
            let detectionTruth: any = null;

            if (result.detectionTriggered && result.syncId) {
                armDetectionRedirectGate(result.syncId);
                const pollingToken = beginDetectionPolling(result.syncId);
                detectionTruth = await loadUploadDetectionTruth(result.syncId, pollingToken);
                if (detectionTruth && shouldOpenDetectionPreview(detectionTruth) && detectionTruth.status === 'completed') {
                    setIsPreviewOpen(true);
                }
                void pollForUploadDetections(result.syncId, pollingToken, true);
            }

            if (insertedFileCount > 0) {
                const detectionMessage = getDetectionToastMessage(detectionTruth);
                toast({
                    title: `${insertedFileCount} file${insertedFileCount > 1 ? 's' : ''} imported`,
                    description: `${totalRows.toLocaleString()} rows persisted${totalSkipped > 0 ? ` · ${totalSkipped.toLocaleString()} skipped` : ''}${failedCount > 0 ? ` · ${failedCount} file${failedCount > 1 ? 's' : ''} need attention` : ''}${detectionMessage ? ` · ${detectionMessage}` : ''}`,
                });
            } else if (skippedOnlyCount > 0 && failedCount === 0) {
                toast({
                    title: 'Files already imported',
                    description: `${totalSkipped.toLocaleString()} rows skipped because these files were already ingested for this workspace.`,
                });
            } else {
                toast({
                    title: 'Upload failed',
                    description: result.results?.[0]?.errors?.[0] || 'Could not process the uploaded files.',
                    variant: 'destructive',
                });
            }

        } catch (error: any) {
            const failureMessage = combineBackendMessages(error?.message, 'Network error') || 'Network error';
            toast({ title: 'Upload failed', description: failureMessage, variant: 'destructive' });
            setFiles(prev => prev.map(f => ({ ...f, status: 'error' as const, error: failureMessage })));
        } finally {
            setIsUploading(false);
        }
    };

    // Reset for new upload
    const handleReset = () => {
        const dismissedSyncId = batchResult?.syncId || rehydratedRun?.syncId || previewState.syncId;
        clearDashboardRedirect();
        clearDetectionGateTimeout();
        setRedirectGateSyncId(null);
        setDetectionRedirectTimedOut(false);
        setUploadRequestStartedAt(null);
        setUploadAcceptedAt(null);

        try {
            if (dismissedSyncId) {
                sessionStorage.setItem(dismissedCsvSyncStorageKey, dismissedSyncId);
            } else {
                sessionStorage.removeItem(dismissedCsvSyncStorageKey);
            }
        } catch (_error) {
            // Session dismissal is best-effort only.
        }

        if (isDemoWorkspace) {
            persistDemoCsvSimulation(null);
            try {
                localStorage.removeItem(latestCsvSyncStorageKey);
            } catch (_error) {
                // Local fallback cleanup is best-effort only.
            }
        }

        invalidateDetectionPolling();
        setFiles([]);
        setBatchResult(null);
        setIsPreviewOpen(false);
        setPreviewResults([]);
        setPreviewResultsTotal(null);
        setPreviewMessage(null);
        setRehydrationNotice(null);
        setRehydratedRun(null);
        setPreviewState({
            syncId: null,
            status: null,
            processedAt: null,
            errorMessage: null,
            isSandbox: false,
        });
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Format file size
    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const totalRowsInserted = batchResult?.results?.reduce((sum, r) => sum + r.rowsInserted, 0) || 0;
    const totalRowsSkipped = batchResult?.results?.reduce((sum, r) => sum + (r.rowsSkipped || 0), 0) || 0;
    const totalRowsFailed = batchResult?.results?.reduce((sum, r) => sum + r.rowsFailed, 0) || 0;
    const successCount = batchResult?.results?.filter(r => r.success).length || 0;
    const hasResettableWorkspaceState = files.length > 0
        || Boolean(batchResult)
        || Boolean(rehydratedRun)
        || Boolean(previewState.syncId)
        || previewResults.length > 0
        || isPreviewOpen;
    const canGoToDashboard = !isUploading
        && Boolean(batchResult?.syncId || rehydratedRun?.syncId || previewState.syncId)
        && (!isWaitingForDetectionGate || detectionRedirectTimedOut);

    return (
        <PageLayout title="Upload reports" noPadding hideNavbar={true} hideSidebar={true} hideLogo={true} plainBackground>
            <div className="platform-vitality-page min-h-screen bg-[#FAFAF7] text-[#182026] relative">
                <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-6 sm:px-8 sm:py-8">
                    {/* Header */}
                    <header className="mb-8">
                        <div className="flex flex-col gap-2">
                            <p className="text-[13px] font-medium text-[#0B74DE]">Manual Ingestion</p>
                            <h1 className="font-playfair text-[30px] font-medium leading-[1.15] tracking-tight text-[#182026] md:text-[40px]" style={{ fontFamily: "'Playfair Display', serif !important", fontWeight: 500 }}>
                                Upload Reports
                            </h1>
                            <p className="max-w-2xl text-[14px] leading-6 text-[#4D5B66]">
                                Upload Amazon reports to supplement the Selling Partner API, backfill historical coverage, or provide the exact records Margin needs to complete an examination.
                            </p>
                            {returnToAudit && (
                                <Link to={tenantRoute(currentTenantSlug, '/audit')} className="mt-2 inline-flex items-center text-[13px] font-medium text-[#0B74DE] transition-colors hover:text-[#075EA8]">
                                    ← Return to audit workspace
                                </Link>
                            )}
                        </div>
                    </header>

                    {/* Drop Zone */}
                    <div className="relative">
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`
                relative cursor-pointer rounded-lg border border-dashed transition-all duration-200
                ${isDragOver
                                    ? 'border-[#0B74DE] bg-[#F5F5F5]'
                                    : 'border-[#D8E3EA] bg-white hover:border-zinc-300 hover:bg-[#FAFAF7]'
                                }
                ${files.length > 0 ? 'py-6 px-5' : 'py-12 px-5'}
              `}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".csv,.txt,.tsv"
                                multiple
                                onChange={e => e.target.files && addFiles(e.target.files)}
                                className="hidden"
                            />

                            {files.length === 0 ? (
                                <div className="flex flex-col items-center gap-4">
                                    <div className={`rounded-lg border border-[#D8E3EA] p-3 transition-all duration-200 ${isDragOver ? 'bg-[#F5F5F5]' : 'bg-white'}`}>
                                        <FileSpreadsheet className={`h-8 w-8 ${isDragOver ? 'text-[#0B74DE]' : 'text-[#94A3B8]'}`} />
                                    </div>
                                    <div className="text-center">
                                        <p className="mb-1 text-[14px] font-medium text-[#182026]">
                                            Drop CSV files here or <span className="text-[#0B74DE] hover:text-[#075EA8]">browse</span>
                                        </p>
                                        <p className="text-[12px] text-[#66737F]">
                                            Margin auto-detects each Amazon report by its headers.
                                        </p>
                                        <p className="mt-2 text-[11px] text-[#94A3B8]">
                                            {supportedTypeNames.length > 0
                                                ? `Supported: ${supportedTypeNames.join(', ')}`
                                                : 'Supported: orders, shipments, returns, settlements, inventory, fees'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4 mt-2 font-sans text-[11px] font-medium tracking-tight text-[#66737F]">
                                        <span>CSV • TXT • TSV</span>
                                        <span>•</span>
                                        <span>Up to 50 MB each</span>
                                        <span>•</span>
                                        <span>Up to 10 files</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2" onClick={e => e.stopPropagation()}>
                                    <AnimatePresence mode="popLayout">
                                        {files.map(f => (
                                            <div
                                                key={f.id}
                                                className="flex items-center gap-3 py-2 px-3 rounded-lg border border-[#D8E3EA] bg-white"
                                            >
                                                <FileSpreadsheet className="h-4 w-4 text-[#94A3B8] flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="truncate text-[13px] font-medium text-[#182026]">{f.file.name}</p>
                                                    <p className="text-[11px] text-[#66737F]">
                                                        {formatSize(f.file.size)}
                                                        {f.detectedType && <span className="ml-2 text-[#4D5B66]">· {f.detectedType}</span>}
                                                        {f.rowsInserted !== undefined && <span className="ml-2 text-[#66737F]">· {f.rowsInserted.toLocaleString()} rows</span>}
                                                    </p>
                                                </div>

                                                {/* Status indicator */}
                                                {f.status === 'uploading' && <Loader2 className="h-3.5 w-3.5 text-[#0B74DE] animate-spin flex-shrink-0" />}
                                                {f.status === 'success' && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />}
                                                {f.status === 'skipped' && <Archive className="h-3.5 w-3.5 text-amber-400 flex-shrink-0" />}
                                                {f.status === 'error' && (
                                                    <span title={f.error}>
                                                        <AlertCircle className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                                                    </span>
                                                )}

                                                {/* Remove button */}
                                                {!isUploading && !batchResult && f.status !== 'uploading' && (
                                                    <button
                                                        onClick={() => removeFile(f.id)}
                                                        className="p-1 rounded-md hover:bg-[#F5F5F5] text-[#94A3B8] transition-colors"
                                                        aria-label={`Remove ${f.file.name}`}
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </AnimatePresence>

                                    {/* Add more link */}
                                    {!isUploading && !batchResult && (
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full py-2 text-xs text-[#66737F] hover:text-[#4D5B66] transition-colors font-sans font-bold uppercase tracking-tight"
                                        >
                                            + Add more files
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {pipelineStage && (
                        <div className="mt-6 rounded-lg border border-[#D8E3EA] bg-[#FAFAF7] p-4">
                            <div className="flex items-start gap-3">
                                {pipelineStage.tone === 'success' ? (
                                    <CheckCircle2 className="h-4 w-4 mt-0.5 flex-shrink-0 text-emerald-500" />
                                ) : pipelineStage.tone === 'failed' ? (
                                    <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-red-500" />
                                ) : (
                                    <Loader2 className={`h-4 w-4 mt-0.5 flex-shrink-0 text-[#0B74DE] ${isUploading || isDetectionInFlight(previewState.status) ? 'animate-spin' : ''}`} />
                                )}
                                <div className="min-w-0 flex-1">
                                    <p className="text-[12px] font-medium text-[#0B74DE]">
                                        {pipelineStage.eyebrow}
                                    </p>
                                    <p className="mt-1 text-[16px] font-medium tracking-tight text-[#182026]">
                                        {pipelineStage.title}
                                    </p>
                                    <p className="mt-2 text-[13px] leading-6 text-[#4D5B66]">
                                        {pipelineStage.description}
                                    </p>

                                    {pipelineProofItems.length > 0 && (
                                        <div className="mt-4 flex flex-wrap gap-3">
                                            {pipelineProofItems.map((item) => (
                                                <div
                                                    key={`${item.label}-${item.value}`}
                                                    className="inline-flex items-center gap-2 rounded-md border border-[#D8E3EA] bg-white px-2.5 py-1 text-[11px] font-medium"
                                                >
                                                    <span className="text-[#66737F]">{item.label}</span>
                                                    <span className="text-[#182026]">{item.value}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {rehydrationNotice && rehydratedRun && !isUploading && (
                                        <p className="mt-3 text-[10px] font-sans leading-5 tracking-tight text-[#66737F]">
                                            {rehydrationNotice}
                                        </p>
                                    )}

                                    {isWaitingForDetectionGate && (
                                        <p className="mt-3 text-[11px] font-sans leading-5 text-[#66737F]">
                                            Margin is keeping this upload open until detection settles so you can move to review with real filing proof, not a blind redirect.
                                        </p>
                                    )}

                                    {detectionRedirectTimedOut && (
                                        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                            <p className="text-[11px] font-sans leading-5 text-[#66737F]">
                                                Detection is still moving. You can keep waiting here or continue to the dashboard manually.
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <Button
                                                    onClick={startDetectionRedirectTimeout}
                                                    variant="outline"
                                                    className="h-9 px-4 bg-transparent border-[#D8E3EA] text-[#4D5B66] hover:bg-[#F5F5F5]"
                                                >
                                                    Keep Waiting
                                                </Button>
                                                <Button
                                                    onClick={goToDashboard}
                                                    className="h-9 px-4 bg-[#0052FF] text-[#FFFFFF] hover:bg-[#0047DD]"
                                                >
                                                    {returnToAudit ? 'Return to Audit' : 'Continue to Dashboard'} <ArrowRight className="h-4 w-4 ml-2" />
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="mt-6 flex items-center gap-3">
                        {!batchResult && (
                            <Button
                                onClick={handleUpload}
                                disabled={files.length === 0 || isUploading}
                                className="h-10 rounded-[6px] bg-[#182026] px-6 text-[13px] font-medium text-white shadow-none transition-colors hover:bg-[#2C2E35] disabled:opacity-30"
                            >
                                {isUploading ? (
                                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</>
                                ) : (
                                    <>Upload reports {files.length > 0 ? `(${files.length} file${files.length > 1 ? 's' : ''})` : ''}</>
                                )}
                            </Button>
                        )}

                        {hasResettableWorkspaceState && !isUploading && (
                            <Button
                                onClick={handleReset}
                                variant="outline"
                                className="h-10 rounded-[6px] border border-[#D8E3EA] bg-white px-6 text-[13px] font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-[#FAFAF7]"
                            >
                                <X className="h-4 w-4 mr-2" />Clear & Restart
                            </Button>
                        )}

                        {canGoToDashboard && (
                            <Button
                                onClick={goToDashboard}
                                className="h-10 rounded-[6px] bg-[#182026] px-6 text-[13px] font-medium text-white shadow-none transition-colors hover:bg-[#2C2E35]"
                            >
                                {returnToAudit ? 'Return to Audit' : 'Go to Dashboard'} <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        )}
                    </div>

                    {hasResettableWorkspaceState && !isUploading && (
                        <p className="mt-3 text-[11px] text-[#66737F] font-sans tracking-tight">
                            Clears this upload workspace so you can start a fresh batch. Imported backend data is not removed here.
                        </p>
                    )}

                    {/* Results Summary */}
                    {batchResult && (
                        <div className="mt-8">
                            {/* Success Banner */}
                            {totalRowsInserted > 0 && (
                                <div className="rounded-xl bg-[#FAFAF7] border border-[#D8E3EA] p-5 mb-4">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-[#182026] mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h3 className="text-sm font-medium text-[#182026] mb-1">
                                                {successCount} file{successCount > 1 ? 's' : ''} ingested successfully
                                            </h3>
                                            <p className="text-xs text-[#4D5B66] mb-3">
                                                {totalRowsInserted.toLocaleString()} rows imported into the database
                                                {totalRowsSkipped > 0 && ` · ${totalRowsSkipped.toLocaleString()} rows skipped`}
                                                {totalRowsFailed > 0 && ` · ${totalRowsFailed.toLocaleString()} rows failed`}
                                            </p>


                                        </div>
                                    </div>
                                </div>
                            )}

                            {totalRowsInserted === 0 && totalRowsSkipped > 0 && totalRowsFailed === 0 && (
                                <div className="rounded-xl bg-gradient-to-r from-amber-500/[0.08] to-yellow-500/[0.04] border border-amber-500/20 p-5 mb-4">
                                    <div className="flex items-start gap-3">
                                        <Archive className="h-5 w-5 text-amber-400 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h3 className="text-sm font-medium text-amber-300 mb-1">
                                                Files were recognized but already imported
                                            </h3>
                                            <p className="text-xs text-[#4D5B66]">
                                                {totalRowsSkipped.toLocaleString()} rows were skipped because the backend marked these files as duplicates for this workspace.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {totalRowsFailed > 0 && (
                                <div className="rounded-xl bg-gradient-to-r from-red-500/[0.08] to-orange-500/[0.04] border border-red-500/20 p-5 mb-4">
                                    <div className="flex items-start gap-3">
                                        <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h3 className="text-sm font-medium text-red-300 mb-1">
                                                Some files need attention
                                            </h3>
                                            <p className="text-xs text-[#4D5B66]">
                                                {totalRowsFailed.toLocaleString()} rows failed validation or persistence. Review the per-file errors below before retrying.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Per-file Results */}
                            {batchResult.results?.map((r, i) => (
                                <div
                                    key={i}
                                    className={`rounded-lg border p-4 mb-2 ${r.success
                                        ? 'bg-[#FAFAF7] border-[#D8E3EA]'
                                        : 'bg-red-500/[0.03] border-red-500/10'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {r.success ? (
                                            <CheckCircle2 className="h-4 w-4 text-[#182026] flex-shrink-0" />
                                        ) : (
                                            <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-[#182026] font-sans font-bold tracking-tight truncate">{r.fileName}</p>
                                            <p className="text-[10px] text-[#66737F] mt-0.5">
                                                Detected as <span className="text-[#66737F]">{r.csvType}</span>
                                                {' · '}{r.rowsProcessed} rows processed
                                                {' · '}{r.rowsInserted} inserted
                                                {(r.rowsSkipped || 0) > 0 && <span className="text-amber-400/70"> · {r.rowsSkipped} skipped</span>}
                                                {r.rowsFailed > 0 && <span className="text-red-400/70"> · {r.rowsFailed} failed</span>}
                                            </p>
                                        </div>
                                    </div>

                                    {r.errors?.length > 0 && (
                                        <div className="mt-2 pl-7">
                                            {r.errors.slice(0, 3).map((err, j) => (
                                                <p key={j} className="text-[10px] text-red-400/60 font-sans tracking-tight truncate uppercase">{err}</p>
                                            ))}
                                            {r.errors.length > 3 && (
                                                <p className="text-[10px] text-[#94A3B8] font-sans tracking-tight uppercase">...and {r.errors.length - 3} more</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Info Section */}
                    <div className="mt-10 rounded-lg border border-[#D8E3EA] bg-[#FAFAF7] p-5">
                        <div className="flex items-start gap-3 mb-4">
                            <Info className="h-4 w-4 text-[#0B74DE] mt-0.5" />
                            <div>
                                <h3 className="text-[13px] font-bold text-[#182026] uppercase tracking-wide mb-1">Forensic Protocol</h3>
                                <p className="text-[13px] text-[#4D5B66] leading-relaxed">
                                    Upload CSV exports from Amazon Seller Central. Margin auto-detects the report type, maps the internal schema, and triggers the detection suite.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                { step: '1', label: 'Upload', desc: 'CSV records' },
                                { step: '2', label: 'Parse', desc: 'Header mapping' },
                                { step: '3', label: 'Ingest', desc: 'Ledger entry' },
                                { step: '4', label: 'Detect', desc: 'Reconciliation' },
                            ].map(s => (
                                <div key={s.step} className="flex items-center gap-2 py-2 px-3 rounded-md border border-[#D8E3EA] bg-white">
                                    <span className="text-[11px] font-bold text-[#0B74DE]">{s.step}</span>
                                    <div>
                                        <p className="text-[12px] text-[#182026] font-medium">{s.label}</p>
                                        <p className="text-[10px] text-[#66737F]">{s.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Preview Drawer */}
                <AnimatePresence>
                    {isPreviewOpen && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsPreviewOpen(false)}
                                className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-[100]"
                            />

                            {/* Drawer */}
                            <motion.div
                                initial={{ y: '100%' }}
                                animate={{ y: '15%' }} // Occupies most of the page but not all
                                exit={{ y: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="platform-vitality-page fixed inset-x-0 bottom-0 top-0 z-[101] overflow-hidden border-t border-[#D8E3EA] bg-white text-[#182026] shadow-[0_-24px_80px_rgba(17,24,39,0.12)] flex flex-col"
                            >
                                {/* Drawer Header */}
                                <div className="border-b border-[#D8E3EA] bg-white px-6 py-4">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2.5 mb-2">
                                                <img src="/logoimagetwo.png" alt="Margin Finance" className="h-3.5 w-auto object-contain invert brightness-0" />
                                                <span className="text-[#94A3B8] font-light text-sm">|</span>
                                                <h2 className="text-[10px] font-sans font-bold text-[#66737F] uppercase tracking-tight">Preview Findings</h2>
                                            </div>
                                            <div className="px-0.5">
                                                <p className="text-[8px] font-sans font-bold text-[#66737F] uppercase tracking-tight leading-none">
                                                    {pipelineStage?.eyebrow || 'Current upload detection summary'}
                                                </p>
                                                <p className="mt-2 text-[14px] font-bold text-[#182026] tracking-tight">
                                                    {pipelineStage?.title || 'Detection summary ready'}
                                                </p>
                                                <p className="mt-1 max-w-3xl text-[11px] font-sans leading-5 text-[#66737F]">
                                                    {previewState.status === 'failed'
                                                        ? pipelineStage?.description || previewEmptyState.description
                                                        : 'These are preview findings from this upload. Margin is turning supported discrepancies into Amazon filing cases and keeping final submission behind evidence, review, and Auto-File controls.'}
                                                </p>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    <span className="inline-flex items-center rounded-full border border-[#D8E3EA] bg-[#F5F5F5] px-2.5 py-1 text-[10px] font-sans font-bold uppercase tracking-tight text-[#182026]">
                                                        {typeof findingsProofCount === 'number' ? `${amazonFilingCaseCountLabel} moving toward filing` : 'Filing count pending'}
                                                    </span>
                                                    {isPreviewPartial && (
                                                        <span className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-sans font-bold uppercase tracking-tight text-amber-300">
                                                            Partial findings live
                                                        </span>
                                                    )}
                                                    {previewState.isSandbox && (
                                                        <span className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[10px] font-sans font-bold uppercase tracking-tight text-amber-300">
                                                            Sandbox mode
                                                        </span>
                                                    )}
                                                    {isPreviewLoading && (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D8E3EA] bg-[#F5F5F5] px-2.5 py-1 text-[10px] font-sans font-bold uppercase tracking-tight text-[#66737F]">
                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                            Refreshing detail
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => setIsPreviewOpen(false)} className="p-1.5 rounded-full text-[#66737F] transition-colors hover:bg-[#F5F5F5] hover:text-[#182026]">
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Drawer Content */}
                                <div className="flex h-full w-full overflow-hidden bg-[#FAFAF7]">
                                    <div className="w-[340px] shrink-0 border-r border-[#D8E3EA] flex flex-col bg-[#F5F5F5]">
                                        <div className="px-5 py-4 border-b border-[#D8E3EA]">
                                            <h3 className="text-[8px] font-sans font-bold text-[#66737F] uppercase tracking-tight mb-3">Summary first</h3>
                                            <div className="grid grid-cols-1 gap-2.5">
                                                {drawerSummaryItems.map((item) => (
                                                    <div key={`${item.label}-${item.value}`} className="border border-[#D8E3EA] bg-white px-3 py-2.5">
                                                        <p className="text-[8px] font-sans font-bold text-[#66737F] uppercase tracking-tight">{item.label}</p>
                                                        <p className="mt-1 text-[11px] font-semibold text-[#182026] tracking-tight">{item.value || NOT_AVAILABLE}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="px-5 py-4 border-b border-[#D8E3EA]">
                                            <h3 className="text-[8px] font-sans font-bold text-[#66737F] uppercase tracking-tight mb-2">Filing assurance</h3>
                                            <div className="border border-[#D8E3EA] bg-white px-3 py-3">
                                                <p className="text-[8px] font-sans font-bold uppercase tracking-tight text-[#66737F]">Amazon cases moving toward filing</p>
                                                <p className="mt-2 text-lg font-bold tracking-tight text-[#182026]">{amazonFilingCaseCountLabel}</p>
                                                <p className="mt-2 text-[10px] font-sans leading-5 text-[#66737F]">{amazonFilingCaseCopy}</p>
                                            </div>
                                        </div>
                                        <div className="px-5 py-4 border-b border-[#D8E3EA]">
                                            <h3 className="text-[8px] font-sans font-bold text-[#66737F] uppercase tracking-tight mb-2">Upload truth</h3>
                                            <ul className="space-y-2">
                                                <li className="flex items-baseline gap-2">
                                                    <span className="text-[9px] font-sans font-bold text-[#66737F] uppercase shrink-0">Account:</span>
                                                    <span className="text-[11px] font-semibold text-[#182026] font-sans tracking-tight truncate">{tenant?.name || currentTenantSlug} (ID: ***{previewResults[0]?.seller_id?.slice(-4) || '----'})</span>
                                                </li>
                                                <li className="flex items-baseline gap-2">
                                                    <span className="text-[9px] font-sans font-bold text-[#66737F] uppercase shrink-0">Sync ID:</span>
                                                    <span className="text-[11px] font-semibold text-[#182026] font-sans tracking-tight truncate">{previewState.syncId || NOT_AVAILABLE}</span>
                                                </li>
                                                <li className="flex items-baseline gap-2">
                                                    <span className="text-[9px] font-sans font-bold text-[#66737F] uppercase shrink-0">Loaded detections:</span>
                                                    <span className="text-[11px] font-semibold text-[#182026] font-sans tracking-tight">{previewLoadedCount} loaded{previewKnownTotal !== previewLoadedCount ? ` of ${previewKnownTotal} total` : ''}</span>
                                                </li>
                                                <li className="flex items-baseline gap-2">
                                                    <span className="text-[9px] font-sans font-bold text-[#66737F] uppercase shrink-0">Recovery proof:</span>
                                                    <span className="text-[11px] font-bold text-[#182026] font-sans tracking-tight">{fmt(previewTotalRecovery)}{previewIsTruncated ? ' (loaded subset)' : ''}</span>
                                                </li>
                                                <li className="flex items-baseline gap-2">
                                                    <span className="text-[9px] font-sans font-bold text-[#66737F] uppercase shrink-0">Period analysed:</span>
                                                    <span className="text-[11px] font-semibold text-[#182026] font-sans tracking-tight">{previewDates ? `${previewDates.from} to ${previewDates.to}` : 'All available data'}</span>
                                                </li>
                                            </ul>
                                        </div>
                                        <div className="px-5 py-4">
                                            <h3 className="text-[8px] font-sans font-bold text-[#66737F] uppercase tracking-tight mb-2">Detection breakdown</h3>
                                            {previewTopTypes.length > 0 ? (
                                                <>
                                                    <p className="text-[9px] font-sans font-bold text-[#66737F] uppercase tracking-tight mb-3">{previewBreakdownLabel}</p>
                                                    <div className="space-y-2">
                                                        {previewTopTypes.slice(0, 5).map(([type, data], idx) => (
                                                            <div key={idx} className="flex items-start justify-between">
                                                                <div className="flex-1 min-w-0 mr-4">
                                                                    <p className="text-[10px] font-bold text-[#182026] leading-none">{formatAnomalyType(type)}</p>
                                                                    <p className="text-[9px] text-[#66737F] mt-0.5 truncate leading-tight font-medium">{data.count} detection{data.count > 1 ? 's' : ''} · {fmt(data.value)}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </>
                                            ) : (
                                                <p className="text-[10px] font-sans leading-5 text-[#4D5B66]">
                                                    Detection categories will populate here as soon as row-level findings are ready for this upload.
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="min-w-0 flex-1 flex flex-col">
                                        <div className="border-b border-[#D8E3EA] bg-[#FAFAF7] px-6 py-4">
                                            <h3 className="text-[9px] font-sans font-bold text-[#66737F] uppercase tracking-tight mb-0.5">Loaded preview findings</h3>
                                            <p className="text-[10px] text-[#66737F] font-sans">{previewResultsSummary}</p>
                                            {previewIsTruncated && (
                                                <p className="mt-1 text-[10px] font-sans font-semibold text-amber-300 tracking-tight">
                                                    Showing first {previewLoadedCount} of {previewKnownTotal} detections. Recovery totals and category summaries below are based on the loaded subset only.
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex-1 overflow-auto p-6">
                                            {previewResults.length === 0 ? (
                                                <div className="flex h-full items-center justify-center">
                                                    <div className="flex max-w-sm flex-col items-center gap-3 text-center">
                                                        <div className="border border-[#D8E3EA] bg-white p-4">
                                                            {isPreviewLoading ? (
                                                                <Loader2 className="h-10 w-10 text-[#66737F] animate-spin" />
                                                            ) : (
                                                                <Target className="h-10 w-10 text-[#66737F]" />
                                                            )}
                                                        </div>
                                                        <h3 className="text-sm font-semibold text-[#182026] font-sans">
                                                            {isPreviewLoading ? 'Row-level detections are still loading' : previewEmptyState.title}
                                                        </h3>
                                                        <p className="text-xs text-[#66737F] font-sans leading-relaxed">
                                                            {isPreviewLoading
                                                                ? 'Margin has already surfaced the upload stage, timing, and current money proof above. Detailed detection rows will appear here as soon as this batch finishes loading.'
                                                                : previewEmptyState.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="w-full">
                                                    <table className="w-full">
                                                        <thead>
                                                            <tr className="border-b border-[#D8E3EA]">
                                                                <th className="text-left py-2 text-[9px] font-sans font-bold text-[#66737F] uppercase tracking-tight">Description</th>
                                                                <th className="text-right py-2 text-[9px] font-sans font-bold text-[#66737F] uppercase tracking-tight">Amount</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-white/8">
                                                            {previewResults.map((row, idx) => {
                                                                const days = row.days_remaining ?? 0;
                                                                const evDesc = row.evidence?.order_id ? `Order: ${row.evidence.order_id}` : row.evidence?.fnsku ? `FNSKU: ${row.evidence.fnsku}` : row.evidence?.shipment_id ? `Shipment: ${row.evidence.shipment_id}` : row.sync_id ? `Sync: ${row.sync_id.slice(0, 8)}...` : `Detection #${idx + 1}`;
                                                                return (
                                                                    <tr key={row.id || idx} className="group">
                                                                        <td className="py-0.5">
                                                                            <p className="text-xs font-semibold text-[#182026] font-sans tracking-tight">{formatAnomalyType(row.anomaly_type)}</p>
                                                                            <p className="text-[9px] font-sans font-bold text-[#66737F] uppercase mt-0.5 tracking-tight">{evDesc} | {row.status}</p>
                                                                        </td>
                                                                        <td className="py-0.5 text-right align-top">
                                                                            <span className="text-xs font-bold text-[#182026] font-sans tracking-tight">{fmt(row.estimated_value)}</span>
                                                                            {days > 0 && <p className="text-[8px] font-sans font-bold mt-0.5 uppercase tracking-tight text-[#66737F]">{days < 20 ? 'deadline: ' : 'expires in: '}{days} days</p>}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </tbody>
                                                        <tfoot>
                                                            <tr className="border-t border-[#D8E3EA]">
                                                                <td className="py-6"><span className="text-[10px] font-sans font-bold text-[#66737F] uppercase tracking-tight">{previewRecoverySummaryLabel}</span></td>
                                                                <td className="py-6 text-right">
                                                                    <span className="text-base font-bold font-sans text-[#182026] tracking-tight">{fmt(previewTotalRecovery)}</span>
                                                                </td>
                                                            </tr>
                                                        </tfoot>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </PageLayout>
    );
}
