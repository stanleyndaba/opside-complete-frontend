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
      className="group flex h-full flex-col rounded-[14px] border border-[#D9E0E4] bg-white p-6 shadow-[0_18px_55px_rgba(31,57,73,0.06)] transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-1 hover:border-[#AEBFC9] hover:shadow-[0_24px_70px_rgba(31,57,73,0.11)] sm:p-8"
    >
      <div className="flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#607784]">
        <span className="h-px w-7 bg-[#4F46E5]" />
        {eyebrow}
      </div>
      <h3 className="mt-5 font-lora text-[29px] leading-[1.05] tracking-[-0.04em] text-[#182026] sm:text-[34px]">{title}</h3>
      <p className="mt-4 text-[17px] font-semibold leading-7 text-[#263F4B]">{summary}</p>
      <p className="mt-4 text-[15px] leading-7 text-[#526570]">{body}</p>
      <p className="mt-4 text-[15px] leading-7 text-[#526570]">{detail}</p>
      <div className="mt-auto pt-8">
        <Button
          type="button"
          onClick={() => onCta(cta)}
          className="h-11 w-full justify-between rounded-[7px] bg-[#4F46E5] px-4 text-left text-[13px] font-semibold text-white shadow-[0_10px_24px_rgba(79,70,229,0.16)] hover:bg-[#4338CA] sm:w-auto sm:min-w-[220px]"
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
      <div className="landing-google-sans min-h-screen overflow-hidden bg-[#F5F8F9] text-[#182026] selection:bg-[#4F46E5]/15 selection:text-[#182026]">
        {isInAppOverlay ? (
          <div className="fixed inset-x-0 top-0 z-30 flex items-center justify-between px-5 py-4 sm:px-8">
            <Link to="/" className="rounded-full border border-[#D7E1E6] bg-white px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#607784] shadow-sm hover:bg-[#F5F8F9]">Landing page</Link>
            <button type="button" onClick={closeOverlay} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[#D7E1E6] bg-white text-[#607784] shadow-sm hover:bg-[#F5F8F9]" aria-label="Close pricing">
              <X className="h-4 w-4" strokeWidth={1.8} />
            </button>
          </div>
        ) : (
          <PublicNavbar variant="light" />
        )}

        <main className="relative">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[720px] bg-[radial-gradient(circle_at_16%_18%,rgba(79,70,229,0.12),transparent_32%),radial-gradient(circle_at_86%_8%,rgba(126,180,190,0.18),transparent_32%)]" />
          <div className="pointer-events-none absolute inset-0 opacity-[0.24] [background-image:linear-gradient(rgba(37,49,58,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(37,49,58,0.035)_1px,transparent_1px)] [background-size:72px_72px]" />

          <section className={isInAppOverlay ? 'relative px-5 pb-16 pt-28 sm:px-8 sm:pt-32' : 'relative px-5 pb-20 pt-32 sm:px-8 sm:pb-24 sm:pt-44'} aria-labelledby="pricing-hero-title">
            <div className="mx-auto max-w-[1180px]">
              <motion.div {...reveal} className="max-w-[820px]">
                <div className="mb-6 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#4F46E5]"><span className="h-px w-9 bg-[#4F46E5]" />Pricing</div>
                <h1 id="pricing-hero-title" className="font-lora text-[48px] leading-[0.98] tracking-[-0.055em] text-[#182026] sm:text-[68px] md:text-[88px]">Start with the financial position.</h1>
                <p className="mt-7 max-w-[720px] text-[18px] leading-8 text-[#48616D] sm:text-[21px] sm:leading-9">Margin examines what happened to the money, establishes what the evidence supports, and carries authorized recovery work through to financial reconciliation.</p>
                <p className="mt-5 max-w-[720px] text-[16px] leading-7 text-[#607784] sm:text-[18px] sm:leading-8">Every engagement is scoped to the work required, the complexity of the financial position, and the responsibility Margin takes on.</p>
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button type="button" onClick={() => handleCta('Request a Recovery Audit', true)} className="h-12 justify-between rounded-[7px] bg-[#4F46E5] px-5 text-[13px] font-semibold text-white shadow-[0_12px_28px_rgba(79,70,229,0.18)] hover:bg-[#4338CA] sm:min-w-[210px]">Request a Recovery Audit <ArrowRight className="h-4 w-4" /></Button>
                  <Button type="button" onClick={() => handleCta('Discuss an Engagement')} variant="outline" className="h-12 justify-between rounded-[7px] border-[#C7D5DC] bg-white px-5 text-[13px] font-semibold text-[#263F4B] hover:bg-[#EEF3F5] sm:min-w-[190px]">Discuss an Engagement <ArrowRight className="h-4 w-4" /></Button>
                </div>
              </motion.div>

              <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.12 }} className="mt-14 grid gap-4 border-t border-[#CBD8DE] pt-5 text-[13px] leading-6 text-[#607784] sm:grid-cols-3 sm:gap-8">
                <div><span className="font-semibold text-[#263F4B]">Examination first.</span><br />Establish the position before deciding what work is justified.</div>
                <div><span className="font-semibold text-[#263F4B]">Scope follows evidence.</span><br />Commercial terms reflect the work Margin takes responsibility for.</div>
                <div><span className="font-semibold text-[#263F4B]">Decision rights stay clear.</span><br />You approve consequential actions; Margin carries agreed execution.</div>
              </motion.div>
            </div>
          </section>

          <section className="relative border-y border-[#D8E1E5] bg-white px-5 py-16 sm:px-8 sm:py-24" aria-labelledby="audit-title">
            <div className="mx-auto grid max-w-[1180px] gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20">
              <motion.div {...reveal}>
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#4F46E5]">Start with an examination</div>
                <h2 id="audit-title" className="mt-5 font-lora text-[40px] leading-[1] tracking-[-0.05em] text-[#182026] sm:text-[58px]">Recovery Audit</h2>
                <p className="mt-5 text-[20px] font-semibold leading-7 text-[#263F4B]">Establish what the records support.</p>
                <p className="mt-5 text-[16px] leading-8 text-[#526570]">Before deciding what to recover, establish what has happened.</p>
                <p className="mt-4 text-[16px] leading-8 text-[#526570]">Margin examines the available Amazon financial and operational records to identify what is accounted for, what remains unresolved, what the evidence supports, and where further action may be warranted.</p>
                <p className="mt-4 text-[16px] leading-8 text-[#526570]">You&apos;ll receive a clearer financial position and a basis for deciding what needs attention next.</p>
                <div className="mt-7 flex items-center gap-3 text-[14px] font-semibold text-[#263F4B]"><span className="h-2 w-2 rounded-full bg-[#2E7D5B]" />Initial examination: complimentary.</div>
                <Button type="button" onClick={() => handleCta('Request a Recovery Audit', true)} className="mt-7 h-11 rounded-[7px] bg-[#182026] px-5 text-[13px] font-semibold text-white hover:bg-[#263F4B]">Request a Recovery Audit <ArrowRight className="ml-2 h-4 w-4" /></Button>
              </motion.div>
              <motion.div {...reveal} transition={{ ...reveal.transition, delay: 0.12 }} className="rounded-[14px] bg-[#F2F6F7] p-6 sm:p-9">
                <div className="flex items-center justify-between border-b border-[#D6E0E4] pb-5"><span className="text-[12px] font-semibold uppercase tracking-[0.12em] text-[#607784]">What the examination establishes</span><span className="rounded-full bg-[#E2F1E9] px-3 py-1 text-[11px] font-semibold text-[#2E7D5B]">No payment required</span></div>
                <div className="mt-6 space-y-4">
                  {auditSteps.map((step, index) => <div key={step} className="flex gap-4 border-b border-[#DCE5E8] pb-4 last:border-0"><span className="font-mono text-[12px] font-semibold text-[#4F46E5]">0{index + 1}</span><span className="text-[15px] leading-6 text-[#3F5661]">{step}</span></div>)}
                </div>
              </motion.div>
            </div>
          </section>

          <section className="relative px-5 py-16 sm:px-8 sm:py-24" aria-labelledby="action-title">
            <div className="mx-auto max-w-[1180px]">
              <motion.div {...reveal} className="max-w-[740px]">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#4F46E5]">When the position requires action</div>
                <h2 id="action-title" className="mt-5 font-lora text-[40px] leading-[1] tracking-[-0.05em] text-[#182026] sm:text-[58px]">Defined work, scoped to the position.</h2>
                <p className="mt-5 text-[18px] leading-8 text-[#526570]">Paid engagements begin after the financial examination establishes what the records support and what responsibility the work requires.</p>
              </motion.div>
              <div className="mt-10 grid gap-5 lg:grid-cols-3">{definedWork.map((item, index) => <EngagementCard key={item.title} {...item} index={index} onCta={handleCta} />)}</div>
            </div>
          </section>

          <section className="relative border-y border-[#D8E1E5] bg-[#EAF1F2] px-5 py-16 sm:px-8 sm:py-24" aria-labelledby="continue-title">
            <div className="mx-auto max-w-[1180px]">
              <motion.div {...reveal} className="max-w-[740px]">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#4F46E5]">When financial control needs to continue</div>
                <h2 id="continue-title" className="mt-5 font-lora text-[40px] leading-[1] tracking-[-0.05em] text-[#182026] sm:text-[58px]">Keep the financial position under examination.</h2>
                <p className="mt-5 text-[18px] leading-8 text-[#526570]">For businesses that need ongoing investigation, recovery follow-through, and a defined operating relationship with Margin.</p>
              </motion.div>
              <div className="mt-10 grid gap-5 lg:grid-cols-2">{continuingWork.map((item, index) => <EngagementCard key={item.title} {...item} index={index} onCta={handleCta} />)}</div>
            </div>
          </section>

          <section className="relative bg-[#182026] px-5 py-16 text-white sm:px-8 sm:py-24" aria-labelledby="principle-title">
            <motion.div {...reveal} className="mx-auto max-w-[1180px]">
              <div className="max-w-[780px]">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#A5B4FC]">One principle across every engagement</div>
                <h2 id="principle-title" className="mt-5 font-lora text-[40px] leading-[1] tracking-[-0.05em] text-white sm:text-[60px]">Establish the position. Prove what is justified. Reconcile the outcome.</h2>
                <p className="mt-7 text-[17px] leading-8 text-[#D5E0E4]">Margin does not treat every discrepancy as a claim or every approval as recovered money.</p>
                <p className="mt-4 text-[17px] leading-8 text-[#D5E0E4]">We examine the available evidence, distinguish what is known from what remains unresolved, and take action only within the agreed scope and authorization.</p>
                <p className="mt-4 text-[17px] leading-8 text-[#D5E0E4]">Every engagement is scoped to the work required. Commercial terms are agreed before paid work begins.</p>
                <Button type="button" onClick={() => handleCta('Discuss Your Financial Position')} className="mt-8 h-12 rounded-[7px] bg-white px-5 text-[13px] font-semibold text-[#182026] hover:bg-[#EEF3F5]">Discuss Your Financial Position <ArrowRight className="ml-2 h-4 w-4" /></Button>
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
