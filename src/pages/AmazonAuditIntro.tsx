import { ArrowRight, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SITE_META } from '@/config/site';
import { ANALYTICS_EVENTS } from '@/lib/analyticsEvents';
import { trackEvent } from '@/lib/analytics';

/**
 * Design reminder: keep this page pure white, editorial, and reassuring.
 * Use soft gray surfaces, dark charcoal copy, compact Merriweather/Lora hierarchy,
 * and the Margin blue CTA. This is a calm file-first explanation, not a sales page.
 */
const auditSteps = [
  {
    title: 'Add your details',
    description: 'Give us your email and seller or business name so we know whose records we are reviewing.',
  },
  {
    title: 'Send the files you have',
    description: 'Upload your Amazon reports and supporting records. Multiple files are fine, and you can send what you have available.',
  },
  {
    title: 'Margin reviews the records',
    description: 'We run the records through the audit and review the findings for meaningful discrepancies.',
  },
  {
    title: 'Receive your audit result',
    description: 'We come back with what we found and the recovery path that best fits the result, typically within one business day.',
  },
];

export default function AmazonAuditIntro() {
  const navigate = useNavigate();
  const [mobileStep, setMobileStep] = useState(1);
  useEffect(() => {
    trackEvent(ANALYTICS_EVENTS.sellerAuditStarted, { source_page: '/audit-start' });
  }, []);

  usePageMeta({
    title: 'Start Your Amazon Audit | Margin',
    description: 'Learn how Margin starts an Amazon Audit with the files that show what happened across your business.',
    url: `${SITE_META.url}/audit-start`,
    image: SITE_META.image,
  });

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#EAF1F5] font-sans text-[#182026]">
      <main className="relative mx-auto flex min-h-screen max-w-[860px] items-center px-3 py-4 sm:items-center sm:px-6 sm:py-8 lg:px-8">
        <div className="pointer-events-none absolute -right-36 -top-40 h-[520px] w-[520px] rounded-full border-[74px] border-white/45" />
        <div className="pointer-events-none absolute -bottom-56 -left-40 h-[500px] w-[500px] rounded-full border-[64px] border-[#C7DCE8]/55" />
        <div className="relative z-10 w-full">
        <div className="mb-5 flex items-center gap-2.5 px-1 sm:mb-6">
          <img src="/logoimagetwo.png" alt="Margin" className="h-5 w-auto object-contain" />
          <span className="font-merriweather text-[15px] font-semibold tracking-[-0.02em] text-[#30343B]">Margin</span>
        </div>

        <section className="mx-auto max-w-2xl rounded-[12px] bg-white/90 font-google-sans px-3.5 py-4 shadow-[0_16px_48px_rgba(50,78,96,0.1)] backdrop-blur-sm md:hidden" aria-labelledby="mobile-audit-title">
          <div className="border-b border-[#E4E6E8] pb-4">
            <h1 id="mobile-audit-title" className="font-google-sans text-[25px] font-normal leading-[1.08] tracking-[-0.035em] text-[#30343B]">
              {mobileStep === 1 ? 'Get your Amazon Audit started.' : mobileStep === 2 ? 'Almost there.' : 'A few things to keep in mind.'}
            </h1>
          </div>

          {mobileStep === 1 ? (
            <div className="pt-4">
              <p className="text-[14px] leading-6 text-[#595E68]">To start the Audit, send the Amazon files you already have available.</p>
              <p className="mt-3 text-[14px] leading-6 text-[#595E68]">You do not need to know which discrepancy to look for or prepare a perfect package. The records give us the material to investigate what may have been missed.</p>
              <Button type="button" onClick={() => setMobileStep(2)} className="mt-5 h-10 w-full rounded-[9px] border border-[#C7DCE8] bg-[#EAF1F5] px-4 text-[13px] font-semibold text-[#182026] shadow-none hover:bg-[#DCE8EE]">Understood <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Button>
            </div>
          ) : null}

          {mobileStep === 2 ? (
            <div className="pt-4">
              <h2 className="font-google-sans text-[20px] font-normal tracking-[-0.015em] text-[#30343B]">Send what you have</h2>
              <p className="mt-3 text-[14px] leading-6 text-[#595E68]">Amazon reports, settlement or payment reports, inventory, FBA, returns, and refund records can all help. CSV, XLSX, PDF, and ZIP files are fine.</p>
              <p className="mt-3 text-[14px] leading-6 text-[#595E68]">You do not need to organize the files perfectly or connect Amazon at this stage. Margin will tell you if anything else is needed.</p>
              <Button type="button" onClick={() => setMobileStep(3)} className="mt-5 h-10 w-full rounded-[9px] border border-[#C7DCE8] bg-[#EAF1F5] px-4 text-[13px] font-semibold text-[#182026] shadow-none hover:bg-[#DCE8EE]">Continue <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Button>
            </div>
          ) : null}

          {mobileStep === 3 ? (
            <div className="pt-4">
              <h2 className="font-google-sans text-[20px] font-normal tracking-[-0.015em] text-[#30343B]">What happens next?</h2>
              <div className="mt-4 divide-y divide-[#E4E6E8] border-y border-[#E4E6E8]">
                {auditSteps.map(({ title }) => (
                  <div key={title} className="flex gap-3 py-3 text-[14px]">
                    <span className="font-semibold text-[#30343B]">{title}</span>
                  </div>
                ))}
              </div>
              <Button type="button" onClick={() => navigate('/seller-audit')} className="mt-5 h-10 w-full rounded-[9px] border border-[#C7DCE8] bg-[#EAF1F5] px-4 text-[13px] font-semibold text-[#182026] shadow-none hover:bg-[#DCE8EE]">Proceed to Upload <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Button>
              <p className="mt-3 text-[13px] font-medium leading-5 text-[#595E68]">You don’t need to figure out what to look for. That’s Margin’s job.</p>
            </div>
          ) : null}
        </section>

        <section className="mx-auto hidden max-w-2xl rounded-[14px] bg-white/90 px-4 py-5 shadow-[0_20px_70px_rgba(50,78,96,0.12)] backdrop-blur-sm sm:px-8 sm:py-8 md:block" aria-labelledby="audit-intro-title">
          <div className="border-b border-[#E4E6E8] pb-6 sm:pb-8">
            <h1 id="audit-intro-title" className="font-lora text-[28px] font-normal leading-[1.06] tracking-[-0.035em] text-[#30343B] sm:text-[40px]">Get your Amazon Audit started.</h1>
            <p className="mt-4 max-w-xl text-[14px] leading-6 text-[#595E68]">Start by sending the Amazon files you already have available.</p>
            <p className="mt-3 max-w-xl text-[14px] leading-6 text-[#595E68]">You do not need to know which discrepancy to look for or prepare a perfect package. The records give Margin the material to investigate what may have been missed.</p>
          </div>

          <div className="mt-5 border-b border-[#E4E6E8] pb-5 sm:mt-6 sm:pb-6">
            <h2 className="font-lora text-[21px] font-normal tracking-[-0.015em] text-[#30343B] sm:text-[23px]">Send what you have</h2>
            <p className="mt-3 text-[14px] leading-6 text-[#595E68]">Amazon reports, settlement or payment reports, inventory, FBA, returns, and refund records can all help. CSV, XLSX, PDF, and ZIP files are fine.</p>
            <p className="mt-4 text-[14px] leading-6 text-[#595E68]">You do not need to organize the files perfectly or connect Amazon at this stage. Margin will tell you if anything else is needed.</p>
          </div>

          <div className="mt-6 sm:mt-7" aria-labelledby="audit-next-title">
            <h2 id="audit-next-title" className="font-lora text-[21px] font-normal tracking-[-0.015em] text-[#30343B] sm:text-[23px]">What happens next?</h2>
            <div className="mt-4 divide-y divide-[#E4E6E8] border-y border-[#E4E6E8]">
              {auditSteps.map(({ title, description }) => (
                <details key={title} className="group py-3">
                  <summary className="flex cursor-pointer list-none items-center gap-3 text-[14px] font-semibold text-[#30343B] outline-none marker:hidden focus-visible:text-[#3F51A8]">
                    <span className="flex-1">{title}</span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-[#8C969E] transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <p className="pr-6 pt-2 text-[13px] leading-5 text-[#777A82]">{description}</p>
                </details>
              ))}
            </div>
          </div>

          <div className="mt-6 flex flex-col items-stretch gap-3 border-t border-[#E4E6E8] pt-5 sm:mt-7 sm:items-start sm:gap-4 sm:pt-6">
            <Button type="button" onClick={() => navigate('/seller-audit')} className="h-11 w-full rounded-[10px] bg-[#3F51A8] px-5 text-[13px] font-semibold text-white shadow-none hover:bg-[#31418D] sm:w-auto">Continue to Upload <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Button>
            <p className="max-w-xl text-[13px] font-medium leading-5 text-[#595E68]">You don’t need to figure out what to look for. That’s Margin’s job.</p>
          </div>
        </section>
        </div>
      </main>
    </div>
  );
}
