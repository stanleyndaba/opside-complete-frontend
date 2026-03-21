import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORS = {
    ink: '#111111',
    soft: '#666666',
    line: '#E5E5E5',
    panel: '#F5F5F5',
    accent: '#2563EB',
    muted: '#9CA3AF',
};

const MARGIN = 14;

const sanitize = (val: any, fallback = 'Not available') => {
    if (val === null || val === undefined) return fallback;
    const text = String(val).trim();
    if (!text || text === 'N/A' || text === 'null' || text === 'undefined') return fallback;
    return text;
};

const toStatusLabel = (value?: string | null) => {
    if (!value) return 'Not available';
    return String(value).replace(/_/g, ' ');
};

const formatCurrency = (value?: number | null, currency: string = 'USD') => {
    if (typeof value !== 'number' || Number.isNaN(value)) return 'Not available';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);
};

const formatDateTime = (value?: string | null) => {
    if (!value) return 'Not available';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'Not available';
    return parsed.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const formatConfidence = (value: any) => {
    if (typeof value !== 'number' || Number.isNaN(value)) return 'Not available';
    const normalized = value > 1 ? value : value * 100;
    const bounded = Math.max(0, Math.min(100, normalized));
    return `${Math.round(bounded)}%`;
};

const buildGeneratedSummary = (data: any) => {
    const fragments = [
        `Generated on ${new Date().toISOString().split('T')[0]} from backend-backed case detail data.`,
        `Current status is ${toStatusLabel(data.status)}.`,
        data.filing_status ? `Filing status is ${toStatusLabel(data.filing_status)}.` : null,
        data.recovery_status ? `Recovery status is ${toStatusLabel(data.recovery_status)}.` : null,
        data.billing_status ? `Billing status is ${toStatusLabel(data.billing_status)}.` : null,
        data.next_step_context?.description || null,
        data.rejection_reason ? `Stored rejection reason: ${data.rejection_reason}.` : null,
    ].filter(Boolean);

    return fragments.join(' ');
};

const buildLifecycleRows = (data: any) => [
    ['Object Type', sanitize(data.object_type)],
    ['Current Status', toStatusLabel(data.status)],
    ['Filing Status', toStatusLabel(data.filing_status)],
    ['Recovery Status', toStatusLabel(data.recovery_status)],
    ['Billing Status', toStatusLabel(data.billing_status)],
    ['Created', formatDateTime(data.createdDate || data.created_at)],
    ['Last Updated', formatDateTime(data.updated_at)],
];

const buildMoneyRows = (data: any) => [
    ['Estimated Claim Value', formatCurrency(data.estimated_claim_value, data.currency || 'USD')],
    ['Requested Amount', formatCurrency(data.requested_amount ?? data.guaranteedAmount, data.currency || 'USD')],
    ['Approved Amount', formatCurrency(data.approved_amount, data.currency || 'USD')],
    ['Recovered Amount', formatCurrency(data.actual_payout_amount, data.currency || 'USD')],
    ['Billed Fee', formatCurrency(data.billed_amount, data.currency || 'USD')],
    ['Unit Cost', formatCurrency(data.unitCost ?? data.unit_cost, data.currency || 'USD')],
];

const buildReferenceRows = (data: any) => [
    ['Case ID', sanitize(data.dispute_case_id || data.id)],
    ['Detection ID', sanitize(data.detection_result_id)],
    ['Case Number', sanitize(data.case_number)],
    ['Claim Number', sanitize(data.claim_number)],
    ['Amazon Case ID', sanitize(data.amazonCaseId || data.amazon_case_id)],
    ['Store', sanitize(data.store_name)],
    ['Merchant ID', sanitize(data.seller_id)],
    ['Contact', sanitize(data.contact_email)],
    ['Order ID', sanitize(data.order_id)],
    ['Shipment ID', sanitize(data.shipmentId || data.fba_shipment_id)],
    ['Facility', sanitize(data.facility)],
    ['Expected Payout Date', formatDateTime(data.expectedPayoutDate || data.expected_payout_date)],
];

const buildAssetRows = (data: any) => [
    ['Product Name', sanitize(data.productName)],
    ['SKU', sanitize(data.sku)],
    ['ASIN', sanitize(data.asin)],
    ['Units Affected', sanitize(data.unitsLost ?? data.units_lost ?? data.quantity)],
    ['Confidence', formatConfidence(data.confidence ?? data.confidence_score)],
    ['Matched Evidence Count', sanitize(data.evidence_summary?.matched_document_count, '0')],
    ['Evidence Match Type', sanitize(data.evidence_summary?.match_type)],
    ['Evidence Match Confidence', formatConfidence(data.evidence_summary?.match_confidence)],
];

const buildEventRows = (events: any[]) => {
    if (!Array.isArray(events) || events.length === 0) {
        return [['No persisted case events were returned for this export.', '', '', '']];
    }

    return events.slice(0, 10).map((event) => {
        const type = sanitize(event.type || event.eventType || event.source);
        const status = sanitize(event.status);
        const message = sanitize(event.message || event.title || event.description, '');
        return [
            formatDateTime(event.at || event.timestamp),
            type,
            status,
            message || 'No additional message'
        ];
    });
};

const buildEvidenceRows = (documents: any[]) => {
    if (!Array.isArray(documents) || documents.length === 0) {
        return [['No linked evidence documents were returned for this case.', '', '']];
    }

    return documents.map((doc) => [
        sanitize(doc.filename || doc.name),
        sanitize(doc.doc_type || doc.matchType),
        formatDateTime(doc.created_at || doc.createdAt)
    ]);
};

export const ClaimPdfService = {
    generate: async (data: any) => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const statementDate = new Date().toISOString().split('T')[0];
        const caseId = sanitize(data.dispute_case_id || data.id, 'case');
        let yPos = 20;
        let logoLoaded = false;

        try {
            const response = await fetch('/logoimagetwo.png');
            const blob = await response.blob();
            const reader = new FileReader();
            await new Promise<void>((resolve) => {
                reader.onloadend = () => {
                    if (reader.result) {
                        try {
                            doc.addImage(reader.result as string, 'PNG', MARGIN, 12, 8, 4);
                            logoLoaded = true;
                        } catch (e) {
                            console.warn('Could not add logo to PDF:', e);
                        }
                    }
                    resolve();
                };
                reader.readAsDataURL(blob);
            });
        } catch (e) {
            console.warn('Could not load logo:', e);
        }

        if (!logoLoaded) {
            doc.setFillColor(COLORS.ink);
            doc.rect(MARGIN, 12, 2.5, 5, 'F');
            doc.rect(MARGIN + 3.5, 12, 2.5, 5, 'F');
        }

        doc.setDrawColor(COLORS.line);
        doc.setLineWidth(0.1);
        doc.line(MARGIN, 28, pageWidth - MARGIN, 28);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(COLORS.ink);
        doc.text('MARGIN', MARGIN, 22);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text('INTERNAL CASE REPORT', MARGIN, 25.5);
        doc.setFontSize(7);
        doc.setTextColor(COLORS.soft);
        doc.text('CASE REPORT', MARGIN, 32);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const rightColX = pageWidth - 72;
        const valX = pageWidth - MARGIN;
        doc.text('Reference ID:', rightColX, 15);
        doc.setFont('courier', 'bold');
        doc.text(caseId.length > 20 ? `${caseId.slice(0, 8)}...${caseId.slice(-8)}` : caseId, valX, 15, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        doc.text('Object Type:', rightColX, 20);
        doc.text(sanitize(data.object_type), valX, 20, { align: 'right' });
        doc.text('Current Status:', rightColX, 25);
        doc.text(toStatusLabel(data.status), valX, 25, { align: 'right' });

        yPos = 58;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(COLORS.ink);
        doc.text('CASE REPORT', MARGIN, yPos);

        yPos = 65;
        doc.setFillColor(COLORS.panel);
        doc.rect(MARGIN, yPos, pageWidth - (MARGIN * 2), 28, 'F');

        const summaryWidth = (pageWidth - (MARGIN * 2)) / 3;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(COLORS.soft);
        doc.text('REQUESTED AMOUNT', MARGIN + 5, yPos + 8);
        doc.text('PRIMARY DISCREPANCY', MARGIN + summaryWidth, yPos + 8);
        doc.text('CONFIDENCE', MARGIN + (summaryWidth * 2), yPos + 8);
        doc.setTextColor(COLORS.ink);
        doc.setFont('courier', 'bold');
        doc.setFontSize(11);
        doc.text(formatCurrency(data.requested_amount ?? data.guaranteedAmount, data.currency || 'USD'), MARGIN + 5, yPos + 17);
        doc.setFontSize(8);
        doc.text(sanitize((data.case_type || data.anomaly_type || '').replace?.(/_/g, ' ') || data.anomaly_type || data.case_type), MARGIN + summaryWidth, yPos + 17);
        doc.setTextColor(COLORS.accent);
        doc.text(formatConfidence(data.confidence ?? data.confidence_score), MARGIN + (summaryWidth * 2), yPos + 17);
        doc.setTextColor(COLORS.soft);
        yPos = 103;
        doc.setFont('times', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(COLORS.ink);
        doc.text('1.0 GENERATED SUMMARY & ANALYSIS', MARGIN, yPos);
        doc.line(MARGIN, yPos + 2, pageWidth - MARGIN, yPos + 2);
        yPos += 8;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        const generatedSummary = buildGeneratedSummary(data);
        doc.text(doc.splitTextToSize(generatedSummary, pageWidth - (MARGIN * 2)), MARGIN, yPos);

        yPos = 138;
        doc.setFont('times', 'bold');
        doc.setFontSize(10);
        doc.text('2.0 LIFECYCLE STATE', MARGIN, yPos);
        doc.line(MARGIN, yPos + 2, pageWidth - MARGIN, yPos + 2);

        autoTable(doc, {
            startY: yPos + 6,
            body: buildLifecycleRows(data),
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 3, lineWidth: 0.1, lineColor: COLORS.line },
            columnStyles: {
                0: { fillColor: COLORS.panel, fontStyle: 'bold', cellWidth: 48, textColor: COLORS.soft },
                1: { textColor: COLORS.ink }
            },
            margin: { left: MARGIN, right: MARGIN }
        });

        yPos = (doc as any).lastAutoTable.finalY + 10;
        doc.setFont('times', 'bold');
        doc.setFontSize(10);
        doc.text('3.0 AMOUNT SNAPSHOT', MARGIN, yPos);
        doc.line(MARGIN, yPos + 2, pageWidth - MARGIN, yPos + 2);

        autoTable(doc, {
            startY: yPos + 6,
            body: buildMoneyRows(data),
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 3, lineWidth: 0.1, lineColor: COLORS.line },
            columnStyles: {
                0: { fillColor: COLORS.panel, fontStyle: 'bold', cellWidth: 55, textColor: COLORS.soft },
                1: { font: 'courier', textColor: COLORS.ink }
            },
            margin: { left: MARGIN, right: MARGIN }
        });

        yPos = (doc as any).lastAutoTable.finalY + 10;
        doc.setFont('times', 'bold');
        doc.setFontSize(10);
        doc.text('4.0 CASE REFERENCES', MARGIN, yPos);
        doc.line(MARGIN, yPos + 2, pageWidth - MARGIN, yPos + 2);

        autoTable(doc, {
            startY: yPos + 6,
            body: buildReferenceRows(data),
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 3, lineWidth: 0.1, lineColor: COLORS.line },
            columnStyles: {
                0: { fillColor: COLORS.panel, fontStyle: 'bold', cellWidth: 48, textColor: COLORS.soft },
                1: { textColor: COLORS.ink }
            },
            margin: { left: MARGIN, right: MARGIN }
        });

        const footerY = pageHeight - 15;
        doc.setDrawColor(COLORS.line);
        doc.line(MARGIN, footerY, pageWidth - MARGIN, footerY);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.setTextColor(COLORS.soft);
        doc.text('Generated from backend case detail data. This export is not a filed notice or legal certification.', MARGIN, footerY + 5);
        doc.setFont('times', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(COLORS.ink);
        doc.text('MARGIN // INTERNAL CASE EXPORT', MARGIN, footerY + 11);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text(`PAGE 1 OF ${data.evidence_image ? 3 : 2} | ${statementDate}`, pageWidth - MARGIN, footerY + 11, { align: 'right' });

        doc.addPage();
        yPos = 20;

        if (logoLoaded) {
            try {
                const logoRes = await fetch('/logoimagetwo.png');
                const logoBlob = await logoRes.blob();
                const logoReader = new FileReader();
                await new Promise<void>((resolve) => {
                    logoReader.onloadend = () => {
                        if (logoReader.result) {
                            doc.addImage(logoReader.result as string, 'PNG', MARGIN, 12, 8, 4);
                        }
                        resolve();
                    };
                    logoReader.readAsDataURL(logoBlob);
                });
            } catch {
                // ignore logo failure on later pages
            }
        }

        doc.setTextColor(COLORS.ink);
        doc.setFontSize(8);
        doc.setFont('times', 'bold');
        doc.text('MARGIN', MARGIN, 22);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.text('APPENDIX: CASE EVIDENCE & EVENT SUMMARY [EXHIBIT A]', MARGIN, 25.5);
        doc.line(MARGIN, 30, pageWidth - MARGIN, 30);

        yPos = 40;
        doc.setFont('times', 'bold');
        doc.setFontSize(10);
        doc.text('5.0 ASSET & EVIDENCE SNAPSHOT', MARGIN, yPos);
        doc.line(MARGIN, yPos + 2, pageWidth - MARGIN, yPos + 2);

        autoTable(doc, {
            startY: yPos + 6,
            body: buildAssetRows(data),
            theme: 'grid',
            styles: { fontSize: 8, cellPadding: 3, lineWidth: 0.1, lineColor: COLORS.line },
            columnStyles: {
                0: { fillColor: COLORS.panel, fontStyle: 'bold', cellWidth: 55, textColor: COLORS.soft },
                1: { textColor: COLORS.ink }
            },
            margin: { left: MARGIN, right: MARGIN }
        });

        yPos = (doc as any).lastAutoTable.finalY + 10;
        doc.setFont('times', 'bold');
        doc.setFontSize(10);
        doc.text('6.0 LINKED EVIDENCE DOCUMENTS', MARGIN, yPos);
        doc.line(MARGIN, yPos + 2, pageWidth - MARGIN, yPos + 2);

        autoTable(doc, {
            startY: yPos + 6,
            head: [['Filename', 'Type', 'Created']],
            body: buildEvidenceRows(Array.isArray(data.documents) ? data.documents : []),
            theme: 'grid',
            headStyles: { fillColor: COLORS.panel, textColor: COLORS.soft, fontSize: 7, fontStyle: 'bold', lineWidth: 0.1 },
            bodyStyles: { fontSize: 7.5, textColor: COLORS.ink, lineWidth: 0.1 },
            margin: { left: MARGIN, right: MARGIN }
        });

        yPos = (doc as any).lastAutoTable.finalY + 10;
        doc.setFont('times', 'bold');
        doc.setFontSize(10);
        doc.text('7.0 GENERATED EVENT SUMMARY', MARGIN, yPos);
        doc.line(MARGIN, yPos + 2, pageWidth - MARGIN, yPos + 2);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(COLORS.soft);
        doc.text('Generated from persisted case timeline events. This section is not raw ledger data.', MARGIN, yPos + 7);

        autoTable(doc, {
            startY: yPos + 11,
            head: [['Timestamp', 'Event Type', 'Status', 'Message']],
            body: buildEventRows(Array.isArray(data.events) ? data.events : []),
            theme: 'grid',
            headStyles: { fillColor: COLORS.panel, textColor: COLORS.soft, fontSize: 7, fontStyle: 'bold', lineWidth: 0.1 },
            bodyStyles: { fontSize: 7, textColor: COLORS.ink, lineWidth: 0.1 },
            columnStyles: {
                0: { cellWidth: 34 },
                1: { cellWidth: 28 },
                2: { cellWidth: 28 },
                3: { cellWidth: 'auto' }
            },
            margin: { left: MARGIN, right: MARGIN }
        });

        yPos = (doc as any).lastAutoTable.finalY + 10;
        doc.setFont('times', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(COLORS.ink);
        doc.text('8.0 CASE TRACE REFERENCES', MARGIN, yPos);
        doc.line(MARGIN, yPos + 2, pageWidth - MARGIN, yPos + 2);
        doc.setFont('courier', 'normal');
        doc.setFontSize(7);
        doc.text(`INTERNAL_ID: ${sanitize(data.dispute_case_id || data.id)}`, MARGIN, yPos + 8);
        doc.text(`DETECTION_ID: ${sanitize(data.detection_result_id)}`, MARGIN, yPos + 13);
        doc.text(`AMZ_CASE_ID: ${sanitize(data.amazonCaseId || data.amazon_case_id)}`, MARGIN, yPos + 18);
        doc.text(`REJECTION_CATEGORY: ${sanitize(data.rejection_category)}`, MARGIN, yPos + 23);

        doc.setDrawColor(COLORS.line);
        doc.line(MARGIN, footerY, pageWidth - MARGIN, footerY);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.setTextColor(COLORS.soft);
        doc.text('Evidence and events shown here come from the current backend case DTO and persisted case history.', MARGIN, footerY + 5);
        doc.setFont('times', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(COLORS.ink);
        doc.text('MARGIN // EXHIBIT A', MARGIN, footerY + 11);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text(`PAGE 2 OF ${data.evidence_image ? 3 : 2} | ${statementDate}`, pageWidth - MARGIN, footerY + 11, { align: 'right' });

        if (data.evidence_image) {
            doc.addPage();
            yPos = 30;
            doc.setFont('times', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(COLORS.ink);
            doc.text('EXHIBIT B: ATTACHED EVIDENCE PREVIEW', MARGIN, yPos);
            doc.line(MARGIN, yPos + 2, pageWidth - MARGIN, yPos + 2);

            try {
                doc.addImage(data.evidence_image, 'JPEG', MARGIN, yPos + 10, pageWidth - (MARGIN * 2), 150);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8);
                doc.setTextColor(COLORS.accent);
                doc.text('Attached evidence preview', pageWidth - 60, yPos + 22);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(6.5);
                doc.text(
                    `Match confidence: ${formatConfidence(data.evidence_summary?.match_confidence)}`,
                    pageWidth - 60,
                    yPos + 27
                );
            } catch {
                doc.setFont('helvetica', 'italic');
                doc.setTextColor(COLORS.soft);
                doc.text('[Evidence preview unavailable]', MARGIN, yPos + 15);
            }

            doc.setDrawColor(COLORS.line);
            doc.line(MARGIN, footerY, pageWidth - MARGIN, footerY);
            doc.setFont('times', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(COLORS.ink);
            doc.text('MARGIN // EXHIBIT B', MARGIN, footerY + 11);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.text(`PAGE 3 OF 3 | ${statementDate}`, pageWidth - MARGIN, footerY + 11, { align: 'right' });
        }

        const safeId = sanitize(data.dispute_case_id || data.id, 'case').replace(/[^a-zA-Z0-9_-]/g, '_');
        doc.save(`case-detail-${safeId}-${statementDate}.pdf`);
    }
};
