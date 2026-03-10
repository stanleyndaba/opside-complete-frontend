import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useParams, Link } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/hooks/use-toast';
import { api, detectionApi } from '@/lib/api';
import {
    Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, X,
    Package, Truck, RotateCcw, DollarSign, Archive, Target,
    Zap, ChevronRight, Info, Coins
} from 'lucide-react';

// Supported CSV types
const CSV_TYPES = [
    { value: 'auto', label: 'Any Data Type', icon: Coins, description: 'Let the system detect the type from headers', color: 'from-violet-500/20 to-purple-500/20' },
    { value: 'orders', label: 'Orders', icon: Package, description: 'Amazon order data', color: 'from-blue-500/20 to-cyan-500/20' },
    { value: 'shipments', label: 'Shipments', icon: Truck, description: 'FBA inbound shipments', color: 'from-emerald-500/20 to-green-500/20' },
    { value: 'returns', label: 'Returns', icon: RotateCcw, description: 'Customer returns', color: 'from-amber-500/20 to-orange-500/20' },
    { value: 'settlements', label: 'Settlements', icon: Coins, description: 'Payment/settlement reports', color: 'from-green-500/20 to-teal-500/20' },
    { value: 'inventory', label: 'Inventory', icon: Archive, description: 'FBA inventory data', color: 'from-indigo-500/20 to-blue-500/20' },
    { value: 'financial_events', label: 'Financial Events', icon: Target, description: 'Adjustments, liquidations', color: 'from-rose-500/20 to-pink-500/20' },
    { value: 'fees', label: 'Fees', icon: Coins, description: 'FBA fee data', color: 'from-yellow-500/20 to-amber-500/20' },
] as const;

// File state
interface UploadFile {
    file: File;
    id: string;
    status: 'pending' | 'uploading' | 'success' | 'error';
    detectedType?: string;
    rowsInserted?: number;
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

const ANOMALY_LABELS: Record<string, string> = {
    missing_unit: 'Missing Units', overcharge: 'Overcharge', damaged_stock: 'Damaged Stock',
    incorrect_fee: 'Incorrect Fee', duplicate_charge: 'Duplicate Charge',
    lost_warehouse: 'Lost in Warehouse', damaged_warehouse: 'Warehouse Damage',
    lost_inbound: 'Lost Inbound Shipment', damaged_inbound: 'Damaged Inbound',
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

export default function DataUpload() {
    const { tenantSlug: urlTenantSlug } = useParams<{ tenantSlug?: string }>();
    const { tenant } = useTenant();
    const currentTenantSlug = urlTenantSlug || tenant?.slug || 'default';
    const { toast } = useToast();

    const [files, setFiles] = useState<UploadFile[]>([]);
    const [selectedType, setSelectedType] = useState<string>('auto');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [batchResult, setBatchResult] = useState<BatchResult | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [previewResults, setPreviewResults] = useState<PreviewDetectionResult[]>([]);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [disputeCases, setDisputeCases] = useState<any[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch detection data when preview drawer opens
    useEffect(() => {
        if (!isPreviewOpen) return;
        let cancelled = false;
        const fetchPreviewData = async () => {
            setIsPreviewLoading(true);
            try {
                const res = await detectionApi.getDetectionResults({ limit: 500 }, currentTenantSlug);
                if (!cancelled && res?.ok && res.data?.results && res.data.results.length > 0) {
                    const all = res.data.results;
                    // Find the most recent sync_id (latest detection batch)
                    const latestSyncId = all
                        .filter((r: any) => r.sync_id)
                        .sort((a: any, b: any) => new Date(b.discovery_date || b.created_at || 0).getTime() - new Date(a.discovery_date || a.created_at || 0).getTime())
                        [0]?.sync_id;
                    // Show only results from the latest batch
                    const filtered = latestSyncId ? all.filter((r: any) => r.sync_id === latestSyncId) : all;
                    setPreviewResults(filtered.length > 0 ? filtered : all);
                } else if (!cancelled) {
                    setPreviewResults([]);
                }
            } catch (err) {
                console.error('Failed to fetch preview data:', err);
                if (!cancelled) setPreviewResults([]);
            } finally {
                if (!cancelled) setIsPreviewLoading(false);
            }
        };
        fetchPreviewData();
        return () => { cancelled = true; };
    }, [isPreviewOpen, currentTenantSlug, batchResult]);

    // Fetch dispute cases when preview drawer opens
    useEffect(() => {
        if (!isPreviewOpen) return;
        let cancelled = false;
        (async () => {
            try {
                const res = await api.getDisputeCases({ limit: 5 }, currentTenantSlug);
                if (!cancelled && res?.ok) {
                    const cases = res.data?.cases || (Array.isArray(res.data) ? res.data : []);
                    setDisputeCases(cases.slice(0, 5));
                }
            } catch (_e) { /* silent */ }
        })();
        return () => { cancelled = true; };
    }, [isPreviewOpen, currentTenantSlug]);

    // Computed preview values
    const previewTotalRecovery = useMemo(() => previewResults.reduce((s, r) => s + (r.estimated_value || 0), 0), [previewResults]);
    const previewCurrency = previewResults[0]?.currency || 'USD';
    const fmt = useCallback((val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: previewCurrency }).format(val), [previewCurrency]);
    const previewTopTypes = useMemo(() => {
        const groups: Record<string, { count: number; value: number; status: string }> = {};
        previewResults.forEach(r => {
            if (!groups[r.anomaly_type]) groups[r.anomaly_type] = { count: 0, value: 0, status: r.status };
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

        setIsUploading(true);
        setUploadProgress(10);
        setBatchResult(null);

        // Mark all files as uploading
        setFiles(prev => prev.map(f => ({ ...f, status: 'uploading' as const })));

        try {
            const formData = new FormData();
            files.forEach(f => formData.append('files', f.file));

            const endpoint = selectedType === 'auto'
                ? '/api/csv-upload/ingest'
                : `/api/csv-upload/ingest/${selectedType}`;

            setUploadProgress(30);

            const url = api.buildApiUrl(endpoint);
            const response = await fetch(url, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'x-user-id': localStorage.getItem('user_id') || 'demo-user',
                    'x-tenant-id': localStorage.getItem('active_tenant_id') || localStorage.getItem('active_store_id') || '',
                    'x-store-id': localStorage.getItem('active_store_id') || '',
                },
                body: formData,
            });

            setUploadProgress(70);

            const result: BatchResult = await response.json();
            setBatchResult(result);

            setUploadProgress(100);

            // Update individual file statuses
            setFiles(prev => prev.map(f => {
                const fileResult = result.results?.find(r => r.fileName === f.file.name);
                if (fileResult) {
                    return {
                        ...f,
                        status: fileResult.success ? 'success' as const : 'error' as const,
                        detectedType: fileResult.csvType,
                        rowsInserted: fileResult.rowsInserted,
                        rowsFailed: fileResult.rowsFailed,
                        error: fileResult.errors?.join('; '),
                    };
                }
                return { ...f, status: 'error' as const, error: 'No result from server' };
            }));

            // Show toast
            const successCount = result.results?.filter(r => r.success).length || 0;
            const totalRows = result.results?.reduce((sum, r) => sum + r.rowsInserted, 0) || 0;

            if (successCount > 0) {
                toast({
                    title: `${successCount} file${successCount > 1 ? 's' : ''} ingested`,
                    description: `${totalRows.toLocaleString()} rows imported${result.detectionTriggered ? ' · Detection running...' : ''}`,
                });

                // Auto-open preview drawer after detection completes
                if (result.detectionTriggered) {
                    const pollAndOpen = async () => {
                        const maxAttempts = 15;
                        for (let attempt = 0; attempt < maxAttempts; attempt++) {
                            await new Promise(resolve => setTimeout(resolve, 2000));
                            try {
                                const statusRes = await detectionApi.getDetectionResults({ limit: 1 }, currentTenantSlug);
                                if (statusRes?.ok && statusRes.data?.results?.length > 0) {
                                    setIsPreviewOpen(true);
                                    return;
                                }
                            } catch (_e) { /* keep polling */ }
                        }
                        setIsPreviewOpen(true);
                    };
                    pollAndOpen();
                }
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
        setUploadProgress(0);
    };

    // Format file size
    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const totalRowsInserted = batchResult?.results?.reduce((sum, r) => sum + r.rowsInserted, 0) || 0;
    const totalRowsFailed = batchResult?.results?.reduce((sum, r) => sum + r.rowsFailed, 0) || 0;
    const successCount = batchResult?.results?.filter(r => r.success).length || 0;

    return (
        <PageLayout title="Data Upload" noPadding hideNavbar={true} hideSidebar={true} hideLogo={true} midnight>
            <div className="min-h-screen bg-[#050505] text-white relative">
                {/* Noise Texture */}
                <div className="fixed inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

                {/* Aesthetic Background Elements */}
                <div className="absolute top-0 left-0 w-full h-[800px] bg-[radial-gradient(circle_at_50%_0%,rgba(16,185,129,0.06),transparent_70%)] pointer-events-none" />
                <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="relative z-10 w-full mx-auto px-6 lg:px-10 py-10">
                    {/* Header */}
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-8 flex flex-col md:flex-row md:items-start md:justify-between gap-6"
                    >
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/10">
                                    <Upload className="h-5 w-5 text-violet-400" />
                                </div>
                                <h1 className="text-2xl font-sans font-light tracking-tight">Data Upload</h1>
                                <Badge variant="outline" className="text-[10px] font-sans font-bold tracking-tight uppercase border-violet-500/30 text-violet-400 ml-2">
                                    CSV Ingestion
                                </Badge>
                            </div>
                            <p className="text-sm text-white/40 max-w-xl">
                                Upload Amazon Seller Central CSV reports to feed the detection pipeline. Your data flows directly into Agent 3's 26 claim detection algorithms.
                            </p>
                        </div>
                        
                    </motion.div>

                    {/* Type Selector */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="mb-6"
                    >
                        <label className="text-xs font-sans font-bold uppercase tracking-tight text-white/30 mb-2 block">Data Type</label>
                        <Select value={selectedType} onValueChange={setSelectedType}>
                            <SelectTrigger className="w-full bg-white/[0.02] border-white/10 text-white h-11 focus:ring-emerald-500/30">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#14141f] border-white/[0.08]">
                                {CSV_TYPES.map(t => (
                                    <SelectItem
                                        key={t.value}
                                        value={t.value}
                                        className="text-white/80 focus:bg-white/5 focus:text-white"
                                    >
                                        <span className="flex items-center gap-2">
                                            <span>{t.label}</span>
                                            <span className="text-[10px] text-white/25 ml-1">— {t.description}</span>
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </motion.div>

                    {/* Drop Zone */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`
                relative cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-300
                ${isDragOver
                                    ? 'border-emerald-500/60 bg-emerald-500/[0.06] scale-[1.01]'
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
                                    <div className={`p-4 rounded-2xl transition-all duration-300 ${isDragOver ? 'bg-violet-500/20' : 'bg-white/[0.04]'}`}>
                                        <FileSpreadsheet className={`h-10 w-10 ${isDragOver ? 'text-violet-400' : 'text-white/20'}`} />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-white/60 mb-1">
                                            Drop CSV files here or <span className="text-violet-400 hover:text-violet-300">browse</span>
                                        </p>
                                        <p className="text-xs text-white/25">
                                            Supports orders, shipments, returns, settlements, inventory, financial events, and fee reports
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
                                                        {f.detectedType && <span className="ml-2 text-violet-400/60">→ {f.detectedType}</span>}
                                                        {f.rowsInserted !== undefined && <span className="ml-2 text-emerald-400/60">{f.rowsInserted.toLocaleString()} rows</span>}
                                                    </p>
                                                </div>

                                                {/* Status indicator */}
                                                {f.status === 'uploading' && <Loader2 className="h-4 w-4 text-violet-400 animate-spin flex-shrink-0" />}
                                                {f.status === 'success' && <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />}
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
                                            className="w-full py-2 text-xs text-white/25 hover:text-violet-400/60 transition-colors font-sans font-bold uppercase tracking-tight"
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
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-sans font-bold uppercase tracking-tight text-white/30">UPLOADING & PROCESSING</span>
                                <span className="text-xs font-sans font-bold tracking-tight text-violet-400">{uploadProgress}%</span>
                            </div>
                            <Progress value={uploadProgress} className="h-1.5 bg-white/[0.04]" />
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
                            <div className="flex items-center gap-3">
                                <Button
                                    onClick={handleUpload}
                                    disabled={files.length === 0 || isUploading}
                                    className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-medium px-6 h-10 shadow-lg shadow-violet-500/20 disabled:opacity-30 disabled:shadow-none"
                                >
                                    {isUploading ? (
                                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</>
                                    ) : (
                                        <>Upload & Ingest {files.length > 0 ? `(${files.length} file${files.length > 1 ? 's' : ''})` : ''}</>
                                    )}
                                </Button>
                                
                                <Button
                                    onClick={() => setIsPreviewOpen(true)}
                                    disabled={files.length === 0 || isUploading}
                                    variant="outline"
                                    className="bg-transparent border-white text-white hover:bg-white/5 h-10 px-6 rounded-lg transition-all font-medium"
                                >
                                    Preview
                                </Button>
                            </div>
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
                            {batchResult.success && (
                                <div className="rounded-xl bg-gradient-to-r from-emerald-500/[0.08] to-green-500/[0.04] border border-emerald-500/20 p-5 mb-4">
                                    <div className="flex items-start gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <h3 className="text-sm font-medium text-emerald-300 mb-1">
                                                {successCount} file{successCount > 1 ? 's' : ''} ingested successfully
                                            </h3>
                                            <p className="text-xs text-white/40 mb-3">
                                                {totalRowsInserted.toLocaleString()} rows imported into the database
                                                {totalRowsFailed > 0 && ` · ${totalRowsFailed.toLocaleString()} rows failed`}
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
                                            <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                                        ) : (
                                            <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm text-white/70 font-sans font-bold tracking-tight truncate">{r.fileName}</p>
                                            <p className="text-[10px] text-white/30 mt-0.5">
                                                Detected as <span className="text-violet-400/70">{r.csvType}</span>
                                                {' · '}{r.rowsProcessed} rows processed
                                                {' · '}{r.rowsInserted} inserted
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
                                    <span className="text-[10px] font-sans font-bold text-violet-400/50 tracking-tight uppercase">{s.step}</span>
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
                                            <h2 className="text-[10px] font-sans font-bold text-gray-400 uppercase tracking-tight">Audit Report</h2>
                                        </div>
                                        <div className="flex flex-col px-0.5">
                                            <p className="text-[8px] font-sans font-bold text-gray-300 uppercase tracking-tight leading-none">Reimbursement seller account overview</p>
                                            <p className="text-[11px] font-bold text-gray-900 mt-2 tracking-tight">{isPreviewLoading ? 'Loading...' : `Recovery: ${fmt(previewTotalRecovery)}`}</p>
                                        </div>
                                    </div>
                                    {disputeCases.length > 0 && (
                                    <div className="flex-1 mx-6">
                                        <Select defaultValue={disputeCases[0]?.id || 'none'}>
                                            <SelectTrigger className="h-9 w-full bg-gray-50/50 border-gray-200 text-[11px] font-medium text-gray-600 rounded-lg">
                                                <SelectValue placeholder="Disputes (Margin)" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-white border-gray-100 shadow-xl z-[200]">
                                                {disputeCases.map(c => {
                                                    const dateStr = c.created_at ? new Date(c.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
                                                    return (
                                                    <SelectItem key={c.id} value={c.id} className="text-[11px] focus:bg-gray-50">
                                                        <span className="flex items-center gap-2">
                                                            <span className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${c.status === 'approved' || c.status === 'paid' || c.status === 'won' ? 'bg-emerald-500' : c.status === 'rejected' || c.status === 'denied' ? 'bg-red-400' : c.status === 'pending' || c.status === 'submitted' ? 'bg-amber-400' : 'bg-gray-300'}`} />
                                                            <span className="font-semibold truncate">{c.case_number || c.id?.substring(0, 8)}</span>
                                                            <span className="text-gray-300">·</span>
                                                            <span className="text-gray-400 uppercase text-[9px]">{(c.status || 'open').replace(/_/g, ' ')}</span>
                                                            <span className="text-gray-300">·</span>
                                                            <span className="font-bold text-gray-700">{new Intl.NumberFormat('en-US', { style: 'currency', currency: c.currency || 'USD' }).format(c.amount || 0)}</span>
                                                            {c.amount > 100 && (
                                                                <>
                                                                    <span className="text-gray-300">·</span>
                                                                    <span className="text-amber-500 font-medium text-[9px] uppercase tracking-wider">Awaiting for your review</span>
                                                                </>
                                                            )}
                                                            {dateStr && <><span className="text-gray-300">·</span><span className="text-gray-400 text-[9px]">{dateStr}</span></>}
                                                        </span>
                                                    </SelectItem>
                                                    );
                                                })}
                                                <div className="border-t border-gray-100 mt-1 pt-1">
                                                    <Link to={`/${currentTenantSlug}/recoveries`} className="flex items-center justify-between w-full px-2 py-1.5 text-[11px] font-semibold text-gray-800 hover:bg-gray-50 hover:text-gray-900 rounded cursor-pointer transition-colors group">
                                                        <span>See more</span>
                                                        <ChevronRight className="h-3 w-3 text-gray-400 group-hover:text-gray-800 transition-colors" />
                                                    </Link>
                                                </div>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    )}
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
                                                <p className="text-sm text-gray-400 font-sans">Loading your audit report...</p>
                                            </div>
                                        </div>
                                    ) : previewResults.length === 0 ? (
                                        <div className="flex items-center justify-center h-full">
                                            <div className="flex flex-col items-center gap-3 text-center max-w-sm">
                                                <div className="p-4 rounded-2xl bg-gray-50"><Target className="h-10 w-10 text-gray-300" /></div>
                                                <h3 className="text-sm font-semibold text-gray-700 font-sans">No detections found yet</h3>
                                                <p className="text-xs text-gray-400 font-sans leading-relaxed">Upload your Amazon CSV reports and run the ingestion pipeline. Once data is ingested, Agent 3 will automatically scan for recoverable claims.</p>
                                            </div>
                                        </div>
                                    ) : (
                                    <div className="flex h-full w-full">
                                        <div className="w-1/3 border-r border-gray-100 flex flex-col">
                                            <div className="px-5 py-3.5 border-b border-gray-100">
                                                <h3 className="text-[8px] font-sans font-bold text-gray-400 uppercase tracking-tight mb-1.5">Seller details</h3>
                                                <ul className="space-y-0">
                                                    <li className="flex items-baseline gap-2">
                                                        <span className="text-[9px] font-sans font-bold text-gray-300 uppercase shrink-0">Account:</span>
                                                        <span className="text-[11px] font-semibold text-gray-900 font-sans tracking-tight truncate">{tenant?.name || currentTenantSlug} (ID: ***{previewResults[0]?.seller_id?.slice(-4) || '----'})</span>
                                                    </li>
                                                    <li className="flex items-baseline gap-2">
                                                        <span className="text-[9px] font-sans font-bold text-gray-300 uppercase shrink-0">Claims found:</span>
                                                        <span className="text-[11px] font-semibold text-gray-900 font-sans tracking-tight">{previewResults.length} Discrepancies</span>
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
                                                <p className="mt-1 text-[9px] font-sans font-bold text-gray-400 italic leading-tight uppercase tracking-tight">based on your uploaded CSVs and Amazon's reimbursement policies.</p>
                                            </div>
                                            <div className="px-5 py-4 border-b border-gray-100">
                                                <h3 className="text-[8px] font-sans font-bold text-gray-400 uppercase tracking-tight mb-2">Detection breakdown</h3>
                                                <p className="text-[9px] font-sans font-bold text-gray-400 uppercase tracking-tight mb-3">Top claim categories by value</p>
                                                <div className="space-y-2">
                                                    {previewTopTypes.slice(0, 5).map(([type, data], idx) => (
                                                        <div key={idx} className="flex items-start justify-between">
                                                            <div className="flex-1 min-w-0 mr-4">
                                                                <p className="text-[10px] font-bold text-gray-900 leading-none">{formatAnomalyType(type)}</p>
                                                                <p className="text-[9px] text-gray-400 mt-0.5 truncate leading-tight font-medium">{data.count} case{data.count > 1 ? 's' : ''} · {fmt(data.value)}</p>
                                                            </div>
                                                            <div className="px-1.5 py-0.5 bg-gray-50 border border-gray-100 rounded text-[8px] font-sans font-bold text-gray-400 uppercase shrink-0 tracking-tight">{data.status === 'resolved' ? 'Resolved' : data.status === 'disputed' ? 'Disputed' : 'Flagged'}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                                {previewTopTypes.length > 5 && (
                                                <div className="mt-1 flex justify-end">
                                                    <button className="text-[9px] font-sans font-bold text-violet-600 hover:text-violet-700 uppercase tracking-tight flex items-center gap-1 group">+{previewTopTypes.length - 5} More <span className="group-hover:translate-x-0.5 transition-transform">→</span></button>
                                                </div>
                                                )}
                                            </div>
                                            <div className="px-5 py-4 bg-gray-50/50">
                                                <h3 className="text-[8px] font-sans font-bold text-gray-400 uppercase tracking-tight mb-2.5">Policy reference</h3>
                                                <p className="text-[9px] font-sans font-bold text-gray-300 uppercase tracking-tight mb-2">Policy basis</p>
                                                <div className="space-y-2">
                                                    <p className="text-[9px] font-sans text-gray-500 leading-relaxed italic tracking-tight font-light">
                                                        <span className="font-bold text-gray-400 not-italic mr-1 uppercase">Policy:</span>
                                                        "These opportunities are identified using Amazon's published reimbursement policies for lost, damaged, and incorrectly charged FBA inventory. We prepare claims that match what Seller Support expects to see."
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex-1 flex flex-col">
                                            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/10">
                                                <h3 className="text-[9px] font-sans font-bold text-gray-400 uppercase tracking-tight mb-0.5">Full Data</h3>
                                                <p className="text-[10px] text-gray-400 font-sans">{previewResults.length} detection result{previewResults.length !== 1 ? 's' : ''} — your full cost breakdown</p>
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
                                                                        <button type="button" onClick={(e) => { e.stopPropagation(); e.preventDefault(); window.open('https://www.paypal.com/ncp/payment/2KZY7JX8MNTPC', '_blank', 'noopener,noreferrer'); }} className="relative z-[9999] flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-[11px] font-bold transition-all shadow-sm active:scale-95 whitespace-nowrap cursor-pointer pointer-events-auto">
                                                                            <Upload size={14} className="stroke-[3]" />
                                                                            FILE FOR CASES
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
