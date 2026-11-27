import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, X } from 'lucide-react';

import { PageLayout } from '@/components/layout/PageLayout';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { BrandFooter } from '@/components/layout/BrandFooter';
import { Button } from '@/components/ui/button';
import { useTenant } from '@/contexts/TenantContext';
import { usePageMeta } from '@/hooks/usePageMeta';
import { SITE_META } from '@/config/site';
import { cn } from '@/lib/utils';

const auditSteps = [
  'Define the account, period, entity and financial question',
  'Separate supported findings from missing or unresolved evidence',
  'Establish what is accounted for, actionable or not material',
  'Determine whether further work is justified',
];

const definedWork = [
  {
    title: 'Defined Financial Investigation',
    eyebrow: 'One bounded financial question',
    summary: 'For a defined question with a clear evidence boundary.',
    body: 'Use this when the account, period, records, financial exposure and next action can be established before work begins.',
    detail: 'Margin connects the relevant records, establishes what the evidence supports, carries authorized follow-through and documents the outcome, including where no further action is justified.',
    cta: 'Discuss a Defined Investigation',
  },
  {
    title: 'Complex Financial Investigation',
    eyebrow: 'Deeper examination',
    summary: 'For financial questions that do not close cleanly.',
    body: 'Use this when records conflict, evidence is incomplete, prior provider work is difficult to verify, or reversals, offsets, related events and multiple stakeholders affect the position.',
    detail: 'Margin examines the connected history, separates supported facts from assumptions and gaps, determines what action is justified and carries the agreed work forward under a clear responsibility boundary.',
    cta: 'Discuss a Complex Investigation',
  },
  {
    title: 'Financial Control Pilot',
    eyebrow: 'Defined control engagement',
    summary: 'For recurring financial responsibility.',
    body: 'Use this when the issue is not one isolated recovery question, but a recurring need to keep exceptions, evidence, ownership, approvals and reconciliation together.',
    detail: 'The pilot establishes a repeatable operating standard with recurring examination, evidence-linked exceptions, named owners, approval boundaries, response continuity and verified outcome tracking.',
    cta: 'Discuss a Control Pilot',
  },
];

const continuingWork = [
  {
    title: 'Ongoing Financial Workspace',
    eyebrow: 'Recurring control relationship',
    summary: 'Keep established financial context together over time.',
    body: 'For businesses that need recurring investigation, evidence continuity, ownership tracking and visibility into unresolved financial work.',
    detail: 'Margin maintains the financial history, tracks open, paid, reversed and unresolved items, coordinates agreed owners and supports recurring reconciliation without taking decision authority away from your team.',
    cta: 'Discuss Ongoing Financial Control',
  },
  {
    title: 'Enterprise Control Relationship',
    eyebrow: 'Broader operating boundary',
    summary: 'Extend the Margin standard across complex operations.',
    body: 'For businesses that need one defined responsibility model across accounts, brands, entities, marketplaces and internal or external operators.',
    detail: "The scope is established around the business's financial operations, evidence requirements, reporting cadence, escalation paths and the responsibility Margin is expected to carry.",
    cta: 'Discuss an Enterprise Relationship',
  },
];

const containerClass = 'mx-auto w-full max-w-[1280px] px-5 sm:px-6 md:px-8 lg:px-10 2xl:px-12';

const reveal = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
};

function EngagementCard({
  eyebrow,
  title,
  summary,
  body,
  detail,
  cta,
  index,
  onCta,
}: {
  eyebrow: string;
  title: string;
  summary: string;
  body: string;
  detail: string;
  cta: string;
  index: number;
  onCta: (label: string) => void;
}) {
  return (
    <motion.article
      {...reveal}
      transition={{ ...reveal.transition, delay: index * 0.08 }}
      className="group flex min-h-[320px] h-full flex-col bg-white p-6 shadow-[0_1px_2px_rgba(48,52,59,0.04)] transition-colors duration-200 hover:bg-white sm:p-7 md:p-8"
    >
      <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-tight text-[#66737F]">
        <span className="h-px w-7 bg-[#F05A3C]" />
        {eyebrow}
      </div>
      <h3 className="mt-5 font-lora text-[26px] font-normal leading-tight tracking-tight text-[#30343B]">{title}</h3>
      <p className="mt-4 text-[17px] font-semibold leading-7 text-[#3F4A50]">{summary}</p>
      <p className="mt-4 text-[13px] leading-[1.5] text-[#667177] sm:text-[15px] sm:leading-7">{body}</p>
      <p className="mt-4 text-[13px] leading-[1.5] text-[#667177] sm:text-[15px] sm:leading-7">{detail}</p>
      <div className="mt-auto pt-8">
        <Button
          type="button"
          onClick={() => onCta(cta)}
          className="h-11 rounded-[7px] bg-[#F05A3C] px-4 text-left text-[13px] font-semibold text-white shadow-lg shadow-[#F05A3C]/20 hover:bg-[#D9472D] sm:min-w-[220px]"
        >
          {cta}
          <ArrowRight className="h-4 w-4 shrink-0" />
        </Button>
      </div>
    </motion.article>
  );
}

export default function PricingAdjust() {
  const navigate = useNavigate();
  const { tenantSlug } = useParams();
  const { tenant } = useTenant();
  const activeSlug = tenantSlug || tenant?.slug || (typeof window !== 'undefined' ? localStorage.getItem('active_tenant_slug') : '') || '';
  const isInAppOverlay = Boolean(tenantSlug);

  usePageMeta({
    title: 'Pricing | Engagement-based financial control | Margin',
    description: 'Margin scopes financial examination, recovery, and control work around the position established by the evidence—not software tiers or public prices.',
    url: `${SITE_META.url}/pricing`,
  });

  const handleCta = (label: string, audit = false) => {
    if (audit) {
      navigate('/audit-start');
      return;
    }
    navigate('/sales');
  };

  const closeOverlay = () => {
    if (!isInAppOverlay) {
      navigate('/');
      return;
    }
    if (typeof window !== 'undefined' && window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(`/app/${activeSlug}`);
  };

  return (
    <PageLayout title="Pricing" noPadding hideNavbar hideSidebar hideLogo plainBackground>
      <div className="pricing-page landing-google-sans security-design-page relative min-h-screen overflow-x-hidden bg-[#F7F8F7] font-sans text-[#30343B] selection:bg-[#F05A3C]/16 selection:text-[#30343B]">
        {isInAppOverlay ? (
          <div className="fixed inset-x-0 top-0 z-30 flex items-center justify-between px-5 py-4 sm:px-8">
            <Link to="/" className="rounded-full border border-[#DDE2E1] bg-white px-3 py-1.5 text-[10px] font-semibold tracking-tight text-[#66737F] shadow-sm hover:bg-[#F4F5F4]">Landing page</Link>
            <button type="button" onClick={closeOverlay} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#DDE2E1] bg-white text-[#66737F] shadow-sm hover:bg-[#F4F5F4]" aria-label="Close pricing">
              <X className="h-4 w-4" strokeWidth={1.8} />
            </button>
          </div>
        ) : (
          <PublicNavbar variant="light" />
        )}

        <main className="relative">

          <section className={isInAppOverlay ? 'relative px-5 pb-16 pt-28 sm:px-8 sm:pt-32' : 'relative px-5 pb-20 pt-32 sm:px-8 sm:pb-24 sm:pt-40'} aria-labelledby="pricing-hero-title">
            <div className={containerClass}>
              <motion.div {...reveal} className="mb-20 max-w-[900px] space-y-6 border-b border-[#E1E5E5] pb-20 md:mb-24 md:pb-24">
                <div className="flex items-center gap-2 text-[11px] font-semibold tracking-tight text-[#F05A3C]">Pricing</div>
                <h1 id="pricing-hero-title" className="font-lora text-4xl font-normal leading-[1.02] tracking-tight text-[#30343B] md:text-[72px]">Start with the financial position.</h1>
                <p className="mt-7 max-w-[720px] text-[13px] leading-[1.5] text-[#48616D] sm:text-[17px] sm:leading-8">Margin examines the records behind an Amazon financial question, establishes what the evidence supports, and helps you choose only the work that position justifies.</p>
                <p className="mt-5 max-w-[720px] text-[13px] leading-[1.5] text-[#66737F] sm:text-[16px] sm:leading-7">Scope follows the financial question, evidence required, complexity involved and responsibility Margin is asked to carry. No public price tier can define that work responsibly.</p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button type="button" onClick={() => handleCta('Start with a Position Check', true)} className="h-12 justify-between rounded-[7px] bg-[#F05A3C] px-5 text-[13px] font-semibold text-white shadow-[0_12px_28px_rgba(240,90,60,0.22)] hover:bg-[#D9472D] sm:min-w-[210px]">Start with a Position Check <ArrowRight className="h-4 w-4" /></Button>
                  <Button type="button" onClick={() => handleCta('Discuss an Engagement')} variant="outline" className="h-12 justify-between rounded-[7px] border-[#C7D5DC] bg-white px-5 text-[13px] font-semibold text-[#3F4A50] hover:bg-[#F4F5F4] sm:min-w-[190px]">Discuss an Engagement <ArrowRight className="h-4 w-4" /></Button>
                </div>
              </motion.div>

              <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.12 }} className="grid gap-4 text-[13px] leading-6 text-[#66737F] sm:grid-cols-3 sm:gap-8">
                <div><span className="font-semibold text-[#3F4A50]">Examination first.</span><br />Establish the position before deciding what work is justified.</div>
                <div><span className="font-semibold text-[#3F4A50]">Scope follows evidence.</span><br />Commercial terms reflect the work Margin takes responsibility for.</div>
                <div><span className="font-semibold text-[#3F4A50]">Decision rights stay clear.</span><br />You approve consequential actions; Margin carries agreed execution.</div>
              </motion.div>
            </div>
          </section>

          <section className="relative border-y border-[#E1E5E5] bg-white px-5 py-16 sm:px-8 sm:py-24" aria-labelledby="audit-title">
            <div className={cn(containerClass, 'grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20')}>
              <motion.div {...reveal}>
                <div className="text-[11px] font-semibold uppercase tracking-tight text-[#F05A3C]">Start with a position check</div>
                <h2 id="audit-title" className="mt-5 font-lora text-3xl font-medium leading-tight tracking-tight text-[#30343B] sm:text-[40px]">Initial Financial Position Check</h2>
                <p className="mt-5 text-[15px] font-semibold leading-6 text-[#3F4A50] sm:text-[17px] sm:leading-7">Establish whether further work is justified.</p>
                <p className="mt-5 text-[13px] leading-[1.5] text-[#667177] sm:text-[16px] sm:leading-7">Before deciding what to pursue, establish what the available records support.</p>
                <p className="mt-4 text-[13px] leading-[1.5] text-[#667177] sm:text-[16px] sm:leading-7">This limited, read-only examination defines the account, period, entity and financial question, separates supported findings from missing evidence, and identifies whether investigation, recovery, control work, no action or more evidence is justified.</p>
                <p className="mt-4 text-[13px] leading-[1.5] text-[#667177] sm:text-[16px] sm:leading-7">A clean, unsupported or incomplete result is a valid result. Any paid work is separately scoped and approved before it begins.</p>
                <div className="mt-7 flex items-center gap-3 text-[14px] font-semibold text-[#3F4A50]"><span className="h-2 w-2 rounded-full bg-[#2E7D5B]" />Complimentary position check. Read-only to begin.</div>
                <Button type="button" onClick={() => handleCta('Start with a Position Check', true)} className="mt-7 h-11 rounded-[7px] bg-[#F05A3C] px-5 text-[13px] font-semibold text-white hover:bg-[#D9472D]">Start with a Position Check <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </motion.div>
              <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.12 }} className="contact-route-panel border-y border-[#E1E5E5] bg-[#F7F8F7] p-6 sm:p-9">
                <div className="flex items-center justify-between border-b border-[#D6E0E4] pb-5"><span className="text-[13px] font-semibold tracking-tight text-[#30343B]">What the position check establishes</span><span className="text-[12px] font-medium text-[#2E7D5B]">No paid engagement required</span></div>
                <div className="mt-6 space-y-4">
                  {auditSteps.map((step, index) => <div key={step} className="flex gap-4 border-b border-[#DDE2E1] pb-4 last:border-0"><span className="font-mono text-[12px] font-semibold text-[#F05A3C]">0{index + 1}</span><span className="text-[15px] leading-6 text-[#3F5661]">{step}</span></div>)}
                </div>
              </motion.div>
            </div>
          </section>

          <section className="relative px-5 py-16 sm:px-8 sm:py-24" aria-labelledby="action-title">
            <div className={containerClass}>
              <motion.div {...reveal} className="max-w-[740px]">
                <div className="text-[11px] font-semibold uppercase tracking-tight text-[#F05A3C]">Choose the work the position justifies</div>
                <h2 id="action-title" className="mt-5 font-lora text-3xl font-medium leading-tight tracking-tight text-[#30343B] sm:text-[40px]">Commit only to the responsibility the position requires.</h2>
                <p className="mt-5 text-[13px] leading-[1.5] text-[#667177] sm:text-[17px] sm:leading-8">Paid engagements begin only after the position establishes what can be examined and what responsibility the next step requires. Margin defines the evidence boundary, deliverable, ownership, approval requirements, dependencies, timeline and fee before paid work begins.</p>
              </motion.div>
              <div className="mt-10 grid gap-5 lg:grid-cols-3">{definedWork.map((item, index) => <EngagementCard key={item.title} {...item} index={index} onCta={handleCta} />)}</div>
            </div>
          </section>

          <section className="relative border-y border-[#E1E5E5] bg-[#F4F5F4] px-5 py-16 sm:px-8 sm:py-24" aria-labelledby="continue-title">
            <div className={containerClass}>
              <motion.div {...reveal} className="max-w-[740px]">
                <div className="text-[11px] font-semibold uppercase tracking-tight text-[#F05A3C]">When the work becomes recurring</div>
                <h2 id="continue-title" className="mt-5 font-lora text-3xl font-medium leading-tight tracking-tight text-[#30343B] sm:text-[40px]">Keep established financial context together over time.</h2>
                <p className="mt-5 text-[13px] leading-[1.5] text-[#667177] sm:text-[17px] sm:leading-8">Where the responsibility repeats, Margin can establish an ongoing control relationship across evidence, actions, responses, payments, reversals, reconciliations and unresolved balances. Ongoing control is recommended only when the recurring need is demonstrated.</p>
              </motion.div>
              <div className="mt-10 grid gap-5 lg:grid-cols-2">{continuingWork.map((item, index) => <EngagementCard key={item.title} {...item} index={index} onCta={handleCta} />)}</div>
            </div>
          </section>

          <section className="relative border-y border-[#E1E5E5] bg-white px-5 py-16 text-[#30343B] sm:px-8 sm:py-24" aria-labelledby="principle-title">
            <motion.div {...reveal} className={containerClass}>
              <div className="max-w-[780px]">
                <div className="text-[11px] font-semibold uppercase tracking-tight text-[#F05A3C]">One principle across every engagement</div>
                <h2 id="principle-title" className="mt-5 font-lora text-3xl font-medium leading-tight tracking-tight text-[#30343B] sm:text-[40px]">Establish the position. Prove what is justified. Reconcile the outcome.</h2>
                <p className="mt-7 text-[13px] leading-[1.5] text-[#4D5B66] sm:text-[17px] sm:leading-8">Margin does not treat every discrepancy as a claim or every approval as recovered money.</p>
                <p className="mt-4 text-[13px] leading-[1.5] text-[#4D5B66] sm:text-[17px] sm:leading-8">We examine the available evidence, distinguish what is known from what remains unresolved, and recommend only the responsibility the position justifies.</p>
                <p className="mt-4 text-[13px] leading-[1.5] text-[#4D5B66] sm:text-[17px] sm:leading-8">No unsupported recovery promise. No undefined paid scope. No consequential action without customer approval.</p>
                <Button type="button" onClick={() => handleCta('Discuss Your Financial Position')} className="mt-8 h-12 rounded-[7px] bg-[#F05A3C] px-5 text-[13px] font-semibold text-white hover:bg-[#D9472D]">Discuss Your Financial Position <ArrowRight className="ml-2 h-4 w-4" /></Button>
                <p className="mt-4 text-[13px] leading-[1.5] text-[#66737F] sm:text-[14px] sm:leading-6">Tell us what you&apos;re trying to establish, what remains unresolved, and what your team needs help carrying through to resolution.</p>
              </div>
            </motion.div>
          </section>
        </main>

        {!isInAppOverlay ? <BrandFooter /> : null}
      </div>
    </PageLayout>
  );
}
