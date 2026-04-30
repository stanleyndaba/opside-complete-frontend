import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';

import { BrandFooter } from '@/components/layout/BrandFooter';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { Button } from '@/components/ui/button';
import { SITE_META } from '@/config/site';
import { usePageMeta } from '@/hooks/usePageMeta';
import { buildYocoCheckoutUrl } from '@/lib/yocoCheckout';

const EARLY_ACCESS_CHECKOUT_URL = 'https://pay.yoco.com/r/4GIRw8';
const EARLY_ACCESS_PRICE = '$99';
const EARLY_ACCESS_SPOTS = 40;

const whatYouGet = [
  'Early access to the product.',
  'Priority onboarding.',
  'First access to setup and walkthroughs.',
  'A head start before broader public rollout.',
];

const fitPoints = [
  'Want to catch missed inbound losses.',
  'Want to move faster than the crowd.',
  'Want priority setup before full rollout.',
];

const revealProps = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
};

export default function EarlyAccess() {
  usePageMeta({
    title: 'Margin Early Access | Skip the line before public launch',
    description:
      'Get first access to Margin before public launch. Priority onboarding, founder pricing, and first access to setup before broader rollout.',
    url: `${SITE_META.url}/early-access`,
    image: SITE_META.image,
  });

  const handleReserveAccess = () => {
    if (typeof window === 'undefined') return;

    window.location.assign(
      buildYocoCheckoutUrl(EARLY_ACCESS_CHECKOUT_URL, {
        kind: 'early_access',
        offer: 'Margin Early Access',
        plan: 'Founder access',
        price: EARLY_ACCESS_PRICE,
        returnPath: '/early-access',
      }),
    );
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050505] text-white selection:bg-white/15 selection:text-white">
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
        }}
      />
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-x-0 top-0 h-[760px] bg-[radial-gradient(circle_at_18%_8%,rgba(133,170,255,0.1),transparent_40%),radial-gradient(circle_at_84%_0%,rgba(255,255,255,0.05),transparent_42%)]" />
        <div className="absolute inset-x-0 bottom-0 h-[760px] bg-[radial-gradient(circle_at_20%_100%,rgba(125,149,181,0.08),transparent_44%),radial-gradient(circle_at_76%_88%,rgba(255,255,255,0.04),transparent_48%)]" />
      </div>

      <PublicNavbar />

      <main className="relative z-10 px-4 pb-24 pt-28 md:px-6 md:pb-28 md:pt-32">
        <div className="mx-auto max-w-[1180px]">
          <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="max-w-[760px] space-y-6"
            >
              <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.035] px-3 py-1.5 text-[11px] font-medium tracking-tight text-white/72">
                <Sparkles className="h-3.5 w-3.5 text-[#8fb7ff]" />
                <span>Margin Early Access</span>
                <span className="h-1 w-1 rounded-full bg-[#8fb7ff]/80" />
                <span className="text-white/46">Founding spots only</span>
              </div>

              <div className="space-y-4">
                <h1 className="max-w-[720px] text-[42px] font-light leading-[0.94] tracking-tight text-white md:text-[72px]">
                  Skip the line. Get Margin early.
                </h1>
                <p className="max-w-[640px] text-[17px] leading-8 text-white/58 md:text-[20px] md:leading-9">
                  Margin helps Amazon sellers catch inbound shipment shortages and recover valid losses faster.
                </p>
                <p className="max-w-[620px] text-[15px] leading-7 text-white/52 md:text-[17px] md:leading-8">
                  We are opening a limited number of Early Access spots for sellers who want priority onboarding and first
                  access before public launch.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  onClick={handleReserveAccess}
                  className="h-12 rounded-[18px] border border-white/10 bg-white px-6 text-[13px] font-medium tracking-tight text-black transition hover:bg-white/92 hover:text-black"
                >
                  Reserve Early Access
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="h-12 rounded-[18px] border-white/10 bg-transparent px-6 text-[13px] font-medium tracking-tight text-white/74 hover:bg-white/[0.04] hover:text-white"
                >
                  <Link to="/waitlist">Join Public Waitlist</Link>
                </Button>
              </div>

              <div className="grid gap-3 text-[13px] text-white/48 sm:grid-cols-2">
                <div className="rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-4">
                  Checkout is processed securely by Yoco.
                </div>
                <div className="rounded-[18px] border border-white/10 bg-white/[0.03] px-4 py-4">
                  Limited to the first {EARLY_ACCESS_SPOTS} buyers only.
                </div>
              </div>
            </motion.div>

            <motion.aside
              {...revealProps}
              className="relative overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,23,31,0.95)_0%,rgba(8,8,9,0.98)_100%)] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.36)]"
            >
              <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-[#8fb7ff]/40 to-transparent" />
              <div className="relative space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-[#30445c] bg-[#10161f] px-3 py-1.5 text-[11px] font-medium tracking-tight text-[#d8e5fb]/76">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Founder offer
                </div>

                <div>
                  <div className="text-[12px] font-medium uppercase tracking-[0.16em] text-white/38">Pricing</div>
                  <div className="mt-3 text-[54px] font-light leading-none tracking-tight text-white">{EARLY_ACCESS_PRICE}</div>
                  <p className="mt-3 text-[14px] leading-6 text-white/56">
                    First access before public launch, priority onboarding, and first access to setup and walkthroughs.
                  </p>
                </div>

                <div className="rounded-[22px] border border-white/10 bg-white/[0.03] px-5 py-5">
                  <div className="flex items-center gap-3">
                    <Clock3 className="h-4 w-4 text-[#8fb7ff]" />
                    <div>
                      <div className="text-[11px] font-medium tracking-tight text-white/42">Limited spots</div>
                      <div className="mt-1 text-[16px] font-medium tracking-tight text-white">
                        First {EARLY_ACCESS_SPOTS} only
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleReserveAccess}
                  className="h-12 w-full rounded-[18px] border border-white/10 bg-white px-5 text-[13px] font-medium tracking-tight text-black transition hover:bg-white/92 hover:text-black"
                >
                  Reserve your spot now
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </motion.aside>
          </section>

          <div className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <motion.section
              {...revealProps}
              className="overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045)_0%,rgba(255,255,255,0.018)_16%,rgba(8,8,9,0.98)_100%)] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.36)] md:p-7"
            >
              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-sky-100/52">What you get</div>
              <h2 className="mt-4 max-w-[680px] text-[30px] font-light leading-[1.02] tracking-tight text-white md:text-[40px]">
                Early access is built for sellers who want a head start, not a place in a long queue.
              </h2>
              <div className="mt-8 grid gap-4 md:grid-cols-2">
                {whatYouGet.map((item) => (
                  <div
                    key={item}
                    className="rounded-[22px] border border-white/10 bg-white/[0.03] px-5 py-5"
                  >
                    <CheckCircle2 className="h-5 w-5 text-[#8fb7ff]" />
                    <p className="mt-4 text-[15px] leading-7 text-white/70">{item}</p>
                  </div>
                ))}
              </div>
            </motion.section>

            <div className="grid gap-6">
              <motion.section
                {...revealProps}
                className="overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.045)_0%,rgba(255,255,255,0.018)_16%,rgba(8,8,9,0.98)_100%)] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.36)] md:p-7"
              >
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-[#8fb7ff]" />
                  <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-sky-100/52">Who it is for</div>
                </div>
                <h2 className="mt-4 text-[28px] font-light leading-[1.02] tracking-tight text-white md:text-[34px]">
                  Amazon FBA sellers who want to move before the crowd does.
                </h2>
                <div className="mt-6 rounded-[22px] border border-white/10 bg-white/[0.03] px-5 py-5">
                  <div className="flex items-center gap-3 text-[14px] text-white/72">
                    <Search className="h-4 w-4 text-[#8fb7ff]" />
                    <span>Focused on inbound shipment shortages and valid loss recovery.</span>
                  </div>
                  <div className="mt-5 space-y-4">
                    {fitPoints.map((item) => (
                      <div key={item} className="flex gap-3 text-[14px] leading-6 text-white/58">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#8fb7ff]/80" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.section>

              <motion.section
                {...revealProps}
                className="overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(17,23,31,0.95)_0%,rgba(8,8,9,0.98)_100%)] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.36)] md:p-7"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="h-4 w-4 text-[#8fb7ff]" />
                  <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-sky-100/52">Why this exists</div>
                </div>
                <p className="mt-4 text-[15px] leading-7 text-white/62">
                  We are opening access in small batches so we can keep the experience focused and high quality. Early
                  buyers get priority and a lower founder price before the public release.
                </p>
                <div className="mt-6 rounded-[22px] border border-white/10 bg-white/[0.03] px-5 py-5 text-[14px] leading-6 text-white/58">
                  Reserve your Early Access spot now and get first access to Margin before public launch.
                </div>
              </motion.section>
            </div>
          </div>
        </div>
      </main>

      <BrandFooter />
    </div>
  );
}
