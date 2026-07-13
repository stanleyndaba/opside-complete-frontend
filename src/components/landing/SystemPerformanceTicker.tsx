const metrics = [
  {
    value: '26',
    description: 'Recovery algorithms continuously auditing your account.',
  },
  {
    value: '11',
    description: 'Specialized recovery agents coordinating every case.',
  },
  {
    value: '12',
    description: 'Evidence workflows connecting the proof Amazon actually asks for.',
  },
  {
    value: '100%',
    description: 'Seller approval before any claim is submitted.',
  },
];

export function SystemPerformanceTicker() {
  return (
    <section className="relative border-y border-[#E5E7EB] bg-white py-16 md:py-24">
      <div className="mx-auto w-full max-w-[1180px] px-5 sm:px-6 md:px-8">
        <h2 className="mx-auto max-w-[760px] text-center font-serif-headline text-[32px] font-bold leading-[1.04] tracking-[-0.035em] text-[#182026] sm:text-[42px] md:text-[56px]">
          Built for evidence-heavy Amazon recoveries
        </h2>

        <div className="mt-12 grid grid-cols-2 border-y border-[#E5E7EB] md:mt-16 lg:grid-cols-4">
          {metrics.map((metric, index) => (
            <div
              key={metric.value}
              className={`min-h-[176px] px-4 py-8 sm:px-6 md:min-h-[220px] md:px-8 md:py-10 ${
                index % 2 === 1 ? 'border-l border-[#E5E7EB]' : ''
              } ${
                index >= 2 ? 'border-t border-[#E5E7EB] lg:border-t-0' : ''
              } ${
                index > 0 ? 'lg:border-l lg:border-[#E5E7EB]' : ''
              }`}
            >
              <div className="font-mono text-[52px] font-semibold leading-none tracking-[-0.06em] text-[#182026] sm:text-[64px] md:text-[76px]">
                {metric.value}
              </div>
              <p className="mt-5 max-w-[230px] text-[13px] leading-6 text-[#66737F] sm:text-[14px] md:text-[15px] md:leading-7">
                {metric.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
