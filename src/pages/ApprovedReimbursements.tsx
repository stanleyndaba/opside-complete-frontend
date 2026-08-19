import React, { useMemo, useState } from 'react';
import { 
  ChevronRight, CircleCheck, Search, TrendingUp, 
  Target, FileCheck, ExternalLink, History, 
  BarChart3, DollarSign, Filter, X, ArrowUpRight
} from 'lucide-react';
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
        {/* Forensic Identity Header */}
        <div className="border-b border-[#E5E7EB] bg-white px-8 py-10">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-px w-6 bg-[#0B74DE]" />
              <span className="text-[10px] font-bold uppercase tracking-tight text-[#0B74DE]">Outcome Registry</span>
            </div>
            
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
              <div className="max-w-3xl">
                <h1 className="mb-4 font-lora text-[42px] font-normal leading-tight tracking-tight text-[#111827]">
                  Approved Reimbursements
                </h1>
                <p className="text-[16px] font-normal leading-relaxed tracking-tight text-[#6B7280]">
                  Every row in this registry represents a confirmed recovery outcome. These are disputes that have passed Amazon's verification, been approved for payout, and reconciled against your bank settlement records.
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-4">
                <Button variant="outline" className="h-10 border-[#E5E7EB] bg-white text-[12px] font-bold uppercase tracking-tight text-[#4B5563] hover:bg-[#F3F5F4]">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Export Ledger
                </Button>
                <Button className="h-10 bg-[#0B74DE] text-white hover:bg-[#005FBA] text-[12px] font-bold uppercase tracking-tight shadow-none">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  View Impact Report
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Outcome Metrics Strip */}
        <div className="border-b border-[#E5E7EB] bg-[#F9FAFB] px-8 py-4">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-12 gap-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ECFDF5] text-[#059669]">
                <Target className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-tight text-[#9CA3AF]">Approval Rate</p>
                <p className="text-[15px] font-bold text-[#111827]">96.2%</p>
              </div>
            </div>
            
            <div className="h-8 w-px bg-[#E5E7EB] hidden md:block" />
            
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EFF6FF] text-[#0B74DE]">
                <DollarSign className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-tight text-[#9CA3AF]">Total Reimbursed</p>
                <p className="text-[15px] font-bold text-[#111827]">{formatMoney(DISPLAY_TOTAL_AMOUNT)}</p>
              </div>
            </div>

            <div className="h-8 w-px bg-[#E5E7EB] hidden md:block" />

            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#F3F4F6] text-[#4B5563]">
                <FileCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-tight text-[#9CA3AF]">Registry Entries</p>
                <p className="text-[15px] font-bold text-[#111827]">{APPROVED_REIMBURSEMENTS.length} Resolved</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="mx-auto max-w-7xl px-8 py-12">
          {/* Synthesis / Search Bar */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
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
                <div className="flex items-center gap-2 px-3 py-1.5 text-[12px] font-semibold text-[#4B5563]">
                  <Filter className="h-3.5 w-3.5" />
                  <span>Filter</span>
                </div>
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
          <div className="rounded-xl border border-[#E5E7EB] bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-[#F3F5F4] bg-[#F9FAFB]">
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-tight text-[#9CA3AF]">Dispute Artifact</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-tight text-[#9CA3AF]">Registry Ref</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-tight text-[#9CA3AF]">Amazon Context</th>
                    <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-tight text-[#9CA3AF]">Value</th>
                    <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-tight text-[#9CA3AF]">Resolution State</th>
                    <th className="px-6 py-4 text-right text-[11px] font-bold uppercase tracking-tight text-[#9CA3AF]">Outcome Date</th>
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
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#F3F5F4] text-[#4B5563] group-hover:bg-white group-hover:shadow-sm transition-all">
                            <FileCheck className="h-4.5 w-4.5" strokeWidth={1.5} />
                          </div>
                          <div>
                            <p className="text-[14px] font-semibold tracking-tight text-[#111827]">{item.disputeName}</p>
                            <p className="text-[12px] font-medium text-[#9CA3AF]">{item.seller}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="font-mono text-[12px] font-medium text-[#4B5563]">{item.caseNumber}</span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <span className="text-[12px] font-semibold text-[#111827]">{item.amazonCaseId}</span>
                          <ExternalLink className="h-3 w-3 text-[#9CA3AF] opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className="text-[15px] font-bold tabular-nums tracking-tight text-[#111827]">
                          {formatMoney(item.amount)}
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            item.closeout.includes('reconciled') ? "bg-emerald-500" : 
                            item.closeout.includes('match') ? "bg-blue-500" : "bg-amber-500"
                          )} />
                          <span className="text-[12px] font-semibold text-[#4B5563]">{item.closeout}</span>
                        </div>
                        <p className="mt-0.5 text-[10px] font-medium text-[#9CA3AF]">{item.proofReference}</p>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <span className="text-[12px] font-semibold text-[#6B7280]">{item.updated}</span>
                      </td>
                      <td className="px-6 py-5">
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
          
          <div className="mt-8 flex items-center justify-between border-t border-[#E5E7EB] pt-8">
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
          <SheetContent className="w-full sm:max-w-[540px] border-l border-[#E5E7EB] bg-white p-0 shadow-2xl">
            {selectedItem && (
              <div className="flex h-full flex-col">
                <SheetHeader className="border-b border-[#F3F5F4] p-8">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <div className="h-px w-4 bg-[#059669]" />
                      <span className="text-[10px] font-bold uppercase tracking-tight text-[#059669]">Resolution Artifact</span>
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
                  
                  <SheetTitle className="font-lora text-[28px] font-normal leading-tight tracking-tight text-[#111827] mb-2">
                    {selectedItem.disputeName}
                  </SheetTitle>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="outline" className="bg-[#F3F5F4] border-transparent text-[#6B7280] font-bold text-[10px] uppercase tracking-tight px-2 py-0.5">
                      {selectedItem.caseNumber}
                    </Badge>
                    <Badge variant="outline" className="bg-emerald-50 border-transparent text-emerald-700 font-bold text-[10px] uppercase tracking-tight px-2 py-0.5">
                      {selectedItem.closeout}
                    </Badge>
                  </div>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto p-8">
                  <div className="space-y-10">
                    {/* Financial Outcome */}
                    <div>
                      <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF] mb-4">Financial Outcome</h3>
                      <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-6">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[13px] font-medium text-[#6B7280]">Reimbursed Amount</span>
                          <span className="text-[24px] font-bold text-[#111827]">{formatMoney(selectedItem.amount)}</span>
                        </div>
                        <div className="h-px bg-[#E5E7EB] mb-4" />
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-tight text-[#9CA3AF]">Settlement ID</p>
                            <p className="mt-1 text-[13px] font-semibold text-[#111827]">{selectedItem.settlementId || 'Pending'}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-tight text-[#9CA3AF]">Proof Ref</p>
                            <p className="mt-1 text-[13px] font-semibold text-[#111827]">{selectedItem.proofReference}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Reimbursement Trail */}
                    <div>
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-[11px] font-bold uppercase tracking-widest text-[#9CA3AF]">Reimbursement Trail</h3>
                        <span className="text-[10px] font-bold text-[#0B74DE] uppercase tracking-tight">Verified Chain</span>
                      </div>
                      
                      <div className="relative space-y-8 pl-6">
                        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-[#E5E7EB]" />
                        
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
                            <div className="mt-2 flex items-center gap-2 text-[11px] font-semibold text-[#0B74DE]">
                              <span>Amazon Case: {selectedItem.amazonCaseId}</span>
                              <ArrowUpRight className="h-3 w-3" />
                            </div>
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
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#F3F5F4] bg-[#F9FAFB] p-8">
                  <div className="flex items-center gap-4">
                    <Button className="flex-1 bg-[#111827] text-white hover:bg-[#1F2937] text-[12px] font-bold uppercase tracking-tight h-11 rounded-lg shadow-none">
                      Download Proof Pack
                    </Button>
                    <Button variant="outline" className="flex-1 border-[#E5E7EB] bg-white text-[#4B5563] hover:bg-[#F3F5F4] text-[12px] font-bold uppercase tracking-tight h-11 rounded-lg">
                      View Original Case
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
