import React from 'react';
import { motion } from 'framer-motion';

const protocols = [
  {
    number: '01',
    title: 'SYSTEM DEADLINE GOVERNANCE',
    subtext: 'Every case is assigned a deadline state that governs eligibility until resolution or expiry.'
  },
  {
    number: '02',
    title: 'FORENSIC DATA LINKING',
    subtext: 'Reports, invoices, and shipment data are linked before any reimbursement case can advance.'
  },
  {
    number: '03',
    title: 'ZERO-WRITE SECURITY PROTOCOL',
    subtext: 'All workflows are structured in read-only mode, with no enabling actions until explicit approval.'
  },
  {
    number: '04',
    title: 'CAPITAL RECONCILIATION ENGINE',
    subtext: 'Each case is tracked across identified, validated, and filed states through final payout reconciliation.'
  }
];

export function TechnicalProtocolGrid() {
  const lineVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 1.5, ease: 'easeOut' } }
  };

  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: 0.4 + custom * 0.15, duration: 0.8, ease: [0.22, 1, 0.36, 1] }
    })
  };

  return (
    <section className="relative bg-[#050B14] py-24 md:py-32 overflow-hidden">
      <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-6 md:px-8">
        <div className="relative border border-white/10">
          
          {/* Structural Dividers (Desktop Cross-Grid) */}
          <motion.div 
            className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10 hidden md:block"
            variants={lineVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          />
          <motion.div 
            className="absolute top-1/2 left-0 right-0 h-px bg-white/10 hidden md:block"
            variants={lineVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
          />

          <div className="grid grid-cols-1 md:grid-cols-2">
            {protocols.map((protocol, index) => {
              // Add bottom borders for mobile (except last item)
              // We handle the desktop cross grid with the absolute dividers above, 
              // but we need mobile horizontal dividers too.
              const isLastMobile = index === protocols.length - 1;
              const mobileBorderClass = isLastMobile ? '' : 'border-b border-white/10 md:border-b-0';

              return (
                <div 
                  key={protocol.number} 
                  className={`relative p-12 md:p-20 lg:p-24 ${mobileBorderClass}`}
                >
                  <motion.div
                    custom={index}
                    variants={textVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    className="flex flex-col h-full"
                  >
                    <div className="font-serif-headline text-5xl md:text-6xl text-[#444444] mb-8 md:mb-12">
                      {protocol.number}
                    </div>
                    <div className="mt-auto">
                      <h3 className="text-white font-bold text-[18px] md:text-[20px] tracking-widest uppercase mb-6 leading-snug">
                        {protocol.title}
                      </h3>
                      <p className="text-[#8A98A3] text-[16px] md:text-[18px] leading-relaxed max-w-[420px]">
                        {protocol.subtext}
                      </p>
                    </div>
                  </motion.div>
                </div>
              );
            })}
          </div>
          
        </div>
      </div>
    </section>
  );
}
