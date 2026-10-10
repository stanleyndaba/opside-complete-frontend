import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

const prompts = [
  {
    question: "Why is Margin taking this long to process my recovery?",
    response: "The recovery is waiting on settlement evidence from the 14 affected transactions. Margin has kept the position open rather than treating the absence of that evidence as a completed recovery.",
    detail: "Next review · 2 business days",
    status: "Evidence in progress",
  },
  {
    question: "Why did Amazon reject this claim? What was missing?",
    response: "Amazon rejected the first submission because the receiving record did not establish the expected quantity for the affected shipment. Margin has retained the rejection, linked the missing record, and prepared the next justified action.",
    detail: "Missing · receiving quantity confirmation",
    status: "Rejection under review",
  },
  {
    question: "What happens next with this recovery?",
    response: "The case remains under controlled follow-through. Margin will verify the supporting record, confirm whether the evidence threshold is met, and show you the next approval point before anything consequential is submitted.",
    detail: "Owner · Margin recovery operations",
    status: "Awaiting next decision",
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
  const [typedQuestion, setTypedQuestion] = useState("");
  const [typedResponse, setTypedResponse] = useState("");
  const [phase, setPhase] = useState<"question" | "response" | "pause">("question");

  useEffect(() => {
    let responseTimer: number | undefined;
    let nextTimer: number | undefined;
    const prompt = prompts[activePrompt];
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    setTypedQuestion("");
    setTypedResponse("");
    setPhase("question");

    if (reducedMotion) {
      setTypedQuestion(prompt.question);
      setTypedResponse(prompt.response);
      setPhase("pause");
      nextTimer = window.setTimeout(() => setActivePrompt((current) => (current + 1) % prompts.length), 6500);
      return () => window.clearTimeout(nextTimer);
    }

    let questionIndex = 0;
    const questionTimer = window.setInterval(() => {
      questionIndex += 1;
      setTypedQuestion(prompt.question.slice(0, questionIndex));
      if (questionIndex >= prompt.question.length) {
        window.clearInterval(questionTimer);
        responseTimer = window.setTimeout(() => {
          setPhase("response");
          let responseIndex = 0;
          const responseInterval = window.setInterval(() => {
            responseIndex += 1;
            setTypedResponse(prompt.response.slice(0, responseIndex));
            if (responseIndex >= prompt.response.length) {
              window.clearInterval(responseInterval);
              setPhase("pause");
              nextTimer = window.setTimeout(() => setActivePrompt((current) => (current + 1) % prompts.length), 4200);
            }
          }, 17);
        }, 560);
      }
    }, 31);

    return () => {
      if (questionTimer) window.clearInterval(questionTimer);
      if (responseTimer) window.clearTimeout(responseTimer);
      if (nextTimer) window.clearTimeout(nextTimer);
    };
  }, [activePrompt]);

  const prompt = prompts[activePrompt];

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
          <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-[12px] font-medium text-[#5E7887]">
            <span>Recovery-specific</span>
            <span>Evidence-linked</span>
            <span>Human-readable</span>
          </div>
        </motion.div>

        <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.1 }} className="min-w-0">
          <div className="relative overflow-hidden rounded-[12px] border border-[#C8DCE5] bg-[#FBFCFC] shadow-[0_24px_70px_rgba(37,91,116,0.12)]">
            <div className="flex items-center justify-between border-b border-[#DCE8ED] px-4 py-3 sm:px-5">
              <div>
                <p className="font-mono text-[10px] font-semibold uppercase tracking-tight text-[#6C8795]">Margin recovery support</p>
                <p className="mt-0.5 text-[11px] text-[#8A9BA3]">REC-2026-0147 · Cross-marketplace exposure</p>
              </div>
              <span className="rounded-full border border-[#C8DED1] bg-[#EEF8F1] px-2.5 py-1 text-[10px] font-medium text-[#4F8067]">Position visible</span>
            </div>

            <div className="min-h-[300px] px-5 py-7 sm:min-h-[360px] sm:px-9 sm:py-9">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 font-mono text-[11px] font-semibold text-[#526F7D]">@Margin</span>
                <motion.p key={`question-${activePrompt}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="min-h-[24px] max-w-[620px] text-[15px] leading-7 text-[#294B61] sm:text-[17px] sm:leading-8">
                  {typedQuestion}
                  {phase === "question" && <span aria-hidden="true" className="ml-0.5 inline-block h-5 w-px translate-y-1 animate-pulse bg-[#0B74DE]" />}
                </motion.p>
              </div>

              <motion.div key={`answer-${activePrompt}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: typedResponse ? 1 : 0.35, y: 0 }} transition={{ duration: 0.35 }} className="mt-8 max-w-[660px] border-l-2 border-[#C7DCE4] pl-4 sm:mt-10 sm:pl-5">
                <p className="mb-2 font-mono text-[10px] font-semibold uppercase tracking-tight text-[#7A929D]">Margin replies</p>
                <p className="min-h-[84px] text-[14px] leading-7 text-[#384B55] sm:text-[16px] sm:leading-8">
                  {typedResponse}
                  {phase === "response" && <span aria-hidden="true" className="ml-0.5 inline-block h-5 w-px translate-y-1 animate-pulse bg-[#7A929D]" />}
                </p>
                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-1 border-t border-[#E1E9EB] pt-3 text-[10px] font-medium text-[#7B8C93]">
                  <span>{prompt.status}</span>
                  <span>{prompt.detail}</span>
                </div>
              </motion.div>
            </div>

            <div className="flex items-center justify-between border-t border-[#DCE8ED] bg-[#F6F9F9] px-4 py-3 sm:px-5">
              <span className="font-mono text-[10px] uppercase tracking-tight text-[#8A9BA3]">Live recovery explanation</span>
              <button type="button" onClick={() => setActivePrompt((current) => (current + 1) % prompts.length)} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#0B74DE] transition-colors hover:text-[#075EBA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B74DE]/25" aria-label="Show the next recovery question">
                Next question <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.8} />
              </button>
            </div>
          </div>
          <p className="mt-3 text-center text-[11px] leading-5 text-[#6B808A]">Not a generic help desk. A readable explanation of the recovery position already being managed.</p>
        </motion.div>
      </div>
    </section>
  );
}

export default PersonalRecoverySupportSection;
