import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Send } from "lucide-react";

const prompts = [
  {
    label: "Why is this taking so long?",
    question: "Why is Margin taking this long to process my recovery?",
    response: "The recovery is waiting on settlement evidence from the 14 affected transactions. Margin has kept the position open rather than treating the absence of that evidence as a completed recovery.",
    detail: "Next review · 2 business days",
    status: "Evidence in progress",
  },
  {
    label: "Why was it rejected?",
    question: "Why did Amazon reject this claim? What was missing?",
    response: "Amazon rejected the first submission because the receiving record did not establish the expected quantity for the affected shipment. Margin has retained the rejection, linked the missing record, and prepared the next justified action.",
    detail: "Missing · receiving quantity confirmation",
    status: "Rejection under review",
  },
  {
    label: "What happens next?",
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
  const [customQuestion, setCustomQuestion] = useState("");
  const [submittedQuestion, setSubmittedQuestion] = useState("");
  const [isSending, setIsSending] = useState(false);

  const active = prompts[activePrompt];
  const visibleQuestion = submittedQuestion || active.question;
  const response = useMemo(() => {
    if (!submittedQuestion) return active.response;
    const lower = submittedQuestion.toLowerCase();
    if (lower.includes("reject") || lower.includes("missing")) return prompts[1].response;
    if (lower.includes("next") || lower.includes("now")) return prompts[2].response;
    return "Margin will answer from the recovery record: what happened, what evidence is present, what remains unresolved, and what decision—if any—comes next. The position stays visible while the answer is established.";
  }, [active, submittedQuestion]);

  const choosePrompt = (index: number) => {
    setSubmittedQuestion("");
    setCustomQuestion("");
    setActivePrompt(index);
  };

  const askQuestion = () => {
    const question = customQuestion.trim();
    if (!question) return;
    setIsSending(true);
    setSubmittedQuestion(question);
    window.setTimeout(() => setIsSending(false), 260);
  };

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

            <div className="space-y-4 px-4 py-5 sm:px-7 sm:py-7">
              <div className="flex justify-end">
                <motion.div key={visibleQuestion} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="max-w-[88%] rounded-[10px] rounded-br-[3px] bg-[#E4F0F6] px-3.5 py-3 text-[13px] leading-5 text-[#294B61] sm:max-w-[76%] sm:px-4">
                  {visibleQuestion}
                </motion.div>
              </div>
              <div className="flex gap-3">
                <div className="mt-1 h-7 w-7 shrink-0 rounded-full border border-[#C8D6DD] bg-[#F2F5F5] text-center font-mono text-[9px] leading-7 text-[#53707E]">M</div>
                <motion.div key={`${activePrompt}-${submittedQuestion}`} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="min-w-0 max-w-[92%] rounded-[10px] rounded-tl-[3px] border border-[#E0E5E4] bg-[#FFFDF9] px-3.5 py-3 text-[13px] leading-5 text-[#384B55] shadow-[0_4px_12px_rgba(44,64,72,0.04)] sm:px-4">
                  <p>{response}</p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-[#E8E8E2] pt-2 text-[10px] font-medium text-[#7B8C93]">
                    <span>{submittedQuestion ? "Response grounded in record" : active.status}</span>
                    <span>{submittedQuestion ? "Review context attached" : active.detail}</span>
                  </div>
                </motion.div>
              </div>
            </div>

            <div className="border-t border-[#DCE8ED] bg-[#F6F9F9] px-3 py-3 sm:px-5">
              <div className="mb-2 flex flex-wrap gap-1.5">
                {prompts.map((prompt, index) => (
                  <button key={prompt.label} type="button" onClick={() => choosePrompt(index)} className={`rounded-full border px-2.5 py-1.5 text-[10px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0B74DE]/25 ${activePrompt === index && !submittedQuestion ? "border-[#B8CFDA] bg-white text-[#294B61]" : "border-transparent text-[#6D838E] hover:border-[#D5E1E5] hover:bg-white"}`}>
                    {prompt.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 rounded-[8px] border border-[#C8D8DE] bg-white p-1.5 focus-within:border-[#8EB2C1] focus-within:ring-2 focus-within:ring-[#8EB2C1]/15">
                <input aria-label="Ask Margin about this recovery" value={customQuestion} onChange={(event) => setCustomQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") askQuestion(); }} placeholder="Ask what happened, what is missing, or what comes next" className="min-w-0 flex-1 bg-transparent px-2 text-[12px] text-[#294B61] outline-none placeholder:text-[#98AAB2] sm:text-[13px]" />
                <button type="button" onClick={askQuestion} disabled={!customQuestion.trim() || isSending} aria-label="Ask Margin" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-[#0B74DE] text-white transition-colors hover:bg-[#075EBA] disabled:cursor-not-allowed disabled:bg-[#B7C9D2]">
                  <Send className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>
          <p className="mt-3 text-center text-[11px] leading-5 text-[#6B808A]">Not a generic help desk. A readable explanation of the recovery position already being managed.</p>
        </motion.div>
      </div>
    </section>
  );
}

export default PersonalRecoverySupportSection;
