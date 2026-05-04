import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight, PlayCircle } from 'lucide-react';

import { BrandFooter } from '@/components/layout/BrandFooter';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { SITE_META } from '@/config/site';
import { usePageMeta } from '@/hooks/usePageMeta';
import { api } from '@/lib/api';

const EARLY_ACCESS_CHECKOUT_URL = 'https://www.paypal.com/ncp/payment/P4XPE6PAPWT56';
const EARLY_ACCESS_PRICE = '$99';
const DEMO_VIDEO_URL = 'https://youtu.be/5-eks76pOeo';
const DEMO_VIDEO_THUMBNAIL_URL = '/Demo2.png';

const offerHighlights = [
  {
    title: 'Price',
    detail: `${EARLY_ACCESS_PRICE} launch pricing during Managed Early Access`
  },
  {
    title: 'Priority cohort',
    detail: 'Opened in small managed batches during launch'
  },
  {
    title: 'Priority onboarding',
    detail: 'Workspace preparation before read-only setup begins'
  },
  {
    title: 'Broad coverage',
    detail: 'Recovery review across inventory, shipments, returns, fees, and payouts'
  }
];

const whatYouGet = [
  {
    step: '01',
    title: 'Founding 100 reservation',
    detail: 'Secure a place in the managed launch cohort before Margin opens the workflow to a wider group of sellers.'
  },
  {
    step: '02',
    title: 'Managed read-only setup',
    detail: 'Move through guided onboarding with a read-only setup path before recovery review begins.'
  },
  {
    step: '03',
    title: 'Evidence-backed first review',
    detail: 'Margin reviews recovery signals, support, and case readiness before anything is treated as filing-ready.'
  },
  {
    step: '04',
    title: 'Guided filing workflow',
    detail: 'Supportable cases are reviewed with you first, then moved through the filing workflow with approval and context.'
  }
];

const fitPoints = [
  {
    step: '01',
    title: 'Serious FBA sellers with recovery leakage',
    detail: 'For operators who want missed recovery opportunities surfaced before timing, evidence, or Amazon case state becomes a problem.'
  },
  {
    step: '02',
    title: 'Operators who want proof before filing',
    detail: 'For sellers who care about evidence quality, duplicate prevention, and avoiding weak reimbursement claims.'
  },
  {
    step: '03',
    title: 'Founding members who want guided support',
    detail: 'For sellers who want a founder-led first recovery cycle instead of a black-box tool or unsupported dashboard.'
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
  const { toast } = useToast();
  const [earlyAccessEmail, setEarlyAccessEmail] = useState('');
  const [isReserving, setIsReserving] = useState(false);

  usePageMeta({
    title: 'Margin Managed Early Access | Founding 100 Recovery Cohort',
    description:
      'Reserve Managed Early Access to Margin with guided onboarding, read-only setup, evidence-backed recovery review, and $99 launch pricing.',
    url: `${SITE_META.url}/early-access`,
    image: SITE_META.image,
  });

  const handleReserveEarlyAccess = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const email = earlyAccessEmail.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({
        title: 'Work email required',
        description: 'Add the email we should use for Early Access onboarding and setup updates.',
        variant: 'destructive',
      });
      return;
    }

    setIsReserving(true);
    try {
      const response = await api.reserveEarlyAccess({
        email,
        source_page: '/early-access',
        offer: 'Margin Early Access',
        price: EARLY_ACCESS_PRICE,
        intent: 'reserve_early_access',
      });

      if (!response.ok) {
        toast({
          title: 'Could not secure details',
          description: response.error || 'Please try again before checkout so onboarding can stay matched to your email.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Details secured',
        description: 'Redirecting you to PayPal to finish the Managed Early Access reservation.',
      });

      window.location.href = EARLY_ACCESS_CHECKOUT_URL;
    } catch {
      toast({
        title: 'Network issue',
        description: 'We could not save your onboarding details before checkout. Please try again in a moment.',
        variant: 'destructive',
      });
    } finally {
      setIsReserving(false);
    }
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
                <div className={sectionLabelClass}>Managed Early Access</div>

                <h1 className="mt-5 max-w-[760px] text-[38px] font-light leading-[0.98] tracking-tight text-white sm:text-[46px] md:text-[78px]">
                  Join the Founding 100 recovery cohort.
                </h1>

                <p className="mt-5 max-w-[640px] text-[16px] leading-7 text-white/62 md:mt-7 md:text-[19px] md:leading-8">
                  Reserve managed access to Margin&apos;s read-only recovery workflow, evidence-backed case preparation, and guided first recovery cycle.
                </p>

                <p className="mt-4 max-w-[620px] text-[15px] leading-7 text-white/52 md:text-[17px] md:leading-8">
                  Access opens in small batches so each workspace can be prepared carefully before onboarding begins.
                </p>

                <form onSubmit={handleReserveEarlyAccess} className="mt-8 w-full max-w-[540px]">
                  <Label htmlFor="early-access-email" className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/40">
                    Work email for onboarding
                  </Label>
                  <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                    <Input
                      id="early-access-email"
                      type="email"
                      value={earlyAccessEmail}
                      onChange={(event) => setEarlyAccessEmail(event.target.value)}
                      placeholder="you@company.com"
                      className="h-12 rounded-full border-white/10 bg-white/[0.035] px-5 text-sm text-white placeholder:text-white/30 focus-visible:ring-sky-200/20"
                      autoComplete="email"
                    />
                    <Button
                      type="submit"
                      disabled={isReserving}
                      className="h-12 shrink-0 justify-center rounded-full border border-sky-300/18 bg-sky-300/[0.08] px-5 text-[13px] font-medium text-sky-50 hover:bg-sky-300/[0.13] disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[206px] md:px-6 md:text-sm"
                    >
                      {isReserving ? 'Securing...' : 'Reserve Early Access'}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                  <p className="mt-3 text-[12px] leading-6 text-white/42">
                    We use this email for setup updates, cohort communication, and your onboarding invitation.
                  </p>

                  <div className="mt-3">
                    <Button
                      asChild
                      variant="outline"
                      className="h-11 justify-center rounded-full border border-white/12 bg-transparent px-5 text-[13px] text-white hover:bg-white/[0.04] sm:min-w-[206px] md:h-12 md:px-6 md:text-sm"
                    >
                      <Link to="/waitlist">Join Public Waitlist</Link>
                    </Button>
                  </div>
                </form>

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

        <section className="relative py-12 md:py-20">
          <div className={containerClass}>
            <motion.div {...revealProps} className="mx-auto mb-7 max-w-[880px] text-center md:mb-10">
              <div className={sectionLabelClass}>See Demo</div>
              <h2 className="mt-4 text-[28px] font-light leading-[1.05] tracking-tight text-white sm:text-[36px] md:text-[54px]">
                See how Margin finds, prepares, and tracks recovery cases for a seller doing $200K/month.
              </h2>
            </motion.div>

            <motion.a
              href={DEMO_VIDEO_URL}
              target="_blank"
              rel="noreferrer"
              {...revealProps}
              className="group mx-auto block w-full max-w-[1120px] overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.025] shadow-[0_36px_120px_rgba(0,0,0,0.42)] transition-colors hover:border-white/18 hover:bg-white/[0.035] md:rounded-[42px]"
              aria-label="Watch the Margin product demo on YouTube"
            >
              <div className="relative aspect-video overflow-hidden bg-[#0b0b0b]">
                <img
                  src={DEMO_VIDEO_THUMBNAIL_URL}
                  alt="Margin product demo thumbnail"
                  className="h-full w-full object-cover opacity-78 saturate-[0.92] transition duration-500 group-hover:scale-[1.015] group-hover:opacity-88"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.14),transparent_40%),linear-gradient(180deg,rgba(0,0,0,0.02)_0%,rgba(0,0,0,0.64)_100%)]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/22 bg-black/50 text-white shadow-[0_22px_54px_rgba(0,0,0,0.42)] backdrop-blur transition group-hover:scale-105 group-hover:bg-black/60 md:h-20 md:w-20">
                    <PlayCircle className="h-8 w-8 md:h-10 md:w-10" strokeWidth={1.6} />
                  </div>
                </div>
                <div className="absolute bottom-5 left-5 right-5 md:bottom-8 md:left-8 md:right-8">
                  <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-sky-100/64 md:text-[11px]">Product walkthrough</div>
                  <div className="mt-2 max-w-[760px] text-[20px] font-medium leading-tight tracking-tight text-white md:text-[34px]">
                    Watch how Margin turns raw FBA activity into evidence-backed recovery work.
                  </div>
                </div>
              </div>
            </motion.a>
          </div>
        </section>

        <section className="relative border-t border-white/8 py-16 md:py-32">
          <div className={containerClass}>
            <motion.div {...revealProps}>
              <div className={sectionLabelClass}>What You Get</div>
              <h2 className={sectionHeadingClass}>
                Early access is built for sellers who want a guided first recovery cycle.
              </h2>
              <p className={sectionBodyClass}>
                The offer is simple: reserve your place, move through managed setup, and review evidence-backed recovery work before broader public launch.
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
                Amazon FBA sellers who want recovery work handled carefully.
              </h2>
              <p className={sectionBodyClass}>
                This offer is for operators who want broader recovery coverage, seller-controlled filing, and stronger evidence before cases move.
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
                Early Access is managed because recovery work depends on accurate setup.
              </h2>
              <p className={sectionBodyClass}>
                Margin opens in controlled cohorts so read-only setup, workspace preparation, and first review quality stay tight.
              </p>
            </motion.div>

            <motion.div
              {...revealProps}
              className="mt-10 overflow-hidden rounded-[30px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(5,7,10,0.98)_100%)] px-6 py-8 md:mt-14 md:px-10 md:py-12"
            >
              <div className="max-w-[820px]">
                <div className="text-[10px] uppercase tracking-[0.18em] text-white/34">Priority launch cohort</div>
                <p className="mt-5 text-[18px] leading-8 text-white/66 md:text-[24px] md:leading-10">
                  We&apos;re keeping launch access controlled on purpose so onboarding, setup, and recovery review stay direct and useful.
                  Early Access is for sellers who want a safer first cycle while Margin opens in stages.
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
                <div className={sectionLabelClass}>Join The Cohort</div>
                <h2 className="mt-4 max-w-[860px] text-[32px] font-light leading-[1.02] tracking-tight text-white sm:text-[38px] md:text-[68px]">
                  Join Margin&apos;s Founding 100 cohort.
                </h2>
                <p className="mt-5 max-w-[720px] text-[15px] leading-7 text-white/62 md:text-[18px] md:leading-8">
                  Access opens in small batches so setup, workspace preparation, and onboarding stay focused.
                </p>
              </div>

              <form onSubmit={handleReserveEarlyAccess} className="mt-8 w-full max-w-[560px] md:mt-10">
                <Label htmlFor="early-access-email-bottom" className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/40">
                  Work email for onboarding
                </Label>
                <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                  <Input
                    id="early-access-email-bottom"
                    type="email"
                    value={earlyAccessEmail}
                    onChange={(event) => setEarlyAccessEmail(event.target.value)}
                    placeholder="you@company.com"
                    className="h-12 rounded-full border-white/10 bg-white/[0.035] px-5 text-sm text-white placeholder:text-white/30 focus-visible:ring-sky-200/20"
                    autoComplete="email"
                  />
                  <Button
                    type="submit"
                    disabled={isReserving}
                    className="h-12 shrink-0 justify-center rounded-full border border-sky-300/18 bg-sky-300/[0.08] px-5 text-[13px] font-medium text-sky-50 hover:bg-sky-300/[0.13] disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-[206px] md:px-6 md:text-sm"
                  >
                    {isReserving ? 'Securing...' : 'Reserve Early Access'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-3">
                  <p className="mb-3 text-[12px] leading-6 text-white/42">
                    We prepare Early Access workspaces carefully before your onboarding invitation is sent.
                  </p>
                  <Button
                    asChild
                    variant="outline"
                    className="h-11 justify-center rounded-full border border-white/12 bg-transparent px-5 text-[13px] text-white hover:bg-white/[0.04] sm:min-w-[206px] md:h-12 md:px-6 md:text-sm"
                  >
                    <Link to="/waitlist">Join Public Waitlist</Link>
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        </section>
      </main>

      <BrandFooter />
    </div>
  );
}
