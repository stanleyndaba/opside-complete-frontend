import { ArrowRight, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SITE_META } from '@/config/site';

/**
 * Design reminder: keep this page pure white, editorial, and reassuring.
 * Use soft gray surfaces, dark charcoal copy, compact Merriweather/Lora hierarchy,
 * and the Margin blue CTA. This is a calm file-first explanation, not a sales page.
 */
const auditSteps = [
  {
    number: '1',
    title: 'Tell us who you are',
    description: 'We’ll ask for a few quick details so we can associate your files with your Audit.',
  },
  {
    number: '2',
    title: 'Upload your Amazon files',
    description: 'You’ll be taken to a secure upload page where you can send multiple files at once.',
  },
  {
    number: '3',
    title: 'Margin investigates',
    description: 'We’ll review the records, identify what needs attention, and gather more information if necessary.',
  },
  {
    number: '4',
    title: 'We come back with the result',
    description: 'Once the Audit is complete, we’ll show you what we found and what happens next.',
  },
];

export default function AmazonAuditIntro() {
  const navigate = useNavigate();
  const [mobileStep, setMobileStep] = useState(1);

  usePageMeta({
    title: 'Start Your Amazon Audit | Margin',
    description: 'Learn how Margin starts an Amazon Audit with the files that show what happened across your business.',
    url: `${SITE_META.url}/audit-start`,
    image: SITE_META.image,
  });

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#EAF1F5] font-sans text-[#182026]">
      <main className="relative mx-auto flex min-h-screen max-w-[860px] items-start px-3 py-5 sm:items-center sm:px-6 sm:py-8 lg:px-8">
        <div className="pointer-events-none absolute -right-36 -top-40 h-[520px] w-[520px] rounded-full border-[74px] border-white/45" />
        <div className="pointer-events-none absolute -bottom-56 -left-40 h-[500px] w-[500px] rounded-full border-[64px] border-[#C7DCE8]/55" />
        <div className="relative z-10 w-full">
        <div className="mb-5 flex items-center gap-2.5 px-1 sm:mb-6">
          <img src="/logoimagetwo.png" alt="Margin" className="h-5 w-auto object-contain" />
          <span className="font-merriweather text-[15px] font-semibold tracking-[-0.02em] text-[#30343B]">Margin</span>
        </div>

        <section className="mx-auto max-w-2xl rounded-[14px] bg-white/90 px-4 py-5 shadow-[0_20px_70px_rgba(50,78,96,0.12)] backdrop-blur-sm sm:px-8 sm:py-8 md:hidden" aria-labelledby="mobile-audit-title">
          <div className="border-b border-[#E4E6E8] pb-5">
            <p className="text-[11px] font-medium text-[#777A82]">File-first Audit</p>
            <p className="mt-3 font-mono text-[11px] font-semibold uppercase tracking-tight text-[#5165C7]">{mobileStep} / 3</p>
            <h1 id="mobile-audit-title" className="mt-3 font-lora text-[28px] font-normal leading-[1.06] tracking-[-0.035em] text-[#30343B]">
              {mobileStep === 1 ? 'Let’s get your Amazon Audit started.' : mobileStep === 2 ? 'Almost there.' : 'A few things to keep in mind.'}
            </h1>
          </div>

          {mobileStep === 1 ? (
            <div className="pt-5">
              <p className="text-[14px] leading-6 text-[#595E68]">To investigate your account properly, Margin will first ask you for the Amazon files relevant to your Audit.</p>
              <p className="mt-3 text-[14px] leading-6 text-[#595E68]">These records give us a detailed view of what happened across your Amazon business — so we can look beyond a single issue and investigate what may have been missed.</p>
              <Button type="button" onClick={() => setMobileStep(2)} className="mt-6 h-11 w-full rounded-[10px] bg-[#3F51A8] px-5 text-[13px] font-semibold text-white shadow-none hover:bg-[#31418D]">Understood <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Button>
            </div>
          ) : null}

          {mobileStep === 2 ? (
            <div className="pt-5">
              <h2 className="font-lora text-[21px] font-normal tracking-[-0.015em] text-[#30343B]">Files come first</h2>
              <p className="mt-3 text-[14px] leading-6 text-[#595E68]">Uploading your files gives Margin the broadest view of your account and allows us to perform a deeper Audit.</p>
              <p className="mt-3 text-[14px] leading-6 text-[#595E68]">If we need additional information to complete the investigation, we may ask you to connect your Amazon account through <strong className="font-semibold text-[#30343B]">Amazon SP-API</strong> so Margin can retrieve the additional records needed.</p>
              <p className="mt-3 text-[14px] font-medium leading-6 text-[#30343B]">You don’t need to decide that now.</p>
              <p className="mt-1 text-[14px] font-semibold leading-6 text-[#30343B]">We’ll tell you if we need anything else.</p>
              <Button type="button" onClick={() => setMobileStep(3)} className="mt-6 h-11 w-full rounded-[10px] bg-[#3F51A8] px-5 text-[13px] font-semibold text-white shadow-none hover:bg-[#31418D]">Continue <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Button>
            </div>
          ) : null}

          {mobileStep === 3 ? (
            <div className="pt-5">
              <h2 className="font-lora text-[21px] font-normal tracking-[-0.015em] text-[#30343B]">What happens next?</h2>
              <div className="mt-4 divide-y divide-[#E4E6E8] border-y border-[#E4E6E8]">
                {auditSteps.map(({ number, title }) => (
                  <div key={number} className="flex gap-3 py-3 text-[14px]">
                    <span className="w-4 shrink-0 text-[12px] font-semibold text-[#5165C7]">{number}</span>
                    <span className="font-semibold text-[#30343B]">{title}</span>
                  </div>
                ))}
              </div>
              <Button type="button" onClick={() => navigate('/seller-audit')} className="mt-6 h-11 w-full rounded-[10px] bg-[#3F51A8] px-5 text-[13px] font-semibold text-white shadow-none hover:bg-[#31418D]">Proceed to Upload <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Button>
              <p className="mt-3 text-[13px] font-medium leading-5 text-[#595E68]">You don’t need to figure out what to look for. That’s Margin’s job.</p>
            </div>
          ) : null}
        </section>

        <section className="mx-auto hidden max-w-2xl rounded-[14px] bg-white/90 px-4 py-5 shadow-[0_20px_70px_rgba(50,78,96,0.12)] backdrop-blur-sm sm:px-8 sm:py-8 md:block" aria-labelledby="audit-intro-title">
          <div className="border-b border-[#E4E6E8] pb-6 sm:pb-8">
            <p className="mb-3 text-[11px] font-medium text-[#777A82] sm:mb-4 sm:text-[12px]">File-first Audit</p>
            <h1 id="audit-intro-title" className="font-lora text-[28px] font-normal leading-[1.06] tracking-[-0.035em] text-[#30343B] sm:text-[40px]">Let’s get your Amazon Audit started.</h1>
            <p className="mt-4 max-w-xl text-[14px] leading-6 text-[#595E68]">To investigate your account properly, Margin will first ask you for the Amazon files relevant to your Audit.</p>
            <p className="mt-3 max-w-xl text-[14px] leading-6 text-[#595E68]">These records give us a detailed view of what happened across your Amazon business — so we can look beyond a single issue and investigate what may have been missed.</p>
          </div>

          <div className="mt-5 border-b border-[#E4E6E8] pb-5 sm:mt-6 sm:pb-6">
            <h2 className="font-lora text-[21px] font-normal tracking-[-0.015em] text-[#30343B] sm:text-[23px]">Files come first</h2>
            <p className="mt-3 text-[14px] leading-6 text-[#595E68]">Uploading your files gives Margin the broadest view of your account and allows us to perform a deeper Audit.</p>
            <p className="mt-4 text-[14px] leading-6 text-[#595E68]">If we need additional information to complete the investigation, we may ask you to connect your Amazon account through <strong className="font-semibold text-[#30343B]">Amazon SP-API</strong> so Margin can retrieve the additional records needed.</p>
            <p className="mt-4 text-[14px] font-medium leading-6 text-[#30343B]">You don’t need to decide that now.</p>
            <p className="mt-1 text-[14px] font-semibold leading-6 text-[#30343B]">We’ll tell you if we need anything else.</p>
          </div>

          <div className="mt-6 sm:mt-7" aria-labelledby="audit-next-title">
            <h2 id="audit-next-title" className="font-lora text-[21px] font-normal tracking-[-0.015em] text-[#30343B] sm:text-[23px]">What happens next?</h2>
            <div className="mt-4 divide-y divide-[#E4E6E8] border-y border-[#E4E6E8]">
              {auditSteps.map(({ number, title, description }) => (
                <details key={number} className="group py-3">
                  <summary className="flex cursor-pointer list-none items-center gap-3 text-[14px] font-semibold text-[#30343B] outline-none marker:hidden focus-visible:text-[#3F51A8]">
                    <span className="w-4 shrink-0 text-[12px] font-semibold text-[#5165C7]">{number}</span>
                    <span className="flex-1">{title}</span>
                    <ChevronDown className="h-4 w-4 shrink-0 text-[#8C969E] transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <p className="pl-7 pr-6 pt-2 text-[13px] leading-5 text-[#777A82]">{description}</p>
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
