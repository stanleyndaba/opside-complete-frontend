import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";

const sourceRecords = [
  { label: "Provider recovery report", code: "Source 01", note: "Reported amount" },
  { label: "Amazon settlement records", code: "Source 02", note: "Settlement period" },
  { label: "Inventory movement records", code: "Source 03", note: "Unit movement" },
  { label: "Amazon case history", code: "Source 04", note: "Case reference" },
  { label: "Payout records", code: "Source 05", note: "Payment trace" },
  { label: "Accounting ledger", code: "Source 06", note: "Ledger entry" },
];

const statusRows = [
  ["Current state", "Unverified"],
  ["Owner", "Not established"],
  ["Closure", "Not established"],
];

function SourceRecord({
  source,
  index,
  visible,
  reducedMotion,
}: {
  source: (typeof sourceRecords)[number];
  index: number;
  visible: boolean;
  reducedMotion: boolean;
}) {
  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 22, scale: 0.97 }}
      animate={
        visible
          ? { opacity: 1, y: 0, scale: 1 }
          : { opacity: 0, y: 22, scale: 0.97 }
      }
      transition={{ duration: 0.55, delay: reducedMotion ? 0 : index * 0.03, ease: [0.22, 1, 0.36, 1] }}
      className="group relative rounded-[3px] border border-[#D8E3EA] bg-white/80 px-4 py-3 shadow-[0_8px_24px_rgba(42,61,73,0.04)]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#94A3B8]" />
            <span className="truncate text-[12px] font-medium tracking-tight text-[#26343D]">{source.label}</span>
          </div>
          <p className="pl-3.5 text-[10px] text-[#9AA7AF]">{source.note}</p>
        </div>
        <span className="shrink-0 font-mono text-[9px] text-[#A5B0B7]">{source.code}</span>
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-dashed border-[#E4E9EC] pt-2.5">
        <span className="text-[10px] text-[#8A989F]">Record received</span>
        <span className="rounded-full border border-[#E0E6E9] px-2 py-0.5 text-[9px] text-[#89969E]">Incomplete</span>
      </div>
    </motion.div>
  );
}

export default function DemoSceneOne() {
  const reducedMotion = useReducedMotion() ?? false;
  const [visibleSources, setVisibleSources] = useState(reducedMotion ? sourceRecords.length : 0);

  useEffect(() => {
    if (reducedMotion) {
      setVisibleSources(sourceRecords.length);
      return;
    }

    setVisibleSources(0);
    const timers = sourceRecords.map((_, index) =>
      window.setTimeout(() => setVisibleSources(index + 1), 650 + index * 420),
    );

    return () => timers.forEach(window.clearTimeout);
  }, [reducedMotion]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#FAFAF7] text-[#182026]">
      <div className="relative mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-5 py-6 sm:px-8 lg:px-14 lg:py-8">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_72%_18%,rgba(11,116,222,0.055),transparent_31%),radial-gradient(circle_at_18%_78%,rgba(148,163,184,0.07),transparent_30%)]" />

        <header className="relative z-10 flex items-center justify-between border-b border-[#DDE5E9] pb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-7 w-7 items-center justify-center rounded-[2px] bg-[#182026] text-[11px] font-semibold text-white">M</div>
            <span className="brand-wordmark text-[17px] text-[#182026]">Margin</span>
          </div>
          <div className="flex items-center gap-3 text-[10px] text-[#8A989F]">
            <span>Demo scene 01</span>
            <span className="h-1 w-1 rounded-full bg-[#B3BEC4]" />
            <span>Case opening</span>
          </div>
        </header>

        <section className="relative z-10 mx-auto flex w-full max-w-[1120px] flex-1 flex-col justify-center py-12 lg:py-16">
          <div className="mb-8 max-w-[720px]">
            <p className="mb-4 font-mono text-[10px] text-[#0B74DE]">The unresolved financial question</p>
            <h1 className="max-w-[760px] font-[Inter] text-[clamp(2rem,4.2vw,4.15rem)] font-medium leading-[1.03] tracking-tight text-[#182026]">
              Financial question requiring an established position
            </h1>
            <p className="mt-5 max-w-[520px] text-[14px] leading-6 text-[#697780]">
              Before a reported recovery can become part of the financial record, the case needs a position that can be verified, owned, and closed.
            </p>
          </div>

          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,0.93fr)_minmax(0,1.07fr)] lg:gap-12">
            <motion.article
              initial={reducedMotion ? false : { opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="relative overflow-hidden rounded-[4px] border border-[#C8D7DF] bg-white shadow-[0_18px_50px_rgba(37,58,71,0.08)]"
            >
              <div className="flex items-center justify-between border-b border-[#E2E8EC] px-5 py-4 sm:px-7">
                <div className="flex items-center gap-2.5">
                  <span className="h-2 w-2 rounded-full bg-[#B8C2C8]" />
                  <span className="font-mono text-[10px] text-[#78868F]">Open financial question</span>
                </div>
                <span className="font-mono text-[10px] text-[#A1ADB3]">Case / Q1</span>
              </div>
              <div className="px-5 py-6 sm:px-7 sm:py-8">
                <p className="text-[11px] text-[#97A3A9]">Case card</p>
                <h2 className="mt-2 text-[clamp(1.4rem,2.6vw,2.1rem)] font-medium leading-tight tracking-tight text-[#182026]">FBA inventory reimbursement — Q1</h2>
                <div className="mt-7 border-y border-[#E5EAED] py-5">
                  <p className="text-[10px] text-[#98A5AC]">Provider reports</p>
                  <p className="mt-1 text-[clamp(2rem,4vw,3.2rem)] font-medium tracking-tight text-[#182026]">$42,800 <span className="text-[13px] font-normal tracking-normal text-[#7C8991]">recovered</span></p>
                </div>
                <dl className="mt-5 space-y-3.5">
                  {statusRows.map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between gap-4 text-[12px]">
                      <dt className="text-[#829099]">{label}</dt>
                      <dd className="flex items-center gap-2 text-right font-medium text-[#46545D]"><span className="h-1.5 w-1.5 rounded-full bg-[#B3BEC4]" />{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div className="border-t border-[#E2E8EC] bg-[#F7F9FA] px-5 py-3.5 sm:px-7">
                <div className="flex items-center gap-2 text-[10px] text-[#8B989F]"><span className="h-1.5 w-1.5 rounded-full bg-[#C1CBD0]" />Position not yet established</div>
              </div>
            </motion.article>

            <div className="relative pt-1 lg:pt-3">
              <div className="mb-4 flex items-end justify-between border-b border-[#DDE5E9] pb-3">
                <div>
                  <p className="font-mono text-[10px] text-[#8B989F]">Evidence entering the case</p>
                  <p className="mt-1 text-[12px] text-[#6F7D85]">Source records arrive, but none is a conclusion.</p>
                </div>
                <span className="font-mono text-[10px] text-[#A1ADB3]">{String(visibleSources).padStart(2, "0")} / 06</span>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {sourceRecords.map((source, index) => (
                  <SourceRecord key={source.label} source={source} index={index} visible={index < visibleSources} reducedMotion={reducedMotion} />
                ))}
              </div>
            </div>
          </div>

          <motion.div
            initial={reducedMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: visibleSources === sourceRecords.length ? 1 : 0.72, y: 0 }}
            transition={{ duration: 0.7, delay: reducedMotion ? 0 : 0.2 }}
            className="mt-12 flex items-center gap-4 border-t border-[#DDE5E9] pt-6 lg:mt-14"
          >
            <span className="h-px w-8 bg-[#0B74DE]" />
            <p className="font-serif text-[clamp(1.1rem,2vw,1.5rem)] italic tracking-tight text-[#33434D]">A reported number is not yet a financial position.</p>
          </motion.div>
        </section>

        <footer className="relative z-10 flex items-center justify-between border-t border-[#DDE5E9] pt-4 text-[10px] text-[#A1ADB3]">
          <span>Recognition before resolution</span>
          <span>01 / 05</span>
        </footer>
      </div>
    </main>
  );
}
