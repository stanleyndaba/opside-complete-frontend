import { ArrowDown, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { BrandFooter } from '@/components/layout/BrandFooter';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SITE_META } from '@/config/site';

const containerClass = 'mx-auto w-full max-w-[1180px] px-5 sm:px-6 md:px-8 lg:px-10';

const steps = [
  ['01', 'Audit', 'Give Margin the Amazon records needed for your examination.'],
  ['02', "Find out what's happening", "Margin works through the records and identifies what reconciles, what doesn't, and what may support a recovery."],
  ['03', 'Review the results', 'See what Margin found, why it matters, and what evidence supports each result.'],
  ['04', 'Handle what matters', 'Where a recovery is supported, you can choose to have Margin handle it.'],
] as const;

export default function AuditFirst() {
  usePageMeta({
    title: 'Audit First | Margin',
    description: 'Establish what is actually happening before you begin managing recovery work with Margin.',
    url: `${SITE_META.url}/onboarding-approval`,
    image: SITE_META.image,
  });

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FAFAF7] font-sans text-[#182026]">
      <PublicNavbar variant="light" wide />
      <main>
        <section className="relative overflow-hidden bg-[#EAF1F5] pb-20 pt-32 sm:pb-28 sm:pt-40 lg:pb-36 lg:pt-48">
          <div className="pointer-events-none absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(37,49,58,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(37,49,58,0.05)_1px,transparent_1px)] [background-size:72px_72px]" />
          <div className="pointer-events-none absolute -right-24 -top-32 h-[480px] w-[480px] rounded-full border-[70px] border-white/45" />
          <div className="pointer-events-none absolute -bottom-48 -left-24 h-[420px] w-[420px] rounded-full border-[58px] border-[#C7DCE8]/55" />
          <div className={`${containerClass} relative`}>
            <div className="max-w-[850px]">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0B74DE]">Audit First</p>
              <h1 className="mt-5 max-w-[800px] font-lora text-[44px] leading-[1.02] tracking-[-0.05em] text-[#182026] sm:text-[62px] md:text-[76px]">
                Before you start managing recoveries, let&apos;s find out what needs recovering.
              </h1>
              <p className="mt-8 max-w-[700px] text-[17px] leading-8 text-[#4D5B66] sm:text-[20px] sm:leading-9">
                Your Margin workspace becomes useful once there&apos;s something real to work with.
              </p>
              <p className="mt-4 max-w-[700px] text-[17px] leading-8 text-[#4D5B66] sm:text-[20px] sm:leading-9">
                So we start with an Audit.
              </p>
              <p className="mt-5 max-w-[760px] text-[15px] leading-7 text-[#48677A] sm:text-[17px] sm:leading-8">
                Margin examines your Amazon records, reconstructs what happened, and identifies what the available evidence supports — including recoveries, unresolved issues, and activity that needs no further action.
              </p>
              <Link to="/audit-start" className="mt-9 inline-flex min-h-11 items-center justify-center gap-2 rounded-[6px] bg-[#0B74DE] px-5 py-3 text-[14px] font-semibold text-white shadow-[0_12px_28px_rgba(11,116,222,0.18)] transition hover:-translate-y-px hover:bg-[#0869C9]">
                Start Your Audit <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <p className="mt-4 text-[12px] leading-5 text-[#66737F]">Read-only · Evidence-backed · You approve every submission</p>
            </div>
          </div>
        </section>

        <section className="bg-white py-20 sm:py-28" aria-labelledby="what-happens-next">
          <div className={containerClass}>
            <div className="flex items-end justify-between gap-8 border-b border-[#D8E3EA] pb-6">
              <h2 id="what-happens-next" className="font-lora text-[36px] leading-[1.02] tracking-[-0.04em] text-[#182026] sm:text-[52px]">What happens next</h2>
              <ArrowDown className="mb-1 hidden h-7 w-7 text-[#0B74DE] sm:block" aria-hidden="true" />
            </div>
            <div className="mt-10 grid gap-0 md:grid-cols-2 lg:grid-cols-4">
              {steps.map(([number, title, description], index) => (
                <article key={number} className="border-t border-[#C9D8E1] py-6 lg:border-l lg:border-t-0 lg:px-6 lg:first:border-l-0 lg:first:pl-0">
                  <p className="font-mono text-[11px] font-semibold tracking-[0.12em] text-[#0B74DE]">{number} /</p>
                  <h3 className="mt-5 font-lora text-[24px] leading-tight tracking-[-0.03em] text-[#182026]">{title}</h3>
                  <p className="mt-4 text-[15px] leading-7 text-[#4D5B66]">{description}</p>
                  {index < steps.length - 1 ? <div className="mt-6 text-[#A6BBC8] lg:hidden">↓</div> : null}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#F1F5F6] py-20 sm:py-28" aria-labelledby="why-start-here">
          <div className={`${containerClass} grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20`}>
            <div>
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0B74DE]">The principle</p>
              <h2 id="why-start-here" className="mt-4 max-w-[500px] font-lora text-[36px] leading-[1.02] tracking-[-0.04em] text-[#182026] sm:text-[52px]">Why we start here</h2>
            </div>
            <div className="max-w-[700px] text-[16px] leading-8 text-[#4D5B66] sm:text-[18px]">
              <p>We don&apos;t want to put you in a workspace full of empty pipelines and things you have to figure out yourself.</p>
              <p className="mt-5 font-normal text-[#182026]"><mark className="rounded-[2px] bg-[#DDEBFF] px-1 text-[#30343B] [box-decoration-break:clone]">The Audit gives your workspace something real to work with.</mark></p>
              <p className="mt-5">Once Margin has established your recovery opportunities and the relevant work is ready, you&apos;ll get access to the recovery workflow built around your actual results.</p>
              <p className="mt-5 font-medium text-[#48677A]">No subscription required to find out.</p>
            </div>
          </div>
        </section>

        <section className="bg-[#FAFAF7] py-20 sm:py-28" aria-labelledby="audit-first-principle">
          <div className={containerClass}>
            <div className="mx-auto max-w-[820px] text-center">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-[#0B74DE]">The Margin approach</p>
              <h2 id="audit-first-principle" className="mt-5 font-lora text-[36px] leading-[1.04] tracking-[-0.04em] text-[#182026] sm:text-[56px]">We don&apos;t give you a dashboard to manage. We give you something worth managing.</h2>
              <div className="mt-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-3 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[#48677A] sm:text-[13px]">
                {['Sign up', 'Audit First', 'Real financial examination', 'Results', 'Supported recovery', 'Audit & Handle', 'Recovery Workspace'].map((item, index) => (
                  <span key={item} className="inline-flex items-center gap-3"><span className="rounded-[4px] bg-white px-3 py-2 shadow-[0_4px_14px_rgba(37,49,58,0.06)]">{item}</span>{index < 6 ? <ArrowRight className="h-3.5 w-3.5 text-[#A6BBC8]" aria-hidden="true" /> : null}</span>
                ))}
              </div>
              <Link to="/audit-start" className="mt-10 inline-flex min-h-11 items-center justify-center gap-2 rounded-[6px] bg-[#0B74DE] px-5 py-3 text-[14px] font-semibold text-white transition hover:bg-[#0869C9]">
                Start Your Audit <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <BrandFooter wide />
    </div>
  );
}
