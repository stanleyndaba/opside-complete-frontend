import { ArrowRight, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SITE_META } from '@/config/site';

const faqs = [
  {
    question: 'What happens after I begin?',
    answer: 'Give Margin the Amazon records needed for examination. Margin works through them to identify what reconciles, what does not, and what may support a recovery.',
  },
  {
    question: 'What will the Audit show me?',
    answer: 'You will see what Margin found, why it matters, and what available evidence supports each result—including recoveries, unresolved issues, and activity that needs no further action.',
  },
  {
    question: 'Why does the Audit come first?',
    answer: 'The workspace becomes useful when there is real recovery work to manage. The Audit gives it something real to work with instead of asking you to figure out an empty pipeline yourself.',
  },
  {
    question: 'Will anything be submitted without my approval?',
    answer: 'No. The Audit is read-only, evidence-backed, and every submission remains subject to your approval.',
  },
  {
    question: 'Do I need a subscription to find out?',
    answer: 'No subscription is required to run the Audit and understand what your Amazon records actually support.',
  },
];

export default function AuditFirst() {
  usePageMeta({
    title: 'Audit First | Margin',
    description: 'Establish what is actually happening before you begin managing recovery work with Margin.',
    url: `${SITE_META.url}/onboarding-approval`,
    image: SITE_META.image,
  });

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#EAF1F5] font-sans text-[#182026]">
      <main className="relative flex min-h-screen items-center justify-center px-5 py-6 sm:px-8 sm:py-8">
        <div className="pointer-events-none absolute -right-36 -top-40 h-[520px] w-[520px] rounded-full border-[74px] border-white/45" />
        <div className="pointer-events-none absolute -bottom-56 -left-40 h-[500px] w-[500px] rounded-full border-[64px] border-[#C7DCE8]/55" />

        <section className="relative z-10 w-full max-w-[760px] rounded-[14px] bg-white/90 px-6 py-6 shadow-[0_20px_70px_rgba(50,78,96,0.12)] backdrop-blur-sm sm:px-10 sm:py-8" aria-labelledby="audit-first-title">
          <div className="max-w-[650px]">
            <p className="font-mono text-[11px] font-semibold uppercase tracking-tight text-[#0B74DE]">Audit First</p>
            <h1 id="audit-first-title" className="mt-3 font-lora text-[36px] leading-[1.03] tracking-[-0.045em] text-[#182026] sm:text-[50px]">
              Before you start managing recoveries, let&apos;s find out what needs recovering.
            </h1>
            <p className="mt-5 max-w-[610px] text-[15px] leading-6 text-[#4D5B66] sm:text-[17px] sm:leading-7">
              Your Margin workspace becomes useful once there&apos;s something real to work with. So we start with an Audit.
            </p>
            <p className="mt-3 max-w-[630px] text-[13px] leading-6 text-[#48677A] sm:text-[14px] sm:leading-6">
              Margin examines your Amazon records, reconstructs what happened, and identifies what the available evidence supports.
            </p>

            <Link to="/audit-start" className="mt-6 inline-flex min-h-11 items-center justify-center gap-2 rounded-[6px] bg-[#0B74DE] px-5 py-2.5 text-[14px] font-semibold text-white shadow-[0_12px_28px_rgba(11,116,222,0.18)] transition hover:-translate-y-px hover:bg-[#0869C9]">
              Begin Audit <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <p className="mt-3 text-[12px] leading-5 text-[#66737F]">Read-only · Evidence-backed · You approve every submission</p>
          </div>

          <div className="mt-6 border-t border-[#D8E3EA] pt-5" aria-labelledby="audit-first-faq">
            <h2 id="audit-first-faq" className="font-lora text-[23px] tracking-[-0.03em] text-[#182026]">Questions, answered.</h2>
            <div className="mt-3 divide-y divide-[#E2E9ED] border-y border-[#E2E9ED]">
              {faqs.map(({ question, answer }) => (
                <details key={question} className="group py-3">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-[14px] font-medium text-[#30343B] outline-none marker:hidden focus-visible:text-[#0B74DE]">
                    {question}
                    <ChevronDown className="h-4 w-4 shrink-0 text-[#7B909D] transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <p className="max-w-[650px] pr-8 pt-3 text-[13px] leading-6 text-[#66737F]">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
