import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { ArrowRight, Bell, CircleDollarSign, Clock, FileText, Search, ShieldAlert, ShieldCheck } from 'lucide-react';
import { BrandFooter } from '@/components/layout/BrandFooter';
import { PublicNavbar } from '@/components/layout/PublicNavbar';
import { CookieConsent } from '@/components/landing/CookieConsent';
import { SITE_META } from '@/config/site';
import { usePageMeta } from '@/hooks/usePageMeta';

const sellerNeeds = [
  {
    title: 'Find money Amazon still owes',
    detail: 'Sellers do not want more reporting. They want missed reimbursements surfaced with enough truth to act on them.'
  },
  {
    title: 'Stay inside Amazon policy',
    detail: 'They want automation that is careful, not aggressive. Weak or duplicate claims are worse than no claim at all.'
  },
  {
    title: 'Know what is actually happening',
    detail: 'If nothing is moving, they want the exact blocker. If Amazon responds, they want to see it immediately.'
  }
];

const objectionAnswers = [
  {
    title: 'This might spam Amazon',
    detail: 'Margin blocks duplicate and weak filings before anything is sent.'
  },
  {
    title: 'I will not know what it is doing',
    detail: 'Every case moves through clear states: detect, verify, file, wait, needs evidence, approved, paid.'
  },
  {
    title: 'It will create more work for me',
    detail: 'You only step in when Amazon asks for more proof or critical identifiers are missing.'
  }
];

const trustBullets = [
  'Read-only discovery before filing',
  'Evidence checked before any claim goes out',
  'No duplicate or thread-only blind filings',
  'Amazon still pays directly into your seller account'
];

const processSteps = [
  {
    step: '01',
    title: 'Detect missed reimbursement opportunities',
    detail: 'Margin audits inventory, shipments, returns, fees, and reimbursements to surface what is supportable.'
  },
  {
    step: '02',
    title: 'Verify identifiers and evidence',
    detail: 'Shipment IDs, ASINs, FNSKUs, quantities, and supporting documents are checked before a case is considered ready.'
  },
  {
    step: '03',
    title: 'File only supportable cases',
    detail: 'If a case is weak, duplicate, or missing truth, it is held instead of pushed into Seller Support.'
  },
  {
    step: '04',
    title: 'Track Amazon thread changes',
    detail: 'When Amazon asks for more evidence or resolves a case, Margin updates the case state and keeps the thread linked.'
  },
  {
    step: '05',
    title: 'Notify you until payout',
    detail: 'You see what moved, what is blocked, and when reimbursements are approved or paid.'
  }
];

const filingRules = [
  'Verified identifiers are present',
  'Evidence is matched or the case is otherwise supportable',
  'The issue is not already active or duplicated',
  'The case is still inside Amazon’s policy window'
];

const holdRules = [
  'Shipment, product, or quantity truth is missing',
  'The same issue already has a live case or thread',
  'Amazon email exists but should stay thread-only',
  'The evidence is not strong enough to support a filing yet'
];

const faqs = [
  {
    question: 'Which services help automate FBA reimbursement claims?',
    answer: 'The real need is not “automation” by itself. Sellers want a system that detects missed reimbursements, verifies the claim truth, files only supportable cases, and tracks Amazon until payout. That is the lane Margin is built for.'
  },
  {
    question: 'What are common reasons for FBA reimbursement denials?',
    answer: 'Weak identifiers, missing quantity truth, unsupported evidence, expired policy windows, and duplicate or already-active issues are common reasons. Margin is designed to hold those cases instead of filing them blindly.'
  },
  {
    question: 'What documentation is required to submit a successful FBA reimbursement claim?',
    answer: 'It depends on the case type, but common proof includes shipment IDs, ASIN or FNSKU, quantity truth, supplier invoices, bills of lading, proof of delivery, and any Amazon thread-specific evidence requested during follow-up.'
  },
  {
    question: 'How can I check if I am eligible for FBA reimbursements?',
    answer: 'You need a trustworthy audit across your inventory, shipment, fee, return, and reimbursement data. Margin’s job is to surface supportable opportunities and separate them from weak or expired ones.'
  },
  {
    question: 'How do I track the status of reimbursement requests?',
    answer: 'You should be able to see whether a case is waiting on Amazon, needs evidence, approved, rejected, or paid. Margin is built to show that progression instead of leaving you guessing.'
  },
  {
    question: 'Will using an automated tool get my Amazon account suspended?',
    answer: 'A risky tool can create account problems if it files weak, duplicate, or careless cases. Margin is built around a pre-filing truth gate so unsupported cases are blocked before submission.'
  },
  {
    question: 'Do I have to manually upload invoices for every claim?',
    answer: 'Not necessarily. When your evidence sources are connected, Margin can use what is already available. If a critical document is missing, the system should tell you exactly what is needed rather than pretending the case is ready.'
  },
  {
    question: 'What is the typical timeframe for FBA reimbursement claim resolution?',
    answer: 'That depends on Amazon’s path for the specific case. Some cases move quickly, some need more evidence, and some are approved before payout is confirmed. The important part is having truthful visibility into what stage each case is in.'
  }
];

const sectionEyebrow = 'text-[11px] font-medium tracking-tight text-white/45';
const surfaceClass = 'rounded-2xl border border-white/10 bg-[#111111]';
const insetSurfaceClass = 'rounded-xl border border-white/10 bg-white/[0.02]';

export default function Index() {
  const navigate = useNavigate();
  const [showMoreFaqs, setShowMoreFaqs] = useState(false);
  usePageMeta(SITE_META);

  const handleConnectAmazon = () => {
    navigate('/login');
  };

  const scrollToHowItWorks = () => {
    if (typeof document === 'undefined') return;
    document.getElementById('how-margin-works')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#070707] font-sans text-white selection:bg-white/15">
      <PublicNavbar />

      <main className="relative">
        <div className="pointer-events-none absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.025]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#070707] to-[#050505]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_60%)]" />

        <section className="relative border-b border-white/8 px-6 pb-20 pt-32 md:px-8 md:pb-24 md:pt-36">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto grid max-w-7xl gap-8 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.82fr)]"
          >
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[12px] font-medium text-white/72">
                <ShieldCheck className="h-3.5 w-3.5 text-white/72" />
                Trust-first FBA reimbursement automation
              </div>

              <div className="space-y-5">
                <h1 className="max-w-5xl text-4xl font-light tracking-tight text-white md:text-6xl">
                  Recover missed FBA reimbursements without weak claims or Seller Central guesswork.
                </h1>
                <p className="max-w-3xl text-base leading-8 text-white/62 md:text-lg">
                  Margin finds reimbursement opportunities, verifies the identifiers and evidence, files only supportable cases, and tracks Amazon until payout. If something is blocked, it should tell you exactly why instead of pretending progress.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={handleConnectAmazon}
                  className="h-11 rounded-full border border-white/10 bg-[#141414] px-6 text-sm font-medium text-white shadow-[0_0_20px_rgba(0,0,0,0.25)] hover:bg-[#1b1b1b]"
                >
                  Connect Amazon
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={scrollToHowItWorks}
                  className="h-11 rounded-full border border-white/10 bg-white/[0.02] px-6 text-sm font-medium text-white hover:bg-white/[0.05]"
                >
                  See how Margin decides to file
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {trustBullets.map((item) => (
                  <div key={item} className={`${insetSurfaceClass} px-4 py-3 text-sm text-white/72`}>
                    {item}
                  </div>
                ))}
              </div>

              <div className={`${surfaceClass} px-5 py-5 md:px-6`}>
                <div className={sectionEyebrow}>What sellers actually want</div>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  {sellerNeeds.map((item) => (
                    <div key={item.title} className={`${insetSurfaceClass} px-4 py-4`}>
                      <div className="text-base font-medium text-white">{item.title}</div>
                      <p className="mt-2 text-sm leading-6 text-white/52">{item.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={`${surfaceClass} p-6 md:p-7`}>
              <div className={sectionEyebrow}>Why sellers say no</div>
              <div className="mt-5 space-y-4">
                {objectionAnswers.map((item) => (
                  <div key={item.title} className={`${insetSurfaceClass} px-4 py-4`}>
                    <div className="flex items-start gap-3">
                      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-200/90" />
                      <div>
                        <div className="text-base font-medium text-white">{item.title}</div>
                        <p className="mt-1 text-sm leading-6 text-white/52">{item.detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-4">
                <div className="flex items-start gap-3">
                  <CircleDollarSign className="mt-0.5 h-4 w-4 shrink-0 text-white/70" />
                  <div>
                    <div className="text-base font-medium text-white">Margin never routes your reimbursement money.</div>
                    <p className="mt-1 text-sm leading-6 text-white/58">
                      Amazon pays approved reimbursements into your seller account directly. Margin tracks the case, the thread, and the payout truth inside the platform.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className={`${insetSurfaceClass} px-4 py-4`}>
                  <Search className="h-4 w-4 text-white/70" />
                  <div className="mt-3 text-sm font-medium text-white">Detect</div>
                  <div className="mt-1 text-sm text-white/45">Audit what Amazon owes</div>
                </div>
                <div className={`${insetSurfaceClass} px-4 py-4`}>
                  <FileText className="h-4 w-4 text-white/70" />
                  <div className="mt-3 text-sm font-medium text-white">Verify</div>
                  <div className="mt-1 text-sm text-white/45">Check identifiers and evidence</div>
                </div>
                <div className={`${insetSurfaceClass} px-4 py-4`}>
                  <Bell className="h-4 w-4 text-white/70" />
                  <div className="mt-3 text-sm font-medium text-white">Track</div>
                  <div className="mt-1 text-sm text-white/45">Follow Amazon until payout</div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="relative border-b border-white/8 px-6 py-20 md:px-8" id="how-margin-works">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl space-y-4">
              <div className={sectionEyebrow}>How Margin works</div>
              <h2 className="text-3xl font-light tracking-tight text-white md:text-5xl">
                Detect, verify, file, track, and follow through.
              </h2>
              <p className="text-base leading-8 text-white/58">
                The landing-page promise should be operationally true. Margin should not act like a reimbursement agency with no controls. It should behave like a careful operator that knows when to move and when to hold.
              </p>
            </div>

            <div className="mt-10 grid gap-4 lg:grid-cols-5">
              {processSteps.map((item) => (
                <motion.div
                  key={item.step}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.45 }}
                  className={`${surfaceClass} px-5 py-5`}
                >
                  <div className="text-[12px] font-medium tracking-tight text-white/42">{item.step}</div>
                  <div className="mt-4 text-lg font-medium tracking-tight text-white">{item.title}</div>
                  <p className="mt-3 text-sm leading-6 text-white/50">{item.detail}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="relative border-b border-white/8 px-6 py-20 md:px-8">
          <div className="mx-auto grid max-w-7xl gap-6 xl:grid-cols-2">
            <div className={`${surfaceClass} p-6`}>
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-white/72" />
                <h3 className="text-2xl font-light tracking-tight text-white">When Margin should file</h3>
              </div>
              <p className="mt-3 text-sm leading-7 text-white/56">
                Sellers want a tool that knows when a case is truly ready. That means concrete identifiers, supportable evidence, and no duplicate risk.
              </p>
              <ul className="mt-6 space-y-3">
                {filingRules.map((item) => (
                  <li key={item} className={`${insetSurfaceClass} px-4 py-3 text-sm text-white/74`}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className={`${surfaceClass} p-6`}>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-amber-200/90" />
                <h3 className="text-2xl font-light tracking-tight text-white">When Margin should wait</h3>
              </div>
              <p className="mt-3 text-sm leading-7 text-white/56">
                Saying “not yet” is part of the product. If the case is weak, already active, or missing truth, the right move is to hold it instead of filing noise.
              </p>
              <ul className="mt-6 space-y-3">
                {holdRules.map((item) => (
                  <li key={item} className={`${insetSurfaceClass} px-4 py-3 text-sm text-white/74`}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="relative px-6 py-20 md:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="space-y-4 text-center">
              <div className={sectionEyebrow}>Questions sellers ask before they buy</div>
              <h2 className="text-3xl font-light tracking-tight text-white md:text-5xl">
                The page should answer the real objections, not dodge them.
              </h2>
              <p className="mx-auto max-w-3xl text-base leading-8 text-white/58">
                These are the questions FBA sellers ask on Google, in communities, and in AI tools before they trust a reimbursement platform. The answers have to sound careful, specific, and believable.
              </p>
            </div>

            <div className="mt-10">
              <Accordion type="single" collapsible className="space-y-4">
                {faqs.slice(0, showMoreFaqs ? faqs.length : 5).map((item, index) => (
                  <AccordionItem
                    key={item.question}
                    value={`faq-${index}`}
                    className={`${surfaceClass} px-5 py-1`}
                  >
                    <AccordionTrigger className="py-5 text-left text-base font-medium tracking-tight text-white hover:no-underline">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent className="pb-5 text-sm leading-7 text-white/58">
                      {item.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              {!showMoreFaqs ? (
                <div className="mt-8 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => setShowMoreFaqs(true)}
                    className="rounded-full border border-white/10 bg-white/[0.02] px-6 text-sm text-white hover:bg-white/[0.05]"
                  >
                    Show more questions
                  </Button>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="relative px-6 pb-24 md:px-8">
          <div className={`mx-auto max-w-6xl ${surfaceClass} px-6 py-8 md:px-10 md:py-10`}>
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_auto] lg:items-end">
              <div>
                <div className={sectionEyebrow}>Final trust check</div>
                <h2 className="mt-3 text-3xl font-light tracking-tight text-white md:text-4xl">
                  The real promise is simple: find the money, protect the account, and show the work.
                </h2>
                <p className="mt-4 max-w-3xl text-base leading-8 text-white/58">
                  If Margin cannot prove the case, it should not file it. If Amazon replies, you should see it. If something is blocked, you should know exactly what is missing. That is the standard sellers actually care about.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <Button
                  onClick={handleConnectAmazon}
                  className="h-11 rounded-full border border-white/10 bg-[#141414] px-6 text-sm font-medium text-white shadow-[0_0_20px_rgba(0,0,0,0.25)] hover:bg-[#1b1b1b]"
                >
                  Connect Amazon
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={scrollToHowItWorks}
                  className="h-11 rounded-full border border-white/10 bg-white/[0.02] px-6 text-sm font-medium text-white hover:bg-white/[0.05]"
                >
                  Review the filing safeguards
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <BrandFooter />
      <CookieConsent />
    </div>
  );
}
