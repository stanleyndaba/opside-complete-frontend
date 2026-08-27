import { CheckCircle2, Clock3, FileText, Loader2, ShieldCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { RecoverOnceQuote } from '@/lib/api';

type RecoverOnceReviewSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: RecoverOnceQuote | null;
  potentialScope: string;
  evidenceReadyCount: number;
  isCheckoutStarting: boolean;
  onContinueToCheckout: () => void;
};

function formatExpiry(value: string | null | undefined): string | null {
  if (!value) return null;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return null;
  return new Date(timestamp).toLocaleString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Displays the backend-generated quote only. It never recalculates a quote,
 * price, scope, eligibility, or payment state in the browser.
 */
export function RecoverOnceReviewSheet({
  open,
  onOpenChange,
  quote,
  potentialScope,
  evidenceReadyCount,
  isCheckoutStarting,
  onContinueToCheckout,
}: RecoverOnceReviewSheetProps) {
  const quoteIsCheckoutReady = quote?.status === 'available' || quote?.status === 'accepted';
  const expiry = formatExpiry(quote?.expires_at);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto flex h-[80vh] w-full flex-col overflow-y-auto rounded-t-[18px] border-[#E8E7E1] bg-white p-0 text-[#191B20] shadow-[0_-16px_48px_rgba(25,27,32,0.16)] sm:h-[min(74vh,700px)] sm:w-[calc(100vw-48px)] sm:max-w-[960px] sm:rounded-t-[18px] sm:border-x">
        <SheetHeader className="border-b border-[#E8E7E1] px-5 pb-5 pt-3 pr-14 text-left sm:px-7">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#D7D7D1]" aria-hidden="true" />
          <p className="text-[12px] font-semibold text-[#595E68]">Recover Once review</p>
          <SheetTitle className="mt-2 max-w-2xl font-lora text-[28px] font-normal leading-[1.08] tracking-[-0.025em] text-[#191B20] sm:text-[31px]" style={{ fontWeight: 400 }}>Review the recorded recovery scope before checkout.</SheetTitle>
          <SheetDescription className="mt-3 max-w-2xl text-[13px] leading-5 text-[#595E68]">This is a review step. No payment is started until you explicitly continue to secure checkout below.</SheetDescription>
        </SheetHeader>

        <div className="grid flex-1 gap-5 px-5 py-5 sm:grid-cols-[minmax(0,1fr)_minmax(260px,0.72fr)] sm:px-7 sm:py-6">
          <div className="min-w-0">
            <section className="rounded-[10px] border border-[#D7D7D1] bg-[#F4F3ED] p-4" aria-label="Recorded quote scope">
              <p className="text-[12px] font-semibold text-[#191B20]">What this generated quote covers</p>
              <dl className="mt-3 grid gap-3 text-[12px] sm:grid-cols-2">
                <div><dt className="text-[#777A82]">Potential recovery scope</dt><dd className="mt-1 font-semibold text-[#191B20]">{potentialScope}</dd></div>
                <div><dt className="text-[#777A82]">Included opportunities</dt><dd className="mt-1 font-semibold text-[#191B20]">{quote ? quote.included_opportunity_count.toLocaleString() : 'Not available'}</dd></div>
                <div><dt className="text-[#777A82]">Estimated potential value</dt><dd className="mt-1 font-semibold text-[#191B20]">{quote?.estimated_recoverable_subunits != null ? `R${Math.round(quote.estimated_recoverable_subunits / 100).toLocaleString('en-ZA')}` : 'Not available'}</dd></div>
                <div><dt className="text-[#777A82]">Evidence ready</dt><dd className="mt-1 font-semibold text-[#191B20]">{evidenceReadyCount.toLocaleString()} recorded item{evidenceReadyCount === 1 ? '' : 's'}</dd></div>
              </dl>
              <p className="mt-4 border-t border-[#D7D7D1] pt-3 text-[12px] leading-5 text-[#595E68]">The scope represents recorded potential opportunities from this audit. It does not prove reimbursement, authorize filing, or guarantee payment.</p>
            </section>

            <section className="mt-5">
              <p className="text-[12px] font-semibold text-[#191B20]">What happens after checkout</p>
              <div className="mt-3 divide-y divide-[#E8E7E1] rounded-[10px] border border-[#E8E7E1] bg-white px-4">
                <div className="py-3.5"><h3 className="text-[14px] font-semibold text-[#191B20]">Payment is verified</h3><p className="mt-1 text-[12px] leading-5 text-[#595E68]">Margin verifies the checkout result before treating a payment as complete.</p></div>
                <div className="py-3.5"><h3 className="text-[14px] font-semibold text-[#191B20]">The engagement becomes active only after verified payment</h3><p className="mt-1 text-[12px] leading-5 text-[#595E68]">A Recover Once engagement is created only when the existing verification path confirms payment.</p></div>
                <div className="py-3.5"><h3 className="text-[14px] font-semibold text-[#191B20]">You remain in control</h3><p className="mt-1 text-[12px] leading-5 text-[#595E68]">Nothing is filed with Amazon without your authorization. A quote does not itself authorize a claim or establish reimbursement eligibility.</p></div>
              </div>
            </section>
          </div>

          <aside className="flex min-w-0 flex-col rounded-[10px] border border-[#E8E7E1] bg-[#FBFAF7] p-4 sm:p-5">
            <div className="border-l-2 border-[#3F51A8] pl-4"><p className="text-[12px] font-semibold text-[#191B20]">Fixed quote</p><p className="mt-1 text-[28px] font-semibold tracking-[-0.035em] text-[#191B20]">{quote?.display_amount || 'Not available'}</p><p className="mt-1 text-[12px] leading-5 text-[#595E68]">{quote?.currency || 'ZAR'} · one-time payment</p></div>
            {expiry ? <div className="mt-5 flex items-start gap-2 rounded-[10px] border border-[#E8E7E1] bg-white p-3 text-[12px] leading-5 text-[#595E68]"><Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-[#595E68]" aria-hidden="true" /><p><span className="font-semibold text-[#191B20]">Quote expiry:</span> {expiry}</p></div> : null}
            {quote?.status === 'manual_review_required' ? <div className="mt-5 flex items-start gap-2 rounded-[10px] border border-amber-300 bg-amber-50 p-3 text-[12px] leading-5 text-amber-900"><FileText className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" /><p>{quote.manual_review_reason || 'This recorded scope needs manual assessment before a fixed quote can be issued.'}</p></div> : null}
            <div className="mt-auto border-t border-[#E8E7E1] pt-5">
              <div className="flex items-start gap-2 text-[12px] leading-5 text-[#595E68]"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#3F51A8]" aria-hidden="true" /><p>Continuing opens the existing secure checkout for this generated quote. It does not authorize filing with Amazon.</p></div>
              <Button onClick={onContinueToCheckout} disabled={!quoteIsCheckoutReady || isCheckoutStarting} className="mt-5 h-10 w-full rounded-[10px] bg-[#3F51A8] px-4 text-[13px] font-semibold text-white shadow-none hover:bg-[#31418D] disabled:bg-[#A5A7A3]">
                {isCheckoutStarting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                {isCheckoutStarting ? 'Opening secure checkout' : 'Continue to secure checkout'}
              </Button>
              <SheetClose asChild><Button variant="ghost" className="mt-2 h-10 w-full rounded-[10px] text-[13px] font-medium text-[#595E68] hover:bg-white hover:text-[#191B20]">Back to audit</Button></SheetClose>
            </div>
          </aside>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default RecoverOnceReviewSheet;
