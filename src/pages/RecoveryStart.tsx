import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SITE_META } from '@/config/site';

const optionClass = 'group flex min-h-12 items-center justify-between gap-3 rounded-[10px] border border-[#D7D7D1] bg-white px-4 py-3 text-left text-[13px] font-semibold text-[#191B20] outline-none transition-colors hover:border-[#B8B9B4] hover:bg-[#FBFAF7] focus-visible:ring-2 focus-visible:ring-[#5165C7] focus-visible:ring-offset-2';
const primaryOptionClass = 'group flex min-h-12 items-center justify-between gap-3 rounded-[10px] border border-[#3F51A8] bg-[#3F51A8] px-4 py-3 text-left text-[13px] font-semibold text-white outline-none transition-colors hover:border-[#31418D] hover:bg-[#31418D] focus-visible:ring-2 focus-visible:ring-[#5165C7] focus-visible:ring-offset-2';

export default function RecoveryStart() {
  usePageMeta({
    title: 'Start Your Recovery | Margin',
    description: 'Choose how you want to begin with Margin.',
    url: `${SITE_META.url}/get-started`,
    image: SITE_META.image,
  });

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FBFAF7] font-sans text-[#191B20]">
      <header className="sticky top-0 z-50 border-b border-[#E8E7E1] bg-[#FBFAF7]/95 backdrop-blur">
        <div className="mx-auto flex min-h-12 max-w-[1280px] items-center px-4 sm:px-6 lg:px-8">
          <Link to="/" title="Margin home" className="inline-flex min-w-0 items-center gap-2.5 rounded-md px-1.5 py-2 outline-none transition-opacity hover:opacity-80 focus-visible:ring-2 focus-visible:ring-[#5165C7] focus-visible:ring-offset-2">
            <img src="/logoimagetwo.png" alt="Margin" width="20" height="20" className="h-5 w-auto object-contain" />
            <span className="font-merriweather text-[18px] font-semibold tracking-tight text-[#191B20]">Margin</span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="mx-auto max-w-3xl rounded-[14px] border border-[#E8E7E1] bg-white p-4 shadow-[0_1px_2px_rgba(25,27,32,0.05)] sm:p-8" aria-labelledby="recovery-start-title">
          <div className="max-w-2xl border-b border-[#E8E7E1] pb-5">
            <p className="mb-3 text-[12px] font-semibold text-[#595E68]">Agents Starting</p>
            <h1 id="recovery-start-title" className="font-lora text-[29px] font-normal leading-[1.08] tracking-[-0.02em] text-[#191B20] sm:text-[38px]">How would you like to begin?</h1>
            <p className="mt-3 max-w-xl text-[14px] leading-6 text-[#595E68] sm:text-[15px]">Choose the way you want Margin to start understanding your recovery work.</p>
          </div>

          <div className="mt-5 rounded-[10px] border border-[#D7D7D1] bg-[#F4F3ED] p-4 sm:p-5">
            <div className="border-b border-[#D7D7D1] pb-3">
              <h2 className="text-[15px] font-semibold text-[#191B20]">Choose your starting point</h2>
              <p className="mt-0.5 text-[12px] leading-5 text-[#595E68]">Both options begin with a read-only review. You decide what happens next.</p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Link to="/audit" className={primaryOptionClass}>
                <span><span className="block">Audit Account</span><span className="mt-1 block text-[12px] font-normal text-white/80">Connect your account for a guided review.</span></span>
                <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-white transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link to="/data-upload" className={optionClass}>
                <span><span className="block">Use Amazon Reports</span><span className="mt-1 block text-[12px] font-normal text-[#777A82]">Start with the reports you already have.</span></span>
                <ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0 text-[#3F51A8] transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>

          <p className="mt-4 text-center text-[12px] leading-5 text-[#777A82]">No technical setup is needed. Choose the records or connection that works best for you.</p>
        </section>
      </main>
    </div>
  );
}
