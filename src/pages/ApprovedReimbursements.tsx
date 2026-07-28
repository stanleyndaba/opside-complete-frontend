import React, { useMemo, useState } from 'react';
import { ChevronRight, CircleCheck, Search } from 'lucide-react';
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
    caseNumber: 'REC-2034-XFER',
    amazonCaseId: '16874192034',
    seller: 'Northstar Home Goods',
    disputeName: 'Inbound shipment shortage',
    amount: 184.72,
    proofReference: 'AMZ-PAID-XFER-2034',
    closeout: 'Paid and reconciled',
    updated: 'Jul 19, 2026',
  },
  {
    caseNumber: 'REC-9051-INB',
    amazonCaseId: '16912090511',
    seller: 'Northstar Home Goods',
    disputeName: 'Inbound shipment shortage',
    amount: 569.5,
    proofReference: 'AMZ-PAID-INB-90511',
    closeout: 'Paid and reconciled',
    updated: 'Jul 18, 2026',
  },
  {
    caseNumber: 'REC-7162-XFER',
    amazonCaseId: '16882957162',
    seller: 'Blue Ridge Supply',
    disputeName: 'Warehouse transfer loss',
    amount: 312.18,
    proofReference: 'AMZ-PAID-INB-7162',
    closeout: 'Clean settlement match',
    updated: 'Jul 19, 2026',
  },
  {
    caseNumber: 'REC-3418-DMG',
    amazonCaseId: '16865503418',
    seller: 'Atlas Pet Co',
    disputeName: 'Damaged FBA inventory',
    amount: 96.44,
    proofReference: 'AMZ-PAID-DMG-3418',
    closeout: 'Paid with variance note',
    updated: 'Jul 19, 2026',
  },
  {
    caseNumber: 'REC-7440-RWR',
    amazonCaseId: '16890187440',
    seller: 'Cedar Peak Brands',
    disputeName: 'Refund without return',
    amount: 57.9,
    proofReference: 'AMZ-PAID-RWR-7440',
    closeout: 'Paid and reconciled',
    updated: 'Jul 19, 2026',
  },
  {
    caseNumber: 'REC-6329-FEE',
    amazonCaseId: '16877846329',
    seller: 'Sierra Wellness',
    disputeName: 'FBA fee overcharge',
    amount: 128.36,
    proofReference: 'AMZ-PAID-FEE-6329',
    closeout: 'Paid and reconciled',
    updated: 'Jul 19, 2026',
  },
  {
    caseNumber: 'REC-0551-LOST',
    amazonCaseId: '16899730551',
    seller: 'Mason Outdoor',
    disputeName: 'Lost inventory adjustment',
    amount: 421.65,
    proofReference: 'AMZ-PAID-LOST-0551',
    closeout: 'Clean settlement match',
    updated: 'Jul 19, 2026',
  },
  {
    caseNumber: 'REC-6690-RET',
    amazonCaseId: '16884276690',
    seller: 'Harbor Kids',
    disputeName: 'Customer return not received',
    amount: 73.28,
    proofReference: 'AMZ-PAID-RET-6690',
    closeout: 'Paid and reconciled',
    updated: 'Jul 19, 2026',
  },
  {
    caseNumber: 'REC-0427-REM',
    amazonCaseId: '16871960427',
    seller: 'Pioneer Tools',
    disputeName: 'Removal order damage',
    amount: 267.11,
    proofReference: 'AMZ-PAID-REM-0427',
    closeout: 'Paid with variance note',
    updated: 'Jul 19, 2026',
  },
  {
    caseNumber: 'REC-8273-SET',
    amazonCaseId: '16900418273',
    seller: 'Orion Baby',
    disputeName: 'Settlement reimbursement gap',
    amount: 144.83,
    proofReference: 'AMZ-PAID-SET-8273',
    closeout: 'Paid and reconciled',
    updated: 'Jul 19, 2026',
  },
  {
    caseNumber: 'REC-3702-DISP',
    amazonCaseId: '16869453702',
    seller: 'Luma Beauty',
    disputeName: 'Inventory disposal error',
    amount: 219.47,
    proofReference: 'AMZ-PAID-DISP-3702',
    closeout: 'Clean settlement match',
    updated: 'Jul 19, 2026',
  },
];

const DISPLAY_TOTAL_AMOUNT = 24631.44;

const formatMoney = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const closeoutFilters = ['All closeouts', 'Paid and reconciled', 'Clean settlement match', 'Paid with variance note'];

export default function ApprovedReimbursements() {
  const [query, setQuery] = useState('');
  const [closeoutFilter, setCloseoutFilter] = useState(closeoutFilters[0]);

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return APPROVED_REIMBURSEMENTS.filter((item) => {
      const matchesCloseout = closeoutFilter === closeoutFilters[0] || item.closeout === closeoutFilter;

      if (!normalizedQuery) return matchesCloseout;

      const searchable = [
        item.caseNumber,
        item.amazonCaseId,
        item.seller,
        item.disputeName,
        item.proofReference,
        item.closeout,
        formatMoney(item.amount),
      ].join(' ').toLowerCase();

      return matchesCloseout && searchable.includes(normalizedQuery);
    });
  }, [closeoutFilter, query]);

  return (
    <PageLayout title="Approved Reimbursements" noPadding>
      <main className="min-h-screen bg-[#FAFAF7] text-[#111827]">
        <div className="mx-auto max-w-[1280px] px-5 py-8 sm:px-6 lg:px-8 lg:py-10">
          <header className="border-b border-[#D8E3E8] pb-7">
            <div className="flex items-center gap-2 text-[12px] font-semibold tracking-tight text-[#365B7D]">
              <CircleCheck className="h-4 w-4 text-[#047857]" />
              Approved reimbursements
            </div>
            <div className="mt-5 grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(440px,0.48fr)] lg:items-end">
              <div>
                <h1 className="max-w-3xl text-[34px] font-semibold leading-[0.98] tracking-tight text-[#111827] sm:text-[46px] lg:text-[58px]">
                  Reimbursed Disputes
                </h1>
                <p className="mt-4 max-w-3xl text-[15px] leading-7 tracking-tight text-[#546575] sm:text-[16px]">
                  Completed reimbursement outcomes from the filing pipeline. Every row is approved, payout-confirmed, reconciled, and tied back to an Amazon case reference.
                </p>
              </div>

              <div className="grid min-w-0 grid-cols-[0.82fr_1.18fr] border-y border-[#D8E3E8] bg-white lg:border-y-0 lg:border-l">
                <div className="min-w-0 py-4 pr-4 lg:pl-7">
                  <div className="text-[12px] font-semibold tracking-tight text-[#6B7C88]">Approval rate</div>
                  <div className="mt-2 text-[34px] font-semibold leading-none tracking-tight text-[#111827] xl:text-[37px]">96.2%</div>
                </div>
                <div className="min-w-0 border-l border-[#D8E3E8] py-4 pl-4 lg:pl-7">
                  <div className="text-[12px] font-semibold tracking-tight text-[#6B7C88]">Total amount</div>
                  <div className="mt-2 whitespace-nowrap text-[34px] font-semibold leading-none tracking-tight text-[#111827] xl:text-[37px]">
                    {formatMoney(DISPLAY_TOTAL_AMOUNT)}
                  </div>
                </div>
              </div>
            </div>
          </header>

          <div className="mt-5 flex flex-col gap-3 border-b border-[#D8E3E8] pb-5 md:flex-row md:items-center md:justify-between">
            <label className="relative block w-full md:max-w-[520px]">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A98A4]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search dispute, seller, case ID, amount..."
                className="h-10 w-full rounded-[2px] border border-[#D8E3E8] bg-white pl-10 pr-4 text-[14px] font-medium tracking-tight text-[#111827] outline-none transition focus:border-[#8FA0AD] focus:ring-4 focus:ring-[#D8E3E8]/55"
              />
            </label>
            <select
              value={closeoutFilter}
              onChange={(event) => setCloseoutFilter(event.target.value)}
              className="h-10 rounded-[2px] border border-[#D8E3E8] bg-white px-3 text-[13px] font-semibold tracking-tight text-[#4B5563] outline-none transition focus:border-[#8FA0AD] focus:ring-4 focus:ring-[#D8E3E8]/55"
            >
              {closeoutFilters.map((filter) => (
                <option key={filter} value={filter}>{filter}</option>
              ))}
            </select>
          </div>

          <section className="mt-5 overflow-x-auto rounded-[2px] border-y border-[#D8E3E8] bg-white">
            <table className="w-full min-w-[1040px] border-collapse">
              <thead>
                <tr className="border-b border-[#D8E3E8] bg-[#F8FAFB] text-left">
                  <th className="px-5 py-3 text-[11px] font-semibold tracking-tight text-[#7B8A97]">Dispute Type</th>
                  <th className="px-5 py-3 text-[11px] font-semibold tracking-tight text-[#7B8A97]">Case Reference</th>
                  <th className="px-5 py-3 text-[11px] font-semibold tracking-tight text-[#7B8A97]">Amazon Case ID</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold tracking-tight text-[#7B8A97]">Amount</th>
                  <th className="px-5 py-3 text-[11px] font-semibold tracking-tight text-[#7B8A97]">Status / Closeout</th>
                  <th className="px-5 py-3 text-right text-[11px] font-semibold tracking-tight text-[#7B8A97]">Updated</th>
                  <th className="w-10 px-3 py-3" />
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((item) => (
                  <tr
                    key={item.caseNumber}
                    className="group border-b border-[#E6ECF1] transition-colors last:border-b-0 hover:bg-[#F8FAFB]"
                  >
                    <td className="px-5 py-3.5 align-middle">
                      <div className="text-[14px] font-semibold leading-5 tracking-tight text-[#111827]">{item.disputeName}</div>
                      <div className="mt-0.5 text-[12px] font-medium tracking-tight text-[#7B8A97]">{item.seller}</div>
                    </td>
                    <td className="px-5 py-3.5 align-middle text-[12px] font-semibold tracking-tight text-[#4B5563]">
                      {item.caseNumber}
                    </td>
                    <td className="px-5 py-3.5 align-middle text-[12px] font-medium tracking-tight text-[#6B7C88]">
                      {item.amazonCaseId}
                    </td>
                    <td className="px-5 py-3.5 text-right align-middle text-[15px] font-semibold tabular-nums tracking-tight text-[#111827]">
                      {formatMoney(item.amount)}
                    </td>
                    <td className="px-5 py-3.5 align-middle">
                      <div className="text-[12px] font-semibold tracking-tight text-[#4B5563]">{item.closeout}</div>
                      <div className="mt-0.5 text-[11px] font-medium tracking-tight text-[#8A98A4]">{item.proofReference}</div>
                    </td>
                    <td className="px-5 py-3.5 text-right align-middle text-[12px] font-semibold tracking-tight text-[#6B7C88]">
                      {item.updated}
                    </td>
                    <td className="px-3 py-3.5 align-middle">
                      <ChevronRight className="h-4 w-4 text-[#B0BBC5] transition group-hover:translate-x-0.5 group-hover:text-[#4B5563]" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredRows.length === 0 ? (
              <div className="px-5 py-10 text-center text-[13px] font-semibold tracking-tight text-[#6B7C88]">
                No approved reimbursements match this search.
              </div>
            ) : null}
          </section>
        </div>
      </main>
    </PageLayout>
  );
}
