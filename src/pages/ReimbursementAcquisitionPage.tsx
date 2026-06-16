import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowRight, Check } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { BrandFooter } from '@/components/layout/BrandFooter';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { Button } from '@/components/ui/button';
import {
  buildAcquisitionStructuredData,
  getAcquisitionPageData,
  type AcquisitionInlineSegment,
} from '@/config/acquisitionPages';
import { getPublicRouteMeta } from '@/config/seo';
import { usePageMeta } from '@/hooks/usePageMeta';
import { useStructuredData } from '@/hooks/useStructuredData';
import { useOnboardingCapacity } from '@/hooks/useOnboardingCapacity';

const revealProps = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.18 },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
};

const containerClass = 'mx-auto w-full max-w-[1200px] px-5 sm:px-6 md:px-8';
const labelClass = 'text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0B74DE]';
const headingClass =
  'mt-4 max-w-[920px] text-[31px] font-semibold leading-[1.02] tracking-[-0.045em] text-[#182026] sm:text-[36px] md:text-[60px]';
const bodyClass = 'mt-4 max-w-[760px] text-[15px] leading-7 text-[#66737F] md:mt-6 md:text-[18px] md:leading-8';
const inlineLinkClass = 'font-semibold text-[#0B74DE] underline-offset-4 transition-colors hover:text-[#0869C9] hover:underline';

const renderContextualSentence = (segments: AcquisitionInlineSegment[]) =>
  segments.map((segment, index) =>
    segment.type === 'link' ? (
      <Link key={`${segment.href}-${index}`} to={segment.href} className={inlineLinkClass}>
        {segment.label}
      </Link>
    ) : (
      <span key={`text-${index}`}>{segment.text}</span>
    )
  );

export default function ReimbursementAcquisitionPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isFull } = useOnboardingCapacity();
  const page =
    getAcquisitionPageData(location.pathname) ||
    getAcquisitionPageData('/amazon-lost-inventory-reimbursement')!;
  const pageMeta = getPublicRouteMeta(page.path)!;

  const structuredData = useMemo(() => buildAcquisitionStructuredData(pageMeta, page), [pageMeta, page]);

  usePageMeta(pageMeta);
  useStructuredData(structuredData);

  const handlePrimaryCta = () => {
    if (isFull) {
      navigate('/waitlist?reason=capacity');
      return;
    }

    navigate('/early-access');
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FAFAF7] font-sans text-[#182026] selection:bg-[#0B74DE]/16 selection:text-[#182026]">
      <PublicNavbar variant="light" />

      <main className="relative">
        <div className="pointer-events-none fixed inset-0 opacity-[0.45] [background-image:linear-gradient(rgba(11,116,222,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(11,116,222,0.045)_1px,transparent_1px)] [background-size:64px_64px]" />
        <div
          className="pointer-events-none fixed inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")',
          }}
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[760px] bg-[radial-gradient(circle_at_18%_8%,rgba(11,116,222,0.13),transparent_32%),radial-gradient(circle_at_84%_12%,rgba(46,125,91,0.1),transparent_28%)]" />

        <section className="relative pt-28 md:pt-40">
          <div className={containerClass}>
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-[1020px]"
            >
              <div className={labelClass}>{page.label}</div>
              <h1 className="mt-5 max-w-[980px] text-[38px] font-semibold leading-[0.98] tracking-[-0.06em] text-[#182026] sm:text-[46px] md:text-[76px]">
                {page.h1}
              </h1>
              <p className="mt-5 max-w-[780px] text-[16px] leading-7 text-[#4D5B66] md:mt-7 md:text-[19px] md:leading-8">
                {page.heroIntro}
              </p>

              <div className="mt-8 grid max-w-[860px] gap-3 md:grid-cols-3">
                {page.heroPoints.map((point) => (
                  <div key={point} className="border-t border-[#D8E3E8] pt-4 text-[14px] leading-7 text-[#66737F]">
                    {point}
                  </div>
                ))}
              </div>

              <div className="mt-8 flex w-full max-w-[560px] flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  type="button"
                  onClick={handlePrimaryCta}
                  className="h-12 rounded-full bg-[#0B74DE] px-6 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(11,116,222,0.22)] hover:bg-[#0869C9]"
                >
                  {isFull ? 'Join Waitlist' : 'Secure Early Access'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <Link
                  to="/amazon-fba-reimbursement"
                  className="inline-flex h-12 items-center justify-center rounded-full border border-[#CFE0EA] bg-white px-6 text-sm font-semibold text-[#25313A] transition-colors hover:bg-[#F8FAFC]"
                >
                  FBA Reimbursement
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {page.sections.map((section, sectionIndex) => (
          <section
            key={section.heading}
            className={`relative border-t border-[#E4EDF1] py-16 md:py-28 ${
              sectionIndex % 2 === 1 ? 'bg-[#F3F6F8]' : ''
            } ${sectionIndex === 0 ? 'mt-16 md:mt-20' : ''}`}
          >
            <div className={containerClass}>
              <motion.div {...revealProps}>
                <div className={labelClass}>{section.eyebrow}</div>
                <h2 className={headingClass}>{section.heading}</h2>
                <p className={bodyClass}>{section.body}</p>
                {section.contextualSentence ? (
                  <p className="mt-4 max-w-[760px] text-[15px] leading-7 text-[#66737F] md:text-[17px] md:leading-8">
                    {renderContextualSentence(section.contextualSentence)}
                  </p>
                ) : null}
              </motion.div>

              <div className="mt-10 border-t border-[#D8E3E8] md:mt-14">
                {section.points.map((item, index) => (
                  <motion.div
                    key={item.label}
                    {...revealProps}
                    transition={{ ...revealProps.transition, delay: index * 0.04 }}
                    className="grid gap-3 border-b border-[#D8E3E8] py-6 md:grid-cols-[240px_minmax(0,1fr)] md:gap-8 md:py-8"
                  >
                    <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[#0B74DE]">{item.label}</div>
                    <p className="max-w-[760px] text-[15px] leading-7 text-[#66737F] md:text-[17px] md:leading-8">{item.detail}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>
        ))}

        <section className="relative border-t border-[#E4EDF1] py-16 md:py-28">
          <div className={containerClass}>
            <motion.div {...revealProps}>
              <div className={labelClass}>How Margin Works</div>
              <h2 className={headingClass}>{page.workflowHeading}</h2>
              <p className={bodyClass}>{page.workflowBody}</p>
            </motion.div>

            <div className="relative mt-10 md:mt-14">
              <div className="relative z-10 grid gap-3 border-y border-[#D8E3E8] bg-white/36 lg:grid-cols-5 lg:gap-0">
                {page.workflowSteps.map((item, index) => (
                  <motion.div
                    key={item.step}
                    {...revealProps}
                    whileHover={{ y: -3 }}
                    transition={{ ...revealProps.transition, delay: index * 0.08 }}
                    className={`group relative min-h-[188px] overflow-hidden bg-white/40 px-5 py-6 transition-[background-color,box-shadow] duration-500 hover:bg-white/92 hover:shadow-[0_18px_48px_rgba(11,116,222,0.09)] md:px-6 lg:min-h-[176px] ${
                      index > 0 ? 'border-t border-[#D8E3E8] lg:border-l lg:border-t-0' : ''
                    }`}
                  >
                    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(11,116,222,0.06),transparent_42%)] opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                    <div className="relative flex h-full flex-col">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#BFD8EA] bg-white text-[11px] font-semibold tracking-tight text-[#0B74DE] shadow-[0_10px_24px_rgba(37,49,58,0.06)]">
                        {item.step}
                      </div>
                      <h3 className="mt-7 text-[18px] font-semibold leading-tight tracking-[-0.025em] text-[#182026] md:text-[20px]">{item.title}</h3>
                      <p className="mt-3 text-[14px] leading-7 text-[#66737F]">{item.detail}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="relative border-t border-[#E4EDF1] bg-[#F3F6F8] py-16 md:py-28">
          <div className={containerClass}>
            <motion.div {...revealProps}>
              <div className={labelClass}>FAQ</div>
              <h2 className={headingClass}>Frequently asked questions about {page.label.toLowerCase()}.</h2>
            </motion.div>

            <div className="mt-10 md:mt-14">
              <Accordion type="single" collapsible className="w-full border-t border-[#DADFE3]">
                {page.faqs.map((item, index) => (
                  <AccordionItem key={item.question} value={`faq-${index}`} className="border-b border-[#DADFE3] px-0">
                    <AccordionTrigger className="py-6 text-left text-[19px] font-semibold tracking-[-0.035em] text-[#050607] hover:no-underline md:py-7 md:text-[24px] [&>svg]:h-5 [&>svg]:w-5 [&>svg]:text-[#6C737A]">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="max-w-[860px] pb-7 pr-10 text-[15px] leading-7 text-[#66737F] md:text-[17px] md:leading-8">
                      <p>{item.answer}</p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </div>
        </section>

        <section className="relative border-t border-[#E4EDF1] py-16 md:py-28">
          <div className={containerClass}>
            <motion.div
              {...revealProps}
              className="overflow-hidden rounded-[34px] border border-[#CFE0EA] bg-[linear-gradient(135deg,#FFFFFF_0%,#F8FAFC_52%,#EAF6EF_100%)] px-6 py-8 shadow-[0_34px_100px_rgba(37,49,58,0.1)] md:px-10 md:py-12"
            >
              <div className="max-w-[900px]">
                <div className={labelClass}>Next Step</div>
                <h2 className="mt-4 max-w-[860px] text-[32px] font-semibold leading-[1.02] tracking-[-0.045em] text-[#182026] sm:text-[38px] md:text-[66px]">
                  Margin is built for sellers who need recovery work to continue after a discrepancy is found.
                </h2>
                <p className="mt-5 max-w-[760px] text-[15px] leading-7 text-[#66737F] md:text-[18px] md:leading-8">
                  Explore the related recovery pages, review the research, or start the early access workflow when you are ready to see how Margin handles evidence and outcomes.
                </p>
              </div>

              <div className="mt-8 flex flex-col gap-3 md:mt-10">
                <Button
                  type="button"
                  onClick={handlePrimaryCta}
                  className="h-12 w-fit rounded-full bg-[#0B74DE] px-6 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(11,116,222,0.22)] hover:bg-[#0869C9]"
                >
                  {isFull ? 'Join Waitlist' : 'Secure Early Access'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>

                <div className="flex flex-col gap-3 text-[14px] font-semibold text-[#25313A] md:flex-row md:items-center md:gap-5">
                  {page.internalLinks.map((link) => (
                    <Link key={link.href} to={link.href} className="inline-flex items-center gap-2 text-[#0B74DE] hover:text-[#0869C9]">
                      <Check className="h-4 w-4" />
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      <BrandFooter />
    </div>
  );
}
