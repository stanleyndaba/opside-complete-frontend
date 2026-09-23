import { FormEvent, useRef, useState } from 'react';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { BrandFooter } from '@/components/layout/BrandFooter';
import { api } from '@/lib/api';

const containerClass = 'mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12';

const operatingSteps = [
  ['Investigate', 'Understand what happened across the relevant records, transactions, and events.'],
  ['Establish', 'Determine whether there is a legitimate basis for recovery and what evidence supports it.'],
  ['Pursue', 'Prepare and manage the claim, including responses, disputes, and follow-ups.'],
  ['Resolve', 'Manage the case through resolution and verify the final financial outcome.'],
] as const;

export default function EarlyAccess() {
  const emailInputRef = useRef<HTMLInputElement>(null);
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const focusEmail = () => {
    emailInputRef.current?.focus();
    emailInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      setError('Enter your email address to join early access.');
      focusEmail();
      return;
    }

    setIsSubmitting(true);
    setError('');
    try {
      const response = await api.quickJoinWaitlist({
        email: normalizedEmail,
        user_type: 'consumer',
        primary_goal: 'High-value Amazon consumer recovery claim',
        source_page: '/early-access',
      });
      if (!response.ok) {
        throw new Error('The request could not be completed.');
      }
      setSubmitted(true);
    } catch {
      setError('We could not save that email right now. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="landing-google-sans min-h-screen bg-[#FAFAF7] text-[#182026] selection:bg-[#0B74DE]/15 selection:text-[#182026]">
      <PublicNavbar variant="light" wide />
      <main>
        <section className="relative overflow-hidden border-b border-[#D8E3EA] bg-[#FAFAF7] pb-20 pt-36 sm:pb-28 sm:pt-44 lg:pb-32 lg:pt-48">
          <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(11,116,222,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(11,116,222,0.04)_1px,transparent_1px)] [background-size:72px_72px]" />
          <div className={`${containerClass} relative`}>
            <div className="max-w-[860px]">
              <p className="font-google-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0B74DE]">Consumer Recovery</p>
              <h1 className="mt-5 max-w-[900px] font-google-sans text-[44px] font-normal leading-[0.98] tracking-[-0.055em] text-[#182026] sm:text-[64px] md:text-[78px] lg:text-[92px]">
                A legitimate claim shouldn&apos;t become your responsibility to pursue.
              </h1>
              <p className="mt-8 max-w-[720px] text-[17px] leading-8 text-[#4D5B66] sm:text-[20px] sm:leading-9">
                Margin is building a recovery service for consumers with high-value financial claims.
              </p>
              <p className="mt-4 max-w-[720px] text-[17px] leading-8 text-[#4D5B66] sm:text-[20px] sm:leading-9">
                We investigate what happened, establish what you&apos;re entitled to, build the supporting evidence, and handle the recovery process on your behalf.
              </p>
              <p className="mt-5 text-[15px] font-semibold leading-7 text-[#48677A]">Starting with high-value Amazon claims.</p>
              <button type="button" onClick={focusEmail} className="mt-9 inline-flex min-h-11 items-center justify-center gap-2 rounded-[7px] bg-[#0B74DE] px-6 py-3 text-[13px] font-bold text-white shadow-[0_12px_26px_rgba(23,92,211,0.18)] transition hover:-translate-y-px hover:bg-[#095FB8]">
                Join Early Access <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
              <p className="mt-4 font-google-sans text-[13px] italic leading-6 text-[#777A82]">Early Access opens late November 2026.</p>
            </div>
          </div>
        </section>

        <section className="border-t border-[#D8E3EA] bg-white py-16 sm:py-24" aria-labelledby="work-case-title">
          <div className={containerClass}>
            <h2 id="work-case-title" className="max-w-[700px] font-google-sans text-[36px] font-normal leading-[1.02] tracking-[-0.045em] text-[#182026] sm:text-[52px]">Give us the problem. We&apos;ll work the case.</h2>
            <div className="mt-12 grid gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
              {operatingSteps.map(([title, description]) => (
                <article key={title} className="border-t border-[#C9D1D6] pt-4">
                  <h3 className="font-google-sans text-[24px] font-normal leading-tight tracking-[-0.03em] text-[#182026]">{title}</h3>
                  <p className="mt-3 text-[15px] leading-7 text-[#4D5B66]">{description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-[#D8E3EA] bg-[#F1F5F6] py-16 sm:py-24" aria-labelledby="facts-title">
          <div className={containerClass}>
            <div className="max-w-[800px]">
              <h2 id="facts-title" className="font-google-sans text-[36px] font-normal leading-[1.02] tracking-[-0.045em] text-[#182026] sm:text-[52px]">Recovery starts with establishing the facts.</h2>
              <p className="mt-6 text-[16px] leading-8 text-[#4D5B66] sm:text-[18px]">Margin does not manufacture claims or pursue cases without a legitimate basis.</p>
              <p className="mt-4 text-[16px] leading-8 text-[#4D5B66] sm:text-[18px]">We determine what happened, establish what can be supported by evidence, and pursue the appropriate resolution.</p>
              <p className="mt-7 text-[15px] font-semibold leading-7 text-[#48677A] sm:text-[17px]">Every case should end with a clear financial outcome.</p>
            </div>
          </div>
        </section>

        <section className="border-t border-[#D8E3EA] bg-[#FAFAF7] py-16 sm:py-24" aria-labelledby="engine-title">
          <div className={`${containerClass} grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:gap-20`}>
            <div>
              <p className="font-google-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0B74DE]">The foundation</p>
              <h2 id="engine-title" className="mt-4 font-google-sans text-[36px] font-normal leading-[1.02] tracking-[-0.045em] text-[#182026] sm:text-[52px]">Built from Margin&apos;s recovery engine</h2>
            </div>
            <div>
              <p className="max-w-[680px] text-[16px] leading-8 text-[#4D5B66] sm:text-[18px]">Consumer Recovery extends the same underlying capability Margin is building for businesses.</p>
              <p className="mt-8 font-google-sans text-[13px] font-semibold uppercase tracking-[0.08em] text-[#48677A] sm:text-[15px]">Event → Evidence → Entitlement → Action → Outcome → Reconciliation</p>
              <p className="mt-6 max-w-[680px] text-[15px] leading-7 text-[#66737F]">We&apos;re starting with Amazon to learn where this recovery model transfers — and where it doesn&apos;t.</p>
            </div>
          </div>
        </section>

        <section className="border-t border-[#D8E3EA] bg-white py-16 sm:py-24" aria-labelledby="early-access-title">
          <div className={`${containerClass} grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:gap-20`}>
            <div>
              <p className="font-google-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0B74DE]">Consumer Recovery</p>
              <h2 id="early-access-title" className="mt-4 font-google-sans text-[36px] font-normal leading-[1.02] tracking-[-0.045em] text-[#182026] sm:text-[52px]">Early Access · Late November 2026</h2>
              <p className="mt-5 max-w-[560px] text-[16px] leading-8 text-[#4D5B66]">Have a high-value Amazon claim you want Margin to investigate?</p>
            </div>
            <div id="early-access-form" className="rounded-[8px] border border-[#D8E3EA] bg-[#F1F5F6] p-5 shadow-[0_18px_50px_rgba(72,103,122,0.08)] sm:p-7">
              {submitted ? (
                <div className="flex items-start gap-3 text-[#182026]">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[#0B74DE]" aria-hidden="true" />
                  <div><p className="font-google-sans font-semibold">You&apos;re on the list.</p><p className="mt-1 font-google-sans text-[14px] leading-6 text-[#66737F]">We&apos;ll notify you when access opens.</p></div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
                  <label className="flex-1 font-google-sans text-[12px] font-semibold text-[#182026]">Email address<input ref={emailInputRef} type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="mt-2 h-12 w-full rounded-[7px] border border-[#CFE0EA] bg-white px-4 font-google-sans text-[14px] font-normal text-[#182026] outline-none placeholder:text-[#9AA8B2] focus:border-[#0B74DE] focus:ring-2 focus:ring-[#0B74DE]/15" /></label>
                  <button type="submit" disabled={isSubmitting} className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-[7px] bg-[#0B74DE] px-5 font-google-sans text-[13px] font-bold text-white shadow-[0_12px_26px_rgba(23,92,211,0.18)] transition hover:bg-[#095FB8] disabled:cursor-wait disabled:opacity-60">{isSubmitting ? 'Joining…' : 'Join Early Access'} <ArrowRight className="h-4 w-4" aria-hidden="true" /></button>
                </form>
              )}
              {error ? <p className="mt-3 font-google-sans text-[13px] leading-5 text-[#A73549]" role="alert">{error}</p> : null}
            </div>
          </div>
        </section>
      </main>
      <BrandFooter wide />
    </div>
  );
}
