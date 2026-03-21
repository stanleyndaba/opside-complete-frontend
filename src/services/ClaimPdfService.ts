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
    const caseType = String(data.anomaly_type || data.claim_type || data.case_type || '').toLowerCase();
    const amount = formatCurrency(data.requested_amount ?? data.guaranteedAmount ?? data.estimated_claim_value, data.currency || 'USD');
    const sku = sanitize(data.sku, 'Not available');
    const asin = sanitize(data.asin, 'Not available');
    const orderId = sanitize(data.order_id, 'Not available');
    const facility = sanitize(data.facility, 'Not available');
    const units = sanitize(data.unitsLost ?? data.units_lost ?? data.quantity ?? data.units, 'inventory');
    const detectionDate = formatDateTime(data.createdDate || data.created_at || data.discovery_date);

    const isFeeCase = caseType.includes('fee') || caseType.includes('overcharge') || caseType.includes('commission') || caseType.includes('storage') || caseType.includes('lts');
    const isLostCase = caseType.includes('lost') || caseType.includes('missing') || caseType.includes('shipment') || caseType.includes('shortage') || caseType.includes('discrepancy') || caseType.includes('inbound');
    const isDamagedCase = caseType.includes('damaged') || caseType.includes('damage') || caseType.includes('carrier');
    const isRefundCase = caseType.includes('refund') || caseType.includes('return') || caseType.includes('switcheroo') || caseType.includes('wrong_item') || caseType.includes('empty_box');
    const isChargebackCase = caseType.includes('chargeback') || caseType.includes('dispute') || caseType.includes('atoz');

    if (isFeeCase) {
        if (caseType.includes('storage') || caseType.includes('lts')) {
            return `Amazon's fee records show storage-related overcharges affecting SKU ${sku}. The case indicates fee calculations inconsistent with the product's expected storage profile. The amount currently tracked for review is ${amount}.`;
        }
        if (caseType.includes('commission')) {
            return `Amazon's fee records show referral-fee or commission discrepancies affecting SKU ${sku}. The case indicates an incorrect fee rate may have been applied. The amount currently tracked for review is ${amount}.`;
        }
        return `Amazon's fee records show fulfillment-fee discrepancies affecting SKU ${sku}. The case indicates dimensional or catalog-based fee classification may be inconsistent with the current product profile. The amount currently tracked for review is ${amount}.`;
    }

    if (isLostCase) {
        if (caseType.includes('inbound') || caseType.includes('shipment')) {
            return `Amazon's inventory management system shows inbound inventory for SKU ${sku} as not fully checked into fulfillment center ${facility}. The case tracks ${units} associated with this shipment discrepancy and a current requested amount of ${amount}.`;
        }
        return `Amazon's inventory management system shows inventory of SKU ${sku} as missing from fulfillment center ${facility}. These units were properly received but have since disappeared from available inventory without corresponding customer orders or removals. This inventory discrepancy represents a recoverable value of ${amount}.`;
    }

    if (isDamagedCase) {
        return `Amazon's case data shows damaged inventory affecting SKU ${sku} at fulfillment center ${facility}. The case currently tracks ${units} impacted by warehouse or transit damage, with an amount under review of ${amount}.`;
    }

    if (isRefundCase) {
        return `Amazon's return and refund records show a reimbursement-related discrepancy for order ${orderId}. The case indicates SKU ${sku} may not have been properly recovered through the normal return workflow. The amount currently tracked for review is ${amount}.`;
    }

    if (isChargebackCase) {
        return `Amazon's dispute records show a payment or guarantee dispute affecting order ${orderId}. The current case tracks the contested value for SKU ${sku} at ${amount}.`;
    }

    return `This generated summary reflects the current backend case data for SKU ${sku}${asin !== 'Not available' ? ` (ASIN ${asin})` : ''}. The case was identified on ${detectionDate}, and the amount currently tracked for review is ${amount}.`;
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
        const primaryDiscrepancy = sanitize((data.case_type || data.anomaly_type || '').replace?.(/_/g, ' ') || data.anomaly_type || data.case_type);
        const requestedAmount = formatCurrency(data.requested_amount ?? data.guaranteedAmount, data.currency || 'USD');
        const confidenceLabel = formatConfidence(data.confidence ?? data.confidence_score);
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
                            doc.addImage(reader.result as string, 'PNG', MARGIN, 12, 6.5, 3.25);
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
            doc.rect(MARGIN, 12, 2.1, 4.1, 'F');
            doc.rect(MARGIN + 3.0, 12, 2.1, 4.1, 'F');
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        const rightColX = pageWidth - 72;
        const valX = pageWidth - MARGIN;
        doc.setTextColor(COLORS.soft);
        doc.text('Reference ID', rightColX, 15);
        doc.setFont('courier', 'bold');
        doc.setTextColor(COLORS.ink);
        doc.text(caseId.length > 20 ? `${caseId.slice(0, 8)}...${caseId.slice(-8)}` : caseId, valX, 15, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(COLORS.soft);
        doc.text('Object Type', rightColX, 21);
        doc.setTextColor(COLORS.ink);
        doc.text(sanitize(data.object_type), valX, 20, { align: 'right' });
        doc.setTextColor(COLORS.soft);
        doc.text('Current Status', rightColX, 27);
        doc.setTextColor(COLORS.ink);
        doc.text(toStatusLabel(data.status), valX, 25, { align: 'right' });

        doc.setDrawColor(COLORS.line);
        doc.setLineWidth(0.1);
        doc.line(MARGIN, 26.5, pageWidth - MARGIN, 26.5);

        yPos = 34;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(COLORS.ink);
        doc.text('Case Overview', MARGIN, yPos);

        const metricY = 44;
        const metricValueY = 56;
        const separatorOneX = MARGIN + 39;
        const separatorTwoX = MARGIN + 95;
        const secondColumnX = separatorOneX + 4;
        const thirdColumnX = separatorTwoX + 4;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.5);
        doc.setTextColor(COLORS.soft);
        doc.text('REQUESTED AMOUNT', MARGIN, metricY);
        doc.text('PRIMARY DISCREPANCY', secondColumnX, metricY);
        doc.text('CONFIDENCE', thirdColumnX, metricY);

        doc.setFontSize(8);
        doc.setTextColor(COLORS.ink);
        doc.setFont('courier', 'bold');
        doc.text(requestedAmount, MARGIN, metricValueY);
        doc.text('|', separatorOneX, metricValueY);
        doc.setFont('helvetica', 'normal');
        doc.text(primaryDiscrepancy, secondColumnX, metricValueY);
        doc.setFont('courier', 'bold');
        doc.text('|', separatorTwoX, metricValueY);
        doc.setTextColor(confidenceLabel === 'Not available' ? COLORS.ink : COLORS.accent);
        doc.text(confidenceLabel, thirdColumnX, metricValueY);

        yPos = 72;
        doc.setFont('times', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(COLORS.ink);
        doc.text('1. DISCREPANCY', MARGIN, yPos);
        doc.line(MARGIN, yPos + 2, pageWidth - MARGIN, yPos + 2);
        yPos += 8;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        const generatedSummary = buildGeneratedSummary(data);
        doc.text(doc.splitTextToSize(generatedSummary, pageWidth - (MARGIN * 2)), MARGIN, yPos);

        yPos = 138;
        doc.setFont('times', 'bold');
        doc.setFontSize(10);
        doc.text('2. LIFECYCLE STATE', MARGIN, yPos);
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
        doc.text('3. AMOUNT SNAPSHOT', MARGIN, yPos);
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
        doc.text('4. CASE REFERENCES', MARGIN, yPos);
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
        doc.text('This document is an internal case report generated from system data. It does not constitute a filed claim, legal notice, or certification.', MARGIN, footerY + 5);
        doc.setFont('times', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(COLORS.ink);
        doc.text('MARGIN - INTERNAL CASE EXPORT', MARGIN, footerY + 11);
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
        doc.setFont('helvetica', 'normal');
        doc.text('MARGIN - INTERNAL CASE EXPORT', MARGIN, 22);
        doc.setFontSize(7);
        doc.setTextColor(COLORS.soft);
        doc.text('APPENDIX: CASE EVIDENCE & EVENT SUMMARY [EXHIBIT A]', MARGIN, 29);
        doc.line(MARGIN, 30, pageWidth - MARGIN, 30);

        yPos = 40;
        doc.setFont('times', 'bold');
        doc.setFontSize(10);
        doc.text('5. ASSET & EVIDENCE SNAPSHOT', MARGIN, yPos);
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
        doc.text('6. LINKED EVIDENCE DOCUMENTS', MARGIN, yPos);
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
        doc.text('7. GENERATED EVENT SUMMARY', MARGIN, yPos);
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
        doc.text('8. CASE TRACE REFERENCES', MARGIN, yPos);
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
        doc.text('This document is an internal case report generated from system data. It does not constitute a filed claim, legal notice, or certification.', MARGIN, footerY + 5);
        doc.setFont('times', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(COLORS.ink);
        doc.text('MARGIN - INTERNAL CASE EXPORT', MARGIN, footerY + 11);
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
            doc.text('MARGIN - INTERNAL CASE EXPORT', MARGIN, footerY + 11);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.text(`PAGE 3 OF 3 | ${statementDate}`, pageWidth - MARGIN, footerY + 11, { align: 'right' });
        }

        const safeId = sanitize(data.dispute_case_id || data.id, 'case').replace(/[^a-zA-Z0-9_-]/g, '_');
        doc.save(`case-detail-${safeId}-${statementDate}.pdf`);
    }
};
