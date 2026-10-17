import { ArrowRight } from 'lucide-react';
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
    title: 'Establish your business profile',
    description: 'Provide the business and account details required to scope the review.',
  },
  {
    title: 'Provide financial records',
    description: 'Submit the relevant Amazon financial and operational records.',
  },
  {
    title: 'Financial examination',
    description: 'Margin analyzes the records to establish the financial position, investigate material variances, and assess unresolved exposure.',
  },
  {
    title: 'Findings and recommended actions',
    description: 'Receive a documented assessment of what has been established, what remains unresolved, and where the evidence supports further action.',
  },
];

export default function AmazonAuditIntro() {
  const navigate = useNavigate();
  const [mobileStep, setMobileStep] = useState(1);
  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/review-consent', { replace: true });
  };
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
    <div className="min-h-screen overflow-x-hidden bg-white font-sans text-[#182026]">
      <main className="relative mx-auto flex min-h-screen max-w-[860px] items-center px-3 py-4 sm:items-center sm:px-6 sm:py-8 lg:px-8">
        <div className="relative z-10 w-full">
        <div className="mb-5 flex items-center justify-between px-1 sm:mb-6">
          <div className="flex items-center gap-2.5">
            <img src="/logoimagetwo.png" alt="Margin" className="h-5 w-auto object-contain" />
            <span className="font-merriweather text-[15px] font-semibold tracking-tight text-[#30343B]">Margin</span>
          </div>
          <button type="button" onClick={handleBack} className="inline-flex h-9 items-center justify-center rounded-[5px] bg-[#0B74DE] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#075EBA]">Back</button>
        </div>

        <section className="mx-auto max-w-2xl bg-white px-3.5 py-4 font-google-sans md:hidden" aria-labelledby="mobile-audit-title">
          <div className="pb-2">
            <h1 id="mobile-audit-title" className="font-google-sans text-[25px] font-normal leading-[1.08] tracking-tight text-[#30343B]">
              {mobileStep === 1 ? 'Get your Amazon financial review started.' : mobileStep === 2 ? "You're ready to submit your records." : "Here's what happens next."}
            </h1>
          </div>

          {mobileStep === 1 ? (
            <div className="pt-4">
              <p className="text-[14px] leading-6 text-[#595E68]">Send the Amazon records you already have available.</p>
              <p className="mt-3 text-[14px] leading-6 text-[#595E68]">You don’t need to know what went wrong or prepare a perfect package. Margin examines the records to establish what has been accounted for, identify material discrepancies, and determine what may require further investigation.</p>
              <p className="mt-3 text-[14px] font-medium leading-6 text-[#30343B]">You provide the records. Margin establishes what they show.</p>
              <Button type="button" onClick={() => setMobileStep(2)} className="mt-5 h-10 w-full rounded-[3px] border-0 bg-[#E5E8EA] px-4 text-[13px] font-semibold text-[#30343B] shadow-none hover:bg-[#D9DEE1]">Continue to records submission <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Button>
            </div>
          ) : null}

          {mobileStep === 2 ? (
            <div className="pt-4">
              <h2 className="font-google-sans text-[20px] font-normal tracking-tight text-[#30343B]">Send what you have.</h2>
              <p className="mt-3 text-[14px] leading-6 text-[#595E68]">Amazon settlement and payment reports, transaction reports, inventory records, FBA records, returns, and refunds can all help establish what happened to your money.</p>
              <p className="mt-3 text-[14px] leading-6 text-[#595E68]">CSV, XLSX, PDF, and ZIP files are accepted.</p>
              <p className="mt-3 text-[14px] leading-6 text-[#595E68]">You don’t need to organize everything perfectly or identify a discrepancy yourself. Send the records you already have available. Margin will examine them and let you know if anything else is needed.</p>
              <Button type="button" onClick={() => setMobileStep(3)} className="mt-5 h-10 w-full rounded-[3px] border-0 bg-[#E5E8EA] px-4 text-[13px] font-semibold text-[#30343B] shadow-none hover:bg-[#D9DEE1]">Continue to upload records <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Button>
            </div>
          ) : null}

          {mobileStep === 3 ? (
            <div className="pt-4">
              <h2 className="font-google-sans text-[20px] font-normal tracking-tight text-[#30343B]">From financial records to resolution.</h2>
              <div className="mt-2">
                {auditSteps.map(({ title, description }) => (
                  <div key={title} className="py-2.5 text-[14px]">
                    <p className="font-semibold text-[#30343B]">{title}</p>
                    <p className="mt-1 leading-5 text-[#777A82]">{description}</p>
                  </div>
                ))}
              </div>
              <p className="mt-2 text-[13px] font-medium leading-5 text-[#595E68]">You don’t need to identify the discrepancy. Margin leads the examination.</p>
              <Button type="button" onClick={() => navigate('/seller-audit')} className="mt-4 h-10 w-full rounded-[3px] border-0 bg-[#E5E8EA] px-4 text-[13px] font-semibold text-[#30343B] shadow-none hover:bg-[#D9DEE1]">Proceed to records submission <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Button>
            </div>
          ) : null}
        </section>

        <section className="mx-auto hidden max-w-2xl bg-white px-4 py-5 sm:px-8 sm:py-8 md:block" aria-labelledby="audit-intro-title">
          <div className="pb-2 sm:pb-3">
            <h1 id="audit-intro-title" className="font-google-sans text-[28px] font-normal leading-[1.06] tracking-tight text-[#30343B] sm:text-[40px]">Get your Amazon financial review started.</h1>
            <p className="mt-4 max-w-xl text-[14px] leading-6 text-[#595E68]">Send the Amazon records you already have available.</p>
            <p className="mt-3 max-w-xl text-[14px] leading-6 text-[#595E68]">You don’t need to know what went wrong or prepare a perfect package. Margin examines the records to establish what has been accounted for, identify material discrepancies, and determine what may require further investigation.</p>
          </div>

          <div className="mt-4 pb-2 sm:mt-5 sm:pb-3">
            <h2 className="font-google-sans text-[21px] font-normal tracking-tight text-[#30343B] sm:text-[23px]">You&apos;re ready to submit your records.</h2>
            <p className="mt-3 text-[14px] leading-6 text-[#595E68]">Send what you have.</p>
            <p className="mt-3 text-[14px] leading-6 text-[#595E68]">Amazon settlement and payment reports, transaction reports, inventory records, FBA records, returns, and refunds can all help establish what happened to your money.</p>
            <p className="mt-3 text-[14px] leading-6 text-[#595E68]">CSV, XLSX, PDF, and ZIP files are accepted.</p>
            <p className="mt-3 text-[14px] leading-6 text-[#595E68]">You don’t need to organize everything perfectly or identify a discrepancy yourself. Send the records you already have available. Margin will examine them and let you know if anything else is needed.</p>
          </div>

          <div className="mt-4 sm:mt-5" aria-labelledby="audit-next-title">
            <h2 id="audit-next-title" className="font-google-sans text-[21px] font-normal tracking-tight text-[#30343B] sm:text-[23px]">From financial records to resolution.</h2>
            <div className="mt-2">
              {auditSteps.map(({ title, description }) => (
                <div key={title} className="py-2.5">
                  <p className="text-[14px] font-semibold text-[#30343B]">{title}</p>
                  <p className="mt-1 max-w-xl text-[13px] leading-5 text-[#777A82]">{description}</p>
                </div>
              ))}
            </div>
            <p className="mt-2 max-w-xl text-[13px] font-medium leading-5 text-[#595E68]">You don’t need to identify the discrepancy. Margin leads the examination.</p>
          </div>

          <div className="mt-5 flex flex-col items-stretch gap-3 pt-2 sm:mt-6 sm:items-start sm:gap-4">
            <p className="max-w-xl text-[13px] font-medium leading-5 text-[#30343B]">You provide the records. Margin establishes what they show.</p>
            <p className="max-w-xl text-[13px] font-medium leading-5 text-[#595E68]">You don’t need to know what to look for. Establishing what happened is Margin’s job.</p>
            <Button type="button" onClick={() => navigate('/seller-audit')} className="h-11 w-full rounded-[3px] border-0 bg-[#E5E8EA] px-5 text-[13px] font-semibold text-[#30343B] shadow-none hover:bg-[#D9DEE1] sm:w-auto">Proceed to records submission <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Button>
          </div>
        </section>
        </div>
      </main>
    </div>
  );
}
