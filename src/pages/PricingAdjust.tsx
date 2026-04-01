import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';

import { PageLayout } from '@/components/layout/PageLayout';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { BrandFooter } from '@/components/layout/BrandFooter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SITE_META } from '@/config/site';

type PricingTier = {
  name: string;
  monthlyPrice: string;
  annualPrice: string;
  bestFor: string;
  features: string[];
  featured?: boolean;
};

const pricingTiers: PricingTier[] = [
  {
    name: 'Starter',
    monthlyPrice: '$49',
    annualPrice: '$39 / month',
    bestFor: 'New & small sellers',
    features: ['Auto-detection', 'Basic dashboard', '5 claims/mo'],
  },
  {
    name: 'Pro',
    monthlyPrice: '$99',
    annualPrice: '$79 / month',
    bestFor: 'Growing mid-size sellers',
    features: ['Unlimited auto-filing', 'Gmail/Drive matching', 'Real-time alerts', 'Priority support'],
    featured: true,
  },
  {
    name: 'Enterprise',
    monthlyPrice: '$199',
    annualPrice: '$159 / month',
    bestFor: 'Large sellers & agencies',
    features: ['Everything in Pro', 'API', 'Custom rules', '<1hr support', 'Multi-marketplace'],
  },
];

const subscriptionPromise = [
  'Pay once a month.',
  'For the first 60 days you keep 100% of everything we recover.',
  'After that you continue at the same monthly price - no commissions, no surprises, ever.',
];

export default function PricingAdjust() {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();

  usePageMeta({
    title: 'Margin Pricing | Monthly Plans, No Commissions',
    description:
      'Pay once a month. For the first 60 days you keep 100% of everything Margin recovers. After that you stay on the same monthly price with no commissions and no surprises.',
    url: `${SITE_META.url}/pricing`,
  });

  const handlePlanClick = (plan: 'starter' | 'pro') => {
    const path = tenantSlug ? `/app/${tenantSlug}/pricing/standard-agreement` : '/pricing/standard-agreement';
    navigate(`${path}?plan=${plan}`);
  };

  return (
    <PageLayout title="Pricing" noPadding hideNavbar hideSidebar hideLogo midnight>
      <div className="min-h-screen bg-[#050505] text-white relative flex flex-col items-center pt-32 md:pt-40 lg:pt-48 pb-24 overflow-hidden font-sans">
        <PublicNavbar />
        <div
          className="fixed inset-0 pointer-events-none opacity-[0.03] z-[1]"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
          }}
        />

        <div className="absolute inset-x-0 top-0 h-[32rem] bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.14),_transparent_42%),radial-gradient(circle_at_20%_20%,_rgba(16,185,129,0.12),_transparent_30%)] pointer-events-none z-[1]" />

        <div className="relative z-10 w-full max-w-6xl mx-auto flex flex-col items-center px-6 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="text-center mb-14 space-y-6"
          >
            <div className="flex flex-col items-center gap-4">
              <Badge variant="outline" className="text-[10px] font-bold uppercase border-white/10 text-white/70 px-5 py-1.5 bg-white/5 backdrop-blur-sm">
                Margin Pricing
              </Badge>
              <div className="h-px w-12 bg-white/10" />
            </div>

            <h1 className="text-4xl md:text-6xl font-light tracking-tight text-white/95 leading-tight max-w-5xl">
              Keep 100% of every recovery for your first 60 days.
            </h1>
            <p className="text-sm md:text-base text-white/45 tracking-tight max-w-3xl mx-auto leading-7">
              Pay once a month. Start with the plan that fits your seller stage, keep every recovered dollar for the first 60 days,
              and stay on the same flat monthly price after that.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-4xl rounded-[2rem] border border-white/10 bg-white/[0.04] backdrop-blur-md p-8 md:p-10 mb-14"
          >
            <div className="flex flex-col gap-4">
              <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-amber-300/80">
                Clear Monthly Billing
              </div>
              {subscriptionPromise.map((line) => (
                <p key={line} className="text-lg md:text-xl leading-relaxed text-white/88 tracking-tight">
                  {line}
                </p>
              ))}
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 w-full max-w-6xl items-stretch">
            {pricingTiers.map((tier, index) => {
              const featured = Boolean(tier.featured);
              const baseCard =
                'relative flex h-full flex-col rounded-[2rem] border p-8 transition-all duration-500 overflow-hidden';
              const cardClasses = featured
                ? `${baseCard} border-emerald-400/30 bg-emerald-500/[0.08] shadow-[0_0_60px_rgba(16,185,129,0.08)]`
                : `${baseCard} border-white/10 bg-white/[0.03]`;

              return (
                <motion.div
                  key={tier.name}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
                  className={cardClasses}
                >
                  <div className="absolute inset-x-0 top-0 h-24 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.16),_transparent_60%)] pointer-events-none" />

                  <div className="relative z-10 flex h-full flex-col">
                    <div className="mb-6 flex items-start justify-between gap-4">
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/35">Tier</div>
                        <h2 className="mt-3 text-3xl font-bold tracking-tight text-white">{tier.name}</h2>
                      </div>
                      {featured ? (
                        <Badge variant="outline" className="border-emerald-400/40 bg-emerald-400/10 text-emerald-300 text-[9px] font-bold uppercase tracking-[0.18em]">
                          Most Popular
                        </Badge>
                      ) : null}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Monthly</div>
                        <div className="mt-3 text-3xl font-light tracking-tight text-white">{tier.monthlyPrice}</div>
                        <div className="mt-2 text-[11px] text-white/40">Pay monthly</div>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Annual</div>
                        <div className="mt-3 text-2xl font-light tracking-tight text-white">{tier.annualPrice}</div>
                        <div className="mt-2 text-[11px] text-emerald-300/80">Save 20%</div>
                      </div>
                    </div>

                    <div className="mb-6 rounded-2xl border border-white/10 bg-black/20 p-4">
                      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Best For</div>
                      <div className="mt-3 text-sm font-medium text-white/85">{tier.bestFor}</div>
                    </div>

                    <div className="mb-8 flex-grow rounded-2xl border border-white/10 bg-black/20 p-5">
                      <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Key Features</div>
                      <div className="mt-4 space-y-3">
                        {tier.features.map((feature) => (
                          <div key={feature} className="flex items-start gap-3 text-sm text-white/82 leading-6">
                            <Check className={`mt-1 h-4 w-4 shrink-0 ${featured ? 'text-emerald-300' : 'text-white/45'}`} />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-auto flex flex-col gap-4">
                      {tier.name === 'Enterprise' ? (
                        <Button
                          asChild
                          variant="outline"
                          className="h-12 rounded-2xl border-white/15 bg-white text-black hover:bg-white/90 hover:text-black font-bold"
                        >
                          <a href="mailto:support@margin-finance.com?subject=Enterprise Pricing Inquiry">
                            Talk to Sales
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </a>
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handlePlanClick(tier.name === 'Starter' ? 'starter' : 'pro')}
                          className={`h-12 rounded-2xl font-bold ${
                            featured ? 'bg-emerald-500 hover:bg-emerald-400 text-white' : 'bg-white hover:bg-white/90 text-black'
                          }`}
                        >
                          Choose {tier.name}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      )}

                      <p className="text-[11px] leading-5 text-white/42">
                        First 60 days: keep 100% of what we recover. After that: same flat monthly subscription, no commissions.
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          <section className="w-full max-w-6xl mt-16 rounded-[2rem] border border-white/10 bg-white/[0.03] p-8 md:p-10">
            <div className="grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end">
              <div className="space-y-4">
                <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/35">How Margin Bills</div>
                <h3 className="text-2xl md:text-3xl font-light tracking-tight text-white">
                  No commissions, no recovery cuts, no surprise percentage fees.
                </h3>
                <p className="text-sm md:text-base leading-7 text-white/55 max-w-3xl">
                  Margin is now a flat monthly software subscription. You pay once a month, keep 100% of recovered funds for the first 60 days,
                  and continue on the same plan after that. The price does not switch into a commission model later.
                </p>
              </div>
              <div className="rounded-[1.5rem] border border-white/10 bg-black/25 p-6">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/35">Included Across Plans</div>
                <div className="mt-4 space-y-3 text-sm text-white/78">
                  <div className="flex items-start gap-3">
                    <Check className="mt-1 h-4 w-4 text-white/45 shrink-0" />
                    <span>Monthly billing with a fixed software price</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="mt-1 h-4 w-4 text-white/45 shrink-0" />
                    <span>60-day keep-100% recovery window for every new account</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="mt-1 h-4 w-4 text-white/45 shrink-0" />
                    <span>No commissions, no per-recovery billing, no surprise overages</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="w-full mt-24 relative z-10">
          <BrandFooter />
        </div>
      </div>
    </PageLayout>
  );
}
