import React, { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import {
    Upload, FileSpreadsheet, CheckCircle2, AlertCircle, X,
    Calendar, ArrowRight, Info, FileText, Ban
} from 'lucide-react';

interface UploadFile {
    file: File;
    id: string;
    status: 'pending' | 'uploading' | 'success' | 'error';
    error?: string;
}

const ACCEPTED_TYPES = [
    'Orders', 'Shipments', 'Returns', 'Settlements',
    'Inventory', 'Financial events', 'Fees', 'Transfers'
];

const REJECTED_TYPES = [
    { label: 'PDF', icon: Ban },
    { label: 'Excel / XLSX', icon: Ban },
    { label: 'Screenshots', icon: Ban },
    { label: 'Invoices', icon: Ban },
    { label: 'Bills of lading', icon: Ban },
    { label: 'Proof of delivery', icon: Ban }
];

export default function DataUpload() {
    const { toast } = useToast();
    const [files, setFiles] = useState<UploadFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [dateRange, setDateRange] = useState('Last 90 days');

    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const onDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleFiles = useCallback((incomingFiles: FileList | File[]) => {
        const newFiles: UploadFile[] = Array.from(incomingFiles).map(file => {
            const isSupported = file.name.endsWith('.csv') || file.name.endsWith('.txt');
            return {
                file,
                id: Math.random().toString(36).substring(7),
                status: isSupported ? 'pending' : 'error',
                error: isSupported ? undefined : 'Only CSV and TXT files are supported here.'
            };
        });

        setFiles(prev => [...prev, ...newFiles].slice(0, 10));
        
        const unsupportedCount = newFiles.filter(f => f.status === 'error').length;
        if (unsupportedCount > 0) {
            toast({
                variant: "destructive",
                title: "Unsupported files",
                description: `${unsupportedCount} file(s) were rejected. Evidence documents (PDF/Images) are not accepted here.`
            });
        }
    }, [toast]);

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
    }, [handleFiles]);

    const removeFile = (id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    };

    const hasValidFiles = files.some(f => f.status === 'pending');

    return (
        <div className="min-h-screen bg-[#FAFAF7] font-sans text-[#182026]">
            {/* Minimal Header */}
            <header className="border-b border-[#D8E3EA] bg-white px-6 py-4">
                <div className="mx-auto flex max-w-5xl items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/audit" className="text-[#4D5B66] hover:text-[#182026]">
                            <X className="h-5 w-5" />
                        </Link>
                        <h1 className="font-lora text-xl font-medium tracking-tight">Upload Amazon Reports</h1>
                    </div>
                    <Link 
                        to="/audit" 
                        className="text-sm font-medium text-[#0B74DE] hover:underline flex items-center gap-1.5"
                    >
                        Prefer to connect Amazon instead? <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </div>
            </header>

            <main className="mx-auto max-w-3xl px-6 py-12">
                {/* Introduction */}
                <section className="mb-12 text-center">
                    <p className="text-lg text-[#4D5B66]">
                        Run your Recovery Audit using reports exported from Amazon Seller Central.
                    </p>
                </section>

                <div className="space-y-16">
                    {/* Audit Period Section */}
                    <section>
                        <div className="mb-4 flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-[#0B74DE]" />
                            <h2 className="text-[13px] font-bold uppercase tracking-wider text-[#182026]">Audit Period</h2>
                        </div>
                        <p className="mb-6 text-sm text-[#4D5B66]">Use reports covering the same period where possible.</p>
                        
                        <div className="flex flex-wrap items-center gap-4">
                            <select 
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="h-10 rounded-md border border-[#D8E3EA] bg-white px-4 text-sm font-medium focus:border-[#0B74DE] focus:outline-none"
                            >
                                <option>Last 90 days</option>
                                <option>Last 180 days</option>
                                <option>Year to date</option>
                                <option>Custom range</option>
                            </select>
                            
                            {dateRange === 'Custom range' && (
                                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                                    <input type="date" className="h-10 rounded-md border border-[#D8E3EA] bg-white px-3 text-sm" />
                                    <span className="text-[#D8E3EA]">→</span>
                                    <input type="date" className="h-10 rounded-md border border-[#D8E3EA] bg-white px-3 text-sm" />
                                </div>
                            )}
                        </div>
                    </section>

                    {/* What to Upload Section */}
                    <section>
                        <div className="mb-4 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-[#0B74DE]" />
                            <h2 className="text-[13px] font-bold uppercase tracking-wider text-[#182026]">What to Upload</h2>
                        </div>
                        <p className="mb-6 text-sm text-[#4D5B66]">Amazon Seller Central operational reports:</p>
                        
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {ACCEPTED_TYPES.map(type => (
                                <div key={type} className="flex items-center gap-2 rounded-md border border-[#D8E3EA] bg-white p-3 text-sm font-medium">
                                    <div className="h-1.5 w-1.5 rounded-full bg-[#0B74DE]" />
                                    {type}
                                </div>
                            ))}
                        </div>
                        
                        <div className="mt-6 flex items-start gap-3 rounded-lg border border-[#D8E3EA] bg-[#F1F5F9] p-4">
                            <Info className="mt-0.5 h-4 w-4 text-[#0B74DE]" />
                            <div>
                                <p className="text-sm font-medium text-[#182026]">You don't need to identify the report type yourself.</p>
                                <p className="text-xs text-[#4D5B66]">Margin recognizes supported reports automatically based on their headers.</p>
                            </div>
                        </div>
                    </section>

                    {/* Decision Logic: Yes vs No */}
                    <section className="grid gap-8 sm:grid-cols-2">
                        <div className="rounded-xl border border-[#D8E3EA] bg-white p-6">
                            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-[#182026]">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                WHAT FILES QUALIFY
                            </h3>
                            <ul className="space-y-3 text-sm text-[#4D5B66]">
                                <li className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-bold text-[#182026]">✓</span> CSV
                                </li>
                                <li className="flex items-center gap-2">
                                    <span className="font-mono text-xs font-bold text-[#182026]">✓</span> TXT
                                </li>
                                <li className="mt-4 pt-4 border-t border-[#F1F5F9] text-xs">
                                    Up to 10 files · 50 MB each
                                </li>
                            </ul>
                        </div>

                        <div className="rounded-xl border border-[#D8E3EA] bg-white p-6 opacity-80">
                            <h3 className="mb-4 flex items-center gap-2 text-sm font-bold text-[#182026]">
                                <X className="h-4 w-4 text-red-500" />
                                DO NOT UPLOAD HERE
                            </h3>
                            <div className="grid grid-cols-2 gap-y-3">
                                {REJECTED_TYPES.map(type => (
                                    <div key={type.label} className="flex items-center gap-2 text-xs text-[#4D5B66]">
                                        <Ban className="h-3 w-3 text-[#D8E3EA]" />
                                        {type.label}
                                    </div>
                                ))}
                            </div>
                            <p className="mt-6 border-t border-[#F1F5F9] pt-4 text-[11px] leading-relaxed text-[#4D5B66]">
                                Those are evidence documents, not Seller Central operational reports.
                            </p>
                        </div>
                    </section>

                    {/* The Uploader */}
                    <section>
                        <div 
                            onDragOver={onDragOver}
                            onDragLeave={onDragLeave}
                            onDrop={onDrop}
                            className={`relative rounded-xl border-2 border-dashed transition-all ${
                                isDragging 
                                ? 'border-[#0B74DE] bg-[#0B74DE]/5' 
                                : 'border-[#D8E3EA] bg-white hover:border-[#4D5B66]'
                            }`}
                        >
                            <input 
                                type="file" 
                                multiple 
                                accept=".csv,.txt"
                                onChange={(e) => e.target.files && handleFiles(e.target.files)}
                                className="absolute inset-0 z-10 cursor-pointer opacity-0"
                            />
                            <div className="flex flex-col items-center justify-center py-16 text-center">
                                <div className="mb-4 rounded-full bg-[#F1F5F9] p-4">
                                    <Upload className="h-8 w-8 text-[#4D5B66]" />
                                </div>
                                <h3 className="mb-1 text-lg font-medium text-[#182026]">Drop Amazon reports here</h3>
                                <p className="mb-2 text-sm text-[#4D5B66]">or browse to select files</p>
                                <span className="rounded bg-[#F1F5F9] px-2 py-1 text-[10px] font-bold tracking-widest text-[#4D5B66] uppercase">
                                    CSV / TXT ONLY
                                </span>
                            </div>
                        </div>

                        {/* File List */}
                        <AnimatePresence>
                            {files.length > 0 && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="mt-6 space-y-2"
                                >
                                    {files.map(file => (
                                        <div 
                                            key={file.id} 
                                            className={`flex items-center justify-between rounded-lg border p-3 ${
                                                file.status === 'error' ? 'border-red-100 bg-red-50' : 'border-[#D8E3EA] bg-white'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <FileSpreadsheet className={`h-5 w-5 flex-shrink-0 ${
                                                    file.status === 'error' ? 'text-red-400' : 'text-[#0B74DE]'
                                                }`} />
                                                <div className="overflow-hidden">
                                                    <p className="truncate text-sm font-medium text-[#182026]">{file.file.name}</p>
                                                    <p className="text-xs text-[#4D5B66]">{(file.file.size / 1024).toFixed(1)} KB</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                {file.status === 'error' && (
                                                    <span className="text-[10px] font-bold text-red-500 uppercase">Error</span>
                                                )}
                                                <button 
                                                    onClick={() => removeFile(file.id)}
                                                    className="rounded-full p-1 hover:bg-[#F1F5F9] text-[#4D5B66]"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Commit Action */}
                        <div className="mt-12 flex flex-col items-center border-t border-[#D8E3EA] pt-12">
                            <div className="mb-8 text-center">
                                <h3 className="mb-2 text-sm font-bold text-[#182026] uppercase tracking-wider">A SIMPLE RULE</h3>
                                <p className="max-w-md text-sm leading-relaxed text-[#4D5B66]">
                                    Export the Amazon reports for the same seller and the same date range where possible.
                                </p>
                            </div>
                            
                            <Button 
                                disabled={!hasValidFiles}
                                className="h-12 w-full max-w-xs rounded-md bg-[#182026] text-white hover:bg-[#000000] disabled:opacity-30"
                            >
                                Start Recovery Audit
                            </Button>
                            <p className="mt-4 text-[11px] text-[#4D5B66]">
                                Margin will begin analysis immediately after upload.
                            </p>
                        </div>
                    </section>
                </div>
            </main>

            {/* Footer Note */}
            <footer className="mt-20 border-t border-[#D8E3EA] bg-white py-12 text-center">
                <p className="text-xs text-[#4D5B66]">
                    Margin Agents can make mistakes. Check important info.
                </p>
            </footer>
        </div>
    );
}
