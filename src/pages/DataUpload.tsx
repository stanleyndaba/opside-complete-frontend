import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import {
    Upload, FileSpreadsheet, X,
    Calendar, ArrowRight, FileText, Ban
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
        <div className="min-h-screen bg-[#FAFAF7] font-sans text-[#182026] overflow-x-hidden">
            {/* Sticky Header */}
            <header className="sticky top-0 z-50 border-b border-[#D8E3EA] bg-white px-6 py-2.5">
                <div className="mx-auto flex max-w-4xl items-center justify-between">
                    <Link to="/audit" className="flex items-center gap-2 text-[#4D5B66] hover:text-[#182026] transition-colors">
                        <X className="h-4 w-4" />
                        <span className="text-[12px] font-medium">Back to Margin</span>
                    </Link>
                    <Link 
                        to="/audit" 
                        className="text-[12px] font-medium text-[#0B74DE] hover:underline flex items-center gap-1"
                    >
                        Connect Amazon instead <ArrowRight className="h-3 w-3" />
                    </Link>
                </div>
            </header>

            <main className="mx-auto max-w-2xl px-6 py-8 sm:py-10">
                {/* Compact Intro */}
                <div className="mb-8 text-center">
                    <h1 className="font-lora text-2xl sm:text-3xl font-medium tracking-tight mb-2">Upload Amazon Reports</h1>
                    <p className="text-[14px] text-[#4D5B66]">
                        Run your Recovery Audit using reports exported from Amazon Seller Central.
                    </p>
                </div>

                {/* LEAD: The Uploader */}
                <section className="mb-6">
                    <div 
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                        className={`relative rounded-md border border-dashed transition-all duration-200 ${
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
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                            <Upload className="h-5 w-5 text-[#4D5B66] mb-3" />
                            <h3 className="mb-1 text-[15px] font-medium text-[#182026]">Drop Amazon reports here</h3>
                            <p className="text-[12px] text-[#4D5B66]">or browse to select files (CSV / TXT only)</p>
                        </div>
                    </div>

                    {/* File List */}
                    <AnimatePresence>
                        {files.length > 0 && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-3 space-y-1"
                            >
                                {files.map(file => (
                                    <div 
                                        key={file.id} 
                                        className={`flex items-center justify-between rounded-md border px-3 py-2 ${
                                            file.status === 'error' ? 'border-red-100 bg-red-50/30' : 'border-[#D8E3EA] bg-white'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <FileSpreadsheet className={`h-3.5 w-3.5 flex-shrink-0 ${
                                                file.status === 'error' ? 'text-red-400' : 'text-[#0B74DE]'
                                            }`} />
                                            <span className="truncate text-[12px] font-medium text-[#182026]">{file.file.name}</span>
                                        </div>
                                        <button 
                                            onClick={() => removeFile(file.id)}
                                            className="text-[#4D5B66] hover:text-[#182026]"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* ACTION: Start Audit */}
                    <div className="mt-6 text-center">
                        <Button 
                            disabled={!hasValidFiles}
                            className="h-10 w-full max-w-[240px] rounded-md bg-[#182026] text-[13px] font-medium text-white hover:bg-black disabled:opacity-20 transition-all shadow-sm"
                        >
                            Start Recovery Audit
                        </Button>
                        <p className="mt-2.5 text-[11px] text-[#8C9BA6]">
                            Margin will begin analysis immediately after upload.
                        </p>
                    </div>
                </section>

                {/* SUPPORTING: Decision Info */}
                <div className="grid gap-8 border-t border-[#D8E3EA] pt-8 mt-10">
                    {/* Period & Scope */}
                    <div className="grid sm:grid-cols-2 gap-8">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Calendar className="h-3.5 w-3.5 text-[#0B74DE]" />
                                <span className="text-[11px] font-bold uppercase text-[#182026]">Audit Period</span>
                            </div>
                            <select 
                                value={dateRange}
                                onChange={(e) => setDateRange(e.target.value)}
                                className="h-8 w-full rounded-md border border-[#D8E3EA] bg-white px-2 text-[12px] font-medium focus:outline-none cursor-pointer"
                            >
                                <option>Last 90 days</option>
                                <option>Last 180 days</option>
                                <option>Year to date</option>
                                <option>Custom range</option>
                            </select>
                            <p className="mt-2 text-[11px] text-[#4D5B66]">Use reports covering the same period where possible.</p>
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <FileText className="h-3.5 w-3.5 text-[#0B74DE]" />
                                <span className="text-[11px] font-bold uppercase text-[#182026]">What to Upload</span>
                            </div>
                            <p className="text-[12px] leading-relaxed text-[#4D5B66]">
                                {ACCEPTED_TYPES.join(' · ')}
                            </p>
                            <p className="mt-2 text-[11px] text-[#8C9BA6]">Margin recognizes these reports automatically.</p>
                        </div>
                    </div>

                    {/* Rules */}
                    <div className="grid sm:grid-cols-2 gap-8 border-t border-[#F1F5F9] pt-6">
                        <div className="text-[12px] text-[#4D5B66]">
                            <span className="block mb-1 font-bold text-[#182026] uppercase text-[10px]">What qualifies</span>
                            CSV and TXT operational reports. Up to 10 files (50 MB each).
                        </div>
                        <div className="text-[12px] text-[#4D5B66]">
                            <span className="block mb-1 font-bold text-[#182026] uppercase text-[10px]">Do not upload</span>
                            PDFs, Excel, Screenshots, or Invoices. Those are evidence documents.
                        </div>
                    </div>
                </div>
            </main>

            <footer className="py-8 text-center border-t border-[#D8E3EA] mt-12 bg-white">
                <p className="text-[11px] text-[#8C9BA6]">
                    Margin Agents can make mistakes. Check important info.
                </p>
            </footer>
        </div>
    );
}
