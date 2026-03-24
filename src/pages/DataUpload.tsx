import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useParams } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/hooks/use-toast';
import { api, detectionApi } from '@/lib/api';
import { supabase } from '@/lib/supabaseClient';
import {
    Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, X,
    Archive, Target, Info
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

export default function DataUpload() {
    const { tenantSlug: urlTenantSlug } = useParams<{ tenantSlug?: string }>();
    const { tenant } = useTenant();
    const currentTenantSlug = urlTenantSlug || tenant?.slug || 'default';
    const { toast } = useToast();

    const [files, setFiles] = useState<UploadFile[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [batchResult, setBatchResult] = useState<BatchResult | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewResults, setPreviewResults] = useState<PreviewDetectionResult[]>([]);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [previewState, setPreviewState] = useState<UploadDetectionState>({
        syncId: null,
        status: null,
        processedAt: null,
        errorMessage: null,
        isSandbox: false,
    });
    const [previewMessage, setPreviewMessage] = useState<string | null>(null);
    const [supportedCsvTypes, setSupportedCsvTypes] = useState<SupportedCsvType[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const activeTenantId = tenant?.id || localStorage.getItem('active_tenant_id') || '';

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

    const pollForUploadDetections = useCallback(async (syncId: string) => {
        const maxAttempts = 15;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            await new Promise(resolve => setTimeout(resolve, 2000));

            try {
                const statusRes = await detectionApi.getDetectionStatus(syncId, currentTenantSlug);
                if (!statusRes?.ok || !statusRes.data) {
                    continue;
                }

                setPreviewState({
                    syncId,
                    status: statusRes.data.status,
                    processedAt: statusRes.data.processed_at || null,
                    errorMessage: statusRes.data.error_message || null,
                    isSandbox: !!statusRes.data.is_sandbox,
                });

                if (statusRes.data.status === 'completed' || statusRes.data.status === 'failed' || statusRes.data.results.claimsFound > 0) {
                    setIsPreviewOpen(true);
                    return;
                }
            } catch (_error) {
                // Keep polling until the upload-scoped detection status is ready.
            }
        }
    }, [currentTenantSlug]);

    useEffect(() => {
        let cancelled = false;

        const fetchSupportedTypes = async () => {
            try {
                const response = await fetch(api.buildApiUrl(`/api/csv-upload/supported-types?tenantSlug=${encodeURIComponent(currentTenantSlug)}`), {
                    credentials: 'include',
                    headers: activeTenantId ? { 'x-tenant-id': activeTenantId } : undefined,
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

    const currentUploadSyncId = batchResult?.syncId || previewState.syncId;

    // Fetch detection data for the current upload only
    useEffect(() => {
        if (!isPreviewOpen) return;
        if (!currentUploadSyncId) {
            setPreviewResults([]);
            setPreviewMessage('No results available for this upload.');
            setPreviewState(prev => ({ ...prev, syncId: null, status: null, processedAt: null, errorMessage: null, isSandbox: false }));
            return;
        }

        let cancelled = false;
        const fetchPreviewData = async () => {
            setIsPreviewLoading(true);
            try {
                const [statusRes, resultsRes] = await Promise.all([
                    detectionApi.getDetectionStatus(currentUploadSyncId, currentTenantSlug),
                    detectionApi.getDetectionResults({ limit: 500, syncId: currentUploadSyncId }, currentTenantSlug),
                ]);

                if (cancelled) return;

                if (statusRes?.ok && statusRes.data) {
                    setPreviewState({
                        syncId: currentUploadSyncId,
                        status: statusRes.data.status,
                        processedAt: statusRes.data.processed_at || null,
                        errorMessage: statusRes.data.error_message || null,
                        isSandbox: !!statusRes.data.is_sandbox,
                    });
                } else {
                    setPreviewState(prev => ({
                        ...prev,
                        syncId: currentUploadSyncId,
                        status: null,
                        processedAt: null,
                        errorMessage: statusRes?.error || null,
                        isSandbox: false,
                    }));
                }

                if (resultsRes?.ok && Array.isArray(resultsRes.data?.results)) {
                    setPreviewResults(resultsRes.data.results);
                    if (resultsRes.data.results.length > 0) {
                        setPreviewMessage(null);
                    } else if (statusRes?.ok && statusRes.data?.status === 'completed') {
                        setPreviewMessage('No detections found for this upload yet.');
                    } else if (statusRes?.ok && statusRes.data?.status === 'failed') {
                        setPreviewMessage(statusRes.data.error_message || 'Detection failed for this upload.');
                    } else {
                        setPreviewMessage('No results available for this upload.');
                    }
                } else {
                    setPreviewResults([]);
                    setPreviewMessage('No results available for this upload.');
                }
            } catch (err) {
                console.error('Failed to fetch preview data:', err);
                if (!cancelled) {
                    setPreviewResults([]);
                    setPreviewMessage('No results available for this upload.');
                }
            } finally {
                if (!cancelled) setIsPreviewLoading(false);
            }
        };
        fetchPreviewData();
        return () => { cancelled = true; };
    }, [isPreviewOpen, currentTenantSlug, currentUploadSyncId]);

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
        const { userId: resolvedUserId, tenantId: resolvedTenantId } = await resolveSessionIdentity();

        if (!resolvedUserId) {
            toast({
                title: 'Sign in required',
                description: 'CSV upload needs a real signed-in user. Refresh your session and try again.',
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

        setIsUploading(true);
        setBatchResult(null);
        setPreviewResults([]);
        setPreviewMessage(null);
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
                    ...(resolvedUserId ? { 'x-user-id': resolvedUserId } : {}),
                    ...(resolvedTenantId ? { 'x-tenant-id': resolvedTenantId } : {}),
                },
                body: formData,
            });

            const result: BatchResult = await response.json();
            if (!response.ok || !result) {
                const reason = (result as any)?.error || `Server returned ${response.status}`;
                throw new Error(reason);
            }
            setBatchResult(result);
            setPreviewState({
                syncId: result.syncId || null,
                status: result.detectionTriggered ? 'pending' : null,
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

            if (insertedFileCount > 0) {
                toast({
                    title: `${insertedFileCount} file${insertedFileCount > 1 ? 's' : ''} imported`,
                    description: `${totalRows.toLocaleString()} rows persisted${totalSkipped > 0 ? ` · ${totalSkipped.toLocaleString()} skipped` : ''}${failedCount > 0 ? ` · ${failedCount} file${failedCount > 1 ? 's' : ''} need attention` : ''}${result.detectionTriggered ? ' · Detection queued for this upload.' : ''}`,
                });

                if (result.detectionTriggered && result.syncId) {
                    pollForUploadDetections(result.syncId);
                }
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
            toast({ title: 'Upload failed', description: error.message || 'Network error', variant: 'destructive' });
            setFiles(prev => prev.map(f => ({ ...f, status: 'error' as const, error: error.message })));
        } finally {
            setIsUploading(false);
        }
    };

    // Reset for new upload
    const handleReset = () => {
        setFiles([]);
        setBatchResult(null);
        setIsPreviewOpen(false);
        setPreviewResults([]);
        setPreviewMessage(null);
        setPreviewState({
            syncId: null,
            status: null,
            processedAt: null,
            errorMessage: null,
            isSandbox: false,
        });
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

    return (
        <PageLayout title="Data Upload" noPadding hideNavbar={true} hideSidebar={true} hideLogo={true} midnight>
            <div className="min-h-screen bg-[#070707] text-white relative">
                {/* Noise Texture */}
                <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

                {/* Aesthetic Background Elements */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] pointer-events-none" />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#070707] to-[#050505]" />

                <div className="relative z-10 w-full mx-auto px-6 lg:px-10 py-10">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 flex flex-col md:flex-row md:items-start md:justify-between gap-6"
                    >
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-xl bg-[#111111] border border-white/10">
                                    <Upload className="h-5 w-5 text-white/80" />
                                </div>
                                <h1 className="text-2xl font-sans font-light tracking-tight">Data Upload</h1>
                                <Badge variant="outline" className="text-[10px] font-sans font-bold tracking-tight uppercase border-white/10 text-white/60 bg-white/[0.02] ml-2">
                                    CSV Ingestion
                                </Badge>
                            </div>
                            <p className="text-sm text-white/40 max-w-xl">
                                Upload Amazon Seller Central CSV reports to feed the detection pipeline. Your data flows directly into Agent 3's 26 claim detection algorithms.
                            </p>
                        </div>
                        
                    </motion.div>

                    {/* Drop Zone */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                    >
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`
                relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300
                ${isDragOver
                                    ? 'border-white/20 bg-white/[0.04] scale-[1.01]'
                                    : 'border-white/10 bg-white/[0.01] hover:border-white/20 hover:bg-white/[0.02]'
                                }
                ${files.length > 0 ? 'py-8 px-6' : 'py-16 px-6'}
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
                                    <div className={`p-4 rounded-2xl transition-all duration-300 ${isDragOver ? 'bg-white/[0.08]' : 'bg-white/[0.04]'}`}>
                                        <FileSpreadsheet className={`h-10 w-10 ${isDragOver ? 'text-white/80' : 'text-white/20'}`} />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-white/60 mb-1">
                                            Drop CSV files here or <span className="text-white hover:text-white/80">browse</span>
                                        </p>
                                        <p className="text-xs text-white/25">
                                            We auto-detect each Amazon report by its headers and ingest it for this workspace.
                                        </p>
                                        <p className="text-[11px] text-white/20 mt-2">
                                            {supportedTypeNames.length > 0
                                                ? `Supported now: ${supportedTypeNames.join(', ')}`
                                                : 'Supported now: orders, shipments, returns, settlements, inventory, financial events, fees'}
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-4 mt-2 text-[10px] text-white/20 font-sans font-bold tracking-tight uppercase">
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
                                            <motion.div
                                                key={f.id}
                                                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, scale: 0.95 }}
                                                className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-white/[0.03] border border-white/[0.04]"
                                            >
                                                <FileSpreadsheet className="h-4 w-4 text-white/30 flex-shrink-0" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm text-white/70 truncate font-sans tracking-tight">{f.file.name}</p>
                                                    <p className="text-[10px] text-white/25">
                                                        {formatSize(f.file.size)}
                                                        {f.detectedType && <span className="ml-2 text-white/40">→ {f.detectedType}</span>}
                                                        {f.rowsInserted !== undefined && <span className="ml-2 text-white/45">{f.rowsInserted.toLocaleString()} rows</span>}
                                                    </p>
                                                </div>

                                                {/* Status indicator */}
                                                {f.status === 'uploading' && <Loader2 className="h-4 w-4 text-white/70 animate-spin flex-shrink-0" />}
                                                {f.status === 'success' && <CheckCircle2 className="h-4 w-4 text-white/80 flex-shrink-0" />}
                                                {f.status === 'skipped' && <Archive className="h-4 w-4 text-amber-400 flex-shrink-0" />}
                                                {f.status === 'error' && (
                                                    <span title={f.error}>
                                                        <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                                                    </span>
                                                )}

                                                {/* Remove button */}
                                                {f.status === 'pending' && !isUploading && (
                                                    <button
                                                        onClick={() => removeFile(f.id)}
                                                        className="p-1 rounded-md hover:bg-white/5 text-white/20 hover:text-white/50 transition-colors"
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>

                                    {/* Add more link */}
                                    {!isUploading && !batchResult && (
                                        <button
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full py-2 text-xs text-white/25 hover:text-white/60 transition-colors font-sans font-bold uppercase tracking-tight"
                                        >
                                            + Add more files
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </motion.div>

                    {/* Upload Progress */}
                    {isUploading && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-6"
                        >
                            <div className="rounded-xl bg-white/[0.02] border border-white/10 px-4 py-3 flex items-center gap-3">
                                <Loader2 className="h-4 w-4 text-white/60 animate-spin flex-shrink-0" />
                                <div>
                                    <p className="text-xs font-sans font-bold uppercase tracking-tight text-white/50">Upload In Progress</p>
                                    <p className="text-[11px] text-white/35 font-sans">Sending CSV files to the backend for ingestion.</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* Action Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="mt-6 flex items-center gap-3"
                    >
                        {!batchResult ? (
                            <Button
                                onClick={handleUpload}
                                disabled={files.length === 0 || isUploading}
                                className="bg-[#141414] hover:bg-[#1b1b1b] border border-white/10 text-white font-medium px-6 h-10 shadow-lg shadow-[0_0_20px_rgba(0,0,0,0.25)] disabled:opacity-30 disabled:shadow-none"
                            >
                                {isUploading ? (
                                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</>
                                ) : (
                                    <>Upload & Ingest {files.length > 0 ? `(${files.length} file${files.length > 1 ? 's' : ''})` : ''}</>
                                )}
                            </Button>
                        ) : (
                            <Button
                                onClick={handleReset}
                                variant="outline"
                                className="bg-transparent border-white/[0.08] text-white/60 hover:bg-white/5 h-10 px-6"
                            >
                                <Upload className="h-4 w-4 mr-2" />Upload More Files
                            </Button>
                        )}
                    </motion.div>

                    {/* Results Summary */}
                    {batchResult && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-8"
                        >
                            {/* Success Banner */}
                            {totalRowsInserted > 0 && (
                                <div className="rounded-xl bg-white/[0.03] border border-white/10 p-5 mb-4">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-white/80 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h3 className="text-sm font-medium text-white mb-1">
                                                {successCount} file{successCount > 1 ? 's' : ''} ingested successfully
                                            </h3>
                                            <p className="text-xs text-white/40 mb-3">
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
                                            <p className="text-xs text-white/40">
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
                                            <p className="text-xs text-white/40">
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
                                        ? 'bg-white/[0.015] border-white/[0.06]'
                                        : 'bg-red-500/[0.03] border-red-500/10'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {r.success ? (
                                            <CheckCircle2 className="h-4 w-4 text-white/80 flex-shrink-0" />
                                        ) : (
                                            <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-white/70 font-sans font-bold tracking-tight truncate">{r.fileName}</p>
                                            <p className="text-[10px] text-white/30 mt-0.5">
                                                Detected as <span className="text-white/50">{r.csvType}</span>
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
                                                <p className="text-[10px] text-white/20 font-sans tracking-tight uppercase">...and {r.errors.length - 3} more</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </motion.div>
                    )}

                    {/* Info Section */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.25 }}
                        className="mt-10 rounded-xl bg-white/[0.01] border border-white/10 p-5"
                    >
                        <div className="flex items-start gap-3 mb-4">
                            <Info className="h-4 w-4 text-white/20 mt-0.5" />
                            <div>
                                <h3 className="text-xs font-medium text-white/40 uppercase tracking-wide mb-1">How It Works</h3>
                                <p className="text-xs text-white/25 leading-relaxed">
                                    Upload CSV exports from Amazon Seller Central. The system auto-detects the report type,
                                    maps columns to the internal schema, and inserts data into the database.
                                    After ingestion, Agent 3 runs 26 detection algorithms to find recoverable claims.
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                { step: '1', label: 'Upload', desc: 'Drop CSV files' },
                                { step: '2', label: 'Parse', desc: 'Auto-detect type' },
                                { step: '3', label: 'Ingest', desc: 'Insert into DB' },
                                { step: '4', label: 'Detect', desc: 'Run 26 algorithms' },
                            ].map(s => (
                                <div key={s.step} className="flex items-center gap-2 py-2 px-3 rounded-lg bg-white/[0.02] border border-white/[0.03]">
                                    <span className="text-[10px] font-sans font-bold text-white/40 tracking-tight uppercase">{s.step}</span>
                                    <div>
                                        <p className="text-[11px] text-white/40 font-sans font-bold tracking-tight uppercase">{s.label}</p>
                                        <p className="text-[9px] text-white/20 font-sans tracking-tight uppercase">{s.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
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
                                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                            />

                            {/* Drawer */}
                            <motion.div
                                initial={{ y: '100%' }}
                                animate={{ y: '15%' }} // Occupies most of the page but not all
                                exit={{ y: '100%' }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="fixed inset-x-0 bottom-0 top-0 z-[101] bg-white rounded-none overflow-hidden flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.3)]"
                            >
                                {/* Drawer Header */}
                                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                                    <div>
                                        <div className="flex items-center gap-2.5 mb-1">
                                            <img src="/logoimagetwo.png" alt="Margin Finance" className="h-3.5 w-auto object-contain brightness-0" />
                                            <span className="text-gray-200 font-light text-sm">|</span>
                                            <h2 className="text-[10px] font-sans font-bold text-gray-400 uppercase tracking-tight">Upload Results</h2>
                                        </div>
                                        <div className="flex flex-col px-0.5">
                                            <p className="text-[8px] font-sans font-bold text-gray-300 uppercase tracking-tight leading-none">Current upload detection summary</p>
                                            <p className="text-[11px] font-bold text-gray-900 mt-2 tracking-tight">{isPreviewLoading ? 'Loading...' : `Recovery: ${fmt(previewTotalRecovery)}`}</p>
                                            {previewState.syncId && (
                                                <p className="mt-1 text-[10px] font-sans text-gray-400 tracking-tight">
                                                    Sync ID: <span className="font-semibold text-gray-600">{previewState.syncId}</span>
                                                </p>
                                            )}
                                            {previewState.isSandbox && (
                                                <p className="mt-1 text-[10px] font-sans font-semibold text-amber-600 tracking-tight">
                                                    Simulated detection results (sandbox mode)
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center">
                                        <button onClick={() => setIsPreviewOpen(false)} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-colors">
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>

                                {/* Drawer Content */}
                                <div className="flex-1 overflow-hidden bg-white">
                                    {isPreviewLoading ? (
                                        <div className="flex items-center justify-center h-full">
                                            <div className="flex flex-col items-center gap-3">
                                                <Loader2 className="h-8 w-8 text-violet-400 animate-spin" />
                                                <p className="text-sm text-gray-400 font-sans">Loading results for this upload...</p>
                                            </div>
                                        </div>
                                    ) : previewResults.length === 0 ? (
                                        <div className="flex items-center justify-center h-full">
                                            <div className="flex flex-col items-center gap-3 text-center max-w-sm">
                                                <div className="p-4 rounded-2xl bg-gray-50"><Target className="h-10 w-10 text-gray-300" /></div>
                                                <h3 className="text-sm font-semibold text-gray-700 font-sans">No detections found for this upload yet</h3>
                                                <p className="text-xs text-gray-400 font-sans leading-relaxed">{previewMessage || 'No results available for this upload.'}</p>
                                            </div>
                                        </div>
                                    ) : (
                                    <div className="flex h-full w-full">
                                        <div className="w-1/3 border-r border-gray-100 flex flex-col">
                                            <div className="px-5 py-3.5 border-b border-gray-100">
                                                <h3 className="text-[8px] font-sans font-bold text-gray-400 uppercase tracking-tight mb-1.5">Upload summary</h3>
                                                <ul className="space-y-0">
                                                    <li className="flex items-baseline gap-2">
                                                        <span className="text-[9px] font-sans font-bold text-gray-300 uppercase shrink-0">Account:</span>
                                                        <span className="text-[11px] font-semibold text-gray-900 font-sans tracking-tight truncate">{tenant?.name || currentTenantSlug} (ID: ***{previewResults[0]?.seller_id?.slice(-4) || '----'})</span>
                                                    </li>
                                                    <li className="flex items-baseline gap-2">
                                                        <span className="text-[9px] font-sans font-bold text-gray-300 uppercase shrink-0">Sync ID:</span>
                                                        <span className="text-[11px] font-semibold text-gray-900 font-sans tracking-tight truncate">{previewState.syncId || 'Unavailable'}</span>
                                                    </li>
                                                    <li className="flex items-baseline gap-2">
                                                        <span className="text-[9px] font-sans font-bold text-gray-300 uppercase shrink-0">Detection state:</span>
                                                        <span className="text-[11px] font-semibold text-gray-900 font-sans tracking-tight">{previewState.status || 'Unavailable'}</span>
                                                    </li>
                                                    <li className="flex items-baseline gap-2">
                                                        <span className="text-[9px] font-sans font-bold text-gray-300 uppercase shrink-0">Detections:</span>
                                                        <span className="text-[11px] font-semibold text-gray-900 font-sans tracking-tight">{previewResults.length}</span>
                                                    </li>
                                                    <li className="flex items-baseline gap-2">
                                                        <span className="text-[9px] font-sans font-bold text-gray-300 uppercase shrink-0">Est. Recovery:</span>
                                                        <span className="text-[11px] font-bold text-gray-900 font-sans tracking-tight">{fmt(previewTotalRecovery)}</span>
                                                    </li>
                                                    <li className="flex items-baseline gap-2">
                                                        <span className="text-[9px] font-sans font-bold text-gray-300 uppercase shrink-0">Period analysed:</span>
                                                        <span className="text-[11px] font-semibold text-gray-900 font-sans tracking-tight">{previewDates ? `${previewDates.from} to ${previewDates.to}` : 'All available data'}</span>
                                                    </li>
                                                </ul>
                                            </div>
                                            <div className="px-5 py-4 border-b border-gray-100">
                                                <h3 className="text-[8px] font-sans font-bold text-gray-400 uppercase tracking-tight mb-2">Detection breakdown</h3>
                                                <p className="text-[9px] font-sans font-bold text-gray-400 uppercase tracking-tight mb-3">Top claim categories by value</p>
                                                <div className="space-y-2">
                                                    {previewTopTypes.slice(0, 5).map(([type, data], idx) => (
                                                        <div key={idx} className="flex items-start justify-between">
                                                            <div className="flex-1 min-w-0 mr-4">
                                                                <p className="text-[10px] font-bold text-gray-900 leading-none">{formatAnomalyType(type)}</p>
                                                                <p className="text-[9px] text-gray-400 mt-0.5 truncate leading-tight font-medium">{data.count} detection{data.count > 1 ? 's' : ''} · {fmt(data.value)}</p>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                {previewTopTypes.length > 5 && (
                                                <div className="mt-1 flex justify-end">
                                                    <button className="text-[9px] font-sans font-bold text-violet-600 hover:text-violet-700 uppercase tracking-tight flex items-center gap-1 group">+{previewTopTypes.length - 5} More <span className="group-hover:translate-x-0.5 transition-transform">→</span></button>
                                                </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex-1 flex flex-col">
                                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/10">
                                                <h3 className="text-[9px] font-sans font-bold text-gray-400 uppercase tracking-tight mb-0.5">Full Data</h3>
                                                <p className="text-[10px] text-gray-400 font-sans">{previewResults.length} detection result{previewResults.length !== 1 ? 's' : ''} for this upload</p>
                                            </div>
                                            <div className="flex-1 overflow-auto p-6">
                                                <div className="w-full">
                                                    <table className="w-full">
                                                        <thead>
                                                            <tr className="border-b border-gray-50">
                                                                <th className="text-left py-2 text-[9px] font-sans font-bold text-gray-300 uppercase tracking-tight">Description</th>
                                                                <th className="text-right py-2 text-[9px] font-sans font-bold text-gray-300 uppercase tracking-tight">Amount</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-50">
                                                            {previewResults.map((row, idx) => {
                                                                const days = row.days_remaining ?? 0;
                                                                const evDesc = row.evidence?.order_id ? `Order: ${row.evidence.order_id}` : row.evidence?.fnsku ? `FNSKU: ${row.evidence.fnsku}` : row.evidence?.shipment_id ? `Shipment: ${row.evidence.shipment_id}` : row.sync_id ? `Sync: ${row.sync_id.slice(0, 8)}...` : `Detection #${idx + 1}`;
                                                                return (
                                                                <tr key={row.id || idx} className="group">
                                                                    <td className="py-0.5">
                                                                        <p className="text-xs font-semibold text-gray-800 font-sans tracking-tight">{formatAnomalyType(row.anomaly_type)}</p>
                                                                        <p className="text-[9px] font-sans font-bold text-gray-300 uppercase mt-0.5 tracking-tight">{evDesc} | {row.status}</p>
                                                                    </td>
                                                                    <td className="py-0.5 text-right align-top">
                                                                        <span className="text-xs font-bold text-gray-900 font-sans tracking-tight">{fmt(row.estimated_value)}</span>
                                                                        {days > 0 && <p className="text-[8px] font-sans font-bold mt-0.5 uppercase tracking-tight text-gray-400">{days < 20 ? 'deadline: ' : 'expires in: '}{days} days</p>}
                                                                    </td>
                                                                </tr>);
                                                            })}
                                                        </tbody>
                                                        <tfoot>
                                                            <tr className="border-t border-gray-100">
                                                                <td className="py-6"><span className="text-[10px] font-sans font-bold text-gray-400 uppercase tracking-tight">Total Estimated Recovery</span></td>
                                                                <td className="py-6 text-right">
                                                                    <div className="flex items-center justify-end gap-12">
                                                                        <span className="text-base font-bold font-sans text-gray-900 tracking-tight">{fmt(previewTotalRecovery)}</span>
                                                                        <button type="button" onClick={(e) => { e.stopPropagation(); e.preventDefault(); window.location.assign(`/app/${currentTenantSlug}/pricing-adjust?priority=1`); }} className="relative z-[9999] flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-[11px] font-bold transition-all shadow-sm active:scale-95 whitespace-nowrap cursor-pointer pointer-events-auto">
                                                                            <Upload size={14} className="stroke-[3]" />
                                                                            UNLOCK $99 PRIORITY PASS
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        </tfoot>
                                                    </table>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    )}
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>
            </div>
        </PageLayout>
    );
}
