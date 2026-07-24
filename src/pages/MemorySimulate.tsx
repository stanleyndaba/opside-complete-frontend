import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, AlertCircle, CheckCircle2, Info } from 'lucide-react';

const MemorySimulate: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const feedRef = useRef<HTMLDivElement | null>(null);

  const learningNodes = [
    { 
      title: "POD Accepted",
      status: "success", 
      detail: "Proof of Delivery format verified for JHB warehouse.",
      icon: CheckCircle2,
      color: "text-[#2F8A62]"
    },
    { 
      title: "Invoice Accepted", 
      status: "success", 
      detail: "Manufacturer header & VAT number validated.",
      icon: CheckCircle2,
      color: "text-[#2F8A62]"
    },
    {
      title: "BOL Accepted",
      status: "success",
      detail: "Bill of Lading matched to shipment reference and carrier handoff.",
      icon: CheckCircle2,
      color: "text-[#2F8A62]"
    },
    {
      title: "Shipment ID Bound",
      status: "success",
      detail: "Inbound shipment ID linked to receiving event and case record.",
      icon: CheckCircle2,
      color: "text-[#2F8A62]"
    },
    {
      title: "ASIN/FNSKU Mapped",
      status: "success",
      detail: "Catalog identifiers reconciled against disputed unit movement.",
      icon: CheckCircle2,
      color: "text-[#2F8A62]"
    },
    { 
      title: "Quantity Variance", 
      status: "warning", 
      detail: "Explanation required for 3-unit discrepancy.",
      icon: Info,
      color: "text-[#9A6B1F]"
    },
    {
      title: "Cost Basis Accepted",
      status: "success",
      detail: "Unit cost supported by supplier invoice and SKU-level records.",
      icon: CheckCircle2,
      color: "text-[#2F8A62]"
    },
    {
      title: "Deadline Captured",
      status: "success",
      detail: "Filing window stored against the case before submission review.",
      icon: CheckCircle2,
      color: "text-[#2F8A62]"
    },
    {
      title: "Case Thread Indexed",
      status: "success",
      detail: "Amazon response history attached to the active recovery record.",
      icon: CheckCircle2,
      color: "text-[#2F8A62]"
    },
    { 
      title: "Underpayment Detected", 
      status: "alert", 
      detail: "Amazon reimbursed R840 instead of R1,247.",
      icon: AlertCircle,
      color: "text-[#66737F]"
    },
    {
      title: "Settlement Line Matched",
      status: "success",
      detail: "Approved reimbursement linked to the seller balance payout line.",
      icon: CheckCircle2,
      color: "text-[#2F8A62]"
    },
    { 
      title: "Follow-up Successful", 
      status: "success", 
      detail: "Agent 11 successfully appealed the underpayment.",
      icon: CheckCircle2,
      color: "text-[#2F8A62]"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev < learningNodes.length ? prev + 1 : prev));
    }, 950);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!feedRef.current) return;

    feedRef.current.scrollTo({
      top: feedRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [activeStep]);

  return (
    <main className="flex h-[100dvh] items-center justify-center overflow-hidden bg-[#FAFAF7] p-2 font-sans text-[#182026] selection:bg-[#0B74DE]/16 sm:p-3">
      <section className="flex h-[calc(100dvh-88px)] max-h-[460px] w-full max-w-3xl flex-col overflow-hidden border border-[#CFE0EA] bg-white">
        
        {/* Header: Outcome Intelligence */}
        <div className="flex shrink-0 items-center justify-between border-b border-[#DCE8EE] bg-white px-4 py-3">
          <div className="flex items-center gap-3">
            <div>
              <h2
                className="text-[17px] font-semibold leading-tight tracking-[-0.035em] text-[#182026]"
                style={{ fontFamily: 'Georgia, Merriweather, serif' }}
              >
                Operational Memory
              </h2>
              <p className="mt-1 font-mono text-[10px] font-medium uppercase tracking-tight text-[#66737F]">Case outcome recorded: Inbound shortage</p>
            </div>
          </div>
          <div className="flex items-center gap-2 border border-[#DCE8EE] bg-[#F8FAFC] px-3 py-1.5">
            <div className="h-2 w-2 rounded-full bg-[#3AAA78] animate-pulse" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-tight text-[#66737F]">Outcome recorded</span>
          </div>
        </div>

        <div className="grid shrink-0 grid-cols-2 border-b border-[#DCE8EE] bg-white text-[11px] leading-5 text-[#4D5B66] sm:grid-cols-4">
          <div className="border-r border-[#DCE8EE] px-4 py-2">
            <p className="font-mono text-[9px] font-medium uppercase tracking-tight text-[#8A99A4]">Evidence accepted</p>
            <p className="mt-1 text-[#182026]">Invoice, BOL, quantity explanation</p>
          </div>
          <div className="border-r border-[#DCE8EE] px-4 py-2">
            <p className="font-mono text-[9px] font-medium uppercase tracking-tight text-[#8A99A4]">Insufficient alone</p>
            <p className="mt-1 text-[#182026]">POD without quantity context</p>
          </div>
          <div className="border-r border-[#DCE8EE] px-4 py-2">
            <p className="font-mono text-[9px] font-medium uppercase tracking-tight text-[#8A99A4]">Approved</p>
            <p className="mt-1 font-mono text-[#182026]">R1,247</p>
          </div>
          <div className="px-4 py-2">
            <p className="font-mono text-[9px] font-medium uppercase tracking-tight text-[#8A99A4]">Additional recovery</p>
            <p className="mt-1 font-mono text-[#182026]">R407</p>
          </div>
        </div>

        {/* Learning Feed */}
        <div ref={feedRef} className="min-h-0 flex-1 overflow-y-auto bg-[#FAFAF7] p-4 custom-scrollbar">
          <div className="mb-2 text-[12px] font-medium text-[#4D5B66]">
            This case taught Margin:
          </div>

          <div className="space-y-2">
            <AnimatePresence>
              {learningNodes.slice(0, activeStep).map((node, index) => (
                <motion.div
                  key={node.title}
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  className="flex items-start gap-3 border border-[#DCE8EE] bg-white px-3 py-2 transition-colors hover:bg-[#F8FAFC]"
                >
                  <div className={`mt-0.5 ${node.color}`}>
                    <node.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-[12px] font-semibold text-[#182026]">{node.title}</h3>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-[#66737F]">{node.detail}</p>
                  </div>
                  <div className="font-mono text-[10px] text-[#8A99A4]">
                    {String(index + 1).padStart(2, '0')}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Future case lesson */}
          <AnimatePresence>
            {activeStep === learningNodes.length && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 border border-[#DCE8EE] bg-white p-3"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <h4 className="mb-1 font-mono text-[10px] font-medium uppercase tracking-tight text-[#0B74DE]">Lesson applied to future cases</h4>
                    <p className="text-xs leading-relaxed text-[#4D5B66]">
                      Require a quantity explanation before filing similar inbound-shortage claims.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer: Recovery intelligence */}
        <div className="flex shrink-0 items-start justify-between gap-4 border-t border-[#DCE8EE] bg-white px-4 py-3">
          <div className="max-w-xl">
            <span className="font-mono text-[10px] font-medium uppercase tracking-tight text-[#0B74DE]">Recovery intelligence updated</span>
            <p className="mt-1 text-[11px] leading-5 text-[#66737F]">
              Margin keeps each seller's records private while learning from anonymized outcome patterns such as evidence type, claim category, Amazon response, approval path, and payout result.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 text-[#66737F]">
            <Database className="h-4 w-4" />
            <span className="font-mono text-[10px] font-medium uppercase tracking-tight">Outcome intelligence</span>
          </div>
        </div>

      </section>
    </main>
  );
};

export default MemorySimulate;
