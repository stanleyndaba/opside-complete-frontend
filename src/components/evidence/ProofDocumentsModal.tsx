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
import { cn } from '@/lib/utils';
import { claimReferenceLabel, documentReferenceLabel } from '@/lib/displayReferences';

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
        return documentReferenceLabel(doc, doc.id);
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
            <DialogContent className="platform-vitality-page max-w-lg rounded-2xl border border-[#E5E7EB] bg-white text-[#111827] shadow-[0_18px_45px_rgba(17,24,39,0.10)]">
                {/* Header */}
                <DialogHeader className="border-b border-[#E5E7EB] pb-3">
                    <DialogTitle className="text-sm font-bold text-[#111827] tracking-tight uppercase">
                        Proof Documents
                    </DialogTitle>
                    <DialogDescription className="text-xs text-[#4B5563] mt-1">
                        Claim Reference: {claimReferenceLabel({ claim_number: claimNumber }, claimId)}
                    </DialogDescription>
                </DialogHeader>

                {/* Content */}
                <div className="py-4">
                    {documents.length === 0 ? (
                        /* Empty State */
                        <div className="text-center py-8">
                            <div className="w-12 h-12 mx-auto mb-3 bg-gray-100 rounded-full flex items-center justify-center">
                                <FileText className="h-5 w-5 text-gray-400" />
                            </div>
                            <p className="text-sm text-gray-600 mb-1">No proof documents linked</p>
                            <p className="text-xs text-gray-400">
                                Evidence documents will appear here once uploaded or matched
                            </p>
                        </div>
                    ) : (
                        /* Document List */
                        <div className="overflow-hidden rounded-lg border border-[#E5E7EB]">
                            <div className="border-b border-[#E5E7EB] bg-[#F8FAFC] px-4 py-2">
                                <span className="text-xs text-[#4B5563] font-bold tracking-tight uppercase">
                                    {documents.length} Document{documents.length !== 1 ? 's' : ''} Available
                                </span>
                            </div>
                            <div className="divide-y divide-[#E5E7EB]">
                                {documents.map((doc, index) => (
                                    <div key={doc.id || index} className="bg-white px-4 py-3 transition-colors hover:bg-[#F8FAFC]">
                                        <div className="flex items-start gap-3">
                                            {/* Icon */}
                                            <div className="mt-0.5 text-[#0052FF]">
                                                <FileText className="h-4 w-4" />
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1 min-w-0">
                                                <div className="truncate text-xs font-bold uppercase tracking-tight text-[#111827]">
                                                    {getDocumentName(doc)}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-[#4B5563]">
                                                        {getDocumentType(doc)}
                                                    </span>
                                                    {getDocumentDate(doc) && (
                                                        <>
                                                            <span className="text-[#CBD5E1]">•</span>
                                                            <span className="text-xs text-[#4B5563] font-bold tracking-tight uppercase">
                                                                {getDocumentDate(doc)}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                                {/* Additional metadata */}
                                                {(doc.supplier || doc.invoice_number || doc.amount) && (
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {doc.supplier && (
                                                            <span className="rounded border border-[#D7E2F2] bg-[#F3F7FF] px-1.5 py-0.5 text-xs text-[#1F2937]">
                                                                {doc.supplier}
                                                            </span>
                                                        )}
                                                        {doc.invoice_number && (
                                                            <span className="rounded border border-[#D7E2F2] bg-[#F3F7FF] px-1.5 py-0.5 text-xs text-[#1F2937]">
                                                                #{doc.invoice_number}
                                                            </span>
                                                        )}
                                                        {doc.amount && (
                                                            <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-xs text-emerald-700">
                                                                ${doc.amount.toFixed(2)}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Download Button */}
                                            <button
                                                onClick={() => handleDownload(doc)}
                                                className="rounded p-2 text-[#6B7280] transition-colors hover:bg-[#F3F7FF] hover:text-[#0052FF]"
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
                <div className="flex justify-end border-t border-[#E5E7EB] pt-3">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="border-[#D7E2F2] px-4 py-2 text-xs text-[#374151] hover:bg-[#F8FAFC]">
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default ProofDocumentsModal;
