import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Database, History, Zap, CheckCircle2, XCircle, Info, ShieldCheck } from 'lucide-react';

const MemorySimulate: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);

  const learningNodes = [
    { 
      title: "POD Accepted", 
      status: "success", 
      detail: "Proof of Delivery format verified for JHB warehouse.",
      icon: CheckCircle2,
      color: "text-green-500"
    },
    { 
      title: "Invoice Accepted", 
      status: "success", 
      detail: "Manufacturer header & VAT number validated.",
      icon: CheckCircle2,
      color: "text-green-500"
    },
    { 
      title: "Quantity Variance", 
      status: "warning", 
      detail: "Explanation required for 3-unit discrepancy.",
      icon: Info,
      color: "text-amber-500"
    },
    { 
      title: "Underpayment Detected", 
      status: "alert", 
      detail: "Amazon reimbursed R840 instead of R1,247.",
      icon: Zap,
      color: "text-blue-500"
    },
    { 
      title: "Follow-up Successful", 
      status: "success", 
      detail: "Agent 11 successfully appealed the underpayment.",
      icon: CheckCircle2,
      color: "text-green-500"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev < learningNodes.length ? prev + 1 : prev));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-3xl bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden">
        
        {/* Header: Neural Audit */}
        <div className="p-8 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
              <Brain className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Operational Memory</h2>
              <p className="text-xs text-slate-500 font-mono uppercase tracking-tight">Neural_Audit_Log // Case_9928</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-800 px-4 py-2 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tight">Learning Active</span>
          </div>
        </div>

        {/* Learning Feed */}
        <div className="p-8 space-y-6">
          <div className="text-sm text-slate-400 font-medium mb-4">
            This case taught Margin:
          </div>

          <div className="space-y-4">
            <AnimatePresence>
              {learningNodes.slice(0, activeStep).map((node, index) => (
                <motion.div
                  key={node.title}
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  className="flex items-start gap-4 bg-slate-800/50 border border-slate-700/50 p-4 rounded-2xl hover:bg-slate-800 transition-colors"
                >
                  <div className={`mt-1 ${node.color}`}>
                    <node.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-white">{node.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">{node.detail}</p>
                  </div>
                  <div className="text-[10px] font-mono text-slate-600">
                    {`0${index + 1}`}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Future Optimization: The "Unfair Advantage" */}
        <AnimatePresence>
          {activeStep === learningNodes.length && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-8 bg-blue-500/5 border-t border-slate-800"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center border border-blue-500/30">
                  <ShieldCheck className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-blue-400 uppercase tracking-tight mb-2">Future Optimization</h4>
                  <p className="text-sm text-slate-300 leading-relaxed italic">
                    "Future similar claims should require **Quantity Explanation** before filing to ensure 100% recovery rate."
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer: Infrastructure Stats */}
        <div className="p-6 bg-slate-950/50 flex justify-between items-center border-t border-slate-800">
          <div className="flex gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-600 uppercase font-bold">Data Points</span>
              <span className="text-sm text-slate-300 font-mono">1,248</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-600 uppercase font-bold">Neural Sync</span>
              <span className="text-sm text-slate-300 font-mono">99.9%</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-500">
            <Database className="w-4 h-4" />
            <span className="text-[10px] font-mono uppercase tracking-tight">Global_Memory_Bank</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MemorySimulate;
