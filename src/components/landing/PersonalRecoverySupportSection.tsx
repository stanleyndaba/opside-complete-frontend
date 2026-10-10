import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Plus, Send } from "lucide-react";

const prompts = [
  {
    question: "Why is Margin taking this long to process my recovery?",
    response: "The recovery is waiting on settlement evidence from the 14 affected transactions. Margin has kept the position open rather than treating the absence of that evidence as a completed recovery.",
    detail: "Next review · 2 business days",
  },
  {
    question: "Why did Amazon reject this claim? What was missing?",
    response: "Amazon rejected the first submission because the receiving record did not establish the expected quantity for the affected shipment. Margin has retained the rejection, linked the missing record, and prepared the next justified action.",
    detail: "Missing · receiving quantity confirmation",
  },
  {
    question: "What happens next with this recovery?",
    response: "The case remains under controlled follow-through. Margin will verify the supporting record, confirm whether the evidence threshold is met, and show you the next approval point before anything consequential is submitted.",
    detail: "Owner · Margin recovery operations",
  },
] as const;

const revealProps = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-48px" },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
};

export function PersonalRecoverySupportSection() {
  const [activePrompt, setActivePrompt] = useState(0);
  const [draftQuestion, setDraftQuestion] = useState("");
  const [sentQuestion, setSentQuestion] = useState("");
  const [typedResponse, setTypedResponse] = useState("");
  const [phase, setPhase] = useState<"draft" | "response" | "pause">("draft");

  useEffect(() => {
    let sendTimer: number | undefined;
    let responseTimer: number | undefined;
    let nextTimer: number | undefined;
    const prompt = prompts[activePrompt];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    setDraftQuestion("");
    setSentQuestion("");
    setTypedResponse("");
    setPhase("draft");

    if (reducedMotion) {
      setSentQuestion(prompt.question);
      setTypedResponse(prompt.response);
      setPhase("pause");
      nextTimer = window.setTimeout(() => setActivePrompt((current) => (current + 1) % prompts.length), 6500);
      return () => window.clearTimeout(nextTimer);
    }

    let draftIndex = 0;
    const draftTimer = window.setInterval(() => {
      draftIndex += 1;
      setDraftQuestion(prompt.question.slice(0, draftIndex));
      if (draftIndex >= prompt.question.length) {
        window.clearInterval(draftTimer);
        sendTimer = window.setTimeout(() => {
          setDraftQuestion("");
          setSentQuestion(prompt.question);
          setPhase("response");
          let responseIndex = 0;
          responseTimer = window.setInterval(() => {
            responseIndex += 1;
            setTypedResponse(prompt.response.slice(0, responseIndex));
            if (responseIndex >= prompt.response.length) {
              window.clearInterval(responseTimer);
              setPhase("pause");
              nextTimer = window.setTimeout(() => setActivePrompt((current) => (current + 1) % prompts.length), 4200);
            }
          }, 17);
        }, 520);
      }
    }, 31);

    return () => {
      if (draftTimer) window.clearInterval(draftTimer);
      if (sendTimer) window.clearTimeout(sendTimer);
      if (responseTimer) window.clearInterval(responseTimer);
      if (nextTimer) window.clearTimeout(nextTimer);
    };
  }, [activePrompt]);

  const prompt = prompts[activePrompt];
  const advancePrompt = () => setActivePrompt((current) => (current + 1) % prompts.length);

  return (
    <section className="relative overflow-hidden border-y border-[#D6E3E8] bg-[#F3F8F9] py-12 sm:py-14 md:py-20" aria-labelledby="personal-recovery-support-title">
      <div aria-hidden="true" className="pointer-events-none absolute -right-28 top-[-110px] h-72 w-72 rounded-full bg-[#DCEAF2]/80 blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-36 left-[-80px] h-80 w-80 rounded-full bg-[#E9E4D8]/60 blur-3xl" />
      <div className="relative mx-auto grid w-full max-w-[1280px] items-center gap-10 px-5 sm:px-6 md:px-8 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16 lg:px-10 2xl:px-12">
        <motion.div {...revealProps} className="max-w-[600px]">
          <p className="mb-5 font-mono text-[11px] font-semibold uppercase tracking-tight text-[#5E7887]">13 / RECOVERY EXPLANATION</p>
          <h2 id="personal-recovery-support-title" className="font-lora text-[36px] leading-[1.02] tracking-[-0.045em] text-[#182026] sm:text-[46px] md:text-[58px]" style={{ fontWeight: 400 }}>
            <span className="heading-tone-dark">When the recovery changes,</span>{" "}
            <span className="heading-tone-muted">you should know why.</span>
          </h2>
          <p className="mt-5 max-w-[560px] text-[15px] leading-7 tracking-[-0.01em] text-[#4D5B66] md:text-[17px] md:leading-8">A managed recovery should not leave you guessing whether Margin is still working, what Amazon asked for, or why a claim did not move forward.</p>
          <p className="mt-4 max-w-[560px] font-lora text-[20px] leading-[1.12] tracking-[-0.03em] text-[#315C70] sm:text-[24px]" style={{ fontWeight: 400 }}>Ask in plain language. Margin answers from the position, evidence, and next accountable action.</p>
        </motion.div>

        <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.1 }} className="min-w-0">
          <div className="relative overflow-hidden rounded-[12px] border border-[#C8DCE5] bg-[#FBFCFC] shadow-[0_24px_70px_rgba(37,91,116,0.12)]">
            <div className="min-h-[390px] px-4 py-5 sm:min-h-[470px] sm:px-8 sm:py-8">
              <div className="flex min-h-[220px] flex-col justify-end gap-7 sm:min-h-[280px] sm:gap-9">
                {sentQuestion && (
                  <motion.div key={`sent-${activePrompt}`} initial={{ opacity: 0, y: 8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} className="flex justify-end">
                    <div className="max-w-[92%] rounded-[10px] rounded-br-[3px] border border-[#D0DFE7] bg-[#E5F1F7] px-3.5 py-3 text-[13px] leading-5 text-[#294B61] shadow-[0_4px_12px_rgba(44,80,96,0.05)] sm:max-w-[80%] sm:px-4 sm:text-[14px]">
                      <span className="mr-1.5 rounded-[4px] bg-[#D2DDF5] px-1.5 py-1 font-mono text-[12px] font-semibold text-[#526AB1]">@Margin</span>
                      {sentQuestion}
                    </div>
                  </motion.div>
                )}

                <motion.div key={`response-${activePrompt}`} initial={{ opacity: 0, y: 7 }} animate={{ opacity: typedResponse ? 1 : 0.45, y: 0 }} className="max-w-[92%] pl-1 sm:max-w-[84%] sm:pl-2">
                  <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-tight text-[#7A929D]">Margin replies</p>
                  <p className="min-h-[96px] text-[14px] leading-7 text-[#384B55] sm:text-[16px] sm:leading-8">
                    {typedResponse}
                    {phase === "response" && <span aria-hidden="true" className="ml-0.5 inline-block h-5 w-px translate-y-1 animate-pulse bg-[#7A929D]" />}
                  </p>
                  {typedResponse && <p className="mt-3 border-t border-[#E1E9EB] pt-3 font-mono text-[10px] text-[#7B8C93]">{prompt.detail}</p>}
                </motion.div>
              </div>

              <div className="mt-7 rounded-[10px] border border-[#C8D8DE] bg-white p-2 shadow-[0_7px_18px_rgba(44,80,96,0.06)] sm:mt-9 sm:p-2.5">
                <div className="flex min-h-[44px] items-center gap-2 px-1.5 sm:min-h-[48px] sm:px-2">
                  <span className="shrink-0 rounded-[4px] bg-[#D2DDF5] px-1.5 py-1 font-mono text-[12px] font-semibold text-[#526AB1]">@Margin</span>
                  <span className="min-w-0 flex-1 text-[13px] leading-5 text-[#52616A] sm:text-[14px]">{draftQuestion || "Ask Margin about this recovery"}{phase === "draft" && <span aria-hidden="true" className="ml-0.5 inline-block h-5 w-px translate-y-1 animate-pulse bg-[#0B74DE]" />}</span>
                  <button type="button" onClick={advancePrompt} aria-label="Send the next recovery question" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[7px] bg-[#0B74DE] text-white transition-colors hover:bg-[#075EBA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B74DE]/25">
                    <Send className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>
                <div className="mt-1 flex items-center gap-3 px-1.5 text-[#91A3AB] sm:px-2">
                  <Plus className="h-4 w-4" strokeWidth={1.8} />
                  <span className="text-[11px]">Margin keeps the recovery context attached.</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-[#DCE8ED] bg-[#F6F9F9] px-4 py-3 sm:px-5">
              <span className="font-mono text-[10px] uppercase tracking-tight text-[#8A9BA3]">Live recovery explanation</span>
              <button type="button" onClick={advancePrompt} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#0B74DE] transition-colors hover:text-[#075EBA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B74DE]/25" aria-label="Show the next recovery question">Next question <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.8} /></button>
            </div>
          </div>
          <p className="mt-3 text-center text-[11px] leading-5 text-[#6B808A]">The prompt is visible. The answer stays grounded in the recovery record.</p>
        </motion.div>
      </div>
    </section>
  );
}

export default PersonalRecoverySupportSection;
