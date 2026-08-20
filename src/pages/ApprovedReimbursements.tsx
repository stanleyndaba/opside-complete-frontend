import React, { useMemo, useState } from 'react';
import { ChevronRight, Search, X } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

type ApprovedReimbursement = {
  caseNumber: string;
  amazonCaseId: string;
  seller: string;
  disputeName: string;
  amount: number;
  proofReference: string;
  closeout: string;
  updated: string;
  settlementId?: string;
  filingDate?: string;
  approvalDate?: string;
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
    settlementId: 'SET-99201-AMZ',
    filingDate: 'Jul 10, 2026',
    approvalDate: 'Jul 15, 2026'
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
    settlementId: 'SET-99182-AMZ',
    filingDate: 'Jul 08, 2026',
    approvalDate: 'Jul 14, 2026'
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
    settlementId: 'SET-99205-AMZ',
    filingDate: 'Jul 12, 2026',
    approvalDate: 'Jul 17, 2026'
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
    settlementId: 'SET-99198-AMZ',
    filingDate: 'Jul 11, 2026',
    approvalDate: 'Jul 16, 2026'
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
    settlementId: 'SET-99202-AMZ',
    filingDate: 'Jul 13, 2026',
    approvalDate: 'Jul 18, 2026'
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
    settlementId: 'SET-99195-AMZ',
    filingDate: 'Jul 09, 2026',
    approvalDate: 'Jul 14, 2026'
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
    settlementId: 'SET-99208-AMZ',
    filingDate: 'Jul 14, 2026',
    approvalDate: 'Jul 18, 2026'
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
    settlementId: 'SET-99199-AMZ',
    filingDate: 'Jul 11, 2026',
    approvalDate: 'Jul 16, 2026'
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
    settlementId: 'SET-99192-AMZ',
    filingDate: 'Jul 07, 2026',
    approvalDate: 'Jul 13, 2026'
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
    settlementId: 'SET-99210-AMZ',
    filingDate: 'Jul 15, 2026',
    approvalDate: 'Jul 19, 2026'
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
    settlementId: 'SET-99188-AMZ',
    filingDate: 'Jul 06, 2026',
    approvalDate: 'Jul 12, 2026'
  },
];

const DISPLAY_TOTAL_AMOUNT = 24631.44;

const formatMoney = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);

const closeoutFilters = ['All closeouts', 'Paid and reconciled', 'Clean settlement match', 'Paid with variance note'];

export default function ApprovedReimbursements() {
  const [query, setQuery] = useState('');
  const [closeoutFilter, setCloseoutFilter] = useState(closeoutFilters[0]);
  const [selectedItem, setSelectedItem] = useState<ApprovedReimbursement | null>(null);

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

      return searchable.includes(normalizedQuery) && matchesCloseout;
    });
  }, [closeoutFilter, query]);

  return (
    <PageLayout title="Approved Reimbursements" noPadding>
      <div className="min-h-screen bg-[#FAFAF7] font-sans text-[#111827]">
        {/* Ledger header */}
        <div className="border-b border-[#DCE8EE] bg-white px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-[1280px] flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-center gap-2">
                <div className="h-px w-4 bg-[#0B74DE]" />
                <span className="text-[12px] font-medium tracking-tight text-[#66737F]">Outcome ledger</span>
              </div>
              <h1 className="mt-3 font-lora text-[34px] font-normal leading-tight tracking-tight text-[#182026]">Approved reimbursements</h1>
              <p className="mt-2 text-[14px] leading-6 tracking-tight text-[#66737F]">Confirmed recovery outcomes that Amazon approved for payout and Margin reconciled against the recorded settlement trail.</p>
            </div>
            <Button className="h-10 rounded-md bg-[#0B74DE] px-4 text-[13px] font-medium tracking-tight text-white shadow-none hover:bg-[#075EAF]">View impact report</Button>
          </div>
        </div>

        {/* Outcome metrics */}
        <div className="border-b border-[#DCE8EE] bg-white px-4 py-3 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-[1280px] grid-cols-1 divide-y divide-[#E7EEF2] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="py-2.5 sm:pr-7">
              <p className="text-[12px] font-medium tracking-tight text-[#66737F]">Approval rate</p>
              <p className="mt-1 text-[18px] font-semibold tabular-nums tracking-tight text-[#182026]">96.2%</p>
              <p className="mt-0.5 text-[11px] leading-4 text-[#66737F]">Recorded approval rate across resolved reimbursement outcomes.</p>
            </div>
            <div className="py-2.5 sm:px-7">
              <p className="text-[12px] font-medium tracking-tight text-[#66737F]">Total reimbursed</p>
              <p className="mt-1 text-[18px] font-semibold tabular-nums tracking-tight text-[#182026]">{formatMoney(DISPLAY_TOTAL_AMOUNT)}</p>
              <p className="mt-0.5 text-[11px] leading-4 text-[#66737F]">Settlement value confirmed in this outcome registry.</p>
            </div>
            <div className="py-2.5 sm:pl-7">
              <p className="text-[12px] font-medium tracking-tight text-[#66737F]">Registry entries</p>
              <p className="mt-1 text-[18px] font-semibold tabular-nums tracking-tight text-[#182026]">{APPROVED_REIMBURSEMENTS.length} resolved</p>
              <p className="mt-0.5 text-[11px] leading-4 text-[#66737F]">Each entry has a recorded closeout and proof reference.</p>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8">
          {/* Synthesis / Search Bar */}
          <div className="mb-5 flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Query outcomes by case ID, seller, or amount..."
                className="h-12 w-full rounded-xl border border-[#E5E7EB] bg-white pl-11 pr-20 text-[14px] font-normal tracking-tight text-[#111827] outline-none transition focus:border-[#0B74DE] focus:ring-4 focus:ring-[#0B74DE]/5 shadow-sm"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 rounded-md bg-[#F3F5F4] px-2 py-1 text-[10px] font-bold text-[#9CA3AF]">
                ⌘ K
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white p-1 shadow-sm">
                <div className="px-3 py-1.5 text-[12px] font-medium tracking-tight text-[#4D5B66]">Closeout</div>
                <div className="h-4 w-px bg-[#E5E7EB]" />
                <select
                  value={closeoutFilter}
                  onChange={(e) => setCloseoutFilter(e.target.value)}
                  className="bg-transparent px-3 py-1.5 text-[12px] font-semibold text-[#111827] outline-none"
                >
                  {closeoutFilters.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Outcome Ledger Table */}
          <div className="overflow-hidden rounded-md border border-[#DCE8EE] bg-white shadow-[0_1px_2px_rgba(24,32,38,0.03)]">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#F3F5F4] bg-[#F9FAFB]">
                    <th className="px-5 py-3 text-[12px] font-medium tracking-tight text-[#66737F]">Recovery outcome</th>
                    <th className="px-5 py-3 text-[12px] font-medium tracking-tight text-[#66737F]">Registry reference</th>
                    <th className="px-5 py-3 text-[12px] font-medium tracking-tight text-[#66737F]">Amazon case</th>
                    <th className="px-5 py-3 text-right text-[12px] font-medium tracking-tight text-[#66737F]">Reimbursed</th>
                    <th className="px-5 py-3 text-[12px] font-medium tracking-tight text-[#66737F]">Closeout</th>
                    <th className="px-5 py-3 text-right text-[12px] font-medium tracking-tight text-[#66737F]">Recorded</th>
                    <th className="w-12 px-6 py-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F5F4]">
                  {filteredRows.map((item) => (
                    <tr 
                      key={item.caseNumber}
                      onClick={() => setSelectedItem(item)}
                      className="group cursor-pointer transition-colors hover:bg-[#F3F5F4]/50"
                    >
                      <td className="px-5 py-4">
                        <div>
                          <p className="text-[14px] font-medium tracking-tight text-[#182026]">{item.disputeName}</p>
                          <p className="mt-1 text-[12px] text-[#66737F]">{item.seller}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="font-mono text-[12px] font-medium text-[#4B5563]">{item.caseNumber}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-[12px] font-medium text-[#182026]">{item.amazonCaseId}</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="text-[15px] font-bold tabular-nums tracking-tight text-[#111827]">
                          {formatMoney(item.amount)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="border-l-2 border-[#B7C6D0] pl-2.5">
                          <p className="text-[12px] font-medium text-[#182026]">{item.closeout}</p>
                          <p className="mt-1 text-[10px] font-medium tracking-tight text-[#66737F]">{item.proofReference}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="text-[12px] font-semibold text-[#6B7280]">{item.updated}</span>
                      </td>
                      <td className="px-5 py-4">
                        <ChevronRight className="h-4 w-4 text-[#E5E7EB] group-hover:text-[#111827] group-hover:translate-x-0.5 transition-all" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {filteredRows.length === 0 && (
                <div className="py-20 text-center">
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#F3F5F4] text-[#9CA3AF]">
                    <Search className="h-6 w-6" />
                  </div>
                  <h3 className="text-[15px] font-bold text-[#111827]">No outcomes found</h3>
                  <p className="mt-1 text-[13px] text-[#6B7280]">Adjust your search or filter to find specific records.</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-6 flex items-center justify-between border-t border-[#DCE8EE] pt-5">
            <p className="text-[12px] font-medium text-[#9CA3AF]">
              Showing {filteredRows.length} of {APPROVED_REIMBURSEMENTS.length} registry entries
            </p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" disabled className="text-[12px] font-bold text-[#9CA3AF]">Previous</Button>
              <Button variant="ghost" size="sm" disabled className="text-[12px] font-bold text-[#9CA3AF]">Next</Button>
            </div>
          </div>
        </div>

        {/* Resolution Side-Sheet */}
        <Sheet open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
          <SheetContent className="w-full border-l border-[#DCE8EE] bg-white p-0 shadow-[0_18px_45px_rgba(24,32,38,0.16)] sm:max-w-[560px]">
            {selectedItem && (
              <div className="flex h-full flex-col">
                <SheetHeader className="border-b border-[#DCE8EE] p-4 sm:p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-px w-4 bg-[#0B74DE]" />
                      <span className="text-[12px] font-medium tracking-tight text-[#66737F]">Resolution record</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setSelectedItem(null)}
                      className="h-8 w-8 rounded-full hover:bg-[#F3F5F4]"
                    >
                      <X className="h-4 w-4 text-[#9CA3AF]" />
                    </Button>
                  </div>
                  
                  <SheetTitle className="mb-2 font-lora text-[27px] font-normal leading-tight tracking-tight text-[#182026]">
                    {selectedItem.disputeName}
                  </SheetTitle>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="outline" className="border-[#DCE8EE] bg-[#F7FAFC] px-2 py-0.5 text-[11px] font-medium tracking-tight text-[#4D5B66]">
                      {selectedItem.caseNumber}
                    </Badge>
                    <Badge variant="outline" className="border-[#DCE8EE] bg-[#F7FAFC] px-2 py-0.5 text-[11px] font-medium tracking-tight text-[#4D5B66]">
                      {selectedItem.closeout}
                    </Badge>
                  </div>
                </SheetHeader>

                <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
                  <div className="space-y-6 pb-3">
                    {/* Financial Outcome */}
                    <section>
                      <div className="flex items-baseline justify-between gap-4">
                        <h3 className="font-lora text-[19px] font-normal tracking-tight text-[#182026]">Financial outcome</h3>
                        <p className="text-[11px] font-medium text-[#66737F]">Settlement confirmed</p>
                      </div>
                      <div className="mt-3 divide-y divide-[#E7EEF2] rounded-md border border-[#DCE8EE] bg-white sm:grid sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                        <div className="p-3 sm:col-span-1">
                          <p className="text-[12px] font-medium tracking-tight text-[#66737F]">Reimbursed amount</p>
                          <p className="mt-1 text-[20px] font-semibold tabular-nums tracking-tight text-[#182026]">{formatMoney(selectedItem.amount)}</p>
                        </div>
                        <div className="p-3">
                          <p className="text-[12px] font-medium tracking-tight text-[#66737F]">Settlement ID</p>
                          <p className="mt-1 break-words text-[13px] font-medium text-[#182026]">{selectedItem.settlementId || 'Pending'}</p>
                        </div>
                        <div className="p-3">
                          <p className="text-[12px] font-medium tracking-tight text-[#66737F]">Proof reference</p>
                          <p className="mt-1 break-words text-[13px] font-medium text-[#182026]">{selectedItem.proofReference}</p>
                        </div>
                      </div>
                    </section>

                    {/* Reimbursement Trail */}
                    <section className="border-t border-[#E7EEF2] pt-5">
                      <div className="flex items-baseline justify-between gap-4">
                        <h3 className="font-lora text-[19px] font-normal tracking-tight text-[#182026]">Reimbursement trail</h3>
                        <span className="text-[11px] font-medium text-[#66737F]">Verified chain</span>
                      </div>
                      
                      <div className="relative mt-4 space-y-5 pl-6">
                        <div className="absolute bottom-2 left-[6px] top-2 w-px bg-[#DCE8EE]" />
                        
                        {/* Step 1 */}
                        <div className="relative">
                          <div className="absolute -left-[23px] top-1 h-3 w-3 rounded-full border-2 border-white bg-[#0B74DE]" />
                          <div>
                            <p className="text-[13px] font-bold text-[#111827]">Discrepancy Detected</p>
                            <p className="mt-1 text-[12px] text-[#6B7280]">Margin identified a gap in {selectedItem.disputeName.toLowerCase()}.</p>
                          </div>
                        </div>
                        
                        {/* Step 2 */}
                        <div className="relative">
                          <div className="absolute -left-[23px] top-1 h-3 w-3 rounded-full border-2 border-white bg-[#0B74DE]" />
                          <div>
                            <p className="text-[13px] font-bold text-[#111827]">Case Filed</p>
                            <p className="mt-1 text-[12px] text-[#6B7280]">Submitted to Amazon Support on {selectedItem.filingDate || 'prior date'}.</p>
                            <p className="mt-2 text-[11px] font-medium text-[#0B74DE]">Amazon case: {selectedItem.amazonCaseId}</p>
                          </div>
                        </div>
                        
                        {/* Step 3 */}
                        <div className="relative">
                          <div className="absolute -left-[23px] top-1 h-3 w-3 rounded-full border-2 border-white bg-[#0B74DE]" />
                          <div>
                            <p className="text-[13px] font-bold text-[#111827]">Amazon Approved</p>
                            <p className="mt-1 text-[12px] text-[#6B7280]">Reimbursement approved on {selectedItem.approvalDate || 'resolution date'}.</p>
                          </div>
                        </div>
                        
                        {/* Step 4 */}
                        <div className="relative">
                          <div className="absolute -left-[23px] top-1 h-3 w-3 rounded-full border-2 border-white bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.1)]" />
                          <div>
                            <p className="text-[13px] font-bold text-[#111827]">Payout Reconciled</p>
                            <p className="mt-1 text-[12px] text-[#6B7280]">Confirmed in bank settlement on {selectedItem.updated}.</p>
                          </div>
                        </div>
                      </div>
                    </section>
                  </div>
                </div>

                <div className="shrink-0 border-t border-[#DCE8EE] bg-[#FAFAF7] p-4 sm:p-5">
                  <div className="flex gap-3">
                    <Button className="h-10 flex-1 rounded-md bg-[#0B74DE] text-[13px] font-medium tracking-tight text-white shadow-none hover:bg-[#075EAF]">
                      Download proof pack
                    </Button>
                    <Button variant="outline" className="h-10 flex-1 rounded-md border-[#DCE8EE] bg-white text-[13px] font-medium tracking-tight text-[#4D5B66] hover:bg-[#F7FAFC]">
                      View original case
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </SheetContent>
        </Sheet>
      </div>
    </PageLayout>
  );
}
