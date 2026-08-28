const layers = [
  {
    label: "Outcome",
    tone: "text-[#0B74DE]",
    items: [
      "Needs evidence",
      "Rejected",
      "Underpaid",
      "Partially resolved",
      "Reversed",
      "Appealable",
    ],
    direction: "ticker-forward",
  },
  {
    label: "Meaning",
    tone: "text-[#66737F]",
    items: [
      "More proof required",
      "Reason recorded",
      "Expected vs paid",
      "Unresolved balance visible",
      "Outcome can be examined",
      "Further action assessed",
    ],
    direction: "ticker-reverse",
  },
  {
    label: "Control",
    tone: "text-[#182026]",
    items: [
      "Evidence gap logged",
      "Case history retained",
      "Balance remains visible",
      "Seller review",
      "Next action recorded",
      "No unsupported promise",
    ],
    direction: "ticker-forward",
  },
];

export function SystemPerformanceTicker() {
  return (
    <section
      aria-labelledby="things-go-wrong-heading"
      className="relative overflow-hidden border-y border-[#DCE8EE] bg-[#F3F6F8]"
    >
      <style>{`
        @keyframes margin-ticker-forward {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
        @keyframes margin-ticker-reverse {
          from { transform: translateX(-50%); }
          to { transform: translateX(0); }
        }
        .margin-ticker-track {
          width: max-content;
          animation-duration: 34s;
          animation-iteration-count: infinite;
          animation-timing-function: linear;
        }
        .margin-ticker-track:hover,
        .margin-ticker-track:focus-within {
          animation-play-state: paused;
        }
        .margin-ticker-forward { animation-name: margin-ticker-forward; }
        .margin-ticker-reverse { animation-name: margin-ticker-reverse; }
        @media (prefers-reduced-motion: reduce) {
          .margin-ticker-track {
            animation: none !important;
            transform: none !important;
          }
        }
      `}</style>

      <div className="mx-auto w-full max-w-[1280px] border-x border-[#DCE8EE] bg-white/42 max-md:border-x-0">
        <div className="px-5 pb-10 pt-14 sm:px-8 md:px-12 md:pb-14 md:pt-20">
          <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-[#0B74DE]">
            Recovery does not disappear when things go wrong
          </p>
          <h2
            id="things-go-wrong-heading"
            className="mt-4 max-w-[820px] font-lora text-[40px] leading-[0.98] tracking-[-0.05em] text-[#182026] sm:text-[54px] md:text-[72px]"
            style={{ fontWeight: 400 }}
          >
            What happens when things go wrong?
          </h2>
          <p className="mt-6 max-w-[760px] text-[16px] leading-7 text-[#66737F] md:text-[18px] md:leading-8">
            A rejection, reversal, or incomplete payout does not become a dead end. Margin records what happened, keeps the unresolved balance visible, and assesses whether more evidence, review, or another supported action is warranted.
          </p>
        </div>

        <div className="border-t border-[#DCE8EE]" role="list" aria-label="Recovery outcome layers">
          {layers.map((layer) => (
            <div key={layer.label} className="grid min-h-[92px] grid-cols-[92px_minmax(0,1fr)] items-center border-b border-[#E5E7EB] last:border-b-0 sm:grid-cols-[130px_minmax(0,1fr)] md:min-h-[112px]">
              <div className={`px-5 font-mono text-[10px] font-bold uppercase tracking-[0.12em] sm:px-8 md:px-10 md:text-[11px] ${layer.tone}`}>
                {layer.label}
              </div>
              <div className="min-w-0 overflow-hidden border-l border-[#E5E7EB] py-7">
                <div className={`margin-ticker-track ${layer.direction} flex min-w-max items-center`}>
                  {[...layer.items, ...layer.items].map((item, index) => (
                    <div key={`${layer.label}-${item}-${index}`} className="flex items-center">
                      <span className="px-5 text-[18px] font-semibold tracking-[-0.035em] text-[#182026] sm:px-7 sm:text-[22px] md:px-10 md:text-[28px]">
                        {item}
                      </span>
                      <span aria-hidden="true" className="text-[18px] text-[#B9C7D0]">·</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="px-5 py-6 text-[12px] leading-5 text-[#66737F] sm:px-8 md:px-10 md:text-[13px]">
          Appealable means Margin can assess whether another supported path exists. It does not mean an appeal will succeed, and no outcome is treated as recovered until the evidence and payout are verified.
        </p>
      </div>
    </section>
  );
}

export default SystemPerformanceTicker;
