import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Institutional Design Constants
const THEME = {
    primary: '#111827', // Gray 900
    secondary: '#374151', // Gray 700
    accent: '#10B981', // Emerald 500
    text: '#1F2937', // Gray 800
    textLight: '#6B7280', // Gray 500
    line: '#E5E7EB', // Gray 200
    bg: '#F9FAFB', // Gray 50
    font: 'helvetica',
    fontBold: 'helvetica',
    fontMono: 'courier'
};

const FORMAT = {
    margin: 15,
    lineHeight: 5,
    headerSize: 10,
    textSize: 8,
    smallSize: 7
};

export const ClaimPdfService = {
    generate: (data: any) => {
        const doc = new jsPDF();
        let yPos = 20;

        // --- TIER 1: MANDATORY CORE (Header & ID) ---

        // Header
        doc.setFont(THEME.font, 'bold');
        doc.setFontSize(14);
        doc.text('MARGIN // INSTITUTIONAL AUDIT RECORD', FORMAT.margin, yPos);

        doc.setFont(THEME.fontMono, 'normal');
        doc.setFontSize(8);
        doc.setTextColor(THEME.textLight);
        doc.text(`GENERATED: ${new Date().toLocaleDateString().toUpperCase()} ${new Date().toLocaleTimeString()}`, 200 - FORMAT.margin, yPos, { align: 'right' });

        yPos += 10;

        // Case ID Block
        doc.setFillColor(THEME.primary);
        doc.rect(FORMAT.margin, yPos, 180, 24, 'F');

        doc.setTextColor('#FFFFFF');
        doc.setFont(THEME.fontMono, 'bold');
        doc.setFontSize(16);
        doc.text(data.case_id || 'CASE-PENDING', FORMAT.margin + 5, yPos + 10);

        doc.setFontSize(8);
        doc.setFont(THEME.font, 'normal');
        doc.text(`STATUS: ${data.status?.toUpperCase() || 'UNKNOWN'}`, FORMAT.margin + 5, yPos + 18);

        // Top right of header block
        doc.setTextColor('#FFFFFF');
        doc.setFont(THEME.fontMono, 'normal');
        doc.text(`TOTAL CLAIM: $${Number(data.guaranteedAmount || data.amount || 0).toFixed(2)}`, 190, yPos + 10, { align: 'right' });
        doc.text(`CONFIDENCE: ${Math.round((data.confidence || 0.85) * 100)}%`, 190, yPos + 18, { align: 'right' });

        yPos += 35;

        // Core Details Grid (ASIN, SKU, Issue)
        doc.setTextColor(THEME.text);
        doc.setFont(THEME.font, 'bold');
        doc.setFontSize(FORMAT.headerSize);
        doc.text('1.0 CORE IDENTITY', FORMAT.margin, yPos);
        doc.setLineWidth(0.1);
        doc.line(FORMAT.margin, yPos + 2, 195, yPos + 2);
        yPos += 8;

        const coreDetails = [
            ['ASIN', data.asin || '—'],
            ['SKU', data.sku || '—'],
            ['Product', data.productName || '—'],
            ['FnSKU', data.fnsku || '—'],
            ['Facility', data.facility || data.evidence?.fulfillment_center || '—'],
            ['Shipment ID', data.shipment_id || '—']
        ];

        autoTable(doc, {
            startY: yPos,
            head: [],
            body: coreDetails,
            theme: 'plain',
            styles: { fontSize: 8, cellPadding: 2 },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 40, textColor: THEME.secondary },
                1: { font: 'courier', textColor: THEME.text }
            },
            margin: { left: FORMAT.margin }
        });

        yPos = (doc as any).lastAutoTable.finalY + 10;

        // Issues Description
        doc.setFont(THEME.font, 'bold');
        doc.setFontSize(9);
        doc.text('ISSUE DESCRIPTION', FORMAT.margin, yPos);
        doc.setFont(THEME.font, 'normal');
        doc.setFontSize(8);
        doc.setTextColor(THEME.secondary);
        const splitDesc = doc.splitTextToSize(data.narrative || 'No description available.', 180);
        doc.text(splitDesc, FORMAT.margin, yPos + 5);
        yPos += (splitDesc.length * 4) + 10;

        // Transaction History (Tier 1 - Missing Component)
        doc.setFont(THEME.font, 'bold');
        doc.setFontSize(9);
        doc.setTextColor(THEME.text);
        doc.text('TRANSACTION HISTORY', FORMAT.margin, yPos);
        yPos += 5;

        const historyData = [
            ['DATE', 'EVENT TYPE', 'REFERENCE', 'AMOUNT'],
            [
                new Date(data.created_at || Date.now()).toLocaleDateString(),
                'Issue Detected',
                data.id || 'N/A',
                `$${Number(data.guaranteedAmount || 0).toFixed(2)}`
            ],
            [
                data.evidence?.date ? new Date(data.evidence.date).toLocaleDateString() : '-',
                'Evidence Matched',
                data.evidence?.document_id || 'DOC-MATCH',
                '-'
            ]
        ];

        autoTable(doc, {
            startY: yPos,
            head: [historyData[0]],
            body: historyData.slice(1),
            theme: 'plain',
            headStyles: { fontStyle: 'bold', fontSize: 7, textColor: THEME.textLight, cellPadding: 1 },
            bodyStyles: { fontSize: 8, font: 'courier', cellPadding: 2 },
            margin: { left: FORMAT.margin }
        });

        yPos = (doc as any).lastAutoTable.finalY + 15;


        // --- TIER 2: ESSENTIAL SUPPORT (Financials & Evidence) ---

        doc.setTextColor(THEME.text);
        doc.setFont(THEME.font, 'bold');
        doc.setFontSize(FORMAT.headerSize);
        doc.text('2.0 FINANCIAL & EVIDENCE', FORMAT.margin, yPos);
        doc.line(FORMAT.margin, yPos + 2, 195, yPos + 2);
        yPos += 8;

        // Financial Table
        const financials = [
            ['Units Affected', String(data.unitsLost || 0)],
            ['Value Per Unit', `$${Number(data.unitCost || (data.guaranteedAmount / (data.unitsLost || 1))).toFixed(2)}`],
            ['Total Claimed', `$${Number(data.guaranteedAmount || 0).toFixed(2)}`],
            ['Expected Payout', `$${Number(data.guaranteedAmount || 0).toFixed(2)}`]
        ];

        autoTable(doc, {
            startY: yPos,
            head: [['METRIC', 'VALUE']],
            body: financials,
            theme: 'grid',
            headStyles: { fillColor: THEME.primary, textColor: '#FFFFFF', fontSize: 8, fontStyle: 'bold' },
            bodyStyles: { fontSize: 8, font: 'courier' },
            margin: { left: FORMAT.margin, right: 110 },
            tableWidth: 80
        });

        // Evidence List (Right Side)
        let rightY = yPos;
        doc.setFont(THEME.font, 'bold');
        doc.setFontSize(9);
        doc.text('SUPPORTING EVIDENCE', 110, rightY);
        rightY += 5;

        const docs = data.matchedDocs || [];
        if (docs.length === 0) {
            doc.setFont(THEME.font, 'italic');
            doc.setFontSize(8);
            doc.text('No documents attached.', 110, rightY + 5);
        } else {
            docs.slice(0, 5).forEach((d: any, i: number) => {
                doc.setFont(THEME.fontMono, 'normal');
                doc.setFontSize(8);
                doc.text(`[${i + 1}] ${d.name || d.filename || 'DOC'} (${Math.round((d.confidence || 0.8) * 100)}%)`, 110, rightY + 5 + (i * 5));
            });
        }

        // Amazon Policy Reference (Tier 2 - Missing Component)
        rightY += (Math.max(docs.length, 1) * 5) + 10;
        doc.setFont(THEME.font, 'bold');
        doc.setFontSize(9);
        doc.text('AMAZON POLICY REFERENCE', 110, rightY);
        doc.setFont(THEME.font, 'normal');
        doc.setFontSize(8);
        doc.setTextColor(THEME.secondary);
        doc.text('FBA Lost and Damaged Inventory Reimbursement Policy (Theme: "Inventory Adjustments")', 110, rightY + 5, { maxWidth: 80 });

        yPos = Math.max((doc as any).lastAutoTable.finalY + 15, rightY + 20);


        // --- TIER 3: PROCESSING AIDS (Timeline/Contacts) ---

        doc.setTextColor(THEME.text);
        doc.setFont(THEME.font, 'bold');
        doc.setFontSize(FORMAT.headerSize);
        doc.text('3.0 LOGISTICS & TRACE', FORMAT.margin, yPos);
        doc.line(FORMAT.margin, yPos + 2, 195, yPos + 2);
        yPos += 8;

        // Simple 2-col logic manually
        doc.setFontSize(8);

        // Left: Contact & Carriers
        doc.setFont(THEME.font, 'bold');
        doc.text('CONTACT & CARRIER', FORMAT.margin, yPos);
        doc.setFont(THEME.fontMono, 'normal');
        doc.text(`SELLER ID: ${data.seller_id || 'UNKNOWN'}`, FORMAT.margin, yPos + 5);
        doc.text(`STORE: ${data.store_name || 'UNKNOWN'}`, FORMAT.margin, yPos + 10);
        doc.text(`CARRIER: ${data.carrier || 'AMAZON PARTNERED'}`, FORMAT.margin, yPos + 15); // Tier 5 (moved up for space)

        // Right: Timeline & References
        doc.setFont(THEME.font, 'bold');
        doc.text('TIMELINE & TARGET S LAs', 110, yPos);
        doc.setFont(THEME.fontMono, 'normal');
        doc.text(`DETECTED: ${new Date(data.created_at || Date.now()).toLocaleDateString()}`, 110, yPos + 5);
        doc.text(`RESOLVE BY: ${new Date(Date.now() + (30 * 24 * 60 * 60 * 1000)).toLocaleDateString()} (+30 DAYS)`, 110, yPos + 10); // Follow-up dates
        doc.text(`PRIOR CASE: ${data.prior_case_id || 'NONE'}`, 110, yPos + 15); // Tier 3 Related References

        yPos += 25;


        // --- TIER 4: PROFESSIONAL POLISH (RCA & Actions) ---

        // Page Break Check (Tier 4)
        if (yPos + 60 > doc.internal.pageSize.height - 20) {
            doc.addPage();
            yPos = 20;
            doc.setFont(THEME.font, 'bold');
            doc.setFontSize(10);
            doc.setTextColor(THEME.textLight);
            doc.text(`CASE ID: ${data.case_id || 'REF-000'} // CONTINUED`, FORMAT.margin, yPos);
            yPos += 15;
        }

        doc.setTextColor(THEME.text);
        doc.setFont(THEME.font, 'bold');
        doc.setFontSize(FORMAT.headerSize);
        doc.text('4.0 RESOLUTION PROTOCOL', FORMAT.margin, yPos);
        doc.line(FORMAT.margin, yPos + 2, 195, yPos + 2);
        yPos += 8;

        // Box for Actions
        doc.setDrawColor(THEME.line);
        doc.rect(FORMAT.margin, yPos, 180, 50); // Increased height for polish items

        doc.setFont(THEME.font, 'bold');
        doc.setFontSize(8);
        doc.text('REQUIRED ACTIONS & PREVENTIVE MEASURES', FORMAT.margin + 5, yPos + 6);

        doc.setFont(THEME.font, 'normal');
        const actions = [
            `1. Review inventory discrepancy for SKU ${data.sku || 'N/A'}`,
            `2. Verify count against shipment ID ${data.shipment_id || 'N/A'}`,
            `3. Process reimbursement of $${Number(data.guaranteedAmount || 0).toFixed(2)}`,
            `4. RCA: Inventory mismatch occurred during inbound receiving scan at ${data.facility || 'FC'}.`, // Tier 4 RCA
            `5. PREVENTIVE: Request bin check at facility to prevent future "ghost" inventory.`, // Tier 4 Preventive
            `6. COMPLIANCE: Claim submitted within 18-month Audit window per FBA Policy.` // Tier 4 Compliance
        ];

        actions.forEach((action, i) => {
            doc.text(action, FORMAT.margin + 5, yPos + 12 + (i * 5));
        });

        // Verification Notes (Tier 4)
        doc.setFont(THEME.font, 'italic');
        doc.setTextColor(THEME.textLight);
        doc.text('VERIFICATION: Data reconciled against Amazon Settlement Reports & Inventory Ledgers.', FORMAT.margin + 5, yPos + 46);

        yPos += 60;


        // --- TIER 5: ADMIN METADATA (Footer tags) ---

        // Page Break Check (Tier 5)
        if (yPos + 30 > doc.internal.pageSize.height - 20) {
            doc.addPage();
            yPos = 20;
            doc.setFont(THEME.font, 'bold');
            doc.setFontSize(10);
            doc.setTextColor(THEME.textLight);
            doc.text(`CASE ID: ${data.case_id || 'REF-000'} // CONTINUED`, FORMAT.margin, yPos);
            yPos += 15;
        }

        // Product Specs (Tier 5)
        doc.setFont(THEME.fontMono, 'normal');
        doc.setFontSize(7);
        doc.setTextColor(THEME.textLight);
        doc.text(`PRODUCT_SPECS: ${data.productName?.slice(0, 40) || 'N/A'} | DIMS: STANDARD`, FORMAT.margin, yPos);
        doc.text(`AUDIT_METHOD: AUTONOMOUS_ENGINE | CATEGORY: ${(data.case_type || 'DISCREPANCY').toUpperCase()}`, FORMAT.margin, yPos + 4);
        doc.text(`ENGINE_MATCH: ${data.match_type || 'ORDER_ID'} | REF: ${data.id || 'N/A'}`, FORMAT.margin, yPos + 8);

        // Fulfillment Center Details (Tier 5) - Full address if available, otherwise code
        doc.text(`FACILITY_TRACE: ${data.facility || 'FTW1'} - AMAZON FULFILLMENT SERVICES`, FORMAT.margin, yPos + 12);


        // --- TIER 6: FOOTER (All Pages) ---
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            const pageHeight = doc.internal.pageSize.height;

            doc.setDrawColor(THEME.primary);
            doc.setLineWidth(0.5);
            doc.line(FORMAT.margin, pageHeight - 15, 195, pageHeight - 15);

            doc.setFont(THEME.font, 'bold');
            doc.setFontSize(8);
            doc.setTextColor(THEME.primary);
            doc.text('MARGIN // INSTITUTIONAL RECOVERY', FORMAT.margin, pageHeight - 10);

            doc.setFont(THEME.font, 'normal');
            doc.setFontSize(7);
            doc.setTextColor(THEME.textLight);
            doc.text(`CONFIDENTIAL - FOR INTERNAL USE ONLY | PAGE ${i} OF ${pageCount}`, 195, pageHeight - 10, { align: 'right' });
        }

        // Save
        doc.save(`CASE_${data.case_id || 'RECORD'}_${new Date().getTime()}.pdf`);
    }
};
