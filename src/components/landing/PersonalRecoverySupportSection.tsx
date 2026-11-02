import React, { useState } from "react";
import { motion } from "framer-motion";
import { AtSign, Check, ChevronDown, ChevronRight, Copy, Paperclip, Search } from "lucide-react";

const singlePrompt = "Explain the Amazon decision, the financial position it leaves open, and what evidence or action is needed next.";

const responseLead = "Margin reviewed the case history, Amazon's decision, the available evidence and the settlement position. The decision explains what Amazon accepted or declined; it does not, by itself, close the underlying financial question.";

const responseBranches = [
  {
    label: "Decision",
    text: "Amazon's response is recorded against the original submission and evidence. The approved portion is separated from the amount that remains unsupported or unresolved.",
    reference: "Amazon case response",
    referenceIcon: "/amazon-logo-transparent-circle.png",
    referenceSource: "Amazon",
    tone: "text-[#526AB1]",
  },
  {
    label: "Financial position",
    text: "The supported exposure, credited value and residual balance remain visible together. Finance can see what is accounted for, what is still open and why the remaining position has not been classified as recovered.",
    reference: "Settlement and ledger position",
    referenceIcon: "/onedriive.png",
    referenceSource: "OneDrive",
    tone: "text-[#9A620E]",
  },
  {
    label: "Next action",
    text: "Margin identifies the specific evidence or settlement confirmation required next, assigns the accountable owner and carries the authorized follow-through without transferring the consequential decision away from Finance.",
    reference: "Evidence packet",
    referenceIcon: "/excel-icon-margin.png",
    referenceSource: "Excel",
    tone: "text-[#635BFF]",
  },
] as const;

const documentReferences = [
  { name: "Shipment Receiving Register", source: "Amazon", icon: "/amazon-logo-transparent-circle.png" },
  { name: "Receiving Variance Schedule", source: "Excel", icon: "/excel-icon-margin.png" },
  { name: "Carrier Custody Record", source: "PDF", icon: "/pdf-file-icon.webp" },
  { name: "Amazon Reimbursement Thread", source: "Gmail", icon: "/gmailicon.png" },
  { name: "Executive Evidence Pack", source: "Dropbox", icon: "/Dropbox_Icon.svg.png" },
];

const responseForCopy = `${responseLead} ${responseBranches.map(({ label, text }) => `${label}: ${text}`).join(" ")}`;

const revealProps = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-48px" },
  transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
};

export function PersonalRecoverySupportSection() {
  const [copied, setCopied] = useState(false);

  const copyResponse = async () => {
    try {
      await navigator.clipboard.writeText(responseForCopy);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <section className="relative overflow-hidden border-y border-[#D6E3E8] bg-white py-12 sm:py-14 md:py-20" aria-labelledby="personal-recovery-support-title">
      <div className="relative mx-auto grid w-full max-w-[1280px] items-center gap-10 px-5 sm:px-6 md:px-8 lg:grid-cols-[0.78fr_1.22fr] lg:gap-16 lg:px-10 2xl:px-12">
        <motion.div {...revealProps} className="max-w-[600px]">
          <h2 id="personal-recovery-support-title" className="font-lora text-[36px] leading-[1.02] tracking-[-0.045em] text-[#182026] sm:text-[46px] md:text-[58px]" style={{ fontWeight: 400 }}>
            <span className="heading-tone-dark">Have someone who can explain the decision—not just tell you what to submit.</span>
          </h2>
          <p className="mt-5 max-w-[560px] text-[15px] leading-7 tracking-[-0.01em] text-[#4D5B66] md:text-[17px] md:leading-8">Margin makes the investigation, case history, evidence requirements, Amazon responses and outstanding actions accessible as one connected case position. Your team can ask about the status, the reason for a decision, the evidence supporting it or what is preventing progress, and receive an explanation grounded in the recorded financial work.</p>
          <p className="mt-4 max-w-[560px] font-lora text-[20px] leading-[1.12] tracking-[-0.03em] text-[#315C70] sm:text-[24px]" style={{ fontWeight: 400 }}>The answer should identify the next action and its accountable owner, not simply repeat a status label.</p>
          <button type="button" className="landing-pressable mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-[7px] bg-[#635BFF] px-5 text-[13px] font-semibold text-white shadow-[0_12px_26px_rgba(99,91,255,0.18)] transition-colors hover:bg-[#5148E5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#635BFF]/35 focus-visible:ring-offset-2" aria-label="Ask Margin about your recovery">Ask Margin about your recovery <span aria-hidden="true">→</span></button>
        </motion.div>

        <motion.div {...revealProps} transition={{ ...revealProps.transition, delay: 0.1 }} className="min-w-0">
          <div className="relative overflow-hidden rounded-[12px] border border-[#E7E7E7] bg-white">
            <div className="relative z-10 min-h-[390px] bg-white px-4 py-5 sm:min-h-[470px] sm:px-8 sm:py-8">
              <div className="mx-auto mt-5 w-full max-w-[860px] border-l-2 border-[#DCE5EA] pl-4 sm:mt-6 sm:pl-5">
                <div className="flex items-center gap-2 text-[11px] font-medium text-[#667780]"><span className="financial-position-indicator is-settled h-2.5 w-2.5 shrink-0" />Financial position established</div>
                <div className="mt-1 flex items-center gap-1 text-[10px] text-[#8A99A4]">Finished in 6 steps • 21s <ChevronDown className="h-3 w-3" strokeWidth={1.8} /></div>

                <div className="mt-3 space-y-3">
                  <p className="text-[13px] leading-5.5 text-[#384B55] sm:text-[14px] sm:leading-6">{responseLead}</p>

                  <div className="flex items-center gap-1 text-[11px] font-medium text-[#52616A]">Reviewing attached files <ChevronDown className="h-3 w-3 text-[#7A929D]" strokeWidth={1.8} /></div>
                  <div className="flex items-center gap-1.5 text-[10px] text-[#667780]"><span className="inline-flex items-center gap-1.5 rounded-[3px] bg-[#F1F3F4] px-1.5 py-0.5 font-semibold text-[#3B4650]"><img src="/excel-icon-margin.png" alt="Excel" className="h-3.5 w-3.5 object-contain" />Evidence Packet</span><span className="rounded-[3px] bg-[#F1F3F4] px-1.5 py-0.5 font-semibold text-[#667780]">+2</span></div>

                  <div className="space-y-1 text-[11px] text-[#667780]"><div className="flex items-center gap-1.5"><Search className="h-3.5 w-3.5 text-[#7A929D]" strokeWidth={1.8} />Cross referencing events</div><div className="flex items-center gap-1.5"><Search className="h-3.5 w-3.5 text-[#7A929D]" strokeWidth={1.8} />Investigating the issue</div></div>
                  <div className="flex items-center gap-2 text-[10px] font-medium text-[#8A99A4]"><span className="h-1.5 w-1.5 rounded-full bg-[#7A929D]" />Establishment <span className="text-[#A0ADB4]">(processed 7s)</span></div>
                </div>

                <div className="mt-3 space-y-2">
                  {responseBranches.map(({ label, text, reference, referenceIcon, referenceSource, tone }) => (
                    <div key={label} className="flex items-start gap-2 text-[11px] leading-4 text-[#52616A] sm:gap-2.5 sm:text-[12px]">
                      <span className={`mt-0.5 shrink-0 text-[10px] font-semibold ${tone}`}>{label}</span>
                      <span>{text} <span className="mx-1 inline-flex max-w-full translate-y-[0.12em] items-center gap-1 rounded-[3px] bg-[#F1F3F4] px-1.5 py-0.5 align-baseline text-[10px] font-semibold leading-4 text-[#3B4650]" title={`${referenceSource}: ${reference}`}><img src={referenceIcon} alt={referenceSource} className="h-3.5 w-3.5 shrink-0 object-contain" />{reference}</span></span>
                    </div>
                  ))}
                </div>

                <div className="mt-3 flex items-center justify-between gap-3 border-t border-[#E1E9EB] pt-2.5">
                  <div className="flex min-w-0 items-center gap-2 overflow-hidden text-[#7B8C93]"><span title="Executive Evidence Pack" className="inline-flex shrink-0 items-center"><img src="/Dropbox_Icon.svg.png" alt="Dropbox" className="h-4 w-4 object-contain" /></span><span className="rounded-[3px] bg-[#F1F3F4] px-1.5 py-0.5 text-[10px] font-semibold text-[#667780]">+5</span></div>
                  <button type="button" onClick={copyResponse} aria-label={copied ? "Explanation copied" : "Copy explanation"} className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] text-[#7A929D] transition-colors hover:bg-[#EEF0F1] hover:text-[#384B55] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111518]/20">{copied ? <Check className="h-3.5 w-3.5" strokeWidth={2.2} /> : <Copy className="h-3.5 w-3.5" strokeWidth={1.8} />}</button>
                </div>
              </div>

              <div className="mx-auto mt-5 w-full max-w-[860px] rounded-[10px] border border-[#D8D8D8] bg-white p-3 shadow-[0_3px_12px_rgba(30,35,40,0.05)] sm:mt-6 sm:p-4">
                <div className="flex min-h-[72px] items-start gap-2 px-1.5 sm:min-h-[86px] sm:px-2">
                  <span className="min-w-0 flex-1 text-[13px] leading-5 text-[#52616A] sm:text-[14px]">{singlePrompt}</span>
                  <span className="mt-auto flex h-8 shrink-0 items-center gap-1 rounded-full bg-[#EAF6EF] px-3.5 text-[12px] font-semibold text-[#2D7B59]">Sent <Check className="h-3.5 w-3.5" strokeWidth={2.2} /></span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-3 border-t border-[#EEEEEE] px-1.5 pt-2 text-[#52616A]" aria-label="Prompt sources and files">
                  <span className="inline-flex h-7 items-center gap-1.5 px-1 text-[11px] font-semibold"><AtSign className="h-3.5 w-3.5 text-[#526AB1]" strokeWidth={2} />Data Sources <ChevronDown className="h-3 w-3 text-[#7A929D]" strokeWidth={2} /></span>
                  <span className="inline-flex h-7 items-center gap-1.5 rounded-[3px] bg-[#F1F3F4] px-2 text-[11px] font-semibold text-[#52616A]"><Paperclip className="h-3.5 w-3.5 text-[#526AB1]" strokeWidth={2} />Files</span>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[#F2F2F2] px-1.5 pt-1.5" aria-label="Prompt document references">
                  {documentReferences.map(({ name, source, icon }) => <span key={name} className="inline-flex items-center gap-1 text-[10px] text-[#667780]"><img src={icon} alt={source} className="h-4 w-4 object-contain" /><span>{name}</span></span>)}
                </div>
              </div>

              <div className="mx-auto mt-4 flex w-full max-w-[860px] items-center gap-2 border-t border-[#F0F0F0] pt-3 text-[10px] text-[#81919A]"><ChevronRight className="h-3.5 w-3.5 text-[#635BFF]" strokeWidth={2} />One prompt sent · explanation grounded in the recorded financial work</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default PersonalRecoverySupportSection;
