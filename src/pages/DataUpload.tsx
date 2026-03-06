import React, { useState, useCallback, useRef } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useParams, Link } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import {
    Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader2, X,
    Package, Truck, RotateCcw, DollarSign, Archive, Target,
    Zap, ChevronRight, Info, Coins
} from 'lucide-react';

// Supported CSV types
const CSV_TYPES = [
    { value: 'auto', label: 'Auto-Detect', icon: Coins, description: 'Let the system detect the type from headers', color: 'from-violet-500/20 to-purple-500/20' },
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
    const fileInputRef = useRef<HTMLInputElement>(null);

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
                    description: `${totalRows.toLocaleString()} rows imported${result.detectionTriggered ? ' · Detection triggered' : ''}`,
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
        <PageLayout title="Data Upload" noPadding hideNavbar={true} hideSidebar={true} midnight>
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
                        className="mb-8"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/10">
                                <Upload className="h-5 w-5 text-violet-400" />
                            </div>
                            <h1 className="text-2xl font-semibold tracking-tight">Data Upload</h1>
                            <Badge variant="outline" className="text-[10px] font-mono tracking-widest uppercase border-violet-500/30 text-violet-400 ml-2">
                                CSV Ingestion
                            </Badge>
                        </div>
                        <p className="text-sm text-white/40 max-w-xl">
                            Upload Amazon Seller Central CSV reports to feed the detection pipeline. Your data flows directly into Agent 3's 26 claim detection algorithms.
                        </p>
                    </motion.div>

                    {/* Type Selector */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="mb-6"
                    >
                        <label className="text-xs font-mono uppercase tracking-widest text-white/30 mb-2 block">Data Type</label>
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
                                            <t.icon className="h-3.5 w-3.5 text-white/40" />
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
                                    <div className="flex items-center gap-4 mt-2 text-[10px] text-white/20 font-mono">
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
                                                    <p className="text-sm text-white/70 truncate font-mono">{f.file.name}</p>
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
                                            className="w-full py-2 text-xs text-white/25 hover:text-violet-400/60 transition-colors font-mono"
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
                                <span className="text-xs font-mono text-white/30">UPLOADING & PROCESSING</span>
                                <span className="text-xs font-mono text-violet-400">{uploadProgress}%</span>
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
                            <Button
                                onClick={handleUpload}
                                disabled={files.length === 0 || isUploading}
                                className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-medium px-6 h-10 shadow-lg shadow-violet-500/20 disabled:opacity-30 disabled:shadow-none"
                            >
                                {isUploading ? (
                                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Processing...</>
                                ) : (
                                    <><Zap className="h-4 w-4 mr-2" />Upload & Ingest {files.length > 0 ? `(${files.length} file${files.length > 1 ? 's' : ''})` : ''}</>
                                )}
                            </Button>
                        ) : (
                            <Button
                                onClick={handleReset}
                                variant="outline"
                                className="border-white/[0.08] text-white/60 hover:bg-white/5 h-10 px-6"
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

                                            {batchResult.detectionTriggered && (
                                                <div className="space-y-3 mt-4">
                                                    <div className="flex items-center gap-2 py-1.5 px-3 bg-violet-500/10 border border-violet-500/20 rounded-lg w-fit">
                                                        <Target className="h-3.5 w-3.5 text-violet-400" />
                                                        <span className="text-xs text-violet-300 font-mono">
                                                            Agent 3 detection pipeline triggered
                                                        </span>
                                                    </div>

                                                    <Button
                                                        asChild
                                                        className="bg-violet-600 hover:bg-violet-500 text-white text-xs h-8 px-4"
                                                    >
                                                        <Link to="/dashboard">
                                                            View Detection Results
                                                            <ChevronRight className="ml-2 h-3.5 w-3.5" />
                                                        </Link>
                                                    </Button>
                                                </div>
                                            )}
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
                                            <p className="text-sm text-white/70 font-mono truncate">{r.fileName}</p>
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
                                                <p key={j} className="text-[10px] text-red-400/60 font-mono truncate">{err}</p>
                                            ))}
                                            {r.errors.length > 3 && (
                                                <p className="text-[10px] text-white/20 font-mono">...and {r.errors.length - 3} more</p>
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
                                    <span className="text-[10px] font-mono text-violet-400/50 font-bold">{s.step}</span>
                                    <div>
                                        <p className="text-[11px] text-white/40 font-medium">{s.label}</p>
                                        <p className="text-[9px] text-white/20">{s.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </PageLayout>
    );
}
