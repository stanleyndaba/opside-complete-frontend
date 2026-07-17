import React from 'react';

import { BrandFooter } from '@/components/layout/BrandFooter';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { usePageMeta } from '@/hooks/usePageMeta';

const comparisonRows = [
  ['Upfront cost', '$0', '$99 once'],
  ['Commission', '15–25%', '0% through 2027'],
  ['Amazon approves $10,000', 'You keep ~$7,500–8,500', 'You keep $10,000'],
  ['Risk', 'Ongoing commission', '90-day refund guarantee'],
] as const;

export default function CurrencyMargin() {
  const pageUrl = typeof window === 'undefined' ? '/currency-margin' : `${window.location.origin}/currency-margin`;

  usePageMeta({
    title: 'Currency Margin | Margin',
    description:
      'See how Margin keeps the pricing conversation clear for international buyers with a simple, transparent ZAR checkout explanation.',
    url: pageUrl,
  });

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FAFAF7] font-sans text-[#182026]">
      <PublicNavbar variant="light" />

      <main className="relative">
        <div className="pointer-events-none fixed inset-0 opacity-[0.35] [background-image:linear-gradient(rgba(11,116,222,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(11,116,222,0.04)_1px,transparent_1px)] [background-size:72px_72px]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[760px] bg-[radial-gradient(circle_at_50%_0%,rgba(11,116,222,0.08),transparent_46%)]" />

        <section className="relative pt-28 md:pt-40">
          <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-6 md:px-8">
            <div className="mx-auto max-w-[940px] text-center">
              <div className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#0B74DE] opacity-90">
                Currency Margin
              </div>
              <h1 className="mt-6 text-[40px] font-semibold leading-[0.96] tracking-[-0.06em] text-[#182026] sm:text-[52px] md:text-[82px]">
                Get Started — $99
              </h1>
              <p className="mx-auto mt-6 max-w-[760px] text-[17px] leading-8 text-[#4D5B66] md:mt-8 md:text-[21px] md:leading-9">
                Price shown in ZAR for international processing. Your card will be charged the equivalent of $99 USD at today&apos;s exchange rate.
              </p>
            </div>
          </div>
        </section>

        <section className="relative py-16 md:py-20">
          <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-6 md:px-8">
            <div className="mx-auto max-w-[920px]">
              <div className="mt-8 overflow-hidden rounded-[16px] border border-[#E4EDF1] bg-white">
                <div className="grid grid-cols-[1.2fr_1fr_1fr] border-b border-[#E4EDF1] bg-[#FAFBFC] px-5 py-4 text-[12px] font-semibold uppercase tracking-[0.16em] text-[#7A8794]">
                  <div />
                  <div className="text-center">Traditional Recovery Service</div>
                  <div className="text-center">With Margin</div>
                </div>

                {comparisonRows.map(([label, traditional, margin]) => (
                  <div
                    key={label}
                    className="grid grid-cols-[1.2fr_1fr_1fr] border-b border-[#E4EDF1] last:border-b-0 px-5 py-4 text-[14px] leading-6 text-[#182026] md:text-[15px]"
                  >
                    <div className="pr-4 font-medium text-[#51606B]">{label}</div>
                    <div className="px-3 text-center text-[#182026]">{traditional}</div>
                    <div className="px-3 text-center font-medium text-[#182026]">{margin}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="relative border-t border-[#E4EDF1] py-16 md:py-20">
          <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-6 md:px-8">
            <div className="mx-auto max-w-[860px]">
              <div className="mt-8 space-y-4">
                <div className="rounded-[14px] border border-[#E4EDF1] bg-white px-5 py-4">
                  <div className="text-[15px] font-semibold text-[#182026]">
                    Why does checkout show R1,799?
                  </div>
                  <p className="mt-2 text-[15px] leading-7 text-[#4D5B66]">
                    Margin uses Paystack to securely process payments. <strong>$99 USD is approximately R1,799 ZAR.</strong> Depending on your card and region, your bank may display the local currency equivalent during checkout.
                  </p>
                </div>

                <div className="rounded-[14px] border border-[#E4EDF1] bg-white px-5 py-4">
                  <div className="text-[15px] font-semibold text-[#182026]">
                    What happens after payment?
                  </div>
                  <p className="mt-2 text-[15px] leading-7 text-[#4D5B66]">
                    Your access is reserved and the onboarding flow continues inside Margin once the payment is confirmed.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative border-t border-[#E4EDF1] bg-[#FAFAF7] py-16 md:py-24">
          <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-6 md:px-8">
            <div className="mx-auto max-w-[900px] text-center">
              <h2 className="text-[30px] font-semibold leading-[1.02] tracking-[-0.045em] text-[#182026] sm:text-[40px] md:text-[56px]">
                Hire the Agent. Win the case.
              </h2>
            </div>
          </div>
        </section>
      </main>

      <BrandFooter />
    </div>
  );
}
