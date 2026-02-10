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
            <DialogContent className="max-w-lg bg-[#0c0c0c] border border-white/10 text-white">
                {/* Header */}
                <DialogHeader className="border-b border-white/10 pb-3">
                    <DialogTitle className="text-sm font-semibold text-white">
                        Proof Documents
                    </DialogTitle>
                    <DialogDescription className="text-xs text-white/60 mt-1">
                        Claim Reference: {claimNumber || claimId.slice(0, 12)}
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
                        <div className="border border-white/10 rounded-lg overflow-hidden">
                            <div className="bg-white/5 px-4 py-2 border-b border-white/10">
                                <span className="text-xs text-white/40 font-medium">
                                    {documents.length} Document{documents.length !== 1 ? 's' : ''} Available
                                </span>
                            </div>
                            <div className="divide-y divide-white/10">
                                {documents.map((doc, index) => (
                                    <div key={doc.id || index} className="px-4 py-3 bg-transparent hover:bg-white/5 transition-colors">
                                        <div className="flex items-start gap-3">
                                            {/* Icon */}
                                            <div className="mt-0.5 text-gray-400">
                                                <FileText className="h-4 w-4" />
                                            </div>

                                            {/* Details */}
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs font-medium text-white truncate">
                                                    {getDocumentName(doc)}
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-white/40">
                                                        {getDocumentType(doc)}
                                                    </span>
                                                    {getDocumentDate(doc) && (
                                                        <>
                                                            <span className="text-white/10">•</span>
                                                            <span className="text-xs text-white/40">
                                                                {getDocumentDate(doc)}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                                {/* Additional metadata */}
                                                {(doc.supplier || doc.invoice_number || doc.amount) && (
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {doc.supplier && (
                                                            <span className="text-xs px-1.5 py-0.5 bg-white/5 text-white/60 border border-white/10 rounded">
                                                                {doc.supplier}
                                                            </span>
                                                        )}
                                                        {doc.invoice_number && (
                                                            <span className="text-xs px-1.5 py-0.5 bg-white/5 text-white/60 border border-white/10 rounded">
                                                                #{doc.invoice_number}
                                                            </span>
                                                        )}
                                                        {doc.amount && (
                                                            <span className="text-xs px-1.5 py-0.5 bg-white/5 text-white/60 border border-white/10 rounded">
                                                                ${doc.amount.toFixed(2)}
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Download Button */}
                                            <button
                                                onClick={() => handleDownload(doc)}
                                                className="p-2 text-white/40 hover:text-white hover:bg-white/10 rounded transition-colors"
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
                <div className="flex justify-end pt-3 border-t border-white/10">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="text-xs px-4 py-2 border-white/10 text-white/60 hover:bg-white/5">
                        Close
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export default ProofDocumentsModal;
