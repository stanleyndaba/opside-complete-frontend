import React, { useEffect, useState } from 'react';
import { motion, useInView } from 'framer-motion';

const metrics = [
  {
    label: 'Evidence Readiness',
    value: 16,
    unit: 's',
    subtext: 'Discrepancy mapped to the claim type, proof requirements, and next action.'
  },
  {
    label: 'Document Matching',
    value: 3,
    unit: 'min',
    subtext: 'Invoices, shipment records, and support files matched to the recovery case.'
  },
  {
    label: 'Case Assembly',
    value: 1,
    unit: 'min',
    subtext: 'Evidence-complete cases prepared for seller approval before filing.'
  }
];

function TickerItem({ metric, index }: { metric: typeof metrics[0], index: number }) {
  const ref = React.useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const [currentValue, setCurrentValue] = useState(0);

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const end = metric.value;
      const duration = 1500; // ms
      const incrementTime = Math.abs(Math.floor(duration / end));

      const timer = setInterval(() => {
        start += 1;
        setCurrentValue(start);
        if (start === end) clearInterval(timer);
      }, incrementTime);

      return () => clearInterval(timer);
    }
  }, [isInView, metric.value]);

  return (
    <div ref={ref} className="flex flex-col relative px-8 py-10 md:py-16 group">
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: [0, 1, 0, 1, 0.5, 1] } : {}}
        transition={{ duration: 0.4, delay: index * 0.15 }}
        className="text-[11px] font-semibold uppercase tracking-tight text-[#0B74DE] mb-6"
      >
        {metric.label}
      </motion.div>
      
      <div className="flex items-baseline mb-4">
        <div className="text-[64px] sm:text-[72px] md:text-[88px] font-bold leading-none tracking-tighter text-[#182026] tabular-nums">
          {currentValue}
        </div>
        <div className="text-[18px] sm:text-[20px] font-medium text-[#8A98A3] ml-3 mb-2">
          {metric.unit}
        </div>
      </div>

      <p className="text-[14px] leading-relaxed text-[#66737F] max-w-[280px]">
        {metric.subtext}
      </p>

      {/* Right vertical divider for desktop, bottom horizontal for mobile */}
      {index !== metrics.length - 1 && (
        <>
          <div className="absolute right-0 top-12 bottom-12 w-px bg-[#DCE8EE] hidden md:block" />
          <div className="absolute bottom-0 left-8 right-8 h-px bg-[#DCE8EE] md:hidden" />
        </>
      )}
    </div>
  );
}

export function SystemPerformanceTicker() {
  return (
    <section className="relative bg-[#FAFAF7] border-y border-[#E4EDF1]">
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 divide-[#DCE8EE] md:divide-x-0">
          {metrics.map((metric, index) => (
            <TickerItem key={metric.label} metric={metric} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
