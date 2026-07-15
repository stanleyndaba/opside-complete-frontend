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
    <section className="relative border-y border-[#DCE8EE] bg-[#F8FAFC] max-md:border-y-0">
      <div className="mx-auto w-full max-w-[1280px] border-x border-[#DCE8EE] bg-white/42 max-md:border-x-0">
        <div className="flex min-h-[210px] items-center justify-center px-5 py-12 sm:px-8 md:min-h-[310px] md:py-24">
          <h2 className="mx-auto max-w-[860px] text-center text-[34px] font-semibold leading-[1.06] tracking-[-0.055em] text-[#182026] sm:text-[48px] md:text-[64px] lg:text-[72px]">
            Built for recoveries Amazon rarely makes easy.
          </h2>
        </div>

        <div className="grid grid-cols-2 border-t border-[#DCE8EE] max-md:border-t-0 lg:grid-cols-4">
          {metrics.map((metric, index) => (
            <div
              key={metric.value}
              className={`flex min-h-[150px] flex-col items-center justify-center px-4 py-6 text-center sm:px-6 md:min-h-[210px] md:px-8 md:py-10 ${
                index % 2 === 1 ? 'md:border-l md:border-[#E5E7EB]' : ''
              } ${
                index >= 2 ? 'border-t border-[#E5E7EB] lg:border-t-0' : ''
              } ${
                index > 0 ? 'lg:border-l lg:border-[#DCE8EE]' : ''
              }`}
            >
              <div className="text-[46px] font-medium leading-none tracking-[-0.06em] text-[#182026] sm:text-[64px] md:text-[68px] lg:text-[76px]">
                {metric.value}
              </div>
              <p className="mt-3 max-w-[180px] text-[12px] leading-5 text-[#66737F] sm:text-[14px] md:mt-5 md:max-w-[230px] md:text-[15px] md:leading-7">
                {metric.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
