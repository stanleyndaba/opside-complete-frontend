import React, { useMemo } from 'react';
import { CircleCheck } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';

type ApprovedReimbursement = {
  caseNumber: string;
  amazonCaseId: string;
  seller: string;
  disputeName: string;
  amount: number;
  proofReference: string;
  closeout: string;
  updated: string;
};

const APPROVED_REIMBURSEMENTS: ApprovedReimbursement[] = [
  {
    caseNumber: '791-50384216',
    amazonCaseId: '16874192034',
    seller: 'Northstar Home Goods',
    disputeName: 'Inbound shipment shortage',
    amount: 184.72,
    proofReference: 'AMZ-PAID-XFER-2034',
    closeout: 'Paid and reconciled',
    updated: 'Jul 19, 2026',
  },
  {
    caseNumber: '791-67392051',
    amazonCaseId: '16912090511',
    seller: 'Northstar Home Goods',
    disputeName: 'Inbound shipment shortage',
    amount: 569.5,
    proofReference: 'AMZ-PAID-INB-90511',
    closeout: 'Paid and reconciled',
    updated: 'Jul 18, 2026',
  },
  {
    caseNumber: '791-61427803',
    amazonCaseId: '16882957162',
    seller: 'Blue Ridge Supply',
    disputeName: 'Warehouse transfer loss',
    amount: 312.18,
    proofReference: 'AMZ-PAID-INB-7162',
    closeout: 'Clean settlement match',
    updated: 'Jul 19, 2026',
  },
  {
    caseNumber: '791-77260491',
    amazonCaseId: '16865503418',
    seller: 'Atlas Pet Co',
    disputeName: 'Damaged FBA inventory',
    amount: 96.44,
    proofReference: 'AMZ-PAID-DMG-3418',
    closeout: 'Paid with variance note',
    updated: 'Jul 19, 2026',
  },
  {
    caseNumber: '791-84013577',
    amazonCaseId: '16890187440',
    seller: 'Cedar Peak Brands',
    disputeName: 'Refund without return',
    amount: 57.9,
    proofReference: 'AMZ-PAID-RWR-7440',
    closeout: 'Paid and reconciled',
    updated: 'Jul 19, 2026',
  },
  {
    caseNumber: '791-92467118',
    amazonCaseId: '16877846329',
    seller: 'Sierra Wellness',
    disputeName: 'FBA fee overcharge',
    amount: 128.36,
    proofReference: 'AMZ-PAID-FEE-6329',
    closeout: 'Paid and reconciled',
    updated: 'Jul 19, 2026',
  },
  {
    caseNumber: '791-10758294',
    amazonCaseId: '16899730551',
    seller: 'Mason Outdoor',
    disputeName: 'Lost inventory adjustment',
    amount: 421.65,
    proofReference: 'AMZ-PAID-LOST-0551',
    closeout: 'Clean settlement match',
    updated: 'Jul 19, 2026',
  },
  {
    caseNumber: '791-23641708',
    amazonCaseId: '16884276690',
    seller: 'Harbor Kids',
    disputeName: 'Customer return not received',
    amount: 73.28,
    proofReference: 'AMZ-PAID-RET-6690',
    closeout: 'Paid and reconciled',
    updated: 'Jul 19, 2026',
  },
  {
    caseNumber: '791-34809512',
    amazonCaseId: '16871960427',
    seller: 'Pioneer Tools',
    disputeName: 'Removal order damage',
    amount: 267.11,
    proofReference: 'AMZ-PAID-REM-0427',
    closeout: 'Paid with variance note',
    updated: 'Jul 19, 2026',
  },
  {
    caseNumber: '791-45970326',
    amazonCaseId: '16900418273',
    seller: 'Orion Baby',
    disputeName: 'Settlement reimbursement gap',
    amount: 144.83,
    proofReference: 'AMZ-PAID-SET-8273',
    closeout: 'Paid and reconciled',
    updated: 'Jul 19, 2026',
  },
  {
    caseNumber: '791-56281044',
    amazonCaseId: '16869453702',
    seller: 'Luma Beauty',
    disputeName: 'Inventory disposal error',
    amount: 219.47,
    proofReference: 'AMZ-PAID-DISP-3702',
    closeout: 'Clean settlement match',
    updated: 'Jul 19, 2026',
  },
];

const formatMoney = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

export default function ApprovedReimbursements() {
  const totalAmount = useMemo(
    () => APPROVED_REIMBURSEMENTS.reduce((sum, item) => sum + item.amount, 0),
    []
  );

  return (
    <PageLayout title="Approved Reimbursements" noPadding>
      <main className="min-h-screen bg-[#F8FAFC] text-[#111827]">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8 lg:py-10">
          <header className="border-b border-[#DDE5EC] pb-8">
            <div className="flex items-center gap-2 text-[12px] font-semibold tracking-tight text-[#0B74DE]">
              <CircleCheck className="h-4 w-4" />
              Approved reimbursements
            </div>
            <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(360px,0.55fr)] lg:items-end">
              <div>
                <h1 className="max-w-3xl text-[36px] font-semibold leading-[0.98] tracking-[-0.05em] text-[#182026] sm:text-[48px] lg:text-[58px]">
                  Cash recovered, matched, and ready to read.
                </h1>
                <p className="mt-4 max-w-2xl text-[15px] leading-7 tracking-tight text-[#66737F] sm:text-[16px]">
                  A clean view of completed reimbursement outcomes from the filing pipeline. Every row is approved, payout-confirmed, and tied to its Amazon case reference.
                </p>
              </div>

              <div className="grid grid-cols-2 border-y border-[#DDE5EC] lg:border-y-0 lg:border-l">
                <div className="py-5 pr-5 lg:pl-8">
                  <div className="text-[12px] font-semibold tracking-tight text-[#66737F]">Approval rate</div>
                  <div className="mt-2 text-[42px] font-semibold leading-none tracking-[-0.055em] text-[#182026]">100%</div>
                </div>
                <div className="border-l border-[#DDE5EC] py-5 pl-5 lg:pl-8">
                  <div className="text-[12px] font-semibold tracking-tight text-[#66737F]">Total amount</div>
                  <div className="mt-2 text-[42px] font-semibold leading-none tracking-[-0.055em] text-[#182026]">
                    {formatMoney(totalAmount)}
                  </div>
                </div>
              </div>
            </div>
          </header>

          <section className="mt-7 overflow-hidden border-y border-[#DDE5EC] bg-white">
            <div className="hidden grid-cols-[minmax(240px,1.1fr)_minmax(160px,0.7fr)_minmax(150px,0.55fr)_minmax(170px,0.7fr)_minmax(120px,0.45fr)] border-b border-[#DDE5EC] text-[11px] font-semibold tracking-tight text-[#7A8994] md:grid">
              <div className="px-5 py-4">Dispute</div>
              <div className="px-5 py-4">Case reference</div>
              <div className="px-5 py-4 text-right">Amount</div>
              <div className="px-5 py-4">Closeout</div>
              <div className="px-5 py-4 text-right">Updated</div>
            </div>

            {APPROVED_REIMBURSEMENTS.map((item) => (
              <article
                key={item.caseNumber}
                className="grid gap-4 border-b border-[#E6ECF1] px-5 py-5 last:border-b-0 md:grid-cols-[minmax(240px,1.1fr)_minmax(160px,0.7fr)_minmax(150px,0.55fr)_minmax(170px,0.7fr)_minmax(120px,0.45fr)] md:items-center md:gap-0"
              >
                <div>
                  <div className="text-[15px] font-semibold leading-5 tracking-tight text-[#182026]">
                    {item.disputeName}
                  </div>
                  <div className="mt-1 text-[12px] font-medium tracking-tight text-[#7A8994]">{item.seller}</div>
                </div>

                <div className="text-[12px] font-semibold leading-5 tracking-tight text-[#4D5B66]">
                  <div>{item.caseNumber}</div>
                  <div className="font-medium text-[#8A98A4]">Amazon {item.amazonCaseId}</div>
                </div>

                <div className="text-[18px] font-semibold tabular-nums tracking-[-0.035em] text-[#182026] md:text-right">
                  {formatMoney(item.amount)}
                </div>

                <div className="text-[12px] font-semibold tracking-tight text-[#4D5B66]">
                  <div>{item.closeout}</div>
                  <div className="mt-1 font-medium text-[#8A98A4]">{item.proofReference}</div>
                </div>

                <div className="text-[12px] font-semibold tracking-tight text-[#7A8994] md:text-right">{item.updated}</div>
              </article>
            ))}
          </section>
        </div>
      </main>
    </PageLayout>
  );
}
