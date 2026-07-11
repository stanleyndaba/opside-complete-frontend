import React, { useRef } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';

const protocols = [
  {
    number: '01',
    title: 'Claim Deadline Tracking',
    subtext: 'Every case stays attached to the filing window that controls eligibility.',
    log: 'Filing window lock',
  },
  {
    number: '02',
    title: 'Document Matching',
    subtext: 'Invoices, BOLs, PODs, shipment records, and support history are linked before filing.',
    log: 'Evidence link graph',
  },
  {
    number: '03',
    title: 'Seller-Controlled Filing',
    subtext: 'Margin starts read-only and no filing action advances without seller approval.',
    log: 'Seller approval gate',
  },
  {
    number: '04',
    title: 'Payout Reconciliation',
    subtext: 'Each case is tracked through Amazon response, dispute, payout, underpayment, or blocker.',
    log: 'Payout state ledger',
  },
];

export function TechnicalProtocolGrid() {
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.18 });
  const reduceMotion = useReducedMotion();

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden border-y border-[#E4EDF1] bg-[#FAFAF7] py-24 text-[#182026] md:py-32"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_12%,rgba(11,116,222,0.055),transparent_30%),radial-gradient(circle_at_10%_84%,rgba(46,125,91,0.055),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.64),transparent_48%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.42] [background-image:linear-gradient(rgba(122,137,148,0.10)_1px,transparent_1px)] [background-size:100%_96px]" />

      <div className="relative mx-auto w-full max-w-[1180px] px-5 sm:px-6 md:px-8">
        <div className="relative">
          <motion.div
            aria-hidden="true"
            initial={{ scaleY: 0 }}
            animate={isInView || reduceMotion ? { scaleY: 1 } : { scaleY: 0 }}
            transition={{ duration: reduceMotion ? 0 : 1.45, ease: [0.22, 1, 0.36, 1] }}
            className="hidden md:block absolute bottom-0 left-16 top-0 w-px origin-top bg-[#C9D6DE] md:left-[260px]"
          />

          <div className="space-y-28 md:space-y-36">
            {protocols.map((protocol, index) => (
              <motion.article
                key={protocol.number}
                initial={reduceMotion ? false : { opacity: 0, x: -22, filter: 'blur(8px)' }}
                whileInView={reduceMotion ? undefined : { opacity: 1, x: 0, filter: 'blur(0px)' }}
                viewport={{ once: true, amount: 0.45 }}
                transition={{
                  duration: 0.72,
                  delay: reduceMotion ? 0 : index * 0.1,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="relative min-h-[190px] pl-24 md:min-h-[220px] md:pl-[330px]"
              >
                <motion.span
                  aria-hidden="true"
                  initial={reduceMotion ? false : { opacity: 0, scale: 0.3 }}
                  whileInView={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
                  viewport={{ once: true, amount: 0.55 }}
                  transition={{ duration: 0.32, delay: reduceMotion ? 0 : index * 0.12 + 0.22 }}
                  className="absolute left-16 top-5 h-1 w-1 -translate-x-1/2 rounded-full border border-[#C9D6DE] bg-white shadow-[0_0_14px_rgba(11,116,222,0.18)] md:left-[260px]"
                />

                <div className="font-serif-headline absolute left-0 top-0 w-12 text-right text-[54px] font-light leading-none tracking-normal text-[#8A98A3]/70 md:left-[106px] md:-mt-2 md:w-[108px] md:text-[74px]">
                  {protocol.number}
                </div>

                <div className="max-w-[580px]">
                  <h3 className="text-[18px] font-bold uppercase leading-snug text-[#182026] md:text-[21px]">
                    {protocol.title}
                  </h3>
                  <p className="mt-5 text-[16px] leading-[1.6] text-[#66737F] md:text-[18px]">
                    {protocol.subtext}
                  </p>
                  <p className="mt-6 font-mono text-[11px] leading-none text-[#7A8994]">
                    <span className="text-[#0B74DE]">Protocol:</span>{' '}
                    {protocol.log}
                  </p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
