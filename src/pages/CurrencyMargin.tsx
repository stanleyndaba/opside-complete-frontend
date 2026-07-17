import React from 'react';
import { ArrowRight } from 'lucide-react';

import { BrandFooter } from '@/components/layout/BrandFooter';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { usePageMeta } from '@/hooks/usePageMeta';

const comparisonRows = [
  ['Upfront cost', '$0', '$99 once'],
  ['Commission', '15–25%', '0% through 2026'],
  ['Amazon approves $10,000', 'You keep ~$7,500–8,500', 'You keep $10,000'],
] as const;

const faqItems = [
  {
    question: 'Why does checkout show R1,799?',
    answer:
      'Margin uses Paystack to securely process payments. $99 USD is approximately R1,799 ZAR. Depending on your card and region, your bank may display the local currency equivalent during checkout.',
  },
  {
    question: 'What happens after payment?',
    answer:
      'Your access is reserved and the onboarding flow continues inside Margin once the payment is confirmed.',
  },
  {
    question: 'What is an Access ID?',
    answer:
      'Your Access ID is a private 6-digit code you choose at checkout. Think of it like a unique PIN Margin can use to reference your purchase and onboarding. It should be exactly 6 digits, kept secret, and unique to you.',
  },
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
              <div className="mt-8 flex justify-center">
                <Button
                  asChild
                  className="h-[52px] rounded-[5px] bg-[#0B74DE] px-7 text-[14px] font-semibold text-white shadow-[0_18px_40px_rgba(11,116,222,0.22)] transition-all hover:bg-[#0962bf] hover:shadow-[0_22px_50px_rgba(11,116,222,0.30)]"
                >
                  <a href="https://paystack.shop/pay/margin-early-access">
                    Checkout
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="relative py-16 md:py-20">
          <div className="mx-auto w-full max-w-[1200px] px-5 sm:px-6 md:px-8">
            <div className="mx-auto max-w-[920px]">
              <div className="mt-8 overflow-hidden rounded-[16px] border border-[#E4EDF1] bg-white">
                <div className="grid grid-cols-[1.2fr_1fr_1fr] border-b border-[#E4EDF1] bg-[#FAFBFC] px-5 py-4 text-[12px] font-semibold uppercase tracking-tight text-[#7A8794]">
                  <div />
                  <div className="text-center">Recovery Service</div>
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
              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0B74DE]">
                FAQ
              </div>
              <div className="mt-8 border-t border-[#DADFE3]">
                <Accordion type="single" collapsible className="w-full">
                  {faqItems.map((item, index) => (
                    <AccordionItem key={item.question} value={`currency-faq-${index}`} className="border-b border-[#DADFE3] px-0">
                      <AccordionTrigger className="py-6 text-left text-[19px] font-semibold tracking-[-0.035em] text-[#050607] hover:no-underline md:py-7 md:text-[24px] [&>svg]:h-5 [&>svg]:w-5 [&>svg]:text-[#6C737A]">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="max-w-[860px] pb-7 pr-10 text-[15px] leading-7 text-[#66737F] md:text-[17px] md:leading-8">
                        <p>{item.answer}</p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
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
              <div className="mt-6 inline-flex items-center rounded-full border border-[#E9EEF2] bg-white px-3 py-1">
                <span className="mr-2 flex h-2 w-2 rounded-full bg-[#E05B52]" />
                <span className="text-[12px] font-semibold uppercase tracking-tight text-[#182026]">
                  Closes July 30
                </span>
              </div>
              <div className="mt-6 text-[15px] font-medium leading-7 text-[#4D5B66]">
                Secure your Founding Pass before July 30, 2026 or before the first 500 slots are gone.
              </div>
              <div className="mt-4">
                <Button
                  asChild
                  className="h-[52px] rounded-[5px] bg-[#0B74DE] px-7 text-[14px] font-semibold text-white shadow-[0_18px_40px_rgba(11,116,222,0.22)] transition-all hover:bg-[#0962bf] hover:shadow-[0_22px_50px_rgba(11,116,222,0.30)]"
                >
                  <a href="https://paystack.shop/pay/margin-early-access">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              </div>
              <div className="mx-auto mt-6 max-w-[760px] text-[13px] leading-6 text-[#4D5B66]">
                $99 one-time. Founder pricing locked through December 31, 2026. Priority activation and founder onboarding are included.
              </div>
              <p className="mx-auto mt-4 max-w-[760px] text-[12px] leading-5 text-[#8A98A3]">
                <span className="font-semibold text-[#0B74DE]">E2E Recovery Commitment. No recovery left behind.</span>
                <br />
                Margin does not guarantee reimbursement outcomes. Amazon makes final reimbursement decisions. No filing happens without seller approval.
              </p>
            </div>
          </div>
        </section>
      </main>

      <BrandFooter />
    </div>
  );
}
