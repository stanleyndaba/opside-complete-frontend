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
  'Identify discrepancies and potential recovery opportunities',
  'Separate supported findings from unresolved questions',
  'Understand evidence gaps and the work required to address them',
  'Establish the appropriate next step',
];

const definedWork = [
  {
    title: 'Defined Recovery',
    eyebrow: 'Bounded recovery work',
    summary: 'Resolve a clearly bounded financial problem.',
    body: 'For a defined set of discrepancies or a specific recovery operation where the records, evidence requirements, and scope of work can be established.',
    detail: 'Margin investigates the agreed scope, determines what the evidence supports, and manages authorized recovery work through to its documented outcome.',
    cta: 'Discuss a Defined Recovery',
  },
  {
    title: 'Complex Financial Investigation',
    eyebrow: 'Deeper examination',
    summary: 'For cases that require deeper examination.',
    body: 'Some financial discrepancies cannot be resolved through a straightforward claim process. They may involve conflicting records, incomplete evidence, multiple related events, prior decisions, reversals, or unresolved financial outcomes.',
    detail: 'Margin undertakes a deeper examination to establish the position, determine what action is justified, and carry the agreed work forward.',
    cta: 'Discuss a Complex Investigation',
  },
  {
    title: 'Financial Control Pilot',
    eyebrow: 'Defined control engagement',
    summary: 'Establish a stronger financial control process.',
    body: 'For businesses that need more than a one-time recovery operation.',
    detail: 'Over a defined engagement, Margin examines the relevant financial workflow, establishes the current position, and demonstrates how evidence-backed investigation, controlled action, and reconciliation can operate together. The pilot is scoped around the records, operational requirements, and outcomes agreed at the outset.',
    cta: 'Discuss a Control Pilot',
  },
];

const continuingWork = [
  {
    title: 'Recovery Workspace',
    eyebrow: 'Ongoing recovery operations',
    summary: 'Keep the financial position under examination.',
    body: 'For businesses that need ongoing investigation, recovery follow-through, and visibility into unresolved financial issues.',
    detail: 'Margin connects relevant records, maintains evidence-backed cases, tracks authorized actions, and follows financial outcomes through to reconciliation. Your team retains decision authority. Margin takes on the agreed investigative and recovery work.',
    cta: 'Discuss Ongoing Recovery Operations',
  },
  {
    title: 'Enterprise Control Program',
    eyebrow: 'Complex operating relationship',
    summary: 'For complex, multi-account, or ongoing financial operations.',
    body: 'For businesses that need a defined operating relationship with Margin across larger or more complex financial workloads.',
    detail: "Engagements may cover multiple accounts or brands, broader record requirements, complex investigations, recurring recovery operations, and tailored control and reporting requirements. The scope is established around the business's financial operations and the responsibility Margin is expected to take on.",
    cta: 'Discuss an Enterprise Engagement',
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
      <div className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#7A858A]">
        <span className="h-px w-7 bg-[#635BFF]" />
        {eyebrow}
      </div>
      <h3 className="mt-5 font-lora text-[26px] font-normal leading-tight tracking-[-0.04em] text-[#30343B]">{title}</h3>
      <p className="mt-4 text-[17px] font-semibold leading-7 text-[#3F4A50]">{summary}</p>
      <p className="mt-4 text-[15px] leading-7 text-[#667177]">{body}</p>
      <p className="mt-4 text-[15px] leading-7 text-[#667177]">{detail}</p>
      <div className="mt-auto pt-8">
        <Button
          type="button"
          onClick={() => onCta(cta)}
          className="h-11 rounded-[7px] bg-[#635BFF] px-4 text-left text-[13px] font-semibold text-white shadow-lg shadow-[#635BFF]/20 hover:bg-[#5148E5] sm:min-w-[220px]"
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
      <div className="pricing-page landing-google-sans security-design-page relative min-h-screen overflow-x-hidden bg-[#F7F8F7] font-sans text-[#30343B] selection:bg-[#635BFF]/16 selection:text-[#30343B]">
        {isInAppOverlay ? (
          <div className="fixed inset-x-0 top-0 z-30 flex items-center justify-between px-5 py-4 sm:px-8">
            <Link to="/" className="rounded-full border border-[#DDE2E1] bg-white px-3 py-1.5 text-[10px] font-semibold tracking-tight text-[#7A858A] shadow-sm hover:bg-[#F4F5F4]">Landing page</Link>
            <button type="button" onClick={closeOverlay} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#DDE2E1] bg-white text-[#7A858A] shadow-sm hover:bg-[#F4F5F4]" aria-label="Close pricing">
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
                <div className="flex items-center gap-2 text-[11px] font-semibold tracking-tight text-[#635BFF]">Pricing</div>
                <h1 id="pricing-hero-title" className="font-lora text-4xl font-normal leading-[1.02] tracking-[-0.055em] text-[#30343B] md:text-[72px]">Start with the financial position.</h1>
                <p className="mt-7 max-w-[720px] text-[18px] leading-8 text-[#48616D] sm:text-[21px] sm:leading-9">Margin examines what happened to the money, establishes what the evidence supports, and carries authorized recovery work through to financial reconciliation.</p>
                <p className="mt-5 max-w-[720px] text-[16px] leading-7 text-[#7A858A] sm:text-[18px] sm:leading-8">Every engagement is scoped to the work required, the complexity of the financial position, and the responsibility Margin takes on.</p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button type="button" onClick={() => handleCta('Request a Recovery Audit', true)} className="h-12 justify-between rounded-[7px] bg-[#635BFF] px-5 text-[13px] font-semibold text-white shadow-[0_12px_28px_rgba(79,70,229,0.18)] hover:bg-[#5148E5] sm:min-w-[210px]">Request a Recovery Audit <ArrowRight className="h-4 w-4" /></Button>
                  <Button type="button" onClick={() => handleCta('Discuss an Engagement')} variant="outline" className="h-12 justify-between rounded-[7px] border-[#C7D5DC] bg-white px-5 text-[13px] font-semibold text-[#3F4A50] hover:bg-[#F4F5F4] sm:min-w-[190px]">Discuss an Engagement <ArrowRight className="h-4 w-4" /></Button>
                </div>
              </motion.div>

              <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.12 }} className="grid gap-4 text-[13px] leading-6 text-[#7A858A] sm:grid-cols-3 sm:gap-8">
                <div><span className="font-semibold text-[#3F4A50]">Examination first.</span><br />Establish the position before deciding what work is justified.</div>
                <div><span className="font-semibold text-[#3F4A50]">Scope follows evidence.</span><br />Commercial terms reflect the work Margin takes responsibility for.</div>
                <div><span className="font-semibold text-[#3F4A50]">Decision rights stay clear.</span><br />You approve consequential actions; Margin carries agreed execution.</div>
              </motion.div>
            </div>
          </section>

          <section className="relative border-y border-[#E1E5E5] bg-white px-5 py-16 sm:px-8 sm:py-24" aria-labelledby="audit-title">
            <div className={cn(containerClass, 'grid gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20')}>
              <motion.div {...reveal}>
                <div className="text-[12px] font-semibold tracking-tight text-[#635BFF]">Start with an examination</div>
                <h2 id="audit-title" className="mt-5 font-lora text-3xl font-medium leading-tight tracking-tight text-[#30343B] sm:text-[40px]">Recovery Audit</h2>
                <p className="mt-5 text-[20px] font-semibold leading-7 text-[#3F4A50]">Establish what the records support.</p>
                <p className="mt-5 text-[16px] leading-8 text-[#667177]">Before deciding what to recover, establish what has happened.</p>
                <p className="mt-4 text-[16px] leading-8 text-[#667177]">Margin examines the available Amazon financial and operational records to identify what is accounted for, what remains unresolved, what the evidence supports, and where further action may be warranted.</p>
                <p className="mt-4 text-[16px] leading-8 text-[#667177]">You&apos;ll receive a clearer financial position and a basis for deciding what needs attention next.</p>
                <div className="mt-7 flex items-center gap-3 text-[14px] font-semibold text-[#3F4A50]"><span className="h-2 w-2 rounded-full bg-[#2E7D5B]" />Initial examination: complimentary.</div>
                <Button type="button" onClick={() => handleCta('Request a Recovery Audit', true)} className="mt-7 h-11 rounded-[7px] bg-[#30343B] px-5 text-[13px] font-semibold text-white hover:bg-[#3F4A50]">Request a Recovery Audit <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </motion.div>
              <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.12 }} className="contact-route-panel border-y border-[#E1E5E5] bg-[#F7F8F7] p-6 sm:p-9">
                <div className="flex items-center justify-between border-b border-[#D6E0E4] pb-5"><span className="text-[13px] font-semibold tracking-tight text-[#30343B]">What the examination establishes</span><span className="text-[12px] font-medium text-[#2E7D5B]">No payment required</span></div>
                <div className="mt-6 space-y-4">
                  {auditSteps.map((step, index) => <div key={step} className="flex gap-4 border-b border-[#DDE2E1] pb-4 last:border-0"><span className="font-mono text-[12px] font-semibold text-[#635BFF]">0{index + 1}</span><span className="text-[15px] leading-6 text-[#3F5661]">{step}</span></div>)}
                </div>
              </motion.div>
            </div>
          </section>

          <section className="relative px-5 py-16 sm:px-8 sm:py-24" aria-labelledby="action-title">
            <div className={containerClass}>
              <motion.div {...reveal} className="max-w-[740px]">
                <div className="text-[12px] font-semibold tracking-tight text-[#635BFF]">When the position requires action</div>
                <h2 id="action-title" className="mt-5 font-lora text-3xl font-medium leading-tight tracking-tight text-[#30343B] sm:text-[40px]">Defined work, scoped to the position.</h2>
                <p className="mt-5 text-[18px] leading-8 text-[#667177]">Paid engagements begin after the financial examination establishes what the records support and what responsibility the work requires.</p>
              </motion.div>
              <div className="mt-10 grid gap-5 lg:grid-cols-3">{definedWork.map((item, index) => <EngagementCard key={item.title} {...item} index={index} onCta={handleCta} />)}</div>
            </div>
          </section>

          <section className="relative border-y border-[#E1E5E5] bg-[#F4F5F4] px-5 py-16 sm:px-8 sm:py-24" aria-labelledby="continue-title">
            <div className={containerClass}>
              <motion.div {...reveal} className="max-w-[740px]">
                <div className="text-[12px] font-semibold tracking-tight text-[#635BFF]">When financial control needs to continue</div>
                <h2 id="continue-title" className="mt-5 font-lora text-3xl font-medium leading-tight tracking-tight text-[#30343B] sm:text-[40px]">Keep the financial position under examination.</h2>
                <p className="mt-5 text-[18px] leading-8 text-[#667177]">For businesses that need ongoing investigation, recovery follow-through, and a defined operating relationship with Margin.</p>
              </motion.div>
              <div className="mt-10 grid gap-5 lg:grid-cols-2">{continuingWork.map((item, index) => <EngagementCard key={item.title} {...item} index={index} onCta={handleCta} />)}</div>
            </div>
          </section>

          <section className="relative bg-[#30343B] px-5 py-16 text-white sm:px-8 sm:py-24" aria-labelledby="principle-title">
            <motion.div {...reveal} className={containerClass}>
              <div className="max-w-[780px]">
                <div className="text-[12px] font-semibold tracking-tight text-[#A5B4FC]">One principle across every engagement</div>
                <h2 id="principle-title" className="mt-5 font-lora text-3xl font-medium leading-tight tracking-tight text-white sm:text-[40px]">Establish the position. Prove what is justified. Reconcile the outcome.</h2>
                <p className="mt-7 text-[17px] leading-8 text-[#D5E0E4]">Margin does not treat every discrepancy as a claim or every approval as recovered money.</p>
                <p className="mt-4 text-[17px] leading-8 text-[#D5E0E4]">We examine the available evidence, distinguish what is known from what remains unresolved, and take action only within the agreed scope and authorization.</p>
                <p className="mt-4 text-[17px] leading-8 text-[#D5E0E4]">Every engagement is scoped to the work required. Commercial terms are agreed before paid work begins.</p>
                <Button type="button" onClick={() => handleCta('Discuss Your Financial Position')} className="mt-8 h-12 rounded-[7px] bg-white px-5 text-[13px] font-semibold text-[#30343B] hover:bg-[#F4F5F4]">Discuss Your Financial Position <ArrowRight className="ml-2 h-4 w-4" /></Button>
                <p className="mt-4 text-[13px] leading-6 text-[#AFC0C7]">Tell us what you&apos;re trying to establish, what remains unresolved, and what your team needs help carrying through to resolution.</p>
              </div>
            </motion.div>
          </section>
        </main>

        {!isInAppOverlay ? <BrandFooter /> : null}
      </div>
    </PageLayout>
  );
}
