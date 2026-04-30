import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import { BrandFooter } from '@/components/layout/BrandFooter';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { Button } from '@/components/ui/button';
import { SITE_META } from '@/config/site';
import { usePageMeta } from '@/hooks/usePageMeta';
import { buildYocoCheckoutUrl } from '@/lib/yocoCheckout';

const EARLY_ACCESS_CHECKOUT_URL = 'https://pay.yoco.com/r/2JPEGa';
const EARLY_ACCESS_PRICE = '$99';
const EARLY_ACCESS_SPOTS = 100;

const offerHighlights = [
  {
    title: 'Price',
    detail: `${EARLY_ACCESS_PRICE} before broader public launch`
  },
  {
    title: 'Limited spots',
    detail: `First ${EARLY_ACCESS_SPOTS} buyers only`
  },
  {
    title: 'Priority onboarding',
    detail: 'Faster setup and walkthrough access'
  },
  {
    title: 'Recovery focus',
    detail: 'Built for missed inbound shipment losses'
  }
];

const whatYouGet = [
  {
    step: '01',
    title: 'Early access to the product',
    detail: 'Get into Margin before broader public launch and start using the recovery workflow ahead of the wider market.'
  },
  {
    step: '02',
    title: 'Priority onboarding',
    detail: 'Move through setup faster with earlier access to onboarding, walkthroughs, and first-use support.'
  },
  {
    step: '03',
    title: 'First access to setup and walkthroughs',
    detail: 'See the product early and get the operational context needed before full rollout opens wider.'
  },
  {
    step: '04',
    title: 'A head start before public launch',
    detail: 'Secure access before the broader launch cycle and avoid getting pushed into a longer public queue.'
  }
];

const fitPoints = [
  {
    step: '01',
    title: 'Catch missed inbound losses',
    detail: 'For Amazon FBA sellers who want to identify inbound shipment shortages before the loss stays buried in receiving noise.'
  },
  {
    step: '02',
    title: 'Move faster than the crowd',
    detail: 'For operators who want a head start on recovery workflow, not a place in a larger public rollout wave.'
  },
  {
    step: '03',
    title: 'Get priority setup before full rollout',
    detail: 'For sellers who want earlier onboarding and cleaner first-use support before Margin opens access more broadly.'
  }
];

const revealProps = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }
};

const containerClass = 'mx-auto w-full max-w-[1200px] px-5 sm:px-6 md:px-8';
const sectionLabelClass = 'text-[10px] font-medium uppercase tracking-[0.18em] text-sky-100/52';
const sectionHeadingClass = 'mt-4 max-w-[900px] text-[31px] font-light leading-[1.02] tracking-tight text-white sm:text-[36px] md:text-[64px]';
const sectionBodyClass = 'mt-4 max-w-[720px] text-[15px] leading-7 text-white/62 md:mt-6 md:text-[18px] md:leading-8';

export default function EarlyAccess() {
  usePageMeta({
    title: 'Margin Early Access | Skip the line before public launch',
    description:
      'Get first access to Margin before public launch. Priority onboarding, $99 early access pricing, and first access to setup before broader rollout.',
    url: `${SITE_META.url}/early-access`,
    image: SITE_META.image,
  });

  const handleReserveAccess = () => {
    if (typeof window === 'undefined') return;

    window.location.assign(
      buildYocoCheckoutUrl(EARLY_ACCESS_CHECKOUT_URL, {
        kind: 'early_access',
        offer: 'Margin Early Access',
        plan: 'Early access',
        price: EARLY_ACCESS_PRICE,
        returnPath: '/early-access',
      }),
    );
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050505] font-sans text-white selection:bg-sky-400/25 selection:text-white">
      <PublicNavbar />

      <main className="relative">
        <div
          className="pointer-events-none fixed inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")'
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_78%_8%,rgba(56,189,248,0.08),transparent_36%)]" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_90%,rgba(148,163,184,0.06),transparent_32%)]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#090909] via-[#050505] to-[#040404]" />

        <section className="relative pt-28 md:pt-40">
          <div className={containerClass}>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-[860px]"
            >
              <div className="max-w-[780px]">
                <div className={sectionLabelClass}>Margin Early Access</div>

                <h1 className="mt-5 max-w-[760px] text-[38px] font-light leading-[0.98] tracking-tight text-white sm:text-[46px] md:text-[78px]">
                  Skip the line. Get Margin early.
                </h1>

                <p className="mt-5 max-w-[640px] text-[16px] leading-7 text-white/62 md:mt-7 md:text-[19px] md:leading-8">
                  Margin helps Amazon sellers catch inbound shipment shortages and recover valid losses faster.
                </p>

                <p className="mt-4 max-w-[620px] text-[15px] leading-7 text-white/52 md:text-[17px] md:leading-8">
                  We are opening a limited number of Early Access spots for sellers who want priority onboarding and first
                  access before public launch.
                </p>

                <div className="mt-8 flex w-full max-w-[460px] flex-col gap-3 sm:flex-row sm:items-center">
                  <Button
                    type="button"
                    onClick={handleReserveAccess}
                    className="h-11 justify-between rounded-full border border-sky-300/18 bg-sky-300/[0.08] px-5 text-[13px] font-medium text-sky-50 hover:bg-sky-300/[0.13] sm:min-w-[206px] sm:justify-center md:h-12 md:px-6 md:text-sm"
                  >
                    Reserve Early Access
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>

                  <Button
                    asChild
                    variant="outline"
                    className="h-11 justify-between rounded-full border border-white/12 bg-transparent px-5 text-[13px] text-white hover:bg-white/[0.04] sm:min-w-[206px] sm:justify-center md:h-12 md:px-6 md:text-sm"
                  >
                    <Link to="/waitlist">Join Public Waitlist</Link>
                  </Button>
                </div>

                <div className="mt-5 max-w-[420px] text-[13px] leading-6 text-white/56">
                  <div>Checkout is processed securely by Yoco.</div>
                  <div>
                    Price is {EARLY_ACCESS_PRICE}. Limited to the first {EARLY_ACCESS_SPOTS} buyers.
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="relative mt-14 border-y border-white/8 bg-white/[0.02] md:mt-20">
          <div className={containerClass}>
            <div className="grid md:grid-cols-4">
              {offerHighlights.map((item, index) => (
                <motion.div
                  key={item.title}
                  {...revealProps}
                  transition={{ ...revealProps.transition, delay: index * 0.05 }}
                  className={`px-0 py-5 md:px-6 md:py-7 ${index > 0 ? 'border-t border-white/8 md:border-l md:border-t-0' : ''}`}
                >
                  <div className="text-[11px] uppercase tracking-[0.16em] text-white/34">{item.title}</div>
                  <p className="mt-2 max-w-[220px] text-[14px] leading-7 text-white/58">{item.detail}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative border-t border-white/8 py-16 md:py-32">
          <div className={containerClass}>
            <motion.div {...revealProps}>
              <div className={sectionLabelClass}>What You Get</div>
              <h2 className={sectionHeadingClass}>
                Early access is built for sellers who want a head start, not a place in a long queue.
              </h2>
              <p className={sectionBodyClass}>
                The offer is simple: get into Margin earlier, move through onboarding sooner, and see the workflow before
                broader public launch.
              </p>
            </motion.div>

            <div className="mt-10 border-t border-white/8 md:mt-16">
              {whatYouGet.map((item, index) => (
                <motion.div
                  key={item.step}
                  {...revealProps}
                  transition={{ ...revealProps.transition, delay: index * 0.04 }}
                  className="grid gap-4 border-b border-white/8 py-6 md:grid-cols-[88px_minmax(0,1fr)] md:gap-8 md:py-9"
                >
                  <div className="text-[13px] uppercase tracking-[0.16em] text-sky-100/52">{item.step}</div>
                  <div className="max-w-[800px]">
                    <h3 className="text-[22px] font-medium leading-[1.08] tracking-tight text-white md:text-[34px]">
                      {item.title}
                    </h3>
                    <p className="mt-3 max-w-[680px] text-[15px] leading-7 text-white/60 md:text-[18px] md:leading-8">
                      {item.detail}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative border-t border-white/8 bg-[#07090c] py-16 md:bg-transparent md:py-32">
          <div className={containerClass}>
            <motion.div {...revealProps}>
              <div className={sectionLabelClass}>Who It Is For</div>
              <h2 className={sectionHeadingClass}>
                Amazon FBA sellers who want to move before the crowd does.
              </h2>
              <p className={sectionBodyClass}>
                This offer is for operators who want to catch missed inbound losses, move faster, and get priority setup
                before full rollout opens wider.
              </p>
            </motion.div>

            <div className="mt-10 border-t border-white/8 md:mt-16">
              {fitPoints.map((item, index) => (
                <motion.div
                  key={item.step}
                  {...revealProps}
                  transition={{ ...revealProps.transition, delay: index * 0.04 }}
                  className="grid gap-3 border-b border-white/8 py-6 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:gap-10 md:py-8"
                >
                  <h3 className="text-[22px] font-medium leading-[1.08] tracking-tight text-white md:text-[28px]">
                    {item.title}
                  </h3>
                  <p className="max-w-[660px] text-[15px] leading-7 text-white/60 md:text-[17px] md:leading-8">
                    {item.detail}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative border-t border-white/8 py-16 md:py-32">
          <div className={containerClass}>
            <motion.div {...revealProps}>
              <div className={sectionLabelClass}>Why This Exists</div>
              <h2 className={sectionHeadingClass}>
                Access is opening in small batches so the experience stays focused and high quality.
              </h2>
              <p className={sectionBodyClass}>
                Early buyers get priority and a lower early access price before the broader public release.
              </p>
            </motion.div>

            <motion.div
              {...revealProps}
              className="mt-10 overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(5,7,10,0.98)_100%)] px-6 py-8 md:mt-14 md:px-10 md:py-12"
            >
              <div className="max-w-[820px]">
                <div className="text-[10px] uppercase tracking-[0.18em] text-white/34">Early access release</div>
                <p className="mt-5 text-[18px] leading-8 text-white/66 md:text-[24px] md:leading-10">
                  We are keeping this release small on purpose so onboarding, setup, and walkthroughs stay direct and
                  useful. Early Access is for sellers who want first entry, priority support, and the lower early access price
                  before Margin opens more broadly.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="relative border-t border-white/8 bg-[#07090c] py-16 md:bg-transparent md:py-36">
          <div className={containerClass}>
            <motion.div
              {...revealProps}
              className="overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(5,7,10,0.98)_100%)] px-6 py-8 md:px-10 md:py-12"
            >
              <div className="max-w-[900px]">
                <div className={sectionLabelClass}>Reserve Access</div>
                <h2 className="mt-4 max-w-[860px] text-[32px] font-light leading-[1.02] tracking-tight text-white sm:text-[38px] md:text-[68px]">
                  Reserve your Early Access spot now.
                </h2>
                <p className="mt-5 max-w-[720px] text-[15px] leading-7 text-white/62 md:text-[18px] md:leading-8">
                  Price is {EARLY_ACCESS_PRICE}. Spots are limited to the first {EARLY_ACCESS_SPOTS} buyers before
                  broader public launch.
                </p>
              </div>

              <div className="mt-8 flex w-full max-w-[460px] flex-col gap-3 sm:flex-row sm:items-center md:mt-10">
                <Button
                  type="button"
                  onClick={handleReserveAccess}
                  className="h-11 justify-between rounded-full border border-sky-300/18 bg-sky-300/[0.08] px-5 text-[13px] font-medium text-sky-50 hover:bg-sky-300/[0.13] sm:min-w-[206px] sm:justify-center md:h-12 md:px-6 md:text-sm"
                >
                  Reserve Early Access
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <Button
                  asChild
                  variant="outline"
                  className="h-11 justify-between rounded-full border border-white/12 bg-transparent px-5 text-[13px] text-white hover:bg-white/[0.04] sm:min-w-[206px] sm:justify-center md:h-12 md:px-6 md:text-sm"
                >
                  <Link to="/waitlist">Join Public Waitlist</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <BrandFooter />
    </div>
  );
}
