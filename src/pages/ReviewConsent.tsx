import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SITE_META } from '@/config/site';
import { ReviewJourneyVisual } from '@/components/landing/ReviewJourneyVisual';

const reviewSections = [
  {
    title: 'What Margin will do',
    body: 'Examine the Amazon records you provide, analyze relevant financial activity, identify and assess exceptions, and prepare a documented review of the findings. If additional information is needed, Margin may request read-only Amazon SP-API access for the specific review scope.',
  },
  {
    title: 'How your information will be used',
    body: (
      <>
        Your records will be processed to conduct the requested review in accordance with Margin&apos;s{' '}
        <Link to="/privacy" className="text-[#0B74DE] underline underline-offset-2 hover:text-[#075EBA]">Privacy Policy</Link>.
        Access should be limited to what is necessary for the review and its delivery.
      </>
    ),
  },
  {
    title: 'You remain in control',
    body: 'The initial review uses the records you provide. Accounting software access is not assumed or required for every review. Any additional access—including read-only Amazon SP-API access—and any recovery authorization remain under your control. No recovery claim will be submitted without your approval.',
  },
  {
    title: 'What happens next',
    body: 'Margin examines the available records and reports what could be established, what requires further investigation, and whether the evidence supports a recovery opportunity. A review does not guarantee that recoverable value exists.',
  },
];

export default function ReviewConsent() {
  const navigate = useNavigate();
  const [understood, setUnderstood] = useState(false);

  usePageMeta({
    title: 'Before We Examine Your Records | Margin',
    description: 'Review how Margin uses Amazon financial records before beginning a financial review.',
    url: `${SITE_META.url}/review-consent`,
    image: SITE_META.image,
  });

  return (
    <div className="min-h-screen overflow-x-hidden bg-white font-google-sans text-[#182026]">
      <main className="mx-auto min-h-screen w-full max-w-[860px] px-5 py-5 sm:px-8 sm:py-7 lg:px-10">
        <header className="flex items-center justify-between pb-2">
          <Link to="/" className="brand-wordmark font-merriweather text-[17px] font-semibold tracking-tight text-[#30343B] hover:text-[#0B74DE]">Margin</Link>
          <Link to="/" className="inline-flex h-9 items-center justify-center rounded-[5px] bg-[#0B74DE] px-4 text-[13px] font-semibold text-white transition-colors hover:bg-[#075EBA]">Back</Link>
        </header>

        <div className="max-w-[700px] pt-7 sm:pt-9"><ReviewJourneyVisual kind="consent" /></div>

        <section className="max-w-[700px] pb-6" aria-labelledby="review-consent-title">
          <h1 id="review-consent-title" className="max-w-[680px] text-[34px] font-bold leading-[1.08] tracking-tight text-[#30343B] sm:text-[50px]">Before we examine your records</h1>
          <p className="mt-4 max-w-[650px] text-[15px] leading-6.5 text-[#595E68] sm:text-[16px] sm:leading-7">Margin reviews your Amazon financial records to establish what has been accounted for, identify material discrepancies, and determine whether further investigation or recovery action is justified.</p>
          <p className="mt-3 max-w-[650px] text-[15px] leading-6.5 text-[#595E68] sm:text-[16px] sm:leading-7">Before continuing, please understand how your information will be used and what this review authorizes.</p>
          <div className="mt-5 max-w-[650px] rounded-[8px] border border-[#D8E2E8] bg-[#F7FAFC] p-4 sm:p-5">
            <p className="text-[14px] font-semibold leading-5 text-[#30343B]">Want to see exactly what access may be needed?</p>
            <p className="mt-1.5 text-[13px] leading-5.5 text-[#595E68]">Review the Amazon access scope before you continue. You can still begin with the records you already have; if the picture is incomplete, Margin will explain what additional files or narrowly scoped read-only access would help.</p>
            <Link to="/access-scope" className="mt-3 inline-flex h-9 items-center justify-center gap-1.5 rounded-[5px] bg-white px-3.5 text-[13px] font-semibold text-[#0B74DE] shadow-[inset_0_0_0_1px_#B9D4E5] transition-colors hover:bg-[#EFF7FC]">Review Amazon access scope <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /></Link>
          </div>
        </section>

        <section className="max-w-[700px]" aria-label="Review terms">
          {reviewSections.map((section) => (
            <div key={section.title} className="py-3.5 sm:py-4">
              <h2 className="text-[16px] font-bold tracking-tight text-[#30343B] sm:text-[18px]">{section.title}</h2>
              <p className="mt-1.5 text-[14px] leading-6 text-[#595E68] sm:text-[15px] sm:leading-6.5">{section.body}</p>
            </div>
          ))}
        </section>

        <section className="max-w-[700px] pb-6 pt-4 sm:pt-5" aria-label="Consent">
          <label className="flex cursor-pointer items-start gap-3 text-[14px] leading-6 text-[#30343B]">
            <input
              type="checkbox"
              checked={understood}
              onChange={(event) => setUnderstood(event.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 accent-[#0B74DE]"
            />
            <span>I have read and understood the review terms and the <Link to="/privacy" className="text-[#0B74DE] underline underline-offset-2 hover:text-[#075EBA]">Privacy Policy</Link>.</span>
          </label>
          <button
            type="button"
            disabled={!understood}
            onClick={() => navigate('/audit-start')}
            className="mt-6 h-11 w-full rounded-[5px] bg-[#0B74DE] px-5 text-[14px] font-semibold text-white transition-colors hover:bg-[#075EBA] disabled:cursor-not-allowed disabled:bg-[#C8D6DF] sm:w-auto"
          >
            Agree and continue
          </button>
          <p className="mt-4 max-w-[620px] text-[12px] leading-5 text-[#777A82]">By continuing, you acknowledge the terms for this review. See the <Link to="/privacy" className="text-[#0B74DE] underline underline-offset-2 hover:text-[#075EBA]">Privacy Policy</Link> and <Link to="/terms" className="text-[#0B74DE] underline underline-offset-2 hover:text-[#075EBA]">Terms of Service</Link> for full details.</p>
        </section>
      </main>
    </div>
  );
}
