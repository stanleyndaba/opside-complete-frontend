import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, AlertCircle, CheckCircle2, Info } from 'lucide-react';

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
      icon: AlertCircle,
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
    <div className="min-h-screen bg-white flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-3xl bg-white rounded-[4px] border border-gray-100 shadow-xl overflow-hidden">
        
        {/* Header: Neural Audit */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 tracking-tight">Operational Memory</h2>
              <p className="text-xs text-gray-500 font-mono uppercase tracking-tight">Neural Audit Log: Case 99288777</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-full border border-gray-100">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tight">Learning Active</span>
          </div>
        </div>

        {/* Learning Feed */}
        <div className="p-4 space-y-4">
          <div className="text-sm text-gray-500 font-medium mb-2">
            This case taught Margin:
          </div>

          <div className="space-y-3">
            <AnimatePresence>
              {learningNodes.slice(0, activeStep).map((node, index) => (
                <motion.div
                  key={node.title}
                  initial={{ opacity: 0, x: -20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  className="flex items-start gap-4 bg-gray-50 border border-gray-100 p-3 rounded-[4px] hover:bg-gray-100/50 transition-colors"
                >
                  <div className={`mt-1 ${node.color}`}>
                    <node.icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-900">{node.title}</h3>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">{node.detail}</p>
                  </div>
                  <div className="text-[10px] font-mono text-gray-400">
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
              className="p-4 bg-gray-50/50 border-t border-gray-100"
            >
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-tight mb-2">Long-term performance tuning</h4>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    "Effective immediately, a Quantity Explanation is mandatory for all future claims of this type prior to filing to ensure complete reimbursement."
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Footer: Infrastructure Stats */}
        <div className="p-3 bg-white flex justify-between items-center border-t border-gray-100">
          <div className="flex gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 uppercase font-bold">Data Points</span>
              <span className="text-sm text-gray-600 font-mono">1,248</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-400 uppercase font-bold">Neural Sync</span>
              <span className="text-sm text-gray-600 font-mono">99.9%</span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-gray-500">
            <Database className="w-4 h-4" />
            <span className="text-[10px] font-mono uppercase tracking-tight">Global Memory</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default MemorySimulate;
