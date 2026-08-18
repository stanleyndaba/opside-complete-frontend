import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@clerk/react';
import { api } from '@/lib/api';
import { Loader2 } from 'lucide-react';
import {
    Upload, FileSpreadsheet, X,
    Calendar, ArrowRight, FileText, Ban, ArrowLeft
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

export default function DataUpload() {
    const { toast } = useToast();
    const navigate = useNavigate();
    const { isSignedIn, isLoaded } = useAuth();
    const [files, setFiles] = useState<UploadFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [dateRange, setDateRange] = useState('Last 90 days');
    const [isBusy, setIsBusy] = useState(false);

    const startAuth = async () => {
        if (isBusy) return;
        setIsBusy(true);
        try {
            const res = await api.createAuditIntent('csv_upload');
            if (res.ok && res.data?.success && res.data?.intent?.id) {
                navigate(`/login?auditIntentId=${res.data.intent.id}&mode=signup`);
                return;
            }
        } catch (e) {
            console.error('Failed to create audit intent:', e);
        }
        navigate('/login?mode=signup&intent=upload-csv&next=%2Fdata-upload');
    };

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

    if (!isLoaded) return null;

    return (
        <div className="min-h-screen bg-[#FAFAF7] font-sans text-[#182026] overflow-x-hidden">
            {/* Sticky Header */}
            <header className="sticky top-0 z-50 border-b border-[#D8E3EA] bg-white px-6 py-2">
                <div className="mx-auto flex max-w-5xl items-center justify-between">
                    {/* Back Button */}
                    <Link to="/audit" className="group flex items-center gap-2.5 text-[#182026] transition-colors">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F1F5F9] group-hover:bg-[#E2E8F0] transition-colors">
                            <ArrowLeft className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-[13px] font-medium">Back</span>
                    </Link>

                    {/* Brand Logo */}
                    <div className="flex items-center gap-2 absolute left-1/2 -translate-x-1/2">
                        <img src="/logoimagetwo.png" alt="Margin" className="h-5 w-auto" />
                        <span className="font-merriweather text-[16px] font-bold tracking-tight text-[#182026]">Margin</span>
                    </div>

                    {/* Connect Amazon */}
                    <Link 
                        to="/audit" 
                        className="text-[12px] font-medium text-[#0B74DE] hover:underline"
                    >
                        Connect Amazon
                    </Link>
                </div>
            </header>

            <main className="mx-auto max-w-2xl px-6 py-8 sm:py-12">
                {!isSignedIn ? (
                    /* ANONYMOUS VIEW: Hierarchy B3 */
                    <div className="space-y-12">
                        <div className="text-center">
                            <h1 className="font-lora text-3xl sm:text-4xl font-medium tracking-tight mb-4" style={{ fontWeight: 400 }}>
                                Use the Seller Central reports you already have
                            </h1>
                            <p className="text-[16px] text-[#4D5B66] max-w-lg mx-auto leading-relaxed">
                                Margin recognizes supported reports automatically. No manual mapping required.
                            </p>
                        </div>

                        <div className="grid gap-8">
                            {/* The Rule */}
                            <div className="px-4 text-center">
                                <h3 className="mb-2 text-[11px] font-bold uppercase tracking-tight text-[#182026]">A Simple Rule</h3>
                                <p className="text-[14px] leading-relaxed text-[#4D5B66]">
                                    Use reports covering the same seller and the same date range where possible.
                                </p>
                            </div>

                            {/* The Gate: the one primary action on the anonymous route */}
                            <div className="rounded-lg border border-[#0B74DE]/20 bg-[#0B74DE]/5 p-8 text-center">
                                <h2 className="mb-2 text-[18px] font-semibold text-[#182026]">Ready to add your reports?</h2>
                                <p className="mb-6 text-[14px] text-[#4D5B66]">
                                    Create your free Margin account to securely run this Audit and keep your results connected to you.
                                </p>
                                <Button
                                    onClick={startAuth}
                                    disabled={isBusy}
                                    className="h-12 w-full max-w-[280px] rounded-md bg-[#0B74DE] text-[14px] font-semibold text-white shadow-md transition-all hover:bg-[#075EBA]"
                                >
                                    {isBusy ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Securing your Audit
                                        </>
                                    ) : (
                                        'Continue with free account'
                                    )}
                                </Button>
                                <div className="mt-4 flex items-center justify-center gap-4 text-[12px] font-medium text-[#8C9BA6]">
                                    <span>Free account</span>
                                    <span className="h-1 w-1 rounded-full bg-[#D8E3EA]" />
                                    <span>No payment required</span>
                                    <span className="h-1 w-1 rounded-full bg-[#D8E3EA]" />
                                    <span>Read-only Audit</span>
                                </div>
                            </div>

                            {/* Supporting information: intentionally unboxed */}
                            <div className="px-1">
                                <h3 className="mb-4 text-[11px] font-bold uppercase tracking-tight text-[#182026]">Supported Report Families</h3>
                                <div className="flex flex-wrap gap-2">
                                    {ACCEPTED_TYPES.map(type => (
                                        <span key={type} className="rounded-full bg-[#F1F5F9] px-3 py-1 text-[12px] font-medium text-[#4D5B66]">
                                            {type}
                                        </span>
                                    ))}
                                </div>
                                <p className="mt-4 text-[13px] leading-relaxed text-[#8C9BA6]">
                                    Export these as CSV or TXT from Seller Central. You don't need to identify the report type yourself. Margin recognizes supported reports automatically.
                                </p>
                                <div className="mt-6 border-t border-[#D8E3EA] pt-5">
                                    <h3 className="mb-2 text-[11px] font-bold uppercase tracking-tight text-[#182026]">Do Not Upload</h3>
                                    <p className="text-[13px] leading-relaxed text-[#8C9BA6]">
                                        PDFs, Excel files, screenshots or invoices. Those are evidence documents, not operational reports.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* AUTHENTICATED VIEW: Operational Controls */
                    <div className="space-y-8">
                        <div className="mb-8">
                            <h1 className="font-lora text-2xl font-medium tracking-tight mb-2" style={{ fontWeight: 400 }}>Upload Reports</h1>
                            <p className="text-[14px] text-[#4D5B66]">
                                Select your audit period and drop your Amazon reports below.
                            </p>
                        </div>

                        {/* Operational Settings */}
                        <div className="grid sm:grid-cols-2 gap-6 p-5 rounded-lg border border-[#D8E3EA] bg-white">
                            <div>
                                <label className="flex items-center gap-2 mb-2 text-[11px] font-bold uppercase text-[#182026]">
                                    <Calendar className="h-3 w-3 text-[#0B74DE]" />
                                    Audit Period
                                </label>
                                <select 
                                    value={dateRange}
                                    onChange={(e) => setDateRange(e.target.value)}
                                    className="h-9 w-full rounded-md border border-[#D8E3EA] bg-white px-3 text-[13px] font-medium focus:outline-none focus:ring-1 focus:ring-[#0B74DE] cursor-pointer"
                                >
                                    <option>Last 90 days</option>
                                    <option>Last 180 days</option>
                                    <option>Year to date</option>
                                    <option>Custom range</option>
                                </select>
                            </div>
                            <div>
                                <label className="flex items-center gap-2 mb-2 text-[11px] font-bold uppercase text-[#182026]">
                                    <FileText className="h-3.5 w-3.5 text-[#0B74DE]" />
                                    Report Families
                                </label>
                                <p className="text-[12px] leading-relaxed text-[#4D5B66] font-medium">
                                    {ACCEPTED_TYPES.slice(0, 4).join(', ')}...
                                </p>
                                <p className="mt-1 text-[11px] text-[#8C9BA6]">Recognized automatically.</p>
                            </div>
                        </div>

                        {/* Dropzone */}
                        <div 
                            onDragOver={onDragOver}
                            onDragLeave={onDragLeave}
                            onDrop={onDrop}
                            className={`relative rounded-lg border-2 border-dashed transition-all duration-200 min-h-[200px] flex items-center justify-center ${
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
                            <div className="flex flex-col items-center justify-center text-center px-6">
                                <div className="h-12 w-12 rounded-full bg-[#F1F5F9] flex items-center justify-center mb-4">
                                    <Upload className="h-6 w-6 text-[#4D5B66]" />
                                </div>
                                <h3 className="mb-1 text-[16px] font-medium text-[#182026]">
                                    Drop Amazon reports here
                                </h3>
                                <p className="text-[13px] text-[#4D5B66]">
                                    or browse to select files
                                </p>
                                <p className="mt-4 text-[11px] text-[#8C9BA6]">
                                    CSV or TXT · Up to 10 files · 50MB each
                                </p>
                            </div>
                        </div>

                        {/* File List */}
                        <AnimatePresence>
                            {files.length > 0 && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="space-y-2"
                                >
                                    {files.map(file => (
                                        <div 
                                            key={file.id} 
                                            className={`flex items-center justify-between rounded-md border px-4 py-3 ${
                                                file.status === 'error' ? 'border-red-100 bg-red-50/30' : 'border-[#D8E3EA] bg-white shadow-sm'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <FileSpreadsheet className={`h-4 w-4 flex-shrink-0 ${
                                                    file.status === 'error' ? 'text-red-400' : 'text-[#0B74DE]'
                                                }`} />
                                                <div className="flex flex-col overflow-hidden">
                                                    <span className="truncate text-[13px] font-medium text-[#182026]">{file.file.name}</span>
                                                    {file.error && <span className="text-[10px] text-red-500">{file.error}</span>}
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => removeFile(file.id)}
                                                className="text-[#4D5B66] hover:text-red-500 transition-colors"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Action Bar */}
                        <div className="pt-4 flex flex-col items-center gap-4">
                            <Button 
                                onClick={() => {
                                    toast({
                                        title: "Audit Initialized",
                                        description: "Margin is preparing your manual audit workspace."
                                    });
                                }}
                                disabled={!hasValidFiles || isBusy}
                                className="h-12 w-full max-w-[320px] rounded-md bg-[#182026] text-[14px] font-semibold text-white hover:bg-black disabled:opacity-20 transition-all shadow-md"
                            >
                                Start Recovery Audit
                            </Button>
                            
                            <div className="flex items-center gap-2 text-[11px] text-[#8C9BA6]">
                                <Ban className="h-3 w-3" />
                                <span>Do not upload PDFs, Excel, or Screenshots.</span>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            <footer className="py-12 text-center border-t border-[#D8E3EA] mt-12 bg-white">
                <p className="text-[12px] text-[#8C9BA6]">
                    Margin Agents can make mistakes. Check important info.
                </p>
            </footer>
        </div>
    );
}
