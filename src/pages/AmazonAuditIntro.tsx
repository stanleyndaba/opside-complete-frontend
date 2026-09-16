import { ArrowRight, ClipboardCheck, FileText, Mail, SearchCheck, UploadCloud } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
    icon: ClipboardCheck,
  },
  {
    number: '2',
    title: 'Upload your Amazon files',
    description: 'You’ll be taken to a secure upload page where you can send multiple files at once.',
    icon: UploadCloud,
  },
  {
    number: '3',
    title: 'Margin investigates',
    description: 'We’ll review the records, identify what needs attention, and gather more information if necessary.',
    icon: SearchCheck,
  },
  {
    number: '4',
    title: 'We come back with the result',
    description: 'Once the Audit is complete, we’ll show you what we found and what happens next.',
    icon: Mail,
  },
];

export default function AmazonAuditIntro() {
  const navigate = useNavigate();

  usePageMeta({
    title: 'Start Your Amazon Audit | Margin',
    description: 'Learn how Margin starts an Amazon Audit with the files that show what happened across your business.',
    url: `${SITE_META.url}/audit-start`,
    image: SITE_META.image,
  });

  return (
    <div className="min-h-screen overflow-x-hidden bg-white font-sans text-[#30343B]">
      <main className="mx-auto max-w-[860px] px-4 py-8 sm:px-6 sm:py-12 lg:px-8 lg:py-16">
        <div className="mb-10 flex items-center gap-2.5">
          <img src="/logoimagetwo.png" alt="Margin" className="h-5 w-auto object-contain" />
          <span className="font-merriweather text-[15px] font-semibold tracking-[-0.02em] text-[#30343B]">Margin</span>
        </div>

        <section className="mx-auto max-w-2xl" aria-labelledby="audit-intro-title">
          <div className="border-b border-[#E4E6E8] pb-8">
            <div className="mb-4 inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-[#777A82]">
              <FileText className="h-4 w-4 text-[#5165C7]" aria-hidden="true" />
              File-first Audit
            </div>
            <h1 id="audit-intro-title" className="font-lora text-[32px] font-normal leading-[1.08] tracking-[-0.025em] text-[#30343B] sm:text-[42px]">Let’s get your Amazon Audit started.</h1>
            <p className="mt-5 max-w-xl text-[15px] leading-7 text-[#595E68]">To investigate your account properly, Margin will first ask you for the Amazon files relevant to your Audit.</p>
            <p className="mt-4 max-w-xl text-[15px] leading-7 text-[#595E68]">These records give us a detailed view of what happened across your Amazon business — so we can look beyond a single issue and investigate what may have been missed.</p>
          </div>

          <div className="mt-8 rounded-[5px] bg-[#F7F8FA] p-5 sm:p-7">
            <h2 className="font-lora text-[23px] font-normal tracking-[-0.015em] text-[#30343B]">Files come first</h2>
            <p className="mt-3 text-[14px] leading-6 text-[#595E68]">Uploading your files gives Margin the broadest view of your account and allows us to perform a deeper Audit.</p>
            <p className="mt-4 text-[14px] leading-6 text-[#595E68]">If we need additional information to complete the investigation, we may ask you to connect your Amazon account through <strong className="font-semibold text-[#30343B]">Amazon SP-API</strong> so Margin can retrieve the additional records needed.</p>
            <p className="mt-4 text-[14px] font-medium leading-6 text-[#30343B]">You don’t need to decide that now.</p>
            <p className="mt-1 text-[14px] font-semibold leading-6 text-[#30343B]">We’ll tell you if we need anything else.</p>
          </div>

          <div className="mt-10">
            <h2 className="font-lora text-[23px] font-normal tracking-[-0.015em] text-[#30343B]">What happens next?</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {auditSteps.map(({ number, title, description, icon: Icon }) => (
                <div key={number} className="rounded-[5px] border border-[#E4E6E8] bg-white p-5">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#EEF0FB] text-[13px] font-semibold text-[#3F51A8]">{number}</span>
                    <Icon className="h-4 w-4 text-[#777A82]" aria-hidden="true" />
                  </div>
                  <h3 className="mt-5 text-[14px] font-semibold text-[#30343B]">{title}</h3>
                  <p className="mt-2 text-[13px] leading-5 text-[#777A82]">{description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-10 flex flex-col items-start gap-5 border-t border-[#E4E6E8] pt-8">
            <Button type="button" onClick={() => navigate('/seller-audit')} className="h-11 rounded-[10px] bg-[#3F51A8] px-5 text-[13px] font-semibold text-white shadow-none hover:bg-[#31418D]">Continue to Upload <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" /></Button>
            <p className="max-w-xl text-[13px] font-medium leading-5 text-[#595E68]">You don’t need to figure out what to look for. That’s Margin’s job.</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#E4E6E8] bg-white px-4 py-6 text-center sm:px-6">
        <p className="text-[12px] text-[#777A82]">Margin Agents can make mistakes. Check important information before relying on it.</p>
      </footer>
    </div>
  );
}
