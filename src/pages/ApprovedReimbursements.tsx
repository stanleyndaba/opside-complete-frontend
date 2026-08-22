import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Search, X } from 'lucide-react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useParams } from 'react-router-dom';
import { useTenant } from '@/contexts/TenantContext';
import { api } from '@/lib/api';

type ApprovedReimbursement = {
  caseNumber: string;
  amazonCaseId: string;
  seller: string;
  disputeName: string;
  amount: number;
  currency: string;
  proofReference: string;
  closeout: string;
  updated: string | null;
  settlementId: string | null;
  filingDate: string | null;
  approvalDate: string | null;
};

type RecoveryLedgerRow = {
  linked_dispute_case_id?: string | null;
  dispute_case_id?: string | null;
  detection_result_id?: string | null;
  case_number?: string | null;
  provider_case_id?: string | null;
  merchant_reference?: string | null;
  case_type?: string | null;
  anomaly_type?: string | null;
  store_name?: string | null;
  currency?: string | null;
  has_approval_truth?: boolean | null;
  last_updated_at?: string | null;
  submission_proof?: { submitted_at?: string | null } | null;
};

type FinancialSummary = {
  input_id: string;
  dispute_case_id: string | null;
  detection_result_id: string | null;
  verified_paid_amount: number;
  variance_amount: number | null;
  payout_status: 'not_paid' | 'partially_paid' | 'paid';
  proof_of_payment: {
    amount: number;
    currency: string;
    event_date: string | null;
    reference_id: string | null;
    settlement_id: string | null;
    payout_batch_id: string | null;
    source: string | null;
  } | null;
};


const formatMoney = (value: number, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(value);

const formatDate = (value: string | null | undefined) => {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Not available'
    : new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
};

const closeoutFilters = ['All closeouts', 'Paid and reconciled', 'Clean settlement match', 'Paid with variance note'];

export default function ApprovedReimbursements() {
  const { tenantSlug } = useParams<{ tenantSlug?: string }>();
  const { tenant, isReady } = useTenant();
  const activeSlug = tenantSlug || tenant?.slug || '';
  const [query, setQuery] = useState('');
  const [closeoutFilter, setCloseoutFilter] = useState(closeoutFilters[0]);
  const [selectedItem, setSelectedItem] = useState<ApprovedReimbursement | null>(null);
  const [records, setRecords] = useState<ApprovedReimbursement[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady || !activeSlug) return;
    let cancelled = false;

    const loadVerifiedOutcomes = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const ledgerResponse = await api.getRecoveriesLedger({ page: 1, page_size: 500, sort_by: 'last_updated_at', sort_dir: 'desc' }, activeSlug);
        if (!ledgerResponse.ok || !ledgerResponse.data?.success) {
          throw new Error(ledgerResponse.error || 'Unable to load recovery outcomes.');
        }

        const ledgerRows = (ledgerResponse.data.rows || []) as RecoveryLedgerRow[];
        const caseIds = Array.from(new Set(ledgerRows
          .map((row) => row.linked_dispute_case_id || row.dispute_case_id || row.detection_result_id)
          .filter((value): value is string => Boolean(value))));
        if (!caseIds.length) {
          if (!cancelled) setRecords([]);
          return;
        }

        const financialResponse = await api.getRecoveryFinancialEvents({ caseIds }, activeSlug);
        if (!financialResponse.ok || !financialResponse.data?.success) {
          throw new Error(financialResponse.error || 'Unable to load payout proof.');
        }

        const summaries = financialResponse.data.summaries as FinancialSummary[];
        const summaryByKey = new Map<string, FinancialSummary>();
        for (const summary of summaries) {
          for (const key of [summary.input_id, summary.dispute_case_id, summary.detection_result_id]) {
            if (key) summaryByKey.set(key, summary);
          }
        }

        const nextRecords = ledgerRows.flatMap((row): ApprovedReimbursement[] => {
          const caseId = row.linked_dispute_case_id || row.dispute_case_id || row.detection_result_id || null;
          const financial = caseId ? summaryByKey.get(caseId) : null;
          const proof = financial?.proof_of_payment || null;
          if (
            row.has_approval_truth !== true ||
            !financial ||
            financial.payout_status !== 'paid' ||
            financial.verified_paid_amount <= 0 ||
            !proof
          ) {
            return [];
          }

          const hasVariance = Math.abs(financial.variance_amount || 0) > 0.01;
          return [{
            caseNumber: row.case_number || 'Case reference unavailable',
            amazonCaseId: row.provider_case_id || row.merchant_reference || 'Amazon reference unavailable',
            seller: row.store_name || 'Store unavailable',
            disputeName: row.case_type || row.anomaly_type || 'Recovery outcome',
            amount: financial.verified_paid_amount,
            currency: proof.currency || row.currency || 'USD',
            proofReference: proof.settlement_id || proof.payout_batch_id || proof.reference_id || 'Financial event recorded',
            closeout: hasVariance ? 'Paid with variance note' : (proof.settlement_id || proof.payout_batch_id ? 'Clean settlement match' : 'Paid and reconciled'),
            updated: proof.event_date || row.last_updated_at || null,
            settlementId: proof.settlement_id || proof.payout_batch_id || null,
            filingDate: row.submission_proof?.submitted_at || null,
            approvalDate: row.last_updated_at || null,
          }];
        });

        if (!cancelled) setRecords(nextRecords);
      } catch (error: any) {
        if (!cancelled) {
          setRecords([]);
          setLoadError(error?.message || 'Unable to load verified reimbursement outcomes.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadVerifiedOutcomes();
    return () => { cancelled = true; };
  }, [activeSlug, isReady]);

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return records.filter((item) => {
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
  }, [closeoutFilter, query, records]);

  const totalByCurrency = useMemo(() => records.reduce<Record<string, number>>((totals, item) => {
    totals[item.currency] = (totals[item.currency] || 0) + item.amount;
    return totals;
  }, {}), [records]);
  const totalLabel = Object.entries(totalByCurrency)
    .map(([currency, amount]) => formatMoney(amount, currency))
    .join(' · ') || 'Not available';

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
              <p className="mt-2 text-[14px] leading-6 tracking-tight text-[#66737F]">Cases with both a recorded approval and positive payment evidence linked to the tenant’s financial event trail.</p>
            </div>
            <Button className="h-10 rounded-md bg-[#0B74DE] px-4 text-[13px] font-medium tracking-tight text-white shadow-none hover:bg-[#075EAF]">View impact report</Button>
          </div>
        </div>

        {/* Outcome metrics */}
        <div className="border-b border-[#DCE8EE] bg-white px-4 py-3 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-[1280px] grid-cols-1 divide-y divide-[#E7EEF2] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            <div className="py-2.5 sm:pr-7">
              <p className="text-[12px] font-medium tracking-tight text-[#66737F]">Approval evidence</p>
              <p className="mt-1 text-[18px] font-semibold tabular-nums tracking-tight text-[#182026]">{records.length} recorded</p>
              <p className="mt-0.5 text-[11px] leading-4 text-[#66737F]">Each displayed outcome has filing-linked approval truth.</p>
            </div>
            <div className="py-2.5 sm:px-7">
              <p className="text-[12px] font-medium tracking-tight text-[#66737F]">Verified paid</p>
              <p className="mt-1 text-[18px] font-semibold tabular-nums tracking-tight text-[#182026]">{totalLabel}</p>
              <p className="mt-0.5 text-[11px] leading-4 text-[#66737F]">Positive reimbursement events matched to these outcomes.</p>
            </div>
            <div className="py-2.5 sm:pl-7">
              <p className="text-[12px] font-medium tracking-tight text-[#66737F]">Payout proof</p>
              <p className="mt-1 text-[18px] font-semibold tabular-nums tracking-tight text-[#182026]">{records.length} linked</p>
              <p className="mt-0.5 text-[11px] leading-4 text-[#66737F]">Each entry exposes a recorded settlement, payout batch, or event reference.</p>
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
                          {formatMoney(item.amount, item.currency)}
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
                  <h3 className="text-[15px] font-bold text-[#111827]">{loading ? 'Loading verified outcomes' : (loadError ? 'Outcome ledger unavailable' : 'No verified outcomes found')}</h3>
                  <p className="mt-1 text-[13px] text-[#6B7280]">{loading ? 'Loading tenant-scoped approval and payment evidence.' : (loadError || 'No records currently meet both the approval and verified-payment criteria.')}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-6 flex items-center justify-between border-t border-[#DCE8EE] pt-5">
            <p className="text-[12px] font-medium text-[#9CA3AF]">
              Showing {filteredRows.length} of {records.length} verified outcomes
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
                          <p className="mt-1 text-[20px] font-semibold tabular-nums tracking-tight text-[#182026]">{formatMoney(selectedItem.amount, selectedItem.currency)}</p>
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
                            <p className="mt-1 text-[12px] text-[#6B7280]">Payment evidence recorded on {formatDate(selectedItem.updated)}.</p>
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
