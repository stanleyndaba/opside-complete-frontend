/**
 * ProofDocumentsModal Component
 * Institutional-styled modal for viewing and downloading proof documents
 * Pentagon/Bank-level design - soft grey, dark-charcoal, and white only
 */

import React from 'react';
import { format } from 'date-fns';
import { FileText, Download, ExternalLink, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ProofDocument {
    id: string;
    name?: string;
    filename?: string;
    type?: string;
    doc_type?: string;
    uploadDate?: string;
    created_at?: string;
    url?: string;
    supplier?: string;
    invoice_number?: string;
    amount?: number;
}

interface ProofDocumentsModalProps {
    open: boolean;
    onClose: () => void;
    claimId: string;
    claimNumber?: string;
    documents: ProofDocument[];
    onDownload?: (doc: ProofDocument) => void;
}

export function ProofDocumentsModal({
    open,
    onClose,
    claimId,
    claimNumber,
    documents,
    onDownload
}: ProofDocumentsModalProps) {

    const handleDownload = (doc: ProofDocument) => {
        if (onDownload) {
            onDownload(doc);
        } else if (doc.url) {
            window.open(doc.url, '_blank');
        } else {
            // Default: try to open document endpoint
            window.open(`/api/documents/${doc.id}/download`, '_blank');
        }
    };

    const getDocumentType = (doc: ProofDocument) => {
        const type = doc.doc_type || doc.type || 'Document';
        return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const getDocumentName = (doc: ProofDocument) => {
        return doc.filename || doc.name || `Document ${doc.id.slice(0, 8)}`;
    };

    const getDocumentDate = (doc: ProofDocument) => {
        const date = doc.uploadDate || doc.created_at;
        if (!date) return null;
        try {
            return format(new Date(date), 'MMM dd, yyyy');
        } catch {
            return null;
        }
    };

    return (
        <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <DialogContent className="max-w-lg bg-[#0c0c0c] border border-white/10 shadow-2xl backdrop-blur-3xl rounded-2xl overflow-hidden p-0">
                {/* Header */}
                <div className="px-6 py-5 border-b border-white/5 bg-white/[0.02]">
                    <DialogHeader className="space-y-1">
                        <DialogTitle className="text-[12px] font-mono font-bold text-white uppercase tracking-[0.2em]">
                            PROOF_DOCUMENTS_RETRIEVAL
                        </DialogTitle>
                        <DialogDescription className="text-[10px] font-mono text-white/40 uppercase tracking-tight">
                            CLAIM_REF: {claimNumber || claimId.slice(0, 12)}
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {/* Content */}
                <div className="p-6">
                    {documents.length === 0 ? (
                        /* Empty State */
                        <div className="text-center py-12 bg-white/[0.02] border border-white/5 rounded-2xl">
                            <div className="w-12 h-12 mx-auto mb-4 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5">
                                <FileText className="h-5 w-5 text-white/20" />
                            </div>
                            <p className="text-[10px] font-mono font-bold text-white/60 uppercase tracking-widest mb-1">ZERO_NODES_IDENTIFIED</p>
                            <p className="text-[9px] font-mono text-white/20 uppercase tracking-tighter">
                                Evidence documents will synchronize here once matched
                            </p>
                        </div>
                    ) : (
                        /* Document List */
                        <div className="border border-white/5 rounded-2xl overflow-hidden bg-white/[0.01]">
                            <div className="bg-white/5 px-5 py-3 border-b border-white/5">
                                <span className="text-[9px] font-mono font-bold text-white/40 uppercase tracking-widest">
                                    {documents.length} DOCUMENT{documents.length !== 1 ? 'S' : ''}_SYNCHRONIZED
                                </span>
                            </div>
                            <div className="divide-y divide-white/5">
                                {documents.map((doc, index) => (
                                    <div key={doc.id || index} className="px-5 py-4 hover:bg-white/[0.03] transition-all duration-300 group">
                                        <div className="flex items-start gap-4">
                                            {/* Icon */}
                                            <div className="mt-1 p-2 bg-white/5 rounded-lg border border-white/5 text-white/20 group-hover:text-emerald-500 transition-colors">
                                                <FileText className="h-4 w-4" />
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[11px] font-mono font-bold text-white/80 truncate mb-1">
                                                    {getDocumentName(doc)}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-mono font-bold text-white/30 uppercase tracking-tighter">
                                                        {getDocumentType(doc)}
                                                    </span>
                                                    {getDocumentDate(doc) && (
                                                        <>
                                                            <div className="h-1 w-1 rounded-full bg-white/10" />
                                                            <span className="text-[9px] font-mono text-white/20 uppercase">
                                                                {getDocumentDate(doc)}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                                {/* Additional metadata */}
                                                {(doc.supplier || doc.invoice_number || doc.amount) && (
                                                    <div className="flex flex-wrap gap-2 mt-3">
                                                        {doc.supplier && (
                                                            <span className="text-[8px] font-mono font-bold px-2 py-0.5 bg-white/5 text-white/40 border border-white/5 rounded-full uppercase tracking-tighter">
                                                                {doc.supplier}
                                                            </span>
                                                        )}
                                                        {doc.invoice_number && (
                                                            <span className="text-[8px] font-mono font-bold px-2 py-0.5 bg-white/5 text-white/40 border border-white/5 rounded-full uppercase tracking-tighter">
                                                                #{doc.invoice_number}
                                                            </span>
                                                        )}
                                                        {doc.amount && (
                                                            <span className="text-[8px] font-mono font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full uppercase tracking-tighter">
                                                                ${doc.amount.toFixed(2)}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Download Button */}
                                            <button
                                                onClick={() => handleDownload(doc)}
                                                className="p-2.5 text-white/20 hover:text-white hover:bg-white/10 rounded-xl border border-transparent hover:border-white/10 transition-all duration-300"
                                                title="Download document">
                                                <Download className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-white/5 bg-white/[0.02] flex justify-end">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="text-[10px] font-mono font-bold text-white/30 hover:text-white uppercase tracking-widest px-6 h-10 rounded-xl transition-all">
                        TERMINATE_VIEW
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default ProofDocumentsModal;
